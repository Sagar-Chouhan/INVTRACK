import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Eye, EyeOff, Mail, Lock, Loader2, Languages, Box } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Login() {
  const { login } = useAuth()
  const { t, language, toggleLanguage } = useLanguage()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = language === 'hi' ? 'ईमेल आवश्यक है' : 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = language === 'hi' ? 'कृपया एक मान्य ईमेल दर्ज करें' : 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = language === 'hi' ? 'पासवर्ड आवश्यक है' : 'Password is required'
    } else if (formData.password.length < 4) {
      newErrors.password = language === 'hi' ? 'पासवर्ड कम से कम 4 अक्षर का होना चाहिए' : 'Password must be at least 4 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    const result = await login(formData.email, formData.password)

    if (!result.success) {
      setErrors({ form: result.error })
    }

    setIsLoading(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="theme-auth-dark min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
            <Box className="h-8 w-8 text-[#8b2cf5]" />
          </div>
          <h1 className="text-4xl font-semibold text-white mb-2">
            {language === 'hi' ? 'लॉगिन करें' : 'Login'}
          </h1>
          <p className="text-white/90 text-lg">
            {language === 'hi' ? 'स्टॉक प्रबंधन सिस्टम' : 'Stock Management System'}
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel-heavy rounded-2xl p-7">
          {/* Language Toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-slate-200 transition-colors"
            >
              <Languages className="h-4 w-4" />
              {language === 'hi' ? 'English' : 'हिंदी'}
            </button>
          </div>

          <h2 className="text-3xl font-semibold text-white mb-2 text-center">
            {language === 'hi' ? 'लॉगिन' : 'Login'}
          </h2>
          <p className="text-slate-300 text-center mb-6">
            {language === 'hi' ? 'अपने खाते में लॉगिन करें' : 'Sign in to your account'}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  className={`w-full input-glass rounded-lg py-3 px-10 placeholder:text-slate-400 focus:outline-none transition-all ${errors.email ? '!border-red-500' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={language === 'hi' ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password'}
                  className={`w-full input-glass rounded-lg py-3 px-10 placeholder:text-slate-400 focus:outline-none transition-all ${errors.password ? '!border-red-500' : ''}`}
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

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {language === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-3d btn-3d-blue py-3.5 rounded-xl flex items-center justify-center gap-2 text-lg font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {language === 'hi' ? 'लॉगिन हो रहा है...' : 'Signing in...'}
                </>
              ) : (
                <>{language === 'hi' ? 'लॉगिन करें' : 'Sign In'}</>
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-300">
              {language === 'hi' ? 'खाता नहीं है?' : "Don't have an account?"}{' '}
              <Link
                to="/signup"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {language === 'hi' ? 'साइन अप करें' : 'Create Account'}
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          {/* <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center mb-3">
              {language === 'hi' ? 'डेमो क्रेडेंशियल्स:' : 'Demo Credentials:'}
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-200">
              <div className="flex justify-between text-slate-400">
                <span>{t('email')}:</span>
                <span className="text-slate-700 font-mono">admin@example.com</span>
              </div>
              <div className="flex justify-between text-slate-400 mt-1">
                <span>{t('password')}:</span>
                <span className="text-slate-700 font-mono">Admin@1234</span>
              </div>
            </div>
          </div> */}
        </div>
      </motion.div>
    </div>
  )
}

