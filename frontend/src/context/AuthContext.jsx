import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextInstance';
export { AuthContext };
import { authApi } from '../api/auth';
import { adminLicensesApi } from '../api/adminLicenses';
import basesTrabajoApi from '../api/basesTrabajo';
import { getDeviceId } from '../utils/deviceId';
import { decodeJWT } from '../utils/jwt';
import {
    AUTH_SESSION_EXPIRED_EVENT,
    clearStoredAuthSession,
    storeAuthRedirectMessage,
} from '../utils/authSession';
import { traceSessionEvent } from '../utils/sessionTrace';
import { dispatchWorkingCompanyChanged } from '../api/tenant';


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [licenseInfo, setLicenseInfo] = useState(null);
    const [selectedEmpresa, setSelectedEmpresa] = useState(() => {
        const saved = localStorage.getItem('giproy_working_company');
        return saved ? JSON.parse(saved) : null;
    });
    const [selectedBaseTrabajo, setSelectedBaseTrabajo] = useState(() => {
        const saved = localStorage.getItem('giproy_working_base');
        return saved ? JSON.parse(saved) : null;
    });
    const [activeProject, setActiveProject] = useState(() => {
        const saved = localStorage.getItem('giproy_working_project');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(true);
    const [deviceId, setDeviceId] = useState(null);

    const clearSessionState = useCallback((message = null) => {
        traceSessionEvent('frontend_session_expired_event', {
            reason: message || 'clear_session_state',
            requestPath: window.location?.pathname || null,
            requestMethod: 'CLIENT',
            payload: {
                selected_empresa_id: selectedEmpresa?.id || null,
                selected_base_id: selectedBaseTrabajo?.id || null,
                active_project_id: activeProject?.id || null,
            },
        });
        if (message) {
            storeAuthRedirectMessage(message);
        }
        clearStoredAuthSession();
        setUser(null);
        setLicenseInfo(null);
        setSelectedEmpresa(null);
        setSelectedBaseTrabajo(null);
        setActiveProject(null);
    }, [activeProject?.id, selectedBaseTrabajo?.id, selectedEmpresa?.id]);

    const refreshAccessToken = useCallback(async () => {
        const token = localStorage.getItem('giproy_token');
        if (!token) return null;

        const data = await authApi.refreshAccessToken();

        if (data?.access_token) {
            localStorage.setItem('giproy_token', data.access_token);
            return data.access_token;
        }

        return null;
    }, []);

    const refreshLicenseInfo = useCallback(async (empresaId = null) => {
        try {
            const params = empresaId ? { empresa_id: empresaId } : {};
            const data = await adminLicensesApi.getMyLicense(params);
            setLicenseInfo(data);
        } catch (e) {
            console.warn("No se pudo cargar info de licencia:", e.message);
            setLicenseInfo(null);
        }
    }, []);

    // Obtener deviceId al iniciar la aplicación
    useEffect(() => {
        const initDevice = async () => {
            try {
                const id = await getDeviceId();
                setDeviceId(id);

                // Check ligero no bloqueante: si falla no debe contaminar la consola
                // con un falso error de conectividad cuando la app ya está operativa.
                authApi.getCurrentUser().catch(() => {
                    // No-op deliberado: checkAuth() resolverá la sesión real enseguida.
                });
            } catch (error) {
                console.warn('Silent warning in initialization:', error);
            }
        };
        initDevice();
    }, []);

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem('giproy_token');
        if (token) {
            try {
                const data = await authApi.getCurrentUser();
                setUser(data);

                // Sincronizar selectedEmpresa con los datos más recientes de la empresa del usuario
                // especialmente para traer las preferencias decimales actualizadas.
                if (data.empresa) {
                    const savedEmpresa = JSON.parse(localStorage.getItem('giproy_working_company') || 'null');
                    const isSuper = data.rol?.toLowerCase() === 'superadministrador';

                    // Forzar la empresa del usuario si no es Superadministrador,
                    // o si no hay ninguna guardada, o si la guardada ya coincide.
                    if (!isSuper || !savedEmpresa || savedEmpresa.id === data.empresa.id) {
                        setSelectedEmpresa(data.empresa);
                        localStorage.setItem('giproy_working_company', JSON.stringify(data.empresa));
                    }
                }
                // Sin embargo, podemos intentar recuperar la base activa de la BD 
                // si por alguna razón no estaba en localStorage.
                // ELIMINADO: No auto-seleccionar base de trabajo al inicio por solicitud de usuario.

                // Cargar datos de licencia
                const savedEmpresa = JSON.parse(localStorage.getItem('giproy_working_company') || 'null');
                const targetEmpresaId = data.rol?.toLowerCase() === 'superadministrador'
                    ? (savedEmpresa?.id || null)
                    : null;
                await refreshLicenseInfo(targetEmpresaId);
            } catch (error) {
                const status = error?.response?.status;
                const detail = error?.response?.data?.detail;
                if (status === 401) {
                    traceSessionEvent('frontend_check_auth_failed', {
                        reason: typeof detail === 'string' ? detail : 'check_auth_401',
                        requestPath: '/usuarios/me',
                        requestMethod: 'GET',
                        requestId: error?.response?.headers?.['x-request-id'] || null,
                        responseStatus: status,
                    });
                    globalThis.reportClientError?.("Sesión inválida o expirada durante checkAuth", error);
                    clearSessionState(typeof detail === 'string' ? detail : null);
                } else {
                    traceSessionEvent('frontend_check_auth_failed', {
                        reason: typeof detail === 'string' ? detail : 'check_auth_non_401',
                        requestPath: '/usuarios/me',
                        requestMethod: 'GET',
                        requestId: error?.response?.headers?.['x-request-id'] || null,
                        responseStatus: status || null,
                    });
                    console.warn("No se pudo rehidratar la sesión actual, pero no se invalidará localmente.", error);
                }
            }
        }
        setLoading(false);
    }, [refreshLicenseInfo, clearSessionState]);

    const login = useCallback(async (email, password, empresaId = null) => {
        const params = { ... (deviceId ? { device_id: deviceId } : {}) };
        if (empresaId) params.empresa_id = empresaId;

        // Usar URLSearchParams para application/x-www-form-urlencoded
        const body = new URLSearchParams();
        body.append('username', email);
        body.append('password', password);

        const data = await authApi.login(body, params);

        localStorage.setItem('giproy_token', data.access_token);
        const now = Date.now();
        sessionStorage.setItem('giproy_login_session_id', `${now}`);
        await checkAuth();
        return data;
    }, [deviceId, checkAuth]);


    const selectEmpresa = useCallback((empresa) => {
        const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
        if (isSuperadmin) {
            const empresaIdsToDeactivate = new Set(
                [selectedEmpresa?.id, empresa?.id]
                    .filter((empresaId) => empresaId !== null && empresaId !== undefined)
                    .map((empresaId) => Number(empresaId))
            );
            empresaIdsToDeactivate.forEach((empresaId) => {
                basesTrabajoApi.deactivateAll(empresaId).catch((error) => {
                    console.warn("No se pudieron desactivar las bases al cambiar de empresa:", error.message);
                });
            });
        }

        setSelectedEmpresa(empresa);

        // Cambiar de empresa debe comportarse como un login limpio:
        // no se arrastra base maestra, base de proyecto ni proyecto activo.
        setSelectedBaseTrabajo(null);
        setActiveProject(null);
        localStorage.removeItem('giproy_working_base');
        localStorage.removeItem('giproy_working_project');

        if (empresa) {
            localStorage.setItem('giproy_working_company', JSON.stringify(empresa));
        } else {
            localStorage.removeItem('giproy_working_company');
        }
        dispatchWorkingCompanyChanged(empresa);
    }, [selectedEmpresa?.id, user?.rol]);

    const selectBaseTrabajo = useCallback((base) => {
        // La base de trabajo persiste en memoria y en localStorage
        setSelectedBaseTrabajo(base);
        if (base) {
            localStorage.setItem('giproy_working_base', JSON.stringify(base));
        } else {
            localStorage.removeItem('giproy_working_base');
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!user) {
            setLicenseInfo(null);
            return;
        }
        // Los usuarios de empresa ya cargan su licencia dentro de checkAuth().
        // Repetirla aquí dispara dos GET /admin-licenses/me concurrentes durante
        // el arranque. Este efecto queda reservado al cambio de empresa del
        // superadministrador, que sí necesita recalcular el contexto.
        if (user.rol?.toLowerCase() !== 'superadministrador') {
            return;
        }
        const targetEmpresaId = user.rol?.toLowerCase() === 'superadministrador'
            ? (selectedEmpresa?.id || null)
            : null;
        refreshLicenseInfo(targetEmpresaId);
    }, [user, selectedEmpresa?.id, refreshLicenseInfo]);



    const logout = useCallback(async () => {
        // Desactivar todas las bases de trabajo en la BD antes de cerrar sesión.
        // Esto garantiza que al volver a entrar, ninguna base aparezca como activa.
        try {
            await authApi.logout();
        } catch (error) {
            console.warn("No se pudo invalidar la sesión en backend al cerrar sesión:", error.message);
        }
        try {
            // Se pasa el empresa_id de la empresa seleccionada para que el Superadministrador
            // desactive las bases de la empresa con la que estaba trabajando.
            await basesTrabajoApi.deactivateAll(selectedEmpresa?.id || null);
        } catch (error) {
            // Si falla (ej: token ya expirado), continuar con el logout igualmente
            console.warn("No se pudieron desactivar las bases al cerrar sesión:", error.message);
        }
        clearSessionState();
    }, [selectedEmpresa, clearSessionState]);

    // --- LÓGICA DE EXPIRACIÓN Y RENOVACIÓN DE TOKEN ---
    useEffect(() => {
        if (!user) return;

        let tokenTimeout;
        let refreshTimeout;
        let cancelled = false;

        const handleExpiration = (message) => {
            clearLifecycleTimers();
            clearSessionState(message);
        };

        const clearLifecycleTimers = () => {
            if (refreshTimeout) {
                clearTimeout(refreshTimeout);
                refreshTimeout = null;
            }
            if (tokenTimeout) {
                clearTimeout(tokenTimeout);
                tokenTimeout = null;
            }
        };

        const scheduleTokenLifecycle = (token) => {
            clearLifecycleTimers();

            const decoded = decodeJWT(token);
            if (!decoded?.exp) {
                console.warn("No se pudo programar la expiración del token JWT.");
                return;
            }

            const now = Math.floor(Date.now() / 1000);
            const secondsRemaining = decoded.exp - now;

            if (secondsRemaining <= 0) {
                handleExpiration("Su sesión ha expirado. Vuelva a iniciarla.");
                return;
            }

            const refreshLeadSeconds = Math.min(60, Math.max(15, Math.floor(secondsRemaining / 4)));
            const refreshDelayMs = Math.max((secondsRemaining - refreshLeadSeconds) * 1000, 0);

            refreshTimeout = setTimeout(async () => {
                try {
                    traceSessionEvent('frontend_refresh_started', {
                        reason: 'scheduled_refresh',
                        requestPath: '/login/refresh',
                        requestMethod: 'POST',
                    });
                    const nextToken = await refreshAccessToken();
                    if (!cancelled && nextToken) {
                        traceSessionEvent('frontend_refresh_succeeded', {
                            reason: 'scheduled_refresh_ok',
                            requestPath: '/login/refresh',
                            requestMethod: 'POST',
                        });
                        scheduleTokenLifecycle(nextToken);
                    }
                } catch (error) {
                    traceSessionEvent('frontend_refresh_failed', {
                        reason: error?.response?.data?.detail || error?.message || 'scheduled_refresh_failed',
                        requestPath: '/login/refresh',
                        requestMethod: 'POST',
                        requestId: error?.response?.headers?.['x-request-id'] || null,
                        responseStatus: error?.response?.status || null,
                    });
                    console.warn("No se pudo renovar la sesión activa:", error?.message || error);
                }
            }, refreshDelayMs);

            tokenTimeout = setTimeout(() => {
                handleExpiration("Su sesión ha expirado. Vuelva a iniciarla.");
            }, secondsRemaining * 1000);
        };

        const token = localStorage.getItem('giproy_token');
        if (token) {
            scheduleTokenLifecycle(token);
        }

        return () => {
            cancelled = true;
            clearLifecycleTimers();
        };
    }, [user, clearSessionState, refreshAccessToken]);

    useEffect(() => {
        const handleAuthSessionExpired = (event) => {
            const message = event?.detail?.message || null;
            clearSessionState(message);
        };

        window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleAuthSessionExpired);
        return () => {
            window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleAuthSessionExpired);
        };
    }, [clearSessionState]);

    const selectProject = useCallback((project) => {
        setActiveProject(project);
        if (project) {
            localStorage.setItem('giproy_working_project', JSON.stringify(project));
        } else {
            localStorage.removeItem('giproy_working_project');
        }
    }, []);

    useEffect(() => {
        if (!selectedEmpresa) {
            return;
        }

        const empresaId = Number(selectedEmpresa.id);
        const baseEmpresaId = selectedBaseTrabajo?.empresa_id != null
            ? Number(selectedBaseTrabajo.empresa_id)
            : null;
        const projectEmpresaId = activeProject?.empresa_id != null
            ? Number(activeProject.empresa_id)
            : null;

        if (baseEmpresaId !== null && baseEmpresaId !== empresaId) {
            setSelectedBaseTrabajo(null);
            localStorage.removeItem('giproy_working_base');
        }

        if (projectEmpresaId !== null && projectEmpresaId !== empresaId) {
            setActiveProject(null);
            localStorage.removeItem('giproy_working_project');
        }
    }, [
        activeProject?.empresa_id,
        selectedBaseTrabajo?.empresa_id,
        selectedEmpresa,
    ]);

    return (
        <AuthContext.Provider value={{
            user, loading, login, logout, licenseInfo,
            selectedEmpresa, setSelectedEmpresa: selectEmpresa,
            selectedBaseTrabajo, setSelectedBaseTrabajo: selectBaseTrabajo,
            activeProject, setActiveProject: selectProject
        }}>
            {children}
        </AuthContext.Provider>
    );
};
