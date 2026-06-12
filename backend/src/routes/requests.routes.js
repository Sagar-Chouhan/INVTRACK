import express from 'express'
import { body, validationResult } from 'express-validator'
import { ProductRequest } from '../models/ProductRequest.js'
import { Category } from '../models/Category.js'
import { StockInventory } from '../models/StockInventory.js'
import { authRequired } from '../middleware/auth.js'

const router = express.Router()

// POST /api/requests - Create a new product request
router.post(
  '/',
  authRequired,
  [
    body('productName').notEmpty().trim().withMessage('Product name is required'),
    body('unit').notEmpty().withMessage('Unit is required'),
    body('category').notEmpty().trim().withMessage('Category is required'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { productName, unit, category, quantity } = req.body

      // Don't create product automatically - wait for admin approval

      const newRequest = await ProductRequest.create({
        productName,
        unit,
        category,
        quantity: quantity || 1,
        requestedBy: req.user._id,
      })

      const populatedRequest = await ProductRequest.findById(newRequest._id)
        .populate('requestedBy', 'full_name email mobile')

      res.status(201).json({
        message: 'Product request submitted successfully',
        request: populatedRequest,
      })
    } catch (err) {
      next(err)
    }
  }
)

// GET /api/requests - Get all product requests (filtered by role)
router.get('/', authRequired, async (req, res, next) => {
  try {
    const filter = {}
    
    // Regular users can only see their own requests
    if (req.user.role === 'user') {
      filter.requestedBy = req.user._id
    }
    // Admin and auditors can see all requests

    const requests = await ProductRequest.find(filter)
      .populate('requestedBy', 'full_name email mobile')
      .populate('respondedBy', 'full_name')
      .lean()
      .sort({ createdAt: -1 })

    res.json(requests)
  } catch (err) {
    next(err)
  }
})

// GET /api/requests/:id - Get a single request by ID
router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const request = await ProductRequest.findById(req.params.id)
      .populate('requestedBy', 'full_name email mobile')
      .populate('respondedBy', 'full_name')

    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    // Users can only view their own requests
    if (req.user.role === 'user' && request.requestedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json(request)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/requests/:id - Update request status (Admin only)
router.patch(
  '/:id',
  authRequired,
  [
    body('status').optional().isIn(['pending', 'approved', 'rejected', 'completed']),
    body('adminResponse').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      // Only admin can update requests
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can update requests' })
      }

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const request = await ProductRequest.findById(req.params.id)
      if (!request) {
        return res.status(404).json({ message: 'Request not found' })
      }

      const { status, adminResponse } = req.body

      // If status is being changed to 'approved', ensure category and product exist in database
      if (status === 'approved') {
        console.log('Approving request:', request.productName, request.category, request.unit, request.quantity)
        
        // Check if category exists (using correct field name: name)
        let category = await Category.findOne({ 
          name: { $regex: new RegExp(`^${request.category}$`, 'i') } 
        })

        // Create category if it doesn't exist
        if (!category) {
          console.log('Creating new category:', request.category)
          category = new Category({
            name: request.category,
          })
          await category.save()
          console.log('Category created with ID:', category._id)
        } else {
          console.log('Found existing category:', category._id)
        }

        // Check if product exists
        let product = await StockInventory.findOne({ 
          product_name: { $regex: new RegExp(`^${request.productName}$`, 'i') } 
        })

        // Map unit from ProductRequest to StockInventory format
        const unitMap = {
          'Piece': 'Pcs',
          'Kg': 'Kg',
          'Litre': 'Ltr',
          'Box': 'Box',
          'Bag': 'Box',
          'Meter': 'Mtr',
          'Gram': 'Kg'
        }

        const mappedUnit = unitMap[request.unit] || 'Pcs'
        console.log('Mapped unit from', request.unit, 'to', mappedUnit)

        // Create or update product
        if (!product) {
          console.log('Creating new product in inventory...')
          product = new StockInventory({
            product_name: request.productName,
            category_id: category._id,
            quantity: request.quantity || 0,
            unit: mappedUnit,
            location: 'Warehouse',
            source_type: 'purchase'
          })
          await product.save()
          console.log('Product created successfully with quantity:', request.quantity)
        } else {
          // Update quantity if product already exists
          console.log('Product already exists, updating quantity from', product.quantity, 'to', product.quantity + request.quantity)
          product.quantity += request.quantity
          await product.save()
          console.log('Product quantity updated successfully')
        }
      }

      if (status) request.status = status
      if (adminResponse) request.adminResponse = adminResponse
      
      request.respondedBy = req.user._id
      request.respondedAt = new Date()

      await request.save()

      const updatedRequest = await ProductRequest.findById(request._id)
        .populate('requestedBy', 'full_name email mobile')
        .populate('respondedBy', 'full_name')

      res.json({
        message: 'Request updated successfully',
        request: updatedRequest,
      })
    } catch (err) {
      console.error('Error updating request:', err)
      res.status(500).json({ 
        message: 'Failed to process request', 
        error: err.message 
      })
    }
  }
)

// DELETE /api/requests/:id - Delete a request (User can delete their own, Admin can delete any)
router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const request = await ProductRequest.findById(req.params.id)
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    // Users can only delete their own pending requests
    if (req.user.role === 'user') {
      if (request.requestedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' })
      }
      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Can only delete pending requests' })
      }
    }

    await ProductRequest.findByIdAndDelete(req.params.id)
    res.json({ message: 'Request deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router
