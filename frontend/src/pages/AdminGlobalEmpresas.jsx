import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Download, Loader2, Power, RefreshCw, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { empresasApi } from '../api/empresas';
import { companyBackupsApi } from '../api/companyBackups';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { appAlert, appConfirm } from '../utils/appDialog';
import { getCompanyDisplayName } from '../utils/companyDisplayName';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { includesNormalized } from '../utils/normalizeSearch';

const resolveEmpresaStatus = (empresa) => {
    if (empresa.lifecycle_status === 'baja_purgada') {
        return { label: 'Baja purgada', tone: 'text-zinc-500', buttonDisabled: false };
    }
    if (empresa.registration_status === 'pending_email_verification') {
        return { label: 'Pendiente validación', tone: 'text-amber-700', buttonDisabled: true };
    }
    if (empresa.registration_status === 'pending_email_expired') {
        return { label: 'Validación expirada', tone: 'text-red-500', buttonDisabled: false };
    }
    if (empresa.activa) {
        return { label: 'Activa', tone: 'text-emerald-600', buttonDisabled: false };
    }
    return { label: 'Suspendida', tone: 'text-red-500', buttonDisabled: false };
};

const STATUS_FILTERS = [
    ['all', 'Todos'],
    ['active', 'Activas'],
    ['suspended', 'Suspendidas'],
    ['offboarded', 'Baja'],
    ['pending_email_verification', 'Pendientes'],
    ['pending_email_expired', 'Expiradas'],
];

