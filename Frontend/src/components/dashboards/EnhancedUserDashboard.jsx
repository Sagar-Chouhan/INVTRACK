import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { issuesAPI, stockAPI } from '../../services/api'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, History } from 'lucide-react'

// Helper function to get category icon emoji
const getCategoryIcon = (categoryName) => {
  const icons = {
    'Electrical': '⚡',
    'Electronics': '💡',
    'Tools': '🔨',
    'Hardware': '🔧',
    'Cables': '🔌',
    'Lighting': '💡',
    'Safety': '🦺',
    'Plumbing': '🚰',
    'Paint': '🎨',
    'Construction': '🏗️',
  }
  return icons[categoryName] || '📦'
}

export default function EnhancedUserDashboard() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const [issuedItems, setIssuedItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIssuedItems()
  }, [])

  const loadIssuedItems = async () => {
    try {
      setLoading(true)
      
      // Load all issued stock for this user
      const issuesData = await issuesAPI.getAll()
      const allIssues = issuesData.issues || issuesData || []
      
      // Filter to only show items issued to current user that are not returned
      const myIssues = allIssues.filter(issue => 
        (issue.issued_to?._id === user?._id || issue.issued_to === user?._id) &&
        issue.status !== 'returned' &&
        issue.status !== 'rejected'
      )
      
      setIssuedItems(myIssues)
      
    } catch (error) {
      console.error('Error loading issued items:', error)
      toast.error(language === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Header - LARGE */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 mb-12"
      >
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
          👤 {language === 'hi' ? 'स्वागत' : 'Welcome'}
        </h1>
        <p className="text-4xl text-blue-400 font-semibold">
          {user?.full_name}
        </p>
      </motion.div>

      {/* Section Title - LARGE */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          {language === 'hi' ? '📦 मेरा सामान' : '📦 My Items'}
        </h2>
      </motion.div>

      {/* Issued Items List - EXTRA LARGE UI */}
      <div className="space-y-8">
        {issuedItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 border-2 border-slate-700 rounded-3xl p-16 text-center"
          >
            <div className="text-8xl mb-6">📭</div>
            <p className="text-3xl text-slate-400">
              {language === 'hi' 
                ? 'कोई सामान जारी नहीं किया गया' 
                : 'No items issued'}
            </p>
          </motion.div>
        ) : (
          issuedItems.map((item, index) => {
            const productName = item.stock_id?.product_name || 
                              item.stock_id?.product_name_en || 
                              item.item_name || 
                              'Product'
            
            const productNameHi = item.stock_id?.product_name_hi || productName
            
            const categoryName = item.stock_id?.category?.name || 
                               item.stock_id?.category?.name_en || 
                               'General'
            
            const icon = getCategoryIcon(categoryName)
            
            return (
              <motion.div
                key={item._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-4 border-slate-700 hover:border-blue-500 rounded-3xl p-12 shadow-2xl transition-all duration-300"
                style={{
                  borderLeft: '12px solid #3b82f6'
                }}
              >
                {/* Icon - HUGE */}
                <div className="text-center mb-8">
                  <div className="text-9xl mb-4">{icon}</div>
                </div>

                {/* Product Name - Bilingual, VERY LARGE */}
                <h3 className="text-5xl font-bold text-white text-center mb-8 leading-tight">
                  {language === 'hi' ? productNameHi : productName}
                  {language === 'hi' && productNameHi !== productName && (
                    <div className="text-3xl text-slate-400 mt-2">
                      {productName}
                    </div>
                  )}
                </h3>

                {/* Quantity - ENORMOUS */}
                <div className="text-center mb-8">
                  <div className="text-[150px] leading-none font-black text-blue-400">
                    {item.issued_qty || item.quantity || 0}
                  </div>
                  <div className="text-4xl text-slate-300 mt-4 font-semibold">
                    {item.unit || item.stock_id?.unit || 'Pcs'}
                  </div>
                </div>

                {/* Issue Date - LARGE */}
                <div className="text-center space-y-3 pt-8 border-t-2 border-slate-700">
                  <p className="text-2xl text-slate-500 font-medium">
                    {language === 'hi' ? 'जारी किया गया:' : 'Issued on:'}
                  </p>
                  <p className="text-3xl text-slate-300 font-semibold">
                    {formatDate(item.issue_date || item.created_at)}
                  </p>
                </div>

                {/* Recipient Info (if different) */}
                {item.recipient_name && item.recipient_name !== user?.full_name && (
                  <div className="text-center mt-6 p-4 bg-blue-500/10 rounded-xl">
                    <p className="text-xl text-blue-300">
                      {language === 'hi' ? 'प्राप्तकर्ता:' : 'Recipient:'} {item.recipient_name}
                    </p>
                  </div>
                )}

                {/* Status Badge */}
                {item.status && (
                  <div className="flex justify-center mt-6">
                    <span className={`px-6 py-3 rounded-full text-2xl font-semibold ${
                      item.status === 'approved' || item.status === 'issued' 
                        ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
                        : item.status === 'pending-audit'
                        ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50'
                        : 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/50'
                    }`}>
                      {item.status === 'approved' || item.status === 'issued'
                        ? (language === 'hi' ? '✅ जारी' : '✅ Issued')
                        : item.status === 'pending-audit'
                        ? (language === 'hi' ? '⏳ जांच में' : '⏳ Under Audit')
                        : item.status}
                    </span>
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      {/* View History Button - LARGE */}
      {issuedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center pt-8"
        >
          <button
            onClick={() => navigate('/dashboard/history')}
            className="flex items-center gap-4 px-12 py-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <History className="h-10 w-10" />
            <span className="text-3xl font-bold">
              {language === 'hi' ? 'सभी इतिहास देखें' : 'View All History'}
            </span>
          </button>
        </motion.div>
      )}
    </div>
  )
}
