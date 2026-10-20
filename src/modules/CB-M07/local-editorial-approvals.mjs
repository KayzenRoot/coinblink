// CB-M07-I-LOCAL-001. Volatile local editorial review, never real publishing approval.
import { requireCanonicalLocalVariant } from './local-editorial-variants.mjs';

// Every event retains the exact immutable, revalidated authorized draft variant.
// A resave increments the channel-specific version and invalidates old decisions.
export function inspectLocalApprovalHistory(events, authorizedDrafts) {
  if (!Array.isArray(events) || events.length > 120 ||
      !Array.isArray(authorizedDrafts) || authorizedDrafts.length > 100) {
    throw new TypeError('Invalid LOCAL approval memory');
  }
  const latest = new Map();
  for (const event of events) {
    if (!event || typeof event !== 'object' || Array.isArray(event) ||
        Object.getPrototypeOf(event) !== Object.prototype || !Object.isFrozen(event) ||
        Object.keys(event).length !== 5 ||
        !['action','version','variant','reason','atUTC'].every(key => Object.hasOwn(event,key)) ||
        !['SAVE','APPROVE','REJECT','RESET'].includes(event.action) ||
        typeof event.reason !== 'string' || typeof event.atUTC !== 'string' ||
        !Number.isSafeInteger(event.version) || event.version < 1 ||
        !Number.isFinite(Date.parse(event.atUTC))) {
      throw new TypeError('Invalid LOCAL approval event');
    }
    const draft = authorizedDrafts.find(row => row && row.id === event.variant?.draftId &&
      row.revision === event.variant?.draftRevision);
    requireCanonicalLocalVariant(event.variant, draft);
    const key = event.variant.draftId + ':' + event.variant.draftRevision +
      ':' + event.variant.channel;
    const prior = latest.get(key);
    if (event.action === 'SAVE') {
      if (event.reason !== '' || event.version !== (prior?.version ?? 0) + 1) {
        throw new TypeError('Invalid LOCAL approval version');
      }
    } else if (event.action === 'RESET') {
      if (!prior || prior.action === 'RESET' || event.version !== prior.version ||
          event.reason !== '' || event.variant.text !== prior.variant.text) {
        throw new TypeError('Invalid LOCAL approval reset');
      }
    } else if (!prior || prior.action !== 'SAVE' || event.version !== prior.version ||
        event.variant.text !== prior.variant.text ||
        (event.action === 'APPROVE' && event.reason !== '') ||
        (event.action === 'REJECT' && (event.reason.length < 8 ||
          event.reason.length > 240 || event.reason !== event.reason.trim() ||
          /[\u0000-\u001f\u007f]/u.test(event.reason)))) {
      throw new TypeError('Invalid LOCAL editorial decision');
    }
    latest.set(key, event);
  }
  return latest;
}

export function latestLocalApproval(events, draft, channel, authorizedDrafts = [draft]) {
  const latest = inspectLocalApprovalHistory(events, authorizedDrafts);
  return latest.get(draft.id + ':' + draft.revision + ':' + channel) ?? null;
}

export function recordLocalApproval(events, variant, action, authorizedDrafts, reason = '') {
  const latest = inspectLocalApprovalHistory(events, authorizedDrafts);
  const draft = authorizedDrafts.find(row => row && row.id === variant?.draftId &&
    row.revision === variant?.draftRevision);
  requireCanonicalLocalVariant(variant, draft);
  if (!['SAVE','APPROVE','REJECT','RESET'].includes(action) ||
      typeof reason !== 'string' || events.length >= 120) {
    throw new TypeError('Invalid LOCAL approval action');
  }
  const previous = latest.get(variant.draftId + ':' + variant.draftRevision +
    ':' + variant.channel);
  const next = Object.freeze([...events, Object.freeze({
    action, version: action === 'SAVE' ? (previous?.version ?? 0) + 1 : previous?.version,
    variant, reason, atUTC: new Date().toISOString(),
  })]);
  inspectLocalApprovalHistory(next, authorizedDrafts);
  return next;
}
