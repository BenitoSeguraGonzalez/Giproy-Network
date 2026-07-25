import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import './index.css';
import { AuthContext } from './context/AuthContext';
import { AppDialogProvider } from './components/ui/AppDialogProvider';
import { PresupuestoProvider } from './context/PresupuestoContext';
import PresupuestoDetail from './components/presupuestos/PresupuestoDetail';
import ResourceEditorModal from './components/precios-unitarios/ResourceEditorModal';
import CommonReportPreviewModal from './components/reporting/CommonReportPreviewModal';
import ReportGenerationModal from './components/reporting/ReportGenerationModal';

const company = {
    id: 7,
    nombre: 'Santiago Bermeo',
    alias: 'Santiago Bermeo',
    decimales_moneda: 2,
};
const project = {
    id: 1,
    codigo: 'SB-001',
    codigo_root: 'SB-001',
    nombre: 'Complejo hospitalario interdisciplinario Santiago Bermeo',
    empresa_id: 7,
    base_trabajo_id: 19,
    moneda: 'USD',
    revision: 3,
};
const user = {
    id: 1,
    nombre: 'QA Visual',
    nombre_completo: 'QA Visual',
    rol: 'administrador',
    empresa_id: 7,
    empresa: company,
};
const authValue = {
    user,
    selectedEmpresa: company,
    selectedBaseTrabajo: {
        id: 19,
        nombre: 'Base técnica Santiago Bermeo',
        tipo_nombre: 'Base de Proyecto',
    },
    activeProject: project,
    licenseInfo: {
        access_mode: 'readwrite',
        usados: { proyectos: 12 },
        limites: { proyectos: -1 },
    },
    setSelectedEmpresa: () => {},
    setSelectedBaseTrabajo: () => {},
    setActiveProject: () => {},
    logout: () => {},
};

const harnessPath = window.location.pathname;
const isResourceEditorHarness = harnessPath.endsWith('classic-project-workspace-budget-resource-editor-harness.html');
const isReportPreviewHarness = harnessPath.endsWith('classic-project-workspace-budget-report-preview-harness.html');
const isReportGenerationHarness = harnessPath.endsWith('classic-project-workspace-budget-report-generation-harness.html');

const reportPreview = {
    title: 'Previsualización del presupuesto',
    report_type: 'presupuesto',
    selection_count: 1,
    variant: 'with_apus',
    items: [{
        id: 501,
        codigo: 'SB-001-PRES-01',
        descripcion: 'Presupuesto general · Complejo hospitalario interdisciplinario Santiago Bermeo',
        unidad: 'glb',
        costo_directo: 381437.12,
        costo_indirecto: 47679.64,
        precio_total: 493484.27,
        summary_cards: [
            { label: 'Costo directo', value: 381437.12, kind: 'money' },
            { label: 'Indirectos', value: 47679.64, kind: 'money' },
            { label: 'Total con IVA', value: 493484.27, kind: 'money', tone: 'total' },
        ],
        fields: [
            { label: 'Empresa', value: 'Santiago Bermeo' },
            { label: 'Proyecto', value: 'Complejo hospitalario interdisciplinario' },
            { label: 'Revisión', value: 'R003' },
            { label: 'Moneda', value: 'USD' },
        ],
        lineas: Array.from({ length: 14 }, (_, index) => ({
            codigo: `EDT-${String(index + 1).padStart(2, '0')}`,
            descripcion: index % 5 === 0
                ? `Cuenta de control interdisciplinaria ${index + 1}`
                : `Partida técnica de construcción especializada ${index + 1}`,
            unidad: index % 3 === 0 ? 'm³' : index % 3 === 1 ? 'm²' : 'und',
            cantidad: (index + 1) * 1.25,
            precio: 925 + (index * 137.5),
            rendimiento: 1,
            subtotal: (index + 1) * 1156.25,
            is_structural: index % 5 === 0,
        })),
    }],
};

const ResourceEditorHarness = () => {
    const [form, setForm] = useState({
        descripcion: 'Hormigón premezclado de alta resistencia f’c 35 MPa',
        precio: '128.50',
        unidad_id: 1,
        cod_cpc_id: 77,
        cpc_display: '37540.10 - Hormigones preparados para construcción',
        especificaciones: 'Suministro certificado, transporte incluido y control de calidad en obra.',
        equipment_ownership_kind: '',
        governing_resource_kind: '',
        omniclass_codigo: '23-13 13 13',
        omniclass_titulo: 'Concrete',
    });
    return (
        <ResourceEditorModal
            isOpen
            onClose={() => {}}
            onSubmit={(event) => event.preventDefault()}
            editingRecurso={{ id: 7101 }}
            form={form}
            setForm={setForm}
            unidades={[
                { id: 1, codigo: 'm3', descripcion: 'm³' },
                { id: 2, codigo: 'm2', descripcion: 'm²' },
                { id: 3, codigo: 'und', descripcion: 'und' },
            ]}
            onSpellCheck={() => {}}
            title="Editar recurso del presupuesto"
            subtitle="Material · REC-001"
            submitLabel="Guardar recurso"
            currentOmniClassTable="23"
            formatMonedaInput={(value) => String(value ?? '')}
            currentCategoryId={2}
        />
    );
};

const HarnessSurface = () => {
    if (isResourceEditorHarness) return <ResourceEditorHarness />;
    if (isReportPreviewHarness) {
        return (
            <CommonReportPreviewModal
                isOpen
                onClose={() => {}}
                preview={reportPreview}
                onExportExcel={() => {}}
                onExportPdf={() => {}}
                onExportPdfFromExcel={() => {}}
            />
        );
    }
    if (isReportGenerationHarness) {
        return (
            <ReportGenerationModal
                isOpen
                title="Generando presupuesto con APUs"
                message="Estamos preparando el documento técnico y sus anexos. Esta operación puede tardar unos segundos."
            />
        );
    }
    return (
        <PresupuestoProvider>
            <main className="h-dvh min-h-0 overflow-hidden bg-[#f7f7f4]">
                <PresupuestoDetail
                    inlineProyectoId={1}
                    inlinePresupuestoId={501}
                />
            </main>
        </PresupuestoProvider>
    );
};

createRoot(document.getElementById('root')).render(
    <MemoryRouter initialEntries={['/proyectos/1/presupuesto/501']}>
        <AppDialogProvider>
            <AuthContext.Provider value={authValue}>
                <HarnessSurface />
            </AuthContext.Provider>
        </AppDialogProvider>
    </MemoryRouter>,
);
