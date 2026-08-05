import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4259;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: 'ignore', windowsHide: true });
const cleanup = () => spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
let browser;
try {
    for (let index = 0; index < 120; index += 1) { try { if ((await fetch(baseUrl)).ok) break; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); }
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 1920, height: 1080, label: '1920x1080' }, { width: 2560, height: 1440, label: '2560x1440' }]) {
        const page = await browser.newPage({ viewport });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(`${baseUrl}/bim-cost-contracts-harness.html`);
        await page.locator('[data-bim-cost-contracts]').waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
        if (viewport.width === 1920) {
            await page.getByRole('button', { name: 'Nuevo compromiso' }).click();
            assert.equal(await page.getByRole('dialog', { name: 'Nuevo compromiso contractual' }).count(), 1);
            await page.getByLabel('Número de contrato').fill('CTR-001');
            await page.getByLabel('Importe comprometido').fill('8250.55');
            await page.getByLabel('Objeto del contrato').fill('Estructura principal');
            await page.getByLabel('Contraparte contractual').fill('Constructora Andina');
            await page.getByLabel('Fecha inicial').fill('2026-08-01');
            await page.getByLabel('Fecha final').fill('2026-12-15');
            await page.getByRole('button', { name: 'Crear contrato' }).click();
            await page.waitForFunction(() => document.querySelector('[data-bim-contract-ledger]')?.textContent.includes('CTR-001'));
            await page.getByLabel('Motivo de transición contractual').fill('Contrato adjudicado');
            await page.getByRole('button', { name: 'Activar' }).click();
            await page.waitForFunction(() => document.querySelector('[data-bim-contract-ledger]')?.textContent.includes('Activo'));
        }
        assert.deepEqual(errors, []);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-cost-contracts-${viewport.label}.png`, fullPage: true });
        await page.close();
    }
    console.log('validate-bim-cost-contracts-dom: ok');
} finally { await browser?.close(); cleanup(); }
