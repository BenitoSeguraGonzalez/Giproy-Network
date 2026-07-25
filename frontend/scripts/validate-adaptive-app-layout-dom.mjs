import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium, firefox } from 'playwright';

const port = 4241;
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

const profiles = [
    { name: 'wide', viewport: { width: 1920, height: 1080 }, expected: 'wide' },
    { name: 'scaled', viewport: { width: 1536, height: 864 }, expected: 'compact' },
    { name: 'zoom-200-percent', viewport: { width: 960, height: 540 }, expected: 'constrained' },
    { name: 'large-hidpi-desktop', viewport: { width: 2560, height: 1440 }, expected: 'wide', deviceScaleFactor: 1.5 },
    { name: 'tablet-fhd-landscape', viewport: { width: 1280, height: 720 }, expected: 'tablet-landscape', hasTouch: true, deviceScaleFactor: 1.5 },
    { name: 'tablet-fhd-portrait', viewport: { width: 720, height: 1200 }, expected: 'tablet-portrait', hasTouch: true, deviceScaleFactor: 1.5 },
    { name: 'tablet-2k-landscape', viewport: { width: 1280, height: 800 }, expected: 'tablet-landscape', hasTouch: true, deviceScaleFactor: 2 },
    { name: 'tablet-2k-portrait', viewport: { width: 800, height: 1280 }, expected: 'tablet-portrait', hasTouch: true, deviceScaleFactor: 2 },
    { name: 'tablet-landscape', viewport: { width: 1472, height: 820 }, expected: 'tablet-landscape', hasTouch: true, deviceScaleFactor: 2 },
    { name: 'tablet-portrait', viewport: { width: 920, height: 1472 }, expected: 'tablet-portrait', hasTouch: true, deviceScaleFactor: 2 },
];

