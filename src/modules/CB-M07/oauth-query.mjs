// CB-M07-P1-SOCIAL-OAUTH-001: the provider-neutral part of an OAuth callback.
//
// Every network returns the same query shape (`code`, `state`, `error` and a
// description) but names the error fields differently. Normalizing it once keeps
// a new provider from re-implementing the trust checks.
export function readCallback(searchParams) {
  const value = (name) => (typeof searchParams?.get === 'function' ? searchParams.get(name) : null);
  const error = value('error') ?? value('error_code');
  return Object.freeze({
    code: value('code'),
    state: value('state'),
    error: typeof error === 'string' && error !== '' ? error : null,
    errorDescription: value('error_description') ?? value('error_message'),
  });
}
