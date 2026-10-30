import { expect, test } from '@playwright/test';

// This suite hits the actual built Cloudflare/Astro preview, not a route mock.
// The experimental M05 Admin bridge must be dead on *every* deployed build,
// regardless of fake Browser headers, query parameters or cookies.
for (const route of ['/admin', '/admin/workspace', '/admin/articles', '/admin/settings', '/admin/drafts', '/admin/security', '/admin/analytics']) {
  test('M05 production-build /admin is strictly unavailable: ' + route, async ({ page, request }) => {
    const externalRequests = [];
    page.on('request', entry => {
      if (new URL(entry.url()).origin !== 'http://127.0.0.1:4321') externalRequests.push(entry.url());
    });
    const probe = await request.get(route, {
      headers: {
        'x-cb-owner': 'true',
        'x-cb-admin-test': 'true',
        'sec-fetch-site': 'same-origin',
        cookie: '__Host-cb_m05_local=' + 'aa'.repeat(32),
      },
    });
    expect(probe.status()).toBe(404);
    expect(probe.headers()['set-cookie']).toBeUndefined();
    const visited = await page.goto(route);
    expect(visited?.status()).toBe(404);
    await expect(page.locator('input[type="password"], [data-m05-local-editor], #draft')).toHaveCount(0);
    expect(await page.context().cookies()).toEqual([]);
    expect(externalRequests).toEqual([]);
  });
}

for (const route of ['/admin/login', '/admin/bootstrap']) {
  test('M05 owner entry points fail closed without the production owner environment: ' + route, async ({ request }) => {
    const probe = await request.get(route, {
      headers: { 'sec-fetch-site': 'same-origin', cookie: '__Host-cb_owner=' + 'aa'.repeat(32) },
    });
    expect(probe.status()).toBe(404);
    expect(probe.headers()['set-cookie']).toBeUndefined();
  });
}
