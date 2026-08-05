import React, { useEffect } from 'react';
import { BookOpen, CheckCircle2, CircleAlert, X } from 'lucide-react';

const BIM_GUIDES = {
  project: {
    title: 'Crear un proyecto desde cero',
    purpose: 'Recorrido proyecto → presupuesto → Gantt → BIM',
    body: 'Confirme primero la empresa, la base de precios y la revisión. Después construya la EDT, incorpore APUs y cantidades, prepare el Gantt y decida si BIM aporta valor para ese alcance. Cada dominio conserva su fuente de verdad.',
    next: 'Abra el proyecto y compruebe identidad, revisión y rol antes de editar. Si BIM no está activado, presupuesto y Gantt siguen siendo un flujo válido.',
  },
  overview: {
    title: 'Cómo trabajar en BIM',
    purpose: 'Orientación del espacio y siguiente decisión',
    body: 'BIM amplía el proyecto sin sustituir el presupuesto ni el Gantt. Empiece confirmando empresa, proyecto, revisión, modelo y rol; después elija si necesita inspeccionar geometría, coordinar 4D/5D o documentar una entrega.',
    next: 'Si el proyecto todavía no tiene modelo, puede continuar con presupuesto y Gantt. Cargar un IFC es una decisión posterior y no bloquea el flujo clásico.',
  },
  model: {
    title: 'Modelo y versiones',
    purpose: 'Comprobar el origen antes de interpretar elementos',
    body: 'La versión activa determina geometría, propiedades y resultados asociados. Compare una entrega nueva antes de aprobarla y conserve la anterior para poder explicar qué cambió.',
    next: 'Seleccione un elemento, compruebe su GUID y propiedades y confirme que pertenece al proyecto y revisión visibles en la cabecera.',
  },
  planning: {
    title: 'Planificación 4D y control 5D',
    purpose: 'Conectar tiempo, alcance y coste sin sobrescribir fuentes',
    body: 'El presupuesto conserva partidas y cantidades, el Gantt conserva actividades y fechas, y BIM aporta elementos y mediciones. Un vínculo 4D o una propuesta QTO se revisa y aprueba; no convierte automáticamente un dato BIM en un valor contractual.',
    next: 'Use una línea base y un corte explícitos. Si existe una diferencia, regístrela como propuesta o excepción y mantenga la fuente gobernante.',
  },
  coordination: {
    title: 'Coordinación y federación',
    purpose: 'Resolver diferencias con trazabilidad',
    body: 'Federar incorpora disciplinas al mismo contexto; calidad e IDS comprueban requisitos; conflictos localizan incompatibilidades. Cada resultado debe conservar revisión, responsable y motivo de decisión.',
    next: 'No oculte una alerta para continuar. Corrija, rechace o publique una nueva revisión y deje el antecedente consultable.',
  },
  tracking: {
    title: 'Seguimiento de obra',
    purpose: 'Llevar el modelo al campo',
    body: 'Incidencias, partes, recursos y evidencias deben quedar relacionados con fecha, frente, actividad y elemento cuando exista esa referencia. Un porcentaje sin corte, unidad o coste comparable no es un avance verificable.',
    next: 'Registre el hallazgo, adjunte evidencia y envíelo a la decisión correspondiente; cerrar no significa borrar el antecedente.',
  },
  handover: {
    title: 'Entrega y operación',
    purpose: 'Aceptar el modelo y su expediente',
    body: 'La entrega as-built, el commissioning y el dossier digital se revisan como una transición de responsabilidad. La versión entregada debe coincidir con el expediente aceptado y conservar criterios, firmas y pendientes.',
    next: 'Presente la entrega solo cuando versión, documentación y criterios de aceptación estén alineados.',
  },
};

const ContextualHelpPanel = ({ guide = 'overview', context = {}, onClose }) => {
  const content = BIM_GUIDES[guide] || BIM_GUIDES.overview;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-end bg-zinc-950/20 p-3" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }} data-contextual-help-overlay>
      <aside className="flex h-[min(43rem,calc(100vh-1.5rem))] w-[min(28rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-zinc-300 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="contextual-help-title" data-contextual-help-panel>
        <header className="flex items-start gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
          <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-orange-100 text-orange-700"><BookOpen className="size-4" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-orange-700">Ayuda contextual BIM</p><h2 id="contextual-help-title" className="mt-1 text-sm font-bold text-zinc-950">{content.title}</h2><p className="mt-0.5 text-[11px] text-zinc-600">{content.purpose}</p></div>
          <button type="button" onClick={onClose} className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900" aria-label="Cerrar ayuda contextual"><X className="size-4" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-4 text-xs leading-5 text-zinc-700">
          <div className="mb-4 rounded-md border border-zinc-200 bg-white p-3" data-contextual-help-context><p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Contexto actual</p><p className="mt-1 font-semibold text-zinc-900">{context.projectLabel || 'Proyecto activo'}</p><p className="text-[11px] text-zinc-600">{context.companyLabel || 'Empresa'} · {context.modelLabel || 'Sin modelo'} · {context.versionLabel || 'Sin revisión'}</p>{context.roleLabel ? <p className="mt-1 text-[11px] text-zinc-600">Rol: {context.roleLabel}</p> : null}</div>
          <p>{content.body}</p>
          <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-orange-800"><CheckCircle2 className="size-3.5" /> Siguiente paso</p><p className="mt-1 text-orange-950">{content.next}</p></div>
          {context.omniClassEnabled === false ? <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-amber-900"><CircleAlert className="size-3.5" /> OmniClass desactivado</p><p className="mt-1 text-amber-950">La clasificación común puede divergir entre presupuesto, Gantt y BIM. Documente la decisión antes de aprobar vínculos.</p></div> : null}
        </div>
      </aside>
    </div>
  );
};

export default ContextualHelpPanel;
