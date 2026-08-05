import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4260;
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
        await page.goto(`${baseUrl}/bim-cost-payments-harness.html`);
        await page.locator('[data-bim-cost-payments]').waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
        if (viewport.width === 1920) {
            await page.getByRole('button', { name: 'Nueva solicitud' }).click();
            assert.equal(await page.getByRole('dialog', { name: 'Nueva solicitud de certificación' }).count(), 1);
            await page.getByLabel('Número de solicitud').fill('PAY-001');
            await page.getByLabel('Inicio del periodo').fill('2026-08-01');
            await page.getByLabel('Fin del periodo').fill('2026-08-31');
            await page.getByLabel('Bruto solicitado').fill('4000');
            await page.getByLabel('Retención solicitada').fill('400');
            await page.getByRole('button', { name: 'Crear solicitud' }).click();
            await page.waitForFunction(() => document.querySelector('[data-bim-payment-ledger]')?.textContent.includes('PAY-001'));
            await page.getByRole('button', { name: 'Enviar a revisión' }).click();
            await page.getByLabel('Motivo de certificación').fill('Avance comprobado en obra');
            await page.getByRole('button', { name: 'Certificar' }).click();
            await page.waitForFunction(() => document.querySelector('[data-bim-payment-ledger]')?.textContent.includes('Certificado'));
        }
        assert.deepEqual(errors, []);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-cost-payments-${viewport.label}.png`, fullPage: true });
        await page.close();
    }
    console.log('validate-bim-cost-payments-dom: ok');
} finally { await browser?.close(); cleanup(); }
