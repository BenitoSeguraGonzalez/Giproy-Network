import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import CronogramaGantt from './components/projects/CronogramaGantt.jsx';
import { AuthContext } from './context/authContextInstance';
import { ganttFixturesApi } from './api/ganttFixtures';
import { AppDialogProvider } from './components/ui/AppDialogProvider.jsx';

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
            cantidad: index === 1 ? 0 : 8 + (index * 1.75),
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
            metadata: {
                ...(index === 1 ? {
                    governing_resource: {
                        name: 'Sin recurso gobernante',
                        performance_hours_per_unit: 0,
                        candidate_count: 0,
                    },
                    duration_model: {
                        jornada_horas: 8,
                        factor_eficiencia: 1,
                        governing_performance_hours_per_unit: 0,
                    },
                } : {}),
                ...(index === 0 ? {
                    governing_resource: {
                        name: 'Cuadrilla especializada de estructura hospitalaria',
                        performance_hours_per_unit: 0.42,
                        candidate_count: 3,
                    },
                    duration_model: {
                        jornada_horas: 8,
                        factor_eficiencia: 0.85,
                        governing_performance_hours_per_unit: 0.42,
                        governing_resource_name: 'Cuadrilla especializada de estructura hospitalaria',
                    },
                    cost_model: {
                        unit_direct_cost: 785.5,
                        category_unit_costs: {
                            'Equipos y Herramientas': 155.25,
                            Transporte: 48.75,
                            'Mano de Obra': 281.5,
                            Materiales: 300,
                        },
                    },
                } : {}),
                ...(index === 0 ? {
                    gantt_subbars: [
                        {
                            id: `${id}-period-1-a`,
                            period_id: '1',
                            parent_period_id: '1',
                            parent_initial_id: `valuado-initial-${id}-1`,
                            starts_at: '2026-07-01T13:00:00.000Z',
                            ends_at: '2026-07-05T05:00:00.000Z',
                            percent: 65,
                            amount: (12500 + (index * 2350)) * 0.65,
                            status: 'draft_session',
                            source: 'visual_certification_fixture',
                            metadata: { label: 'Periodo 1' },
                        },
                        {
                            id: `${id}-period-2-b`,
                            period_id: '2',
                            parent_period_id: '2',
                            parent_initial_id: `valuado-initial-${id}-2`,
                            starts_at: '2026-07-05T05:00:00.000Z',
                            ends_at: '2026-07-10T21:00:00.000Z',
                            percent: 35,
                            amount: (12500 + (index * 2350)) * 0.35,
                            status: 'draft_session',
                            source: 'visual_certification_fixture',
                            metadata: { label: 'Periodo 2' },
                        },
                    ],
                    gantt_operational: {
                        session_status: 'draft_session',
                        subbar_count: 2,
                        has_subbars: true,
                    },
                } : {}),
                gantt_confirmed_history_v1: [
                    {
                        confirmed_at: '2026-07-24T16:30:00.000Z',
                        source: 'gantt_approval',
                        duration: 8 + (index % 5),
                        cpm_reconciled: index < 12,
                    },
                    {
                        confirmed_at: '2026-07-18T14:15:00.000Z',
                        source: 'gantt_restore_confirmed',
                        duration: 7 + (index % 5),
                        cpm_reconciled: index < 8,
                    },
                ],
            },
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
                fecha_inicio_proyecto: '2026-07-01',
                fecha_fin_objetivo_proyecto: '2026-09-30',
                workday_start: '08:00',
                workday_end: '17:00',
                workdays: [1, 2, 3, 4, 5],
                calendar_mode: 'business',
                zoom: 'week',
            },
            holiday_calendar: {
                start_date: '2026-07-01',
                end_date: '2026-09-30',
                items: [
                    {
                        id: 801,
                        observed_date: '2026-07-20',
                        holiday_name: 'Festivo oficial regional',
                        source: 'official',
                        is_manual: false,
                    },
                    {
                        id: 802,
                        observed_date: '2026-08-14',
                        holiday_name: 'Cierre técnico planificado',
                        source: 'manual',
                        is_manual: true,
                        origin_type: 'manual_add',
                    },
                ],
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
        if (window.location.pathname.includes('gantt-segment-menu-harness')
            || window.location.pathname.includes('gantt-split-dialog')
            || window.location.pathname.includes('gantt-fine-tune')
            || window.location.pathname.includes('gantt-reconciliation')
            || window.location.pathname.includes('gantt-apu-signals')) {
            const data = createSyntheticFixture();
            setFixture(data);
            setTrabajo(data.trabajo);
            return;
        }
        ganttFixturesApi.getFfFixture()
            .then((data) => {
                const normalizedTrabajo = {
                    ...data.trabajo,
                    rows: (data.trabajo?.rows || []).map((row, index) => {
                        const lineId = row.budget_line_id ?? row.presupuesto_linea_id ?? row.linea_id;
                        return {
                            ...row,
                            budget_line_id: lineId,
                            is_calculable: row.is_calculable ?? Boolean(row.apu_id),
                            metadata: index === 1 ? {
                                ...(row.metadata || {}),
                                gantt_subbars: [
                                    {
                                        id: `${lineId}-period-1-a`, period_id: '1', parent_period_id: '1', parent_initial_id: `valuado-initial-${lineId}-1`,
                                        starts_at: '2026-07-01T08:00:00.000Z', ends_at: '2026-07-05T17:00:00.000Z', percent: 65,
                                        amount: Number(row.precio_total || 12500) * 0.65, status: 'draft_session', source: 'visual_certification_fixture', metadata: { label: 'Periodo 1' },
                                    },
                                    {
                                        id: `${lineId}-period-2-b`, period_id: '2', parent_period_id: '2', parent_initial_id: `valuado-initial-${lineId}-2`,
                                        starts_at: '2026-07-06T08:00:00.000Z', ends_at: '2026-07-09T17:00:00.000Z', percent: 35,
                                        amount: Number(row.precio_total || 12500) * 0.35, status: 'draft_session', source: 'visual_certification_fixture', metadata: { label: 'Periodo 2' },
                                    },
                                ],
                                gantt_operational: { session_status: 'draft_session', subbar_count: 2, has_subbars: true },
                            } : row.metadata,
                        };
                    }),
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
        <AppDialogProvider>
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
        </AppDialogProvider>
    );
};

createRoot(document.getElementById('root')).render(<Harness />);
