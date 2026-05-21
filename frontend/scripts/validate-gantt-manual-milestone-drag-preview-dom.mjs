import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';

const port = 4216;
const baseUrl = `http://127.0.0.1:${port}`;

const pythonCode = `
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path("backend").resolve()))
from app.core.database import SessionLocal
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto
from app.services.cronograma_trabajo import cronograma_trabajo_service

db = SessionLocal()
try:
    empresa = db.query(Empresa).filter(Empresa.nombre == "Santiago Bermeo").first()
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == 13, Presupuesto.empresa_id == empresa.id).first()
    schedule = db.query(CronogramaTrabajo).filter(
        CronogramaTrabajo.empresa_id == empresa.id,
        CronogramaTrabajo.presupuesto_id == presupuesto.id,
    ).first()
    trabajo = cronograma_trabajo_service._build_response(db, schedule).model_dump(mode="json")
    print(json.dumps({
        "empresa_id": empresa.id,
        "empresa_nombre": empresa.nombre,
        "project": {
            "id": presupuesto.proyecto_id,
            "fecha_inicio": (trabajo.get("config") or {}).get("fecha_inicio_proyecto"),
        },
        "detail": {
            "id": presupuesto.proyecto_id,
            "fecha_inicio": (trabajo.get("config") or {}).get("fecha_inicio_proyecto"),
        },
        "selectedBudget": {
            "id": presupuesto.id,
            "revision": presupuesto.revision,
        },
        "selectedBudgetDetail": {},
        "valorado": {"rows": [], "config": {}},
        "trabajo": trabajo,
    }, ensure_ascii=False))
finally:
    db.close()
`;

const fixtureRun = spawnSync('python', ['-c', pythonCode], {
  cwd: '..',
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 12,
});

if (fixtureRun.status !== 0) {
  throw new Error(`No se pudo obtener fixture real Santiago Bermeo: ${fixtureRun.error?.message || fixtureRun.stderr || fixtureRun.stdout}`);
}

const fixture = JSON.parse(fixtureRun.stdout);
const manualMilestones = fixture.trabajo?.config?.manual_milestones || [];
const realMilestone = manualMilestones.find((entry) => String(entry?.id || '').trim()) || null;
const milestone = realMilestone || {
  id: 'hm-dom-drag-preview',
  after_line_id: '49',
  display_after_line_id: '49',
  descripcion: 'Hito DOM drag preview',
  start_date: '2026-04-08T08:00:00',
};
const targetLineId = String(
  (milestone.successor_dependencies || [])[0]?.target_id
  ?? (milestone.successor_dependencies || [])[0]?.targetId
  ?? '49'
);

const routeDependency = {
  source_id: `manual-milestone:${milestone.id}`,
  target_id: Number(targetLineId),
  type: 'FS',
  lag_days: 0,
  lag_unit: 'day',
  lag_mode: 'duration',
  metadata: { manual_milestone_sequence: true },
};

const targetBefore = (fixture.trabajo?.rows || []).find((row) => String(row.budget_line_id ?? row.linea_id) === targetLineId);
if (!targetBefore) {
  throw new Error(`No existe la línea destino ${targetLineId} en el fixture real.`);
}

fixture.trabajo.config.manual_milestones = [
  ...manualMilestones.filter((entry) => String(entry?.id || '') !== String(milestone.id)),
  {
    ...milestone,
    after_line_id: targetLineId,
    display_after_line_id: targetLineId,
    start_date: realMilestone?.start_date || targetBefore.start_date || '2026-03-24T08:00:00',
    successor_dependencies: [routeDependency],
  },
];

