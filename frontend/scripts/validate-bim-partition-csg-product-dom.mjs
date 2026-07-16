import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const boxMesh = (minX, maxX) => ({
    positions: [
        minX, -1, -1, maxX, -1, -1, maxX, 1, -1, minX, 1, -1,
        minX, -1, 1, maxX, -1, 1, maxX, 1, 1, minX, 1, 1,
    ],
    normals: [],
    indices: [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5],
    volume: (maxX - minX) * 4,
    triangle_count: 12,
});

const port = 4236;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
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

const spec = { id: 11, project_id: 91, company_id: 7, version_id: 3, element_id: 701, global_id: 'GUID-CSG-PRODUCT', revision: 'P2', axis: 'x', segment_count: 2, gap_ratio: 0.04, status: 'preview', materialized: false, preview_bounds: { width: 6, height: 3, depth: 0.3 }, created_by: 1, created_at: '2026-07-13T15:00:00Z' };
const csgArtifact = {
    contract_version: 'giproy_bim_4d_csg_artifact_v1', artifact_revision: 'CSG-P2', source_global_id: 'GUID-CSG-PRODUCT', geometry_method: 'exact_bvh_csg_v1',
    source_mesh: boxMesh(-2, 2), segments: [{ index: 1, mesh: boxMesh(-2, 0) }, { index: 2, mesh: boxMesh(0, 2) }], conservation_delta: 0,
    id: 42, partition_spec_id: 11, project_id: 91, company_id: 7, version_id: 3, element_id: 701, checksum_sha256: 'c'.repeat(64), partition_volume: 16, created_by: 1, created_at: '2026-07-13T15:10:00Z',
};

try {
    await waitForVite();
    const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
    for (const viewport of [{ width: 1280, height: 820 }, { width: 390, height: 844 }]) {
        const page = await browser.newPage({ viewport });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/bim/projects/91/4d/partition-specs**', (route) => {
            const pathname = new URL(route.request().url()).pathname;
            if (pathname.endsWith('/csg-artifacts')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([csgArtifact]) });
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([spec]) });
        });
        await page.goto(`${baseUrl}/bim-partition-harness.html`);
        const exact = page.locator('[data-bim-partition-csg="exact"]');
        await exact.waitFor({ timeout: 15000 });
        assert.match(await exact.textContent(), /CSG exacto/);
        assert.match(await exact.textContent(), /16\.000 m³/);
        const method = page.locator('[data-bim-partition-geometry-method="exact_bvh_csg_v1"]');
        assert.match(await method.textContent(), /CSG-P2/);
        assert.match(await method.textContent(), /cccccccccccc/);
        const preview = page.locator('[data-bim-partition-artifact="csg-exact"]');
        const canvas = preview.locator('canvas');
        await canvas.waitFor();
        const box = await canvas.boundingBox();
        assert.ok(box.width > 200 && box.height === 180);
        const screenshot = await canvas.screenshot();
        assert.ok(new Set(screenshot).size > 32, 'El artefacto CSG persistido no debe renderizar un canvas uniforme');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
        assert.deepEqual(errors, []);
        await page.close();
    }
    await browser.close();
    console.log('validate-bim-partition-csg-product-dom: ok');
} finally {
    cleanup();
}
