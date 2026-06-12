import express from 'express'
import { body, validationResult } from 'express-validator'
import { User } from '../models/User.js'
import { authRequired, requireRole } from '../middleware/auth.js'

const router = express.Router()

// GET /api/users/list - Get all users for dropdown (accessible to all authenticated users)
router.get('/list', authRequired, async (_req, res, next) => {
  try {
    const users = await User.find()
      .select('full_name mobile email role')
      .sort({ full_name: 1 })
    res.json(users)
  } catch (err) {
    next(err)
  }
})

router.get('/', authRequired, requireRole('admin'), async (_req, res, next) => {
  try {
    const users = await User.find().select('-password_hash').lean()
      .populate('assigned_categories', 'name')
    res.json(users)
  } catch (err) {
    next(err)
  }
})

router.put(
  '/:id/role',
  authRequired,
  requireRole('admin'),
  [body('role').isIn(['admin', 'auditor', 'user'])],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role: req.body.role },
        { new: true },
      ).select('-password_hash')
      res.json(user)
    } catch (err) {
      next(err)
    }
  },
)

router.put(
  '/:id/categories',
  authRequired,
  requireRole('admin'),
  [body('assigned_categories').isArray()],
  async (req, res, next) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { assigned_categories: req.body.assigned_categories },
        { new: true },
      )
        .select('-password_hash')
        .populate('assigned_categories', 'name')
      res.json(user)
    } catch (err) {
      next(err)
    }
  },
)

router.put(
  '/:id',
  authRequired,
  requireRole('admin'),
  [
    body('full_name').optional().notEmpty(),
    body('mobile').optional().notEmpty(),
    body('email').optional().isEmail(),
    body('role').optional().isIn(['admin', 'auditor', 'user']),
    body('assigned_categories').optional().isArray(),
  ],
  async (req, res, next) => {
    try {
      console.log('=== UPDATE USER REQUEST ===')
      console.log('User ID:', req.params.id)
      console.log('Request Body:', JSON.stringify(req.body, null, 2))
      console.log('Assigned Categories:', req.body.assigned_categories)
      
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array())
        return res.status(400).json({ errors: errors.array() })
      }

      const updates = {}
      if (req.body.full_name) updates.full_name = req.body.full_name
      if (req.body.mobile) updates.mobile = req.body.mobile
      if (req.body.email) updates.email = req.body.email
      if (req.body.role) updates.role = req.body.role
      if (req.body.assigned_categories !== undefined) {
        console.log('Setting assigned_categories to:', req.body.assigned_categories)
        updates.assigned_categories = req.body.assigned_categories
      }

      console.log('Updates object:', JSON.stringify(updates, null, 2))

      const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
        .select('-password_hash')
        .populate('assigned_categories', 'name')
      
      if (!user) {
        console.log('User not found!')
        return res.status(404).json({ message: 'User not found' })
      }
      
      console.log('Updated user:', JSON.stringify(user, null, 2))
      console.log('=== END UPDATE ===\n')
      
      res.json(user)
    } catch (err) {
      console.error('Error updating user:', err)
      next(err)
    }
  },
)

router.delete('/:id', authRequired, requireRole('admin'), async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

export default router
