import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import { connectDB } from './config/db.js'
import chatRoutes from './routes/chatRoutes.js'
import { registerSocketHandlers } from './socket/socketHandlers.js'

const app = express()
const server = http.createServer(app)

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.use('/api/chat', chatRoutes)

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    credentials: true,
  },
})

registerSocketHandlers(io)

const PORT = Number(process.env.PORT || 5000)

const bootstrap = async () => {
  try {
    await connectDB()

    server.listen(PORT, () => {
      console.log(`Chat server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start chat server', error)
    process.exit(1)
  }
}

bootstrap()
