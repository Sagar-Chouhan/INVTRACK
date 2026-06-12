import { io } from 'socket.io-client'

const CHAT_SERVER_URL = import.meta.env.VITE_CHAT_SERVER_URL || 'http://localhost:5000'
const CHAT_API_BASE = `${CHAT_SERVER_URL}/api/chat`

const withAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

export const loginChatUser = async ({ name, role, adminAccessKey }) => {
  const response = await fetch(`${CHAT_API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, role, adminAccessKey }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to login chat user')
  }

  const data = await response.json()
  return data
}

export const getConversations = async (token) => {
  const response = await fetch(`${CHAT_API_BASE}/conversations`, {
    headers: withAuthHeaders(token),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch conversations')
  }

  const data = await response.json()
  return data.conversations || []
}

export const getConversationHistory = async (conversationId, token) => {
  const response = await fetch(`${CHAT_API_BASE}/messages/${conversationId}`, {
    headers: withAuthHeaders(token),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch chat history')
  }

  const data = await response.json()
  return data.messages || []
}

export const getOnlineUsers = async (token) => {
  const response = await fetch(`${CHAT_API_BASE}/users/online`, {
    headers: withAuthHeaders(token),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch online users')
  }

  const data = await response.json()
  return data.users || []
}

export const createChatSocket = (token) => {
  return io(CHAT_SERVER_URL, {
    transports: ['websocket'],
    withCredentials: true,
    auth: {
      token,
    },
  })
}
