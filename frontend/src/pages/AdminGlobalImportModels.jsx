import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Check,
    Copy,
    FileCog,
    FileSearch,
    Plus,
    Power,
    Save,
    UploadCloud,
    X
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import adminImportModelsApi from '../api/adminImportModels';

const emptyProfile = {
    id: '',
    name: '',
    version: '1',
    status: 'draft',
    priority: 10,
    description: '',
    document_kinds: [],
    detection: { parser_profiles: [], required_sections: [], keywords: [], min_confidence: 'media' },
    hooks: {
        budget: { start_markers: [], row_strategy: 'auto_detected', match_strategy: 'codigo' },
        apu: { start_markers: [], end_markers: [], resource_sections: [] },
        resources: { rendimiento_categories: ['equipo', 'mano_obra'], unit_price_tolerance: '0.02' },
    },
    matching: {
        budget_to_apu: 'codigo',
        fallback: 'empty_apu_from_budget',
        duplicate_policy: 'first_compatible_else_block',
    },
    validation: {
        empty_apus_allowed_with_warning: true,
        blocking_duplicate_apu_composition: true,
        economic_tolerance: '0.02',
    },
    ui: { accent: 'blue', editable_by_superadmin: true },
};

const statusTone = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    draft: 'border-orange-200 bg-orange-50 text-[#F39200]',
    inactive: 'border-zinc-200 bg-zinc-100 text-zinc-500',
};

const cloneProfile = (profile) => JSON.parse(JSON.stringify(profile || emptyProfile));

const markerPath = (profile, section, key) => {
    if (section === 'detection') return profile.detection?.[key] || [];
    if (section === 'document') return profile.document_kinds || [];
    return profile.hooks?.[section]?.[key] || [];
};

const ChipEditor = ({ label, values, onAdd, onRemove, placeholder }) => {
    const [draft, setDraft] = useState('');

    const submit = () => {
        const value = draft.trim();
        if (!value) return;
        onAdd(value);
        setDraft('');
    };

    return (
        <div className="rounded-[1.5rem] border border-zinc-200 bg-white px-4 py-4">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400">{label}</p>
            <div className="mt-3 flex flex-wrap gap-2">
                {values.length === 0 ? (
                    <span className="rounded-full border border-dashed border-zinc-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300">
                        Sin marcadores
                    </span>
                ) : values.map((value) => (
                    <span key={value} className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#136191]">
                        {value}
                        <button type="button" onClick={() => onRemove(value)} className="text-[#136191] hover:text-red-500">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </span>
                ))}
            </div>
            <div className="mt-3 flex gap-2">
                <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            submit();
                        }
                    }}
                    placeholder={placeholder}
                    className="min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-800 outline-none focus:border-[#F39200]"
                />
                <button type="button" onClick={submit} className="h-12 w-12 rounded-2xl border border-orange-200 bg-orange-50 text-[#F39200] flex items-center justify-center hover:bg-orange-100">
                    <Plus className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

const Segmented = ({ value, options, onChange }) => (
    <div className="flex flex-wrap gap-2">
        {options.map((option) => (
            <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`rounded-2xl border px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                    value === option.value
                        ? 'border-[#F39200] bg-orange-50 text-[#F39200]'
                        : 'border-zinc-200 bg-white text-zinc-500 hover:border-orange-200'
                }`}
            >
                {option.label}
            </button>
        ))}
    </div>
);

