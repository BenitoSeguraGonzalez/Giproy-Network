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
                        <div className="space-y-1">
                            <CardDescription className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                                Nueva Clave de Seguridad
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="pb-12 px-10">
                        {success ? (
                            <div className="space-y-6">
                                <div className="p-4 text-xs font-bold bg-green-50 text-green-700 border-l-4 border-green-500 rounded text-center">
                                    Contraseña actualizada correctamente.
                                </div>
                                <LiquidButton onClick={() => navigate('/login')} className="w-full bg-[#1A1A1A] text-white h-14 font-black uppercase">
                                    Iniciar Sesión
                                </LiquidButton>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="p-4 text-xs font-bold bg-red-50 text-red-700 border-l-4 border-red-500 rounded text-center">
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400 ml-1">Nueva Contraseña</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        className="h-14 rounded-xl font-bold px-5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400 ml-1">Confirmar Contraseña</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        className="h-14 rounded-xl font-bold px-5"
                                    />
                                </div>
                                <LiquidButton type="submit" className="w-full bg-[#F39200] hover:bg-[#E94E1B] text-white h-14 font-black uppercase mt-4" disabled={isLoading || !token}>
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
