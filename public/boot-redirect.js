/**
 * Restore a deep-link path saved by the SPA fallback before the app bundle loads.
 * Kept as an external file so the document CSP can omit 'unsafe-inline' for scripts.
 */
;(function () {
  try {
    var redirect = sessionStorage.getItem('opportunistic-redirect')
    if (!redirect) return
    sessionStorage.removeItem('opportunistic-redirect')
    if (redirect.indexOf('/Opportunistic') === 0) {
      redirect = redirect.replace(/^\/Opportunistic/, '') || '/'
    }
    if (redirect && redirect !== '/') {
      history.replaceState(null, '', redirect)
    }
  } catch (e) {
    /* ignore */
  }
})()
