import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const presupuestoDetailSource = readFileSync(new URL('../src/components/presupuestos/PresupuestoDetail.jsx', import.meta.url), 'utf8');
const presupuestoContextSource = readFileSync(new URL('../src/context/PresupuestoContext.jsx', import.meta.url), 'utf8');
const tanteoSource = readFileSync(new URL('../src/components/presupuestos/TanteoTab.jsx', import.meta.url), 'utf8');
const catalogoSource = readFileSync(new URL('../src/components/presupuestos/CatalogoApuTab.jsx', import.meta.url), 'utf8');
const lineasSource = readFileSync(new URL('../src/components/presupuestos/LineasPresupuestoTab.jsx', import.meta.url), 'utf8');
const apuBudgetEditorSource = readFileSync(new URL('../src/components/presupuestos/ApuBudgetEditor.jsx', import.meta.url), 'utf8');
const presupuestosApiSource = readFileSync(new URL('../src/api/presupuestos.js', import.meta.url), 'utf8');
const apusApiSource = readFileSync(new URL('../src/api/apus.js', import.meta.url), 'utf8');
const reportingApiSource = readFileSync(new URL('../src/api/reporting.js', import.meta.url), 'utf8');
const proyectosApiSource = readFileSync(new URL('../src/api/proyectos.js', import.meta.url), 'utf8');

for (const [name, source] of [
    ['PresupuestoDetail', presupuestoDetailSource],
    ['PresupuestoContext', presupuestoContextSource],
    ['TanteoTab', tanteoSource],
    ['CatalogoApuTab', catalogoSource],
    ['LineasPresupuestoTab', lineasSource],
    ['ApuBudgetEditor', apuBudgetEditorSource],
]) {
    assert.equal(
        source.includes('axiosConfig'),
        false,
        `${name} no debe importar axiosConfig directamente en MODO 1`,
    );
}

