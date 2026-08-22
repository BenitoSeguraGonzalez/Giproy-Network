import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle2, HelpCircle, Loader2, Mail, Save, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { adminConfigApi } from '../api/adminConfig';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LiquidButton } from '../components/ui/liquid-button';
import { appAlert } from '../utils/appDialog';

const DEFAULT_EMAIL_FORM = {
    EMAIL_BACKEND: 'smtp',
    EMAIL_FROM_EMAIL: '',
    EMAIL_FROM_NAME: 'GiProy',
    FRONTEND_PUBLIC_URL: 'https://giproy-network.excompc.dpdns.org',
    SMTP_HOST: '',
    SMTP_PORT: '587',
    SMTP_USERNAME: '',
    SMTP_PASSWORD: '',
    SMTP_USE_TLS: 'true',
    SMTP_USE_SSL: 'false',
    GMAIL_2SV_CONFIRMED: 'false',
    GMAIL_APP_PASSWORD_CONFIRMED: 'false',
};

const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com'];

const isGmailAddress = (value = '') => {
    const normalized = String(value).trim().toLowerCase();
    const [, domain = ''] = normalized.split('@');
    return GMAIL_DOMAINS.includes(domain);
};

const GOOGLE_APP_PASSWORD_HELP_URL = 'https://support.google.com/accounts/answer/185833';
const GOOGLE_APP_PASSWORD_DIRECT_URL = 'https://myaccount.google.com/apppasswords';
const GOOGLE_2SV_DIRECT_URL = 'https://myaccount.google.com/signinoptions/two-step-verification';
const GOOGLE_ACCOUNT_URL = 'https://myaccount.google.com/';

const withGmailSmtpDefaults = (current, email = '') => ({
    ...current,
    EMAIL_BACKEND: 'smtp',
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '587',
    SMTP_USE_TLS: 'true',
    SMTP_USE_SSL: 'false',
    SMTP_USERNAME: email || current.SMTP_USERNAME || current.EMAIL_FROM_EMAIL || '',
});

const withGmailSslDefaults = (current, email = '') => ({
    ...withGmailSmtpDefaults(current, email),
    SMTP_PORT: '465',
    SMTP_USE_TLS: 'false',
    SMTP_USE_SSL: 'true',
});

