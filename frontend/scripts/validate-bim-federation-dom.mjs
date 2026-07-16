import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4225;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32'
    ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)]
    : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)],
{ cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout?.on('data', (chunk) => { output += chunk.toString(); });
vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });
const cleanup = () => {
    if (vite.killed) return;
    if (process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
    else vite.kill();
};
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
    const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
    await page.goto(`${baseUrl}/bim-federation-harness.html`, { waitUntil: 'domcontentloaded' });
    const root = page.locator('[data-bim-fragments-product]');
    await page.waitForSelector('[data-bim-fragments-product="loaded"] canvas', { timeout: 30000 });
    assert.equal(await root.getAttribute('data-bim-federation-models'), '5');
    assert.equal(await root.getAttribute('data-bim-federation-visible'), '5');
    const canvas = page.locator('canvas[data-bim-fragments-product-canvas="true"]');
    const pixels = await canvas.evaluate((element) => {
        const context = element.getContext('webgl2') || element.getContext('webgl');
        const values = new Uint8Array(4);
        context.readPixels(Math.floor(element.width / 2), Math.floor(element.height / 2), 1, 1, context.RGBA, context.UNSIGNED_BYTE, values);
        return Array.from(values);
    });
    assert.ok(pixels.some((value, index) => index < 3 && value > 0), `canvas no vacio: ${pixels}`);
    await page.getByRole('button', { name: 'MEP' }).click();
    await page.waitForFunction(() => document.querySelector('[data-bim-fragments-product]')?.getAttribute('data-bim-federation-visible') === '4');
    assert.equal(await page.getByRole('button', { name: 'MEP' }).getAttribute('aria-pressed'), 'false');
    await page.getByRole('button', { name: 'MEP' }).click();
    await page.waitForFunction(() => document.querySelector('[data-bim-fragments-product]')?.getAttribute('data-bim-federation-visible') === '5');
    assert.equal(errors.length, 0, `sin errores: ${errors.join(' | ')}`);
    console.log('validate-bim-federation-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
