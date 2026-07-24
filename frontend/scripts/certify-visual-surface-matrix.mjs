import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const frontendRoot = path.resolve(import.meta.dirname, '..');
const inventoryPath = path.resolve(frontendRoot, '..', 'docs', 'architecture', 'visual-surface-inventory.json');
const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
const requestedProfiles = process.argv.filter((value) => value.startsWith('--profile=')).map((value) => value.slice(10));
const requestedSurfaces = process.argv.filter((value) => value.startsWith('--surface=')).map((value) => value.slice(10));
const excludedSurfaces = process.argv.filter((value) => value.startsWith('--exclude=')).map((value) => value.slice(10));
const profiles = requestedProfiles.length ? inventory.profiles.filter(({ id }) => requestedProfiles.includes(id)) : inventory.profiles;
const selectedHarnesses = requestedSurfaces.length
    ? inventory.harnesses.filter(({ source, id }) => requestedSurfaces.some((term) => source.includes(term) || id === term))
    : inventory.harnesses;
const harnesses = selectedHarnesses.filter(({ source, id }) => !excludedSurfaces.some((term) => source.includes(term) || id === term));
assert.ok(profiles.length, 'No se seleccionaron perfiles visuales validos.');
assert.ok(harnesses.length, 'No se seleccionaron superficies visuales validas.');

const port = Number(process.env.VISUAL_CERT_PORT || 4260);
const baseUrl = `http://127.0.0.1:${port}`;
const runId = process.env.VISUAL_CERT_RUN_ID || new Date().toISOString().replace(/[:.]/gu, '-');
const artifactRoot = path.resolve(frontendRoot, '..', 'artifacts', 'visual-certification', runId);
await mkdir(artifactRoot, { recursive: true });

const vite = spawn(
    process.platform === 'win32' ? 'cmd.exe' : 'npm',
    process.platform === 'win32'
        ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)]
        : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)],
    {
        cwd: frontendRoot,
        env: { ...process.env, VITE_ADAPTIVE_UI_ENABLED: 'true' },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
    },
);
let viteOutput = '';
vite.stdout?.on('data', (chunk) => { viteOutput += chunk.toString(); });
vite.stderr?.on('data', (chunk) => { viteOutput += chunk.toString(); });
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
    throw new Error(`Vite no respondio. ${viteOutput.slice(-2000)}`);
};

const androidUserAgent = 'Mozilla/5.0 (Linux; Android 14; Lenovo TB370FU) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 OPR/89.0.0.0';
const report = {
    schemaVersion: 1,
    runId,
    adaptiveBuildFlag: true,
    inventory: path.relative(path.resolve(frontendRoot, '..'), inventoryPath).split(path.sep).join('/'),
    requested: { profiles: profiles.map(({ id }) => id), surfaces: harnesses.map(({ id }) => id) },
    results: [],
};

