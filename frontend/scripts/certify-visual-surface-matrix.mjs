import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const frontendRoot = path.resolve(import.meta.dirname, '..');
const inventoryPath = path.resolve(frontendRoot, '..', 'docs', 'architecture', 'visual-surface-inventory.json');
const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
const requestedProfiles = process.argv.filter((value) => value.startsWith('--profile=')).map((value) => value.slice(10));
const requestedSurfaces = process.argv.filter((value) => value.startsWith('--surface=')).map((value) => value.slice(10));
const excludedSurfaces = process.argv.filter((value) => value.startsWith('--exclude=')).map((value) => value.slice(10));
const profiles = requestedProfiles.length ? inventory.profiles.filter(({ id }) => requestedProfiles.includes(id)) : inventory.profiles;
const selectedHarnesses = requestedSurfaces.length
    ? inventory.harnesses.filter(({ source, id }) => requestedSurfaces.some((term) => source.includes(term) || id === term))
    : inventory.harnesses;
const harnesses = selectedHarnesses.filter(({ source, id }) => !excludedSurfaces.some((term) => source.includes(term) || id === term));
assert.ok(profiles.length, 'No se seleccionaron perfiles visuales validos.');
assert.ok(harnesses.length, 'No se seleccionaron superficies visuales validas.');

const port = Number(process.env.VISUAL_CERT_PORT || 4260);
const baseUrl = `http://127.0.0.1:${port}`;
const runId = process.env.VISUAL_CERT_RUN_ID || new Date().toISOString().replace(/[:.]/gu, '-');
const artifactRoot = path.resolve(frontendRoot, '..', 'artifacts', 'visual-certification', runId);
await mkdir(artifactRoot, { recursive: true });

const vite = spawn(
    process.platform === 'win32' ? 'cmd.exe' : 'npm',
    process.platform === 'win32'
        ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)]
        : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)],
    {
        cwd: frontendRoot,
        env: { ...process.env, VITE_ADAPTIVE_UI_ENABLED: 'true' },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
    },
);
let viteOutput = '';
vite.stdout?.on('data', (chunk) => { viteOutput += chunk.toString(); });
vite.stderr?.on('data', (chunk) => { viteOutput += chunk.toString(); });
const cleanup = () => {
    if (vite.killed) return;
    if (process.platform === 'win32' && vite.pid) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
    else vite.kill();
};

const waitForServer = async () => {
    const deadline = Date.now() + 40000;
    while (Date.now() < deadline) {
        try { if ((await fetch(baseUrl)).ok) return; } catch { /* retry */ }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`Vite no respondio. ${viteOutput.slice(-2000)}`);
};

const androidUserAgent = 'Mozilla/5.0 (Linux; Android 14; Lenovo TB370FU) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 OPR/89.0.0.0';
const report = {
    schemaVersion: 1,
    runId,
    adaptiveBuildFlag: true,
    inventory: path.relative(path.resolve(frontendRoot, '..'), inventoryPath).split(path.sep).join('/'),
    requested: { profiles: profiles.map(({ id }) => id), surfaces: harnesses.map(({ id }) => id) },
    results: [],
};

