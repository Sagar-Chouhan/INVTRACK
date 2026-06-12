import { useState, useEffect } from 'react'
import { stockAPI, requestsAPI, usersAPI } from '../../services/api'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  FileText,
  Package,
  Users,
  ClipboardCheck,
  ShoppingCart,
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
    pendingAudits: 0,
  })
  const [categoryData, setCategoryData] = useState([])
  const [requestStatusData, setRequestStatusData] = useState([])
  const [stockBySource, setStockBySource] = useState([])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  const Recharts = charts

  useEffect(() => {
    loadReportData()
  }, [])

  useEffect(() => {
    let active = true
    import('recharts')
      .then((mod) => {
        if (active) setCharts(mod)
      })
      .catch(() => {
        // Stats still work even if charts fail.
      })

    return () => {
      active = false
    }
  }, [])

  const loadReportData = async () => {
    try {
      setLoading(true)
      
      // Load all data
      const [stockData, usersData, requestsData] = await Promise.all([
        stockAPI.getAll(),
        usersAPI.getAll().catch(() => []),
        requestsAPI.getAll().catch(() => []),
      ])

      const stock = Array.isArray(stockData) ? stockData : stockData.items || []
      const users = Array.isArray(usersData) ? usersData : []
      const requests = Array.isArray(requestsData) ? requestsData : requestsData.requests || []

      // Calculate stats
      setStats({
        totalStock: stock.length,
        totalUsers: users.length,
        totalRequests: requests.length,
        pendingAudits: 0,
      })

      // Group by category
      const categoryMap = {}
      stock.forEach((item) => {
        const catName = item.category_id?.name || item.category || 'Uncategorized'
        categoryMap[catName] = (categoryMap[catName] || 0) + 1
      })
      setCategoryData(
        Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
      )

      // Group by request status
      const statusMap = { pending: 0, approved: 0, rejected: 0, completed: 0 }
      requests.forEach((req) => {
        if (statusMap[req.status] !== undefined) {
          statusMap[req.status]++
        }
      })
      setRequestStatusData(
        Object.entries(statusMap).map(([name, value]) => ({ name, value }))
      )

      // Group by source type
      const sourceMap = { purchase: 0, donation: 0 }
      stock.forEach((item) => {
        const source = item.source_type || 'purchase'
        sourceMap[source] = (sourceMap[source] || 0) + item.quantity
      })
      setStockBySource(
        Object.entries(sourceMap).map(([name, value]) => ({ name, value }))
      )

    } catch (error) {
      console.error('Error loading report data:', error)
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (format) => {
    toast.success(`Exporting report as ${format.toUpperCase()}...`)
    // Export logic would go here
  }

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-slate-400">View system statistics and generate reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-600/30"
          >
            <Download className="h-4 w-4" />
            Excel
          </button>
        </div>
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
          color="bg-yellow-500/20 text-yellow-400"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Pending Audits"
          value={stats.pendingAudits}
          color="bg-emerald-500/20 text-emerald-400"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Stock by Category
          </h3>
          {!Recharts ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : categoryData.length > 0 ? (
            <Recharts.ResponsiveContainer width="100%" height={300}>
              <Recharts.BarChart data={categoryData}>
                <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <Recharts.XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Recharts.YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Recharts.Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Recharts.Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </Recharts.BarChart>
            </Recharts.ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              No category data available
            </div>
          )}
        </motion.div>

        {/* Request Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-400" />
            Request Status Distribution
          </h3>
          {!Recharts ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : requestStatusData.some((d) => d.value > 0) ? (
            <Recharts.ResponsiveContainer width="100%" height={300}>
              <Recharts.PieChart>
                <Recharts.Pie
                  data={requestStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                  }
                >
                  {requestStatusData.map((entry, index) => (
                    <Recharts.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Recharts.Pie>
                <Recharts.Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Recharts.Legend />
              </Recharts.PieChart>
            </Recharts.ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              No request data available
            </div>
          )}
        </motion.div>

        {/* Stock by Source */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Stock by Source Type
          </h3>
          {!Recharts ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : stockBySource.some((d) => d.value > 0) ? (
            <Recharts.ResponsiveContainer width="100%" height={300}>
              <Recharts.PieChart>
                <Recharts.Pie
                  data={stockBySource}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {stockBySource.map((entry, index) => (
                    <Recharts.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Recharts.Pie>
                <Recharts.Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Recharts.Legend />
              </Recharts.PieChart>
            </Recharts.ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              No source data available
            </div>
          )}
        </motion.div>

        {/* Quick Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-yellow-400" />
            Quick Reports
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Stock Summary', desc: 'Complete inventory overview' },
              { name: 'Low Stock Report', desc: 'Items below minimum quantity' },
              { name: 'User Activity', desc: 'Recent user actions' },
              { name: 'Audit Summary', desc: 'Verification completion rates' },
              { name: 'Request History', desc: 'All product requests' },
            ].map((report, i) => (
              <button
                key={i}
                onClick={() => toast.info(`Generating ${report.name}...`)}
                className="w-full flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="text-left">
                  <p className="text-white font-medium">{report.name}</p>
                  <p className="text-xs text-slate-400">{report.desc}</p>
                </div>
                <Download className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
