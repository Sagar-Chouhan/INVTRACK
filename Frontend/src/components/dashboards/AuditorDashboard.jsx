import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { auditAPI, categoriesAPI } from '../../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ClipboardCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  History,
  Search,
  FileText,
  BarChart3,
  Shield,
  ChevronRight,
  Loader2,
  Tag,
  TrendingUp,
  Box,
  UserCheck,
  Camera,
  Bell,
  Calendar,
  Package,
  Activity,
  AlertCircle,
  User,
} from 'lucide-react'

const AUDITOR_DASHBOARD_CACHE_KEY = 'invtrack:dashboard:auditor:v1'
const DASHBOARD_CACHE_TTL_MS = 60 * 1000

export default function AuditorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    pendingVerification: 0,
    totalVerified: 0,
    assignedCategories: [],
    upcomingDeadlines: 0,
    overdueItems: 0,
  })
  const [pendingItems, setPendingItems] = useState([])
  const [recentVerifications, setRecentVerifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    toast.success(`Welcome back, ${user?.full_name}!`)
  }, [])

  const readCache = () => {
    try {
      const raw = sessionStorage.getItem(AUDITOR_DASHBOARD_CACHE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (Date.now() - parsed.timestamp > DASHBOARD_CACHE_TTL_MS) return null
      return parsed.data
    } catch {
      return null
    }
  }

  const writeCache = (data) => {
    try {
      sessionStorage.setItem(
        AUDITOR_DASHBOARD_CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), data }),
      )
    } catch {
      // ignore cache errors
    }
  }

  const normalizeId = (value) => {
    if (!value) return null
    if (typeof value === 'string') return value
    if (value._id) return value._id.toString()
    return value.toString()
  }

  const loadDashboardData = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cached = readCache()
        if (cached) {
          setStats(cached.stats)
          setPendingItems(cached.pendingItems)
          setRecentVerifications(cached.recentVerifications)
          setLoading(false)
          return
        }
      }

      setLoading(true)
      
      // Get user's assigned categories and load category details
      const assignedCategoryIds = (user?.assigned_categories || []).map(normalizeId).filter(Boolean)

      const [categoriesRes, pendingRes, historyRes] = await Promise.allSettled([
        categoriesAPI.getAll(),
        auditAPI.getPending(),
        auditAPI.getHistory(),
      ])

      const allCategories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : []
      
      // Map assigned category IDs to full category objects
      const assignedCategories = allCategories.filter((cat) =>
        assignedCategoryIds.includes(normalizeId(cat._id)),
      )

      const pendingData = pendingRes.status === 'fulfilled' ? pendingRes.value : []
      const allPending = pendingData.audits || pendingData || []
      const pending = allPending.filter((issue) => {
        if (issue.status !== 'pending-audit') return false

        if (assignedCategoryIds.length > 0) {
          const itemCategoryId = normalizeId(issue.stock_id?.category_id)
          return assignedCategoryIds.includes(itemCategoryId)
        }

        return true
      })

      const historyData = historyRes.status === 'fulfilled' ? historyRes.value : []
      const history = historyData.audits || historyData.verifications || historyData || []

      // Calculate deadline statistics
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))
      
      const upcomingDeadlines = pending.filter(item => {
        const deadline = new Date(item.verification_deadline)
        return deadline <= sevenDaysFromNow && deadline > now
      }).length
      
      const overdueItems = pending.filter(item => {
        const deadline = new Date(item.verification_deadline)
        return deadline < now
      }).length
      
      const nextStats = {
        pendingVerification: pending.length,
        totalVerified: history.length,
        assignedCategories: assignedCategories,
        upcomingDeadlines,
        overdueItems,
      }
      
      // Sort by urgency (deadline approaching first)
      const sortedPending = [...pending].sort((a, b) => {
        const deadlineA = new Date(a.verification_deadline || a.created_at)
        const deadlineB = new Date(b.verification_deadline || b.created_at)
        return deadlineA - deadlineB
      })

      const nextPendingItems = sortedPending.slice(0, 5)
      const nextRecentVerifications = history.slice(0, 5)

      setStats(nextStats)
      setPendingItems(nextPendingItems)
      setRecentVerifications(nextRecentVerifications)

      writeCache({
        stats: nextStats,
        pendingItems: nextPendingItems,
        recentVerifications: nextRecentVerifications,
      })
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const getDeadlineStatus = (deadlineString) => {
    if (!deadlineString) return { text: 'No deadline', color: 'text-slate-500', bgColor: 'bg-slate-500/20', urgent: false }
    
    const deadline = new Date(deadlineString)
    const now = new Date()
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
    
    if (daysLeft < 0) {
      return { text: `${Math.abs(daysLeft)}d overdue`, color: 'text-red-400', bgColor: 'bg-red-500/20', urgent: true }
    } else if (daysLeft === 0) {
      return { text: 'Due today', color: 'text-orange-400', bgColor: 'bg-orange-500/20', urgent: true }
    } else if (daysLeft === 1) {
      return { text: 'Due tomorrow', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', urgent: true }
    } else if (daysLeft <= 3) {
      return { text: `${daysLeft}d left`, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', urgent: true }
    } else if (daysLeft <= 7) {
      return { text: `${daysLeft}d left`, color: 'text-blue-400', bgColor: 'bg-blue-500/20', urgent: false }
    } else {
      return { text: `${daysLeft}d left`, color: 'text-slate-400', bgColor: 'bg-slate-500/20', urgent: false }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            AUDITOR DASHBOARD
          </h1>
          <p className="text-slate-400 mt-1">
            Verify stock transactions and return requests.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 text-sm font-semibold">
          <UserCheck className="h-4 w-4" />
          AUDIT PERSONNEL
        </span>
      </motion.div>

      {/* Assigned Categories Info Banner */}
      {stats.assignedCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg flex-shrink-0">
              <Tag className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-indigo-400 mb-2">YOUR ASSIGNED CATEGORIES</h3>
              <div className="flex flex-wrap gap-2">
                {stats.assignedCategories.map((category) => (
                  <span
                    key={category._id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm font-semibold border border-indigo-500/30"
                  >
                    <Package className="h-3.5 w-3.5" />
                    {category.name}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                You can only audit items from these categories
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {/* Assigned Categories */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-indigo-400" />
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">CATEGORIES</p>
          </div>
          <p className="text-3xl font-black text-white mb-1">{stats.assignedCategories.length || 'All'}</p>
          <p className="text-xs text-slate-400 truncate">
            {stats.assignedCategories.length > 0 
              ? stats.assignedCategories.map(c => c.name || c).slice(0, 2).join(', ')
              : 'All Categories'
            }
          </p>
        </div>

        {/* Pending Verification - Red highlight */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-2 text-red-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <Clock className="h-4 w-4" />
            PENDING
          </div>
          <p className="text-4xl font-black text-white mb-1">{stats.pendingVerification}</p>
          <p className="text-red-200 text-xs">Action required</p>
        </div>

        {/* Total Verified - Green */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <CheckCircle className="h-4 w-4" />
            VERIFIED
          </div>
          <p className="text-4xl font-black text-white mb-1">{stats.totalVerified}</p>
          <p className="text-emerald-200 text-xs">Completed</p>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-slate-900/80 border border-yellow-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-yellow-400" />
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">DUE SOON</p>
          </div>
          <p className="text-3xl font-black text-white mb-1">{stats.upcomingDeadlines}</p>
          <p className="text-xs text-yellow-400">Within 7 days</p>
        </div>

        {/* Overdue Items */}
        <div className="bg-slate-900/80 border border-red-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">OVERDUE</p>
          </div>
          <p className="text-3xl font-black text-white mb-1">{stats.overdueItems}</p>
          <p className="text-xs text-red-400">Past deadline</p>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Pending - 2 columns */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden"
        >
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">PENDING VERIFICATIONS</h3>
                <p className="text-xs text-slate-500">Issues awaiting your audit (30-day deadline)</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/dashboard/verify')}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="p-5">
            {pendingItems.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {pendingItems.map((item, index) => {
                    const deadlineInfo = getDeadlineStatus(item.verification_deadline)
                    return (
                      <motion.div
                        key={item._id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-start justify-between p-4 rounded-lg border ${
                          deadlineInfo.urgent 
                            ? 'bg-red-500/5 border-red-500/20' 
                            : 'bg-slate-800/50 border-slate-700/50'
                        } hover:bg-slate-800/70 transition-all`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {deadlineInfo.urgent && <Bell className="h-4 w-4 text-red-400 animate-pulse" />}
                            <p className="text-white font-medium">{item.stock_id?.product_name || item.item_name || 'Stock Item'}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {item.issued_qty || item.expected_qty || item.qty || 0} units
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {item.recipient_name || 'Recipient'}
                            </span>
                            {item.category?.name && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  {item.category.name}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="mt-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${deadlineInfo.bgColor} ${deadlineInfo.color}`}>
                              <Clock className="h-3 w-3" />
                              {deadlineInfo.text}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => navigate('/dashboard/verify')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            deadlineInfo.urgent
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                          }`}
                        >
                          Verify →
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400/50" />
                <p className="font-medium">NO PENDING ITEMS</p>
                <p className="text-sm mt-1 text-slate-500">All verifications complete</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Verifications & Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {/* Recent Verifications */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">RECENT VERIFICATIONS</h3>
              </div>
            </div>
            <div className="p-4">
              {recentVerifications.length > 0 ? (
                <div className="space-y-2">
                  {recentVerifications.slice(0, 3).map((item, index) => (
                    <div key={item._id || index} className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-white font-medium text-sm truncate">
                        {item.issue_id?.stock_id?.product_name || item.item_name || 'Item'}
                      </p>
                      <p className="text-emerald-400 text-xs mt-1">
                        ✓ Verified {formatTimeAgo(item.verification_date || item.verified_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No verifications yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Verification Guidelines Card */}
          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="font-bold text-white">VERIFICATION RULES</h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Photo evidence required</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Record used/returned quantities</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Report faulty items with reason</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Complete within 30-day deadline</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Row */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <button 
          onClick={() => navigate('/dashboard/verify')}
          className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardCheck className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold">Start Audit</p>
              <p className="text-xs text-slate-500">Verify items</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => navigate('/dashboard/history')}
          className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <History className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold">History</p>
              <p className="text-xs text-slate-500">Past audits</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => navigate('/dashboard/categories')}
          className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Tag className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold">Categories</p>
              <p className="text-xs text-slate-500">Assignments</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => navigate('/dashboard/reports')}
          className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 hover:border-blue-500/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold">Reports</p>
              <p className="text-xs text-slate-500">Analytics</p>
            </div>
          </div>
        </button>
      </motion.div>
    </div>
  )
}
