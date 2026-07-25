/* eslint-disable react-refresh/only-export-components */
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import '../../index.css';
import { AuthContext } from '../../context/AuthContext';
import AppLayout from '../../layouts/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

const authValue = {
    user: { id: 91, nombre_completo: 'Superadministrador de validación', rol: 'superadministrador', empresa_id: 3 },
    logout: () => {},
    selectedEmpresa: { id: 3, nombre: 'Empresa de validación' },
    setSelectedEmpresa: () => {},
    selectedBaseTrabajo: { id: 7, nombre: 'Base técnica activa', tipo_nombre: 'Base de Proyecto' },
    activeProject: { id: 12, nombre: 'Proyecto adaptable' },
    licenseInfo: null,
};

const contentRows = Array.from({ length: 36 }, (_, index) => index + 1);

const AdaptiveAppLayoutHarness = () => (
    <MemoryRouter initialEntries={['/dashboard']}>
        <AuthContext.Provider value={authValue}>
            <AppLayout>
                <main className="min-h-[1400px] bg-[#F2F4F7] p-4" data-adaptive-harness-content>
                    <section className="mx-auto max-w-[1800px] border border-zinc-200 bg-white p-4">
                        <header className="flex min-h-11 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                            <div>
                                <h1 className="text-lg font-black text-zinc-900">Superficie operativa clásica</h1>
                                <p className="text-xs text-zinc-500">La composición cambia sin escalar componentes.</p>
                            </div>
                            <button type="button" className="min-h-11 rounded-lg bg-[#F39200] px-4 text-sm font-bold text-white">Acción principal</button>
                        </header>
                        <Table
                            className="min-w-[760px] text-xs"
                            containerClassName="mt-4"
                            containerProps={{ 'data-adaptive-harness-table': true }}
                            scrollLabel="Registros operativos de validación"
                        >
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Registro</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Importe</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contentRows.map((row) => (
                                    <TableRow key={row}>
                                        <TableCell className="font-bold">PR-{row}</TableCell>
                                        <TableCell>Registro operativo {row}</TableCell>
                                        <TableCell>En revisión</TableCell>
                                        <TableCell className="text-right tabular-nums">$ {row * 1250}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="mt-8 min-h-11 border-t border-zinc-200 pt-4 text-xs font-bold text-zinc-700" data-adaptive-harness-last-content>
                            Último contenido operativo alcanzable
                        </div>
                    </section>
                </main>
            </AppLayout>
        </AuthContext.Provider>
    </MemoryRouter>
);

createRoot(document.getElementById('root')).render(<AdaptiveAppLayoutHarness />);
