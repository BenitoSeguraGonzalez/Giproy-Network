import { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { LiquidButton } from '../components/ui/liquid-button';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;
import { Eye, EyeOff, UserPlus, ArrowLeft, Building2, ChevronRight, CheckCircle2 } from 'lucide-react';
import LogoGiproyCompleto from '../assets/LogoGiproyCompleto.png';
import RegisterModal from '../components/RegisterModal';
import { appAlert } from '../utils/appDialog';
import { publicAuthApi } from '../api/publicAuth';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { getCompanyDisplayName } from '../utils/companyDisplayName';
import { APP_VERSION_LABEL } from '../config/appVersion';

const Login = () => {
    const [step, setStep] = useState('email'); // 'email', 'selection', 'password'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('register') === '1' && params.get('ruc_verification_token')) {
            setIsRegisterOpen(true);
        }
    }, []);
    
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);

    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const savedEmail = localStorage.getItem('giproy_remembered_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }

        const redirectMessage = sessionStorage.getItem('giproy_auth_redirect_message');
        if (redirectMessage) {
            setError(redirectMessage);
            sessionStorage.removeItem('giproy_auth_redirect_message');
        }
    }, []);

    useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const foundAccounts = await publicAuthApi.getAccountsByEmail(email.toLowerCase());

            if (foundAccounts.length === 0) {
                setError("No se encontró ninguna cuenta con este correo electrónico.");
            } else if (foundAccounts.length === 1) {
                setSelectedAccount(foundAccounts[0]);
                setStep('password');
            } else {
                setAccounts(foundAccounts);
                setStep('selection');
            }
        } catch (err) {
            setError("Error al verificar la cuenta. Intente más tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const loginData = await login(email.toLowerCase(), password, selectedAccount?.empresa_id);
            if (rememberMe) {
                localStorage.setItem('giproy_remembered_email', email);
            } else {
                localStorage.removeItem('giproy_remembered_email');
            }
            if (loginData?.login_notice) {
                await appAlert({
                    title: loginData.login_notice.title,
                    message: loginData.login_notice.message,
                });
            }
            navigate('/');
        } catch (err) {
            globalThis.reportClientError?.("Login component error:", err);
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string' ? detail : (Array.isArray(detail) ? JSON.stringify(detail) : "Clave incorrecta. Por favor, verifique sus credenciales.");
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSuccess = (token) => {
        localStorage.setItem('giproy_token', token);
        setIsRegisterOpen(false);
        window.location.href = '/'; // Recarga completa para asegurar contexto limpio
    };

    const renderEmailStep = () => (
        <MotionDiv
            key="email-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 sm:space-y-6"
        >
            <form onSubmit={handleEmailSubmit} className="space-y-4 sm:space-y-6" aria-busy={isLoading}>
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400 ml-1">Terminal de Acceso / Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="ID@GIPROY.COM"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoFocus
                        className="bg-zinc-50 border-zinc-200 focus:border-[#F39200] focus:ring-0 text-[#1A1A1A] placeholder:text-zinc-300 h-14 rounded-xl font-bold transition-all text-sm uppercase tracking-wider px-5"
                    />
                </div>

                <div className="flex items-center space-x-2 py-2">
                    <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={setRememberMe}
                        className="border-zinc-300 data-[state=checked]:bg-[#B45309] data-[state=checked]:border-[#B45309] h-5 w-5 rounded-md"
                    />
                    <Label
                        htmlFor="remember"
                        className="text-[11px] font-bold uppercase tracking-tight text-zinc-500 cursor-pointer hover:text-[#1A1A1A] transition-colors"
                    >
                        Recordar credenciales en este terminal
                    </Label>
                </div>

                <LiquidButton
                    type="submit"
                    data-adaptive-touch-target="true"
                    className="w-full mt-4 bg-[#1A1A1A] hover:bg-[#333] text-white font-black uppercase tracking-[0.2em] h-14 shadow-lg shadow-zinc-500/10 active:scale-[0.98] transition-all rounded-xl text-xs flex items-center justify-center gap-2"
                    disabled={isLoading}
                >
                    {isLoading ? 'Verificando...' : (
                        <>
                            Continuar <ChevronRight className="w-4 h-4" />
                        </>
                    )}
                </LiquidButton>
            </form>
        </MotionDiv>
    );

    const renderSelectionStep = () => (
        <MotionDiv
            key="selection-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 sm:space-y-6"
        >
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <button type="button" onClick={() => setStep('email')} data-adaptive-touch-target="true" aria-label="Volver al correo" className="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">Seleccione su Empresa</Label>
                </div>
                
                <div className="max-h-[min(17.5rem,45dvh)] space-y-3 overflow-y-auto overscroll-contain pr-2 custom-scrollbar [touch-action:pan-y]" role="region" aria-label="Empresas disponibles" tabIndex={0}>
                    {accounts.map((acc) => (
                        <button
                            key={acc.empresa_id}
                            onClick={() => {
                                if (acc.activo) {
                                    setSelectedAccount(acc);
                                    setStep('password');
                                }
                            }}
                            disabled={!acc.activo}
                            data-adaptive-touch-target="true"
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                !acc.activo 
                                ? 'opacity-50 grayscale bg-zinc-50 border-zinc-100 cursor-not-allowed' 
                                : 'bg-white border-zinc-100 hover:border-orange-200 hover:bg-orange-50/30'
                            }`}
                        >
                            <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {acc.empresa_logo ? (
                                    <img src={resolveMediaUrl(acc.empresa_logo)} alt="" className="w-full h-full object-contain p-1" />
                                ) : (
                                    <Building2 className="w-5 h-5 text-zinc-300" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black uppercase text-[#1A1A1A] truncate">{getCompanyDisplayName(acc)}</p>
                                <p className={`text-[11px] font-bold uppercase tracking-wider ${acc.activo ? 'text-zinc-600' : 'text-red-700'}`}>
                                    {acc.activo ? 'Cuenta Activa' : 'Cuenta Suspendida'}
                                </p>
                            </div>
                            {acc.activo && <ChevronRight className="w-4 h-4 text-zinc-300" />}
                        </button>
                    ))}
                </div>
            </div>
        </MotionDiv>
    );

    const renderPasswordStep = () => (
        <MotionDiv
            key="password-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 sm:space-y-6"
        >
            <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-6" aria-busy={isLoading}>
                <div className="flex items-center justify-between gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-zinc-200 shadow-sm">
                             {selectedAccount?.empresa_logo ? (
                                <img src={resolveMediaUrl(selectedAccount.empresa_logo)} alt="" className="w-full h-full object-contain p-1" />
                            ) : (
                                <Building2 className="w-4 h-4 text-zinc-300" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-[#1A1A1A] leading-tight truncate max-w-[140px]">{getCompanyDisplayName(selectedAccount)}</span>
                            <span className="text-[8px] font-bold text-zinc-400 truncate max-w-[140px]">{email}</span>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={() => setStep(accounts.length > 1 ? 'selection' : 'email')} 
                        data-adaptive-touch-target="true"
                        className="min-h-11 rounded-lg px-2 text-xs font-black uppercase tracking-wider text-[#9A4D00] hover:bg-orange-50 hover:underline"
                    >
                        Cambiar
                    </button>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password" className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400 ml-1">Clave de Seguridad</Label>
                    <div className="relative group">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoFocus
                            className="bg-zinc-50 border-zinc-200 focus:border-[#F39200] focus:ring-0 text-[#1A1A1A] placeholder:text-zinc-300 h-14 rounded-xl font-bold transition-all text-sm px-5 pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            data-adaptive-touch-target="true"
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <LiquidButton
                    type="submit"
                    data-adaptive-touch-target="true"
                    className="mt-4 flex h-14 w-full items-center justify-center rounded-xl bg-[#B45309] text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-orange-900/10 transition-colors hover:bg-[#92400E]"
                    disabled={isLoading}
                >
                    {isLoading ? 'Autenticando...' : 'Acceder al Sistema'}
                </LiquidButton>
            </form>
        </MotionDiv>
    );

    return (
        <div data-login-viewport data-adaptive-ui-enabled="true" className="aurora-construction relative flex h-dvh w-full items-start justify-center overflow-x-hidden overflow-y-auto px-4 py-4 sm:items-center sm:py-6">
            {/* Detalle superior naranja */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#F39200] via-[#E94E1B] to-[#F39200]" />

            <MotionDiv
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 w-full max-w-[440px]"
            >
                <Card data-login-card className="bg-white border-none shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-2xl overflow-hidden">
                    <CardHeader className="space-y-4 px-5 pb-4 pt-7 text-center sm:space-y-6 sm:px-10 sm:pb-6 sm:pt-10">
                        <MotionDiv
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex justify-center"
                        >
                            <img
                                src={LogoGiproyCompleto}
                                alt="GIPROY Logo"
                                className="h-12 w-auto object-contain sm:h-16"
                            />
                        </MotionDiv>
                        <div className="space-y-1">
                            <CardDescription className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                                Sistema de Gestión • Construcción
                            </CardDescription>
                            <p data-app-version className="pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                GiProy Network {APP_VERSION_LABEL}
                            </p>
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-7 pt-2 sm:px-10 sm:pb-10">
                        <AnimatePresence mode="wait">
                            {error && (
                                <MotionDiv
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    role="alert"
                                    className="mb-6 rounded-lg border border-red-800 bg-[#B91C1C] p-3 text-center text-xs font-black uppercase leading-relaxed tracking-wider text-white shadow-md"
                                >
                                    {error}
                                </MotionDiv>
                            )}

                            {step === 'email' && renderEmailStep()}
                            {step === 'selection' && renderSelectionStep()}
                            {step === 'password' && renderPasswordStep()}
                        </AnimatePresence>

                        {step === 'email' && (
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:mt-8">
                                <Link to="/forgot-password" data-adaptive-touch-target="true" className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-black uppercase tracking-wider text-[#9A4D00] transition-colors hover:bg-orange-50 hover:text-[#7C2D12]">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                                <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                                <button
                                    type="button"
                                    onClick={() => setIsRegisterOpen(true)}
                                    data-adaptive-touch-target="true"
                                    className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-black uppercase tracking-wider text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-[#9A4D00]"
                                >
                                    <UserPlus className="w-3 h-3" />
                                    Crear Cuenta
                                </button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div data-login-footer className="mt-4 flex flex-col items-center gap-4 pb-2 sm:mt-6">
                    <p className="text-center text-[11px] font-bold uppercase leading-relaxed tracking-[0.18em] text-zinc-600">
                        Authorized Environment<br />
                        © 2026 GIPROY NETWORK<br />
                        Ing. Benito Segura · Ing. Santiago Bermeo
                    </p>
                </div>
            </MotionDiv>

            <RegisterModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                onRegisterSuccess={handleRegisterSuccess}
            />
        </div>
    );
};

export default Login;
