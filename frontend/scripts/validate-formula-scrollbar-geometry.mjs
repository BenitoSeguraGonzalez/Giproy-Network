import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const port = 4202;
const baseUrl = `http://127.0.0.1:${port}`;

const waitForServer = async (url, timeoutMs = 20000) => {
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

const resources = Array.from({ length: 240 }, (_, index) => {
  const categories = [1, 2, 3, 4];
  const sc = categories[index % categories.length];
  return {
    recurso_id: index + 1,
    codigo: `R-${String(index + 1).padStart(4, '0')}`,
    descripcion: `Recurso de validacion geometrica de scrollbar ${index + 1}`,
    unidad: sc === 4 ? 'h' : 'u',
    precio: 1 + index / 10,
    costo_total: 100 + index * 3.17,
    cantidad_total: 1 + index / 3,
    categoria: ['Equipos', 'Materiales', 'Transporte', 'Mano de Obra'][index % 4],
    subcategoria_codigo: sc,
    termino_actual: ['E', 'D', 'P', 'B'][index % 4],
    termino_sugerido: ['E', 'D', 'P', 'B'][index % 4],
  };
});

const formula = {
  id: 1,
  presupuesto_id: 13,
  costo_directo_total: 2573.98,
  valor_total_indices: 2573.98,
  coeficiente_fijo: 0,
  tipo: 'SIN_DESGLOSE',
  resources_detected: resources.length,
  resources_pending: 0,
  is_complete: true,
  formula_general: 'PR = P0 (0.278B1/B0 + 0.057D1/D0 + 0.177E1/E0 + 0.257M1/M0 + 0.073P1/P0 + 0.158X1/X0)',
  formula_cuadrilla: 'B = 1.000B1/B0',
  monomios: [
    ['B', '75', 'Cuadrilla Tipo', 0.278, 714.74],
    ['D', '23', 'Cemento Portland', 0.057, 147.54],
    ['E', '90', 'Equipo y maquinaria', 0.177, 456.26],
    ['M', '53', 'Madera', 0.257, 661.38],
    ['P', '304', 'Petreos Azuay', 0.073, 187.51],
    ['X', '822', 'IPC Urbano', 0.158, 406.55],
  ].map(([simbolo, codigo, descripcion, coeficiente, subtotal], index) => ({
    id: index + 1,
    simbolo,
    indice_codigo: codigo,
    indice_descripcion: descripcion,
    indice_inec_id: index + 1,
    descripcion,
    coeficiente,
    subtotal_termino: subtotal,
  })),
  cuadrilla_tipo: Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    recurso_id: index + 1,
    indice_inec_id: 1,
    indice_codigo: '75',
    indice_descripcion: 'Cuadrilla Tipo',
    recurso_descripcion: `Cuadrilla ocupacional ${index + 1}`,
    salario_minimo: 3.8 + index,
    cantidad_hh: 10 + index,
    trabajo: 10 + index,
    costo_directo: 100 + index * 10,
    coeficiente_incidencia: 1 / 12,
  })),
};

const indices = [
  { id: 1, codigo: '75', descripcion: 'Cuadrilla Tipo' },
  { id: 2, codigo: '23', descripcion: 'Cemento Portland' },
  { id: 3, codigo: '90', descripcion: 'Equipo y maquinaria de Construc. vial' },
  { id: 4, codigo: '822', descripcion: 'Indice de precios al consumidor urbano' },
];

const vite = spawn(
  process.platform === 'win32' ? 'cmd.exe' : 'npm',
  process.platform === 'win32'
    ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)]
    : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)],
  { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
);

let viteOutput = '';
vite.stdout?.on('data', (chunk) => {
  viteOutput += chunk.toString();
});
vite.stderr?.on('data', (chunk) => {
  viteOutput += chunk.toString();
});

process.on('exit', () => {
  if (!vite.killed) vite.kill();
});
process.on('uncaughtException', (error) => {
  if (!vite.killed) vite.kill();
  console.error(error);
  process.exit(1);
});
process.on('unhandledRejection', (error) => {
  if (!vite.killed) vite.kill();
  console.error(error);
  process.exit(1);
});

