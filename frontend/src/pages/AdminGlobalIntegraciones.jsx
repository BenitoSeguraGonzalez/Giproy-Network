import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { sriRucApi } from '../api/sriRuc';
import { Card, CardContent } from '../components/ui/card';
import { appAlert } from '../utils/appDialog';

const AdminGlobalIntegraciones = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(null);
    const [catalog, setCatalog] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [drafts, setDrafts] = useState({});

    const loadStatus = async () => {
        if (!isSuperadmin) return setLoading(false);
        setLoading(true);
        try {
            const [status, pending] = await Promise.all([sriRucApi.getStatus(), sriRucApi.listManualReviews()]);
            setCatalog(status);
            setReviews(pending);
        } catch {
            await appAlert({ title: 'Catálogo no disponible', message: 'No se pudo consultar el estado del catálogo fiscal SRI.', tone: 'warning' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadStatus(); }, [isSuperadmin]);

    const syncProvince = async (code) => {
        setSyncing(code);
        try {
            await sriRucApi.syncProvince(code);
            await loadStatus();
        } catch (error) {
            await appAlert({ title: 'Sincronización incompleta', message: error.response?.data?.detail || 'No se pudo sincronizar la provincia.', tone: 'warning' });
        } finally {
            setSyncing(null);
        }
    };

    const decideReview = async (review, approved) => {
        const draft = drafts[review.id] || {};
        if (approved && !draft.business_name?.trim()) {
            return appAlert({ title: 'Razón social requerida', message: 'Registra la razón social exactamente como aparece en la verificación oficial.', tone: 'warning' });
        }
        if (!approved && !draft.rejection_reason?.trim()) {
            return appAlert({ title: 'Motivo requerido', message: 'Indica un motivo estructurado antes de rechazar.', tone: 'warning' });
        }
        setSyncing(`review-${review.id}`);
        try {
            await sriRucApi.decideManualReview(review.id, { approved, ...draft });
            await loadStatus();
        } catch (error) {
            await appAlert({ title: 'Decisión no guardada', message: error.response?.data?.detail || 'No se pudo procesar la revisión.', tone: 'warning' });
        } finally {
            setSyncing(null);
        }
    };

    if (!isSuperadmin) return <div className="p-12 text-sm font-bold text-zinc-600">Acceso restringido.</div>;

    return (
        <div className="h-[calc(100vh-theme(spacing.20))] overflow-y-auto bg-[#F2F4F7] p-8 xl:p-12">
            <div className="mx-auto max-w-6xl">
                <button onClick={() => navigate('/admin-global')} className="mb-8 flex items-center gap-2 text-xs font-bold uppercase text-zinc-500 hover:text-[#F39200]">
                    <ArrowLeft className="h-4 w-4" /> Volver a Administración Global
                </button>
                <header className="mb-8">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200]">Fuente fiscal oficial</p>
                    <h1 className="text-4xl font-black uppercase tracking-tight text-[#1A1A1A]">Catálogo RUC SRI</h1>
                    <p className="mt-3 max-w-3xl text-sm text-zinc-600">Las consultas de registro se resuelven en PostgreSQL. Los CSV oficiales solo se usan durante la importación y se eliminan tras una activación correcta.</p>
                </header>
                {loading ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#F39200]" /></div> : (
                    <>
                        <div className="mb-6 grid gap-4 md:grid-cols-3">
                            <Card className="border-none rounded-2xl"><CardContent className="p-6"><Database className="mb-3 h-5 w-5 text-[#F39200]" /><p className="text-3xl font-black">{catalog?.coverage || 0}/24</p><p className="text-xs font-bold uppercase text-zinc-500">Provincias activas</p></CardContent></Card>
                            <Card className="border-none rounded-2xl"><CardContent className="p-6"><ShieldCheck className="mb-3 h-5 w-5 text-emerald-600" /><p className="text-3xl font-black">{catalog?.pending_manual_reviews || 0}</p><p className="text-xs font-bold uppercase text-zinc-500">En revisión manual</p></CardContent></Card>
                            <Card className="border-none rounded-2xl"><CardContent className="p-6"><RefreshCw className="mb-3 h-5 w-5 text-blue-600" /><p className="text-sm font-black">Actualización diaria 02:15</p><p className="mt-1 text-xs text-zinc-500">Hora Ecuador · checksum completo mensual</p></CardContent></Card>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {(catalog?.provinces || []).map((province) => (
                                <div key={province.province_code} className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div><p className="text-[10px] font-black text-zinc-400">{province.province_code}</p><h2 className="font-black text-zinc-900">{province.province_name}</h2></div>
                                        <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${province.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>{province.status}</span>
                                    </div>
                                    <p className="mt-3 text-xs text-zinc-500">{Number(province.accepted_count || 0).toLocaleString()} RUC consolidados</p>
                                    <button type="button" onClick={() => syncProvince(province.province_code)} disabled={Boolean(syncing)} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-[10px] font-black uppercase text-zinc-600 disabled:opacity-50">
                                        <RefreshCw className={`h-3.5 w-3.5 ${syncing === province.province_code ? 'animate-spin' : ''}`} /> Sincronizar
                                    </button>
                                </div>
                            ))}
                        </div>
                        {reviews.length > 0 && (
                            <section className="mt-8">
                                <h2 className="mb-4 text-lg font-black uppercase text-zinc-900">En revisión manual</h2>
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
                                            <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                                                <div className="text-xs text-zinc-600">
                                                    <p className="font-mono font-black text-zinc-900">{review.ruc}</p>
                                                    <p className="mt-1">{review.email}</p>
                                                    <p className="mt-3 text-[10px] font-black uppercase text-zinc-400">Código certificado</p>
                                                    <p className="mt-1 break-all font-mono font-bold">{review.certificate_code}</p>
                                                </div>
                                                <div className="grid gap-3 md:grid-cols-2">
                                                    <input placeholder="Razón social verificada" value={drafts[review.id]?.business_name || ''} onChange={(event) => setDrafts((current) => ({ ...current, [review.id]: { ...current[review.id], business_name: event.target.value } }))} className="h-10 rounded-lg border border-zinc-200 px-3 text-xs" />
                                                    <input placeholder="Estado contribuyente" value={drafts[review.id]?.taxpayer_status || ''} onChange={(event) => setDrafts((current) => ({ ...current, [review.id]: { ...current[review.id], taxpayer_status: event.target.value } }))} className="h-10 rounded-lg border border-zinc-200 px-3 text-xs" />
                                                    <input placeholder="Motivo de rechazo" value={drafts[review.id]?.rejection_reason || ''} onChange={(event) => setDrafts((current) => ({ ...current, [review.id]: { ...current[review.id], rejection_reason: event.target.value } }))} className="h-10 rounded-lg border border-zinc-200 px-3 text-xs md:col-span-2" />
                                                    <div className="flex gap-2 md:col-span-2">
                                                        <button type="button" onClick={() => decideReview(review, true)} disabled={Boolean(syncing)} className="h-9 rounded-lg bg-emerald-700 px-4 text-[10px] font-black uppercase text-white disabled:opacity-50">Aprobar</button>
                                                        <button type="button" onClick={() => decideReview(review, false)} disabled={Boolean(syncing)} className="h-9 rounded-lg bg-red-700 px-4 text-[10px] font-black uppercase text-white disabled:opacity-50">Rechazar</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminGlobalIntegraciones;
