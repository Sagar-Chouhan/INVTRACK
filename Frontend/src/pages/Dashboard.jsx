import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  FileCheck,
  ClipboardCheck,
  Bell,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Settings as SettingsIcon,
  ShoppingCart,
  AlertCircle,
  History as HistoryIcon,
  BarChart3,
  Plus,
  List,
  Shield,
  Folder,
  Flag,
} from 'lucide-react'

// Dashboard Views
const AdminDashboard = lazy(() => import('../components/dashboards/AdminDashboard'))
const UserDashboard = lazy(() => import('../components/dashboards/UserDashboard'))
const AuditorDashboard = lazy(() => import('../components/dashboards/AuditorDashboard'))

// Admin Pages
const StockManagement = lazy(() => import('./admin/StockManagement'))
const StockList = lazy(() => import('./admin/StockList'))
const ProductRequests = lazy(() => import('./admin/ProductRequests'))
const UserManagement = lazy(() => import('./admin/UserManagement'))
const AuditAssignments = lazy(() => import('./admin/AuditAssignments'))
const AdminReports = lazy(() => import('./admin/Reports'))

// Shared Pages
const Requests = lazy(() => import('./Requests'))
const Issues = lazy(() => import('./Issues'))
const Audit = lazy(() => import('./Audit'))
const Reports = lazy(() => import('./Reports'))
const History = lazy(() => import('./History'))
const Settings = lazy(() => import('./Settings'))

const PageLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
  </div>
)

// Navigation items based on role
const getNavItems = (role) => {
  const items = {
    admin: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'DASHBOARD', end: true },
      { to: '/dashboard/inventory', icon: List, label: 'INVENTORY' },
      { to: '/dashboard/add-stock', icon: Plus, label: 'ADD STOCK' },
      { to: '/dashboard/issues', icon: AlertCircle, label: 'ISSUE STOCK' },
      { to: '/dashboard/pending-requests', icon: ShoppingCart, label: 'PENDING PRODUCT R...' },
      { to: '/dashboard/reports', icon: BarChart3, label: 'REPORTS' },
      { to: '/dashboard/users', icon: Users, label: 'USERS' },
      { to: '/dashboard/audit-assign', icon: ClipboardCheck, label: 'AUDIT ASSIGN' },
      { to: '/dashboard/verification', icon: FileCheck, label: 'VERIFICATION' },
      { to: '/dashboard/history', icon: HistoryIcon, label: 'HISTORY' },
      { to: '/dashboard/settings', icon: SettingsIcon, label: 'SETTINGS' },
    ],
    user: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
      { to: '/dashboard/request-stock', icon: ShoppingCart, label: 'Request Stock' },
      { to: '/dashboard/issues', icon: AlertCircle, label: 'Issued Stock' },
      { to: '/dashboard/my-requests', icon: FileText, label: 'My Requests' },
      { to: '/dashboard/verify', icon: ClipboardCheck, label: 'Audit' },
      { to: '/dashboard/history', icon: HistoryIcon, label: 'History' },
      { to: '/dashboard/settings', icon: SettingsIcon, label: 'Settings' },
    ],
    auditor: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
      { to: '/dashboard/pending', icon: ClipboardCheck, label: 'Pending Audits' },
      { to: '/dashboard/categories', icon: Folder, label: 'Categories' },
      { to: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
      { to: '/dashboard/history', icon: HistoryIcon, label: 'Audit History' },
      { to: '/dashboard/settings', icon: SettingsIcon, label: 'Settings' },
    ],
  }
  return items[role] || items.user
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('invtrack-theme') || 'dark')
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('invtrack-theme', theme)
  }, [theme])

  const navItems = getNavItems(user?.role)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrator',
      user: 'User',
      auditor: 'Audit Person',
    }
    return labels[role] || role
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      user: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      auditor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    }
    return colors[role] || colors.user
  }

  // Render dashboard content based on role
  const renderDashboardContent = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />
      case 'user':
        return <UserDashboard />
      case 'auditor':
        return <AuditorDashboard />
      default:
        return <UserDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed lg:static inset-y-0 left-0 z-50 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900/50 border-r border-slate-800 backdrop-blur-sm transition-all duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">STOCK PRO</h1>
                <p className="text-[10px] text-blue-400 font-semibold">MANAGEMENT</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6 text-white" />
            </div>
          )}
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen)
              if (mobileMenuOpen) setMobileMenuOpen(false)
            }}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors lg:block hidden"
          >
            <ChevronRight className={`h-5 w-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-sm font-semibold ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                } ${sidebarOpen ? '' : 'justify-center'}`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="truncate text-xs tracking-wide">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Profile - Above Logout */}
        <div className={`p-3 border-t border-slate-800 ${sidebarOpen ? '' : 'flex justify-center'}`}>
          <div className={`flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg ${sidebarOpen ? '' : 'flex-col'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Admin User'}</p>
                <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${getRoleBadgeColor(user?.role)}`}>
                  {user?.role?.toUpperCase() || 'ADMIN'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all w-full text-sm font-semibold ${
              sidebarOpen ? '' : 'justify-center'
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-xs tracking-wide">LOGOUT</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/50 border-b border-slate-800 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-white hidden sm:block">
              {getRoleLabel(user?.role)} Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button 
              onClick={() => navigate('/dashboard/settings')}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <SettingsIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-shell flex-1 p-4 lg:p-6 overflow-auto">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route index element={renderDashboardContent()} />
              {/* Admin Routes */}
              <Route path="inventory" element={<StockList />} />
              <Route path="add-stock" element={<StockManagement />} />
              <Route path="pending-requests" element={<ProductRequests />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="audit-assign" element={<AuditAssignments />} />
              <Route path="verification" element={<Audit />} />
              <Route path="reports" element={user?.role === 'admin' ? <AdminReports /> : <Reports />} />
              <Route path="history" element={<History />} />
              <Route path="categories" element={<Audit />} />
              <Route path="settings" element={<Settings />} />
              {/* Legacy Admin Routes (for backward compatibility) */}
              <Route path="stock" element={<StockManagement />} />
              <Route path="requests" element={<ProductRequests />} />
              <Route path="audit" element={<Audit />} />
              {/* User Routes */}
              <Route path="request-stock" element={<Requests />} />
              <Route path="issues" element={<Issues />} />
              <Route path="my-requests" element={<Requests />} />
              {/* Auditor Routes */}
              <Route path="pending" element={<Audit />} />
              <Route path="verify" element={<Audit />} />
              {/* Catch all */}
              <Route path="*" element={renderDashboardContent()} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
