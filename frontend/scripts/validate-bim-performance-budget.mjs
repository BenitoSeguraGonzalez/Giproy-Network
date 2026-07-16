import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4228;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(
    'cmd.exe',
    ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
);
let serverOutput = '';
vite.stdout.on('data', (chunk) => { serverOutput += chunk; });
vite.stderr.on('data', (chunk) => { serverOutput += chunk; });

const cleanup = () => {
    if (!vite.killed && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
};

const waitForServer = async () => {
    const deadline = Date.now() + 40000;
    while (Date.now() < deadline) {
        try {
            if ((await fetch(baseUrl)).ok) return;
        } catch {
            // Vite is still starting.
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(serverOutput);
};

const sampleFps = (page) => page.evaluate(() => new Promise((resolve) => {
    let frames = 0;
    const startedAt = performance.now();
    const tick = (now) => {
        frames += 1;
        if (now - startedAt >= 1000) {
            resolve(Math.round((frames * 1000) / (now - startedAt)));
            return;
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}));

const browsers = [
    ['chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'],
    ['edge', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'],
];
const viewports = [
    ['desktop', { width: 1280, height: 820 }],
    ['tablet', { width: 820, height: 1180 }],
];

try {
    await waitForServer();
    for (const [browserName, executablePath] of browsers) {
        let browser;
        try {
            browser = await chromium.launch({ headless: true, executablePath, args: ['--enable-precise-memory-info'] });
            for (const [viewportName, viewport] of viewports) {
                const page = await browser.newPage({ viewport });
                const pageErrors = [];
                page.on('pageerror', (error) => pageErrors.push(error.message));
                await page.goto(`${baseUrl}/bim-federation-harness.html`);
                const durations = [];
                const heaps = [];
                for (let cycle = 0; cycle < 3; cycle += 1) {
                    const start = Date.now();
                    await page.waitForSelector('[data-bim-fragments-product="loaded"] canvas', { timeout: 15000 });
                    durations.push(Date.now() - start);
                    heaps.push(await page.evaluate(() => performance.memory?.usedJSHeapSize || 0));
                    await page.getByRole('button', { name: 'Desmontar visor' }).click();
                    await page.waitForSelector('[data-bim-fragments-product]', { state: 'detached' });
                    assert.equal(await page.locator('canvas[data-bim-fragments-product-canvas="true"]').count(), 0);
                    await page.getByRole('button', { name: 'Montar visor' }).click();
                }
                const fps = await sampleFps(page);
                assert.ok(Math.max(...durations) < 8000, `${browserName}/${viewportName} first render ${durations}`);
                assert.ok(fps >= 20, `${browserName}/${viewportName} FPS ${fps}`);
                if (heaps.every(Boolean)) {
                    assert.ok(heaps.at(-1) <= heaps[0] * 1.75, `${browserName}/${viewportName} heap growth ${heaps}`);
                }
                assert.deepEqual(pageErrors, [], `${browserName}/${viewportName} page errors`);
                console.log(`${browserName}/${viewportName}: cycles=${durations.join(',')}ms fps=${fps} heap=${heaps.at(-1) || 'n/a'}`);
                await page.close();
            }
        } finally {
            await browser?.close();
        }
    }
    console.log('validate-bim-performance-budget: ok');
} finally {
    cleanup();
}
