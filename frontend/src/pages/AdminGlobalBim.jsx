import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Blocks, Building2, ShieldCheck, Wrench } from 'lucide-react';

import adminBimApi from '../api/adminBim';
import { AuthContext } from '../context/AuthContext';
import { appAlert } from '../utils/appDialog';

const EMPTY_FORM = {
    titulo: 'Activación BIM',
    descripcion: 'Controla desde la interfaz si el módulo BIM debe quedar disponible para superadministración.',
    is_enabled: false,
    superadmin_only: true,
    allowed_company_ids: '',
};

const parseCompanies = (raw) =>
    (raw || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const AdminGlobalBim = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);
    const [formState, setFormState] = useState(EMPTY_FORM);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const data = await adminBimApi.getConfig();
            setStatus(data);
            setFormState({
                titulo: data.titulo || EMPTY_FORM.titulo,
                descripcion: data.descripcion || EMPTY_FORM.descripcion,
                is_enabled: Boolean(data.is_enabled),
                superadmin_only: data.superadmin_only !== false,
                allowed_company_ids: data.allowed_company_ids || '',
            });
        } catch (error) {
            globalThis.reportClientError?.('Error cargando configuración BIM:', error);
            await appAlert({
                title: 'No se pudo cargar la activación BIM',
                message: error.response?.data?.detail || 'Revise la migración y la conectividad del backend.',
                tone: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isSuperadmin) return;
        loadConfig();
    }, [isSuperadmin]);

    const handleChange = (field, value) => {
        setFormState((current) => ({ ...current, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                titulo: formState.titulo.trim(),
                descripcion: formState.descripcion.trim(),
                is_enabled: Boolean(formState.is_enabled),
                superadmin_only: Boolean(formState.superadmin_only),
                allowed_company_ids: formState.allowed_company_ids.trim(),
            };
            const data = await adminBimApi.updateConfig(payload);
            setStatus(data);
            await loadConfig();
        } catch (error) {
            globalThis.reportClientError?.('Error guardando configuración BIM:', error);
            await appAlert({
                title: 'No se pudo guardar la activación BIM',
                message: error.response?.data?.detail || 'Revise la configuración e inténtelo de nuevo.',
                tone: 'danger',
            });
        } finally {
            setSaving(false);
        }
    };

    if (!isSuperadmin) {
        return (
            <div className="h-full min-h-0 bg-[#F2F4F7] p-12">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full min-h-0 flex flex-col bg-[#F2F4F7]">
            <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="w-full max-w-[1500px] mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver a Administración Global
                    </button>

                    <header className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200] mb-4">Control de activación</p>
                            <h1 className="text-4xl font-black tracking-tight text-[#1A1A1A] sm:text-5xl uppercase">Módulo BIM</h1>
                            <p className="mt-4 max-w-4xl text-sm text-zinc-600 leading-relaxed">
                                Esta consola permite a <span className="font-black uppercase">Superadministrador</span> habilitar o apagar la entrada BIM desde la interfaz, sin depender del archivo `.env`.
                            </p>
                        </div>
                    </header>

                    {loading ? (
                        <div className="rounded-[2rem] border border-zinc-200 bg-white p-10 text-sm font-semibold text-zinc-500">
                            Cargando configuración BIM...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
                            <section className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden">
                                <div className="border-b border-zinc-200 px-6 py-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Configuración activa</p>
                                    <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-zinc-900">Puerta BIM</h2>
                                </div>

                                <div className="p-6 space-y-5">
                                    <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={formState.is_enabled}
                                            onChange={(event) => handleChange('is_enabled', event.target.checked)}
                                            className="w-4 h-4 accent-[#F39200]"
                                        />
                                        <span className="text-sm font-black uppercase tracking-[0.14em] text-zinc-700">BIM habilitado en interfaz</span>
                                    </label>

                                    <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={formState.superadmin_only}
                                            onChange={(event) => handleChange('superadmin_only', event.target.checked)}
                                            className="w-4 h-4 accent-[#F39200]"
                                        />
                                        <span className="text-sm font-black uppercase tracking-[0.14em] text-zinc-700">Solo superadministrador</span>
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Título</span>
                                            <input
                                                type="text"
                                                value={formState.titulo}
                                                onChange={(event) => handleChange('titulo', event.target.value)}
                                                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#F39200]"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Empresas permitidas</span>
                                            <input
                                                type="text"
                                                value={formState.allowed_company_ids}
                                                onChange={(event) => handleChange('allowed_company_ids', event.target.value)}
                                                placeholder="Ej: 1,3,8"
                                                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#F39200]"
                                            />
                                        </label>
                                    </div>

                                    <label className="space-y-2 block">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Descripción</span>
                                        <textarea
                                            value={formState.descripcion}
                                            onChange={(event) => handleChange('descripcion', event.target.value)}
                                            rows={4}
                                            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none transition-colors focus:border-[#F39200] resize-none"
                                        />
                                    </label>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-[#1A1A1A] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white hover:bg-zinc-800 transition-colors disabled:opacity-60"
                                        >
                                            <Wrench className="w-4 h-4" />
                                            {saving ? 'Guardando...' : 'Guardar activación BIM'}
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className={`rounded-[2rem] border px-6 py-6 ${status?.is_enabled ? 'border-orange-200 bg-orange-50 text-[#F39200]' : 'border-zinc-200 bg-white text-zinc-700'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl border border-current/20 bg-white/60 flex items-center justify-center">
                                            <Blocks className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Estado vigente</p>
                                            <h3 className="text-2xl font-black uppercase tracking-tight">{status?.is_enabled ? 'BIM visible para el acceso permitido' : 'BIM oculto en interfaz'}</h3>
                                            <p className="mt-2 text-sm font-medium leading-relaxed opacity-90">
                                                {status?.descripcion || 'Sin descripción operativa.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] p-6 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl border border-orange-200 bg-orange-50 flex items-center justify-center">
                                            <ShieldCheck className="w-5 h-5 text-[#F39200]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Ámbito</p>
                                            <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">Regla de acceso</h3>
                                        </div>
                                    </div>
                                    <div className="space-y-3 text-sm text-zinc-600">
                                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                            <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Modo</p>
                                            <p className="font-semibold text-zinc-700">{status?.superadmin_only ? 'Solo superadministrador' : 'Acceso más amplio permitido'}</p>
                                        </div>
                                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                            <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Empresas</p>
                                            <p className="font-semibold text-zinc-700">
                                                {parseCompanies(status?.allowed_company_ids).length > 0
                                                    ? parseCompanies(status?.allowed_company_ids).join(', ')
                                                    : 'Todas las empresas activas del superadministrador'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[2rem] border border-blue-100 bg-blue-50/70 px-5 py-4 text-sm text-zinc-700 leading-relaxed">
                                    <div className="flex items-start gap-3">
                                        <Building2 className="w-5 h-5 text-[#136191] mt-0.5 shrink-0" />
                                        <p>
                                            Cuando BIM esté habilitado, abre <span className="font-black uppercase">Proyectos</span>, entra a un proyecto y usa la pestaña <span className="font-black uppercase">BIM</span> en la barra lateral.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminGlobalBim;
