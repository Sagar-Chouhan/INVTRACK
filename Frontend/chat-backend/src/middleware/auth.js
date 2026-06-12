import { verifyChatToken } from '../config/auth.js'
import { User } from '../models/User.js'

const getTokenFromHeader = (headerValue = '') => {
  if (!headerValue.startsWith('Bearer ')) return null
  return headerValue.slice(7).trim()
}

export const authenticateHttp = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization || '')

    if (!token) {
      return res.status(401).json({ message: 'Missing authorization token' })
    }

    const decoded = verifyChatToken(token)
    const user = await User.findById(decoded.sub)

    if (!user) {
      return res.status(401).json({ message: 'User not found for token' })
    }

    req.user = user
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token', error: error.message })
  }
}

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin role required' })
  }

  return next()
}
