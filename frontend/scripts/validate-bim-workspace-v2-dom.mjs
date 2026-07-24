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
    { cwd: process.cwd(), env: { ...process.env, VITE_ADAPTIVE_UI_ENABLED: 'true' }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
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

    const scaledContext = await browser.newContext({
        viewport: { width: 1536, height: 800 },
        screen: { width: 1536, height: 864 },
        deviceScaleFactor: 1.25,
    });
    const scaledPage = await scaledContext.newPage();
    await scaledPage.goto(`${baseUrl}/bim-workspace-v2-harness.html`, { waitUntil: 'domcontentloaded' });
    await scaledPage.waitForSelector('[data-bim-workspace-v2]');
    assert.equal(await scaledPage.locator('[data-bim-unsupported-resolution]').count(), 0, '1920x1080 físico con escalado 125% debe montar BIM');
    assert.equal(await scaledPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'El workspace escalado no genera overflow horizontal');
    await scaledPage.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-1920x1080-scaled-125.png`, fullPage: true });
    await scaledContext.close();

    const compactContext = await browser.newContext({ viewport: { width: 1366, height: 768 }, screen: { width: 1366, height: 768 } });
    const compactPage = await compactContext.newPage();
    await compactPage.goto(`${baseUrl}/bim-workspace-v2-harness.html`, { waitUntil: 'domcontentloaded' });
    await compactPage.waitForSelector('[data-bim-workspace-v2][data-bim-adaptive-profile="compact"]');
    assert.equal(await compactPage.locator('[data-bim-unsupported-resolution]').count(), 0, 'El perfil compacto debe montar BIM sin una guarda heredada de resolución física');
    assert.equal(await compactPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'El workspace compacto no genera overflow de página');
    await compactPage.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-compact-1366x768.png`, fullPage: true });
    await compactContext.close();

    const tabletLandscapeContext = await browser.newContext({
        viewport: { width: 1472, height: 820 },
        screen: { width: 1472, height: 920 },
        deviceScaleFactor: 2,
        hasTouch: true,
    });
    const tabletLandscapePage = await tabletLandscapeContext.newPage();
    await tabletLandscapePage.goto(`${baseUrl}/bim-workspace-v2-harness.html`, { waitUntil: 'domcontentloaded' });
    await tabletLandscapePage.waitForSelector('[data-bim-workspace-v2][data-bim-adaptive-profile="tablet-landscape"]');
    assert.equal(await tabletLandscapePage.locator('[data-bim-unsupported-resolution]').count(), 0, 'La tablet horizontal compatible monta BIM');
    assert.equal(await tabletLandscapePage.locator('[data-bim-workspace-v2] aside').count(), 1, 'Tablet horizontal monta un único panel lateral');
    assert.equal(await tabletLandscapePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'Tablet horizontal sin overflow de página');
    await tabletLandscapePage.getByRole('button', { name: 'Mostrar u ocultar panel contextual' }).click();
    assert.equal(await tabletLandscapePage.locator('[data-bim-workspace-v2] aside').count(), 1, 'El inspector sustituye al explorador sin comprimir el visor');
    await tabletLandscapePage.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-tablet-landscape.png`, fullPage: true });
    await tabletLandscapeContext.close();

    const tabletPortraitContext = await browser.newContext({
        viewport: { width: 920, height: 1472 },
        screen: { width: 920, height: 1472 },
        deviceScaleFactor: 2,
        hasTouch: true,
    });
    const tabletPortraitPage = await tabletPortraitContext.newPage();
    await tabletPortraitPage.goto(`${baseUrl}/bim-workspace-v2-harness.html`, { waitUntil: 'domcontentloaded' });
    await tabletPortraitPage.waitForSelector('[data-bim-unsupported-resolution]');
    assert.match(await tabletPortraitPage.locator('[data-bim-unsupported-resolution]').textContent(), /Gira la tablet a horizontal/);
    assert.equal(await tabletPortraitPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'La guarda tablet vertical no genera overflow');
    await tabletPortraitPage.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-tablet-portrait.png`, fullPage: true });
    await tabletPortraitContext.close();
    console.log('validate-bim-workspace-v2-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
