import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4230;
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
        for (const viewport of [{ width: 1920, height: 1080 }, { width: 2560, height: 1440 }]) {
            const page = await browser.newPage({ viewport });
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            await page.goto(`${baseUrl}/bim-timeline-4d-harness.html`);
            await page.waitForSelector('[data-bim-fragments-product="loaded"] canvas');
            assert.equal(await page.locator('[data-bim-temporal-active="false"]').count(), 1);
            await page.getByLabel('Activar secuencia 4D').check();
            await page.getByLabel('Fecha de corte 4D').fill('2026-08-01');
            await page.waitForSelector('[data-bim-temporal-hidden="1"]');
            await page.getByLabel('Fecha de corte 4D').fill('2026-08-05');
            await page.waitForSelector('[data-bim-temporal-colors="1"]');
            await page.getByLabel('Posición temporal 4D').fill('7');
            await page.waitForSelector('[data-bim-timeline-date="2026-08-08"]');
            await page.getByLabel('Retroceder un día 4D').click();
            await page.waitForSelector('[data-bim-timeline-date="2026-08-07"]');
            await page.getByLabel('Velocidad de reproducción 4D').selectOption('4');
            await page.getByLabel('Reproducir secuencia 4D').click();
            await page.waitForSelector('[data-bim-timeline-date="2026-08-10"]', { timeout: 5000 });
            await page.getByLabel('Actividad visible 4D').selectOption('0p3fMZQGz7KxQ1YkSm0020');
            await page.getByLabel('Enfocar actividad 4D').click();
            await page.waitForSelector('[data-bim-timeline-focused-guid="0p3fMZQGz7KxQ1YkSm0020"]');
            assert.equal(await page.getByLabel('Ocultar selección').isDisabled(), true);
            await page.getByLabel('Activar secuencia 4D').uncheck();
            await page.waitForSelector('[data-bim-temporal-active="false"][data-bim-temporal-items="0"]');
            const canvasPixels = await page.locator('canvas[data-bim-fragments-product-canvas="true"]').evaluate((canvas) => {
                const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
                const pixels = new Uint8Array(canvas.width * canvas.height * 4);
                context.readPixels(0, 0, canvas.width, canvas.height, context.RGBA, context.UNSIGNED_BYTE, pixels);
                return pixels.some((value, index) => index % 4 !== 3 && value > 0);
            });
            assert.equal(canvasPixels, true);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
            assert.deepEqual(errors, []);
            await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-timeline-4d-${viewport.width}x${viewport.height}.png`, fullPage: true });
            await page.close();
        }
    } finally { await browser.close(); }
    console.log('validate-bim-timeline-4d-dom: ok');
} finally { cleanup(); }
