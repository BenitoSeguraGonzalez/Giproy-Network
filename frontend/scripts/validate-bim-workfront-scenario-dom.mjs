import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4232;
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
            await page.goto(`${baseUrl}/bim-workfront-scenario-harness.html`);
            await page.locator('[data-bim-work-area-editor] summary').click();
            await page.getByLabel('Código de frente BIM').fill('F-01');
            await page.getByLabel('Nombre de frente BIM').fill('Frente norte');
            await page.getByLabel('Guardar frente BIM').click();
            await page.locator('[data-bim-component-editor] summary').click();
            await page.getByLabel('Código de componente BIM').fill('CC-01');
            await page.getByLabel('Nombre de componente BIM').fill('Muro construible');
            await page.getByLabel('Guardar componente construible').click();
            await page.getByLabel('Enfocar componente CC-01').click();
            await page.waitForSelector('[data-focused-guid="GUID-FRONT-001"]');
            await page.locator('[data-bim-scenario-editor] summary').click();
            await page.getByLabel('Nombre de escenario 4D').fill('Adelantar inspección');
            await page.getByLabel('Revisión de escenario 4D').fill('WF-01');
            await page.getByLabel('Desplazamiento del escenario en días').fill('-2');
            await page.getByRole('button', { name: 'Calcular escenario' }).click();
            await page.waitForSelector('[data-bim-scenario-result="121"]');
            assert.equal(await page.locator('[data-bim-scenario-result="121"]').getByText('1', { exact: true }).count(), 1);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally { await browser.close(); }
    console.log('validate-bim-workfront-scenario-dom: ok');
} finally { cleanup(); }
