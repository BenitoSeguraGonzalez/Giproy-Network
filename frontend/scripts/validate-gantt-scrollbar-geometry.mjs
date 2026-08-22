import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';

const port = 4204;
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
  maxBuffer: 1024 * 1024 * 12,
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
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.route('**/gantt-ff-fixture.json', async (route) => {
  await route.fulfill({ json: fixture });
});

await page.goto(`${baseUrl}/gantt-ff-harness.html`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('text=187 PARTIDAS', { state: 'attached', timeout: 30000 });
await page.waitForSelector('[role="scrollbar"][aria-orientation="horizontal"]', { timeout: 30000 });
await page.evaluate(() => {
  [...document.querySelectorAll('.giproy-motion-scrollbar-hide')].forEach((viewport) => {
    if (!(viewport instanceof HTMLElement)) return;
    if (viewport.firstElementChild instanceof HTMLElement) {
      viewport.firstElementChild.style.minWidth = '2600px';
    }
  });
});
await page.waitForTimeout(500);

const geometry = await page.evaluate(() => {
  const rectOf = (node) => {
    const rect = node.getBoundingClientRect();
    return {
      left: Math.round(rect.left * 100) / 100,
      right: Math.round(rect.right * 100) / 100,
      width: Math.round(rect.width * 100) / 100,
    };
  };
  const bars = [...document.querySelectorAll('[role="scrollbar"][aria-orientation="horizontal"]')]
    .filter((bar) => bar.getBoundingClientRect().width > 100)
    .map((bar, index) => {
      const parent = bar.offsetParent || bar.parentElement;
      const barRect = rectOf(bar);
      const parentRect = rectOf(parent);
      return {
        index,
        barRect,
        parentRect,
        leftClearance: Math.round((barRect.left - parentRect.left) * 100) / 100,
        rightClearance: Math.round((parentRect.right - barRect.right) * 100) / 100,
      };
    });
  return { bars };
});

await browser.close();
cleanup();

if (consoleErrors.length) {
  throw new Error(`Errores de consola en Gantt DOM: ${consoleErrors.join(' | ')}`);
}

if (geometry.bars.length < 2) {
  throw new Error(`No se detectaron las dos scrollbars horizontales principales del Gantt: ${JSON.stringify(geometry)}`);
}

geometry.bars.slice(0, 2).forEach((bar) => {
  const delta = Math.abs(bar.leftClearance - bar.rightClearance);
  if (bar.leftClearance < 20 || bar.rightClearance < 20 || delta > 1) {
    throw new Error(`Scrollbar horizontal Gantt desbalanceada: ${JSON.stringify(bar)}`);
  }
});

console.log(`validate-gantt-scrollbar-geometry: ok ${JSON.stringify(geometry.bars.slice(0, 2))}`);
