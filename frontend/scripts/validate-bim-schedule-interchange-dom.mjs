import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4243;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)] : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout?.on('data', (chunk) => { output += chunk.toString(); });
vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });
const cleanup = () => { if (!vite.killed && process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); else if (!vite.killed) vite.kill(); };
const waitForServer = async () => { const deadline = Date.now() + 40000; while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ } await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(`Vite no respondio. ${output}`); };

let browser;
try {
    await waitForServer();
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
    await page.goto(`${baseUrl}/bim-schedule-interchange-harness.html`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Archivo de planificacion XML').setInputFiles({ name: 'gantt-r3.xml', mimeType: 'application/xml', buffer: Buffer.from('<Project />') });
    await page.getByRole('button', { name: 'Analizar XML' }).click();
    await page.waitForSelector('[data-bim-schedule-preview="valid"]');
    assert.equal(await page.getByText('Notas enriquecidas no representables.').count(), 1, 'Las perdidas se muestran antes de persistir');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar XML' }).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'giproy-bim-schedule.xml', 'La exportacion usa nombre MSPDI estable');
    await page.getByRole('button', { name: 'Guardar revision BIM' }).click();
    await page.waitForSelector('[data-bim-schedule-revision="pending"]');
    assert.equal(await page.getByText('REV 003', { exact: true }).count(), 1, 'La revision BIM queda trazable');
    await page.getByLabel('Motivo de decision de planificacion').fill('Revision R3 verificada por planificacion');
    await page.getByRole('button', { name: 'Aprobar', exact: true }).click();
    await page.waitForSelector('[data-bim-schedule-revision="approved"]');
    assert.equal(await page.getByText('Las revisiones se conservan en BIM y no modifican el cronograma clasico.').count(), 1, 'La frontera clasica es explicita');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'Sin overflow horizontal');
    assert.deepEqual(errors, [], `Sin errores de consola: ${errors.join(' | ')}`);
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-schedule-interchange-1920x1080.png`, fullPage: true });
    await context.close();
    console.log('validate-bim-schedule-interchange-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
