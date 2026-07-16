import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = 4213;
const baseUrl = `http://127.0.0.1:${port}`;
const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDir, '..');
const repoRoot = resolve(frontendRoot, '..');

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

def row_id(row):
    return str(row.get("presupuesto_linea_id") or row.get("budget_line_id") or row.get("linea_id") or "").strip()

def is_backend_critical(row):
    metadata = row.get("metadata") or {}
    cpm = metadata.get("cpm") or {}
    indexes = cpm.get("critical_path_indexes") or []
    if indexes:
        return True
    node_id = row_id(row)
    for path in (metadata.get("cpm_network") or {}).get("critical_paths") or []:
        if node_id and node_id in [str(item).strip() for item in path]:
            return True
    return False

db = SessionLocal()
try:
    empresa = db.query(Empresa).filter(Empresa.nombre == "Santiago Bermeo").first()
    if not empresa:
        raise RuntimeError("Empresa Santiago Bermeo no encontrada")
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == 13, Presupuesto.empresa_id == empresa.id).first()
    if not presupuesto:
        raise RuntimeError("Presupuesto 13 de Santiago Bermeo no encontrado")
    schedule = db.query(CronogramaTrabajo).filter(
        CronogramaTrabajo.empresa_id == empresa.id,
        CronogramaTrabajo.presupuesto_id == presupuesto.id,
    ).first()
    if not schedule:
        raise RuntimeError("Cronograma de trabajo no encontrado")
    trabajo = cronograma_trabajo_service._build_response(db, schedule).model_dump(mode="json")
    critical_ids = [row_id(row) for row in trabajo.get("rows") or [] if is_backend_critical(row)]
    print(json.dumps({
        "empresa_id": empresa.id,
        "empresa_nombre": empresa.nombre,
        "critical_ids": critical_ids,
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
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 20,
});

if (fixtureRun.status !== 0) {
  throw new Error(`No se pudo obtener fixture real Santiago Bermeo: ${fixtureRun.error?.message || fixtureRun.stderr || fixtureRun.stdout}`);
}

const fixture = JSON.parse(fixtureRun.stdout);
const expectedCriticalIds = new Set((fixture.critical_ids || []).map((value) => String(value)));
if (expectedCriticalIds.size < 25) {
  throw new Error(`CPM backend insuficiente para certificar ruta crítica: ${expectedCriticalIds.size} tareas críticas`);
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
  { cwd: frontendRoot, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
);

let viteOutput = '';
vite.stdout?.on('data', (chunk) => { viteOutput += chunk.toString(); });
vite.stderr?.on('data', (chunk) => { viteOutput += chunk.toString(); });

const cleanup = () => {
  if (!vite.killed) {
    if (process.platform === 'win32' && vite.pid) {
      spawnSync('taskkill', ['/pid', String(vite.pid), '/t', '/f'], { stdio: 'ignore' });
    } else {
      vite.kill();
    }
  }
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
await page.waitForSelector('[data-gantt-task-bar="true"]', { timeout: 30000 });
await page.waitForTimeout(1200);

const isRedCssValue = (value) => {
  const matches = Array.from(String(value || '').matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g));
  return matches.some((match) => {
    const red = Number(match[1]);
    const green = Number(match[2]);
    const blue = Number(match[3]);
    return red >= 150 && red > green + 45 && red > blue + 45;
  });
};

const collectBars = async () => page.evaluate(() => {
  const readElement = (element) => {
    const style = window.getComputedStyle(element);
    return {
      lineId: String(element.getAttribute('data-line-id') || element.getAttribute('data-bar-id') || ''),
      isCritical: element.getAttribute('data-critical-path') === 'true',
      tone: element.getAttribute('data-gantt-bar-tone') || '',
      kind: element.getAttribute('data-gantt-subbar') === 'true' ? 'subbar' : 'task',
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderColor: style.borderColor,
      rect: (() => {
        const rect = element.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })(),
    };
  };
  return Array.from(document.querySelectorAll('[data-gantt-task-bar="true"], [data-gantt-subbar="true"]'))
    .map(readElement)
    .filter((item) => item.lineId);
});

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
    element.dispatchEvent(new Event('scroll', { bubbles: true }));
  }
}, { xRatio, yRatio });

const collectedByLine = new Map();
const mergeBars = (bars) => {
  for (const bar of bars || []) {
    if (!bar.lineId) continue;
    const current = collectedByLine.get(bar.lineId) || [];
    current.push(bar);
    collectedByLine.set(bar.lineId, current);
  }
};

const xPositions = [0, 0.33, 0.66, 1];
const yPositions = Array.from({ length: 21 }, (_, index) => index / 20);
for (const y of yPositions) {
  for (const x of xPositions) {
    await setScrollablePositions(x, y);
    await page.waitForTimeout(180);
    mergeBars(await collectBars());
  }
}

await browser.close();
cleanup();

const renderedCriticalIds = new Set();
const nonRedCritical = [];
const unexpectedCritical = [];
const normalRed = [];

for (const [lineId, bars] of collectedByLine.entries()) {
  const expectedCritical = expectedCriticalIds.has(lineId);
  const lineHasCriticalAttr = bars.some((bar) => bar.isCritical || bar.tone === 'critical');
  if (lineHasCriticalAttr) renderedCriticalIds.add(lineId);
  if (lineHasCriticalAttr && !expectedCritical) {
    unexpectedCritical.push({ lineId, samples: bars.slice(0, 2) });
  }
  if (expectedCritical && lineHasCriticalAttr) {
    const hasRedVisual = bars.some((bar) => (
      isRedCssValue(bar.backgroundColor)
      || isRedCssValue(bar.backgroundImage)
      || isRedCssValue(bar.borderColor)
    ));
    if (!hasRedVisual) {
      nonRedCritical.push({ lineId, samples: bars.slice(0, 3) });
    }
  }
  if (!expectedCritical && !lineHasCriticalAttr) {
    const hasRedVisual = bars.some((bar) => (
      isRedCssValue(bar.backgroundColor)
      || isRedCssValue(bar.backgroundImage)
      || isRedCssValue(bar.borderColor)
    ));
    if (hasRedVisual) normalRed.push({ lineId, samples: bars.slice(0, 2) });
  }
}

const missingCriticalIds = Array.from(expectedCriticalIds).filter((lineId) => !renderedCriticalIds.has(lineId));
const diagnostics = {
  empresa: fixture.empresa_nombre,
  presupuesto_id: fixture.selectedBudget.id,
  backend_critical_count: expectedCriticalIds.size,
  rendered_critical_count: renderedCriticalIds.size,
  missing_critical_count: missingCriticalIds.length,
  missing_critical_ids: missingCriticalIds.slice(0, 30),
  non_red_critical_count: nonRedCritical.length,
  non_red_critical: nonRedCritical.slice(0, 10),
  unexpected_critical_count: unexpectedCritical.length,
  unexpected_critical: unexpectedCritical.slice(0, 10),
  normal_red_count: normalRed.length,
  normal_red: normalRed.slice(0, 10),
};

if (consoleErrors.length) {
  throw new Error(`Errores de consola en DOM: ${consoleErrors.join(' | ')}`);
}
if (missingCriticalIds.length || nonRedCritical.length || unexpectedCritical.length || normalRed.length) {
  throw new Error(`Ruta crítica visual inválida: ${JSON.stringify(diagnostics, null, 2)}`);
}

console.log(`validate-gantt-santiago-critical-visual-dom: ok ${JSON.stringify(diagnostics)}`);
