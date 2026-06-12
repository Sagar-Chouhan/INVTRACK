import { useState, useEffect } from 'react'
import { auditAPI, usersAPI, categoriesAPI } from '../../services/api'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  ClipboardCheck,
  Search,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  Eye,
  X,
} from 'lucide-react'

export default function AuditAssignments() {
  const [audits, setAudits] = useState([])
  const [auditors, setAuditors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedAudit, setSelectedAudit] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData] = await Promise.all([
        usersAPI.getAll().catch(() => []),
      ])
      
      const users = Array.isArray(usersData) ? usersData : []
      setAuditors(users.filter((u) => u.role === 'auditor'))
      
      // For demo, create mock audit data
      setAudits([])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load audit data')
    } finally {
      setLoading(false)
    }
  }

  const viewDetails = (audit) => {
    setSelectedAudit(audit)
    setShowDetailModal(true)
  }

  const getStatusBadge = (status) => {
    const styles = {
      'pending-audit': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
      verified: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      returned: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Package },
      overdue: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
    }
    const style = styles[status] || styles['pending-audit']
    const Icon = style.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${style.color}`}>
        <Icon className="h-3 w-3" />
        {status.replace('-', ' ')}
      </span>
    )
  }

  const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
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
        <h1 className="text-xl sm:text-2xl font-bold text-white">Audit Assignments</h1>
        <p className="text-slate-400">Manage and track stock verifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Pending</p>
              <p className="text-xl font-bold text-white">
                {audits.filter((a) => a.status === 'pending-audit').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Verified</p>
              <p className="text-xl font-bold text-white">
                {audits.filter((a) => a.status === 'verified').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Overdue</p>
              <p className="text-xl font-bold text-white">
                {audits.filter((a) => a.status === 'overdue').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <User className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Auditors</p>
              <p className="text-xl font-bold text-white">{auditors.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auditors List */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Active Auditors</h3>
        {auditors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {auditors.map((auditor) => (
              <div
                key={auditor._id}
                className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {auditor.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{auditor.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{auditor.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {auditor.assigned_categories?.slice(0, 2).map((cat, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                        {cat.name || cat}
                      </span>
                    ))}
                    {auditor.assigned_categories?.length > 2 && (
                      <span className="text-slate-500 text-xs">
                        +{auditor.assigned_categories.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No auditors found</p>
            <p className="text-sm text-slate-500">Assign auditor role to users in User Management</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search audits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
        >
          <option value="">All Status</option>
          <option value="pending-audit">Pending</option>
          <option value="verified">Verified</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Audits Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        {audits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Product</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Recipient</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Quantity</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Deadline</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr key={audit._id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-white">{audit.product_name}</td>
                    <td className="px-4 py-3 text-slate-300">{audit.recipient_name}</td>
                    <td className="px-4 py-3 text-slate-300">{audit.issued_qty}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {audit.verification_deadline
                        ? format(new Date(audit.verification_deadline), 'MMM d, yyyy')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(audit.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => viewDetails(audit)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No audit records found</p>
            <p className="text-sm text-slate-500">Audits will appear here when stock is issued</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        show={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedAudit(null)
        }}
        title="Audit Details"
      >
        {selectedAudit && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Product</p>
                <p className="text-white">{selectedAudit.product_name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Quantity</p>
                <p className="text-white">{selectedAudit.issued_qty}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Recipient</p>
                <p className="text-white">{selectedAudit.recipient_name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Status</p>
                {getStatusBadge(selectedAudit.status)}
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Verification Deadline</p>
              <p className="text-white">
                {selectedAudit.verification_deadline
                  ? format(new Date(selectedAudit.verification_deadline), 'MMMM d, yyyy')
                  : 'Not set'}
              </p>
            </div>
            {selectedAudit.purpose && (
              <div>
                <p className="text-slate-400 text-sm">Purpose</p>
                <p className="text-white">{selectedAudit.purpose}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
