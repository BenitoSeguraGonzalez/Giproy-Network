import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4234;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout.on('data', (chunk) => { output += chunk; });
vite.stderr.on('data', (chunk) => { output += chunk; });
const cleanup = () => { if (!vite.killed && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); };
const waitForServer = async () => {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
        try { if ((await fetch(baseUrl)).ok) return; } catch { /* starting */ }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(output);
};

try {
    await waitForServer();
    const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
    try {
        for (const viewport of [{ width: 1280, height: 820 }, { width: 390, height: 844 }]) {
            const page = await browser.newPage({ viewport });
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            await page.goto(`${baseUrl}/bim-field-harness.html`);
            await page.locator('[data-bim-field-editor] summary').click();
            await page.getByLabel('Avance de campo porcentual').fill('50');
            await page.getByLabel('Cantidad instalada en campo').fill('10');
            await page.getByLabel('Horas de mano de obra').fill('32');
            await page.getByLabel('BAC de campo').fill('1000');
            await page.getByLabel('PV de campo').fill('600');
            await page.getByLabel('AC de campo', { exact: true }).fill('450');
            await page.getByLabel('Diario de campo BIM').fill('Montaje verificado en el frente norte.');
            await page.getByLabel('Evidencia fotográfica de campo').setInputFiles({ name: 'avance-frente.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex') });
            await page.getByRole('button', { name: 'Registrar campo' }).click();
            const latest = page.locator('[data-bim-field-latest="141"]');
            await latest.waitFor();
            assert.match(await latest.textContent(), /50%.*500.*0\.8333.*1\.1111/s);
            await page.getByRole('button', { name: 'Abrir evidencia avance-frente.png' }).waitFor();
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally { await browser.close(); }
    console.log('validate-bim-field-dom: ok');
} finally { cleanup(); }
