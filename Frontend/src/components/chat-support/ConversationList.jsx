import { MessageCircleMore } from 'lucide-react'

const formatTime = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ConversationList({ conversations, selectedId, onSelect, onlineUserIds }) {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-400">No conversations yet. Customer messages will appear here.</div>
    )
  }

  return (
    <div className="divide-y divide-slate-800">
      {conversations.map((conversation) => {
        const isSelected = selectedId === conversation.conversationId
        const customerName = conversation.customer?.name || conversation.conversationId.replace('support:', 'User ')
        const isOnline = onlineUserIds.has(conversation.customer?._id)

        return (
          <button
            key={conversation.conversationId}
            onClick={() => onSelect(conversation.conversationId)}
            className={`w-full px-4 py-3 text-left transition-colors ${
              isSelected ? 'bg-slate-800/90' : 'hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white truncate">{customerName}</p>
              <span className="text-[11px] text-slate-500">{formatTime(conversation.latestMessage?.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <p className="text-xs text-slate-400 truncate">{conversation.latestMessage?.text || 'No messages yet'}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
