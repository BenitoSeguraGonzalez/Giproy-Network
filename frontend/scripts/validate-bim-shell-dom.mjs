import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4221;
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
    const viewports = [
        { name: 'desktop', width: 1440, height: 900 },
        { name: 'tablet', width: 820, height: 900 },
        { name: 'mobile', width: 390, height: 844 },
    ];
    for (const viewport of viewports) {
        const page = await browser.newPage({ viewport });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
            const messageText = message.text();
            const ignoredResource404 = messageText.includes('Failed to load resource') && messageText.includes('404');
            if (message.type() === 'error' && !ignoredResource404) errors.push(messageText);
        });
        await page.goto(`${baseUrl}/bim-shell-harness.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('[data-bim-fragments-product="loaded"] canvas', { timeout: 30000 });

        const labels = await page.locator('[data-bim-shell-context]').innerText();
        for (const expected of ['Constructora Santiago', 'Centro Empresarial Norte', 'Arquitectura coordinada', 'IFC4 - R08']) {
            assert.ok(labels.includes(expected), `${viewport.name}: contexto visible ${expected}`);
        }

        await page.keyboard.press('Tab');
        const firstFocus = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || '');
        assert.ok(firstFocus.includes('Mostrar visor'), `${viewport.name}: toolbar accesible por teclado`);
        await page.keyboard.press('Enter');
        await page.getByRole('button', { name: 'Mostrar plano BIM 2D' }).click();
        assert.equal(await page.locator('[data-bim-shell-plan]').count(), 1, `${viewport.name}: selector 2D operativo`);
        await page.getByRole('button', { name: 'Mostrar visor 3D Fragments' }).click();
        await page.waitForSelector('[data-bim-fragments-product="loaded"] canvas', { timeout: 30000 });

        await page.getByRole('button', { name: 'Mostrar u ocultar explorer BIM' }).click();
        assert.equal(await page.locator('[data-bim-shell-explorer]').count(), 0, `${viewport.name}: explorer conmutable`);
        await page.getByRole('button', { name: 'Mostrar u ocultar explorer BIM' }).click();
        await page.getByRole('button', { name: 'Mostrar u ocultar inspector BIM' }).click();
        assert.equal(await page.locator('[data-bim-shell-inspector]').count(), 0, `${viewport.name}: inspector conmutable`);
        await page.getByRole('button', { name: 'Mostrar u ocultar inspector BIM' }).click();
        await page.getByRole('button', { name: 'Restablecer contexto BIM' }).click();
        await page.getByRole('button', { name: 'Actualizar workspace BIM' }).click();

        const state = await page.evaluate(() => ({
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            resetCount: Number(document.querySelector('[data-bim-shell-harness]')?.getAttribute('data-reset-count') || 0),
            refreshCount: Number(document.querySelector('[data-bim-shell-harness]')?.getAttribute('data-refresh-count') || 0),
            canvas: Boolean(document.querySelector('canvas[data-bim-fragments-product-canvas="true"]')),
        }));
        assert.equal(errors.length, 0, `${viewport.name}: sin errores de consola: ${errors.join(' | ')}`);
        assert.equal(state.overflow, false, `${viewport.name}: sin overflow horizontal`);
        assert.equal(state.resetCount, 1, `${viewport.name}: reset operativo`);
        assert.equal(state.refreshCount, 1, `${viewport.name}: refresh operativo`);
        assert.equal(state.canvas, true, `${viewport.name}: canvas Fragments montado`);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-shell-${viewport.name}.png`, fullPage: true });
        await page.close();
    }
    console.log('validate-bim-shell-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
