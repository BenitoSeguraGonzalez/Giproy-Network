import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LiquidButton } from '../components/ui/liquid-button';
import { motion } from 'framer-motion';
import { publicAuthApi } from '../api/publicAuth';
import LogoGiproyCompleto from '../assets/LogoGiproyCompleto.png';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        setIsLoading(true);
        try {
            await publicAuthApi.resetPassword({ token, newPassword: password });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.detail || "Token inválido o expirado.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div data-reset-password-viewport data-adaptive-ui-enabled="true" className="aurora-construction relative flex h-dvh w-full items-start justify-center overflow-x-hidden overflow-y-auto px-4 py-4 sm:items-center sm:py-6">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#F39200] via-[#E94E1B] to-[#F39200]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[440px] relative z-10"
            >
                <Card data-reset-password-card className="overflow-hidden rounded-2xl border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                    <CardHeader className="space-y-4 px-5 pb-4 pt-7 text-center sm:space-y-6 sm:px-10 sm:pb-6 sm:pt-10">
                        <div className="flex justify-center">
                            <img src={LogoGiproyCompleto} alt="GIPROY Logo" className="h-12 w-auto object-contain sm:h-16" />
                        </div>
                        <div className="space-y-1">
                            <CardDescription className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                                Nueva Clave de Seguridad
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-7 sm:px-10 sm:pb-10">
                        {success ? (
                            <div className="space-y-6">
                                <div role="status" aria-live="polite" className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm font-bold text-green-800">
                                    Contraseña actualizada correctamente.
                                </div>
                                <LiquidButton onClick={() => navigate('/login')} data-adaptive-touch-target="true" className="h-14 w-full bg-[#1A1A1A] font-black uppercase text-white">
                                    Iniciar Sesión
                                </LiquidButton>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" aria-busy={isLoading}>
                                {!token && (
                                    <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm font-bold leading-relaxed text-amber-900">
                                        El enlace no contiene un token válido. Solicita un nuevo enlace de recuperación.
                                    </div>
                                )}
                                {error && (
                                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm font-bold leading-relaxed text-red-800">
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="new-password" className="ml-1 text-xs font-black uppercase tracking-[0.16em] text-zinc-600">Nueva Contraseña</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        className="h-14 rounded-xl font-bold px-5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-new-password" className="ml-1 text-xs font-black uppercase tracking-[0.16em] text-zinc-600">Confirmar Contraseña</Label>
                                    <Input
                                        id="confirm-new-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        className="h-14 rounded-xl font-bold px-5"
                                    />
                                </div>
                                <LiquidButton type="submit" data-adaptive-touch-target="true" className="mt-4 h-14 w-full bg-[#B45309] font-black uppercase text-white hover:bg-[#92400E]" disabled={isLoading || !token}>
                                    {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                                </LiquidButton>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
