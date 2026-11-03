import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1536, height: 900 } });
await p.goto('https://coinblink-production.kayzendev.workers.dev/en', { waitUntil: 'networkidle' });
await p.screenshot({ path: 'shot-home2.png', fullPage: false });
await p.goto('https://coinblink-production.kayzendev.workers.dev/en/article/proton-users-react-to-ceo-s-security-stance', { waitUntil: 'networkidle' });
await p.screenshot({ path: 'shot-article2.png', fullPage: false });
await b.close();
console.log('ok');
