import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { IfcImporter } from '@thatopen/fragments';

const frontendDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const repositoryDir = path.resolve(frontendDir, '..');
const sourcePath = path.join(repositoryDir, 'backend', 'app', 'tests', 'fixtures', 'bim', 'real', 'buildingsmart-pcert', 'Building-Architecture.ifc');
const importer = new IfcImporter();
importer.wasm = { path: `${path.join(frontendDir, 'node_modules', 'web-ifc')}${path.sep}`, absolute: true };
importer.includeUniqueAttributes = true;
const fragmentBytes = await importer.process({ bytes: new Uint8Array(await readFile(sourcePath)), raw: false });
assert.ok(fragmentBytes.byteLength > 0);

const port = 4235;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: frontendDir, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = '';
vite.stdout.on('data', (chunk) => { output += chunk; });
vite.stderr.on('data', (chunk) => { output += chunk; });
const cleanup = () => { if (!vite.killed && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); };
const waitForVite = async () => {
    const deadline = Date.now() + 40000;
    while (Date.now() < deadline) {
        try { if ((await fetch(baseUrl)).ok) return; } catch {}
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(output);
};

try {
    await waitForVite();
    const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
    let evidence = null;
    for (const viewport of [{ width: 1280, height: 820 }, { width: 390, height: 844 }]) {
        const page = await browser.newPage({ viewport });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/bim-real-csg.frag', (route) => route.fulfill({ status: 200, contentType: 'application/octet-stream', body: Buffer.from(fragmentBytes) }));
        let postedPayload = null;
        const checksum = 'f'.repeat(64);
        await page.route('**/bim/projects/91/4d/partition-specs/11/csg-artifacts**', async (route) => {
            if (route.request().method() === 'POST') {
                postedPayload = route.request().postDataJSON();
                return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...postedPayload, id: 41, partition_spec_id: 11, project_id: 91, company_id: 7, version_id: 3, element_id: 701, checksum_sha256: checksum, partition_volume: postedPayload.source_mesh.volume, created_by: 1, created_at: '2026-07-13T14:00:00Z' }) });
            }
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ ...postedPayload, id: 41, partition_spec_id: 11, project_id: 91, company_id: 7, version_id: 3, element_id: 701, checksum_sha256: checksum, partition_volume: postedPayload.source_mesh.volume, created_by: 1, created_at: '2026-07-13T14:00:00Z' }]) });
        });
        await page.goto(`${baseUrl}/bim-fragments-csg-harness.html`);
        const root = page.locator('[data-bim-fragments-csg-ready="true"]');
        try {
            await root.waitFor({ timeout: 40000 });
        } catch {
            throw new Error(`Fragments CSG no listo. errors=${errors.join(' | ')} body=${await page.locator('body').innerText()}`);
        }
        assert.equal(Number(await root.getAttribute('data-bim-fragments-csg-bytes')), fragmentBytes.byteLength);
        assert.ok(await root.getAttribute('data-bim-fragments-csg-local-id'));
        assert.ok(await root.getAttribute('data-bim-fragments-csg-global-id'));
        const sourceVolume = Number(await root.getAttribute('data-bim-fragments-csg-source-volume'));
        const partitionVolume = Number(await root.getAttribute('data-bim-fragments-csg-partition-volume'));
        const delta = Number(await root.getAttribute('data-bim-fragments-csg-delta'));
        assert.ok(sourceVolume > 0 && partitionVolume > 0);
        assert.ok(delta <= Math.max(0.00001, sourceVolume * 0.0001));
        evidence ??= {
            fragment_bytes: fragmentBytes.byteLength,
            local_id: Number(await root.getAttribute('data-bim-fragments-csg-local-id')),
            global_id: await root.getAttribute('data-bim-fragments-csg-global-id'),
            source_volume: sourceVolume,
            partition_volume: partitionVolume,
            conservation_delta: delta,
        };
        const canvas = page.locator('[data-bim-fragments-csg-canvas="webgl"] canvas');
        await canvas.waitFor();
        const screenshot = await canvas.screenshot();
        assert.ok(new Set(screenshot).size > 32, 'El canvas Fragments CSG no debe quedar vacío');
        await page.getByRole('button', { name: 'Persistir artefacto' }).click();
        await page.locator('[data-bim-fragments-csg-roundtrip="verified"]').waitFor();
        assert.equal(await root.getAttribute('data-bim-fragments-csg-persisted'), 'true');
        assert.equal(postedPayload.source_global_id, await root.getAttribute('data-bim-fragments-csg-global-id'));
        assert.equal(postedPayload.segments.length, 2);
        assert.ok(postedPayload.source_mesh.positions.length > 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
        assert.deepEqual(errors, []);
        await page.close();
    }
    await browser.close();
    console.log(JSON.stringify(evidence));
    console.log('validate-bim-fragments-csg-dom: ok');
} finally {
    cleanup();
}