const AdminGlobalEmpresas = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const [empresas, setEmpresas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [offboardingCompany, setOffboardingCompany] = useState(null);
    const [offboardingPreflight, setOffboardingPreflight] = useState(null);
    const [offboardingFile, setOffboardingFile] = useState(null);
    const [offboardingConfirm, setOffboardingConfirm] = useState('');
    const [recoveryCompany, setRecoveryCompany] = useState(null);
    const [recoveryFile, setRecoveryFile] = useState(null);
    const [recoveryPreflight, setRecoveryPreflight] = useState(null);
    const [recoveryConfirm, setRecoveryConfirm] = useState('');
    const [backupBusy, setBackupBusy] = useState(false);

    const loadEmpresas = useCallback(async () => {
        if (!isSuperadmin) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await empresasApi.getAll();
            setEmpresas(Array.isArray(data) ? data : []);
        } catch {
            appAlert('No se pudieron cargar las empresas SaaS.');
        } finally {
            setLoading(false);
        }
    }, [isSuperadmin]);

    useEffect(() => {
        loadEmpresas();
    }, [loadEmpresas]);

    const filteredEmpresas = useMemo(() => (
        empresas.filter((empresa) => {
            const status = resolveEmpresaStatus(empresa);
            const matchesSearch = includesNormalized(
                `${empresa.nombre || ''} ${empresa.alias || ''} ${empresa.ruc || ''} ${empresa.codigo || ''} ${empresa.registration_status || ''} ${status.label}`,
                searchTerm,
            );
            if (!matchesSearch) return false;
            if (statusFilter === 'all') return true;
            if (statusFilter === 'active') return empresa.registration_status === 'active' || (empresa.activa && !empresa.registration_status);
            if (statusFilter === 'suspended') return status.label === 'Suspendida';
            if (statusFilter === 'offboarded') return empresa.lifecycle_status === 'baja_purgada';
            if (statusFilter === 'pending_email_verification') return empresa.registration_status === 'pending_email_verification';
            if (statusFilter === 'pending_email_expired') return empresa.registration_status === 'pending_email_expired';
            return true;
        })
    ), [empresas, searchTerm, statusFilter]);

    const statusCounts = useMemo(() => empresas.reduce((acc, empresa) => {
        const status = resolveEmpresaStatus(empresa);
        acc.all += 1;
        if (empresa.registration_status === 'pending_email_verification') {
            acc.pending_email_verification += 1;
        } else if (empresa.registration_status === 'pending_email_expired') {
            acc.pending_email_expired += 1;
        } else if (empresa.registration_status === 'active' || (empresa.activa && !empresa.registration_status)) {
            acc.active += 1;
        } else if (empresa.lifecycle_status === 'baja_purgada') {
            acc.offboarded += 1;
        } else if (status.label === 'Suspendida') {
            acc.suspended += 1;
        }
        return acc;
    }, {
        all: 0,
        active: 0,
        suspended: 0,
        offboarded: 0,
        pending_email_verification: 0,
        pending_email_expired: 0,
    }), [empresas]);

    const toggleEmpresa = async (empresa) => {
        if (empresa.lifecycle_status === 'baja_purgada') {
            appAlert('La empresa esta dada de baja y purgada. Debe recuperar una copia validada antes de activarla.');
            return;
        }
        if (empresa.activa) {
            const firstConfirm = await appConfirm({
                title: 'Suspender empresa',
                message: `Vas a suspender ${getCompanyDisplayName(empresa)}. La empresa quedara sin acceso operativo. ¿Deseas continuar?`,
                confirmText: 'Continuar',
                cancelText: 'Cancelar',
                tone: 'warning',
            });
            if (!firstConfirm) return;

            const secondConfirm = await appConfirm({
                title: 'Confirmacion final',
                message: 'Confirma nuevamente la suspension. Esta accion afecta el acceso de todos los usuarios de la empresa.',
                confirmText: 'Suspender empresa',
                cancelText: 'Cancelar',
                tone: 'danger',
            });
            if (!secondConfirm) return;
        }

        setUpdatingId(empresa.id);
        try {
            await empresasApi.update(empresa.id, { activa: !empresa.activa });
            await loadEmpresas();
        } catch {
            appAlert('No se pudo cambiar el estado de la empresa.');
        } finally {
            setUpdatingId(null);
        }
    };

    const errorMessage = (error, fallback) => (
        error?.response?.data?.detail?.message
        || error?.response?.data?.detail
        || fallback
    );

    const downloadBackup = async (empresa) => {
        setBackupBusy(true);
        try {
            const result = await companyBackupsApi.exportBackup({ empresa_id: empresa.id });
            const url = URL.createObjectURL(result.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = result.filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            appAlert(errorMessage(error, 'No se pudo generar la copia de seguridad.'));
        } finally {
            setBackupBusy(false);
        }
    };

    const openOffboarding = async (empresa) => {
        setOffboardingCompany(empresa);
        setOffboardingPreflight(null);
        setOffboardingFile(null);
        setOffboardingConfirm('');
        setBackupBusy(true);
        try {
            const data = await companyBackupsApi.preflightOffboarding({ empresa_id: empresa.id });
            setOffboardingPreflight(data);
        } catch (error) {
            appAlert(errorMessage(error, 'No se pudo preparar la baja purgada.'));
            setOffboardingCompany(null);
        } finally {
            setBackupBusy(false);
        }
    };

    const executeOffboarding = async () => {
        if (!offboardingCompany || !offboardingFile) {
            appAlert('Carga la copia descargada antes de confirmar la baja purgada.');
            return;
        }
        setBackupBusy(true);
        try {
            await companyBackupsApi.executeOffboarding({
                empresa_id: offboardingCompany.id,
                file: offboardingFile,
                confirm_phrase: offboardingConfirm,
            });
            setOffboardingCompany(null);
            await loadEmpresas();
        } catch (error) {
            appAlert(errorMessage(error, 'No se pudo ejecutar la baja purgada.'));
        } finally {
            setBackupBusy(false);
        }
    };

    const openRecovery = (empresa) => {
        setRecoveryCompany(empresa);
        setRecoveryFile(null);
        setRecoveryPreflight(null);
        setRecoveryConfirm('');
    };

    const validateRecovery = async (file = recoveryFile) => {
        if (!recoveryCompany || !file) return;
        setBackupBusy(true);
        try {
            const data = await companyBackupsApi.preflightRestore({ empresa_id: recoveryCompany.id, file });
            setRecoveryPreflight(data);
        } catch (error) {
            setRecoveryPreflight(null);
            appAlert(errorMessage(error, 'No se pudo validar la copia.'));
        } finally {
            setBackupBusy(false);
        }
    };

    const executeRecovery = async () => {
        if (!recoveryCompany || !recoveryFile) return;
        setBackupBusy(true);
        try {
            await companyBackupsApi.executeRestore({
                empresa_id: recoveryCompany.id,
                file: recoveryFile,
                confirm_phrase: recoveryConfirm,
            });
            setRecoveryCompany(null);
            await loadEmpresas();
        } catch (error) {
            appAlert(errorMessage(error, 'No se pudo recuperar la empresa.'));
        } finally {
            setBackupBusy(false);
        }
    };

    if (!isSuperadmin) {
        return (
            <div className="h-full min-h-0 bg-[#F2F4F7] p-12">
                <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                <Card className="max-w-4xl border-none rounded-[2rem] shadow-sm">
                    <CardContent className="p-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 mb-4">Acceso restringido</p>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900">Empresas SaaS</h1>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-full min-h-0 bg-[#F2F4F7] overflow-y-auto p-8 xl:p-12 custom-scrollbar">
            <div className="mx-auto max-w-7xl">
                <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver a Administración Global
                </button>

                <header className="mb-8 flex flex-col gap-5">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200] mb-4">SaaS / Superadministrador</p>
                        <h1 className="text-4xl font-black tracking-tight text-[#1A1A1A] uppercase">Empresas SaaS</h1>
                        <p className="mt-4 max-w-3xl text-sm text-zinc-600 leading-relaxed">
                            Gestión centralizada de personas jurídicas de plataforma. Esta superficie vive solo en Administración Global.
                        </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-zinc-200 bg-white/90 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className="relative min-w-0 xl:w-[360px]">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                <Input
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Buscar empresa..."
                                    className="h-11 w-full rounded-2xl border-zinc-200 bg-zinc-50 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest text-zinc-700 placeholder:text-zinc-400 focus:bg-white"
                                />
                            </div>

                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 xl:justify-center">
                                {STATUS_FILTERS.map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setStatusFilter(value)}
                                        className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition ${statusFilter === value ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-zinc-500 hover:bg-orange-50 hover:text-[#F39200]'}`}
                                    >
                                        <span>{label}</span>
                                        <span className={`rounded-full px-1.5 py-0.5 text-[8px] leading-none ${statusFilter === value ? 'bg-white/15 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                                            {statusCounts[value] || 0}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={loadEmpresas}
                                disabled={loading}
                                title="Actualizar empresas"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition hover:border-orange-200 hover:text-[#F39200] disabled:opacity-60 xl:shrink-0"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Actualizar</span>
                            </button>
                        </div>
                    </div>
                </header>

                <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] bg-white">
                    <CardContent className="p-6 xl:p-8">
                        {loading ? (
                            <div className="flex h-80 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-[#F39200]" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                                {filteredEmpresas.map((empresa) => (
                                    <div key={empresa.id} className={`rounded-[1.75rem] border bg-zinc-50/70 p-6 ${empresa.registration_status === 'pending_email_verification' ? 'border-amber-200' : 'border-zinc-200'}`}>
                                        {(() => {
                                            const status = resolveEmpresaStatus(empresa);
                                            return (
                                        <div className="flex items-start justify-between gap-5">
                                            <div className="flex min-w-0 items-center gap-5">
                                                <div className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-2 bg-white p-1 ${empresa.activa ? 'border-orange-100' : 'border-zinc-200 grayscale'}`}>
                                                    {empresa.logo_url ? (
                                                        <img src={resolveMediaUrl(empresa.logo_url)} alt={empresa.nombre} className="h-full w-full rounded-2xl object-contain" />
                                                    ) : (
                                                        <Building2 className="h-7 w-7 text-zinc-300" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h2 className="truncate text-sm font-black uppercase tracking-tight text-zinc-900">{getCompanyDisplayName(empresa)}</h2>
                                                    {empresa.alias ? <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-widest text-zinc-400">Legal: {empresa.nombre}</p> : null}
                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{empresa.ruc || 'SIN RUC'}</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${status.tone}`}>
                                                            {status.label}
                                                        </span>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${empresa.marketplace_can_sell ? 'text-amber-600' : 'text-zinc-400'}`}>
                                                            {empresa.marketplace_can_sell ? 'Vende' : 'Venta bloqueada'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 flex-wrap justify-end gap-2">
                                                {empresa.lifecycle_status === 'baja_purgada' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openRecovery(empresa)}
                                                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-[9px] font-black uppercase tracking-widest text-[#136191] transition hover:bg-blue-100"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                        Recuperar
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={updatingId === empresa.id || status.buttonDisabled}
                                                            onClick={() => toggleEmpresa(empresa)}
                                                            className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-[9px] font-black uppercase tracking-widest transition disabled:opacity-60 ${empresa.activa ? 'border-red-100 bg-white text-zinc-500 hover:text-red-500' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                                                        >
                                                            {updatingId === empresa.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                                                            {status.buttonDisabled ? 'Pendiente' : empresa.activa ? 'Suspender' : 'Activar'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={backupBusy || status.buttonDisabled}
                                                            onClick={() => openOffboarding(empresa)}
                                                            className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-[9px] font-black uppercase tracking-widest text-zinc-500 transition hover:border-red-200 hover:text-red-500 disabled:opacity-60"
                                                            title="Baja purgada con copia validada"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Baja
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                            );
                                        })()}

                                        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-zinc-200 pt-5">
                                            <div>
                                                <p className="text-xs font-black text-zinc-900">{empresa.total_usuarios || 0}</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Colaboradores</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-zinc-900">{empresa.total_administradores || 0}</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Admins</p>
                                            </div>
                                            <div>
                                                <p className="truncate text-xs font-black text-zinc-900">{empresa.codigo || '-'}</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Código</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {!filteredEmpresas.length ? (
                                    <div className="col-span-full rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center">
                                        <p className="text-sm font-black uppercase tracking-widest text-zinc-400">No hay empresas que coincidan con la búsqueda.</p>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            {offboardingCompany ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-6">
                    <div className="w-full max-w-2xl rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-red-500">Baja purgada</p>
                                <h2 className="mt-1 text-lg font-black uppercase tracking-tight text-zinc-950">{getCompanyDisplayName(offboardingCompany)}</h2>
                            </div>
                            <button type="button" onClick={() => setOffboardingCompany(null)} className="rounded-xl border border-zinc-200 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">Cerrar</button>
                        </div>
                        <div className="mt-4 grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-3">
                            <div>
                                <p className="text-xs font-black text-zinc-900">{offboardingPreflight?.counts?.proyectos_total || 0}</p>
                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Proyectos</p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-zinc-900">{offboardingPreflight?.file_references?.length || 0}</p>
                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Archivos</p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-zinc-900">{offboardingPreflight?.purge_counts?.usuarios_deletable || 0}</p>
                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Usuarios purgables</p>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" disabled={backupBusy || !offboardingPreflight?.exportable} onClick={() => downloadBackup(offboardingCompany)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1A1A1A] px-4 text-[9px] font-black uppercase tracking-widest text-white disabled:opacity-60">
                                <Download className="h-4 w-4" /> Descargar backup
                            </button>
                            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                                <Upload className="h-4 w-4" /> Cargar copia
                                <input type="file" accept=".giproybackup,application/vnd.giproy.company-backup" className="hidden" onChange={(event) => setOffboardingFile(event.target.files?.[0] || null)} />
                            </label>
                            {offboardingFile ? <span className="inline-flex h-10 items-center rounded-xl bg-emerald-50 px-3 text-[9px] font-black uppercase tracking-widest text-emerald-700">{offboardingFile.name}</span> : null}
                        </div>
                        <input
                            value={offboardingConfirm}
                            onChange={(event) => setOffboardingConfirm(event.target.value)}
                            placeholder="CONFIRMO BAJA PURGADA"
                            className="mt-4 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-zinc-700 outline-none focus:border-red-200"
                        />
                        <button type="button" disabled={backupBusy || !offboardingFile || offboardingConfirm !== 'CONFIRMO BAJA PURGADA'} onClick={executeOffboarding} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50">
                            {backupBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Ejecutar baja purgada
                        </button>
                    </div>
                </div>
            ) : null}
            {recoveryCompany ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-6">
                    <div className="w-full max-w-2xl rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#136191]">Recuperacion SaaS</p>
                                <h2 className="mt-1 text-lg font-black uppercase tracking-tight text-zinc-950">{getCompanyDisplayName(recoveryCompany)}</h2>
                            </div>
                            <button type="button" onClick={() => setRecoveryCompany(null)} className="rounded-xl border border-zinc-200 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">Cerrar</button>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-[9px] font-black uppercase tracking-widest text-[#136191]">
                                <Upload className="h-4 w-4" /> Cargar backup
                                <input
                                    type="file"
                                    accept=".giproybackup,application/vnd.giproy.company-backup"
                                    className="hidden"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0] || null;
                                        setRecoveryFile(file);
                                        setRecoveryPreflight(null);
                                        if (file) validateRecovery(file);
                                    }}
                                />
                            </label>
                            {recoveryFile ? <span className="inline-flex h-10 items-center rounded-xl bg-zinc-50 px-3 text-[9px] font-black uppercase tracking-widest text-zinc-600">{recoveryFile.name}</span> : null}
                        </div>
                        {recoveryPreflight ? (
                            <div className={`mt-4 rounded-2xl border p-4 ${recoveryPreflight.restorable ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${recoveryPreflight.restorable ? 'text-emerald-700' : 'text-red-600'}`}>
                                    {recoveryPreflight.restorable ? 'Copia validada' : 'Copia bloqueada'}
                                </p>
                                <p className="mt-2 text-xs font-bold text-zinc-600">Identificador fiscal: {recoveryPreflight.fiscal_identity_match ? 'coincide' : 'no coincide'}</p>
                                {recoveryPreflight.blockers?.length ? <p className="mt-2 text-xs font-bold text-red-600">{recoveryPreflight.blockers[0]}</p> : null}
                            </div>
                        ) : null}
                        <input
                            value={recoveryConfirm}
                            onChange={(event) => setRecoveryConfirm(event.target.value)}
                            placeholder="CONFIRMO IMPORTACION"
                            className="mt-4 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-zinc-700 outline-none focus:border-blue-200"
                        />
                        <button type="button" disabled={backupBusy || !recoveryPreflight?.restorable || recoveryConfirm !== 'CONFIRMO IMPORTACION'} onClick={executeRecovery} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#136191] px-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50">
                            {backupBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Restaurar empresa
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default AdminGlobalEmpresas;
