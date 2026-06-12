import { useState, useEffect } from 'react'
import { stockAPI, requestsAPI, usersAPI } from '../services/api'
import { motion } from 'framer-motion'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  Download,
  Calendar,
  Loader2,
} from 'lucide-react'

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [charts, setCharts] = useState(null)
  const [stats, setStats] = useState({
    totalStock: 0,
    totalUsers: 0,
    totalRequests: 0,
    lowStockItems: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
  })
  const [stockByCategory, setStockByCategory] = useState([])
  const [requestsByStatus, setRequestsByStatus] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let active = true
    import('recharts')
      .then((mod) => {
        if (active) setCharts(mod)
      })
      .catch(() => {
        // If chart library fails, page still shows numeric stats.
      })

    return () => {
      active = false
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load stock
      const stockData = await stockAPI.getAll()
      const stock = stockData.items || stockData || []
      
      // Load requests
      let requests = []
      try {
        const requestsData = await requestsAPI.getAll()
        requests = requestsData.requests || requestsData || []
      } catch (e) {
        console.log('Could not load requests')
      }
      
      // Load users
      let users = []
      try {
        const usersData = await usersAPI.getAll()
        users = usersData || []
      } catch (e) {
        console.log('Could not load users')
      }

      // Calculate stats
      const lowStock = stock.filter(item => item.qty <= (item.min_qty || 10))
      const pending = requests.filter(r => r.status === 'pending')
      const approved = requests.filter(r => r.status === 'approved')
      const rejected = requests.filter(r => r.status === 'rejected')

      setStats({
        totalStock: stock.length,
        totalUsers: users.length,
        totalRequests: requests.length,
        lowStockItems: lowStock.length,
        pendingRequests: pending.length,
        approvedRequests: approved.length,
        rejectedRequests: rejected.length,
      })

      setLowStockItems(lowStock.slice(0, 10))

      // Group by category
      const categoryMap = {}
      stock.forEach(item => {
        const cat = item.category?.name || 'Uncategorized'
        categoryMap[cat] = (categoryMap[cat] || 0) + 1
      })
      setStockByCategory(Object.entries(categoryMap).map(([name, value]) => ({ name, value })))

      // Requests by status
      setRequestsByStatus([
        { name: 'Pending', value: pending.length, color: '#eab308' },
        { name: 'Approved', value: approved.length, color: '#22c55e' },
        { name: 'Rejected', value: rejected.length, color: '#ef4444' },
      ])

    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, label, value, trend, trendUp, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
              {trendUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  )

  const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
  const Recharts = charts

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
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-slate-400">Overview of inventory statistics</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all">
          <Download className="h-5 w-5" />
          Export Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total Stock Items"
          value={stats.totalStock}
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          color="bg-purple-500/20 text-purple-400"
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Requests"
          value={stats.totalRequests}
          color="bg-cyan-500/20 text-cyan-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Alerts"
          value={stats.lowStockItems}
          color="bg-red-500/20 text-red-400"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Stock by Category</h3>
          <div className="h-64">
            {Recharts ? (
              <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.BarChart data={stockByCategory}>
                  <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <Recharts.XAxis dataKey="name" tick={{ fill: '#9ca3af' }} fontSize={12} angle={-45} textAnchor="end" height={70} />
                  <Recharts.YAxis tick={{ fill: '#9ca3af' }} fontSize={12} />
                  <Recharts.Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Recharts.Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </Recharts.BarChart>
              </Recharts.ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Requests by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Requests by Status</h3>
          <div className="h-64 flex items-center justify-center">
            {!Recharts ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            ) : stats.totalRequests > 0 ? (
              <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.PieChart>
                  <Recharts.Pie
                    data={requestsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {requestsByStatus.map((entry, index) => (
                      <Recharts.Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Recharts.Pie>
                  <Recharts.Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px' }}
                  />
                </Recharts.PieChart>
              </Recharts.ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-center">
                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No request data</p>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {requestsByStatus.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-slate-400">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Low Stock Items Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Low Stock Items</h3>
        
        {lowStockItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="text-left text-sm font-medium text-slate-400 pb-3">Item</th>
                  <th className="text-left text-sm font-medium text-slate-400 pb-3">Category</th>
                  <th className="text-left text-sm font-medium text-slate-400 pb-3">Current Qty</th>
                  <th className="text-left text-sm font-medium text-slate-400 pb-3">Min Qty</th>
                  <th className="text-left text-sm font-medium text-slate-400 pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {lowStockItems.map((item) => (
                  <tr key={item._id}>
                    <td className="py-3 text-white">{item.name}</td>
                    <td className="py-3 text-slate-400">{item.category?.name || 'Uncategorized'}</td>
                    <td className="py-3">
                      <span className={`font-medium ${item.qty === 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {item.qty}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{item.min_qty || 10}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.qty === 0 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {item.qty === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>All stock levels are healthy</p>
          </div>
        )}
      </motion.div>

      {/* Request Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Request Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
            <p className="text-3xl font-bold text-yellow-400">{stats.pendingRequests}</p>
            <p className="text-sm text-slate-400 mt-1">Pending</p>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg">
            <p className="text-3xl font-bold text-green-400">{stats.approvedRequests}</p>
            <p className="text-sm text-slate-400 mt-1">Approved</p>
          </div>
          <div className="text-center p-4 bg-red-500/10 rounded-lg">
            <p className="text-3xl font-bold text-red-400">{stats.rejectedRequests}</p>
            <p className="text-sm text-slate-400 mt-1">Rejected</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