const AdminGlobalImportModels = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const [profiles, setProfiles] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [draft, setDraft] = useState(cloneProfile(emptyProfile));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [sampleFile, setSampleFile] = useState(null);
    const [sampleName, setSampleName] = useState('');
    const [preview, setPreview] = useState(null);

    const activeCount = useMemo(() => profiles.filter((item) => item.status === 'active').length, [profiles]);

    const loadProfiles = async () => {
        setLoading(true);
        try {
            const data = await adminImportModelsApi.list();
            const items = data.items || [];
            setProfiles(items);
            const first = items.find((item) => item.id === selectedId) || items[0];
            if (first) {
                setSelectedId(first.id);
                setDraft(cloneProfile(first));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isSuperadmin) loadProfiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuperadmin]);

    const selectProfile = (profile) => {
        setSelectedId(profile.id);
        setDraft(cloneProfile(profile));
        setMessage('');
    };

    const updateDraft = (path, value) => {
        setDraft((current) => {
            const next = cloneProfile(current);
            let target = next;
            path.slice(0, -1).forEach((key) => {
                target[key] = target[key] || {};
                target = target[key];
            });
            target[path[path.length - 1]] = value;
            return next;
        });
    };

    const addMarker = (section, key, value) => {
        setDraft((current) => {
            const next = cloneProfile(current);
            const list = new Set(markerPath(next, section, key));
            list.add(value);
            if (section === 'detection') next.detection[key] = [...list];
            else if (section === 'document') next.document_kinds = [...list];
            else next.hooks[section][key] = [...list];
            return next;
        });
    };

    const removeMarker = (section, key, value) => {
        setDraft((current) => {
            const next = cloneProfile(current);
            const list = markerPath(next, section, key).filter((item) => item !== value);
            if (section === 'detection') next.detection[key] = list;
            else if (section === 'document') next.document_kinds = list;
            else next.hooks[section][key] = list;
            return next;
        });
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            const saved = await adminImportModelsApi.save(draft.id, draft);
            setMessage('Modelo guardado');
            setSelectedId(saved.id);
            setDraft(cloneProfile(saved));
            await loadProfiles();
        } finally {
            setSaving(false);
        }
    };

    const setStatus = async (status) => {
        const updated = status === 'active'
            ? await adminImportModelsApi.activate(draft.id)
            : status === 'inactive'
                ? await adminImportModelsApi.deactivate(draft.id)
                : await adminImportModelsApi.save(draft.id, { ...draft, status });
        setDraft(cloneProfile(updated));
        setMessage(status === 'active' ? 'Modelo activado' : status === 'inactive' ? 'Modelo desactivado' : 'Modelo en borrador');
        await loadProfiles();
    };

    const cloneCurrent = async () => {
        const cloned = await adminImportModelsApi.clone(draft.id, {
            id: `${draft.id}_copia`,
            name: `${draft.name} copia`,
            status: 'draft',
        });
        setSelectedId(cloned.id);
        setDraft(cloneProfile(cloned));
        setMessage('Copia creada como borrador');
        await loadProfiles();
    };

    const autocreate = async () => {
        if (!sampleFile) return;
        setSaving(true);
        try {
            const data = await adminImportModelsApi.autocreatePreview({ file: sampleFile, desiredName: sampleName });
            setPreview(data);
            setDraft(cloneProfile(data.draft));
            setMessage('Borrador generado desde muestra');
        } finally {
            setSaving(false);
        }
    };

    if (!isSuperadmin) {
        return (
            <div className="h-[calc(100vh-theme(spacing.20))] bg-[#F2F4F7] p-12">
                <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                <div className="bg-white border border-red-100 rounded-[2rem] p-10 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 mb-4">Acceso restringido</p>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900">Modelos de importacion</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-theme(spacing.20))] flex flex-col bg-[#F2F4F7]">
            <main className="flex-1 overflow-y-auto p-8 xl:p-12 custom-scrollbar">
                <div className="w-full max-w-[1600px] mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver a Administración Global
                    </button>

                    <header className="mb-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200] mb-4">Compras publicas clasicas</p>
                            <h1 className="text-4xl font-black tracking-tight text-[#1A1A1A] sm:text-5xl uppercase">Modelos de importacion</h1>
                            <p className="mt-4 max-w-4xl text-sm text-zinc-600 leading-relaxed">
                                Motor declarativo para reconocer formatos SOCE/SERCOP, gobernar hooks de lectura y decidir si una importación puede crear proyecto o exportarse a ventas.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-[1.5rem] border border-zinc-200 bg-white px-5 py-4">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Modelos</p>
                                <p className="mt-2 text-3xl font-black text-zinc-900">{profiles.length}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Activos</p>
                                <p className="mt-2 text-3xl font-black text-emerald-700">{activeCount}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-orange-200 bg-orange-50 px-5 py-4">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F39200]">Alcance</p>
                                <p className="mt-2 text-3xl font-black text-[#F39200]">PDF</p>
                            </div>
                        </div>
                    </header>

                    <section className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
                        <aside className="space-y-4">
                            <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] bg-white">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-11 h-11 rounded-2xl border border-blue-200 bg-blue-50 flex items-center justify-center">
                                            <FileSearch className="w-5 h-5 text-[#136191]" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Registro</p>
                                            <h2 className="font-black uppercase tracking-tight text-zinc-900">Perfiles</h2>
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-h-[52vh] overflow-y-auto custom-scrollbar pr-1">
                                        {loading ? (
                                            <p className="text-sm font-bold text-zinc-400">Cargando...</p>
                                        ) : profiles.map((profile) => (
                                            <button
                                                key={profile.id}
                                                type="button"
                                                onClick={() => selectProfile(profile)}
                                                className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition-colors ${
                                                    selectedId === profile.id ? 'border-orange-200 bg-orange-50/70' : 'border-zinc-200 bg-zinc-50 hover:border-orange-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-sm font-black uppercase tracking-tight text-zinc-900">{profile.name}</p>
                                                    <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.16em] ${statusTone[profile.status] || statusTone.draft}`}>
                                                        {profile.status}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">{profile.id}</p>
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] bg-white">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-11 h-11 rounded-2xl border border-orange-200 bg-orange-50 flex items-center justify-center">
                                            <UploadCloud className="w-5 h-5 text-[#F39200]" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Muestra PDF</p>
                                            <h2 className="font-black uppercase tracking-tight text-zinc-900">Autocrear</h2>
                                        </div>
                                    </div>
                                    <input
                                        value={sampleName}
                                        onChange={(event) => setSampleName(event.target.value)}
                                        placeholder="Nombre del nuevo modelo"
                                        className="mb-3 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#F39200]"
                                    />
                                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 text-sm font-bold text-zinc-600 hover:border-orange-200">
                                        <span className="truncate">{sampleFile?.name || 'Seleccionar PDF de muestra'}</span>
                                        <FileCog className="h-5 w-5 text-[#F39200]" />
                                        <input type="file" accept=".pdf" className="hidden" onChange={(event) => setSampleFile(event.target.files?.[0] || null)} />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={autocreate}
                                        disabled={!sampleFile || saving}
                                        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 text-[10px] font-black uppercase tracking-[0.18em] text-[#F39200] disabled:opacity-40"
                                    >
                                        <FileSearch className="h-4 w-4" /> Analizar modelo
                                    </button>
                                    {preview?.diagnostics?.status && (
                                        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-[#136191]">
                                            Diagnóstico: {preview.diagnostics.status} · {preview.diagnostics.warning_count || 0} avisos
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </aside>

                        <section className="space-y-6">
                            <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] bg-white">
                                <CardContent className="p-6 xl:p-8">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl border border-orange-200 bg-orange-50 flex items-center justify-center">
                                                <FileCog className="w-6 h-6 text-[#F39200]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Editor visual</p>
                                                <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900">{draft.name || 'Modelo nuevo'}</h2>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" onClick={cloneCurrent} disabled={!draft.id} className="h-12 w-12 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500 flex items-center justify-center hover:border-orange-200 hover:text-[#F39200] disabled:opacity-40" title="Duplicar">
                                                <Copy className="h-5 w-5" />
                                            </button>
                                            <button type="button" onClick={() => setStatus(draft.status === 'active' ? 'inactive' : 'active')} disabled={!draft.id} className="h-12 w-12 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500 flex items-center justify-center hover:border-emerald-200 hover:text-emerald-600 disabled:opacity-40" title={draft.status === 'active' ? 'Desactivar' : 'Activar'}>
                                                <Power className="h-5 w-5" />
                                            </button>
                                            <button type="button" onClick={saveProfile} disabled={!draft.id || saving} className="h-12 w-12 rounded-2xl border border-orange-200 bg-orange-50 text-[#F39200] flex items-center justify-center disabled:opacity-40" title="Guardar">
                                                <Save className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {message && (
                                        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                            <Check className="h-4 w-4" /> {message}
                                        </div>
                                    )}

                                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <label className="space-y-2">
                                            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400">Identificador</span>
                                            <input value={draft.id} onChange={(event) => updateDraft(['id'], event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#F39200]" />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400">Nombre</span>
                                            <input value={draft.name} onChange={(event) => updateDraft(['name'], event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#F39200]" />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400">Versión</span>
                                            <input value={draft.version} onChange={(event) => updateDraft(['version'], event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#F39200]" />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400">Prioridad</span>
                                            <input type="number" value={draft.priority} onChange={(event) => updateDraft(['priority'], Number(event.target.value || 0))} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#F39200]" />
                                        </label>
                                    </div>

                                    <div className="mt-5">
                                        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400">Descripción operativa</p>
                                        <textarea value={draft.description} onChange={(event) => updateDraft(['description'], event.target.value)} rows={3} className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#F39200]" />
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                                            <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400">Estado</p>
                                            <Segmented
                                                value={draft.status}
                                                onChange={(value) => updateDraft(['status'], value)}
                                                options={[
                                                    { value: 'active', label: 'Activo' },
                                                    { value: 'draft', label: 'Borrador' },
                                                    { value: 'inactive', label: 'Inactivo' },
                                                ]}
                                            />
                                        </div>
                                        <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                                            <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400">Cruce presupuesto APU</p>
                                            <Segmented
                                                value={draft.matching?.budget_to_apu || 'codigo'}
                                                onChange={(value) => {
                                                    updateDraft(['matching', 'budget_to_apu'], value);
                                                    updateDraft(['hooks', 'budget', 'match_strategy'], value);
                                                }}
                                                options={[
                                                    { value: 'codigo', label: 'Código' },
                                                    { value: 'descripcion_unidad_precio', label: 'Desc Unidad Precio' },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] bg-white">
                                    <CardContent className="p-6 space-y-4">
                                        <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">Detección</h3>
                                        <ChipEditor label="Perfiles parser" values={markerPath(draft, 'detection', 'parser_profiles')} placeholder="soce_sercop_pdf..." onAdd={(value) => addMarker('detection', 'parser_profiles', value)} onRemove={(value) => removeMarker('detection', 'parser_profiles', value)} />
                                        <ChipEditor label="Secciones requeridas" values={markerPath(draft, 'detection', 'required_sections')} placeholder="budget, apus, vae..." onAdd={(value) => addMarker('detection', 'required_sections', value)} onRemove={(value) => removeMarker('detection', 'required_sections', value)} />
                                        <ChipEditor label="Palabras clave" values={markerPath(draft, 'detection', 'keywords')} placeholder="ANALISIS DE PRECIOS..." onAdd={(value) => addMarker('detection', 'keywords', value)} onRemove={(value) => removeMarker('detection', 'keywords', value)} />
                                    </CardContent>
                                </Card>

                                <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] bg-white">
                                    <CardContent className="p-6 space-y-4">
                                        <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">Hooks de lectura</h3>
                                        <ChipEditor label="Inicio presupuesto" values={markerPath(draft, 'budget', 'start_markers')} placeholder="PRESUPUESTO" onAdd={(value) => addMarker('budget', 'start_markers', value)} onRemove={(value) => removeMarker('budget', 'start_markers', value)} />
                                        <ChipEditor label="Inicio APU" values={markerPath(draft, 'apu', 'start_markers')} placeholder="ANALISIS DE PRECIOS UNITARIOS" onAdd={(value) => addMarker('apu', 'start_markers', value)} onRemove={(value) => removeMarker('apu', 'start_markers', value)} />
                                        <ChipEditor label="Fin APU" values={markerPath(draft, 'apu', 'end_markers')} placeholder="TOTAL, COSTO DIRECTO" onAdd={(value) => addMarker('apu', 'end_markers', value)} onRemove={(value) => removeMarker('apu', 'end_markers', value)} />
                                        <ChipEditor label="Secciones recurso" values={markerPath(draft, 'apu', 'resource_sections')} placeholder="EQUIPO, MATERIALES..." onAdd={(value) => addMarker('apu', 'resource_sections', value)} onRemove={(value) => removeMarker('apu', 'resource_sections', value)} />
                                    </CardContent>
                                </Card>
                            </div>
                        </section>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default AdminGlobalImportModels;
