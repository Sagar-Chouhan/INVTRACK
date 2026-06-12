import { useState, useEffect } from 'react'
import { auditAPI, categoriesAPI } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ClipboardCheck,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  Loader2,
  Package,
  History,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://invtrack-ljey.onrender.com/api'
const BACKEND_BASE = API_BASE.replace(/\/api\/?$/, '')

const toAbsolutePhotoUrl = (url) => {
  if (!url || typeof url !== 'string') return url
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${BACKEND_BASE}${url}`
  return `${BACKEND_BASE}/${url}`
}

const withPhotoToken = (url) => {
  const absoluteUrl = toAbsolutePhotoUrl(url)
  if (!absoluteUrl) return absoluteUrl
  if (!absoluteUrl.includes('/api/audit/photo/')) return absoluteUrl
  if (absoluteUrl.includes('token=')) return absoluteUrl

  const token = localStorage.getItem('token')
  if (!token) return absoluteUrl
  const separator = absoluteUrl.includes('?') ? '&' : '?'
  return `${absoluteUrl}${separator}token=${encodeURIComponent(token)}`
}

export default function Audit() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('pending')
  const [pendingAudits, setPendingAudits] = useState([])
  const [auditHistory, setAuditHistory] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifyingItem, setVerifyingItem] = useState(null)
  const [verifyData, setVerifyData] = useState({
    actual_qty: '',
    notes: '',
    status: 'verified',
    photo_file: null,
  })

  useEffect(() => {
    loadData()
  }, [])

  const normalizeId = (value) => {
    if (!value) return null
    if (typeof value === 'string') return value
    if (value._id) return value._id.toString()
    return value.toString()
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [pendingData, historyData, categoriesData] = await Promise.all([
        auditAPI.getPending().catch(() => ({ audits: [] })),
        auditAPI.getHistory().catch(() => ({ audits: [] })),
        categoriesAPI.getAll(),
      ])
      
      // Get user's assigned categories
      const assignedCategoryIds = (user?.assigned_categories || []).map(normalizeId).filter(Boolean)
      
      // Filter pending audits by assigned categories
      let allPending = pendingData.audits || pendingData || []
      if (assignedCategoryIds.length > 0) {
        allPending = allPending.filter((audit) => {
          const auditCategoryId = normalizeId(audit.stock_id?.category_id)
          return assignedCategoryIds.includes(auditCategoryId)
        })
      }
      
      setPendingAudits(allPending)
      const allHistory = historyData.audits || historyData || []
      const historyWithPhotoAccess = allHistory.map((audit) => ({
        ...audit,
        photo_display_url: withPhotoToken(audit.photo_url),
      }))
      setAuditHistory(historyWithPhotoAccess)
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    try {
      const issuedQty = parseFloat(verifyingItem.issued_qty || 0)
      const actualQty = parseFloat(verifyData.actual_qty) || issuedQty
      
      if (!verifyData.photo_file) {
        toast.error('Please upload a photo')
        return
      }
      
      // Upload photo
      const formData = new FormData()
      formData.append('photo', verifyData.photo_file)
      const uploadResponse = await auditAPI.uploadPhoto(formData)
      const photoUrl = uploadResponse.url
      const photoId = uploadResponse.photo_id
      
      if (!photoUrl) {
        toast.error('Photo upload failed')
        return
      }
      
      // Calculate quantity breakdown - simple split
      // Used: same as actual counted
      // Good return: 0 (simple assumption)
      // Faulty: 0
      // This ensures the sum equals issued_qty
      const usedQty = actualQty
      const returnedGood = 0
      const returnedFaulty = 0
      
      // Verify that breakdown equals issued qty
      const sum = usedQty + returnedGood + returnedFaulty
      if (sum !== issuedQty) {
        toast.error(`Breakdown must equal issued quantity (${issuedQty}). Current sum: ${sum}`)
        return
      }
      
      await auditAPI.verify(verifyingItem._id, {
        photo_url: photoUrl,
        photo_id: photoId,
        used_qty: usedQty,
        returned_good: returnedGood,
        returned_faulty: returnedFaulty,
        fault_reason: verifyData.notes || ''
      })
      
      toast.success('Verification submitted successfully')
      setShowVerifyModal(false)
      resetVerifyForm()
      loadData()
    } catch (error) {
      console.error('Verification error:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to submit verification')
    }
  }

  const openVerifyModal = (item) => {
    setVerifyingItem(item)
    setVerifyData({
      actual_qty: (item.issued_qty || item.expected_qty || 0).toString(),
      notes: '',
      status: 'verified',
      photo_file: null,
    })
    setShowVerifyModal(true)
  }

  const resetVerifyForm = () => {
    setVerifyData({
      actual_qty: '',
      notes: '',
      status: 'verified',
      photo_file: null,
    })
    setVerifyingItem(null)
  }

  const filteredPending = pendingAudits.filter((audit) => {
    const matchesSearch =
      audit.stock_id?.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.purpose?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      !selectedCategory ||
      (audit.stock_id?.category_id?._id || audit.stock_id?.category_id)?.toString() === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredHistory = auditHistory.filter((audit) => {
    const matchesSearch =
      audit.issue_id?.stock_id?.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.item_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
      verified: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      flagged: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Stock Audit</h1>
        <p className="text-slate-400">Verify and audit stock items</p>
      </div>

      {/* Assigned Categories Info (for Auditors) */}
      {user?.role === 'auditor' && user?.assigned_categories && user.assigned_categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Package className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-400 mb-1">Your Assigned Categories</h3>
              <div className="flex flex-wrap gap-2">
                {user.assigned_categories.map((category) => (
                  <span
                    key={category._id || category}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium"
                  >
                    <CheckCircle className="h-3 w-3" />
                    {category.name || category}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                You can only audit items from these categories
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'pending'
              ? 'text-blue-400 border-blue-400'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Pending ({filteredPending.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'history'
              ? 'text-blue-400 border-blue-400'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History ({filteredHistory.length})
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {activeTab === 'pending' && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-8 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[180px]"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {filteredPending.map((audit) => (
            <motion.div
              key={audit._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-500/20 rounded-lg">
                    <Package className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{audit.stock_id?.product_name || audit.item_name || 'Stock Item'}</h3>
                    <p className="text-sm text-slate-400">
                      Category: {audit.stock_id?.category_id?.name || 'Uncategorized'}
                    </p>
                    <p className="text-sm text-slate-400">
                      Expected Qty: <span className="text-white font-medium">{audit.issued_qty || audit.expected_qty || 0}</span>
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => openVerifyModal(audit)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all"
                >
                  Verify
                </button>
              </div>
            </motion.div>
          ))}

          {filteredPending.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50 text-green-400" />
              <p className="text-lg">No pending audits</p>
              <p className="text-sm">All items have been verified</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((audit) => (
              <motion.div
                key={audit._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-700">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{audit.stock_id?.product_name || audit.item_name || 'Stock Item'}</h3>
                      <p className="text-sm text-slate-400">
                        Category: <span className="text-slate-300">{audit.stock_id?.category_id?.name || 'Uncategorized'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(audit.status)}
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(audit.verified_at || audit.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Quantity Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 p-4 bg-slate-800/30 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Issued Qty</p>
                    <p className="text-lg font-semibold text-white">{audit.issued_qty || audit.expected_qty || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Used Qty</p>
                    <p className="text-lg font-semibold text-blue-400">{audit.used_qty || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Returned Good</p>
                    <p className="text-lg font-semibold text-green-400">{audit.returned_good || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Returned Faulty</p>
                    <p className="text-lg font-semibold text-red-400">{audit.returned_faulty || 0}</p>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Stock Unit</p>
                    <p className="text-white">{audit.stock_id?.unit || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Audited By</p>
                    <p className="text-white">{audit.audited_by || 'System'}</p>
                  </div>
                </div>

                {/* Fault Reason */}
                {audit.fault_reason && (
                  <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Fault Reason / Notes</p>
                    <p className="text-white text-sm">{audit.fault_reason}</p>
                  </div>
                )}

                {/* Photo */}
                {audit.photo_url && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Verification Photo</p>
                    <img 
                      src={audit.photo_display_url || audit.photo_url} 
                      alt="Audit verification" 
                      className="w-full max-w-md h-auto rounded-lg border border-slate-700 cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() => window.open(audit.photo_display_url || audit.photo_url, '_blank')}
                    />
                    <p className="text-xs text-slate-500 mt-1">Click to view full image</p>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No audit history</p>
            </div>
          )}
        </div>
      )}

      {/* Verify Modal */}
      <Modal show={showVerifyModal} onClose={() => { setShowVerifyModal(false); resetVerifyForm(); }} title="Verify Stock">
        {verifyingItem && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
              <p className="text-slate-400 text-sm">Item</p>
              <p className="text-white font-medium">{verifyingItem.item_name || verifyingItem.stock?.name || verifyingItem.stock_id?.product_name}</p>
              <p className="text-slate-400 text-sm mt-2">Expected Quantity (Issued)</p>
              <p className="text-white font-medium">{verifyingItem.issued_qty || verifyingItem.expected_qty || 0}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Actual Quantity</label>
              <input
                type="number"
                value={verifyData.actual_qty}
                onChange={(e) => setVerifyData({ ...verifyData, actual_qty: e.target.value })}
                required
                min="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
              <select
                value={verifyData.status}
                onChange={(e) => setVerifyData({ ...verifyData, status: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="verified">Verified - Correct</option>
                <option value="flagged">Flagged - Discrepancy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
              <textarea
                value={verifyData.notes}
                onChange={(e) => setVerifyData({ ...verifyData, notes: e.target.value })}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional notes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                📸 Upload Photo <span className="text-red-400">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setVerifyData({ ...verifyData, photo_file: e.target.files?.[0] || null })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 file:bg-blue-600 file:border-0 file:rounded file:px-3 file:py-1 file:text-white file:cursor-pointer"
              />
              {verifyData.photo_file && (
                <div className="text-xs mt-1">
                  <p className="text-slate-400">📄 {verifyData.photo_file.name}</p>
                  <p className="text-slate-400">📦 {(verifyData.photo_file.size / 1024).toFixed(1)} KB</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium py-2.5 rounded-lg transition-all"
            >
              Submit Verification
            </button>
          </form>
        )}
      </Modal>
    </div>
  )
}
