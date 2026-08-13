import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import ToastHost from '../components/ToastHost'

const ToastContext = createContext(null)

let toastSeq = 0
let confirmSeq = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(null)

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

  const confirm = useCallback((input) => {
    const opts = typeof input === 'string' ? { message: input } : { ...(input || {}) }
    const message = typeof opts.message === 'string' ? opts.message.trim() : ''
    if (!message) return Promise.resolve(false)
    return new Promise((resolve) => {
      confirmSeq += 1
      setConfirmState({
        id: confirmSeq,
        title: opts.title || '',
        message,
        confirmLabel: opts.confirmLabel || '',
        cancelLabel: opts.cancelLabel || '',
        danger: Boolean(opts.danger),
        resolve,
      })
    })
  }, [])

  const closeConfirm = useCallback((ok) => {
    setConfirmState((cur) => {
      cur?.resolve(Boolean(ok))
      return null
    })
  }, [])

  const api = useMemo(
    () => ({
      push,
      dismiss,
      confirm,
      info: (message, options) => push(message, 'info', options),
      success: (message, options) => push(message, 'success', options),
      error: (message, options) => push(message, 'error', options),
    }),
    [push, dismiss, confirm],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastHost toasts={toasts} onDismiss={dismiss} />
      {confirmState ? (
        <ConfirmDialog
          open
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          danger={confirmState.danger}
          onConfirm={() => closeConfirm(true)}
          onCancel={() => closeConfirm(false)}
        />
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
