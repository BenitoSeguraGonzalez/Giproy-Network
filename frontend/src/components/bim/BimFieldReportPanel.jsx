import React, { useEffect, useState } from "react";
import {
  Camera,
  ClipboardList,
  ExternalLink,
  LoaderCircle,
  Save,
} from "lucide-react";

import { bimModelsApi } from "../../api/bimModels";

const inputClass =
  "h-10 min-w-0 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-800 outline-none focus:border-[#F39200] focus:ring-2 focus:ring-orange-100";
const localNow = () => {
  const value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return value.toISOString().slice(0, 16);
};

const BimFieldReportPanel = ({ projectId, empresaId, api = bimModelsApi }) => {
  const [activities, setActivities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [reports, setReports] = useState([]);
  const [file, setFile] = useState(null);
  const [draft, setDraft] = useState({
    activity: "",
    area: "",
    reportedAt: localNow(),
    progress: "",
    quantity: "",
    unit: "m3",
    labor: "",
    equipment: "0",
    bac: "",
    pv: "",
    ac: "",
    currency: "USD",
    log: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!projectId) return undefined;
    setLoading(true);
    Promise.all([
      api.list4dActivities(projectId, empresaId),
      api.list4dWorkAreas(projectId, empresaId),
      api.list4dFieldReports(projectId, null, empresaId),
    ])
      .then(([nextActivities, nextAreas, nextReports]) => {
        if (cancelled) return;
        setActivities(nextActivities);
        setAreas(nextAreas);
        setReports(nextReports);
        setDraft((current) => ({
          ...current,
          activity: String(nextActivities[0]?.id || ""),
          area: String(nextAreas[0]?.id || ""),
        }));
      })
      .catch((requestError) => {
        if (!cancelled)
          setError(
            requestError?.response?.data?.detail ||
              "No se pudo cargar campo BIM.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, empresaId, projectId]);

  const create = async () => {
    setSaving(true);
    setError("");
    try {
      let report = await api.create4dFieldReport(
        projectId,
        {
          activity_snapshot_id: Number(draft.activity),
          work_area_id: draft.area ? Number(draft.area) : null,
          reported_at: new Date(draft.reportedAt).toISOString(),
          progress_percent: Number(draft.progress),
          actual_start: null,
          actual_finish:
            Number(draft.progress) === 100
              ? new Date(draft.reportedAt).toISOString()
              : null,
          installed_quantity: Number(draft.quantity),
          installed_unit: draft.unit.trim(),
          labor_hours: Number(draft.labor),
          equipment_hours: Number(draft.equipment),
          budget_at_completion: Number(draft.bac),
          planned_value_to_date: Number(draft.pv),
          actual_cost: Number(draft.ac),
          currency: draft.currency,
          daily_log: draft.log.trim(),
        },
        empresaId,
      );
      if (file) {
        const evidence = await api.upload4dFieldEvidence(
          projectId,
          report.id,
          file,
          empresaId,
        );
        report = {
          ...report,
          evidence: [...(report.evidence || []), evidence],
        };
      }
      setReports((current) => [report, ...current]);
      setFile(null);
      setDraft((current) => ({
        ...current,
        progress: "",
        quantity: "",
        labor: "",
        equipment: "0",
        pv: "",
        ac: "",
        log: "",
        reportedAt: localNow(),
      }));
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          "No se pudo registrar el reporte de campo.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openEvidence = async (evidence) => {
    try {
      const blob = await api.download4dFieldEvidence(
        projectId,
        evidence.id,
        empresaId,
      );
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail ||
          "No se pudo abrir la evidencia.",
      );
    }
  };

  const latest = reports[0];
  const valid =
    draft.activity &&
    draft.reportedAt &&
    draft.progress !== "" &&
    draft.quantity !== "" &&
    draft.unit.trim() &&
    draft.labor !== "" &&
    draft.bac !== "" &&
    draft.pv !== "" &&
    draft.ac !== "" &&
    draft.log.trim().length >= 3;
  return (
    <section
      className="flex h-full min-h-0 flex-col bg-white"
      data-bim-field-report
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-200 px-4">
        <ClipboardList className="h-4 w-4 text-[#F39200]" />
        <div>
          <h3 className="text-xs font-semibold text-zinc-900">
            Registrar avance
          </h3>
          <p className="text-[10px] text-zinc-500">
            Producción, recursos y coste observado
          </p>
        </div>
        {loading ? (
          <LoaderCircle className="ml-auto h-3.5 w-3.5 animate-spin text-zinc-400" />
        ) : reports.length ? (
          <span className="ml-auto text-[10px] font-semibold text-zinc-500">
            {reports.length} partes
          </span>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <details
          open
          className="border-b border-zinc-200"
          data-bim-field-editor
        >
          <summary className="flex h-10 cursor-pointer list-none items-center gap-2 px-4 text-xs font-semibold text-zinc-800">
            <Save className="h-3.5 w-3.5 text-[#F39200]" />
            Nuevo parte de avance
          </summary>
          <div className="border-t border-zinc-200">
            <fieldset className="space-y-3 border-b border-zinc-200 p-4">
              <legend className="px-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                1 · Contexto de trabajo
              </legend>
              <label className="block text-[11px] font-semibold text-zinc-700">
                Actividad
                <select
                  value={draft.activity}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      activity: event.target.value,
                    }))
                  }
                  className={`${inputClass} mt-1.5 w-full font-normal`}
                  aria-label="Actividad de campo 4D"
                >
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.activity_code} · {activity.activity_name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] font-semibold text-zinc-700">
                  Frente
                  <select
                    value={draft.area}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        area: event.target.value,
                      }))
                    }
                    className={`${inputClass} mt-1.5 w-full font-normal`}
                    aria-label="Frente de campo 4D"
                  >
                    <option value="">Sin frente</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.code} · {area.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] font-semibold text-zinc-700">
                  Fecha
                  <input
                    type="datetime-local"
                    value={draft.reportedAt}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        reportedAt: event.target.value,
                      }))
                    }
                    className={`${inputClass} mt-1.5 w-full font-normal`}
                    aria-label="Fecha del reporte de campo"
                  />
                </label>
              </div>
            </fieldset>
            <fieldset className="space-y-3 border-b border-zinc-200 p-4">
              <legend className="px-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                2 · Avance físico
              </legend>
              <div className="grid grid-cols-[1fr_1fr_5rem] gap-2">
                <label className="text-[11px] font-semibold text-zinc-700">
                  Avance %
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={draft.progress}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        progress: event.target.value,
                      }))
                    }
                    className={`${inputClass} mt-1.5 w-full font-normal`}
                    aria-label="Avance de campo porcentual"
                  />
                </label>
                <label className="text-[11px] font-semibold text-zinc-700">
                  Cantidad
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={draft.quantity}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    className={`${inputClass} mt-1.5 w-full font-normal`}
                    aria-label="Cantidad instalada en campo"
                  />
                </label>
                <label className="text-[11px] font-semibold text-zinc-700">
                  Unidad
                  <input
                    value={draft.unit}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        unit: event.target.value,
                      }))
                    }
                    className={`${inputClass} mt-1.5 w-full font-normal`}
                    aria-label="Unidad instalada en campo"
                  />
                </label>
              </div>
            </fieldset>
            <details className="border-b border-zinc-200">
              <summary className="flex h-10 cursor-pointer list-none items-center px-4 text-[11px] font-semibold text-zinc-700">
                            3 · Recursos y control de coste
                            <span className="ml-auto text-[9px] font-semibold text-orange-700">Obligatorio</span>
              </summary>
              <div className="space-y-3 bg-zinc-50 p-4">
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[10px] font-semibold text-zinc-600">
                    Horas de mano de obra
                    <input
                      type="number"
                      min="0"
                      value={draft.labor}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          labor: event.target.value,
                        }))
                      }
                      className={`${inputClass} mt-1 w-full font-normal`}
                      aria-label="Horas de mano de obra"
                    />
                  </label>
                  <label className="text-[10px] font-semibold text-zinc-600">
                    Horas de equipo
                    <input
                      type="number"
                      min="0"
                      value={draft.equipment}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          equipment: event.target.value,
                        }))
                      }
                      className={`${inputClass} mt-1 w-full font-normal`}
                      aria-label="Horas de equipo"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[10px] font-semibold text-zinc-600">
                    BAC
                    <input
                      type="number"
                      min="0"
                      value={draft.bac}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          bac: event.target.value,
                        }))
                      }
                      className={`${inputClass} mt-1 w-full font-normal`}
                      aria-label="BAC de campo"
                    />
                  </label>
                  <label className="text-[10px] font-semibold text-zinc-600">
                    PV a la fecha
                    <input
                      type="number"
                      min="0"
                      value={draft.pv}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          pv: event.target.value,
                        }))
                      }
                      className={`${inputClass} mt-1 w-full font-normal`}
                      aria-label="PV de campo"
                    />
                  </label>
                  <label className="text-[10px] font-semibold text-zinc-600">
                    Coste real
                    <input
                      type="number"
                      min="0"
                      value={draft.ac}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          ac: event.target.value,
                        }))
                      }
                      className={`${inputClass} mt-1 w-full font-normal`}
                      aria-label="AC de campo"
                    />
                  </label>
                  <label className="text-[10px] font-semibold text-zinc-600">
                    Moneda
                    <select
                      value={draft.currency}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          currency: event.target.value,
                        }))
                      }
                      className={`${inputClass} mt-1 w-full font-normal`}
                      aria-label="Moneda del coste de campo"
                    >
                      <option>USD</option>
                      <option>EUR</option>
                      <option>COP</option>
                    </select>
                  </label>
                </div>
              </div>
            </details>
            <fieldset className="space-y-3 p-4">
              <legend className="px-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                4 · Observación y evidencia
              </legend>
              <textarea
                value={draft.log}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    log: event.target.value,
                  }))
                }
                className="min-h-20 w-full resize-y rounded-md border border-zinc-300 p-2 text-xs outline-none focus:border-[#F39200] focus:ring-2 focus:ring-orange-100"
                placeholder="Describe lo ejecutado, restricciones o incidencias"
                aria-label="Diario de campo BIM"
              />
              <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-dashed border-zinc-300 px-3 text-[10px] text-zinc-600">
                <Camera className="h-3.5 w-3.5 text-[#F39200]" />
                <span className="min-w-0 flex-1 truncate">
                  {file?.name || "Adjuntar evidencia JPEG, PNG o WebP"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="sr-only"
                  aria-label="Evidencia fotográfica de campo"
                />
              </label>
              <button
                type="button"
                onClick={create}
                disabled={saving || !valid}
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-[#F39200] text-xs font-semibold text-white hover:bg-[#dc8300] disabled:opacity-40"
              >
                {saving ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Registrar avance
              </button>
            </fieldset>
          </div>
        </details>
        {latest ? (
          <div
            className="border-b border-zinc-200 p-4"
            data-bim-field-latest={latest.id}
          >
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Último resultado registrado
            </h4>
            <div className="mt-3 grid grid-cols-4 divide-x divide-zinc-200 border-y border-zinc-200 py-2 text-center">
              <div>
                <p className="text-[9px] text-zinc-500">Avance</p>
                <p className="text-xs font-semibold text-zinc-800">
                  {latest.progress_percent}%
                </p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-500">EV</p>
                <p className="text-xs font-semibold text-zinc-800">
                  {latest.earned_value}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-500">SPI</p>
                <p
                  className={`text-xs font-semibold ${latest.schedule_performance_index < 1 ? "text-rose-700" : "text-emerald-700"}`}
                >
                  {latest.schedule_performance_index ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-500">CPI</p>
                <p
                  className={`text-xs font-semibold ${latest.cost_performance_index < 1 ? "text-rose-700" : "text-emerald-700"}`}
                >
                  {latest.cost_performance_index ?? "—"}
                </p>
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-[10px] leading-4 text-zinc-600">
              {latest.daily_log}
            </p>
            {latest.evidence?.map((evidence) => (
              <button
                key={evidence.id}
                type="button"
                onClick={() => openEvidence(evidence)}
                className="mt-2 flex h-9 w-full items-center gap-2 border border-zinc-200 px-2 text-[10px] text-zinc-600 hover:text-[#F39200]"
                aria-label={`Abrir evidencia ${evidence.filename}`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span className="min-w-0 flex-1 truncate text-left">
                  {evidence.filename}
                </span>
                <ExternalLink className="h-3 w-3" />
              </button>
            ))}
          </div>
        ) : !loading ? (
          <p className="px-4 py-8 text-center text-xs text-zinc-500">
            Sin reportes de campo.
          </p>
        ) : null}
      </div>
      {error ? (
        <p
          className="shrink-0 border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
};

export default BimFieldReportPanel;
