import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4232; const baseUrl = `http://127.0.0.1:${port}`;
const vite = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = ''; vite.stdout.on('data', (chunk) => { output += chunk; }); vite.stderr.on('data', (chunk) => { output += chunk; });
const cleanup = () => { if (!vite.killed && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); };
const wait = async () => { const deadline = Date.now() + 40000; while (Date.now() < deadline) { try { if ((await fetch(baseUrl)).ok) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error(output); };
const equipment = [{ id: 1, code: 'EQ-01', name: 'Grúa', equipment_type: 'crane', dimensions: { x: 3, y: 8, z: 3 } }];
const activities = [{ id: 2, activity_code: 'A1', activity_name: 'Izaje' }];
const plans = [{ id: 3, equipment_id: 1, activity_snapshot_id: 2, revision: 'R1', path: [{ x: 0, y: 0, z: 0, offset_seconds: 0 }, { x: 10, y: 0, z: 0, offset_seconds: 100 }], operation_radius: 2, temporary_geometry: 'box', duration_seconds: 100 }];
try {
    await wait(); const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
    for (const viewport of [{ width: 1280, height: 820 }, { width: 390, height: 844 }]) {
        const page = await browser.newPage({ viewport }); const errors = []; page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/bim/projects/91/4d/**', async (route) => { const url = new URL(route.request().url()); let body = [];
            if (url.pathname.endsWith('/equipment')) body = equipment;
            else if (url.pathname.endsWith('/activities')) body = activities;
            else if (url.pathname.endsWith('/equipment-motion')) body = plans;
            else if (url.pathname.endsWith('/playback')) { const percent = Number(url.searchParams.get('percent') || 0); body = { motion_plan_id: 3, percent, offset_seconds: percent, position: { x: percent / 10, y: 0, z: 0 }, operation_radius: 2, temporary_geometry: 'box' }; }
            else if (url.pathname.endsWith('/conflicts')) body = [{ motion_plan_id: 3, conflicting_motion_plan_id: 4, temporal_overlap_seconds: 100, minimum_path_distance: 0, operation_radius_sum: 4 }];
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }); });
        await page.goto(`${baseUrl}/bim-equipment-motion-harness.html`); const canvas = page.locator('[data-bim-equipment-motion-canvas="webgl"] canvas'); await canvas.waitFor({ timeout: 15000 });
        const box = await canvas.boundingBox(); assert.ok(box.width > 220 && box.height === 190); assert.ok(new Set(await canvas.screenshot()).size > 32);
        await page.locator('input[type="range"]').fill('50'); await page.locator('[data-bim-equipment-playback="50"]').waitFor();
        assert.match(await page.locator('[data-bim-equipment-playback="50"]').textContent(), /50%.*50\.0s.*1 conflictos/);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true); assert.deepEqual(errors, []); await page.close();
    }
    await browser.close(); console.log('validate-bim-equipment-motion-dom: ok');
} finally { cleanup(); }
