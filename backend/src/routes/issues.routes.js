import express from 'express'
import { body, validationResult } from 'express-validator'
import { IssuedStock } from '../models/IssuedStock.js'
import { StockInventory } from '../models/StockInventory.js'
import { Notification } from '../models/Notification.js'
import { Incharge } from '../models/Incharge.js'
import { authRequired, requireRole } from '../middleware/auth.js'
import { sendOTPEmail, sendOTPSMS } from '../utils/notifications.js'

const router = express.Router()

const normalizeId = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value._id) return value._id.toString()
  return value.toString()
}

// POST /api/issues - issue stock
router.post(
  '/',
  authRequired,
  [
    body('productId').optional().notEmpty(),
    body('stock_id').optional().notEmpty(),
    body('recipientName').optional().notEmpty(),
    body('recipient_name').optional().notEmpty(),
    body('issuedBy').optional().notEmpty(),
    body('mobileNumber').optional().notEmpty(),
    body('quantity').optional().isNumeric(),
    body('issued_qty').optional().isNumeric(),
    body('purpose').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

      // Support both frontend field names and backend field names
      const stock_id = req.body.stock_id || req.body.productId
      const recipient_name = req.body.recipient_name || req.body.recipientName
      const issued_qty = req.body.issued_qty || req.body.quantity
      const recipient_mobile = req.body.recipient_mobile || req.body.mobileNumber
      const { purpose, issuedBy, mobileNumber } = req.body

      if (!stock_id || !recipient_name || !issued_qty) {
        return res.status(400).json({ 
          message: 'Missing required fields: productId/stock_id, recipientName/recipient_name, quantity/issued_qty' 
        })
      }

      const stock = await StockInventory.findById(stock_id).populate('category_id')
      if (!stock) return res.status(404).json({ message: 'Stock not found' })

      const qty = Number(issued_qty)
      if (qty > stock.quantity) {
        return res.status(400).json({ message: 'Issued quantity exceeds available stock' })
      }

      stock.quantity -= qty
      await stock.save()

      // Handle incharge - create new or use existing
      let incharge_id = req.body.incharge_id || null
      
      if (req.body.isNewIncharge && recipient_name && recipient_mobile) {
        try {
          const newIncharge = await Incharge.create({
            full_name: recipient_name,
            mobile: recipient_mobile,
            email: req.body.recipient_email || '',
            department: req.body.department || '',
            designation: req.body.designation || '',
            added_by: req.user._id,
          })
          incharge_id = newIncharge._id
        } catch (inchargeErr) {
          // Do not block issue flow if incharge save fails.
          console.error('Incharge creation failed, continuing issue without incharge_id:', inchargeErr.message)
        }
      }

      const issue = await IssuedStock.create({
        stock_id,
        recipient_name,
        recipient_mobile: recipient_mobile || mobileNumber,
        incharge_id,
        issued_qty: qty,
        issued_by: req.user._id,
        purpose,
        verification_deadline: req.body.verification_deadline || undefined,
      })

      // Send OTP/Notification to recipient
      if (recipient_mobile || mobileNumber) {
        try {
          const mobile = recipient_mobile || mobileNumber
          const recipientEmail = req.body.recipient_email || req.body.email
          const otp = Math.floor(100000 + Math.random() * 900000).toString()
          
          // Save notification to database
          const notification = await Notification.create({
            recipient_name,
            recipient_mobile: mobile,
            recipient_email: recipientEmail,
            product_name: stock.product_name,
            quantity: qty,
            unit: stock.unit,
            issued_by_name: req.user.full_name,
            purpose: purpose || 'General Use',
            otp,
            issue_id: issue._id,
          })
          
          // Send via Email if email provided
          if (recipientEmail) {
            const emailResult = await sendOTPEmail({
              to: recipientEmail,
              recipientName: recipient_name,
              productName: stock.product_name,
              quantity: qty,
              unit: stock.unit,
              issuedBy: req.user.full_name,
              otp,
              purpose: purpose || 'General Use'
            })
            
            if (emailResult.success) {
              notification.sent_via = 'email'
              await notification.save()
              console.log('Email notification sent successfully')
            }
          }
          
          // Send via SMS
          const smsResult = await sendOTPSMS({
            mobile,
            recipientName: recipient_name,
            productName: stock.product_name,
            quantity: qty,
            unit: stock.unit,
            otp
          })
          
          if (smsResult.success) {
            if (notification.sent_via === 'email') {
              notification.sent_via = 'both'
            } else {
              notification.sent_via = 'sms'
            }
            await notification.save()
          }
          
          // Update issue record
          issue.otp_sent = true
          issue.notification_sent_at = new Date()
          await issue.save()
          
          console.log('\n📱 STOCK ISSUED NOTIFICATION 📱')
          console.log('================================')
          console.log(`To: ${recipient_name} (${mobile})`)
          console.log(`Email: ${recipientEmail || 'Not provided'}`)
          console.log(`Product: ${stock.product_name}`)
          console.log(`Quantity: ${qty} ${stock.unit}`)
          console.log(`Issued By: ${req.user.full_name}`)
          console.log(`Purpose: ${purpose || 'General Use'}`)
          console.log(`OTP: ${otp}`)
          console.log(`Sent via: ${notification.sent_via}`)
          console.log('================================\n')
        } catch (notifError) {
          console.error('Failed to send notification:', notifError)
          // Don't fail the issue creation if notification fails
        }
      }

      res.status(201).json({
        message: 'Stock issued successfully. Notification sent to recipient.',
        issue,
      })
    } catch (err) {
      next(err)
    }
  },
)

