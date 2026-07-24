import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';

const port = 4212;
const baseUrl = `http://127.0.0.1:${port}`;

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
  await waitForServer(baseUrl);
} catch (error) {
  cleanup();
  console.error(viteOutput.trim());
  throw error;
}

const company = {
  id: 77,
  nombre: 'Constructora Certificacion',
  alias: 'Constructora QA',
  ruc: '1799999999001',
  codigo: 'CERT',
  direccion: 'Av. Republica y Naciones Unidas',
  localidad: 'Quito',
  canton: 'Quito',
  provincia: 'Pichincha',
  pais: 'Ecuador',
  telefono: '+593 222222222',
  email: 'empresa@giproy.test',
  contacto_nombre: 'Administracion QA',
  contacto_email: 'admin@giproy.test',
  contacto_telefono: '+593 999999999',
  logo_url: '',
  activa: true,
  limite_administradores: 3,
  limite_usuarios: 12,
  total_administradores: 2,
  total_usuarios: 5,
  decimales_moneda: 2,
  decimales_calculos: 4,
  use_omniclass: false,
  marketplace_can_sell: true,
  session_timeout_minutes: 30,
  proy_prefijo: 'CERT',
  proy_periodo: '2026',
  proy_secuencial: 24,
  proy_secuencial_size: 5,
  plantillas_config: {},
};

const users = [
  { id: 1, email: 'admin@giproy.test', nombre_completo: 'Admin Empresa', rol: 'administrador', activo: true, empresa: company, empresa_id: 77 },
  { id: 2, email: 'colaborador@giproy.test', nombre_completo: 'Colaborador Empresa', rol: 'usuario', activo: true, empresa: company, empresa_id: 77 },
  { id: 3, email: 'bloqueado@giproy.test', nombre_completo: 'Usuario Bloqueado', rol: 'usuario_comunidad', activo: false, empresa: company, empresa_id: 77 },
];

const preflight = {
  exportable: true,
  empresa_id: 77,
  empresa_nombre: company.nombre,
  tables: { proyectos: 4, presupuestos: 7, usuarios: 3 },
  files: { total: 12, missing: 0 },
  warnings: [],
};

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
});

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
  { name: 'tablet-landscape', width: 1472, height: 820, touch: true },
  { name: 'tablet-portrait', width: 920, height: 1472, touch: true },
];

const results = [];