let browser;
try {
    await waitForServer();
    browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    });
    for (const profile of profiles) {
        const profileDirectory = path.join(artifactRoot, profile.id);
        await mkdir(profileDirectory, { recursive: true });
        const [width, height] = profile.viewport;
        const context = await browser.newContext({
            viewport: { width, height },
            screen: { width, height },
            deviceScaleFactor: profile.dpr,
            hasTouch: profile.touch,
            isMobile: profile.touch,
            ...(profile.touch ? { userAgent: androidUserAgent } : {}),
        });
        for (const harness of harnesses) {
            const page = await context.newPage();
            const runtimeErrors = [];
            page.on('pageerror', (error) => runtimeErrors.push(error.message));
            page.on('console', (message) => {
                if (message.type() === 'error' && !/favicon|404/u.test(message.text())) runtimeErrors.push(message.text());
            });
            await page.route('**/api/v1/**', (route) => {
                const url = new URL(route.request().url());
                const apiPath = url.pathname;
                const projects = Array.from({ length: 12 }, (_, index) => ({
                    id: index + 1,
                    codigo: `SB-${String(index + 1).padStart(3, '0')}`,
                    codigo_root: `SB-${String(index + 1).padStart(3, '0')}`,
                    nombre: `Proyecto Santiago Bermeo ${index + 1}`,
                    descripcion: `Proyecto representativo de validacion visual ${index + 1}`,
                    empresa_id: 7,
                    estado: index % 3 === 0 ? 'En ejecución' : 'Planificación',
                    presupuesto_estimado: 125000 + index * 31750,
                    num_revisiones: index % 4 === 0 ? 2 : 1,
                    revision: 0,
                    moneda: 'USD',
                    updated_at: `2026-07-${String(24 - index).padStart(2, '0')}T12:00:00Z`,
                }));
                if (harness.source === 'classic-project-workspace-header-harness.html'
                    || harness.source === 'classic-project-workspace-navigation-harness.html') {
                    projects[0].nombre = 'Proyecto Santiago Bermeo — Complejo hospitalario interdisciplinario de alcance regional';
                }
                const collaborators = Array.from({ length: 14 }, (_, index) => ({
                    id: 501 + index,
                    nombre_completo: `Colaborador Santiago ${String(index + 1).padStart(2, '0')}`,
                    email: `colaborador${index + 1}@santiago.test`,
                    rol: 'usuario',
                }));
                const stakeholders = Array.from({ length: 14 }, (_, index) => ({
                    id: 701 + index,
                    codigo: `STK-${String(index + 1).padStart(3, '0')}`,
                    nombre: index === 0 ? 'María Fernanda' : `Responsable ${index + 1}`,
                    apellidos: index === 0 ? 'Santiago Bermeo de nombre institucional extenso' : 'Santiago Bermeo',
                    email: `stakeholder${index + 1}@santiago.test`,
                    movil: `+593 99 000 ${String(index + 1).padStart(4, '0')}`,
                    profesion: index % 2 ? 'Ingeniería civil' : 'Dirección de proyectos',
                    institucion: `Institución técnica regional Santiago ${index + 1}`,
                    pais: 'Ecuador',
                    provincia: 'Pichincha',
                    canton: 'Quito',
                    ciudad: 'Quito',
                    direccion_detalle: `Avenida del proyecto ${index + 1}`,
                    proyecto_codigo_root: 'SB-001',
                }));
                const edtParticipant = (id, parentId, index) => ({
                    id,
                    codigo: `EDT-P-${String(index).padStart(2, '0')}`,
                    nombre: '',
                    definicion: '',
                    parent_id: parentId,
                    orden: index,
                    nivel: 3,
                    tipo_nodo: 'STAKEHOLDER',
                    stakeholder_id: 700 + index,
                    rol_id: 801,
                    actividades_claves: 'Coordinación técnica, validación documental y seguimiento interdisciplinario del paquete de trabajo.',
                    stakeholder: stakeholders[(index - 1) % stakeholders.length],
                    rol: { id: 801, nombre: 'Responsable técnico' },
                    hijos: [],
                });
                const edtTree = Array.from({ length: 9 }, (_, index) => {
                    const rootId = 900 + index;
                    const childId = 1000 + index;
                    return {
                        id: rootId,
                        codigo: `EDT-${String(index + 1).padStart(2, '0')}`,
                        nombre: `Cuenta de control constructiva Santiago Bermeo ${index + 1} con denominación extensa`,
                        definicion: 'Alcance técnico completo, entregables verificables y criterios de aceptación de la cuenta de control.',
                        parent_id: null,
                        orden: index + 1,
                        nivel: 1,
                        tipo_nodo: 'CUENTA_PAQUETE',
                        hijos: [{
                            id: childId,
                            codigo: `EDT-${index + 1}.1`,
                            nombre: `Paquete especializado interdisciplinario ${index + 1}`,
                            definicion: 'Paquete de segundo nivel para comprobar profundidad, sangría y navegación táctil.',
                            parent_id: rootId,
                            orden: 1,
                            nivel: 2,
                            tipo_nodo: 'CUENTA_PAQUETE',
                            hijos: [
                                edtParticipant(1100 + index, childId, index + 1),
                                {
                                    id: 1200 + index,
                                    codigo: `EDT-${index + 1}.1.2`,
                                    nombre: `Subpaquete profundo ${index + 1}`,
                                    definicion: 'Tercer nivel de profundidad de la EDT.',
                                    parent_id: childId,
                                    orden: 2,
                                    nivel: 3,
                                    tipo_nodo: 'CUENTA_PAQUETE',
                                    hijos: [edtParticipant(1300 + index, 1200 + index, index + 2)],
                                },
                            ],
                        }],
                    };
                });
                const edoResponsible = (id, parentId, index) => ({
                    id,
                    codigo: `EDO-R-${String(index).padStart(2, '0')}`,
                    nombre: '',
                    parent_id: parentId,
                    orden: index,
                    nivel: 3,
                    tipo_nodo: 'STAKEHOLDER',
                    stakeholder_id: 700 + index,
                    rol_id: 802,
                    actividades_claves: 'Gobernanza, coordinación interdisciplinaria y seguimiento de decisiones del hito organizacional.',
                    stakeholder: stakeholders[(index - 1) % stakeholders.length],
                    rol: { id: 802, nombre: 'Coordinación de proyecto' },
                    hijos: [],
                });
                const edoTree = Array.from({ length: 9 }, (_, index) => {
                    const rootId = 1400 + index;
                    const childId = 1500 + index;
                    return {
                        id: rootId,
                        codigo: `EDO-${String(index + 1).padStart(2, '0')}`,
                        nombre: `Hito organizacional Santiago Bermeo ${index + 1} con denominación institucional extensa`,
                        parent_id: null,
                        orden: index + 1,
                        nivel: 1,
                        tipo_nodo: 'HITO',
                        hijos: [{
                            id: childId,
                            codigo: `EDO-${index + 1}.1`,
                            nombre: `Subhito de coordinación interdisciplinaria ${index + 1}`,
                            parent_id: rootId,
                            orden: 1,
                            nivel: 2,
                            tipo_nodo: 'HITO',
                            hijos: [
                                edoResponsible(1600 + index, childId, index + 1),
                                {
                                    id: 1700 + index,
                                    codigo: `EDO-${index + 1}.1.2`,
                                    nombre: `Nivel organizacional profundo ${index + 1}`,
                                    parent_id: childId,
                                    orden: 2,
                                    nivel: 3,
                                    tipo_nodo: 'HITO',
                                    hijos: [edoResponsible(1800 + index, 1700 + index, index + 2)],
                                },
                            ],
                        }],
                    };
                });
                const budgetLines = edtTree.flatMap((root, rootIndex) => {
                    const account = {
                        id: 2000 + rootIndex,
                        edt_id: root.id,
                        codigo_item: root.codigo,
                        descripcion: root.nombre,
                        tipo: 'CUENTA_PAQUETE',
                        cantidad: 1,
                        precio_unitario: 0,
                        precio_total: 0,
                        orden: rootIndex,
                    };
                    const operational = Array.from({ length: 7 }, (_, lineIndex) => {
                        const price = 925 + (rootIndex * 175) + (lineIndex * 83.25);
                        const quantity = 1.25 + (lineIndex * 0.75);
                        return {
                            id: 2100 + (rootIndex * 10) + lineIndex,
                            edt_id: root.id,
                            apu_id: 3000 + (rootIndex * 10) + lineIndex,
                            codigo_item: `${root.codigo}.${lineIndex + 1}`,
                            descripcion: `Partida técnica interdisciplinaria ${lineIndex + 1} de ${root.nombre}`,
                            tipo: 'APU',
                            unidad: lineIndex % 3 === 0 ? 'm³' : lineIndex % 3 === 1 ? 'm²' : 'und',
                            cantidad: quantity,
                            precio_unitario: price,
                            precio_total: Number((price * quantity).toFixed(2)),
                            orden: lineIndex + 1,
                            tanteo_activo: lineIndex === 2,
                            omniclass_codigo: `23-${String(rootIndex + 1).padStart(2, '0')}-${String(lineIndex + 1).padStart(2, '0')}`,
                            omniclass_titulo: 'Elemento constructivo especializado',
                        };
                    });
                    return [account, ...operational];
                });
                const budgetSubtotal = budgetLines.reduce((total, line) => total + Number(line.precio_total || 0), 0);
                const budget = {
                    id: 501,
                    proyecto_id: 1,
                    codigo: 'PTO-SB-001-R03',
                    nombre: 'Presupuesto operativo Complejo hospitalario Santiago Bermeo',
                    revision: 3,
                    moneda: 'USD',
                    dec_moneda: 2,
                    dec_calculos: 4,
                    iva_aplicado: 15,
                    indirectos_porcentaje: 12.5,
                    subtotal: Number(budgetSubtotal.toFixed(2)),
                    indirectos_total: Number((budgetSubtotal * 0.125).toFixed(2)),
                    impuestos: Number((budgetSubtotal * 1.125 * 0.15).toFixed(2)),
                    total: Number((budgetSubtotal * 1.125 * 1.15).toFixed(2)),
                    proyecto: {
                        ...projects[0],
                        id: 1,
                        base_trabajo_id: 19,
                        revision: 3,
                    },
                    detalle: budgetLines,
                };
                const budgetCatalogSubcategories = Array.from({ length: 6 }, (_, index) => ({
                    id: 4000 + index,
                    codigo: `5.${String(index + 1).padStart(2, '0')}`,
                    descripcion: `Especialidad constructiva Santiago ${index + 1}`,
                    subcategoria_codigo: 5,
                }));
                const budgetCatalogApus = Array.from({ length: 42 }, (_, index) => ({
                    id: 5000 + index,
                    codigo: `APU-${String(index + 1).padStart(3, '0')}`,
                    descripcion: `Análisis de precio unitario especializado ${index + 1} con descripción técnica extensa`,
                    unidad: index % 3 === 0 ? 'm³' : index % 3 === 1 ? 'm²' : 'und',
                    precio_unitario: 480 + (index * 37.5),
                    subcategoria_item_id: budgetCatalogSubcategories[index % budgetCatalogSubcategories.length].id,
                    content_origin: index % 4 === 0 ? 'inherited' : 'local',
                    sync_status: index % 11 === 0 ? 'diverged' : 'synced',
                }));
                let body = [];
                if (/\/presupuestos\/501\/indirectos\/?$/u.test(apiPath)) {
                    body = {
                        subtotal_directo: budgetSubtotal,
                        indirectos_porcentaje: 12.5,
                        indirectos_total: budgetSubtotal * 0.125,
                        iva_aplicado: 15,
                        impuestos: budgetSubtotal * 1.125 * 0.15,
                        total: budgetSubtotal * 1.125 * 1.15,
                        items: [
                            { id: 1, concepto_codigo: 'base:6', concepto_id: 6, categoria_codigo: '1.2', nombre: 'Gastos técnicos generales', porcentaje: 3.5, observaciones: 'Coordinación técnica y supervisión interdisciplinaria.', fijo: true, usuario: false },
                            { id: 2, concepto_codigo: 'base:16', concepto_id: 16, categoria_codigo: '1.4', nombre: 'Gastos administrativos generales', porcentaje: 2.75, observaciones: 'Operación administrativa de obra.', fijo: true, usuario: false },
                            { id: 3, concepto_codigo: 'base:60', concepto_id: 60, categoria_codigo: '4.3', nombre: 'Garantía de fiel cumplimiento', porcentaje: 1.5, observaciones: '', fijo: true, usuario: false },
                            { id: 4, concepto_codigo: 'base:84', concepto_id: 84, categoria_codigo: '6.1', nombre: 'Utilidad', porcentaje: 4.75, observaciones: 'Margen contractual previsto.', fijo: true, usuario: false },
                        ],
                    };
                }
                else if (/\/presupuestos\/501\/pareto\/?$/u.test(apiPath)) {
                    let accumulated = 0;
                    const items = budgetLines.filter((line) => line.apu_id).slice(0, 20).map((line, index) => {
                        const percentage = Math.max(1.25, 16 - (index * 0.72));
                        accumulated = Math.min(100, accumulated + percentage);
                        return {
                            id: line.id,
                            ranking: index + 1,
                            codigo: line.codigo_item,
                            descripcion: line.descripcion,
                            valor: line.precio_total,
                            porcentaje: percentage,
                            porcentaje_acumulado: accumulated,
                            item_type: 'linea',
                            edt_id: line.edt_id,
                            linea_id: line.id,
                        };
                    });
                    body = {
                        total: budget.total,
                        visible_items: items.length,
                        visible_acumulado: accumulated,
                        items,
                    };
                }
                else if (/\/presupuestos\/501\/notas\/generales\/?$/u.test(apiPath)) {
                    body = Array.from({ length: 9 }, (_, index) => ({
                        id: 6000 + index,
                        texto: `Observación técnica ${index + 1} del presupuesto para coordinación y seguimiento de alcance.`,
                        autor_usuario_id: index % 2 ? 2 : 1,
                        autor_nombre: index % 2 ? 'Dirección de obra' : 'QA Visual',
                        created_at: `2026-07-${String(24 - index).padStart(2, '0')}T13:00:00Z`,
                    }));
                }
                else if (/\/presupuestos\/lineas\/\d+\/notas\/opened\/?$/u.test(apiPath)) body = { ok: true };
                else if (/\/presupuestos\/lineas\/\d+\/notas\/?$/u.test(apiPath)) {
                    body = Array.from({ length: 6 }, (_, index) => ({
                        id: 6500 + index,
                        texto: `Nota de seguimiento ${index + 1} de la partida seleccionada y su coordinación técnica.`,
                        autor_usuario_id: index % 2 ? 2 : 1,
                        autor_nombre: index % 2 ? 'Dirección de obra' : 'QA Visual',
                        created_at: `2026-07-${String(24 - index).padStart(2, '0')}T13:00:00Z`,
                    }));
                }
                else if (/\/apus\/\d+\/?$/u.test(apiPath)) {
                    body = {
                        id: 3000,
                        codigo: 'APU-001',
                        descripcion: 'Partida técnica interdisciplinaria de hormigón estructural',
                        unidad: 'm³',
                        unidad_id: 1,
                        precio_unitario_total: 925,
                        costo_directo: 850,
                        porcentaje_indirectos: 12.5,
                        subcategoria_item_id: 4000,
                        subcategoria_item: { id: 4000, subcategoria_codigo: 5, descripcion: 'Estructuras' },
                        lineas: Array.from({ length: 12 }, (_, index) => ({
                            id: 7000 + index,
                            recurso_id: 7100 + index,
                            cantidad: 1 + (index * 0.25),
                            rendimiento: 1,
                            recurso: {
                                id: 7100 + index,
                                codigo: `REC-${String(index + 1).padStart(3, '0')}`,
                                descripcion: `Recurso técnico especializado ${index + 1}`,
                                unidad: index % 2 ? 'h' : 'kg',
                                precio: 12.5 + (index * 4.25),
                                categoria_id: (index % 4) + 1,
                                subcategoria_item_id: 4000 + (index % 4),
                            },
                        })),
                    };
                }
                else if (/\/recursos\/unidades\/?$/u.test(apiPath)) body = [
                    { id: 1, codigo: 'm3', descripcion: 'm³' },
                    { id: 2, codigo: 'm2', descripcion: 'm²' },
                    { id: 3, codigo: 'und', descripcion: 'und' },
                ];
                else if (/\/recursos\/?$/u.test(apiPath)) {
                    body = Array.from({ length: 32 }, (_, index) => ({
                        id: 7100 + index,
                        codigo: `REC-${String(index + 1).padStart(3, '0')}`,
                        descripcion: `Recurso técnico especializado ${index + 1}`,
                        unidad: index % 2 ? 'h' : 'kg',
                        precio: 12.5 + (index * 4.25),
                        categoria_id: (index % 4) + 1,
                        subcategoria_item_id: 4000 + (index % 4),
                    }));
                }
                else if (/\/presupuestos\/501\/notas\/summary\/?$/u.test(apiPath)) {
                    body = {
                        general_total: 4,
                        general_nuevas: 1,
                        lineas: {
                            2100: { total: 3, nuevas: 1 },
                            2112: { total: 2, nuevas: 0 },
                        },
                        last_opened_at: '2026-07-24T13:00:00Z',
                    };
                }
                else if (/\/presupuestos\/501\/notas\/opened\/?$/u.test(apiPath)) body = { ok: true };
                else if (/\/presupuestos\/501\/?$/u.test(apiPath)) body = budget;
                else if (/\/presupuestos\/?$/u.test(apiPath)) body = [budget];
                else if (/\/apus\/?$/u.test(apiPath)) body = budgetCatalogApus;
                else if (/\/subcategorias-items\/?$/u.test(apiPath)) body = budgetCatalogSubcategories;
                else if (/\/usuarios\/?$/u.test(apiPath)) body = collaborators;
                else if (/\/stakeholders\/project\/[^/]+\/?$/u.test(apiPath)) body = stakeholders;
                else if (/\/roles\/?$/u.test(apiPath)) body = [
                    { id: 801, nombre: 'Responsable técnico' },
                    { id: 802, nombre: 'Coordinación de proyecto' },
                    { id: 803, nombre: 'Supervisión especializada' },
                ];
                else if (apiPath.endsWith('/maestros/ecuador/provincias')) body = ['Pichincha', 'Guayas', 'Azuay'];
                else if (apiPath.includes('/maestros/ecuador/cantones/')) body = ['Quito', 'Rumiñahui', 'Mejía'];
                else if (/\/edt\/project\/\d+\/?$/u.test(apiPath)) body = edtTree;
                else if (/\/edo\/project\/\d+\/?$/u.test(apiPath)) body = edoTree;
                else if (/\/proyectos\/\d+\/assigned-users\/?$/u.test(apiPath)) body = collaborators.slice(0, 6);
                else if (/\/proyectos\/\d+\/permissions\/?$/u.test(apiPath)) {
                    body = { is_restricted: false, allowed_modules: ['todos'] };
                }
                else if (/\/proyectos\/\d+\/assignment-dashboard\/?$/u.test(apiPath)) {
                    body = [{
                        id: 600,
                        codigo: 'PROY-SB',
                        nombre: 'Proyecto Santiago Bermeo 1',
                        parent_id: null,
                        tipo: 'root',
                        assigned_users: collaborators.slice(0, 2),
                    }, ...Array.from({ length: 8 }, (_, index) => ({
                        id: 601 + index,
                        codigo: `EDT-${String(index + 1).padStart(2, '0')}`,
                        nombre: `Rama constructiva Santiago ${index + 1}`,
                        parent_id: 600,
                        tipo: 'edt',
                        assigned_users: index % 3 === 0 ? [] : collaborators.slice(index % 5, (index % 5) + 2),
                    }))];
                }
                else if (/\/proyectos\/\d+\/user-summary\/\d+\/?$/u.test(apiPath)) {
                    body = {
                        nombre: 'Colaborador Santiago 01 con nombre profesional extenso',
                        email: 'colaborador1@santiago.test',
                        cargo: 'Coordinador técnico',
                        items: Array.from({ length: 7 }, (_, index) => ({
                            modulo: index % 2 ? 'presupuestos' : 'datos_generales',
                            edt_nombre: `Rama constructiva Santiago ${index + 1}`,
                            es_global: index % 3 === 0,
                            fecha: `2026-07-${String(24 - index).padStart(2, '0')}T12:00:00Z`,
                        })),
                    };
                }
                else if (/\/proyectos\/?$/u.test(apiPath)) body = projects;
                else if (/\/proyectos\/[^/]+\/revisiones\/?$/u.test(apiPath)) {
                    body = Array.from({ length: 8 }, (_, revision) => ({
                        ...projects[0],
                        id: 101 + revision,
                        revision,
                        nombre: `Proyecto Santiago Bermeo 1 - Revision ${String(revision).padStart(3, '0')}`,
                        ultima_modificacion: `2026-07-${String(24 - revision).padStart(2, '0')}T12:00:00Z`,
                    }));
                }
                else if (apiPath.endsWith('/proyectos/papelera')) {
                    body = Array.from({ length: 7 }, (_, index) => ({
                        ...projects[index],
                        id: 201 + index,
                        trash_original_nombre: projects[index].nombre,
                        trash_original_codigo: projects[index].codigo,
                        deleted_at: `2026-07-${String(24 - index).padStart(2, '0')}T12:00:00Z`,
                        recycle_expires_at: `2026-07-${String(31 - index).padStart(2, '0')}T12:00:00Z`,
                    }));
                }
                else if (/\/cronogramas-trabajo\/\d+\/pareto\/?$/u.test(apiPath)) {
                    const paretoItems = Array.from({ length: 20 }, (_, index) => {
                        const costValue = 285000 - (index * 9200);
                        const durationDays = 42 - index;
                        const percentage = ((20 - index) / 210) * 100;
                        return {
                            id: 1001 + index,
                            linea_id: 1001 + index,
                            ranking: index + 1,
                            codigo: `EDT-${Math.floor(index / 5) + 1}.${(index % 5) + 1}`,
                            descripcion: `Actividad crítica interdisciplinaria ${index + 1} del complejo hospitalario Santiago Bermeo`,
                            cantidad: 18 + (index * 2.75),
                            cost_value: costValue,
                            duration_days: durationDays,
                            work_hours: durationDays * 8,
                            porcentaje: percentage,
                            porcentaje_acumulado: Math.min(100, (index + 1) * 5),
                            cost_pct: percentage,
                            time_pct: Math.max(1, 12.5 - (index * 0.48)),
                            integrated_value: Math.max(1, 13.4 - (index * 0.52)),
                            is_critical: index < 8,
                            start_date: `2026-07-${String(1 + index).padStart(2, '0')}T08:00:00Z`,
                            end_date: `2026-08-${String(1 + index).padStart(2, '0')}T17:00:00Z`,
                        };
                    });
                    body = {
                        view: url.searchParams.get('view') || 'integrated',
                        total_items: paretoItems.length,
                        visible_items: paretoItems.length,
                        visible_acumulado: 100,
                        items: paretoItems,
                    };
                }
                else if (/\/proyectos\/\d+\/?$/u.test(apiPath)) body = {
                    ...projects[0],
                    id: 1,
                    base_trabajo_id: 19,
                    revision: 3,
                };
                else if (apiPath.endsWith('/proyectos/marketplace-export/statuses')) body = { projects: {} };
                else if (apiPath.includes('/proyecto-detalles/')) body = { plazo_estimado: 180, fecha_presentacion: '2026-09-30' };
                else if (/\/bases-trabajo\/\d+\/?$/u.test(apiPath)) body = { id: 19, nombre: 'Base tecnica Santiago Bermeo', tipo: 'Base Maestra' };
                else if (/\/bases-trabajo\/?$/u.test(apiPath)) {
                    body = Array.from({ length: 10 }, (_, index) => ({
                        id: 301 + index,
                        codigo_unico: `BM-${String(index + 1).padStart(3, '0')}`,
                        nombre: `Base maestra Santiago Bermeo ${index + 1}`,
                        tipo: 'Base Maestra',
                    }));
                }
                else if (apiPath.includes('/personal-todos/') || apiPath.includes('/calendar-entries/')) body = [];
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
            });
            const startedAt = Date.now();
            let navigationError = null;
            try {
                const harnessUrl = harness.source === 'classic-projects-edit-harness.html'
                    || harness.source === 'classic-project-workspace-header-harness.html'
                    || harness.source === 'classic-project-workspace-navigation-harness.html'
                    || harness.source === 'classic-project-workspace-data-harness.html'
                    || harness.source === 'classic-project-workspace-stakeholders-harness.html'
                    || harness.source === 'classic-project-workspace-stakeholder-create-harness.html'
                    || harness.source === 'classic-project-workspace-stakeholder-edit-harness.html'
                    || harness.source.startsWith('classic-project-workspace-edt-')
                    || harness.source.startsWith('classic-project-workspace-edo-')
                    ? `${baseUrl}${harness.path}?project_id=1&tab=${
                        harness.source.startsWith('classic-project-workspace-edo-')
                            ? 'edo_obs'
                            : harness.source.startsWith('classic-project-workspace-edt-')
                            ? 'edt_wbs'
                            : harness.source.includes('stakeholder') ? 'stakeholders' : 'datos'
                    }`
                    : `${baseUrl}${harness.path}`;
                await page.goto(harnessUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await page.waitForTimeout(750);
                if (harness.source === 'classic-project-workspace-stakeholders-harness.html'
                    || harness.source === 'classic-project-workspace-stakeholder-create-harness.html'
                    || harness.source === 'classic-project-workspace-stakeholder-edit-harness.html') {
                    await page.getByTitle('Stakeholders').click();
                    await page.waitForTimeout(500);
                }
                if (harness.source.startsWith('classic-project-workspace-edt-')) {
                    await page.getByTitle('EDT/WBS').click();
                    await page.waitForTimeout(600);
                    if (harness.source !== 'classic-project-workspace-edt-graph-harness.html') {
                        await page.getByRole('tab', { name: 'Árbol', exact: true }).click();
                        await page.waitForTimeout(450);
                    }
                    if (harness.source === 'classic-project-workspace-edt-account-harness.html') {
                        await page.getByRole('button', { name: 'Nueva cuenta principal' }).click();
                        await page.waitForTimeout(350);
                    }
                    if (harness.source === 'classic-project-workspace-edt-participant-harness.html') {
                        await page.locator('#edt-node-900').click();
                        await page.getByTitle('Asignar stakeholder').first().evaluate((button) => button.click());
                        await page.getByRole('heading', { name: 'Asignar participante' }).waitFor({ state: 'visible' });
                        await page.waitForTimeout(350);
                    }
                    if (harness.source === 'classic-project-workspace-edt-move-harness.html') {
                        await page.locator('#edt-node-900').click();
                        await page.getByLabel('Seleccionar nodo').first().click();
                        await page.getByRole('button', { name: 'Mover selección EDT' }).click();
                        await page.waitForTimeout(350);
                    }
                }
                if (harness.source.startsWith('classic-project-workspace-edo-')) {
                    await page.getByTitle('EDO/OBS').click();
                    await page.waitForTimeout(600);
                    if (harness.source !== 'classic-project-workspace-edo-graph-harness.html') {
                        await page.getByRole('tab', { name: 'Árbol', exact: true }).click();
                        await page.waitForTimeout(450);
                    }
                    if (harness.source === 'classic-project-workspace-edo-milestone-harness.html') {
                        await page.getByRole('button', { name: 'Nuevo hito principal' }).click();
                        await page.getByRole('heading', { name: 'Nuevo hito' }).waitFor({ state: 'visible' });
                        await page.waitForTimeout(350);
                    }
                    if (harness.source === 'classic-project-workspace-edo-participant-harness.html') {
                        await page.locator('#edo-node-1400').click();
                        await page.getByTitle('Asignar responsable').first().evaluate((button) => button.click());
                        await page.getByRole('heading', { name: 'Asignar responsable' }).waitFor({ state: 'visible' });
                        await page.waitForTimeout(350);
                    }
                    if (harness.source === 'classic-project-workspace-edo-move-harness.html') {
                        await page.locator('#edo-node-1400').click();
                        await page.getByLabel('Seleccionar nodo').first().click();
                        await page.getByRole('button', { name: 'Mover selección EDO' }).click();
                        await page.getByRole('heading', { name: 'Mover elementos' }).waitFor({ state: 'visible' });
                        await page.waitForTimeout(350);
                    }
                }
                if (harness.source === 'classic-project-workspace-budget-catalog-harness.html') {
                    const openCatalog = page.getByRole('button', { name: 'Abrir catálogo y herramientas del presupuesto' });
                    if (await openCatalog.count()) {
                        await openCatalog.click();
                        await page.getByRole('button', { name: 'Cerrar catálogo' }).waitFor({ state: 'visible' });
                    }
                    await page.waitForTimeout(350);
                }
                if (harness.source.startsWith('classic-project-workspace-budget-')
                    && [
                        'classic-project-workspace-budget-indirectos-harness.html',
                        'classic-project-workspace-budget-pareto-harness.html',
                        'classic-project-workspace-budget-notes-harness.html',
                        'classic-project-workspace-budget-minimap-harness.html',
                        'classic-project-workspace-budget-minimap-minimized-harness.html',
                        'classic-project-workspace-budget-clear-step1-harness.html',
                        'classic-project-workspace-budget-clear-step2-harness.html',
                    ].includes(harness.source)) {
                    const openCatalog = page.getByRole('button', { name: 'Abrir catálogo y herramientas del presupuesto' });
                    if (await openCatalog.count()) await openCatalog.click();
                    if (harness.source === 'classic-project-workspace-budget-indirectos-harness.html') {
                        await page.getByTitle(/Indirectos e IVA/u).click();
                    } else if (harness.source === 'classic-project-workspace-budget-pareto-harness.html') {
                        await page.getByTitle('Pareto').click();
                    } else if (harness.source === 'classic-project-workspace-budget-notes-harness.html') {
                        await page.getByTitle('Notas', { exact: true }).first().click();
                    } else if (harness.source === 'classic-project-workspace-budget-minimap-harness.html'
                        || harness.source === 'classic-project-workspace-budget-minimap-minimized-harness.html') {
                        await page.getByTitle('Minimapa EDT del presupuesto').click();
                        if (harness.source === 'classic-project-workspace-budget-minimap-minimized-harness.html') {
                            await page.getByTitle('Minimizar minimapa').click();
                        }
                    } else {
                        await page.getByTitle('Borrar todos los tanteos del presupuesto').click();
                        if (harness.source === 'classic-project-workspace-budget-clear-step2-harness.html') {
                            await page.getByRole('button', { name: 'Entiendo, Continuar' }).click();
                        }
                    }
                    await page.waitForTimeout(450);
                }
                if (harness.source === 'classic-project-workspace-budget-tanteo-harness.html') {
                    await page.getByRole('button', { name: 'Abrir tanteo' }).click();
                    await page.locator('[data-apu-line-id]').first().click();
                    await page.waitForTimeout(450);
                }
                if (harness.source === 'classic-project-workspace-budget-line-notes-harness.html') {
                    await page.getByTitle('Notas de la línea').first().evaluate((button) => button.click());
                    await page.getByText('Notas de Línea', { exact: true }).waitFor({ state: 'visible' });
                    await page.waitForTimeout(450);
                }
                if (harness.source === 'classic-project-workspace-budget-apu-editor-harness.html') {
                    await page.locator('[data-apu-line-id]').first().dblclick();
                    await page.getByRole('heading', { name: /Editor de APU/u }).waitFor({ state: 'visible', timeout: 10000 });
                    await page.waitForTimeout(600);
                }
                if (harness.source === 'classic-project-workspace-budget-apu-resources-harness.html') {
                    await page.locator('[data-apu-line-id]').first().dblclick();
                    await page.getByRole('heading', { name: /Editor de APU/u }).waitFor({ state: 'visible', timeout: 10000 });
                    // The adaptive profile is resolved after the editor mounts. Wait for that
                    // state before opening the compact drawer so the initialization effect
                    // cannot collapse it again after the interaction.
                    await page.waitForTimeout(650);
                    const openResources = page.getByRole('button', { name: 'Abrir catálogo de recursos' });
                    if (await openResources.count()) {
                        await openResources.click();
                        await page.getByRole('button', { name: 'Cerrar catálogo de recursos' }).waitFor({ state: 'visible' });
                    }
                    await page.waitForTimeout(450);
                    const resourceDrawer = page.locator('[data-apu-budget-resource-sidebar="true"]');
                    const resourceDrawerWidth = await resourceDrawer.evaluate((node) => node.getBoundingClientRect().width);
                    const resourceSearchVisible = await page.getByPlaceholder('Buscar recursos...').isVisible();
                    if (resourceDrawerWidth < 280 || !resourceSearchVisible) {
                        throw new Error(`APU resource drawer did not remain open (width=${resourceDrawerWidth}, searchVisible=${resourceSearchVisible})`);
                    }
                }
                if (harness.source === 'classic-project-workspace-budget-report-menu-harness.html') {
                    await page.getByRole('button', { name: 'Reporte de presupuesto' }).click();
                    await page.getByText('Presupuesto + APUs', { exact: true }).waitFor({ state: 'visible' });
                    await page.mouse.move(Math.round(profile.viewport[0] / 2), Math.round(profile.viewport[1] / 2));
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'gantt-tools-harness.html') {
                    await page.getByRole('button', { name: 'Herramientas del Gantt' }).click();
                    await page.getByRole('button', { name: 'Exportar XML Project' }).waitFor({ state: 'visible' });
                    await page.getByRole('button', { name: 'Exportar MS Project (.mpp)', exact: true }).waitFor({ state: 'visible' });
                    await page.getByRole('button', { name: 'Importar XML MS Project' }).waitFor({ state: 'visible' });
                    await page.getByText('Factory reset', { exact: true }).waitFor({ state: 'visible' });
                    await page.mouse.move(profile.viewport[0] - 6, profile.viewport[1] - 6);
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'gantt-ms-project-harness.html') {
                    await page.getByRole('button', { name: 'Herramientas del Gantt' }).click();
                    const toolsScroll = page.locator('[data-gantt-tools-scroll="true"]');
                    await toolsScroll.evaluate((node) => { node.scrollTop = node.scrollHeight; });
                    await page.getByRole('button', { name: 'Importar XML MS Project' }).waitFor({ state: 'visible' });
                    await page.getByText('Factory reset', { exact: true }).waitFor({ state: 'visible' });
                    await page.mouse.move(profile.viewport[0] - 6, profile.viewport[1] - 6);
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'gantt-ms-project-import-harness.html'
                    || harness.source === 'gantt-ms-project-mpp-unavailable-harness.html') {
                    await page.getByRole('button', { name: 'Herramientas del Gantt' }).click();
                    const toolsScroll = page.locator('[data-gantt-tools-scroll="true"]');
                    await toolsScroll.evaluate((node) => { node.scrollTop = node.scrollHeight; });
                    if (harness.source === 'gantt-ms-project-import-harness.html') {
                        await page.getByRole('button', { name: 'Importar XML MS Project' }).click();
                        await page.getByRole('dialog', { name: 'Importar XML MS Project' }).waitFor({ state: 'visible' });
                        await page.getByRole('button', { name: 'Seleccionar XML' }).waitFor({ state: 'visible' });
                    } else {
                        await page.getByRole('button', { name: 'Exportar MS Project (.mpp)', exact: true }).click();
                        await page.getByRole('dialog', { name: 'Exportación .mpp no disponible' }).waitFor({ state: 'visible' });
                    }
                    await page.mouse.move(profile.viewport[0] - 6, profile.viewport[1] - 6);
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'gantt-task-menu-harness.html'
                    || harness.source === 'gantt-task-menu-end-harness.html') {
                    const taskMenuTrigger = page.getByRole('button', { name: 'Abrir menú de tarea' }).first();
                    await taskMenuTrigger.waitFor({ state: 'visible' });
                    await taskMenuTrigger.click();
                    const taskMenu = page.locator('[data-gantt-task-action-menu="true"]');
                    await taskMenu.waitFor({ state: 'visible' });
                    await page.getByRole('menu', { name: /Acciones rápidas/u }).waitFor({ state: 'visible' });
                    if (harness.source === 'gantt-task-menu-end-harness.html') {
                        await taskMenu.locator(':scope > div').last().evaluate((node) => { node.scrollTop = node.scrollHeight; });
                        await page.getByRole('button', { name: 'Agrupar en todos los periodos' }).waitFor({ state: 'visible' });
                    } else {
                        await page.getByRole('button', { name: 'Ajuste fino' }).waitFor({ state: 'visible' });
                    }
                    await page.mouse.move(profile.viewport[0] - 6, profile.viewport[1] - 6);
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'gantt-segment-menu-harness.html') {
                    const targetTaskRow = page.locator('[data-grid-row="true"]').nth(1);
                    await targetTaskRow.click({ position: { x: 250, y: 28 } });
                    await page.getByRole('button', { name: 'Gantt', exact: true }).click();
                    await page.waitForTimeout(500);
                    const segmentBar = page.locator('[data-subbar-key]').first();
                    if (!(await segmentBar.count())) {
                        const diagnostic = await page.locator('[data-bar-id]').first().evaluate((node) => ({ ...node.dataset }));
                        throw new Error(`Segment fixture did not materialize: ${JSON.stringify(diagnostic)}`);
                    }
                    await segmentBar.hover({ force: true });
                    const segmentMenuTrigger = page.getByRole('button', { name: /Abrir acciones del tramo/u }).first();
                    await segmentMenuTrigger.evaluate((node) => node.click());
                    const taskMenu = page.locator('[data-gantt-task-action-menu="true"]');
                    await taskMenu.waitFor({ state: 'visible' });
                    await page.getByRole('button', { name: 'Dividir tramo activo' }).waitFor({ state: 'visible' });
                    await page.mouse.move(profile.viewport[0] - 6, profile.viewport[1] - 6);
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'gantt-split-dialog-harness.html'
                    || harness.source === 'gantt-split-dialog-end-harness.html'
                    || harness.source === 'gantt-split-dialog-table-end-harness.html') {
                    const targetTaskRow = page.locator('[data-grid-row="true"]').nth(1);
                    await targetTaskRow.click({ position: { x: 250, y: 28 } });
                    await page.getByRole('button', { name: 'Gantt', exact: true }).click();
                    await page.waitForTimeout(500);
                    const segmentBar = page.locator('[data-subbar-key]').first();
                    if (!(await segmentBar.count())) {
                        const diagnostic = await page.locator('[data-bar-id]').first().evaluate((node) => ({ ...node.dataset }));
                        throw new Error(`Split fixture did not materialize: ${JSON.stringify(diagnostic)}`);
                    }
                    await segmentBar.hover({ force: true });
                    await page.getByRole('button', { name: /Abrir acciones del tramo/u }).first().evaluate((node) => node.click());
                    await page.getByRole('button', { name: 'Dividir tramo activo' }).click();
                    const splitDialog = page.locator('[data-gantt-split-dialog="true"]');
                    await splitDialog.waitFor({ state: 'visible' });
                    await page.getByRole('button', { name: 'Aplicar división' }).waitFor({ state: 'visible' });
                    if (harness.source === 'gantt-split-dialog-end-harness.html') {
                        await page.locator('[data-gantt-split-dialog-body="true"]').evaluate((node) => { node.scrollTop = node.scrollHeight; });
                    }
                    if (harness.source === 'gantt-split-dialog-table-end-harness.html') {
                        await page.locator('[data-gantt-split-table="true"]').evaluate((node) => { node.scrollLeft = node.scrollWidth; });
                    }
                    await page.mouse.move(profile.viewport[0] - 6, profile.viewport[1] - 6);
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'gantt-fine-tune-subbar-harness.html'
                    || harness.source === 'gantt-fine-tune-subbar-error-harness.html') {
                    const targetTaskRow = page.locator('[data-grid-row="true"]').nth(1);
                    await targetTaskRow.click({ position: { x: 250, y: 28 } });
                    await page.getByRole('button', { name: 'Gantt', exact: true }).click();
                    await page.waitForTimeout(500);
                    const segmentBar = page.locator('[data-subbar-key]').first();
                    if (!(await segmentBar.count())) throw new Error('Fine tune segment fixture did not materialize.');
                    await segmentBar.hover({ force: true });
                    await page.getByRole('button', { name: /Abrir acciones del tramo/u }).first().evaluate((node) => node.click());
                    await page.getByRole('button', { name: 'Ajuste fino' }).click();
                    const continuation = page.getByRole('button', { name: 'Continuar edición' });
                    if (await continuation.isVisible().catch(() => false)) await continuation.click();
                    const fineTuneDialog = page.locator('[data-gantt-subbar-fine-tune="true"]');
                    await fineTuneDialog.waitFor({ state: 'visible' });
                    if (harness.source === 'gantt-fine-tune-subbar-error-harness.html') {
                        await page.getByRole('button', { name: 'Limpiar fecha', exact: true }).click();
                        await page.getByRole('button', { name: 'Aplicar' }).click();
                        await page.locator('[data-gantt-subbar-fine-tune-error="true"]').waitFor({ state: 'visible' });
                    }
                    await page.mouse.move(profile.viewport[0] - 6, profile.viewport[1] - 6);
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'gantt-fine-tune-task-harness.html') {
                    const taskMenuTrigger = page.getByRole('button', { name: 'Abrir menú de tarea' }).first();
                    await taskMenuTrigger.waitFor({ state: 'visible' });
                    await taskMenuTrigger.click();
                    await page.getByRole('button', { name: 'Ajuste fino' }).click();
                    const continuation = page.getByRole('button', { name: 'Continuar edición' });
                    if (await continuation.isVisible().catch(() => false)) await continuation.click();
                    await page.locator('[data-gantt-task-fine-tune="true"]').waitFor({ state: 'visible' });
                    await page.mouse.move(profile.viewport[0] - 6, profile.viewport[1] - 6);
                    await page.waitForTimeout(500);
                }
                if (harness.source === 'gantt-reconciliation-approval-harness.html'
                    || harness.source === 'gantt-reconciliation-approval-end-harness.html'
                    || harness.source === 'gantt-reconciliation-budget-harness.html'
                    || harness.source === 'gantt-reconciliation-budget-end-harness.html') {
                    const targetTaskRow = page.locator('[data-grid-row="true"]').nth(1);
                    await targetTaskRow.click({ position: { x: 250, y: 28 } });
                    await page.getByRole('button', { name: 'Gantt', exact: true }).click();
                    await page.waitForTimeout(500);
                    const segmentBar = page.locator('[data-subbar-key]').first();
                    if (!(await segmentBar.count())) throw new Error('Reconciliation segment fixture did not materialize.');
                    await segmentBar.hover({ force: true });
                    await page.getByRole('button', { name: /Abrir acciones del tramo/u }).first().evaluate((node) => node.click());
                    await page.getByRole('button', { name: 'Ajuste fino' }).click();
                    const continuation = page.getByRole('button', { name: 'Continuar edición' });
                    if (await continuation.isVisible().catch(() => false)) await continuation.click();
                    await page.locator('[data-gantt-subbar-fine-tune="true"]').waitFor({ state: 'visible' });
                    await page.getByRole('button', { name: 'Aplicar' }).click();
                    const isBudgetConflict = harness.source.includes('-budget-');
                    if (isBudgetConflict) {
                        await page.evaluate(() => window.dispatchEvent(new CustomEvent('giproy:budget-productivity-updated', {
                            detail: {
                                presupuestoId: 501,
                                source: 'budget_apu_editor',
                                updatedAt: '2026-07-27T16:00:00.000Z',
                                apuId: 7301,
                            },
                        })));
                        const recalculate = page.getByRole('button', { name: 'Recalcular desde presupuesto' });
                        await recalculate.waitFor({ state: 'visible' });
                        await recalculate.click();
                        await page.locator('[data-gantt-compare-dialog="true"]').waitFor({ state: 'visible' });
                        if (harness.source.endsWith('-end-harness.html')) {
                            await page.locator('[data-gantt-compare-dialog-body="true"]').evaluate((node) => { node.scrollTop = node.scrollHeight; });
                        }
                    } else {
                        await page.getByRole('button', { name: 'Confirmar cronograma' }).click();
                        await page.locator('[data-gantt-approval-dialog="true"]').waitFor({ state: 'visible' });
                        if (harness.source.endsWith('-end-harness.html')) {
                            await page.locator('[data-gantt-approval-dialog-body="true"]').evaluate((node) => { node.scrollTop = node.scrollHeight; });
                        }
                    }
                    await page.mouse.move(profile.viewport[0] - 6, profile.viewport[1] - 6);
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'gantt-apu-signals-harness.html'
                    || harness.source === 'gantt-apu-signals-end-harness.html'
                    || harness.source === 'gantt-apu-signals-dragged-harness.html'
                    || harness.source === 'gantt-apu-signals-unavailable-harness.html') {
                    const unavailable = harness.source.includes('-unavailable-');
                    const targetTaskRow = page.locator('[data-grid-row="true"]').nth(unavailable ? 2 : 1);
                    await targetTaskRow.click({ position: { x: 250, y: 28 } });
                    const signalsButton = page.getByTestId('gantt-apu-planning-signals-button');
                    await signalsButton.waitFor({ state: 'visible' });
                    await signalsButton.click();
                    const signalsPanel = page.locator('[data-gantt-apu-planning-signals="true"]');
                    await signalsPanel.waitFor({ state: 'visible' });
                    await page.mouse.move(profile.viewport[0] - 6, profile.viewport[1] - 6);
                    if (harness.source === 'gantt-apu-signals-end-harness.html') {
                        await page.locator('[data-gantt-apu-planning-signals-body="true"]').evaluate((node) => { node.scrollTop = node.scrollHeight; });
                    }
                    if (harness.source === 'gantt-apu-signals-dragged-harness.html') {
                        const dragHandle = page.getByTestId('gantt-apu-planning-signals-drag-handle');
                        const box = await dragHandle.boundingBox();
                        if (!box) throw new Error('APU signals drag handle is not measurable.');
                        await page.mouse.move(box.x + 24, box.y + 24);
                        await page.mouse.down();
                        await page.mouse.move(profile.viewport[0] - 28, profile.viewport[1] - 28, { steps: 8 });
                        await page.mouse.up();
                    }
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'gantt-duration-display-harness.html'
                    || harness.source === 'gantt-duration-display-hours-harness.html'
                    || harness.source === 'gantt-duration-display-end-harness.html'
                    || harness.source === 'gantt-duration-display-subcontract-harness.html') {
                    const gridViewport = page.locator('[data-gantt-left-viewport="true"]');
                    await gridViewport.waitFor({ state: 'visible' });
                    if (harness.source === 'gantt-duration-display-end-harness.html') {
                        await gridViewport.evaluate((node) => { node.scrollTop = node.scrollHeight; });
                        await page.waitForTimeout(250);
                    }
                    const triggers = page.locator('[data-gantt-duration-display-trigger]');
                    const trigger = harness.source === 'gantt-duration-display-end-harness.html' ? triggers.last() : triggers.first();
                    await trigger.scrollIntoViewIfNeeded();
                    await trigger.click();
                    const menu = page.locator('[data-gantt-duration-display-menu]');
                    await menu.waitFor({ state: 'visible' });
                    if (harness.source === 'gantt-duration-display-hours-harness.html') {
                        await menu.getByRole('menuitemradio', { name: /Horas/u }).click();
                        await trigger.click();
                        await menu.waitFor({ state: 'visible' });
                        await menu.getByRole('menuitemradio', { name: /Horas/u }).evaluate((node) => {
                            if (node.getAttribute('aria-checked') !== 'true') throw new Error('Hours duration unit did not persist in the real row draft.');
                        });
                    }
                    const menuBox = await menu.boundingBox();
                    if (!menuBox) throw new Error('Duration display menu is not measurable.');
                    if (menuBox.x < 0 || menuBox.y < 0 || menuBox.x + menuBox.width > profile.viewport[0] + 1 || menuBox.y + menuBox.height > profile.viewport[1] + 1) {
                        throw new Error(`Duration display menu escaped viewport: ${JSON.stringify(menuBox)}.`);
                    }
                    await page.mouse.move(profile.viewport[0] - 6, profile.viewport[1] - 6);
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'gantt-quick-successor-harness.html'
                    || harness.source === 'gantt-quick-successor-end-harness.html'
                    || harness.source === 'gantt-quick-successor-error-harness.html'
                    || harness.source === 'gantt-quick-successor-visual-harness.html') {
                    const taskMenuTrigger = page.getByRole('button', { name: 'Abrir menú de tarea' }).first();
                    await taskMenuTrigger.waitFor({ state: 'visible' });
                    await taskMenuTrigger.click();
                    await page.getByRole('button', { name: 'Crear dependencia' }).click();
                    await page.getByRole('dialog', { name: /ID 2/u }).waitFor({ state: 'visible' });
                    if (harness.source === 'gantt-quick-successor-error-harness.html') {
                        await page.getByPlaceholder('Ej. 38 o 1.1.3').fill('999999');
                        await page.locator('[data-gantt-quick-successor-error="true"]').waitFor({ state: 'visible' });
                    } else {
                        await page.getByPlaceholder('Ej. 38 o 1.1.3').fill('3');
                        await page.getByText('Tarea destino resuelta', { exact: true }).waitFor({ state: 'visible' });
                    }
                    if (harness.source === 'gantt-quick-successor-end-harness.html') {
                        await page.locator('[data-gantt-quick-successor-dialog="true"]').evaluate((node) => { node.scrollTop = node.scrollHeight; });
                        await page.getByRole('button', { name: 'Crear dependencia' }).waitFor({ state: 'visible' });
                    }
                    if (harness.source === 'gantt-quick-successor-visual-harness.html') {
                        await page.getByRole('button', { name: 'Elegir destino' }).click();
                        await page.locator('[data-gantt-quick-successor-dialog="true"]').waitFor({ state: 'detached' });
                        await page.locator('[data-gantt-quick-successor-source="true"]').waitFor({ state: 'visible' });
                    }
                    await page.mouse.move(profile.viewport[0] - 6, profile.viewport[1] - 6);
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'gantt-pareto-harness.html') {
                    await page.getByRole('button', { name: 'Abrir Pareto del Gantt' }).click();
                    await page.getByRole('dialog', { name: 'Pareto temporal' }).waitFor({ state: 'visible' });
                    await page.getByText('EDT-1.1', { exact: false }).first().waitFor({ state: 'visible' });
                    await page.mouse.move(profile.viewport[0] - 6, profile.viewport[1] - 6);
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'gantt-config-harness.html'
                    || harness.source === 'gantt-history-harness.html'
                    || harness.source === 'gantt-calendar-harness.html') {
                    await page.getByRole('button', { name: 'Herramientas del Gantt' }).click();
                    if (harness.source === 'gantt-config-harness.html'
                        || harness.source === 'gantt-calendar-harness.html') {
                        await page.getByRole('button', { name: 'Configuración', exact: true }).click();
                        await page.getByText('Configuración de Gantt', { exact: true }).waitFor({ state: 'visible' });
                        if (harness.source === 'gantt-calendar-harness.html') {
                            await page.getByRole('button', { name: 'Abrir calendario laboral', exact: true }).click();
                            await page.getByRole('dialog', { name: 'Calendario laboral del proyecto' }).waitFor({ state: 'visible' });
                        }
                    } else {
                        await page.getByRole('button', { name: 'Historial', exact: true }).click();
                        await page.getByText('Historial confirmado', { exact: true }).waitFor({ state: 'visible' });
                    }
                    await page.mouse.move(profile.viewport[0] - 6, profile.viewport[1] - 6);
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'classic-projects-kanban-harness.html') {
                    await page.getByRole('tab', { name: 'Kanban' }).click();
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'classic-projects-create-harness.html') {
                    await page.getByRole('button', { name: 'Nuevo proyecto' }).click();
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'classic-projects-delete-step1-harness.html'
                    || harness.source === 'classic-projects-delete-step2-harness.html') {
                    await page.getByRole('button', { name: /Mover proyecto a papelera/u }).first().click();
                    await page.waitForTimeout(250);
                    if (harness.source === 'classic-projects-delete-step2-harness.html') {
                        await page.getByRole('button', { name: 'Entiendo, Continuar' }).click();
                        await page.waitForTimeout(200);
                    }
                }
                if (harness.source === 'classic-projects-revisions-harness.html') {
                    await page.getByRole('row').filter({ hasText: 'Proyecto Santiago Bermeo 1' }).first().click();
                    await page.waitForTimeout(500);
                }
                if (harness.source === 'classic-projects-recycle-harness.html') {
                    await page.getByRole('button', { name: 'Papelera', exact: true }).click();
                    await page.waitForTimeout(500);
                }
                if (harness.source === 'classic-projects-clone-confirm-harness.html') {
                    await page.getByRole('button', { name: /Clonar proyecto completo Proyecto Santiago Bermeo 1/u }).first().click();
                    await page.waitForTimeout(300);
                }
                if (harness.source === 'classic-project-manager-bases-harness.html') {
                    await page.getByRole('button', { name: 'Bases Maestras', exact: true }).click();
                    await page.waitForTimeout(300);
                }
                if (harness.source === 'classic-project-manager-assign-harness.html') {
                    await page.getByRole('button', { name: 'Asignar personal' }).first().click();
                    await page.waitForTimeout(500);
                }
                if (harness.source === 'classic-project-manager-team-dashboard-harness.html'
                    || harness.source === 'classic-project-manager-team-summary-harness.html') {
                    await page.getByRole('button', { name: 'Ver equipo' }).first().click();
                    await page.waitForTimeout(500);
                    if (harness.source === 'classic-project-manager-team-summary-harness.html') {
                        await page.getByRole('button', { name: /Ver resumen de Colaborador Santiago 01/u }).first().click();
                        await page.waitForTimeout(500);
                    }
                }
                if (harness.source === 'classic-project-workspace-navigation-harness.html') {
                    await page.getByRole('button', { name: 'Fijar navegación del proyecto' }).click();
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'classic-project-workspace-data-harness.html') {
                    await page.getByRole('button', { name: /4\. Informaci.n contractual/u }).click();
                    await page.getByRole('button', { name: /7\. Objetivos, restricciones y supuestos/u }).click();
                    await page.evaluate(() => {
                        const main = document.querySelector('[data-project-edit-main-viewport]');
                        const side = document.querySelector('[data-project-edit-side-viewport]');
                        if (main) main.scrollTop = 0;
                        if (side) side.scrollTop = 0;
                    });
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'classic-project-workspace-stakeholder-create-harness.html') {
                    await page.getByRole('button', { name: 'Nuevo stakeholder' }).click();
                    await page.waitForTimeout(350);
                }
                if (harness.source === 'classic-project-workspace-stakeholder-edit-harness.html') {
                    await page.getByTitle('Editar stakeholder').first().click();
                    await page.waitForTimeout(350);
                }
            } catch (error) {
                navigationError = error.message;
            }
            const geometry = await page.evaluate(() => {
                const root = document.documentElement;
                const body = document.body;
                const viewport = { width: window.innerWidth, height: window.innerHeight };
                const selectorFor = (node) => {
                    if (node.id) return `#${node.id}`;
                    const marker = [...node.attributes].find(({ name }) => name.startsWith('data-'));
                    return marker ? `[${marker.name}="${marker.value}"]` : `${node.tagName.toLowerCase()}.${[...node.classList].slice(0, 2).join('.')}`;
                };
                const isVisible = (node) => {
                    const style = getComputedStyle(node);
                    const rect = node.getBoundingClientRect();
                    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
                };
                const hasScrollableAncestor = (node, axis) => {
                    for (let current = node.parentElement; current; current = current.parentElement) {
                        const style = getComputedStyle(current);
                        const overflow = axis === 'x' ? style.overflowX : style.overflowY;
                        const scrollable = axis === 'x' ? current.scrollWidth > current.clientWidth + 2 : current.scrollHeight > current.clientHeight + 2;
                        if (scrollable && /auto|scroll/u.test(overflow)) return true;
                    }
                    return false;
                };
                const interactiveClipping = [...document.querySelectorAll('button, input, select, textarea, a[href], [role="button"], [role="tab"], [role="menuitem"]')]
                    .filter(isVisible)
                    .map((node) => ({ node, rect: node.getBoundingClientRect() }))
                    .filter(({ node, rect }) => (
                        (rect.left < -2 || rect.right > viewport.width + 2) && !hasScrollableAncestor(node, 'x')
                    ) || (
                        (rect.top < -2 || rect.bottom > viewport.height + 2) && getComputedStyle(node).position === 'fixed' && !hasScrollableAncestor(node, 'y')
                    ))
                    .slice(0, 30)
                    .map(({ node, rect }) => ({ selector: selectorFor(node), rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }));
                const fixedClipping = [...document.querySelectorAll('body *')]
                    .filter((node) => isVisible(node) && getComputedStyle(node).position === 'fixed')
                    .map((node) => ({ node, rect: node.getBoundingClientRect() }))
                    .filter(({ rect }) => rect.left < -2 || rect.right > viewport.width + 2 || rect.top < -2 || rect.bottom > viewport.height + 2)
                    .slice(0, 30)
                    .map(({ node, rect }) => ({ selector: selectorFor(node), rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } }));
                const scrollContainers = [...document.querySelectorAll('body *')]
                    .filter((node) => {
                        const style = getComputedStyle(node);
                        return (/auto|scroll/u.test(style.overflowY) && node.scrollHeight > node.clientHeight + 2)
                            || (/auto|scroll/u.test(style.overflowX) && node.scrollWidth > node.clientWidth + 2);
                    }).length;
                return {
                    viewport,
                    dpr: window.devicePixelRatio,
                    bodyTextLength: body.innerText.trim().length,
                    documentWidth: Math.max(root.scrollWidth, body.scrollWidth),
                    documentHeight: Math.max(root.scrollHeight, body.scrollHeight),
                    horizontalOverflow: Math.max(root.scrollWidth, body.scrollWidth) - root.clientWidth,
                    interactiveClipping,
                    fixedClipping,
                    scrollContainers,
                    adaptiveProfiles: [...document.querySelectorAll('[data-adaptive-profile]')].map((node) => ({
                        profile: node.getAttribute('data-adaptive-profile'),
                        detected: node.getAttribute('data-adaptive-detected-profile'),
                        enabled: node.getAttribute('data-adaptive-ui-enabled'),
                    })),
                };
            }).catch(() => null);
            const screenshotName = harness.source.replace(/\.html$/u, '.png');
            const screenshotPath = path.join(profileDirectory, screenshotName);
            await page.screenshot({ path: screenshotPath, fullPage: false, scale: 'css' }).catch((error) => runtimeErrors.push(`screenshot: ${error.message}`));
            const projectsScrollContract = profile.touch && harness.source === 'classic-projects-harness.html'
                ? await (async () => {
                    const before = await page.evaluate(() => {
                        const controls = document.querySelector('[data-projects-fixed-controls]');
                        const viewport = document.querySelector('[data-projects-list-viewport]');
                        if (!controls || !viewport) return null;
                        const rect = viewport.getBoundingClientRect();
                        viewport.scrollTop = 0;
                        return {
                            controlsTop: controls.getBoundingClientRect().top,
                            viewportTop: rect.top,
                            x: Math.max(8, Math.min(window.innerWidth - 8, rect.left + (rect.width / 2))),
                            y: Math.max(8, Math.min(window.innerHeight - 8, rect.top + Math.min(rect.height / 2, 220))),
                        };
                    });
                    if (!before) return { passed: false, reason: 'missing projects scroll markers' };
                    const session = await context.newCDPSession(page);
                    await session.send('Input.dispatchTouchEvent', {
                        type: 'touchStart',
                        touchPoints: [{ x: before.x, y: before.y, radiusX: 2, radiusY: 2, force: 1, id: 7 }],
                    });
                    for (let step = 1; step <= 6; step += 1) {
                        await session.send('Input.dispatchTouchEvent', {
                            type: 'touchMove',
                            touchPoints: [{
                                x: before.x,
                                y: before.y - (Math.min(200, before.y - 8) * step / 6),
                                radiusX: 2,
                                radiusY: 2,
                                force: 1,
                                id: 7,
                            }],
                        });
                    }
                    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
                    await page.waitForTimeout(180);
                    await session.detach();
                    const after = await page.evaluate(() => ({
                        controlsTop: document.querySelector('[data-projects-fixed-controls]')?.getBoundingClientRect().top,
                        listScrollTop: document.querySelector('[data-projects-list-viewport]')?.scrollTop || 0,
                        horizontalReachable: (() => {
                            const viewport = document.querySelector('[data-projects-list-viewport]');
                            if (!viewport || viewport.scrollWidth <= viewport.clientWidth + 2) return true;
                            viewport.scrollLeft = viewport.scrollWidth;
                            return viewport.scrollLeft > 1;
                        })(),
                        stickyHeaderDelta: (() => {
                            const viewport = document.querySelector('[data-projects-list-viewport]');
                            const header = viewport?.querySelector('thead');
                            if (!viewport || !header) return Number.POSITIVE_INFINITY;
                            return Math.abs(header.getBoundingClientRect().top - viewport.getBoundingClientRect().top);
                        })(),
                    }));
                    const fixedDelta = Math.abs(after.controlsTop - before.controlsTop);
                    return {
                        passed: after.listScrollTop > 1
                            && fixedDelta <= 1
                            && after.horizontalReachable
                            && after.stickyHeaderDelta <= 2,
                        listScrollTop: after.listScrollTop,
                        fixedControlsDelta: fixedDelta,
                        horizontalReachable: after.horizontalReachable,
                        stickyHeaderDelta: after.stickyHeaderDelta,
                    };
                })().catch((error) => ({ passed: false, reason: error.message }))
                : null;
            const budgetScrollContract = harness.source === 'classic-project-workspace-budget-main-harness.html'
                ? await page.evaluate(async () => {
                    const viewport = document.querySelector('[data-budget-scroll-parent="true"]');
                    const header = document.querySelector('[data-budget-header-scroll="true"]');
                    if (!viewport || !header) return { passed: false, reason: 'missing budget scroll markers' };
                    const startTop = viewport.getBoundingClientRect().top;
                    const horizontalTarget = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
                    viewport.scrollLeft = horizontalTarget;
                    viewport.dispatchEvent(new Event('scroll'));
                    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                    const horizontalReachable = horizontalTarget <= 2 || viewport.scrollLeft >= horizontalTarget - 2;
                    const headerSynchronized = Math.abs(header.scrollLeft - viewport.scrollLeft) <= 2;
                    viewport.scrollTop = Math.min(240, Math.max(0, viewport.scrollHeight - viewport.clientHeight));
                    viewport.dispatchEvent(new Event('scroll'));
                    await new Promise((resolve) => requestAnimationFrame(resolve));
                    return {
                        passed: horizontalReachable
                            && headerSynchronized
                            && viewport.getBoundingClientRect().top === startTop
                            && (viewport.scrollHeight <= viewport.clientHeight + 2 || viewport.scrollTop > 1),
                        horizontalReachable,
                        headerSynchronized,
                        headerScrollLeft: header.scrollLeft,
                        viewportScrollLeft: viewport.scrollLeft,
                        viewportScrollTop: viewport.scrollTop,
                        fixedViewportTop: viewport.getBoundingClientRect().top === startTop,
                    };
                }).catch((error) => ({ passed: false, reason: error.message }))
                : null;
            const scrollReachability = await page.evaluate(() => {
                const candidates = [...document.querySelectorAll('body *')].map((node, index) => {
                    const style = getComputedStyle(node);
                    return {
                        node,
                        index,
                        horizontalDelta: /auto|scroll/u.test(style.overflowX) ? node.scrollWidth - node.clientWidth : 0,
                        verticalDelta: /auto|scroll/u.test(style.overflowY) ? node.scrollHeight - node.clientHeight : 0,
                        touchAction: style.touchAction,
                    };
                });
                const horizontal = candidates.sort((left, right) => right.horizontalDelta - left.horizontalDelta)[0];
                const vertical = [...candidates].sort((left, right) => right.verticalDelta - left.verticalDelta)[0];
                let horizontalResult = null;
                if (horizontal?.horizontalDelta > 2) {
                    horizontal.node.setAttribute('data-visual-cert-horizontal-scroll', 'true');
                    horizontal.node.scrollLeft = horizontal.node.scrollWidth;
                    horizontalResult = {
                        delta: horizontal.horizontalDelta,
                        reached: horizontal.node.scrollLeft >= horizontal.horizontalDelta - 2,
                        scrollLeft: horizontal.node.scrollLeft,
                        touchAction: horizontal.touchAction,
                    };
                }
                let verticalResult = null;
                if (vertical?.verticalDelta > 2) {
                    const previous = vertical.node.scrollTop;
                    vertical.node.scrollTop = vertical.node.scrollHeight;
                    verticalResult = {
                        delta: vertical.verticalDelta,
                        reached: vertical.node.scrollTop >= vertical.verticalDelta - 2,
                        scrollTop: vertical.node.scrollTop,
                        touchAction: vertical.touchAction,
                    };
                    vertical.node.scrollTop = previous;
                }
                return { horizontal: horizontalResult, vertical: verticalResult };
            }).catch(() => null);
            const gestureReachability = profile.touch ? await (async () => {
                const candidates = await page.evaluate(() => [...document.querySelectorAll('body *')]
                    .map((node, index) => {
                        const style = getComputedStyle(node);
                        const rect = node.getBoundingClientRect();
                        const verticalDelta = /auto|scroll/u.test(style.overflowY) ? node.scrollHeight - node.clientHeight : 0;
                        const horizontalDelta = /auto|scroll/u.test(style.overflowX) ? node.scrollWidth - node.clientWidth : 0;
                        if (Math.max(verticalDelta, horizontalDelta) < 96
                            || rect.width < 40
                            || rect.height < 40
                            || rect.right <= 0
                            || rect.bottom <= 0
                            || rect.left >= window.innerWidth
                            || rect.top >= window.innerHeight) return null;
                        const prefersContentCenter = node.hasAttribute('data-budget-scroll-parent');
                        const x = Math.max(4, Math.min(
                            window.innerWidth - 4,
                            verticalDelta >= horizontalDelta && !prefersContentCenter
                                ? rect.left + 8
                                : rect.left + (rect.width / 2),
                        ));
                        const y = Math.max(4, Math.min(window.innerHeight - 4, rect.top + (rect.height / 2)));
                        const hitTarget = document.elementFromPoint(x, y);
                        if (!hitTarget || !node.contains(hitTarget)) return null;
                        const id = `visual-gesture-${index}`;
                        node.setAttribute('data-visual-gesture-id', id);
                        node.scrollTop = 0;
                        node.scrollLeft = 0;
                        return {
                            id,
                            tag: node.tagName.toLowerCase(),
                            marker: [...node.attributes].find(({ name }) => name.startsWith('data-'))?.name || '',
                            className: typeof node.className === 'string' ? node.className.slice(0, 180) : '',
                            x,
                            y,
                            verticalDelta,
                            horizontalDelta,
                            depth: (() => {
                                let value = 0;
                                for (let current = node.parentElement; current; current = current.parentElement) value += 1;
                                return value;
                            })(),
                        };
                    })
                    .filter(Boolean)
                    .sort((left, right) => (
                        right.depth - left.depth
                        || Math.max(right.verticalDelta, right.horizontalDelta) - Math.max(left.verticalDelta, left.horizontalDelta)
                    ))
                    .slice(0, 8));
                const session = await context.newCDPSession(page);
                const results = [];
                for (const candidate of candidates) {
                    const vertical = candidate.verticalDelta >= candidate.horizontalDelta;
                    const currentPoint = await page.evaluate(({ id, vertical }) => {
                        const node = document.querySelector(`[data-visual-gesture-id="${id}"]`);
                        if (!node) return null;
                        const rect = node.getBoundingClientRect();
                        if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight) return null;
                        return {
                            x: Math.max(4, Math.min(
                                window.innerWidth - 4,
                                vertical && !node.hasAttribute('data-budget-scroll-parent')
                                    ? rect.left + 8
                                    : rect.left + (rect.width / 2),
                            )),
                            y: Math.max(4, Math.min(window.innerHeight - 4, rect.top + (rect.height / 2))),
                        };
                    }, { id: candidate.id, vertical });
                    if (!currentPoint) {
                        results.push({ ...candidate, axis: vertical ? 'y' : 'x', movement: 0, reached: true, skipped: 'not visible after prior gesture' });
                        continue;
                    }
                    const endX = vertical ? currentPoint.x : Math.max(8, currentPoint.x - Math.min(180, currentPoint.x - 8));
                    const endY = vertical ? Math.max(8, currentPoint.y - Math.min(180, currentPoint.y - 8)) : currentPoint.y;
                    await session.send('Input.dispatchTouchEvent', {
                        type: 'touchStart',
                        touchPoints: [{ x: currentPoint.x, y: currentPoint.y, radiusX: 2, radiusY: 2, force: 1, id: 1 }],
                    });
                    for (let step = 1; step <= 5; step += 1) {
                        await session.send('Input.dispatchTouchEvent', {
                            type: 'touchMove',
                            touchPoints: [{
                                x: currentPoint.x + ((endX - currentPoint.x) * step / 5),
                                y: currentPoint.y + ((endY - currentPoint.y) * step / 5),
                                radiusX: 2,
                                radiusY: 2,
                                force: 1,
                                id: 1,
                            }],
                        });
                    }
                    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
                    await page.waitForTimeout(120);
                    const movement = await page.evaluate(({ id, vertical }) => {
                        const node = document.querySelector(`[data-visual-gesture-id="${id}"]`);
                        return node ? (vertical ? node.scrollTop : node.scrollLeft) : 0;
                    }, { id: candidate.id, vertical });
                    results.push({ ...candidate, axis: vertical ? 'y' : 'x', movement, reached: movement > 1 });
                }
                await session.detach();
                return results;
            })().catch((error) => [{ reached: false, error: error.message }]) : [];
            let scrollEndScreenshot = null;
            if (scrollReachability?.horizontal || scrollReachability?.vertical) {
                await page.evaluate(() => {
                    const candidates = [...document.querySelectorAll('body *')];
                    const horizontal = candidates
                        .filter((node) => /auto|scroll/u.test(getComputedStyle(node).overflowX))
                        .sort((left, right) => (right.scrollWidth - right.clientWidth) - (left.scrollWidth - left.clientWidth))[0];
                    const vertical = candidates
                        .filter((node) => /auto|scroll/u.test(getComputedStyle(node).overflowY))
                        .sort((left, right) => (right.scrollHeight - right.clientHeight) - (left.scrollHeight - left.clientHeight))[0];
                    if (horizontal?.scrollWidth > horizontal?.clientWidth + 2) horizontal.scrollLeft = horizontal.scrollWidth;
                    if (vertical?.scrollHeight > vertical?.clientHeight + 2) vertical.scrollTop = vertical.scrollHeight;
                });
                if (harness.source === 'classic-projects-revisions-harness.html') {
                    await page.evaluate(() => {
                        const portfolio = document.querySelector('[data-projects-list-viewport]');
                        if (portfolio) portfolio.scrollTop = 0;
                        const revisionViewport = [...document.querySelectorAll('[touch-action], [class*="touch-action:pan-y"]')]
                            .find((node) => node.textContent?.includes('REV-007') && node.scrollHeight > node.clientHeight + 2);
                        if (revisionViewport) revisionViewport.scrollTop = revisionViewport.scrollHeight;
                    });
                }
                if (harness.source === 'classic-project-manager-assign-harness.html') {
                    await page.evaluate(() => {
                        const available = document.querySelector('[data-assignment-available-viewport]');
                        const assigned = document.querySelector('[data-assignment-assigned-viewport]');
                        if (available) available.scrollTop = available.scrollHeight;
                        if (assigned) assigned.scrollTop = assigned.scrollHeight;
                    });
                }
                if (harness.source === 'classic-project-manager-team-dashboard-harness.html') {
                    await page.evaluate(() => {
                        const viewport = document.querySelector('[data-team-dashboard-viewport]');
                        if (viewport) viewport.scrollTop = viewport.scrollHeight;
                    });
                }
                if (harness.source === 'gantt-calendar-harness.html') {
                    await page.evaluate(() => {
                        const viewport = document.querySelector('[data-gantt-calendar-viewport="true"]');
                        if (viewport) viewport.scrollTop = viewport.scrollHeight;
                    });
                }
                if (harness.source === 'gantt-pareto-harness.html') {
                    await page.evaluate(() => {
                        const viewport = document.querySelector('[data-gantt-pareto-viewport="true"]');
                        if (viewport) viewport.scrollTop = viewport.scrollHeight;
                    });
                }
                if (harness.source === 'classic-project-manager-team-summary-harness.html') {
                    await page.evaluate(() => {
                        const viewport = document.querySelector('[data-team-summary-viewport]');
                        if (viewport) viewport.scrollTop = viewport.scrollHeight;
                    });
                }
                if (harness.source === 'classic-project-workspace-data-harness.html') {
                    await page.evaluate(() => {
                        const main = document.querySelector('[data-project-edit-main-viewport]');
                        const side = document.querySelector('[data-project-edit-side-viewport]');
                        if (main) main.scrollTop = main.scrollHeight;
                        if (side) side.scrollTop = side.scrollHeight;
                    });
                }
                if (harness.source === 'classic-project-workspace-stakeholders-harness.html') {
                    await page.evaluate(() => {
                        const viewport = document.querySelector('[data-stakeholders-list-viewport]');
                        if (viewport) {
                            viewport.scrollTop = viewport.scrollHeight;
                            viewport.scrollLeft = viewport.scrollWidth;
                        }
                    });
                }
                if (harness.source === 'classic-project-workspace-stakeholder-create-harness.html'
                    || harness.source === 'classic-project-workspace-stakeholder-edit-harness.html') {
                    await page.evaluate(() => {
                        const viewport = document.querySelector('[data-stakeholder-form-viewport]');
                        if (viewport) viewport.scrollTop = viewport.scrollHeight;
                    });
                }
                if (harness.source === 'classic-project-workspace-edt-tree-harness.html') {
                    await page.evaluate(() => {
                        const viewport = document.querySelector('[data-edt-tree-viewport]');
                        if (viewport) {
                            viewport.scrollTop = viewport.scrollHeight;
                            viewport.scrollLeft = viewport.scrollWidth;
                        }
                    });
                }
                if (harness.source === 'classic-project-workspace-edo-tree-harness.html') {
                    await page.evaluate(() => {
                        const viewport = document.querySelector('[data-edo-tree-viewport]');
                        if (viewport) {
                            viewport.scrollTop = viewport.scrollHeight;
                            viewport.scrollLeft = viewport.scrollWidth;
                        }
                    });
                }
                await page.waitForTimeout(50);
                const scrollEndName = harness.source.replace(/\.html$/u, '-scroll-end.png');
                const scrollEndPath = path.join(profileDirectory, scrollEndName);
                await page.screenshot({ path: scrollEndPath, fullPage: false, scale: 'css' }).catch((error) => runtimeErrors.push(`scroll screenshot: ${error.message}`));
                scrollEndScreenshot = path.relative(artifactRoot, scrollEndPath).split(path.sep).join('/');
            }
            const failures = [
                ...(navigationError ? [`navigation: ${navigationError}`] : []),
                ...runtimeErrors.map((error) => `runtime: ${error}`),
                ...(!geometry || geometry.bodyTextLength === 0 ? ['empty surface'] : []),
                ...(geometry?.horizontalOverflow > 4 ? [`document horizontal overflow: ${geometry.horizontalOverflow}px`] : []),
                ...(geometry?.interactiveClipping.length ? [`${geometry.interactiveClipping.length} clipped interactive elements`] : []),
                ...(geometry?.fixedClipping.length ? [`${geometry.fixedClipping.length} clipped fixed elements`] : []),
                ...(scrollReachability?.horizontal && !scrollReachability.horizontal.reached ? ['horizontal scroll end is unreachable'] : []),
                ...(scrollReachability?.vertical && !scrollReachability.vertical.reached ? ['vertical scroll end is unreachable'] : []),
                ...(projectsScrollContract && !projectsScrollContract.passed
                    ? [`projects list ownership failed: ${projectsScrollContract.reason || JSON.stringify(projectsScrollContract)}`]
                    : []),
                ...(budgetScrollContract && !budgetScrollContract.passed
                    ? [`budget table ownership failed: ${budgetScrollContract.reason || JSON.stringify(budgetScrollContract)}`]
                    : []),
                ...gestureReachability.filter(({ reached }) => !reached).map(({ id, axis, error }) => (
                    error ? `touch gesture audit: ${error}` : `touch gesture did not move ${id} on ${axis}`
                )),
            ];
            const result = {
                profile: profile.id,
                surface: harness.id,
                path: harness.path,
                screenshot: path.relative(artifactRoot, screenshotPath).split(path.sep).join('/'),
                scrollEndScreenshot,
                elapsedMs: Date.now() - startedAt,
                geometry,
                scrollReachability,
                projectsScrollContract,
                budgetScrollContract,
                gestureReachability,
                failures,
                status: failures.length ? 'FAIL' : 'PASS',
            };
            report.results.push(result);
            console.log(`${result.status} ${profile.id} ${harness.source}${failures.length ? ` :: ${failures.join(' | ')}` : ''}`);
            await page.close();
        }
        await context.close();
    }
} finally {
    await browser?.close();
    cleanup();
    report.summary = {
        total: report.results.length,
        passed: report.results.filter(({ status }) => status === 'PASS').length,
        failed: report.results.filter(({ status }) => status === 'FAIL').length,
    };
    await writeFile(path.join(artifactRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    await writeFile(path.join(artifactRoot, 'summary.txt'), `${report.summary.passed}/${report.summary.total} PASS; ${report.summary.failed} FAIL\n`, 'utf8');
    console.log(`Evidence: ${artifactRoot}`);
}

assert.equal(report.summary.failed, 0, `${report.summary.failed} combinaciones visuales fallaron; revisar report.json y capturas.`);
