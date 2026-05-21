import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';

const port = 4203;
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
  throw new Error(`No se pudo obtener fixture real Santiago Bermeo: ${fixtureRun.stderr || fixtureRun.stdout}`);
}

const fixture = JSON.parse(fixtureRun.stdout);
const sourceVisibleItem = fixture.trabajo.rows.findIndex((row) => String(row.linea_id) === '71') + 1;
const targetVisibleIndex = fixture.trabajo.rows.findIndex((row) => String(row.linea_id) === '73');
if (sourceVisibleItem <= 0 || targetVisibleIndex < 0) {
  throw new Error('El fixture real no contiene las lineas 71 y 73 esperadas para la validacion FF.');
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
await page.evaluate((rowIndex) => {
  const firstGridRow = document.querySelector('[data-grid-row="true"]');
  let current = firstGridRow?.parentElement || null;
  while (current && current !== document.body) {
    if (current instanceof HTMLElement && current.scrollHeight > current.clientHeight + 20) {
      current.scrollTop = Math.max(0, (rowIndex - 2) * 84);
      current.dispatchEvent(new Event('scroll', { bubbles: true }));
      break;
    }
    current = current.parentElement;
  }
}, targetVisibleIndex);
await page.waitForTimeout(500);
try {
  await page.waitForSelector('[data-grid-row="true"][data-line-id="73"]', { timeout: 30000 });
} catch (error) {
  const bodyText = await page.locator('body').innerText({ timeout: 1000 }).catch(() => '');
  throw new Error(`No se renderizo la fila objetivo en DOM. Body="${bodyText.slice(0, 1200)}". Console="${consoleErrors.join(' | ')}". ${error.message}`);
}
await page.evaluate(() => {
  const firstGridRow = document.querySelector('[data-grid-row="true"]');
  let current = firstGridRow?.parentElement || null;
  while (current && current !== document.body) {
    if (current instanceof HTMLElement && current.scrollWidth > current.clientWidth + 20) {
      current.scrollLeft = current.scrollWidth;
      current.dispatchEvent(new Event('scroll', { bubbles: true }));
      break;
    }
    current = current.parentElement;
  }
});
await page.waitForTimeout(300);

const predecessorInputHandle = await page.evaluateHandle(() => {
  const targetRow = document.querySelector('[data-grid-row="true"][data-line-id="73"]');
  const inputs = [...document.querySelectorAll('input[aria-label^="Shortcode de predecesoras"]')];
  return targetRow?.querySelector('input[aria-label^="Shortcode de predecesoras"]')
    || inputs.find((input) => /Cargado de material/i.test(input.getAttribute('aria-label') || ''))
    || inputs[0]
    || null;
});
const input = predecessorInputHandle.asElement();
if (!input) {
  const bodyText = await page.locator('body').innerText({ timeout: 1000 }).catch(() => '');
  const inputs = await page.evaluate(() => [...document.querySelectorAll('input')].map((item) => ({
    label: item.getAttribute('aria-label'),
    value: item.value,
    placeholder: item.getAttribute('placeholder'),
  })));
  throw new Error(`No se encontro input Predecesoras del target. Body="${bodyText.slice(0, 1200)}". Inputs=${JSON.stringify(inputs)}`);
}
const predecessorInput = page.locator('[data-grid-row="true"][data-line-id="73"] input[aria-label^="Shortcode de predecesoras"]').first();
await predecessorInput.click();
await predecessorInput.fill(`${sourceVisibleItem}FF`);
await page.waitForTimeout(200);
const inputDebug = await predecessorInput.evaluate((node) => ({
  label: node.getAttribute('aria-label'),
  value: node.value,
  lineId: node.closest('[data-grid-row="true"]')?.getAttribute('data-line-id'),
  connected: node.isConnected,
  disabled: node.disabled,
  rect: (() => {
    const rect = node.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  })(),
}));

const finalInputDebug = await predecessorInput.evaluate((node) => ({
  label: node.getAttribute('aria-label'),
  value: node.value,
  lineId: node.closest('[data-grid-row="true"]')?.getAttribute('data-line-id'),
}));

if (finalInputDebug.lineId !== '73' || finalInputDebug.value !== `${sourceVisibleItem}FF`) {
    throw new Error(`El DOM no mantuvo la edicion FF en la fila real 73: ${JSON.stringify(finalInputDebug)}. Inicial=${JSON.stringify(inputDebug)}`);
}
await page.waitForTimeout(500);

const scheduleDebug = await page.evaluate(() => {
  const targetRow = document.querySelector('[data-grid-row="true"][data-line-id="73"]');
  return {
    targetText: targetRow?.innerText || '',
  };
});
const projectStart = new Date(fixture.trabajo.config.fecha_inicio_proyecto);
projectStart.setHours(Number(fixture.trabajo.config.hora_inicio_jornada || 8), 0, 0, 0);
const targetFixture = fixture.trabajo.rows.find((row) => String(row.linea_id) === '73');
const targetStart = new Date(targetFixture.start_date);
const targetFinish = new Date(targetFixture.end_date);
if (!(targetStart >= projectStart)) {
  throw new Error(`El fixture backend FF deja la fila 73 antes del inicio del proyecto: ${JSON.stringify(targetFixture)}`);
}
if (/20\/02\/2026|23\/02\/2026|2026-02/i.test(scheduleDebug.targetText)) {
  throw new Error(`La fila 73 sigue mostrando fechas de febrero en DOM: ${JSON.stringify(scheduleDebug)}`);
}
if (Number.isNaN(targetFinish.getTime()) || targetFinish.getFullYear() !== 2026 || targetFinish.getMonth() !== 3) {
  throw new Error(`El fixture backend FF no deja el final de la fila 73 en abril de 2026: ${JSON.stringify(targetFixture)}`);
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
  target_line_id: finalInputDebug.lineId,
  typed_shortcode: finalInputDebug.value,
  target_start: targetFixture.start_date,
  target_finish: targetFixture.end_date,
  project_start: fixture.trabajo.config.fecha_inicio_proyecto,
}, null, 2));