assert.equal(
    /\bconsole\.log\s*\(/.test(apuBudgetEditorSource),
    false,
    'ApuBudgetEditor no debe conservar console.log productivos',
);

for (const importStatement of [
    "import { presupuestosApi } from '../../api/presupuestos';",
    "import { proyectosApi } from '../../api/proyectos';",
    "import { equipoApi } from '../../api/equipo';",
    "import reportingApi from '../../api/reporting';",
]) {
    assert.equal(
        presupuestoDetailSource.includes(importStatement),
        true,
        `PresupuestoDetail debe conservar cliente API: ${importStatement}`,
    );
}

for (const eagerModalImport of [
    "import TanteoTab from './TanteoTab';",
    "import ApuEditorModal from './ApuEditorModal';",
    "import IndirectosModal from './IndirectosModal';",
    "import ParetoModal from './ParetoModal';",
    "import NotasGeneralesModal from './NotasGeneralesModal';",
    "import CommonReportPreviewModal from '../reporting/CommonReportPreviewModal';",
    "import ReportGenerationModal from '../reporting/ReportGenerationModal';",
]) {
    assert.equal(
        presupuestoDetailSource.includes(eagerModalImport),
        false,
        `PresupuestoDetail no debe cargar eager el modal diferido: ${eagerModalImport}`,
    );
}

for (const lazyModalDeclaration of [
    "const TanteoTab = React.lazy(() => import('./TanteoTab'));",
    "const ApuEditorModal = React.lazy(() => import('./ApuEditorModal'));",
    "const IndirectosModal = React.lazy(() => import('./IndirectosModal'));",
    "const ParetoModal = React.lazy(() => import('./ParetoModal'));",
    "const NotasGeneralesModal = React.lazy(() => import('./NotasGeneralesModal'));",
    "const CommonReportPreviewModal = React.lazy(() => import('../reporting/CommonReportPreviewModal'));",
    "const ReportGenerationModal = React.lazy(() => import('../reporting/ReportGenerationModal'));",
]) {
    assert.equal(
        presupuestoDetailSource.includes(lazyModalDeclaration),
        true,
        `PresupuestoDetail debe conservar lazy-load de modal: ${lazyModalDeclaration}`,
    );
}

for (const [stateToken, componentToken] of [
    ['tanteoVisible', '<TanteoTab'],
    ['editingApuId', '<ApuEditorModal'],
    ['isIndirectosOpen', '<IndirectosModal'],
    ['isParetoOpen', '<ParetoModal'],
    ['isNotasOpen', '<NotasGeneralesModal'],
    ['showReportPreview', '<CommonReportPreviewModal'],
    ['generatingReport', '<ReportGenerationModal'],
]) {
    const lazyRenderPattern = new RegExp(
        `${stateToken}\\s*\\?\\s*\\([\\s\\S]*?<React\\.Suspense\\s+fallback=\\{null\\}>[\\s\\S]*?${componentToken}`,
    );
    assert.match(
        presupuestoDetailSource,
        lazyRenderPattern,
        `PresupuestoDetail debe montar ${componentToken} bajo Suspense solo cuando ${stateToken} este activo`,
    );
}

assert.equal(
    presupuestoContextSource.includes("import { presupuestosApi } from '../api/presupuestos';"),
    true,
    'PresupuestoContext debe conservar presupuestosApi',
);

assert.equal(
    tanteoSource.includes("import apusApi from '../../api/apus';") &&
    tanteoSource.includes("import { presupuestosApi } from '../../api/presupuestos';"),
    true,
    'TanteoTab debe conservar apusApi y presupuestosApi',
);

assert.equal(
    catalogoSource.includes("import apusApi from '../../api/apus';"),
    true,
    'CatalogoApuTab debe conservar apusApi',
);

assert.equal(
    apuBudgetEditorSource.includes("import apusApi from '../../api/apus';") &&
    apuBudgetEditorSource.includes("import recursosApi from '../../api/recursos';") &&
    apuBudgetEditorSource.includes("import subcategoriasItemsApi from '../../api/subcategoriasItems';"),
    true,
    'ApuBudgetEditor debe conservar clientes de APU, recursos y subcategorias',
);

assert.equal(
    lineasSource.includes("import { edtApi } from '../../api/edt';"),
    true,
    'LineasPresupuestoTab debe conservar edtApi para arbol EDT',
);

for (const token of [
    'const currentEmpresaId = selectedEmpresa?.id || user?.empresa_id || null;',
    'presupuestosApi.getById(presupuestoId, currentEmpresaId)',
    'proyectosApi.getById(proyectoId, currentEmpresaId)',
    'presupuestosApi.markGeneralNotesOpened(activePresupuesto?.id, currentEmpresaId)',
    'presupuestosApi.markLineNotesOpened(linea.id, currentEmpresaId)',
    'presupuestosApi.bulkUpdateLineQuantities(',
    'equipoApi.createLock({',
    'equipoApi.createProposal({',
    'presupuestosApi.clearTanteo(activePresupuesto.id, currentEmpresaId)',
    'reportingApi.previewReport({',
    'reportingApi.exportReport({',
    'empresa_id: reportEmpresaId',
]) {
    assert.equal(
        presupuestoDetailSource.includes(token),
        true,
        `PresupuestoDetail debe conservar uso critico de API: ${token}`,
    );
}

for (const token of [
    'const currentEmpresaId = useMemo(() => selectedEmpresa?.id || user?.empresa_id || null, [selectedEmpresa, user]);',
    'presupuestosApi.getById(id, currentEmpresaId, options)',
    'presupuestosApi.updateLine(lineaId, updateData, currentEmpresaId)',
    'presupuestosApi.addLine(activePresupuesto.id, newLine, currentEmpresaId)',
    'presupuestosApi.deleteLine(lineaId, currentEmpresaId)',
    'presupuestosApi.moveLine(lineaId, moveData, currentEmpresaId)',
    'presupuestosApi.getNotesSummary(targetId, currentEmpresaId)',
    'presupuestosApi.markOpened(targetId, currentEmpresaId)',
]) {
    assert.equal(
        presupuestoContextSource.includes(token),
        true,
        `PresupuestoContext debe conservar uso critico de API: ${token}`,
    );
}

for (const token of [
    'const currentEmpresaId = selectedEmpresa?.id || user?.empresa_id || null;',
    'apusApi.getById(selectedApuId, currentEmpresaId)',
    'presupuestosApi.revertTanteoRecurso(activePresupuesto.id, apuLineaId, currentEmpresaId)',
    'presupuestosApi.applyTanteo(activePresupuesto.id, mutaciones, currentEmpresaId)',
]) {
    assert.equal(
        tanteoSource.includes(token),
        true,
        `TanteoTab debe conservar uso critico de API: ${token}`,
    );
}

for (const token of [
    'const empresaId = selectedEmpresa?.id || user?.empresa_id || null;',
    'apusApi.getAll({ base_trabajo_id: activeProyecto.base_trabajo_id, empresa_id: empresaId, limit: 1000 }, { summary: true })',
]) {
    assert.equal(
        catalogoSource.includes(token),
        true,
        `CatalogoApuTab debe conservar uso critico de API: ${token}`,
    );
}

for (const token of [
    'recursosApi.getAll(projectBaseId, null, empId, projectRevision)',
    'recursosApi.getAll(projectBaseId, null, empId, null)',
    'apusApi.getAll({',
    'revision: projectRevision',
    'revision: null',
    'activePresupuesto?.proyecto_id ? { proyecto_id: activePresupuesto.proyecto_id } : {}',
    'subcategoriasItemsApi.getAll(projectBaseId, null, empId, projectRevision)',
    'subcategoriasItemsApi.getAll(projectBaseId, null, empId, null)',
    'recursosApi.getUnidades(fullApu.subcategoria_item?.subcategoria_codigo || 5, projectBaseId, empId)',
]) {
    assert.equal(
        apuBudgetEditorSource.includes(token),
        true,
        `ApuBudgetEditor debe conservar fallback/flujo critico: ${token}`,
    );
}

assert.equal(
    apuBudgetEditorSource.includes('return asEditorLine ? 2 : 5;'),
    true,
    'ApuBudgetEditor debe clasificar APUs hijos como Materiales cuando ya son linea del analisis',
);

assert.equal(
    apuBudgetEditorSource.includes('resolveItemCategoryId(item, isApu, { asEditorLine: true })'),
    true,
    'ApuBudgetEditor debe aplicar la clasificacion de linea al cargar APUs hijos',
);

assert.equal(
    apuBudgetEditorSource.includes('const itemCatId = resolveItemCategoryId(item, isApu, { asEditorLine: true }) || catIdFallback;'),
    true,
    'ApuBudgetEditor debe aplicar la clasificacion de linea al agregar APUs hijos desde Presupuestos',
);

assert.equal(
    apuBudgetEditorSource.includes('APUs Relacionados (Hijos)'),
    false,
    'ApuBudgetEditor no debe crear una categoria principal separada para APUs hijos',
);

assert.equal(
    lineasSource.includes('const empresaId = selectedEmpresa?.id || user?.empresa_id || null;') &&
    lineasSource.includes('edtApi.getTree(activeProyecto.id, empresaId)'),
    true,
    'LineasPresupuestoTab debe conservar carga EDT con empresa activa',
);

assert.equal(
    (lineasSource.match(/onDoubleClick=\{\(e\) => \{/g) || []).length >= 2,
    true,
    'LineasPresupuestoTab debe conservar doble click en lineas APU para abrir editor',
);

for (const token of [
    'if (!linea.apu_id || e.target instanceof HTMLInputElement || e.target.closest(\'button\') || e.target.closest(\'[data-budget-drag-handle="true"]\'))',
    'onEditApu && onEditApu(linea);',
]) {
    assert.equal(
        lineasSource.includes(token),
        true,
        `LineasPresupuestoTab debe conservar guarda de doble click APU: ${token}`,
    );
}

for (const headerLabel of ['CÓD. EDT', 'UNIDAD', 'P. UNITARIO']) {
    assert.equal(
        lineasSource.includes(headerLabel),
        true,
        `LineasPresupuestoTab debe conservar encabezado localizado: ${headerLabel}`,
    );
}

assert.match(
    lineasSource,
    /BUDGET_COLUMN_WIDTH\s*=\s*\{[\s\S]*actions:\s*'w-\[\d+px\]'[\s\S]*\}/,
    'LineasPresupuestoTab debe centralizar el ancho de acciones del grid',
);

assert.equal(
    (lineasSource.match(/BUDGET_COLUMN_WIDTH\.actions/g) || []).length >= 4,
    true,
    'LineasPresupuestoTab debe reutilizar el ancho de acciones en header, capitulos y lineas',
);

assert.equal(
    lineasSource.includes('w-[96px] shrink-0'),
    false,
    'LineasPresupuestoTab no debe conservar placeholder legacy de acciones desalineado',
);

for (const method of [
    'getByProyecto',
    'getById',
    'create',
    'addLine',
    'deleteLine',
    'moveLine',
    'updateLine',
    'bulkUpdateLineQuantities',
    'getNotesSummary',
    'getPareto',
    'getIndirectos',
    'updateIndirectos',
    'markOpened',
    'markGeneralNotesOpened',
    'getGeneralNotes',
    'createGeneralNote',
    'getLineNotes',
    'createLineNote',
    'markLineNotesOpened',
    'applyTanteo',
    'clearTanteo',
    'revertTanteoRecurso',
]) {
    assert.match(
        presupuestosApiSource,
        new RegExp(`\\b${method}\\s*:`),
        `presupuestosApi debe exponer ${method}`,
    );
}

for (const endpoint of [
    "'/presupuestos/'",
    '`/presupuestos/${id}`',
    '`/presupuestos/${presupuestoId}/lineas`',
    '`/presupuestos/lineas/${lineaId}`',
    '`/presupuestos/lineas/${lineaId}/move`',
    '`/presupuestos/${presupuestoId}/lineas/bulk-cantidad`',
    '`/presupuestos/${presupuestoId}/notas/summary`',
    '`/presupuestos/${presupuestoId}/pareto`',
    '`/presupuestos/${presupuestoId}/indirectos`',
    '`/presupuestos/${presupuestoId}/notas/generales`',
    '`/presupuestos/lineas/${lineaId}/notas`',
    '`/presupuestos/${presupuestoId}/tanteo`',
    '`/presupuestos/${presupuestoId}/tanteo/clear-all`',
    '`/presupuestos/${presupuestoId}/tanteo/${recursoId}`',
]) {
    assert.equal(
        presupuestosApiSource.includes(endpoint),
        true,
        `presupuestosApi debe conservar endpoint: ${endpoint}`,
    );
}

assert.match(
    presupuestosApiSource,
    /getByProyecto\s*:[\s\S]*withTenantParams\(\{\s*proyecto_id:\s*proyectoId\s*\},\s*empresaId\)/,
    'presupuestosApi.getByProyecto debe conservar proyecto_id y empresaId',
);

assert.match(
    presupuestosApiSource,
    /getById\s*:[\s\S]*refresh_prices:\s*options\.refreshPrices\s*\?\?\s*true[\s\S]*withTenantConfig\([\s\S]*empresaId\)/,
    'presupuestosApi.getById debe conservar refresh_prices y tenant',
);

assert.match(
    apusApiSource,
    /getAll\s*:[\s\S]*withTenantParams\(\{[\s\S]*\.\.\.\(params \|\| \{\}\)[\s\S]*options\.summary[\s\S]*summary:\s*true/s,
    'apusApi.getAll debe conservar params tenant y permitir summary para catalogo APU',
);

assert.match(
    apusApiSource,
    /getById\s*:[\s\S]*withTenantConfig\(\{\},\s*empresaId\)/,
    'apusApi.getById debe conservar empresaId para tanteo',
);

for (const token of [
    "url: '/reporting/preview'",
    "url: '/reporting/export'",
    "responseType: 'blob'",
    'withTenantConfig({}, empresa_id ?? empresaId)',
]) {
    assert.equal(
        reportingApiSource.includes(token),
        true,
        `reportingApi debe conservar contrato de reportes: ${token}`,
    );
}

assert.match(
    proyectosApiSource,
    /getById\s*:[\s\S]*withTenantConfig\(\{\},\s*empresaId\)/,
    'proyectosApi.getById debe conservar empresaId',
);

console.log('smoke-classic-presupuesto-api-boundary: ok');
