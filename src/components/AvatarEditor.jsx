import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { loadImageFromFile, renderAvatarBlob } from '../lib/avatar'

const VIEWPORT = 280

export default function AvatarEditor({ open, onClose, onSave }) {
  const { t } = useTranslation()
  const fileRef = useRef(null)
  const stageRef = useRef(null)
  const drag = useRef(null)

  const [image, setImage] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setImage(null)
      setZoom(1)
      setRotation(0)
      setOffset({ x: 0, y: 0 })
      setError('')
      setBusy(false)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (image?.src?.startsWith('blob:')) URL.revokeObjectURL(image.src)
    }
  }, [image])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, busy, onClose])

  async function onPick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    try {
      const img = await loadImageFromFile(file)
      if (image?.src?.startsWith('blob:')) URL.revokeObjectURL(image.src)
      setImage(img)
      setZoom(1)
      setRotation(0)
      setOffset({ x: 0, y: 0 })
    } catch (err) {
      setError(err.message || t('profile.avatarLoadError'))
    }
  }

  function onPointerDown(e) {
    if (!image) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    }
  }

  function onPointerMove(e) {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    setOffset({ x: drag.current.ox + dx, y: drag.current.oy + dy })
  }

  function onPointerUp() {
    drag.current = null
  }

  async function save() {
    if (!image || busy) return
    setBusy(true)
    setError('')
    try {
      const blob = await renderAvatarBlob({
        image,
        zoom,
        offsetX: offset.x,
        offsetY: offset.y,
        rotation,
        viewportSize: VIEWPORT,
      })
      await onSave?.(blob)
      onClose?.()
    } catch (err) {
      setError(err.message || t('profile.avatarSaveError'))
    } finally {
      setBusy(false)
    }
  }

  const base = image
    ? Math.min(VIEWPORT / image.naturalWidth, VIEWPORT / image.naturalHeight)
    : 1
  const drawW = image ? image.naturalWidth * base * zoom : 0
  const drawH = image ? image.naturalHeight * base * zoom : 0

  if (!open) return null

  const modal = (
    <div className="avatar-editor-backdrop" role="presentation" onClick={() => !busy && onClose?.()}>
      <div
        className="avatar-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-editor-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="avatar-editor-head">
          <div>
            <p className="eyebrow">{t('profile.avatarEyebrow')}</p>
            <h2 id="avatar-editor-title">{t('profile.avatarTitle')}</h2>
            <p className="muted">{t('profile.avatarHint')}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => !busy && onClose?.()}>
            {t('common.close')}
          </button>
        </header>

        <div
          className="avatar-editor-stage"
          ref={stageRef}
          style={{ width: VIEWPORT, height: VIEWPORT }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {image ? (
            <img
              src={image.src}
              alt=""
              draggable={false}
              className="avatar-editor-img"
              style={{
                width: drawW,
                height: drawH,
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
              }}
            />
          ) : (
            <button
              type="button"
              className="avatar-editor-empty"
              onClick={() => fileRef.current?.click()}
            >
              {t('profile.avatarPick')}
            </button>
          )}
          <div className="avatar-editor-mask" aria-hidden="true" />
        </div>

        <div className="avatar-editor-controls">
          <label className="avatar-editor-zoom">
            <span>{t('profile.avatarZoom')}</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.02"
              value={zoom}
              disabled={!image || busy}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </label>
          <div className="avatar-editor-actions-row">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={!image || busy}
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              {t('profile.avatarRotate')}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={!image || busy}
              onClick={() => {
                setZoom(1)
                setOffset({ x: 0, y: 0 })
                setRotation(0)
              }}
            >
              {t('profile.avatarReset')}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => fileRef.current?.click()}>
              {image ? t('profile.avatarChange') : t('profile.avatarPick')}
            </button>
          </div>
        </div>

        {error ? <p className="avatar-editor-error">{error}</p> : null}

        <footer className="avatar-editor-foot">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => onClose?.()}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn" disabled={!image || busy} onClick={() => void save()}>
            {busy ? t('profile.avatarSaving') : t('profile.avatarSave')}
          </button>
        </footer>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          hidden
          onChange={(e) => void onPick(e)}
        />
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
