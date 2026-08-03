import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const expectedOrientation = process.argv[2];
if (!['landscape', 'portrait'].includes(expectedOrientation)) {
  throw new Error('Uso: node scripts/certify-lenovo-tab-p12-device.mjs <landscape|portrait>');
}

const adb = (...args) => {
  const result = spawnSync('adb', args, { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr || `adb ${args.join(' ')} fallo`);
  return result.stdout.trim();
};
const deviceLines = adb('devices', '-l').split(/\r?\n/).slice(1).filter((line) => /\sdevice\b/.test(line));
assert.equal(deviceLines.length, 1, `Se requiere exactamente una tablet ADB autorizada; detectadas: ${deviceLines.length}`);

const model = adb('shell', 'getprop', 'ro.product.model');
assert.match(model, /Lenovo|TB-370|Tab P12/i, `El dispositivo no parece una Lenovo Tab P12: ${model}`);
const physicalSize = adb('shell', 'wm', 'size');
const density = adb('shell', 'wm', 'density');
const chromeVersion = adb('shell', 'dumpsys', 'package', 'com.android.chrome').match(/versionName=([^\s]+)/)?.[1] || 'unknown';

let vite;
let ownsVite = false;
const baseUrl = 'http://127.0.0.1:5173';
try {
  if (!(await fetch(baseUrl).then((response) => response.ok).catch(() => false))) {
    vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32'
      ? ['/c', 'npm', 'run', 'dev', '--', '--host', '0.0.0.0', '--port', '5173']
      : ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '5173'], { cwd: process.cwd(), stdio: 'ignore', windowsHide: true });
    ownsVite = true;
    for (let index = 0; index < 120; index += 1) {
      if (await fetch(baseUrl).then((response) => response.ok).catch(() => false)) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  adb('reverse', 'tcp:5173', 'tcp:5173');
  adb('forward', 'tcp:9222', 'localabstract:chrome_devtools_remote');
  adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', `${baseUrl}/adaptive-app-layout-harness.html`, 'com.android.chrome');

  let browser;
  for (let index = 0; index < 40; index += 1) {
    try { browser = await chromium.connectOverCDP('http://127.0.0.1:9222'); break; } catch { await new Promise((resolve) => setTimeout(resolve, 250)); }
  }
  assert.ok(browser, 'Chrome Android no expuso el endpoint de depuracion remota');
  const context = browser.contexts()[0];
  const page = context.pages()[0] || await context.newPage();
  await page.addInitScript(() => localStorage.setItem('giproy_adaptive_ui_pilot', 'true'));
  await page.route('**/api/v1/**', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/v1/community/bootstrap**', (route) => route.fulfill({ json: { active_company_name: 'Certificacion Lenovo' } }));
  await page.route('**/api/v1/marketplace/products**', (route) => route.fulfill({ json: [{ id: 11, title: 'Base QA', name: 'Base QA', description: 'Certificacion', price: 49.9, product_type: 'base_maestra', is_active: true }] }));
  await page.route('**/api/v1/marketplace/categories**', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/v1/transferencias/tray**', (route) => route.fulfill({ json: { items: [{ id: 1, direction: 'entrada', company_display_name: 'Empresa QA', asset_name: 'Proyecto QA', asset_type: 'proyecto', status: 'listo_para_importar', status_label: 'Listo', timeline: [] }], metrics: {}, states: [] } }));
  await page.route('**/api/v1/transferencias/recipients**', (route) => route.fulfill({ json: { items: [], fixed_limit: 3, fixed_used: 0, fixed_available: 3 } }));

  const outputDir = `artifacts/device-certification/${new Date().toISOString().slice(0, 10)}/${expectedOrientation}`;
  await mkdir(outputDir, { recursive: true });
  const surfaces = [
    { name: 'shell', url: '/adaptive-app-layout-harness.html', selector: '[data-adaptive-profile]' },
    { name: 'formula', url: '/formula-responsive-harness.html', selector: '[data-formula-polinomica-workspace="true"]' },
    { name: 'marketplace', url: '/adaptive-services-harness.html?page=marketplace', selector: '[data-marketplace-workspace="true"]' },
    { name: 'community', url: '/adaptive-services-harness.html?page=community', selector: '[data-community-workspace="true"]' },
    { name: 'transferencias', url: '/transferencias-responsive-harness.html', selector: '[data-transferencias-workspace="true"]' },
    { name: 'bim', url: '/bim-workspace-v2-harness.html', selector: '[data-bim-workspace-v2]' },
  ];
  const results = [];
  for (const surface of surfaces) {
    const errors = [];
    const onError = (error) => errors.push(error.message);
    page.on('pageerror', onError);
    await page.goto(`${baseUrl}${surface.url}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator(surface.selector).first().waitFor({ timeout: 30000 });
    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      visualWidth: window.visualViewport?.width || null,
      visualHeight: window.visualViewport?.height || null,
      devicePixelRatio: window.devicePixelRatio,
      orientation: screen.orientation?.type || null,
      touchPoints: navigator.maxTouchPoints,
      coarsePointer: matchMedia('(pointer: coarse)').matches,
      hover: matchMedia('(hover: hover)').matches,
      pageOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }));
    assert.equal(metrics.orientation?.startsWith(expectedOrientation), true, `${surface.name}: orientacion real ${metrics.orientation}`);
    assert.ok(metrics.touchPoints > 0 && metrics.coarsePointer, `${surface.name}: capacidades touch no detectadas`);
    assert.equal(metrics.pageOverflowX, false, `${surface.name}: overflow horizontal de pagina`);
    assert.deepEqual(errors, [], `${surface.name}: errores JavaScript`);
    await page.screenshot({ path: `${outputDir}/${surface.name}.png`, fullPage: true });
    results.push({ surface: surface.name, ...metrics, errors });
    page.off('pageerror', onError);
  }
  const report = { certifiedAt: new Date().toISOString(), expectedOrientation, model, physicalSize, density, chromeVersion, adbDevice: deviceLines[0], results };
  await writeFile(`${outputDir}/report.json`, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(report, null, 2));
} finally {
  try { adb('forward', '--remove', 'tcp:9222'); } catch { /* cleanup */ }
  try { adb('reverse', '--remove', 'tcp:5173'); } catch { /* cleanup */ }
  if (ownsVite && vite?.pid) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
    else vite.kill();
  }
}