try {
  await waitForServer(baseUrl, 40000);
} catch (error) {
  console.error(viteOutput.trim());
  if (!vite.killed) vite.kill();
  throw error;
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

await page.route('**/api/v1/presupuestos/**', async (route) => {
  await route.fulfill({ json: [{ id: 13, revision: undefined }] });
});
await page.route('**/api/v1/polinomica/indices-inec**', async (route) => {
  await route.fulfill({ json: indices });
});
await page.route('**/api/v1/polinomica/13/resources**', async (route) => {
  await route.fulfill({ json: resources });
});
await page.route('**/api/v1/polinomica/13', async (route) => {
  await route.fulfill({ json: formula });
});

await page.goto(`${baseUrl}/formula-responsive-harness.html`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('text=Fórmula Polinómica', { timeout: 15000 });
await page.waitForSelector('text=Recursos del presupuesto', { timeout: 15000 });
await page.waitForSelector('text=Coeficientes e índices', { timeout: 15000 });
await page.waitForSelector('[role="scrollbar"][aria-orientation="horizontal"]', { timeout: 15000 });

const result = await page.evaluate(() => {
  const rectOf = (node) => {
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return {
      top: Math.round(rect.top * 100) / 100,
      right: Math.round(rect.right * 100) / 100,
      bottom: Math.round(rect.bottom * 100) / 100,
      left: Math.round(rect.left * 100) / 100,
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100,
    };
  };

  const closestClipAncestor = (node) => {
    let current = node?.parentElement;
    while (current && current !== document.body) {
      const style = getComputedStyle(current);
      const overflow = `${style.overflow} ${style.overflowX} ${style.overflowY}`;
      if (/(hidden|clip|auto|scroll)/.test(overflow)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  };

  const horizontalBars = [...document.querySelectorAll('[role="scrollbar"][aria-orientation="horizontal"]')];
  const formulaCards = [...document.querySelectorAll('.rounded-\\[1\\.15rem\\]')]
    .filter((node) => node.textContent?.includes('Recursos del presupuesto') || node.textContent?.includes('Coeficientes e índices'))
    .map((node, index) => {
      const rect = rectOf(node);
      const clipAncestor = closestClipAncestor(node);
      const clipRect = rectOf(clipAncestor);
      return {
        index,
        rect,
        clipRect,
        className: typeof node.className === 'string' ? node.className : '',
        bottomClearanceInViewport: rect ? Math.round((window.innerHeight - rect.bottom) * 100) / 100 : null,
        bottomClearanceInClip: rect && clipRect ? Math.round((clipRect.bottom - rect.bottom) * 100) / 100 : null,
      };
    });
  const bars = horizontalBars.map((bar, index) => {
    const thumb = bar.querySelector('button') || bar.lastElementChild;
    const clipAncestor = closestClipAncestor(bar);
    const wrapper = bar.parentElement;
    const barRect = rectOf(bar);
    const thumbRect = rectOf(thumb);
    const wrapperRect = rectOf(wrapper);
    const clipRect = rectOf(clipAncestor);
    const computed = getComputedStyle(wrapper);
    return {
      index,
      barRect,
      thumbRect,
      wrapperRect,
      clipRect,
      wrapperOverflow: `${computed.overflow}/${computed.overflowX}/${computed.overflowY}`,
      wrapperClass: typeof wrapper?.className === 'string' ? wrapper.className : '',
      thumbInsideWrapper:
        Boolean(thumbRect && wrapperRect) &&
        thumbRect.top >= wrapperRect.top - 1 &&
        thumbRect.bottom <= wrapperRect.bottom + 1 &&
        thumbRect.left >= wrapperRect.left - 1 &&
        thumbRect.right <= wrapperRect.right + 1,
      thumbInsideClip:
        !clipRect ||
        (Boolean(thumbRect) &&
          thumbRect.top >= clipRect.top - 1 &&
          thumbRect.bottom <= clipRect.bottom + 1 &&
          thumbRect.left >= clipRect.left - 1 &&
          thumbRect.right <= clipRect.right + 1),
      bottomClearanceInWrapper: thumbRect && wrapperRect ? Math.round((wrapperRect.bottom - thumbRect.bottom) * 100) / 100 : null,
      bottomClearanceInClip: thumbRect && clipRect ? Math.round((clipRect.bottom - thumbRect.bottom) * 100) / 100 : null,
    };
  });

  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    horizontalBarCount: bars.length,
    formulaCards,
    bars,
  };
});

await browser.close();
vite.kill();

const checkedBars = result.bars.filter((bar) => /flex-1/.test(bar.wrapperClass));
const failures = checkedBars.filter(
  (bar) =>
    !bar.thumbInsideWrapper ||
    !bar.thumbInsideClip ||
    bar.bottomClearanceInWrapper === null ||
    bar.bottomClearanceInWrapper < 8,
);
const cardFailures = result.formulaCards.filter(
  (card) =>
    card.bottomClearanceInViewport === null ||
    card.bottomClearanceInViewport < 12 ||
    (card.bottomClearanceInClip !== null && card.bottomClearanceInClip < 8),
);

if (checkedBars.length < 2 || failures.length || cardFailures.length) {
  console.error(JSON.stringify(result, null, 2));
  console.error(`formula-scrollbar-geometry=failed checked=${checkedBars.length} failures=${failures.length} cardFailures=${cardFailures.length}`);
  process.exit(1);
}

console.log('formula-scrollbar-geometry=ok');
console.log(JSON.stringify(result, null, 2));
