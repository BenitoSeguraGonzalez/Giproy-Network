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
                    revision: 0,
                    moneda: 'USD',
                    updated_at: `2026-07-${String(24 - index).padStart(2, '0')}T12:00:00Z`,
                }));
                let body = [];
                if (/\/proyectos\/?$/u.test(apiPath)) body = projects;
                else if (/\/proyectos\/[^/]+\/revisiones\/?$/u.test(apiPath)) {
                    body = Array.from({ length: 8 }, (_, revision) => ({
                        ...projects[0],
                        id: 101 + revision,
                        revision,
                        nombre: `Proyecto Santiago Bermeo 1 - Revision ${String(revision).padStart(3, '0')}`,
                        ultima_modificacion: `2026-07-${String(24 - revision).padStart(2, '0')}T12:00:00Z`,
                    }));
                }
                else if (apiPath.endsWith('/proyectos/papelera')) {
                    body = Array.from({ length: 7 }, (_, index) => ({
                        ...projects[index],
                        id: 201 + index,
                        trash_original_nombre: projects[index].nombre,
                        trash_original_codigo: projects[index].codigo,
                        deleted_at: `2026-07-${String(24 - index).padStart(2, '0')}T12:00:00Z`,
                        recycle_expires_at: `2026-07-${String(31 - index).padStart(2, '0')}T12:00:00Z`,
                    }));
                }
                else if (/\/proyectos\/\d+\/?$/u.test(apiPath)) body = projects[0];
                else if (apiPath.endsWith('/proyectos/marketplace-export/statuses')) body = { projects: {} };
                else if (apiPath.includes('/proyecto-detalles/')) body = { plazo_estimado: 180, fecha_presentacion: '2026-09-30' };
                else if (apiPath.includes('/bases-trabajo/')) body = [{ id: 19, nombre: 'Base tecnica Santiago Bermeo', tipo: 'Base Maestra' }];
                else if (apiPath.includes('/personal-todos/') || apiPath.includes('/calendar-entries/')) body = [];
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
            });
            const startedAt = Date.now();
            let navigationError = null;
            try {
                const harnessUrl = harness.source === 'classic-projects-edit-harness.html'
                    ? `${baseUrl}${harness.path}?project_id=1&tab=datos`
                    : `${baseUrl}${harness.path}`;
                await page.goto(harnessUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await page.waitForTimeout(750);
                if (harness.source === 'classic-projects-kanban-harness.html') {
                    await page.getByRole('tab', { name: 'Kanban' }).click();
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'classic-projects-create-harness.html') {
                    await page.getByRole('button', { name: 'Nuevo proyecto' }).click();
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'classic-projects-delete-step1-harness.html'
                    || harness.source === 'classic-projects-delete-step2-harness.html') {
                    await page.getByRole('button', { name: /Mover proyecto a papelera/u }).first().click();
                    await page.waitForTimeout(250);
                    if (harness.source === 'classic-projects-delete-step2-harness.html') {
                        await page.getByRole('button', { name: 'Entiendo, Continuar' }).click();
                        await page.waitForTimeout(200);
                    }
                }
                if (harness.source === 'classic-projects-revisions-harness.html') {
                    await page.getByRole('row').filter({ hasText: 'Proyecto Santiago Bermeo 1' }).first().click();
                    await page.waitForTimeout(500);
                }
                if (harness.source === 'classic-projects-recycle-harness.html') {
                    await page.getByRole('button', { name: 'Papelera', exact: true }).click();
                    await page.waitForTimeout(500);
                }
                if (harness.source === 'classic-projects-clone-confirm-harness.html') {
                    await page.getByRole('button', { name: /Clonar proyecto completo Proyecto Santiago Bermeo 1/u }).first().click();
                    await page.waitForTimeout(300);
                }
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
            const projectsScrollContract = profile.touch && harness.source === 'classic-projects-harness.html'
                ? await (async () => {
                    const before = await page.evaluate(() => {
                        const controls = document.querySelector('[data-projects-fixed-controls]');
                        const viewport = document.querySelector('[data-projects-list-viewport]');
                        if (!controls || !viewport) return null;
                        const rect = viewport.getBoundingClientRect();
                        viewport.scrollTop = 0;
                        return {
                            controlsTop: controls.getBoundingClientRect().top,
                            viewportTop: rect.top,
                            x: Math.max(8, Math.min(window.innerWidth - 8, rect.left + (rect.width / 2))),
                            y: Math.max(8, Math.min(window.innerHeight - 8, rect.top + Math.min(rect.height / 2, 220))),
                        };
                    });
                    if (!before) return { passed: false, reason: 'missing projects scroll markers' };
                    const session = await context.newCDPSession(page);
                    await session.send('Input.dispatchTouchEvent', {
                        type: 'touchStart',
                        touchPoints: [{ x: before.x, y: before.y, radiusX: 2, radiusY: 2, force: 1, id: 7 }],
                    });
                    for (let step = 1; step <= 6; step += 1) {
                        await session.send('Input.dispatchTouchEvent', {
                            type: 'touchMove',
                            touchPoints: [{
                                x: before.x,
                                y: before.y - (Math.min(200, before.y - 8) * step / 6),
                                radiusX: 2,
                                radiusY: 2,
                                force: 1,
                                id: 7,
                            }],
                        });
                    }
                    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
                    await page.waitForTimeout(180);
                    await session.detach();
                    const after = await page.evaluate(() => ({
                        controlsTop: document.querySelector('[data-projects-fixed-controls]')?.getBoundingClientRect().top,
                        listScrollTop: document.querySelector('[data-projects-list-viewport]')?.scrollTop || 0,
                        horizontalReachable: (() => {
                            const viewport = document.querySelector('[data-projects-list-viewport]');
                            if (!viewport || viewport.scrollWidth <= viewport.clientWidth + 2) return true;
                            viewport.scrollLeft = viewport.scrollWidth;
                            return viewport.scrollLeft > 1;
                        })(),
                        stickyHeaderDelta: (() => {
                            const viewport = document.querySelector('[data-projects-list-viewport]');
                            const header = viewport?.querySelector('thead');
                            if (!viewport || !header) return Number.POSITIVE_INFINITY;
                            return Math.abs(header.getBoundingClientRect().top - viewport.getBoundingClientRect().top);
                        })(),
                    }));
                    const fixedDelta = Math.abs(after.controlsTop - before.controlsTop);
                    return {
                        passed: after.listScrollTop > 1
                            && fixedDelta <= 1
                            && after.horizontalReachable
                            && after.stickyHeaderDelta <= 2,
                        listScrollTop: after.listScrollTop,
                        fixedControlsDelta: fixedDelta,
                        horizontalReachable: after.horizontalReachable,
                        stickyHeaderDelta: after.stickyHeaderDelta,
                    };
                })().catch((error) => ({ passed: false, reason: error.message }))
                : null;
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
            const gestureReachability = profile.touch ? await (async () => {
                const candidates = await page.evaluate(() => [...document.querySelectorAll('body *')]
                    .map((node, index) => {
                        const style = getComputedStyle(node);
                        const rect = node.getBoundingClientRect();
                        const verticalDelta = /auto|scroll/u.test(style.overflowY) ? node.scrollHeight - node.clientHeight : 0;
                        const horizontalDelta = /auto|scroll/u.test(style.overflowX) ? node.scrollWidth - node.clientWidth : 0;
                        if (Math.max(verticalDelta, horizontalDelta) < 96
                            || rect.width < 40
                            || rect.height < 40
                            || rect.right <= 0
                            || rect.bottom <= 0
                            || rect.left >= window.innerWidth
                            || rect.top >= window.innerHeight) return null;
                        const x = Math.max(4, Math.min(window.innerWidth - 4, verticalDelta >= horizontalDelta ? rect.left + 8 : rect.left + (rect.width / 2)));
                        const y = Math.max(4, Math.min(window.innerHeight - 4, rect.top + (rect.height / 2)));
                        const hitTarget = document.elementFromPoint(x, y);
                        if (!hitTarget || !node.contains(hitTarget)) return null;
                        const id = `visual-gesture-${index}`;
                        node.setAttribute('data-visual-gesture-id', id);
                        node.scrollTop = 0;
                        node.scrollLeft = 0;
                        return {
                            id,
                            tag: node.tagName.toLowerCase(),
                            marker: [...node.attributes].find(({ name }) => name.startsWith('data-'))?.name || '',
                            className: typeof node.className === 'string' ? node.className.slice(0, 180) : '',
                            x,
                            y,
                            verticalDelta,
                            horizontalDelta,
                            depth: (() => {
                                let value = 0;
                                for (let current = node.parentElement; current; current = current.parentElement) value += 1;
                                return value;
                            })(),
                        };
                    })
                    .filter(Boolean)
                    .sort((left, right) => (
                        right.depth - left.depth
                        || Math.max(right.verticalDelta, right.horizontalDelta) - Math.max(left.verticalDelta, left.horizontalDelta)
                    ))
                    .slice(0, 8));
                const session = await context.newCDPSession(page);
                const results = [];
                for (const candidate of candidates) {
                    const vertical = candidate.verticalDelta >= candidate.horizontalDelta;
                    const currentPoint = await page.evaluate(({ id, vertical }) => {
                        const node = document.querySelector(`[data-visual-gesture-id="${id}"]`);
                        if (!node) return null;
                        const rect = node.getBoundingClientRect();
                        if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight) return null;
                        return {
                            x: Math.max(4, Math.min(window.innerWidth - 4, vertical ? rect.left + 8 : rect.left + (rect.width / 2))),
                            y: Math.max(4, Math.min(window.innerHeight - 4, rect.top + (rect.height / 2))),
                        };
                    }, { id: candidate.id, vertical });
                    if (!currentPoint) {
                        results.push({ ...candidate, axis: vertical ? 'y' : 'x', movement: 0, reached: true, skipped: 'not visible after prior gesture' });
                        continue;
                    }
                    const endX = vertical ? currentPoint.x : Math.max(8, currentPoint.x - Math.min(180, currentPoint.x - 8));
                    const endY = vertical ? Math.max(8, currentPoint.y - Math.min(180, currentPoint.y - 8)) : currentPoint.y;
                    await session.send('Input.dispatchTouchEvent', {
                        type: 'touchStart',
                        touchPoints: [{ x: currentPoint.x, y: currentPoint.y, radiusX: 2, radiusY: 2, force: 1, id: 1 }],
                    });
                    for (let step = 1; step <= 5; step += 1) {
                        await session.send('Input.dispatchTouchEvent', {
                            type: 'touchMove',
                            touchPoints: [{
                                x: currentPoint.x + ((endX - currentPoint.x) * step / 5),
                                y: currentPoint.y + ((endY - currentPoint.y) * step / 5),
                                radiusX: 2,
                                radiusY: 2,
                                force: 1,
                                id: 1,
                            }],
                        });
                    }
                    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
                    await page.waitForTimeout(120);
                    const movement = await page.evaluate(({ id, vertical }) => {
                        const node = document.querySelector(`[data-visual-gesture-id="${id}"]`);
                        return node ? (vertical ? node.scrollTop : node.scrollLeft) : 0;
                    }, { id: candidate.id, vertical });
                    results.push({ ...candidate, axis: vertical ? 'y' : 'x', movement, reached: movement > 1 });
                }
                await session.detach();
                return results;
            })().catch((error) => [{ reached: false, error: error.message }]) : [];
            let scrollEndScreenshot = null;
            if (scrollReachability?.horizontal || scrollReachability?.vertical) {
                await page.evaluate(() => {
                    const candidates = [...document.querySelectorAll('body *')];
                    const horizontal = candidates
                        .filter((node) => /auto|scroll/u.test(getComputedStyle(node).overflowX))
                        .sort((left, right) => (right.scrollWidth - right.clientWidth) - (left.scrollWidth - left.clientWidth))[0];
                    const vertical = candidates
                        .filter((node) => /auto|scroll/u.test(getComputedStyle(node).overflowY))
                        .sort((left, right) => (right.scrollHeight - right.clientHeight) - (left.scrollHeight - left.clientHeight))[0];
                    if (horizontal?.scrollWidth > horizontal?.clientWidth + 2) horizontal.scrollLeft = horizontal.scrollWidth;
                    if (vertical?.scrollHeight > vertical?.clientHeight + 2) vertical.scrollTop = vertical.scrollHeight;
                });
                if (harness.source === 'classic-projects-revisions-harness.html') {
                    await page.evaluate(() => {
                        const portfolio = document.querySelector('[data-projects-list-viewport]');
                        if (portfolio) portfolio.scrollTop = 0;
                        const revisionViewport = [...document.querySelectorAll('[touch-action], [class*="touch-action:pan-y"]')]
                            .find((node) => node.textContent?.includes('REV-007') && node.scrollHeight > node.clientHeight + 2);
                        if (revisionViewport) revisionViewport.scrollTop = revisionViewport.scrollHeight;
                    });
                }
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
                ...(projectsScrollContract && !projectsScrollContract.passed
                    ? [`projects list ownership failed: ${projectsScrollContract.reason || JSON.stringify(projectsScrollContract)}`]
                    : []),
                ...gestureReachability.filter(({ reached }) => !reached).map(({ id, axis, error }) => (
                    error ? `touch gesture audit: ${error}` : `touch gesture did not move ${id} on ${axis}`
                )),
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
                projectsScrollContract,
                gestureReachability,
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
