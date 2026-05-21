import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';

const port = 4208;
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
    if not empresa:
        raise RuntimeError("No existe empresa Santiago Bermeo")
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == 13, Presupuesto.empresa_id == empresa.id).first()
    if not presupuesto:
        raise RuntimeError("No existe presupuesto 13 para Santiago Bermeo")
    schedule = db.query(CronogramaTrabajo).filter(
        CronogramaTrabajo.empresa_id == empresa.id,
        CronogramaTrabajo.presupuesto_id == presupuesto.id,
    ).first()
    if not schedule:
        raise RuntimeError("No existe CronogramaTrabajo para Santiago Bermeo presupuesto 13")
    trabajo = cronograma_trabajo_service._build_response(db, schedule).model_dump(mode="json")
    print(json.dumps({
        "empresa_id": empresa.id,
        "empresa_nombre": empresa.nombre,
        "project": {
            "id": presupuesto.proyecto_id,
            "fecha_inicio": trabajo.get("config", {}).get("fecha_inicio_proyecto"),
        },
        "detail": {
            "id": presupuesto.proyecto_id,
            "fecha_inicio": trabajo.get("config", {}).get("fecha_inicio_proyecto"),
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
  maxBuffer: 1024 * 1024 * 16,
});

if (fixtureRun.status !== 0) {
  throw new Error(`No se pudo obtener fixture real Santiago Bermeo: ${fixtureRun.error?.message || fixtureRun.stderr || fixtureRun.stdout}`);
}

const fixture = JSON.parse(fixtureRun.stdout);

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
  if (vite.killed) return;
  if (process.platform === 'win32' && vite.pid) {
    spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  vite.kill();
};
process.on('exit', cleanup);
process.on('uncaughtException', (error) => {
  cleanup();
  console.error(error);
  process.exit(1);
});
process.on('unhandledRejection', (error) => {
  cleanup();
  console.error(error);
  process.exit(1);
});

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
await page.waitForSelector('[data-gantt-left-vscroll-layer="true"] [role="scrollbar"]', { timeout: 30000 });
await page.waitForSelector('[data-gantt-timeline-vscroll-layer="true"] [role="scrollbar"]', { timeout: 30000 });
await page.waitForTimeout(700);

const geometry = await page.evaluate(() => {
  const q = (selector) => document.querySelector(selector);
  const rect = (selectorOrNode) => {
    const node = typeof selectorOrNode === 'string' ? q(selectorOrNode) : selectorOrNode;
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return {
      top: Math.round(r.top * 100) / 100,
      bottom: Math.round(r.bottom * 100) / 100,
      left: Math.round(r.left * 100) / 100,
      right: Math.round(r.right * 100) / 100,
      width: Math.round(r.width * 100) / 100,
      height: Math.round(r.height * 100) / 100,
    };
  };

  const readPanel = (name) => {
    const panel = rect(`[data-gantt-${name}-panel="true"]`);
    const shell = rect(`[data-gantt-${name}-viewport-shell="true"]`);
    const viewport = rect(`[data-gantt-${name}-viewport="true"]`);
    const header = rect(`[data-gantt-${name}-header="true"]`);
    const layer = rect(`[data-gantt-${name}-vscroll-layer="true"]`);
    const scrollbar = rect(`[data-gantt-${name}-vscroll-layer="true"] [role="scrollbar"][aria-orientation="vertical"]`);
    const headerMask = rect(`[data-gantt-${name}-header-scrollbar-mask="true"]`);
    const railCount = document.querySelectorAll(`[data-gantt-${name}-vscroll-layer="true"] [data-motion-scrollbar-rail-node="true"]`).length;
    const railState = document.querySelector(`[data-gantt-${name}-vscroll-layer="true"] [data-motion-scrollbar="true"]`)?.getAttribute('data-motion-scrollbar-rail') || null;
    return {
      panel,
      shell,
      viewport,
      header,
      layer,
      scrollbar,
      headerMask,
      visibleRailCount: railCount,
      railState,
      layerStartsBelowHeaderBy: layer && header ? Math.round((layer.top - header.bottom) * 100) / 100 : null,
      scrollbarStartsBelowHeaderBy: scrollbar && header ? Math.round((scrollbar.top - header.bottom) * 100) / 100 : null,
      layerEndsAboveShellBy: layer && shell ? Math.round((shell.bottom - layer.bottom) * 100) / 100 : null,
      headerMaskCoversScrollbarLane: headerMask && panel && header
        ? headerMask.top <= header.top + 1
          && headerMask.bottom >= header.bottom - 1
          && headerMask.right >= panel.right - 1
        : false,
    };
  };

  const root = document.documentElement;
  const body = document.body;
  const workspace = rect('[data-gantt-workspace="true"]');
  const leftHeader = rect('[data-gantt-left-header="true"]');
  const timelineHeader = rect('[data-gantt-timeline-header="true"]');
  const resizer = {
    container: rect('[data-gantt-grid-resizer="true"]'),
    line: rect('[data-gantt-grid-resizer-line="true"]'),
  };
  resizer.lineStartsBelowHeaderBy = resizer.line && leftHeader
    ? Math.round((resizer.line.top - leftHeader.bottom) * 100) / 100
    : null;
  const elementStackAt = (x, y) => document.elementsFromPoint(x, y).slice(0, 8).map((node) => ({
    tag: node.tagName,
    gantt: [...node.attributes || []]
      .filter((attr) => attr.name.startsWith('data-gantt'))
      .map((attr) => `${attr.name}=${attr.value}`),
    className: typeof node.className === 'string' ? node.className : '',
  }));
  const headerSeamX = resizer.container
    ? Math.round((resizer.container.left + (resizer.container.width / 2)) * 100) / 100
    : null;
  const headerSeamY = leftHeader && timelineHeader
    ? Math.round((Math.max(leftHeader.top, timelineHeader.top) + 12) * 100) / 100
    : null;
  const headerSeamStack = headerSeamX !== null && headerSeamY !== null
    ? elementStackAt(headerSeamX, headerSeamY)
    : [];
  const toolbar = [...document.querySelectorAll('[class*="bg-[#0f1115]"], [class*="bg-[#0f1115"]')]
    .map((node) => rect(node))
    .filter(Boolean)
    .sort((a, b) => a.top - b.top)[0] || null;
  const gapY = toolbar && workspace ? Math.round((workspace.top - toolbar.bottom) * 100) / 100 : null;

  return {
    viewport: { width: root.clientWidth, height: root.clientHeight },
    bodyBackground: getComputedStyle(body).backgroundColor,
    workspace,
    toolbar,
    gapY,
    resizer,
    headerSeam: {
      x: headerSeamX,
      y: headerSeamY,
      stack: headerSeamStack,
    },
    left: readPanel('left'),
    timeline: readPanel('timeline'),
  };
});

await page.screenshot({ path: 'tmp_gantt_layout_dom.png', fullPage: false });
await browser.close();
cleanup();

if (consoleErrors.length) {
  throw new Error(`Errores de consola en Gantt DOM: ${consoleErrors.join(' | ')}`);
}

const assertPanel = (name, panel) => {
  if (!panel.header || !panel.layer || !panel.scrollbar || !panel.headerMask) {
    throw new Error(`DOM incompleto para ${name}: ${JSON.stringify(panel)}`);
  }
  if (panel.header.height > 58) {
    throw new Error(`Header ${name} sobredimensionado: ${JSON.stringify(panel.header)}`);
  }
  if (panel.layerStartsBelowHeaderBy < -0.5) {
    throw new Error(`Capa scrollbar ${name} invade header: ${JSON.stringify(panel)}`);
  }
  if (panel.scrollbarStartsBelowHeaderBy < 6) {
    throw new Error(`Riel scrollbar ${name} pisa header o queda pegado: ${JSON.stringify(panel)}`);
  }
  if (panel.layerEndsAboveShellBy < 20) {
    throw new Error(`Capa scrollbar ${name} invade zona horizontal inferior: ${JSON.stringify(panel)}`);
  }
  if (panel.visibleRailCount !== 1) {
    throw new Error(`El scrollbar vertical ${name} no conserva un unico riel visible: ${JSON.stringify(panel)}`);
  }
  if (panel.railState !== 'visible') {
    throw new Error(`El scrollbar vertical ${name} no declara riel visible: ${JSON.stringify(panel)}`);
  }
  if (!panel.headerMaskCoversScrollbarLane) {
    throw new Error(`La mascara de cabecera ${name} no cubre el carril superior del scrollbar: ${JSON.stringify(panel)}`);
  }
};

assertPanel('left', geometry.left);
assertPanel('timeline', geometry.timeline);

if (!geometry.resizer.line || geometry.resizer.lineStartsBelowHeaderBy < 6) {
  throw new Error(`Separador central visible invade la cabecera: ${JSON.stringify(geometry.resizer)}`);
}

const gridSeparation = geometry.timeline?.panel && geometry.left?.panel
  ? Math.round((geometry.timeline.panel.left - geometry.left.panel.right) * 100) / 100
  : null;
if (gridSeparation === null || gridSeparation > 14) {
  throw new Error(`Separacion entre grids excesiva o incoherente: ${JSON.stringify({ gridSeparation, left: geometry.left?.panel, timeline: geometry.timeline?.panel })}`);
}

const seamHasVisibleDivider = geometry.headerSeam.stack.some((entry) => (
  /\bborder-(?:l|r)\b/.test(entry.className)
  || /bg-\[#c4ccd3\]/.test(entry.className)
));
if (seamHasVisibleDivider) {
  throw new Error(`La cabecera conserva un divisor vertical visible entre grids: ${JSON.stringify(geometry.headerSeam)}`);
}

if (geometry.gapY !== null && geometry.gapY > 28) {
  throw new Error(`Separacion vertical excesiva entre botonera y grids: ${JSON.stringify(geometry)}`);
}

console.log(`validate-gantt-layout-dom: ok ${JSON.stringify(geometry)}`);
