import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardDescription, CardContent } from '../components/ui/card';
import { LiquidButton } from '../components/ui/liquid-button';
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

    const isSuccess = status === 'success';
    const isLoading = status === 'loading';

    return (
        <div className="min-h-screen w-full flex items-center justify-center aurora-construction px-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#F39200] via-[#E94E1B] to-[#F39200]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[440px] relative z-10"
            >
                <Card className="bg-white border-none shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden">
                    <CardHeader className="space-y-6 text-center pt-12 pb-6 px-10">
                        <div className="flex justify-center">
                            <img src={LogoGiproyCompleto} alt="GIPROY Logo" className="h-16 w-auto object-contain" />
                        </div>
                        <CardDescription className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                            Validación de Empresa
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-12 px-10 text-center space-y-6">
                        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${isSuccess ? 'bg-green-50 text-green-600' : isLoading ? 'bg-orange-50 text-[#F39200]' : 'bg-red-50 text-red-600'}`}>
                            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : isSuccess ? <CheckCircle2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
                        </div>
                        <p className={`text-sm font-bold uppercase tracking-tight ${isSuccess ? 'text-green-700' : isLoading ? 'text-zinc-600' : 'text-red-700'}`}>
                            {message}
                        </p>
                        <LiquidButton onClick={() => navigate('/login')} className="w-full bg-[#1A1A1A] text-white h-14 font-black uppercase">
                            Volver al Login
                        </LiquidButton>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default VerifyRegistration;
