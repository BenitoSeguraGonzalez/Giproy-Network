import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4259;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)] : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout?.on('data', (chunk) => { output += chunk.toString(); });
vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });
const cleanup = () => { if (!vite.killed && process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); else if (!vite.killed) vite.kill(); };
const waitForServer = async () => { const deadline = Date.now() + 40000; while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ } await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(`Vite no respondió. ${output}`); };

const manifest = {
    terms: { version: '2026-08-11', sha256: 'terms-hash', title: 'Términos y Condiciones', intro: 'Condiciones verificadas.', sections: [['Objeto y cuenta', 'Contenido contractual verificable.']] },
    privacy: { version: '2026-08-11', sha256: 'privacy-hash', title: 'Política de Privacidad', intro: 'Privacidad verificable.', sections: [['Derechos', 'Acceso, rectificación y eliminación.']] },
};

let browser;
try {
    await waitForServer();
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        const errors = [];
        const sriRequests = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/api/v1/legal/manifest', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(manifest) }));
        await page.route('**/api/v1/paises/', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 1, nombre: 'Ecuador' }, { id: 2, nombre: 'España' }]) }));
        await page.route('**/api/v1/sri-ruc/**', (route) => { sriRequests.push(route.request().url()); return route.abort(); });
        await page.goto(`${baseUrl}/legal/terminos`, { waitUntil: 'networkidle' });
        await page.getByRole('heading', { name: 'Términos y Condiciones' }).waitFor();
        assert.match(await page.locator('article').innerText(), /versión 2026-08-11/);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'Documento legal sin overflow horizontal');
        const legalScroll = page.locator('[data-legal-document-scroll]');
        assert.equal(await legalScroll.evaluate((node) => node.scrollHeight > node.clientHeight), true, 'Documento largo con scroll propio');
        await legalScroll.evaluate((node) => { node.scrollTop = node.scrollHeight; });
        await page.locator('footer').waitFor();
        assert.equal(await page.locator('footer').isVisible(), true, 'Pie legal alcanzable mediante scroll');
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-legal-terms-${viewport.width}x${viewport.height}.png` });

        await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: /Crear Cuenta/i }).click();
        await page.getByText(/Términos y Condiciones/).waitFor();
        await page.getByText('Buscar país...', { exact: true }).click();
        await page.getByText('España', { exact: true }).click();
        await page.waitForTimeout(400);
        await page.locator('#ruc').fill('B12345678');
        await page.locator('#ruc').blur();
        await page.locator('#empresa_nombre').fill('Construcciones España SL');
        assert.equal(await page.locator('#ruc').getAttribute('maxlength'), '20', 'España admite identificador fiscal internacional');
        assert.equal(sriRequests.length, 0, 'España no debe consultar el SRI');
        assert.equal(await page.getByText(/consulta SRI se aplica únicamente a Ecuador/i).isVisible(), true);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-register-spain-${viewport.width}x${viewport.height}.png`, fullPage: true });
        const submit = page.getByRole('button', { name: /Crear mi cuenta ahora/i });
        assert.equal(await submit.isDisabled(), true, 'Registro bloqueado sin consentimientos obligatorios');
        await page.locator('#acepta_terminos').check();
        await page.locator('#acepta_politica_privacidad').check();
        assert.equal(await page.locator('#acepta_politicas_comunicacion').isChecked(), false, 'Comunicaciones opcionales por defecto');
        assert.equal(await page.locator('#autoriza_publicidad').isChecked(), false, 'Publicidad opcional por defecto');
        assert.deepEqual(errors, [], `Sin errores de página: ${errors.join(' | ')}`);
        await context.close();
    }
    console.log('validate-legal-registration-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
