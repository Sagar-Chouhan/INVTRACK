import { useEffect, useMemo, useState } from 'react'
import { MessageSquareText, Send, ShieldCheck, User as UserIcon } from 'lucide-react'
import {
  createChatSocket,
  getConversationHistory,
  getConversations,
  getOnlineUsers,
  loginChatUser,
} from '../../services/chatApi'

const formatChatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const senderBadge = {
  user: 'bg-blue-500/20 text-blue-300',
  admin: 'bg-emerald-500/20 text-emerald-300',
}

export default function AdminChatInbox({ currentUser }) {
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [replyText, setReplyText] = useState('')
  const [socket, setSocket] = useState(null)
  const [chatUser, setChatUser] = useState(null)
  const [chatToken, setChatToken] = useState('')
  const [onlineUsers, setOnlineUsers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser?._id || currentUser?.role !== 'admin') return

    let isMounted = true

    let chatSocket = null

    const connectAdmin = async () => {
      try {
        setError('')

        const adminAccessKey = import.meta.env.VITE_CHAT_ADMIN_ACCESS_KEY || ''
        if (!adminAccessKey) {
          throw new Error('VITE_CHAT_ADMIN_ACCESS_KEY is missing for admin chat')
        }

        const { user, token } = await loginChatUser({
          name: currentUser.full_name || 'Admin',
          role: 'admin',
          adminAccessKey,
        })

        if (!isMounted) return

        setChatUser(user)
        setChatToken(token)

        const [conversationList, online] = await Promise.all([
          getConversations(token),
          getOnlineUsers(token),
        ])

        if (!isMounted) return

        setConversations(conversationList)
        setOnlineUsers(online)

        const initialConversationId = conversationList[0]?.conversationId || null
        setSelectedId(initialConversationId)

        if (initialConversationId) {
          const history = await getConversationHistory(initialConversationId, token)
          if (!isMounted) return
          setMessages(history)
        }

        chatSocket = createChatSocket(token)
        setSocket(chatSocket)

        chatSocket.on('connect', () => {
          if (selectedId) {
            chatSocket.emit('join_conversation', { conversationId: selectedId })
          }
        })

        chatSocket.on('receive_message', (message) => {
          if (message.conversationId !== selectedId) return
          setMessages((previous) => {
            if (previous.some((item) => item._id === message._id)) return previous
            return [...previous, message]
          })

          chatSocket.emit('mark_read', { conversationId: message.conversationId })
        })

        chatSocket.on('messages_read', ({ conversationId, messageIds, readAt }) => {
          if (!Array.isArray(messageIds) || conversationId !== selectedId) return
          const readSet = new Set(messageIds.map(String))
          setMessages((previous) =>
            previous.map((item) =>
              readSet.has(String(item._id))
                ? { ...item, readByRecipient: true, readAt: readAt || new Date().toISOString() }
                : item,
            ),
          )
        })

        chatSocket.on('conversation_updated', async () => {
          const latestConversations = await getConversations(token)
          if (!isMounted) return
          setConversations(latestConversations)
        })

        chatSocket.on('online_users', (users) => {
          setOnlineUsers(users)
        })

        chatSocket.on('user_status_changed', async () => {
          const onlineUsersData = await getOnlineUsers(token)
          if (!isMounted) return
          setOnlineUsers(onlineUsersData)
        })

        chatSocket.on('connect_error', (socketError) => {
          setError(socketError?.message || 'Realtime connection failed')
        })
      } catch (connectError) {
        setError(connectError?.message || 'Failed to connect admin chat')
      }
    }

    connectAdmin()

    return () => {
      isMounted = false
      if (chatSocket) {
        chatSocket.disconnect()
      }
    }
  }, [currentUser?._id, currentUser?.full_name, currentUser?.role])

  useEffect(() => {
    if (!chatToken || !selectedId) return

    const loadSelectedHistory = async () => {
      const history = await getConversationHistory(selectedId, chatToken)
      setMessages(history)
    }

    loadSelectedHistory()
    socket?.emit('join_conversation', { conversationId: selectedId })
    socket?.emit('mark_read', { conversationId: selectedId })
  }, [selectedId, chatToken, socket])

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [socket])

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.conversationId === selectedId) || null,
    [conversations, selectedId],
  )

  const onlineUserIds = useMemo(
    () => new Set(onlineUsers.filter((user) => user.isOnline).map((user) => user._id)),
    [onlineUsers],
  )

  const isConversationOnline = (conversation) => {
    const customerId = conversation?.customer?._id
    if (!customerId) return false
    return onlineUserIds.has(customerId)
  }

  const handleReply = (event) => {
    event.preventDefault()

    if (!replyText.trim() || !selectedConversation?.conversationId || !socket || !chatUser) return

    socket.emit('send_message', {
      receiverId: selectedConversation.customer?._id,
      text: replyText.trim(),
    })

    setReplyText('')
  }

  if (currentUser?.role !== 'admin') return null

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
          <MessageSquareText className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Support Chats</h3>
          <p className="text-xs text-slate-400">MongoDB persisted chat history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
        <div className="lg:col-span-4 border-r border-slate-800 max-h-[420px] overflow-y-auto">
          {error && (
            <p className="m-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1">
              {error}
            </p>
          )}

          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No support chats yet.</p>
          ) : (
            conversations.map((conversation) => {
              const lastMessage = conversation.latestMessage

              return (
                <button
                  key={conversation.conversationId}
                  onClick={() => setSelectedId(conversation.conversationId)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-800 transition-colors ${
                    selectedId === conversation.conversationId
                      ? 'bg-slate-800/80'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white truncate">{conversation.customer?.name || 'User'}</p>
                    <span className={`w-2.5 h-2.5 rounded-full ${isConversationOnline(conversation) ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  </div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 mt-0.5">{conversation.customer?.role || 'user'}</p>
                  <p className="text-xs text-slate-400 truncate mt-1">{lastMessage?.text}</p>
                </button>
              )
            })
          )}
        </div>

        <div className="lg:col-span-8 flex flex-col max-h-[420px]">
          {selectedConversation ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
                {messages.map((message) => {
                  const senderRole = message?.sender?.role === 'admin' ? 'admin' : 'user'
                  const senderName = senderRole === 'admin' ? 'Admin' : selectedConversation.customer?.name || 'User'

                  return (
                    <div key={message._id} className="bg-slate-800/70 border border-slate-700 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${senderBadge[senderRole] || senderBadge.user}`}>
                          {senderRole === 'admin' ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : (
                            <UserIcon className="h-3 w-3" />
                          )}
                          {senderName}
                        </div>
                        <p className="text-[11px] text-slate-500">{formatChatTime(message.createdAt)}</p>
                      </div>
                      <p className="text-sm text-slate-100 break-words whitespace-pre-wrap">{message.text}</p>
                    </div>
                  )
                })}
              </div>

              <form onSubmit={handleReply} className="p-3 border-t border-slate-800 bg-slate-900">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder="Reply as admin..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-slate-500 text-sm">
              Select a conversation to view messages.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
