# Baseline ESLint frontend

Generado de forma reproducible con `npm run quality:eslint:baseline`.
Este archivo registra deuda conocida; no convierte los hallazgos en aceptables.

- Archivos afectados: 111
- Errores: 315
- Avisos: 96
- Total: 411

## Resumen por regla

| Regla | Hallazgos |
|---|---:|
| `no-unused-vars` | 219 |
| `react-hooks/exhaustive-deps` | 96 |
| `react-refresh/only-export-components` | 35 |
| `react-hooks/set-state-in-effect` | 26 |
| `no-undef` | 13 |
| `react-hooks/preserve-manual-memoization` | 7 |
| `no-constant-condition` | 6 |
| `no-prototype-builtins` | 3 |
| `react-hooks/rules-of-hooks` | 3 |
| `no-constant-binary-expression` | 2 |
| `no-control-regex` | 1 |

## Hallazgos individuales

### src/api/axiosConfig.js

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 48 | 11 | `no-unused-vars` | 'path' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/bim-csg-harness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 130 | 10 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/bim-fragments-csg-harness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 104 | 10 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/components/bim/BimCanvasViewer.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 384 | 9 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 382 \| 383 \| useEffect(() => { > 384 \| fitSelectedCallback(); \| ^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect 385 \| }, [fitSelectedCallback]); 386 \| 387 \| useEffect(() => { |
| 2 | ERROR | 388 | 9 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 386 \| 387 \| useEffect(() => { > 388 \| fitScene(); \| ^^^^^^^^ Avoid calling setState() directly within an effect 389 \| }, [activeIfcClass, canvasSize.height, canvasSize.width, showOnlyLinked]); 390 \| 391 \| useEffect(() => { |
| 3 | AVISO | 389 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'fitScene'. Either include it or remove the dependency array. |
| 4 | ERROR | 397 | 13 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 395 \| const availableClasses = new Set(elements.map((element) => element.ifc_class \|\| 'Sin clase IFC')); 396 \| if (!availableClasses.has(activeIfcClass)) { > 397 \| setActiveIfcClass('all'); \| ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect 398 \| } 399 \| }, [activeIfcClass, elements]); 400 \| |
| 5 | AVISO | 556 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'validationIssuesByElementId'. Either include it or remove the dependency array. |

### src/components/bim/BimCdeCollaborationPanel.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 143 | 71 | `react-hooks/exhaustive-deps` | The ref value 'sessionKey.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'sessionKey.current' to a variable inside the effect, and use that variable in the cleanup function. |

### src/components/bim/BimCdeDashboardPanel.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 40 | 25 | `no-unused-vars` | 'Icon' is defined but never used. |

### src/components/bim/BimCdeReviewPanel.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 44 | 34 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'load'. Either include it or remove the dependency array. |

### src/components/bim/BimEquipmentMotionPanel.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 32 | 23 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 30 \| const [machine, setMachine] = useState({ code: 'EQ-01', name: 'Grúa', equipment_type: 'crane', dimensions: { x: 3, y: 8, z: 3 } }); 31 \| const load = useCallback(async () => { if (!projectId) return; try { const [machines, activityRows, motionRows] = await Promise.all([bimModelsApi.list4dEquipment(projectId, empresaId), bimModelsApi.list4dActivities(projectId, empresaId), bimModelsApi.list4dEquipmentMotion(projectId, empresaId)]); setEquipment(machines); setActivities(activityRows); setPlans(motionRows); setSelectedId((value) => value \|\| String(motionRows[0]?.id \|\| '')); } catch (requestError) { setError(requestError?.response?.data?.detail \|\| 'No se pudo cargar la simulación de equipos.'); } }, [empresaId, projectId]); > 32 \| useEffect(() => { load(); }, [load]); \| ^^^^ Avoid calling setState() directly within an effect 33 \| const selected = plans.find((item) => String(item.id) === selectedId); 34 \| useEffect(() => { if (!selected) { setPlayback(null); return; } Promise.all([bimModelsApi.get4dEquipmentPlayback(projectId, selected.id, percent, empresaId), bimModelsApi.get4dEquipmentConflicts(projectId, selected.id, empresaId)]).then(([frame, rows]) => { setPlayback(frame); setConflicts(rows); }).catch(() => setPlayback(null)); }, [empresaId, percent, projectId, selected]); 35 \| const addEquipment = async () => { try { await bimModelsApi.create4dEquipment(projectId, machine, empresaId); await load(); } catch (requestError) { setError(requestError?.response?.data?.detail \|\| 'No se pudo crear el equipo BIM.'); } }; |
| 2 | ERROR | 34 | 40 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 32 \| useEffect(() => { load(); }, [load]); 33 \| const selected = plans.find((item) => String(item.id) === selectedId); > 34 \| useEffect(() => { if (!selected) { setPlayback(null); return; } Promise.all([bimModelsApi.get4dEquipmentPlayback(projectId, selected.id, percent, empresaId), bimModelsApi.get4dEquipmentConflicts(projectId, selected.id, empresaId)]).then(([frame, rows]) => { setPlayback(frame); setConflicts(rows); }).catch(() => setPlayback(null)); }, [empresaId, percent, projectId, selected]); \| ^^^^^^^^^^^ Avoid calling setState() directly within an effect 35 \| const addEquipment = async () => { try { await bimModelsApi.create4dEquipment(projectId, machine, empresaId); await load(); } catch (requestError) { setError(requestError?.response?.data?.detail \|\| 'No se pudo crear el equipo BIM.'); } }; 36 \| const addMotion = async () => { if (!equipment[0] \|\| !activities[0]) return; try { const value = await bimModelsApi.create4dEquipmentMotion(projectId, { equipment_id: equipment[0].id, activity_snapshot_id: activities[0].id, revision: `R${plans.length + 1}`, path: [{ x: 0, y: 0, z: 0, offset_seconds: 0 }, { x: 10, y: 0, z: 0, offset_seconds: 100 }], operation_radius: 2, temporary_geometry: 'box' }, empresaId); await load(); setSelectedId(String(value.id)); } catch (requestError) { setError(requestError?.response?.data?.detail \|\| 'No se pudo crear la trayectoria 4D.'); } }; 37 \| return <section className="rounded border border-slate-200 bg-white" data-bim-equipment-motion> |

### src/components/bim/BimErpExchangePanel.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 21 | 34 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'load'. Either include it or remove the dependency array. |

### src/components/bim/BimFieldDiaryPanel.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 34 | 23 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 32 \| }, [api, empresaId, projectId]); 33 \| > 34 \| useEffect(() => { load(); }, [load]); \| ^^^^ Avoid calling setState() directly within an effect 35 \| const activityById = useMemo(() => Object.fromEntries(activities.map((item) => [item.id, item])), [activities]); 36 \| const areaById = useMemo(() => Object.fromEntries(areas.map((item) => [item.id, item])), [areas]); 37 \| const filtered = useMemo(() => { |
| 2 | ERROR | 61 | 29 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 59 \| 60 \| useEffect(() => { > 61 \| if (!days.length) { setSelectedDay(''); setSelectedId(null); return; } \| ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect 62 \| if (!days.some((item) => item.day === selectedDay)) { setSelectedDay(days[0].day); setSelectedId(days[0].reports[0]?.id \|\| null); } 63 \| }, [days, selectedDay]); 64 \| const activeDay = days.find((item) => item.day === selectedDay) \|\| null; |

### src/components/bim/BimFragmentsHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 589 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'status.categories'. Either include it or remove the dependency array. |

### src/components/bim/BimFragmentsViewport.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 379 | 22 | `react-hooks/exhaustive-deps` | The ref value 'mountRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'mountRef.current' to a variable inside the effect, and use that variable in the cleanup function. |
| 2 | AVISO | 381 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'renderMembers'. Either include it or remove the dependency array. |

### src/components/bim/BimIdsPanel.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 25 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'refreshProfiles'. Either include it or remove the dependency array. |

### src/components/bim/BimIntegrationGatewayPanel.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 24 | 34 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'load'. Either include it or remove the dependency array. |

### src/components/bim/BimIssuesPanel.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 22 | 64 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'refresh'. Either include it or remove the dependency array. |

### src/components/bim/BimQuantityProposalPanel.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 39 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'refreshSnapshots'. Either include it or remove the dependency array. |
| 2 | AVISO | 50 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'api'. Either include it or remove the dependency array. |

### src/components/bim/BimSiteGeoreferencePanel.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 67 | 34 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'load'. Either include it or remove the dependency array. |

### src/components/bim/BimViewStateToolbar.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 82 | 9 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 80 \| const activeViewState = viewStates.find((state) => state.id === activeViewStateId) \|\| null; 81 \| const newDraftScope = activeViewState?.scope === 'company' ? 'company' : 'personal'; > 82 \| setDraftName(activeViewState?.nombre \|\| ''); \| ^^^^^^^^^^^^ Avoid calling setState() directly within an effect 83 \| setDraftScope(newDraftScope); 84 \| }, [activeViewStateId, isEditingName, viewStates]); 85 \| |

### src/components/bim/BimWorkspace.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 267 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'applyWorkspaceSelection'. Either include it or remove the dependency array. |
| 2 | AVISO | 309 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has missing dependencies: 'selectedStoreyName' and 'selectedVersionId'. Either include them or remove the dependency array. |

### src/components/bim/BimWorkspaceV2.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 348 | 61 | `no-unused-vars` | 'Icon' is defined but never used. |

### src/components/marketplace/MarketplaceOriginBadgeSet.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 9 | 14 | `react-refresh/only-export-components` | Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components. |

### src/components/marketplace/MarketplaceVisualSystem.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 7 | 14 | `react-refresh/only-export-components` | Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components. |
| 2 | ERROR | 27 | 14 | `react-refresh/only-export-components` | Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components. |

### src/components/PersonnelFormFields.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 115 | 18 | `no-unused-vars` | 'error' is defined but never used. |
| 2 | ERROR | 125 | 18 | `no-unused-vars` | 'error' is defined but never used. |

### src/components/precios-unitarios/ResourceEditorModal.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 2 | 27 | `no-unused-vars` | 'motion' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | AVISO | 83 | 11 | `react-hooks/exhaustive-deps` | The 'governingKindOptions' conditional could make the dependencies of useEffect Hook (at line 118) change on every render. To fix this, wrap the initialization of 'governingKindOptions' in its own useMemo() Hook. |

### src/components/presupuestos/CatalogoApuTab.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 172 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'setSearchTerm'. Either include it or remove the dependency array. |
| 2 | ERROR | 200 | 11 | `no-unused-vars` | 'syncSummary' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/components/presupuestos/EdtValoradaModal.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 15 | 10 | `no-unused-vars` | 'roundDecimal' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 335 | 53 | `react-hooks/rules-of-hooks` | React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. |
| 3 | ERROR | 336 | 47 | `react-hooks/rules-of-hooks` | React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. |
| 4 | ERROR | 337 | 55 | `react-hooks/rules-of-hooks` | React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. |

### src/components/presupuestos/IndirectosModal.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 42 | 27 | `no-unused-vars` | 'formatCalculo' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/components/presupuestos/LineasPresupuestoTab.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 10 | 25 | `no-unused-vars` | 'roundDecimal' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 77 | 7 | `no-unused-vars` | 'getEditableQuantityInputs' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 3 | ERROR | 1164 | 9 | `no-unused-vars` | 'formatCalculo' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 4 | ERROR | 1176 | 12 | `no-unused-vars` | 'activeDragLineId' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 5 | AVISO | 1469 | 11 | `react-hooks/exhaustive-deps` | The 'lineas' logical expression could make the dependencies of useMemo Hook (at line 1487) change on every render. To fix this, wrap the initialization of 'lineas' in its own useMemo() Hook. |
| 6 | AVISO | 1677 | 11 | `react-hooks/exhaustive-deps` | The 'scrollLineIntoView' function makes the dependencies of useEffect Hook (at line 1752) change on every render. To fix this, wrap the definition of 'scrollLineIntoView' in its own useCallback() Hook. |
| 7 | AVISO | 1677 | 11 | `react-hooks/exhaustive-deps` | The 'scrollLineIntoView' function makes the dependencies of useEffect Hook (at line 1807) change on every render. To fix this, wrap the definition of 'scrollLineIntoView' in its own useCallback() Hook. |
| 8 | AVISO | 1677 | 11 | `react-hooks/exhaustive-deps` | The 'scrollLineIntoView' function makes the dependencies of useEffect Hook (at line 1847) change on every render. To fix this, wrap the definition of 'scrollLineIntoView' in its own useCallback() Hook. |
| 9 | AVISO | 1861 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'resetBudgetWorkbenchModes'. Either include it or remove the dependency array. |
| 10 | ERROR | 1919 | 11 | `no-unused-vars` | 'handleAddLinea' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 11 | ERROR | 2070 | 11 | `no-unused-vars` | 'handleUpdateLinea' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/components/presupuestos/PresupuestoDetail.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 859 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'activePresupuesto'. Either include it or remove the dependency array. |

### src/components/presupuestos/TanteoTab.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 11 | 10 | `no-unused-vars` | 'roundDecimal' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 547 | 43 | `no-unused-vars` | 'isMaterial' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/components/projects/CronogramaGantt.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 3 | 10 | `no-unused-vars` | 'motion' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 51 | 10 | `no-unused-vars` | 'buildDeferredZoomViewport' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 3 | ERROR | 439 | 7 | `no-unused-vars` | 'resolveVisibleBarSecondaryActionLayout' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 4 | ERROR | 1102 | 7 | `no-unused-vars` | 'formatDateRangeCompact' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 5 | ERROR | 1121 | 7 | `no-unused-vars` | 'toNativeDate' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 6 | ERROR | 1356 | 7 | `no-unused-vars` | 'formatOperationalDuration' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 7 | ERROR | 1606 | 71 | `no-unused-vars` | 'config' is assigned a value but never used. |
| 8 | ERROR | 1837 | 5 | `no-unused-vars` | 'onChangeResourceUnits' is defined but never used. |
| 9 | ERROR | 1853 | 11 | `no-unused-vars` | 'shouldSkipCancelledResourceInput' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 10 | ERROR | 1883 | 13 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 1881 \| useEffect(() => { 1882 \| if (!open \|\| !row?.apu_id) { > 1883 \| setApuState({ loading: false, error: '', data: null }); \| ^^^^^^^^^^^ Avoid calling setState() directly within an effect 1884 \| return; 1885 \| } 1886 \| |
| 11 | ERROR | 1921 | 13 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 1919 \| const projectBaseId = Number(project?.base_trabajo_id \|\| 0); 1920 \| if (!open \|\| projectBaseId <= 0) { > 1921 \| setBaseState({ loading: false, error: '', data: null }); \| ^^^^^^^^^^^^ Avoid calling setState() directly within an effect 1922 \| return; 1923 \| } 1924 \| |
| 12 | ERROR | 1958 | 9 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 1956 \| useEffect(() => { 1957 \| if (!open) return; > 1958 \| setSubcontractTypeMenuOpen(false); \| ^^^^^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect 1959 \| setSubcontractDurationInput( 1960 \| resolveSubcontractDurationInputValue(effectiveRow \|\| row, subcontractDraft, config, subcontractDisplayUnit) 1961 \| ); |
| 13 | AVISO | 1962 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has missing dependencies: 'effectiveRow', 'row', and 'subcontractDraft'. Either include them or remove the dependency array. If 'setSubcontractDurationInput' needs the current value of 'effectiveRow', you can also switch to useReducer instead of useState and read 'effectiveRow' in the reducer. |
| 14 | ERROR | 1968 | 11 | `no-unused-vars` | 'valoradoImpact' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 15 | ERROR | 2152 | 9 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 2150 \| } 2151 \| }); > 2152 \| setResourceDrafts(nextDrafts); \| ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect 2153 \| setResourceInputValues(nextInputValues); 2154 \| setResourceQuantityDrafts(nextQuantityDrafts); 2155 \| setResourceSourceLineDrafts(nextSourceLineDrafts); |
| 16 | AVISO | 2157 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has missing dependencies: 'resourceInputValues' and 'resourceQuantityDrafts'. Either include them or remove the dependency array. |
| 17 | ERROR | 2321 | 56 | `react-hooks/preserve-manual-memoization` | Compilation Skipped: Existing memoization could not be preserved React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `automaticDominantResource`, but the source dependencies were [activeResourceLines, automaticDominantResource?.activeRendimiento, automaticDominantResource?.draftRendimiento, automaticDominantResource?.id, automaticDominantResource?.rendimiento, dominantCategoryId]. Inferred less specific property than source. 2319 \| const dominantCategoryId = automaticDominantResource?.categoryId \|\| null; 2320 \| > 2321 \| const governanceManualResourceCandidates = useMemo(() => { \| ^^^^^^^ > 2322 \| if (!dominantCategoryId \|\| !collectionHas(GOVERNING_RESOURCE_CATEGORY_IDS, dominantCategoryId)) return []; \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 2323 \| const governingPerformanceValue = Number( … \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 2349 \| ]; \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 2350 \| }, [ \| ^^^^^^ Could not preserve existing manual memoization 2351 \| activeResourceLines, 2352 \| automaticDominantResource?.activeRendimiento, 2353 \| automaticDominantResource?.draftRendimiento, |
| 18 | ERROR | 2321 | 56 | `react-hooks/preserve-manual-memoization` | Compilation Skipped: Existing memoization could not be preserved React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `automaticDominantResource`, but the source dependencies were [activeResourceLines, automaticDominantResource?.activeRendimiento, automaticDominantResource?.draftRendimiento, automaticDominantResource?.id, automaticDominantResource?.rendimiento, dominantCategoryId]. Inferred less specific property than source. 2319 \| const dominantCategoryId = automaticDominantResource?.categoryId \|\| null; 2320 \| > 2321 \| const governanceManualResourceCandidates = useMemo(() => { \| ^^^^^^^ > 2322 \| if (!dominantCategoryId \|\| !collectionHas(GOVERNING_RESOURCE_CATEGORY_IDS, dominantCategoryId)) return []; \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 2323 \| const governingPerformanceValue = Number( … \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 2349 \| ]; \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 2350 \| }, [ \| ^^^^^^ Could not preserve existing manual memoization 2351 \| activeResourceLines, 2352 \| automaticDominantResource?.activeRendimiento, 2353 \| automaticDominantResource?.draftRendimiento, |
| 19 | ERROR | 2641 | 11 | `no-unused-vars` | 'handleResourceQuantityChange' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 20 | ERROR | 2693 | 11 | `no-unused-vars` | 'handleResourceQuantityBlur' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 21 | ERROR | 2719 | 13 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 2717 \| if (!governancePickerOpen) return; 2718 \| if (governanceManualCandidates.length < 2) { > 2719 \| setGovernancePickerOpen(false); \| ^^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect 2720 \| } 2721 \| }, [governanceManualCandidates.length, governancePickerOpen]); 2722 \| |
| 22 | ERROR | 4394 | 7 | `no-unused-vars` | 'addGanttDays' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 23 | ERROR | 4887 | 19 | `no-unused-vars` | 'dayFinish' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 24 | ERROR | 5162 | 7 | `no-unused-vars` | 'resolveGanttSubbarSourcePresentation' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 25 | ERROR | 5396 | 7 | `no-unused-vars` | 'buildGanttInitialParentId' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 26 | ERROR | 5676 | 7 | `no-unused-vars` | 'splitGanttOperationalSubbar' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 27 | ERROR | 5723 | 64 | `no-undef` | 'periodToken' is not defined. |
| 28 | ERROR | 5936 | 7 | `no-unused-vars` | 'resolveSplitDialogPartDurationMs' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 29 | ERROR | 6496 | 39 | `no-unused-vars` | 'config' is assigned a value but never used. |
| 30 | ERROR | 6496 | 52 | `no-unused-vars` | 'mode' is assigned a value but never used. |
| 31 | ERROR | 6631 | 45 | `no-unused-vars` | 'previousDraft' is assigned a value but never used. |
| 32 | ERROR | 6631 | 77 | `no-unused-vars` | 'config' is assigned a value but never used. |
| 33 | ERROR | 6792 | 7 | `no-unused-vars` | 'hasPersistedResourcePendingApproval' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 34 | ERROR | 7034 | 7 | `no-unused-vars` | 'buildEquipmentOwnershipGapMessage' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 35 | ERROR | 7039 | 7 | `no-unused-vars` | 'buildCrashingBlockerMessage' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 36 | ERROR | 7047 | 7 | `no-unused-vars` | 'getEconomicConfidenceBadge' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 37 | ERROR | 7938 | 7 | `no-unused-vars` | 'getSegmentSnapVisual' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 38 | ERROR | 8257 | 7 | `no-unused-vars` | 'buildGroupedRowHighlightModel' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 39 | ERROR | 8813 | 11 | `no-unused-vars` | 'forceCompactOperationalPanel' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 40 | ERROR | 8836 | 33 | `no-unused-vars` | 'setDurationDisplayUnit' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 41 | ERROR | 8842 | 12 | `no-unused-vars` | 'editingZoom' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 42 | ERROR | 8843 | 12 | `no-unused-vars` | 'zoomMenuOpen' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 43 | AVISO | 8851 | 9 | `react-hooks/exhaustive-deps` | React Hook useMemo has missing dependencies: 'project' and 'user'. Either include them or remove the dependency array. |
| 44 | ERROR | 8867 | 12 | `no-unused-vars` | 'configError' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 45 | ERROR | 8925 | 12 | `no-unused-vars` | 'interopMenuOpen' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 46 | ERROR | 8925 | 29 | `no-unused-vars` | 'setInteropMenuOpen' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 47 | ERROR | 8941 | 12 | `no-unused-vars` | 'importingMsProject' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 48 | ERROR | 8955 | 12 | `no-unused-vars` | 'timeScaleMenuStyle' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 49 | ERROR | 9062 | 11 | `no-unused-vars` | 'clearPersistedAffordanceHover' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 50 | ERROR | 9430 | 11 | `no-unused-vars` | 'visibleHolidayMonth' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 51 | ERROR | 9534 | 11 | `no-unused-vars` | 'resourceHistogramPeak' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 52 | ERROR | 9540 | 11 | `no-unused-vars` | 'resourceHistogramTopSegments' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 53 | ERROR | 9595 | 11 | `no-unused-vars` | 'effectiveMsProjectAvailable' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 54 | ERROR | 9790 | 11 | `no-unused-vars` | 'clearViewportInteractionLock' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 55 | AVISO | 10597 | 8 | `react-hooks/exhaustive-deps` | React Hook useMemo has a missing dependency: 'scheduleConfig'. Either include it or remove the dependency array. |
| 56 | AVISO | 10741 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has a missing dependency: 'configDraft'. Either include it or remove the dependency array. |
| 57 | AVISO | 10936 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has a missing dependency: 'taskLineIdByItem'. Either include it or remove the dependency array. |
| 58 | AVISO | 10985 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has a missing dependency: 'taskLineIdByItem'. Either include it or remove the dependency array. |
| 59 | ERROR | 11065 | 11 | `no-unused-vars` | 'visibleCalculableOrderMap' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 60 | ERROR | 11102 | 11 | `no-unused-vars` | 'criticalTaskCount' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 61 | ERROR | 11183 | 11 | `no-unused-vars` | 'milestoneCount' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 62 | ERROR | 11191 | 11 | `no-unused-vars` | 'topConflictReliefRecommendations' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 63 | ERROR | 11199 | 11 | `no-unused-vars` | 'preCrashingSummary' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 64 | ERROR | 11214 | 11 | `no-unused-vars` | 'conflictReliefSummary' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 65 | ERROR | 11226 | 11 | `no-unused-vars` | 'hiddenConflictReliefSessionCount' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 66 | ERROR | 11269 | 11 | `no-unused-vars` | 'approvalDiffSummary' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 67 | ERROR | 11296 | 11 | `no-unused-vars` | 'resourcePressureSummary' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 68 | ERROR | 12079 | 15 | `no-unused-vars` | 'sourceEffective' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 69 | ERROR | 12080 | 15 | `no-unused-vars` | 'targetEffective' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 70 | AVISO | 12142 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has missing dependencies: 'applyDraftPatches', 'buildDependentScheduleDrafts', and 'calculableRowMeta'. Either include them or remove the dependency array. |
| 71 | ERROR | 13356 | 11 | `no-unused-vars` | 'selectedTaskGovernance' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 72 | ERROR | 13372 | 11 | `no-unused-vars` | 'selectedTaskRecommendedSchedule' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 73 | ERROR | 13401 | 11 | `no-unused-vars` | 'selectedTaskCrashingReview' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 74 | ERROR | 13405 | 11 | `no-unused-vars` | 'selectedTaskCostPreview' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 75 | ERROR | 13433 | 11 | `no-unused-vars` | 'selectedTaskDurationFreshness' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 76 | ERROR | 13437 | 11 | `no-unused-vars` | 'selectedTaskDurationSignal' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 77 | ERROR | 13445 | 11 | `no-unused-vars` | 'selectedTaskDurationComparison' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 78 | ERROR | 13459 | 11 | `no-unused-vars` | 'selectedTaskResourcePressure' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 79 | ERROR | 13471 | 11 | `no-unused-vars` | 'selectedTaskPreCrashingRecommendation' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 80 | ERROR | 13587 | 11 | `no-unused-vars` | 'selectedTaskSubbarVisual' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 81 | ERROR | 13652 | 11 | `no-unused-vars` | 'selectedTaskSubbarStatusSummary' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 82 | ERROR | 13689 | 11 | `no-unused-vars` | 'selectedTaskSubbarWindow' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 83 | ERROR | 13744 | 11 | `no-unused-vars` | 'selectedTaskSubbarShare' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 84 | AVISO | 13776 | 8 | `react-hooks/exhaustive-deps` | React Hook useMemo has a missing dependency: 'formatVisibleDuration'. Either include it or remove the dependency array. |
| 85 | ERROR | 13865 | 11 | `no-unused-vars` | 'selectedTaskOperationalReadiness' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 86 | AVISO | 13926 | 8 | `react-hooks/exhaustive-deps` | React Hook useMemo has a missing dependency: 'selectedTaskOperationalSummary?.manualTemporalSource'. Either include it or remove the dependency array. |
| 87 | ERROR | 13927 | 11 | `no-unused-vars` | 'selectedTaskOperationalMode' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 88 | ERROR | 14131 | 11 | `no-unused-vars` | 'handleClearConflictReliefDraft' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 89 | ERROR | 14161 | 11 | `no-unused-vars` | 'handleClearAllConflictReliefDrafts' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 90 | AVISO | 14224 | 11 | `react-hooks/exhaustive-deps` | The 'updateDraft' function makes the dependencies of useCallback Hook (at line 14382) change on every render. To fix this, wrap the definition of 'updateDraft' in its own useCallback() Hook. |
| 91 | ERROR | 14488 | 11 | `no-unused-vars` | 'handleAdoptSelectedTaskRemainingDuration' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 92 | ERROR | 14510 | 11 | `no-unused-vars` | 'handleRevertSelectedTaskRemainingDuration' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 93 | AVISO | 14546 | 11 | `react-hooks/exhaustive-deps` | The 'applyDraftPatches' function makes the dependencies of useCallback Hook (at line 15481) change on every render. To fix this, wrap the definition of 'applyDraftPatches' in its own useCallback() Hook. |
| 94 | AVISO | 14644 | 11 | `react-hooks/exhaustive-deps` | The 'buildDependentScheduleDrafts' function makes the dependencies of useCallback Hook (at line 15481) change on every render. To fix this, wrap the definition of 'buildDependentScheduleDrafts' in its own useCallback() Hook. |
| 95 | ERROR | 14723 | 67 | `no-unused-vars` | '_dayDelta' is assigned a value but never used. |
| 96 | AVISO | 14858 | 11 | `react-hooks/exhaustive-deps` | The 'persistDraftPatches' function makes the dependencies of useCallback Hook (at line 15481) change on every render. To fix this, wrap the definition of 'persistDraftPatches' in its own useCallback() Hook. |
| 97 | ERROR | 14872 | 29 | `no-unused-vars` | 'patch' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 98 | AVISO | 15125 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has an unnecessary dependency: 'isManualMilestoneRow'. Either exclude it or remove the dependency array. Outer scope values like 'isManualMilestoneRow' aren't valid dependencies because mutating them doesn't re-render the component. |
| 99 | AVISO | 15157 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has an unnecessary dependency: 'getRowPredecessorIds'. Either exclude it or remove the dependency array. Outer scope values like 'getRowPredecessorIds' aren't valid dependencies because mutating them doesn't re-render the component. |
| 100 | AVISO | 15592 | 11 | `react-hooks/exhaustive-deps` | The 'persistOperationalLineMetadata' function makes the dependencies of useCallback Hook (at line 17002) change on every render. To fix this, wrap the definition of 'persistOperationalLineMetadata' in its own useCallback() Hook. |
| 101 | AVISO | 15592 | 11 | `react-hooks/exhaustive-deps` | The 'persistOperationalLineMetadata' function makes the dependencies of useCallback Hook (at line 17028) change on every render. To fix this, wrap the definition of 'persistOperationalLineMetadata' in its own useCallback() Hook. |
| 102 | AVISO | 15592 | 11 | `react-hooks/exhaustive-deps` | The 'persistOperationalLineMetadata' function makes the dependencies of useCallback Hook (at line 17071) change on every render. To fix this, wrap the definition of 'persistOperationalLineMetadata' in its own useCallback() Hook. |
| 103 | AVISO | 15592 | 11 | `react-hooks/exhaustive-deps` | The 'persistOperationalLineMetadata' function makes the dependencies of useCallback Hook (at line 17102) change on every render. To fix this, wrap the definition of 'persistOperationalLineMetadata' in its own useCallback() Hook. |
| 104 | AVISO | 15592 | 11 | `react-hooks/exhaustive-deps` | The 'persistOperationalLineMetadata' function makes the dependencies of useCallback Hook (at line 17142) change on every render. To fix this, wrap the definition of 'persistOperationalLineMetadata' in its own useCallback() Hook. |
| 105 | AVISO | 15592 | 11 | `react-hooks/exhaustive-deps` | The 'persistOperationalLineMetadata' function makes the dependencies of useCallback Hook (at line 17253) change on every render. To fix this, wrap the definition of 'persistOperationalLineMetadata' in its own useCallback() Hook. |
| 106 | AVISO | 15592 | 11 | `react-hooks/exhaustive-deps` | The 'persistOperationalLineMetadata' function makes the dependencies of useCallback Hook (at line 17284) change on every render. To fix this, wrap the definition of 'persistOperationalLineMetadata' in its own useCallback() Hook. |
| 107 | AVISO | 15592 | 11 | `react-hooks/exhaustive-deps` | The 'persistOperationalLineMetadata' function makes the dependencies of useCallback Hook (at line 17343) change on every render. To fix this, wrap the definition of 'persistOperationalLineMetadata' in its own useCallback() Hook. |
| 108 | AVISO | 15592 | 11 | `react-hooks/exhaustive-deps` | The 'persistOperationalLineMetadata' function makes the dependencies of useCallback Hook (at line 17488) change on every render. To fix this, wrap the definition of 'persistOperationalLineMetadata' in its own useCallback() Hook. |
| 109 | AVISO | 15779 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has missing dependencies: 'handleRedoGanttOperation' and 'handleUndoGanttOperation'. Either include them or remove the dependency array. |
| 110 | ERROR | 15786 | 11 | `no-unused-vars` | 'undoDraft' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 111 | ERROR | 16671 | 11 | `no-unused-vars` | 'startDependencyLink' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 112 | ERROR | 16734 | 11 | `no-unused-vars` | 'commitZoomInput' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 113 | ERROR | 16782 | 11 | `no-unused-vars` | 'applyPresetZoom' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 114 | ERROR | 16798 | 11 | `no-unused-vars` | 'openZoomMenuHover' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 115 | ERROR | 16808 | 11 | `no-unused-vars` | 'closeZoomMenuHover' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 116 | ERROR | 16908 | 11 | `no-unused-vars` | 'handleToggleTaskContext' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 117 | AVISO | 17570 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has unnecessary dependencies: 'selectedTaskDraft' and 'selectedTaskOperationalSummary'. Either exclude them or remove the dependency array. |
| 118 | ERROR | 17677 | 11 | `no-unused-vars` | 'handleOpenDependencyManager' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 119 | ERROR | 17755 | 11 | `no-unused-vars` | 'handleOperationalPanelContainerClick' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 120 | ERROR | 17766 | 11 | `no-unused-vars` | 'handleOperationalPanelContainerKeyDown' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 121 | ERROR | 17954 | 11 | `no-unused-vars` | 'handleSaveGanttConfig' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 122 | ERROR | 18090 | 11 | `no-unused-vars` | 'handleMsProjectExportClick' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 123 | ERROR | 18102 | 11 | `no-unused-vars` | 'handleMsProjectImportClick' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 124 | AVISO | 18289 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has unnecessary dependencies: 'finalizeZoomPreview' and 'flushBufferedZoomTargetLevel'. Either exclude them or remove the dependency array. |
| 125 | AVISO | 18426 | 33 | `react-hooks/exhaustive-deps` | The ref value 'timelineViewportRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'timelineViewportRef.current' to a variable inside the effect, and use that variable in the cleanup function. |
| 126 | AVISO | 18808 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has an unnecessary dependency: 'appAlert'. Either exclude it or remove the dependency array. Outer scope values like 'appAlert' aren't valid dependencies because mutating them doesn't re-render the component. |
| 127 | ERROR | 19138 | 26 | `no-constant-condition` | Unexpected constant condition. |
| 128 | ERROR | 19683 | 50 | `no-constant-condition` | Unexpected constant condition. |
| 129 | ERROR | 19683 | 50 | `no-constant-binary-expression` | Unexpected constant truthiness on the left-hand side of a `&&` expression. |
| 130 | ERROR | 19816 | 50 | `no-constant-condition` | Unexpected constant condition. |
| 131 | ERROR | 19816 | 50 | `no-constant-binary-expression` | Unexpected constant truthiness on the left-hand side of a `&&` expression. |
| 132 | ERROR | 20028 | 31 | `no-unused-vars` | 'effectiveRow' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 133 | ERROR | 20034 | 31 | `no-unused-vars` | 'recommendedSchedule' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 134 | ERROR | 20039 | 31 | `no-unused-vars` | 'operationalTooltip' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 135 | ERROR | 20059 | 31 | `no-unused-vars` | 'isDirty' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 136 | ERROR | 20060 | 31 | `no-unused-vars` | 'isSaving' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 137 | ERROR | 20063 | 31 | `no-unused-vars` | 'predecessorIds' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 138 | ERROR | 20065 | 31 | `no-unused-vars` | 'successorEntries' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 139 | ERROR | 20068 | 31 | `no-unused-vars` | 'dominantDependencySourceRow' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 140 | ERROR | 20075 | 31 | `no-unused-vars` | 'dependencyShortcodePreview' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 141 | ERROR | 20110 | 31 | `no-unused-vars` | 'rowStickyClass' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 142 | ERROR | 22662 | 31 | `no-unused-vars` | 'recommendedSchedule' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 143 | ERROR | 22722 | 31 | `no-unused-vars` | 'isDirty' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 144 | ERROR | 22723 | 31 | `no-unused-vars` | 'isSaving' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 145 | ERROR | 22726 | 31 | `no-unused-vars` | 'predecessorIds' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 146 | ERROR | 22731 | 31 | `no-unused-vars` | 'dominantDependencySourceRow' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/components/projects/Cronogramas.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 1390 | 5 | `no-unused-vars` | 'distributionSum' is defined but never used. |
| 2 | ERROR | 1932 | 11 | `no-unused-vars` | 'syncStatus' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 3 | AVISO | 1980 | 8 | `react-hooks/exhaustive-deps` | React Hook useMemo has a missing dependency: 'manualScheduleSummary.formattedPendingAmount'. Either include it or remove the dependency array. |
| 4 | ERROR | 2006 | 15 | `no-unused-vars` | 'viewportTop' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 5 | ERROR | 2252 | 14 | `no-constant-condition` | Unexpected constant condition. |
| 6 | ERROR | 3791 | 11 | `no-unused-vars` | 'handleToday' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 7 | ERROR | 3798 | 11 | `no-unused-vars` | 'handleClear' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 8 | ERROR | 4377 | 5 | `no-unused-vars` | 'onResetStateDraft' is defined but never used. |
| 9 | ERROR | 4378 | 5 | `no-unused-vars` | 'onPersistLevelingProposal' is defined but never used. |
| 10 | AVISO | 4398 | 11 | `react-hooks/exhaustive-deps` | The 'allRows' logical expression could make the dependencies of useMemo Hook (at line 4409) change on every render. To fix this, wrap the initialization of 'allRows' in its own useMemo() Hook. |
| 11 | AVISO | 4398 | 11 | `react-hooks/exhaustive-deps` | The 'allRows' logical expression could make the dependencies of useMemo Hook (at line 4423) change on every render. To fix this, wrap the initialization of 'allRows' in its own useMemo() Hook. |
| 12 | AVISO | 4398 | 11 | `react-hooks/exhaustive-deps` | The 'allRows' logical expression could make the dependencies of useMemo Hook (at line 4442) change on every render. To fix this, wrap the initialization of 'allRows' in its own useMemo() Hook. |
| 13 | ERROR | 4492 | 37 | `react-hooks/preserve-manual-memoization` | Compilation Skipped: Existing memoization could not be preserved React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `getPeriodCapacityStatus`, but the source dependencies were [manualLimits, rows]. Inferred different dependency than source. 4490 \| }; 4491 \| }; > 4492 \| const overloadSummary = useMemo(() => { \| ^^^^^^^ > 4493 \| const overloadedResources = new Set(); \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 4494 \| let overloadedPeriods = 0; … \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 4509 \| }; \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 4510 \| }, [manualLimits, rows]); \| ^^^^^^ Could not preserve existing manual memoization 4511 \| const levelingSimulation = useMemo(() => { 4512 \| const moves = []; 4513 \| const unresolved = []; |
| 14 | AVISO | 4510 | 8 | `react-hooks/exhaustive-deps` | React Hook useMemo has a missing dependency: 'getPeriodCapacityStatus'. Either include it or remove the dependency array. |
| 15 | ERROR | 4511 | 40 | `react-hooks/preserve-manual-memoization` | Compilation Skipped: Existing memoization could not be preserved React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `getPeriodCapacityStatus`, but the source dependencies were [manualLimits, rows]. Inferred different dependency than source. 4509 \| }; 4510 \| }, [manualLimits, rows]); > 4511 \| const levelingSimulation = useMemo(() => { \| ^^^^^^^ > 4512 \| const moves = []; \| ^^^^^^^^^^^^^^^^^^^^^^^^^ > 4513 \| const unresolved = []; … \| ^^^^^^^^^^^^^^^^^^^^^^^^^ > 4571 \| }; \| ^^^^^^^^^^^^^^^^^^^^^^^^^ > 4572 \| }, [manualLimits, rows]); \| ^^^^^^ Could not preserve existing manual memoization 4573 \| const categoryGroups = useMemo(() => { 4574 \| const grouped = new Map(); 4575 \| rows.forEach((row) => { |
| 16 | AVISO | 4572 | 8 | `react-hooks/exhaustive-deps` | React Hook useMemo has a missing dependency: 'getPeriodCapacityStatus'. Either include it or remove the dependency array. |
| 17 | ERROR | 4615 | 10 | `react-hooks/preserve-manual-memoization` | Compilation Skipped: Existing memoization could not be preserved React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This dependency may be mutated later, which could cause the value to change unexpectedly. 4613 \| const periodGridStyle = useMemo(() => ({ 4614 \| gridTemplateColumns: `repeat(${Math.max(periodos.length, 1)}, minmax(8rem, 1fr))`, > 4615 \| }), [periodos.length]); \| ^^^^^^^^ This dependency may be modified later 4616 \| 4617 \| if (loading) { 4618 \| return ( |
| 18 | ERROR | 5157 | 12 | `no-unused-vars` | 'periodTypeMenuStyle' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 19 | ERROR | 5158 | 12 | `no-unused-vars` | 'distributionModeMenuStyle' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 20 | AVISO | 5263 | 8 | `react-hooks/exhaustive-deps` | React Hook useMemo has a missing dependency: 'cronogramaTrabajo'. Either include it or remove the dependency array. |
| 21 | ERROR | 6762 | 121 | `no-undef` | 'activeManualTemporalSummary' is not defined. |
| 22 | ERROR | 6762 | 165 | `no-undef` | 'activeManualTemporalSummary' is not defined. |
| 23 | ERROR | 6847 | 142 | `no-undef` | 'activeManualTemporalSummary' is not defined. |
| 24 | ERROR | 6847 | 182 | `no-undef` | 'activeManualTemporalSummary' is not defined. |
| 25 | ERROR | 6847 | 374 | `no-undef` | 'activeManualTemporalSummary' is not defined. |
| 26 | ERROR | 6847 | 414 | `no-undef` | 'activeManualTemporalSummary' is not defined. |
| 27 | ERROR | 6847 | 577 | `no-undef` | 'selectedDistributionModeLabel' is not defined. |
| 28 | ERROR | 6884 | 119 | `no-undef` | 'currency' is not defined. |
| 29 | ERROR | 6884 | 129 | `no-undef` | 'decMoneda' is not defined. |

### src/components/projects/cronogramasGanttSubbars.js

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 457 | 5 | `no-unused-vars` | 'timeScale' is assigned a value but never used. |

### src/components/projects/DatosProyecto.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 1 | 63 | `no-unused-vars` | 'useRef' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 277 | 7 | `no-unused-vars` | 'parseObjectiveItems' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 3 | ERROR | 278 | 7 | `no-unused-vars` | 'serializeObjectiveItems' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 4 | ERROR | 294 | 7 | `no-unused-vars` | 'formatContractMoney' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 5 | ERROR | 776 | 11 | `no-unused-vars` | 'openDatePicker' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/components/projects/DesagregacionTab.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 1156 | 11 | `react-hooks/exhaustive-deps` | The 'selectedApuResources' logical expression could make the dependencies of useMemo Hook (at line 1171) change on every render. To fix this, wrap the initialization of 'selectedApuResources' in its own useMemo() Hook. |

### src/components/projects/Edo.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 146 | 11 | `no-unused-vars` | 'Icon' is assigned a value but never used. |

### src/components/projects/Edt.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 173 | 11 | `no-unused-vars` | 'Icon' is assigned a value but never used. |
| 2 | ERROR | 754 | 11 | `no-unused-vars` | 'normalizedRole' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/components/projects/FormulaPolinomicaTab.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 188 | 14 | `no-unused-vars` | 'loadError' is defined but never used. |

### src/components/projects/GridColumnManager.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 3 | 10 | `no-unused-vars` | 'motion' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 40 | 14 | `react-refresh/only-export-components` | Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components. |

### src/components/projects/HierarchyGraphView.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 806 | 11 | `no-unused-vars` | 'handleExpandAll' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 810 | 11 | `no-unused-vars` | 'handleCollapseAll' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/components/projects/MergeInterparentModal.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 60 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has an unnecessary dependency: 'totalSourceAmount'. Either exclude it or remove the dependency array. |

### src/components/RegisterModal.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 38 | 43 | `no-unused-vars` | 'onRegisterSuccess' is defined but never used. |
| 2 | ERROR | 79 | 26 | `no-unused-vars` | 'err' is defined but never used. |

### src/components/reporting/ClassicPrintOptionsModal.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 64 | 9 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 62 \| useEffect(() => { 63 \| if (!isOpen) return; > 64 \| setPageSize(defaultPageSize); \| ^^^^^^^^^^^ Avoid calling setState() directly within an effect 65 \| setOrientation(defaultOrientation); 66 \| setPrintMode(supportsPagination ? defaultPrintMode : 'complete'); 67 \| setRowsPerPage(String(defaultRowsPerPage)); |

### src/components/reporting/CommonReportPreviewModal.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 93 | 11 | `no-unused-vars` | 'Icon' is defined but never used. |

### src/components/ui/AnimatedDateInput.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 170 | 5 | `no-unused-vars` | 'clearable' is assigned a value but never used. |
| 2 | ERROR | 203 | 13 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 201 \| useEffect(() => { 202 \| if (!isOpen) { > 203 \| setDraftParts(resolvedParts); \| ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect 204 \| } 205 \| }, [isOpen, resolvedParts]); 206 \| |
| 3 | ERROR | 209 | 9 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 207 \| useEffect(() => { 208 \| if (!openOnMount \|\| disabled \|\| readOnly) return; > 209 \| setIsOpen(true); \| ^^^^^^^^^ Avoid calling setState() directly within an effect 210 \| }, [disabled, openOnMount, readOnly]); 211 \| 212 \| useEffect(() => { |
| 4 | ERROR | 215 | 13 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 213 \| if (!isOpen) return; 214 \| if (draftParts) { > 215 \| setVisibleMonthDate(new Date(draftParts.year, draftParts.month, 1)); \| ^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect 216 \| } 217 \| }, [draftParts, isOpen]); 218 \| |
| 5 | ERROR | 389 | 11 | `no-unused-vars` | 'handleClear' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/components/ui/AppHint.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 143 | 13 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 141 \| useEffect(() => { 142 \| if (disabled && visible) { > 143 \| setVisible(false); \| ^^^^^^^^^^ Avoid calling setState() directly within an effect 144 \| } 145 \| }, [disabled, visible]); 146 \| |

### src/components/ui/EDTTreeSelector.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 3 | 10 | `no-unused-vars` | 'motion' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/context/AuthContext.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 228 | 13 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 226 \| useEffect(() => { 227 \| if (!user) { > 228 \| setLicenseInfo(null); \| ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect 229 \| return; 230 \| } 231 \| const targetEmpresaId = user.rol?.toLowerCase() === 'superadministrador' |
| 2 | ERROR | 381 | 13 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 379 \| 380 \| if (baseEmpresaId !== null && baseEmpresaId !== empresaId) { > 381 \| setSelectedBaseTrabajo(null); \| ^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect 382 \| localStorage.removeItem('giproy_working_base'); 383 \| } 384 \| |

### src/context/PresupuestoContext.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 81 | 11 | `no-unused-vars` | 'recalculateBudgetSnapshot' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | AVISO | 215 | 11 | `react-hooks/exhaustive-deps` | The 'config' object makes the dependencies of useMemo Hook (at line 365) change on every render. Move it inside the useMemo callback. Alternatively, wrap the initialization of 'config' in its own useMemo() Hook. |
| 3 | ERROR | 333 | 45 | `react-hooks/preserve-manual-memoization` | Compilation Skipped: Existing memoization could not be preserved React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `activePresupuesto?.id`, but the source dependencies were [currentEmpresaId]. Inferred different dependency than source. 331 \| }, [currentEmpresaId, refreshActivePresupuesto]); 332 \| > 333 \| const refreshNotesSummary = useCallback(async (presupuestoId = null) => { \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 334 \| const targetId = presupuestoId \|\| activePresupuesto?.id; \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 335 \| if (!targetId) return null; … \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 343 \| } \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 344 \| }, [currentEmpresaId]); // Quitamos activePresupuesto?.id \| ^^^^^^ Could not preserve existing manual memoization 345 \| 346 \| const markBudgetOpened = useCallback(async (presupuestoId = null) => { 347 \| const targetId = presupuestoId \|\| activePresupuesto?.id; |
| 4 | AVISO | 344 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has a missing dependency: 'activePresupuesto?.id'. Either include it or remove the dependency array. |
| 5 | ERROR | 346 | 42 | `react-hooks/preserve-manual-memoization` | Compilation Skipped: Existing memoization could not be preserved React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `activePresupuesto?.id`, but the source dependencies were [currentEmpresaId]. Inferred different dependency than source. 344 \| }, [currentEmpresaId]); // Quitamos activePresupuesto?.id 345 \| > 346 \| const markBudgetOpened = useCallback(async (presupuestoId = null) => { \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 347 \| const targetId = presupuestoId \|\| activePresupuesto?.id; \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 348 \| if (!targetId) return; \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 349 \| try { \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 350 \| await presupuestosApi.markOpened(targetId, currentEmpresaId); \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 351 \| } catch (error) { \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 352 \| globalThis.reportClientError?.("Error registrando apertura del presupuesto:", error); \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 353 \| } \| ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ > 354 \| }, [currentEmpresaId]); // Quitamos activePresupuesto?.id \| ^^^^^^ Could not preserve existing manual memoization 355 \| 356 \| const dataValue = useMemo(() => ({ 357 \| activePresupuesto, |
| 6 | AVISO | 354 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has a missing dependency: 'activePresupuesto?.id'. Either include it or remove the dependency array. |

### src/features/bim/BimCdeAclHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 10 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimCdeCollaborationHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 37 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimCdeDocumentsHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 7 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimCdeReviewHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 10 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimCdeRfiHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 9 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimCdeSubmittalsHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 9 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimElementExplorerHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 7 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimFederationHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 16 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimFieldDiaryHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 18 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimFieldDocumentsHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 15 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimFieldHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 10 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimFieldIssuesHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 22 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimFragmentsProductHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 10 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimIdsHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 29 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimPlanActualHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 14 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimProductivityHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 10 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimQtoHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 48 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimResourceLevelingHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 10 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimSchedule4dHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 15 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimScheduleInterchangeHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 11 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimShellHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 11 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimSiteGeoreferenceHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 28 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimTimeline4dHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 26 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimViewerHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 112 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimViewStateReplayHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 10 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimWorkfrontScenarioHarness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 10 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/features/bim/BimWorkspaceV2Harness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 50 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/gantt-ff-harness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 8 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/hooks/bim/useBimFeatureAccess.js

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 61 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'user'. Either include it or remove the dependency array. |

### src/hooks/useFormatters.js

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 3 | 10 | `no-unused-vars` | 'roundDecimal' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 4 | 30 | `no-unused-vars` | 'toDecimalNumber' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/hooks/useMarketplaceOrigin.js

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 18 | 13 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 16 \| useEffect(() => { 17 \| if (!entityType \|\| !entityId) { > 18 \| setOrigin(null); \| ^^^^^^^^^ Avoid calling setState() directly within an effect 19 \| return; 20 \| } 21 \| |

### src/hooks/useMarketplaceOriginsMap.js

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 11 | 9 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 9 \| useEffect(() => { 10 \| let cancelled = false; > 11 \| setLoading(true); \| ^^^^^^^^^^ Avoid calling setState() directly within an effect 12 \| marketplaceApi 13 \| .getOrigins() 14 \| .then((response) => { |

### src/layouts/AppLayout.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 164 | 13 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 162 \| 163 \| if (!isBelowMinimum) { > 164 \| setShowResWarning(false); \| ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect 165 \| return; 166 \| } 167 \| |
| 2 | ERROR | 239 | 22 | `no-unused-vars` | 'error' is defined but never used. |
| 3 | ERROR | 255 | 13 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 253 \| useEffect(() => { 254 \| if (!canSeeTransferSignal) { > 255 \| setTransferSignal((current) => ( \| ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect 256 \| current.total === 0 && current.nuevos === 0 ? current : { total: 0, nuevos: 0 } 257 \| )); 258 \| return undefined; |
| 4 | ERROR | 271 | 22 | `no-unused-vars` | 'error' is defined but never used. |
| 5 | ERROR | 389 | 18 | `no-unused-vars` | 'error' is defined but never used. |

### src/pages/AdminGlobalEmail.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 108 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'syncFormFromSettings'. Either include it or remove the dependency array. |

### src/pages/AdminGlobalEmpresas.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 76 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'loadEmpresas'. Either include it or remove the dependency array. |

### src/pages/AdminGlobalIntegraciones.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 33 | 40 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'loadStatus'. Either include it or remove the dependency array. |

### src/pages/AdminGlobalLicencias.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 42 | 7 | `no-unused-vars` | 'licenseMeta' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 48 | 7 | `no-unused-vars` | 'licenseLabels' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 3 | ERROR | 404 | 7 | `no-unused-vars` | 'metricChip' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 4 | ERROR | 1569 | 66 | `no-unused-vars` | 'e' is defined but never used. |

### src/pages/APUs.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 15 | 10 | `no-unused-vars` | 'motion' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 40 | 10 | `no-unused-vars` | 'roundDecimal' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 3 | ERROR | 336 | 75 | `no-unused-vars` | 'd' is defined but never used. |
| 4 | AVISO | 337 | 11 | `react-hooks/exhaustive-deps` | The 'parseNumericInput' logical expression could make the dependencies of useCallback Hook (at line 1997) change on every render. To fix this, wrap the initialization of 'parseNumericInput' in its own useMemo() Hook. |
| 5 | AVISO | 337 | 11 | `react-hooks/exhaustive-deps` | The 'parseNumericInput' logical expression could make the dependencies of useCallback Hook (at line 2016) change on every render. To fix this, wrap the initialization of 'parseNumericInput' in its own useMemo() Hook. |
| 6 | ERROR | 367 | 12 | `no-unused-vars` | 'categorias' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 7 | AVISO | 577 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has a missing dependency: 'buildPersistedLineOrder'. Either include it or remove the dependency array. |
| 8 | AVISO | 959 | 11 | `react-hooks/exhaustive-deps` | The 'handleCreateNew' function makes the dependencies of useEffect Hook (at line 1001) change on every render. To fix this, wrap the definition of 'handleCreateNew' in its own useCallback() Hook. |
| 9 | ERROR | 1072 | 19 | `no-unused-vars` | 'matchedUnit' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 10 | AVISO | 1183 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has a missing dependency: 'persistCurrentApuEditor'. Either include it or remove the dependency array. |
| 11 | ERROR | 1902 | 19 | `no-unused-vars` | 'safeNumValue' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 12 | AVISO | 2075 | 8 | `react-hooks/exhaustive-deps` | React Hook useMemo has a missing dependency: 'buildPersistedLineOrder'. Either include it or remove the dependency array. |

### src/pages/BasesTrabajo.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 3 | 10 | `no-unused-vars` | 'motion' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 107 | 23 | `no-unused-vars` | 'setSortOrder' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 3 | ERROR | 114 | 12 | `no-unused-vars` | 'deleteStep' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 4 | ERROR | 508 | 22 | `no-unused-vars` | 'err' is defined but never used. |
| 5 | ERROR | 801 | 35 | `no-unused-vars` | 'ownershipTone' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/pages/Community.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 218 | 7 | `no-unused-vars` | 'formatCommunityDate' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | AVISO | 384 | 11 | `react-hooks/exhaustive-deps` | The 'currentTopics' logical expression could make the dependencies of useMemo Hook (at line 607) change on every render. To fix this, wrap the initialization of 'currentTopics' in its own useMemo() Hook. |
| 3 | ERROR | 426 | 11 | `no-unused-vars` | 'pendingAppeals' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 4 | AVISO | 567 | 11 | `react-hooks/exhaustive-deps` | The 'directoryPosts' logical expression could make the dependencies of useMemo Hook (at line 607) change on every render. To fix this, wrap the initialization of 'directoryPosts' in its own useMemo() Hook. |
| 5 | AVISO | 630 | 9 | `react-hooks/exhaustive-deps` | React Hook useMemo has a missing dependency: 'sortTopicsByFollowAndActivity'. Either include it or remove the dependency array. |
| 6 | AVISO | 716 | 8 | `react-hooks/exhaustive-deps` | React Hook useMemo has a missing dependency: 'sortTopicsByFollowAndActivity'. Either include it or remove the dependency array. |
| 7 | ERROR | 728 | 11 | `no-unused-vars` | 'openStructureModal' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 8 | AVISO | 937 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'loadCommunityData'. Either include it or remove the dependency array. |
| 9 | ERROR | 1237 | 11 | `no-unused-vars` | 'handlePrepareSanctionForUser' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 10 | ERROR | 1286 | 21 | `no-unused-vars` | 'confirmPassword' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 11 | ERROR | 2647 | 59 | `no-unused-vars` | 'rowHasSelectedTopic' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/pages/Dashboard.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 23 | 11 | `react-hooks/exhaustive-deps` | The 'modules' array makes the dependencies of useEffect Hook (at line 69) change on every render. To fix this, wrap the initialization of 'modules' in its own useMemo() Hook. |
| 2 | AVISO | 23 | 11 | `react-hooks/exhaustive-deps` | The 'modules' array makes the dependencies of useEffect Hook (at line 98) change on every render. To fix this, wrap the initialization of 'modules' in its own useMemo() Hook. |
| 3 | ERROR | 67 | 13 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 65 \| useEffect(() => { 66 \| if (!modules.some((module) => module.id === activeModuleId)) { > 67 \| setActiveModuleId(modules[0]?.id \|\| ''); \| ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect 68 \| } 69 \| }, [activeModuleId, modules]); 70 \| |

### src/pages/Login.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 1 | 43 | `no-unused-vars` | 'useCallback' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 80 | 18 | `no-unused-vars` | 'err' is defined but never used. |

### src/pages/Marketplace.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 128 | 7 | `no-unused-vars` | 'isSystemProduct' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 952 | 40 | `no-unused-vars` | 'Icon' is defined but never used. |
| 3 | ERROR | 967 | 39 | `no-unused-vars` | 'Icon' is defined but never used. |
| 4 | ERROR | 1008 | 12 | `no-unused-vars` | 'preloadedCount' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 5 | AVISO | 1532 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'totalResults'. Either include it or remove the dependency array. |
| 6 | ERROR | 1634 | 28 | `no-undef` | 'resolveLicenseOfferMeta' is not defined. |

### src/pages/MarketplaceAdminDashboard.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 867 | 7 | `no-unused-vars` | 'getPortalImportWorkspaceStatus' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 1134 | 12 | `no-unused-vars` | 'saving' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 3 | ERROR | 1860 | 11 | `no-unused-vars` | 'handleEditCategory' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 4 | ERROR | 1871 | 11 | `no-unused-vars` | 'handleSubmit' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 5 | ERROR | 1909 | 11 | `no-unused-vars` | 'handleDeleteCategory' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 6 | ERROR | 2349 | 11 | `no-unused-vars` | 'openPortalPreview' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 7 | ERROR | 2591 | 11 | `no-unused-vars` | 'requestCloseProductEditorModal' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 8 | ERROR | 4425 | 38 | `no-constant-condition` | Unexpected constant condition. |
| 9 | ERROR | 5015 | 22 | `no-constant-condition` | Unexpected constant condition. |

### src/pages/MarketplaceBuyerDashboard.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 11 | 86 | `no-unused-vars` | 'resolveMarketplaceRefundResolutionLabel' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/pages/Placeholders.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 123 | 38 | `no-unused-vars` | 'index' is defined but never used. |

### src/pages/PreciosUnitarios.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 19 | 11 | `no-unused-vars` | 'activeBaseTone' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/pages/Proyectos.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 79 | 10 | `no-unused-vars` | 'getIndirectosStatus' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 250 | 7 | `no-unused-vars` | 'getProjectBudgetChipClasses' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 3 | ERROR | 261 | 7 | `no-unused-vars` | 'getProjectIndirectosChipClasses' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 4 | ERROR | 530 | 7 | `no-unused-vars` | 'getPortfolioCalendarEventMeta' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 5 | ERROR | 784 | 11 | `no-unused-vars` | 'formatNumericDisplay' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 6 | ERROR | 892 | 31 | `no-unused-vars` | 'moduleMapInv' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 7 | ERROR | 1060 | 11 | `no-unused-vars` | 'selectedProjectTone' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 8 | ERROR | 1096 | 12 | `no-unused-vars` | 'portfolioCalendarEntriesLoading' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 9 | AVISO | 1241 | 11 | `react-hooks/exhaustive-deps` | The 'fetchProyectos' function makes the dependencies of useCallback Hook (at line 1652) change on every render. To fix this, wrap the definition of 'fetchProyectos' in its own useCallback() Hook. |
| 10 | AVISO | 1795 | 11 | `react-hooks/exhaustive-deps` | The 'handleOpenRevisionModal' function makes the dependencies of useCallback Hook (at line 3040) change on every render. To fix this, wrap the definition of 'handleOpenRevisionModal' in its own useCallback() Hook. |
| 11 | AVISO | 2352 | 8 | `react-hooks/exhaustive-deps` | React Hook useMemo has an unnecessary dependency: 'buildInlineRevisionList'. Either exclude it or remove the dependency array. Outer scope values like 'buildInlineRevisionList' aren't valid dependencies because mutating them doesn't re-render the component. |
| 12 | ERROR | 2478 | 11 | `no-unused-vars` | 'selectedCalendarDayEvents' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 13 | ERROR | 2493 | 11 | `no-unused-vars` | 'selectedCalendarDayEntries' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 14 | ERROR | 2546 | 11 | `no-unused-vars` | 'calendarMixedPreviewByDate' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 15 | ERROR | 2559 | 11 | `no-unused-vars` | 'portfolioCalendarHoveredItem' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 16 | ERROR | 2587 | 11 | `no-unused-vars` | 'selectedCalendarDayHasOverflow' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 17 | AVISO | 2737 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has an unnecessary dependency: 'buildInlineRevisionList'. Either exclude it or remove the dependency array. Outer scope values like 'buildInlineRevisionList' aren't valid dependencies because mutating them doesn't re-render the component. |
| 18 | AVISO | 2925 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has unnecessary dependencies: 'getProjectCalculatedBudget' and 'getProjectEntityBudget'. Either exclude them or remove the dependency array. Outer scope values like 'getProjectEntityBudget' aren't valid dependencies because mutating them doesn't re-render the component. |
| 19 | AVISO | 2960 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has an unnecessary dependency: 'buildInlineRevisionList'. Either exclude it or remove the dependency array. Outer scope values like 'buildInlineRevisionList' aren't valid dependencies because mutating them doesn't re-render the component. |
| 20 | ERROR | 3135 | 11 | `no-unused-vars` | 'handleDeletePortfolioCalendarEntry' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/pages/Recursos.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 3 | 10 | `no-unused-vars` | 'motion' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 379 | 11 | `no-unused-vars` | 'formatNumericDisplay' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/pages/ResetPassword.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 7 | 10 | `no-unused-vars` | 'motion' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/pages/RucReviewStatus.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 14 | 28 | `react-hooks/set-state-in-effect` | Error: Calling setState synchronously within an effect can trigger cascading renders Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following: * Update external systems with the latest state from React. * Subscribe for updates from some external system, calling setState in a callback function when external state changes. Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect). 12 \| 13 \| useEffect(() => { > 14 \| if (!token) return setError('El enlace de estado no es válido.'); \| ^^^^^^^^ Avoid calling setState() directly within an effect 15 \| publicAuthApi.getRucManualReviewStatus(token).then(setResult).catch(() => setError('No se pudo consultar esta solicitud.')); 16 \| }, [token]); 17 \| |

### src/pages/SellerDashboard.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | AVISO | 444 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'loadData'. Either include it or remove the dependency array. |
| 2 | AVISO | 454 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'categoryOptions'. Either include it or remove the dependency array. |
| 3 | AVISO | 490 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'resetFormState'. Either include it or remove the dependency array. |
| 4 | ERROR | 1104 | 11 | `no-unused-vars` | 'renderApprovedProductsQueue' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/pages/Settings.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 2 | 10 | `no-unused-vars` | 'motion' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | AVISO | 334 | 8 | `react-hooks/exhaustive-deps` | React Hook useCallback has a missing dependency: 'setSelectedEmpresa'. Either include it or remove the dependency array. |
| 3 | AVISO | 659 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'navigate'. Either include it or remove the dependency array. |
| 4 | AVISO | 879 | 8 | `react-hooks/exhaustive-deps` | React Hook useEffect has a missing dependency: 'navigate'. Either include it or remove the dependency array. |
| 5 | ERROR | 947 | 11 | `no-unused-vars` | 'renderEmpresas' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 6 | ERROR | 1246 | 11 | `no-unused-vars` | 'renderSuperadmins' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 7 | ERROR | 2010 | 69 | `no-undef` | 'setCompanyBackupRestoreConfirmations' is not defined. |

### src/pages/Subcategorias.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 4 | 10 | `no-unused-vars` | 'motion' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |
| 2 | ERROR | 50 | 37 | `no-unused-vars` | 'getMarketplaceOwnershipTone' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/pages/VerifyRegistration.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 6 | 10 | `no-unused-vars` | 'motion' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/settings-empresa-harness.jsx

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 66 | 7 | `react-refresh/only-export-components` | Fast refresh only works when a file has exports. Move your component(s) to a separate file. |

### src/utils/classicPrintEngine.js

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 549 | 64 | `no-unused-vars` | 'accent' is assigned a value but never used. |
| 2 | ERROR | 635 | 7 | `no-unused-vars` | 'splitHierarchyPrintPages' is assigned a value but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/utils/cronogramaNumbers.js

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 1 | 10 | `no-unused-vars` | 'roundDecimal' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/utils/edtValuation.js

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 1 | 10 | `no-unused-vars` | 'roundDecimal' is defined but never used. Allowed unused vars must match /^[A-Z_]/u. |

### src/utils/reportFileName.js

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 3 | 18 | `no-control-regex` | Unexpected control character(s) in regular expression: \x00, \x1f. |

### src/utils/vaeCalculator.js

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 7 | 18 | `no-prototype-builtins` | Do not access Object.prototype method 'hasOwnProperty' from target object. |
| 2 | ERROR | 14 | 18 | `no-prototype-builtins` | Do not access Object.prototype method 'hasOwnProperty' from target object. |
| 3 | ERROR | 15 | 18 | `no-prototype-builtins` | Do not access Object.prototype method 'hasOwnProperty' from target object. |

### vite.config.js

| # | Severidad | Linea | Columna | Regla | Mensaje |
|---:|---|---:|---:|---|---|
| 1 | ERROR | 14 | 20 | `no-undef` | 'process' is not defined. |
