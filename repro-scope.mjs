import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const pages = ['http://localhost:3000/', 'http://localhost:3000/about', 'http://localhost:3000/events', 'http://localhost:3000/nominee/A3243'];

for (const url of pages) {
  const page = await browser.newPage();
  let errored = false;
  page.on('pageerror', (err) => { errored = true; console.log(`[${url}] ERROR:`, err.message); });
  await page.goto(url, { waitUntil: 'load', timeout: 30000 }).catch((e) => console.log(`[${url}] goto failed:`, e.message));
  await page.waitForTimeout(1000);
  if (!errored) console.log(`[${url}] OK`);
  await page.close();
}
await browser.close();
