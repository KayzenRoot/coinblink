// Model-only request controls for synthetic tests. This is not application middleware.
import { timingSafeEqual } from 'node:crypto';

function constantTimeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBytes = Buffer.from(left, 'utf8');
  const rightBytes = Buffer.from(right, 'utf8');
  if (leftBytes.length !== rightBytes.length || leftBytes.length === 0) return false;
  return timingSafeEqual(leftBytes, rightBytes);
}
export function assertSyntheticMutationRequest(request, {
  expectedOrigin,
  csrfToken,
  consumedIdempotencyKeys = new Set(),
} = {}) {
  if (!request || typeof request !== 'object') throw new Error('Synthetic request must be an object');
  if (request.method !== 'POST') throw new Error('Synthetic mutation requires POST');
  if (request.origin !== expectedOrigin) throw new Error('Synthetic request Origin is not allowed');
  if (request.fetchSite !== 'same-origin') throw new Error('Synthetic request Fetch Metadata must be same-origin');
  if (typeof request.contentType !== 'string' || !/^application\/json(?:\s*;|$)/i.test(request.contentType)) {
    throw new Error('Synthetic mutation requires application/json content type');
  }
  if (!constantTimeEqual(request.csrfToken, csrfToken)) throw new Error('Synthetic CSRF token is missing or invalid');
  if (typeof request.idempotencyKey !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(request.idempotencyKey)) {
    throw new Error('Synthetic mutation requires a bounded idempotency key');
  }
  if (!(consumedIdempotencyKeys instanceof Set)) throw new TypeError('Synthetic idempotency state must be a Set');
  if (consumedIdempotencyKeys.has(request.idempotencyKey)) throw new Error('Synthetic idempotency key was already consumed');
  consumedIdempotencyKeys.add(request.idempotencyKey);
  return true;
}

export function canRecoverWithTwoSyntheticAuthenticators({ ownerId, primary, recovery } = {}) {
  return Number.isSafeInteger(ownerId) && ownerId === 1 &&
    primary?.ownerId === ownerId && recovery?.ownerId === ownerId &&
    typeof primary.credentialId === 'string' && typeof recovery.credentialId === 'string' &&
    primary.credentialId !== recovery.credentialId &&
    primary.revokedAt == null && recovery.revokedAt == null;
}
