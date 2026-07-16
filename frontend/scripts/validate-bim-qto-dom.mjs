import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4241;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(
    process.platform === 'win32' ? 'cmd.exe' : 'npm',
    process.platform === 'win32'
        ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)]
        : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
);
let output = '';
vite.stdout?.on('data', (chunk) => { output += chunk.toString(); });
vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });

const cleanup = () => {
    if (vite.killed) return;
    if (process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
    else vite.kill();
};
const waitForServer = async () => {
    const deadline = Date.now() + 40000;
    while (Date.now() < deadline) {
        try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`Vite no respondio. ${output}`);
};

let browser;
try {
    await waitForServer();
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, screen: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
    await page.goto(`${baseUrl}/bim-qto-harness.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-bim-qto]');
    await page.getByLabel('Codigo WBS latente').fill('WBS-03.01');
    await page.getByLabel('Codigo de coste latente').fill('COST-MURO');
    await page.getByRole('button', { name: 'Generar' }).click();
    await page.waitForSelector('[data-bim-qto] tbody tr');
    assert.equal(await page.getByText('100%', { exact: true }).count(), 2, 'Cobertura de cantidades y codigos completa');
    const codesCell = await page.locator('[data-bim-qto] tbody td').nth(2).textContent();
    assert.ok(codesCell.includes('WBS-03.01'), 'WBS trazable en el takeoff');
    assert.ok(codesCell.includes('COST-MURO'), 'Codigo de coste trazable en el takeoff');
    await page.getByLabel('Motivo de decision QTO').fill('Validado por coordinacion BIM');
    await page.getByRole('button', { name: 'Aprobar QTO' }).click();
    await page.getByRole('button', { name: 'Verificar paquete 5D' }).click();
    await page.waitForSelector('[data-bim-qto-package]');
    assert.ok((await page.locator('[data-bim-qto-package]').textContent()).startsWith('qto-'), 'Paquete 5D conserva checksum QTO');
    await page.getByRole('tab', { name: 'Elemento' }).click();
    await page.waitForSelector('[data-bim-element-quantity]');
    assert.equal(await page.getByText('12.5 m3', { exact: true }).count(), 1, 'Flujo de cantidad por elemento preservado');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'Sin overflow horizontal');
    assert.deepEqual(errors, [], `Sin errores de consola: ${errors.join(' | ')}`);
    await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-qto-1920x1080.png`, fullPage: true });
    await context.close();
    console.log('validate-bim-qto-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
