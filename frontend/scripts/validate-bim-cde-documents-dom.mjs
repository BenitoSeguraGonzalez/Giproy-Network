import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4244;
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
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', (error) => errors.push(error.message)); page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
    await page.goto(`${baseUrl}/bim-cde-documents-harness.html`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Nueva revisión' }).click();
    await page.getByLabel('Codigo documental CDE').fill('ARQ-001'); await page.getByLabel('Titulo documental CDE').fill('Planta arquitectura');
    await page.getByLabel('Archivo documental CDE').setInputFiles({ name: 'planta-p01.pdf', mimeType: 'application/pdf', buffer: Buffer.from('p01') });
    await page.getByRole('button', { name: /Registrar revisi.n/ }).click(); await page.waitForSelector('[data-bim-cde-revision="current"]');
    await page.getByRole('button', { name: 'Nueva revisión' }).click();
    await page.getByLabel('Version documental CDE').fill('C01'); await page.getByLabel('Archivo documental CDE').setInputFiles({ name: 'planta-c01.pdf', mimeType: 'application/pdf', buffer: Buffer.from('c01') });
    await page.getByRole('button', { name: /Registrar revisi.n/ }).click(); await page.waitForSelector('[data-bim-cde-revision="superseded"]');
    assert.equal(await page.locator('[data-bim-cde-revision="current"]').count(), 1, 'Solo existe una revision vigente');
    assert.equal(await page.locator('[data-bim-cde-revision="superseded"]').count(), 1, 'El historial conserva la revision anterior');
    const downloadPromise = page.waitForEvent('download'); await page.getByLabel('Descargar revision 2').click(); assert.equal((await downloadPromise).suggestedFilename(), 'planta-c01.pdf');
    await page.getByLabel('Motivo de archivo CDE').fill('Documento reemplazado por emision contractual'); await page.getByRole('button', { name: 'Archivar' }).click();
    await page.waitForFunction(() => document.querySelector('[aria-label="Documento CDE seleccionado"]')?.value === '');
    assert.equal(await page.getByText('Repositorio BIM aislado. No modifica Documentos de Proyecto clasico.').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'Sin overflow horizontal');
    assert.deepEqual(errors, [], `Sin errores de consola: ${errors.join(' | ')}`);
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-cde-documents-1920x1080.png`, fullPage: true });
    await context.close(); console.log('validate-bim-cde-documents-dom: ok');
} finally { await browser?.close(); cleanup(); }
