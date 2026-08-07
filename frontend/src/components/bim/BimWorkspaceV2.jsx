import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  CalendarRange,
  CircleAlert,
  ClipboardCheck,
  GitMerge,
  Layers3,
  MonitorX,
  MoreHorizontal,
  PackageCheck,
  PanelLeft,
  PanelRight,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Upload,
  X,
  CircleHelp,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { isMinimumDesktopDisplaySupported } from "../../utils/displayResolution";
import { getErrorMessage } from "../../utils/errorMessage";
import useAdaptiveLayout from "../../hooks/useAdaptiveLayout";
import BimTaskNavigator from "./BimTaskNavigator";
import { getBimToolMeta } from "./bimWorkflowCatalog";
import ContextualHelpPanel from "../ui/ContextualHelpPanel";

const PREFERENCES_KEY = "giproy_bim_workspace_v4_preferences";
const MODES = [
  {
    id: "planning-costs",
    label: "Planificación y costes",
    shortLabel: "4D / 5D",
    icon: CalendarRange,
  },
  { id: "model", label: "Modelo", shortLabel: "Modelo", icon: Box },
  {
    id: "coordination",
    label: "Coordinación",
    shortLabel: "Coordinar",
    icon: GitMerge,
  },
  {
    id: "tracking",
    label: "Seguimiento",
    shortLabel: "Seguimiento",
    icon: ClipboardCheck,
  },
  {
    id: "handover",
    label: "Entrega",
    shortLabel: "Entrega",
    icon: PackageCheck,
  },
];
const iconButtonClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-[color,border-color,transform] duration-150 active:scale-[.97] hover:border-orange-500 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-40";

const readPreferences = (projectId) => {
  if (typeof window === "undefined" || !projectId) return {};
  try {
    return (
      JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) || "{}")[
        projectId
      ] || {}
    );
  } catch {
    return {};
  }
};
const writePreferences = (projectId, preferences) => {
  if (typeof window === "undefined" || !projectId) return;
  try {
    const current = JSON.parse(
      window.localStorage.getItem(PREFERENCES_KEY) || "{}",
    );
    window.localStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ ...current, [projectId]: preferences }),
    );
  } catch {
    /* Preferences never block project work. */
  }
};
const useSupportedDesktop = () => {
  const [supported, setSupported] = useState(() =>
    isMinimumDesktopDisplaySupported(),
  );
  useEffect(() => {
    const update = () => setSupported(isMinimumDesktopDisplaySupported());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return supported;
};
const useSafariNotice = () =>
  useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const agent = navigator.userAgent;
    return (
      /Safari/i.test(agent) && !/Chrome|Chromium|CriOS|Edg|OPR/i.test(agent)
    );
  }, []);

class BimRegionBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.failed)
      this.setState({ failed: false });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        className="grid h-full min-h-40 place-items-center border border-rose-200 bg-rose-50 p-5 text-center"
        role="alert"
      >
        <div>
          <p className="text-sm font-semibold text-rose-900">
            Esta herramienta no pudo cargarse.
          </p>
          <p className="mt-1 text-xs text-rose-800">
            El resto del espacio BIM continúa disponible.
          </p>
        </div>
      </div>
    );
  }
}

