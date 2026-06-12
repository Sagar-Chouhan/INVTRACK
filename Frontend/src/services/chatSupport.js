const CHAT_STORAGE_KEY = 'invtrack:support-chats:v1'
const CHAT_EVENT_NAME = 'invtrack-support-chat-updated'

const BOT_REPLIES = {
  stock: 'Stock related query receive ho gaya. Admin team inventory check karke update degi.',
  issue: 'Issue ticket note kar liya gaya hai. Admin side se priority par action hoga.',
  audit: 'Audit support request register ho gayi hai. Assigned admin jaldi contact karega.',
  request: 'Aapka request admin queue me add ho gaya hai. Status jaldi update hoga.',
  default: 'Message receive ho gaya. Admin support team jaldi response degi.'
}

const normalizeText = (value = '') => value.toLowerCase().trim()

const pickBotReply = (messageText = '') => {
  const text = normalizeText(messageText)

  if (text.includes('stock') || text.includes('item') || text.includes('inventory')) {
    return BOT_REPLIES.stock
  }

  if (text.includes('issue') || text.includes('problem') || text.includes('fault')) {
    return BOT_REPLIES.issue
  }

  if (text.includes('audit') || text.includes('verify') || text.includes('verification')) {
    return BOT_REPLIES.audit
  }

  if (text.includes('request') || text.includes('approval')) {
    return BOT_REPLIES.request
  }

  return BOT_REPLIES.default
}

const readChatStore = () => {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeChatStore = (conversations) => {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(conversations))
  window.dispatchEvent(new CustomEvent(CHAT_EVENT_NAME))
}

const buildId = () => {
  const random = Math.random().toString(36).slice(2, 10)
  return `${Date.now()}-${random}`
}

const sortByUpdatedAt = (items = []) => {
  return [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export const chatSupportAPI = {
  subscribe: (callback) => {
    const handler = () => callback(chatSupportAPI.getConversations())
    window.addEventListener(CHAT_EVENT_NAME, handler)
    return () => window.removeEventListener(CHAT_EVENT_NAME, handler)
  },

  getConversations: () => {
    return sortByUpdatedAt(readChatStore())
  },

  getConversationByUser: (user) => {
    if (!user?._id) return null

    const conversations = readChatStore()
    return conversations.find((conversation) => conversation.userId === user._id) || null
  },

  getOrCreateConversation: (user) => {
    if (!user?._id) return null

    const conversations = readChatStore()
    const existing = conversations.find((conversation) => conversation.userId === user._id)

    if (existing) return existing

    const now = new Date().toISOString()
    const newConversation = {
      id: buildId(),
      userId: user._id,
      userName: user.full_name || 'User',
      userRole: user.role || 'user',
      messages: [
        {
          id: buildId(),
          sender: 'bot',
          text: 'Namaste! Yeh automated admin support chat hai. Aap apna sawal bhej sakte hain.',
          timestamp: now,
          automated: true,
          readByAdmin: true,
        },
      ],
      updatedAt: now,
    }

    writeChatStore(sortByUpdatedAt([...conversations, newConversation]))
    return newConversation
  },

  sendUserMessage: (user, text) => {
    if (!user?._id || !text?.trim()) return null

    const messageText = text.trim()
    const now = new Date().toISOString()
    const conversations = readChatStore()

    let conversation = conversations.find((item) => item.userId === user._id)

    if (!conversation) {
      conversation = chatSupportAPI.getOrCreateConversation(user)
      if (!conversation) return null
      return chatSupportAPI.sendUserMessage(user, messageText)
    }

    const userMessage = {
      id: buildId(),
      sender: 'user',
      text: messageText,
      timestamp: now,
      readByAdmin: false,
    }

    const botMessage = {
      id: buildId(),
      sender: 'bot',
      text: pickBotReply(messageText),
      timestamp: new Date(Date.now() + 1000).toISOString(),
      automated: true,
      readByAdmin: true,
    }

    const updatedConversations = conversations.map((item) => {
      if (item.id !== conversation.id) return item

      return {
        ...item,
        userName: user.full_name || item.userName,
        userRole: user.role || item.userRole,
        updatedAt: botMessage.timestamp,
        messages: [...item.messages, userMessage, botMessage],
      }
    })

    writeChatStore(sortByUpdatedAt(updatedConversations))
    return userMessage
  },

  sendAdminMessage: (conversationId, text) => {
    if (!conversationId || !text?.trim()) return null

    const now = new Date().toISOString()
    const message = {
      id: buildId(),
      sender: 'admin',
      text: text.trim(),
      timestamp: now,
      readByAdmin: true,
    }

    const conversations = readChatStore()
    const updatedConversations = conversations.map((conversation) => {
      if (conversation.id !== conversationId) return conversation

      return {
        ...conversation,
        updatedAt: now,
        messages: [...conversation.messages, message],
      }
    })

    writeChatStore(sortByUpdatedAt(updatedConversations))
    return message
  },

  markConversationReadByAdmin: (conversationId) => {
    const conversations = readChatStore()
    const updatedConversations = conversations.map((conversation) => {
      if (conversation.id !== conversationId) return conversation

      return {
        ...conversation,
        messages: conversation.messages.map((message) => ({
          ...message,
          readByAdmin: true,
        })),
      }
    })

    writeChatStore(sortByUpdatedAt(updatedConversations))
  },

  getAdminUnreadCount: () => {
    const conversations = readChatStore()
    return conversations.reduce((count, conversation) => {
      const unread = conversation.messages.some(
        (message) => message.sender === 'user' && message.readByAdmin === false,
      )
      return count + (unread ? 1 : 0)
    }, 0)
  },
}
