import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import CronogramaGantt from './components/projects/CronogramaGantt.jsx';
import { AuthContext } from './context/authContextInstance';
import { ganttFixturesApi } from './api/ganttFixtures';

const Harness = () => {
    const [fixture, setFixture] = useState(null);
    const [trabajo, setTrabajo] = useState(null);

    useEffect(() => {
        ganttFixturesApi.getFfFixture()
            .then((data) => {
                const normalizedTrabajo = {
                    ...data.trabajo,
                    rows: (data.trabajo?.rows || []).map((row) => ({
                        ...row,
                        budget_line_id: row.budget_line_id ?? row.presupuesto_linea_id ?? row.linea_id,
                        is_calculable: row.is_calculable ?? Boolean(row.apu_id),
                    })),
                };
                setFixture(data);
                setTrabajo(normalizedTrabajo);
            });
    }, []);

    if (!fixture || !trabajo) {
        return <div data-testid="gantt-ff-loading">Cargando Gantt FF harness</div>;
    }

    const handleSaveTrabajoLine = async (row, payload) => {
        window.__GANTT_FF_LAST_SAVE__ = { row, payload };
        window.dispatchEvent(new CustomEvent('gantt-ff-save', { detail: { row, payload } }));
        setTrabajo((current) => ({
            ...current,
            rows: (current?.rows || []).map((item) => (
                String(item.linea_id) === String(row?.linea_id)
                    ? {
                        ...item,
                        start_date: payload.start_date ?? item.start_date,
                        end_date: payload.end_date ?? item.end_date,
                        duration: payload.duration ?? item.duration,
                        dias_calendario: payload.duration ?? item.dias_calendario,
                        predecessors: payload.predecessors ?? item.predecessors,
                        dependencies: payload.dependencies ?? item.dependencies,
                    }
                    : item
            )),
        }));
        return trabajo;
    };

    return (
        <AuthContext.Provider value={{
            user: { id: 1, nombre: 'DOM QA' },
            selectedEmpresa: { id: fixture.empresa_id, nombre: fixture.empresa_nombre },
        }}>
            <div style={{ width: '1920px', height: '1080px' }}>
                <CronogramaGantt
                    detail={fixture.detail}
                    project={fixture.project}
                    trabajo={trabajo}
                    trabajoLoading={false}
                    trabajoSaving={false}
                    selectedBudget={fixture.selectedBudget}
                    selectedBudgetDetail={fixture.selectedBudgetDetail}
                    valorado={fixture.valorado}
                    displayRows={trabajo.rows}
                    onSaveTrabajoLine={handleSaveTrabajoLine}
                    onSaveTrabajoDraftBatch={async (payload) => {
                        window.__GANTT_FF_LAST_BATCH_SAVE__ = payload;
                        window.dispatchEvent(new CustomEvent('gantt-ff-batch-save', { detail: { payload } }));
                        setTrabajo((current) => ({
                            ...current,
                            rows: (current?.rows || []).map((item) => {
                                const lineId = String(item.budget_line_id ?? item.presupuesto_linea_id ?? item.linea_id);
                                const patch = payload?.[lineId];
                                return patch
                                    ? {
                                        ...item,
                                        start_date: patch.start_date ?? item.start_date,
                                        end_date: patch.end_date ?? item.end_date,
                                        duration: patch.duration ?? item.duration,
                                        dias_calendario: patch.duration ?? item.dias_calendario,
                                        predecessors: patch.predecessors ?? item.predecessors,
                                        dependencies: patch.dependencies ?? item.dependencies,
                                    }
                                    : item;
                            }),
                        }));
                        return trabajo;
                    }}
                    onSaveTrabajoConfig={async (config) => {
                        window.__GANTT_LAST_CONFIG__ = config;
                        window.dispatchEvent(new CustomEvent('gantt-config-save', { detail: { config } }));
                        setTrabajo((current) => ({
                            ...current,
                            config: {
                                ...(current?.config || {}),
                                ...(config || {}),
                            },
                        }));
                        return trabajo;
                    }}
                    onReloadTrabajoHolidayCalendar={async () => trabajo}
                    onResetTrabajoHolidayCalendar={async () => trabajo}
                    onAddTrabajoHolidayManual={async () => trabajo}
                    onRemoveTrabajoHolidayDay={async () => trabajo}
                    onReloadFromBudget={() => {}}
                    onPreviewReloadFromBudget={() => {}}
                    onSyncValoradoFromGantt={() => {}}
                    onApplyValoradoLineDistribution={() => {}}
                    onMergeInterparentSubbars={async () => trabajo}
                    onExportMsProject={() => {}}
                    onImportMsProject={() => {}}
                    onOpenParetoReport={() => {}}
                    onFactoryResetCronogramas={() => {}}
                    onDirtyStateChange={() => {}}
                />
            </div>
        </AuthContext.Provider>
    );
};

createRoot(document.getElementById('root')).render(<Harness />);
