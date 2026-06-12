import express from 'express'
import { body, validationResult } from 'express-validator'
import { Incharge } from '../models/Incharge.js'
import { authRequired } from '../middleware/auth.js'

const router = express.Router()

// GET /api/incharges - Get all incharges
router.get('/', authRequired, async (req, res, next) => {
  try {
    const incharges = await Incharge.find().sort({ full_name: 1 }).lean()
      .populate('added_by', 'full_name')
    res.json(incharges)
  } catch (err) {
    next(err)
  }
})

// POST /api/incharges - Create new incharge
router.post(
  '/',
  authRequired,
  [
    body('full_name').notEmpty().trim().withMessage('Full name is required'),
    body('mobile').notEmpty().trim().withMessage('Mobile number is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('department').optional().trim(),
    body('designation').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      // Check if incharge with same mobile already exists
      const existingIncharge = await Incharge.findOne({ mobile: req.body.mobile })
      if (existingIncharge) {
        return res.status(400).json({ message: 'Incharge with this mobile number already exists' })
      }

      const incharge = await Incharge.create({
        full_name: req.body.full_name,
        mobile: req.body.mobile,
        email: req.body.email || '',
        department: req.body.department || '',
        designation: req.body.designation || '',
        added_by: req.user._id,
      })

      res.status(201).json(incharge)
    } catch (err) {
      next(err)
    }
  }
)

// PUT /api/incharges/:id - Update incharge
router.put(
  '/:id',
  authRequired,
  [
    body('full_name').optional().notEmpty().trim(),
    body('mobile').optional().notEmpty().trim(),
    body('email').optional().isEmail(),
    body('department').optional().trim(),
    body('designation').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const updates = {}
      if (req.body.full_name) updates.full_name = req.body.full_name
      if (req.body.mobile) updates.mobile = req.body.mobile
      if (req.body.email !== undefined) updates.email = req.body.email
      if (req.body.department !== undefined) updates.department = req.body.department
      if (req.body.designation !== undefined) updates.designation = req.body.designation

      const incharge = await Incharge.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
      )

      if (!incharge) {
        return res.status(404).json({ message: 'Incharge not found' })
      }

      res.json(incharge)
    } catch (err) {
      next(err)
    }
  }
)

// DELETE /api/incharges/:id - Delete incharge
router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const incharge = await Incharge.findByIdAndDelete(req.params.id)
    if (!incharge) {
      return res.status(404).json({ message: 'Incharge not found' })
    }
    res.json({ message: 'Incharge deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
