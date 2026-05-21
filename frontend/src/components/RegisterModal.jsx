import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { LiquidButton } from './ui/liquid-button';
import { APP_MODAL_CLOSE_BUTTON_CLASS } from './ui/app-modal';
import api from '../api/axiosConfig';
import PersonnelFormFields from './PersonnelFormFields';
import LogoGiproyCompleto from '../assets/LogoGiproyCompleto.png';
import { formatInternationalPhone, isValidPhone, resolveCountryPhonePrefix } from '../utils/phoneFormatter';

const MotionDiv = motion.div;

const RegisterModal = ({ isOpen, onClose, onRegisterSuccess }) => {
    const [formData, setFormData] = useState({
        nombre_completo: '',
        email: '',
        password: '',
        confirmPassword: '',
        // Campos extendidos
        ruc: '', nombres: '', apellidos: '', alias: '', nacionalidad: '', profesion: '', ciudad: '', provincia: '', canton: '', pais: '', movil: '',
        acepta_politica_privacidad: false, acepta_politicas_comunicacion: false, autoriza_publicidad: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState(1); // 1: Form, 2: Success
    const [paises, setPaises] = useState([]);

    useEffect(() => {
        if (isOpen) {
            const fetchPaises = async () => {
                try {
                    const response = await api.get('/paises/');
                    setPaises(response.data);
                } catch (err) {
                    console.error('Error fetching paises:', err);
                }
            };
            fetchPaises();
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (!formData.acepta_politica_privacidad) {
            setError("Debe aceptar la política de privacidad");
            return;
        }

        setIsLoading(true);
        try {
            // Eliminar confirmPassword antes de enviar al backend
            const { confirmPassword: _, ...submitData } = formData;
            if (submitData.movil) {
                if (!isValidPhone(submitData.movil)) {
                    setError("El móvil debe tener un formato válido");
                    setIsLoading(false);
                    return;
                }
                submitData.movil = formatInternationalPhone(submitData.movil, resolveCountryPhonePrefix(submitData.pais));
            }
            const response = await api.post('/register', submitData);

            setStep(2);
            // Small delay before logging in automatically or notifying parent
            setTimeout(() => {
                onRegisterSuccess(response.data.access_token);
            }, 2000);

        } catch (err) {
            console.error("Registration error:", err);
            let errorMessage = "Error al crear la cuenta. Intente de nuevo.";

            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                if (typeof detail === 'string') {
                    errorMessage = detail;
                } else if (Array.isArray(detail)) {
                    // Manejar errores de validación de FastAPI (Pydantic)
                    errorMessage = detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(' | ');
                } else if (typeof detail === 'object') {
                    errorMessage = JSON.stringify(detail);
                }
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
                <MotionDiv
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative"
                >
                    {/* Header naranja */}
                    <div className="h-1.5 bg-gradient-to-r from-[#F39200] via-[#E94E1B] to-[#F39200]" />

                    <button
                        onClick={onClose}
                        className={`${APP_MODAL_CLOSE_BUTTON_CLASS} absolute right-6 top-6 z-10`}
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="p-10">
                        {step === 1 ? (
                            <>
                                <div className="text-center mb-8 flex flex-col items-center">
                                    <img src={LogoGiproyCompleto} alt="GIPROY Logo" className="h-12 w-auto object-contain mb-4" />
                                    <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900 leading-none italic">Registro de Cuenta</h2>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-3 italic">GIPROY NETWORK SYSTEM V3.0</p>
                                </div>

                                {error && (
                                    <MotionDiv
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-2xl flex items-center gap-4"
                                    >
                                        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                                        <p className="text-xs font-black text-red-700 uppercase tracking-tight">{error}</p>
                                    </MotionDiv>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                                        <PersonnelFormFields
                                            formData={formData}
                                            setFormData={setFormData}
                                            paises={paises}
                                        />

                                        <div className="mt-8 pt-8 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="confirmPassword" name="password" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1 italic">Confirmar Contraseña</Label>
                                                <Input
                                                    id="confirmPassword"
                                                    type="password"
                                                    required
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    className="h-12 rounded-xl bg-zinc-50 border-zinc-200"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <LiquidButton
                                            type="submit"
                                            className="w-full bg-[#F39200] hover:bg-[#E94E1B] text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-xl shadow-orange-500/10 active:scale-[0.98] transition-all text-sm"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'PROCESANDO REGISTRO...' : 'CREAR MI CUENTA AHORA'}
                                        </LiquidButton>
                                    </div>

                                    <p className="text-[10px] text-center text-zinc-400 font-bold uppercase tracking-tighter leading-relaxed px-4">
                                        Al registrarte, se creará una cuenta personal con 1 año de validez y una empresa exclusiva para tu gestión bajo el modelo SaaS.
                                    </p>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <MotionDiv
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 text-green-500 mb-6"
                                >
                                    <CheckCircle2 className="w-10 h-10" />
                                </MotionDiv>
                                <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900">¡Cuenta Creada!</h2>
                                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mt-2 px-8">
                                    Bienvenido a la red GIPROY. Iniciando sesión automáticamente...
                                </p>
                            </div>
                        )}
                    </div>
                </MotionDiv>
            </div>
        </AnimatePresence>
    );
};

export default RegisterModal;
