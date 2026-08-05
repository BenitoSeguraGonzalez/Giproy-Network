import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4263;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout.on('data', (chunk) => { output += chunk; });
vite.stderr.on('data', (chunk) => { output += chunk; });
const cleanup = () => { if (!vite.killed && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); };
const waitForServer = async () => { const deadline = Date.now() + 30000; while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(output); };

try {
    await waitForServer();
    const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    try {
        for (const viewport of [{ width: 1920, height: 1080, label: '1920x1080' }, { width: 2560, height: 1440, label: '2560x1440' }]) {
            const page = await browser.newPage({ viewport });
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            await page.goto(`${baseUrl}/bim-cost-control-harness.html`);
            await page.locator('[data-bim-cost-control-workbench]').waitFor();
            assert.equal(await page.getByRole('navigation', { name: 'Etapas de control económico' }).getByRole('button').count(), 6);
            assert.equal(await page.locator('[data-bim-cost-section="contracts"] [data-bim-cost-contracts]').count(), 1);
            await page.getByRole('button', { name: /Certificaciones/ }).click();
            await page.locator('[data-bim-cost-section="payments"] [data-bim-cost-payments]').waitFor();
            await page.getByRole('button', { name: /Coste real/ }).click();
            await page.locator('[data-bim-cost-section="actuals"] [data-bim-actual-cost-ledger]').waitFor();
            await page.getByRole('button', { name: /Previsión/ }).click();
            await page.locator('[data-bim-cost-section="forecast"] [data-bim-cost-forecast]').waitFor();
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
            assert.deepEqual(errors, []);
            await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-cost-control-${viewport.label}.png`, fullPage: true });
            await page.close();
        }
    } finally { await browser.close(); }
    console.log('validate-bim-cost-control-dom: ok');
} finally { cleanup(); }
