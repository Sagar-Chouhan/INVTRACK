import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://invtrack-ljey.onrender.com/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API endpoints
export const authAPI = {
  // Login with email and password
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  // Signup for new users (user/auditor)
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData)
    return response.data
  },

  // Get current user info
  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  // Admin-only: Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // Forgot password - send OTP
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp })
    return response.data
  },

  // Reset password
  resetPassword: async (email, otp, newPassword) => {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword })
    return response.data
  },
}

// Stock API endpoints
export const stockAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/stock', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/stock/${id}`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/stock', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(`/stock/${id}`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/stock/${id}`)
    return response.data
  },
}

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get('/categories')
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/categories', data)
    return response.data
  },
}

// Issues API
export const issuesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/issues', { params })
    return response.data
  },

  getPendingSummaryByCategory: async () => {
    const response = await api.get('/issues/pending-summary-by-category')
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/issues', data)
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/issues/${id}`)
    return response.data
  },
}

// Requests API
export const requestsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/requests', { params })
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/requests', data)
    return response.data
  },

  approve: async (id) => {
    const response = await api.patch(`/requests/${id}`, { status: 'approved' })
    return response.data
  },

  reject: async (id, reason) => {
    const response = await api.patch(`/requests/${id}`, { status: 'rejected', adminResponse: reason })
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/requests/${id}`)
    return response.data
  },
}

// Audit API
export const auditAPI = {
  getAssigned: async () => {
    const response = await api.get('/audit/assigned')
    return response.data
  },

  getPending: async () => {
    const response = await api.get('/issues/pending-audit')
    return response.data
  },

  verify: async (issueId, data) => {
    const response = await api.post(`/audit/verify/${issueId}`, data)
    return response.data
  },

  uploadPhoto: async (formData) => {
    const response = await api.post('/audit/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  getLogs: async () => {
    const response = await api.get('/audit/logs')
    return response.data
  },

  getHistory: async () => {
    try {
      const response = await api.get('/audit/logs')
      return response.data
    } catch (error) {
      // Some roles (e.g. user) are not allowed on /audit/logs.
      // Fallback to /issues and normalize verified entries for History UI.
      if (error.response?.status !== 403) {
        throw error
      }

      const fallbackResponse = await api.get('/issues')
      const rawIssues = fallbackResponse.data?.issues || fallbackResponse.data || []

      if (!Array.isArray(rawIssues)) {
        return []
      }

      const historyItems = rawIssues
        .filter((issue) => !['pending', 'pending-audit'].includes(issue?.status))
        .map((issue) => ({
          _id: issue._id,
          issue_id: issue,
          stock_id: issue.stock_id,
          issued_qty: issue.issued_qty || 0,
          used_qty: issue.used_qty || 0,
          returned_good: issue.returned_good || 0,
          returned_faulty: issue.returned_faulty || 0,
          fault_reason: issue.fault_reason || issue.notes || '',
          photo_url: issue.photo_url,
          verified_at: issue.verified_at || issue.updated_at || issue.created_at,
          verification_date: issue.verified_at || issue.updated_at || issue.created_at,
          status: issue.status || 'verified',
        }))

      return historyItems
    }
  },
}

// Users API (admin only)
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/users')
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  },

  updateCategories: async (id, categories) => {
    const response = await api.put(`/users/${id}/categories`, { assigned_categories: categories })
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },
}

// Notifications API
export const notificationsAPI = {
  getAll: async () => {
    const response = await api.get('/notifications')
    return response.data
  },

  markRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
  },
}

export default api
