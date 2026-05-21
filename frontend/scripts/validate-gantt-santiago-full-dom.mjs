import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';

const port = 4211;
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
  maxBuffer: 1024 * 1024 * 20,
});

if (fixtureRun.status !== 0) {
  throw new Error(`No se pudo obtener fixture real Santiago Bermeo: ${fixtureRun.error?.message || fixtureRun.stderr || fixtureRun.stdout}`);
}

const fixture = JSON.parse(fixtureRun.stdout);

const expectedKeys = [];
for (const row of fixture.trabajo?.rows || []) {
  const target = String(row.presupuesto_linea_id ?? row.linea_id ?? row.budget_line_id ?? '').trim();
  for (const dependency of row.dependencies || []) {
    const source = String(dependency.source_id ?? '').trim();
    if (source && target) expectedKeys.push(`${source}-${target}`);
  }
}
for (const milestone of fixture.trabajo?.config?.manual_milestones || []) {
  const source = `manual-milestone:${String(milestone.id || '').trim()}`;
  for (const dependency of milestone.successor_dependencies || []) {
    const target = String(dependency.target_id ?? dependency.targetId ?? '').trim();
    if (source && target) expectedKeys.push(`${source}-${target}`);
  }
}

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
await page.waitForTimeout(1200);

const collectRoutes = async () => page.evaluate(() => {
  const parsePoints = (d) => {
    const matches = Array.from(String(d || '').matchAll(/([ML])\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g));
    return matches.map((match) => ({ cmd: match[1], x: Number(match[2]), y: Number(match[3]) }));
  };
  return Array.from(document.querySelectorAll('[data-dependency-key]'))
    .map((group) => {
      const key = group.getAttribute('data-dependency-key') || '';
      const paths = group.querySelectorAll('path');
      const d = paths?.[1]?.getAttribute('d') || paths?.[0]?.getAttribute('d') || '';
      const points = parsePoints(d);
      const diagonalSegments = [];
      for (let i = 1; i < points.length; i += 1) {
        const previous = points[i - 1];
        const current = points[i];
        const dx = Math.abs(current.x - previous.x);
        const dy = Math.abs(current.y - previous.y);
        if (dx > 0.5 && dy > 0.5) {
          diagonalSegments.push({ from: previous, to: current, dx, dy });
        }
      }
      return {
        key,
        d,
        commandCount: points.length,
        diagonalSegments,
        points,
        isManualMilestone: key.startsWith('manual-milestone:') || key.includes('-manual-milestone:'),
      };
    });
  const visibleKeys = new Set(visible.map((item) => item.key));
  const missingVisible = expected.filter((key) => !visibleKeys.has(String(key)));
  return {
    renderedCount: visible.length,
    expectedCount: expected.length,
    missingVisible,
    diagonalRoutes: visible.filter((item) => item.diagonalSegments.length > 0),
    directManualRoutes: visible.filter((item) => item.isManualMilestone && item.commandCount <= 2),
        emptyRoutes: visible.filter((item) => !item.d || item.commandCount < 2),
        sampleKeys: visible.slice(0, 20).map((item) => item.key),
      };
});

const getScrollableSnapshot = async () => page.evaluate(() => (
  Array.from(document.querySelectorAll('*'))
    .map((element, index) => ({
      index,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight,
      canX: element.scrollWidth > element.clientWidth + 8,
      canY: element.scrollHeight > element.clientHeight + 8,
      className: String(element.className || ''),
      role: element.getAttribute('role') || '',
      dataLineId: element.getAttribute('data-line-id') || '',
    }))
    .filter((item) => item.canX || item.canY)
));

const setScrollablePositions = async (xRatio, yRatio) => page.evaluate(({ xRatio: xr, yRatio: yr }) => {
  const scrollables = Array.from(document.querySelectorAll('*'))
    .filter((element) => element.scrollWidth > element.clientWidth + 8 || element.scrollHeight > element.clientHeight + 8);
  for (const element of scrollables) {
    if (element.scrollWidth > element.clientWidth + 8) {
      element.scrollLeft = Math.max(0, element.scrollWidth - element.clientWidth) * xr;
    }
    if (element.scrollHeight > element.clientHeight + 8) {
      element.scrollTop = Math.max(0, element.scrollHeight - element.clientHeight) * yr;
    }
  }
}, { xRatio, yRatio });

const collectedRoutes = new Map();
const mergeRoutes = (routes) => {
  for (const route of routes || []) {
    if (route?.key && !collectedRoutes.has(route.key)) {
      collectedRoutes.set(route.key, route);
    }
  }
};

mergeRoutes(await collectRoutes());
const scrollables = await getScrollableSnapshot();
const hasScrollableCanvas = scrollables.length > 0;
const positions = [0, 0.2, 0.4, 0.6, 0.8, 1];
if (hasScrollableCanvas) {
  for (const y of positions) {
    for (const x of positions) {
      await setScrollablePositions(x, y);
      await page.waitForTimeout(180);
      mergeRoutes(await collectRoutes());
    }
  }
  await setScrollablePositions(0, 0);
  await page.waitForTimeout(120);
}

const visible = Array.from(collectedRoutes.values());
const isVerticalDirectManualRoute = (item) => {
  const points = Array.isArray(item?.points) ? item.points : [];
  const firstPoint = points[0] || null;
  const lastPoint = points.at(-1) || null;
  return Boolean(
    item?.isManualMilestone
    && points.length === 2
    && firstPoint
    && lastPoint
    && Math.abs(firstPoint.x - lastPoint.x) <= 0.5
    && Math.abs(firstPoint.y - lastPoint.y) > 0.5
  );
};
const visibleKeys = new Set(visible.map((item) => item.key));
const diagnostics = {
  renderedCount: visible.length,
  expectedCount: expectedKeys.length,
  missingVisible: expectedKeys.filter((key) => !visibleKeys.has(String(key))),
  diagonalRoutes: visible.filter((item) => item.diagonalSegments.length > 0),
  directManualRoutes: visible.filter((item) => item.isManualMilestone && item.commandCount <= 2 && !isVerticalDirectManualRoute(item)),
  emptyRoutes: visible.filter((item) => !item.d || item.commandCount < 2),
  sampleKeys: visible.slice(0, 20).map((item) => item.key),
  scrollableCount: scrollables.length,
};

await browser.close();
cleanup();

if (consoleErrors.length) {
  throw new Error(`Errores de consola en DOM: ${consoleErrors.join(' | ')}`);
}
if (diagnostics.diagonalRoutes.length || diagnostics.directManualRoutes.length || diagnostics.emptyRoutes.length) {
  throw new Error(`Rutas Gantt invalidas: ${JSON.stringify(diagnostics, null, 2)}`);
}

console.log(JSON.stringify({
  ok: true,
  empresa: fixture.empresa_nombre,
  presupuesto_id: fixture.selectedBudget.id,
  expected_dependency_count: diagnostics.expectedCount,
  rendered_dependency_count: diagnostics.renderedCount,
  missing_visible_count: diagnostics.missingVisible.length,
  diagonal_route_count: diagnostics.diagonalRoutes.length,
  direct_manual_route_count: diagnostics.directManualRoutes.length,
  empty_route_count: diagnostics.emptyRoutes.length,
  note: 'missing_visible_count puede ser mayor que cero si el viewport virtual no renderiza relaciones fuera de la ventana; las rutas renderizadas se auditan completas.',
}, null, 2));
