import { useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'

const applyTawkIdentity = ({ name, email, role }) => {
  if (!window.Tawk_API || typeof window.Tawk_API.setAttributes !== 'function') return false

  const attributes = {
    name: name || 'INVTrack User',
    email: email || `user-${Date.now()}@invtrack.local`,
    role: role || 'user',
  }

  window.Tawk_API.setAttributes(attributes, () => {})
  return true
}

const clearTawkStorage = () => {
  try {
    const localKeys = Object.keys(localStorage)
    localKeys.forEach((key) => {
      if (key.toLowerCase().includes('tawk') || key.toLowerCase().includes('twk')) {
        localStorage.removeItem(key)
      }
    })

    const sessionKeys = Object.keys(sessionStorage)
    sessionKeys.forEach((key) => {
      if (key.toLowerCase().includes('tawk') || key.toLowerCase().includes('twk')) {
        sessionStorage.removeItem(key)
      }
    })
  } catch {
    // ignore storage cleanup issues
  }
}

const resetTawkSession = () => {
  // Legacy helper retained for compatibility; active flow uses guarded reset.
  if (window.Tawk_API && typeof window.Tawk_API.endChat === 'function') {
    window.Tawk_API.endChat()
  }
  clearTawkStorage()
}

export default function TawkIdentitySync() {
  const { user, isAuthenticated } = useAuth()
  const previousModeRef = useRef('')
  const previousAttributesRef = useRef('')
  const handlersBoundRef = useRef(false)
  const resetInProgressRef = useRef(false)

  const guardedReset = ({ hideWidget }) => {
    if (!window.Tawk_API || resetInProgressRef.current) return

    resetInProgressRef.current = true

    try {
      if (typeof window.Tawk_API.endChat === 'function') {
        window.Tawk_API.endChat()
      }

      if (typeof window.Tawk_API.logout === 'function') {
        window.Tawk_API.logout()
      }

      if (hideWidget && typeof window.Tawk_API.hideWidget === 'function') {
        window.Tawk_API.hideWidget()
      }

      clearTawkStorage()
    } finally {
      setTimeout(() => {
        resetInProgressRef.current = false
      }, 200)
    }
  }

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    const maxAttempts = 25

    const sync = () => {
      if (cancelled) return

      if (!window.Tawk_API) {
        if (attempts < maxAttempts) {
          attempts += 1
          setTimeout(sync, 300)
        }
        return
      }

      if (!handlersBoundRef.current) {
        window.Tawk_API.onChatHidden = () => {
          // Clear thread on close without triggering a recursive hide event.
          guardedReset({ hideWidget: false })
        }

        handlersBoundRef.current = true
      }

      const mode = !isAuthenticated || !user
        ? 'guest'
        : user.role === 'admin'
          ? 'admin'
          : `user:${user._id || user.email || 'anonymous'}`

      const hasModeSwitched = previousModeRef.current && previousModeRef.current !== mode

      if (hasModeSwitched) {
        // On account/role switch, clear previous thread first.
        guardedReset({ hideWidget: mode !== 'guest' && mode !== 'admin' ? false : true })
      }

      previousModeRef.current = mode

      if (!isAuthenticated || !user) {
        previousAttributesRef.current = ''
        guardedReset({ hideWidget: true })
        return
      }

      if (user.role === 'admin') {
        previousAttributesRef.current = ''
        guardedReset({ hideWidget: true })
        return
      }

      if (typeof window.Tawk_API.showWidget === 'function') {
        window.Tawk_API.showWidget()
      }

      const attributesKey = `${user.full_name || ''}|${user.email || ''}|${user.role || ''}`

      if (previousAttributesRef.current !== attributesKey) {
        const applied = applyTawkIdentity({
          name: user.full_name,
          email: user.email,
          role: user.role,
        })

        if (applied) {
          previousAttributesRef.current = attributesKey
        }
      }
    }

    sync()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?._id, user?.full_name, user?.email, user?.role])

  return null
}
