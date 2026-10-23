import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { convertV4MiniflareOptions, Miniflare, NoOpLog } from 'miniflare';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { splitLocalSchemaStatements } from './p1c-local-preview.mjs';
import { installLocalOwnerReviewSchema } from './p1c-fixtures/owner-review-schema.mjs';
import {
  CMS_TEST_ORIGIN,
  CMS_TEST_RP_ID,
  createLocalCmsHandler,
  webauthnChallengeFromHex,
} from '../../../src/modules/CB-M05/p1c-local/local-cms.mjs';
import {
  makeSyntheticAuthenticator,
  makeRegistrationResponse,
  makeAuthenticationResponse,
} from '../../../src/modules/CB-M05/p1b-local/webauthn-fixtures.mjs';
import { parseLocalDraftMarkdown } from '../../../src/modules/CB-M05/local-draft-markdown.mjs';

const schema = readFileSync('test/modules/CB-M05/p1c-fixtures/schema.sql', 'utf8');
const example = Object.freeze({
  title: 'Persisted local export has exact fields',
  summary: 'A synthetic saved summary that remains unverified and local only.',
  body: 'A synthetic persisted article body with enough text for the canonical draft format.',
  sourceUrl: 'https://example.test/original-story',
  authorLabel: 'Synthetic Owner label',
});
const idempotency = () => randomBytes(24).toString('base64url');

