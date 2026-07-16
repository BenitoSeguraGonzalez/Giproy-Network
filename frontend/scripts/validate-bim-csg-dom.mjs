import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4234;
const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn(
    'cmd.exe',
    ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
);
let output = '';
vite.stdout.on('data', (chunk) => { output += chunk; });
vite.stderr.on('data', (chunk) => { output += chunk; });
const cleanup = () => {
    if (!vite.killed && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
};
const waitForVite = async () => {
    const deadline = Date.now() + 40000;
    while (Date.now() < deadline) {
        try {
            if ((await fetch(baseUrl)).ok) return;
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(output);
};

try {
    await waitForVite();
    const browser = await chromium.launch({
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });
    for (const viewport of [{ width: 1280, height: 820 }, { width: 390, height: 844 }]) {
        const page = await browser.newPage({ viewport });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        let postedPayload = null;
        const checksum = 'c'.repeat(64);
        await page.route('**/bim/projects/91/4d/partition-specs/11/csg-artifacts**', async (route) => {
            if (route.request().method() === 'POST') {
                postedPayload = route.request().postDataJSON();
                return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...postedPayload, id: 31, partition_spec_id: 11, project_id: 91, company_id: 7, version_id: 3, element_id: 701, checksum_sha256: checksum, partition_volume: postedPayload.source_mesh.volume, created_by: 1, created_at: '2026-07-13T12:00:00Z' }) });
            }
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ ...postedPayload, id: 31, partition_spec_id: 11, project_id: 91, company_id: 7, version_id: 3, element_id: 701, checksum_sha256: checksum, partition_volume: postedPayload?.source_mesh?.volume || 0, created_by: 1, created_at: '2026-07-13T12:00:00Z' }]) });
        });
        await page.goto(`${baseUrl}/bim-csg-harness.html`);
        const root = page.locator('[data-bim-csg-ready="true"]');
        try {
            await root.waitFor({ timeout: 20000 });
        } catch {
            throw new Error(`Harness CSG no listo. pageerrors=${errors.join(' | ')} body=${await page.locator('body').innerText()}`);
        }

        assert.equal(await root.getAttribute('data-bim-csg-method'), 'exact_bvh_csg_v1');
        const sourceVolume = Number(await root.getAttribute('data-bim-csg-source-volume'));
        const partitionVolume = Number(await root.getAttribute('data-bim-csg-partition-volume'));
        const delta = Number(await root.getAttribute('data-bim-csg-conservation-delta'));
        const sourceTriangles = Number(await root.getAttribute('data-bim-csg-source-triangles'));
        const segmentTriangles = Number(await root.getAttribute('data-bim-csg-segment-triangles'));
        assert.ok(sourceVolume > 10 && sourceVolume < 11, 'La sustraccion debe reducir el volumen del muro perforado');
        assert.ok(partitionVolume > 10 && partitionVolume < 11, 'Las particiones deben conservar el volumen constructivo');
        assert.ok(delta < 0.00001, `El delta volumetrico debe ser despreciable: ${delta}`);
        assert.ok(sourceTriangles > 12, 'La fuente CSG no puede ser una caja sin operar');
        assert.ok(segmentTriangles > sourceTriangles, 'Las particiones deben contener triangulacion CSG nueva');

        const segmentVolumes = (await page.locator('[data-bim-csg-segments]').getAttribute('data-bim-csg-segments'))
            .split(',')
            .map(Number);
        assert.equal(segmentVolumes.length, 2);
        assert.ok(segmentVolumes.every((value) => value > 4.5));
        await page.getByRole('button', { name: 'Persistir CSG' }).click();
        await page.locator('[data-bim-csg-roundtrip="verified"]').waitFor();
        assert.equal(await root.getAttribute('data-bim-csg-persisted'), 'true');
        assert.equal(await root.getAttribute('data-bim-csg-checksum'), checksum);
        assert.equal(postedPayload.contract_version, 'giproy_bim_4d_csg_artifact_v1');
        assert.equal(postedPayload.geometry_method, 'exact_bvh_csg_v1');
        assert.equal(postedPayload.segments.length, 2);
        assert.ok(postedPayload.source_mesh.positions.length > 24);
        assert.ok(postedPayload.source_mesh.indices.length > 36);

        const canvasRegion = page.locator('[data-bim-csg-canvas="webgl"]');
        const canvas = canvasRegion.locator('canvas');
        await canvas.waitFor();
        const regionBox = await canvasRegion.boundingBox();
        const box = await canvas.boundingBox();
        assert.ok(box.width >= 360, `Canvas demasiado estrecho: ${box.width}`);
        assert.ok(regionBox.height >= 280 && regionBox.height <= 422, `Region canvas fuera de rango: ${regionBox.height}`);
        assert.ok(box.height >= 278 && box.height <= 420, `Altura canvas fuera de rango: ${box.height}`);
        const screenshot = await canvas.screenshot();
        assert.ok(new Set(screenshot).size > 32, 'El canvas WebGL no debe quedar uniforme o vacio');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
        assert.deepEqual(errors, []);
        await page.close();
    }
    await browser.close();
    console.log('validate-bim-csg-dom: ok');
} finally {
    cleanup();
}
