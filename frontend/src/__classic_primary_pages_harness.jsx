import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import './index.css';
import { AuthContext } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import PreciosUnitarios from './pages/PreciosUnitarios';
import Proyectos from './pages/Proyectos';

const company = { id: 7, nombre: 'Santiago Bermeo', alias: 'Santiago Bermeo', decimales_moneda: 2 };
const base = { id: 19, nombre: 'Base técnica Santiago Bermeo', tipo_nombre: 'Base de Proyecto' };
const user = { id: 1, nombre: 'QA Visual', nombre_completo: 'QA Visual', rol: 'administrador', empresa_id: 7, empresa: company };
const pathname = window.location.pathname;
const Page = pathname.includes('projects') ? Proyectos : pathname.includes('precios-unitarios') ? PreciosUnitarios : Dashboard;
const initialPath = pathname.includes('projects') ? '/proyectos' : pathname.includes('precios-unitarios') ? '/precios-unitarios' : '/dashboard';

const authValue = {
    user,
    selectedEmpresa: company,
    selectedBaseTrabajo: base,
    activeProject: null,
    licenseInfo: { access_mode: 'readwrite', usados: { proyectos: 12 }, limites: { proyectos: -1 } },
    setSelectedEmpresa: () => {},
    setSelectedBaseTrabajo: () => {},
    setActiveProject: () => {},
    logout: () => {},
};

createRoot(document.getElementById('root')).render(
    <MemoryRouter initialEntries={[initialPath]}>
        <AuthContext.Provider value={authValue}>
            <AppLayout><Page /></AppLayout>
        </AuthContext.Provider>
    </MemoryRouter>,
);
