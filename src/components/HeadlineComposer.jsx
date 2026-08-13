import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  HEADLINE_MIN_PART,
  canOpenHeadlinePart,
  joinHeadlineParts,
  parseHeadlineParts,
} from '../lib/headline'

export default function HeadlineComposer({
  value,
  onChange,
  onBlur,
  placeholder,
  ariaInvalid,
  describedBy,
}) {
  const { t } = useTranslation()
  const [parts, setParts] = useState(() => parseHeadlineParts(value))
  const [active, setActive] = useState(0)
  const [early, setEarly] = useState(false)
  const boxRef = useRef(null)
  const inputRefs = useRef([])

  useEffect(() => {
    const incoming = joinHeadlineParts(parseHeadlineParts(value))
    const current = joinHeadlineParts(parts)
    if (incoming !== current) setParts(parseHeadlineParts(value))
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  function emit(nextParts) {
    setParts(nextParts)
    onChange?.(joinHeadlineParts(nextParts))
  }

  function focusIndex(index) {
    requestAnimationFrame(() => inputRefs.current[index]?.focus())
  }

  function openNext(fromIndex) {
    const current = parts[fromIndex] || ''
    if (!canOpenHeadlinePart(current)) {
      setEarly(true)
      return
    }
    setEarly(false)
    const next = [...parts]
    if (next[fromIndex + 1] == null) next.push('')
    else if (String(next[fromIndex + 1]).trim()) next.splice(fromIndex + 1, 0, '')
    emit(next)
    setActive(fromIndex + 1)
    focusIndex(fromIndex + 1)
  }

  function updatePart(index, text) {
    if (text.includes(',')) {
      const [before, ...rest] = text.split(',')
      const extra = rest.join(',').trim()
      const next = [...parts]
      next[index] = before
      if (!canOpenHeadlinePart(before)) {
        setEarly(true)
        emit(next)
        return
      }
      setEarly(false)
      if (next[index + 1] == null) next.push(extra)
      else if (!String(next[index + 1]).trim()) next[index + 1] = extra || next[index + 1]
      else next.splice(index + 1, 0, extra)
      emit(next)
      setActive(index + 1)
      focusIndex(index + 1)
      return
    }
    setEarly(false)
    const next = [...parts]
    next[index] = text
    emit(next)
  }

  function onKeyDown(event, index) {
    if (event.key === ',') {
      event.preventDefault()
      openNext(index)
      return
    }
    if (event.key === 'Backspace' && !(parts[index] || '') && index > 0) {
      event.preventDefault()
      emit(parts.filter((_, i) => i !== index))
      setActive(index - 1)
      focusIndex(index - 1)
    }
  }

  function onComposerBlur(event) {
    if (boxRef.current?.contains(event.relatedTarget)) return
    const cleaned = parts.map((part) => part.trim()).filter(Boolean)
    emit(cleaned.length ? cleaned : [''])
    setEarly(false)
    onBlur?.()
  }

  const activeText = parts[active] || ''
  const ready = canOpenHeadlinePart(activeText)

  return (
    <>
      <div
        ref={boxRef}
        className={`headline-composer${ariaInvalid ? ' invalid' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) focusIndex(Math.max(0, parts.length - 1))
        }}
        onBlur={onComposerBlur}
      >
        {parts.map((part, index) => (
          <span
            key={index}
            className={`headline-slot${parts.length === 1 ? ' solo' : ''}${active === index ? ' active' : ''}`}
          >
            {index > 0 ? (
              <span className="headline-sep" aria-hidden="true">
                ·
              </span>
            ) : null}
            <input
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              className="headline-part"
              value={part}
              maxLength={120}
              placeholder={
                index === 0 && parts.length === 1 ? placeholder : t('common.headlineNextPlaceholder')
              }
              aria-label={t('common.headlinePartLabel', { n: index + 1 })}
              aria-invalid={Boolean(ariaInvalid)}
              aria-describedby={describedBy}
              onChange={(e) => updatePart(index, e.target.value)}
              onKeyDown={(e) => onKeyDown(e, index)}
              onFocus={() => setActive(index)}
            />
          </span>
        ))}
        {ready ? (
          <button
            type="button"
            className="headline-add"
            aria-label={t('common.headlineAddPart')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openNext(active)}
          >
            +
          </button>
        ) : null}
      </div>
      {early ? (
        <p className="headline-prompt early" role="status">
          {t('common.headlinePromptEarly', { count: HEADLINE_MIN_PART })}
        </p>
      ) : null}
      {ready ? (
        <p className="headline-prompt" role="status">
          {t('common.headlinePrompt')}
        </p>
      ) : null}
    </>
  )
}
