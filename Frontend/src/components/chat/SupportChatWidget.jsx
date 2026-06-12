import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Send, X, User as UserIcon, ShieldCheck } from 'lucide-react'
import { createChatSocket, getConversationHistory, loginChatUser } from '../../services/chatApi'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

const filterLastDayMessages = (items = []) => {
  const cutoff = Date.now() - ONE_DAY_MS
  return items.filter((item) => {
    const time = new Date(item?.createdAt || item?.timestamp || 0).getTime()
    return Number.isFinite(time) && time >= cutoff
  })
}

const formatChatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const senderStyles = {
  user: 'bg-blue-600 text-white ml-auto',
  admin: 'bg-emerald-600 text-white',
}

export default function SupportChatWidget({ user }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [chatUser, setChatUser] = useState(null)
  const [chatToken, setChatToken] = useState('')
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)
  const conversationIdRef = useRef(null)

  const canChat = useMemo(() => ['user', 'auditor'].includes(user?.role), [user?.role])

  useEffect(() => {
    if (!user?._id || !canChat) return

    let isMounted = true

    let chatSocket = null

    const connectChat = async () => {
      try {
        setError('')

        const { user: loggedChatUser, token } = await loginChatUser({
          name: user.full_name || 'User',
          role: 'user',
        })

        if (!isMounted) return

        setChatUser(loggedChatUser)
        setChatToken(token)

        const conversationId = `support:${loggedChatUser._id}`
        conversationIdRef.current = conversationId

        const history = await getConversationHistory(conversationId, token)
        if (!isMounted) return
        setMessages(filterLastDayMessages(history))

        chatSocket = createChatSocket(token)
        setSocket(chatSocket)

        chatSocket.on('connect', () => {
          setConnected(true)
          chatSocket.emit('join_conversation', { conversationId })
        })

        chatSocket.on('disconnect', () => {
          setConnected(false)
        })

        chatSocket.on('receive_message', (message) => {
          if (message.conversationId !== conversationIdRef.current) return

          setMessages((previous) => {
            if (previous.some((item) => item._id === message._id)) return previous
            return filterLastDayMessages([...previous, message])
          })
        })

        chatSocket.on('connect_error', (socketError) => {
          setError(socketError?.message || 'Realtime connection failed')
        })
      } catch (connectError) {
        setError(connectError?.message || 'Failed to load support chat')
      }
    }

    connectChat()

    return () => {
      isMounted = false
      if (chatSocket) {
        chatSocket.disconnect()
      }
    }
  }, [user?._id, user?.full_name, canChat])

  useEffect(() => {
    if (!open) return
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [open, messages])

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [socket])

  const handleSend = (event) => {
    event.preventDefault()

    if (!input.trim()) return

    if (!chatUser || !chatToken) {
      setError('Chat user session is not ready. Please reopen chat.')
      return
    }

    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      text: input.trim(),
      createdAt: new Date().toISOString(),
      sender: {
        _id: chatUser._id,
        role: 'user',
      },
    }

    setMessages((previous) => filterLastDayMessages([...previous, optimisticMessage]))

    if (!socket || !socket.connected) {
      setError('Realtime connection not ready. Please wait a second and try again.')
      return
    }

    socket.emit('send_message', {
      text: optimisticMessage.text,
      receiverId: null,
    })

    const token = chatToken
    const conversationId = conversationIdRef.current
    setTimeout(async () => {
      if (!conversationId || !token) return
      try {
        const latest = await getConversationHistory(conversationId, token)
        setMessages(filterLastDayMessages(latest))
      } catch {
        // Ignore silent refresh failure; realtime events still update UI.
      }
    }, 500)

    setInput('')
    setError('')
  }

  if (!canChat) return null

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="w-[340px] sm:w-[380px] h-[520px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl mb-4 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Admin Support Chat</p>
              <p className="text-xs text-slate-400">Realtime chat with history • {connected ? 'Online' : 'Connecting...'}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-950/60">
            {error && (
              <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1">
                {error}
              </p>
            )}

            {messages.map((message) => {
              const senderRole = message?.sender?.role === 'admin' ? 'admin' : 'user'
              const isUser = message?.sender?._id === chatUser?._id
              const sender = isUser ? 'user' : senderRole

              return (
                <div key={message._id} className={`max-w-[85%] ${isUser ? 'ml-auto' : ''}`}>
                  <div className={`rounded-xl px-3 py-2 ${senderStyles[sender] || senderStyles.user}`}>
                    <div className="flex items-center gap-1.5 mb-1 opacity-80">
                      {sender === 'admin' ? (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      ) : (
                        <UserIcon className="h-3.5 w-3.5" />
                      )}
                      <span className="text-[11px] font-semibold uppercase tracking-wide">
                        {sender === 'admin' ? 'Admin' : 'You'}
                      </span>
                    </div>
                    <p className="text-sm leading-snug whitespace-pre-wrap break-words">{message.text}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 px-1">{formatChatTime(message.createdAt)}</p>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-slate-700 bg-slate-900">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type your message for admin..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((previous) => !previous)}
        className="relative w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 shadow-xl text-white flex items-center justify-center transition-transform hover:scale-105"
        aria-label="Open support chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  )
}
