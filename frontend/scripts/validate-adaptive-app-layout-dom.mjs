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

const profiles = [
    { name: 'wide', viewport: { width: 1920, height: 1080 }, expected: 'wide' },
    { name: 'scaled', viewport: { width: 1536, height: 864 }, expected: 'compact' },
    { name: 'zoom-200-percent', viewport: { width: 960, height: 540 }, expected: 'constrained' },
    { name: 'large-hidpi-desktop', viewport: { width: 2560, height: 1440 }, expected: 'wide', deviceScaleFactor: 1.5 },
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
        await context.addInitScript(() => localStorage.setItem('giproy_adaptive_ui_pilot', 'true'));
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
        await page.route('**/api/v1/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
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
        const appHeader = page.locator('[data-app-header]');
        assert.equal(await appHeader.count(), 1, `${profile.name}: existe una unica cabecera global`);
        const headerRect = await appHeader.boundingBox();
        assert.ok(headerRect && headerRect.height >= 63, `${profile.name}: la cabecera no se colapsa (${headerRect?.height ?? 0}px)`);
        assert.ok(headerRect.y >= -1 && headerRect.y + headerRect.height <= profile.viewport.height + 1, `${profile.name}: la cabecera permanece visible`);
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
        }));
        if (horizontalScrollState.scrollWidth > horizontalScrollState.clientWidth) {
            await tableViewport.evaluate((node) => { node.scrollLeft = node.scrollWidth; });
            assert.ok(await tableViewport.evaluate((node) => node.scrollLeft > 0), `${profile.name}: la tabla ancha se puede recorrer lateralmente`);
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, `${profile.name}: sin overflow horizontal de página`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight), true, `${profile.name}: sin overflow vertical de página`);
        assert.deepEqual(errors, [], `${profile.name}: sin errores`);
        await page.getByRole('button', { name: 'Ajustar distribución visual' }).click();
        const wideOption = page.getByRole('radio', { name: 'Amplio' });
        assert.equal(await wideOption.isDisabled(), profile.expected !== 'wide', `${profile.name}: modo amplio seguro`);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-adaptive-shell-${profile.name}.png`, fullPage: true });
        await context.close();
    }
    console.log('validate-adaptive-app-layout-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
