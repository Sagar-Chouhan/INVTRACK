import { useEffect, useRef } from 'react'
import { Send, CircleDot, Check, CheckCheck } from 'lucide-react'

const formatTimestamp = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChatWindow({
  currentUser,
  messages,
  input,
  setInput,
  onSend,
  onTyping,
  typingLabel,
  selectedConversationLabel,
  receiverOnline,
}) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingLabel])

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">{selectedConversationLabel}</h2>
            <p className="text-xs text-slate-400">Role: {currentUser.role}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs bg-slate-800 text-slate-300 border border-slate-700">
            <CircleDot className={`h-3.5 w-3.5 ${receiverOnline ? 'text-emerald-400' : 'text-slate-500'}`} />
            {receiverOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 bg-slate-950/50">
        {messages.map((message) => {
          const isMine = message.sender?._id === currentUser._id

          return (
            <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-3 py-2 border ${
                  isMine
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-100'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                <div className="mt-1 flex items-center justify-end gap-1.5 text-[11px] opacity-70">
                  <span>{formatTimestamp(message.createdAt)}</span>
                  {isMine && (
                    message.readByRecipient ? (
                      <CheckCheck className="h-3.5 w-3.5 text-cyan-200" aria-label="Seen" />
                    ) : (
                      <Check className="h-3.5 w-3.5" aria-label="Sent" />
                    )
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {typingLabel && (
          <div className="text-xs text-cyan-300 px-2">{typingLabel} is typing...</div>
        )}

        <div ref={endRef} />
      </div>

      <form onSubmit={onSend} className="p-3 border-t border-slate-800 bg-slate-900/70">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              onTyping(true)
            }}
            onBlur={() => onTyping(false)}
            placeholder="Type your message..."
            className="flex-1 min-w-0 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="h-11 w-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-center"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
