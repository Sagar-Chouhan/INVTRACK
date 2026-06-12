import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { toast } from 'sonner'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (savedToken && savedUser) {
        try {
          setToken(savedToken)
          setUser(JSON.parse(savedUser))
          // Verify token is still valid
          const userData = await authAPI.getMe()
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  // Login function
  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password)
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      setToken(data.token)
      setUser(data.user)
      
      toast.success(`Welcome back, ${data.user.full_name}!`)
      navigate('/dashboard')
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Signup function
  const signup = async (userData) => {
    try {
      const data = await authAPI.signup(userData)
      toast.success('Account created successfully! Please login.')
      navigate('/login')
      return { success: true, data }
    } catch (error) {
      const message = error.response?.data?.message || 
                      error.response?.data?.errors?.[0]?.msg || 
                      'Signup failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
      toast.success('Logged out successfully')
      navigate('/login')
    }
  }

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role
  }

  // Check if user is authenticated
  const isAuthenticated = !!token && !!user

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
