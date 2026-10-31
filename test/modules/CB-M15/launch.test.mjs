import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  LAUNCH_ITEMS, evaluateLaunch, launchSection, launchVerdict,
} from '../../../src/modules/CB-M15/launch.mjs';

const GOOD = {
  ops: { passkeys: 2, apiKeys: 1, apiKeysActive: 1 },
  billing: { active: true, missing: [] },
  email: { apiKey: true, from: true },
  eventsLastDay: 0,
  confirmedSubscribers: 1,
  origin: 'https://coinblink.example',
};

test('every measured gate passes on a healthy state', () => {
  const items = evaluateLaunch(GOOD);
  const measured = items.filter((item) => item.kind === 'measured');
  assert.equal(measured.length, 7);
  assert.equal(measured.every((item) => item.state === 'PASS'), true);
});

test('a failing measurement blocks with the number that caused it', () => {
  const items = evaluateLaunch({
    ...GOOD,
    ops: { passkeys: 1, apiKeys: 2, apiKeysActive: 0 },
    billing: { active: false, missing: ['STRIPE_WEBHOOK_SECRET'] },
    eventsLastDay: 3,
    confirmedSubscribers: 0,
    origin: 'https://coinblink-production.kayzendev.workers.dev',
  });
  const byId = new Map(items.map((item) => [item.id, item]));
  assert.equal(byId.get('owner-recovery').state, 'BLOCKED');
  assert.equal(byId.get('owner-recovery').detail, '1 active passkey(s)');
  assert.equal(byId.get('billing').detail, 'missing: STRIPE_WEBHOOK_SECRET');
  assert.equal(byId.get('api-key').detail, '0 active of 2');
  assert.equal(byId.get('incidents').detail, '3 event(s) in the last 24h');
  assert.equal(byId.get('origin').state, 'BLOCKED');
});

test('manual items never pass by themselves', () => {
  const items = evaluateLaunch(GOOD);
  const manual = items.filter((item) => item.kind === 'manual');
  assert.equal(manual.length, 3);
  assert.equal(manual.every((item) => item.state === 'MANUAL'), true);
  const verdict = launchVerdict(items);
  assert.equal(verdict.ready, false);
  assert.equal(verdict.blocked, 0);
  assert.equal(verdict.manual, 3);
});

test('the verdict is ready only with no measured failure and no manual item', () => {
  assert.equal(launchVerdict(LAUNCH_ITEMS.map((item) => ({ ...item, state: 'PASS' }))).ready, true);
  assert.equal(launchVerdict(evaluateLaunch({ ...GOOD, eventsLastDay: 1 })).ready, false);
});

test('the page states the verdict and every row without scripts', () => {
  const blocked = launchSection({ items: evaluateLaunch({ ...GOOD, eventsLastDay: 2 }), verdict: launchVerdict(evaluateLaunch({ ...GOOD, eventsLastDay: 2 })) });
  assert.match(blocked, /Launch is blocked: 1 measured gate\(s\) failing, 3 manual decision\(s\) pending/u);
  assert.match(blocked, /2 event\(s\) in the last 24h/u);
  assert.doesNotMatch(blocked, /<script/iu);
  const allPass = LAUNCH_ITEMS.map((item) => ({ ...item, state: 'PASS', detail: 'x' }));
  assert.match(launchSection({ items: allPass, verdict: launchVerdict(allPass) }), /Every measured gate passed/u);
});

test('the admin route serves the launch gate behind the owner session', () => {
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ["path === '/admin/launch'", 'evaluateLaunch', 'launchVerdict', 'launchSection']) {
    assert.ok(route.includes(marker), marker);
  }
  const dashboard = readFileSync('src/modules/CB-M05/p1-production/owner-auth.mjs', 'utf8');
  assert.match(dashboard, /href="\/admin\/launch"/u);
});
