import React, { useEffect, useState } from 'react';
import { Bookmark, Check, Copy, Pencil, RefreshCcw, Save, Trash2, X } from 'lucide-react';

const formatDateTime = (value) => {
    if (!value) {
        return 'N/D';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return 'N/D';
    }

    return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(parsed);
};

const buildViewStateSummary = (state) => {
    const payload = state?.payload || {};
    return [
        payload.active_version_id ? `Versión ${payload.active_version_id}` : null,
        payload.storey_name ? `Nivel ${payload.storey_name}` : null,
        payload.element_id ? `Elemento ${payload.element_id}` : null,
        payload.link_id ? `Vínculo ${payload.link_id}` : null,
    ].filter(Boolean);
};

const BimViewStateToolbar = ({
    viewStates,
    loading,
    activeViewStateId,
    canCreateCompanyScope,
    canManageCompanyViews,
    onRefresh,
    onApplyViewState,
    onSaveViewState,
    onRenameViewState,
    onDuplicateViewState,
    onDeleteViewState,
    saving,
    renamingViewStateId,
    duplicatingViewStateId,
    deletingViewStateId,
}) => {
    const [draftName, setDraftName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [renamingStateId, setRenamingStateId] = useState(null);
    const [draftScope, setDraftScope] = useState('personal');
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredViewStates = viewStates.filter((state) => {
        const matchesScope = activeFilter === 'all' ? true : state.scope === activeFilter;
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const matchesSearch = normalizedSearch ? (state.nombre || '').toLowerCase().includes(normalizedSearch) : true;
        return matchesScope && matchesSearch;
    });

    const hasSearch = searchTerm.trim().length > 0;
    const companyVisibleCount = filteredViewStates.filter((state) => state.scope === 'company').length;
    const personalVisibleCount = filteredViewStates.filter((state) => state.scope !== 'company').length;

    useEffect(() => {
        if (activeFilter === 'all' && !hasSearch) {
            return;
        }
    }, [activeFilter, hasSearch]);

    useEffect(() => {
        if (isEditingName) {
            return;
        }
        const activeViewState = viewStates.find((state) => state.id === activeViewStateId) || null;
        const newDraftScope = activeViewState?.scope === 'company' ? 'company' : 'personal';
        setDraftName(activeViewState?.nombre || '');
        setDraftScope(newDraftScope);
    }, [activeViewStateId, isEditingName, viewStates]);

    const handleStartSave = () => {
        const activeViewState = viewStates.find((state) => state.id === activeViewStateId) || null;
        setDraftName(activeViewState?.nombre || draftName);
        setDraftScope(activeViewState?.scope === 'company' && canCreateCompanyScope ? 'company' : 'personal');
        setIsEditingName(true);
    };

    const handleCancelSave = () => {
        setIsEditingName(false);
        const activeViewState = viewStates.find((state) => state.id === activeViewStateId) || null;
        setDraftName(activeViewState?.nombre || '');
        setDraftScope(activeViewState?.scope === 'company' ? 'company' : 'personal');
    };

    const handleConfirmSave = () => {
        const normalizedName = draftName.trim();
        if (!normalizedName) {
            return;
        }
        onSaveViewState(normalizedName, draftScope);
        setIsEditingName(false);
    };

    const handleStartRename = (state) => {
        setRenamingStateId(state.id);
        setDraftName(state.nombre || '');
    };

    const handleCancelRename = () => {
        setRenamingStateId(null);
        const activeViewState = viewStates.find((state) => state.id === activeViewStateId) || null;
        setDraftName(activeViewState?.nombre || '');
    };

    const handleConfirmRename = (state) => {
        const normalizedName = draftName.trim();
        if (!normalizedName) {
            return;
        }
        onRenameViewState(state, normalizedName);
        setRenamingStateId(null);
    };

    return (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-[#F39200]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Vistas guardadas</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleStartSave}
                        disabled={saving}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-50"
                        title="Guardar vista BIM actual"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? 'Guardando' : 'Guardar'}
                    </button>
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-[#F39200] hover:text-[#F39200]"
                        title="Refrescar vistas BIM"
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </button>
                </div>
            </div>
            {isEditingName ? (
                <div className="mb-3 rounded-xl border border-orange-200 bg-white px-3 py-3">
                    <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                        Nombre de la vista BIM
                    </label>
                    <input
                        type="text"
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                handleConfirmSave();
                            }
                            if (event.key === 'Escape') {
                                event.preventDefault();
                                handleCancelSave();
                            }
                        }}
                        placeholder="Ej. Coordinación nivel 1"
                        className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 outline-none transition-colors focus:border-[#F39200]"
                        autoFocus
                    />
                    <div className="mt-3 flex items-center gap-2">
                        {canCreateCompanyScope ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setDraftScope('personal')}
                                    className={`inline-flex h-8 items-center rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                        draftScope === 'personal'
                                            ? 'border-orange-200 bg-orange-50 text-[#F39200]'
                                            : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                                    }`}
                                >
                                    Personal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDraftScope('company')}
                                    className={`inline-flex h-8 items-center rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                        draftScope === 'company'
                                            ? 'border-orange-200 bg-orange-50 text-[#F39200]'
                                            : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                                    }`}
                                >
                                    Compartida
                                </button>
                            </>
                        ) : null}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleConfirmSave}
                            disabled={saving || !draftName.trim()}
                            className="inline-flex h-9 items-center rounded-xl bg-[#F39200] px-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? 'Guardando' : 'Confirmar'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancelSave}
                            disabled={saving}
                            className="inline-flex h-9 items-center rounded-xl border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : null}
            {loading ? (
                <p className="text-sm text-zinc-500">Consultando vistas BIM...</p>
            ) : viewStates.length === 0 ? (
                <p className="text-sm text-zinc-500">Todavía no existen vistas persistidas para este usuario y proyecto.</p>
            ) : (
                <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveFilter('all')}
                            className={`inline-flex h-8 items-center rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                activeFilter === 'all'
                                    ? 'border-orange-200 bg-orange-50 text-[#F39200]'
                                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                            }`}
                        >
                            Todas
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveFilter('personal')}
                            className={`inline-flex h-8 items-center rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                activeFilter === 'personal'
                                    ? 'border-orange-200 bg-orange-50 text-[#F39200]'
                                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                            }`}
                        >
                            Personales
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveFilter('company')}
                            className={`inline-flex h-8 items-center rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                activeFilter === 'company'
                                    ? 'border-orange-200 bg-orange-50 text-[#F39200]'
                                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                            }`}
                        >
                            Compartidas
                        </button>
                    </div>
                    <div className="mb-3">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Buscar vista BIM por nombre"
                            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition-colors focus:border-[#F39200]"
                        />
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                        <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-600">
                            Visibles: {filteredViewStates.length}
                        </span>
                        <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-600">
                            Personales: {personalVisibleCount}
                        </span>
                        <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-600">
                            Compartidas: {companyVisibleCount}
                        </span>
                    </div>
                    {filteredViewStates.length === 0 ? (
                        <p className="text-sm text-zinc-500">
                            {hasSearch
                                ? 'No hay vistas BIM que coincidan con la búsqueda actual.'
                                : 'No hay vistas BIM para el filtro seleccionado.'}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {filteredViewStates.map((state) => (
                        <div
                            key={state.id}
                            className={`rounded-xl border px-3 py-2 ${
                                activeViewStateId === state.id
                                    ? 'border-orange-300 bg-orange-50/70'
                                    : 'border-zinc-200 bg-white'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    {renamingStateId === state.id ? (
                                        <input
                                            type="text"
                                            value={draftName}
                                            onChange={(event) => setDraftName(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault();
                                                    handleConfirmRename(state);
                                                }
                                                if (event.key === 'Escape') {
                                                    event.preventDefault();
                                                    handleCancelRename();
                                                }
                                            }}
                                            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition-colors focus:border-[#F39200]"
                                            autoFocus
                                        />
                                    ) : (
                                        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-800">
                                            {state.nombre}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-zinc-500">
                                        {state.scope === 'company' ? 'Compartida por empresa' : 'Personal'}
                                    </p>
                                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                                        Creada {formatDateTime(state.fecha_creacion)}
                                    </p>
                                    {state.fecha_actualizacion ? (
                                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                                            Actualizada {formatDateTime(state.fecha_actualizacion)}
                                        </p>
                                    ) : null}
                                    {buildViewStateSummary(state).length > 0 ? (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {buildViewStateSummary(state).map((item) => (
                                                <span
                                                    key={`${state.id}-${item}`}
                                                    className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500"
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-[10px] text-zinc-400">Sin contexto técnico persistido adicional.</p>
                                    )}
                                </div>
                                {activeViewStateId === state.id ? (
                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-orange-200 bg-white text-[#F39200]">
                                        <Check className="h-4 w-4" />
                                    </span>
                                ) : null}
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                {renamingStateId === state.id ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleConfirmRename(state)}
                                            disabled={renamingViewStateId === state.id || !draftName.trim()}
                                            className="inline-flex h-8 items-center rounded-lg bg-[#F39200] px-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {renamingViewStateId === state.id ? 'Guardando' : 'Renombrar'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancelRename}
                                            disabled={renamingViewStateId === state.id}
                                            className="inline-flex h-8 items-center rounded-lg border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <X className="mr-1 h-3.5 w-3.5" />
                                            Cancelar
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => onApplyViewState(state)}
                                            className="inline-flex h-8 items-center rounded-lg border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200]"
                                        >
                                            Aplicar
                                        </button>
                                        {state.scope !== 'company' || canManageCompanyViews ? (
                                            <button
                                                type="button"
                                                onClick={() => handleStartRename(state)}
                                                className="inline-flex h-8 items-center rounded-lg border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200]"
                                            >
                                                <Pencil className="mr-1 h-3.5 w-3.5" />
                                                Renombrar
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => onDuplicateViewState(state)}
                                            disabled={duplicatingViewStateId === state.id}
                                            className="inline-flex h-8 items-center rounded-lg border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Copy className="mr-1 h-3.5 w-3.5" />
                                            {duplicatingViewStateId === state.id ? 'Duplicando' : 'Duplicar'}
                                        </button>
                                        {state.scope !== 'company' || canManageCompanyViews ? (
                                            <button
                                                type="button"
                                                onClick={() => onDeleteViewState(state)}
                                                disabled={deletingViewStateId === state.id}
                                                className="inline-flex h-8 items-center rounded-lg border border-rose-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.18em] text-rose-500 transition-colors hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                {deletingViewStateId === state.id ? 'Eliminando' : 'Eliminar'}
                                            </button>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BimViewStateToolbar;
