import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4246;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)] : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout?.on('data', (chunk) => { output += chunk.toString(); }); vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });
const cleanup = () => { if (!vite.killed && process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); else if (!vite.killed) vite.kill(); };
const waitForServer = async () => { const deadline = Date.now() + 40000; while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ } await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(`Vite no respondio. ${output}`); };

let browser;
try {
    await waitForServer();
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', (error) => errors.push(error.message)); page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
    await page.goto(`${baseUrl}/bim-cde-submittals-harness.html`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Titulo submittal').fill('Plano de taller fachada'); await page.getByLabel('Revisor submittal').selectOption('8');
    await page.getByLabel('Fecha requerida submittal').fill('2027-07-20T12:00'); await page.getByLabel('Documento submittal').selectOption('91'); await page.getByLabel('Notas submittal').fill('Primera emision');
    await page.getByRole('button', { name: 'Crear expediente' }).click(); await page.getByText('SUB-0001 · REV 01 · Borrador').waitFor();
    const act = async (button, comment) => { await page.getByLabel('Comentario submittal').fill(comment); await page.getByRole('button', { name: button }).click(); };
    await act('Enviar', 'Emitir para revision'); await page.getByText('SUB-0001 · REV 01 · Enviado').waitFor();
    await act('Iniciar revision', 'Comprobar anclajes'); await page.getByText('SUB-0001 · REV 01 · En revision').waitFor();
    await act('Rechazar', 'Corregir anclajes'); await page.getByText('SUB-0001 · REV 01 · Rechazado').waitFor();
    await page.getByLabel('Nuevo documento submittal').selectOption('92'); await page.getByLabel('Notas reenvio submittal').fill('Anclajes corregidos'); await page.getByRole('button', { name: 'Reenviar' }).click();
    await page.getByText('SUB-0001 · REV 02 · Borrador').waitFor();
    assert.equal(await page.getByText('superseded', { exact: true }).count(), 1, 'REV 1 queda superseded');
    await act('Enviar', 'Reemitir para revision'); await act('Iniciar revision', 'Comprobar correccion'); await act('Aprobar', 'Aprobado para construccion');
    await page.getByText('SUB-0001 · REV 02 · Aprobado').waitFor();
    assert.equal(await page.locator('[data-bim-submittal-revisions] > div').count(), 2, 'Conserva dos revisiones');
    assert.equal(await page.locator('[data-bim-submittal-events] > div').count(), 8, 'Conserva toda la trazabilidad');
    assert.equal(await page.getByText('Expediente BIM aislado. No modifica Documentos, Compras ni Contratos de GiProy Clasico.').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'Sin overflow horizontal');
    assert.deepEqual(errors, [], `Sin errores de consola: ${errors.join(' | ')}`);
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-cde-submittals-1920x1080.png`, fullPage: true });
    await context.close(); console.log('validate-bim-cde-submittals-dom: ok');
} finally { await browser?.close(); cleanup(); }
