import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4231; const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = ''; vite.stdout.on('data', (chunk) => { output += chunk; }); vite.stderr.on('data', (chunk) => { output += chunk; });
const cleanup = () => { if (!vite.killed && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); };
const wait = async () => { const deadline = Date.now() + 40000; while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(output); };
const spec = { id: 11, project_id: 91, company_id: 7, version_id: 3, element_id: 701, global_id: 'GUID-PARTITION-HARNESS', revision: 'P1', axis: 'x', segment_count: 3, gap_ratio: 0.04, status: 'preview', materialized: false, preview_bounds: { width: 6, height: 3, depth: 0.3 }, created_by: 1, created_at: '2026-07-12T12:00:00Z' };
const artifact = { contract_version: 'giproy_bim_4d_partition_artifact_v1', id: 21, partition_spec_id: 11, project_id: 91, company_id: 7, version_id: 3, element_id: 701, source_global_id: 'GUID-PARTITION-HARNESS', geometry_method: 'bounding_box_v1', exact_ifc_csg: false, checksum_sha256: 'a'.repeat(64), segments: [{ index: 1, source_global_id: 'GUID-PARTITION-HARNESS', min: { x: -3, y: -1.5, z: -0.15 }, max: { x: -1.08, y: 1.5, z: 0.15 }, volume: 1.728, surface_area: 15.192 }, { index: 2, source_global_id: 'GUID-PARTITION-HARNESS', min: { x: -0.96, y: -1.5, z: -0.15 }, max: { x: 0.96, y: 1.5, z: 0.15 }, volume: 1.728, surface_area: 15.192 }, { index: 3, source_global_id: 'GUID-PARTITION-HARNESS', min: { x: 1.08, y: -1.5, z: -0.15 }, max: { x: 3, y: 1.5, z: 0.15 }, volume: 1.728, surface_area: 15.192 }], total_volume: 5.184, total_surface_area: 45.576, created_by: 1, created_at: '2026-07-12T12:10:00Z' };
try {
    await wait(); const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
    for (const viewport of [{ width: 1280, height: 820 }, { width: 390, height: 844 }]) {
        spec.materialized = false; spec.status = 'preview';
        const page = await browser.newPage({ viewport }); const errors = []; page.on('pageerror', (error) => errors.push(error.message));
        let materialized = false;
        await page.route('**/bim/projects/91/4d/partition-specs**', async (route) => {
            const request = route.request(); const pathname = new URL(request.url()).pathname;
            if (pathname.endsWith('/csg-artifacts')) return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            if (pathname.endsWith('/materialize') && request.method() === 'POST') { materialized = true; spec.materialized = true; spec.status = 'materialized'; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(artifact) }); }
            if (pathname.endsWith('/artifact')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(artifact) });
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([spec]) });
        });
        await page.goto(`${baseUrl}/bim-partition-harness.html`); const canvas = page.locator('[data-bim-partition-preview="webgl"] canvas'); await canvas.waitFor({ timeout: 15000 });
        const box = await canvas.boundingBox(); assert.ok(box.width > 200 && box.height === 180);
        const shot = await canvas.screenshot(); assert.ok(new Set(shot).size > 32, 'La captura WebGL no debe ser uniforme');
        assert.equal(await page.locator('[data-bim-partition-materialized="false"]').textContent(), 'Preview no materializado · fuente IFC intacta');
        await page.getByRole('button', { name: 'Materializar' }).click();
        await page.locator('[data-bim-partition-materialized="true"]').waitFor();
        assert.equal(materialized, true);
        assert.equal(await page.locator('[data-bim-partition-preview]').getAttribute('data-bim-partition-artifact'), 'rendered');
        assert.equal(await page.locator('[data-bim-partition-geometry-method]').getAttribute('data-bim-partition-geometry-method'), 'bounding_box_v1');
        assert.match(await page.locator('[data-bim-partition-materialized="true"]').textContent(), /5\.184 m³/);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
        assert.deepEqual(errors, []); await page.close();
    }
    await browser.close(); console.log('validate-bim-partition-dom: ok');
} finally { cleanup(); }
