/* global location */
// CB-M06 cookieless pageview beacon: path only, same-origin, no identifiers.
(() => {
  const path = location.pathname;
  if (path.startsWith('/admin') || path.startsWith('/api/') || path.startsWith('/v1/')) return;
  const body = JSON.stringify({ path });
  if (typeof navigator.sendBeacon === 'function') {
    const sent = navigator.sendBeacon('/api/analytics/pageview', new Blob([body], { type: 'application/json' }));
    if (sent) return;
  }
  fetch('/api/analytics/pageview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
})();
