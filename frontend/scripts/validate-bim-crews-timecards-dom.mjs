import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4257;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)] : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout?.on('data', (chunk) => { output += chunk; });
vite.stderr?.on('data', (chunk) => { output += chunk; });
const cleanup = () => { if (!vite.killed && process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); else if (!vite.killed) vite.kill(); };
const waitForServer = async () => { const end = Date.now() + 40000; while (Date.now() < end) { try { if ((await fetch(baseUrl)).ok) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(output); };
let browser;
try {
    await waitForServer();
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 1920, height: 900, label: '1920x900' }, { width: 2560, height: 1300, label: '2560x1300' }]) {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
        await page.goto(`${baseUrl}/bim-crews-timecards-harness.html`, { waitUntil: 'domcontentloaded' });
        await page.locator('[data-bim-crews-timecards]').waitFor();
        assert.equal(await page.locator('[data-bim-timecard-ledger] article').count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
        if (viewport.width === 1920) {
            await page.getByRole('tab', { name: 'Directorio' }).click();
            await page.getByLabel('Código de cuadrilla').fill('CU-ACA-02');
            await page.getByLabel('Nombre de cuadrilla').fill('Cuadrilla acabados 2');
            await page.getByLabel('Especialidad de cuadrilla').fill('Acabados');
            await page.getByLabel('Tamaño de cuadrilla').fill('6');
            await page.getByRole('button', { name: 'Crear cuadrilla' }).click();
            await page.waitForFunction(() => document.querySelector('[data-bim-crew-directory]')?.textContent.includes('CU-ACA-02'));
            await page.getByRole('tab', { name: 'Partes' }).click();
            await page.getByLabel('Actividad del parte').selectOption('11');
            await page.getByLabel('Fecha del parte').fill('2026-07-17');
            await page.getByLabel('Producción instalada').fill('18');
            await page.getByLabel('Nota del parte').fill('Jornada verificada');
            await page.getByRole('button', { name: 'Registrar parte' }).click();
            await page.waitForFunction(() => document.querySelector('[data-bim-timecard-ledger]')?.textContent.includes('Jornada verificada'));
        }
        assert.deepEqual(errors, []);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-crews-timecards-${viewport.label}.png`, fullPage: true });
        await context.close();
    }
    console.log('validate-bim-crews-timecards-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