const waitForServer = async (url, timeoutMs = 40000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Vite no respondio en ${url}`);
};

const vite = spawn(
  process.platform === 'win32' ? 'cmd.exe' : 'npm',
  process.platform === 'win32'
    ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)]
    : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)],
  { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
);

let viteOutput = '';
vite.stdout?.on('data', (chunk) => { viteOutput += chunk.toString(); });
vite.stderr?.on('data', (chunk) => { viteOutput += chunk.toString(); });

const cleanup = () => {
  if (!vite.killed) vite.kill();
};
process.on('exit', cleanup);

try {
  await waitForServer(baseUrl, 40000);
} catch (error) {
  cleanup();
  console.error(viteOutput.trim());
  throw error;
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.setDefaultTimeout(15000);

const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.route('**/gantt-ff-fixture.json', async (route) => {
  await route.fulfill({ json: fixture });
});

await page.goto(`${baseUrl}/gantt-ff-harness.html`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('text=187 PARTIDAS', { timeout: 30000 });

const dependencyKey = `manual-milestone:${milestone.id}-${targetLineId}`;
const barSelector = `[data-bar-id="manual-milestone:${milestone.id}"]`;
const targetBarSelector = `[data-bar-id="${targetLineId}"]`;

await page.waitForSelector(barSelector, { timeout: 30000 });
await page.waitForSelector(targetBarSelector, { timeout: 30000 });
await page.locator(barSelector).evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'center' }));
await page.waitForFunction((key) => (
  Array.from(document.querySelectorAll('[data-dependency-key]'))
    .some((element) => element.getAttribute('data-dependency-key') === key && element.querySelectorAll('path').length >= 2)
), dependencyKey, { timeout: 30000 });

const readRoute = async () => page.evaluate((key) => {
  const group = Array.from(document.querySelectorAll('[data-dependency-key]'))
    .find((element) => element.getAttribute('data-dependency-key') === key);
  const d = group?.querySelectorAll('path')?.[1]?.getAttribute('d') || '';
  const points = Array.from(String(d || '').matchAll(/([ML])\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g))
    .map((match) => ({ cmd: match[1], x: Number(match[2]), y: Number(match[3]) }));
  return {
    d,
    commandCount: d.match(/[ML]/g)?.length || 0,
    points,
  };
}, dependencyKey);

const beforeRoute = await readRoute();
const beforeBox = await page.locator(barSelector).boundingBox();
const beforeTargetBox = await page.locator(targetBarSelector).boundingBox();
if (!beforeBox) throw new Error(`No se pudo medir el hito ${milestone.id}`);
if (!beforeTargetBox) throw new Error(`No se pudo medir la línea destino ${targetLineId}`);
const horizontalDragPx = beforeBox.x > 1200 ? -220 : 220;

await page.mouse.move(beforeBox.x + beforeBox.width / 2, beforeBox.y + beforeBox.height / 2);
await page.mouse.down();
await page.mouse.move(beforeBox.x + beforeBox.width / 2 + horizontalDragPx, beforeBox.y + beforeBox.height / 2, { steps: 10 });
await page.waitForTimeout(650);

const duringRoute = await readRoute();
const duringBox = await page.locator(barSelector).boundingBox();
const duringTargetBox = await page.locator(targetBarSelector).boundingBox();
const hitProbe = await page.evaluate(({ x, y }) => {
  const element = document.elementFromPoint(x, y);
  return {
    tag: element?.tagName || '',
    dataBarId: element?.closest?.('[data-bar-id]')?.getAttribute?.('data-bar-id') || '',
    dataDependencyKey: element?.closest?.('[data-dependency-key]')?.getAttribute?.('data-dependency-key') || '',
    className: String(element?.className || ''),
  };
}, { x: beforeBox.x + beforeBox.width / 2, y: beforeBox.y + beforeBox.height / 2 });
const routeChanged = String(beforeRoute.d || '') !== String(duringRoute.d || '');
const barMoved = duringBox && Math.abs(Number(duringBox.x) - Number(beforeBox.x)) > 20;
const targetMoved = duringTargetBox && Math.abs(Number(duringTargetBox.x) - Number(beforeTargetBox.x)) > 20;

await page.mouse.up().catch(() => {});
await browser.close();
cleanup();

if (!barMoved) {
  throw new Error(`El hito no entro en preview de arrastre: ${JSON.stringify({ beforeBox, duringBox, hitProbe, horizontalDragPx })}`);
}
if (!targetMoved) {
  throw new Error(`La cascada de sucesores no acompaño al hito durante el preview: ${JSON.stringify({ beforeTargetBox, duringTargetBox, beforeRoute, duringRoute })}`);
}
if (!routeChanged) {
  throw new Error(`La capa de dependencias no acompaño el preview coherente del hito: ${JSON.stringify({ beforeRoute, duringRoute })}`);
}
if (consoleErrors.length) {
  throw new Error(`Errores de consola en DOM: ${consoleErrors.join(' | ')}`);
}

console.log(JSON.stringify({
  ok: true,
  empresa: fixture.empresa_nombre,
  presupuesto_id: fixture.selectedBudget.id,
  milestone_id: milestone.id,
  target_line_id: targetLineId,
  bar_delta_px: Number((duringBox.x - beforeBox.x).toFixed(2)),
  pointer_drag_px: horizontalDragPx,
  target_delta_px: Number((duringTargetBox.x - beforeTargetBox.x).toFixed(2)),
  dependency_route_updated: true,
  before_route_d: beforeRoute.d,
  during_route_d: duringRoute.d,
}, null, 2));
