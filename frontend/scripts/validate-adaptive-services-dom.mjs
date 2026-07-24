import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4253;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32'
  ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)]
  : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: 'ignore', windowsHide: true });
const cleanup = () => process.platform === 'win32' && vite.pid
  ? spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' })
  : vite.kill();
const waitForVite = async () => {
  for (let index = 0; index < 120; index += 1) {
    try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Vite no respondió para servicios adaptativos');
};
const profiles = [
  { name: 'desktop', width: 1920, height: 1080, touch: false },
  { name: 'tablet-landscape', width: 1472, height: 820, touch: true },
  { name: 'tablet-portrait', width: 920, height: 1472, touch: true },
];
const product = { id: 11, title: 'Base de precios Quito', name: 'Base de precios Quito', description: 'Catálogo QA', price: 49.9, product_type: 'base_maestra', is_active: true, rating_average: 4.8, seller_name: 'GiProy' };

let browser;
try {
  await waitForVite();
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  for (const profile of profiles) {
    const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, hasTouch: profile.touch, isMobile: profile.touch, deviceScaleFactor: profile.touch ? 2 : 1 });
    await context.addInitScript(() => localStorage.setItem('giproy_adaptive_ui_pilot', 'true'));
    for (const surface of ['marketplace', 'community']) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/api/v1/marketplace/products**', (route) => route.fulfill({ json: [product] }));
      await page.route('**/api/v1/marketplace/categories**', (route) => route.fulfill({ json: [{ id: 1, name: 'Bases' }] }));
      await page.route('**/api/v1/marketplace/payment-methods**', (route) => route.fulfill({ json: [] }));
      await page.route('**/api/v1/community/bootstrap**', (route) => route.fulfill({ json: { active_company_name: 'Constructora QA' } }));
      await page.route('**/api/v1/**', (route) => route.fulfill({ json: [] }));
      await page.goto(`${baseUrl}/adaptive-services-harness.html?page=${surface}`, { waitUntil: 'domcontentloaded' });
      const workspace = page.locator(`[data-${surface}-workspace="true"]`);
      await workspace.waitFor();
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, `${surface}/${profile.name}: sin overflow horizontal de página`);
      const rect = await workspace.evaluate((node) => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }));
      assert.ok(rect.width >= profile.width - 1 && rect.height >= profile.height - 1, `${surface}/${profile.name}: ocupa el viewport útil`);
      assert.deepEqual(errors, [], `${surface}/${profile.name}: sin errores JS`);
      await page.close();
    }
    await context.close();
  }
  console.log('validate-adaptive-services-dom: ok');
} finally {
  await browser?.close();
  cleanup();
}
