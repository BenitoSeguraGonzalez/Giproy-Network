import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { chromium } from 'playwright';

const port = 4243;
const baseUrl = `http://127.0.0.1:${port}`;
const artifactRoot = path.resolve('..', 'artifacts', 'visual-certification', 'c01-1-login-final-2026-07-24');
await mkdir(artifactRoot, { recursive: true });
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, VITE_ADAPTIVE_UI_ENABLED: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
});
let output = '';
vite.stdout?.on('data', (chunk) => { output += chunk.toString(); });
vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });
const cleanup = () => {
    if (!vite.killed && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
};
const profiles = [
    { id: 'desktop-fhd-100', width: 1920, height: 1080, dpr: 1 },
    { id: 'desktop-fhd-125', width: 1536, height: 864, dpr: 1.25 },
    { id: 'desktop-fhd-150', width: 1280, height: 720, dpr: 1.5 },
    { id: 'desktop-4k-200', width: 1920, height: 1080, dpr: 2 },
    { id: 'tablet-fhd-landscape', width: 1280, height: 720, dpr: 1.5, touch: true },
    { id: 'tablet-fhd-portrait', width: 720, height: 1200, dpr: 1.5, touch: true },
    { id: 'tablet-2k-landscape', width: 1280, height: 800, dpr: 2, touch: true },
    { id: 'tablet-2k-portrait', width: 800, height: 1280, dpr: 2, touch: true },
    { id: 'lenovo-p12-landscape', width: 1472, height: 820, dpr: 2, touch: true },
    { id: 'lenovo-p12-portrait', width: 920, height: 1372, dpr: 2, touch: true },
];
const accounts = Array.from({ length: 9 }, (_, index) => ({
    empresa_id: index + 1,
    empresa_nombre: `Empresa operativa con denominación representativa ${index + 1}`,
    activo: index !== 7,
}));

let browser;
try {
    const deadline = Date.now() + 40000;
    while (Date.now() < deadline) {
        try { if ((await fetch(baseUrl)).ok) break; } catch { /* retry */ }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    });
    for (const profile of profiles) {
        const context = await browser.newContext({
            viewport: { width: profile.width, height: profile.height },
            screen: { width: profile.width, height: profile.height },
            deviceScaleFactor: profile.dpr,
            hasTouch: Boolean(profile.touch),
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.addInitScript(() => {
            try {
                sessionStorage.setItem(
                    'giproy_auth_redirect_message',
                    'La sesión de validación ha expirado. Verifica de nuevo tus credenciales para continuar.',
                );
            } catch {
                // about:blank has no session storage; the script runs again on the application origin.
            }
        });
        await page.route('**/api/v1/**', (route) => {
            const url = new URL(route.request().url());
            if (url.pathname.endsWith('/auth/accounts-by-email')) {
                return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(accounts) });
            }
            return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        });
        await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
        const viewport = page.locator('[data-login-viewport]');
        await viewport.waitFor();
        assert.equal(await page.getByRole('alert').count(), 1, `${profile.id}: error anunciado`);
        const card = page.locator('[data-login-card]');
        const cardRect = await card.boundingBox();
        assert.ok(cardRect && cardRect.x >= 0 && cardRect.x + cardRect.width <= profile.width, `${profile.id}: tarjeta dentro del ancho`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, `${profile.id}: sin overflow horizontal`);
        const footer = page.locator('[data-login-footer]');
        await footer.scrollIntoViewIfNeeded();
        const footerRect = await footer.boundingBox();
        assert.ok(footerRect && footerRect.y + footerRect.height <= profile.height + 2, `${profile.id}: footer alcanzable (${JSON.stringify(footerRect)})`);
        await page.getByRole('button', { name: /crear cuenta/i }).click();
        const registerDialog = page.getByRole('dialog', { name: 'Registro de cuenta' });
        await registerDialog.waitFor();
        const dialogRect = await registerDialog.boundingBox();
        assert.ok(dialogRect && dialogRect.x >= 0 && dialogRect.y >= 0, `${profile.id}: registro comienza dentro del viewport`);
        assert.ok(dialogRect.x + dialogRect.width <= profile.width + 1 && dialogRect.y + dialogRect.height <= profile.height + 1, `${profile.id}: registro contenido por el viewport`);
        const registrationScroll = page.getByRole('region', { name: 'Datos del registro' });
        const registrationScrollState = await registrationScroll.evaluate((node) => ({ client: node.clientHeight, total: node.scrollHeight }));
        if (registrationScrollState.total > registrationScrollState.client) {
            await registrationScroll.evaluate((node) => { node.scrollTop = node.scrollHeight; });
            assert.ok(await registrationScroll.evaluate((node) => node.scrollTop > 0), `${profile.id}: formulario extenso posee scroll interno`);
        } else {
            assert.ok(registrationScrollState.total <= registrationScrollState.client + 1, `${profile.id}: formulario completo visible sin scroll artificial`);
        }
        await page.getByRole('button', { name: 'Cerrar registro' }).click();
        await registerDialog.waitFor({ state: 'hidden' });
        await page.locator('#email').fill('persona@example.com');
        await page.getByRole('button', { name: /continuar/i }).click();
        const accountRegion = page.getByRole('region', { name: 'Empresas disponibles' });
        await accountRegion.waitFor();
        const scroll = await accountRegion.evaluate((node) => ({ client: node.clientHeight, total: node.scrollHeight }));
        assert.ok(scroll.total > scroll.client, `${profile.id}: lista numerosa posee scroll propio`);
        const pageScrollBefore = await viewport.evaluate((node) => node.scrollTop);
        await accountRegion.evaluate((node) => { node.scrollTop = node.scrollHeight; });
        assert.equal(await viewport.evaluate((node) => node.scrollTop), pageScrollBefore, `${profile.id}: lista no desplaza la pagina`);
        await page.getByRole('button', { name: /Empresa operativa.*1/i }).click();
        await page.locator('#password').waitFor();
        assert.equal(await page.getByRole('button', { name: 'Mostrar contraseña' }).count(), 1, `${profile.id}: control de contraseña nombrado`);
        if (profile.touch) {
            const targets = await page.locator('[data-adaptive-touch-target="true"]:visible').evaluateAll((nodes) => nodes.map((node) => {
                const rect = node.getBoundingClientRect();
                return { width: rect.width, height: rect.height };
            }));
            assert.ok(targets.every(({ width, height }) => width >= 44 && height >= 44), `${profile.id}: objetivos tactiles 44x44`);
            await page.setViewportSize({ width: profile.width, height: 540 });
            await page.locator('#password').focus();
            const submit = page.getByRole('button', { name: /acceder al sistema/i });
            await submit.scrollIntoViewIfNeeded();
            const submitRect = await submit.boundingBox();
            assert.ok(submitRect && submitRect.y + submitRect.height <= 541, `${profile.id}: accion alcanzable con teclado virtual`);
        }
        await page.screenshot({ path: path.join(artifactRoot, `${profile.id}.png`), fullPage: false });
        assert.deepEqual(errors, [], `${profile.id}: sin errores`);
        await context.close();
        console.log(`PASS ${profile.id} /login`);
    }
} finally {
    await browser?.close();
    cleanup();
}
