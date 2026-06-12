import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { requestsAPI, stockAPI, issuesAPI } from '../../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ShoppingCart,
  Package,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Send,
  TrendingUp,
  Sparkles,
  List,
  History,
  ChevronRight,
  Loader2,
  Box,
  Activity,
  PackageOpen,
  User,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react'

const USER_DASHBOARD_CACHE_KEY = 'invtrack:dashboard:user:v1'
const DASHBOARD_CACHE_TTL_MS = 60 * 1000

export default function UserDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalIssues: 0,
    pendingIssues: 0,
    availableStock: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [availableItems, setAvailableItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    toast.success(`Welcome back, ${user?.full_name}!`)
  }, [])

  const readCache = () => {
    try {
      const raw = sessionStorage.getItem(USER_DASHBOARD_CACHE_KEY)
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
        USER_DASHBOARD_CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), data }),
      )
    } catch {
      // ignore cache errors
    }
  }

  const loadDashboardData = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cached = readCache()
        if (cached) {
          setStats(cached.stats)
          setAvailableItems(cached.availableItems)
          setRecentActivity(cached.recentActivity)
          setLoading(false)
          return
        }
      }

      setLoading(true)

      const [requestsRes, issuesRes, stockRes] = await Promise.allSettled([
        requestsAPI.getAll(),
        issuesAPI.getAll(),
        stockAPI.getAll(),
      ])

      let requests = requestsRes.status === 'fulfilled' ? requestsRes.value.requests || requestsRes.value || [] : []
      requests = requests.filter(r => r.requestedBy?._id === user?._id || r.requestedBy === user?._id)

      let issues = issuesRes.status === 'fulfilled' ? issuesRes.value.issues || issuesRes.value || [] : []
      issues = issues.filter(i => i.issued_by?._id === user?._id || i.issued_by === user?._id)

      let stock = stockRes.status === 'fulfilled' ? stockRes.value.items || stockRes.value || [] : []
      stock = stock.filter(item => (item.quantity || item.qty || 0) > 0)
      
      // Calculate stats
      const pending = requests.filter(r => r.status === 'pending').length
      const approved = requests.filter(r => r.status === 'approved').length
      const rejected = requests.filter(r => r.status === 'rejected').length
      const pendingIssues = issues.filter(i => i.status === 'pending-audit').length
      
      const nextStats = {
        totalRequests: requests.length,
        pendingRequests: pending,
        approvedRequests: approved,
        rejectedRequests: rejected,
        totalIssues: issues.length,
        pendingIssues: pendingIssues,
        availableStock: stock.length,
      }

      const nextAvailableItems = stock.slice(0, 4)

      // Combine requests and issues for recent activity
      const activities = [
        ...requests.map(r => ({
          id: r._id,
          type: 'request',
          title: r.productName || r.item_name || 'Product Request',
          status: r.status,
          time: r.createdAt || r.created_at,
          details: `${r.quantity || 0} ${r.unit || 'units'}`,
        })),
        ...issues.map(i => ({
          id: i._id,
          type: 'issue',
          title: `Issued: ${i.stock_id?.product_name || 'Stock Item'}`,
          status: i.status || 'pending',
          time: i.created_at || i.createdAt,
          details: `${i.issued_qty || 0} units to ${i.recipient_name || 'Recipient'}`,
        })),
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6)

      setStats(nextStats)
      setAvailableItems(nextAvailableItems)
      setRecentActivity(activities)

      writeCache({
        stats: nextStats,
        availableItems: nextAvailableItems,
        recentActivity: activities,
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

  // Quick Action Cards matching screenshot design
  const quickActions = [
    { 
      icon: Sparkles, 
      label: 'REQUEST ITEM', 
      sublabel: 'NEW PRODUCT',
      iconBg: 'bg-blue-600',
      path: '/dashboard/requests' 
    },
    { 
      icon: Send, 
      label: 'ISSUE STOCK', 
      sublabel: 'TO WORKER',
      iconBg: 'bg-orange-500',
      path: '/dashboard/issues' 
    },
    { 
      icon: Package, 
      label: 'INVENTORY', 
      sublabel: 'VIEW STOCK',
      iconBg: 'bg-emerald-500',
      path: '/dashboard/inventory' 
    },
    { 
      icon: History, 
      label: 'HISTORY', 
      sublabel: 'MY RECORDS',
      iconBg: 'bg-slate-700',
      path: '/dashboard/history' 
    },
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />
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
      >
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          WELCOME, {user?.full_name?.toUpperCase()}
        </h1>
        <p className="text-slate-400 mt-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            SYSTEM STATUS: OPERATIONAL
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-blue-400">USER MODE</span>
        </p>
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {quickActions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            onClick={() => navigate(action.path)}
            className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all hover:scale-[1.02] group text-left"
          >
            <div className={`w-12 h-12 ${action.iconBg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-white font-bold text-sm">{action.label}</p>
            <p className="text-slate-500 text-xs mt-0.5">{action.sublabel}</p>
          </motion.button>
        ))}
      </motion.div>

      {/* Recent Activity Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden"
      >
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">MY RECENT ACTIVITY</h3>
                <p className="text-xs text-slate-500">Your latest requests and issues</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/dashboard/history')}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
            >
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="p-5">
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(activity.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{activity.title}</p>
                        <p className="text-sm text-slate-400 mt-0.5">{activity.details}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 capitalize">{activity.type}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-slate-500 capitalize">{activity.status.replace('-', ' ')}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-slate-500">{formatTimeAgo(activity.time)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12">
                <Box className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No recent activity</p>
                <p className="text-slate-600 text-sm mt-1">Your requests and issues will appear here</p>
              </div>
            )}
          </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalRequests}</p>
              <p className="text-xs text-slate-500">Total Requests</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pendingRequests}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.approvedRequests}</p>
              <p className="text-xs text-slate-500">Approved</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.rejectedRequests}</p>
              <p className="text-xs text-slate-500">Rejected</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
