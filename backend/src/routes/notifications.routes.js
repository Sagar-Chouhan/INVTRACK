import express from 'express'
import { body, validationResult } from 'express-validator'
import { Notification } from '../models/Notification.js'
import { authRequired, requireRole } from '../middleware/auth.js'

const router = express.Router()

// GET /api/notifications - Get user notifications
router.get('/', authRequired, async (req, res, next) => {
  try {
    const filter = {}
    
    // Users see their own notifications, admins see all
    if (req.user.role !== 'admin') {
      filter.$or = [
        { user_id: req.user._id },
        { recipient_mobile: req.user.mobile },
        { recipient_email: req.user.email }
      ]
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .limit(50)

    res.json(notifications)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', authRequired, async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id)
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    notification.read = true
    await notification.save()

    res.json({ message: 'Notification marked as read', notification })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id)
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    await Notification.findByIdAndDelete(req.params.id)

    res.json({ message: 'Notification deleted' })
  } catch (err) {
    next(err)
  }
})

// POST /api/notifications/send - Send notification (Admin only)
router.post(
  '/send',
  authRequired,
  requireRole('admin'),
  [
    body('title').notEmpty().trim().withMessage('Title is required'),
    body('message').notEmpty().trim().withMessage('Message is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { title, message, user_id, type } = req.body

      const notification = await Notification.create({
        title,
        message,
        user_id: user_id || null,
        type: type || 'system',
        issued_by_name: req.user.full_name,
      })

      res.status(201).json({ 
        message: 'Notification sent successfully', 
        notification 
      })
    } catch (err) {
      next(err)
    }
  }
)

export default router