function makeRequest(route, method = 'GET', body, { cookie = '', csrf = '', origin = CMS_TEST_ORIGIN, fetchSite = 'same-origin' } = {}) {
  const headers = { origin, 'content-type': 'application/json' };
  if (fetchSite) headers['sec-fetch-site'] = fetchSite;
  if (cookie) headers.cookie = cookie;
  if (csrf) headers['x-cb-csrf'] = csrf;
  return new Request(CMS_TEST_ORIGIN + route, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function setup() {
  const state = mkdtempSync(path.join(tmpdir(), 'cb-m05-editorial-bridge-'));
  const mf = new Miniflare(convertV4MiniflareOptions({
    name: 'coinblink-m05-editorial-bridge-' + randomUUID(),
    script: 'export default { async fetch() { return new Response("LOCAL ONLY") } }',
    modules: true,
    compatibilityDate: '2026-10-13',
    d1Databases: { CMS_D1_LOCAL: '00000000-0000-4000-8000-000000000086' },
    resourcePersistencePath: state,
    log: new NoOpLog(),
  }));
  try {
    const db = await mf.getD1Database('CMS_D1_LOCAL');
    for (const statement of splitLocalSchemaStatements(schema)) await db.prepare(statement).run();
    await installLocalOwnerReviewSchema(db);
    const authenticator = makeSyntheticAuthenticator('primary');
    await db.prepare('INSERT INTO cms_owner(owner_id,created_at) VALUES (1,1)').run();
    const challenge = 'TEST-LOCAL-REG-' + randomUUID();
    const registration = await verifyRegistrationResponse({
      response: makeRegistrationResponse(authenticator, { challenge }),
      expectedChallenge: challenge,
      expectedOrigin: CMS_TEST_ORIGIN,
      expectedRPID: CMS_TEST_RP_ID,
      requireUserPresence: true,
      requireUserVerification: true,
    });
    assert.equal(registration.verified, true);
    await db.prepare(
      'INSERT INTO cms_credentials(credential_id,owner_id,public_key,sign_count,device_kind) VALUES (?,1,?,0,?)',
    ).bind(authenticator.id, registration.registrationInfo.credential.publicKey, 'primary').run();
    let milliseconds = Date.now();
    const env = {
      CB_M05_LOCAL_TEST_ONLY: 'true',
      CMS_D1_LOCAL: db,
      CMS_TEST_HMAC_KEY: randomBytes(32).toString('hex'),
    };
    const handle = createLocalCmsHandler({ now: () => milliseconds });
    const run = (route, method = 'GET', body, options = {}) => handle(makeRequest(route, method, body, options), env);
    const challengeResponse = await run('/local/challenge', 'POST', { credentialId: authenticator.id });
    assert.equal(challengeResponse.status, 200);
    const issued = await challengeResponse.json();
    const assertion = makeAuthenticationResponse(authenticator, {
      challenge: webauthnChallengeFromHex(issued.challenge),
    });
    const logged = await run('/local/login', 'POST', {
      challenge: issued.challenge,
      credentialId: authenticator.id,
      response: assertion,
    });
    assert.equal(logged.status, 200);
    const login = await logged.json();
    const cookie = logged.headers.get('set-cookie').split(';')[0];
    return { mf, db, env, run, state, login: { cookie, csrf: login.csrf }, setTime: value => { milliseconds = value; } };
  } catch (error) {
    await mf.dispose();
    throw error;
  }
}

async function tableSnapshot(db) {
  const names = ['cms_drafts', 'cms_draft_revisions', 'cms_audit_events', 'cms_sessions'];
  const entries = await Promise.all(names.map(async name => {
    const row = await db.prepare('SELECT COUNT(*) AS count FROM ' + name).first();
    return [name, row.count];
  }));
  return Object.fromEntries(entries);
}

test('M05 P0 local D1 export is Owner-session-bound, exact-revision, canonical and read-only', { timeout: 90_000 }, async () => {
  const ctx = await setup();
  try {
    const created = await ctx.run('/local/articles', 'POST', { ...example, idempotencyKey: idempotency() }, ctx.login);
    assert.equal(created.status, 201);
    const { id } = await created.json();
    const route = '/local/articles/' + id + '/export';
    const before = await tableSnapshot(ctx.db);

    assert.equal((await ctx.run(route + '?revision=1')).status, 401, 'missing session is denied');
    assert.equal((await ctx.run(route + '?revision=1', 'GET', undefined, { ...ctx.login, fetchSite: 'cross-site' })).status, 403,
      'cross-site read is denied');
    assert.equal((await ctx.run(route, 'GET', undefined, ctx.login)).status, 400,
      'missing requested revision is rejected for an authenticated Owner');
    assert.equal((await ctx.run(route + '?revision=1&revision=1', 'GET', undefined, ctx.login)).status, 400,
      'duplicate revision parameters are rejected');
    assert.equal((await ctx.run(route + '?revision=1&extra=1', 'GET', undefined, ctx.login)).status, 400,
      'unknown export query parameters are rejected');
    assert.equal((await ctx.run(route + '?revision=1', 'POST', undefined, ctx.login)).status, 405,
      'export never accepts a write method');

    const response = await ctx.run(route + '?revision=1', 'GET', undefined, ctx.login);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /^text\/markdown; charset=utf-8$/u);
    assert.match(response.headers.get('content-disposition') || '', /^attachment; filename="[a-z0-9-]+\.md"$/u);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    const markdown = await response.text();
    assert.equal(Buffer.byteLength(markdown, 'utf8'), Number(response.headers.get('content-length')));
    const parsed = parseLocalDraftMarkdown(markdown);
    assert.deepEqual(
      { title: parsed.title, summary: parsed.summary, body: parsed.body, author: parsed.author, source: parsed.source },
      { title: example.title, summary: example.summary, body: example.body, author: example.authorLabel, source: example.sourceUrl },
    );
    assert.doesNotMatch(markdown, /csrf|session|credential|token|privateKey/iu);
    assert.deepEqual(await tableSnapshot(ctx.db), before, 'successful export does not mutate local D1');

    const incompatibleBody = 'x'.repeat(12_001);
    const tooLarge = await ctx.run('/local/articles', 'POST', {
      ...example, body: incompatibleBody, idempotencyKey: idempotency(),
    }, ctx.login);
    assert.equal(tooLarge.status, 201, 'CMS accepts its wider body contract');
    const largeId = (await tooLarge.json()).id;
    const beforeRejectedExport = await tableSnapshot(ctx.db);
    const rejected = await ctx.run('/local/articles/' + largeId + '/export?revision=1', 'GET', undefined, ctx.login);
    assert.equal(rejected.status, 422, 'incompatible CMS text is not silently truncated');
    assert.match((await rejected.json()).error, /canonical Markdown/u);
    assert.deepEqual(await tableSnapshot(ctx.db), beforeRejectedExport, 'validation failure does not alter D1');
    assert.equal((await ctx.db.prepare('SELECT body FROM cms_drafts WHERE id=?').bind(largeId).first()).body, incompatibleBody);

    const changed = await ctx.run('/local/articles/' + id, 'PATCH', {
      ...example, title: 'Persisted revision two is the only current export',
      expectedRevision: 1, idempotencyKey: idempotency(),
    }, ctx.login);
    assert.equal(changed.status, 200);
    const beforeCurrentRevisionReads = await tableSnapshot(ctx.db);
    const stale = await ctx.run(route + '?revision=1', 'GET', undefined, ctx.login);
    assert.equal(stale.status, 409, 'concurrent or superseded revisions are not exported');
    const current = await ctx.run(route + '?revision=2', 'GET', undefined, ctx.login);
    assert.equal(current.status, 200);
    assert.equal(parseLocalDraftMarkdown(await current.text()).title, 'Persisted revision two is the only current export');
    assert.deepEqual(await tableSnapshot(ctx.db), beforeCurrentRevisionReads,
      'stale and current revision exports do not mutate local D1');


    // Review is exact-revision, private and does not authorize publication.
    const reviewRoute = '/local/articles/' + id + '/review';
    const validReview = { expectedRevision: 2, decision: 'PREVIEW_REVIEWED',
      note: 'Local editorial note. Source facts and rights remain unverified.' };
    assert.equal((await ctx.run(reviewRoute)).status, 401, 'no Owner session, no private review read');
    assert.equal((await ctx.run(reviewRoute, 'GET', undefined, { ...ctx.login, fetchSite: 'cross-site' })).status, 403);
    assert.equal((await ctx.run(reviewRoute, 'POST', validReview)).status, 403, 'no session, no private review');
    assert.equal((await ctx.run(reviewRoute, 'POST', validReview, { cookie: ctx.login.cookie })).status, 403,
      'missing CSRF is denied');
    assert.equal((await ctx.run(reviewRoute, 'POST', validReview,
      { ...ctx.login, fetchSite: 'cross-site' })).status, 403);
    assert.equal((await ctx.run(reviewRoute, 'POST', { ...validReview, expectedRevision: 1 },
      ctx.login)).status, 409, 'old revision cannot receive a current review');
    assert.equal((await ctx.run(reviewRoute, 'POST', { ...validReview, decision: 'PUBLISH_APPROVED' },
      ctx.login)).status, 400, 'no publishing transition exists');
    assert.equal((await ctx.run(reviewRoute, 'POST', { ...validReview, note: 'short' },
      ctx.login)).status, 400, 'invalid note is refused');
    assert.equal((await ctx.run(reviewRoute, 'POST', { ...validReview, note: 'Control newline\nattempt is invalid.' },
      ctx.login)).status, 400, 'embedded ASCII control is refused');
    assert.equal((await ctx.run(reviewRoute, 'POST', { ...validReview, extra: true },
      ctx.login)).status, 400, 'forged extra properties are refused');
    assert.equal((await ctx.run(reviewRoute, 'POST', validReview, ctx.login)).status, 201);
    assert.equal((await ctx.run(reviewRoute, 'POST', validReview, ctx.login)).status, 409,
      'only one immutable review per saved revision');
    const reviewResponse = await ctx.run(reviewRoute, 'GET', undefined, ctx.login);
    assert.equal(reviewResponse.status, 200);
    const reviewDetails = await reviewResponse.json();
    assert.equal(reviewDetails.review.decision, 'PREVIEW_REVIEWED');
    assert.equal(reviewDetails.publication, 'DISABLED');
    assert.equal(reviewDetails.rights, 'NOT_CLEARED');
    assert.equal(reviewDetails.historyLimit, 100);
    assert.deepEqual(reviewDetails.history.map(row => row.revision), [2]);
    assert.equal(reviewDetails.history[0].decision, 'PREVIEW_REVIEWED');
    assert.equal(reviewDetails.history[0].note, validReview.note);
    const readOnlyReviewSnapshot = await ctx.db.prepare(
      'SELECT revision,decision,note FROM cms_owner_reviews WHERE draft_id=? ORDER BY revision DESC',
    ).bind(id).all();
    assert.equal((await ctx.run(reviewRoute + '?unexpected=1', 'GET', undefined, ctx.login)).status, 400);
    assert.equal((await ctx.run(reviewRoute, 'PATCH', {}, ctx.login)).status, 405);
    assert.equal((await ctx.run('/local/articles/' + '00000000-0000-4000-8000-000000000000' +
      '/review', 'GET', undefined, ctx.login)).status, 404);
    assert.deepEqual((await ctx.db.prepare(
      'SELECT revision,decision,note FROM cms_owner_reviews WHERE draft_id=? ORDER BY revision DESC',
    ).bind(id).all()).results, readOnlyReviewSnapshot.results, 'private history GET does not write to D1');
    await assert.rejects(ctx.db.prepare('DELETE FROM cms_owner_reviews WHERE draft_id=?')
      .bind(id).run(), /immutable/u, 'stored Owner review cannot be deleted');
    await assert.rejects(ctx.db.prepare('UPDATE cms_owner_reviews SET note=? WHERE draft_id=?')
      .bind('An unauthorized overwrite.',id).run(), /immutable/u);
    assert.equal((await ctx.db.prepare('SELECT status FROM cms_drafts WHERE id=?').bind(id).first()).status,
      'draft', 'no review publishes the article');
    const third = await ctx.run('/local/articles/' + id, 'PATCH', {
      ...example, title: 'A fresh local draft revision requires another Owner review',
      expectedRevision: 2, idempotencyKey: idempotency(),
    }, ctx.login);
    assert.equal(third.status, 200);
    const superseded = await (await ctx.run(reviewRoute, 'GET', undefined, ctx.login)).json();
    assert.equal(superseded.review, null, 'old process approval never applies to a new revision');
    assert.deepEqual(superseded.history.map(row => row.revision), [2]);
    assert.equal(superseded.publication, 'DISABLED');
    assert.equal(superseded.rights, 'NOT_CLEARED');
    assert.equal((await ctx.run(reviewRoute, 'POST', validReview, ctx.login)).status, 409,
      'stale review replay cannot attach to the newer revision');
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_owner_reviews WHERE draft_id=?')
      .bind(id).first()).n, 1, 'old review preserved as immutable evidence');
    const newDecision = await ctx.run(reviewRoute, 'POST', {
      expectedRevision: 3, decision: 'CHANGES_REQUESTED',
      note: 'The newer synthetic revision needs further local checks.',
    }, ctx.login);
    assert.equal(newDecision.status, 201);
    const twoDecisions = await (await ctx.run(reviewRoute, 'GET', undefined, ctx.login)).json();
    assert.equal(twoDecisions.review.decision, 'CHANGES_REQUESTED');
    assert.deepEqual(twoDecisions.history.map(row => row.revision), [3, 2],
      'both current and immutable superseded decisions remain available only to Owner');
    assert.equal(twoDecisions.history[1].note, validReview.note);
    assert.equal((await ctx.db.prepare('SELECT status FROM cms_drafts WHERE id=?').bind(id).first()).status,
      'draft', 'review history never changes publication state');
    assert.equal((await ctx.run('/local/logout', 'POST', {}, ctx.login)).status, 200);
    assert.equal((await ctx.run(reviewRoute, 'GET', undefined, ctx.login)).status, 401);
    assert.equal((await ctx.run(reviewRoute + '?unexpected=1', 'GET', undefined, ctx.login)).status, 400);
    assert.equal((await ctx.run(route + '?revision=2', 'GET', undefined, ctx.login)).status, 401,
      'revoked session cannot export');
  } finally {
    await ctx.mf.dispose();
    rmSync(ctx.state, { recursive: true, force: true });
  }
});

