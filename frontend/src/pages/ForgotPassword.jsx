import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LiquidButton } from '../components/ui/liquid-button';
import { motion } from 'framer-motion';
import { publicAuthApi } from '../api/publicAuth';
import LogoGiproyCompleto from '../assets/LogoGiproyCompleto.png';

const MotionDiv = motion.div;

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setIsLoading(true);
        try {
            await publicAuthApi.requestPasswordRecovery(email);
            setMessage("Si el correo está registrado, recibirás un enlace de recuperación en breve.");
        } catch (err) {
            setError(err.response?.data?.detail || "Ocurrió un error al procesar la solicitud.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div data-forgot-password-viewport data-adaptive-ui-enabled="true" className="aurora-construction relative flex h-dvh w-full items-start justify-center overflow-x-hidden overflow-y-auto px-4 py-4 sm:items-center sm:py-6">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#F39200] via-[#E94E1B] to-[#F39200]" />

            <MotionDiv
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[440px] relative z-10"
            >
                <Card data-forgot-password-card className="overflow-hidden rounded-2xl border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                    <CardHeader className="space-y-4 px-5 pb-4 pt-7 text-center sm:space-y-6 sm:px-10 sm:pb-6 sm:pt-10">
                        <div className="flex justify-center">
                            <img src={LogoGiproyCompleto} alt="GIPROY Logo" className="h-12 w-auto object-contain sm:h-16" />
                        </div>
                        <div className="space-y-1">
                            <CardDescription className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                                Recuperación de Acceso • Seguridad
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-7 sm:px-10 sm:pb-10">
                        {message && (
                            <div role="status" aria-live="polite" className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-bold leading-relaxed text-green-800">
                                {message}
                            </div>
                        )}
                        {error && (
                            <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold leading-relaxed text-red-800">
                                {error}
                            </div>
                        )}

                        {!message ? (
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" aria-busy={isLoading}>
                                <div className="space-y-2">
                                    <Label htmlFor="recovery-email" className="ml-1 text-xs font-black uppercase tracking-[0.16em] text-zinc-600">Correo Electrónico</Label>
                                    <Input
                                        id="recovery-email"
                                        type="email"
                                        placeholder="usuario@giproy.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        className="h-14 rounded-xl font-bold px-5"
                                    />
                                </div>
                                <LiquidButton type="submit" data-adaptive-touch-target="true" className="h-14 w-full bg-[#B45309] font-black uppercase text-white hover:bg-[#92400E]" disabled={isLoading}>
                                    {isLoading ? 'Procesando...' : 'Enviar Enlace'}
                                </LiquidButton>
                            </form>
                        ) : (
                            <LiquidButton onClick={() => navigate('/login')} data-adaptive-touch-target="true" className="h-14 w-full bg-[#1A1A1A] font-black uppercase text-white">
                                Volver al Inicio
                            </LiquidButton>
                        )}

                        <div className="mt-6 text-center sm:mt-8">
                            <Link to="/login" data-adaptive-touch-target="true" className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-bold uppercase tracking-wider text-[#9A4D00] transition-colors hover:bg-orange-50 hover:text-[#7C2D12]">
                                ← Volver al Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </MotionDiv>
        </div>
    );
};

export default ForgotPassword;
