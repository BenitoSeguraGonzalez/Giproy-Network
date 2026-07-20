import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4252; const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)] : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = ''; vite.stdout?.on('data', (chunk) => { output += chunk.toString(); }); vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });
const cleanup = () => { if (!vite.killed && process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); else if (!vite.killed) vite.kill(); };
const waitForServer = async () => { const deadline = Date.now() + 40000; while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ } await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(`Vite no respondio. ${output}`); };

let browser;
try {
    await waitForServer();
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 1920, height: 900 }, { width: 2560, height: 1300 }]) {
        const context = await browser.newContext({ viewport }); const page = await context.newPage(); const errors = [];
        page.on('pageerror', (error) => errors.push(error.message)); page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
        await page.goto(`${baseUrl}/bim-cde-collaboration-harness.html`, { waitUntil: 'domcontentloaded' });
        const panel = page.locator('[data-bim-cde-collaboration]'); await panel.waitFor();
        await page.getByText('3', { exact: true }).first().waitFor();
        assert.equal(await page.locator('[data-bim-cde-presences] > div').count(), 4, 'Cabecera y tres presencias visibles');
        await page.getByRole('button', { name: 'Actualizar actividad CDE' }).click();
        await page.getByText('REV-0017', { exact: false }).first().waitFor();
        assert.equal(await page.locator('[data-bim-cde-collaboration-events] > div').count(), 4, 'Cabecera y tres eventos visibles');
        assert.equal(await page.evaluate(() => (globalThis.__bimCdeFeedCalls || 0) >= 3), true, 'La rafaga CDE drena mas de una pagina');
        assert.match(await panel.innerText(), /María Coordinación BIM[\s\S]*Carlos Estructuras[\s\S]*Lucía Arquitectura/);
        assert.match(await panel.innerText(), /REV-0017/);
        const heartbeatBeforeRecovery = await page.evaluate(() => globalThis.__bimCdeHeartbeatCount || 0);
        await page.evaluate(() => globalThis.dispatchEvent(new Event('online')));
        await page.waitForFunction((previous) => (globalThis.__bimCdeHeartbeatCount || 0) > previous, heartbeatBeforeRecovery);
        await page.locator('[data-bim-switch-project]').evaluate((button) => button.click());
        await page.getByText('Proyecto ocho', { exact: true }).first().waitFor();
        assert.doesNotMatch(await panel.innerText(), /María Coordinación BIM|REV-0017/, 'El cambio de proyecto limpia presencia y feed previos');
        assert.equal(await panel.evaluate((node) => node.scrollWidth > node.clientWidth), false, 'Colaboración sin overflow horizontal');
        assert.deepEqual(errors, [], `Sin errores de consola: ${errors.join(' | ')}`);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-cde-collaboration-${viewport.width}x${viewport.height}.png`, fullPage: true });
        await context.close();
    }
    console.log('validate-bim-cde-collaboration-dom: ok');
} finally { await browser?.close(); cleanup(); }
