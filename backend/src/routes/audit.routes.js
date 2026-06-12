import express from 'express'
import { body, validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { JWT_SECRET } from '../config.js'
import { upload } from '../middleware/upload.js'
import { authRequired, requireRole } from '../middleware/auth.js'
import { IssuedStock } from '../models/IssuedStock.js'
import { AuditVerification } from '../models/AuditVerification.js'
import { AuditPhoto } from '../models/AuditPhoto.js'
import { StockInventory } from '../models/StockInventory.js'

const router = express.Router()

const normalizeId = (value) => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value._id) return value._id.toString()
  return value.toString()
}

const getPhotoAccessToken = (req) => {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  if (typeof req.query?.token === 'string') {
    return req.query.token
  }
  return null
}

const extractPhotoIdFromUrl = (url) => {
  if (typeof url !== 'string') return null
  const match = url.match(/\/api\/audit\/photo\/([a-fA-F0-9]{24})/)
  return match?.[1] || null
}

// GET /api/audit/assigned
router.get('/assigned', authRequired, requireRole('auditor'), async (req, res, next) => {
  try {
    const issues = await IssuedStock.find({ status: 'pending-audit' })
      .populate({ path: 'stock_id', populate: { path: 'category_id' } })
      .populate('issued_by', 'full_name')
      .lean()

    const assignedIds = (req.user.assigned_categories || []).map(normalizeId).filter(Boolean)
    const filtered = issues.filter((issue) => {
      const categoryId = normalizeId(issue.stock_id?.category_id)
      return !!categoryId && assignedIds.includes(categoryId)
    })

    const now = new Date()
    res.json(
      filtered.map((issue) => {
        const diffMs = issue.verification_deadline ? issue.verification_deadline.getTime() - now.getTime() : 0
        const daysRemaining = issue.verification_deadline ? Math.ceil(diffMs / (24 * 60 * 60 * 1000)) : 0
        const warning = daysRemaining > 0 && daysRemaining <= 5
        return { ...issue, daysRemaining, warning }
      }),
    )
  } catch (err) {
    next(err)
  }
})

// POST /api/audit/upload-photo
router.post(
  '/upload-photo',
  authRequired,
  requireRole('auditor'),
  upload.single('photo'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Photo is required' })

      const photo = await AuditPhoto.create({
        uploaded_by: req.user._id,
        image_data: req.file.buffer,
        mime_type: req.file.mimetype,
        file_size: req.file.size,
      })

      const url = `${req.protocol}://${req.get('host')}/api/audit/photo/${photo._id}`
      res.status(201).json({ url, photo_id: photo._id, expires_at: photo.expires_at })
    } catch (err) {
      next(err)
    }
  },
)

// GET /api/audit/photo/:photoId
router.get('/photo/:photoId', async (req, res, next) => {
  try {
    const token = getPhotoAccessToken(req)
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    let payload
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    if (!payload?.sub) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { photoId } = req.params
    const photo = await AuditPhoto.findById(photoId).select('image_data mime_type')

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found or expired' })
    }

    res.set('Content-Type', photo.mime_type)
    res.set('Cache-Control', 'private, max-age=0, no-cache')
    return res.send(photo.image_data)
  } catch (err) {
    next(err)
  }
})

// POST /api/audit/verify/:issueId
router.post(
  '/verify/:issueId',
  authRequired,
  requireRole('auditor'),
  [
    body('photo_url').notEmpty(),
    body('used_qty').isNumeric(),
    body('returned_good').isNumeric(),
    body('returned_faulty').isNumeric(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

      const { issueId } = req.params
      const { photo_url, photo_id, used_qty, returned_good, returned_faulty, fault_reason } = req.body

      const issue = await IssuedStock.findById(issueId).populate({
        path: 'stock_id',
        populate: { path: 'category_id' },
      })
      if (!issue) return res.status(404).json({ message: 'Issue not found' })

      // ensure auditor assigned to this category
      const assignedIds = (req.user.assigned_categories || []).map(normalizeId).filter(Boolean)
      const issueCategoryId = normalizeId(issue.stock_id?.category_id)
      if (!issueCategoryId || !assignedIds.includes(issueCategoryId)) {
        return res.status(403).json({ message: 'Not allowed for this category' })
      }

      const sum = Number(used_qty) + Number(returned_good) + Number(returned_faulty)
      if (sum !== issue.issued_qty) {
        return res.status(400).json({ message: 'Breakdown must equal issued quantity' })
      }

      // stock update logic: add returned_good back
      const inventoryRecord = await StockInventory.findById(issue.stock_id._id)
      inventoryRecord.quantity += Number(returned_good)
      await inventoryRecord.save()

      issue.status = 'verified'
      await issue.save()

      const verifiedStock = issue.stock_id
      const category = verifiedStock?.category_id

      const rawPhotoId = photo_id || extractPhotoIdFromUrl(photo_url)
      const validPhotoId =
        rawPhotoId && mongoose.Types.ObjectId.isValid(rawPhotoId)
          ? new mongoose.Types.ObjectId(rawPhotoId)
          : null

      const linkedPhoto = validPhotoId
        ? await AuditPhoto.findById(validPhotoId).select('_id expires_at')
        : null

      const verification = await AuditVerification.create({
        issue_id: issue._id,
        stock_id: verifiedStock?._id,
        category_id: category?._id || category,
        verified_by: req.user._id,
        product_name: verifiedStock?.product_name || 'Unknown Product',
        category_name: category?.name || 'Uncategorized',
        unit: verifiedStock?.unit,
        issued_qty: issue.issued_qty,
        recipient_name: issue.recipient_name,
        purpose: issue.purpose,
        photo_url,
        photo_id: linkedPhoto?._id,
        photo_expires_at: linkedPhoto?.expires_at,
        used_qty,
        returned_good,
        returned_faulty,
        fault_reason,
        status: 'verified',
        verified_at: new Date(),
      })

      res.status(201).json(verification)
    } catch (err) {
      next(err)
    }
  },
)

router.get('/logs', authRequired, requireRole('admin', 'auditor'), async (req, res, next) => {
  try {
    // Build query - get verified audits
    let query = {}
    
    // If user is auditor, only show their verifications
    if (req.user?.role === 'auditor') {
      query.verified_by = req.user._id
    }
    
    const logs = await AuditVerification.find(query)
      .populate({
        path: 'issue_id',
        populate: {
          path: 'stock_id',
          populate: { path: 'category_id' }
        }
      })
      .populate('verified_by', 'full_name')
      .sort({ verified_at: -1, verification_date: -1 })
      .lean()
    
    // Transform and filter out incomplete records
    const validLogs = logs.filter(log => log.issue_id && log.issue_id.stock_id)
    
    res.json(validLogs)
  } catch (err) {
    console.error('Error fetching audit logs:', err)
    next(err)
  }
})

export default router
