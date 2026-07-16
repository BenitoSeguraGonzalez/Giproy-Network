import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4224;
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
    await page.goto(`${baseUrl}/bim-view-state-replay-harness.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-bim-fragments-product="loaded"] canvas', { timeout: 30000 });
    const root = page.locator('[data-bim-fragments-product]');
    const canvas = page.locator('canvas[data-bim-fragments-product-canvas="true"]');
    const box = await canvas.boundingBox();
    for (const [x, y] of [[0.5, 0.5], [0.45, 0.5], [0.55, 0.5]]) {
        await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
        await page.waitForTimeout(100);
        if (await root.getAttribute('data-bim-fragments-product-selection')) break;
    }
    await page.getByRole('button', { name: 'Medir selección' }).click();
    await page.getByRole('button', { name: 'Alternar proyección' }).click();
    await page.getByRole('button', { name: 'Alternar plano de corte' }).click();
    await page.getByRole('button', { name: 'Aislar selección' }).click();
    await page.waitForFunction(() => document.querySelector('[data-bim-fragments-product]')?.getAttribute('data-bim-review-isolated') === 'true');
    await page.waitForTimeout(150);
    await page.getByRole('button', { name: 'Capturar vista' }).click();

    await page.getByRole('button', { name: 'Restablecer revisión BIM' }).click();
    await page.waitForFunction(() => document.querySelector('[data-bim-fragments-product]')?.getAttribute('data-bim-review-projection') === 'perspective');
    await page.getByRole('button', { name: 'Aplicar vista', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-bim-view-state-replay-harness]')?.getAttribute('data-apply-status') === 'applied', null, { timeout: 10000 });

    assert.equal(await root.getAttribute('data-bim-review-projection'), 'orthographic');
    assert.equal(await root.getAttribute('data-bim-review-clipping'), 'true');
    assert.equal(await root.getAttribute('data-bim-review-isolated'), 'true');
    assert.equal(await root.getAttribute('data-bim-review-measured'), 'true');
    assert.ok(Number(await root.getAttribute('data-bim-review-hidden')) > 0);

    await page.getByRole('button', { name: 'Aplicar incompatible' }).click();
    await page.waitForFunction(() => document.querySelector('[data-bim-view-state-replay-harness]')?.getAttribute('data-apply-status') === 'incompatible');
    assert.equal(errors.length, 0, `sin errores: ${errors.join(' | ')}`);
    console.log('validate-bim-view-state-replay-dom: ok');
    await page.close();
} finally {
    await browser?.close();
    cleanup();
}