const BimWorkspaceV2 = ({
  projectId,
  companyLabel,
  projectLabel,
  modelLabel,
  versionLabel,
  viewerMode,
  loading,
  canAdminister,
  explorer,
  viewer,
  inspector,
  workspaceTools,
  bottomTools,
  adminTools,
  ready,
  error,
  warnings = [],
  searchItems = [],
  omniClassEnabled = true,
  onChangeViewerMode,
  onResetContext,
  onRefresh,
  onSearch,
}) => {
  const initial = useMemo(() => readPreferences(projectId), [projectId]);
  const [activeMode, setActiveMode] = useState(
    initial.activeMode || "planning-costs",
  );
  const [activeToolByMode, setActiveToolByMode] = useState(
    initial.activeToolByMode || {},
  );
  const [sidePanel, setSidePanel] = useState(initial.sidePanel || "none");
  const [bottomCollapsed, setBottomCollapsed] = useState(
    initial.bottomCollapsed !== false,
  );
  const [bottomHeight, setBottomHeight] = useState(
    Math.min(260, Math.max(220, initial.bottomHeight || 240)),
  );
  const [adminOpen, setAdminOpen] = useState(false);
  const [utilityOpen, setUtilityOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showStartGuide, setShowStartGuide] = useState(
    initial.startGuideDismissed !== true,
  );
  const [activeAdminTool, setActiveAdminTool] = useState(
    initial.activeAdminTool || "imports",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [remoteMatches, setRemoteMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [resizeStart, setResizeStart] = useState(null);
  const searchRef = useRef(null);
  const onSearchRef = useRef(onSearch);
  const legacySupported = useSupportedDesktop();
  const adaptive = useAdaptiveLayout({ moduleKey: "bim" });
  const restricted = ["constrained", "tablet-portrait"].includes(
    adaptive.profile,
  );
  const supported = adaptive.enabled ? !restricted : legacySupported;
  const safariNotice = useSafariNotice();
  const helpGuide = activeMode === "planning-costs" ? "planning" : activeMode === "model" ? "model" : activeMode;
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(
    () =>
      writePreferences(projectId, {
        activeMode,
        activeToolByMode,
        sidePanel,
        bottomCollapsed,
        bottomHeight,
        activeAdminTool,
        startGuideDismissed: !showStartGuide,
      }),
    [
      activeAdminTool,
      activeMode,
      activeToolByMode,
      bottomCollapsed,
      bottomHeight,
      projectId,
      sidePanel,
      showStartGuide,
    ],
  );
  useEffect(() => {
    if (!resizeStart) return undefined;
    const move = (event) =>
      setBottomHeight(
        Math.min(
          260,
          Math.max(220, resizeStart.height - event.clientY + resizeStart.y),
        ),
      );
    const up = () => setResizeStart(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [resizeStart]);
  useEffect(() => {
    const keydown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
      if (event.altKey && /^[1-5]$/.test(event.key)) {
        event.preventDefault();
        setActiveMode(MODES[Number(event.key) - 1].id);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setAdminOpen(false);
        setUtilityOpen(false);
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);
  useEffect(() => {
    const query = searchTerm.trim();
    if (!onSearchRef.current || query.length < 2) {
      setRemoteMatches([]);
      setSearching(false);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const timeoutId = window.setTimeout(() => {
      Promise.resolve(onSearchRef.current(query))
        .then((items) => {
          if (!cancelled) setRemoteMatches(items || []);
        })
        .catch(() => {
          if (!cancelled) setRemoteMatches([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  if (!supported)
    return (
      <section
        className="grid h-full min-h-0 place-items-center overflow-hidden border border-zinc-200 bg-zinc-100"
        data-bim-unsupported-resolution
      >
        <div className="max-w-lg px-6 text-center">
          <MonitorX
            className="mx-auto size-10 text-zinc-500"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-base font-semibold text-zinc-950">
            Espacio de trabajo insuficiente
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            BIM requiere una pantalla física mínima de 1920 × 1080. Gira la
            tablet a horizontal y cierra las barras que reduzcan el área útil.
          </p>
        </div>
      </section>
    );

  const tools = workspaceTools?.[activeMode] || [];
  const selectedToolId = activeToolByMode[activeMode] || tools[0]?.id;
  const selectedTool =
    tools.find((tool) => tool.id === selectedToolId) || tools[0];
  const selectedToolMeta = getBimToolMeta(activeMode, selectedTool?.id);
  const selectedAdmin =
    (adminTools || []).find((tool) => tool.id === activeAdminTool) ||
    adminTools?.[0];
  const planningMode = activeMode === "planning-costs";
  const selectedBottom = bottomTools?.[0];
  const explorerShown =
    ready && sidePanel === "explorer" && activeMode === "model";
  const contextShown =
    ready && ["context", "catalog"].includes(sidePanel) && Boolean(selectedTool || inspector);
  const workbenchShown =
    ready && sidePanel === "workbench" && Boolean(selectedTool);
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("es");
  const matches = onSearch
    ? remoteMatches
    : normalizedSearch
      ? searchItems
          .filter((item) =>
            `${item.label} ${item.meta || ""}`
              .toLocaleLowerCase("es")
              .includes(normalizedSearch),
          )
          .slice(0, 8)
      : [];
  const errorMessage = error
    ? getErrorMessage(error, "No se pudo cargar el espacio BIM.")
    : "";
  const selectMode = (id) => {
    setActiveMode(id);
    setAdminOpen(false);
    setSidePanel("none");
    setUtilityOpen(false);
  };
  const selectTool = (id) => {
    setActiveToolByMode((current) => ({ ...current, [activeMode]: id }));
    setSidePanel(
      getBimToolMeta(activeMode, id).surface === "workbench"
        ? "workbench"
        : "context",
    );
  };
  const toggleSelectedTask = () => {
    const target =
      selectedToolMeta.surface === "workbench" ? "workbench" : "context";
    setSidePanel(sidePanel === target ? "none" : target);
  };
  const openSearchItem = (item) => {
    item.onSelect?.();
    if (item.workspace) selectMode(item.workspace);
    setSearchTerm("");
    setSearchOpen(false);
  };
  const beginBimWorkflow = () => {
    setShowStartGuide(false);
    setActiveMode("planning-costs");
    setSidePanel("none");
  };

  return (
    <section
      className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden border border-zinc-300 bg-zinc-100 text-zinc-800"
      data-bim-workspace-v2
      data-bim-active-workspace={activeMode}
      data-bim-adaptive-profile={adaptive.enabled ? adaptive.profile : "legacy"}
    >
      <header
        className="z-20 shrink-0 border-b border-zinc-300 bg-white"
        data-bim-primary-header
      >
        <div className="flex h-12 min-w-0 items-center gap-3 px-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-orange-600 text-white">
            <Box className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-xs font-semibold text-zinc-950"
              title={projectLabel}
            >
              {projectLabel || "Proyecto sin asignar"}
            </p>
            <p
              className="truncate text-[10px] text-zinc-500"
              title={`${companyLabel || "Empresa"} · ${modelLabel || "Sin modelo"} · ${versionLabel || "Sin revisión"}`}
            >
              {companyLabel || "Empresa"} <span aria-hidden="true">·</span>{" "}
              {modelLabel || "Sin modelo"} <span aria-hidden="true">·</span>{" "}
              {versionLabel || "Sin revisión"}
            </p>
          </div>
          <div className="relative w-[clamp(13rem,18vw,22rem)] shrink-0">
            <label className="flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-zinc-50 px-2.5 focus-within:border-orange-600 focus-within:ring-1 focus-within:ring-orange-600">
              <Search className="size-3.5 text-zinc-500" aria-hidden="true" />
              <span className="sr-only">Buscar en BIM</span>
              <input
                ref={searchRef}
                type="search"
                value={searchTerm}
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setSearchOpen(true);
                }}
                placeholder="GUID, actividad, coste o modelo"
                className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-zinc-500"
              />
              <kbd className="text-[9px] font-semibold text-zinc-500">
                Ctrl K
              </kbd>
            </label>
            {searchOpen && normalizedSearch ? (
              <div
                className="absolute right-0 top-10 z-50 w-[min(28rem,70vw)] overflow-hidden rounded-md border border-zinc-300 bg-white shadow-xl"
                role="listbox"
                aria-label="Resultados BIM"
                aria-busy={searching}
              >
                {searching ? (
                  <p className="px-3 py-4 text-xs text-zinc-600">
                    Buscando en el proyecto autorizado…
                  </p>
                ) : matches.length ? (
                  matches.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => openSearchItem(item)}
                      className="flex min-h-11 w-full items-center justify-between gap-3 border-b border-zinc-100 px-3 text-left last:border-0 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600"
                      role="option"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-zinc-950">
                          {item.label}
                        </span>
                        <span className="block truncate text-[10px] text-zinc-600">
                          {item.meta}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] font-semibold uppercase text-zinc-500">
                        {item.type}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-4 text-xs text-zinc-600">
                    Sin coincidencias autorizadas en este proyecto.
                  </p>
                )}
              </div>
            ) : null}
          </div>
          {canAdminister && !ready ? (
            <button
              type="button"
              onClick={() => {
                setAdminOpen(true);
                setActiveAdminTool("imports");
              }}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-orange-600 px-3 text-xs font-semibold text-white transition-[background-color,transform] duration-150 active:scale-[.97] hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <Upload className="size-4" aria-hidden="true" />
              Configurar BIM
            </button>
          ) : null}
        </div>
        <div className="flex h-10 min-w-0 items-stretch justify-between border-t border-zinc-100 px-2">
          <nav className="flex min-w-0 items-stretch" aria-label="Flujos BIM">
            {MODES.map(({ id, label, shortLabel, icon: Icon }, index) => (
              <button
                key={id}
                type="button"
                onClick={() => selectMode(id)}
                className={`relative inline-flex min-w-0 items-center gap-2 px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600 ${activeMode === id && !adminOpen ? "text-zinc-950" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"}`}
                aria-current={
                  activeMode === id && !adminOpen ? "page" : undefined
                }
                title={`${label} · Alt+${index + 1}`}
              >
                <Icon
                  className={`size-4 shrink-0 ${activeMode === id && !adminOpen ? "text-orange-600" : ""}`}
                  aria-hidden="true"
                />
                <span className="hidden xl:inline">{label}</span>
                <span className="xl:hidden">{shortLabel}</span>
                {activeMode === id && !adminOpen ? (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 bg-orange-600" />
                ) : null}
              </button>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1">
            {warnings.length ? (
              <span
                className="inline-flex size-8 items-center justify-center text-amber-700"
                title={`Carga parcial: no se pudo recuperar ${warnings.join(", ")}. El resto del workspace sigue operativo.`}
                aria-label={`Carga parcial: ${warnings.join(", ")}`}
              >
                <CircleAlert className="size-4" aria-hidden="true" />
              </span>
            ) : null}
            <div
              className="flex h-8 items-center rounded-md border border-zinc-300 bg-zinc-50 p-0.5"
              role="group"
              aria-label="Vista del modelo"
            >
              <button
                type="button"
                onClick={() => onChangeViewerMode("fragments")}
                className={`h-7 rounded px-2 text-xs font-semibold ${viewerMode === "fragments" ? "bg-white text-orange-700 shadow-sm" : "text-zinc-600"}`}
                aria-pressed={viewerMode === "fragments"}
              >
                3D
              </button>
              <button
                type="button"
                onClick={() => onChangeViewerMode("plan")}
                className={`h-7 rounded px-2 text-xs font-semibold ${viewerMode === "plan" ? "bg-white text-orange-700 shadow-sm" : "text-zinc-600"}`}
                aria-pressed={viewerMode === "plan"}
              >
                2D
              </button>
            </div>
            {activeMode === "model" ? (
              <button
                type="button"
                onClick={() =>
                  setSidePanel(sidePanel === "explorer" ? "none" : "explorer")
                }
                className="inline-flex h-8 items-center gap-2 rounded-md border border-zinc-300 bg-white px-2.5 text-xs font-semibold text-zinc-700 hover:border-orange-500 hover:text-orange-700"
                aria-pressed={explorerShown}
              >
                <PanelLeft className="size-3.5" aria-hidden="true" />
                Explorar
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className={iconButtonClass}
              title="Abrir guía contextual"
              aria-label="Abrir guía contextual"
              data-contextual-help-trigger
            >
              <CircleHelp className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={toggleSelectedTask}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-zinc-300 bg-white px-2.5 text-xs font-semibold text-zinc-700 hover:border-orange-500 hover:text-orange-700"
              aria-pressed={contextShown || workbenchShown}
            >
              <PanelRight className="size-3.5" aria-hidden="true" />
              Trabajo
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setUtilityOpen((value) => !value)}
                className={iconButtonClass}
                title="Más acciones"
                aria-label="Más acciones"
                aria-expanded={utilityOpen}
              >
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </button>
              {utilityOpen ? (
                <div
                  className="absolute right-0 top-10 z-50 w-52 rounded-md border border-zinc-300 bg-white p-1 shadow-xl"
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onResetContext?.();
                      setUtilityOpen(false);
                    }}
                    className="flex h-9 w-full items-center gap-2 rounded px-2 text-left text-xs font-medium hover:bg-zinc-100"
                    role="menuitem"
                  >
                    <RotateCcw className="size-3.5" />
                    Restablecer selección
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRefresh?.();
                      setUtilityOpen(false);
                    }}
                    disabled={loading}
                    className="flex h-9 w-full items-center gap-2 rounded px-2 text-left text-xs font-medium hover:bg-zinc-100 disabled:opacity-40"
                    role="menuitem"
                  >
                    <RefreshCw
                      className={`size-3.5 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`}
                    />
                    Actualizar datos
                  </button>
                  {canAdminister ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAdminOpen(true);
                        setUtilityOpen(false);
                      }}
                      className="flex h-9 w-full items-center gap-2 rounded px-2 text-left text-xs font-medium hover:bg-zinc-100"
                      role="menuitem"
                    >
                      <Settings className="size-3.5" />
                      Administrar BIM
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {!omniClassEnabled ? (
        <div
          className="flex min-h-8 shrink-0 items-center gap-2 border-b border-amber-300 bg-amber-50 px-3 text-[11px] text-amber-950"
          role="status"
          data-bim-omniclass-warning
        >
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          <strong>OmniClass desactivado:</strong>
          <span className="truncate">
            presupuesto, Gantt y BIM pueden perder su estructura común.
          </span>
        </div>
      ) : null}
      {safariNotice ? (
        <div
          className="flex min-h-8 shrink-0 items-center gap-2 border-b border-sky-200 bg-sky-50 px-3 text-[11px] text-sky-950"
          role="status"
        >
          <CircleAlert className="size-3.5" aria-hidden="true" />
          <span>
            Safari puede mostrar divergencias en BIM. Para operación coordinada
            recomendamos Chrome, Edge u otro navegador Chromium disponible en
            macOS/iPadOS.
          </span>
        </div>
      ) : null}

      {helpOpen ? (
        <ContextualHelpPanel
          guide={helpGuide}
          context={{
            projectLabel,
            companyLabel,
            modelLabel,
            versionLabel,
            omniClassEnabled,
          }}
          onClose={() => setHelpOpen(false)}
        />
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          className="grid min-h-0 min-w-0 flex-1 gap-2 overflow-hidden p-2"
          style={{
            gridTemplateColumns: explorerShown
              ? "clamp(14rem,16vw,18rem) minmax(0,1fr)"
              : contextShown
                ? "minmax(0,1fr) clamp(18rem,19vw,22rem)"
                : "minmax(0,1fr)",
          }}
          data-bim-shell-layout
        >
          {explorerShown ? (
            <BimRegionBoundary resetKey={`explorer-${projectId}`}>
              <aside
                className="min-h-0 min-w-0 overflow-hidden border border-zinc-300 bg-white"
                aria-label="Explorador BIM"
              >
                {explorer}
              </aside>
            </BimRegionBoundary>
          ) : null}
          <main
            className="relative flex min-h-0 min-w-0 flex-col overflow-hidden"
            data-bim-viewer-region={!workbenchShown ? true : undefined}
            data-bim-workbench-region={
              workbenchShown ? selectedTool?.id : undefined
            }
          >
            {workbenchShown ? (
              <BimRegionBoundary
                resetKey={`workbench-${activeMode}-${selectedTool?.id}`}
              >
                <section className="flex h-full min-h-0 flex-col overflow-hidden border border-zinc-300 bg-white">
                  <header className="flex min-h-12 shrink-0 items-center gap-3 border-b border-zinc-200 px-3">
                    <button
                      type="button"
                      onClick={() => setSidePanel("none")}
                      className="inline-flex h-8 items-center gap-2 rounded-md border border-zinc-300 px-2.5 text-xs font-semibold text-zinc-700 active:scale-[.97] hover:border-orange-500 hover:text-orange-800"
                    >
                      <X className="size-3.5" />
                      Volver al modelo
                    </button>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-zinc-950">
                        {selectedTool?.label}
                      </h2>
                      <p className="truncate text-[10px] text-zinc-600">
                        {selectedToolMeta.purpose}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSidePanel("catalog")}
                      className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 text-xs font-semibold text-zinc-700 hover:border-orange-500 hover:text-orange-800"
                    >
                      <MoreHorizontal className="size-3.5" />
                      Cambiar tarea
                    </button>
                  </header>
                  <div className="min-h-0 flex-1 overflow-auto [&>section]:h-full">
                    {selectedTool?.content}
                  </div>
                </section>
              </BimRegionBoundary>
            ) : null}
            {!ready ? (
              <div
                className="grid h-full place-items-center border border-zinc-300 bg-white p-8"
                data-bim-empty-state
              >
                <div className="max-w-xl text-center">
                  <span className="mx-auto inline-flex size-12 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
                    {loading ? (
                      <RefreshCw className="size-6 animate-spin motion-reduce:animate-none" />
                    ) : (
                      <Box className="size-6" />
                    )}
                  </span>
                  <h2 className="mt-4 text-base font-semibold text-zinc-950">
                    {loading
                      ? "Preparando el modelo BIM"
                      : "BIM aún no forma parte de este proyecto"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-700">
                    {errorMessage ||
                      "El proyecto puede operar sin BIM. Cuando lo necesites, carga un IFC y GiProy preparará la coordinación 4D/5D sin alterar el presupuesto ni el Gantt vigentes."}
                  </p>
                  {canAdminister && !loading ? (
                    <button
                      type="button"
                      onClick={() => setAdminOpen(true)}
                      className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700"
                    >
                      <Upload className="size-4" />
                      Configurar BIM
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <BimRegionBoundary resetKey={`viewer-${projectId}-${viewerMode}`}>
                <div className="flex h-full min-h-0 flex-col overflow-hidden bg-zinc-100">
                  {!workbenchShown && showStartGuide ? (
                    <section
                      className="shrink-0 border-b border-zinc-300 bg-white px-4 py-3"
                      aria-label="Inicio del trabajo BIM"
                      data-bim-start-guide
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-orange-700">
                            Empieza por aquí
                          </p>
                          <h2 className="mt-0.5 text-sm font-semibold text-zinc-950">
                            Coordina primero la planificación y los costes
                          </h2>
                          <p className="mt-0.5 truncate text-xs text-zinc-600">
                            Vincula presupuesto, Gantt y elementos BIM en este orden para que cada decisión conserve su contexto.
                          </p>
                        </div>
                        <ol className="hidden shrink-0 items-center gap-2 text-[11px] text-zinc-600 2xl:flex" aria-label="Pasos recomendados">
                          <li className="inline-flex items-center gap-1.5 font-semibold text-zinc-900"><span className="grid size-5 place-items-center rounded-full bg-orange-100 text-orange-950">1</span> Presupuesto</li>
                          <ArrowRight className="size-3.5 text-zinc-400" aria-hidden="true" />
                          <li className="inline-flex items-center gap-1.5 font-semibold text-zinc-900"><span className="grid size-5 place-items-center rounded-full bg-orange-100 text-orange-950">2</span> Gantt</li>
                          <ArrowRight className="size-3.5 text-zinc-400" aria-hidden="true" />
                          <li className="inline-flex items-center gap-1.5 font-semibold text-zinc-900"><span className="grid size-5 place-items-center rounded-full bg-orange-100 text-orange-950">3</span> BIM</li>
                        </ol>
                        <button
                          type="button"
                          onClick={beginBimWorkflow}
                          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-orange-600 px-3 text-xs font-semibold text-white transition-[background-color,transform] duration-150 active:scale-[.97] hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                        >
                          Abrir planificación
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowStartGuide(false)}
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                          aria-label="Ocultar guía de inicio"
                          title="Ocultar guía de inicio"
                        >
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </section>
                  ) : null}
                  <div
                    className={
                      workbenchShown
                        ? "pointer-events-none invisible absolute inset-0 flex min-h-0 flex-col [&>section]:flex-1"
                        : "flex min-h-0 flex-1 flex-col [&>section]:flex-1"
                    }
                    aria-hidden={workbenchShown || undefined}
                  >
                    {viewer}
                  </div>
                </div>
              </BimRegionBoundary>
            )}
          </main>
          {contextShown ? (
            <BimRegionBoundary resetKey={`${activeMode}-${selectedTool?.id}`}>
              <BimTaskNavigator
                mode={activeMode}
                modeLabel={MODES.find((mode) => mode.id === activeMode)?.label}
                tools={tools}
                selectedTool={selectedTool}
                onSelectTool={selectTool}
                onClose={() => setSidePanel("none")}
                initialCatalogOpen={sidePanel === "catalog"}
              >
                {selectedTool?.content || inspector}
              </BimTaskNavigator>
            </BimRegionBoundary>
          ) : null}
        </div>
        {planningMode && ready && selectedBottom && !workbenchShown ? (
          <section
            className="relative shrink-0 border-t border-zinc-300 bg-white"
            style={{ height: bottomCollapsed ? 40 : bottomHeight }}
            data-bim-bottom-drawer
          >
            {!bottomCollapsed ? (
              <div
                className="absolute inset-x-0 top-0 z-10 h-1 cursor-row-resize hover:bg-orange-600"
                onPointerDown={(event) =>
                  setResizeStart({ y: event.clientY, height: bottomHeight })
                }
                role="separator"
                aria-label="Redimensionar planificación 4D/5D"
                aria-orientation="horizontal"
              />
            ) : null}
            <div className="flex h-10 items-center justify-between border-b border-zinc-200 px-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-xs font-semibold text-zinc-950">
                  Coordinación presupuesto ↔ Gantt ↔ BIM
                </span>
                <span className="truncate text-[10px] text-zinc-600">
                  {selectedBottom.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setBottomCollapsed((value) => !value)}
                className={iconButtonClass}
                title={
                  bottomCollapsed
                    ? "Expandir cronología"
                    : "Minimizar cronología"
                }
                aria-label={
                  bottomCollapsed
                    ? "Expandir cronología"
                    : "Minimizar cronología"
                }
              >
                <Layers3 className="size-4" />
              </button>
            </div>
            {!bottomCollapsed ? (
              <BimRegionBoundary resetKey={`bottom-${selectedBottom.id}`}>
                <div className="h-[calc(100%-2.5rem)] min-h-0 overflow-hidden p-2 [&>section]:h-full">
                  {selectedBottom.content}
                </div>
              </BimRegionBoundary>
            ) : null}
          </section>
        ) : null}
      </div>

      {adminOpen ? (
        <div
          className="absolute inset-0 z-40 flex flex-col bg-zinc-100"
          role="dialog"
          aria-modal="true"
          aria-label="Administración BIM"
          data-bim-admin-region
        >
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-300 bg-white px-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">
                Administración BIM
              </h2>
              <p className="text-[10px] text-zinc-600">
                Modelos, versiones, federación y calidad
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAdminOpen(false)}
              className={iconButtonClass}
              aria-label="Cerrar administración"
            >
              <X className="size-4" />
            </button>
          </div>
          <div
            className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b border-zinc-300 bg-white px-3"
            role="tablist"
          >
            {(adminTools || []).map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveAdminTool(tool.id)}
                className={`h-8 shrink-0 rounded-md px-3 text-xs font-semibold ${selectedAdmin?.id === tool.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
                role="tab"
                aria-selected={selectedAdmin?.id === tool.id}
              >
                {tool.label}
              </button>
            ))}
          </div>
          <main className="min-h-0 flex-1 overflow-auto p-2 custom-scrollbar">
            {selectedAdmin?.content}
          </main>
        </div>
      ) : null}
    </section>
  );
};

export default BimWorkspaceV2;
