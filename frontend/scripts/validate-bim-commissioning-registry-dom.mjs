import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4266, url = `http://127.0.0.1:${port}`;
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: 'ignore', windowsHide: true });
const kill = () => spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
let browser;
try {
    for (let i = 0; i < 120; i += 1) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); }
    browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 1920, height: 900 }, { width: 2560, height: 1300 }]) {
        const page = await browser.newPage({ viewport }); await page.goto(`${url}/bim-commissioning-registry-harness.html`); await page.locator('[data-bim-commissioning-registry]').waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
        if (viewport.width === 1920) {
            await page.getByRole('button', { name: 'Sistema', exact: true }).click(); await page.getByLabel('Código de sistema').fill('CHW'); await page.getByLabel('Nombre de sistema').fill('Agua helada'); await page.getByRole('button', { name: 'Registrar sistema' }).click();
            await page.getByRole('button', { name: 'Activo', exact: true }).click(); await page.getByLabel('Sistema del activo').selectOption('1'); await page.getByLabel('Tag del activo').fill('P-001'); await page.getByRole('button', { name: 'Registrar activo' }).click(); await page.waitForFunction(() => document.body.textContent.includes('P-001'));
            await page.getByRole('button', { name: 'Prueba', exact: true }).click(); await page.getByLabel('Activo de la prueba').selectOption('1'); await page.getByLabel('Código de protocolo').fill('SAT-01'); await page.getByLabel('Nombre de protocolo').fill('Prueba funcional'); await page.getByLabel('Lista de comprobación').fill('Arranque\nParada'); await page.getByLabel('Resultado de prueba').fill('Caudal 1250 m3/h'); await page.getByRole('button', { name: 'Presentar prueba' }).click(); await page.waitForFunction(() => document.body.textContent.includes('SAT-01'));
        }
        await page.close();
    }
    console.log('validate-bim-commissioning-registry-dom: ok');
} finally { await browser?.close(); kill(); }
