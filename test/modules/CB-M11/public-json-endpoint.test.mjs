import test from 'node:test';
import assert from 'node:assert/strict';
import { publicJsonEndpoint, publicJsonHeaders } from '../../../src/modules/CB-M11/public-json-endpoint.mjs';

const headers = Object.freeze({ "content-type": "application/json" });
const url = (search = "") => ({ searchParams: new URLSearchParams(search) });
const request = (method = "GET", ifNoneMatch = null) => ({
  method,
  headers: new Headers(ifNoneMatch === null ? {} : { "if-none-match": ifNoneMatch }),
});

test('the shared JSON handler serves 200, 304, 400, 405 and OPTIONS', async () => {
  const endpoint = publicJsonEndpoint({ headers, buildBody: () => '{"ok":true}' });
  const first = await endpoint.GET({ url: url(), request: request() });
  assert.equal(first.status, 200);
  const etag = first.headers.get("etag");
  assert.ok(etag);
  const conditional = await endpoint.GET({ url: url(), request: request("GET", etag) });
  assert.equal(conditional.status, 304);
  assert.equal(await conditional.text(), "");
  assert.equal((await endpoint.GET({ url: url("x=1"), request: request() })).status, 400);
  assert.equal(endpoint.ALL({ request: request("POST") }).status, 405);
  assert.equal(endpoint.ALL({ request: request("POST") }).headers.get("allow"), "GET");
  assert.equal(endpoint.ALL({ request: request("HEAD") }).status, 200);
  assert.equal(endpoint.OPTIONS().status, 204);
});

test('an async or failing builder is handled without leaking an exception', async () => {
  const asyncEndpoint = publicJsonEndpoint({ headers, buildBody: async () => '{"ok":true}' });
  assert.equal((await asyncEndpoint.GET({ url: url(), request: request() })).status, 200);
  const failing = publicJsonEndpoint({ headers, buildBody: async () => { throw new Error("boom"); } });
  const response = await failing.GET({ url: url(), request: request() });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { status: "unavailable", reason: "INTERNAL" });
  assert.throws(() => publicJsonEndpoint({ headers }), TypeError);
  assert.throws(() => publicJsonEndpoint({ buildBody: () => "x" }), TypeError);
});

test('the shared header set stays reviewed', () => {
  const headers = publicJsonHeaders('public, max-age=60');
  assert.deepEqual(Object.keys(headers).sort(), ['access-control-allow-methods',
    'access-control-allow-origin', 'cache-control', 'content-type', 'x-robots-tag']);
  assert.equal(headers['access-control-allow-origin'], '*');
  assert.equal(headers['access-control-allow-methods'], 'GET, HEAD, OPTIONS');
  assert.equal(headers['x-robots-tag'], 'noindex');
  assert.equal(headers['cache-control'], 'public, max-age=60');
  assert.equal(Object.isFrozen(headers), true);
});
