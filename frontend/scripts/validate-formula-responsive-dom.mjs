import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const baseUrl = 'http://127.0.0.1:4199';

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

const vite = spawn(
  process.platform === 'win32' ? 'cmd.exe' : 'npm',
  process.platform === 'win32'
    ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', '4199']
    : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4199'],
  { cwd: process.cwd(), env: { ...process.env, VITE_ADAPTIVE_UI_ENABLED: 'true' }, stdio: 'ignore', windowsHide: true },
);

process.on('exit', () => {
  if (!vite.killed) vite.kill();
});

await waitForServer(baseUrl);

const resources = Array.from({ length: 240 }, (_, index) => {
  const categories = [1, 2, 3, 4];
  const sc = categories[index % categories.length];
  return {
    recurso_id: index + 1,
    codigo: `R-${String(index + 1).padStart(4, '0')}`,
    descripcion: `Recurso de validacion responsive ${index + 1}`,
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

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
});
const requestedViewport = process.env.FORMULA_VIEWPORT === 'tablet-landscape'
  ? { width: 1472, height: 820 }
  : process.env.FORMULA_VIEWPORT === 'tablet-portrait'
    ? { width: 920, height: 1472 }
    : { width: 1920, height: 1080 };
const page = await browser.newPage({
  viewport: requestedViewport,
  isMobile: process.env.FORMULA_VIEWPORT?.startsWith('tablet') || false,
  hasTouch: process.env.FORMULA_VIEWPORT?.startsWith('tablet') || false,
  deviceScaleFactor: process.env.FORMULA_VIEWPORT?.startsWith('tablet') ? 2 : 1,
});
if (process.env.FORMULA_VIEWPORT?.startsWith('tablet')) {
}

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
await page.waitForSelector('text=Recurso de validacion responsive', { timeout: 15000 });
await page.waitForFunction(() => {
  const root = document.querySelector('#root > div > div');
  return root && getComputedStyle(root).display === 'flex';
}, { timeout: 15000 });

const result = await page.evaluate(() => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const visibleText = (text) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode;
    while (node) {
      if (node.textContent?.includes(text)) {
        const rect = node.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0 && rect.bottom <= viewport.height && rect.right <= viewport.width) {
          return true;
        }
      }
      node = walker.nextNode();
    }
    return false;
  };

  const harness = document.querySelector('#root > div');
  const root = document.querySelector('#root > div > div');
  const scrollables = [...document.querySelectorAll('*')].filter((node) => {
    const style = getComputedStyle(node);
    return /(auto|scroll)/.test(`${style.overflow}${style.overflowY}${style.overflowX}`) && node.scrollHeight > node.clientHeight;
  }).length;

  const harnessRect = harness?.getBoundingClientRect();
  const rootRect = root?.getBoundingClientRect();
  const workbench = document.querySelector('section');
  const undersizedAdaptiveTargets = [...document.querySelectorAll('[data-adaptive-touch-target="true"]')]
    .filter((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    })
    .map((node) => node.getBoundingClientRect())
    .filter((rect) => rect.width < 43.5 || rect.height < 43.5)
    .length;
  const scrollableDetails = [...document.querySelectorAll('*')]
    .map((node) => {
      const style = getComputedStyle(node);
      return {
        tag: node.tagName,
        className: typeof node.className === 'string' ? node.className : '',
        overflow: `${style.overflow}/${style.overflowY}/${style.overflowX}`,
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
      };
    })
    .filter((item) => /(auto|scroll)/.test(item.overflow) && item.scrollHeight > item.clientHeight)
    .slice(0, 6);
  return {
    viewport,
    titleVisible: visibleText('Fórmula Polinómica'),
    resourcesPanelVisible: visibleText('Recursos del presupuesto'),
    indicesPanelVisible: visibleText('Coeficientes e índices'),
    suggestedButtonVisible: visibleText('ASIGNAR SUGERIDOS'),
    formulaFooterVisible: visibleText('Fórmula Polinómica General'),
    rootRect: rootRect ? { top: rootRect.top, left: rootRect.left, bottom: rootRect.bottom, right: rootRect.right, width: rootRect.width, height: rootRect.height } : null,
    harnessRect: harnessRect ? { top: harnessRect.top, left: harnessRect.left, bottom: harnessRect.bottom, right: harnessRect.right, width: harnessRect.width, height: harnessRect.height } : null,
    rootClass: root?.className || '',
    rootComputed: root ? { height: getComputedStyle(root).height, display: getComputedStyle(root).display, overflow: getComputedStyle(root).overflow } : null,
    sectionClass: document.querySelector('section')?.className || '',
    workbenchClientHeight: workbench?.clientHeight || 0,
    pageHasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    undersizedAdaptiveTargets,
    rootFitsViewport: Boolean(rootRect && rootRect.top >= 0 && rootRect.left >= 0 && rootRect.bottom <= viewport.height && rootRect.right <= viewport.width),
    scrollables,
    scrollableDetails,
  };
});

await browser.close();
vite.kill();

const failures = Object.entries({
  titleVisible: result.titleVisible,
  resourcesPanelVisible: result.resourcesPanelVisible,
  indicesPanelVisible: result.indicesPanelVisible,
  suggestedButtonVisible: result.suggestedButtonVisible,
  formulaFooterVisible: result.formulaFooterVisible,
  rootFitsViewport: result.rootFitsViewport,
  workbenchHasUsableHeight: result.workbenchClientHeight >= 240,
  noPageHorizontalOverflow: !result.pageHasHorizontalOverflow,
  touchTargetsMeetMinimum: !process.env.FORMULA_VIEWPORT?.startsWith('tablet') || result.undersizedAdaptiveTargets === 0,
  hasInternalScrollables: result.scrollables >= 1,
}).filter(([, ok]) => !ok);

if (failures.length) {
  console.error(JSON.stringify(result, null, 2));
  console.error(`formula-responsive-dom=failed ${failures.map(([key]) => key).join(',')}`);
  process.exit(1);
}

console.log('formula-responsive-dom=ok');
console.log(JSON.stringify(result, null, 2));
