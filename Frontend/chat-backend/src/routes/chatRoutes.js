import express from 'express'
import { Message } from '../models/Message.js'
import { User } from '../models/User.js'
import { signChatToken } from '../config/auth.js'
import { authenticateHttp, requireAdmin } from '../middleware/auth.js'

const router = express.Router()
const ONE_DAY_MS = 24 * 60 * 60 * 1000

router.post('/auth/login', async (req, res) => {
  try {
    const { name, role, adminAccessKey } = req.body

    if (!name || !role) {
      return res.status(400).json({ message: 'name and role are required' })
    }

    const normalizedName = name.trim()
    const normalizedRole = role === 'admin' ? 'admin' : 'user'

    if (normalizedRole === 'admin') {
      const expectedKey = process.env.ADMIN_ACCESS_KEY

      if (!expectedKey) {
        return res.status(500).json({ message: 'ADMIN_ACCESS_KEY is not configured' })
      }

      if (adminAccessKey !== expectedKey) {
        return res.status(403).json({ message: 'Invalid admin access key' })
      }
    }

    const user = await User.findOneAndUpdate(
      { name: normalizedName, role: normalizedRole },
      { $setOnInsert: { name: normalizedName, role: normalizedRole } },
      { upsert: true, new: true },
    )

    const token = signChatToken(user)

    return res.json({ user, token })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login user', error: error.message })
  }
})

router.get('/auth/me', authenticateHttp, async (req, res) => {
  return res.json({ user: req.user })
})

router.get('/users/online', authenticateHttp, async (_req, res) => {
  try {
    const users = await User.find({ isOnline: true }).select('_id name role isOnline').sort({ role: -1, name: 1 })
    return res.json({ users })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch online users', error: error.message })
  }
})

router.get('/conversations', authenticateHttp, requireAdmin, async (_req, res) => {
  try {
    const cutoffDate = new Date(Date.now() - ONE_DAY_MS)

    const latestMessages = await Message.aggregate([
      { $match: { createdAt: { $gte: cutoffDate } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          messageId: { $first: '$_id' },
          sender: { $first: '$sender' },
          text: { $first: '$text' },
          createdAt: { $first: '$createdAt' },
        },
      },
      { $sort: { createdAt: -1 } },
    ])

    const senderIds = latestMessages.map((item) => item.sender).filter(Boolean)
    const customerIds = latestMessages
      .map((item) => item._id?.replace('support:', ''))
      .filter(Boolean)

    const users = await User.find({
      _id: { $in: [...senderIds, ...customerIds] },
    }).select('_id name role isOnline')
    const userById = new Map(users.map((item) => [item._id.toString(), item]))

    const conversations = latestMessages.map((item) => ({
      conversationId: item._id,
      customer: userById.get(item._id?.replace('support:', '')) || null,
      latestMessage: {
        _id: item.messageId,
        text: item.text,
        createdAt: item.createdAt,
      },
      latestSender: userById.get(String(item.sender)) || null,
    }))

    return res.json({ conversations })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch conversations', error: error.message })
  }
})

router.get('/messages/:conversationId', authenticateHttp, async (req, res) => {
  try {
    const { conversationId } = req.params
    const cutoffDate = new Date(Date.now() - ONE_DAY_MS)

    if (req.user.role !== 'admin') {
      const expectedConversationId = `support:${req.user._id}`
      if (conversationId !== expectedConversationId) {
        return res.status(403).json({ message: 'You are not allowed to view this conversation' })
      }
    }

    await Message.deleteMany({
      conversationId,
      createdAt: { $lt: cutoffDate },
    })

    const messages = await Message.find({
      conversationId,
      createdAt: { $gte: cutoffDate },
    })
      .populate('sender', '_id name role isOnline')
      .populate('receiver', '_id name role isOnline')
      .sort({ createdAt: 1 })

    return res.json({ messages })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch message history', error: error.message })
  }
})

export default router