// GET /api/issues
router.get('/', authRequired, async (req, res, next) => {
  try {
    const filter = {}
    if (req.user.role === 'user') {
      filter.issued_by = req.user._id
    }
    
    let issues = await IssuedStock.find(filter)
      .populate({ path: 'stock_id', populate: { path: 'category_id' } })
      .populate('issued_by', 'full_name mobile email')
      .populate('incharge_id', 'full_name mobile email department designation')

    // Filter for auditors
    if (req.user.role === 'auditor') {
      const assigned = req.user.assigned_categories || []
      const assignedIds = assigned.map(normalizeId).filter(Boolean)
      issues = issues.filter(issue => 
        issue.stock_id && 
        issue.stock_id.category_id && 
        assignedIds.includes(normalizeId(issue.stock_id.category_id))
      )
    }

    res.json(issues)
  } catch (err) {
    next(err)
  }
})

// GET /api/issues/pending-audit
router.get('/pending-audit', authRequired, async (req, res, next) => {
  try {
    const now = new Date()
    const issues = await IssuedStock.find({ status: 'pending-audit' })
      .populate({ path: 'stock_id', populate: { path: 'category_id' } })
      .populate('issued_by', 'full_name mobile email')
      .populate('incharge_id', 'full_name mobile email department designation')

    let filtered = issues;

    // auditors see only assigned categories
    if (req.user.role === 'auditor') {
      const assigned = req.user.assigned_categories || []
      const assignedIds = assigned.map(normalizeId).filter(Boolean)
      filtered = issues.filter(issue => 
        issue.stock_id?.category_id && 
        assignedIds.includes(normalizeId(issue.stock_id.category_id))
      )
    }

    const withRemaining = filtered.map((issue) => {
      const deadline = issue.verification_deadline || new Date((issue.created_at || new Date()).getTime() + 30 * 24 * 60 * 60 * 1000)
      const diffMs = deadline.getTime() - now.getTime()
      const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
      return { ...issue.toObject(), verification_deadline: deadline, daysRemaining }
    })

    res.json(withRemaining)
  } catch (err) {
    next(err)
  }
})

// GET /api/issues/pending-summary-by-category
router.get('/pending-summary-by-category', authRequired, requireRole('admin'), async (req, res, next) => {
  try {
    const issues = await IssuedStock.find({ status: 'pending-audit' })
      .populate({ path: 'stock_id', populate: { path: 'category_id' } })

    const categoryMap = new Map()

    for (const issue of issues) {
      const category = issue.stock_id?.category_id
      const categoryId = category?._id?.toString()
      const categoryName = category?.name || 'Uncategorized'
      if (!categoryId) continue

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          pendingCount: 0,
          nearestDeadline: issue.verification_deadline,
        })
      }

      const entry = categoryMap.get(categoryId)
      entry.pendingCount += 1
      if (issue.verification_deadline < entry.nearestDeadline) {
        entry.nearestDeadline = issue.verification_deadline
      }
    }

    const categories = Array.from(categoryMap.values()).sort((a, b) => b.pendingCount - a.pendingCount)
    res.json({
      totalPending: issues.length,
      categories,
    })
  } catch (err) {
    next(err)
  }
})

export default router
