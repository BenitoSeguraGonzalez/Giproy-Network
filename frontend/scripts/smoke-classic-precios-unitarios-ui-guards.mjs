import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const files = {
    recursos: readFileSync(new URL('../src/pages/Recursos.jsx', import.meta.url), 'utf8'),
    apus: readFileSync(new URL('../src/pages/APUs.jsx', import.meta.url), 'utf8'),
    subcategorias: readFileSync(new URL('../src/pages/Subcategorias.jsx', import.meta.url), 'utf8'),
    resourceEditor: readFileSync(new URL('../src/components/precios-unitarios/ResourceEditorModal.jsx', import.meta.url), 'utf8'),
    bulkDelete: readFileSync(new URL('../src/components/precios-unitarios/BulkDeleteConfirmModal.jsx', import.meta.url), 'utf8'),
};

for (const [name, source] of Object.entries(files)) {
    assert.equal(source.includes('AppModalShell'), true, `${name} debe usar AppModalShell para modales clasicos.`);
}

for (const name of ['recursos', 'apus', 'subcategorias', 'resourceEditor', 'bulkDelete']) {
    assert.equal(files[name].includes('z-[1000]'), true, `${name} debe conservar z-index alto en Precios Unitarios.`);
}

assert.match(
    files.resourceEditor,
    /AppModalFooter[\s\S]*aria-label="Cancelar"[\s\S]*<X[\s\S]*LiquidButton[\s\S]*aria-label=\{submitLabel\}[\s\S]*<Save/,
    'El editor de recursos debe conservar footer compacto con botones por icono.',
);

assert.doesNotMatch(
    files.resourceEditor,
    />\s*(?:Ownership|Governing)\b/i,
    'El editor de recursos no debe reintroducir etiquetas visibles en ingles.',
);

assert.equal(
    (files.resourceEditor.match(/ChevronDown/g) || []).length,
    0,
    'El editor de recursos no debe volver al patron de doble flecha en selectores.',
);

[
    'APU_EDITOR_DESKTOP_MIN_WIDTH',
    'APU_EDITOR_DESKTOP_MIN_HEIGHT',
    'APU_EDITOR_HEADER_HEIGHT_PX',
    'isEditorCompact',
    'h-7 bg-white',
].forEach((token) => {
    assert.equal(files.apus.includes(token), true, `APUs debe conservar densidad calculada y responsive: ${token}`);
});

[
    "import BulkDeleteConfirmModal from '../components/precios-unitarios/BulkDeleteConfirmModal';",
    "import ResourceEditorModal from '../components/precios-unitarios/ResourceEditorModal';",
    "import CommonReportPreviewModal from '../components/reporting/CommonReportPreviewModal';",
    "import ReportGenerationModal from '../components/reporting/ReportGenerationModal';",
].forEach((token) => {
    assert.equal(files.apus.includes(token), false, `APUs no debe recuperar import estatico pesado: ${token}`);
});

[
    "const BulkDeleteConfirmModal = React.lazy(() => import('../components/precios-unitarios/BulkDeleteConfirmModal'));",
    "const ResourceEditorModal = React.lazy(() => import('../components/precios-unitarios/ResourceEditorModal'));",
    "const CommonReportPreviewModal = React.lazy(() => import('../components/reporting/CommonReportPreviewModal'));",
    "const ReportGenerationModal = React.lazy(() => import('../components/reporting/ReportGenerationModal'));",
    "}, { summary: true });",
].forEach((token) => {
    assert.equal(files.apus.includes(token), true, `APUs debe conservar lazy/summary clasico: ${token}`);
});

assert.match(
    files.apus,
    /const resNestedApus = await apusApi\.getAll\(\{[\s\S]*limit: 1000[\s\S]*\}\);[\s\S]*setNestedApusCatalog/,
    'APUs debe conservar catalogo anidado completo para validar ciclos entre APUs.',
);

console.log('smoke-classic-precios-unitarios-ui-guards: ok');
