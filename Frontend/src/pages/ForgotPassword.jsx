import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { Mail, ArrowLeft, Loader2, KeyRound, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function ForgotPassword() {
  const [step, setStep] = useState(1) // 1: email, 2: OTP, 3: new password, 4: success
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOTP = async (e) => {
    e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await authAPI.forgotPassword(email)
      toast.success('OTP sent to your email!')
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await authAPI.verifyOTP(email, otp)
      toast.success('OTP verified!')
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await authAPI.resetPassword(email, otp, newPassword)
      toast.success('Password reset successful!')
      setStep(4)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            INVTrack
          </h1>
          <p className="text-slate-400 mt-2">Password Recovery</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-xl">
          {/* Step 1: Enter Email */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-semibold text-white mb-2 text-center">
                Forgot Password?
              </h2>
              <p className="text-slate-400 text-center mb-6">
                Enter your email to receive a reset OTP
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 px-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Enter OTP */}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-semibold text-white mb-2 text-center">
                Enter OTP
              </h2>
              <p className="text-slate-400 text-center mb-6">
                We sent a 6-digit code to {email}
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    OTP Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 px-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-widest text-lg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-slate-400 hover:text-slate-300 py-2"
                >
                  Didn't receive code? Try again
                </button>
              </form>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <>
              <h2 className="text-2xl font-semibold text-white mb-2 text-center">
                Reset Password
              </h2>
              <p className="text-slate-400 text-center mb-6">
                Create a new password for your account
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 px-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 px-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                Password Reset!
              </h2>
              <p className="text-slate-400 mb-6">
                Your password has been successfully reset. You can now login with your new password.
              </p>
              <Link
                to="/login"
                className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium py-3 px-8 rounded-lg transition-all"
              >
                Go to Login
              </Link>
            </div>
          )}

          {/* Back to Login */}
          {step !== 4 && (
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-slate-400 hover:text-slate-300 inline-flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
