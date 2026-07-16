import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4268, url = `http://127.0.0.1:${port}`;
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: 'ignore', windowsHide: true });
const kill = () => spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
let browser;
try {
    for (let index = 0; index < 120; index += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); }
    browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 1920, height: 900 }, { width: 2560, height: 1300 }]) {
        const page = await browser.newPage({ viewport }); await page.goto(`${url}/bim-handover-dossier-harness.html`); await page.locator('[data-bim-handover-dossier]').waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
        if (viewport.width === 1920) { await page.getByLabel('Revisión del dossier digital').fill('HD-1'); await page.getByLabel('Notas de ensamblado del dossier').fill('Fuentes gobernadas verificadas para entrega'); await page.getByRole('button', { name: 'Ensamblar dossier' }).click(); await page.waitForFunction(() => document.body.textContent.includes('HD-1') && document.body.textContent.includes('3documentos')); await page.getByLabel('Motivo de decisión del dossier').fill('Paquete digital completo y verificado'); await page.getByRole('button', { name: 'Aceptar' }).click(); await page.waitForFunction(() => document.body.textContent.includes('accepted')); }
        await page.close();
    }
    console.log('validate-bim-handover-dossier-dom: ok');
} finally { await browser?.close(); kill(); }
