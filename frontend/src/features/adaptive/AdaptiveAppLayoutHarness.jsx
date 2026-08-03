/* eslint-disable react-refresh/only-export-components */
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import '../../index.css';
import { AuthContext } from '../../context/AuthContext';
import AppLayout from '../../layouts/AppLayout';

const authValue = {
    user: { id: 91, nombre_completo: 'Usuario de validación', rol: 'usuario', empresa_id: 3 },
    logout: () => {},
    selectedEmpresa: { id: 3, nombre: 'Empresa de validación' },
    setSelectedEmpresa: () => {},
    selectedBaseTrabajo: { id: 7, nombre: 'Base técnica activa', tipo_nombre: 'Base de Proyecto' },
    activeProject: { id: 12, nombre: 'Proyecto adaptable' },
    licenseInfo: null,
};

const contentRows = Array.from({ length: 12 }, (_, index) => index + 1);

const AdaptiveAppLayoutHarness = () => (
    <MemoryRouter initialEntries={['/dashboard']}>
        <AuthContext.Provider value={authValue}>
            <AppLayout>
                <main className="h-full overflow-auto bg-[#F2F4F7] p-4" data-adaptive-harness-content>
                    <section className="mx-auto max-w-[1800px] border border-zinc-200 bg-white p-4">
                        <header className="flex min-h-11 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                            <div>
                                <h1 className="text-lg font-black text-zinc-900">Superficie operativa clásica</h1>
                                <p className="text-xs text-zinc-500">La composición cambia sin escalar componentes.</p>
                            </div>
                            <button type="button" className="min-h-11 rounded-lg bg-[#F39200] px-4 text-sm font-bold text-white">Acción principal</button>
                        </header>
                        <div className="mt-4 overflow-x-auto" data-adaptive-harness-table>
                            <div className="min-w-[760px]">
                                {contentRows.map((row) => <div key={row} className="grid min-h-11 grid-cols-[90px_minmax(260px,1fr)_160px_120px] items-center border-b border-zinc-100 text-xs"><strong>PR-{row}</strong><span>Registro operativo {row}</span><span>En revisión</span><span className="text-right">$ {row * 1250}</span></div>)}
                            </div>
                        </div>
                    </section>
                </main>
            </AppLayout>
        </AuthContext.Provider>
    </MemoryRouter>
);

createRoot(document.getElementById('root')).render(<AdaptiveAppLayoutHarness />);
