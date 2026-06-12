import { useState } from 'react'
import { ShieldCheck, UserRound, UserCog2 } from 'lucide-react'

export default function ChatAuthPanel({ onStart }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('user')
  const [adminAccessKey, setAdminAccessKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!name.trim()) return

    setLoading(true)
    setError('')
    try {
      await onStart({ name: name.trim(), role, adminAccessKey: adminAccessKey.trim() })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 rounded-3xl border border-slate-700/70 overflow-hidden bg-slate-900/60 backdrop-blur-xl shadow-[0_20px_70px_rgba(15,23,42,0.65)]">
        <div className="p-8 sm:p-10 bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-transparent border-b lg:border-b-0 lg:border-r border-slate-700/60">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/25 text-cyan-300 flex items-center justify-center mb-6">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">Realtime Support Chat</h1>
          <p className="text-slate-300 mt-4 text-sm sm:text-base">
            Multi-user support chat with admin role, typing indicator, online presence, and MongoDB chat history.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Socket.IO realtime messaging
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Role based experience for customer and admin
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Persistent message history from database
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Select Role</label>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  role === 'user'
                    ? 'border-cyan-400 bg-cyan-500/15 text-white'
                    : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <UserRound className="h-4 w-4" /> Customer
                </div>
                <p className="text-xs mt-1 opacity-80">Chat with support admin</p>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  role === 'admin'
                    ? 'border-blue-400 bg-blue-500/15 text-white'
                    : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <UserCog2 className="h-4 w-4" /> Admin
                </div>
                <p className="text-xs mt-1 opacity-80">Handle multiple customer chats</p>
              </button>
            </div>
          </div>

          {role === 'admin' && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Admin Access Key</label>
              <input
                type="password"
                value={adminAccessKey}
                onChange={(event) => setAdminAccessKey(event.target.value)}
                placeholder="Enter admin access key"
                className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || (role === 'admin' && !adminAccessKey.trim())}
            className="w-full rounded-xl py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold disabled:opacity-60"
          >
            {loading ? 'Connecting...' : 'Start Chat'}
          </button>
        </form>
      </div>
    </div>
  )
}
