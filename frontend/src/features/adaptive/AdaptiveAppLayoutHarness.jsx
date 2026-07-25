/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import '../../index.css';
import { AuthContext } from '../../context/AuthContext';
import AppLayout from '../../layouts/AppLayout';
import { AppModalBody, AppModalFooter, AppModalHeader, AppModalShell } from '../../components/ui/app-modal';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Textarea } from '../../components/ui/textarea';
import AsyncState from '../../components/ui/async-state';

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

const AdaptiveAppLayoutHarness = () => {
    const [modalOpen, setModalOpen] = useState(false);

    return (
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
                            <button type="button" onClick={() => setModalOpen(true)} className="min-h-11 rounded-lg bg-[#F39200] px-4 text-sm font-bold text-white">Abrir diálogo</button>
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
                        <form className="mt-6 border-t border-zinc-200 pt-4" data-adaptive-harness-form>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="min-w-0 space-y-2">
                                    <Label htmlFor="adaptive-name">Nombre operativo</Label>
                                    <Input id="adaptive-name" defaultValue="Registro de validación" />
                                </div>
                                <div className="min-w-0 space-y-2">
                                    <Label htmlFor="adaptive-code">Código</Label>
                                    <Input id="adaptive-code" defaultValue="PR-2026-0001" />
                                </div>
                                <div className="min-w-0 space-y-2 md:col-span-2">
                                    <Label htmlFor="adaptive-description">Descripción</Label>
                                    <Textarea id="adaptive-description" defaultValue="Contenido representativo para comprobar reflujo y teclado virtual." />
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap justify-end gap-2">
                                <button type="button" className="min-h-[var(--app-control-target,2.5rem)] rounded-lg border border-zinc-200 px-4 text-sm font-bold">Cancelar</button>
                                <button type="submit" className="min-h-[var(--app-control-target,2.5rem)] rounded-lg bg-[#F39200] px-4 text-sm font-bold text-white">Guardar registro</button>
                            </div>
                        </form>
                        <section className="mt-6 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3" data-adaptive-harness-async-states>
                            <AsyncState compact state="loading" description="Sin bloquear el resto de la superficie." />
                            <AsyncState compact state="empty" description="Crea el primer registro cuando estés preparado." />
                            <AsyncState
                                compact
                                state="error"
                                description="Revisa la conexión y vuelve a intentarlo. La información existente permanece intacta."
                                actionLabel="Reintentar operación"
                                onAction={() => {}}
                            />
                        </section>
                        <div className="mt-8 min-h-11 border-t border-zinc-200 pt-4 text-xs font-bold text-zinc-700" data-adaptive-harness-last-content>
                            Último contenido operativo alcanzable
                        </div>
                    </section>
                </main>
                <AppModalShell isOpen={modalOpen} onClose={() => setModalOpen(false)} ariaLabel="Edición operativa de validación">
                    <AppModalHeader title="Edición operativa" subtitle="Cabecera persistente" onClose={() => setModalOpen(false)} />
                    <AppModalBody>
                        <div className="space-y-3" data-adaptive-harness-modal-body>
                            {Array.from({ length: 36 }, (_, index) => (
                                <p key={index} className="rounded-lg border border-zinc-200 bg-white p-3 text-sm">
                                    Bloque de contenido desplazable {index + 1}
                                </p>
                            ))}
                        </div>
                    </AppModalBody>
                    <AppModalFooter>
                        <button type="button" onClick={() => setModalOpen(false)} className="min-h-[var(--app-control-target,2.5rem)] rounded-lg border border-zinc-300 px-4 text-sm font-bold">Cancelar</button>
                        <button type="button" className="min-h-[var(--app-control-target,2.5rem)] rounded-lg bg-[#F39200] px-4 text-sm font-bold text-white">Guardar cambios</button>
                    </AppModalFooter>
                </AppModalShell>
            </AppLayout>
        </AuthContext.Provider>
        </MemoryRouter>
    );
};

createRoot(document.getElementById('root')).render(<AdaptiveAppLayoutHarness />);
