import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { issuesAPI, auditAPI } from '../services/api'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Camera,
  Upload,
  X,
  Check,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  Save,
  ArrowLeft
} from 'lucide-react'

export default function VerifyStock() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, language } = useLanguage()
  
  const [stockItem, setStockItem] = useState(null)
  const [photos, setPhotos] = useState([])
  const [photoPreview, setPhotoPreview] = useState([])
  const [physicalCount, setPhysicalCount] = useState({
    total: 0,
    used: 0,
    good: 0,
    faulty: 0
  })
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  useEffect(() => {
    loadStockItem()
  }, [itemId])

  const loadStockItem = async () => {
    try {
      setLoading(true)
      // Load the specific issue to verify
      const issuesData = await issuesAPI.getAll()
      const allIssues = issuesData.issues || issuesData || []
      const item = allIssues.find(issue => issue._id === itemId)
      
      if (!item) {
        toast.error(language === 'hi' ? 'वस्तु नहीं मिली' : 'Item not found')
        navigate('/dashboard')
        return
      }
      
      setStockItem(item)
      // Initialize physical count with system quantity
      setPhysicalCount({
        total: item.issued_qty || item.quantity || 0,
        used: 0,
        good: item.issued_qty || item.quantity || 0,
        faulty: 0
      })
    } catch (error) {
      console.error('Error loading stock item:', error)
      toast.error(language === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    // Validate file count (max 5 photos)
    if (photos.length + files.length > 5) {
      toast.error(language === 'hi' 
        ? 'अधिकतम 5 फोटो अपलोड कर सकते हैं' 
        : 'Maximum 5 photos allowed')
      return
    }

    // Validate file sizes (max 5MB each)
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024)
    if (invalidFiles.length > 0) {
      toast.error(language === 'hi' 
        ? 'प्रत्येक फोटो 5MB से कम होनी चाहिए' 
        : 'Each photo must be less than 5MB')
      return
    }

    // Add files
    setPhotos([...photos, ...files])

    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })

    toast.success(language === 'hi' 
      ? `${files.length} फोटो जोड़ी गई` 
      : `${files.length} photo(s) added`)
  }

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index))
    setPhotoPreview(photoPreview.filter((_, i) => i !== index))
  }

  const handleNumberPadClick = (digit) => {
    const currentTotal = physicalCount.total.toString()
    if (digit === 'backspace') {
      const newTotal = Math.floor(physicalCount.total / 10)
      setPhysicalCount(prev => ({ ...prev, total: newTotal }))
    } else if (digit === 'clear') {
      setPhysicalCount(prev => ({ ...prev, total: 0 }))
    } else {
      const newTotal = parseFloat(currentTotal + digit)
      if (newTotal <= 999999) { // Max limit
        setPhysicalCount(prev => ({ ...prev, total: newTotal }))
      }
    }
  }

  const validateCounts = () => {
    const sum = physicalCount.used + physicalCount.good + physicalCount.faulty
    return sum === physicalCount.total
  }

  const handleSubmit = async () => {
    // Validations
    if (photos.length === 0) {
      toast.error(language === 'hi' 
        ? 'कृपया कम से कम 1 फोटो अपलोड करें' 
        : 'Please upload at least 1 photo')
      return
    }

    if (!validateCounts()) {
      toast.error(language === 'hi' 
        ? 'विवरण कुल गणना से मेल खाना चाहिए' 
        : 'Breakdown must match total count')
      return
    }

    try {
      setSubmitting(true)
      
      // Upload first photo only (backend expects single photo_url)
      const formData = new FormData()
      formData.append('photo', photos[0])
      
      const uploadResponse = await auditAPI.uploadPhoto(formData)
      const photoUrl = uploadResponse.url
      const photoId = uploadResponse.photo_id
      
      if (!photoUrl) {
        toast.error(language === 'hi' 
          ? 'फोटो अपलोड विफल' 
          : 'Photo upload failed')
        return
      }

      // Call API to submit verification
      await auditAPI.verify(stockItem._id, {
        photo_url: photoUrl,
        photo_id: photoId,
        used_qty: physicalCount.used,
        returned_good: physicalCount.good,
        returned_faulty: physicalCount.faulty,
        fault_reason: remarks || ''
      })

      toast.success(language === 'hi' 
        ? '✅ सत्यापन सफलतापूर्वक जमा किया गया!' 
        : '✅ Verification submitted successfully!')
      
      // Navigate back to dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)

    } catch (error) {
      console.error('Error submitting verification:', error)
      toast.error(error.response?.data?.message || (language === 'hi' 
        ? 'सत्यापन जमा करने में त्रुटि' 
        : 'Error submitting verification'))
    } finally {
      setSubmitting(false)
    }
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

  if (!stockItem) {
    return (
      <div className="text-center py-20">
        <p className="text-3xl text-slate-400">
          {language === 'hi' ? 'वस्तु नहीं मिली' : 'Item not found'}
        </p>
      </div>
    )
  }

  const systemQty = stockItem.issued_qty || stockItem.quantity || 0
  const discrepancy = physicalCount.total - systemQty
  const hasDiscrepancy = discrepancy !== 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xl"
      >
        <ArrowLeft className="h-6 w-6" />
        {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-5xl font-bold text-white mb-4">
          {language === 'hi' ? '🔍 स्टॉक जांचें' : '🔍 Verify Stock'}
        </h1>
      </motion.div>

      {/* Product Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-slate-900 to-slate-800 border-4 border-blue-700 rounded-3xl p-10 shadow-2xl"
      >
        <h2 className="text-4xl font-bold text-white mb-4">
          {stockItem.stock_id?.product_name_hi || stockItem.stock_id?.product_name || stockItem.item_name}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-2xl">
          <div>
            <span className="text-slate-400">{language === 'hi' ? 'सिस्टम मात्रा:' : 'System Quantity:'}</span>
            <span className="ml-3 text-blue-400 font-bold">{systemQty} {stockItem.unit || 'units'}</span>
          </div>
          {stockItem.verification_deadline && (
            <div>
              <span className="text-slate-400">{language === 'hi' ? 'समय सीमा:' : 'Deadline:'}</span>
              <span className="ml-3 text-yellow-400 font-bold">
                {new Date(stockItem.verification_deadline).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Photo Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/80 border-4 border-slate-700 rounded-3xl p-10"
      >
        <h3 className="text-4xl font-bold text-white mb-6 text-center">
          📸 {language === 'hi' ? 'फोटो अपलोड करें' : 'Upload Photos'}
        </h3>

        {/* Upload buttons - LARGE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-4 p-12 bg-slate-800 hover:bg-slate-700 border-4 border-dashed border-slate-600 rounded-2xl transition-all"
          >
            <Camera className="h-20 w-20 text-blue-400" />
            <span className="text-3xl font-semibold text-white">
              {language === 'hi' ? 'फोटो लें' : 'Take Photo'}
            </span>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-4 p-12 bg-slate-800 hover:bg-slate-700 border-4 border-dashed border-slate-600 rounded-2xl transition-all"
          >
            <Upload className="h-20 w-20 text-green-400" />
            <span className="text-3xl font-semibold text-white">
              {language === 'hi' ? 'फाइल चुनें' : 'Choose File'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </button>
        </div>

        {/* Photo Previews */}
        {photoPreview.length > 0 && (
          <div>
            <p className="text-2xl text-slate-400 mb-4">
              {language === 'hi' ? 'अपलोड की गई फोटो:' : 'Uploaded Photos:'} ({photos.length}/5)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photoPreview.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded-xl border-2 border-slate-700"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 rounded-b-lg p-2 text-xs">
                    <p className="text-slate-300">{(photos[index].size / 1024).toFixed(1)} KB</p>
                    <p className="text-slate-300">{photos[index].type}</p>
                  </div>
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Physical Count Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-900/80 border-4 border-slate-700 rounded-3xl p-10"
      >
        <h3 className="text-4xl font-bold text-white mb-8 text-center">
          {language === 'hi' ? '📊 वास्तविक गणना' : '📊 Physical Count'}
        </h3>

        {/* Total Count Display - HUGE */}
        <div className="text-center mb-8">
          <p className="text-3xl text-slate-400 mb-4">
            {language === 'hi' ? 'कुल गिना गया:' : 'Total Counted:'}
          </p>
          <div className="text-[120px] leading-none font-black text-blue-400 mb-4">
            {physicalCount.total}
          </div>
          <p className="text-4xl text-slate-300">{stockItem.unit || 'units'}</p>
        </div>

        {/* Number Pad - LARGE */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberPadClick(num.toString())}
              className="py-8 bg-slate-800 hover:bg-slate-700 text-white text-5xl font-bold rounded-xl transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleNumberPadClick('backspace')}
            className="py-8 bg-red-600 hover:bg-red-500 text-white text-3xl font-bold rounded-xl transition-colors"
          >
            ⌫
          </button>
          <button
            onClick={() => handleNumberPadClick('0')}
            className="py-8 bg-slate-800 hover:bg-slate-700 text-white text-5xl font-bold rounded-xl transition-colors"
          >
            0
          </button>
          <button
            onClick={() => handleNumberPadClick('clear')}
            className="py-8 bg-orange-600 hover:bg-orange-500 text-white text-3xl font-bold rounded-xl transition-colors"
          >
            C
          </button>
        </div>

        {/* Condition Breakdown */}
        <div className="space-y-4">
          <h4 className="text-3xl font-bold text-white text-center mb-6">
            {language === 'hi' ? 'स्थिति विवरण' : 'Condition Breakdown'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-xl p-6">
              <label className="block text-2xl text-yellow-400 mb-3 font-semibold">
                {language === 'hi' ? 'उपयोग में' : 'Used'}
              </label>
              <input
                type="number"
                min="0"
                value={physicalCount.used}
                onChange={(e) => setPhysicalCount(prev => ({
                  ...prev,
                  used: parseFloat(e.target.value) || 0
                }))}
                className="w-full bg-slate-700 border-2 border-slate-600 rounded-lg py-4 px-6 text-white text-3xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div className="bg-slate-800 rounded-xl p-6">
              <label className="block text-2xl text-green-400 mb-3 font-semibold">
                {language === 'hi' ? 'अच्छा' : 'Good'}
              </label>
              <input
                type="number"
                min="0"
                value={physicalCount.good}
                onChange={(e) => setPhysicalCount(prev => ({
                  ...prev,
                  good: parseFloat(e.target.value) || 0
                }))}
                className="w-full bg-slate-700 border-2 border-slate-600 rounded-lg py-4 px-6 text-white text-3xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="bg-slate-800 rounded-xl p-6">
              <label className="block text-2xl text-red-400 mb-3 font-semibold">
                {language === 'hi' ? 'खराब' : 'Faulty'}
              </label>
              <input
                type="number"
                min="0"
                value={physicalCount.faulty}
                onChange={(e) => setPhysicalCount(prev => ({
                  ...prev,
                  faulty: parseFloat(e.target.value) || 0
                }))}
                className="w-full bg-slate-700 border-2 border-slate-600 rounded-lg py-4 px-6 text-white text-3xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Validation Check */}
          <div className={`p-6 rounded-xl text-center text-2xl font-semibold ${
            validateCounts() 
              ? 'bg-green-500/20 text-green-400 border-2 border-green-500' 
              : 'bg-red-500/20 text-red-400 border-2 border-red-500'
          }`}>
            {validateCounts() ? (
              <span>✅ {language === 'hi' ? 'कुल मिलान: सही' : 'Total Match: Correct'}</span>
            ) : (
              <span>
                ❌ {language === 'hi' ? 'कुल मिलान नहीं: ' : 'Total Mismatch: '}
                {physicalCount.used + physicalCount.good + physicalCount.faulty} ≠ {physicalCount.total}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Remarks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-900/80 border-4 border-slate-700 rounded-3xl p-10"
      >
        <h3 className="text-4xl font-bold text-white mb-6 text-center">
          💬 {language === 'hi' ? 'टिप्पणी' : 'Remarks'}
        </h3>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder={language === 'hi' 
            ? 'कोई टिप्पणी या नोट्स दर्ज करें...' 
            : 'Enter any remarks or notes...'}
          rows={5}
          className="w-full bg-slate-800 border-2 border-slate-600 rounded-xl py-6 px-8 text-white text-2xl placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </motion.div>

      {/* Discrepancy Warning */}
      {hasDiscrepancy && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-red-900/20 border-4 border-red-500 rounded-3xl p-10"
        >
          <div className="flex items-start gap-6">
            <AlertTriangle className="h-16 w-16 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-4xl font-bold text-red-400 mb-4">
                ⚠️ {language === 'hi' ? 'चेतावनी: विसंगति!' : 'Warning: Discrepancy!'}
              </h4>
              <div className="space-y-3 text-2xl text-red-300">
                <p>
                  <span className="font-semibold">{language === 'hi' ? 'सिस्टम गणना:' : 'System Count:'}</span> {systemQty} {stockItem.unit}
                </p>
                <p>
                  <span className="font-semibold">{language === 'hi' ? 'आपकी गणना:' : 'Your Count:'}</span> {physicalCount.total} {stockItem.unit}
                </p>
                <p>
                  <span className="font-semibold">{language === 'hi' ? 'अंतर:' : 'Difference:'}</span>{' '}
                  <span className={discrepancy > 0 ? 'text-green-400' : 'text-red-400'}>
                    {discrepancy > 0 ? '+' : ''}{discrepancy} {stockItem.unit}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Submit Button - LARGE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center gap-6"
      >
        <button
          onClick={() => navigate('/dashboard')}
          disabled={submitting}
          className="px-12 py-8 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl text-3xl font-bold transition-colors disabled:opacity-50"
        >
          {language === 'hi' ? 'रद्द करें' : 'Cancel'}
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting || photos.length === 0 || !validateCounts()}
          className="flex items-center gap-4 px-16 py-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-2xl text-3xl font-bold shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin" />
              {language === 'hi' ? 'जमा हो रहा है...' : 'Submitting...'}
            </>
          ) : (
            <>
              <Check className="h-10 w-10" />
              {language === 'hi' ? '✓ सत्यापन जमा करें' : '✓ Submit Verification'}
            </>
          )}
        </button>
      </motion.div>
    </div>
  )
}
