import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const proyectosSource = readFileSync(new URL('../src/pages/Proyectos.jsx', import.meta.url), 'utf8');
const proyectosApiSource = readFileSync(new URL('../src/api/proyectos.js', import.meta.url), 'utf8');
const ganttParetoSource = readFileSync(new URL('../src/components/projects/GanttParetoModal.jsx', import.meta.url), 'utf8');

assert.equal(
    /\bconsole\.log\s*\(/.test(proyectosSource),
    false,
    'Proyectos no debe conservar console.log productivos',
);

for (const importStatement of [
    "import { proyectosApi } from '../api/proyectos';",
    "import { proyectoDetalleApi } from '../api/proyectoDetalle';",
    "import { presupuestosApi } from '../api/presupuestos';",
    "import { basesTrabajoApi } from '../api/basesTrabajo';",
]) {
    assert.equal(
        proyectosSource.includes(importStatement),
        true,
        `Proyectos debe conservar cliente API critico: ${importStatement}`,
    );
}

for (const token of [
    'const handleCreateProject = async (e) => {',
    'await proyectosApi.create(payload, empId)',
    'const renderCreateProjectModal = () => (',
    '{renderCreateProjectModal()}',
    'const handleOpenRevisionModal = async (project, options = {}) => {',
    "const { mode = 'open', targetColumnId = null } = options;",
    'const rootCode = project.codigo_root || project.codigo;',
    'const empIdForApi = project.empresa_id;',
    'proyectosApi.getRevisions(',
    'await activateProjectSelection(revisions[0])',
    'setProjectRevisions(revisions)',
    'setShowRevisionModal(true)',
    'revisionBudgetMap',
    'const createdRevision = await proyectosApi.createRevision(projectId, empId)',
    'const refreshRevisionFamilyState = useCallback(async (rootCode, empresaId, rootProjectFallback = null) => {',
    'await refreshRevisionFamilyState(rootCode, revisionEmpresaId, selectedProject)',
    'const refreshed = await refreshRevisionFamilyState(rootCode, empId, selectedProject)',
    'await activateProjectSelection(createdRevision, { replace: true })',
    'Clonar Proyecto Completo',
    'aria-label={`Clonar proyecto completo ${project.nombre || project.codigo || project.id}`}',
    'const requestId = ++projectFetchRequestRef.current;',
    'if (requestId !== projectFetchRequestRef.current) return false;',
    'const data = Array.isArray(response) ? response : [];',
    'const detailBatchSize = 8;',
]) {
    assert.equal(
        proyectosSource.includes(token),
        true,
        `Proyectos debe conservar flujo critico: ${token}`,
    );
}

for (const token of [
    'ArchiveX',
    'const getProjectRevisionUpdateMeta = (project, revisions = []) => {',
    'const sortProjectsByLatestUpdate = (projects = []) => (',
    'sortProjectsByLatestUpdate(proyectos.filter((project) => {',
    'Actualizacion',
    'Rev. ${revision}: ${formatProjectUpdateDateTime(dateValue)}',
    'Mover proyecto a papelera',
    '<ArchiveX className="pointer-events-none h-4 w-4" />',
]) {
    assert.equal(
        proyectosSource.includes(token),
        true,
        `Proyectos debe conservar listado ordenado/columna actualizacion/icono ArchiveX: ${token}`,
    );
}

assert.equal(
    /data-project-delete-action="true"[\s\S]*?<Trash2 className="pointer-events-none h-4 w-4" \/>/.test(proyectosSource),
    false,
    'La accion destructiva por fila no debe usar Trash2 para no confundirse con Papelera global',
);

assert.match(
    proyectosSource,
    /if\s*\(PROJECTS_HTML_REFERENCE_LANDING\)\s*\{[\s\S]*renderHtmlPortfolioLanding\(\)[\s\S]*renderCreateProjectModal\(\)[\s\S]*renderProjectDeleteModal\(\)/,
    'Proyectos debe montar el modal Nuevo Proyecto en la rama HTML activa',
);

assert.match(
    proyectosApiSource,
    /create\s*:\s*async\s*\(\s*proyectoData\s*,\s*empresaId\s*=\s*null\s*\)\s*=>[\s\S]*axiosInstance\.post\('\/proyectos\/',\s*proyectoData,\s*withTenantConfig\(\{\},\s*empresaId\)\)/,
    'proyectosApi.create debe conservar empresaId via withTenantConfig',
);

for (const token of [
    'Creando proyecto con payload',
    'Iniciando apertura de proyecto',
    'Revisiones obtenidas',
    'Acceso directo a revisión única',
    'Mostrando modal de múltiples revisiones',
]) {
    assert.equal(
        proyectosSource.includes(token),
        false,
        `Proyectos no debe conservar traza productiva: ${token}`,
    );
}

assert.equal(
    ganttParetoSource.includes('AnimatedSelectedIcon'),
    false,
    'GanttParetoModal no debe referenciar AnimatedSelectedIcon sin definicion',
);

assert.equal(
    ganttParetoSource.includes('CheckCircle2'),
    true,
    'GanttParetoModal debe usar un icono real importado para Pareto activo',
);

console.log('smoke-classic-proyectos-logging-boundary: ok');
