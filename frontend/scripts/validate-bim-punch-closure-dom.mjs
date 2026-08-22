import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4267, url = `http://127.0.0.1:${port}`;
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: 'ignore', windowsHide: true });
const kill = () => spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
let browser;
try {
    for (let index = 0; index < 120; index += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); }
    browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 1920, height: 900 }, { width: 2560, height: 1300 }]) {
        const page = await browser.newPage({ viewport }); await page.goto(`${url}/bim-punch-closure-harness.html`); await page.locator('[data-bim-punch-closure]').waitFor();
        await page.getByRole('button', { name: /Nuevo cierre|Crear cierre/i }).click();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
        if (viewport.width === 1920) { await page.getByLabel('Revisión de cierre punch').fill('PC-1'); await page.getByLabel('Verificación de cierre punch').fill('Recorrido final y evidencias conformes'); await page.getByRole('button', { name: 'Presentar cierre' }).click(); await page.waitForFunction(() => document.body.textContent.includes('PC-1')); await page.getByLabel('Motivo de decisión de cierre punch').fill('Punch list cerrada y verificada'); await page.getByRole('button', { name: 'Aceptar' }).click(); await page.waitForFunction(() => document.body.textContent.includes('accepted')); }
        await page.close();
    }
    console.log('validate-bim-punch-closure-dom: ok');
} finally { await browser?.close(); kill(); }
