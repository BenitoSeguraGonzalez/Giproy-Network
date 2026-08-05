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
    assert.ok(viewerBox.height / shellBox.height >= 0.78, `El visor inicial debe conservar al menos 78% de alto: ${viewerBox.height}/${shellBox.height}`);
    assert.equal(await shell.locator('aside').count(), 0, 'El estado inicial no ocupa espacio con paneles laterales');
    assert.equal(await page.locator('[data-bim-bottom-drawer]').evaluate((node) => Math.round(node.getBoundingClientRect().height)), 40, 'La secuencia 4D inicia recogida');
    const initialActions = await shell.locator('header button:visible').count();
    assert.ok(initialActions <= 10, `La cabecera inicial no compite con acciones (${initialActions})`);

    const canvas = page.locator('canvas[data-bim-fragments-product-canvas="true"]');
    const pixels = await canvas.evaluate((node) => {
        const gl = node.getContext('webgl2') || node.getContext('webgl');
        const sample = new Uint8Array(4);
        gl.readPixels(Math.floor(node.width / 2), Math.floor(node.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, sample);
        return Array.from(sample);
    });
    assert.ok(pixels.some((value) => value > 0), `Canvas WebGL no vacío: ${pixels}`);
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-viewer-1920x1080.png`, fullPage: true });

    await page.getByRole('button', { name: 'Trabajo' }).click();
    await page.getByRole('button', { name: 'Cambiar' }).click();
    assert.equal(await page.locator('[data-bim-task-navigator]').count(), 1, 'El catálogo de tareas usa el único panel permitido');
    assert.equal(await page.locator('[data-bim-task-level="objectives"]').count(), 1, 'El catálogo empieza por objetivos, no por una lista completa de funciones');
    assert.ok(await page.getByRole('button', { name: /Vincular 4D\/5D/ }).count() === 1, 'Planificación agrupa herramientas por trabajo 4D/5D');
    assert.ok(await page.getByRole('button', { name: /Controlar costes/ }).count() === 1, 'Planificación agrupa el control económico sin nuevas pestañas');
    assert.ok(await page.getByRole('button', { name: /Preparar producción/ }).count() === 1, 'Planificación agrupa la preparación constructiva');
    assert.ok(await page.locator('[data-bim-task-level="objectives"] > button').count() <= 6, 'Un consultor integral no recibe todas las acciones compitiendo a la vez');
    assert.equal(await page.locator('[data-bim-task-navigator] select:visible').count(), 0, 'El usuario no recibe un selector plano de funciones');
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-task-catalog-1920x1080.png`, fullPage: true });
    await page.getByRole('button', { name: /Vincular 4D\/5D/ }).click();
    assert.equal(await page.locator('[data-bim-task-level="tasks"]').count(), 1, 'Las tareas aparecen solo después de elegir el objetivo');
    await page.getByRole('button', { name: /Estimación/ }).click();
    assert.equal(await page.locator('[data-bim-workbench-region="estimate"]').count(), 1, 'La estimación compleja se abre como workbench, no en un lateral');
    assert.equal(await page.locator('[data-bim-bottom-drawer]').count(), 0, 'El workbench no compite con la cronología inferior');
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-estimate-workbench-1920x1080.png`, fullPage: true });
    await page.getByRole('button', { name: 'Volver al modelo' }).click();

    await page.getByRole('button', { name: /Planificación y costes/ }).click();
    assert.equal(await page.locator('[data-bim-bottom-drawer]').count(), 1, 'Planificación muestra drawer único');
    assert.ok(await page.locator('[data-bim-bottom-drawer]').getByText('Secuencia 4D', { exact: true }).count() >= 1, 'Timeline y Gantt conviven en una única superficie 4D');
    await page.getByRole('button', { name: 'Expandir cronología' }).click();
    await page.waitForSelector('[data-bim-planning-4d] [data-bim-gantt-activity="101"]');
    assert.equal(await page.locator('[data-bim-gantt-activity-selected="true"]').count(), 2, 'Selección 3D inversa resalta todas las actividades vinculadas');
    await page.getByRole('button', { name: 'Seleccionar actividad EDT-01' }).click();
    assert.equal(await page.locator('[data-bim-gantt-selected-activities]').getAttribute('data-bim-gantt-selected-activities'), '1', 'Selección Gantt establece la actividad primaria');
    await page.waitForFunction(() => document.querySelector('[data-bim-fragments-product]')?.getAttribute('data-bim-planning-selection') === '1');
    assert.equal(await page.locator('[data-bim-fragments-product]').getAttribute('data-bim-planning-selection'), '1', 'Selección Gantt se proyecta al modelo fragments');
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-planning-1920x1080.png`, fullPage: true });
    await page.getByRole('button', { name: /Seguimiento/ }).click();
    await page.getByRole('button', { name: 'Trabajo' }).click();
    await page.getByRole('button', { name: 'Cambiar tarea' }).click();
    await page.getByRole('button', { name: /Evidencia/ }).click();
    await page.getByRole('button', { name: /Informes/ }).click();
    assert.equal(await page.getByText('Informes BIM', { exact: true }).count(), 1, 'Informes queda integrado en el flujo de seguimiento');
    await page.getByRole('button', { name: /Entrega/ }).click();
    await page.getByRole('button', { name: 'Trabajo' }).click();
    assert.equal(await page.locator('[data-bim-workbench-region="as-built"]').count(), 1, 'As-built usa una mesa completa y nunca el panel contextual');
    assert.equal(await page.locator('[data-bim-bottom-drawer]').count(), 0, 'Entrega no compite con la secuencia 4D');
    await page.getByRole('button', { name: 'Cambiar tarea' }).click();
    await page.getByRole('button', { name: /Entregar información/ }).click();
    await page.getByRole('button', { name: /Dossier digital/ }).click();
    assert.equal(await page.locator('[data-bim-workbench-region="handover-dossier"]').count(), 1, 'El dossier mantiene la misma navegación de tareas y superficie completa');
    await page.getByRole('button', { name: 'Volver al modelo' }).click();
    await page.keyboard.press('Control+K');
    await page.keyboard.type('Muro');
    assert.equal(await page.locator('[role="listbox"] > [role="option"]').count(), 1, 'Búsqueda unificada devuelve elemento real del catálogo');

    const state = await page.evaluate(() => ({
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        verticalOverflow: document.documentElement.scrollHeight > document.documentElement.clientHeight,
    }));
    assert.deepEqual(errors, [], `Sin errores de consola: ${errors.join(' | ')}`);
    assert.equal(state.horizontalOverflow, false, 'Sin overflow horizontal de página');
    assert.equal(state.verticalOverflow, false, 'Sin overflow vertical de página');
    const accessibility = await page.evaluate(() => {
        const visible = (node) => {
            const style = getComputedStyle(node); const rect = node.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const unnamedButtons = [...document.querySelectorAll('button')].filter(visible).filter((node) => !(node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent?.trim())).length;
        const unlabelledFields = [...document.querySelectorAll('input, select, textarea')].filter(visible).filter((node) => !(node.labels?.length || node.getAttribute('aria-label') || node.getAttribute('aria-labelledby'))).length;
        const positiveTabindex = [...document.querySelectorAll('[tabindex]')].filter((node) => Number(node.getAttribute('tabindex')) > 0).length;
        const ids = [...document.querySelectorAll('[id]')].map((node) => node.id).filter(Boolean);
        return { unnamedButtons, unlabelledFields, positiveTabindex, duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index) };
    });
    assert.deepEqual(accessibility, { unnamedButtons: 0, unlabelledFields: 0, positiveTabindex: 0, duplicateIds: [] }, 'Controles BIM con nombre, etiqueta, orden natural e IDs únicos');
    await page.keyboard.press('Alt+2');
    assert.equal(await page.getByRole('button', { name: /Modelo/ }).getAttribute('aria-current'), 'page', 'Los modos son navegables por teclado');
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => document.activeElement && document.activeElement !== document.body), 'El foco de teclado permanece visible dentro del workspace');
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-1920x1080.png`, fullPage: true });
    await context.close();

    const fallbackContext = await browser.newContext({ viewport: { width: 1920, height: 1080 }, screen: { width: 1920, height: 1080 } });
    const fallbackPage = await fallbackContext.newPage();
    await fallbackPage.goto(`${baseUrl}/bim-workspace-v2-harness.html?viewer=fallback`, { waitUntil: 'domcontentloaded' });
    await fallbackPage.waitForSelector('[data-bim-three-viewer="isolated"] canvas');
    assert.equal(await fallbackPage.getByText('Three.js', { exact: true }).count(), 0, 'El motor no aparece como acción o contenido de usuario');
    assert.equal(await fallbackPage.getByText('Raycast 3D', { exact: true }).count(), 0, 'El raycast no aparece como contenido de usuario');
    assert.equal(await fallbackPage.getByText('OrbitControls', { exact: true }).count(), 0, 'Los controles técnicos no aparecen como contenido de usuario');
    assert.equal(await fallbackPage.locator('[data-bim-three-ifc-filter-button]:visible').count(), 0, 'Los filtros avanzados permanecen bajo demanda');
    await fallbackPage.getByRole('button', { name: /Vista/ }).click();
    assert.ok(await fallbackPage.locator('[data-bim-three-ifc-filter-button]:visible').count() > 0, 'Vista revela los filtros avanzados cuando se solicitan');
    await fallbackPage.getByRole('button', { name: /Vista/ }).click();
    await fallbackPage.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-fallback-1920x1080.png`, fullPage: true });
    await fallbackContext.close();

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

    for (const profile of [
        { label: '2560x1440-dpi150', viewport: { width: 1707, height: 960 }, screen: { width: 2560, height: 1440 }, deviceScaleFactor: 1.5 },
        { label: '3840x2160-dpi200', viewport: { width: 1920, height: 1080 }, screen: { width: 3840, height: 2160 }, deviceScaleFactor: 2 },
    ]) {
        const largeContext = await browser.newContext(profile);
        const largePage = await largeContext.newPage();
        await largePage.goto(`${baseUrl}/bim-workspace-v2-harness.html`, { waitUntil: 'domcontentloaded' });
        await largePage.waitForSelector('[data-bim-workspace-v2]');
        const layout = await largePage.evaluate(() => ({
            horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            verticalOverflow: document.documentElement.scrollHeight > document.documentElement.clientHeight,
        }));
        assert.equal(layout.horizontalOverflow, false, `${profile.label} sin overflow horizontal`);
        assert.equal(layout.verticalOverflow, false, `${profile.label} sin overflow vertical`);
        const largeShell = await largePage.locator('[data-bim-workspace-v2]').boundingBox();
        const largeViewer = await largePage.locator('[data-bim-viewer-region]').boundingBox();
        assert.ok(largeViewer.width / largeShell.width >= 0.65, `${profile.label} conserva al menos 65% para el visor`);
        await largePage.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-${profile.label}.png`, fullPage: true });
        await largeContext.close();
    }

    const safariContext = await browser.newContext({
        viewport: { width: 1920, height: 1080 }, screen: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
    });
    const safariPage = await safariContext.newPage();
    await safariPage.goto(`${baseUrl}/bim-workspace-v2-harness.html`, { waitUntil: 'domcontentloaded' });
    await safariPage.waitForSelector('[data-bim-workspace-v2]');
    assert.match(await safariPage.getByRole('status').filter({ hasText: 'Safari puede mostrar divergencias' }).textContent(), /Chromium disponible en macOS\/iPadOS/);
    assert.equal(await safariPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'El aviso Safari no genera overflow');
    await safariContext.close();

    const unsupportedContext = await browser.newContext({ viewport: { width: 1366, height: 768 }, screen: { width: 1366, height: 768 } });
    const unsupportedPage = await unsupportedContext.newPage();
    await unsupportedPage.goto(`${baseUrl}/bim-workspace-v2-harness.html`, { waitUntil: 'domcontentloaded' });
    await unsupportedPage.waitForSelector('[data-bim-unsupported-resolution]');
    assert.equal(await unsupportedPage.locator('[data-bim-workspace-v2]').count(), 0, 'El workspace no debe montarse bajo la resolución mínima');
    assert.equal(await unsupportedPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'La guarda no genera overflow');
    await unsupportedPage.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-unsupported-1366x768.png`, fullPage: true });
    await unsupportedContext.close();

    const tabletLandscapeContext = await browser.newContext({
        viewport: { width: 1472, height: 820 },
        screen: { width: 1472, height: 920 },
        deviceScaleFactor: 2,
        hasTouch: true,
    });
    await tabletLandscapeContext.addInitScript(() => localStorage.setItem('giproy_adaptive_ui_pilot', 'true'));
    const tabletLandscapePage = await tabletLandscapeContext.newPage();
    await tabletLandscapePage.goto(`${baseUrl}/bim-workspace-v2-harness.html`, { waitUntil: 'domcontentloaded' });
    await tabletLandscapePage.waitForSelector('[data-bim-workspace-v2][data-bim-adaptive-profile="tablet-landscape"]');
    assert.equal(await tabletLandscapePage.locator('[data-bim-unsupported-resolution]').count(), 0, 'La tablet horizontal compatible monta BIM');
    assert.equal(await tabletLandscapePage.locator('[data-bim-workspace-v2] aside').count(), 0, 'Tablet horizontal inicia sin paneles laterales');
    assert.equal(await tabletLandscapePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'Tablet horizontal sin overflow de página');
    await tabletLandscapePage.getByRole('button', { name: 'Trabajo' }).click();
    assert.ok(await tabletLandscapePage.locator('[data-bim-workspace-v2] aside').count() <= 1, 'Nunca se montan dos paneles laterales simultáneos');
    await tabletLandscapePage.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-workspace-v2-tablet-landscape.png`, fullPage: true });
    await tabletLandscapeContext.close();

    const tabletPortraitContext = await browser.newContext({
        viewport: { width: 920, height: 1472 },
        screen: { width: 920, height: 1472 },
        deviceScaleFactor: 2,
        hasTouch: true,
    });
    await tabletPortraitContext.addInitScript(() => localStorage.setItem('giproy_adaptive_ui_pilot', 'true'));
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