let browser;
try {
    await waitForServer();
    const browserType = process.env.PLAYWRIGHT_BROWSER === 'firefox' ? firefox : chromium;
    browser = await browserType.launch({
        headless: true,
        ...(browserType === chromium ? {
            executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        } : {}),
    });
    for (const profile of profiles) {
        const context = await browser.newContext({
            viewport: profile.viewport,
            screen: profile.viewport,
            hasTouch: Boolean(profile.hasTouch),
            ...(profile.deviceScaleFactor ? { deviceScaleFactor: profile.deviceScaleFactor } : {}),
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
        await page.route('**/api/v1/**', (route) => {
            const body = new URL(route.request().url()).pathname.endsWith('/empresas/')
                ? JSON.stringify([
                    { id: 3, nombre: 'Empresa de validación' },
                    { id: 4, nombre: 'Empresa con denominación operativa especialmente larga para validar navegación' },
                ])
                : '[]';
            return route.fulfill({ status: 200, contentType: 'application/json', body });
        });
        await page.goto(`${baseUrl}/adaptive-app-layout-harness.html`, { waitUntil: 'domcontentloaded' });
        const shell = page.locator(`[data-adaptive-profile="${profile.expected}"]`);
        try {
            await shell.waitFor({ timeout: 10000 });
        } catch {
            const body = await page.locator('body').innerText().catch(() => 'body unavailable');
            const observed = await page.locator('[data-adaptive-profile]').first().evaluate((node) => ({
                profile: node.getAttribute('data-adaptive-profile'),
                detected: node.getAttribute('data-adaptive-detected-profile'),
                enabled: node.getAttribute('data-adaptive-ui-enabled'),
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                visualWidth: window.visualViewport?.width,
                visualHeight: window.visualViewport?.height,
                coarse: window.matchMedia('(pointer: coarse)').matches,
                fine: window.matchMedia('(pointer: fine)').matches,
                hover: window.matchMedia('(hover: hover)').matches,
                touchPoints: navigator.maxTouchPoints,
            })).catch(() => null);
            throw new Error(`${profile.name}: perfil no montado; observed=${JSON.stringify(observed)}; errors=${errors.join(' | ')}; body=${body.slice(0, 1000)}`);
        }
        assert.equal(await shell.getAttribute('data-adaptive-ui-enabled'), 'true');
        assert.equal(
            await shell.getAttribute('data-adaptive-density'),
            profile.hasTouch ? 'touch' : profile.expected === 'wide' ? 'comfortable' : 'compact',
            `${profile.name}: densidad gobernada por capacidad y espacio CSS`,
        );
        const appHeader = page.locator('[data-app-header]');
        assert.equal(await appHeader.count(), 1, `${profile.name}: existe una unica cabecera global`);
        const headerRect = await appHeader.boundingBox();
        assert.ok(headerRect && headerRect.height >= 63, `${profile.name}: la cabecera no se colapsa (${headerRect?.height ?? 0}px)`);
        assert.ok(headerRect.y >= -1 && headerRect.y + headerRect.height <= profile.viewport.height + 1, `${profile.name}: la cabecera permanece visible`);
        const expectedHeaderLayout = profile.expected === 'tablet-portrait' ? 'stacked-context' : 'single-row';
        assert.equal(await appHeader.getAttribute('data-app-header-layout'), expectedHeaderLayout, `${profile.name}: composicion de cabecera apropiada`);
        const brandRect = await page.locator('[data-app-header-brand]').boundingBox();
        const actionsRect = await page.locator('[data-app-header-actions]').boundingBox();
        const contextRect = await page.locator('[data-app-header-context]').boundingBox();
        assert.ok(brandRect && actionsRect && contextRect, `${profile.name}: regiones de cabecera medibles`);
        assert.ok(brandRect.x + brandRect.width <= actionsRect.x + 1, `${profile.name}: marca y acciones no se solapan`);
        for (const [regionName, regionRect] of [['marca', brandRect], ['acciones', actionsRect], ['contexto', contextRect]]) {
            assert.ok(
                regionRect.y >= headerRect.y - 1 && regionRect.y + regionRect.height <= headerRect.y + headerRect.height + 1,
                `${profile.name}: ${regionName} queda contenida verticalmente en la cabecera`,
            );
        }
        if (profile.expected === 'tablet-portrait') {
            assert.ok(contextRect.y >= brandRect.y + brandRect.height, `${profile.name}: contexto ocupa una segunda fila real`);
            const clippedContextText = await page.locator('[data-app-header-context]').evaluate((node) => {
                const ownerRect = node.getBoundingClientRect();
                return [...node.querySelectorAll('span, h2, p')]
                    .filter((child) => {
                        const style = getComputedStyle(child);
                        const rect = child.getBoundingClientRect();
                        return style.display !== 'none'
                            && style.visibility !== 'hidden'
                            && rect.width > 0
                            && rect.height > 0
                            && (rect.top < ownerRect.top - 1 || rect.bottom > ownerRect.bottom + 1);
                    })
                    .map((child) => child.textContent.trim())
                    .filter(Boolean);
            });
            assert.deepEqual(clippedContextText, [], `${profile.name}: ningun texto del contexto queda recortado`);
        }
        assert.equal(await page.locator('[data-adaptive-harness-content]').count(), 1, `${profile.name}: contenido clásico visible`);
        const pageViewport = page.locator('[data-app-page-viewport]');
        const verticalScrollState = await pageViewport.evaluate((node) => ({
            clientHeight: node.clientHeight,
            scrollHeight: node.scrollHeight,
        }));
        assert.ok(verticalScrollState.scrollHeight > verticalScrollState.clientHeight, `${profile.name}: el shell detecta contenido vertical excedente`);
        await pageViewport.evaluate((node) => { node.scrollTop = node.scrollHeight; });
        await page.waitForTimeout(50);
        const lastContentIsReachable = await page.locator('[data-adaptive-harness-last-content]').evaluate((node) => {
            const rect = node.getBoundingClientRect();
            return rect.bottom <= window.innerHeight + 2 && rect.top >= 0;
        });
        assert.equal(lastContentIsReachable, true, `${profile.name}: el último contenido es alcanzable mediante scroll del shell`);
        const tableViewport = page.locator('[data-adaptive-harness-table]');
        const horizontalScrollState = await tableViewport.evaluate((node) => ({
            clientWidth: node.clientWidth,
            scrollWidth: node.scrollWidth,
            clientHeight: node.clientHeight,
            scrollHeight: node.scrollHeight,
            tabIndex: node.tabIndex,
            role: node.getAttribute('role'),
        }));
        assert.equal(horizontalScrollState.role, 'region', `${profile.name}: tabla expone una region de scroll`);
        assert.ok(horizontalScrollState.tabIndex >= 0, `${profile.name}: region de tabla alcanzable por teclado`);
        assert.ok(horizontalScrollState.scrollHeight <= horizontalScrollState.clientHeight + 2, `${profile.name}: tabla no secuestra el scroll vertical`);
        if (horizontalScrollState.scrollWidth > horizontalScrollState.clientWidth) {
            const pageScrollBeforeTable = await pageViewport.evaluate((node) => node.scrollTop);
            await tableViewport.evaluate((node) => { node.scrollLeft = node.scrollWidth; });
            assert.ok(await tableViewport.evaluate((node) => node.scrollLeft > 0), `${profile.name}: la tabla ancha se puede recorrer lateralmente`);
            assert.equal(await pageViewport.evaluate((node) => node.scrollTop), pageScrollBeforeTable, `${profile.name}: scroll lateral no mueve la pagina`);
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, `${profile.name}: sin overflow horizontal de página`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight), true, `${profile.name}: sin overflow vertical de página`);
        assert.deepEqual(errors, [], `${profile.name}: sin errores`);
        const layoutTrigger = page.getByRole('button', { name: 'Ajustar distribución visual' });
        await layoutTrigger.click();
        const layoutMenu = page.locator('[data-adaptive-layout-menu]');
        const layoutMenuRect = await layoutMenu.boundingBox();
        assert.ok(layoutMenuRect, `${profile.name}: menu adaptativo visible`);
        assert.ok(layoutMenuRect.x >= 0 && layoutMenuRect.x + layoutMenuRect.width <= profile.viewport.width + 1, `${profile.name}: menu adaptativo dentro del ancho`);
        assert.ok(layoutMenuRect.y >= 0 && layoutMenuRect.y + layoutMenuRect.height <= profile.viewport.height + 1, `${profile.name}: menu adaptativo dentro del alto`);
        const wideOption = page.getByRole('radio', { name: 'Amplio' });
        assert.equal(await wideOption.isDisabled(), profile.expected !== 'wide', `${profile.name}: modo amplio seguro`);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-adaptive-navigation-${profile.name}.png`, fullPage: true });
        await page.keyboard.press('Escape');
        assert.equal(await layoutMenu.count(), 0, `${profile.name}: Escape cierra el menu adaptativo`);
        assert.equal(await layoutTrigger.evaluate((node) => document.activeElement === node), true, `${profile.name}: el foco vuelve al disparador adaptativo`);
        const companyTrigger = page.locator('button[aria-controls="app-company-selector"]');
        await companyTrigger.click();
        const companyMenu = page.locator('[data-app-company-selector]');
        await companyMenu.waitFor({ state: 'visible' });
        const companyMenuRect = await companyMenu.boundingBox();
        assert.ok(companyMenuRect, `${profile.name}: selector de empresa visible`);
        assert.ok(companyMenuRect.x >= 0 && companyMenuRect.x + companyMenuRect.width <= profile.viewport.width + 1, `${profile.name}: selector de empresa dentro del ancho`);
        assert.ok(companyMenuRect.y >= 0 && companyMenuRect.y + companyMenuRect.height <= profile.viewport.height + 1, `${profile.name}: selector de empresa dentro del alto`);
        assert.equal(await companyMenu.getByRole('button').count(), 2, `${profile.name}: selector con datos representativos`);
        await page.keyboard.press('Escape');
        await companyMenu.waitFor({ state: 'hidden' });
        assert.equal(await companyTrigger.evaluate((node) => document.activeElement === node), true, `${profile.name}: el foco vuelve al selector de empresa`);
        const form = page.locator('[data-adaptive-harness-form]');
        await form.scrollIntoViewIfNeeded();
        const formControls = await form.locator('input, textarea, button').evaluateAll((nodes) => nodes.map((node) => {
            const rect = node.getBoundingClientRect();
            return { width: rect.width, height: rect.height, left: rect.left, right: rect.right };
        }));
        assert.ok(formControls.every(({ left, right }) => left >= -1 && right <= profile.viewport.width + 1), `${profile.name}: controles del formulario dentro del viewport`);
        if (profile.hasTouch) {
            assert.ok(formControls.every(({ height }) => height >= 44), `${profile.name}: controles tactiles del formulario de al menos 44px`);
            const textarea = page.locator('#adaptive-description');
            await textarea.focus();
            await page.setViewportSize({ width: profile.viewport.width, height: Math.max(540, Math.round(profile.viewport.height * 0.55)) });
            await page.waitForTimeout(80);
            const submit = page.getByRole('button', { name: 'Guardar registro' });
            await submit.scrollIntoViewIfNeeded();
            const submitRect = await submit.boundingBox();
            assert.ok(submitRect && submitRect.y >= 0 && submitRect.y + submitRect.height <= page.viewportSize().height + 1, `${profile.name}: accion primaria alcanzable con viewport reducido`);
            await page.setViewportSize(profile.viewport);
            await page.waitForTimeout(80);
        }
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-adaptive-shell-${profile.name}.png`, fullPage: true });
        await context.close();
    }
    console.log('validate-adaptive-app-layout-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
