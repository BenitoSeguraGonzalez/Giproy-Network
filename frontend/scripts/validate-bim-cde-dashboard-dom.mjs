import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4250;
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
    page.on('pageerror', (error) => errors.push(error.message)); page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
    await page.goto(`${baseUrl}/bim-cde-dashboard-harness.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-bim-cde-dashboard]').waitFor();
    await page.getByText('18', { exact: true }).first().waitFor();
    assert.match(await page.locator('[data-bim-cde-metrics]').innerText(), /7[\s\S]*2 vencidos/);
    assert.equal(await page.locator('[data-bim-cde-workload] > div').count(), 3, 'Tres responsables visibles');
    assert.equal(await page.locator('[data-bim-cde-priority-queue] > div').count(), 4, 'Cuatro acciones priorizadas');
    assert.match(await page.locator('[data-bim-cde-priority-queue]').innerText(), /RFI-0042/);
    const panel = page.locator('[data-bim-cde-dashboard]');
    assert.equal(await panel.evaluate((node) => node.scrollWidth > node.clientWidth), false, 'Dashboard sin overflow horizontal');
    assert.deepEqual(errors, [], `Sin errores de consola: ${errors.join(' | ')}`);
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-cde-dashboard-1920x1080.png`, fullPage: true });
    await context.close(); console.log('validate-bim-cde-dashboard-dom: ok');
} finally { await browser?.close(); cleanup(); }
