import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4242;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)] : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout?.on('data', (chunk) => { output += chunk.toString(); });
vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });
const cleanup = () => { if (!vite.killed && process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); else if (!vite.killed) vite.kill(); };
const waitForServer = async () => {
    const deadline = Date.now() + 40000;
    while (Date.now() < deadline) {
        try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`Vite no respondio. ${output}`);
};

let browser;
try {
    await waitForServer();
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, screen: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
    await page.goto(`${baseUrl}/bim-resource-leveling-harness.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-bim-resource-histogram]');
    await page.getByRole('button', { name: 'Simular nivelacion' }).click();
    await page.waitForSelector('[data-bim-leveling-scenario="proposed"]');
    assert.equal(await page.getByText('LEV-R1 · REV 002', { exact: true }).count(), 1, 'La revision funcional del proyecto es visible');
    const metrics = await page.locator('[data-bim-leveling-scenario]').textContent();
    assert.ok(metrics.includes('2antes') && metrics.includes('0despues') && metrics.includes('1movidas'), 'Comparacion de capacidad trazable');
    await page.getByLabel('Motivo de decision LEV-R1').fill('Nivelacion revisada para Gantt R2');
    await page.getByRole('button', { name: 'Aprobar', exact: true }).click();
    await page.waitForSelector('[data-bim-leveling-scenario="approved"]');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'Sin overflow horizontal');
    assert.deepEqual(errors, [], `Sin errores de consola: ${errors.join(' | ')}`);
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-resource-leveling-1920x1080.png`, fullPage: true });
    await context.close();
    console.log('validate-bim-resource-leveling-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