const AdminGlobalEmail = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const [emailSettings, setEmailSettings] = useState({});
    const [form, setForm] = useState(DEFAULT_EMAIL_FORM);
    const [testTo, setTestTo] = useState(user?.email || '');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const readValue = useCallback((settings, key, fallback = '') => settings?.[key]?.valor ?? fallback, []);

    const syncFormFromSettings = useCallback((settings = {}) => {
        setForm({
            EMAIL_BACKEND: readValue(settings, 'EMAIL_BACKEND', 'smtp') || 'smtp',
            EMAIL_FROM_EMAIL: readValue(settings, 'EMAIL_FROM_EMAIL', ''),
            EMAIL_FROM_NAME: readValue(settings, 'EMAIL_FROM_NAME', 'GiProy') || 'GiProy',
            FRONTEND_PUBLIC_URL: readValue(settings, 'FRONTEND_PUBLIC_URL', DEFAULT_EMAIL_FORM.FRONTEND_PUBLIC_URL) || DEFAULT_EMAIL_FORM.FRONTEND_PUBLIC_URL,
            SMTP_HOST: readValue(settings, 'SMTP_HOST', ''),
            SMTP_PORT: readValue(settings, 'SMTP_PORT', '587') || '587',
            SMTP_USERNAME: readValue(settings, 'SMTP_USERNAME', ''),
            SMTP_PASSWORD: '',
            SMTP_USE_TLS: readValue(settings, 'SMTP_USE_TLS', 'true') || 'true',
            SMTP_USE_SSL: readValue(settings, 'SMTP_USE_SSL', 'false') || 'false',
            GMAIL_2SV_CONFIRMED: readValue(settings, 'GMAIL_2SV_CONFIRMED', 'false') || 'false',
            GMAIL_APP_PASSWORD_CONFIRMED: readValue(settings, 'GMAIL_APP_PASSWORD_CONFIRMED', 'false') || 'false',
        });
    }, [readValue]);

    useEffect(() => {
        if (!isSuperadmin) {
            setLoading(false);
            return;
        }

        const loadSettings = async () => {
            setLoading(true);
            try {
                const settings = await adminConfigApi.getEmailSettings();
                setEmailSettings(settings || {});
                syncFormFromSettings(settings || {});
            } catch (error) {
                appAlert(error?.response?.data?.detail || 'No se pudo cargar la configuración de email corporativo.');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [isSuperadmin, syncFormFromSettings]);

    const status = useMemo(() => {
        const backend = readValue(emailSettings, 'EMAIL_BACKEND', 'mock');
        const host = readValue(emailSettings, 'SMTP_HOST', '');
        const from = readValue(emailSettings, 'EMAIL_FROM_EMAIL', '');
        return {
            backend,
            host,
            from,
            ready: String(backend).toLowerCase() === 'smtp' && Boolean(host) && Boolean(from),
        };
    }, [emailSettings, readValue]);

    const updateForm = (key, value) => setForm((current) => {
        const next = { ...current, [key]: value };
        if ((key === 'EMAIL_FROM_EMAIL' || key === 'SMTP_USERNAME') && isGmailAddress(value)) {
            const gmailDefaults = withGmailSmtpDefaults(next, value);
            if (current[key] && current[key] !== value) {
                return {
                    ...gmailDefaults,
                    GMAIL_2SV_CONFIRMED: 'false',
                    GMAIL_APP_PASSWORD_CONFIRMED: 'false',
                };
            }
            return gmailDefaults;
        }
        return next;
    });

    const applyGmailPreset = () => {
        setForm((current) => withGmailSmtpDefaults(current));
    };

    const applyGmailSslPreset = () => {
        setForm((current) => withGmailSslDefaults(current));
    };

    const gmailDetected = isGmailAddress(form.EMAIL_FROM_EMAIL) || isGmailAddress(form.SMTP_USERNAME);
    const hasStoredSmtpPassword = Boolean(emailSettings?.SMTP_PASSWORD?.configured);
    const gmailSecurityReady = form.GMAIL_2SV_CONFIRMED === 'true' && form.GMAIL_APP_PASSWORD_CONFIRMED === 'true';

    const canTestGmailSettings = () => {
        if (!gmailDetected) return true;
        if (!gmailSecurityReady) {
            appAlert('Completa la validación Gmail: confirma verificación en 2 pasos activa y contraseña de aplicación generada.');
            return false;
        }
        if (form.SMTP_PASSWORD || hasStoredSmtpPassword) return true;
        appAlert('Gmail requiere una contraseña de aplicación. Activa la verificación en 2 pasos en Google y pega la contraseña de aplicación en SMTP Password.');
        return false;
    };

    const saveSettings = async ({ silent = false } = {}) => {
        setSaving(true);
        try {
            const saved = await adminConfigApi.setEmailSettings(form);
            setEmailSettings(saved || {});
            syncFormFromSettings(saved || {});
            if (!silent) appAlert('Configuración de email corporativo guardada.');
            return saved;
        } catch (error) {
            appAlert(error?.response?.data?.detail || 'No se pudo guardar la configuración de email.');
            return null;
        } finally {
            setSaving(false);
        }
    };

    const testSettings = async ({ saveFirst = false } = {}) => {
        const target = testTo || user?.email || '';
        if (!target) {
            appAlert('Indica un email destino para la prueba.');
            return;
        }
        if (!canTestGmailSettings()) return;

        setTesting(true);
        try {
            if (saveFirst) {
                const saved = await adminConfigApi.setEmailSettings(form);
                setEmailSettings(saved || {});
                syncFormFromSettings(saved || {});
            }
            await adminConfigApi.testEmailSettings(target);
            appAlert('Email de prueba enviado correctamente.');
        } catch (error) {
            appAlert(error?.response?.data?.detail || 'No se pudo enviar el email de prueba.');
        } finally {
            setTesting(false);
        }
    };

    if (!isSuperadmin) {
        return (
            <div className="h-full min-h-0 bg-[#F2F4F7] p-12">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
                </button>
                <Card className="max-w-4xl border-none rounded-[2rem] shadow-sm">
                    <CardContent className="p-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 mb-4">Acceso restringido</p>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900">Email corporativo SaaS</h1>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-full min-h-0 bg-[#F2F4F7] overflow-y-auto p-8 xl:p-12 custom-scrollbar">
            <div className="mx-auto max-w-6xl">
                <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver a Administración Global
                </button>

                <header className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200] mb-4">SaaS / Superadministrador</p>
                        <h1 className="text-4xl font-black tracking-tight text-[#1A1A1A] uppercase">Email corporativo</h1>
                        <p className="mt-4 max-w-3xl text-sm text-zinc-600 leading-relaxed">
                            Configuración global y persistente de SMTP, Gmail, remitente corporativo y URL pública usada en enlaces de activación.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowHelp(true)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-5 text-[10px] font-black uppercase tracking-widest text-[#F39200] transition hover:bg-orange-100"
                    >
                        <HelpCircle className="h-4 w-4" />
                        Ayuda
                    </button>
                </header>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                    <div className="space-y-6">
                        <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F39200]">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400">Estado SMTP</p>
                                        <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Configuración actual</h2>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        ['Backend', status.backend || 'mock'],
                                        ['Servidor SMTP', status.host || 'No configurado'],
                                        ['Remitente', status.from || 'No configurado'],
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                                            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400">{label}</p>
                                            <p className="mt-1 truncate text-sm font-black text-zinc-800">{value}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                                    {status.ready ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                        {status.ready ? 'SMTP listo para prueba real' : 'SMTP incompleto'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] bg-white">
                        <CardContent className="p-6 xl:p-8">
                            {loading ? (
                                <div className="flex h-96 items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#F39200]" />
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {[
                                            ['EMAIL_BACKEND', 'Backend', 'smtp'],
                                            ['FRONTEND_PUBLIC_URL', 'URL pública de activación', DEFAULT_EMAIL_FORM.FRONTEND_PUBLIC_URL],
                                            ['EMAIL_FROM_EMAIL', 'Email remitente', 'cuenta@gmail.com'],
                                            ['EMAIL_FROM_NAME', 'Nombre remitente', 'GiProy'],
                                            ['SMTP_HOST', 'SMTP Host', 'smtp.gmail.com'],
                                            ['SMTP_PORT', 'SMTP Puerto', '587'],
                                            ['SMTP_USERNAME', 'SMTP Usuario', 'cuenta@gmail.com'],
                                            ['SMTP_USE_TLS', 'STARTTLS', 'true'],
                                            ['SMTP_USE_SSL', 'SSL directo', 'false'],
                                        ].map(([key, label, placeholder]) => (
                                            <div key={key} className="space-y-2">
                                                <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</Label>
                                                <Input value={form[key]} onChange={(event) => updateForm(key, event.target.value)} placeholder={placeholder} className="h-12 rounded-xl border-zinc-200 bg-zinc-50 text-sm font-bold" />
                                            </div>
                                        ))}
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">SMTP Password</Label>
                                            <Input type="password" value={form.SMTP_PASSWORD} onChange={(event) => updateForm('SMTP_PASSWORD', event.target.value)} placeholder={emailSettings?.SMTP_PASSWORD?.configured ? 'Mantener actual si se deja vacío' : 'Contraseña o app password'} className="h-12 rounded-xl border-zinc-200 bg-zinc-50 text-sm font-bold" />
                                        </div>
                                    </div>

                                    <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                                        {gmailDetected && (
                                            <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F39200]">Gmail detectado</p>
                                                <p className="mt-2 text-xs font-bold leading-relaxed text-zinc-600">
                                                    Se aplicaron los valores SMTP seguros de Gmail. Usa verificación en 2 pasos y una contraseña de aplicación; no introduzcas la contraseña normal de Gmail.
                                                </p>
                                                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                                    <button type="button" onClick={applyGmailPreset} className="h-10 rounded-xl border border-orange-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-[#F39200] transition hover:bg-orange-50">
                                                        Gmail STARTTLS
                                                    </button>
                                                    <button type="button" onClick={applyGmailSslPreset} className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition hover:border-orange-200 hover:text-[#F39200]">
                                                        Gmail SSL
                                                    </button>
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                                    {[
                                                        ['GMAIL_2SV_CONFIRMED', 'Verificación en 2 pasos activa', GOOGLE_2SV_DIRECT_URL],
                                                        ['GMAIL_APP_PASSWORD_CONFIRMED', 'Contraseña de aplicación generada', GOOGLE_APP_PASSWORD_DIRECT_URL],
                                                    ].map(([key, label, url]) => (
                                                        <label key={key} className="flex items-start gap-3 rounded-xl border border-orange-100 bg-white p-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={form[key] === 'true'}
                                                                onChange={(event) => updateForm(key, event.target.checked ? 'true' : 'false')}
                                                                className="mt-1 h-4 w-4 accent-[#F39200]"
                                                            />
                                                            <span className="min-w-0">
                                                                <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-700">{label}</span>
                                                                <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-[9px] font-black uppercase tracking-widest text-[#F39200] underline-offset-4 hover:underline">
                                                                    Abrir Google
                                                                </a>
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">App password no disponible</p>
                                                    <p className="mt-2 text-xs font-bold leading-relaxed text-zinc-600">
                                                        Si Google indica que la opción no está disponible para la cuenta, no se podrá usar SMTP Gmail con contraseña de aplicación. Revisa seguridad de la cuenta, administrador de Workspace o usa un SMTP corporativo alternativo.
                                                    </p>
                                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                                        <a href={GOOGLE_ACCOUNT_URL} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-xl border border-amber-200 bg-white px-3 text-[9px] font-black uppercase tracking-widest text-amber-700 transition hover:bg-amber-100">
                                                            Ir a cuenta Google
                                                        </a>
                                                        <a href={GOOGLE_APP_PASSWORD_HELP_URL} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-xl border border-zinc-200 bg-white px-3 text-[9px] font-black uppercase tracking-widest text-zinc-600 transition hover:border-amber-200 hover:text-amber-700">
                                                            Ver causas Google
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">Destino prueba</Label>
                                        <div className="mt-2 flex flex-col gap-3 md:flex-row">
                                            <Input type="email" value={testTo} onChange={(event) => setTestTo(event.target.value)} placeholder="correo@dominio.com" className="h-12 rounded-xl border-zinc-200 bg-white text-sm font-bold" />
                                            <button type="button" disabled={testing} onClick={() => testSettings({ saveFirst: true })} className="h-12 rounded-xl border border-emerald-200 bg-emerald-50 px-5 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60">
                                                {testing ? 'Probando...' : 'Guardar y probar'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center justify-end gap-3 border-t border-zinc-100 pt-6">
                                        <button type="button" onClick={() => testSettings()} disabled={testing || !status.ready} className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700 disabled:opacity-50">
                                            {testing ? 'Probando...' : 'Enviar prueba'}
                                        </button>
                                        <LiquidButton type="button" onClick={() => saveSettings()} disabled={saving} className="!h-11 !px-8 bg-[#F39200] text-white text-[10px] font-black uppercase tracking-widest rounded-xl">
                                            <Save className="mr-2 h-4 w-4" />
                                            {saving ? 'Guardando...' : 'Guardar'}
                                        </LiquidButton>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {showHelp && (
                <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/35 p-4">
                    <div className="max-h-[90dvh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#F39200]">Ayuda SMTP</p>
                                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-zinc-900">Tipos soportados</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowHelp(false)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                            {[
                                {
                                    title: 'Gmail paso a paso',
                                    rows: [
                                        ['1', 'Abrir Verificación en 2 pasos'],
                                        ['2', 'Pulsar Empezar o Activar'],
                                        ['3', 'Confirmar con móvil, prompt o Authenticator'],
                                        ['4', 'Volver a esta ayuda y abrir App passwords'],
                                        ['5', 'Crear clave para GiProy o Mail'],
                                        ['6', 'Copiar los 16 caracteres en SMTP Password'],
                                    ],
                                },
                                {
                                    title: 'Activar app passwords',
                                    rows: [
                                        ['Requisito', '2 pasos debe estar activo'],
                                        ['Abrir', 'App passwords'],
                                        ['Nombre', 'GiProy'],
                                        ['Crear', 'Google genera 16 caracteres'],
                                        ['Pegar', 'en SMTP Password'],
                                    ],
                                },
                                {
                                    title: 'Valores Gmail',
                                    rows: [
                                        ['Backend', 'smtp'],
                                        ['SMTP Host', 'smtp.gmail.com'],
                                        ['SMTP Puerto', '587'],
                                        ['STARTTLS', 'true'],
                                        ['SSL directo', 'false'],
                                        ['SMTP Usuario', 'correo Gmail completo'],
                                        ['SMTP Password', 'contraseña de aplicación'],
                                    ],
                                },
                                {
                                    title: 'Si Google no deja',
                                    rows: [
                                        ['Mensaje', 'opción no disponible para tu cuenta'],
                                        ['Revisar', '2 pasos activo y sesión correcta'],
                                        ['Buscar', 'App passwords dentro de Cuenta Google'],
                                        ['Causa', 'Workspace, protección avanzada o política Google'],
                                        ['Solución', 'usar otra Gmail compatible'],
                                        ['Alternativa', 'usar SMTP corporativo'],
                                    ],
                                },
                                {
                                    title: 'URL pública',
                                    rows: [
                                        ['Campo', 'URL pública de activación'],
                                        ['Uso', 'enlace /verify-registration'],
                                        ['Actual', 'https://giproy-network.excompc.dpdns.org'],
                                        ['Cambio', 'actualizar si cambia el dominio'],
                                    ],
                                },
                            ].map((section) => (
                                <div key={section.title} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">{section.title}</h3>
                                    <div className="mt-4 space-y-2">
                                        {section.rows.map(([label, value]) => (
                                            <div key={`${section.title}-${label}`} className="grid grid-cols-[0.9fr_1.1fr] gap-3 rounded-xl bg-white p-3">
                                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">{label}</p>
                                                <p className="text-xs font-bold text-zinc-700">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-zinc-100 p-6">
                            <p className="text-xs font-bold leading-relaxed text-zinc-600">
                                Para Gmail no uses la contraseña normal. Activa la verificación en 2 pasos, genera una contraseña de aplicación y pega esa clave de 16 caracteres en SMTP Password.
                            </p>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                <a
                                    href={GOOGLE_2SV_DIRECT_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-10 items-center rounded-xl border border-orange-200 bg-orange-50 px-4 text-[10px] font-black uppercase tracking-widest text-[#F39200] transition hover:bg-orange-100"
                                >
                                    Activar 2 pasos
                                </a>
                                <a
                                    href={GOOGLE_APP_PASSWORD_DIRECT_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition hover:border-orange-200 hover:text-[#F39200]"
                                >
                                    Crear app password
                                </a>
                                <a
                                    href={GOOGLE_ACCOUNT_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition hover:border-orange-200 hover:text-[#F39200]"
                                >
                                    Ir a cuenta Google
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminGlobalEmail;
