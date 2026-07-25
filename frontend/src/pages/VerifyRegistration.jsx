import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardDescription, CardContent } from '../components/ui/card';
import AsyncState from '../components/ui/async-state';
import { motion } from 'framer-motion';
import { publicAuthApi } from '../api/publicAuth';
import LogoGiproyCompleto from '../assets/LogoGiproyCompleto.png';

const VerifyRegistration = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Validando el email de administrador...');
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        const verify = async () => {
            if (!token) {
                setStatus('error');
                setMessage('El enlace de validación no contiene token.');
                return;
            }
            try {
                const data = await publicAuthApi.verifyRegistration(token);
                if (!mounted) return;
                setStatus('success');
                setMessage(data.message || 'Email validado correctamente. Ya puedes iniciar sesión.');
            } catch (err) {
                if (!mounted) return;
                setStatus('error');
                setMessage(err.response?.data?.detail || 'Token de validación inválido o expirado.');
            }
        };
        verify();
        return () => {
            mounted = false;
        };
    }, [token]);

    return (
        <div data-verify-registration-viewport data-adaptive-ui-enabled="true" className="aurora-construction relative flex h-dvh w-full items-start justify-center overflow-x-hidden overflow-y-auto px-4 py-4 sm:items-center sm:py-6">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#F39200] via-[#E94E1B] to-[#F39200]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[440px] relative z-10"
            >
                <Card data-verify-registration-card className="overflow-hidden rounded-2xl border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                    <CardHeader className="space-y-4 px-5 pb-4 pt-7 text-center sm:space-y-6 sm:px-10 sm:pb-6 sm:pt-10">
                        <div className="flex justify-center">
                            <img src={LogoGiproyCompleto} alt="GIPROY Logo" className="h-12 w-auto object-contain sm:h-16" />
                        </div>
                        <CardDescription className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                            Validación de Empresa
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-5 pb-7 sm:px-10 sm:pb-10">
                        <AsyncState
                            state={status === 'success' ? 'success' : status === 'loading' ? 'loading' : 'error'}
                            title={status === 'success' ? 'Registro verificado' : status === 'loading' ? 'Verificando registro' : 'No se pudo verificar el registro'}
                            description={message}
                            actionLabel={status === 'loading' ? undefined : 'Volver al login'}
                            onAction={status === 'loading' ? undefined : () => navigate('/login')}
                            className="border-0 p-0 shadow-none"
                        />
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default VerifyRegistration;
