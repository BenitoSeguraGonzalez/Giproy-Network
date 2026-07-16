import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4226;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)] : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout?.on('data', (chunk) => { output += chunk.toString(); });
vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });
const cleanup = () => { if (vite.killed) return; if (process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); else vite.kill(); };
const waitForServer = async () => { const deadline = Date.now() + 40000; while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ } await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(`Vite no respondio. ${output}`); };
let browser;
try {
    await waitForServer();
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    const page = await browser.newPage({ viewport: { width: 390, height: 780 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${baseUrl}/bim-ids-harness.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="file"]').setInputFiles({ name: 'wall.ids', mimeType: 'text/xml', buffer: Buffer.from('<ids:ids><ids:specifications /></ids:ids>') });
    await page.waitForFunction(() => document.querySelector('select[aria-label="Perfil IDS"]')?.value === '11');
    await page.getByRole('button', { name: 'Ejecutar validacion IDS' }).click();
    await page.getByText('1 fallos').waitFor();
    await page.getByRole('button', { name: 'Registrar excepcion' }).click();
    await page.getByRole('textbox', { name: 'Motivo de excepcion IDS' }).fill('Excepcion aprobada en revision piloto');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await page.getByText('1 excepciones').waitFor();
    const overflow = await page.locator('[data-bim-ids-panel]').evaluate((element) => element.scrollWidth > element.clientWidth);
    assert.equal(overflow, false);
    assert.equal(errors.length, 0, `sin errores: ${errors.join(' | ')}`);
    console.log('validate-bim-ids-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