for (const viewport of viewports) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: Boolean(viewport.touch),
    isMobile: Boolean(viewport.touch),
    deviceScaleFactor: viewport.touch ? 2 : 1,
  });
  if (viewport.touch) {
    await page.addInitScript(() => window.localStorage.setItem('giproy_adaptive_ui_pilot', 'true'));
  }
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.route('**/api/v1/**', async (route) => route.fulfill({ json: {} }));
  await page.route('**/api/v1/empresas/77**', async (route) => route.fulfill({ json: company }));
  await page.route('**/api/v1/empresas/**', async (route) => route.fulfill({ json: [company] }));
  await page.route('**/api/v1/usuarios/**', async (route) => route.fulfill({ json: users }));
  await page.route('**/api/v1/paises/**', async (route) => route.fulfill({ json: [{ id: 1, nombre: 'Ecuador' }, { id: 2, nombre: 'Colombia' }] }));
  await page.route('**/api/v1/maestros/ecuador/provincias**', async (route) => route.fulfill({ json: ['Pichincha', 'Guayas'] }));
  await page.route('**/api/v1/maestros/ecuador/cantones/**', async (route) => route.fulfill({ json: ['Quito', 'Cayambe'] }));
  await page.route('**/api/v1/conecta/slots**', async (route) => route.fulfill({
    json: {
      limits: { total_slots: 3, used_slots: 1, available_slots: 2 },
      slots: [{ id: 10, status: 'active', assigned_at: '2026-06-20T10:00:00Z', user: users[1] }],
    },
  }));
  await page.route('**/api/v1/company-backups/preflight/export**', async (route) => route.fulfill({ json: preflight }));
  await page.route('**/api/v1/company-backups/internal-artifacts**', async (route) => route.fulfill({
    json: {
      items: [
        { id: 41, created_at: '2026-06-20T10:00:00Z', filename: 'auto-restore-41.giproybackup', backup_hash: 'sha256:qa', expires_at: '2026-07-20T10:00:00Z' },
      ],
    },
  }));
  await page.route('**/api/v1/company-backups/restore/cross-company-attempts**', async (route) => route.fulfill({
    json: {
      items: [
        { id: 8, requester_empresa_id: 77, requester_empresa_name: company.nombre, backup_empresa_id: 99, backup_empresa_name: 'Otra Empresa', attempts: 3, last_attempt_at: '2026-06-20T11:00:00Z' },
      ],
    },
  }));
  await page.route('**/api/v1/admin-config**', async (route) => route.fulfill({ json: { ECUADOR_API_KEY: { valor: 'masked' } } }));
  await page.route('**/api/v1/proyectos/**', async (route) => route.fulfill({ json: [] }));

  await page.goto(`${baseUrl}/settings-empresa-harness.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Settings', { timeout: 30000 });
  await page.waitForSelector('[data-settings-company-tabs="mi-empresa"]', { timeout: 30000 });
  await page.waitForTimeout(300);

  const readState = async (label) => page.evaluate((stateLabel) => {
    const visible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const visibleText = document.body.innerText;
    const textOverflowNodes = [...document.querySelectorAll('button, h1, h2, h3, p, span, label')]
      .filter(visible)
      .filter((node) => node.scrollWidth > node.clientWidth + 2)
      .map((node) => ({
        tag: node.tagName,
        text: (node.textContent || '').trim().slice(0, 80),
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
      }))
      .slice(0, 8);
    return {
      label: stateLabel,
      url: window.location.href,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      bodyScrollWidth: document.documentElement.scrollWidth,
      bodyClientWidth: document.documentElement.clientWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      hasSettingsEmpresa: visibleText.includes('Settings Empresa') || visibleText.includes('Settings'),
      hasAjustesGlobales: visibleText.includes('Ajustes Globales'),
      hasBim: /\bBIM\b/.test(visibleText),
      visibleTextLength: visibleText.length,
      textOverflowNodes,
      zones: {
        miEmpresaTabs: Boolean(document.querySelector('[data-settings-company-tabs="mi-empresa"]')),
        datos: Boolean(document.querySelector('[data-settings-company-zone="datos-empresa"]')),
        licencia: Boolean(document.querySelector('[data-settings-company-zone="licencia-conecta"]')),
        usuarios: Boolean(document.querySelector('[data-settings-company-zone="usuarios-empresa"]')),
        usuariosSummary: Boolean(document.querySelector('[data-settings-users-summary="empresa-activa"]')),
        usuariosTabs: Boolean(document.querySelector('[data-settings-users-tabs="empresa"]')),
        backup: Boolean(document.querySelector('[data-settings-company-zone="backup-restore-empresa"]')),
        backupTabs: Boolean(document.querySelector('[data-settings-backup-tabs="empresa"]')),
        preferencias: Boolean(document.querySelector('[data-settings-company-zone="preferencias-empresa"]')),
        codigos: Boolean(document.querySelector('[data-settings-company-zone="codigos-proyecto"]')),
        plantillas: Boolean(document.querySelector('[data-settings-company-zone="plantillas-informes"]')),
      },
    };
  }, label);

  const states = [];
  states.push(await readState('mi-empresa-datos'));

  await page.evaluate(() => {
    const buttons = document.querySelectorAll('[data-settings-company-tabs="mi-empresa"] button');
    buttons[1]?.click();
  });
  try {
    await page.waitForFunction(() => Boolean(document.querySelector('[data-settings-company-zone="licencia-conecta"]')), null, { timeout: 15000 });
  } catch (error) {
    const debug = await page.evaluate(() => ({
      tabButtons: [...document.querySelectorAll('[data-settings-company-tabs="mi-empresa"] button')].map((button) => ({
        text: button.textContent,
        className: button.className,
      })),
      hasDatos: Boolean(document.querySelector('[data-settings-company-zone="datos-empresa"]')),
      hasLicencia: Boolean(document.querySelector('[data-settings-company-zone="licencia-conecta"]')),
      bodyText: document.body.innerText.slice(0, 1200),
    }));
    throw new Error(`No cambio a Licencia y Conecta: ${JSON.stringify({ ...debug, consoleErrors })}`, { cause: error });
  }
  states.push(await readState('mi-empresa-licencia'));

  await page.getByRole('button', { name: /Gestión de Usuarios/i }).click();
  try {
    await page.waitForSelector('[data-settings-users-tabs="empresa"]', { timeout: 15000 });
  } catch (error) {
    const debug = await page.evaluate(() => ({
      hasUsuariosZone: Boolean(document.querySelector('[data-settings-company-zone="usuarios-empresa"]')),
      bodyText: document.body.innerText.slice(0, 1200),
    }));
    throw new Error(`No renderizo Usuarios Empresa: ${JSON.stringify({ ...debug, consoleErrors })}`, { cause: error });
  }
  states.push(await readState('usuarios'));

  await page.getByRole('button', { name: /Backup Empresa/i }).first().click();
  await page.waitForSelector('[data-settings-backup-tabs="empresa"]', { timeout: 15000 });
  await page.getByRole('button', { name: /^Restore Empresa$/i }).click();
  states.push(await readState('backup-restore'));

  await page.getByRole('button', { name: /^Preferencias$/i }).click();
  await page.waitForSelector('[data-settings-company-zone="preferencias-empresa"]', { timeout: 15000 });
  states.push(await readState('preferencias'));

  await page.getByRole('button', { name: /Códigos Proyecto/i }).click();
  await page.waitForSelector('[data-settings-company-zone="codigos-proyecto"]', { timeout: 15000 });
  states.push(await readState('codigos'));

  await page.getByRole('button', { name: /^Plantillas$/i }).click();
  await page.waitForSelector('[data-settings-company-zone="plantillas-informes"]', { timeout: 15000 });
  states.push(await readState('plantillas'));

  await page.screenshot({ path: `../tmp/settings-empresa-${viewport.name}.png`, fullPage: true });

  const failures = [];
  for (const state of states) {
    if (state.hasHorizontalOverflow) failures.push(`${viewport.name}/${state.label}: overflow horizontal ${state.bodyScrollWidth}/${state.bodyClientWidth}`);
    if (state.hasAjustesGlobales) failures.push(`${viewport.name}/${state.label}: reaparece Ajustes Globales`);
    if (state.hasBim) failures.push(`${viewport.name}/${state.label}: aparece BIM en Settings empresa`);
    if (state.textOverflowNodes.length > 0) failures.push(`${viewport.name}/${state.label}: textos con overflow ${JSON.stringify(state.textOverflowNodes)}`);
  }

  const mustHave = [
    ['mi-empresa-datos', 'miEmpresaTabs'],
    ['mi-empresa-datos', 'datos'],
    ['mi-empresa-licencia', 'licencia'],
    ['usuarios', 'usuarios'],
    ['usuarios', 'usuariosSummary'],
    ['usuarios', 'usuariosTabs'],
    ['backup-restore', 'backup'],
    ['backup-restore', 'backupTabs'],
    ['preferencias', 'preferencias'],
    ['codigos', 'codigos'],
    ['plantillas', 'plantillas'],
  ];
  for (const [label, zone] of mustHave) {
    const state = states.find((item) => item.label === label);
    if (!state?.zones?.[zone]) failures.push(`${viewport.name}/${label}: falta zona ${zone}`);
  }

  const relevantConsoleErrors = consoleErrors.filter((item) => !/Failed to load resource/i.test(item));
  if (relevantConsoleErrors.length > 0) failures.push(`${viewport.name}: errores consola ${JSON.stringify(relevantConsoleErrors.slice(0, 5))}`);

  results.push({ viewport: viewport.name, states, failures });
  await page.close();
}

await browser.close();
cleanup();

const failures = results.flatMap((result) => result.failures);
if (failures.length > 0) {
  throw new Error(`validate-settings-empresa-visual-dom fallo:\n${failures.join('\n')}`);
}

console.log(`validate-settings-empresa-visual-dom OK ${JSON.stringify(results.map((result) => ({
  viewport: result.viewport,
  states: result.states.map((state) => state.label),
})))}`);
