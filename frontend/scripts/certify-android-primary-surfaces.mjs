import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const cdpUrl = process.env.ANDROID_CHROME_CDP_URL || 'http://127.0.0.1:9222';
const appUrl = process.env.ANDROID_APP_URL || 'http://127.0.0.1:4246';
const runId = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const evidenceDir = path.resolve('..', 'artifacts', 'android-visual-certification', runId);
const projects = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    codigo: `SB-${String(index + 1).padStart(3, '0')}`,
    codigo_root: `SB-${String(index + 1).padStart(3, '0')}`,
    nombre: `Proyecto Santiago Bermeo ${index + 1}`,
    descripcion: `Proyecto representativo de validacion visual ${index + 1}`,
    empresa_id: 7,
    estado: index % 3 === 0 ? 'En ejecución' : 'Planificación',
    presupuesto_total: 1250000 + index * 87500,
    moneda: 'USD',
    created_at: `2026-06-${String(index + 1).padStart(2, '0')}T12:00:00Z`,
    updated_at: `2026-07-${String(24 - index).padStart(2, '0')}T12:00:00Z`,
}));
const primarySurfaces = [
    ['dashboard', 'classic-dashboard-harness.html'],
    ['projects', 'classic-projects-harness.html'],
    ['precios-unitarios', 'classic-precios-unitarios-harness.html'],
];
const runAllSurfaces = process.argv.includes('--all');
const inventory = runAllSurfaces
    ? JSON.parse(await readFile(path.resolve('..', 'docs', 'architecture', 'visual-surface-inventory.json'), 'utf8'))
    : null;
const surfaces = runAllSurfaces
    ? inventory.harnesses
        .filter((item) => !['bim-fragments-csg-harness.html', 'gantt-ff-harness.html'].includes(item.source))
        .map((item) => [item.source.replace(/-harness\.html$/u, ''), item.source])
    : primarySurfaces;

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.connectOverCDP(cdpUrl);
const context = browser.contexts()[0];
const pages = context.pages();
const page = pages[0] || await context.newPage();
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(error.message));
await page.route('**/api/v1/**', async (route) => {
    const apiPath = new URL(route.request().url()).pathname;
    let body = [];
    if (/\/proyectos\/?$/u.test(apiPath)) body = projects;
    else if (apiPath.endsWith('/proyectos/marketplace-export/statuses')) body = { projects: {} };
    else if (apiPath.includes('/proyecto-detalles/')) body = { plazo_estimado: 180, fecha_presentacion: '2026-09-30' };
    else if (apiPath.includes('/bases-trabajo/')) body = [{ id: 19, nombre: 'Base tecnica Santiago Bermeo', tipo: 'Base Maestra' }];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
});

const results = [];
for (const [name, entry] of surfaces) {
    runtimeErrors.length = 0;
    await page.goto(`${appUrl}/${entry}`, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await page.waitForTimeout(runAllSurfaces ? 900 : 500);
    const initial = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        dpr: window.devicePixelRatio,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientWidth: document.documentElement.clientWidth,
        clientHeight: document.documentElement.clientHeight,
        bodyTextLength: document.body.innerText.trim().length,
        renderedElements: document.body.querySelectorAll('*').length,
    }));
    await page.screenshot({ path: path.join(evidenceDir, `${name}.png`), fullPage: false, scale: 'css' });
    const end = await page.evaluate(() => {
        const scrollables = [...document.querySelectorAll('*')].filter((node) => {
            const style = getComputedStyle(node);
            return node instanceof HTMLElement && (
                (node.scrollWidth > node.clientWidth + 1 && /auto|scroll/.test(style.overflowX))
                || (node.scrollHeight > node.clientHeight + 1 && /auto|scroll/.test(style.overflowY))
            );
        });
        for (const node of scrollables) {
            node.scrollLeft = node.scrollWidth;
            node.scrollTop = node.scrollHeight;
        }
        window.scrollTo(document.documentElement.scrollWidth, document.documentElement.scrollHeight);
        return scrollables.map((node) => ({
            horizontalReachable: node.scrollWidth <= node.clientWidth + node.scrollLeft + 1,
            verticalReachable: node.scrollHeight <= node.clientHeight + node.scrollTop + 1,
        }));
    });
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(evidenceDir, `${name}-scroll-end.png`), fullPage: false, scale: 'css' });
    const passed = runtimeErrors.length === 0
        && initial.scrollWidth <= initial.clientWidth + 1
        && (initial.bodyTextLength > 0 || initial.renderedElements > 3)
        && end.every((item) => item.horizontalReachable && item.verticalReachable);
    results.push({ name, passed, initial, scrollContainers: end, runtimeErrors: [...runtimeErrors] });
    console.log(`${passed ? 'PASS' : 'FAIL'} android ${name} ${initial.innerWidth}x${initial.innerHeight} DPR ${initial.dpr}`);
}

await writeFile(path.join(evidenceDir, 'report.json'), `${JSON.stringify({ cdpUrl, appUrl, results }, null, 2)}\n`);
await browser.close();
console.log(`Evidence: ${evidenceDir}`);
if (results.some((item) => !item.passed)) process.exitCode = 1;
