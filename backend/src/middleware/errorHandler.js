export function errorHandler(err, req, res, _next) {
  console.error('=== Error Handler ===')
  console.error('URL:', req.method, req.originalUrl)
  console.error('Error:', err)
  console.error('==================')
  
  if (res.headersSent) {
    console.error('Headers already sent, cannot send error response')
    return
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      message: 'Invalid token',
      error: err.message 
    })
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      message: 'Token expired',
      error: err.message 
    })
  }
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field'
    return res.status(400).json({ 
      message: `${field} already exists`,
      error: err.message 
    })
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => e.message)
    })
  }
  
  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      message: 'Invalid ID format',
      error: err.message 
    })
  }
  
  // Default error response
  const status = err.status || err.statusCode || 500
  res.status(status).json({ 
    message: err.message || 'Internal server error',
    stack: err.stack,
    error: err.toString()
  })
}
