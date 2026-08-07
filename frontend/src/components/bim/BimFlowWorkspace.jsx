import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Box,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  GitMerge,
  PackageCheck,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { useBimProjectWorkspace } from "../../hooks/bim/useBimProjectWorkspace";
import BimCostEstimatePanel from "./BimCostEstimatePanel";
import BimCoordinationControlPanel from "./BimCoordinationControlPanel";
import BimReportsPanel from "./BimReportsPanel";
import BimGanttPanel from "./BimGanttPanel";
import BimHandoverDossierPanel from "./BimHandoverDossierPanel";

const STAGES = [
  { id: "overview", label: "Inicio", icon: ClipboardCheck },
  { id: "model", label: "Modelo", icon: Box },
  { id: "costs", label: "Presupuesto 5D", icon: WalletCards },
  { id: "schedule", label: "Planificación 4D", icon: CalendarRange },
  { id: "coordination", label: "Coordinación", icon: GitMerge },
  { id: "tracking", label: "Seguimiento", icon: ClipboardCheck },
  { id: "handover", label: "Entrega", icon: PackageCheck },
];

const stageCopy = {
  model: {
    title: "Preparar y validar el modelo",
    description: "Carga una revisión, valida sus GUID y clasificación y decide qué versión puede alimentar presupuesto y planificación.",
    action: "Gestionar modelo",
  },
  costs: {
    title: "Construir el presupuesto 5D",
    description: "Relaciona partidas, cantidades y elementos BIM. Las propuestas permanecen en borrador hasta que alguien las valide.",
    action: "Abrir presupuesto 5D",
  },
  schedule: {
    title: "Construir la planificación 4D",
    description: "Selecciona una línea base, vincula actividades con partidas y elementos y verifica la cobertura antes de oficializar.",
    action: "Abrir planificación 4D",
  },
  coordination: {
    title: "Resolver la coordinación",
    description: "Revisa vínculos incompletos, cambios de versión y conflictos entre presupuesto, Gantt y modelo.",
    action: "Abrir bandeja de coordinación",
  },
  tracking: {
    title: "Controlar avance y coste real",
    description: "Compara previsto, ejecutado, coste y plazo con evidencias asociadas a elementos y actividades.",
    action: "Abrir seguimiento",
  },
  handover: {
    title: "Preparar la entrega",
    description: "Cierra incidencias, valida as-built, documentación y commissioning antes de entregar el dossier.",
    action: "Abrir entrega",
  },
};

const count = (value) => (Array.isArray(value) ? value.length : 0);

