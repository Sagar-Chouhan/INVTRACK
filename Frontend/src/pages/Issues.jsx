import { useState, useEffect } from 'react'
import { stockAPI } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Package,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  X,
  ChevronDown,
  Loader2,
  User,
  Send,
  Calendar,
  Phone,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// Modal Component - moved outside to prevent re-creation on every render
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
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
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

// Status Badge Component
const getStatusBadge = (status) => {
  const badges = {
    'pending-audit': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock, label: 'Pending Audit' },
    verified: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle, label: 'Verified' },
    returned: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: XCircle, label: 'Returned' },
  }
  const badge = badges[status] || badges['pending-audit']
  const Icon = badge.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${badge.color}`}>
      <Icon className="h-3 w-3" />
      {badge.label}
    </span>
  )
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const listItemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
}

export default function Issues() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [issues, setIssues] = useState([])
  const [stock, setStock] = useState([])
  const [users, setUsers] = useState([])
  const [incharges, setIncharges] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [inchargeMode, setInchargeMode] = useState('existing') // 'existing' or 'new'
  const [formData, setFormData] = useState({
    stock_id: '',
    incharge_id: '',
    recipient_name: '',
    recipient_mobile: '',
    recipient_email: '',
    department: '',
    designation: '',
    issued_qty: '',
    purpose: '',
    issueDuration: 'permanent',
    returnDate: '',
    collectorType: 'incharge',
    referenceName: '',
    referenceMobile: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [issuesRes, stockData, usersRes, inchargesRes] = await Promise.all([
        api.get('/issues').catch(() => ({ data: [] })),
        stockAPI.getAll(),
        api.get('/users/list').catch(() => ({ data: [] })),
        api.get('/incharges').catch(() => ({ data: [] })),
      ])
      setIssues(issuesRes.data?.issues || issuesRes.data || [])
      setStock(stockData.items || stockData || [])
      setUsers(usersRes.data || [])
      const loadedIncharges = inchargesRes.data || []
      setIncharges(loadedIncharges)
      if (loadedIncharges.length === 0) {
        setInchargeMode('new')
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIssue = async (e) => {
    e.preventDefault()
    
    // Manual validation to prevent silent HTML5 validation failures
    if (!formData.stock_id) return toast.error('Please select a product')
    if (!formData.issued_qty || formData.issued_qty <= 0) return toast.error('Please enter a valid quantity')
    
    if (inchargeMode === 'existing' && !formData.incharge_id) {
      return toast.error('Please select an existing incharge')
    }
    
    if (inchargeMode === 'new') {
      if (!formData.recipient_name) return toast.error('Please enter the recipient name')
      if (!formData.recipient_mobile || !/^[0-9]{10}$/.test(formData.recipient_mobile)) {
        return toast.error('Please enter a valid 10-digit mobile number')
      }
    }
    
    if (formData.issueDuration === 'temporary' && !formData.returnDate) {
      return toast.error('Please select a return date')
    }

    if (formData.collectorType === 'reference') {
      if (!formData.referenceName) return toast.error('Please enter reference person name')
      if (!formData.referenceMobile || !/^[0-9]{10}$/.test(formData.referenceMobile)) {
        return toast.error('Please enter a valid 10-digit reference mobile number')
      }
    }

    try {
      setSubmitting(true)
      const issueData = {
        stock_id: formData.stock_id,
        issued_qty: parseFloat(formData.issued_qty),
        purpose: formData.purpose,
      }
      
      if (formData.issueDuration === 'temporary' && formData.returnDate) {
        issueData.verification_deadline = formData.returnDate
      }
      
      // Handle incharge - either existing or new
      if (inchargeMode === 'existing') {
        issueData.incharge_id = formData.incharge_id || undefined
        issueData.recipient_name = formData.recipient_name
        issueData.recipient_mobile = formData.recipient_mobile
        issueData.recipient_email = formData.recipient_email
      } else {
        // New incharge
        issueData.isNewIncharge = true
        issueData.recipient_name = formData.recipient_name
        issueData.recipient_mobile = formData.recipient_mobile
        issueData.recipient_email = formData.recipient_email
        issueData.department = formData.department
        issueData.designation = formData.designation
      }
      
      // Add reference person details if collector is not the incharge
      if (formData.collectorType === 'reference') {
        issueData.referenceName = formData.referenceName
        issueData.referenceMobile = formData.referenceMobile
      }
      
      await api.post('/issues', issueData)
      toast.success('Stock issued successfully! Notification sent to recipient.')
      setShowAddModal(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to issue stock')
    } finally {
      setSubmitting(false)
    }
  }

  // Prevent form submission on Enter key in input fields
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      e.preventDefault()
    }
  }

  const handleResolve = async (id) => {
    try {
      await api.patch(`/issues/${id}/resolve`)
      toast.success('Issue resolved')
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resolve issue')
    }
  }

  const resetForm = () => {
    setFormData({
      stock_id: '',
      incharge_id: '',
      recipient_name: '',
      recipient_mobile: '',
      recipient_email: '',
      department: '',
      designation: '',
      issued_qty: '',
      purpose: '',
      issueDuration: 'permanent',
      returnDate: '',
      collectorType: 'incharge',
      referenceName: '',
      referenceMobile: '',
    })
    setInchargeMode('existing')
  }

  // Handle incharge selection from dropdown
  const handleInchargeSelect = (e) => {
    const userId = e.target.value
    if (userId) {
      const selectedUser = users.find(u => u._id === userId)
      if (selectedUser) {
        setFormData({
          ...formData,
          incharge_id: userId,
          recipient_name: selectedUser.full_name,
          recipient_mobile: selectedUser.mobile,
          recipient_email: selectedUser.email || '',
        })
      }
    } else {
      setFormData({
        ...formData,
        incharge_id: '',
        recipient_name: '',
        recipient_mobile: '',
        recipient_email: '',
      })
    }
  }

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.stock_id?.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.purpose?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !selectedStatus || issue.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const issueStats = {
    total: issues.length,
    pending: issues.filter((item) => item.status === 'pending-audit').length,
    verified: issues.filter((item) => item.status === 'verified').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative space-y-6"
    >
      <div className="pointer-events-none absolute -top-10 -left-10 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-2 right-8 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
            Issue Stock
          </h1>
          <p className="text-slate-400">Issue products to team members with return tracking</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all"
        >
          <Plus className="h-5 w-5" />
          Issue Stock
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Total Issues</p>
          <p className="mt-1 text-2xl font-bold text-white">{issueStats.total}</p>
        </div>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <p className="text-xs text-yellow-300 uppercase tracking-wide">Pending Audit</p>
          <p className="mt-1 text-2xl font-bold text-yellow-300">{issueStats.pending}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs text-emerald-300 uppercase tracking-wide">Verified</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{issueStats.verified}</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="flex flex-col sm:flex-row gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issues..."
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
            <option value="pending-audit">Pending Audit</option>
            <option value="verified">Verified</option>
            <option value="returned">Returned</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
        </div>
      </motion.div>

      {/* Issues List */}
      <motion.div
        variants={listContainerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredIssues.map((issue) => (
            <motion.div
              key={issue._id}
              layout
              variants={listItemVariants}
              whileHover={{ y: -2, scale: 1.005 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 transition-colors hover:border-slate-700"
            >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Package className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white">{issue.stock_id?.product_name || 'Product'}</h3>
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                      {issue.stock_id?.category_id?.name || 'Category'}
                    </span>
                  </div>
                  
                  {/* Product Details */}
                  <div className="mt-2 p-2 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-300 font-medium mb-1">Product Details:</p>
                    <p className="text-sm text-slate-400">
                      Quantity Issued: <span className="text-white font-medium">{issue.issued_qty} {issue.stock_id?.unit || 'units'}</span>
                    </p>
                  </div>
                  
                  {/* Issued By (User who issued the stock) */}
                  <div className="mt-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-sm text-blue-300 font-medium mb-1">Issued By:</p>
                    <p className="text-sm text-slate-300">
                      {issue.issued_by?.full_name || 'User'}
                    </p>
                    {issue.issued_by?.mobile && (
                      <p className="text-sm text-slate-400">📱 {issue.issued_by.mobile}</p>
                    )}
                    {issue.issued_by?.email && (
                      <p className="text-sm text-slate-400">✉️ {issue.issued_by.email}</p>
                    )}
                  </div>
                  
                  {/* Incharge Details */}
                  <div className="mt-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm text-green-300 font-medium mb-1">Incharge (Recipient):</p>
                    <p className="text-sm text-slate-300">
                      {issue.incharge_id?.full_name || issue.recipient_name}
                      {issue.incharge_id?.designation && <span className="text-slate-500"> - {issue.incharge_id.designation}</span>}
                    </p>
                    <p className="text-sm text-slate-400">
                      📱 {issue.incharge_id?.mobile || issue.recipient_mobile}
                    </p>
                    {(issue.incharge_id?.email || issue.recipient_email) && (
                      <p className="text-sm text-slate-400">
                        ✉️ {issue.incharge_id?.email || issue.recipient_email}
                      </p>
                    )}
                    {issue.incharge_id?.department && (
                      <p className="text-sm text-slate-400">
                        🏢 {issue.incharge_id.department}
                      </p>
                    )}
                  </div>
                  
                  {issue.referenceName && (
                    <div className="mt-2 p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <p className="text-sm text-purple-300 font-medium mb-1">Collected By (Reference):</p>
                      <p className="text-sm text-slate-300">{issue.referenceName}</p>
                      <p className="text-sm text-slate-400">📱 {issue.referenceMobile}</p>
                    </div>
                  )}
                  
                  {issue.purpose && (
                    <p className="text-sm text-slate-500 mt-2">Purpose: {issue.purpose}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    Issued on: {new Date(issue.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {getStatusBadge(issue.status)}
              </div>
            </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredIssues.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 text-slate-400 rounded-xl border border-slate-800 bg-slate-900/35"
        >
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No stock issued yet</p>
          <p className="text-sm">Click "Issue Stock" to distribute products to recipients</p>
        </motion.div>
      )}

      {/* Add Issue Modal */}
      <Modal show={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Send className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-bold text-white">Issue Stock</h2>
          </div>
          <p className="text-slate-400 text-sm">Issue products to team members with return tracking</p>
        </div>
        <form onSubmit={handleCreateIssue} onKeyDown={handleKeyDown} className="space-y-5">
          {/* Product Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Package className="h-4 w-4" />
              Product Name <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.stock_id}
              onChange={(e) => setFormData({ ...formData, stock_id: e.target.value })}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a product...</option>
              {stock
                .filter((item) => item.quantity > 0)
                .map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.product_name || item.name} - {item.quantity} {item.unit} available
                  </option>
                ))}
            </select>
          </div>

          {/* Issued By Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <User className="h-4 w-4" />
                Issued By (Your Name)
              </label>
              <input
                type="text"
                value={user?.name || 'User'}
                disabled
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Phone className="h-4 w-4" />
                Your Mobile Number
              </label>
              <input
                type="text"
                value={user?.mobile || user?.phone || ''}
                disabled
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Incharge Selection Mode */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
              <User className="h-4 w-4" />
              Incharge Selection
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setInchargeMode('existing')
                  setFormData({ ...formData, incharge_id: '', recipient_name: '', recipient_mobile: '', recipient_email: '', department: '', designation: '' })
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  inchargeMode === 'existing'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    inchargeMode === 'existing' ? 'border-blue-500' : 'border-slate-600'
                  }`}>
                    {inchargeMode === 'existing' && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-white">Select Existing</div>
                    <div className="text-xs text-slate-400">Choose from saved list</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInchargeMode('new')
                  setFormData({ ...formData, incharge_id: '', recipient_name: '', recipient_mobile: '', recipient_email: '', department: '', designation: '' })
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  inchargeMode === 'new'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    inchargeMode === 'new' ? 'border-green-500' : 'border-slate-600'
                  }`}>
                    {inchargeMode === 'new' && (
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-white">Add New Incharge</div>
                    <div className="text-xs text-slate-400">Enter new details</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Existing Incharge Dropdown */}
          {inchargeMode === 'existing' && (
            <>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <User className="h-4 w-4" />
                  Select Incharge <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.incharge_id}
                  onChange={(e) => {
                    const selectedIncharge = incharges.find(i => i._id === e.target.value)
                    if (selectedIncharge) {
                      setFormData({
                        ...formData,
                        incharge_id: e.target.value,
                        recipient_name: selectedIncharge.full_name,
                        recipient_mobile: selectedIncharge.mobile,
                        recipient_email: selectedIncharge.email || '',
                        department: selectedIncharge.department || '',
                        designation: selectedIncharge.designation || '',
                      })
                    } else {
                      setFormData({
                        ...formData,
                        incharge_id: '',
                        recipient_name: '',
                        recipient_mobile: '',
                        recipient_email: '',
                        department: '',
                        designation: '',
                      })
                    }
                  }}
                  required={inchargeMode === 'existing'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an incharge from the list...</option>
                  {incharges.map((incharge) => (
                    <option key={incharge._id} value={incharge._id}>
                      {incharge.full_name} - {incharge.mobile} {incharge.designation ? `(${incharge.designation})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  {incharges.length === 0 ? 'No saved incharges. Switch to "Add New" to create one.' : 'Select from previously saved incharges'}
                </p>
              </div>

              {/* Display Selected Incharge Details */}
              {formData.incharge_id && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-3">Selected Incharge Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">Name:</span>
                      <p className="text-white font-medium">{formData.recipient_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Mobile:</span>
                      <p className="text-white font-medium">{formData.recipient_mobile}</p>
                    </div>
                    {formData.recipient_email && (
                      <div>
                        <span className="text-slate-400">Email:</span>
                        <p className="text-white font-medium">{formData.recipient_email}</p>
                      </div>
                    )}
                    {formData.department && (
                      <div>
                        <span className="text-slate-400">Department:</span>
                        <p className="text-white font-medium">{formData.department}</p>
                      </div>
                    )}
                    {formData.designation && (
                      <div>
                        <span className="text-slate-400">Designation:</span>
                        <p className="text-white font-medium">{formData.designation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* New Incharge Form */}
          {inchargeMode === 'new' && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-semibold text-green-400 mb-3">Enter New Incharge Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    required={inchargeMode === 'new'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter incharge full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Mobile Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.recipient_mobile}
                    onChange={(e) => setFormData({ ...formData, recipient_mobile: e.target.value })}
                    required={inchargeMode === 'new'}
                    pattern="[0-9]{10}"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter 10-digit mobile number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.recipient_email}
                    onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Department (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., IT, Sales, Operations"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Designation (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Manager, Supervisor"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400">This incharge will be saved for future use</p>
            </div>
          )}

          {/* Issue Duration */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
              <Calendar className="h-4 w-4" />
              Issue Duration
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, issueDuration: 'permanent', returnDate: '' })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.issueDuration === 'permanent'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-blue-400" />
                  <div>
                    <div className="font-medium text-white">Permanent</div>
                    <div className="text-xs text-slate-400">No return required</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, issueDuration: 'temporary' })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.issueDuration === 'temporary'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-slate-400" />
                  <div>
                    <div className="font-medium text-white">Time Period</div>
                    <div className="text-xs text-slate-400">Select return date</div>
                  </div>
                </div>
              </button>
            </div>
            {formData.issueDuration === 'temporary' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Return Date <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    min={new Date().toISOString().split('T')[0]}
                    required={formData.issueDuration === 'temporary'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    placeholder="Click to select return date"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Click on the field to open calendar</p>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Quantity to Issue {formData.stock_id && stock.find(s => s._id === formData.stock_id) && (
                <span className="text-blue-400 font-normal">
                  (in {stock.find(s => s._id === formData.stock_id)?.unit || 'units'})
                </span>
              )} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.issued_qty}
                onChange={(e) => setFormData({ ...formData, issued_qty: e.target.value })}
                required
                min="0.01"
                step="any"
                max={formData.stock_id ? stock.find(s => s._id === formData.stock_id)?.quantity : undefined}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 pr-20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quantity"
              />
              {formData.stock_id && stock.find(s => s._id === formData.stock_id) && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                  {stock.find(s => s._id === formData.stock_id)?.unit || 'units'}
                </span>
              )}
            </div>
            {formData.stock_id && stock.find(s => s._id === formData.stock_id) && (
              <p className="text-xs text-slate-400 mt-1">
                Available: {stock.find(s => s._id === formData.stock_id)?.quantity} {stock.find(s => s._id === formData.stock_id)?.unit}
              </p>
            )}
          </div>

          {/* Who is collecting */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
              <User className="h-4 w-4" />
              Who is collecting the item?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, collectorType: 'incharge', referenceName: '', referenceMobile: '' })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.collectorType === 'incharge'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    formData.collectorType === 'incharge' ? 'border-blue-500' : 'border-slate-600'
                  }`}>
                    {formData.collectorType === 'incharge' && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div className="font-medium text-white">Incharge Himself</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, collectorType: 'reference' })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  formData.collectorType === 'reference'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    formData.collectorType === 'reference' ? 'border-blue-500' : 'border-slate-600'
                  }`}>
                    {formData.collectorType === 'reference' && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div className="font-medium text-white">Reference Person</div>
                </div>
              </button>
            </div>
            {formData.collectorType === 'reference' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Reference Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.referenceName}
                    onChange={(e) => setFormData({ ...formData, referenceName: e.target.value })}
                    required={formData.collectorType === 'reference'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter reference person name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Reference Mobile <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.referenceMobile}
                    onChange={(e) => setFormData({ ...formData, referenceMobile: e.target.value })}
                    required={formData.collectorType === 'reference'}
                    pattern="[0-9]{10}"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter mobile number"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Purpose (Optional)
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              rows="2"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter purpose for issuing this stock..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              {submitting ? 'Issuing...' : 'Issue Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}
