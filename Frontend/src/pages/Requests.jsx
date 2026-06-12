import { useState, useEffect, useCallback } from 'react'
import { requestsAPI, stockAPI, categoriesAPI } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  X,
  ChevronDown,
  Loader2,
  Package,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Modal component defined outside to prevent re-renders
const Modal = ({ show, onClose, title, children }) => (
  <AnimatePresence>
    {show && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
)

export default function Requests() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [requests, setRequests] = useState([])
  const [stock, setStock] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    unit: 'Piece',
    quantity: 1,
    reason: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [requestsData, stockData, categoriesData] = await Promise.all([
        requestsAPI.getAll(),
        stockAPI.getAll(),
        categoriesAPI.getAll(),
      ])
      setRequests(requestsData.requests || requestsData || [])
      setStock(stockData.items || stockData || [])
      setCategories(categoriesData.categories || categoriesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRequest = async (e) => {
    e.preventDefault()
    if (submitting) return // Prevent multiple submissions
    
    try {
      setSubmitting(true)
      await requestsAPI.create({
        productName: formData.productName,
        category: formData.category,
        unit: formData.unit,
        quantity: parseInt(formData.quantity),
      })
      toast.success('Request submitted successfully')
      setShowAddModal(false)
      resetForm()
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  // Optimized input handler to prevent focus issues
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleApprove = async (id) => {
    try {
      await requestsAPI.approve(id)
      toast.success('Request approved')
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve request')
    }
  }

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    try {
      await requestsAPI.reject(id, reason)
      toast.success('Request rejected')
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request')
    }
  }

  const resetForm = () => {
    setFormData({
      productName: '',
      category: '',
      unit: 'Piece',
      quantity: 1,
      reason: '',
    })
  }

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = 
      req.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestedBy?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.category?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !selectedStatus || req.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
      approved: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {isAdmin ? 'Stock Requests' : 'My Requests'}
          </h1>
          <p className="text-slate-400">
            {isAdmin ? 'Manage stock requests from users' : 'Track your stock requests'}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all"
          >
            <Plus className="h-5 w-5" />
            New Request
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requests..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-8 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[150px]"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <motion.div
            key={request._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Package className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{request.productName}</h3>
                  <p className="text-sm text-slate-400">
                    Quantity: {request.quantity} {request.unit} • Category: {request.category}
                  </p>
                  <p className="text-sm text-slate-400">
                    By: {request.requestedBy?.full_name || 'User'}
                  </p>
                  {request.adminResponse && (
                    <p className="text-sm text-slate-500 mt-1">Admin: {request.adminResponse}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {getStatusBadge(request.status)}
                
                {isAdmin && request.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(request._id)}
                      className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request._id)}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No requests found</p>
        </div>
      )}

      {/* Add Request Modal */}
      <Modal show={showAddModal} onClose={() => { if (!submitting) { setShowAddModal(false); resetForm(); } }} title="New Product Request">
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Product Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              list="stock-items"
              value={formData.productName}
              onChange={(e) => handleInputChange('productName', e.target.value)}
              required
              disabled={submitting}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter product name or select existing"
            />
            <datalist id="stock-items">
              {stock.map((item) => (
                <option key={item._id} value={item.product_name || item.name} />
              ))}
            </datalist>
            <p className="text-xs text-slate-500 mt-1">Type a new product name or select from existing products</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Category <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              list="categories-list"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              required
              disabled={submitting}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter or select category"
            />
            <datalist id="categories-list">
              {categories.map((cat) => (
                <option key={cat._id} value={cat.category_name || cat.name} />
              ))}
            </datalist>
            <p className="text-xs text-slate-500 mt-1">Select existing category or type a new one</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Unit <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                required
                disabled={submitting}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="Piece">Piece</option>
                <option value="Kg">Kg</option>
                <option value="Litre">Litre</option>
                <option value="Box">Box</option>
                <option value="Bag">Bag</option>
                <option value="Meter">Meter</option>
                <option value="Gram">Gram</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Quantity <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                required
                min="1"
                disabled={submitting}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter quantity"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
