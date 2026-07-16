import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4222;
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
    browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    });
    for (const viewport of [{ name: 'desktop', width: 1280, height: 820 }, { name: 'mobile', width: 390, height: 844 }]) {
        const page = await browser.newPage({ viewport });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text()); });
        await page.goto(`${baseUrl}/bim-element-explorer-harness.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('[data-bim-element-explorer]');
        assert.ok((await page.locator('[data-bim-element-explorer]').innerText()).includes('1005'), `${viewport.name}: total completo`);

        await page.getByRole('button', { name: 'Página siguiente' }).click();
        assert.ok((await page.locator('[data-bim-element-explorer]').innerText()).includes('101-200 de 1005'), `${viewport.name}: paginación`);
        const search = page.getByRole('searchbox', { name: 'Buscar elementos BIM' });
        await search.fill('PROP-0999');
        await page.waitForTimeout(300);
        assert.ok((await page.locator('[data-bim-element-explorer]').innerText()).includes('1-1 de 1'), `${viewport.name}: búsqueda en propiedades`);
        await page.getByRole('button', { name: /Elemento 0999/ }).click();
        assert.equal(await page.locator('[data-bim-element-explorer-harness]').getAttribute('data-selected-guid'), 'HARNESS-0999');

        await search.fill('HARNESS-0004');
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: 'Vista de tabla' }).click();
        const row = page.getByRole('row', { name: /Elemento 0004/ });
        await row.focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('[data-bim-element-explorer-harness]').getAttribute('data-selected-guid'), 'HARNESS-0004');

        const state = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
        assert.equal(errors.length, 0, `${viewport.name}: sin errores: ${errors.join(' | ')}`);
        assert.equal(state.overflow, false, `${viewport.name}: sin overflow horizontal`);
        await page.screenshot({ path: `${process.env.TEMP || '.'}/giproy-bim-explorer-${viewport.name}.png`, fullPage: true });
        await page.close();
    }
    console.log('validate-bim-element-explorer-dom: ok');
} finally {
    await browser?.close();
    cleanup();
}
