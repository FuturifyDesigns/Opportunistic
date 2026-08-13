import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation()
  const titleId = useId()
  const descId = useId()
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const id = window.requestAnimationFrame(() => cancelRef.current?.focus())
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel?.()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.cancelAnimationFrame(id)
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onCancel])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="confirm-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.()
      }}
    >
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <p className="eyebrow">{t('common.confirmEyebrow')}</p>
        <h2 id={titleId}>{title || t('common.confirmTitle')}</h2>
        <p id={descId}>{message}</p>
        <div className="confirm-actions">
          <button ref={cancelRef} type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel || t('common.cancel')}
          </button>
          <button type="button" className={`btn${danger ? ' btn-danger' : ''}`} onClick={onConfirm}>
            {confirmLabel || t('common.ok')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
