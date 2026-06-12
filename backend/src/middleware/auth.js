import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config.js'
import { User } from '../models/User.js'

export async function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.slice(7)
    
    let payload
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      console.error('JWT verification error:', err.message)
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    const user = await User.findById(payload.sub)
      .select('-password_hash')
      .populate('assigned_categories', 'name')
    if (!user) {
      console.error('User not found for token payload:', payload.sub)
      return res.status(401).json({ message: 'User not found' })
    }
    
    req.user = user
    next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    return res.status(500).json({ message: 'Authentication error' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        console.error('No user in request - auth middleware might have failed')
        return res.status(401).json({ message: 'Unauthorized' })
      }
      
      if (!roles.includes(req.user.role)) {
        console.error(`User role '${req.user.role}' not in allowed roles:`, roles)
        return res.status(403).json({ message: 'Forbidden - insufficient permissions' })
      }
      
      next()
    } catch (err) {
      console.error('Role check error:', err)
      return res.status(500).json({ message: 'Authorization error' })
    }
  }
}
