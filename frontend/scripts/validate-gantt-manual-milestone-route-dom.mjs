import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';

const port = 4205;
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
  id: 'hm-dom-route-repro',
  after_line_id: '49',
  display_after_line_id: '49',
  descripcion: 'Hito DOM ruta',
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
try {
  await page.waitForFunction((key) => (
    Array.from(document.querySelectorAll('[data-dependency-key]'))
      .some((element) => element.getAttribute('data-dependency-key') === key && element.querySelectorAll('path').length >= 2)
  ), dependencyKey, { timeout: 30000 });
} catch (error) {
  const debug = await page.evaluate(() => ({
    dependencyKeys: Array.from(document.querySelectorAll('[data-dependency-key]'))
      .map((element) => element.getAttribute('data-dependency-key'))
      .slice(0, 20),
    manualRows: Array.from(document.querySelectorAll('[data-line-id^="manual-milestone:"]'))
      .map((element) => element.getAttribute('data-line-id'))
      .slice(0, 20),
    line49Present: Boolean(document.querySelector('[data-line-id="49"], [data-bar-id="49"]')),
    bodyText: document.body.innerText.slice(0, 1000),
  }));
  throw new Error(`No se renderizo la dependencia ${dependencyKey}: ${JSON.stringify(debug)}`);
}

const route = await page.evaluate((key) => {
  const group = Array.from(document.querySelectorAll('[data-dependency-key]'))
    .find((element) => element.getAttribute('data-dependency-key') === key);
  const visiblePath = group?.querySelectorAll('path')?.[1] || null;
  const d = visiblePath?.getAttribute('d') || '';
  const commands = d.match(/[ML]/g) || [];
  const points = Array.from(String(d || '').matchAll(/([ML])\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g))
    .map((match) => ({ cmd: match[1], x: Number(match[2]), y: Number(match[3]) }));
  return {
    key,
    d,
    commandCount: commands.length,
    points,
  };
}, dependencyKey);

const firstPoint = route.points[0] || null;
const lastPoint = route.points.at(-1) || null;
const isVerticalRoute = Boolean(firstPoint && lastPoint && Math.abs(firstPoint.x - lastPoint.x) <= 0.5 && Math.abs(firstPoint.y - lastPoint.y) > 0.5);
if (!isVerticalRoute || route.commandCount !== 2) {
  throw new Error(`La ruta hito -> tarea alineada debe ser vertical limpia, sin codos: ${JSON.stringify(route)}`);
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
  dependency_key: dependencyKey,
  route_command_count: route.commandCount,
  route_d: route.d,
}, null, 2));
