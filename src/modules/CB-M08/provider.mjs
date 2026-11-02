// CB-M08-P1-PROVIDER-001: an external, OpenAI-compatible chat provider.
//
// It speaks the /chat/completions shape so DeepSeek (or any compatible
// gateway) can be configured without code changes. The key never leaves the
// Worker: it is read from the encrypted settings (or the Worker env) and used
// only in the Authorization header.

export const CHAT_PROVIDERS = Object.freeze(['workers-ai', 'deepseek']);
export const DEFAULT_TIMEOUT_MS = 25_000;
export const MAX_ANSWER_BYTES = 200_000;

export function providerName(value) {
  const name = String(value ?? '').trim().toLowerCase();
  return CHAT_PROVIDERS.includes(name) ? name : 'workers-ai';
}

export function chatEndpoint(baseUrl) {
  const base = String(baseUrl ?? '').trim().replace(/\/+$/u, '');
  if (!/^https:\/\/[^\s]+$/u.test(base)) return null;
  return base.endsWith('/chat/completions') ? base : base + '/chat/completions';
}

/**
 * One chat completion. Never throws: the caller decides whether to fall back.
 * Answers larger than MAX_ANSWER_BYTES are refused instead of parsed.
 */
export async function chatCompletion({
  baseUrl, apiKey, model, messages, maxTokens = 2048, temperature = 0.3,
  timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = globalThis.fetch,
} = {}) {
  const endpoint = chatEndpoint(baseUrl);
  if (endpoint === null) return Object.freeze({ status: 'config', reason: 'base_url' });
  if (typeof apiKey !== 'string' || apiKey.trim() === '') return Object.freeze({ status: 'config', reason: 'api_key' });
  if (typeof model !== 'string' || model.trim() === '') return Object.freeze({ status: 'config', reason: 'model' });
  if (typeof fetchImpl !== 'function') return Object.freeze({ status: 'error', reason: 'no_fetch' });
  if (!Array.isArray(messages) || messages.length === 0) return Object.freeze({ status: 'error', reason: 'no_messages' });

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller === null ? null : setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs) || DEFAULT_TIMEOUT_MS));
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: Math.min(Math.max(Number(maxTokens) || 2048, 64), 8192),
        temperature,
        response_format: { type: 'json_object' },
        stream: false,
      }),
      signal: controller?.signal,
    });
    if (!response.ok) {
      return Object.freeze({ status: 'error', reason: 'HTTP_' + response.status });
    }
    const declared = Number(response.headers?.get?.('content-length') ?? '0');
    if (Number.isFinite(declared) && declared > MAX_ANSWER_BYTES) {
      return Object.freeze({ status: 'error', reason: 'too_large' });
    }
    const body = await response.text();
    if (body.length > MAX_ANSWER_BYTES) return Object.freeze({ status: 'error', reason: 'too_large' });
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      return Object.freeze({ status: 'error', reason: 'invalid_json' });
    }
    const raw = parsed?.choices?.[0]?.message?.content;
    if (typeof raw !== 'string' || raw.trim() === '') {
      return Object.freeze({ status: 'error', reason: 'empty_answer' });
    }
    return Object.freeze({ status: 'ok', text: raw });
  } catch (error) {
    return Object.freeze({ status: 'error', reason: error?.name === 'AbortError' ? 'timeout' : 'network' });
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
}
