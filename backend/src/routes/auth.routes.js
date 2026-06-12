import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { User } from '../models/User.js'
import { JWT_SECRET } from '../config.js'
import { authRequired, requireRole } from '../middleware/auth.js'
import { sendOTPEmail, generateOTP } from '../utils/emailService.js'

const router = express.Router()

const loginValidator = [
  body('email').isString().trim().notEmpty(),
  body('password').isString().isLength({ min: 4 }),
]

// Public signup for normal users and auditors (data saved in MongoDB)
router.post(
  '/signup',
  [
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('mobile').notEmpty().withMessage('Mobile number is required'),
    body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
    body('role').optional().isIn(['user', 'auditor']),
  ],
  async (req, res, next) => {
    try {
      console.log('Signup request received:', { ...req.body, password: '[HIDDEN]' })
      
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array())
        return res.status(400).json({ errors: errors.array() })
      }

      const { full_name, mobile, email, password } = req.body
      const role = req.body.role && ['user', 'auditor'].includes(req.body.role)
        ? req.body.role
        : 'user'

      console.log('Checking if user exists with email:', email)
      const exists = await User.findOne({ email: email.toLowerCase() })
      if (exists) {
        console.log('User already exists')
        return res.status(400).json({ message: 'Email already registered' })
      }

      console.log('Hashing password...')
      const password_hash = await bcrypt.hash(password, 10)
      
      console.log('Creating user in database...')
      const user = await User.create({ full_name, mobile, email, password_hash, role })
      console.log('User created successfully:', user._id)

      res.status(201).json({
        id: user._id,
        full_name: user.full_name,
        mobile: user.mobile,
        role: user.role,
      })
    } catch (err) {
      console.error('Signup error:', err)
      next(err)
    }
  },
)

router.post(
  '/register',
  authRequired,
  requireRole('admin'),
  [
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('mobile').notEmpty().withMessage('Mobile number is required'),
    body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
    body('role').isIn(['admin', 'auditor', 'user']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

      const { full_name, mobile, email, password, role } = req.body

      const exists = await User.findOne({ email: email.toLowerCase() })
      if (exists) return res.status(400).json({ message: 'Email already registered' })

      const password_hash = await bcrypt.hash(password, 10)
      const user = await User.create({ full_name, mobile, email, password_hash, role })
      res.status(201).json({
        id: user._id,
        full_name: user.full_name,
        mobile: user.mobile,
        role: user.role,
      })
    } catch (err) {
      next(err)
    }
  },
)

router.post('/login', loginValidator, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { email, password } = req.body
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    const token = jwt.sign({ sub: user._id.toString(), role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    })

    res.json({
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        assigned_categories: user.assigned_categories,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/me', authRequired, (req, res) => {
  const u = req.user
  res.json({
    id: u._id,
    full_name: u.full_name,
    mobile: u.mobile,
    role: u.role,
    assigned_categories: u.assigned_categories,
  })
})

// Simple logout endpoint – client should delete token
router.post('/logout', authRequired, (_req, res) => {
  res.json({ message: 'Logged out' })
})

// Forgot Password - Send OTP to email
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email } = req.body
      const user = await User.findOne({ email: email.toLowerCase() })
      
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ 
          message: 'If an account exists with this email, you will receive an OTP shortly.' 
        })
      }

      if (!user.email) {
        return res.status(400).json({ 
          message: 'No email registered for this account. Please contact admin.' 
        })
      }

      // Generate OTP and set expiry (10 minutes)
      const otp = generateOTP()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      user.reset_otp = await bcrypt.hash(otp, 10)
      user.reset_otp_expires = expiresAt
      await user.save()

      // Send OTP email
      try {
        await sendOTPEmail(user.email, otp, user.full_name)
        console.log(`Password reset OTP sent to ${user.email}`)
        
        res.json({ 
          message: 'OTP has been sent to your email. Please check your inbox.',
          email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Masked email
        })
      } catch (emailError) {
        // Rollback OTP if email fails
        user.reset_otp = undefined
        user.reset_otp_expires = undefined
        await user.save()
        throw emailError
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      next(err)
    }
  }
)

// Verify OTP only (separate step before password reset)
router.post(
  '/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isString().isLength({ min: 6, max: 6 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, otp } = req.body
      const user = await User.findOne({ email: email.toLowerCase() })

      if (!user || !user.reset_otp || !user.reset_otp_expires) {
        return res.status(400).json({ message: 'Invalid or expired OTP' })
      }

      // Check if OTP is expired
      if (new Date() > user.reset_otp_expires) {
        user.reset_otp = undefined
        user.reset_otp_expires = undefined
        await user.save()
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' })
      }

      // Verify OTP
      const otpValid = await bcrypt.compare(otp, user.reset_otp)
      if (!otpValid) {
        return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' })
      }

      console.log(`OTP verified for ${user.email}`)

      res.json({ 
        message: 'OTP verified successfully. You can now set your new password.',
        verified: true
      })
    } catch (err) {
      console.error('Verify OTP error:', err)
      next(err)
    }
  }
)

// Verify OTP and Reset Password
router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isString().isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 4 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, otp, newPassword } = req.body
      const user = await User.findOne({ email: email.toLowerCase() })

      if (!user || !user.reset_otp || !user.reset_otp_expires) {
        return res.status(400).json({ message: 'Invalid or expired OTP' })
      }

      // Check if OTP is expired
      if (new Date() > user.reset_otp_expires) {
        user.reset_otp = undefined
        user.reset_otp_expires = undefined
        await user.save()
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' })
      }

      // Verify OTP
      const otpValid = await bcrypt.compare(otp, user.reset_otp)
      if (!otpValid) {
        return res.status(400).json({ message: 'Invalid OTP' })
      }

      // Update password
      user.password_hash = await bcrypt.hash(newPassword, 10)
      user.reset_otp = undefined
      user.reset_otp_expires = undefined
      await user.save()

      console.log(`Password reset successful for ${user.email}`)

      res.json({ 
        message: 'Password reset successful. You can now login with your new password.' 
      })
    } catch (err) {
      console.error('Reset password error:', err)
      next(err)
    }
  }
)

export default router
