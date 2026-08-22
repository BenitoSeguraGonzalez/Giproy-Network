import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4261;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)] : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout?.on('data', (chunk) => { output += chunk.toString(); });
vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });
const cleanup = () => { if (!vite.killed && process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); else if (!vite.killed) vite.kill(); };
const waitForServer = async () => { const deadline = Date.now() + 40000; while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ } await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(`Vite no respondió. ${output}`); };

let browser;
try {
    await waitForServer();
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(`${baseUrl}/legal/licencias`, { waitUntil: 'networkidle' });
        await page.getByRole('heading', { name: 'Avisos de software de terceros' }).waitFor();
        assert.equal(await page.locator('[data-third-party-licenses]').count(), 1, 'La ruta pública debe montar el inventario de terceros');
        assert.equal(await page.getByRole('list', { name: 'Inventario de dependencias y licencias' }).getByRole('listitem').count(), 20, 'El inventario directo esperado debe ser visible');
        assert.equal(await page.getByText('That Open Components Front', { exact: true }).count(), 1, 'La dependencia directa components-front debe estar avisada');
        assert.equal(await page.getByText('MPL-2.0', { exact: true }).count(), 1, 'web-ifc debe conservar su aviso MPL-2.0');
        assert.equal(await page.getByText('BSD-2-Clause', { exact: true }).count(), 1, 'Leaflet debe conservar su aviso BSD-2-Clause');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'La vista legal no debe desbordar horizontalmente');
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-third-party-licenses-${viewport.width}x${viewport.height}.png`, fullPage: true });
        await page.getByRole('link', { name: /Política de Privacidad/i }).click();
        await page.getByRole('heading', { name: 'Política de Privacidad' }).waitFor();
        assert.deepEqual(errors, [], `Sin errores de página: ${errors.join(' | ')}`);
        await context.close();
    }
    console.log('smoke-public-third-party-licenses: ok');
} finally {
    await browser?.close();
    cleanup();
}
