import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4261;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)] : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout?.on('data', (chunk) => { output += chunk; });
vite.stderr?.on('data', (chunk) => { output += chunk; });
const cleanup = () => { if (!vite.killed && process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); else if (!vite.killed) vite.kill(); };
const waitForVite = async () => { const deadline = Date.now() + 40000; while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(output); };
let browser;
try {
    await waitForVite();
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 1920, height: 1080, label: '1920x1080' }, { width: 2560, height: 1440, label: '2560x1440' }]) {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
        await page.goto(`${baseUrl}/bim-coordination-control-harness.html`, { waitUntil: 'domcontentloaded' });
        await page.locator('[data-bim-coordination-control]').waitFor();
        assert.equal(await page.getByRole('heading', { name: 'Fuentes de referencia' }).count(), 1);
        assert.equal(await page.getByRole('heading', { name: 'Selección compartida' }).count(), 1);
        assert.equal(await page.getByRole('heading', { name: 'Bandeja de decisiones' }).count(), 1);
        assert.equal(await page.getByRole('heading', { name: 'Preparación para oficializar' }).count(), 1);
        assert.equal(await page.getByText('OmniClass activado · coordinación incompleta').count(), 1);
        assert.equal(await page.getByText('201 partida(s) carecen de clasificación común y requieren revisión humana.').count(), 1);
        assert.equal(await page.getByText('Entidades sin vínculo coordinado').count(), 1);
        assert.equal(await page.locator('[data-coordination-shared-context]').count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
        const regions = await page.locator('[data-bim-coordination-control] > div:last-child > *').count();
        assert.equal(regions, 3, 'La mesa coordinada debe conservar exactamente tres zonas operativas');
        assert.deepEqual(errors, []);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-coordination-${viewport.label}.png`, fullPage: true });
        await context.close();
    }
    console.log('validate-bim-coordination-control-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
