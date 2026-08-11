/**
 * SPA fallback for unknown paths: remember the URL, then load the app shell.
 * External file keeps the document CSP free of inline scripts.
 */
;(function () {
  try {
    sessionStorage.setItem(
      'opportunistic-redirect',
      location.pathname + location.search + location.hash,
    )
  } catch (e) {
    /* ignore */
  }
  location.replace('/' + location.search + location.hash)
})()
