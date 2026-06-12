import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquareShare, UsersRound } from 'lucide-react'
import { toast } from 'sonner'
import ChatAuthPanel from '../components/chat-support/ChatAuthPanel'
import ConversationList from '../components/chat-support/ConversationList'
import ChatWindow from '../components/chat-support/ChatWindow'
import {
  createChatSocket,
  getConversationHistory,
  getConversations,
  getOnlineUsers,
  loginChatUser,
} from '../services/chatApi'

const getConversationIdForUser = (userId) => `support:${userId}`

export default function SupportChat() {
  const [chatUser, setChatUser] = useState(null)
  const [chatToken, setChatToken] = useState('')
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typingLabel, setTypingLabel] = useState('')
  const [onlineUsers, setOnlineUsers] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const typingTimeoutRef = useRef(null)
  const selectedConversationRef = useRef(null)

  useEffect(() => {
    selectedConversationRef.current = selectedConversation
  }, [selectedConversation])

  const onlineUserIds = useMemo(
    () => new Set(onlineUsers.filter((user) => user.isOnline).map((user) => user._id)),
    [onlineUsers],
  )

  const selectedConversationInfo = useMemo(
    () => conversations.find((conversation) => conversation.conversationId === selectedConversation),
    [conversations, selectedConversation],
  )

  const selectedReceiverId = useMemo(() => {
    if (!selectedConversation?.startsWith('support:')) return null
    return selectedConversation.replace('support:', '')
  }, [selectedConversation])

  const loadHistory = async (conversationId) => {
    if (!conversationId || !chatToken) return

    setLoadingHistory(true)
    try {
      const history = await getConversationHistory(conversationId, chatToken)
      setMessages(history)
      socket?.emit('mark_read', { conversationId })
    } finally {
      setLoadingHistory(false)
    }
  }

  const refreshAdminConversations = async (tokenOverride, roleOverride) => {
    const effectiveToken = tokenOverride || chatToken
    const effectiveRole = roleOverride || chatUser?.role

    if (effectiveRole !== 'admin' || !effectiveToken) return

    const latestConversations = await getConversations(effectiveToken)
    setConversations(latestConversations)

    if (!selectedConversation && latestConversations.length > 0) {
      setSelectedConversation(latestConversations[0].conversationId)
      await loadHistory(latestConversations[0].conversationId)
    }
  }

  const refreshOnlineUsers = async (tokenOverride) => {
    const effectiveToken = tokenOverride || chatToken
    if (!effectiveToken) return

    const users = await getOnlineUsers(effectiveToken)
    setOnlineUsers(users)
  }

  const startChat = async ({ name, role, adminAccessKey }) => {
    try {
      const { user, token } = await loginChatUser({ name, role, adminAccessKey })
      setChatUser(user)
      setChatToken(token)

      const chatSocket = createChatSocket(token)
      setSocket(chatSocket)

      chatSocket.on('connect', () => {
        setConnected(true)
      })

      chatSocket.on('disconnect', () => {
        setConnected(false)
      })

      chatSocket.on('online_users', (users) => {
        setOnlineUsers(users)
      })

      chatSocket.on('receive_message', async (message) => {
        if (message.conversationId === selectedConversationRef.current) {
          setMessages((previous) => {
            if (previous.some((item) => item._id === message._id)) return previous
            return [...previous, message]
          })

          chatSocket.emit('mark_read', { conversationId: message.conversationId })
        }

        if (user.role === 'admin') {
          await refreshAdminConversations(token, user.role)
        }
      })

      chatSocket.on('messages_read', ({ conversationId, messageIds, readAt }) => {
        if (!Array.isArray(messageIds) || !messageIds.length) return
        if (conversationId !== selectedConversationRef.current) return

        const readSet = new Set(messageIds.map(String))
        setMessages((previous) =>
          previous.map((item) =>
            readSet.has(String(item._id))
              ? { ...item, readByRecipient: true, readAt: readAt || new Date().toISOString() }
              : item,
          ),
        )
      })

      chatSocket.on('typing_status', (payload) => {
      if (!payload?.isTyping || payload.senderId === user._id || payload.conversationId !== selectedConversationRef.current) {
        if (payload?.conversationId === selectedConversationRef.current) {
          setTypingLabel('')
        }
        return
      }

      setTypingLabel(payload.senderName)
      })

      chatSocket.on('conversation_updated', async () => {
        if (user.role === 'admin') {
          await refreshAdminConversations(token, user.role)
        }
      })

      chatSocket.on('user_status_changed', async () => {
        await refreshOnlineUsers(token)
      })

      const users = await getOnlineUsers(token)
      setOnlineUsers(users)

      if (user.role === 'admin') {
        const latestConversations = await getConversations(token)
        setConversations(latestConversations)

        if (latestConversations.length > 0) {
          const initialConversationId = latestConversations[0].conversationId
          setSelectedConversation(initialConversationId)
          const history = await getConversationHistory(initialConversationId, token)
          setMessages(history)
          chatSocket.emit('mark_read', { conversationId: initialConversationId })
        }
      } else {
        const conversationId = getConversationIdForUser(user._id)
        setSelectedConversation(conversationId)
        setConversations([
          {
            conversationId,
            customer: user,
            latestMessage: null,
          },
        ])
        chatSocket.emit('join_conversation', { conversationId })
        const history = await getConversationHistory(conversationId, token)
        setMessages(history)
        chatSocket.emit('mark_read', { conversationId })
      }

      toast.success('Support chat connected')
    } catch (error) {
      toast.error(error?.message || 'Unable to connect support chat')
      throw error
    }
  }

  useEffect(() => {
    if (!socket || !selectedConversation) return
    socket.emit('join_conversation', { conversationId: selectedConversation })
    loadHistory(selectedConversation)
  }, [socket, selectedConversation, chatToken])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (socket) {
        socket.disconnect()
      }
    }
  }, [socket])

  const handleTyping = (isTyping) => {
    if (!socket || !chatUser || !selectedConversation) return

    socket.emit('typing', {
      receiverId: chatUser.role === 'admin' ? selectedReceiverId : chatUser._id,
      isTyping,
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', {
          receiverId: chatUser.role === 'admin' ? selectedReceiverId : chatUser._id,
          isTyping: false,
        })
      }, 900)
    }
  }

  const handleSend = (event) => {
    event.preventDefault()

    if (!socket || !chatUser || !input.trim() || !selectedConversation) return

    socket.emit('send_message', {
      receiverId: chatUser.role === 'admin' ? selectedReceiverId : null,
      text: input.trim(),
    })

    setInput('')
    setTypingLabel('')
    handleTyping(false)
    toast.success('Message sent')
  }

  if (!chatUser) {
    return <ChatAuthPanel onStart={startChat} />
  }

  const headerTitle = chatUser.role === 'admin' ? 'Admin Support Console' : 'Customer Support Chat'
  const selectedLabel =
    chatUser.role === 'admin'
      ? selectedConversationInfo?.customer?.name || 'Select a conversation'
      : 'Support Team'

  const receiverOnline =
    chatUser.role === 'admin'
      ? onlineUserIds.has(selectedReceiverId)
      : onlineUsers.some((user) => user.role === 'admin' && user.isOnline)

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 sm:py-6">
      <div className="max-w-7xl mx-auto rounded-3xl border border-slate-700/80 overflow-hidden bg-slate-900/50 backdrop-blur-xl shadow-[0_20px_90px_rgba(2,8,23,0.6)]">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                <MessageSquareShare className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-white">{headerTitle}</h1>
                <p className="text-xs text-slate-400">Signed in as {chatUser.name} ({chatUser.role})</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full text-xs border border-slate-700 bg-slate-800 text-slate-200">
              <UsersRound className="h-4 w-4 text-cyan-300" />
              {connected ? 'Socket Connected' : 'Socket Disconnected'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[70vh]">
          {chatUser.role === 'admin' && (
            <aside className="lg:col-span-4 border-r border-slate-800 bg-slate-900/70">
              <div className="px-4 py-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white">Customer Conversations</h2>
                <p className="text-xs text-slate-400 mt-0.5">Select a user to view history and reply</p>
              </div>
              <ConversationList
                conversations={conversations}
                selectedId={selectedConversation}
                onSelect={setSelectedConversation}
                onlineUserIds={onlineUserIds}
              />
            </aside>
          )}

          <section className={chatUser.role === 'admin' ? 'lg:col-span-8' : 'lg:col-span-12'}>
            {selectedConversation ? (
              <ChatWindow
                currentUser={chatUser}
                messages={messages}
                input={input}
                setInput={setInput}
                onSend={handleSend}
                onTyping={handleTyping}
                typingLabel={typingLabel}
                selectedConversationLabel={selectedLabel}
                receiverOnline={receiverOnline}
              />
            ) : (
              <div className="h-full grid place-items-center text-slate-500 text-sm">
                {loadingHistory ? 'Loading history...' : 'Select a conversation to begin'}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
