import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const appLayoutSource = readFileSync(new URL('../src/layouts/AppLayout.jsx', import.meta.url), 'utf8');
const dashboardSource = readFileSync(new URL('../src/pages/Dashboard.jsx', import.meta.url), 'utf8');
const monitorSource = readFileSync(new URL('../src/utils/releaseVersionMonitor.js', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const packageLock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
const visualInventory = JSON.parse(readFileSync(new URL('../../docs/architecture/visual-surface-inventory.json', import.meta.url), 'utf8'));
const expectedVersionPattern = new RegExp(`v${String(packageJson.version).replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}`, 'i');
assert.match(appLayoutSource, /data-app-version/, 'La cabecera protegida debe mostrar la version');
assert.match(dashboardSource, /data-dashboard-footer/, 'El Dashboard debe conservar un footer identificable');
assert.match(dashboardSource, /data-dashboard-version/, 'El Dashboard debe identificar su version visible');
assert.match(monitorSource, /visibilitychange/, 'Las sesiones abiertas deben comprobar la release al recuperar foco');
assert.match(monitorSource, /window\.location\.replace/, 'Una release distinta debe recargar la SPA una sola vez');
assert.equal(packageLock.version, packageJson.version, 'package-lock y package.json deben publicar la misma version');
assert.equal(packageLock.packages?.['']?.version, packageJson.version, 'El paquete raiz del lock debe publicar la misma version');

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
  const versionManifest = externalBaseUrl
    ? await (await fetch(`${baseUrl}/version.json`, { cache: 'no-store' })).json()
    : JSON.parse(readFileSync(new URL('../dist/version.json', import.meta.url), 'utf8'));
  assert.equal(versionManifest.version, packageJson.version, 'version.json debe coincidir con la fuente canonica');
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  });

  for (const profile of visualInventory.profiles) {
    const [width, height] = profile.viewport;
    const context = await browser.newContext({
      viewport: { width, height },
      screen: { width, height },
      deviceScaleFactor: profile.dpr,
      hasTouch: profile.touch,
      isMobile: profile.touch,
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    const version = page.locator('[data-app-version]');
    await version.waitFor();
    assert.equal(await version.isVisible(), true, `${profile.id}: version visible en login`);
    assert.match(await version.innerText(), expectedVersionPattern, `${profile.id}: version de release correcta`);

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
    assert.equal(await footer.isVisible(), true, `${profile.id}: footer del login alcanzable`);
    assert.ok(reachability.footerBottom <= reachability.viewportBottom + 1, `${profile.id}: footer dentro del viewport tras scroll`);

    await page.goto(`${baseUrl}/classic-dashboard-harness.html`, { waitUntil: 'domcontentloaded' });
    const dashboardFooter = page.locator('[data-dashboard-footer]');
    const dashboardVersion = page.locator('[data-dashboard-version]');
    await dashboardFooter.waitFor();
    const dashboardGeometry = await dashboardFooter.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const buttons = [...node.querySelectorAll('button')].map((button) => {
        const buttonRect = button.getBoundingClientRect();
        return { width: buttonRect.width, height: buttonRect.height };
      });
      return {
        top: rect.top,
        bottom: rect.bottom,
        viewportHeight: window.innerHeight,
        documentOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        buttons,
      };
    });
    assert.equal(await dashboardFooter.isVisible(), true, `${profile.id}: footer del dashboard visible`);
    assert.equal(await dashboardVersion.isVisible(), true, `${profile.id}: version del dashboard visible`);
    assert.match(await dashboardVersion.innerText(), expectedVersionPattern, `${profile.id}: dashboard y release coinciden`);
    assert.ok(dashboardGeometry.top >= -1 && dashboardGeometry.bottom <= dashboardGeometry.viewportHeight + 1, `${profile.id}: footer contenido en viewport`);
    assert.ok(dashboardGeometry.documentOverflowX <= 2, `${profile.id}: dashboard sin overflow horizontal`);
    assert.ok(dashboardGeometry.buttons.length >= 3, `${profile.id}: indicadores de modulos presentes`);
    assert.ok(dashboardGeometry.buttons.every(({ width: buttonWidth, height: buttonHeight }) => buttonWidth >= 44 && buttonHeight >= 44), `${profile.id}: indicadores tactiles de al menos 44x44`);
    await page.close();
    await context.close();
  }

  console.log(`validate-release-visibility-dom: ok (${visualInventory.profiles.length} perfiles desktop/tablet)`);
} finally {
  await browser?.close();
  cleanup();
}
