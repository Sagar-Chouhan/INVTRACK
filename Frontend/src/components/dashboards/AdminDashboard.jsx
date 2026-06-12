import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { stockAPI, usersAPI, requestsAPI, categoriesAPI, auditAPI, issuesAPI } from '../../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  Plus,
  List,
  History,
  Activity,
  Box,
  PackageOpen,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  CalendarDays,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  ClipboardCheck,
  Settings,
  FileText,
  Bell,
  Shield,
} from 'lucide-react'
import AdminChatInbox from '../chat/AdminChatInbox'

const ADMIN_DASHBOARD_CACHE_KEY = 'invtrack:dashboard:admin:v1'
const DASHBOARD_CACHE_TTL_MS = 60 * 1000

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalProducts: 0,
    stockEntries: 0,
    lowStock: 0,
    outOfStock: 0,
    pendingRequests: 0,
    completedToday: 0,
    totalUsers: 0,
    totalAuditors: 0,
    pendingVerifications: 0,
    totalIssues: 0,
    totalCategories: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [pendingByCategory, setPendingByCategory] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasShownLowStockAlert, setHasShownLowStockAlert] = useState(false)

  useEffect(() => {
    loadDashboardData()
    // Show welcome toast
    toast.success(`Welcome back, ${user?.full_name}!`)
  }, [])

  const readCache = () => {
    try {
      const raw = sessionStorage.getItem(ADMIN_DASHBOARD_CACHE_KEY)
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
        ADMIN_DASHBOARD_CACHE_KEY,
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
          setPendingRequests(cached.pendingRequests)
          setPendingByCategory(cached.pendingByCategory)
          setLowStockItems(cached.lowStockItems)
          setRecentActivity(cached.recentActivity)
          setLoading(false)
          return
        }
      }

      setLoading(true)
      const [stockRes, usersRes, requestsRes, issuesRes, pendingSummaryRes] = await Promise.allSettled([
        stockAPI.getAll(),
        usersAPI.getAll(),
        requestsAPI.getAll(),
        issuesAPI.getAll(),
        issuesAPI.getPendingSummaryByCategory(),
      ])

      const stockData = stockRes.status === 'fulfilled' ? stockRes.value : []
      const usersData = usersRes.status === 'fulfilled' ? usersRes.value : []
      const requestsData = requestsRes.status === 'fulfilled' ? requestsRes.value : []
      const issuesData = issuesRes.status === 'fulfilled' ? issuesRes.value : []
      const pendingSummaryData = pendingSummaryRes.status === 'fulfilled' ? pendingSummaryRes.value : { categories: [] }

      const usersCount = Array.isArray(usersData) ? usersData.length : usersData?.length || 0
      const requests = requestsData.requests || requestsData || []
      const issues = issuesData.issues || issuesData || []
      const pendingByCategoryData = pendingSummaryData.categories || []

      // Calculate stats
      const stock = Array.isArray(stockData) ? stockData : []
      const totalQty = stock.reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0)
      const lowStockItems = stock.filter((item) => {
        const qty = item.quantity || item.qty || 0
        return qty > 0 && qty < 5
      })
      const outOfStockItems = stock.filter((item) => {
        const qty = item.quantity || item.qty || 0
        return qty <= 0
      })
      const pendingReqs = requests.filter(r => r.status === 'pending')
      
      // Get activity from today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const completedToday = requests.filter(r => {
        const date = new Date(r.updatedAt || r.createdAt)
        return date >= today && (r.status === 'approved' || r.status === 'completed')
      })

      const nextStats = {
        totalProducts: stock.length,
        stockEntries: totalQty,
        lowStock: lowStockItems.length,
        outOfStock: outOfStockItems.length,
        pendingRequests: pendingReqs.length,
        completedToday: completedToday.length,
        totalUsers: usersCount,
        pendingVerifications: pendingByCategoryData.reduce((sum, item) => sum + (item.pendingCount || 0), 0),
        totalIssues: issues.length,
      }

      const nextPendingRequests = pendingReqs.slice(0, 5)
      const nextPendingByCategory = pendingByCategoryData
      const nextLowStockItems = lowStockItems.slice(0, 8)
      
      // Create recent activity from requests
      const activities = requests.slice(0, 8).map(req => ({
        id: req._id,
        type: req.status === 'approved' ? 'approved' : req.status === 'rejected' ? 'rejected' : 'pending',
        title: `Stock request for ${req.item_name || 'item'}`,
        description: `${req.qty_requested || 0} units requested by ${req.requester_name || 'User'}`,
        time: formatTimeAgo(req.createdAt),
        status: req.status,
      }))

      setStats(nextStats)
      setPendingRequests(nextPendingRequests)
      setPendingByCategory(nextPendingByCategory)
      setLowStockItems(nextLowStockItems)
      setRecentActivity(activities)

      writeCache({
        stats: nextStats,
        pendingRequests: nextPendingRequests,
        pendingByCategory: nextPendingByCategory,
        lowStockItems: nextLowStockItems,
        recentActivity: activities,
      })
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData(true)
    setRefreshing(false)
    toast.success('Dashboard refreshed')
  }

  useEffect(() => {
    if (hasShownLowStockAlert) return
    if (stats.lowStock <= 0) return

    toast.warning(`Low stock alert: ${stats.lowStock} item(s) below threshold`) 
    setHasShownLowStockAlert(true)
  }, [stats.lowStock, hasShownLowStockAlert])

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

  // Quick Action Cards
  const quickActions = [
    { 
      icon: Plus, 
      label: 'ADD STOCK', 
      sublabel: 'INBOUND',
      color: 'bg-blue-600 hover:bg-blue-500', 
      iconBg: 'bg-blue-500',
      path: '/dashboard/add-stock' 
    },
    { 
      icon: List, 
      label: 'INVENTORY', 
      sublabel: 'CURRENT STOCK',
      color: 'bg-emerald-600 hover:bg-emerald-500', 
      iconBg: 'bg-emerald-500',
      path: '/dashboard/inventory' 
    },
    { 
      icon: History, 
      label: 'HISTORY', 
      sublabel: 'RECORDS',
      color: 'bg-slate-600 hover:bg-slate-500', 
      iconBg: 'bg-slate-500',
      path: '/dashboard/history' 
    },
    { 
      icon: BarChart3, 
      label: 'REPORTS', 
      sublabel: 'ANALYSIS',
      color: 'bg-purple-600 hover:bg-purple-500', 
      iconBg: 'bg-purple-500',
      path: '/dashboard/reports' 
    },
    { 
      icon: Users, 
      label: 'USERS', 
      sublabel: 'STAFF',
      color: 'bg-cyan-600 hover:bg-cyan-500', 
      iconBg: 'bg-cyan-500',
      path: '/dashboard/users' 
    },
  ]

  // Stats Cards Configuration
  const statsCards = [
    {
      title: 'TOTAL PRODUCTS',
      value: stats.totalProducts,
      icon: Box,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      title: 'STOCK ENTRIES',
      value: stats.stockEntries,
      icon: Package,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
    {
      title: 'LOW STOCK',
      value: stats.lowStock,
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
    {
      title: 'OUT OF STOCK',
      value: stats.outOfStock,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-green-500/10 border-green-500/20'
      case 'rejected':
        return 'bg-red-500/10 border-red-500/20'
      default:
        return 'bg-yellow-500/10 border-yellow-500/20'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="skeleton-shimmer h-8 w-64 rounded-lg" />
            <div className="skeleton-shimmer h-4 w-44 rounded" />
          </div>
          <div className="skeleton-shimmer h-10 w-28 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="skeleton-shimmer h-12 w-12 rounded-xl" />
              <div className="skeleton-shimmer h-8 w-20 rounded" />
              <div className="skeleton-shimmer h-4 w-28 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header - Simple */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Welcome back, Admin!
          </h1>
          <p className="text-slate-400 mt-1">Here's your inventory overview</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      {stats.lowStock > 0 && (
        <div className="border border-amber-500/40 bg-amber-500/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-semibold">{stats.lowStock} item(s) are low in stock (threshold: less than 5)</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/inventory')}
            className="px-3 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 transition-colors"
          >
            Review Inventory
          </button>
        </div>
      )}

      {/* Clean Statistics Grid - Just Counts */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {/* Total Products */}
        <div className="glass-panel rounded-2xl p-6 hover:border-blue-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">{stats.totalProducts}</p>
          <p className="text-sm text-slate-400 font-medium">Total Products</p>
        </div>

        {/* Stock Entries */}
        <div className="glass-panel rounded-2xl p-6 hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Box className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">{stats.stockEntries}</p>
          <p className="text-sm text-slate-400 font-medium">Stock Entries</p>
        </div>

        {/* Low Stock */}
        <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/dashboard/inventory')}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">{stats.lowStock}</p>
          <p className="text-sm text-yellow-100 font-medium">Low Stock</p>
        </div>

        {/* Out of Stock */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/dashboard/inventory')}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <XCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">{stats.outOfStock}</p>
          <p className="text-sm text-red-100 font-medium">Out of Stock</p>
        </div>

        {/* Total Users */}
        <div className="glass-panel rounded-2xl p-6 hover:border-purple-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">{stats.totalUsers}</p>
          <p className="text-sm text-slate-400 font-medium">Total Users</p>
        </div>

        {/* Pending Requests */}
        <div className="glass-panel rounded-2xl p-6 cursor-pointer hover:border-orange-500 transition-all" onClick={() => navigate('/dashboard/pending-requests')}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">{stats.pendingRequests}</p>
          <p className="text-sm text-slate-400 font-medium">Pending Requests</p>
        </div>

        {/* Completed Today */}
        <div className="glass-panel rounded-2xl p-6 hover:border-green-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">{stats.completedToday}</p>
          <p className="text-sm text-slate-400 font-medium">Completed Today</p>
        </div>

        {/* Total Issues */}
        <div className="glass-panel rounded-2xl p-6 hover:border-cyan-500 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">{stats.totalIssues || 0}</p>
          <p className="text-sm text-slate-400 font-medium">Total Issues</p>
        </div>

        {/* Pending Verification */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/dashboard/verification')}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">{stats.pendingVerifications || 0}</p>
          <p className="text-sm text-indigo-100 font-medium">Pending Verification</p>
        </div>
      </motion.div>

      {/* Pending Verification by Category */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel-heavy rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Pending Verification By Category</h3>
          <button
            onClick={() => navigate('/dashboard/verification')}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Open Verification
          </button>
        </div>

        {pendingByCategory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingByCategory.slice(0, 9).map((item) => (
              <div key={item.categoryId} className="bg-black/20 border border-white/10 rounded-xl p-4">
                <p className="text-sm text-slate-400">Category</p>
                <p className="text-white font-semibold truncate">{item.categoryName}</p>
                <p className="mt-2 text-2xl font-black text-indigo-400">{item.pendingCount}</p>
                <p className="text-xs text-slate-500">audit pending</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-400 text-sm">No pending audits category-wise.</div>
        )}
      </motion.div>

      {/* Low Stock Alerts (< 5) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-panel-heavy rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <h3 className="text-lg font-bold text-white">Low Stock Alerts (Below 5)</h3>
          </div>
          <button
            onClick={() => navigate('/dashboard/inventory')}
            className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            Open Inventory
          </button>
        </div>

        {lowStockItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {lowStockItems.map((item) => {
              const qty = item.quantity || item.qty || 0
              return (
                <div key={item._id} className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-sm text-yellow-300 truncate">{item.product_name || item.name || 'Product'}</p>
                  <p className="mt-1 text-2xl font-black text-yellow-400">{qty}</p>
                  <p className="text-xs text-slate-400">{item.unit || 'units'} left</p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-slate-400 text-sm">No low-stock alerts. All products are above threshold.</div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AdminChatInbox currentUser={user} />
      </motion.div>
    </div>
  )
}
