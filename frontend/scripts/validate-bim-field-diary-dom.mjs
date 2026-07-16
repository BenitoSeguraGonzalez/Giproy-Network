import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4253;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)] : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = ''; vite.stdout?.on('data', (chunk) => { output += chunk.toString(); }); vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });
const cleanup = () => { if (!vite.killed && process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); else if (!vite.killed) vite.kill(); };
const waitForServer = async () => { const deadline = Date.now() + 40000; while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ } await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(`Vite no respondio. ${output}`); };

let browser;
try {
    await waitForServer(); browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 1920, height: 900, label: '1920x900' }, { width: 2560, height: 1300, label: '2560x1300' }]) {
        const context = await browser.newContext({ viewport }); const page = await context.newPage(); const errors = [];
        page.on('pageerror', (error) => errors.push(error.message)); page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
        await page.goto(`${baseUrl}/bim-field-diary-harness.html`, { waitUntil: 'domcontentloaded' }); const panel = page.locator('[data-bim-field-diary]'); await panel.waitFor();
        assert.equal(await page.locator('[data-bim-field-diary-days] > button').count(), 3, `Tres jornadas en ${viewport.label}`);
        assert.equal(await page.locator('[data-bim-field-diary-reports] > button').count(), 2, `Dos partes en la jornada activa en ${viewport.label}`);
        await page.locator('[data-bim-field-diary-evidence] img').waitFor();
        const box = await panel.boundingBox(); assert.ok(box && box.width >= viewport.width - 50 && box.height >= viewport.height - 50, `Diario fluido en ${viewport.label}`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, `Sin overflow horizontal en ${viewport.label}`);
        if (viewport.width === 1920) {
            await page.getByLabel('Filtrar frente del diario').selectOption('22');
            assert.equal(await page.locator('[data-bim-field-diary-days] > button').count(), 2, 'Filtro por frente operativo');
            await page.getByLabel('Filtrar frente del diario').selectOption('all');
            await page.getByPlaceholder('Buscar observación, actividad o frente').fill('recubrimiento');
            assert.equal(await page.locator('[data-bim-field-diary-days] > button').count(), 1, 'Busqueda de observacion operativa');
            await page.getByRole('button', { name: 'Abrir evidencia muro-eje-4.png' }).click();
            assert.equal(await page.locator('[data-bim-field-diary-opened]').textContent(), '501', 'Evidencia del diario operativa');
        }
        assert.deepEqual(errors, [], `Sin errores de consola en ${viewport.label}: ${errors.join(' | ')}`);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-field-diary-${viewport.label}.png`, fullPage: true }); await context.close();
    }
    console.log('validate-bim-field-diary-dom: ok');
} finally { await browser?.close(); cleanup(); }
