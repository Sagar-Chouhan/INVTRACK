import { useState, useEffect } from 'react'
import { auditAPI, categoriesAPI } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  History as HistoryIcon,
  Search,
  Filter,
  CheckCircle,
  Download,
  RefreshCw,
  ChevronDown,
  Calendar,
  Package,
  X,
  Eye,
  Loader2,
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

export default function History() {
  const { user } = useAuth()
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [dateFilter, setDateFilter] = useState('all')
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)


  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load categories
      const categoriesData = await categoriesAPI.getAll()
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])

      // Load audit history
      const auditData = await auditAPI.getHistory()
      console.log('Audit history response:', auditData)
      
      const verifiedAudits = Array.isArray(auditData) 
        ? auditData.map(a => ({
            ...a,
            // Map nested issue_id.stock_id to direct stock_id for easier access
            stock_id: a.issue_id?.stock_id,
            issued_qty: a.issue_id?.issued_qty,
            item_name: a.issue_id?.stock_id?.product_name,
            created_at: a.verification_date,
            photo_display_url: withPhotoToken(a.photo_url),
          }))
        : []
      
      console.log('Processed audits:', verifiedAudits)
      
      // Sort by date (newest first)
      verifiedAudits.sort((a, b) => new Date(b.verified_at || b.created_at) - new Date(a.verified_at || a.created_at))
      
      setAudits(verifiedAudits)
      
      if (verifiedAudits.length === 0) {
        toast.info('No verified audits yet')
      }
    } catch (error) {
      console.error('Full error loading history:', error)
      console.error('Error response:', error.response?.data)
      toast.error(`Failed to load history: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadData()
    toast.success('History refreshed')
  }

  const handleExport = () => {
    try {
      const headers = ['Date', 'Product', 'Category', 'Issued Qty', 'Used Qty', 'Returned Good', 'Returned Faulty', 'Notes', 'Status']
      const rows = filteredAudits.map((audit) => [
        new Date(audit.verified_at || audit.created_at).toLocaleDateString(),
        audit.stock_id?.product_name || 'N/A',
        audit.stock_id?.category_id?.name || 'N/A',
        audit.issued_qty || 0,
        audit.used_qty || 0,
        audit.returned_good || 0,
        audit.returned_faulty || 0,
        audit.fault_reason || 'No notes',
        audit.status,
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-history-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('History exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export history')
    }
  }

  const filteredAudits = audits.filter((audit) => {
    const matchesSearch =
      (audit.stock_id?.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (audit.stock_id?.category_id?.name || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !selectedCategory || audit.stock_id?.category_id?._id === selectedCategory

    let matchesDate = true
    if (dateFilter !== 'all') {
      const auditDate = new Date(audit.verified_at || audit.created_at)
      const now = new Date()

      if (dateFilter === 'today') {
        matchesDate = auditDate.toDateString() === now.toDateString()
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesDate = auditDate >= weekAgo
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchesDate = auditDate >= monthAgo
      }
    }

    return matchesSearch && matchesCategory && matchesDate
  })


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading audit history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <HistoryIcon className="h-8 w-8 text-blue-400" />
            Audit History
          </h1>
          <p className="text-slate-400 mt-1">
            Total verified audits: <span className="text-white font-semibold">{filteredAudits.length}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={filteredAudits.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product or category..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-8 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-8 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Audit Records */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredAudits.length > 0 ? (
            filteredAudits.map((audit, index) => (
              <motion.div
                key={audit._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-700">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">
                        {audit.stock_id?.product_name || audit.item_name || 'Stock Item'}
                      </h3>
                      <p className="text-sm text-slate-400">
                        Category: <span className="text-slate-300">{audit.stock_id?.category_id?.name || 'Uncategorized'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-medium">
                      ✓ Verified
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(audit.verified_at || audit.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {/* Quantity Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 p-4 bg-slate-800/30 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Issued Qty</p>
                    <p className="text-2xl font-bold text-white">{audit.issued_qty || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Used Qty</p>
                    <p className="text-2xl font-bold text-blue-400">{audit.used_qty || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Returned Good</p>
                    <p className="text-2xl font-bold text-green-400">{audit.returned_good || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Returned Faulty</p>
                    <p className="text-2xl font-bold text-red-400">{audit.returned_faulty || 0}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-800/20 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Stock Unit</p>
                    <p className="text-white font-medium">{audit.stock_id?.unit || 'pcs'}</p>
                  </div>
                  <div className="bg-slate-800/20 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Audited By</p>
                    <p className="text-white font-medium">{user?.full_name || 'System'}</p>
                  </div>
                  <div className="bg-slate-800/20 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Verification Date</p>
                    <p className="text-white font-medium">
                      {new Date(audit.verified_at || audit.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Fault Reason / Notes */}
                {audit.fault_reason && (
                  <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1 font-medium">Notes / Fault Reason</p>
                    <p className="text-white text-sm">{audit.fault_reason}</p>
                  </div>
                )}

                {/* Photo */}
                {audit.photo_url && (
                  <div className="flex items-end justify-between pt-4 border-t border-slate-700">
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 mb-2">Verification Photo</p>
                      <div className="flex items-center gap-2">
                        <img
                          src={audit.photo_display_url || audit.photo_url}
                          alt="Audit verification"
                          className="h-20 w-20 rounded-lg object-cover border border-slate-700"
                        />
                        <div className="text-sm text-slate-400">
                          📸 Photo attached
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPhoto(audit.photo_display_url || audit.photo_url)
                        setShowPhotoModal(true)
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      View Full
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-16 text-slate-400">
              <HistoryIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No audit records found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Photo Modal */}
      <AnimatePresence>
        {showPhotoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPhotoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative bg-slate-900 rounded-xl overflow-hidden max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPhotoModal(false)}
                className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg z-10 transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
              <img
                src={selectedPhoto}
                alt="Full verification photo"
                className="w-full h-auto"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
