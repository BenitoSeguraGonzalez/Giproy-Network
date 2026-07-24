/**
 * AppLayout.jsx
 * Layout principal del sistema GiProy.
 * Contiene el encabezado (navbar) persistente que se muestra en todas las páginas protegidas.
 * Envuelve el contenido de cada página como {children}.
 */
import { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import adminGlobalApi from '../api/adminGlobal';
import { routeRequiresCompanyContext } from '../api/tenant';
import systemAnnouncementsApi from '../api/systemAnnouncements';
import licenseNotificationsApi from '../api/licenseNotifications';
import adminMaintenanceApi from '../api/adminMaintenance';
import transferenciasApi from '../api/transferencias';
import {
    LayoutDashboard,
    Settings as SettingsIcon,
    LogOut,
    User,
    ChevronRight,
    ShieldCheck,
    AlertCircle,
    Building2,
    HardDrive,
    RadioTower,
    X as CloseIcon
} from 'lucide-react';
import { resolveMediaUrl } from '../utils/mediaUrl';
import useMarketplaceOrigin from '../hooks/useMarketplaceOrigin';
import { getMarketplaceOwnershipTone } from '../components/marketplace/MarketplaceOriginBadgeSet';
import { applyTrimmedPaste } from '../utils/pasteSanitizer';
import { getLicenseBannerMessage, getLicenseBannerTone, getLicenseStatusLabel, getLicenseStatusTone } from '../utils/licenseStatusUi';
import { getCompanyDisplayName } from '../utils/companyDisplayName';
import useAdaptiveLayout from '../hooks/useAdaptiveLayout';
import AdaptiveLayoutControl from '../components/ui/AdaptiveLayoutControl';
import {
    MIN_DESKTOP_DISPLAY_HEIGHT,
    MIN_DESKTOP_DISPLAY_WIDTH,
    readPhysicalDisplayResolution,
} from '../utils/displayResolution';
import GiproyIconGradient from '../assets/GiproyIconGradient.svg';
import GiproyWordmarkWhite from '../assets/GiproyWordmarkWhite.png';
import { APP_VERSION_LABEL } from '../config/appVersion';

const AppLayout = ({ children }) => {
    const { user, logout, selectedEmpresa, setSelectedEmpresa, selectedBaseTrabajo, activeProject, licenseInfo } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [empresas, setEmpresas] = useState([]);
    const [showCompanySelector, setShowCompanySelector] = useState(false);
    const [showResWarning, setShowResWarning] = useState(false);
    const [displayResolution, setDisplayResolution] = useState(() => readPhysicalDisplayResolution());
    const [announcementQueue, setAnnouncementQueue] = useState([]);
    const [licenseNotificationQueue, setLicenseNotificationQueue] = useState([]);
    const [transferSignal, setTransferSignal] = useState({ total: 0, nuevos: 0 });
    const [activeMaintenance, setActiveMaintenance] = useState(null);
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const roleKey = user?.rol?.toLowerCase();
    const canSeeTransferSignal = ['superadministrador', 'administrador'].includes(roleKey);
    const hasNewTransferSignal = transferSignal.nuevos > 0;
    const companySelectorRef = useRef(null);
    const adaptiveLayout = useAdaptiveLayout({ moduleKey: 'shell' });
    const isPortableWorkspace = adaptiveLayout.enabled && adaptiveLayout.profile !== 'wide';
    const isTabletPortrait = adaptiveLayout.enabled && adaptiveLayout.profile === 'tablet-portrait';
    const activeBaseOrigin = useMarketplaceOrigin('base_trabajo', selectedBaseTrabajo?.id);
    const activeBaseTone = getMarketplaceOwnershipTone(activeBaseOrigin);
    const activeLicenseName = String(
        licenseInfo?.licencia_actual
        || licenseInfo?.commercial_capabilities?.license?.nombre
        || licenseInfo?.license_name
        || ''
    ).trim();
    const activeLicenseLabel = activeLicenseName || (selectedEmpresa ? 'Licencia no resuelta' : 'Sin empresa activa');
    const activeLicenseStatusLabel = licenseInfo ? getLicenseStatusLabel(licenseInfo) : 'Sin licencia';
    const activeLicenseStatusTone = licenseInfo ? getLicenseStatusTone(licenseInfo) : 'border-zinc-200 bg-zinc-50 text-zinc-500';
    const storageUsedValue = Number(licenseInfo?.usados?.almacenamiento_gb);
    const storageLimitValue = Number(licenseInfo?.limites?.almacenamiento_gb);
    const hasStorageUsed = Number.isFinite(storageUsedValue);
    const hasStorageLimit = Number.isFinite(storageLimitValue);
    const storageUsedGb = hasStorageUsed ? storageUsedValue : 0;
    const isUnlimitedStorage = hasStorageLimit && storageLimitValue === -1;
    const storageUsageRatio = hasStorageLimit && storageLimitValue > 0
        ? storageUsedGb / storageLimitValue
        : 0;
    const storageUsagePercent = isUnlimitedStorage
        ? 100
        : Math.min(100, Math.max(0, storageUsageRatio * 100));
    const storageTone = !hasStorageLimit
        ? 'text-zinc-400'
        : storageUsageRatio >= 0.95
            ? 'text-red-500 animate-pulse'
            : storageUsageRatio >= 0.75
                ? 'text-orange-400'
                : 'text-emerald-500';
    const storageBarTone = !hasStorageLimit
        ? 'bg-zinc-300'
        : storageUsageRatio >= 0.95
            ? 'bg-red-500'
            : storageUsageRatio >= 0.75
                ? 'bg-orange-400'
                : 'bg-emerald-500';
    const selectedEmpresaLabel = getCompanyDisplayName(selectedEmpresa, 'Global');
    const tenantContentKey = `empresa-operativa:${selectedEmpresa?.id ?? 'sin-empresa'}`;
    
    // Bloqueo 1: Superadmin sin empresa contexto
    const shouldBlockByContext = isSuperadmin && !selectedEmpresa && routeRequiresCompanyContext(location.pathname);
    
    // Bloqueo 2: Licencia Expirada
    const isLicenseExpired = licenseInfo?.license_status === 'expired';
    const isLicenseReadonly = licenseInfo?.access_mode === 'readonly';
    const isOperationalRoute = routeRequiresCompanyContext(location.pathname);
    const shouldBlockByExpiration = isLicenseExpired && !isLicenseReadonly && isOperationalRoute;

    // Bloqueo 3: Módulo no permitido por plan
    const isModuleRestricted = (() => {
        if (!licenseInfo || !isOperationalRoute) return false;
        const permitted = licenseInfo?.limites?.modulos_permitidos || ["*"];
        if (permitted.includes("*")) return false;
        
        // Mapeo simple de rutas a IDs de módulos
        if (location.pathname.startsWith('/precios-unitarios') || location.pathname.startsWith('/apus')) {
            return !permitted.includes('unit-prices');
        }
        if (location.pathname.startsWith('/proyectos')) {
            return !permitted.includes('projects');
        }
        if (location.pathname.startsWith('/servicios')) {
            return !permitted.includes('services');
        }
        return false;
    })();

    const shouldBlockContent = shouldBlockByContext || shouldBlockByExpiration || isModuleRestricted;

    const loginSessionId = sessionStorage.getItem('giproy_login_session_id');
    useEffect(() => {
        const syncViewport = () => {
            const nextDisplayResolution = readPhysicalDisplayResolution();
            setDisplayResolution((current) => (
                current.width === nextDisplayResolution.width && current.height === nextDisplayResolution.height
                    ? current
                    : nextDisplayResolution
            ));
        };

        syncViewport();
        window.addEventListener('resize', syncViewport);
        window.addEventListener('orientationchange', syncViewport);
        window.visualViewport?.addEventListener('resize', syncViewport);

        return () => {
            window.removeEventListener('resize', syncViewport);
            window.removeEventListener('orientationchange', syncViewport);
            window.visualViewport?.removeEventListener('resize', syncViewport);
        };
    }, []);

    useEffect(() => {
        const isBelowMinimum =
            displayResolution.width < MIN_DESKTOP_DISPLAY_WIDTH
            || displayResolution.height < MIN_DESKTOP_DISPLAY_HEIGHT;

        if (!isBelowMinimum) {
            setShowResWarning(false);
            return;
        }

        setShowResWarning((prev) => (prev ? prev : true));
    }, [displayResolution.height, displayResolution.width]);

    const currentAnnouncement = announcementQueue[0] || null;
    const currentLicenseNotification = licenseNotificationQueue[0] || null;

    useEffect(() => {
        if (isSuperadmin) {
            adminGlobalApi.getEmpresas()
                .then(data => setEmpresas(data || []))
                .catch(err => globalThis.reportClientError?.("Error cargando empresas:", err));
        }
    }, [isSuperadmin, setEmpresas]);

    useEffect(() => {
        if (!showCompanySelector) return undefined;

        const closeCompanySelector = () => {
            setShowCompanySelector(false);
            companySelectorRef.current?.querySelector('button')?.focus();
        };
        const handlePointerDown = (event) => {
            if (companySelectorRef.current && !companySelectorRef.current.contains(event.target)) {
                closeCompanySelector();
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') closeCompanySelector();
        };

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [showCompanySelector]);

    useEffect(() => {
        if (!user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAnnouncementQueue(prev => prev.length > 0 ? [] : prev);
            return;
        }

        const loadAnnouncements = async () => {
            const shownKey = `giproy_announcements_shown:${user.id}:${loginSessionId}`;
            if (!loginSessionId || sessionStorage.getItem(shownKey) === '1') {
                setAnnouncementQueue([]);
                return;
            }
            try {
                const empresaId = selectedEmpresa?.id ?? null;
                const data = await systemAnnouncementsApi.getActive(empresaId);
                const nextQueue = Array.isArray(data) ? data : [];
                setAnnouncementQueue(nextQueue);
                sessionStorage.setItem(shownKey, '1');
            } catch (error) {
                globalThis.reportClientError?.('Error cargando comunicados activos:', error);
                setAnnouncementQueue([]);
            }
        };

        loadAnnouncements();
    }, [user, selectedEmpresa?.id, loginSessionId]);

    useEffect(() => {
        if (!user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLicenseNotificationQueue(prev => prev.length > 0 ? [] : prev);
            return;
        }

        let isMounted = true;

        const loadLicenseNotifications = async () => {
            try {
                const data = await licenseNotificationsApi.getMine();
                const nextQueue = Array.isArray(data?.items) ? data.items : [];
                if (isMounted) {
                    setLicenseNotificationQueue(nextQueue);
                }
            } catch (error) {
                if (isMounted) {
                    setLicenseNotificationQueue([]);
                }
            }
        };

        loadLicenseNotifications();

        return () => {
            isMounted = false;
        };
    }, [user, loginSessionId]);

    useEffect(() => {
        if (!canSeeTransferSignal) {
            setTransferSignal((current) => (
                current.total === 0 && current.nuevos === 0 ? current : { total: 0, nuevos: 0 }
            ));
            return undefined;
        }

        let isMounted = true;
        const loadTransferSignal = async () => {
            try {
                const data = await transferenciasApi.getTraySummary(selectedEmpresa?.id ?? null);
                if (!isMounted) return;
                const metrics = data?.metrics || {};
                setTransferSignal({
                    total: Number(data?.total ?? metrics.recibidos ?? 0) || 0,
                    nuevos: Number(metrics.nuevos ?? 0) || 0,
                });
            } catch (error) {
                if (isMounted) {
                    setTransferSignal({ total: 0, nuevos: 0 });
                }
            }
        };

        loadTransferSignal();
        const intervalId = window.setInterval(loadTransferSignal, 30000);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
        };
    }, [canSeeTransferSignal, selectedEmpresa?.id, user?.id]);

    useEffect(() => {
        if (!currentAnnouncement || currentAnnouncement.display_duration_seconds == null) return undefined;

        const timeoutId = window.setTimeout(() => {
            setAnnouncementQueue((current) => current.slice(1));
        }, currentAnnouncement.display_duration_seconds * 1000);

        return () => window.clearTimeout(timeoutId);
    }, [currentAnnouncement]);

    useEffect(() => {
        if (!user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveMaintenance(prev => prev !== null ? null : prev);
            return;
        }

        let isMounted = true;

        const loadMaintenance = async () => {
            try {
                const data = await adminMaintenanceApi.getActive();
                if (isMounted) {
                    setActiveMaintenance(data?.is_active_now ? data : null);
                }
            } catch (error) {
                globalThis.reportClientError?.('Error cargando mantenimiento activo:', error);
                if (isMounted) {
                    setActiveMaintenance(null);
                }
            }
        };

        loadMaintenance();
        const intervalId = window.setInterval(loadMaintenance, 60000);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
        };
    }, [user, setActiveMaintenance]);

    const isRestrictedMaintenance = activeMaintenance?.mode === 'restricted' && !isSuperadmin;

    const announcementTone = (type) => {
        switch (type) {
            case 'critical':
                return 'border-red-200 bg-red-50 text-red-700';
            case 'warning':
                return 'border-orange-200 bg-orange-50 text-[#A55A00]';
            default:
                return 'border-blue-200 bg-blue-50 text-[#136191]';
        }
    };

    const announcementLabel = (type) => {
        switch (type) {
            case 'critical':
                return 'Crítico';
            case 'warning':
                return 'Advertencia';
            default:
                return 'Informativo';
        }
    };

    const licenseNotificationTone = (severity) => {
        switch (severity) {
            case 'warning':
                return 'border-orange-200 bg-orange-50 text-[#A55A00]';
            case 'error':
            case 'critical':
                return 'border-red-200 bg-red-50 text-red-700';
            case 'success':
                return 'border-emerald-200 bg-emerald-50 text-emerald-700';
            default:
                return 'border-blue-200 bg-blue-50 text-[#136191]';
        }
    };

    const licenseNotificationLabel = (type) => {
        switch (type) {
            case 'license_welcome':
                return 'Licencia';
            case 'purchase_formalized':
                return 'Compra';
            case 'purchase_lifecycle_ended':
                return 'Fin de compra';
            default:
                return 'Aviso';
        }
    };

    const closeLicenseNotification = async () => {
        const notification = currentLicenseNotification;
        if (!notification) return;
        setLicenseNotificationQueue((current) => current.slice(1));
        if (notification.payload?.display_once === false) {
            return;
        }
        try {
            await licenseNotificationsApi.acknowledge(notification.id);
        } catch (error) {
            setLicenseNotificationQueue((current) => [notification, ...current]);
        }
    };



    return (
        <div
            className="h-dvh flex flex-col text-[#1A1A1A] font-sans selection:bg-[#F39200]/20 overflow-hidden"
            data-adaptive-ui-enabled={adaptiveLayout.enabled ? 'true' : 'false'}
            data-adaptive-profile={adaptiveLayout.profile}
            data-adaptive-detected-profile={adaptiveLayout.detectedProfile}
            data-adaptive-input={adaptiveLayout.touchCapable ? 'touch' : 'pointer'}
            style={adaptiveLayout.enabled ? { height: `${Math.round(adaptiveLayout.environment.visualHeight)}px` } : undefined}
            onPasteCapture={applyTrimmedPaste}
        >
            {/* Banner de Licencia */}
            {licenseInfo && ((licenseInfo.license_status === 'expired' && licenseInfo.access_mode === 'readonly') || 
                licenseInfo.next_license ||
                (licenseInfo.usados.proyectos >= licenseInfo.limites.proyectos && licenseInfo.limites.proyectos !== -1)) && (
                <div className={`px-6 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest z-[100] ${licenseInfo.next_license && licenseInfo.license_status === 'active' ? 'bg-blue-600 text-white' : getLicenseBannerTone(licenseInfo)}`}>
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                            {(licenseInfo.license_status === 'expired' && licenseInfo.access_mode === 'readonly')
                                ? getLicenseBannerMessage(licenseInfo)
                                : licenseInfo.next_license
                                    ? `La próxima licencia (${licenseInfo.next_license.nombre}) iniciará el ${new Date(`${licenseInfo.next_license.starts_at}T00:00:00`).toLocaleDateString()}.`
                                    : `Aviso: Se ha alcanzado el límite de proyectos de su plan (${licenseInfo.limites.proyectos}). Contacte a soporte para ampliarlo.`}
                        </span>
                    </div>
                </div>
            )}

            {/* Resolution Warning Banner */}
            {showResWarning && !adaptiveLayout.enabled && !isPortableWorkspace && (
                <div className="bg-[#F39200] text-white px-6 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top duration-500 z-[100]">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-4 h-4" />
                        <span>La resolución de la pantalla es inferior al mínimo recomendado (1920x1080). Algunos elementos pueden no visualizarse correctamente.</span>
                    </div>
                    <button onClick={() => setShowResWarning(false)} className="hover:scale-110 transition-transform">
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            {currentAnnouncement && (
                <div className={`border-b border-zinc-200 bg-white ${isPortableWorkspace ? 'px-4 py-2' : 'px-6 py-3'}`}>
                    <div className={`mx-auto max-w-[1800px] rounded-2xl border ${isPortableWorkspace ? 'px-3 py-2' : 'px-4 py-3'} ${announcementTone(currentAnnouncement.tipo)}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <div className={`flex flex-wrap items-center gap-2 ${isPortableWorkspace ? 'mb-0.5' : 'mb-1'}`}>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                        {announcementLabel(currentAnnouncement.tipo)}
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-current/20 bg-white/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]">
                                        {currentAnnouncement.scope === 'empresa' ? currentAnnouncement.impact_label || 'Empresas' : 'Global'}
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-current/20 bg-white/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]">
                                        {currentAnnouncement.display_duration_seconds == null ? 'Indefinido' : `${currentAnnouncement.display_duration_seconds} s`}
                                    </span>
                                </div>
                                <div className={`${isPortableWorkspace ? 'text-[12px]' : 'text-sm'} font-black uppercase tracking-tight`}>
                                    {currentAnnouncement.titulo}
                                </div>
                                {isPortableWorkspace ? null : (
                                    <div className="mt-1 text-sm font-medium leading-relaxed opacity-90">
                                        {currentAnnouncement.mensaje}
                                    </div>
                                )}
                            </div>
                            {currentAnnouncement.display_duration_seconds == null ? (
                                <button
                                    type="button"
                                    onClick={() => setAnnouncementQueue((current) => current.slice(1))}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-current/20 bg-white/50 text-current hover:bg-white/70 transition-colors"
                                    title="Cerrar comunicado"
                                >
                                    <CloseIcon className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {currentLicenseNotification && (
                <div className={`border-b border-zinc-200 bg-white ${isPortableWorkspace ? 'px-4 py-2' : 'px-6 py-3'}`}>
                    <div className={`mx-auto max-w-[1800px] rounded-2xl border ${isPortableWorkspace ? 'px-3 py-2' : 'px-4 py-3'} ${licenseNotificationTone(currentLicenseNotification.severity)}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <div className={`flex flex-wrap items-center gap-2 ${isPortableWorkspace ? 'mb-0.5' : 'mb-1'}`}>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                        {licenseNotificationLabel(currentLicenseNotification.notification_type)}
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-current/20 bg-white/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]">
                                        Comunicacion interna
                                    </span>
                                    {currentLicenseNotification.action_label ? (
                                        <span className="inline-flex items-center rounded-full border border-current/20 bg-white/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]">
                                            {currentLicenseNotification.action_label}
                                        </span>
                                    ) : null}
                                </div>
                                <div className={`${isPortableWorkspace ? 'text-[12px]' : 'text-sm'} font-black uppercase tracking-tight`}>
                                    {currentLicenseNotification.title || currentLicenseNotification.subject}
                                </div>
                                {isPortableWorkspace ? null : (
                                    <div className="mt-1 text-sm font-medium leading-relaxed opacity-90">
                                        {currentLicenseNotification.body}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={closeLicenseNotification}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-current/20 bg-white/50 text-current hover:bg-white/70 transition-colors"
                                title="Cerrar aviso"
                            >
                                <CloseIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeMaintenance && (
                <div className={`border-b border-zinc-200 bg-white ${isPortableWorkspace ? 'px-4 py-2' : 'px-6 py-3'}`}>
                    <div className={`mx-auto max-w-[1800px] rounded-2xl border ${isPortableWorkspace ? 'px-3 py-2' : 'px-4 py-3'} ${activeMaintenance.mode === 'restricted' ? 'border-red-200 bg-red-50 text-red-700' : 'border-orange-200 bg-orange-50 text-[#A55A00]'}`}>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                {activeMaintenance.mode === 'restricted' ? 'Mantenimiento · Acceso restringido' : 'Mantenimiento · Solo lectura'}
                            </span>
                        </div>
                        <div className={`${isPortableWorkspace ? 'text-[12px]' : 'text-sm'} font-black uppercase tracking-tight`}>
                            {activeMaintenance.titulo}
                        </div>
                        {isPortableWorkspace ? null : (
                            <div className="mt-1 text-sm font-medium leading-relaxed opacity-90">
                                {activeMaintenance.mensaje}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Encabezado / Navbar Industrial — Persistente en todas las páginas */}
            <nav
                data-app-header
                data-app-header-layout={isTabletPortrait ? 'stacked-context' : 'single-row'}
                className={`${isTabletPortrait ? 'grid min-h-28 grid-cols-[minmax(0,1fr)_auto] grid-rows-[44px_44px] gap-x-3 gap-y-2 px-4 py-2' : isPortableWorkspace ? 'flex h-16 items-center justify-between px-4' : 'flex h-20 items-center justify-between px-8'} sticky top-0 z-[500] shrink-0 border-b border-zinc-200 bg-white`}
            >
                <div className={`${isTabletPortrait ? 'contents' : `flex min-w-0 items-center ${isPortableWorkspace ? 'gap-3' : 'gap-6'}`}`}>
                    {/* Branding Principal (Fijo) */}
                    <button
                        type="button"
                        data-app-header-brand
                        className={`${isTabletPortrait ? 'col-start-1 row-start-1 w-fit' : ''} ${isPortableWorkspace ? 'h-11 min-w-[104px] px-3' : 'h-11 min-w-[120px] px-4'} flex shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border-b-2 border-[#F39200] bg-zinc-900 shadow-sm`}
                        onClick={() => navigate('/dashboard')}
                        title="Ir al Dashboard"
                    >
                        <img
                            src={GiproyIconGradient}
                            alt="GiProy"
                            className={`${isPortableWorkspace ? 'h-5 w-5' : 'h-6 w-6'} object-contain`}
                        />
                        <img
                            src={GiproyWordmarkWhite}
                            alt="GIPROY registrado"
                            className={`${isPortableWorkspace ? 'h-3.5' : 'h-4'} w-auto object-contain`}
                        />
                        <span
                            data-app-version
                            className="whitespace-nowrap text-[8px] font-black tracking-tight text-white/75"
                            aria-label={`Version ${APP_VERSION_LABEL}`}
                        >
                            {APP_VERSION_LABEL}
                        </span>
                    </button>

                    {!isPortableWorkspace && <div className="h-8 w-px bg-zinc-200" />}
 
                    {/* Contenedor de Contextos con Separador Físico */}
                    <div
                        data-app-header-context
                        className={`${isTabletPortrait ? 'col-span-2 row-start-2 min-w-0 overflow-x-auto overscroll-contain border-t border-zinc-100 pt-2 [scrollbar-width:none] [touch-action:pan-x]' : ''} flex items-center ${isPortableWorkspace ? 'min-w-0 gap-3' : 'hidden gap-6 lg:flex'}`}
                    >
                        
                        {/* Bloque 1: Empresa - (TASK-0149: Logo Refinado) */}
                        <div className={`flex items-center gap-3 min-w-0 ${isPortableWorkspace ? '' : 'border-r border-zinc-200 pr-6'}`}>
                            {selectedEmpresa?.logo_url && (
                                <div className="h-9 w-9 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-zinc-100 shadow-sm">
                                    <img src={resolveMediaUrl(selectedEmpresa.logo_url)} alt="Logo" className="h-full w-full object-contain p-1" />
                                </div>
                            )}
                            <div className={`flex flex-col items-start min-w-0 ${isPortableWorkspace ? 'max-w-[280px]' : 'min-w-[200px]'}`}>
                                <span className={`${isPortableWorkspace ? 'text-[9px]' : 'text-[7px]'} font-black uppercase text-zinc-400 tracking-widest leading-none mb-1`}>
                                    Contexto Operativo
                                </span>
                                <div className="flex items-center gap-2 w-full mt-0.5">
                                    <h2 className={`${isPortableWorkspace ? 'text-[11px]' : 'text-[11px]'} font-black uppercase tracking-tight text-zinc-800 truncate leading-none`} title={selectedEmpresaLabel}>
                                        {selectedEmpresaLabel}
                                    </h2>
                                    {isSuperadmin && (
                                        <div ref={companySelectorRef} className="relative flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setShowCompanySelector((current) => !current)}
                                                className={`flex items-center gap-1 font-black bg-orange-100 text-[#F39200] rounded-full hover:bg-orange-200 transition-colors uppercase cursor-pointer ${isPortableWorkspace ? 'text-[7px] px-2 py-1' : 'text-[8px] px-2 py-0.5'}`}
                                                title="Cambiar empresa de trabajo"
                                                aria-expanded={showCompanySelector}
                                                aria-controls="app-company-selector"
                                                aria-haspopup="dialog"
                                            >
                                                Empresa <ChevronRight className={`transition-transform ${showCompanySelector ? 'rotate-90' : ''} ${isPortableWorkspace ? 'w-2.5 h-2.5' : 'w-2 h-2'}`} />
                                            </button>
                                            <div
                                                id="app-company-selector"
                                                data-app-company-selector
                                                role="dialog"
                                                aria-label="Cambiar empresa de trabajo"
                                                className={`absolute left-0 top-full z-[520] mt-2 max-h-[min(26rem,calc(100dvh-8rem))] w-[min(18rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-zinc-100 bg-white p-4 shadow-2xl transition-all ${showCompanySelector ? 'visible opacity-100' : 'pointer-events-none invisible opacity-0'}`}
                                            >
                                                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-3 border-b border-zinc-50 pb-2">Cambiar Empresa (Auditoría)</p>
                                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                                    {empresas.map(emp => (
                                                        <button
                                                            key={emp.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedEmpresa(emp);
                                                                setShowCompanySelector(false);
                                                            }}
                                                            className={`w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-between ${selectedEmpresa?.id === emp.id ? 'bg-[#1A1A1A] text-white shadow-lg' : 'hover:bg-zinc-50 text-zinc-600'}`}
                                                        >
                                                            {getCompanyDisplayName(emp)}
                                                            {selectedEmpresa?.id === emp.id && <ShieldCheck className="w-3 h-3 text-[#F39200]" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className={`flex items-center gap-1.5 w-full ${isPortableWorkspace ? 'mt-0.5' : 'mt-1'}`}>
                                    <ShieldCheck className={`${isPortableWorkspace ? 'h-2.5 w-2.5' : 'h-3 w-3'} flex-shrink-0 text-[#F39200]`} />
                                    <span
                                        className={`${isPortableWorkspace ? 'text-[9px]' : 'text-[8px]'} font-black uppercase tracking-[0.14em] text-[#F39200] truncate leading-none`}
                                        title={`Licencia activa: ${activeLicenseLabel} · ${activeLicenseStatusLabel}`}
                                    >
                                        Licencia activa: {activeLicenseLabel}
                                    </span>
                                    {licenseInfo && !isPortableWorkspace && (
                                        <span className={`inline-flex flex-shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.12em] ${activeLicenseStatusTone}`}>
                                            {activeLicenseStatusLabel}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Indicador de Espacio (Nuevo - Ref: Solicitud Usuario) */}
                            {!isPortableWorkspace && licenseInfo && (
                                <div className="flex flex-col items-end gap-1 ml-2 pl-3 border-l border-zinc-100">
                                    <div className="flex items-center gap-2">
                                        <HardDrive className={`w-3 h-3 ${isUnlimitedStorage ? 'text-emerald-500' : storageTone}`} />
                                        <span className="text-[9px] font-black text-zinc-800 uppercase tracking-tight">
                                            {hasStorageUsed ? storageUsedGb.toFixed(2) : '--'} / {isUnlimitedStorage ? '∞' : hasStorageLimit ? storageLimitValue : '--'} GB
                                        </span>
                                    </div>
                                    <div className="w-16 h-1 bg-zinc-100 rounded-full overflow-hidden border border-zinc-50">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${isUnlimitedStorage ? 'bg-emerald-500' : storageBarTone}`}
                                            style={{ width: `${storageUsagePercent}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bloque 2: Proyecto (Opcional) */}
                        {activeProject && !isPortableWorkspace && (
                            <div className="flex flex-col items-start min-w-[150px] border-r border-zinc-200 pr-6">
                                <span className="text-[7px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">
                                    Proyecto
                                </span>
                                <span className="text-[10px] font-bold uppercase text-zinc-800 truncate w-full mt-0.5 leading-none" title={activeProject.descripcion || activeProject.nombre}>
                                    {activeProject.descripcion || activeProject.nombre}
                                </span>
                            </div>
                        )}

                        {/* Bloque 3: Base Técnica */}
                        {selectedBaseTrabajo && (
                            <div className={`flex flex-col items-start min-w-0 ${isPortableWorkspace ? 'max-w-[240px]' : 'min-w-[150px]'}`}>
                                <div className="flex items-center gap-1.5 mb-1 w-full">
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0 ${activeBaseTone.dot}`} />
                                    <span className={`${isPortableWorkspace ? 'text-[9px]' : 'text-[7px]'} font-black uppercase tracking-widest leading-none truncate ${activeBaseTone.text}`}>
                                        {selectedBaseTrabajo.tipo_nombre || (selectedBaseTrabajo.es_maestra ? 'Base Maestra' : 'Base de Proyecto')}
                                        {selectedBaseTrabajo.tipo === 'Base de Proyecto' && selectedBaseTrabajo.revision !== null && selectedBaseTrabajo.revision !== undefined && ` (REV ${selectedBaseTrabajo.revision})`}
                                    </span>
                                </div>
                                <span className={`${isPortableWorkspace ? 'text-[9px]' : 'text-[10px]'} font-black uppercase italic truncate w-full mt-0.5 leading-none ${activeBaseTone.textStrong}`} title={selectedBaseTrabajo.nombre}>
                                    {selectedBaseTrabajo.nombre}
                                </span>
                            </div>
                        )}
                    </div>
                    {isPortableWorkspace && showResWarning && (
                        <button
                            type="button"
                            onClick={() => setShowResWarning(false)}
                            className="hidden xl:inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-[#A55A00]"
                            title="Ocultar aviso de resolución"
                        >
                            <AlertCircle className="w-3 h-3" />
                            Resolución
                        </button>
                    )}
                </div>


                <div
                    data-app-header-actions
                    className={`${isTabletPortrait ? 'col-start-2 row-start-1 justify-self-end' : ''} flex shrink-0 items-center ${isPortableWorkspace ? 'gap-2' : 'gap-6'}`}
                >
                    <AdaptiveLayoutControl layout={adaptiveLayout} />
                    <div className={`flex items-center gap-3 ${isPortableWorkspace ? '' : 'pr-6 border-r border-zinc-200'}`}>
                        <div className={`text-right ${isPortableWorkspace ? 'hidden' : 'hidden md:block'}`}>
                            <p className="text-xs font-black uppercase tracking-tight text-[#1A1A1A]">{user?.nombre_completo}</p>
                            <p className="text-[9px] font-bold text-[#F39200] uppercase tracking-widest">
                                {user?.rol?.toLowerCase() === 'usuario' ? 'Colaborador' : user?.rol}
                            </p>
                        </div>
                        <div className={`${isPortableWorkspace ? 'w-11 h-11' : 'w-10 h-10'} rounded-full bg-zinc-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden`}>
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                                <User className={`${isPortableWorkspace ? 'w-4 h-4' : 'w-5 h-5'} text-zinc-500`} />
                            )}
                        </div>
                    </div>

                    {canSeeTransferSignal && (
                        <div className={`flex items-center ${isPortableWorkspace ? 'gap-1' : 'gap-2'}`}>
                            <button
                                type="button"
                                onClick={() => {
                                    navigate('/servicios/envios-transferencias?bandeja=entrada');
                                    window.dispatchEvent(new CustomEvent('giproy:transfer-signal-opened'));
                                }}
                                className={`${isPortableWorkspace ? 'h-11 w-11' : 'h-10 w-10'} group relative inline-flex items-center justify-center rounded-xl border bg-white shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 ${
                                    hasNewTransferSignal
                                        ? 'border-emerald-300 text-emerald-700 shadow-[0_0_0_4px_rgba(16,185,129,0.12),0_12px_28px_rgba(16,185,129,0.24)] ring-2 ring-emerald-300/70 animate-pulse'
                                        : 'border-zinc-200 text-zinc-600'
                                }`}
                                title={`Nuevos envios pendientes: ${transferSignal.nuevos}`}
                                aria-label={`Nuevos envios pendientes: ${transferSignal.nuevos}`}
                                data-testid="transfer-header-signal"
                            >
                                <span className="relative inline-flex">
                                    <RadioTower className={`${isPortableWorkspace ? 'h-4 w-4' : 'h-5 w-5'}`} />
                                </span>
                                {hasNewTransferSignal && (
                                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 px-1 text-[10px] font-black leading-none text-white shadow-[0_4px_10px_rgba(16,185,129,0.35)]">
                                        {transferSignal.nuevos}
                                    </span>
                                )}
                            </button>
                            {isSuperadmin && (
                                <button
                                    onClick={() => navigate('/admin-global')}
                                    className={`${isPortableWorkspace ? 'h-11 w-11' : 'px-3 py-2.5'} inline-flex items-center justify-center rounded-xl hover:bg-orange-50 transition-colors text-zinc-500 hover:text-[#F39200] border border-transparent hover:border-orange-100`}
                                    title="Administración Global"
                                >
                                    <LayoutDashboard className={`${isPortableWorkspace ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/settings')}
                                className={`${isPortableWorkspace ? 'h-11 w-11' : 'p-2.5'} inline-flex items-center justify-center rounded-xl hover:bg-zinc-100 transition-colors text-zinc-500 hover:text-[#1A1A1A]`}
                                title="Ajustes"
                            >
                                <SettingsIcon className={`${isPortableWorkspace ? 'w-4 h-4' : 'w-5 h-5'}`} />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={logout}
                        className={`flex items-center justify-center gap-2 ${isPortableWorkspace ? 'h-11 min-w-11 px-2.5 text-[10px]' : 'px-4 py-2.5 text-[11px]'} bg-zinc-100 hover:bg-red-50 text-zinc-600 hover:text-red-600 font-black uppercase tracking-tighter rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm`}
                    >
                        <LogOut className={`${isPortableWorkspace ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                        <span className={`${isPortableWorkspace ? 'hidden' : 'hidden sm:inline'}`}>Salir</span>
                    </button>
                </div>
            </nav>

            {/* Contenido de la página actual */}
            <div className="flex-1 overflow-hidden relative">
                {shouldBlockContent ? (
                    <div className="h-full bg-[#F2F4F7] flex items-center justify-center p-8">
                        <div className="w-full max-w-2xl bg-white border border-orange-200 rounded-[2rem] p-8 shadow-2xl">
                            <div className="flex items-start gap-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${
                                    shouldBlockByExpiration ? 'bg-red-50 border-red-200 text-red-600' : 
                                    isModuleRestricted ? 'bg-purple-50 border-purple-200 text-purple-600' :
                                    'bg-orange-50 border-orange-200 text-[#F39200]'
                                }`}>
                                    {shouldBlockByExpiration ? <AlertCircle className="w-8 h-8" /> : 
                                     isModuleRestricted ? <ShieldCheck className="w-8 h-8" /> :
                                     <Building2 className="w-8 h-8" />}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-[11px] font-black uppercase tracking-[0.28em] mb-3 ${
                                        shouldBlockByExpiration ? 'text-red-400' : 
                                        isModuleRestricted ? 'text-purple-400' : 'text-zinc-400'
                                    }`}>
                                        {shouldBlockByExpiration ? 'Licencia Expirada' : 
                                         isModuleRestricted ? 'Módulo No Incluido' : 'Contexto requerido'}
                                    </p>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-[#1A1A1A] mb-3">
                                        {shouldBlockByExpiration ? 'Acceso restringido por caducidad' : 
                                         isModuleRestricted ? 'Mejora tu plan para acceder' : 'Selecciona una empresa activa'}
                                    </h2>
                                    <p className="text-sm text-zinc-600 leading-relaxed mb-8">
                                        {shouldBlockByExpiration ? (
                                            isLicenseReadonly ? (
                                                <>La empresa está en <span className="font-bold text-amber-600">solo lectura</span>. {licenseInfo.license_end_date ? <>La ventana actual finalizó el <span className="font-bold text-amber-600">{new Date(licenseInfo.license_end_date).toLocaleDateString()}</span>.</> : null} Para volver a operar con escritura, debe activar una nueva licencia.</>
                                            ) : (
                                                <>La licencia de su empresa ha vencido el <span className="font-bold text-red-600">{new Date(licenseInfo.license_end_date).toLocaleDateString()}</span>. Para continuar operando en este módulo, debe renovar su suscripción o contactar con el administrador global.</>
                                            )
                                        ) : isModuleRestricted ? (
                                            <>El módulo que intenta abrir no está disponible en su plan actual (<span className="font-black text-purple-600">{licenseInfo.licencia_actual}</span>). Contacte con facturación para habilitar esta funcionalidad.</>
                                        ) : (
                                            <>Como <span className="font-black uppercase">Superadministrador</span>, los módulos operativos no pueden abrirse sin una empresa de trabajo definida. Esto evita lecturas o escrituras cruzadas entre empresas.</>
                                        )}
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => navigate('/dashboard')}
                                            className="px-6 py-3.5 rounded-2xl bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-[0.18em] hover:bg-zinc-800 transition-all shadow-lg"
                                        >
                                            Ir al dashboard
                                        </button>
                                        <button
                                            onClick={() => navigate(isSuperadmin ? '/admin-global' : '/settings')}
                                            className="px-6 py-3.5 rounded-2xl border-2 border-zinc-200 text-zinc-700 text-[11px] font-black uppercase tracking-[0.18em] hover:border-[#F39200] hover:text-[#F39200] transition-colors"
                                        >
                                            {isSuperadmin ? 'Administración Global' : 'Ver Planes y Ajustes'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        key={tenantContentKey}
                        data-tenant-content-key={tenantContentKey}
                        data-app-page-viewport
                        className="h-full min-h-0 overflow-auto overscroll-contain [touch-action:pan-x_pan-y]"
                    >
                        {children}
                    </div>
                )}
                {isRestrictedMaintenance && (
                    <div className="absolute inset-0 z-40 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-8">
                        <div className="w-full max-w-2xl bg-white border border-red-200 rounded-[2rem] p-8">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-black uppercase tracking-[0.28em] text-red-400 mb-3">
                                        Mantenimiento activo
                                    </p>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-[#1A1A1A] mb-3">
                                        Acceso temporalmente restringido
                                    </h2>
                                    <p className="text-sm text-zinc-600 leading-relaxed mb-4">
                                        {activeMaintenance?.mensaje || 'El sistema se encuentra temporalmente restringido por mantenimiento.'}
                                    </p>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                                        Cuando finalice la intervención, la operativa volverá automáticamente.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppLayout;
