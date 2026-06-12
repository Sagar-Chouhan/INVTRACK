import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { PORT } from './config.js'
import { connectMongo } from './db.js'
import authRoutes from './routes/auth.routes.js'
import categoriesRoutes from './routes/categories.routes.js'
import stockRoutes from './routes/stock.routes.js'
import issuesRoutes from './routes/issues.routes.js'
import requestsRoutes from './routes/requests.routes.js'
import auditRoutes from './routes/audit.routes.js'
import usersRoutes from './routes/users.routes.js'
import notificationsRoutes from './routes/notifications.routes.js'
import inchargeRoutes from './routes/incharge.routes.js'
import { errorHandler } from './middleware/errorHandler.js'
import { startAuditReminderScheduler } from './services/auditReminderService.js'
import { backfillLegacyAuditIssues } from './services/auditBackfillService.js'

const app = express()

// CORS configuration for frontend connection
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:3000', 
    'http://127.0.0.1:5173', 
    'http://127.0.0.1:5174',
    'https://invtrack-seven.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(morgan('dev'))
app.use('/uploads', express.static('uploads'))

app.get('/', (_req, res) => {
  res.send('INVTrack API is running')
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'INVTrack backend running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/stock', stockRoutes)
app.use('/api/issues', issuesRoutes)
app.use('/api/requests', requestsRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/incharges', inchargeRoutes)

app.use(errorHandler)

connectMongo().then(async () => {
  await backfillLegacyAuditIssues()

  const server = app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`)
    console.log(`Health: http://localhost:${PORT}/api/health\n`)
    startAuditReminderScheduler()
  })

  server.on('error', (err) => {
    console.error('Server error:', err)
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is in use!`)
    }
    process.exit(1)
  })

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...')
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })

  process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...')
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })
}).catch((err) => {
  console.error('MongoDB connection failed:', err.message)
  process.exit(1)
})


