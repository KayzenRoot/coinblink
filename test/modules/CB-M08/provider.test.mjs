import test from 'node:test';
import assert from 'node:assert/strict';
import { chatCompletion, chatEndpoint, providerName } from '../../../src/modules/CB-M08/provider.mjs';

const MESSAGES = [{ role: 'user', content: 'write it' }];

function okFetch(seen) {
  return async (url, options) => {
    seen.push({ url, options });
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  };
}

test('the endpoint is derived from the base URL', () => {
  assert.equal(chatEndpoint('https://gateway.example/v1'), 'https://gateway.example/v1/chat/completions');
  assert.equal(chatEndpoint('https://gateway.example/v1/'), 'https://gateway.example/v1/chat/completions');
  assert.equal(chatEndpoint('https://gateway.example/v1/chat/completions'), 'https://gateway.example/v1/chat/completions');
  assert.equal(chatEndpoint('http://gateway.example/v1'), null, 'https is required');
  assert.equal(chatEndpoint(''), null);
  assert.equal(providerName('deepseek'), 'deepseek');
  assert.equal(providerName('openai'), 'workers-ai', 'unknown providers fall back');
});

test('a completion sends the bearer key and the chat payload', async () => {
  const seen = [];
  const result = await chatCompletion({
    baseUrl: 'https://gateway.example/v1', apiKey: 'sk-test-123456', model: 'deepseek-v4.1-flash',
    messages: MESSAGES, fetchImpl: okFetch(seen),
  });
  assert.equal(result.status, 'ok');
  assert.equal(result.text, '{"ok":true}');
  assert.equal(seen[0].url, 'https://gateway.example/v1/chat/completions');
  assert.equal(seen[0].options.headers.authorization, 'Bearer sk-test-123456');
  const body = JSON.parse(seen[0].options.body);
  assert.equal(body.model, 'deepseek-v4.1-flash');
  assert.equal(body.max_tokens, 2048);
  assert.deepEqual(body.response_format, { type: 'json_object' });
  assert.deepEqual(body.messages, MESSAGES);
});

test('every failure is reported without throwing', async () => {
  const base = { baseUrl: 'https://gateway.example/v1', apiKey: 'sk-test-123456', model: 'm', messages: MESSAGES };
  assert.equal((await chatCompletion({ ...base, baseUrl: 'ftp://x' })).reason, 'base_url');
  assert.equal((await chatCompletion({ ...base, apiKey: '' })).reason, 'api_key');
  assert.equal((await chatCompletion({ ...base, model: '' })).reason, 'model');
  assert.equal((await chatCompletion({ ...base, messages: [] })).reason, 'no_messages');
  assert.equal((await chatCompletion({ ...base, fetchImpl: async () => new Response('nope', { status: 500 }) })).reason, 'HTTP_500');
  assert.equal((await chatCompletion({ ...base, fetchImpl: async () => new Response('not json', { status: 200 }) })).reason, 'invalid_json');
  assert.equal((await chatCompletion({ ...base, fetchImpl: async () => new Response(JSON.stringify({ choices: [] }), { status: 200 }) })).reason, 'empty_answer');
  assert.equal((await chatCompletion({ ...base, fetchImpl: async () => { throw new TypeError('network'); } })).reason, 'network');
});

test('a stalled gateway is cut by the timeout', async () => {
  const hanging = (url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      reject(error);
    });
  });
  const result = await chatCompletion({
    baseUrl: 'https://gateway.example/v1', apiKey: 'sk-test-123456', model: 'm', messages: MESSAGES,
    timeoutMs: 1000, fetchImpl: hanging,
  });
  assert.equal(result.status, 'error');
  assert.equal(result.reason, 'timeout');
});
