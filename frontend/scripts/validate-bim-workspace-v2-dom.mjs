import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4237;
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
    throw new Error(`Vite no respondió. ${output}`);
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
    await page.goto(`${baseUrl}/bim-workspace-v2-harness.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-bim-fragments-product="loaded"] canvas', { timeout: 30000 });

    const shell = page.locator('[data-bim-workspace-v2]');
    const viewerRegion = page.locator('[data-bim-viewer-region]');
    const shellBox = await shell.boundingBox();
    const viewerBox = await viewerRegion.boundingBox();
    assert.ok(viewerBox.width / shellBox.width >= 0.65, `El visor debe ocupar al menos 65%: ${viewerBox.width}/${shellBox.width}`);

    const canvas = page.locator('canvas[data-bim-fragments-product-canvas="true"]');
    const pixels = await canvas.evaluate((node) => {
        const gl = node.getContext('webgl2') || node.getContext('webgl');
        const sample = new Uint8Array(4);
        gl.readPixels(Math.floor(node.width / 2), Math.floor(node.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, sample);
        return Array.from(sample);
    });
    assert.ok(pixels.some((value) => value > 0), `Canvas WebGL no vacío: ${pixels}`);
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-viewer-1920x1080.png`, fullPage: true });

    await page.getByRole('button', { name: 'Planificación 4D' }).click();
    assert.equal(await page.locator('[data-bim-bottom-drawer]').count(), 1, 'Planificación muestra drawer único');
    assert.equal(await page.getByRole('tab', { name: 'Secuencia 4D', exact: true }).count(), 1, 'Timeline y Gantt conviven en una única superficie 4D');
    await page.waitForSelector('[data-bim-planning-4d] [data-bim-gantt-activity="101"]');
    assert.equal(await page.locator('[data-bim-gantt-activity-selected="true"]').count(), 2, 'Selección 3D inversa resalta todas las actividades vinculadas');
    await page.getByRole('button', { name: 'Seleccionar actividad EDT-01' }).click();
    assert.equal(await page.locator('[data-bim-gantt-selected-activities]').getAttribute('data-bim-gantt-selected-activities'), '1', 'Selección Gantt establece la actividad primaria');
    assert.equal(await page.locator('[data-bim-fragments-product]').getAttribute('data-bim-planning-selection'), '1', 'Selección Gantt se proyecta al modelo fragments');
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-planning-1920x1080.png`, fullPage: true });
    await page.getByRole('button', { name: 'Informes' }).click();
    assert.equal(await page.locator('[data-bim-reports-region]').count(), 1, 'Informes usa layout dedicado');
    await page.keyboard.press('Control+K');
    await page.keyboard.type('Muro');
    assert.equal(await page.getByRole('option').count(), 1, 'Búsqueda unificada devuelve elemento real del catálogo');

    const state = await page.evaluate(() => ({
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        verticalOverflow: document.documentElement.scrollHeight > document.documentElement.clientHeight,
    }));
    assert.deepEqual(errors, [], `Sin errores de consola: ${errors.join(' | ')}`);
    assert.equal(state.horizontalOverflow, false, 'Sin overflow horizontal de página');
    assert.equal(state.verticalOverflow, false, 'Sin overflow vertical de página');
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-1920x1080.png`, fullPage: true });
    await context.close();

    const unsupportedContext = await browser.newContext({ viewport: { width: 1366, height: 768 }, screen: { width: 1366, height: 768 } });
    const unsupportedPage = await unsupportedContext.newPage();
    await unsupportedPage.goto(`${baseUrl}/bim-workspace-v2-harness.html`, { waitUntil: 'domcontentloaded' });
    await unsupportedPage.waitForSelector('[data-bim-unsupported-resolution]');
    assert.equal(await unsupportedPage.locator('[data-bim-workspace-v2]').count(), 0, 'El workspace no debe montarse bajo la resolución mínima');
    assert.equal(await unsupportedPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'La guarda no genera overflow');
    await unsupportedPage.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-unsupported-1366x768.png`, fullPage: true });
    await unsupportedContext.close();
    console.log('validate-bim-workspace-v2-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
