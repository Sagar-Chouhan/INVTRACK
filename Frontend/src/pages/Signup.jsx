import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Eye, EyeOff, Mail, Lock, User, Phone, Briefcase, Loader2, Languages, Box } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Signup() {
  const { signup } = useAuth()
  const { t, language, toggleLanguage } = useLanguage()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.mobile) {
      newErrors.mobile = 'Mobile number is required'
    } else if (!/^\d{10}$/.test(formData.mobile.replace(/[^0-9]/g, ''))) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    const result = await signup({
      full_name: formData.full_name,
      email: formData.email,
      mobile: formData.mobile,
      password: formData.password,
      role: formData.role,
    })

    if (!result.success) {
      setErrors({ form: result.error })
    }

    setIsLoading(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="theme-auth-dark min-h-screen flex items-center justify-center bg-gradient-to-b from-[#b646d8] via-[#e835b7] to-[#ff2b78] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
            <Box className="h-8 w-8 text-[#8b2cf5]" />
          </div>
          <h1 className="text-4xl font-semibold text-white mb-2">
            {language === 'hi' ? 'खाता बनाएं' : 'Create Account'}
          </h1>
          <p className="text-white/90 text-lg">
            {language === 'hi' ? 'हमारे स्टॉक सिस्टम से जुड़ें' : 'Join our stock management system'}
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white border border-white/50 rounded-2xl p-7 shadow-[0_18px_40px_rgba(58,12,84,0.28)]">
          {/* Language Toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
            >
              <Languages className="h-4 w-4" />
              {language === 'hi' ? 'English' : 'हिंदी'}
            </button>
          </div>

          <h2 className="text-3xl font-semibold text-slate-900 mb-2 text-center">
            {language === 'hi' ? 'साइन अप' : 'Sign Up'}
          </h2>
          <p className="text-slate-500 text-center mb-6">
            {language === 'hi' ? 'नया खाता बनाएं' : 'Create your account'}
          </p>

          {errors.form && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4"
            >
              {errors.form}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder={language === 'hi' ? 'अपना पूरा नाम दर्ज करें' : 'Enter your full name'}
                  className={`w-full bg-white border ${
                    errors.full_name ? 'border-red-500' : 'border-slate-700'
                  } rounded-lg py-3 px-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition-all`}
                />
              </div>
              {errors.full_name && (
                <p className="text-red-400 text-sm mt-1">{errors.full_name}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={language === 'hi' ? 'अपना ईमेल दर्ज करें' : 'Enter your email'}
                  className={`w-full bg-white border ${
                    errors.email ? 'border-red-500' : 'border-slate-700'
                  } rounded-lg py-3 px-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition-all`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Mobile Number Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder={language === 'hi' ? 'अपना मोबाइल नंबर दर्ज करें' : 'Enter your mobile number'}
                  className={`w-full bg-white border ${
                    errors.mobile ? 'border-red-500' : 'border-slate-700'
                  } rounded-lg py-3 px-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition-all`}
                />
              </div>
              {errors.mobile && (
                <p className="text-red-400 text-sm mt-1">{errors.mobile}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'hi' ? 'भूमिका' : 'Role'}
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-300 rounded-lg py-3 px-10 text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  <option value="user">{language === 'hi' ? 'उपयोगकर्ता' : 'User'}</option>
                  <option value="auditor">{language === 'hi' ? 'ऑडिटर' : 'Audit Person'}</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={language === 'hi' ? 'पासवर्ड बनाएं' : 'Create a password'}
                  className={`w-full bg-white border ${
                    errors.password ? 'border-red-500' : 'border-slate-700'
                  } rounded-lg py-3 px-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {language === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={language === 'hi' ? 'अपने पासवर्ड की पुष्टि करें' : 'Confirm your password'}
                  className={`w-full bg-white border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-slate-700'
                  } rounded-lg py-3 px-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#8a2be2] to-[#e1007b] hover:from-[#7a22cb] hover:to-[#cc006e] text-white font-medium py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {language === 'hi' ? 'खाता बनाया जा रहा है...' : 'Creating Account...'}
                </>
              ) : (
                language === 'hi' ? 'खाता बनाएं' : 'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-600">
              {language === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
              <Link
                to="/login"
                className="text-fuchsia-600 hover:text-fuchsia-500 font-medium transition-colors"
              >
                {language === 'hi' ? 'लॉगिन करें' : 'Sign In'}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
