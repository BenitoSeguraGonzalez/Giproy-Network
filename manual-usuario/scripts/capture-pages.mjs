import { chromium } from '../../frontend/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const manualRoot = path.resolve(scriptDir, '..');
const repositoryRoot = path.resolve(manualRoot, '..');
const backendRoot = path.join(repositoryRoot, 'backend');
const frontendUrl = process.env.GIPROY_FRONTEND_URL || 'http://localhost:3010';
const apiOverrideUrl = process.env.GIPROY_CAPTURE_API_URL?.replace(/\/$/, '');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromiumPath = 'C:\\Users\\dream\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1223\\chrome-headless-shell-win64\\chrome-headless-shell.exe';
const browser = process.env.GIPROY_CAPTURE_CDP_URL
  ? await chromium.connectOverCDP(process.env.GIPROY_CAPTURE_CDP_URL)
  : await chromium.launch({
    headless: true,
    executablePath: process.env.GIPROY_CAPTURE_BROWSER === 'edge' ? edgePath : chromiumPath,
  });
const context = browser.contexts()[0] || await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.setViewportSize({ width: 1920, height: 1080 });
const debugStep = (message) => {
  if (process.env.GIPROY_CAPTURE_DEBUG === '1') {
    process.stderr.write(`[captura] ${message}\n`);
  }
};

if (apiOverrideUrl) {
  await page.route('**/api/v1/**', async (route) => {
    try {
      const sourceUrl = new URL(route.request().url());
      const targetUrl = new URL(`${sourceUrl.pathname}${sourceUrl.search}`, apiOverrideUrl);
      const response = await route.fetch({ url: targetUrl.toString(), timeout: 120_000 });
      await route.fulfill({ response });
    } catch {
      // No propagar el error de Playwright: su diagnóstico incluye todas las
      // cabeceras de la petición y podría revelar el token técnico.
      await route.abort('failed').catch(() => {});
    }
  });
}
if (['1', '2'].includes(process.env.GIPROY_CAPTURE_DEBUG)) {
  page.on('requestfailed', (request) => {
    process.stderr.write(`REQUEST FAILED ${request.method()} ${request.url()} ${request.failure()?.errorText || ''}\n`);
  });
  page.on('response', async (response) => {
    if (response.status() < 400) return;
    const url = response.url();
    if (!url.includes('/api/v1/')) return;
    let body = '';
    try {
      body = (await response.text()).replace(/\s+/g, ' ').slice(0, 800);
    } catch {
      body = '<cuerpo no disponible>';
    }
    process.stderr.write(`HTTP ${response.status()} ${response.request().method()} ${url} ${body}\n`);
  });
  page.on('pageerror', (error) => {
    process.stderr.write(`PAGE ERROR ${error.message}\n`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') process.stderr.write(`CONSOLE ERROR ${message.text()}\n`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400 || process.env.GIPROY_CAPTURE_DEBUG === '2') {
      process.stderr.write(`HTTP ${response.status()} ${response.url()}\n`);
    }
  });
}

