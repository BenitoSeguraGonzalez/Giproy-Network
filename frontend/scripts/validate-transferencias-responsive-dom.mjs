import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4252;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32'
  ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)]
  : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: 'ignore', windowsHide: true });
const cleanup = () => process.platform === 'win32' && vite.pid
  ? spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' })
  : vite.kill();
const wait = async () => {
  for (let index = 0; index < 120; index += 1) {
    try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Vite no respondió para Transferencias');
};

const tray = {
  items: [
    { id: 1, direction: 'entrada', company_display_name: 'Empresa Andina', company_name: 'Andina S.A.', asset_name: 'Proyecto Hospital', asset_type: 'proyecto', status: 'listo_para_importar', status_label: 'Listo para importar', status_color: 'green', received_at: '2026-07-24T12:00:00Z', timeline: [{ type: 'creado', at: '2026-07-24T12:00:00Z' }] },
    { id: 2, direction: 'salida', company_display_name: 'Consorcio Norte', company_name: 'Norte S.A.', asset_name: 'Base Quito 2026', asset_type: 'base_trabajo', status: 'enviado', status_label: 'Enviado', status_color: 'blue', sent_at: '2026-07-24T11:00:00Z', timeline: [] },
  ],
  metrics: { total: 2, entrada: 1, salida: 1, pendientes: 1 },
  states: [],
};
const recipients = { items: [{ id: 4, company_display_name: 'Empresa Andina' }], fixed_limit: 3, fixed_used: 1, fixed_available: 2, additional_limit: 0, additional_used: 0, additional_available: 0 };
const profiles = [
  { name: 'desktop', width: 1920, height: 1080, touch: false },
  { name: 'tablet-landscape', width: 1472, height: 820, touch: true },
  { name: 'tablet-portrait', width: 920, height: 1472, touch: true },
];

let browser;
try {
  await wait();
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
  for (const profile of profiles) {
    const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, hasTouch: profile.touch, isMobile: profile.touch, deviceScaleFactor: profile.touch ? 2 : 1 });
    await context.addInitScript(() => localStorage.setItem('giproy_adaptive_ui_pilot', 'true'));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/v1/**', (route) => route.fulfill({ json: {} }));
    await page.route('**/api/v1/transferencias/tray**', (route) => route.fulfill({ json: tray }));
    await page.route('**/api/v1/transferencias/recipients**', (route) => route.fulfill({ json: recipients }));
    await page.goto(`${baseUrl}/transferencias-responsive-harness.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-transferencias-workspace="true"]').waitFor();
    await page.getByText('Proyecto Hospital').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, `${profile.name}: sin overflow de pagina`);
    const traySection = page.locator('section').filter({ hasText: 'Proyecto Hospital' });
    if (profile.name === 'tablet-portrait') {
      assert.equal(await traySection.evaluate((node) => node.scrollWidth > node.clientWidth), true, 'portrait: la tabla conserva scroll horizontal interno');
    }
    if (profile.touch) {
      const undersized = await page.locator('[data-adaptive-touch-target="true"]:visible').evaluateAll((nodes) => nodes.filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width < 43.5 || rect.height < 43.5;
      }).length);
      assert.equal(undersized, 0, `${profile.name}: acciones táctiles de 44px`);
    }
    await page.getByTitle('Historial').first().click();
    await page.locator('[data-transfer-timeline-modal="true"]').waitFor();
    assert.deepEqual(errors, [], `${profile.name}: sin errores JS`);
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-transferencias-${profile.name}.png`, fullPage: true });
    await context.close();
  }
  console.log('validate-transferencias-responsive-dom: ok');
} finally {
  await browser?.close();
  cleanup();
}
