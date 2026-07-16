import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4248;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)] : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout?.on('data', (chunk) => { output += chunk.toString(); }); vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });
const cleanup = () => { if (!vite.killed && process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); else if (!vite.killed) vite.kill(); };
const waitForServer = async () => { const deadline = Date.now() + 40000; while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ } await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(`Vite no respondio. ${output}`); };

let browser;
try {
    await waitForServer();
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', (error) => errors.push(error.message)); page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('tile.openstreetmap') && !message.text().includes('404')) errors.push(message.text()); });
    await page.goto(`${baseUrl}/bim-site-georeference-harness.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-bim-site-georeference]').waitFor(); await page.locator('.leaflet-container').waitFor();
    assert.equal(await page.locator('.leaflet-interactive').count(), 3, 'Ancla y dos modelos federados visibles');
    assert.match(await page.locator('[data-bim-site-point-count]').innerText(), /2 modelos ubicados/);
    await page.locator('.leaflet-interactive').last().click({ force: true });
    await page.getByText('Versión activa: 42').waitFor();
    await page.getByPlaceholder('Justificación topográfica').fill('Ajuste certificado del punto de control');
    await page.getByLabel('Guardar georreferencia BIM').click();
    await page.getByText('Georreferencia r2 guardada').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'Sin overflow horizontal');
    assert.deepEqual(errors, [], `Sin errores de consola: ${errors.join(' | ')}`);
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-site-georeference-1920x1080.png`, fullPage: true });
    await context.close(); console.log('validate-bim-site-georeference-dom: ok');
} finally { await browser?.close(); cleanup(); }
