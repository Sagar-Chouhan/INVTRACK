import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { auditAPI, issuesAPI, categoriesAPI } from '../../services/api'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { 
  Loader2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ClipboardCheck,
  Calendar,
  TrendingUp,
  Tag,
  Package 
} from 'lucide-react'

export default function EnhancedAuditorDashboard() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({
    totalAssigned: 0,
    verified: 0,
    pending: 0,
    overdue: 0,
    assignedCategories: []
  })
  const [assignedProducts, setAssignedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAssignedProducts()
  }, [])

  const loadAssignedProducts = async () => {
    try {
      setLoading(true)
      
      // Get user's assigned categories
      const assignedCategoryIds = user?.assigned_categories?.map(c => c._id || c) || []
      
      // Load all categories to get full names
      let allCategories = []
      try {
        allCategories = await categoriesAPI.getAll()
      } catch (e) {
        console.log('Could not load categories')
      }
      
      // Map assigned category IDs to full category objects
      const assignedCategories = allCategories.filter(cat => 
        assignedCategoryIds.includes(cat._id)
      )
      
      // Load all issues pending audit
      const issuesData = await issuesAPI.getAll()
      const allIssues = issuesData.issues || issuesData || []
      
      // Filter items assigned to this auditor or pending audit based on assigned categories
      const myAssignments = allIssues.filter(issue => {
        const matchesStatus = issue.status === 'pending-audit' || (issue.auditor_id === user?._id)
        
        // Filter by assigned category if categories are assigned
        if (assignedCategoryIds.length > 0) {
          const itemCategoryId = issue.category?._id || issue.category || issue.stock_id?.category_id?._id || issue.stock_id?.category_id
          return matchesStatus && assignedCategoryIds.includes(itemCategoryId)
        }
        
        return matchesStatus
      })
      
      // Calculate stats
      const now = new Date()
      const verified = myAssignments.filter(item => 
        item.status === 'verified' || item.status === 'completed'
      ).length
      
      const pending = myAssignments.filter(item => 
        item.status === 'pending-audit'
      ).length
      
      const overdue = myAssignments.filter(item => {
        if (!item.verification_deadline) return false
        return new Date(item.verification_deadline) < now && item.status === 'pending-audit'
      }).length
      
      setStats({
        totalAssigned: myAssignments.length,
        verified,
        pending,
        overdue,
        assignedCategories
      })
      
      // Sort by deadline (urgent first)
      const sortedAssignments = myAssignments
        .filter(item => item.status === 'pending-audit')
        .sort((a, b) => {
          const dateA = new Date(a.verification_deadline || a.created_at)
          const dateB = new Date(b.verification_deadline || b.created_at)
          return dateA - dateB
        })
      
      setAssignedProducts(sortedAssignments)
      
    } catch (error) {
      console.error('Error loading assigned products:', error)
      toast.error(language === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const getDaysLeft = (deadlineString) => {
    if (!deadlineString) return null
    const deadline = new Date(deadlineString)
    const now = new Date()
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
    return daysLeft
  }

  const handleVerifyClick = (itemId) => {
    navigate(`/dashboard/verify/${itemId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto mb-6" />
          <p className="text-slate-300 text-2xl">
            {language === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
          {language === 'hi' ? '📊 मेरा डैशबोर्ड' : '📊 My Dashboard'}
        </h1>
        <p className="text-2xl text-slate-400">
          {user?.full_name} ({language === 'hi' ? 'ऑडिटर' : 'Auditor'})
        </p>
      </motion.div>

      {/* Assigned Categories Banner - PROMINENT */}
      {stats.assignedCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-4 border-purple-600 rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex items-start gap-6">
            <div className="p-4 bg-purple-500/30 rounded-2xl flex-shrink-0">
              <Tag className="h-10 w-10 text-purple-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-black text-purple-200 mb-4">
                {language === 'hi' ? '🏷️ आपकी सौंपी गई श्रेणियां' : '🏷️ YOUR ASSIGNED CATEGORIES'}
              </h3>
              <div className="flex flex-wrap gap-4 mb-4">
                {stats.assignedCategories.map((category) => (
                  <span
                    key={category._id}
                    className="inline-flex items-center gap-2.5 px-6 py-3 bg-purple-500/30 text-purple-100 rounded-2xl text-2xl font-bold border-2 border-purple-400/50 shadow-lg"
                  >
                    <Package className="h-6 w-6" />
                    {category.name}
                  </span>
                ))}
              </div>
              <p className="text-xl text-purple-300 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {language === 'hi' 
                  ? 'आप केवल इन श्रेणियों से वस्तुओं का ऑडिट कर सकते हैं' 
                  : 'You can only audit items from these categories'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Cards - LARGE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
      >
        {/* Assigned Categories */}
        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-4 border-purple-700 rounded-3xl p-10 text-center shadow-2xl">
          <div className="mb-4">
            <Tag className="h-16 w-16 text-purple-400 mx-auto" />
          </div>
          <div className="text-7xl font-black text-white mb-3">
            {stats.assignedCategories.length || (
              <span className="text-5xl">All</span>
            )}
          </div>
          <div className="text-2xl text-purple-300 font-semibold">
            {language === 'hi' ? 'सौंपी गई श्रेणियां' : 'Assigned Categories'}
          </div>
        </div>

        {/* Assigned Items */}
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-4 border-blue-700 rounded-3xl p-10 text-center shadow-2xl">
          <div className="mb-4">
            <ClipboardCheck className="h-16 w-16 text-blue-400 mx-auto" />
          </div>
          <div className="text-7xl font-black text-white mb-3">
            {stats.totalAssigned}
          </div>
          <div className="text-2xl text-blue-300 font-semibold">
            {language === 'hi' ? 'सौंपी गई वस्तुएं' : 'Assigned Items'}
          </div>
        </div>

        {/* Verified Items */}
        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-4 border-green-700 rounded-3xl p-10 text-center shadow-2xl">
          <div className="mb-4">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
          </div>
          <div className="text-7xl font-black text-white mb-3">
            {stats.verified}
          </div>
          <div className="text-2xl text-green-300 font-semibold">
            {language === 'hi' ? 'सत्यापित वस्तुएं' : 'Verified Items'}
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-4 border-yellow-700 rounded-3xl p-10 text-center shadow-2xl">
          <div className="mb-4">
            <Clock className="h-16 w-16 text-yellow-400 mx-auto" />
          </div>
          <div className="text-7xl font-black text-white mb-3">
            {stats.pending}
          </div>
          <div className="text-2xl text-yellow-300 font-semibold">
            {language === 'hi' ? 'लंबित सत्यापन' : 'Pending Verification'}
          </div>
        </div>

        {/* Overdue Items */}
        <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-4 border-red-700 rounded-3xl p-10 text-center shadow-2xl">
          <div className="mb-4">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto" />
          </div>
          <div className="text-7xl font-black text-white mb-3">
            {stats.overdue}
          </div>
          <div className="text-2xl text-red-300 font-semibold">
            {language === 'hi' ? 'विलंबित वस्तुएं' : 'Overdue Items'}
          </div>
        </div>
      </motion.div>

      {/* Assigned Products List */}
      <div>
        <h2 className="text-4xl font-bold text-white mb-8 text-center">
          {language === 'hi' ? '📋 सौंपे गए उत्पाद' : '📋 Assigned Products'}
        </h2>

        {assignedProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900/50 border-2 border-slate-700 rounded-3xl p-16 text-center"
          >
            <div className="text-8xl mb-6">✅</div>
            <p className="text-3xl text-slate-400">
              {language === 'hi' 
                ? 'कोई लंबित सत्यापन नहीं!' 
                : 'No pending verifications!'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {assignedProducts.map((product, index) => {
              const productName = product.stock_id?.product_name || 
                                product.stock_id?.product_name_en || 
                                product.item_name || 
                                'Product'
              const productNameHi = product.stock_id?.product_name_hi || productName
              const daysLeft = getDaysLeft(product.verification_deadline)
              const isOverdue = daysLeft !== null && daysLeft < 0
              const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3

              return (
                <motion.div
                  key={product._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`bg-slate-900/80 border-4 rounded-3xl p-10 shadow-2xl ${
                    isOverdue 
                      ? 'border-red-500 bg-red-900/20' 
                      : isUrgent 
                      ? 'border-yellow-500 bg-yellow-900/20' 
                      : 'border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="text-4xl font-bold text-white mb-3">
                        {language === 'hi' ? productNameHi : productName}
                      </h3>
                      {language === 'hi' && productNameHi !== productName && (
                        <p className="text-2xl text-slate-400 mb-4">{productName}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-2xl">
                        <span className="text-slate-400">
                          {language === 'hi' ? 'मात्रा:' : 'Quantity:'}
                        </span>
                        <span className="text-blue-400 font-bold">
                          {product.issued_qty || product.quantity || 0} {product.unit || 'units'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xl mt-3">
                        <Calendar className="h-6 w-6 text-slate-500" />
                        <span className="text-slate-400">
                          {language === 'hi' ? 'असाइन किया:' : 'Assigned:'}
                        </span>
                        <span className="text-slate-300">
                          {new Date(product.created_at).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN')}
                        </span>
                      </div>

                      {/* Deadline Badge */}
                      {daysLeft !== null && (
                        <div className="mt-4">
                          {isOverdue ? (
                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/20 border-2 border-red-500 rounded-full">
                              <AlertTriangle className="h-6 w-6 text-red-400" />
                              <span className="text-2xl font-bold text-red-400">
                                {language === 'hi' 
                                  ? `${Math.abs(daysLeft)} दिन विलंबित` 
                                  : `${Math.abs(daysLeft)} days overdue`}
                              </span>
                            </div>
                          ) : (
                            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${
                              isUrgent 
                                ? 'bg-yellow-500/20 border-2 border-yellow-500' 
                                : 'bg-blue-500/20 border-2 border-blue-500'
                            }`}>
                              <Clock className={`h-6 w-6 ${isUrgent ? 'text-yellow-400' : 'text-blue-400'}`} />
                              <span className={`text-2xl font-bold ${isUrgent ? 'text-yellow-400' : 'text-blue-400'}`}>
                                ⏰ {daysLeft} {language === 'hi' ? 'दिन बाकी' : 'days left'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Verify Button - LARGE */}
                    <div>
                      <button
                        onClick={() => handleVerifyClick(product._id)}
                        className="px-12 py-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105 font-bold text-3xl flex items-center gap-4"
                      >
                        <ClipboardCheck className="h-10 w-10" />
                        {language === 'hi' ? '🔍 अभी जांचें' : '🔍 Verify Now'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
