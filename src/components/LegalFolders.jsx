import { useEffect, useState } from 'react'

/**
 * Folder-style legal sections + TOC.
 * Avoids href="#id" which breaks in-page section navigation on some routers.
 */
export default function LegalFolders({ items, initialId }) {
  const [openId, setOpenId] = useState(initialId || items[0]?.id || null)

  useEffect(() => {
    if (!initialId) return
    setOpenId(initialId)
    window.requestAnimationFrame(() => {
      document.getElementById(`legal-folder-${initialId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [initialId])

  function selectFolder(id) {
    setOpenId(id)
    window.requestAnimationFrame(() => {
      document.getElementById(`legal-folder-${id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  function toggleFolder(id) {
    setOpenId((prev) => {
      const next = prev === id ? null : id
      if (next) {
        window.requestAnimationFrame(() => {
          document.getElementById(`legal-folder-${next}`)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        })
      }
      return next
    })
  }

  return (
    <section className="container legal-layout">
      <aside className="legal-toc" aria-label="On this page">
        <p className="jarvis-caption">On this page</p>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`legal-toc-btn ${openId === item.id ? 'active' : ''}`}
            onClick={() => selectFolder(item.id)}
          >
            <span className="legal-folder-icon" aria-hidden="true">
              {openId === item.id ? '▾' : '▸'}
            </span>
            {item.title}
          </button>
        ))}
      </aside>

      <article className="legal-body">
        {items.map((item) => {
          const open = openId === item.id
          return (
            <section
              key={item.id}
              id={`legal-folder-${item.id}`}
              className={`legal-block legal-folder ${open ? 'open' : ''}`}
            >
              <button
                type="button"
                className="legal-folder-head"
                aria-expanded={open}
                onClick={() => toggleFolder(item.id)}
              >
                <span className="legal-folder-icon" aria-hidden="true">
                  {open ? '▾' : '▸'}
                </span>
                <h2>{item.title}</h2>
              </button>
              {open ? <div className="legal-folder-body">{item.content}</div> : null}
            </section>
          )
        })}
      </article>
    </section>
  )
}
