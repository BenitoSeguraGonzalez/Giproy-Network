import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4231;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout.on('data', (chunk) => { output += chunk; });
vite.stderr.on('data', (chunk) => { output += chunk; });
const cleanup = () => { if (!vite.killed && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); };
const waitForServer = async () => {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
        try { if ((await fetch(baseUrl)).ok) return; } catch { /* starting */ }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(output);
};

try {
    await waitForServer();
    const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
    try {
        for (const viewport of [{ width: 1920, height: 1080, label: '1920x1080' }, { width: 2560, height: 1440, label: '2560x1440' }]) {
            const page = await browser.newPage({ viewport });
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            await page.goto(`${baseUrl}/bim-plan-actual-harness.html`);
            await page.waitForSelector('[data-bim-deviation-count="2"]');
            assert.equal(await page.locator('[data-bim-deviation-status="behind"]').count(), 1);
            await page.getByLabel('Enfocar A-042 en modelo').click();
            await page.waitForSelector('[data-focused-guid="GUID-4D-001"]');
            assert.equal(await page.getByRole('columnheader', { name: 'Avance plan / real' }).count(), 1);
            assert.equal(await page.getByText('1 de 2 actividades').count(), 0);
            await page.getByRole('button', { name: 'Crear línea base' }).click();
            assert.equal(await page.getByRole('dialog', { name: 'Crear línea base 4D' }).count(), 1);
            await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-plan-actual-baseline-${viewport.label}.png`, fullPage: true });
            await page.getByLabel('Nombre de línea base 4D').fill('Baseline revisión 2');
            await page.getByLabel('Revisión de línea base 4D').fill('BL-002');
            await page.getByLabel('Agregar dependencia 4D').click();
            await page.getByRole('button', { name: 'Guardar línea base' }).click();
            await page.waitForFunction(() => Array.from(document.querySelectorAll('option')).some((option) => option.textContent.includes('BL-002')));
            assert.equal(await page.getByLabel('Línea base 4D', { exact: true }).inputValue(), '92');
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
            assert.deepEqual(errors, []);
            await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-plan-actual-${viewport.label}.png`, fullPage: true });
            await page.close();
        }
    } finally { await browser.close(); }
    console.log('validate-bim-plan-actual-dom: ok');
} finally { cleanup(); }
