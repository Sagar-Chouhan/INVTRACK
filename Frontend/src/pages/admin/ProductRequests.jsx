import { useState, useEffect, useCallback } from 'react'
import { requestsAPI } from '../../services/api'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  ShoppingCart,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Package,
  MessageSquare,
  X,
} from 'lucide-react'

// Modal component defined outside to prevent re-renders
const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </motion.div>
    </div>
  )
}

export default function ProductRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [responseText, setResponseText] = useState('')
  const [respondingAction, setRespondingAction] = useState(null)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const data = await requestsAPI.getAll()
      setRequests(Array.isArray(data) ? data : data.requests || [])
    } catch (error) {
      console.error('Error loading requests:', error)
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (request) => {
    setSelectedRequest(request)
    setRespondingAction('approve')
    setShowResponseModal(true)
  }

  const handleReject = async (request) => {
    setSelectedRequest(request)
    setRespondingAction('reject')
    setShowResponseModal(true)
  }

  const submitResponse = async () => {
    try {
      if (respondingAction === 'approve') {
        await requestsAPI.approve(selectedRequest._id)
        toast.success('Request approved')
      } else {
        await requestsAPI.reject(selectedRequest._id, responseText)
        toast.success('Request rejected')
      }
      setShowResponseModal(false)
      setSelectedRequest(null)
      setResponseText('')
      loadRequests()
    } catch (error) {
      console.error('Error processing request:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to process request'
      toast.error(errorMessage)
    }
  }

  // Optimized input handler to prevent focus issues
  const handleResponseTextChange = useCallback((value) => {
    setResponseText(value)
  }, [])

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value)
  }, [])

  const handleStatusFilterChange = useCallback((value) => {
    setStatusFilter(value)
  }, [])

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requestedBy?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || req.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const styles = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
      approved: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
      completed: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle },
    }
    const style = styles[status] || styles.pending
    const Icon = style.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${style.color}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    )
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Product Requests</h1>
        <p className="text-slate-400">Review and manage product requests from users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['pending', 'approved', 'rejected', 'completed'].map((status) => {
          const count = requests.filter((r) => r.status === status).length
          const colors = {
            pending: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
            approved: 'from-green-500/20 to-green-600/20 border-green-500/30',
            rejected: 'from-red-500/20 to-red-600/20 border-red-500/30',
            completed: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
          }
          return (
            <div
              key={status}
              className={`bg-gradient-to-br ${colors[status]} border rounded-xl p-4`}
            >
              <p className="text-slate-400 text-sm capitalize">{status}</p>
              <p className="text-2xl font-bold text-white">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <motion.div
            key={request._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{request.productName}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {request.requestedBy?.full_name || 'Unknown User'}
                    </span>
                    <span>•</span>
                    <span>Qty: {request.quantity} {request.unit}</span>
                    <span>•</span>
                    <span>{request.category}</span>
                  </div>
                  {request.createdAt && (
                    <p className="text-xs text-slate-500 mt-1">
                      {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                  {request.adminResponse && (
                    <div className="mt-2 p-2 bg-slate-800 rounded text-sm text-slate-300">
                      <span className="text-slate-500">Response: </span>
                      {request.adminResponse}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(request.status)}
                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(request)}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-500 flex items-center gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request)}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-500 flex items-center gap-1"
                    >
                      <XCircle className="h-4 w-4" />
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
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-xl">
          <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-slate-400 opacity-50" />
          <p className="text-slate-400">No requests found</p>
        </div>
      )}

      {/* Response Modal */}
      <Modal
        show={showResponseModal}
        onClose={() => {
          setShowResponseModal(false)
          setSelectedRequest(null)
          setResponseText('')
        }}
        title={respondingAction === 'approve' ? 'Approve Request' : 'Reject Request'}
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-800 rounded-lg">
            <p className="text-white font-medium">{selectedRequest?.productName}</p>
            <p className="text-sm text-slate-400">
              {selectedRequest?.quantity} {selectedRequest?.unit} • {selectedRequest?.category}
            </p>
          </div>
          {respondingAction === 'reject' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Reason (optional)</label>
              <textarea
                value={responseText}
                onChange={(e) => handleResponseTextChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                rows="3"
                placeholder="Enter reason for rejection..."
              />
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setShowResponseModal(false)}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={submitResponse}
              className={`flex-1 px-4 py-2 text-white rounded-lg flex items-center justify-center gap-2 ${
                respondingAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              {respondingAction === 'approve' ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Reject
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
