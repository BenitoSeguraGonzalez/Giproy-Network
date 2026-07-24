import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const appLayoutSource = readFileSync(new URL('../src/layouts/AppLayout.jsx', import.meta.url), 'utf8');
const dashboardSource = readFileSync(new URL('../src/pages/Dashboard.jsx', import.meta.url), 'utf8');
const monitorSource = readFileSync(new URL('../src/utils/releaseVersionMonitor.js', import.meta.url), 'utf8');
assert.match(appLayoutSource, /data-app-version/, 'La cabecera protegida debe mostrar la version');
assert.match(dashboardSource, /data-dashboard-footer/, 'El Dashboard debe conservar un footer identificable');
assert.match(monitorSource, /visibilitychange/, 'Las sesiones abiertas deben comprobar la release al recuperar foco');
assert.match(monitorSource, /window\.location\.replace/, 'Una release distinta debe recargar la SPA una sola vez');

const port = 4245;
const externalBaseUrl = process.env.RELEASE_BASE_URL?.replace(/\/$/, '');
const baseUrl = externalBaseUrl || `http://127.0.0.1:${port}`;
const vite = externalBaseUrl ? null : spawn(
  process.platform === 'win32' ? 'cmd.exe' : 'npm',
  process.platform === 'win32'
    ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)]
    : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)],
  { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
);
let output = '';
vite?.stdout?.on('data', (chunk) => { output += chunk.toString(); });
vite?.stderr?.on('data', (chunk) => { output += chunk.toString(); });

const cleanup = () => {
  if (!vite || vite.killed) return;
  if (process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
  else vite.kill();
};

const waitForServer = async () => {
  const deadline = Date.now() + 40_000;
  while (Date.now() < deadline) {
    try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Vite no respondio. ${output}`);
};

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  });

  for (const profile of [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet-short-viewport', width: 920, height: 600 },
    { name: 'tablet-portrait', width: 920, height: 1472 },
  ]) {
    const page = await browser.newPage({ viewport: { width: profile.width, height: profile.height } });
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    const version = page.locator('[data-app-version]');
    await version.waitFor();
    assert.equal(await version.isVisible(), true, `${profile.name}: version visible en login`);
    assert.match(await version.innerText(), /v3\.1\.0-beta\.2/i, `${profile.name}: version de release correcta`);

    const footer = page.locator('[data-login-footer]');
    const reachability = await page.locator('[data-login-viewport]').evaluate((viewport) => {
      viewport.scrollTop = viewport.scrollHeight;
      const footerElement = viewport.querySelector('[data-login-footer]');
      const viewportRect = viewport.getBoundingClientRect();
      const footerRect = footerElement.getBoundingClientRect();
      return {
        scrollTop: viewport.scrollTop,
        footerBottom: footerRect.bottom,
        viewportBottom: viewportRect.bottom,
      };
    });
    assert.equal(await footer.isVisible(), true, `${profile.name}: footer del login alcanzable`);
    assert.ok(reachability.footerBottom <= reachability.viewportBottom + 1, `${profile.name}: footer dentro del viewport tras scroll`);
    await page.close();
  }

  console.log('validate-release-visibility-dom: ok (desktop y tablet)');
} finally {
  await browser?.close();
  cleanup();
}
