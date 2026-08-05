import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4245;
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
    await page.goto(`${baseUrl}/bim-cde-rfi-harness.html`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Nueva RFI|Crear RFI|Nueva solicitud/i }).click();
    await page.getByLabel('Asunto RFI').fill('Definir resistencia del hormigon');
    await page.getByLabel('Pregunta RFI').fill('Confirmar resistencia especificada para el muro seleccionado.');
    await page.getByLabel('Responsable RFI').selectOption('8');
    await page.getByLabel('Vencimiento RFI').fill('2027-07-13T12:00');
    await page.getByLabel('Documento RFI').selectOption('91');
    assert.equal(await page.getByLabel('GlobalId RFI').inputValue(), '3GIPROY_TEST_GUID', 'La RFI hereda el elemento IFC activo');
    await page.getByRole('button', { name: 'Crear borrador' }).click();
    await page.getByText('RFI-0001', { exact: true }).waitFor();
    await page.getByLabel('Motivo transicion RFI').fill('Consulta lista para coordinacion'); await page.getByRole('button', { name: 'Enviar' }).click();
    await page.getByText('RFI-0001 · Enviada').waitFor();
    await page.getByLabel('Respuesta RFI').fill('Usar hormigon de 28 MPa segun especificacion ARQ-001.');
    await page.getByLabel('Motivo transicion RFI').fill('Respuesta validada por coordinacion'); await page.getByRole('button', { name: 'Responder' }).click();
    await page.getByText('RFI-0001 · Respondida').waitFor();
    await page.getByLabel('Motivo transicion RFI').fill('Respuesta aceptada por el solicitante'); await page.getByRole('button', { name: 'Cerrar' }).click();
    await page.getByText('RFI-0001 · Cerrada').waitFor();
    assert.equal(await page.locator('[data-bim-rfi-events] > div').count(), 4, 'El workflow conserva un evento por transicion');
    assert.equal(await page.getByText('Workflow BIM aislado. No modifica solicitudes ni documentos de GiProy Clasico.').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'Sin overflow horizontal');
    assert.deepEqual(errors, [], `Sin errores de consola: ${errors.join(' | ')}`);
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-cde-rfi-1920x1080.png`, fullPage: true });
    await context.close(); console.log('validate-bim-cde-rfi-dom: ok');
} finally { await browser?.close(); cleanup(); }
