import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4252;
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
    for (const viewport of [{ width: 1920, height: 900, label: '1920x900' }, { width: 2560, height: 1300, label: '2560x1300' }]) {
        const context = await browser.newContext({ viewport }); const page = await context.newPage(); const errors = [];
        page.on('pageerror', (error) => errors.push(error.message)); page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
        await page.goto(`${baseUrl}/bim-field-issues-harness.html`, { waitUntil: 'domcontentloaded' });
        const panel = page.locator('[data-bim-field-issues]'); await panel.waitFor();
        assert.equal(await page.locator('[data-bim-field-issue-list] > button').count(), 2, `Dos incidencias activas en ${viewport.label}`);
        const box = await panel.boundingBox(); assert.ok(box && box.width >= viewport.width - 50 && box.height >= viewport.height - 50, `Panel fluido en ${viewport.label}`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, `Sin overflow horizontal en ${viewport.label}`);
        await page.locator('[data-bim-field-issue-attachments] img').first().waitFor();
        if (viewport.width === 1920) {
            await page.getByLabel('Agregar evidencia fotográfica').setInputFiles({ name: 'seguimiento.png', mimeType: 'image/png', buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]) });
            await page.locator('[data-bim-field-issue-attachments] p', { hasText: 'seguimiento.png' }).waitFor();
            assert.equal(await page.locator('[data-bim-field-issue-attachments] > button').count(), 2, 'Fotografía agregada a la incidencia');
            await page.getByLabel('Nueva observación de campo').fill('Revisión solicitada al calculista.'); await page.getByLabel('Guardar observación').click();
            await page.getByText('Revisión solicitada al calculista.').waitFor();
            await page.getByLabel('Estado de incidencia', { exact: true }).selectOption('in_review');
            await page.getByRole('button', { name: 'Nueva incidencia de campo' }).click(); await page.getByPlaceholder('Describe el hallazgo').fill('Anclaje pendiente en fachada'); await page.getByRole('button', { name: 'Crear incidencia', exact: true }).click();
            await page.getByText('Anclaje pendiente en fachada').first().waitFor();
        }
        assert.deepEqual(errors, [], `Sin errores de consola en ${viewport.label}: ${errors.join(' | ')}`);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-field-issues-${viewport.label}.png`, fullPage: true }); await context.close();
    }
    console.log('validate-bim-field-issues-dom: ok');
} finally { await browser?.close(); cleanup(); }