if (process.env.GIPROY_CAPTURE_SKIP_PUBLIC !== '1') {
  await page.goto(`${frontendUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  // Esta etiqueta funciona también como comprobación de identidad: un puerto
  // ocupado por otra aplicación no puede sobrescribir imágenes válidas.
  await page.getByLabel(/terminal de acceso/i).waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(manualRoot, 'assets', 'capturas', 'inicio-sesion-completa.png'),
    fullPage: false,
  });

  await page.getByRole('button', { name: /crear cuenta/i }).click();
  await page.waitForTimeout(350);
  await page.screenshot({
    path: path.join(manualRoot, 'assets', 'capturas', 'crear-cuenta.png'),
    fullPage: false,
  });

  await page.goto(`${frontendUrl}/forgot-password`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(manualRoot, 'assets', 'capturas', 'recuperar-contrasena.png'),
    fullPage: false,
  });
}

// Las capturas internas deben entrar por el formulario normal. Las credenciales
// solo se leen de variables del proceso y nunca se escriben ni se imprimen.
// No se fabrican tokens ni se modifica current_session_id en la base de datos.
const captureEmail = process.env.GIPROY_CAPTURE_EMAIL;
const capturePassword = process.env.GIPROY_CAPTURE_PASSWORD;
const allowSessionInjection = process.env.GIPROY_CAPTURE_ALLOW_SESSION_INJECTION === '1';
if (Boolean(captureEmail) !== Boolean(capturePassword)) {
  throw new Error('Defina juntas GIPROY_CAPTURE_EMAIL y GIPROY_CAPTURE_PASSWORD.');
}

let temporarySessionId = null;
let clearTemporarySession = null;
let authenticated = false;

if (captureEmail && capturePassword) {
  await page.goto(`${frontendUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.getByLabel(/terminal de acceso/i).fill(captureEmail);
  await page.getByRole('button', { name: /^continuar$/i }).click();
  await page.getByLabel(/clave de seguridad/i).waitFor({ state: 'visible', timeout: 30_000 });
  await page.getByLabel(/clave de seguridad/i).fill(capturePassword);
  await page.getByRole('button', { name: /acceder al sistema/i }).click();
  await page.waitForURL((url) => url.pathname !== '/login', { timeout: 60_000 });
  authenticated = true;
} else if (allowSessionInjection) {
  // Modo local sobre la cuenta técnica exclusiva del manual. La operación es
  // atómica y nunca selecciona ni modifica a una persona real.
  const pythonPath = path.join(repositoryRoot, '.venv', 'Scripts', 'python.exe');
  const sessionOutput = execFileSync(
    pythonPath,
    [
      '-c',
      [
        'from app.core.database import SessionLocal',
        'from app.core.security import create_access_token',
        'from app.models.usuario import Usuario',
        'import uuid',
        'from datetime import datetime, timezone',
        'd=SessionLocal()',
        "u=d.query(Usuario).filter(Usuario.empresa_id==3, Usuario.email=='manual.capture@giproy.invalid', Usuario.activo==True).with_for_update().first()",
        "assert u is not None, 'No existe la cuenta técnica del manual'",
        "assert not u.current_session_id, 'Captura abortada: el usuario ya tiene una sesión activa'",
        "sid='manual-captura-'+str(uuid.uuid4())",
        'u.current_session_id=sid',
        'u.current_session_started_at=datetime.now(timezone.utc)',
        'u.last_active_at=datetime.now(timezone.utc)',
        'd.commit()',
        "print(sid+'\\n'+create_access_token(u.id, session_id=sid))",
        'd.close()',
      ].join(';'),
    ],
    { cwd: backendRoot, encoding: 'utf8' },
  ).trim().split(/\r?\n/);
  const [sessionId, token] = sessionOutput;
  temporarySessionId = sessionId;
  clearTemporarySession = () => execFileSync(
    pythonPath,
    [
      '-c',
      [
        'from app.core.database import SessionLocal',
        'from app.models.usuario import Usuario',
        'import sys',
        'd=SessionLocal()',
        "u=d.query(Usuario).filter(Usuario.empresa_id==3, Usuario.email=='manual.capture@giproy.invalid', Usuario.activo==True).with_for_update().first()",
        'sid=sys.argv[1]',
        'u.current_session_id=None if u and u.current_session_id==sid else u.current_session_id',
        'd.commit()',
        'd.close()',
      ].join(';'),
      temporarySessionId,
    ],
    { cwd: backendRoot, stdio: 'ignore' },
  );
  process.once('exit', () => {
    try {
      clearTemporarySession?.();
    } catch {
      // La próxima ejecución también verifica la sesión técnica antes de usarla.
    }
  });
  await page.addInitScript((accessToken) => {
    localStorage.setItem('giproy_token', accessToken);
    sessionStorage.setItem('giproy_login_session_id', String(Date.now()));
  }, token);
  authenticated = true;
}

const internalCaptures = [
  ['inicio-empresa', '/dashboard', 'Consola de Operaciones'],
  ['proyectos-portafolio-cargado', '/proyectos', 'Proyecto Prueba Compartir 1'],
  ['proyectos-kanban', '/proyectos', 'Proyecto Prueba Compartir 1'],
  ['proyectos-filtros', '/proyectos', 'Proyecto Prueba Compartir 1'],
  ['proyectos-calendario', '/proyectos', 'Proyecto Prueba Compartir 1'],
  ['proyectos-revisiones', '/proyectos', 'Proyecto Prueba Compartir 1'],
  ['proyectos-nuevo-modal', '/proyectos', 'Proyecto Prueba Compartir 1'],
  ['proyectos-papelera-modal', '/proyectos', 'Proyecto Prueba Compartir 1'],
  ['proyecto-datos', '/proyectos?project_id=7&tab=datos', 'Proyecto Prueba Compartir 1'],
  ['proyecto-stakeholders', '/proyectos?project_id=7&tab=stakeholders', 'Proyecto Prueba Compartir 1'],
  ['proyecto-edo', '/proyectos?project_id=7&tab=edo_obs', 'Proyecto Prueba Compartir 1'],
  ['proyecto-edt', '/proyectos?project_id=7&tab=edt_wbs', 'Proyecto Prueba Compartir 1'],
  ['proyecto-presupuesto', '/proyectos?project_id=7&tab=presupuesto', 'Proyecto Prueba Compartir 1'],
  ['proyecto-presupuesto-editar-apu', '/proyectos?project_id=7&tab=presupuesto', 'Proyecto Prueba Compartir 1'],
  ['proyecto-presupuesto-eliminar-linea', '/proyectos?project_id=7&tab=presupuesto', 'Proyecto Prueba Compartir 1'],
  ['proyecto-presupuesto-indirectos', '/proyectos?project_id=7&tab=presupuesto', 'Proyecto Prueba Compartir 1'],
  ['proyecto-presupuesto-pareto', '/proyectos?project_id=7&tab=presupuesto', 'Proyecto Prueba Compartir 1'],
  ['proyecto-presupuesto-reportes', '/proyectos?project_id=7&tab=presupuesto', 'Proyecto Prueba Compartir 1'],
  ['proyecto-cronogramas', '/proyectos?project_id=7&tab=cronogramas', 'Proyecto Prueba Compartir 1'],
  ['proyecto-cronograma-configuracion', '/proyectos?project_id=7&tab=cronogramas', 'Proyecto Prueba Compartir 1'],
  ['proyecto-cronograma-calendario', '/proyectos?project_id=7&tab=cronogramas', 'Proyecto Prueba Compartir 1'],
  ['proyecto-cronograma-pareto', '/proyectos?project_id=7&tab=cronogramas', 'Proyecto Prueba Compartir 1'],
  ['proyecto-cronograma-dependencia', '/proyectos?project_id=7&tab=cronogramas', 'Proyecto Prueba Compartir 1'],
  ['proyecto-cronograma-historial', '/proyectos?project_id=7&tab=cronogramas', 'Proyecto Prueba Compartir 1'],
  ['proyecto-cronograma-valorado', '/proyectos?project_id=7&tab=cronogramas', 'Proyecto Prueba Compartir 1'],
  ['proyecto-cronograma-recursos', '/proyectos?project_id=7&tab=cronogramas', 'Proyecto Prueba Compartir 1'],
  ['proyecto-desagregacion', '/proyectos?project_id=7&tab=desagregacion', 'Proyecto Prueba Compartir 1'],
  ['proyecto-formula', '/proyectos?project_id=7&tab=formula', 'Proyecto Prueba Compartir 1'],
  ['proyecto-bim', '/proyectos?project_id=7&tab=bim', 'Proyecto Prueba Compartir 1'],
  ['proyecto-bim-visor', '/proyectos?project_id=7&tab=bim', 'Proyecto Prueba Compartir 1'],
  ['proyecto-bim-coordinacion', '/proyectos?project_id=7&tab=bim', 'Proyecto Prueba Compartir 1'],
  ['proyecto-bim-planificacion', '/proyectos?project_id=7&tab=bim', 'Proyecto Prueba Compartir 1'],
  ['proyecto-bim-produccion', '/proyectos?project_id=7&tab=bim', 'Proyecto Prueba Compartir 1'],
  ['proyecto-bim-campo', '/proyectos?project_id=7&tab=bim', 'Proyecto Prueba Compartir 1'],
  ['proyecto-bim-entrega', '/proyectos?project_id=7&tab=bim', 'Proyecto Prueba Compartir 1'],
  ['proyecto-bim-informes', '/proyectos?project_id=7&tab=bim', 'Proyecto Prueba Compartir 1'],
  ['proyecto-bim-admin-importar', '/proyectos?project_id=7&tab=bim', 'Proyecto Prueba Compartir 1'],
  ['proyecto-bim-admin-versiones', '/proyectos?project_id=7&tab=bim', 'Proyecto Prueba Compartir 1'],
  ['proyecto-bim-admin-federacion', '/proyectos?project_id=7&tab=bim', 'Proyecto Prueba Compartir 1'],
  ['proyecto-bim-admin-ubicacion', '/proyectos?project_id=7&tab=bim', 'Proyecto Prueba Compartir 1'],
  ['proyecto-bim-admin-calidad', '/proyectos?project_id=7&tab=bim', 'Proyecto Prueba Compartir 1'],
  ['gestor-proyecto', '/proyectos/gestor?project_id=7', 'Equipos de Trabajo'],
  ['precios-unitarios', '/precios-unitarios', 'Precios Unitarios'],
  ['bases-trabajo', '/precios-unitarios/bases', 'Bases de Trabajo'],
  ['bases-nueva-modal', '/precios-unitarios/bases', 'Bases de Trabajo'],
  ['bases-papelera-modal', '/precios-unitarios/bases', 'Bases de Trabajo'],
  ['bases-editar-modal', '/precios-unitarios/bases', 'Bases de Trabajo'],
  ['bases-clonar-modal', '/precios-unitarios/bases', 'Bases de Trabajo'],
  ['bases-historial-completo', '/precios-unitarios/bases', 'Bases de Trabajo'],
  ['bases-sincronizacion-completa', '/precios-unitarios/bases', 'Bases de Trabajo'],
  ['subcategorias', '/precios-unitarios/subcategorias', 'Subcategorías'],
  ['subcategorias-nueva-modal', '/precios-unitarios/subcategorias', 'Subcategorías'],
  ['subcategorias-editar-modal', '/precios-unitarios/subcategorias', 'Subcategorías'],
  ['subcategorias-importar-modal', '/precios-unitarios/subcategorias', 'Subcategorías'],
  ['subcategorias-borrado-masivo-modal', '/precios-unitarios/subcategorias', 'Subcategorías'],
  ['recursos', '/recursos', 'Banco de Recursos'],
  ['recursos-nuevo-modal', '/recursos', 'Banco de Recursos'],
  ['recursos-editar-modal', '/recursos', 'Banco de Recursos'],
  ['recursos-importar-modal', '/recursos', 'Banco de Recursos'],
  ['recursos-indice-global', '/recursos', 'Banco de Recursos'],
  ['recursos-borrado-masivo-modal', '/recursos', 'Banco de Recursos'],
  ['recursos-cpc-masivo-modal', '/recursos', 'Banco de Recursos'],
  ['apus', '/apus', 'Costo Directo'],
  ['apus-nuevo-editor', '/apus', 'Costo Directo'],
  ['apus-mamposteria-editor', '/apus', 'Costo Directo'],
  ['apus-unidad-modal', '/apus', 'Costo Directo'],
  ['apus-importar-modal', '/apus', 'Costo Directo'],
  ['apus-importar-base-modal', '/apus', 'Costo Directo'],
  ['apus-importar-base-paso-2', '/apus', 'Costo Directo'],
  ['apus-importar-conflictos-modal', '/apus', 'Costo Directo'],
  ['apus-borrado-masivo-modal', '/apus', 'Costo Directo'],
  ['apus-reporte-modal', '/apus', 'Costo Directo'],
  ['presupuestos-proyecto', '/proyectos/7/presupuestos', 'Presupuestos'],
  ['servicios', '/servicios', 'Otros Servicios'],
  ['comunidad', '/servicios/comunidad', 'Comunidad'],
  ['envios-transferencias', '/servicios/envios-transferencias', 'Envios y Transferencias'],
  ['marketplace', '/marketplace', 'Marketplace'],
  ['ajustes-empresa', '/settings', 'Settings Empresa'],
];
const requestedCapture = process.env.GIPROY_CAPTURE_ONLY;
const capturesToRun = authenticated
  ? (requestedCapture
    ? internalCaptures.filter(([name]) => name === requestedCapture)
    : internalCaptures)
  : [];

const ensureProjectBaseIsActive = async () => {
  debugStep('Comprobando base activa');
  if (new URL(page.url()).origin !== new URL(frontendUrl).origin) {
    await page.goto(`${frontendUrl}/dashboard`, { waitUntil: 'commit', timeout: 60_000 });
    await page.waitForURL((url) => url.origin === new URL(frontendUrl).origin, {
      timeout: 60_000,
    });
  }
  const activeBase = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('giproy_working_base') || 'null');
    } catch {
      return null;
    }
  });
  if (Number(activeBase?.id) === 34) return;
  // Selección local de solo lectura para la cuenta técnica. Evita ejecutar el
  // endpoint activate y no modifica la base ni el contexto de personas reales.
  await page.evaluate((base) => {
    localStorage.setItem('giproy_working_base', JSON.stringify(base));
    localStorage.removeItem('giproy_working_project');
  }, {
    id: 34,
    codigo_unico: 'BT-2026-002',
    nombre: 'Base: Proyecto Prueba Compartir 1',
    tipo: 'Base de Proyecto',
    descripcion: 'Base automática para el proyecto Proyecto Prueba Compartir 1',
    porcentaje_indirectos: 21,
    activa: true,
    tipo_rendimiento: 'Rendimiento Unitario (Tiempo/Unidad)',
    unidad_tiempo: 'Hora',
    pais_id: 30,
    moneda: 'Dólar estadounidense',
    empresa_id: 3,
    source_base_id: 32,
  });
  debugStep('Contexto local de la base del proyecto preparado');
};

