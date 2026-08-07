import { useEffect, useState } from 'react'

/** Branded Opportunistic logo lockup used when listing covers are missing or fail. */
export const DEFAULT_OPPORTUNITY_IMAGE = `${import.meta.env.BASE_URL}defaults/opportunity.png`

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
  const isFallback = !src || current === fallback

  useEffect(() => {
    setCurrent(src || fallback)
  }, [src, fallback])

  return (
    <img
      src={current}
      alt={alt}
      className={`${className}${isFallback ? ' listing-img-fallback' : ''}`.trim()}
      loading={loading}
      onClick={onClick}
      onError={() => {
        if (current !== fallback) setCurrent(fallback)
      }}
    />
  )
}
