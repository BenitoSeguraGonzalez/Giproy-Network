import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4223;
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
    browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    });
    const requestedViewport = process.env.BIM_VIEWPORT || '';
    const viewports = [{ name: 'desktop', width: 1280, height: 820 }, { name: 'mobile', width: 390, height: 844 }]
        .filter((viewport) => !requestedViewport || viewport.name === requestedViewport);
    for (const viewport of viewports) {
        console.log(`review-tools:${viewport.name}:start`);
        const page = await browser.newPage({ viewport });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
        await page.goto(`${baseUrl}/bim-fragments-product-harness.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('[data-bim-fragments-product="loaded"] canvas', { timeout: 30000 });
        const root = page.locator('[data-bim-fragments-product]');
        const waitAttribute = (name, value) => page.waitForFunction(
            ([attribute, expected]) => document.querySelector('[data-bim-fragments-product]')?.getAttribute(attribute) === expected,
            [name, value],
            { timeout: 5000 },
        );
        const canvas = page.locator('canvas[data-bim-fragments-product-canvas="true"]');
        const box = await canvas.boundingBox();
        for (const [x, y] of [[0.5, 0.5], [0.45, 0.5], [0.55, 0.5]]) {
            await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
            await page.waitForTimeout(100);
            if (await root.getAttribute('data-bim-fragments-product-selection')) break;
        }
        assert.ok(await root.getAttribute('data-bim-fragments-product-selection'), `${viewport.name}: seleccion real`);
        console.log(`review-tools:${viewport.name}:selected`);

        await page.getByRole('button', { name: 'Medir selección' }).click();
        await page.waitForFunction(() => document.querySelector('[data-bim-fragments-product]')?.getAttribute('data-bim-review-measured') === 'true');
        assert.equal(await page.locator('[data-bim-review-measurement]').count(), 1, `${viewport.name}: medicion real`);
        await page.getByRole('combobox', { name: 'Unidad de medición' }).selectOption('mm');
        assert.equal(await page.evaluate(() => localStorage.getItem('giproy_bim_measurement_unit')), 'mm');
        console.log(`review-tools:${viewport.name}:measured`);

        await page.getByRole('button', { name: 'Alternar ghost' }).click();
        await waitAttribute('data-bim-review-ghosted', 'true');
        assert.equal(await root.getAttribute('data-bim-review-ghosted'), 'true', `${viewport.name}: ghost activo`);
        await page.getByRole('button', { name: 'Alternar ghost' }).click();
        await waitAttribute('data-bim-review-ghosted', 'false');
        assert.equal(await root.getAttribute('data-bim-review-ghosted'), 'false', `${viewport.name}: ghost reversible`);
        console.log(`review-tools:${viewport.name}:ghost`);

        await page.getByRole('button', { name: 'Alternar proyección' }).click();
        try {
            await waitAttribute('data-bim-review-projection', 'orthographic');
        } catch (error) {
            const debug = await page.evaluate(() => ({
                projection: document.querySelector('[data-bim-fragments-product]')?.getAttribute('data-bim-review-projection'),
                alert: document.querySelector('[role="alert"]')?.textContent || '',
            }));
            throw new Error(`${viewport.name}: cambio de proyeccion fallo ${JSON.stringify(debug)}`, { cause: error });
        }
        assert.equal(await root.getAttribute('data-bim-review-projection'), 'orthographic', `${viewport.name}: ortografica`);
        await page.getByRole('button', { name: 'Alternar proyección' }).click();
        await waitAttribute('data-bim-review-projection', 'perspective');
        assert.equal(await root.getAttribute('data-bim-review-projection'), 'perspective', `${viewport.name}: perspectiva`);
        console.log(`review-tools:${viewport.name}:projection`);

        await page.getByRole('button', { name: 'Alternar plano de corte' }).click();
        await waitAttribute('data-bim-review-clipping', 'true');
        assert.equal(await root.getAttribute('data-bim-review-clipping'), 'true', `${viewport.name}: clipping activo`);
        await page.getByRole('slider', { name: 'Posición del plano de corte' }).fill('0.35');
        await page.getByRole('button', { name: 'Alternar plano de corte' }).click();
        await waitAttribute('data-bim-review-clipping', 'false');
        assert.equal(await root.getAttribute('data-bim-review-clipping'), 'false', `${viewport.name}: clipping reversible`);
        console.log(`review-tools:${viewport.name}:clipping`);

        await page.getByRole('button', { name: 'Aislar selección' }).click();
        await waitAttribute('data-bim-review-isolated', 'true');
        try {
            await page.waitForFunction(
                () => Number(document.querySelector('[data-bim-fragments-product]')?.getAttribute('data-bim-review-hidden') || 0) > 0,
                null,
                { timeout: 5000 },
            );
        } catch (error) {
            const debug = await page.evaluate(() => ({
                hidden: document.querySelector('[data-bim-fragments-product]')?.getAttribute('data-bim-review-hidden'),
                alert: document.querySelector('[role="alert"]')?.textContent || '',
            }));
            throw new Error(`${viewport.name}: aislamiento fallo ${JSON.stringify(debug)}`, { cause: error });
        }
        assert.equal(await root.getAttribute('data-bim-review-isolated'), 'true', `${viewport.name}: aislamiento`);
        assert.ok(Number(await root.getAttribute('data-bim-review-hidden')) > 0, `${viewport.name}: ocultos reales`);
        await page.getByRole('button', { name: 'Restablecer revisión BIM' }).click();
        await waitAttribute('data-bim-review-hidden', '0');
        assert.equal(await root.getAttribute('data-bim-review-hidden'), '0', `${viewport.name}: reset visibilidad`);
        assert.equal(await root.getAttribute('data-bim-review-isolated'), 'false', `${viewport.name}: reset aislamiento`);
        console.log(`review-tools:${viewport.name}:isolation`);

        await page.getByRole('button', { name: 'Ocultar selección' }).click();
        await waitAttribute('data-bim-review-hidden', '1');
        assert.equal(await root.getAttribute('data-bim-review-hidden'), '1', `${viewport.name}: ocultar seleccion`);
        await page.getByRole('button', { name: 'Restablecer revisión BIM' }).click();
        const state = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
        assert.equal(errors.length, 0, `${viewport.name}: sin errores: ${errors.join(' | ')}`);
        assert.equal(state.overflow, false, `${viewport.name}: sin overflow`);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-review-${viewport.name}.png`, fullPage: true });
        await page.close();
        console.log(`review-tools:${viewport.name}:ok`);
    }
    console.log('validate-bim-review-tools-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
