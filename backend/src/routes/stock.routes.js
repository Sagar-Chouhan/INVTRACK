import express from 'express'
import { body, validationResult } from 'express-validator'
import readXlsxFile from 'read-excel-file/node'
import { Category } from '../models/Category.js'
import { StockInventory } from '../models/StockInventory.js'
import { authRequired, requireRole } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = express.Router()

// GET /api/stock
router.get('/', authRequired, async (req, res, next) => {
  try {
    const filter = {}
    if (req.user.role === 'auditor' && req.user.assigned_categories?.length) {
      filter.category_id = { $in: req.user.assigned_categories }
    }
    const stock = await StockInventory.find(filter).populate('category_id', 'name').lean()
    
    res.json(stock)
  } catch (err) {
    next(err)
  }
})

// GET /api/stock/:id
router.get('/:_id', authRequired, async (req, res, next) => {
  try {
    const { _id } = req.params
    const item = await StockInventory.findById(_id).populate('category_id', 'name')
    if (!item) return res.status(404).json({ message: 'Stock item not found' })
    res.json(item)
  } catch (err) {
    next(err)
  }
})

// POST /api/stock
router.post(
  '/',
  authRequired,
  requireRole('admin'),
  [
    body('product_name').notEmpty(),
    body('category_id').notEmpty(),
    body('quantity').isNumeric(),
    body('unit').isIn(['Pcs', 'Kg', 'Ltr', 'Mtr', 'Box', 'Set']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array())
        return res.status(400).json({ errors: errors.array() })
      }
      
      console.log('Creating stock item with data:', req.body)
      const item = await StockInventory.create(req.body)
      console.log('Stock item created successfully:', item._id)
      res.status(201).json(item)
    } catch (err) {
      console.error('Error in POST /api/stock:', err)
      next(err)
    }
  },
)

// PUT /api/stock/:id
router.put('/:_id', authRequired, requireRole('admin'), async (req, res, next) => {
  try {
    const { _id } = req.params
    const updated = await StockInventory.findByIdAndUpdate(_id, req.body, { new: true })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/stock/:id
router.delete('/:_id', authRequired, requireRole('admin'), async (req, res, next) => {
  try {
    const { _id } = req.params
    await StockInventory.findByIdAndDelete(_id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// POST /api/stock/bulk-import
router.post(
  '/bulk-import',
  authRequired,
  requireRole('admin'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'File is required' })
      if (!req.file.originalname.toLowerCase().endsWith('.xlsx')) {
        return res.status(400).json({ message: 'Only .xlsx files allowed' })
      }
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ message: 'File too large (max 5MB)' })
      }

      const rows = await readXlsxFile(req.file.buffer)

      if (!rows || rows.length === 0) {
        return res.status(400).json({ message: 'Empty Excel file' })
      }

      const [headerRow, ...dataRows] = rows
      if (!headerRow || headerRow.length === 0) {
        return res.status(400).json({ message: 'Missing header row in Excel file' })
      }

      const headers = headerRow.map((h) => (h ?? '').toString().trim())

      const preview = []
      const errors = []

      for (let i = 0; i < dataRows.length; i++) {
        const rowArray = dataRows[i]
        const row = {}

        headers.forEach((header, index) => {
          if (!header) return
          row[header] = rowArray[index] ?? ''
        })

        if (!row || Object.values(row).every((v) => v === '' || v == null)) continue

        const record = {
          product_name: row['Product Name'] || row['product_name'] || row['PRODUCT NAME'],
          category: row['Category'] || row['category'] || row['CATEGORY'],
          quantity: row['Quantity'] || row['quantity'] || row['QUANTITY'],
          unit: row['Unit'] || row['unit'] || row['UNIT'],
          location: row['Location'] || row['location'] || '',
          source_type: row['Source Type'] || row['source_type'] || 'purchase',
        }

        const rowErrors = []
        if (!record.product_name) rowErrors.push('Product Name required')
        if (!record.category) rowErrors.push('Category required')
        if (!record.quantity || isNaN(Number(record.quantity))) rowErrors.push('Quantity must be number')
        if (!record.unit) rowErrors.push('Unit required')

        if (rowErrors.length) {
          errors.push({ row: i + 2, errors: rowErrors })
        }

        preview.push(record)
      }

      if (errors.length) {
        return res.status(400).json({ preview, errors })
      }

      // auto-create categories and save stock
      const createdItems = []
      for (const rec of preview) {
        let category = await Category.findOne({ name: rec.category })
        if (!category) {
          category = await Category.create({ name: rec.category })
        }
        const item = await StockInventory.create({
          product_name: rec.product_name,
          category_id: category._id,
          quantity: Number(rec.quantity),
          unit: rec.unit,
          location: rec.location,
          source_type: rec.source_type || 'purchase',
        })
        createdItems.push(item)
      }

      res.status(201).json({ items: createdItems })
    } catch (err) {
      next(err)
    }
  },
)

export default router