export default function BimFlowWorkspace({ project, access, onNavigateTarget }) {
  const [stage, setStage] = useState("overview");
  const { workspace, loading, error, warnings, refresh } = useBimProjectWorkspace(
    project?.id,
    access?.enabled,
  );
  const metrics = useMemo(
    () => ({
      models: count(workspace?.models),
      versions: count(workspace?.versions),
      elements: count(workspace?.elements),
      links: count(workspace?.recent_links),
    }),
    [workspace],
  );
  const hasModel = metrics.models > 0 || metrics.elements > 0;
  const goTo = (next) => setStage(next);
  const empresaId = access?.resolved_company_id;
  const stagePanel = {
    costs: <BimCostEstimatePanel projectId={project?.id} empresaId={empresaId} embedded />,
    schedule: <BimGanttPanel projectId={project?.id} empresaId={empresaId} />,
    coordination: <BimCoordinationControlPanel embedded projectId={project?.id} empresaId={empresaId} />,
    tracking: <BimReportsPanel projectId={project?.id} empresaId={empresaId} />,
    handover: <BimHandoverDossierPanel projectId={project?.id} empresaId={empresaId} />,
  }[stage];

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden border border-zinc-300 bg-zinc-100 text-zinc-800" data-bim-flow-workspace>
      <header className="shrink-0 border-b border-zinc-300 bg-white">
        <div className="flex min-h-14 items-center gap-3 px-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-orange-600 text-white"><Box className="size-4" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-950">BIM del proyecto</p>
            <p className="truncate text-[11px] text-zinc-600">{project?.nombre || "Proyecto activo"} · flujo operativo coordinado</p>
          </div>
          <button type="button" onClick={refresh} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 hover:border-orange-500 hover:text-orange-700 disabled:opacity-50"><RefreshCw className={loading ? "size-3.5 animate-spin" : "size-3.5"} aria-hidden="true" />Actualizar estado</button>
        </div>
        <nav className="flex min-w-0 overflow-x-auto border-t border-zinc-100 px-2" aria-label="Flujo operativo BIM">
          {STAGES.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => goTo(id)} aria-current={stage === id ? "page" : undefined} className={`relative inline-flex h-11 shrink-0 items-center gap-2 px-3 text-xs font-semibold ${stage === id ? "text-zinc-950" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"}`}><Icon className={`size-4 ${stage === id ? "text-orange-600" : ""}`} aria-hidden="true" />{label}{stage === id ? <span className="absolute inset-x-2 bottom-0 h-0.5 bg-orange-600" /> : null}</button>
          ))}
        </nav>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4 lg:p-6">
        {!workspace?.omniclass_enabled ? <div className="mb-4 flex items-start gap-2 border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><p><strong>OmniClass desactivado.</strong> La coordinación común entre presupuesto, Gantt y BIM puede quedar incompleta.</p></div> : null}
        {warnings?.length ? <div className="mb-4 flex items-start gap-2 border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><p>Carga parcial: {warnings.join(", ")}. Revisa el estado antes de oficializar vínculos.</p></div> : null}
        {error ? <div className="mb-4 border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900" role="alert">No se pudo cargar el estado BIM: {String(error?.message || error)}</div> : null}
        {stage === "overview" ? (
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-6"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-700">Centro de trabajo</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">¿Qué necesitas resolver en este proyecto?</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">BIM no empieza en el visor. Empieza comprobando el estado del modelo, el presupuesto y el Gantt, y continúa con la primera tarea que tenga una acción pendiente.</p></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[['Modelo', metrics.models, 'versiones cargadas', 'model'], ['Elementos', metrics.elements, 'elementos disponibles', 'model'], ['Vínculos', metrics.links, 'relaciones registradas', 'coordination'], ['Tri-sincronización', hasModel ? 'En revisión' : 'Pendiente', 'presupuesto ↔ Gantt ↔ BIM', 'costs']].map(([label, value, detail, target]) => <button key={label} type="button" onClick={() => goTo(target)} className="border border-zinc-300 bg-white p-4 text-left transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</span><strong className="mt-2 block text-xl tabular-nums text-zinc-950">{value}</strong><span className="mt-1 block text-xs text-zinc-600">{detail}</span><span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-700">Abrir etapa <ArrowRight className="size-3.5" aria-hidden="true" /></span></button>)}
            </div>
            <section className="mt-6 border border-zinc-300 bg-white"><header className="border-b border-zinc-200 px-4 py-3"><h2 className="text-sm font-semibold text-zinc-950">Orden recomendado de trabajo</h2><p className="mt-1 text-xs text-zinc-600">Cada etapa produce un resultado que alimenta la siguiente.</p></header><div className="grid divide-y divide-zinc-200 md:grid-cols-3 md:divide-x md:divide-y-0">{[['01', 'Validar modelo', 'Versión BIM lista y clasificada', 'model'], ['02', 'Construir 5D y 4D', 'Partidas, actividades y elementos vinculados', 'costs'], ['03', 'Coordinar y cerrar', 'Incidencias resueltas y entrega aprobada', 'coordination']].map(([number, title, detail, target]) => <button key={number} type="button" onClick={() => goTo(target)} className="p-4 text-left hover:bg-zinc-50"><span className="text-[11px] font-bold text-orange-700">{number}</span><h3 className="mt-2 text-sm font-semibold text-zinc-950">{title}</h3><p className="mt-1 text-xs leading-5 text-zinc-600">{detail}</p></button>)}</div></section>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-6xl min-h-full flex-col">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-300 pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-700">Etapa {STAGES.findIndex((item) => item.id === stage)} de 6</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{stageCopy[stage]?.title || "Etapa BIM"}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">{stageCopy[stage]?.description}</p></div><button type="button" onClick={() => goTo("overview")} className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 hover:border-orange-500 hover:text-orange-700">Volver al inicio</button></div>
            <div className="mt-5 grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <section className="min-h-80 overflow-hidden border border-zinc-300 bg-white">{stagePanel ? <div className="h-full min-h-80 overflow-auto">{stagePanel}</div> : <div className="p-5"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-orange-50 text-orange-700"><CheckCircle2 className="size-5" aria-hidden="true" /></span><div><h2 className="text-sm font-semibold text-zinc-950">Siguiente acción</h2><p className="mt-1 text-sm text-zinc-700">{stageCopy[stage]?.action}. Esta etapa aún no está conectada al visor 3D por defecto.</p></div></div><button type="button" onClick={() => onNavigateTarget?.(stage)} className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700">{stageCopy[stage]?.action} <ArrowRight className="size-4" aria-hidden="true" /></button></div>}</section>
              <aside className="border border-zinc-300 bg-white p-4"><h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Estado de entrada</h2><dl className="mt-3 space-y-3 text-xs"><div><dt className="text-zinc-500">Modelos</dt><dd className="font-semibold text-zinc-950">{metrics.models}</dd></div><div><dt className="text-zinc-500">Elementos</dt><dd className="font-semibold text-zinc-950">{metrics.elements}</dd></div><div><dt className="text-zinc-500">Vínculos</dt><dd className="font-semibold text-zinc-950">{metrics.links}</dd></div><div><dt className="text-zinc-500">Estado</dt><dd className="font-semibold text-zinc-950">{loading ? "Cargando" : hasModel ? "Disponible" : "Pendiente"}</dd></div></dl></aside>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
