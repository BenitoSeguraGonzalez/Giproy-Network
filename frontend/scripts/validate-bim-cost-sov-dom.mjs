import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4261; const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)] : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = ''; vite.stdout?.on('data', (chunk) => output += chunk); vite.stderr?.on('data', (chunk) => output += chunk);
const cleanup = () => { if (!vite.killed && process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); else if (!vite.killed) vite.kill(); };
const wait = async () => { const end = Date.now() + 40000; while (Date.now() < end) { try { if ((await fetch(baseUrl)).ok) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(output); };
let browser;
try {
    await wait(); browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 1920, height: 1080, label: '1920x1080' }, { width: 2560, height: 1440, label: '2560x1440' }]) {
        const context = await browser.newContext({ viewport }); const page = await context.newPage(); const errors = [];
        page.on('pageerror', (error) => errors.push(error.message)); page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
        await page.goto(`${baseUrl}/bim-cost-sov-harness.html`, { waitUntil: 'domcontentloaded' }); await page.locator('[data-bim-cost-sov]').waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
        if (viewport.width === 1920) {
            await page.getByRole('button', { name: 'Nueva revisión' }).click();
            await page.getByLabel('Código SOV 1').fill('01'); await page.getByLabel('Descripción SOV 1').fill('Cimentación'); await page.getByLabel('Valor SOV 1').fill('5000');
            await page.getByLabel('Añadir línea SOV').click(); await page.getByLabel('Código SOV 2').fill('02'); await page.getByLabel('Descripción SOV 2').fill('Estructura'); await page.getByLabel('Valor SOV 2').fill('4000');
            await page.getByRole('button', { name: 'Crear revisión SOV' }).click(); await page.waitForFunction(() => document.querySelector('[data-bim-sov-ledger]')?.textContent.includes('SOV-R1'));
            await page.getByLabel('Motivo de decisión SOV').fill('Asignación contractual aprobada'); await page.getByRole('button', { name: 'Aprobar' }).click(); await page.waitForFunction(() => document.querySelector('[data-bim-sov-ledger]')?.textContent.includes('Aprobado'));
        }
        assert.deepEqual(errors, []); await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-cost-sov-${viewport.label}.png`, fullPage: true }); await context.close();
    }
    console.log('validate-bim-cost-sov-dom: ok');
} finally { await browser?.close(); cleanup(); }
