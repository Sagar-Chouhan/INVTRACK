import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Settings as SettingsIcon,
  User,
  Mail,
  Phone,
  Lock,
  Globe,
  Bell,
  Shield,
  Palette,
  Database,
  Save,
  CheckCircle,
  MessageSquare,
} from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()
  const { language, toggleLanguage, t, isHindi } = useLanguage()
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    stockAlerts: true,
    requestUpdates: true,
    auditReminders: true,
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database },
  ]

  const handleProfileUpdate = (e) => {
    e.preventDefault()
    // API call would go here
    toast.success('Profile updated successfully')
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (passwordData.new.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    // API call would go here
    toast.success('Password changed successfully')
    setPasswordData({ current: '', new: '', confirm: '' })
  }

  const handleNotificationToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
    toast.success('Notification settings updated')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-blue-400" />
          SETTINGS
        </h1>
        <p className="text-slate-400 mt-1">
          Customize your application language and interface preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Profile Information</h2>
                  <p className="text-slate-400 text-sm">
                    Update your account information and contact details
                  </p>
                </div>

                {/* User Role Display */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                      {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{user?.full_name}</p>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-blue-400 font-medium uppercase">
                          {user?.role === 'auditor' ? 'Audit Person' : user?.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        value={profileData.full_name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, full_name: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>
                </form>
              </motion.div>
            )}

            {/* Language Tab */}
            {activeTab === 'language' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">APP LANGUAGE</h2>
                  <p className="text-slate-400 text-sm">SELECT YOUR PREFERRED LANGUAGE</p>
                </div>

                <div className="space-y-3">
                  {/* English Option */}
                  <button
                    onClick={language === 'hi' ? toggleLanguage : undefined}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      language === 'en'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-2xl font-bold">
                        EN
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-lg text-white">ENGLISH</p>
                        <p className="text-sm text-slate-400">English</p>
                      </div>
                    </div>
                    {language === 'en' && <CheckCircle className="h-6 w-6 text-blue-400" />}
                  </button>

                  {/* Hindi Option */}
                  <button
                    onClick={language === 'en' ? toggleLanguage : undefined}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      language === 'hi'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-2xl font-bold">
                        हि
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-lg text-white">HINDI</p>
                        <p className="text-sm text-slate-400">हिंदी</p>
                      </div>
                    </div>
                    {language === 'hi' && <CheckCircle className="h-6 w-6 text-blue-400" />}
                  </button>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">STRICT SWITCHING</h3>
                      <p className="text-sm text-slate-400">
                        When you change the language, the entire interface (buttons, labels, and
                        menus) will switch immediately to ensure clarity for all workers.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-400 font-medium">SYSTEM READY</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">REGIONAL SUPPORT</h3>
                      <p className="text-sm text-slate-400">
                        We are working to add more regional languages to support every worker in
                        your facility.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Notification Settings</h2>
                  <p className="text-slate-400 text-sm">
                    Manage how you receive notifications and alerts
                  </p>
                </div>

                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700"
                    >
                      <div>
                        <p className="font-medium text-white">
                          {key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, (str) => str.toUpperCase())}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          Get notified about{' '}
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle(key)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          value ? 'bg-blue-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            value ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Change Password</h2>
                  <p className="text-slate-400 text-sm">Update your password to keep your account secure</p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="password"
                        value={passwordData.current}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, current: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="password"
                        value={passwordData.new}
                        onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="password"
                        value={passwordData.confirm}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirm: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Update Password
                  </button>
                </form>
              </motion.div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">System Information</h2>
                  <p className="text-slate-400 text-sm">Application and user details</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <span className="text-slate-400">User Role</span>
                    <span className="text-white font-medium capitalize">{user?.role || 'User'}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <span className="text-slate-400">Account Status</span>
                    <span className="flex items-center gap-2 text-green-400 font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <span className="text-slate-400">Version</span>
                    <span className="text-white font-medium">1.0.0</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <span className="text-slate-400">Last Login</span>
                    <span className="text-white font-medium">Today</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
