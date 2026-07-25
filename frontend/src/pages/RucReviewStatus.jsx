import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { publicAuthApi } from '../api/publicAuth';
import LogoGiproyCompleto from '../assets/LogoGiproyCompleto.png';
import AsyncState from '../components/ui/async-state';

const RucReviewStatus = () => {
    const [params] = useSearchParams();
    const token = params.get('token');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) return setError('El enlace de estado no es válido.');
        publicAuthApi.getRucManualReviewStatus(token).then(setResult).catch(() => setError('No se pudo consultar esta solicitud.'));
    }, [token]);

    return (
        <main data-ruc-review-viewport data-adaptive-ui-enabled="true" className="flex h-dvh items-start justify-center overflow-x-hidden overflow-y-auto bg-[#F2F4F7] p-4 sm:items-center sm:p-6">
            <section data-ruc-review-card className="w-full max-w-lg rounded-2xl bg-white p-5 text-center shadow-xl sm:rounded-3xl sm:p-8">
                <img src={LogoGiproyCompleto} alt="GiProy" className="mx-auto mb-5 h-10 w-auto sm:mb-7 sm:h-12" />
                <AsyncState
                    state={!result && !error ? 'loading' : error || result?.status === 'rejected' ? 'error' : result?.status === 'approved' ? 'success' : 'pending'}
                    title={
                        error ? 'No se pudo consultar la solicitud'
                            : result?.status === 'approved' ? 'Solicitud aprobada'
                                : result?.status === 'rejected' ? 'Solicitud rechazada'
                                    : result ? 'En revisión manual' : 'Consultando solicitud'
                    }
                    description={error || result?.message || 'Estamos consultando el estado de la revisión.'}
                    actionLabel={!result && !error ? undefined : 'Volver al login'}
                    onAction={!result && !error ? undefined : () => navigate('/login')}
                    className="border-0 p-0 shadow-none"
                />
            </section>
        </main>
    );
};

export default RucReviewStatus;