const captureActions = {
  'ajustes-empresa': async () => {
    // La ficha inicial contiene teléfono, correo e identificación fiscal reales.
    // La evidencia pública del manual usa Preferencias para demostrar la
    // estructura de Ajustes sin exponer datos personales innecesarios.
    await page.locator('button, [role="button"], a').evaluateAll((controls) => {
      const target = controls.find((control) => control.textContent
        ?.trim()
        .toLocaleLowerCase('es')
        .includes('preferencias'));
      if (!target) throw new Error('No se encontró el acceso a Preferencias.');
      target.click();
    });
    await page.getByText(/preferencias/i).last().waitFor({ state: 'visible' });
    // La interfaz actualiza varios paneles en paralelo. Esperar una ventana
    // estable impide validar antes de que una respuesta tardía muestre un error.
    await page.waitForTimeout(process.env.GIPROY_CAPTURE_DEBUG ? 15_000 : 2_500);
  },
  'proyecto-datos': async () => {
    if (process.env.GIPROY_CAPTURE_DEBUG === '1') {
      await page.waitForTimeout(5000);
      await page.screenshot({
        path: path.join(manualRoot, '.diagnostico-proyecto.png'),
        fullPage: false,
      });
    }
    await page.getByText(
      /información técnica, contractual y geográfica común del proyecto/i,
    ).first().waitFor({
      state: 'visible',
      timeout: 60_000,
    });
  },
  'proyecto-stakeholders': async () => {
    await page.getByText('Stakeholders', { exact: true }).first().waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
    // El manual puede publicarse en Internet. Se conserva la estructura real
    // de la pantalla, pero se anonimizan nombres y datos de contacto de prueba.
    await page.evaluate(() => {
      const replacements = new Map([
        ['Santiago Bermeo Quinde', 'Responsable de ejemplo 1'],
        ['Jesús Benito Segura', 'Responsable de ejemplo 2'],
        ['santibq81@msn.com', 'correo1@ejemplo.com'],
        ['benito.segura@gmail.com', 'correo2@ejemplo.com'],
        ['+593984487622', '+000 000 000 001'],
        ['+593 96 416 64 46', '+000 000 000 002'],
      ]);
      for (const element of document.querySelectorAll('body *')) {
        if (element.children.length === 0 && replacements.has(element.textContent?.trim())) {
          element.textContent = replacements.get(element.textContent.trim());
        }
      }
    });
  },
  'proyecto-edo': async () => {
    await page.getByText('Estructura de Organización EDO', { exact: true }).first().waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
  },
  'proyecto-edt': async () => {
    await page.getByText('Estructura de Desglose EDT', { exact: true }).first().waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
  },
  'proyecto-presupuesto': async () => {
    await page.getByText('Presupuesto', { exact: true }).first().waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
  },
  'proyecto-presupuesto-editar-apu': async () => {
    await page.getByText('Presupuesto', { exact: true }).first().waitFor({ state: 'visible' });
    const line = page.getByText('Replanteo y nivelación', { exact: true })
      .locator('xpath=ancestor::*[@data-apu-line-id][1]').first();
    await line.waitFor({ state: 'visible' });
    await line.getByTitle('Editar APU', { exact: true }).click();
    await page.getByTitle('Cerrar editor APU', { exact: true }).waitFor({ state: 'visible' });
    await page.getByText('Costo Directo', { exact: true }).waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
  },
  'proyecto-presupuesto-eliminar-linea': async () => {
    await page.getByText('Presupuesto', { exact: true }).first().waitFor({ state: 'visible' });
    const line = page.getByText('Replanteo y nivelación', { exact: true })
      .locator('xpath=ancestor::*[@data-apu-line-id][1]').first();
    await line.waitFor({ state: 'visible' });
    await line.getByTitle('Eliminar Linea', { exact: true }).click();
    await page.getByText('Eliminar línea', { exact: true }).waitFor({ state: 'visible' });
    await page.waitForTimeout(500);
  },
  'proyecto-presupuesto-indirectos': async () => {
    await page.getByText('Presupuesto', { exact: true }).first().waitFor({ state: 'visible' });
    await page.getByTitle(/Indirectos e IVA/i).click();
    await page.getByText('Indirectos e IVA de Proyecto / Revisión', { exact: true }).waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
  },
  'proyecto-presupuesto-pareto': async () => {
    await page.getByText('Presupuesto', { exact: true }).first().waitFor({ state: 'visible' });
    await page.getByTitle('Pareto', { exact: true }).click();
    await page.getByText('Pareto', { exact: true }).last().waitFor({ state: 'visible' });
    await page.getByText(/cargando/i).waitFor({ state: 'hidden', timeout: 120_000 }).catch(() => {});
    await page.waitForTimeout(1000);
  },
  'proyecto-presupuesto-reportes': async () => {
    await page.getByText('Presupuesto', { exact: true }).first().waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Reporte de presupuesto', exact: true }).click();
    await page.getByText('Presupuesto + APUs', { exact: true }).waitFor({ state: 'visible' });
    await page.waitForTimeout(500);
  },
  'proyecto-cronogramas': async () => {
    await page.getByText(/planificación temporal, secuencia y distribución del proyecto/i).first().waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
  },
  'proyecto-cronograma-configuracion': async () => {
    await page.getByText(/planificación temporal, secuencia y distribución del proyecto/i).first().waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Herramientas del Gantt', exact: true }).click();
    await page.getByRole('button', { name: 'Configuración', exact: true }).click();
    await page.getByText('Configuración de Gantt', { exact: true }).waitFor({ state: 'visible' });
    await page.waitForTimeout(800);
  },
  'proyecto-cronograma-calendario': async () => {
    await page.getByText(/planificación temporal, secuencia y distribución del proyecto/i).first().waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Herramientas del Gantt', exact: true }).click();
    await page.getByRole('button', { name: 'Configuración', exact: true }).click();
    await page.getByRole('button', { name: 'Abrir calendario laboral', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Calendario laboral del proyecto', exact: true });
    await dialog.waitFor({ state: 'visible' });
    await dialog.evaluate((element) => {
      element.dataset.manualCaptureTarget = 'true';
      document.documentElement.style.height = 'auto';
      document.body.style.height = 'auto';
      document.body.style.overflow = 'visible';
      const overlay = element.parentElement;
      if (overlay) {
        overlay.style.position = 'absolute';
        overlay.style.inset = '0 auto auto 0';
        overlay.style.width = '100%';
        overlay.style.height = 'auto';
        overlay.style.alignItems = 'flex-start';
      }
      element.style.height = 'auto';
      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';
      element.querySelectorAll('*').forEach((child) => {
        const style = window.getComputedStyle(child);
        if (/(auto|scroll|hidden)/.test(`${style.overflow}${style.overflowY}`)) {
          child.style.height = 'auto';
          child.style.maxHeight = 'none';
          child.style.overflow = 'visible';
          child.style.overflowY = 'visible';
        }
      });
    });
    await page.waitForTimeout(800);
  },
  'proyecto-cronograma-pareto': async () => {
    await page.setViewportSize({ width: 1920, height: 1400 });
    await page.getByText(/planificación temporal, secuencia y distribución del proyecto/i).first().waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Abrir Pareto del Gantt', exact: true }).click();
    await page.getByText('Pareto temporal', { exact: true }).waitFor({ state: 'visible' });
    await page.getByText('Cargando Pareto temporal...', { exact: true }).waitFor({
      state: 'hidden',
      timeout: 120_000,
    }).catch(() => {});
    await page.getByText('Pareto temporal', { exact: true }).evaluate((heading) => {
      const overlay = heading.closest('.fixed');
      const modal = overlay?.firstElementChild;
      if (!modal) throw new Error('No se encontró la ventana de Pareto temporal.');
      modal.setAttribute('data-manual-capture-target', 'true');
    });
    await page.waitForTimeout(1500);
  },
  'proyecto-cronograma-dependencia': async () => {
    await page.getByText(/planificación temporal, secuencia y distribución del proyecto/i).first().waitFor({ state: 'visible' });
    await page.getByTitle('Abrir menú de tarea', { exact: true }).first().click();
    await page.getByText('Acciones rápidas', { exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Crear dependencia', exact: true }).click();
    await page.getByText('Dependencia', { exact: true }).waitFor({ state: 'visible' });
    await page.getByTitle('Cerrar creador de dependencia', { exact: true }).evaluate((button) => {
      button.closest('[data-gantt-no-pan="true"]')?.setAttribute('data-manual-capture-target', 'true');
    });
    await page.waitForTimeout(800);
  },
  'proyecto-cronograma-historial': async () => {
    await page.getByText(/planificación temporal, secuencia y distribución del proyecto/i).first().waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Herramientas del Gantt', exact: true }).click();
    await page.getByRole('button', { name: 'Historial', exact: true }).click();
    await page.getByText('Historial confirmado', { exact: true }).waitFor({ state: 'visible' });
    await page.waitForTimeout(800);
  },
  'proyecto-cronograma-valorado': async () => {
    await page.getByText(/planificación temporal, secuencia y distribución del proyecto/i).first().waitFor({ state: 'visible' });
    const tab = page.getByRole('tab', { name: 'Valorado', exact: true });
    await tab.click();
    await tab.waitFor({ state: 'visible' });
    await page.waitForTimeout(2500);
  },
  'proyecto-cronograma-recursos': async () => {
    await page.getByText(/planificación temporal, secuencia y distribución del proyecto/i).first().waitFor({ state: 'visible' });
    const tab = page.getByRole('tab', { name: 'Recursos', exact: true });
    await tab.click();
    await tab.waitFor({ state: 'visible' });
    await page.waitForTimeout(2500);
  },
  'proyecto-desagregacion': async () => {
    await page.getByText(/lectura tecnológica y vae del presupuesto operativo/i).first().waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
  },
  'proyecto-formula': async () => {
    await page.getByText(/índices, cuadrilla tipo y fórmula general alineados con el método delphi/i).first().waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);
  },
  'proyecto-bim': async () => {
    await page.getByText('Modelos y versiones', { exact: true }).first().waitFor({
      state: 'visible',
      timeout: 60_000,
    });
    await page.waitForTimeout(2500);
  },
  'proyecto-bim-visor': async () => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const viewerHeading = page.getByText(/escena tridimensional aislada/i).first();
    await viewerHeading.waitFor({ state: 'visible', timeout: 60_000 });
    await page.waitForTimeout(2500);
    await viewerHeading.evaluate((heading) => {
      const captureTarget = heading.closest('.min-h-\\[360px\\]');
      captureTarget?.setAttribute('data-manual-bim-viewer', 'true');
      let container = heading.parentElement;
      while (container && container !== document.body) {
        const style = window.getComputedStyle(container);
        if (
          /(auto|scroll)/.test(style.overflowY)
          && container.scrollHeight > container.clientHeight
        ) {
          container.scrollTop += heading.getBoundingClientRect().top - 310;
          return;
        }
        container = container.parentElement;
      }
      window.scrollBy(0, heading.getBoundingClientRect().top - 310);
    });
    await page.waitForTimeout(600);
  },
  'proyecto-bim-coordinacion': async () => {
    await page.getByRole('button', { name: 'Coordinación', exact: true }).click();
    await page.locator('[data-bim-active-workspace="coordination"]').waitFor({ state: 'visible' });
    await page.waitForTimeout(2500);
  },
  'proyecto-bim-planificacion': async () => {
    await page.getByRole('button', { name: 'Planificación 4D', exact: true }).click();
    await page.locator('[data-bim-active-workspace="planning"]').waitFor({ state: 'visible' });
    await page.waitForTimeout(2500);
  },
  'proyecto-bim-produccion': async () => {
    await page.getByRole('button', { name: 'Producción', exact: true }).click();
    await page.locator('[data-bim-active-workspace="production"]').waitFor({ state: 'visible' });
    await page.waitForTimeout(2500);
  },
  'proyecto-bim-campo': async () => {
    await page.getByRole('button', { name: 'Campo', exact: true }).click();
    await page.locator('[data-bim-active-workspace="field"]').waitFor({ state: 'visible' });
    await page.waitForTimeout(2500);
  },
  'proyecto-bim-entrega': async () => {
    await page.getByRole('button', { name: 'Entrega', exact: true }).click();
    await page.locator('[data-bim-active-workspace="handover"]').waitFor({ state: 'visible' });
    await page.waitForTimeout(2500);
  },
  'proyecto-bim-informes': async () => {
    await page.getByRole('button', { name: 'Informes', exact: true }).click();
    await page.locator('[data-bim-active-workspace="reports"]').waitFor({ state: 'visible' });
    await page.waitForTimeout(2500);
  },
  'proyecto-bim-admin-importar': async () => {
    await page.getByRole('button', { name: 'Cargar modelo IFC', exact: true }).click();
    await page.locator('[data-bim-import-jobs]').waitFor({ state: 'visible' });
    await page.waitForTimeout(2500);
  },
  'proyecto-bim-admin-versiones': async () => {
    await page.getByRole('button', { name: 'Abrir administración BIM', exact: true }).click();
    await page.getByRole('tab', { name: 'Modelos y versiones', exact: true }).click();
    await page.getByPlaceholder('Buscar versión BIM por modelo, disciplina u origen').waitFor({ state: 'visible' });
    await page.waitForTimeout(2500);
  },
  'proyecto-bim-admin-federacion': async () => {
    await page.getByRole('button', { name: 'Abrir administración BIM', exact: true }).click();
    await page.getByRole('tab', { name: 'Federación', exact: true }).click();
    await page.locator('[data-bim-admin-region]').waitFor({ state: 'visible' });
    await page.waitForTimeout(2500);
  },
  'proyecto-bim-admin-ubicacion': async () => {
    await page.getByRole('button', { name: 'Abrir administración BIM', exact: true }).click();
    await page.getByRole('tab', { name: 'Ubicación', exact: true }).click();
    await page.locator('[data-bim-site-georeference]').waitFor({ state: 'visible' });
    await page.waitForTimeout(2500);
  },
  'proyecto-bim-admin-calidad': async () => {
    await page.getByRole('button', { name: 'Abrir administración BIM', exact: true }).click();
    await page.getByRole('tab', { name: 'Calidad', exact: true }).click();
    await page.locator('[data-bim-ifc-quality-report]').waitFor({ state: 'visible' });
    await page.waitForTimeout(2500);
  },
  'proyectos-nuevo-modal': async () => {
    await page.locator('button').evaluateAll((buttons) => {
      const normalize = (value) => String(value || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLocaleLowerCase('es')
        .trim();
      const button = buttons.find((candidate) => {
        const identity = normalize([
          candidate.innerText,
          candidate.title,
          candidate.getAttribute('aria-label'),
        ].filter(Boolean).join(' '));
        return identity.includes('nuevo proyecto') || identity.includes('limite alcanzado');
      });
      if (!button) throw new Error('No se encontró el botón de alta de proyecto.');
      // La empresa de prueba alcanzó su cupo. Para documentar el formulario sin
      // crear datos, se habilita únicamente este botón en el DOM de la sesión técnica.
      button.disabled = false;
      button.click();
    });
    await page.getByText('Nuevo Proyecto', { exact: true }).waitFor({ state: 'visible' });
  },
  'proyectos-kanban': async () => {
    await page.getByRole('tab', { name: 'Kanban', exact: true }).click();
    await page.waitForTimeout(1500);
  },
  'proyectos-filtros': async () => {
    await page.getByTitle('Filtros', { exact: true }).click();
    await page.getByText('Filtrar portafolio', { exact: true }).waitFor({ state: 'visible' });
  },
  'proyectos-calendario': async () => {
    await page.getByTitle('Calendario del portafolio', { exact: true }).click();
    await page.getByText('Calendario del portafolio', { exact: true }).waitFor({ state: 'visible' });
    await page.waitForTimeout(1500);
  },
  'proyectos-revisiones': async () => {
    const row = page.getByText('Proyecto Prueba Compartir 1', { exact: true }).first().locator('xpath=ancestor::tr[1]');
    await row.locator('button').first().click();
    await page.getByText(/Historial de revisiones/).waitFor({ state: 'visible' });
    await page.waitForTimeout(1200);
  },
  'proyectos-papelera-modal': async () => {
    await page.locator('button').evaluateAll((buttons) => {
      const button = buttons.find((candidate) => [
        candidate.innerText,
        candidate.title,
        candidate.getAttribute('aria-label'),
      ].filter(Boolean).join(' ').toLocaleLowerCase('es').includes('papelera'));
      if (!button) throw new Error('No se encontró el acceso a la papelera de proyectos.');
      button.click();
    });
    await page.getByText('Papelera de proyectos', { exact: true }).waitFor({ state: 'visible' });
  },
  'bases-nueva-modal': async () => {
    await page.getByRole('button', { name: /nueva base/i }).click();
    await page.getByText('Nueva Base Maestra', { exact: true }).waitFor({ state: 'visible' });
  },
  'bases-papelera-modal': async () => {
    await page.getByRole('button', { name: /papelera/i }).click();
    await page.getByText('Papelera de bases', { exact: true }).waitFor({ state: 'visible' });
  },
  'bases-editar-modal': async () => {
    await page.getByTitle('Editar', { exact: true }).last().click();
    await page.getByText('Configuración de Base', { exact: true }).waitFor({ state: 'visible' });
  },
  'bases-clonar-modal': async () => {
    await page.getByTitle('Clonar', { exact: true }).last().click();
    await page.getByText('Clonar Base', { exact: true }).waitFor({ state: 'visible' });
  },
  'bases-historial-completo': async () => {
    await page.setViewportSize({ width: 1920, height: 1400 });
    await page.getByTitle('Ver historial de sincronización', { exact: true }).last().click();
    await page.getByText('Historial de sincronización', { exact: true }).waitFor({ state: 'visible' });
  },
  'bases-sincronizacion-completa': async () => {
    await page.setViewportSize({ width: 1920, height: 1400 });
    await page.getByTitle('Sincronizar faltantes desde base maestra', { exact: true }).last().click();
    await page.getByText('Sincronizar base de proyecto', { exact: true }).waitFor({
      state: 'visible',
      timeout: 60_000,
    });
  },
  'subcategorias-nueva-modal': async () => {
    await page.getByRole('button', { name: /nueva subcategoría/i }).click();
    await page.getByText('Nueva subcategoría', { exact: true }).waitFor({ state: 'visible' });
  },
  'subcategorias-editar-modal': async () => {
    const row = page.getByText('HERRAMIENTA MENOR / EQUIPO LIVIANO PARA OBRAS CIVILES', {
      exact: true,
    }).locator('xpath=ancestor::div[contains(@class,"group")][1]');
    await row.getByTitle('Editar').click();
    await page.getByText('Editar subcategoría', { exact: true }).waitFor({ state: 'visible' });
  },
  'subcategorias-importar-modal': async () => {
    await page.getByRole('button', { name: /^importar$/i }).click();
    await page.getByText('Importar subcategorías', { exact: true }).waitFor({ state: 'visible' });
  },
  'subcategorias-borrado-masivo-modal': async () => {
    await page.getByLabel('Seleccionar subcategoría', { exact: true }).first().click();
    await page.getByTitle('Borrar seleccionados', { exact: true }).click();
    await page.getByText('¿Borrar subcategorías seleccionadas?', { exact: true }).waitFor({
      state: 'visible',
    });
  },
  'recursos-nuevo-modal': async () => {
    await page.getByRole('button', { name: /nuevo recurso/i }).click();
    await page.getByText(/nuevo recurso/i, { exact: false }).last().waitFor({ state: 'visible' });
  },
  'recursos-editar-modal': async () => {
    await page.getByText('Equipo de topografía', { exact: true }).dblclick();
    await page.getByText('Modificar Recurso', { exact: true }).waitFor({ state: 'visible' });
  },
  'recursos-importar-modal': async () => {
    await page.getByRole('button', { name: /^importar$/i }).click();
    await page.getByText('Importación Masiva de Recursos', { exact: true }).waitFor({ state: 'visible' });
  },
  'recursos-indice-global': async () => {
    const search = page.getByPlaceholder('Buscar recurso en todo el maestro...');
    await search.fill('cemento');
    await page.getByText(/coincidencias globales/i, { exact: false }).waitFor({
      state: 'visible',
      timeout: 60_000,
    });
  },
  'recursos-borrado-masivo-modal': async () => {
    await page.getByLabel('Seleccionar recurso', { exact: true }).first().click();
    await page.getByRole('button', { name: /borrar \(1\)/i }).click();
    await page.getByText('¿Borrar recursos seleccionados?', { exact: true }).waitFor({
      state: 'visible',
    });
  },
  'recursos-cpc-masivo-modal': async () => {
    const selectors = page.getByLabel('Seleccionar recurso', { exact: true });
    await selectors.nth(0).click();
    await selectors.nth(1).click();
    await page.getByTitle('Asignar CPC a 2 recursos seleccionados', { exact: true }).first().click();
    await page.getByText('Asignar CPC', { exact: true }).waitFor({ state: 'visible' });
  },
  'apus-nuevo-editor': async () => {
    await page.getByRole('button', { name: /nuevo apu/i }).click();
    await page.getByText(/editar apu/i, { exact: false }).first().waitFor({ state: 'visible' });
  },
  'apus-mamposteria-editor': async () => {
    await page.getByText('MAMPOSTERÍAS', { exact: true }).click();
    const apuName = page.getByText(
      'Mampostería de ladrillo ancho 15 cm con mortero 1:3',
      { exact: true },
    );
    await apuName.waitFor({ state: 'visible', timeout: 60_000 });
    await apuName.dblclick();
    await page.getByText(/editar apu/i, { exact: false }).first().waitFor({ state: 'visible' });
    await page.getByText('Total de Partida', { exact: true }).waitFor({ state: 'visible' });
  },
  'apus-unidad-modal': async () => {
    await page.getByRole('button', { name: /nuevo apu/i }).click();
    await page.getByRole('button', { name: /crear nueva/i }).click();
    await page.getByText('Nueva Unidad para APUs', { exact: true }).waitFor({ state: 'visible' });
  },
  'apus-importar-modal': async () => {
    await page.getByRole('button', { name: /^importar$/i }).click();
    await page.getByText('Importar APUs en Bloque', { exact: true }).waitFor({ state: 'visible' });
  },
  'apus-importar-base-modal': async () => {
    await page.getByRole('button', { name: /base ext\./i }).click();
    await page.getByText('Importar desde Base', { exact: true }).waitFor({ state: 'visible' });
  },
  'apus-importar-base-paso-2': async () => {
    await page.getByRole('button', { name: /base ext\./i }).click();
    await page.getByText('Importar desde Base', { exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('button').filter({ hasText: /BASE VIVIENDA CON LOSA/i }).click();
    await page.getByText(/Paso 2 de 2/i, { exact: false }).waitFor({
      state: 'visible',
      timeout: 60_000,
    });
  },
  'apus-importar-conflictos-modal': async () => {
    await page.getByRole('button', { name: /base ext\./i }).click();
    await page.getByText('Importar desde Base', { exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('button').filter({ hasText: /BASE VIVIENDA CON LOSA/i }).click();
    await page.getByText(/Paso 2 de 2/i, { exact: false }).waitFor({
      state: 'visible',
      timeout: 60_000,
    });
    await page.getByText('Replanteo y nivelación', { exact: true }).last().click();
    await page.getByTitle('Importar selección', { exact: true }).click();
    await page.getByText('Conflictos de Importación', { exact: true }).waitFor({
      state: 'visible',
      timeout: 60_000,
    });
  },
  'apus-borrado-masivo-modal': async () => {
    await page.getByLabel('Seleccionar APU', { exact: true }).first().click();
    await page.getByTitle('Borrar seleccionados', { exact: true }).click();
    await page.getByText('¿Borrar APUs seleccionados?', { exact: true }).waitFor({
      state: 'visible',
    });
  },
  'apus-reporte-modal': async () => {
    await page.getByText('Replanteo y nivelación', { exact: true }).click();
    await page.getByRole('button', { name: /reportes \(1\)/i }).click();
    await page.getByText(/elemento\(s\) seleccionado\(s\)/i, { exact: false }).waitFor({
      state: 'visible',
      timeout: 60_000,
    });
    await page.setViewportSize({ width: 1920, height: 1400 });
    await page.getByText(/elemento\(s\) seleccionado\(s\)/i, { exact: false }).evaluate((subtitle) => {
      let overlay = subtitle;
      while (overlay?.parentElement && window.getComputedStyle(overlay).position !== 'fixed') {
        overlay = overlay.parentElement;
      }
      if (!overlay || window.getComputedStyle(overlay).position !== 'fixed') {
        throw new Error('No se encontró la capa del visor de reportes.');
      }

      document.documentElement.style.height = 'auto';
      document.body.style.height = 'auto';
      document.body.style.overflow = 'visible';
      overlay.style.position = 'absolute';
      overlay.style.inset = '0 auto auto 0';
      overlay.style.width = '100%';
      overlay.style.height = 'auto';
      overlay.style.minHeight = '100vh';
      overlay.style.alignItems = 'flex-start';
      overlay.style.paddingTop = '24px';
      overlay.style.paddingBottom = '24px';

      const modal = subtitle.closest('[class*="max-h-"]') || subtitle.parentElement?.parentElement;
      if (modal) {
        modal.dataset.manualCaptureTarget = 'true';
        modal.style.maxHeight = 'none';
        modal.style.height = 'auto';
        modal.style.overflow = 'visible';
      }
      overlay.querySelectorAll('[class*="max-h-[70dvh]"]').forEach((element) => {
        element.style.maxHeight = 'none';
        element.style.height = 'auto';
        element.style.overflow = 'visible';
      });
    });
    await page.waitForTimeout(250);
  },
};

const fullPageCaptures = new Set(['apus-reporte-modal']);
const targetedCaptures = new Set([
  'proyecto-cronograma-pareto',
  'proyecto-cronograma-dependencia',
]);

try {
  for (const [name, route, requiredText] of capturesToRun) {
    debugStep(`Inicio de ${name}`);
    if (
      name.startsWith('subcategorias-')
      || name.startsWith('recursos-')
      || name.startsWith('apus-')
    ) {
      await ensureProjectBaseIsActive();
    }
    await page.goto(`${frontendUrl}${route}`, { waitUntil: 'commit', timeout: 60_000 });
    debugStep(`Ruta abierta para ${name}`);
    await page.getByText(requiredText, { exact: false }).first().waitFor({
      state: 'visible',
      timeout: 120_000,
    });
    if (captureActions[name]) {
      debugStep(`Abriendo estado o ventana de ${name}`);
      await captureActions[name]();
      debugStep(`Estado o ventana visible para ${name}`);
    }
    await page.waitForTimeout(800);
    const screenState = await page.evaluate(() => ({
      text: document.body.innerText.toLocaleLowerCase('es'),
      pathname: window.location.pathname,
      visibleProgress: [...document.querySelectorAll(
        '[role="progressbar"], [aria-busy="true"], .animate-spin',
      )].some((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && Number(style.opacity || 1) !== 0
          && rect.width > 0
          && rect.height > 0;
      }),
    }));
    const expectedPathname = new URL(route, frontendUrl).pathname;
    const visibleFailurePattern = /no se (?:pudo|pudieron) cargar|error interno del servidor|internal server error|request failed|failed to fetch/i;
    if (
      /\bcargando\b/i.test(screenState.text)
      || visibleFailurePattern.test(screenState.text)
      || screenState.visibleProgress
      || screenState.text.includes('terminal de acceso / email')
      || screenState.pathname === '/login'
      || screenState.pathname !== expectedPathname
    ) {
      throw new Error(`Captura rechazada para ${name}: ${JSON.stringify({
        expectedPathname,
        actualPathname: screenState.pathname,
        containsLoadingText: /\bcargando\b/i.test(screenState.text),
        containsFailureText: visibleFailurePattern.test(screenState.text),
        visibleProgress: screenState.visibleProgress,
        loginVisible: screenState.text.includes('terminal de acceso / email'),
      })}`);
    }
    if (name === 'apus-reporte-modal') {
      const clippedReportAreas = await page.locator('[class*="max-h-[70dvh]"]').evaluateAll(
        (elements) => elements.filter(
          (element) => element.scrollHeight > element.clientHeight + 2,
        ).length,
      );
      if (clippedReportAreas > 0) {
        throw new Error(`Captura rechazada para ${name}: el informe conserva ${clippedReportAreas} área(s) internas cortadas.`);
      }
    }
    const screenshotPath = path.join(manualRoot, 'assets', 'capturas', `${name}.png`);
    if (targetedCaptures.has(name) && await page.locator('[data-manual-capture-target="true"]').count()) {
      await page.locator('[data-manual-capture-target="true"]').screenshot({
        path: screenshotPath,
      });
    } else if (name === 'proyecto-bim-visor') {
      await page.locator('[data-manual-bim-viewer="true"]').screenshot({
        path: screenshotPath,
      });
    } else {
      await page.screenshot({
        path: screenshotPath,
        fullPage: fullPageCaptures.has(name),
      });
    }
    debugStep(`Archivo escrito para ${name}`);
  }

  await page.goto(`file:///${path.join(manualRoot, 'index.html').replaceAll('\\', '/')}`, { waitUntil: 'load' });
  await page.screenshot({
    path: path.join(manualRoot, 'assets', 'capturas', 'manual-portada.png'),
    fullPage: false,
  });
} finally {
  debugStep('Cerrando navegador y sesión técnica');
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
  clearTemporarySession?.();
}
