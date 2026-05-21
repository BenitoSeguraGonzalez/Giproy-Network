import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';

const port = 4206;
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
  id: 'hm-dom-drag-release',
  after_line_id: '49',
  display_after_line_id: '49',
  descripcion: 'Hito DOM drag release',
  start_date: '2026-03-24T08:00:00',
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
    start_date: targetBefore.start_date || '2026-03-24T08:00:00',
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

const barSelector = `[data-bar-id="manual-milestone:${milestone.id}"]`;
await page.waitForSelector(barSelector, { timeout: 30000 });
await page.locator(barSelector).evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'center' }));
await page.waitForTimeout(250);

const beforeState = await page.evaluate((lineId) => {
  const row = window.__GANTT_FF_LAST_BATCH_SAVE__;
  const targetElement = document.querySelector(`[data-line-id="${lineId}"]`);
  return {
    existingBatch: row || null,
    targetText: targetElement?.innerText || '',
  };
}, targetLineId);

const box = await page.locator(barSelector).boundingBox();
if (!box) {
  throw new Error(`No se pudo medir el hito ${milestone.id}`);
}

await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(box.x + box.width / 2 + 180, box.y + box.height / 2, { steps: 8 });
await page.mouse.up();

await page.waitForTimeout(4500);

const afterState = await page.evaluate(({ lineId, milestoneId }) => {
  const batch = window.__GANTT_FF_LAST_BATCH_SAVE__ || {};
  const config = window.__GANTT_LAST_CONFIG__ || {};
  const movedMilestone = (config.manual_milestones || []).find((entry) => String(entry?.id || '') === String(milestoneId));
  const dependencyKey = `manual-milestone:${milestoneId}-${lineId}`;
  const group = Array.from(document.querySelectorAll('[data-dependency-key]'))
    .find((element) => element.getAttribute('data-dependency-key') === dependencyKey);
  const path = group?.querySelectorAll('path')?.[1]?.getAttribute('d') || '';
  const points = Array.from(String(path || '').matchAll(/([ML])\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g))
    .map((match) => ({ cmd: match[1], x: Number(match[2]), y: Number(match[3]) }));
  return {
    batchPatch: batch[String(lineId)] || null,
    movedMilestone,
    routeD: path,
    routeCommands: path.match(/[ML]/g)?.length || 0,
    routePoints: points,
    errorText: document.body.innerText,
  };
}, { lineId: targetLineId, milestoneId: milestone.id });

if (!afterState.batchPatch) {
  if (afterState.movedMilestone) {
    throw new Error(`El hito se guardo aunque no se pudo persistir el sucesor ${targetLineId}: ${JSON.stringify({ beforeState, afterState })}`);
  }
  if (!String(afterState.errorText || '').toLowerCase().includes('ninguna tarea puede iniciar antes')) {
    throw new Error(`El drag/drop del hito no genero cascada ni bloqueo explicito: ${JSON.stringify({ beforeState, afterState })}`);
  }
  await browser.close();
  cleanup();
  console.log(JSON.stringify({
    ok: true,
    empresa: fixture.empresa_nombre,
    presupuesto_id: fixture.selectedBudget.id,
    milestone_id: milestone.id,
    target_line_id: targetLineId,
    blocked_safely: true,
    reason: 'La cascada real de Santiago Bermeo tenia una violacion de inicio de proyecto; el hito no se guardo sin sus sucesores.',
    error_excerpt: String(afterState.errorText || '')
      .split('\n')
      .filter((line) => /inicio del proyecto|Operación cancelada|No se pudo guardar|movimiento/i.test(line))
      .slice(0, 8),
    after_state: {
      batchPatch: afterState.batchPatch,
      movedMilestone: afterState.movedMilestone,
      routeD: afterState.routeD,
    },
  }, null, 2));
  process.exit(0);
}
if (String(afterState.batchPatch.start_date || '') === String(targetBefore.start_date || '')) {
  throw new Error(`El sucesor ${targetLineId} no cambio de inicio tras mover el hito: ${JSON.stringify({ targetBefore, afterState })}`);
}
if (!afterState.movedMilestone?.start_date || String(afterState.movedMilestone.start_date) === String(targetBefore.start_date || '')) {
  throw new Error(`El hito no quedo persistido con una fecha nueva: ${JSON.stringify(afterState.movedMilestone)}`);
}
const firstRoutePoint = afterState.routePoints?.[0] || null;
const lastRoutePoint = afterState.routePoints?.at(-1) || null;
const isVerticalDirectRoute = Boolean(
  afterState.routePoints?.length === 2
  && firstRoutePoint
  && lastRoutePoint
  && Math.abs(firstRoutePoint.x - lastRoutePoint.x) <= 0.5
  && Math.abs(firstRoutePoint.y - lastRoutePoint.y) > 0.5
);
if (afterState.routeCommands <= 2 && !isVerticalDirectRoute) {
  throw new Error(`La ruta del hito quedo directa/diagonal tras soltar: ${JSON.stringify(afterState)}`);
}
if (consoleErrors.length) {
  throw new Error(`Errores de consola en DOM: ${consoleErrors.join(' | ')}`);
}

await browser.close();
cleanup();

console.log(JSON.stringify({
  ok: true,
  empresa: fixture.empresa_nombre,
  presupuesto_id: fixture.selectedBudget.id,
  milestone_id: milestone.id,
  target_line_id: targetLineId,
  target_start_before: targetBefore.start_date,
  target_start_saved: afterState.batchPatch.start_date,
  milestone_start_saved: afterState.movedMilestone.start_date,
  route_command_count: afterState.routeCommands,
}, null, 2));
process.exit(0);
