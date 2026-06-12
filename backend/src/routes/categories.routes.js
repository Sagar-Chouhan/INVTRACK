import express from 'express'
import { body, validationResult } from 'express-validator'
import { Category } from '../models/Category.js'
import { authRequired, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authRequired, async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean()
    res.json(categories)
  } catch (err) {
    next(err)
  }
})

router.post(
  '/',
  authRequired,
  requireRole('admin'),
  [body('name').notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
      const { name } = req.body
      const existing = await Category.findOne({ name })
      if (existing) return res.status(400).json({ message: 'Category exists' })
      const category = await Category.create({ name })
      res.status(201).json(category)
    } catch (err) {
      next(err)
    }
  },
)

export default router
