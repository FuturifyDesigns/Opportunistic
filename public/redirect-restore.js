/* Restore SPA deep-link before Vite boots (GitHub Pages OAuth / refresh). */
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