let browser;
try {
    await waitForServer();
    browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    });
    for (const profile of profiles) {
        const profileDirectory = path.join(artifactRoot, profile.id);
        await mkdir(profileDirectory, { recursive: true });
        const [width, height] = profile.viewport;
        const context = await browser.newContext({
            viewport: { width, height },
            screen: { width, height },
            deviceScaleFactor: profile.dpr,
            hasTouch: profile.touch,
            isMobile: profile.touch,
            ...(profile.touch ? { userAgent: androidUserAgent } : {}),
        });
        for (const harness of harnesses) {
            const page = await context.newPage();
            const runtimeErrors = [];
            page.on('pageerror', (error) => runtimeErrors.push(error.message));
            page.on('console', (message) => {
                if (message.type() === 'error' && !/favicon|404/u.test(message.text())) runtimeErrors.push(message.text());
            });
            await page.route('**/api/v1/**', (route) => {
                const url = new URL(route.request().url());
                const apiPath = url.pathname;
                const projects = Array.from({ length: 12 }, (_, index) => ({
                    id: index + 1,
                    codigo: `SB-${String(index + 1).padStart(3, '0')}`,
                    codigo_root: `SB-${String(index + 1).padStart(3, '0')}`,
                    nombre: `Proyecto Santiago Bermeo ${index + 1}`,
                    descripcion: `Proyecto representativo de validacion visual ${index + 1}`,
                    empresa_id: 7,
                    estado: index % 3 === 0 ? 'En ejecución' : 'Planificación',
                    presupuesto_estimado: 125000 + index * 31750,
                    num_revisiones: index % 4 === 0 ? 2 : 1,
                    moneda: 'USD',
                    updated_at: `2026-07-${String(24 - index).padStart(2, '0')}T12:00:00Z`,
                }));
                let body = [];
                if (/\/proyectos\/?$/u.test(apiPath)) body = projects;
                else if (apiPath.endsWith('/proyectos/marketplace-export/statuses')) body = { projects: {} };
                else if (apiPath.includes('/proyecto-detalles/')) body = { plazo_estimado: 180, fecha_presentacion: '2026-09-30' };
                else if (apiPath.includes('/bases-trabajo/')) body = [{ id: 19, nombre: 'Base tecnica Santiago Bermeo', tipo: 'Base Maestra' }];
                else if (apiPath.includes('/personal-todos/') || apiPath.includes('/calendar-entries/')) body = [];
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
            });
            const startedAt = Date.now();
            let navigationError = null;
            try {
                await page.goto(`${baseUrl}${harness.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await page.waitForTimeout(750);
            } catch (error) {
                navigationError = error.message;
            }
            const geometry = await page.evaluate(() => {
                const root = document.documentElement;
                const body = document.body;
                const viewport = { width: window.innerWidth, height: window.innerHeight };
                const selectorFor = (node) => {
                    if (node.id) return `#${node.id}`;
                    const marker = [...node.attributes].find(({ name }) => name.startsWith('data-'));
                    return marker ? `[${marker.name}="${marker.value}"]` : `${node.tagName.toLowerCase()}.${[...node.classList].slice(0, 2).join('.')}`;
                };
                const isVisible = (node) => {
                    const style = getComputedStyle(node);
                    const rect = node.getBoundingClientRect();
                    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
                };
                const hasScrollableAncestor = (node, axis) => {
                    for (let current = node.parentElement; current; current = current.parentElement) {
                        const style = getComputedStyle(current);
                        const overflow = axis === 'x' ? style.overflowX : style.overflowY;
                        const scrollable = axis === 'x' ? current.scrollWidth > current.clientWidth + 2 : current.scrollHeight > current.clientHeight + 2;
                        if (scrollable && /auto|scroll/u.test(overflow)) return true;
                    }
                    return false;
                };
                const interactiveClipping = [...document.querySelectorAll('button, input, select, textarea, a[href], [role="button"], [role="tab"], [role="menuitem"]')]
                    .filter(isVisible)
                    .map((node) => ({ node, rect: node.getBoundingClientRect() }))
                    .filter(({ node, rect }) => (
                        (rect.left < -2 || rect.right > viewport.width + 2) && !hasScrollableAncestor(node, 'x')
                    ) || (
                        (rect.top < -2 || rect.bottom > viewport.height + 2) && getComputedStyle(node).position === 'fixed' && !hasScrollableAncestor(node, 'y')
                    ))
                    .slice(0, 30)
                    .map(({ node, rect }) => ({ selector: selectorFor(node), rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }));
                const fixedClipping = [...document.querySelectorAll('body *')]
                    .filter((node) => isVisible(node) && getComputedStyle(node).position === 'fixed')
                    .map((node) => ({ node, rect: node.getBoundingClientRect() }))
                    .filter(({ rect }) => rect.left < -2 || rect.right > viewport.width + 2 || rect.top < -2 || rect.bottom > viewport.height + 2)
                    .slice(0, 30)
                    .map(({ node, rect }) => ({ selector: selectorFor(node), rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }));
                const scrollContainers = [...document.querySelectorAll('body *')]
                    .filter((node) => {
                        const style = getComputedStyle(node);
                        return (/auto|scroll/u.test(style.overflowY) && node.scrollHeight > node.clientHeight + 2)
                            || (/auto|scroll/u.test(style.overflowX) && node.scrollWidth > node.clientWidth + 2);
                    }).length;
                return {
                    viewport,
                    dpr: window.devicePixelRatio,
                    bodyTextLength: body.innerText.trim().length,
                    documentWidth: Math.max(root.scrollWidth, body.scrollWidth),
                    documentHeight: Math.max(root.scrollHeight, body.scrollHeight),
                    horizontalOverflow: Math.max(root.scrollWidth, body.scrollWidth) - root.clientWidth,
                    interactiveClipping,
                    fixedClipping,
                    scrollContainers,
                    adaptiveProfiles: [...document.querySelectorAll('[data-adaptive-profile]')].map((node) => ({
                        profile: node.getAttribute('data-adaptive-profile'),
                        detected: node.getAttribute('data-adaptive-detected-profile'),
                        enabled: node.getAttribute('data-adaptive-ui-enabled'),
                    })),
                };
            }).catch(() => null);
            const screenshotName = harness.source.replace(/\.html$/u, '.png');
            const screenshotPath = path.join(profileDirectory, screenshotName);
            await page.screenshot({ path: screenshotPath, fullPage: false, scale: 'css' }).catch((error) => runtimeErrors.push(`screenshot: ${error.message}`));
            const scrollReachability = await page.evaluate(() => {
                const candidates = [...document.querySelectorAll('body *')].map((node, index) => {
                    const style = getComputedStyle(node);
                    return {
                        node,
                        index,
                        horizontalDelta: /auto|scroll/u.test(style.overflowX) ? node.scrollWidth - node.clientWidth : 0,
                        verticalDelta: /auto|scroll/u.test(style.overflowY) ? node.scrollHeight - node.clientHeight : 0,
                        touchAction: style.touchAction,
                    };
                });
                const horizontal = candidates.sort((left, right) => right.horizontalDelta - left.horizontalDelta)[0];
                const vertical = [...candidates].sort((left, right) => right.verticalDelta - left.verticalDelta)[0];
                let horizontalResult = null;
                if (horizontal?.horizontalDelta > 2) {
                    horizontal.node.setAttribute('data-visual-cert-horizontal-scroll', 'true');
                    horizontal.node.scrollLeft = horizontal.node.scrollWidth;
                    horizontalResult = {
                        delta: horizontal.horizontalDelta,
                        reached: horizontal.node.scrollLeft >= horizontal.horizontalDelta - 2,
                        scrollLeft: horizontal.node.scrollLeft,
                        touchAction: horizontal.touchAction,
                    };
                }
                let verticalResult = null;
                if (vertical?.verticalDelta > 2) {
                    const previous = vertical.node.scrollTop;
                    vertical.node.scrollTop = vertical.node.scrollHeight;
                    verticalResult = {
                        delta: vertical.verticalDelta,
                        reached: vertical.node.scrollTop >= vertical.verticalDelta - 2,
                        scrollTop: vertical.node.scrollTop,
                        touchAction: vertical.touchAction,
                    };
                    vertical.node.scrollTop = previous;
                }
                return { horizontal: horizontalResult, vertical: verticalResult };
            }).catch(() => null);
            let scrollEndScreenshot = null;
            if (scrollReachability?.horizontal) {
                await page.waitForTimeout(50);
                const scrollEndName = harness.source.replace(/\.html$/u, '-scroll-end.png');
                const scrollEndPath = path.join(profileDirectory, scrollEndName);
                await page.screenshot({ path: scrollEndPath, fullPage: false, scale: 'css' }).catch((error) => runtimeErrors.push(`scroll screenshot: ${error.message}`));
                scrollEndScreenshot = path.relative(artifactRoot, scrollEndPath).split(path.sep).join('/');
            }
            const failures = [
                ...(navigationError ? [`navigation: ${navigationError}`] : []),
                ...runtimeErrors.map((error) => `runtime: ${error}`),
                ...(!geometry || geometry.bodyTextLength === 0 ? ['empty surface'] : []),
                ...(geometry?.horizontalOverflow > 4 ? [`document horizontal overflow: ${geometry.horizontalOverflow}px`] : []),
                ...(geometry?.interactiveClipping.length ? [`${geometry.interactiveClipping.length} clipped interactive elements`] : []),
                ...(geometry?.fixedClipping.length ? [`${geometry.fixedClipping.length} clipped fixed elements`] : []),
                ...(scrollReachability?.horizontal && !scrollReachability.horizontal.reached ? ['horizontal scroll end is unreachable'] : []),
                ...(scrollReachability?.vertical && !scrollReachability.vertical.reached ? ['vertical scroll end is unreachable'] : []),
            ];
            const result = {
                profile: profile.id,
                surface: harness.id,
                path: harness.path,
                screenshot: path.relative(artifactRoot, screenshotPath).split(path.sep).join('/'),
                scrollEndScreenshot,
                elapsedMs: Date.now() - startedAt,
                geometry,
                scrollReachability,
                failures,
                status: failures.length ? 'FAIL' : 'PASS',
            };
            report.results.push(result);
            console.log(`${result.status} ${profile.id} ${harness.source}${failures.length ? ` :: ${failures.join(' | ')}` : ''}`);
            await page.close();
        }
        await context.close();
    }
} finally {
    await browser?.close();
    cleanup();
    report.summary = {
        total: report.results.length,
        passed: report.results.filter(({ status }) => status === 'PASS').length,
        failed: report.results.filter(({ status }) => status === 'FAIL').length,
    };
    await writeFile(path.join(artifactRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    await writeFile(path.join(artifactRoot, 'summary.txt'), `${report.summary.passed}/${report.summary.total} PASS; ${report.summary.failed} FAIL\n`, 'utf8');
    console.log(`Evidence: ${artifactRoot}`);
}

assert.equal(report.summary.failed, 0, `${report.summary.failed} combinaciones visuales fallaron; revisar report.json y capturas.`);
