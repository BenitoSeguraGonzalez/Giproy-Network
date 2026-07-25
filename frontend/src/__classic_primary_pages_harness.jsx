import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import './index.css';
import { AuthContext } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import PreciosUnitarios from './pages/PreciosUnitarios';
import Proyectos from './pages/Proyectos';
import { OtrosServicios } from './pages/Placeholders';
import AdminGlobal from './pages/AdminGlobal';
import { AppDialogProvider } from './components/ui/AppDialogProvider';
import ProjectManager from './pages/ProjectManager';

const company = { id: 7, nombre: 'Santiago Bermeo', alias: 'Santiago Bermeo', decimales_moneda: 2 };
const base = { id: 19, nombre: 'Base técnica Santiago Bermeo', tipo_nombre: 'Base de Proyecto' };
const pathname = window.location.pathname;
const isSuperadminDashboard = pathname.includes('dashboard-superadmin');
const isAdminGlobal = pathname.includes('admin-global');
const isDeniedAdminGlobal = pathname.includes('admin-global-denied');
const isProjectManager = pathname.includes('project-manager');
const isProjectsWorkspace = pathname.includes('project-workspace');
const hasSelectedBase = !pathname.includes('precios-unitarios-no-base');
const user = {
    id: 1,
    nombre: 'QA Visual',
    nombre_completo: 'QA Visual',
    rol: (isSuperadminDashboard || (isAdminGlobal && !isDeniedAdminGlobal)) ? 'superadministrador' : 'administrador',
    empresa_id: 7,
    empresa: company,
};
const Page = isProjectManager
    ? ProjectManager
    : (pathname.includes('projects') || isProjectsWorkspace)
    ? Proyectos
    : pathname.includes('precios-unitarios')
        ? PreciosUnitarios
        : pathname.includes('servicios')
            ? OtrosServicios
            : isAdminGlobal
                ? AdminGlobal
            : Dashboard;
const initialPathname = isProjectManager
    ? '/proyectos/gestor'
    : (pathname.includes('projects') || isProjectsWorkspace)
    ? '/proyectos'
    : pathname.includes('precios-unitarios')
        ? '/precios-unitarios'
        : pathname.includes('servicios')
            ? '/servicios'
            : isAdminGlobal
                ? '/admin-global'
            : '/dashboard';
const initialPath = `${initialPathname}${window.location.search}`;

const authValue = {
    user,
    selectedEmpresa: company,
    selectedBaseTrabajo: hasSelectedBase ? base : null,
    activeProject: null,
    licenseInfo: { access_mode: 'readwrite', usados: { proyectos: 12 }, limites: { proyectos: -1 } },
    setSelectedEmpresa: () => {},
    setSelectedBaseTrabajo: () => {},
    setActiveProject: () => {},
    logout: () => {},
};

createRoot(document.getElementById('root')).render(
    <MemoryRouter initialEntries={[initialPath]}>
        <AppDialogProvider>
            <AuthContext.Provider value={authValue}>
                <AppLayout><Page /></AppLayout>
            </AuthContext.Provider>
        </AppDialogProvider>
    </MemoryRouter>,
);