test('M05 Owner review additive schema upgrade retains an existing LOCAL D1 draft', { timeout: 90_000 }, async () => {
  const ctx = await setup();
  try {
    // Simulate the original v1 database inside an isolated disposable D1 only.
    await ctx.db.prepare('DROP TABLE cms_owner_reviews').run();
    const legacy = await ctx.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='cms_owner_reviews'",
    ).first();
    assert.equal(legacy, null, 'original D1 v1 has no Owner review extension');
    const created = await ctx.run('/local/articles', 'POST', {
      ...example, idempotencyKey: idempotency(),
    }, ctx.login);
    assert.equal(created.status, 201);
    const { id } = await created.json();
    const saved = await ctx.db.prepare(
      'SELECT id,title,summary,body,status,revision,source_url,author_label FROM cms_drafts WHERE id=?',
    ).bind(id).first();
    const history = await ctx.db.prepare(
      'SELECT draft_id,revision,body,title FROM cms_draft_revisions WHERE draft_id=?',
    ).bind(id).all();

    await installLocalOwnerReviewSchema(ctx.db);
    await installLocalOwnerReviewSchema(ctx.db);
    const retained = await ctx.db.prepare(
      'SELECT id,title,summary,body,status,revision,source_url,author_label FROM cms_drafts WHERE id=?',
    ).bind(id).first();
    const retainedHistory = await ctx.db.prepare(
      'SELECT draft_id,revision,body,title FROM cms_draft_revisions WHERE draft_id=?',
    ).bind(id).all();
    assert.deepEqual(retained, saved, 'add-only review upgrade preserves existing D1 draft');
    assert.deepEqual(retainedHistory.results, history.results, 'revision history is identical');
    const triggers = await ctx.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'cms_owner_review_%' ORDER BY name",
    ).all();
    assert.deepEqual(triggers.results.map(row => row.name),
      ['cms_owner_review_no_delete', 'cms_owner_review_no_update'],
      'idempotent upgrade creates exactly the two review immutability guards');
    const review = await ctx.run('/local/articles/' + id + '/review', 'POST', {
      expectedRevision: 1, decision: 'CHANGES_REQUESTED',
      note: 'LOCAL process feedback, not publication clearance.',
    }, ctx.login);
    assert.equal(review.status, 201, 'upgraded v1 D1 accepts current Owner review');
    assert.equal((await ctx.db.prepare('SELECT status FROM cms_drafts WHERE id=?').bind(id).first()).status,
      'draft', 'migration and review cannot publish a draft');
  } finally {
    await ctx.mf.dispose();
    rmSync(ctx.state, { recursive: true, force: true });
  }
});
