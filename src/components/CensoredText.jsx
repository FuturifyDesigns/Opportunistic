import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { splitProfanity } from '../lib/profanity'

export default function CensoredText({ text, as: Tag = 'span', className }) {
  const { t } = useTranslation()
  const value = text == null ? '' : String(text)
  const parts = useMemo(() => splitProfanity(value), [value])
  if (!value) return null

  const hasCensor = parts.some((p) => p.censored)
  if (!hasCensor) {
    return Tag === 'span' && !className ? value : <Tag className={className}>{value}</Tag>
  }

  const label = t('common.censored')
  return (
    <Tag className={className}>
      {parts.map((p, i) =>
        p.censored ? (
          <span key={i} className="censored-word" title={label} aria-label={label}>
            <span aria-hidden="true">{p.text}</span>
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </Tag>
  )
}
