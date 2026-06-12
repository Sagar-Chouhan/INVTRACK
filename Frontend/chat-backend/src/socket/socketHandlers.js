import { Message } from '../models/Message.js'
import { User } from '../models/User.js'
import { verifyChatToken } from '../config/auth.js'

const ADMIN_ROOM = 'support-admin-room'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

const getConversationId = (sender, receiverId) => {
  if (sender.role === 'admin') {
    return `support:${receiverId}`
  }

  return `support:${sender._id}`
}

const emitOnlineUsers = async (io) => {
  const onlineUsers = await User.find({ isOnline: true }).select('_id name role isOnline')
  io.emit('online_users', onlineUsers)
}

const markConversationRead = async ({ io, userId, conversationId }) => {
  if (!conversationId || !userId) return

  const unread = await Message.find({
    conversationId,
    receiver: userId,
    readByRecipient: false,
  }).select('_id')

  if (!unread.length) return

  const unreadIds = unread.map((item) => item._id)
  const readAt = new Date()

  await Message.updateMany(
    { _id: { $in: unreadIds } },
    { $set: { readByRecipient: true, readAt } },
  )

  io.to(conversationId).emit('messages_read', {
    conversationId,
    readerId: userId,
    messageIds: unreadIds,
    readAt,
  })

  io.to(ADMIN_ROOM).emit('messages_read', {
    conversationId,
    readerId: userId,
    messageIds: unreadIds,
    readAt,
  })
}

export const registerSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token

      if (!token) {
        return next(new Error('Missing socket auth token'))
      }

      const decoded = verifyChatToken(token)
      const user = await User.findById(decoded.sub)

      if (!user) {
        return next(new Error('User not found for token'))
      }

      socket.data.userId = user._id.toString()
      socket.data.role = user.role
      return next()
    } catch (error) {
      return next(new Error(`Socket auth failed: ${error.message}`))
    }
  })

  io.on('connection', (socket) => {
    const attachConnectedUser = async () => {
      const user = await User.findById(socket.data.userId)
      if (!user) return

      user.isOnline = true
      user.socketId = socket.id
      await user.save()

      if (user.role === 'admin') {
        socket.join(ADMIN_ROOM)
      } else {
        socket.join(`support:${user._id}`)
      }

      socket.emit('user_registered', user)
      io.emit('user_status_changed', {
        userId: user._id,
        isOnline: true,
        role: user.role,
      })
      await emitOnlineUsers(io)
    }

    attachConnectedUser()

    socket.on('join_conversation', ({ conversationId }) => {
      if (!conversationId) return

      if (socket.data.role !== 'admin') {
        const allowedConversation = `support:${socket.data.userId}`
        if (conversationId !== allowedConversation) {
          return
        }
      }

      socket.join(conversationId)

      markConversationRead({
        io,
        userId: socket.data.userId,
        conversationId,
      })
    })

    socket.on('mark_read', async ({ conversationId }) => {
      if (!conversationId) return

      if (socket.data.role !== 'admin') {
        const allowedConversation = `support:${socket.data.userId}`
        if (conversationId !== allowedConversation) {
          return
        }
      }

      await markConversationRead({
        io,
        userId: socket.data.userId,
        conversationId,
      })
    })

    socket.on('send_message', async ({ receiverId, text }) => {
      if (!text?.trim()) return

      const sender = await User.findById(socket.data.userId)
      if (!sender) return

      let targetReceiverId = receiverId
      if (sender.role !== 'admin') {
        const admin = await User.findOne({ role: 'admin' }).select('_id')
        targetReceiverId = admin?._id || null
      }

      if (sender.role === 'admin' && !targetReceiverId) {
        return
      }

      const conversationId = getConversationId(sender, targetReceiverId || sender._id.toString())

      const message = await Message.create({
        conversationId,
        sender: sender._id,
        receiver: targetReceiverId || null,
        text: text.trim(),
        readByRecipient: false,
      })

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', '_id name role isOnline')
        .populate('receiver', '_id name role isOnline')

      const cutoffDate = new Date(Date.now() - ONE_DAY_MS)
      await Message.deleteMany({
        conversationId,
        createdAt: { $lt: cutoffDate },
      })

      io.to(conversationId).emit('receive_message', populatedMessage)
      io.to(ADMIN_ROOM).emit('receive_message', populatedMessage)

      io.to(ADMIN_ROOM).emit('conversation_updated', {
        conversationId,
        latestMessage: populatedMessage,
      })
    })

    socket.on('typing', async ({ receiverId, isTyping }) => {
      const sender = await User.findById(socket.data.userId)
      if (!sender) return

      const conversationId = getConversationId(sender, receiverId || sender._id.toString())

      io.to(conversationId).emit('typing_status', {
        conversationId,
        senderId: sender._id,
        senderName: sender.name,
        senderRole: sender.role,
        isTyping: Boolean(isTyping),
      })

      io.to(ADMIN_ROOM).emit('typing_status', {
        conversationId,
        senderId: sender._id,
        senderName: sender.name,
        senderRole: sender.role,
        isTyping: Boolean(isTyping),
      })
    })

    socket.on('disconnect', async () => {
      if (!socket.data?.userId) return

      const user = await User.findById(socket.data.userId)
      if (!user) return

      user.isOnline = false
      user.socketId = null
      await user.save()

      io.emit('user_status_changed', {
        userId: user._id,
        isOnline: false,
        role: user.role,
      })
      await emitOnlineUsers(io)
    })
  })
}
