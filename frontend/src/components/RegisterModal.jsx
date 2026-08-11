import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { LiquidButton } from './ui/liquid-button';
import { APP_MODAL_CLOSE_BUTTON_CLASS } from './ui/app-modal';
import { maestrosApi } from '../api/maestros';
import { publicAuthApi } from '../api/publicAuth';
import PersonnelFormFields from './PersonnelFormFields';
import MotionScrollbar from './ui/MotionScrollbar';
import LogoGiproyCompleto from '../assets/LogoGiproyCompleto.png';
import { appAlert } from '../utils/appDialog';
import { formatInternationalPhone, getInternationalPhoneValidationMessage, resolveCountryPhonePrefix } from '../utils/phoneFormatter';
import { validarRucEcuador, requiereValidacionRucEcuador } from '../utils/rucValidator';

const MotionDiv = motion.div;

const REGISTER_REQUIRED_FIELDS = [
    ['email', 'Email (login)'],
    ['password', 'Contraseña'],
    ['confirmPassword', 'Confirmar contraseña'],
    ['ruc', 'Identificación fiscal / documento'],
    ['nombres', 'Nombres'],
    ['apellidos', 'Apellidos'],
    ['nacionalidad', 'Nacionalidad'],
    ['profesion', 'Profesión / cargo'],
    ['pais', 'País'],
    ['provincia', 'Provincia'],
    ['canton', 'Cantón'],
    ['ciudad', 'Ciudad'],
    ['movil', 'Móvil de contacto'],
];

const isBlank = (value) => String(value ?? '').trim().length === 0;

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());

