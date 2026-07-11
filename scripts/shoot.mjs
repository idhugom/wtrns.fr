import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const exe = readFileSync('/tmp/claude-0/-home-user-wtrns-fr/38328e0c-204b-5a29-b40f-0e926a4d459e/scratchpad/chrome_path.txt', 'utf8').trim();
const base = 'http://localhost:4321';
const shots = [
  { path: '/', name: 'home-desktop', w: 1440, h: 1000, full: true },
  { path: '/', name: 'home-mobile', w: 390, h: 844, full: true },
  { path: '/articles', name: 'articles', w: 1440, h: 1000, full: false },
  { path: '/loi-bourquin-contestation-refus', name: 'article', w: 1440, h: 1000, full: true },
];

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
  await page.goto(base + s.path, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1200);
  // trigger reveals by scrolling
  if (s.full) {
    await page.evaluate(async () => {
      await new Promise((res) => {
        let y = 0; const step = () => { y += 600; scrollTo(0, y); if (y < document.body.scrollHeight) setTimeout(step, 60); else res(); }; step();
      });
    });
    await page.waitForTimeout(600);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: `/tmp/claude-0/-home-user-wtrns-fr/38328e0c-204b-5a29-b40f-0e926a4d459e/scratchpad/${s.name}.png`, fullPage: s.full });
  console.log('shot', s.name);
  await page.close();
}
await browser.close();
console.log('done');
