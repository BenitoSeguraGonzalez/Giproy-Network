import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4233;
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
        for (const viewport of [{ width: 1280, height: 820 }, { width: 390, height: 844 }]) {
            const page = await browser.newPage({ viewport });
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            await page.goto(`${baseUrl}/bim-productivity-harness.html`);
            await page.getByLabel('Rendimiento por cuadrilla y día').fill('2');
            await page.getByLabel('Cantidad de cuadrillas').fill('2');
            await page.getByLabel('Código de recurso 4D').fill('MO-01');
            await page.getByLabel('Nombre de recurso 4D').fill('Cuadrilla mampostería');
            await page.waitForSelector('[data-bim-productivity-duration="2.5"]');
            await page.getByRole('button', { name: 'Proponer rendimiento' }).click();
            await page.waitForSelector('[data-bim-productivity-status="pending"]');
            await page.getByLabel('Motivo de decisión de rendimiento').fill('Validado por coordinación');
            await page.getByRole('button', { name: 'Aprobar' }).click();
            await page.waitForSelector('[data-bim-productivity-status="approved"]');
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally { await browser.close(); }
    console.log('validate-bim-productivity-dom: ok');
} finally { cleanup(); }