const RegisterModal = ({ isOpen, onClose }) => {
    const formScrollRef = useRef(null);
    const dialogRef = useRef(null);
    const closeButtonRef = useRef(null);
    const [formData, setFormData] = useState({
        nombre_completo: '',
        email: '',
        password: '',
        confirmPassword: '',
        // Campos extendidos
        ruc: '', nombres: '', apellidos: '', alias: '', empresa_alias: '', empresa_nombre: '', nacionalidad: '', profesion: '', ciudad: '', provincia: '', canton: '', pais: '', movil: '',
        acepta_politica_privacidad: false, acepta_politicas_comunicacion: false, autoriza_publicidad: false
        , acepta_terminos: false, terminos_version: null, privacidad_version: null
    });

    useEffect(() => {
        if (!isOpen) return undefined;
        const previouslyFocused = document.activeElement;
        closeButtonRef.current?.focus();
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key !== 'Tab' || !dialogRef.current) return;
            const focusable = [...dialogRef.current.querySelectorAll(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
            )];
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            previouslyFocused?.focus?.();
        };
    }, [isOpen, onClose]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState(1); // 1: Form, 2: Success
    const [rucVerified, setRucVerified] = useState(false);
    const [rucLookup, setRucLookup] = useState(null);
    const [certificateCode, setCertificateCode] = useState('');
    const [manualReviewStatus, setManualReviewStatus] = useState(null);
    const isRucRequired = requiereValidacionRucEcuador(formData.pais);
    const canSubmit = !isLoading
        && !isBlank(formData.email) && isValidEmail(formData.email)
        && !isBlank(formData.password)
        && !isBlank(formData.ruc) && (!isRucRequired || rucVerified)
        && (isRucRequired || !isBlank(formData.empresa_nombre))
        && formData.password === formData.confirmPassword
        && formData.acepta_politica_privacidad
        && formData.acepta_terminos;
    const [paises, setPaises] = useState([]);

    useEffect(() => {
        if (isOpen) {
            const approvedToken = new URLSearchParams(window.location.search).get('ruc_verification_token');
            if (approvedToken) {
                setFormData(prev => ({ ...prev, ruc_verification_token: approvedToken }));
            }
            const fetchPaises = async () => {
                try {
                    const data = await maestrosApi.getPaises();
                    setPaises(Array.isArray(data) ? data : []);
                } catch {
                    setPaises([]);
                }
            };
            fetchPaises();

            publicAuthApi.getLegalManifest()
                .then((manifest) => setFormData(prev => ({
                    ...prev,
                    terminos_version: manifest.terms.version,
                    privacidad_version: manifest.privacy.version,
                })))
                .catch(() => setError('No se pudo verificar la versión de los documentos legales. Intente nuevamente.'));

        }
    }, [isOpen]);

    const handleManualReview = async () => {
        setError(null);
        if (!isValidEmail(formData.email) || certificateCode.trim().length < 4) {
            setError('Indica el correo del registro y el código del certificado del SRI.');
            return;
        }
        setIsLoading(true);
        try {
            const result = await publicAuthApi.requestRucManualReview({
                ruc: formData.ruc,
                email: formData.email,
                certificate_code: certificateCode.trim(),
            });
            setManualReviewStatus(result.message || 'En revisión manual.');
        } catch (err) {
            setError(err.response?.data?.detail || 'No se pudo registrar la solicitud de revisión.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const missingFields = REGISTER_REQUIRED_FIELDS
            .filter(([key]) => isBlank(formData[key]))
            .map(([, label]) => label);
        if (!requiereValidacionRucEcuador(formData.pais) && isBlank(formData.empresa_nombre)) {
            missingFields.push('Razón social / nombre legal');
        }

        if (missingFields.length > 0) {
            await appAlert({
                title: 'Datos incompletos',
                message: `Completa todos los datos obligatorios antes de crear la empresa. Falta: ${missingFields.join(', ')}. Los alias de usuario y empresa son opcionales.`,
                tone: 'warning',
                size: 'wide',
            });
            return;
        }

        if (!isValidEmail(formData.email)) {
            await appAlert({
                title: 'Email inválido',
                message: 'El campo Email (login) debe contener una dirección de correo válida.',
                tone: 'warning',
            });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            await appAlert({
                title: 'Credenciales no coinciden',
                message: 'La contraseña y su confirmación deben ser iguales.',
                tone: 'warning',
            });
            return;
        }

        if (!formData.acepta_politica_privacidad) {
            await appAlert({
                title: 'Política requerida',
                message: 'Debe aceptar la política de privacidad para crear la empresa y su usuario administrador.',
                tone: 'warning',
            });
            return;
        }
        if (!formData.acepta_terminos) {
            await appAlert({
                title: 'Términos requeridos',
                message: 'Debe aceptar los Términos y Condiciones vigentes para crear la cuenta.',
                tone: 'warning',
            });
            return;
        }

        setIsLoading(true);
        try {
            // Eliminar confirmPassword antes de enviar al backend
            const { confirmPassword: _, ...submitData } = formData;
            submitData.nombre_completo = `${submitData.nombres || ''} ${submitData.apellidos || ''}`.trim();
            if (submitData.movil) {
                const mobileValidationMessage = getInternationalPhoneValidationMessage(submitData.movil, submitData.pais);
                if (mobileValidationMessage) {
                    await appAlert({
                        title: 'Móvil inválido',
                        message: mobileValidationMessage,
                        tone: 'warning',
                    });
                    setIsLoading(false);
                    return;
                }
                submitData.movil = formatInternationalPhone(submitData.movil, resolveCountryPhonePrefix(submitData.pais));
            }

            // Si el país es Ecuador, el RUC debe estar validado estructural y externamente
            if (requiereValidacionRucEcuador(submitData.pais)) {
                const rucCheck = validarRucEcuador(submitData.ruc);
                if (!rucCheck.valido) {
                    await appAlert({
                        title: 'RUC inválido',
                        message: rucCheck.mensaje,
                        tone: 'warning',
                    });
                    setIsLoading(false);
                    return;
                }
            }
            await publicAuthApi.register(submitData);

            setStep(2);

        } catch (err) {
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
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="register-dialog-title"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative"
                >
                    {/* Header naranja */}
                    <div className="h-1.5 bg-gradient-to-r from-[#F39200] via-[#E94E1B] to-[#F39200]" />

                    <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        aria-label="Cerrar registro"
                        className={`${APP_MODAL_CLOSE_BUTTON_CLASS} absolute right-6 top-6 z-10`}
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="p-10">
                        {step === 1 ? (
                            <>
                                <div className="text-center mb-8 flex flex-col items-center">
                                    <img src={LogoGiproyCompleto} alt="GIPROY Logo" className="h-12 w-auto object-contain mb-4" />
                                    <h2 id="register-dialog-title" className="text-3xl font-black uppercase tracking-tight text-zinc-900 leading-none italic">Registro de Cuenta</h2>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-3 italic">GIPROY NETWORK SYSTEM V3.0</p>
                                </div>

                                {error && (
                                    <MotionDiv
                                        role="alert"
                                        aria-live="assertive"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4"
                                    >
                                        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                                        <p className="text-xs font-black text-red-700 uppercase tracking-tight">{error}</p>
                                    </MotionDiv>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="relative">
                                        <div
                                            ref={formScrollRef}
                                            className="giproy-motion-scrollbar-hide max-h-[52dvh] overflow-y-auto pr-5"
                                        >
                                            <PersonnelFormFields
                                                formData={formData}
                                                setFormData={setFormData}
                                                paises={paises}
                                                publicRegister
                                                countryLocked={false}
                                                onRucStatusChange={(verified, lookup) => {
                                                    setRucVerified(verified);
                                                    setRucLookup(lookup);
                                                    if (verified) setManualReviewStatus(null);
                                                }}
                                            />
                                            {isRucRequired && rucLookup?.requires_manual_review && (
                                                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                                    <p className="text-xs font-black text-amber-900">En revisión manual</p>
                                                    <p className="mt-1 text-[11px] text-amber-800">El RUC no consta en la importación vigente. Indica el código del certificado SRI; no adjuntes documentos.</p>
                                                    <input
                                                        value={certificateCode}
                                                        onChange={(event) => setCertificateCode(event.target.value)}
                                                        placeholder="Código del certificado SRI"
                                                        className="mt-3 h-10 w-full rounded-lg border border-amber-200 bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-amber-300"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleManualReview}
                                                        disabled={isLoading}
                                                        className="mt-3 h-10 rounded-lg bg-amber-700 px-4 text-[11px] font-black uppercase tracking-wide text-white disabled:opacity-50"
                                                    >
                                                        Solicitar verificación
                                                    </button>
                                                    {manualReviewStatus && <p className="mt-3 text-[11px] font-bold text-amber-900">{manualReviewStatus}</p>}
                                                </div>
                                            )}
                                        </div>
                                        <MotionScrollbar targetRef={formScrollRef} className="right-0" />
                                    </div>

                                    <div className="pt-4">
                                        <LiquidButton
                                            type="submit"
                                            className={`w-full text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-xl transition-all text-sm ${canSubmit ? 'bg-[#F39200] hover:bg-[#E94E1B] shadow-orange-500/10 active:scale-[0.98]' : 'bg-zinc-300 cursor-not-allowed shadow-zinc-500/10'}`}
                                            disabled={!canSubmit}
                                        >
                                            {isLoading ? 'PROCESANDO REGISTRO...' : 'CREAR MI CUENTA AHORA'}
                                        </LiquidButton>
                                    </div>

                                    <p className="text-[10px] text-center text-zinc-400 font-bold uppercase tracking-tighter leading-relaxed px-4">
                                        Al registrarte, se creará una empresa con 1 año de validez y tu cuenta quedará como administrador inicial bajo el modelo SaaS.
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
                                    Revisa el correo del administrador para validar el email y activar la empresa.
                                </p>
                                <LiquidButton
                                    onClick={onClose}
                                    className="mt-8 bg-[#1A1A1A] text-white h-12 px-8 font-black uppercase tracking-widest rounded-xl"
                                >
                                    Entendido
                                </LiquidButton>
                            </div>
                        )}
                    </div>
                </MotionDiv>
            </div>
        </AnimatePresence>
    );
};

export default RegisterModal;
