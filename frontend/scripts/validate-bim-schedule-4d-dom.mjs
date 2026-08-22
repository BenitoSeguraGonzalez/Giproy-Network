import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4229;
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
    const browser = await chromium.launch({
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });
    try {
        for (const viewport of [{ width: 1920, height: 1080 }, { width: 2560, height: 1440 }]) {
            const page = await browser.newPage({ viewport });
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            await page.goto(`${baseUrl}/bim-schedule-4d-harness.html`);
            assert.equal(await page.getByText('Actividad sincronizada con la selección vigente del Gantt.').count(), 1);
            await page.getByLabel('Motivo del vínculo 4D').fill('Secuencia revisada por coordinación');
            await page.getByLabel('Proponer vínculo 4D').click();
            await page.waitForSelector('[data-bim-4d-proposal-status="pending"]');
            await page.getByLabel('Motivo de decisión 4D').fill('Aprobado para baseline inicial');
            await page.getByLabel('Aprobar vínculo 4D').click();
            await page.waitForSelector('[data-bim-4d-proposal-status="approved"]');
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
            assert.equal(overflow, false);
            assert.deepEqual(errors, []);
            await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-schedule-link-${viewport.width}x${viewport.height}.png`, fullPage: true });
            await page.close();
        }
    } finally {
        await browser.close();
    }
    console.log('validate-bim-schedule-4d-dom: ok');
} finally {
    cleanup();
}
