// CB-M15-P1-LAUNCH-GATE-001: owner launch readiness.
//
// Every measured item reads a real row or a configured value. Items that cannot
// be measured are listed as MANUAL and never turn PASS by themselves, so the
// page cannot declare the product launched on its own.

export const LAUNCH_ITEMS = Object.freeze([
  Object.freeze({ id: 'owner-recovery', label: 'Primary and recovery passkey', kind: 'measured' }),
  Object.freeze({ id: 'billing', label: 'Entitling subscription and Stripe settings', kind: 'measured' }),
  Object.freeze({ id: 'api-key', label: 'Live API key for partner access', kind: 'measured' }),
  Object.freeze({ id: 'email-sender', label: 'Email sender and Resend key configured', kind: 'measured' }),
  Object.freeze({ id: 'newsletter', label: 'Newsletter opt-in confirmed at least once', kind: 'measured' }),
  Object.freeze({ id: 'incidents', label: 'No operational event in the last 24h', kind: 'measured' }),
  Object.freeze({ id: 'origin', label: 'Owner origin on a custom domain', kind: 'measured' }),
  Object.freeze({ id: 'rights', label: 'Licensing and redistribution rights reviewed', kind: 'manual' }),
  Object.freeze({ id: 'legal', label: 'Terms, privacy and disclaimer approved', kind: 'manual' }),
  Object.freeze({ id: 'signoff', label: 'Owner release sign-off recorded', kind: 'manual' }),
]);

/**
 * @param {{ops: object, billing: {active: boolean, missing: string[]}, email: {apiKey: boolean, from: boolean}, eventsLastDay: number, confirmedSubscribers: number, origin: string}} facts
 */
export function evaluateLaunch({ ops, billing, email, eventsLastDay, confirmedSubscribers, origin }) {
  const results = new Map([
    ['owner-recovery', { state: ops.passkeys >= 2 ? 'PASS' : 'BLOCKED', detail: ops.passkeys + ' active passkey(s)' }],
    ['billing', {
      state: billing.active && billing.missing.length === 0 ? 'PASS' : 'BLOCKED',
      detail: billing.missing.length === 0
        ? (billing.active ? 'subscription active' : 'no active subscription')
        : 'missing: ' + billing.missing.join(', '),
    }],
    ['api-key', {
      state: ops.apiKeysActive > 0 ? 'PASS' : 'BLOCKED',
      detail: ops.apiKeysActive + ' active of ' + ops.apiKeys,
    }],
    ['email-sender', {
      state: email.apiKey && email.from ? 'PASS' : 'BLOCKED',
      detail: email.apiKey && email.from ? 'configured' : 'RESEND_API_KEY or sender missing',
    }],
    ['newsletter', {
      state: confirmedSubscribers > 0 ? 'PASS' : 'BLOCKED',
      detail: confirmedSubscribers + ' confirmed subscriber(s)',
    }],
    ['incidents', {
      state: eventsLastDay === 0 ? 'PASS' : 'BLOCKED',
      detail: eventsLastDay + ' event(s) in the last 24h',
    }],
    ['origin', {
      state: /^https:\/\/[^/]+$/u.test(origin) && !origin.includes('workers.dev') ? 'PASS' : 'BLOCKED',
      detail: origin === '' ? 'origin not configured' : origin,
    }],
  ]);
  return Object.freeze(LAUNCH_ITEMS.map((item) => {
    if (item.kind === 'manual') return Object.freeze({ ...item, state: 'MANUAL', detail: 'owner decision, not measurable' });
    const result = results.get(item.id) ?? { state: 'BLOCKED', detail: 'not measured' };
    return Object.freeze({ ...item, state: result.state, detail: result.detail });
  }));
}

/** READY requires every measured item to pass and no manual item outstanding. */
export function launchVerdict(items) {
  const blocked = items.filter((item) => item.state === 'BLOCKED');
  const manual = items.filter((item) => item.state === 'MANUAL');
  return Object.freeze({
    ready: blocked.length === 0 && manual.length === 0,
    blocked: blocked.length,
    manual: manual.length,
  });
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function launchSection({ items, verdict }) {
  const rows = items.map((item) => '<tr><td>' + escapeHtml(item.state) + '</td><td>'
    + escapeHtml(item.label) + '</td><td>' + escapeHtml(item.detail) + '</td></tr>').join('');
  const headline = verdict.ready
    ? '<p class="admin__ok" role="status">Every measured gate passed and no manual item is outstanding.</p>'
    : '<p class="admin__error" role="alert">Launch is blocked: ' + verdict.blocked
      + ' measured gate(s) failing, ' + verdict.manual + ' manual decision(s) pending.</p>';
  return headline
    + '<table class="admin__table"><thead><tr><th>State</th><th>Gate</th><th>Measured</th></tr></thead><tbody>'
    + rows + '</tbody></table>'
    + '<p class="admin__note">PASS comes only from a measured row or a configured value. '
    + 'MANUAL items are owner decisions and never turn PASS on their own.</p>';
}
