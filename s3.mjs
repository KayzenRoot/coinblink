import { chromium } from '@playwright/test';
const b = await chromium.launch();
for (const w of [692, 1152]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto('https://coinblink-production.kayzendev.workers.dev/en', { waitUntil: 'networkidle' });
  await p.screenshot({ path: `m${w}.png`, fullPage: true });
  const geo = await p.evaluate(() => {
    const box = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), scrollH: el.scrollHeight, clientH: el.clientHeight }; };
    return { hero: box('.hero-panel'), copy: box('.hero-copy'), h1: box('#hero-title'), stat: box('.hero-stat'), market: box('.market-panel'), list: box('.market-list'), ticker: box('.ticker-strip'), trend: box('.trending-strip'), rail: box('.category-rail'), news: box('.news-panel'), cards: box('.news-cards'), card: box('.news-card'), art: box('.news-card .news-art'), dock: box('.newsletter-panel') };
  });
  console.log(w, JSON.stringify(geo));
  await p.close();
}
await b.close();
