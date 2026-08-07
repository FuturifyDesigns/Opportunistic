export default function ToastHost({ toasts, onDismiss }) {
  if (!toasts?.length) return null

  return (
    <div className="toast-host" aria-live="polite" aria-relevant="additions text">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          role={toast.type === 'error' ? 'alert' : 'status'}
        >
          <span className="toast-dot" aria-hidden="true" />
          <p className="toast-message">{toast.message}</p>
          <button
            type="button"
            className="toast-close"
            aria-label="Close"
            onClick={() => onDismiss(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
