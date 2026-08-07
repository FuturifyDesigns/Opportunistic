import { useEffect, useState } from 'react'

export const DEFAULT_OPPORTUNITY_IMAGE = `${import.meta.env.BASE_URL}defaults/opportunity.svg`

/**
 * Listing cover/gallery image with a branded fallback when the URL is missing or fails.
 */
export default function ListingImage({
  src,
  alt = '',
  className = '',
  loading = 'lazy',
  onClick,
}) {
  const fallback = DEFAULT_OPPORTUNITY_IMAGE
  const [current, setCurrent] = useState(src || fallback)

  useEffect(() => {
    setCurrent(src || fallback)
  }, [src, fallback])

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading={loading}
      onClick={onClick}
      onError={() => {
        if (current !== fallback) setCurrent(fallback)
      }}
    />
  )
}
