export default function PageBackdrop({ image, children, className = '' }) {
  const src = `${import.meta.env.BASE_URL}backgrounds/${image}`

  return (
    <div className={`page page-with-bg ${className}`.trim()}>
      <div className="page-bg" aria-hidden="true">
        <img src={src} alt="" />
        <div className="page-bg-scrim" />
        <div className="page-bg-tint" />
      </div>
      <div className="page-fg">{children}</div>
    </div>
  )
}
