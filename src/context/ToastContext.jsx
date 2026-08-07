import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import ToastHost from '../components/ToastHost'

const ToastContext = createContext(null)

let toastSeq = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((item) => item.id !== id))
  }, [])

  const push = useCallback(
    (message, type = 'info', options = {}) => {
      const text = typeof message === 'string' ? message.trim() : ''
      if (!text) return null
      const id = ++toastSeq
      const duration = options.duration ?? (type === 'error' ? 5600 : 3600)
      setToasts((list) => [...list.slice(-4), { id, message: text, type }])
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      push,
      dismiss,
      info: (message, options) => push(message, 'info', options),
      success: (message, options) => push(message, 'success', options),
      error: (message, options) => push(message, 'error', options),
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
