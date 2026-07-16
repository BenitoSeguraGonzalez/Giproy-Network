import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4254; const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)] : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = ''; vite.stdout?.on('data', (chunk) => { output += chunk.toString(); }); vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });
const cleanup = () => { if (!vite.killed && process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); else if (!vite.killed) vite.kill(); };
const waitForServer = async () => { const deadline = Date.now() + 40000; while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ } await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(`Vite no respondio. ${output}`); };

let browser;
try {
    await waitForServer(); browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 1920, height: 900, label: '1920x900' }, { width: 2560, height: 1300, label: '2560x1300' }]) {
        const context = await browser.newContext({ viewport }); const page = await context.newPage(); const errors = [];
        page.on('pageerror', (error) => errors.push(error.message)); page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
        await page.goto(`${baseUrl}/bim-field-inspections-harness.html`, { waitUntil: 'domcontentloaded' }); const panel = page.locator('[data-bim-field-inspections]'); await panel.waitFor();
        assert.equal(await page.locator('[data-bim-inspection-risks] > button').count(), 1, `Riesgo visible en ${viewport.label}`);
        assert.equal(await page.locator('[data-bim-inspection-history] > button').count(), 1, `Historial visible en ${viewport.label}`);
        assert.equal(await page.locator('[data-bim-punch-list] > div').count(), 1, `Punch visible en ${viewport.label}`);
        const box = await panel.boundingBox(); assert.ok(box && box.width >= viewport.width - 50 && box.height >= viewport.height - 50, `Superficie fluida en ${viewport.label}`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, `Sin overflow horizontal en ${viewport.label}`);
        if (viewport.width === 1920) {
            await page.locator('[data-bim-inspection-checklist] button').first().click(); await page.getByLabel('Observación de inspección').fill('Barricada pendiente de reposición.'); await page.getByRole('button', { name: 'Registrar inspección' }).click();
            await page.waitForFunction(() => document.querySelectorAll('[data-bim-inspection-history] > button').length === 2);
            await page.getByLabel('Título de punch item').fill('Reponer barricada'); await page.getByRole('button', { name: 'Agregar hallazgo' }).click();
            await page.waitForFunction(() => document.querySelectorAll('[data-bim-punch-list] > div').length === 2);
            await page.locator('[data-bim-punch-list]').getByRole('button', { name: 'Cerrar' }).first().click();
            await page.waitForFunction(() => document.querySelector('[data-bim-punch-list]')?.textContent.includes('Cerrado'));
        }
        assert.deepEqual(errors, [], `Sin errores de consola en ${viewport.label}: ${errors.join(' | ')}`);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-field-inspections-${viewport.label}.png`, fullPage: true }); await context.close();
    }
    console.log('validate-bim-field-inspections-dom: ok');
} finally { await browser?.close(); cleanup(); }
