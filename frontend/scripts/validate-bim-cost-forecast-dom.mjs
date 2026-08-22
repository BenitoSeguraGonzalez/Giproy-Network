import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4264;
const url = `http://127.0.0.1:${port}`;
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: 'ignore', windowsHide: true });
const cleanup = () => spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
let browser;
try {
    for (let index = 0; index < 120; index += 1) {
        try { if ((await fetch(url)).ok) break; } catch {}
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 1920, height: 1080 }, { width: 2560, height: 1440 }]) {
        const page = await browser.newPage({ viewport });
        await page.goto(`${url}/bim-cost-forecast-harness.html`);
        await page.locator('[data-bim-cost-forecast]').waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
        if (viewport.width === 1920) {
            await page.getByRole('button', { name: 'Nueva previsión' }).click();
            assert.equal(await page.getByRole('dialog', { name: 'Nueva previsión de coste' }).count(), 1);
            await page.getByLabel('Estimado por completar').fill('8000');
            await page.getByLabel('Justificación forecast').fill('Hipótesis aprobable de cierre');
            await page.getByRole('button', { name: 'Crear previsión' }).click();
            await page.getByLabel('Motivo de decisión forecast').fill('Aprobado por dirección');
            await page.getByRole('button', { name: 'Aprobar' }).click();
            await page.waitForFunction(() => document.body.textContent.includes('Aprobado'));
        }
        await page.close();
    }
    console.log('validate-bim-cost-forecast-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
