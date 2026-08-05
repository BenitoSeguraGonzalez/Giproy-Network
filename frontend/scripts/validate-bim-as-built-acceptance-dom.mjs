import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4265;
const url = `http://127.0.0.1:${port}`;
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: 'ignore', windowsHide: true });
const kill = () => spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
let browser;
try {
    for (let attempt = 0; attempt < 120; attempt += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); }
    browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 1920, height: 900 }, { width: 2560, height: 1300 }]) {
        const page = await browser.newPage({ viewport });
        await page.goto(`${url}/bim-as-built-acceptance-harness.html`);
        await page.locator('[data-bim-as-built-acceptance]').waitFor();
        await page.getByRole('button', { name: /Nueva|Crear|Agregar/i }).first().click();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
        if (viewport.width === 1920) {
            await page.getByLabel('Declaración as-built').fill('Modelo final comprobado contra obra ejecutada.');
            await page.getByRole('button', { name: 'Presentar para aceptación' }).click();
            await page.getByLabel('Motivo de decisión as-built').fill('Cumple criterios de entrega acordados.');
            await page.getByRole('button', { name: 'Aceptar' }).click();
            await page.waitForFunction(() => document.body.textContent.includes('Aceptada'));
        }
        await page.close();
    }
    console.log('validate-bim-as-built-acceptance-dom: ok');
} finally { await browser?.close(); kill(); }
