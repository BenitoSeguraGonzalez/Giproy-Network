import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4220;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(
    process.platform === 'win32' ? 'cmd.exe' : 'npm',
    process.platform === 'win32'
        ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)]
        : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
);
let output = '';
vite.stdout?.on('data', (chunk) => { output += chunk.toString(); });
vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });
const cleanup = () => {
    if (vite.killed) return;
    if (process.platform === 'win32' && vite.pid) {
        spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
        vite.kill();
    }
};

const waitForServer = async () => {
    const deadline = Date.now() + 40000;
    while (Date.now() < deadline) {
        try {
            if ((await fetch(baseUrl)).ok) return;
        } catch {
            // retry while Vite starts
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`Vite no respondio. ${output}`);
};

let browser;
try {
    await waitForServer();
    browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    });
    const requestedViewport = process.env.BIM_VIEWPORT || '';
    const viewports = [
        { name: 'desktop', width: 1440, height: 900 },
        { name: 'tablet', width: 820, height: 900 },
        { name: 'mobile', width: 390, height: 844 },
    ].filter((viewport) => !requestedViewport || viewport.name === requestedViewport);
    for (const viewport of viewports) {
        const page = await browser.newPage({ viewport });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
            const text = message.text();
            const isHarnessResource404 = text.includes('Failed to load resource') && text.includes('404');
            if (message.type() === 'error' && !isHarnessResource404) errors.push(text);
        });
        await page.goto(`${baseUrl}/bim-fragments-product-harness.html`, { waitUntil: 'domcontentloaded' });
        try {
            await page.waitForSelector('[data-bim-fragments-product="loaded"] canvas[data-bim-fragments-product-canvas="true"]', { timeout: 30000 });
        } catch (error) {
            const debug = await page.evaluate(() => ({
                status: document.querySelector('[data-bim-fragments-product]')?.getAttribute('data-bim-fragments-product'),
                text: document.body.innerText.slice(0, 500),
                html: document.querySelector('[data-bim-fragments-product]')?.outerHTML.slice(0, 1000),
            }));
            throw new Error(`${viewport.name}: viewport Fragments no cargo: ${JSON.stringify(debug)}`, { cause: error });
        }
        const canvas = page.locator('canvas[data-bim-fragments-product-canvas="true"]');
        const box = await canvas.boundingBox();
        assert.ok(box && box.width >= 280 && box.height >= 360, `${viewport.name}: dimensiones estables`);
        for (const [xFactor, yFactor] of [[0.5, 0.5], [0.45, 0.5], [0.55, 0.5], [0.5, 0.45]]) {
            await page.mouse.click(box.x + box.width * xFactor, box.y + box.height * yFactor);
            await page.waitForTimeout(80);
            if (await page.locator('[data-bim-fragments-product-selection]:not([data-bim-fragments-product-selection=""])').count()) break;
        }
        const state = await page.evaluate(() => {
            const root = document.querySelector('[data-bim-fragments-product-harness]');
            const viewportNode = document.querySelector('[data-bim-fragments-product]');
            const canvasNode = document.querySelector('canvas[data-bim-fragments-product-canvas="true"]');
            const gl = canvasNode.getContext('webgl2') || canvasNode.getContext('webgl');
            const sample = 96;
            const pixels = new Uint8Array(sample * sample * 4);
            gl.readPixels(
                Math.max(0, Math.floor(canvasNode.width / 2) - sample / 2),
                Math.max(0, Math.floor(canvasNode.height / 2) - sample / 2),
                sample,
                sample,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                pixels,
            );
            let nonBackground = 0;
            for (let index = 0; index < pixels.length; index += 4) {
                const [r, g, b, a] = pixels.slice(index, index + 4);
                if (a > 0 && !(r === 247 && g === 247 && b === 245)) nonBackground += 1;
            }
            return {
                bytes: Number(viewportNode.getAttribute('data-bim-fragments-product-bytes') || 0),
                localIds: Number(viewportNode.getAttribute('data-bim-fragments-product-local-ids') || 0),
                selectedGuid: root.getAttribute('data-selected-guid') || '',
                nonBackground,
                overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            };
        });
        assert.equal(errors.length, 0, `${viewport.name}: sin errores de consola: ${errors.join(' | ')}`);
        assert.ok(state.bytes > 0, `${viewport.name}: bytes Fragments reales`);
        assert.ok(state.localIds > 0, `${viewport.name}: localIds reales`);
        assert.ok(state.selectedGuid.length > 8, `${viewport.name}: seleccion nativa por puntero`);
        assert.ok(state.nonBackground > 8, `${viewport.name}: canvas WebGL no vacio`);
        assert.equal(state.overflow, false, `${viewport.name}: sin overflow horizontal`);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-fragments-${viewport.name}.png`, fullPage: true });
        await page.close();
    }
    console.log('validate-bim-fragments-product-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
