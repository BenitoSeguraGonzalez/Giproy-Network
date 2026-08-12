import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4262;
const baseUrl = `http://127.0.0.1:${port}`;
const generator = await readFile(new URL('../../scripts/compliance/generate_release_evidence.py', import.meta.url), 'utf8');
const deploy = await readFile(new URL('../../deploy/scripts/giproy-beta-deploy.sh', import.meta.url), 'utf8');
assert.match(generator, /--public-output/, 'El generador debe aceptar publicación pública explícita');
for (const artifact of ['sbom.cyclonedx.json', 'THIRD_PARTY_NOTICES.md', 'release-manifest.json', 'CERTIFICADO_TECNICO.md']) {
    assert.match(generator, new RegExp(artifact.replace('.', '\\.'), 'g'), `El generador debe publicar ${artifact}`);
}
assert.match(deploy, /--public-output "frontend\/public\/legal\/release"/, 'El deploy debe incorporar evidencia al build del frontend');

const vite = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)] : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout?.on('data', (chunk) => { output += chunk.toString(); });
vite.stderr?.on('data', (chunk) => { output += chunk.toString(); });
const cleanup = () => { if (!vite.killed && process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); else if (!vite.killed) vite.kill(); };
const waitForServer = async () => { const deadline = Date.now() + 40000; while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ } await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(`Vite no respondió. ${output}`); };

const artifacts = Object.fromEntries(['sbom.cyclonedx.json', 'THIRD_PARTY_NOTICES.md', 'release-manifest.json', 'CERTIFICADO_TECNICO.md'].map((name, index) => [name, { url: `/legal/release/${name}`, sha256: String(index).repeat(64) }]));
let browser;
try {
    await waitForServer();
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/legal/release/public-release-manifest.json', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ schema: 'giproy-public-release-evidence-v1', release: { certification_status: 'REVIEW_REQUIRED' }, artifacts }) }));
        await page.goto(`${baseUrl}/legal/licencias`, { waitUntil: 'networkidle' });
        await page.getByRole('heading', { name: 'Evidencia del release' }).waitFor();
        assert.equal(await page.getByText('REVIEW_REQUIRED', { exact: true }).count(), 1, 'La UI debe mostrar el estado técnico sin afirmar certificación');
        const evidence = page.getByRole('list').filter({ has: page.getByRole('link', { name: /sbom\.cyclonedx\.json/i }) });
        assert.equal(await evidence.getByRole('link').count(), 4, 'La UI debe enlazar los cuatro artefactos de evidencia');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'La evidencia no debe generar overflow horizontal');
        assert.deepEqual(errors, [], `Sin errores de página: ${errors.join(' | ')}`);
        await context.close();
    }
    console.log('smoke-public-release-evidence: ok');
} finally {
    await browser?.close();
    cleanup();
}
