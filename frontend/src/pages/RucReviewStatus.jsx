import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock3, Loader2, ShieldCheck } from 'lucide-react';
import { publicAuthApi } from '../api/publicAuth';
import LogoGiproyCompleto from '../assets/LogoGiproyCompleto.png';

const RucReviewStatus = () => {
    const [params] = useSearchParams();
    const token = params.get('token');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) return setError('El enlace de estado no es válido.');
        publicAuthApi.getRucManualReviewStatus(token).then(setResult).catch(() => setError('No se pudo consultar esta solicitud.'));
    }, [token]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#F2F4F7] p-6">
            <section className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl">
                <img src={LogoGiproyCompleto} alt="GiProy" className="mx-auto mb-8 h-12 w-auto" />
                {!result && !error && <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#F39200]" />}
                {error && <p className="text-sm font-bold text-red-700">{error}</p>}
                {result && (
                    <>
                        {result.status === 'approved' ? <ShieldCheck className="mx-auto h-12 w-12 text-emerald-600" /> : <Clock3 className="mx-auto h-12 w-12 text-amber-600" />}
                        <h1 className="mt-5 text-2xl font-black uppercase text-zinc-900">{result.status === 'pending' ? 'En revisión manual' : result.status}</h1>
                        <p className="mt-3 text-sm leading-relaxed text-zinc-600">{result.message}</p>
                    </>
                )}
            </section>
        </main>
    );
};

export default RucReviewStatus;
