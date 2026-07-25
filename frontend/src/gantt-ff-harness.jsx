import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import CronogramaGantt from './components/projects/CronogramaGantt.jsx';
import { AuthContext } from './context/authContextInstance';
import { ganttFixturesApi } from './api/ganttFixtures';

const createSyntheticFixture = () => {
    const periodStarts = ['2026-07-01', '2026-07-16', '2026-08-01', '2026-08-16', '2026-09-01', '2026-09-16'];
    const operationalRows = Array.from({ length: 36 }, (_, index) => {
        const id = 1001 + index;
        const chapter = Math.floor(index / 6) + 1;
        const position = (index % 6) + 1;
        const start = new Date(Date.UTC(2026, 6, 1 + (index * 2)));
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 7 + (index % 5));
        return {
            id,
            linea_id: id,
            presupuesto_linea_id: id,
            budget_line_id: id,
            parent_id: 9000 + chapter,
            orden: index + 1,
            item: index + chapter + 1,
            codigo: `EDT-${chapter}.${position}`,
            codigo_edt: `EDT-${chapter}.${position}`,
            descripcion: `Actividad técnica interdisciplinaria ${index + 1} para ejecución y control del complejo hospitalario`,
            tipo: 'PARTIDA',
            unidad: position % 3 === 0 ? 'und' : position % 2 === 0 ? 'm²' : 'm³',
            cantidad: 8 + (index * 1.75),
            precio_unitario: 925 + (index * 83.5),
            precio_total: 12500 + (index * 2350),
            apu_id: 5001 + index,
            is_calculable: true,
            start_date: start.toISOString().slice(0, 10),
            end_date: end.toISOString().slice(0, 10),
            duration: 8 + (index % 5),
            dias_calendario: 8 + (index % 5),
            progress: Math.min(100, (index % 7) * 15),
            predecessors: index === 0 ? '' : `${index + chapter}FS`,
            dependencies: index === 0 ? [] : [{
                predecessor_id: 1000 + index,
                type: index % 5 === 0 ? 'FF' : 'FS',
                lag: index % 4 === 0 ? 1 : 0,
            }],
            resources: [
                { id: 7000 + index, codigo: `REC-${index + 1}`, descripcion: `Recurso especializado ${index + 1}`, unidad: 'h', cantidad: 2.5 + index },
            ],
        };
    });
    const chapterRows = Array.from({ length: 6 }, (_, index) => ({
        id: 9001 + index,
        linea_id: 9001 + index,
        presupuesto_linea_id: 9001 + index,
        budget_line_id: 9001 + index,
        parent_id: null,
        orden: index * 7,
        item: (index * 7) + 1,
        codigo: `EDT-${index + 1}`,
        codigo_edt: `EDT-${index + 1}`,
        descripcion: `Cuenta de control y paquete especializado ${index + 1}`,
        tipo: 'CUENTA_PAQUETE',
        is_calculable: false,
        children: operationalRows.filter((row) => row.parent_id === 9001 + index),
    }));
    const rows = chapterRows.flatMap((chapter) => [chapter, ...chapter.children]);
    const valoradoRows = operationalRows.map((row, index) => {
        const primaryPeriod = index % periodStarts.length;
        const distribution = periodStarts.map((_, periodIndex) => (
            periodIndex === primaryPeriod ? 65 : periodIndex === Math.min(primaryPeriod + 1, periodStarts.length - 1) ? 35 : 0
        ));
        return {
            linea_id: String(row.linea_id),
            codigo: row.codigo,
            descripcion: row.descripcion,
            unidad: row.unidad,
            precio_total: row.precio_total,
            distribution,
        };
    });
    const periods = periodStarts.map((date, index) => ({
        id: index + 1,
        label: `Periodo ${index + 1}`,
        start_date: date,
        end_date: index === periodStarts.length - 1 ? '2026-09-30' : periodStarts[index + 1],
    }));
    const periodTotals = periods.map((_, periodIndex) => valoradoRows.reduce(
        (sum, row) => sum + ((row.precio_total * Number(row.distribution[periodIndex] || 0)) / 100),
        0,
    ));
    let cumulative = 0;
    const cashFlow = periodTotals.map((value, index) => {
        cumulative += value;
        return {
            period_index: index,
            ingreso: value * 1.08,
            egreso: value,
            saldo: value * 0.08,
            acumulado: cumulative,
        };
    });
    const project = {
        id: 1,
        codigo: 'SB-001',
        nombre: 'Complejo hospitalario interdisciplinario Santiago Bermeo',
        empresa_id: 7,
        base_trabajo_id: 19,
        revision: 3,
    };
    const selectedBudget = {
        id: 501,
        codigo: 'PTO-SB-001-R03',
        descripcion: 'Presupuesto operativo complejo hospitalario',
        revision: 3,
        precio_total: operationalRows.reduce((sum, row) => sum + row.precio_total, 0),
    };
    return {
        empresa_id: 7,
        empresa_nombre: 'Santiago Bermeo',
        project,
        detail: { ...project, presupuesto_id: selectedBudget.id },
        selectedBudget,
        selectedBudgetDetail: {
            ...selectedBudget,
            indirectos_porcentaje: 12.5,
            detalle: rows,
            edt_tree: chapterRows,
        },
        trabajo: {
            id: 601,
            presupuesto_id: selectedBudget.id,
            rows,
            config: {
                project_start_date: '2026-07-01',
                workday_start: '08:00',
                workday_end: '17:00',
                workdays: [1, 2, 3, 4, 5],
                calendar_mode: 'business',
                zoom: 'week',
            },
        },
        valorado: {
            id: 701,
            presupuesto_id: selectedBudget.id,
            moneda: 'USD',
            dec_moneda: 2,
            dec_calculos: 4,
            distribution_mode: 'gantt',
            periods,
            rows: valoradoRows,
            cash_flow: cashFlow,
            curve_s: cashFlow.map((point, index) => ({
                period_index: index,
                planned: point.acumulado,
                actual: point.acumulado * (index < 3 ? 0.82 : 0.55),
            })),
            footer: {
                inversion_periodo: periodTotals,
                inversion_acumulada: cashFlow.map((point) => point.acumulado),
            },
        },
    };
};

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
            })
            .catch(() => {
                const data = createSyntheticFixture();
                setFixture(data);
                setTrabajo(data.trabajo);
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
            <div style={{ width: '100%', minWidth: 0, minHeight: '100dvh' }}>
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
