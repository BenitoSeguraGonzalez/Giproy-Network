import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';

const port = 4268;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: 'ignore', windowsHide: true });
for (let i = 0; i < 120; i += 1) { try { if ((await fetch(baseUrl)).ok) break; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); }
let browser;
try {
    assert.equal((await fetch(`${baseUrl}/bim-actual-cost-ledger-harness.html`)).ok, true); browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 1920, height: 1080, label: '1920x1080' }, { width: 2560, height: 1440, label: '2560x1440' }]) {
        const context = await browser.newContext({ viewport }); const page = await context.newPage(); const errors = [];
        page.on('pageerror', (error) => errors.push(error.message)); page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
        await page.goto(`${baseUrl}/bim-actual-cost-ledger-harness.html`, { waitUntil: 'domcontentloaded' }); await page.locator('[data-bim-actual-cost-ledger]').waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
        if (viewport.width === 1920) { await page.getByRole('button', { name: 'Conciliar' }).click(); await page.waitForFunction(() => document.querySelector('[data-bim-actual-cost-entries]')?.textContent.includes('1.800')); assert.match(await page.locator('[data-bim-actual-cost-ledger]').textContent(), /2 \/ 2/); }
        assert.deepEqual(errors, []); await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-actual-cost-${viewport.label}.png`, fullPage: true }); await context.close();
    }
    console.log('validate-bim-actual-cost-ledger-dom: ok');
} finally { await browser?.close(); }
try { spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
