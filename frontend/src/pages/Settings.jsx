import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { PLANTILLAS_OPCIONES } from '../constants/plantillas';
import { Trash2, Edit2, Plus, Save, X, Building2, Users, Settings as SettingsIcon, Shield, Camera, Globe, ChevronDown, Check, AlertCircle, Info, RefreshCw, Loader2, CheckCircle2, XCircle, AlertTriangle, Briefcase, FileText, Eye, ShieldCheck, Search, Power, ArrowLeft, Building, Loader2 as LoaderIcon, CheckCircle2 as CheckIcon, XCircle as XIcon, AlertTriangle as AlertIcon, ShieldCheck as ShieldIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { empresasApi } from '../api/empresas';
import { usuariosApi } from '../api/usuarios';
import { proyectosApi } from '../api/proyectos';
import { Card, CardContent } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LiquidButton } from '../components/ui/liquid-button';
import PersonnelFormFields from '../components/PersonnelFormFields';
import SearchableSelect from '../components/ui/searchable-select';
import { maestrosApi } from '../api/maestros';
import { appAlert, appConfirm } from '../utils/appDialog';
import { AppModalShell, AppModalHeader, AppModalBody, AppModalFooter } from '../components/ui/app-modal';
import ClearSearchField from '../components/ui/ClearSearchField';
import { formatInternationalPhone, isValidPhone, resolveCountryPhonePrefix } from '../utils/phoneFormatter';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { includesNormalized } from '../utils/normalizeSearch';
import { getLicenseStatusLabel, getLicenseStatusTone } from '../utils/licenseStatusUi';
import { ProjectSectionIconButton } from '../components/projects/ProjectSectionReportButton';
import { getCompanyDisplayName } from '../utils/companyDisplayName';
import { companyBackupsApi } from '../api/companyBackups';

const COMMERCIAL_CAPABILITY_LABELS = {
    apus: 'APUs',
    presupuestos: 'Presupuestos',
    cronogramas: 'Cronogramas',
    formula_polinomica: 'Formula polinomica',
    desagregacion: 'Desagregacion',
    licitaciones: 'Licitaciones',
    conecta: 'Conecta',
    excel_exports: 'Excel',
    pdf_exports: 'PDF',
    commercial_exports: 'Exportes comerciales',
};

const formatCommercialCode = (code) => String(code || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatSaasDate = (value) => {
    if (!value) return 'Sin vencimiento';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin vencimiento';
    return date.toLocaleDateString();
};

const formatBackupDateTime = (value) => {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    return date.toLocaleString();
};

const resolveCurrentLicenseCode = (licenseInfo) => {
    const candidates = [
        licenseInfo?.commercial_capabilities?.license?.codigo,
        licenseInfo?.codigo,
        licenseInfo?.license_code,
        licenseInfo?.licencia_codigo,
        licenseInfo?.licencia_actual,
    ];
    const normalized = candidates
        .map((value) => String(value || '').trim().toUpperCase())
        .find(Boolean);

    if (!normalized) return 'STANDARD';
    if (normalized.includes('PROF')) return 'PROFESSIONAL';
    if (normalized.includes('EST') || normalized.includes('STAND')) return 'STANDARD';
    if (normalized.includes('EXP')) return 'STANDARD';
    return normalized;
};

const buildMarketplaceSaasUrl = ({ code = '', intent = '' } = {}) => {
    const params = new URLSearchParams({ saas: '1' });
    if (code) params.set('q', code);
    if (intent) params.set('intent', intent);
    return `/marketplace?${params.toString()}`;
};

const COMPANY_SETTINGS_ZONES = [
    { id: 'datos', label: 'Datos empresa', icon: Building2 },
    { id: 'licencia', label: 'Licencia y SaaS', icon: ShieldCheck },
];

const USER_SETTINGS_ZONES = [
    { id: 'todos', label: 'Todos' },
    { id: 'admins', label: 'Administradores' },
    { id: 'colaboradores', label: 'Colaboradores' },
    { id: 'bloqueados', label: 'Bloqueados' },
];

const Settings = () => {
    const { user, selectedEmpresa, setSelectedEmpresa, selectedBaseTrabajo, licenseInfo } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestedTab = searchParams.get('tab');
    const requestedEditUser = searchParams.get('edit_user');
    const isSuperAdmin = (user?.rol || '').toLowerCase() === 'superadministrador';
    const initialTab = requestedTab === 'empresas' || requestedTab === 'superadmins'
        ? 'mi-empresa'
        : requestedTab || (((user?.rol || '').toLowerCase() === 'administrador' || isSuperAdmin) ? 'mi-empresa' : 'config-proyecto');
    const marketplaceProfileEditHandledRef = useRef(false);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [empresas, setEmpresas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [paises, setPaises] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [miEmpresaZone, setMiEmpresaZone] = useState('datos');
    const [usuariosZone, setUsuariosZone] = useState('todos');

    // Estados para formularios de creación/edición
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [showDeleteEmpresaModal, setShowDeleteEmpresaModal] = useState(false);
    const [deleteEmpresaStep, setDeleteEmpresaStep] = useState(1);
    const [empresaToDelete, setEmpresaToDelete] = useState(null);
    const [deletingEmpresa, setDeletingEmpresa] = useState(false);

    const [newEmpresa, setNewEmpresa] = useState({
        nombre: '', alias: '', ruc: '', codigo: '',
        direccion: '', localidad: '', canton: '', provincia: '', pais: '',
        telefono: '', email: '',
        contacto_nombre: '', contacto_email: '', contacto_telefono: '',
        logo_url: '',
        limite_administradores: 1, limite_usuarios: 1,
        decimales_moneda: 2, decimales_calculos: 4,
        use_omniclass: false,
        marketplace_can_sell: true,
        session_timeout_minutes: 30,
        proy_prefijo: '', proy_periodo: '', proy_secuencial: 1, proy_secuencial_size: 9,
        plantillas_config: {}
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [newUsuario, setNewUsuario] = useState({
        email: '', password: '', confirmPassword: '', nombre_completo: '', rol: 'usuario', empresa_id: user?.empresa_id || '',
        ruc: '', nombres: '', apellidos: '', alias: '', nacionalidad: '', profesion: '', ciudad: '', provincia: '', canton: '', pais: '', movil: '',
        acepta_politica_privacidad: false, acepta_politicas_comunicacion: false, autoriza_publicidad: false
    });
    const [miEmpresa, setMiEmpresa] = useState(null);
    const [omniclassBreakAcknowledged, setOmniclassBreakAcknowledged] = useState(false);
    const [omniclassChangeReason, setOmniclassChangeReason] = useState('');
    const [companyBackupPreflight, setCompanyBackupPreflight] = useState(null);
    const [companyBackupLoading, setCompanyBackupLoading] = useState(false);
    const [companyBackupExporting, setCompanyBackupExporting] = useState(false);
    const [companyBackupError, setCompanyBackupError] = useState('');
    const [companyBackupLastExport, setCompanyBackupLastExport] = useState(null);
    const [companyBackupZone, setCompanyBackupZone] = useState('backup');
    const [companyBackupRestoreFile, setCompanyBackupRestoreFile] = useState(null);
    const [companyBackupRestorePreflight, setCompanyBackupRestorePreflight] = useState(null);
    const [companyBackupRestoreLoading, setCompanyBackupRestoreLoading] = useState(false);
    const [companyBackupPreparingInternal, setCompanyBackupPreparingInternal] = useState(false);
    const [companyBackupInternalArtifacts, setCompanyBackupInternalArtifacts] = useState(null);
    const [companyBackupInternalLoading, setCompanyBackupInternalLoading] = useState(false);
    const [companyBackupCrossCompanyAttempts, setCompanyBackupCrossCompanyAttempts] = useState(null);
    const [companyBackupCrossCompanyLoading, setCompanyBackupCrossCompanyLoading] = useState(false);
    const [companyBackupRestoring, setCompanyBackupRestoring] = useState(false);
    const [companyBackupSelectedArtifactId, setCompanyBackupSelectedArtifactId] = useState('');
    const [companyBackupInternalRestoreTarget, setCompanyBackupInternalRestoreTarget] = useState(null);
    const [companyBackupRestoreConfirmation, setCompanyBackupRestoreConfirmation] = useState('');
    const [companyBackupRestoreResult, setCompanyBackupRestoreResult] = useState(null);
    const [empresaProvincias, setEmpresaProvincias] = useState([]);
    const [empresaCantones, setEmpresaCantones] = useState([]);
    const commercialCapabilities = licenseInfo?.commercial_capabilities || {};
    const saasProducts = Array.isArray(licenseInfo?.saas_products)
        ? licenseInfo.saas_products
        : Array.isArray(commercialCapabilities.saas_products)
            ? commercialCapabilities.saas_products
            : [];
    const effectiveRightCodes = Array.isArray(commercialCapabilities.effective_right_codes)
        ? commercialCapabilities.effective_right_codes
        : [];
    const capabilityEntries = Object.entries(commercialCapabilities.capabilities || {})
        .filter(([key]) => Object.prototype.hasOwnProperty.call(COMMERCIAL_CAPABILITY_LABELS, key));
    const enabledCapabilities = capabilityEntries.filter(([, enabled]) => Boolean(enabled));
    const disabledCapabilities = capabilityEntries.filter(([, enabled]) => !enabled);
    const currentLicenseCode = resolveCurrentLicenseCode(licenseInfo);
    const currentLicenseMonthlyCode = `LIC_${currentLicenseCode}_MONTHLY`;
    const suggestedUpgradeCode = currentLicenseCode === 'PROFESSIONAL'
        ? 'LIC_STANDARD_MONTHLY'
        : 'LIC_PROFESSIONAL_MONTHLY';
    const licenseRequiresAttention = Boolean(
        licenseInfo?.access_mode === 'readonly'
        || licenseInfo?.grace_days_remaining > 0
        || ['expired', 'grace', 'readonly', 'suspended'].includes(String(licenseInfo?.license_status || '').toLowerCase())
    );
    const buildEmptyUsuarioForm = useCallback((role = 'usuario') => ({
        email: '',
        password: '',
        confirmPassword: '',
        nombre_completo: '',
        rol: role,
        empresa_id: isSuperAdmin ? (selectedEmpresa?.id || '') : (user?.empresa_id || ''),
        ruc: '',
        nombres: '',
        apellidos: '',
        alias: '',
        nacionalidad: '',
        profesion: '',
        ciudad: '',
        provincia: '',
        canton: '',
        pais: '',
        movil: '',
        acepta_politica_privacidad: false,
        acepta_politicas_comunicacion: false,
        autoriza_publicidad: false
    }), [isSuperAdmin, selectedEmpresa?.id, user?.empresa_id]);

    const buildUsuarioPayload = useCallback((formData) => {
        const allowedKeys = [
            'email',
            'password',
            'nombre_completo',
            'rol',
            'empresa_id',
            'ruc',
            'nombres',
            'apellidos',
            'alias',
            'nacionalidad',
            'profesion',
            'ciudad',
            'provincia',
            'canton',
            'pais',
            'movil',
            'activo',
            'acepta_politica_privacidad',
            'acepta_politicas_comunicacion',
            'autoriza_publicidad'
        ];
        const payload = {};
        allowedKeys.forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(formData, key)) {
                payload[key] = formData[key];
            }
        });
        payload.email = String(payload.email || '').trim();
        payload.nombre_completo = String(payload.nombre_completo || '').trim();
        payload.rol = payload.rol || 'usuario';
        payload.empresa_id = isSuperAdmin ? (selectedEmpresa?.id || payload.empresa_id || user?.empresa_id || '') : (user?.empresa_id || payload.empresa_id || '');
        if (!payload.password) delete payload.password;
        return payload;
    }, [isSuperAdmin, selectedEmpresa?.id, user?.empresa_id]);

    const loadEmpresaProvincias = useCallback(async () => {
        try {
            const data = await maestrosApi.getProvincias();
            setEmpresaProvincias(Array.isArray(data) ? data : []);
        } catch (error) {
            globalThis.reportClientError?.("Error loading empresa provinces:", error);
        }
    }, []);

    const loadEmpresaCantones = useCallback(async (provincia) => {
        if (!provincia) return;
        try {
            const data = await maestrosApi.getCantones(provincia);
            setEmpresaCantones(Array.isArray(data) ? data : []);
        } catch (error) {
            globalThis.reportClientError?.("Error loading empresa cantons:", error);
            setEmpresaCantones([]);
        }
    }, []);

    useEffect(() => {
        if (newEmpresa.pais === 'Ecuador' || miEmpresa?.pais === 'Ecuador') {
            loadEmpresaProvincias();
        }
    }, [newEmpresa.pais, miEmpresa?.pais, loadEmpresaProvincias]);

    useEffect(() => {
        if (newEmpresa.pais === 'Ecuador' && newEmpresa.provincia) {
            loadEmpresaCantones(newEmpresa.provincia);
        } else if (miEmpresa?.pais === 'Ecuador' && miEmpresa?.provincia) {
            loadEmpresaCantones(miEmpresa.provincia);
        }
    }, [newEmpresa.provincia, newEmpresa.pais, miEmpresa?.provincia, miEmpresa?.pais, loadEmpresaCantones]);


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const empId = isSuperAdmin ? selectedEmpresa?.id : user?.empresa_id;

            if (activeTab === 'empresas' && isSuperAdmin) {
                const data = await empresasApi.getAll();
                setEmpresas(data);
            } else if (activeTab === 'usuarios') {
                if (isSuperAdmin && !selectedEmpresa?.id) {
                    setUsuarios([]);
                    return;
                }
                const params = empId ? { empresa_id: empId } : {};
                const data = await usuariosApi.getAll(params);
                setUsuarios(data);
            }

            const targetEmpresaId = isSuperAdmin ? selectedEmpresa?.id : user?.empresa_id;

            if (targetEmpresaId) {
                const empresaData = await empresasApi.getById(targetEmpresaId);
                setMiEmpresa(empresaData);
                if (selectedEmpresa?.id === empresaData.id) {
                    setSelectedEmpresa(empresaData);
                }

                if (activeTab === 'plantillas' && selectedBaseTrabajo?.tipo === 'Base de Proyecto') {
                    try {
                        const proyectos = await proyectosApi.getAll({ empresa_id: targetEmpresaId });
                        const project = proyectos.find(p => p.base_trabajo_id === selectedBaseTrabajo.id);
                        if (project) {
                            setActiveProject(project);
                        }
                    } catch (error) {
                        globalThis.reportClientError?.("Error buscando proyecto activo:", error);
                    }
                }
            }
        } catch (error) {
            globalThis.reportClientError?.("Error cargando datos:", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, user?.empresa_id, selectedEmpresa?.id, selectedBaseTrabajo?.tipo, selectedBaseTrabajo?.id, isSuperAdmin, setSelectedEmpresa]);

    const fetchPaises = useCallback(async () => {
        try {
            const data = await maestrosApi.getPaises();
            setPaises(Array.isArray(data) ? data : []);
        } catch (error) {
            globalThis.reportClientError?.("Error fetching paises:", error);
        }
    }, []);

    const loadCompanyBackupPreflight = useCallback(async () => {
        const role = (user?.rol || '').toLowerCase();
        if (role !== 'administrador' && role !== 'superadministrador') {
            setCompanyBackupError('Solo administradores y superadministradores pueden consultar copias de seguridad.');
            setCompanyBackupPreflight(null);
            return;
        }
        if (isSuperAdmin && !selectedEmpresa?.id) {
            setCompanyBackupError('Seleccione una empresa para consultar el preflight de copia 1:1.');
            setCompanyBackupPreflight(null);
            return;
        }

        setCompanyBackupLoading(true);
        setCompanyBackupError('');
        try {
            const data = await companyBackupsApi.preflightExport({
                empresa_id: isSuperAdmin ? selectedEmpresa?.id : user?.empresa_id,
                dry_run: true,
            });
            setCompanyBackupPreflight(data);
        } catch (error) {
            const detail = error?.response?.data?.detail;
            setCompanyBackupPreflight(null);
            setCompanyBackupError(detail?.message || 'No se pudo ejecutar el preflight de copia de seguridad.');
        } finally {
            setCompanyBackupLoading(false);
        }
    }, [isSuperAdmin, selectedEmpresa?.id, user?.empresa_id, user?.rol]);

    const handleCompanyBackupExport = useCallback(async () => {
        const role = (user?.rol || '').toLowerCase();
        if (role !== 'administrador' && role !== 'superadministrador') {
            setCompanyBackupError('Solo administradores y superadministradores pueden generar copias de seguridad.');
            return;
        }
        if (isSuperAdmin && !selectedEmpresa?.id) {
            setCompanyBackupError('Seleccione una empresa antes de generar la copia.');
            return;
        }
        if (companyBackupPreflight && !companyBackupPreflight.exportable) {
            setCompanyBackupError('La copia esta bloqueada por integridad. Revise las referencias antes de exportar.');
            return;
        }

        setCompanyBackupExporting(true);
        setCompanyBackupError('');
        try {
            const result = await companyBackupsApi.exportBackup({
                empresa_id: isSuperAdmin ? selectedEmpresa?.id : user?.empresa_id,
            });
            const url = window.URL.createObjectURL(result.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = result.filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setCompanyBackupLastExport(result);
            await loadCompanyBackupPreflight();
        } catch (error) {
            const detail = error?.response?.data?.detail;
            setCompanyBackupError(detail?.message || 'No se pudo generar la copia de seguridad cifrada.');
        } finally {
            setCompanyBackupExporting(false);
        }
    }, [companyBackupPreflight, isSuperAdmin, loadCompanyBackupPreflight, selectedEmpresa?.id, user?.empresa_id, user?.rol]);

    const handleCompanyBackupRestorePreflight = useCallback(async () => {
        const role = (user?.rol || '').toLowerCase();
        if (role !== 'administrador' && role !== 'superadministrador') {
            setCompanyBackupError('Solo administradores y superadministradores pueden validar restauraciones.');
            return;
        }
        if (isSuperAdmin && !selectedEmpresa?.id) {
            setCompanyBackupError('Seleccione una empresa antes de validar la restauracion.');
            return;
        }
        if (!companyBackupRestoreFile) {
            setCompanyBackupError('Seleccione un archivo .giproybackup para validar.');
            return;
        }

        setCompanyBackupRestoreLoading(true);
        setCompanyBackupError('');
        setCompanyBackupRestorePreflight(null);
        try {
            const data = await companyBackupsApi.preflightRestore({
                empresa_id: isSuperAdmin ? selectedEmpresa?.id : user?.empresa_id,
                file: companyBackupRestoreFile,
            });
            setCompanyBackupRestorePreflight(data);
        } catch (error) {
            const detail = error?.response?.data?.detail;
            setCompanyBackupError(detail?.message || 'No se pudo validar el archivo de copia.');
        } finally {
            setCompanyBackupRestoreLoading(false);
        }
    }, [companyBackupRestoreFile, isSuperAdmin, selectedEmpresa?.id, user?.empresa_id, user?.rol]);

    const loadCompanyBackupInternalArtifacts = useCallback(async () => {
        if (!isSuperAdmin) {
            setCompanyBackupError('Solo superadministradores pueden consultar copias automaticas internas.');
            setCompanyBackupInternalArtifacts(null);
            return;
        }
        if (!selectedEmpresa?.id) {
            setCompanyBackupError('Seleccione una empresa para consultar copias automaticas internas.');
            setCompanyBackupInternalArtifacts(null);
            return;
        }

        setCompanyBackupInternalLoading(true);
        setCompanyBackupError('');
        try {
            const data = await companyBackupsApi.listInternalArtifacts({
                empresa_id: selectedEmpresa.id,
            });
            setCompanyBackupInternalArtifacts(data);
        } catch (error) {
            const detail = error?.response?.data?.detail;
            setCompanyBackupInternalArtifacts(null);
            setCompanyBackupError(detail?.message || 'No se pudieron consultar las copias automaticas internas.');
        } finally {
            setCompanyBackupInternalLoading(false);
        }
    }, [isSuperAdmin, selectedEmpresa?.id]);

    const loadCompanyBackupCrossCompanyAttempts = useCallback(async () => {
        if (!isSuperAdmin) {
            return;
        }

        setCompanyBackupCrossCompanyLoading(true);
        setCompanyBackupError('');
        try {
            const data = await companyBackupsApi.listCrossCompanyRestoreAttempts({ limit: 200 });
            setCompanyBackupCrossCompanyAttempts(data);
        } catch (error) {
            const detail = error?.response?.data?.detail;
            setCompanyBackupCrossCompanyAttempts(null);
            setCompanyBackupError(detail?.message || 'No se pudo cargar la auditoria de intentos bloqueados.');
        } finally {
            setCompanyBackupCrossCompanyLoading(false);
        }
    }, [isSuperAdmin]);

    const handleCompanyBackupPrepareInternalSafety = useCallback(async () => {
        if (!isSuperAdmin) {
            setCompanyBackupError('Solo superadministradores pueden preparar una restauracion.');
            return;
        }
        if (!selectedEmpresa?.id) {
            setCompanyBackupError('Seleccione una empresa antes de preparar la restauracion.');
            return;
        }
        if (!companyBackupRestoreFile) {
            setCompanyBackupError('Seleccione un archivo .giproybackup para preparar la restauracion.');
            return;
        }

        setCompanyBackupPreparingInternal(true);
        setCompanyBackupError('');
        try {
            const data = await companyBackupsApi.prepareInternalSafetyBackup({
                empresa_id: selectedEmpresa.id,
                file: companyBackupRestoreFile,
            });
            setCompanyBackupRestorePreflight(data.restore_preflight);
            setCompanyBackupInternalArtifacts((prev) => {
                const currentItems = Array.isArray(prev?.items) ? prev.items : [];
                return {
                    ...(prev || {}),
                    empresa: data.restore_preflight?.empresa,
                    retention_days: prev?.retention_days ?? 30,
                    restored_cleanup_days: prev?.restored_cleanup_days ?? 7,
                    items: [data.internal_safety_backup, ...currentItems],
                };
            });
            await loadCompanyBackupInternalArtifacts();
        } catch (error) {
            const detail = error?.response?.data?.detail;
            setCompanyBackupError(detail?.message || 'No se pudo crear la copia automatica previa.');
        } finally {
            setCompanyBackupPreparingInternal(false);
        }
    }, [companyBackupRestoreFile, isSuperAdmin, loadCompanyBackupInternalArtifacts, selectedEmpresa?.id]);

    const handleCompanyBackupExecuteRestore = useCallback(async () => {
        if (!isSuperAdmin) {
            setCompanyBackupError('Solo superadministradores pueden ejecutar restauraciones.');
            return;
        }
        if (!selectedEmpresa?.id) {
            setCompanyBackupError('Seleccione una empresa antes de restaurar.');
            return;
        }
        if (!companyBackupRestoreFile) {
            setCompanyBackupError('Seleccione el archivo .giproybackup que ya fue validado.');
            return;
        }
        if (!companyBackupRestorePreflight?.restorable) {
            setCompanyBackupError('Valide primero una copia restaurable de la misma empresa.');
            return;
        }

        setCompanyBackupRestoring(true);
        setCompanyBackupError('');
        setCompanyBackupRestoreResult(null);
        try {
            const data = await companyBackupsApi.executeRestore({
                empresa_id: selectedEmpresa.id,
                file: companyBackupRestoreFile,
                confirm_phrase: companyBackupRestoreConfirmation,
            });
            setCompanyBackupRestoreResult(data);
            setCompanyBackupRestorePreflight(null);
            setCompanyBackupRestoreFile(null);
            setCompanyBackupSelectedArtifactId('');
            setCompanyBackupRestoreConfirmation('');
            await loadCompanyBackupInternalArtifacts();
            await loadCompanyBackupPreflight();
        } catch (error) {
            const detail = error?.response?.data?.detail;
            setCompanyBackupError(detail?.message || 'No se pudo ejecutar la restauracion destructiva.');
        } finally {
            setCompanyBackupRestoring(false);
        }
    }, [
        companyBackupRestoreConfirmation,
        companyBackupRestoreFile,
        companyBackupRestorePreflight?.restorable,
        isSuperAdmin,
        loadCompanyBackupInternalArtifacts,
        loadCompanyBackupPreflight,
        selectedEmpresa?.id,
    ]);

    const handleCompanyBackupExecuteInternalRestore = useCallback(async () => {
        if (!isSuperAdmin) {
            setCompanyBackupError('Solo superadministradores pueden restaurar copias internas.');
            return;
        }
        if (!selectedEmpresa?.id) {
            setCompanyBackupError('Seleccione una empresa antes de restaurar una copia interna.');
            return;
        }
        if (!companyBackupInternalRestoreTarget?.id) {
            setCompanyBackupError('Seleccione una copia interna disponible.');
            return;
        }

        setCompanyBackupRestoring(true);
        setCompanyBackupError('');
        setCompanyBackupRestoreResult(null);
        try {
            const data = await companyBackupsApi.executeInternalArtifactRestore({
                empresa_id: selectedEmpresa.id,
                internal_artifact_id: companyBackupInternalRestoreTarget.id,
                confirm_phrase: companyBackupRestoreConfirmation,
            });
            setCompanyBackupRestoreResult(data);
            setCompanyBackupInternalRestoreTarget(null);
            setCompanyBackupSelectedArtifactId('');
            setCompanyBackupRestoreConfirmation('');
            await loadCompanyBackupInternalArtifacts();
            await loadCompanyBackupPreflight();
        } catch (error) {
            const detail = error?.response?.data?.detail;
            setCompanyBackupError(detail?.message || 'No se pudo restaurar la copia automatica interna.');
        } finally {
            setCompanyBackupRestoring(false);
        }
    }, [
        companyBackupInternalRestoreTarget?.id,
        companyBackupRestoreConfirmation,
        isSuperAdmin,
        loadCompanyBackupInternalArtifacts,
        loadCompanyBackupPreflight,
        selectedEmpresa?.id,
    ]);

    const getAvailableRoles = useCallback(() => {
        const roles = [];
        const isAdminQuotaFree = (miEmpresa?.total_administradores || 0) < (miEmpresa?.limite_administradores || 0);
        const isUserQuotaFree = (miEmpresa?.total_usuarios || 0) < (miEmpresa?.limite_usuarios || 0);

        if (isAdminQuotaFree) roles.push('administrador');
        if (isUserQuotaFree) roles.push('usuario', 'usuario_comunidad');
        return roles;
    }, [miEmpresa]);

    useEffect(() => {
        setLogoFile(null);
        setLogoPreview(null);
        setSearchTerm('');
        setShowCreateModal(false);
        setEditMode(false);
        setSelectedId(null);
    }, [activeTab]);

    useEffect(() => {
        if (requestedTab === 'empresas' && isSuperAdmin) {
            navigate('/admin-global/empresas', { replace: true });
            return;
        }
        if (requestedTab === 'superadmins' && isSuperAdmin) {
            navigate('/admin-global/superadministradores', { replace: true });
            return;
        }
        if (requestedTab === 'usuarios' && user?.rol !== 'usuario') {
            setActiveTab('usuarios');
        }
    }, [requestedTab, user?.rol, isSuperAdmin, navigate]);

    useEffect(() => {
        fetchData();
        fetchPaises();
    }, [fetchData, fetchPaises]);

    const handleToggleEmpresa = async (empresa) => {
        try {
            await empresasApi.update(empresa.id, { activa: !empresa.activa });
            fetchData();
        } catch {
            appAlert("Error al actualizar estado de empresa");
        }
    };

    const handleUpdatePreferencias = async (e) => {
        e.preventDefault();
        if (miEmpresa.use_omniclass === false && (!omniclassBreakAcknowledged || omniclassChangeReason.trim().length < 10)) {
            appAlert("Para desactivar OmniClass debe reconocer la ruptura estructural e indicar un motivo de al menos 10 caracteres.");
            return;
        }
        try {
            await empresasApi.update(miEmpresa.id, {
                decimales_moneda: miEmpresa.decimales_moneda,
                decimales_calculos: miEmpresa.decimales_calculos,
                use_omniclass: miEmpresa.use_omniclass,
                session_timeout_minutes: miEmpresa.session_timeout_minutes,
                omniclass_change_acknowledged: miEmpresa.use_omniclass === false ? omniclassBreakAcknowledged : false,
                omniclass_change_reason: miEmpresa.use_omniclass === false ? omniclassChangeReason.trim() : null,
            });
            appAlert("Preferencias guardadas correctamente. Se recomienda recargar la página para aplicar los cambios en todo el sistema.");
            fetchData();
        } catch {
            appAlert("Error al cargar datos");
        }
    };

    const handleEditEmpresa = (empresa) => {
        setEditMode(true);
        setSelectedId(empresa.id);
        setNewEmpresa({ ...empresa });
        setLogoPreview(resolveMediaUrl(empresa.logo_url));
        setShowCreateModal(true);
    };

    const handleDeleteEmpresa = (empresa) => {
        setEmpresaToDelete(empresa);
        setDeleteEmpresaStep(1);
        setShowDeleteEmpresaModal(true);
    };


    const handleDeleteEmpresaConfirm = async () => {
        if (!empresaToDelete) return;
        try {
            setDeletingEmpresa(true);
            await empresasApi.delete(empresaToDelete.id);
            setShowDeleteEmpresaModal(false);
            setDeleteEmpresaStep(1);
            setEmpresaToDelete(null);
            fetchData();
        } catch (error) {
            appAlert("Error al eliminar empresa: " + (error.response?.data?.detail || error.message));
        } finally {
            setDeletingEmpresa(false);
        }
    };

    const handleCreateEmpresa = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newEmpresa };
            const prefix = resolveCountryPhonePrefix(payload.pais);
            if (payload.telefono) {
                if (!isValidPhone(payload.telefono)) {
                    appAlert("El número de teléfono principal debe tener un formato válido.");
                    return;
                }
                payload.telefono = formatInternationalPhone(payload.telefono, prefix);
            }
            if (payload.contacto_telefono) {
                if (!isValidPhone(payload.contacto_telefono)) {
                    appAlert("El teléfono del contacto debe tener un formato válido.");
                    return;
                }
                payload.contacto_telefono = formatInternationalPhone(payload.contacto_telefono, prefix);
            }
            let empresaId = selectedId;
            if (editMode) {
                delete payload.ruc;
                delete payload.nombre;
                await empresasApi.update(selectedId, payload);
            } else {
                const empresa = await empresasApi.create(payload);
                empresaId = empresa.id;
            }

            if (logoFile) {
                const formData = new FormData();
                formData.append('file', logoFile);
                await empresasApi.uploadLogo(empresaId, formData);
            }

            setShowCreateModal(false);
            resetEmpresaForm();
            fetchData();
        } catch (error) {
            globalThis.reportClientError?.("Error al procesar empresa:", error);
            appAlert(error.response?.data?.detail || "Error al procesar empresa");
        }
    };

    const resetEmpresaForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setNewEmpresa({
            nombre: '', alias: '', ruc: '', codigo: '',
            direccion: '', localidad: '', canton: '', provincia: '', pais: '',
            telefono: '', email: '',
            contacto_nombre: '', contacto_email: '', contacto_telefono: '',
            logo_url: '',
            limite_administradores: 1, limite_usuarios: 1,
            decimales_moneda: 2, decimales_calculos: 4,
            use_omniclass: false,
            marketplace_can_sell: true,
            session_timeout_minutes: 30,
            proy_prefijo: '', proy_periodo: '', proy_secuencial: 1, proy_secuencial_size: 9,
            plantillas_config: {}
        });
        setLogoFile(null);
        setLogoPreview(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    }
    const handleCreateUsuario = async (e) => {
        e.preventDefault();

        if (!editMode && !newUsuario.acepta_politica_privacidad) {
            appAlert('Debe aceptar la política de privacidad para continuar');
            return;
        }

        if ((!editMode || newUsuario.password || newUsuario.confirmPassword) && newUsuario.password !== newUsuario.confirmPassword) {
            appAlert('Las contraseñas no coinciden');
            return;
        }

        try {
            const payload = buildUsuarioPayload(newUsuario);
            if (payload.movil) {
                if (!isValidPhone(payload.movil)) {
                    appAlert('El móvil debe tener un formato válido');
                    return;
                }
                payload.movil = formatInternationalPhone(payload.movil, resolveCountryPhonePrefix(payload.pais));
            }

            const empIdForOp = isSuperAdmin ? selectedEmpresa?.id : user?.empresa_id;
            const params = empIdForOp ? { empresa_id: empIdForOp } : {};

            if (editMode) {
                await usuariosApi.update(selectedId, payload, params);
            } else {
                await usuariosApi.create(payload, params);
            }
            setShowCreateModal(false);
            setNewUsuario(buildEmptyUsuarioForm());
            fetchData();
        } catch (error) {
            appAlert(error.response?.data?.detail || "Error al guardar Colaborador");
        }
    };

    const handleEditUsuario = (u) => {
        setEditMode(true);
        setSelectedId(u.id);
        setNewUsuario({
            ...u,
            ruc: u.ruc || '',
            nombres: u.nombres || '',
            apellidos: u.apellidos || '',
            alias: u.alias || '',
            nacionalidad: u.nacionalidad || '',
            profesion: u.profesion || '',
            ciudad: u.ciudad || '',
            provincia: u.provincia || '',
            canton: u.canton || '',
            pais: u.pais || '',
            movil: u.movil || '',
            password: '',
            confirmPassword: '',
        });
        setShowCreateModal(true);
    };

    useEffect(() => {
        if (requestedEditUser !== 'me') {
            marketplaceProfileEditHandledRef.current = false;
            return;
        }
        if (marketplaceProfileEditHandledRef.current) return;
        if (!user || user?.rol === 'usuario') return;

        if (isSuperAdmin) {
            navigate('/admin-global/superadministradores?edit_user=me', { replace: true });
            marketplaceProfileEditHandledRef.current = true;
            return;
        }

        setActiveTab('usuarios');
        handleEditUsuario({
            ...user,
            rol: user.rol || 'usuario',
            empresa_id: user.empresa_id || '',
        });
        marketplaceProfileEditHandledRef.current = true;
    }, [requestedEditUser, user, isSuperAdmin, navigate]);

    const handleDeleteUsuario = async (u) => {
        const role = (u.rol || '').toLowerCase();
        if (!['usuario', 'usuario_comunidad'].includes(role)) {
            appAlert("Solo se pueden eliminar usuarios colaboradores o de comunidad.");
            return;
        }

        const confirmed = await appConfirm({
            title: 'Eliminar Colaborador',
            message: '¿Está seguro de eliminar este colaborador?',
            confirmLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            tone: 'danger'
        });
        if (!confirmed) return;
        try {
            const empIdForOp = isSuperAdmin ? selectedEmpresa?.id : user?.empresa_id;
            const params = empIdForOp ? { empresa_id: empIdForOp } : {};
            await usuariosApi.delete(u.id, params);
            fetchData();
        } catch (error) {
            appAlert("Error al eliminar colaborador: " + (error.response?.data?.detail || error.message));
        }
    };

    const canAddPersonnel = () => {
        if (isSuperAdmin) return true;
        if (!licenseInfo) return false;

        const limit = licenseInfo.limites.usuarios;
        const used = licenseInfo.usados.usuarios;

        if (limit === -1) return true;
        return used < limit;
    };

    const filteredEmpresas = empresas.filter((empresa) =>
        includesNormalized(`${empresa.nombre || ''} ${empresa.alias || ''} ${empresa.ruc || ''} ${empresa.codigo || ''}`, searchTerm)
    );

    const filteredUsuarios = usuarios.filter((usuario) =>
        includesNormalized(`${usuario.nombre_completo || ''} ${usuario.email || ''} ${getCompanyDisplayName(usuario.empresa, '')}`, searchTerm)
    );
    const filteredCompanyUsers = filteredUsuarios.filter((usuario) => {
        const role = (usuario?.rol || '').toLowerCase();
        if (usuariosZone === 'admins') return role === 'administrador';
        if (usuariosZone === 'colaboradores') return role === 'usuario' || role === 'usuario_comunidad';
        if (usuariosZone === 'bloqueados') return usuario?.activo === false;
        return true;
    });
    const usuariosStats = {
        total: filteredUsuarios.length,
        admins: filteredUsuarios.filter((usuario) => (usuario?.rol || '').toLowerCase() === 'administrador').length,
        colaboradores: filteredUsuarios.filter((usuario) => ['usuario', 'usuario_comunidad'].includes((usuario?.rol || '').toLowerCase())).length,
        bloqueados: filteredUsuarios.filter((usuario) => usuario?.activo === false).length,
    };

    const filteredSuperadmins = usuarios.filter((usuario) => {
        const role = (usuario?.rol || '').toLowerCase();
        if (role !== 'superadministrador') return false;
        return includesNormalized(
            `${usuario.nombre_completo || ''} ${usuario.email || ''} ${getCompanyDisplayName(usuario.empresa, '')} ${usuario.alias || ''} ${usuario.profesion || ''}`,
            searchTerm
        );
    });

    const renderEmpresas = () => (
        <Card className="bg-white border-zinc-100 shadow-sm max-w-5xl mx-auto md:mx-0 overflow-hidden">
            <CardContent className="p-8">
                {/* Header Estándar Industrial Light */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#F39200] border border-orange-100">
                            <Building className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">Gestión de Empresas</h2>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Administración de Personas Jurídicas</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ClearSearchField
                            value={searchTerm || ''}
                            onValueChange={setSearchTerm}
                            placeholder="Buscar empresa..."
                            containerClassName="w-full md:w-64"
                            inputClassName="w-full pl-10 pr-10 h-12 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#F39200] transition-all"
                        />
                        <LiquidButton onClick={() => { resetEmpresaForm(); setShowCreateModal(true); }} className="!h-12 !px-6 bg-[#1A1A1A] text-white rounded-xl shadow-lg hover:shadow-zinc-200 transition-all">
                            <Plus className="w-4 h-4 mr-2" /> Nueva
                        </LiquidButton>
                    </div>
                </div>

                {/* Grid de Empresas Estilo Industrial */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredEmpresas.map(emp => (
                        <div key={emp.id} className="relative group bg-zinc-50/50 hover:bg-white border border-zinc-200/60 hover:border-orange-200 rounded-[2rem] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-900/5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-5">
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center overflow-hidden border-2 p-1 transition-all ${emp.activa ? 'bg-white border-orange-100' : 'bg-zinc-100 border-zinc-200 grayscale'}`}>
                                        {emp.logo_url ? (
                                            <img src={resolveMediaUrl(emp.logo_url)} alt={emp.nombre} className="w-full h-full object-contain rounded-2xl" />
                                        ) : (
                                            <Building className="w-7 h-7 text-zinc-300" />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-sm uppercase tracking-tight text-[#1A1A1A]">{getCompanyDisplayName(emp)}</h3>
                                        {emp.alias ? (
                                            <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Legal: {emp.nombre}</p>
                                        ) : null}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{emp.ruc || 'SIN RUC'}</span>
                                            <div className="w-1 h-1 rounded-full bg-zinc-300" />
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${emp.activa ? 'text-green-600' : 'text-red-600'}`}>
                                                {emp.activa ? 'Activa' : 'Inactiva'}
                                            </span>
                                            <div className="w-1 h-1 rounded-full bg-zinc-300" />
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${emp.marketplace_can_sell ? 'text-amber-600' : 'text-zinc-400'}`}>
                                                {emp.marketplace_can_sell ? 'Vende' : 'Venta bloqueada'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 -mr-2">
                                    <ProjectSectionIconButton
                                        icon={Edit2}
                                        label="Editar empresa"
                                        onClick={() => handleEditEmpresa(emp)}
                                        className="hover:text-[#F39200]"
                                    />
                                    <ProjectSectionIconButton
                                        icon={Trash2}
                                        label="Eliminar empresa"
                                        onClick={() => handleDeleteEmpresa(emp)}
                                        className="hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-zinc-200/60 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-[#1A1A1A] leading-tight">{emp.total_usuarios || 0}</span>
                                        <span className="text-[7px] font-bold uppercase text-zinc-400 tracking-widest">Colaboradores</span>
                                    </div>
                                    <div className="w-px h-6 bg-zinc-200" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-[#1A1A1A] leading-tight">{emp.total_administradores || 0}</span>
                                        <span className="text-[7px] font-bold uppercase text-zinc-400 tracking-widest">Admins</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleToggleEmpresa(emp)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${emp.activa ? 'bg-white border-zinc-100 text-zinc-400 hover:border-red-100 hover:text-red-500' : 'bg-green-500 border-green-500 text-white hover:bg-green-600'}`}
                                >
                                    <Power className="w-3.5 h-3.5" />
                                    {emp.activa ? 'Suspender' : 'Activar'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );

    const renderUsuarios = () => {
        // SEGURIDAD: Solo Administradores y Superadministradores pueden ver esta pestaña
        if ((user?.rol || '').toLowerCase() !== 'administrador' && !isSuperAdmin) {
            return (
                <div className="p-20 text-center">
                    <Users className="w-16 h-16 mx-auto text-zinc-200 mb-6" />
                    <h2 className="text-xl font-black uppercase text-zinc-900">Acceso Restringido</h2>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-2">No tienes permisos para gestionar el personal de la empresa.</p>
                </div>
            );
        }

        if (isSuperAdmin && !selectedEmpresa?.id) {
            return (
                <Card className="bg-white border-zinc-100 shadow-sm max-w-5xl mx-auto md:mx-0 overflow-hidden">
                    <CardContent className="p-10">
                        <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center" data-settings-users-tenant-lock="true">
                            <Users className="mx-auto h-12 w-12 text-zinc-300" />
                            <h2 className="mt-5 text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Usuarios de empresa</h2>
                            <p className="mx-auto mt-2 max-w-md text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                                Selecciona una empresa activa para gestionar sus usuarios.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card className="bg-white border-zinc-100 shadow-sm max-w-5xl mx-auto md:mx-0 overflow-hidden" data-settings-company-zone="usuarios-empresa">
                <CardContent className="p-8">
                    {/* Header Estándar Industrial Light */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">Usuarios Empresa</h2>
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1 bg-zinc-100 rounded-full border border-zinc-200 flex items-center gap-2">
                                            <span className="text-[8px] font-black text-zinc-400">ADM</span>
                                            <span className="text-[10px] font-black text-zinc-700">{miEmpresa?.total_administradores || 0}/{miEmpresa?.limite_administradores || 0}</span>
                                        </div>
                                        <div className="px-3 py-1 bg-blue-50 rounded-full border border-blue-100 flex items-center gap-2">
                                            <span className="text-[8px] font-black text-blue-400">COLAB</span>
                                            <span className="text-[10px] font-black text-blue-700">{miEmpresa?.total_usuarios || 0}/{miEmpresa?.limite_usuarios || 0}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Empresa activa y roles permitidos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ClearSearchField
                                value={searchTerm || ''}
                                onValueChange={setSearchTerm}
                                placeholder="Buscar personal..."
                                containerClassName="w-full md:w-64"
                                searchIconClassName="group-focus-within:text-blue-600"
                                inputClassName="w-full pl-10 pr-10 h-12 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-blue-600 transition-all"
                            />
                            {canAddPersonnel() && getAvailableRoles().length > 0 && (
                                <LiquidButton onClick={() => {
                                    const available = getAvailableRoles();
                                    setEditMode(false);
                                    setSelectedId(null);
                                    setNewUsuario(buildEmptyUsuarioForm(available[0] || 'usuario'));
                                    setShowCreateModal(true);
                                }} className="!h-12 !px-6 bg-[#1A1A1A] text-white rounded-xl shadow-lg hover:shadow-zinc-200 transition-all">
                                    <Plus className="w-4 h-4 mr-2" /> Añadir
                                </LiquidButton>
                            )}
                        </div>
                    </div>

                    <div className="mb-6 grid gap-3 md:grid-cols-4" data-settings-users-summary="empresa-activa">
                        {[
                            ['Total', usuariosStats.total],
                            ['Administradores', usuariosStats.admins],
                            ['Colaboradores', usuariosStats.colaboradores],
                            ['Bloqueados', usuariosStats.bloqueados],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400">{label}</p>
                                <p className="mt-1 text-xl font-black text-[#1A1A1A]">{value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2" data-settings-users-tabs="empresa">
                        {USER_SETTINGS_ZONES.map((zone) => {
                            const active = usuariosZone === zone.id;
                            return (
                                <button
                                    key={zone.id}
                                    type="button"
                                    onClick={() => setUsuariosZone(zone.id)}
                                    className={`inline-flex min-h-[38px] items-center rounded-xl px-4 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${active ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-zinc-500 hover:bg-white hover:text-[#1A1A1A]'}`}
                                >
                                    {zone.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="border border-zinc-200/60 rounded-[2rem] overflow-hidden bg-zinc-50/30">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-50 border-b border-zinc-200/60">
                                <tr>
                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Identificación / Nombre</th>
                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Contacto</th>
                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 text-center">Nivel de Acceso</th>
                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 text-center">Estado</th>
                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200/60">
                                {filteredCompanyUsers.length > 0 ? filteredCompanyUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-white transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-[11px] font-black text-[#1A1A1A] uppercase">
                                                    {(u.nombre_completo || 'U').split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-black uppercase text-[#1A1A1A]">{u.nombre_completo}</span>
                                                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{u.empresa?.nombre || 'Independiente'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-bold text-zinc-600">{u.email}</span>
                                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">ID: {String(u.id).substring(0, 8)}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border-2 ${(u.rol || '').toLowerCase() === 'superadministrador' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                                                (u.rol || '').toLowerCase() === 'administrador' ? 'bg-orange-50 border-orange-100 text-[#F39200]' :
                                                    'bg-blue-50 border-blue-100 text-blue-700'
                                                }`}>
                                                {(u.rol || '').toLowerCase() === 'usuario' ? 'Colaborador' : u.rol}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex justify-center">
                                                {u.activo ? (
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded-lg">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Activo</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-lg grayscale">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                        <span className="text-[8px] font-black text-red-700 uppercase tracking-widest">Bloqueado</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <ProjectSectionIconButton
                                                    icon={Edit2}
                                                    label="Editar usuario"
                                                    onClick={() => handleEditUsuario(u)}
                                                    className="hover:text-[#136191]"
                                                />
                                                {['usuario', 'usuario_comunidad'].includes((u.rol || '').toLowerCase()) && user?.id !== u.id && (
                                                    <ProjectSectionIconButton
                                                        icon={Trash2}
                                                        label="Eliminar usuario"
                                                        onClick={() => handleDeleteUsuario(u)}
                                                        className="hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-12 text-center">
                                            <Users className="mx-auto h-10 w-10 text-zinc-200" />
                                            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Sin usuarios en esta vista</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        )
    };

    const renderSuperadmins = () => {
        if (!isSuperAdmin) {
            return (
                <div className="p-20 text-center">
                    <ShieldIcon className="w-16 h-16 mx-auto text-zinc-200 mb-6" />
                    <h2 className="text-xl font-black uppercase text-zinc-900">Acceso Restringido</h2>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-2">Solo superadministración puede operar cuentas globales.</p>
                </div>
            );
        }

        return (
            <Card className="bg-white border-zinc-100 shadow-sm max-w-5xl mx-auto md:mx-0 overflow-hidden">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-700 border border-violet-100">
                                <ShieldIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">Superadministradores migrados</h2>
                                    <div className="px-3 py-1 bg-violet-50 rounded-full border border-violet-100 flex items-center gap-2">
                                        <span className="text-[8px] font-black text-violet-500">SUPERADMIN</span>
                                        <span className="text-[10px] font-black text-violet-700">{filteredSuperadmins.length}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gestión exclusiva de cuentas superadministradoras</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ClearSearchField
                                value={searchTerm || ''}
                                onValueChange={setSearchTerm}
                                placeholder="Buscar superadministrador..."
                                containerClassName="w-full md:w-80"
                                inputClassName="w-full pl-10 pr-10 h-12 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-violet-600 transition-all"
                            />
                        </div>
                    </div>

                    <div className="mb-8 rounded-[2rem] border border-violet-100 bg-[linear-gradient(135deg,rgba(245,243,255,0.95),rgba(255,255,255,0.96))] p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600">Gobierno global</p>
                        <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-[#1A1A1A]">Operación crítica centralizada</h3>
                        <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-zinc-600">
                            Esta superficie concentra las cuentas con privilegio máximo del sistema. Solo el rol <strong>Superadministrador</strong> puede ver, editar y mantener este listado.
                        </p>
                    </div>

                    <div className="border border-zinc-200/60 rounded-[2rem] overflow-hidden bg-zinc-50/30">
                        {filteredSuperadmins.length === 0 ? (
                            <div className="p-16 text-center">
                                <ShieldIcon className="mx-auto h-12 w-12 text-zinc-200" />
                                <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-zinc-400">Sin superadministradores para este filtro</p>
                            </div>
                        ) : (
                        <table className="w-full text-left">
                            <thead className="bg-zinc-50 border-b border-zinc-200/60">
                                <tr>
                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Cuenta</th>
                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Contacto</th>
                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 text-center">Ámbito</th>
                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 text-center">Estado</th>
                                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200/60">
                                {filteredSuperadmins.map((u) => (
                                    <tr key={u.id} className="hover:bg-white transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-100 shadow-sm flex items-center justify-center text-[11px] font-black text-violet-700 uppercase">
                                                    {(u.nombre_completo || 'S').split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-black uppercase text-[#1A1A1A]">{u.nombre_completo}</span>
                                                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{u.alias || 'Sin alias'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-bold text-zinc-600">{u.email}</span>
                                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{u.movil || 'Sin móvil'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex justify-center">
                                                <span className="px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border-2 bg-violet-50 border-violet-100 text-violet-700">
                                                    {u.empresa?.nombre || 'Global'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex justify-center">
                                                {u.activo ? (
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded-lg">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Activo</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-lg grayscale">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                        <span className="text-[8px] font-black text-red-700 uppercase tracking-widest">Bloqueado</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <ProjectSectionIconButton
                                                    icon={Edit2}
                                                    label="Editar superadministrador"
                                                    onClick={() => handleEditUsuario({ ...u, rol: 'Superadministrador' })}
                                                    className="hover:border-violet-200 hover:text-violet-700"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderPreferencias = () => (
        <Card className="bg-white border-zinc-100 shadow-sm max-w-2xl mx-auto md:mx-0" data-settings-company-zone="preferencias-empresa">
            <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#F39200]">
                        <SettingsIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Preferencias Empresa</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Precision, sesion y clasificacion</p>
                    </div>
                </div>

                <form onSubmit={handleUpdatePreferencias} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-1">Decimales de Moneda</Label>
                            <p className="text-[10px] text-zinc-400 font-medium ml-1 leading-relaxed">Se aplicará a todos los valores financieros ($).</p>
                            <Input
                                type="number" min="0" max="6"
                                value={miEmpresa?.decimales_moneda || 2}
                                onChange={e => setMiEmpresa({ ...miEmpresa, decimales_moneda: parseInt(e.target.value) || 0 })}
                                className="h-14 rounded-2xl bg-zinc-50 border-zinc-200 text-lg font-black text-center focus:ring-[#F39200]"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-1">Decimales de Cálculos</Label>
                            <p className="text-[10px] text-zinc-400 font-medium ml-1 leading-relaxed">Se aplicará a unidades, rendimientos y factores técnicos.</p>
                            <Input
                                type="number" min="0" max="8"
                                value={miEmpresa?.decimales_calculos || 4}
                                onChange={e => setMiEmpresa({ ...miEmpresa, decimales_calculos: parseInt(e.target.value) || 0 })}
                                className="h-14 rounded-2xl bg-zinc-50 border-zinc-200 text-lg font-black text-center focus:ring-[#F39200]"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[11px] uppercase font-black tracking-widest text-zinc-500 ml-1">Tiempo de Sesión (Minutos)</Label>
                            <p className="text-[10px] text-zinc-400 font-medium ml-1 leading-relaxed">Cierre automático tras inactividad (Defecto: 30).</p>
                            <Input
                                type="number" min="1" max="1440"
                                value={miEmpresa?.session_timeout_minutes || 30}
                                onChange={e => setMiEmpresa({ ...miEmpresa, session_timeout_minutes: parseInt(e.target.value) || 30 })}
                                className="h-14 rounded-2xl bg-zinc-50 border-zinc-200 text-lg font-black text-center focus:ring-[#F39200]"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <div className="flex items-start gap-4 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                                <Checkbox
                                    id="use_omniclass"
                                    checked={miEmpresa?.use_omniclass !== false}
                                    onCheckedChange={(checked) => {
                                        const enabled = checked === true;
                                        setMiEmpresa({ ...miEmpresa, use_omniclass: enabled });
                                        if (enabled) { setOmniclassBreakAcknowledged(false); setOmniclassChangeReason(''); }
                                    }}
                                    className="mt-1 data-[state=checked]:bg-[#F39200] data-[state=checked]:border-[#F39200]"
                                />
                                <div className="space-y-1">
                                    <Label htmlFor="use_omniclass" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 cursor-pointer">
                                        Uso de OmniClass
                                    </Label>
                                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                                        Si se desactiva, GiProy conserva los códigos de origen pero deja de resolver la estructura común en catálogos, APUs, presupuesto, Gantt y modelos coordinados.
                                    </p>
                                    {miEmpresa?.use_omniclass === false ? (
                                        <div className="mt-3 border border-amber-300 bg-amber-50 p-3 text-[10px] font-semibold leading-relaxed text-amber-950" role="alert">
                                            <div className="flex gap-2">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                            <span>Ruptura estructural activa: presupuesto, planificación y modelos digitales pueden usar clasificaciones incompatibles. Los vínculos se conservarán, pero no podrán considerarse plenamente coordinados.</span>
                                            </div>
                                            <label className="mt-3 flex items-start gap-2 normal-case tracking-normal"><Checkbox checked={omniclassBreakAcknowledged} onCheckedChange={(checked) => setOmniclassBreakAcknowledged(checked === true)} className="mt-0.5" /><span>Comprendo que Presupuesto, Gantt y los modelos digitales dejarán de compartir una clasificación contractual común.</span></label>
                                            <Label htmlFor="omniclass-change-reason" className="mt-3 block text-[10px] font-bold text-amber-950">Motivo de desactivación</Label>
                                            <textarea id="omniclass-change-reason" value={omniclassChangeReason} onChange={(event) => setOmniclassChangeReason(event.target.value)} rows={3} className="mt-1 w-full resize-none rounded-lg border border-amber-300 bg-white p-2 text-xs font-medium text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600" placeholder="Explique por qué el proyecto operará sin coordinación OmniClass" />
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                        <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <p className="text-[10px] text-blue-700 font-bold uppercase tracking-tight leading-relaxed">
                            Los cambios en la precisión decimal afectarán la visualización de datos de forma inmediata en toda la plataforma.
                        </p>
                    </div>

                    <LiquidButton type="submit" disabled={miEmpresa?.use_omniclass === false && (!omniclassBreakAcknowledged || omniclassChangeReason.trim().length < 10)} className="w-full !h-14 bg-[#F39200] text-white text-xs font-black uppercase tracking-[0.2em] disabled:opacity-50">
                        Guardar Preferencias
                    </LiquidButton>
                </form>
            </CardContent>
        </Card>
    );

    const handleUpdatePlantillasConfig = async (e) => {
        e.preventDefault();

        const saveConfig = async (target, id, config) => {
            try {
                if (target === 'empresa') {
                    await empresasApi.update(id, { plantillas_config: config });
                } else {
                    await proyectosApi.update(id, { plantillas_config: config });
                }
                appAlert("Configuración de plantillas guardada correctamente.");
                fetchData();
            } catch {
                appAlert(`Error al actualizar configuración de plantillas en ${target}`);
            }
        };

        const configToSave = activeProject ? activeProject.plantillas_config : miEmpresa.plantillas_config;

        if (activeProject) {
            const choice = await appConfirm({
                title: 'Guardar configuración de plantillas',
                message:
                    `Se ha detectado el proyecto activo: ${activeProject.nombre}.\n\n` +
                    `¿Desea guardar estos ajustes solo para este proyecto?\n\n` +
                    `[Guardar proyecto] -> Guardar solo para este proyecto\n` +
                    `[Guardar empresa] -> Guardar como configuración BASE de la empresa`,
                confirmLabel: 'Guardar proyecto',
                cancelLabel: 'Guardar empresa',
                tone: 'info'
            });

            if (choice) {
                await saveConfig('proyecto', activeProject.id, configToSave);
            } else {
                await saveConfig('empresa', miEmpresa.id, configToSave);
            }
        } else {
            await saveConfig('empresa', miEmpresa.id, miEmpresa.plantillas_config);
        }
    };

    const handleUpdateProyectoConfig = async (e) => {
        e.preventDefault();
        try {
            await empresasApi.update(miEmpresa.id, {
                proy_prefijo: miEmpresa.proy_prefijo,
                proy_periodo: miEmpresa.proy_periodo,
                proy_secuencial: miEmpresa.proy_secuencial,
                proy_secuencial_size: miEmpresa.proy_secuencial_size
            });
            appAlert("Configuración de proyecto guardada correctamente.");
            fetchData();
        } catch {
            appAlert("Error al actualizar configuración de proyecto");
        }
    };

    const handleUpdateMiEmpresa = async (e) => {
        e.preventDefault();
        try {
            if (!miEmpresa) return;
            const empId = miEmpresa.id;

            // Filtrar solo campos editables para el backend para evitar errores con campos calculados
            const updateData = {
                alias: miEmpresa.alias,
                codigo: miEmpresa.codigo,
                direccion: miEmpresa.direccion,
                localidad: miEmpresa.localidad,
                canton: miEmpresa.canton,
                provincia: miEmpresa.provincia,
                pais: miEmpresa.pais,
                telefono: miEmpresa.telefono,
                email: miEmpresa.email,
                contacto_nombre: miEmpresa.contacto_nombre,
                contacto_email: miEmpresa.contacto_email,
                contacto_telefono: miEmpresa.contacto_telefono,
                decimales_moneda: miEmpresa.decimales_moneda,
                decimales_calculos: miEmpresa.decimales_calculos
            };

            // Solo el superadmin puede editar cuotas y timeout.
            if (user?.rol === 'Superadministrador') {
                updateData.session_timeout_minutes = miEmpresa.session_timeout_minutes;
            }
            if (user?.rol === 'Superadministrador') {
                updateData.limite_administradores = miEmpresa.limite_administradores;
                updateData.limite_usuarios = miEmpresa.limite_usuarios;
            }

            // Validación y formateo telefónico (TASK-0148)
            if (!isValidPhone(miEmpresa.telefono)) {
                appAlert("El número de teléfono es obligatorio y debe tener un formato válido.");
                return;
            }

            const selectedCountryObj = paises.find(p => p.nombre === miEmpresa.pais);
            const prefix = selectedCountryObj?.prefijo || resolveCountryPhonePrefix(miEmpresa.pais);
            updateData.telefono = formatInternationalPhone(miEmpresa.telefono, prefix);
            if (updateData.contacto_telefono) {
                if (!isValidPhone(updateData.contacto_telefono)) {
                    appAlert("El teléfono del contacto debe tener un formato válido.");
                    return;
                }
                updateData.contacto_telefono = formatInternationalPhone(updateData.contacto_telefono, prefix);
            }

            await empresasApi.update(empId, updateData);

            if (logoFile) {
                const formData = new FormData();
                formData.append('file', logoFile);
                await empresasApi.uploadLogo(empId, formData);
            }

            appAlert("Datos de la empresa actualizados correctamente.");

            // Si es superadmin, actualizar la lista general tambien
            if (user?.rol === 'Superadministrador') {
                const data = await empresasApi.getAll();
                setEmpresas(data);
                // Actualizar la empresa seleccionada en el estado si es la misma
                if (selectedEmpresa?.id === empId) {
                    const updated = data.find(e => e.id === empId);
                    if (updated) setSelectedEmpresa(updated);
                }
            }

            fetchData();
        } catch (error) {
            globalThis.reportClientError?.("Error al actualizar empresa:", error);
            appAlert("Error al actualizar datos de la empresa");
        }
    };

    const renderCompanyBackupPanel = () => {
        const role = (user?.rol || '').toLowerCase();
        if (role !== 'administrador' && role !== 'superadministrador') return null;

        const counts = companyBackupPreflight?.counts || {};
        const fileReferences = companyBackupPreflight?.file_references || [];
        const availableInternalArtifacts = (companyBackupInternalArtifacts?.items || []).filter((item) => item.status === 'available');
        const isRestoreConfirmationReady = (
            companyBackupRestorePreflight?.restorable
            && companyBackupRestoreFile
            && companyBackupRestoreConfirmation === 'CONFIRMO IMPORTACION'
        );
        const isInternalRestoreConfirmationReady = (
            companyBackupInternalRestoreTarget?.id
            && companyBackupRestoreConfirmation === 'CONFIRMO IMPORTACION'
        );
        const visibleCounts = [
            ['Proyectos', counts.proyectos_total],
            ['Proyectos papelera', counts.proyectos_papelera],
            ['Bases', counts.bases_total],
            ['Bases papelera', counts.bases_papelera],
            ['Presupuestos', counts.presupuestos],
            ['APUs', counts.apus],
            ['Recursos', counts.recursos],
            ['Comunidad', counts.community_posts],
            ['Adjuntos', counts.community_attachments],
            ['Marketplace propios', counts.marketplace_seller_products],
        ].filter(([, value]) => Number.isFinite(Number(value)));

        return (
            <div className="rounded-[2rem] border border-amber-100 bg-amber-50/45 p-6" data-settings-company-zone="backup-restore-empresa">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-700">Empresa completa 1:1</p>
                        <h4 className="mt-2 text-lg font-black tracking-tight text-[#1A1A1A]">Backup Empresa / Restore Empresa</h4>
                        <p className="mt-1 max-w-2xl text-xs font-semibold leading-relaxed text-zinc-500">
                            Copia y restauracion completas de empresa. Incluye papelera, Comunidad y archivos referenciados.
                        </p>
                    </div>
                    <div className="inline-flex rounded-2xl border border-zinc-200 bg-white p-1" data-settings-backup-tabs="empresa">
                        {[
                            ['backup', 'Backup Empresa'],
                            ['restore', 'Restore Empresa'],
                        ].map(([zone, label]) => (
                            <button
                                key={zone}
                                type="button"
                                onClick={() => setCompanyBackupZone(zone)}
                                className={`min-h-[38px] rounded-xl px-4 text-[10px] font-black uppercase tracking-[0.16em] transition-colors ${companyBackupZone === zone ? 'bg-[#1A1A1A] text-white' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {companyBackupZone === 'backup' && (
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={loadCompanyBackupPreflight}
                            disabled={companyBackupLoading || companyBackupExporting}
                            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw className={`h-4 w-4 ${companyBackupLoading ? 'animate-spin' : ''}`} />
                            Validar Backup
                        </button>
                        <button
                            type="button"
                            onClick={handleCompanyBackupExport}
                            disabled={companyBackupLoading || companyBackupExporting || (companyBackupPreflight && !companyBackupPreflight.exportable)}
                            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-600 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {companyBackupExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                            Backup Empresa
                        </button>
                    </div>
                )}

                {companyBackupError && (
                    <div className="mt-5 rounded-2xl border border-red-100 bg-white px-4 py-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                            <p className="text-xs font-bold leading-relaxed text-red-600">{companyBackupError}</p>
                        </div>
                    </div>
                )}

                {(companyBackupZone === 'backup' || companyBackupZone === 'restore') && (
                    <div className="mt-5 space-y-4">
                        {companyBackupZone === 'backup' && companyBackupPreflight && (
                        <>
                        <div className={`rounded-2xl border px-4 py-4 ${companyBackupPreflight.exportable ? 'border-emerald-100 bg-white' : 'border-red-100 bg-white'}`}>
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-3">
                                    {companyBackupPreflight.exportable ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-red-500" />
                                    )}
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Estado preflight</p>
                                        <p className={`text-sm font-black uppercase tracking-tight ${companyBackupPreflight.exportable ? 'text-emerald-700' : 'text-red-600'}`}>
                                            {companyBackupPreflight.exportable ? 'Sin bloqueos de integridad' : 'Bloqueado por integridad'}
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                    Operacion #{companyBackupPreflight.operation_id}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                            {visibleCounts.map(([label, value]) => (
                                <div key={label} className="rounded-2xl border border-amber-100 bg-white px-3 py-3">
                                    <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">{label}</p>
                                    <p className="mt-1 text-lg font-black text-[#1A1A1A]">{value ?? 0}</p>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-2xl border border-zinc-100 bg-white px-4 py-4">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#136191]" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Politica</p>
                                    <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-500">
                                        Las compras Marketplace se preservan; articulos propios fuera del backup se cancelaran/despublicaran con auditoria solo superadministrador en fases posteriores.
                                    </p>
                                </div>
                            </div>
                        </div>

                        </>
                        )}

                        {companyBackupZone === 'backup' && fileReferences.length > 0 && (
                            <div className="rounded-2xl border border-zinc-100 bg-white px-4 py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Archivos referenciados</p>
                                <p className="mt-1 text-xs font-semibold text-zinc-500">
                                    {fileReferences.length} referencia(s) revisada(s); {fileReferences.filter(item => !item.exists).length} bloqueada(s).
                                </p>
                            </div>
                        )}

                        {companyBackupZone === 'backup' && companyBackupLastExport && (
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Ultima copia generada</p>
                                <p className="mt-1 break-all text-xs font-semibold text-emerald-800">
                                    Operacion #{companyBackupLastExport.operationId || 'registrada'} · {companyBackupLastExport.filename}
                                </p>
                                {companyBackupLastExport.backupHash && (
                                    <p className="mt-1 break-all text-[10px] font-bold text-emerald-700">
                                        Hash: {companyBackupLastExport.backupHash}
                                    </p>
                                )}
                            </div>
                        )}

                        {companyBackupZone === 'restore' && (
                        <div className="rounded-2xl border border-sky-100 bg-white px-4 py-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">Validacion Restore</p>
                                    <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-500">
                                        Valida formato, cifrado, hash, misma empresa, Comunidad, papelera y Marketplace. No restaura ni borra datos.
                                    </p>
                                    <input
                                        type="file"
                                        accept=".giproybackup"
                                        onChange={(event) => {
                                            const file = event.target.files?.[0] || null;
                                            setCompanyBackupRestoreFile(file);
                                            setCompanyBackupRestorePreflight(null);
                                            setCompanyBackupRestoreResult(null);
                                            setCompanyBackupSelectedArtifactId('');
                                        }}
                                        className="mt-3 block w-full text-xs font-semibold text-zinc-600 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-[10px] file:font-black file:uppercase file:tracking-[0.14em] file:text-sky-700"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCompanyBackupRestorePreflight}
                                    disabled={companyBackupRestoreLoading || !companyBackupRestoreFile}
                                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-700 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {companyBackupRestoreLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                    Validar copia
                                </button>
                            </div>
                        </div>
                        )}

                        {companyBackupZone === 'restore' && companyBackupRestorePreflight && (
                            <div className={`rounded-2xl border px-4 py-4 ${companyBackupRestorePreflight.restorable ? 'border-emerald-100 bg-emerald-50' : 'border-red-100 bg-red-50'}`}>
                                <div className="flex items-start gap-3">
                                    {companyBackupRestorePreflight.restorable ? (
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700" />
                                    ) : (
                                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                            {companyBackupRestorePreflight.restorable ? 'Copia valida para esta empresa' : 'Copia bloqueada'}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-600">
                                            Empresa copia: {companyBackupRestorePreflight.backup_empresa?.nombre || 'No identificada'} · Fecha: {companyBackupRestorePreflight.backup_created_at || 'Sin fecha'}
                                        </p>
                                        <p className="mt-1 break-all text-[10px] font-bold text-zinc-500">
                                            Hash: {companyBackupRestorePreflight.backup_hash || 'No disponible'}
                                        </p>
                                        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                                            <div className="rounded-xl bg-white/80 px-3 py-2">
                                                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">Proyectos copia</p>
                                                <p className="text-base font-black text-zinc-900">{companyBackupRestorePreflight.backup_counts?.proyectos_total ?? 0}</p>
                                            </div>
                                            <div className="rounded-xl bg-white/80 px-3 py-2">
                                                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">Proyectos actuales</p>
                                                <p className="text-base font-black text-zinc-900">{companyBackupRestorePreflight.current_counts?.proyectos_total ?? 0}</p>
                                            </div>
                                            <div className="rounded-xl bg-white/80 px-3 py-2">
                                                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">Comunidad copia</p>
                                                <p className="text-base font-black text-zinc-900">{companyBackupRestorePreflight.backup_counts?.community_posts ?? 0}</p>
                                            </div>
                                            <div className="rounded-xl bg-white/80 px-3 py-2">
                                                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">Archivos</p>
                                                <p className="text-base font-black text-zinc-900">{companyBackupRestorePreflight.file_count ?? 0}</p>
                                            </div>
                                        </div>
                                        {companyBackupRestorePreflight.blockers?.length > 0 && (
                                            <ul className="mt-3 space-y-1">
                                                {companyBackupRestorePreflight.blockers.map((blocker) => (
                                                    <li key={blocker} className="text-xs font-bold text-red-700">{blocker}</li>
                                                ))}
                                            </ul>
                                        )}
                                        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                            Restore Empresa: bloquea copias de otra empresa y crea copia automatica interna al confirmar.
                                        </p>
                                        {isSuperAdmin && companyBackupRestorePreflight.restorable && (
                                            <div className="mt-4 space-y-4">
                                                <div className="rounded-2xl border border-amber-200 bg-white px-4 py-4">
                                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Copia automatica interna</p>
                                                            <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-500">
                                                                Se crea automaticamente al confirmar Restore Empresa. No requiere accion previa del usuario.
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleCompanyBackupPrepareInternalSafety}
                                                            disabled={companyBackupPreparingInternal}
                                                            className="hidden"
                                                        >
                                                            {companyBackupPreparingInternal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                                                            Automatico al confirmar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="rounded-2xl border border-red-200 bg-white px-4 py-4">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-700">Confirmacion final</p>
                                                        <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-500">
                                                            Esta accion borra los datos restaurables actuales y los reemplaza por la copia. Marketplace conserva compras; ventas propias no presentes en la copia se cancelan y quedan solo para auditoria/superadministrador.
                                                        </p>
                                                    </div>
                                                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                                        <label className="hidden">
                                                            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">Copia interna previa</span>
                                                            <select
                                                                value={companyBackupSelectedArtifactId}
                                                                onChange={(event) => setCompanyBackupSelectedArtifactId(event.target.value)}
                                                                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 outline-none focus:border-red-400"
                                                            >
                                                                <option value="">Seleccione respaldo interno</option>
                                                                {availableInternalArtifacts.map((item) => (
                                                                    <option key={item.id} value={item.id}>
                                                                        #{item.id} · {formatBackupDateTime(item.created_at)} · {item.created_by_email || 'sin usuario'} · expira {formatBackupDateTime(item.expires_at)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>
                                                        <label className="hidden">
                                                            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">Confirmacion retirada</span>
                                                            <input
                                                                value=""
                                                                readOnly
                                                                placeholder=""
                                                                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 outline-none focus:border-red-400"
                                                            />
                                                        </label>
                                                        <label className="hidden">
                                                            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">Nombre exacto de empresa</span>
                                                            <input
                                                                value=""
                                                                readOnly
                                                                placeholder=""
                                                                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 outline-none focus:border-red-400"
                                                            />
                                                        </label>
                                                        <label className="hidden">
                                                            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">Email autenticado</span>
                                                            <input
                                                                value=""
                                                                readOnly
                                                                placeholder=""
                                                                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 outline-none focus:border-red-400"
                                                            />
                                                        </label>
                                                        <label className="block lg:col-span-2">
                                                            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">Escribe CONFIRMO IMPORTACION</span>
                                                            <input
                                                                value={companyBackupRestoreConfirmation}
                                                                onChange={(event) => setCompanyBackupRestoreConfirmation(event.target.value)}
                                                                placeholder="CONFIRMO IMPORTACION"
                                                                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 outline-none focus:border-red-400"
                                                            />
                                                        </label>
                                                    </div>
                                                    <div className="mt-5 flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={handleCompanyBackupExecuteRestore}
                                                            disabled={companyBackupRestoring || !isRestoreConfirmationReady}
                                                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-700 bg-red-700 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            {companyBackupRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                                                            Ejecutar Restore Empresa
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {companyBackupRestoreResult && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                                            Restauracion completada
                                        </p>
                                        <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-600">
                                            Operacion #{companyBackupRestoreResult.operation_id} · Hash {companyBackupRestoreResult.backup_hash}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-600">
                                            Copia interna #{companyBackupRestoreResult.internal_safety_backup?.id} marcada como restaurada; limpieza programada para {formatBackupDateTime(companyBackupRestoreResult.internal_safety_backup?.cleanup_after)}.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isSuperAdmin && (
                            <div className="rounded-2xl border border-zinc-100 bg-white px-4 py-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Copias automaticas internas</p>
                                        <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-500">
                                            Solo superadministrador. Vida util 30 dias; si se restauran, quedan programadas para desaparecer a la semana.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={loadCompanyBackupInternalArtifacts}
                                        disabled={companyBackupInternalLoading}
                                        className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700 transition-colors hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${companyBackupInternalLoading ? 'animate-spin' : ''}`} />
                                        Ver internas
                                    </button>
                                </div>

                                {companyBackupInternalArtifacts?.items?.length > 0 ? (
                                    <div className="mt-4 space-y-2">
                                        {companyBackupInternalArtifacts.items.map((item) => (
                                            <div key={item.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                                                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                            Copia interna #{item.id} · {item.status}
                                                        </p>
                                                        <p className="mt-1 text-xs font-semibold text-zinc-500">
                                                            Fecha: {formatBackupDateTime(item.created_at)} · Usuario: {item.created_by_email || 'No registrado'}
                                                        </p>
                                                        <p className="mt-1 text-xs font-semibold text-zinc-500">
                                                            Expira: {formatBackupDateTime(item.expires_at)} · Tamano: {item.size_bytes || 0} bytes
                                                        </p>
                                                        <p className="mt-1 break-all text-[10px] font-bold text-zinc-400">
                                                            Hash: {item.backup_hash}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="grid grid-cols-3 gap-2 text-center">
                                                            <div className="rounded-xl bg-white px-3 py-2">
                                                                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-zinc-400">Proyectos</p>
                                                                <p className="text-sm font-black text-zinc-900">{item.counts?.proyectos_total ?? 0}</p>
                                                            </div>
                                                            <div className="rounded-xl bg-white px-3 py-2">
                                                                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-zinc-400">Comunidad</p>
                                                                <p className="text-sm font-black text-zinc-900">{item.counts?.community_posts ?? 0}</p>
                                                            </div>
                                                            <div className="rounded-xl bg-white px-3 py-2">
                                                                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-zinc-400">Archivos</p>
                                                                <p className="text-sm font-black text-zinc-900">{item.manifest_summary?.file_count ?? 0}</p>
                                                            </div>
                                                        </div>
                                                        {item.status === 'available' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCompanyBackupInternalRestoreTarget(item);
                                                                    setCompanyBackupRestoreResult(null);
                                                                }}
                                                                className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-[9px] font-black uppercase tracking-[0.16em] text-red-700 transition-colors hover:bg-red-50"
                                                            >
                                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                                Restaurar interna
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-4 text-xs font-semibold text-zinc-400">
                                        Sin copias automaticas internas cargadas para la empresa seleccionada.
                                    </p>
                                )}

                                {companyBackupInternalRestoreTarget && (
                                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-700">
                                            Restaurar copia interna #{companyBackupInternalRestoreTarget.id}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-600">
                                            Origen: {formatBackupDateTime(companyBackupInternalRestoreTarget.created_at)} · Usuario: {companyBackupInternalRestoreTarget.created_by_email || 'No registrado'} · Hash {companyBackupInternalRestoreTarget.backup_hash}
                                        </p>
                                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                            <input
                                                value=""
                                                readOnly
                                                placeholder=""
                                                className="hidden"
                                            />
                                            <input
                                                value=""
                                                readOnly
                                                placeholder=""
                                                className="hidden"
                                            />
                                            <input
                                                value=""
                                                readOnly
                                                placeholder=""
                                                className="hidden"
                                            />
                                            <input
                                                value={companyBackupRestoreConfirmation}
                                                onChange={(event) => setCompanyBackupRestoreConfirmation(event.target.value)}
                                                placeholder="CONFIRMO IMPORTACION"
                                                className="rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-bold text-zinc-700 outline-none focus:border-red-400"
                                            />
                                        </div>
                                        <div className="mt-5 flex items-center justify-between gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setCompanyBackupInternalRestoreTarget(null)}
                                                className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCompanyBackupExecuteInternalRestore}
                                                disabled={companyBackupRestoring || !isInternalRestoreConfirmationReady}
                                                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-red-700 bg-red-700 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                {companyBackupRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                                                Ejecutar restauracion interna
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-4">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Intentos bloqueados entre empresas</p>
                                            <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-500">
                                                Solo superadministrador. Agrupa intentos de Restore Empresa con copias de otra empresa.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={loadCompanyBackupCrossCompanyAttempts}
                                            disabled={companyBackupCrossCompanyLoading}
                                            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700 transition-colors hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${companyBackupCrossCompanyLoading ? 'animate-spin' : ''}`} />
                                            Ver intentos
                                        </button>
                                    </div>

                                    {companyBackupCrossCompanyAttempts?.items?.length > 0 ? (
                                        <div className="mt-4 space-y-2">
                                            {companyBackupCrossCompanyAttempts.items.map((item) => (
                                                <div key={`${item.attempted_empresa?.empresa_id || 'x'}-${item.backup_empresa?.empresa_id || 'x'}-${item.last_backup_hash || 'hash'}`} className="rounded-2xl border border-red-100 bg-white px-4 py-3">
                                                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-black text-zinc-900">
                                                                {item.attempted_empresa?.nombre || 'Empresa solicitante no identificada'} intento restaurar {item.backup_empresa?.nombre || 'empresa de copia no identificada'}
                                                            </p>
                                                            <p className="mt-1 break-all text-[10px] font-bold text-zinc-500">
                                                                Usuario: {item.last_requested_by_email || 'No registrado'} · Ultimo intento: {formatBackupDateTime(item.last_attempt_at)}
                                                            </p>
                                                        </div>
                                                        <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-700">
                                                            {item.attempts} intento(s)
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-4 text-xs font-semibold text-zinc-400">
                                            {companyBackupCrossCompanyAttempts ? 'Sin intentos bloqueados registrados.' : 'Carga la auditoria para revisar intentos.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderMiEmpresa = () => (
        <Card className="bg-white border-zinc-100 shadow-sm max-w-5xl mx-auto md:mx-0 overflow-hidden">
            <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#F39200] border border-orange-100">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">Mi Empresa</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Información Institucional y de Contacto</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateMiEmpresa} className="space-y-8">
                    <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2" data-settings-company-tabs="mi-empresa">
                        {COMPANY_SETTINGS_ZONES.map((zone) => {
                            const Icon = zone.icon;
                            const active = miEmpresaZone === zone.id;
                            return (
                                <button
                                    key={zone.id}
                                    type="button"
                                    onClick={() => setMiEmpresaZone(zone.id)}
                                    className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${active ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-zinc-500 hover:bg-white hover:text-[#1A1A1A]'}`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {zone.label}
                                </button>
                            );
                        })}
                    </div>

                    {miEmpresaZone === 'datos' && (
                    <>
                    <div className="flex items-center gap-6 mb-8 bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100" data-settings-company-zone="datos-empresa">
                        <div className="w-24 h-24 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center overflow-hidden relative group shadow-sm transition-all hover:border-[#F39200]/30">
                            {logoPreview || (miEmpresa?.logo_url ? resolveMediaUrl(miEmpresa.logo_url) : null) ? (
                                <img src={logoPreview || resolveMediaUrl(miEmpresa.logo_url)} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <Building className="w-10 h-10 text-zinc-200" />
                            )}
                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <Plus className="w-8 h-8 text-white" />
                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#F39200] mb-1">Identidad Visual</h4>
                            <p className="text-xs font-bold text-zinc-500 leading-tight">Subir logo institucional (PNG/JPG recomendado)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-[#F39200] uppercase tracking-[0.2em] border-b border-orange-100 pb-2">Datos Identificativos</h3>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Nombre Legal / Comercial</Label>
                                <Input required value={miEmpresa?.nombre || ''} disabled className="h-12 rounded-xl border-zinc-200 bg-zinc-100 text-zinc-500 cursor-not-allowed" />
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight ml-1">Sincronizado automáticamente desde la fuente fiscal oficial.</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Alias de Empresa</Label>
                                <Input value={miEmpresa?.alias || ''} onChange={e => setMiEmpresa({ ...miEmpresa, alias: e.target.value })} className="h-12 rounded-xl bg-zinc-50/30 border-zinc-200" />
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight ml-1">Si existe, se usará como nombre visible en menús y selectores.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">RUC</Label>
                                    <Input
                                        required
                                        value={miEmpresa?.ruc || ''}
                                        onChange={e => setMiEmpresa({ ...miEmpresa, ruc: e.target.value })}
                                        disabled={Boolean(miEmpresa?.ruc)}
                                        className="h-12 rounded-xl border-zinc-200 bg-zinc-100 text-zinc-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Teléfono Principal</Label>
                                    <Input
                                        required
                                        value={miEmpresa?.telefono || ''}
                                        onChange={e => setMiEmpresa({ ...miEmpresa, telefono: e.target.value })}
                                        onBlur={e => {
                                            if (!e.target.value || !isValidPhone(e.target.value)) return;
                                            const formatted = formatInternationalPhone(e.target.value, resolveCountryPhonePrefix(miEmpresa.pais));
                                            setMiEmpresa({ ...miEmpresa, telefono: formatted });
                                        }}
                                        className="h-12 rounded-xl bg-zinc-50/30 border-zinc-200"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Correo Electrónico Corporativo</Label>
                                <Input type="email" required value={miEmpresa?.email || ''} onChange={e => setMiEmpresa({ ...miEmpresa, email: e.target.value })} className="h-12 rounded-xl bg-zinc-50/30 border-zinc-200" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Dirección Física</Label>
                                <Input required value={miEmpresa?.direccion || ''} onChange={e => setMiEmpresa({ ...miEmpresa, direccion: e.target.value })} className="h-12 rounded-xl bg-zinc-50/30 border-zinc-200" />
                            </div>

                            {/* Nueva sección de Configuración y Cuotas */}
                            <div className="space-y-6 pt-8 border-t border-zinc-100">
                                <h3 className="text-[10px] font-black text-[#F39200] uppercase tracking-[0.2em] border-b border-orange-100 pb-2">Configuración y Cuotas de Sistema</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4 p-4 bg-zinc-50/50 rounded-2xl border border-zinc-100">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 whitespace-nowrap">Cuota de Administradores</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[8px] uppercase font-black text-zinc-400">Asignados</span>
                                                <Input
                                                    type="number"
                                                    value={miEmpresa?.limite_administradores || 0}
                                                    onChange={e => setMiEmpresa({ ...miEmpresa, limite_administradores: parseInt(e.target.value) })}
                                                    disabled={user?.rol !== 'Superadministrador'}
                                                    className={`h-10 rounded-lg border-zinc-200 text-xs ${user?.rol !== 'Superadministrador' ? 'bg-zinc-100' : 'bg-white'}`}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[8px] uppercase font-black text-zinc-400">En Uso</span>
                                                <div className="h-10 flex items-center justify-center bg-zinc-100 rounded-lg border border-zinc-200 text-xs font-black text-[#1A1A1A]">
                                                    {miEmpresa?.total_administradores || 0}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 p-4 bg-zinc-50/50 rounded-2xl border border-zinc-100">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 whitespace-nowrap">Cuota de Colaboradores</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[8px] uppercase font-black text-zinc-400">Asignados</span>
                                                <Input
                                                    type="number"
                                                    value={miEmpresa?.limite_usuarios || 0}
                                                    onChange={e => setMiEmpresa({ ...miEmpresa, limite_usuarios: parseInt(e.target.value) })}
                                                    disabled={user?.rol !== 'Superadministrador'}
                                                    className={`h-10 rounded-lg border-zinc-200 text-xs ${user?.rol !== 'Superadministrador' ? 'bg-zinc-100' : 'bg-white'}`}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[8px] uppercase font-black text-zinc-400">En Uso</span>
                                                <div className="h-10 flex items-center justify-center bg-zinc-100 rounded-lg border border-zinc-200 text-xs font-black text-[#1A1A1A]">
                                                    {miEmpresa?.total_usuarios || 0}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-[#F39200] uppercase tracking-[0.2em] border-b border-orange-100 pb-2">Ubicación y Contacto</h3>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">País</Label>
                                <SearchableSelect
                                    options={paises.map(p => ({ id: p.id, nombre: p.nombre }))}
                                    value={miEmpresa?.pais || ''}
                                    onChange={(val) => setMiEmpresa({ ...miEmpresa, pais: val, provincia: '', canton: '', localidad: '' })}
                                    placeholder="Buscar país..."
                                    valueKey="nombre"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Provincia</Label>
                                    {miEmpresa?.pais === 'Ecuador' ? (
                                        <SearchableSelect
                                            options={empresaProvincias.map(p => ({ id: p, nombre: p }))}
                                            value={miEmpresa?.provincia || ''}
                                            onChange={(val) => setMiEmpresa(prev => ({ ...prev, provincia: val, canton: '', localidad: val }))}
                                            placeholder="Seleccionar..."
                                            valueKey="id"
                                            labelKey="nombre"
                                        />
                                    ) : (
                                        <Input value={miEmpresa?.provincia || ''} onChange={e => setMiEmpresa({ ...miEmpresa, provincia: e.target.value })} className="h-12 rounded-xl bg-zinc-50/30 border-zinc-200" />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Localidad / Cantón</Label>
                                    {miEmpresa?.pais === 'Ecuador' ? (
                                        <SearchableSelect
                                            options={empresaCantones.map(c => ({ id: c, nombre: c }))}
                                            value={miEmpresa?.canton || miEmpresa?.localidad || ''}
                                            onChange={(val) => setMiEmpresa(prev => ({ ...prev, canton: val, localidad: val }))}
                                            placeholder="Seleccionar..."
                                            valueKey="id"
                                            labelKey="nombre"
                                            disabled={!miEmpresa?.provincia}
                                        />
                                    ) : (
                                        <Input value={miEmpresa?.localidad || ''} onChange={e => setMiEmpresa({ ...miEmpresa, localidad: e.target.value, canton: e.target.value })} className="h-12 rounded-xl bg-zinc-50/30 border-zinc-200" />
                                    )}
                                </div>
                            </div>
                            <div className="pt-4 space-y-4 bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">Responsable Institucional</Label>
                                <div className="space-y-2">
                                    <Label className="text-[8px] uppercase font-black tracking-widest text-zinc-400 ml-1">Nombre Completo</Label>
                                    <Input value={miEmpresa?.contacto_nombre || ''} onChange={e => setMiEmpresa({ ...miEmpresa, contacto_nombre: e.target.value })} className="h-10 rounded-lg bg-white border-zinc-200 text-xs" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[8px] uppercase font-black tracking-widest text-zinc-400 ml-1">Email</Label>
                                        <Input type="email" value={miEmpresa?.contacto_email || ''} onChange={e => setMiEmpresa({ ...miEmpresa, contacto_email: e.target.value })} className="h-10 rounded-lg bg-white border-zinc-200 text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[8px] uppercase font-black tracking-widest text-zinc-400 ml-1">Teléfono</Label>
                                        <Input
                                            value={miEmpresa?.contacto_telefono || ''}
                                            onChange={e => setMiEmpresa({ ...miEmpresa, contacto_telefono: e.target.value })}
                                            onBlur={e => {
                                                if (!e.target.value || !isValidPhone(e.target.value)) return;
                                                setMiEmpresa({ ...miEmpresa, contacto_telefono: formatInternationalPhone(e.target.value, resolveCountryPhonePrefix(miEmpresa.pais)) });
                                            }}
                                            className="h-10 rounded-lg bg-white border-zinc-200 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </>
                    )}

                    {/* Sección de Licencia y Uso (Nueva) */}
                    {miEmpresaZone === 'licencia' && (
                        <div className="mt-1 space-y-4" data-settings-company-zone="licencia-conecta" data-settings-license-conecta-compact="true">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#F39200]">Licencia y SaaS</p>
                                    <h3 className="mt-1 text-sm font-black uppercase tracking-tight text-[#1A1A1A]">Estado comercial</h3>
                                </div>
                                {licenseInfo ? (
                                    <span className={`inline-flex min-h-8 items-center rounded-full border px-3 text-[9px] font-black uppercase tracking-[0.14em] ${getLicenseStatusTone(licenseInfo)}`}>
                                        {getLicenseStatusLabel(licenseInfo)}
                                    </span>
                                ) : null}
                            </div>
                            {!licenseInfo ? (
                                <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3">
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Licencia no disponible</p>
                                </div>
                            ) : (
                            <>
                            <div className="grid grid-cols-2 gap-3 xl:grid-cols-5" data-settings-license-summary="compact">
                                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Plan contratado</p>
                                    <p className="truncate text-sm font-black uppercase text-[#1A1A1A]">{licenseInfo.licencia_actual}</p>
                                    {licenseInfo.next_license ? (
                                        <p className="mt-2 text-[9px] font-bold text-blue-600 uppercase tracking-widest">
                                            Sigue: {licenseInfo.next_license.nombre}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">{licenseInfo.access_mode === 'readonly' ? 'Lectura permitida hasta' : 'Vencimiento'}</p>
                                    <p className="text-sm font-black uppercase text-[#1A1A1A]">
                                        {licenseInfo.license_end_date ? new Date(licenseInfo.license_end_date).toLocaleDateString() : 'Indefinido'}
                                    </p>
                                    <p className="text-[9px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">
                                        {licenseInfo.grace_days_remaining > 0 ? `${licenseInfo.grace_days_remaining} días de gracia restantes` : (licenseInfo.access_mode === 'readonly' ? 'Modo solo lectura' : 'Renovación / cambio de plan')}
                                    </p>
                                </div>
                                <div className="col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 xl:col-span-1">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Uso de Almacenamiento</p>
                                    <p className="text-[11px] font-black uppercase text-[#1A1A1A]">
                                        {Number(licenseInfo.usados?.almacenamiento_gb || 0).toFixed(2)} / {licenseInfo.limites?.almacenamiento_gb === -1 ? '∞' : (licenseInfo.limites?.almacenamiento_gb ?? 0)} GB
                                    </p>
                                    <div className="w-full h-1.5 bg-zinc-200 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className={`h-full ${
                                                licenseInfo.limites?.almacenamiento_gb === -1
                                                    ? 'bg-emerald-500'
                                                    : (() => {
                                                        const storageLimit = Number(licenseInfo.limites?.almacenamiento_gb || 0);
                                                        const storageUsed = Number(licenseInfo.usados?.almacenamiento_gb || 0);
                                                        const ratio = storageLimit > 0
                                                            ? storageUsed / storageLimit
                                                            : 0;
                                                        if (ratio >= 0.95) return 'bg-red-500';
                                                        if (ratio >= 0.75) return 'bg-orange-400';
                                                        return 'bg-emerald-500';
                                                    })()
                                            }`}
                                            style={{ width: `${Number(licenseInfo.limites?.almacenamiento_gb || 0) > 0 ? (Number(licenseInfo.usados?.almacenamiento_gb || 0) / Number(licenseInfo.limites?.almacenamiento_gb || 0) * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {licenseInfo.license_banner_message ? (
                                <div className={`rounded-xl border px-4 py-3 ${getLicenseStatusTone(licenseInfo)}`}>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em]">Estado operativo</p>
                                    <p className="mt-1 text-xs font-semibold leading-relaxed">
                                        {licenseInfo.license_banner_message}
                                    </p>
                                </div>
                            ) : null}

                            <div className={`rounded-[1.25rem] border px-4 py-3 ${licenseRequiresAttention ? 'border-orange-200 bg-orange-50' : 'border-blue-100 bg-blue-50/70'}`} data-settings-license-actions="compact">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className={`text-[9px] font-black uppercase tracking-[0.14em] ${licenseRequiresAttention ? 'text-orange-700' : 'text-[#136191]'}`}>
                                            {licenseRequiresAttention ? 'Renovacion recomendada' : 'Gestion del plan'}
                                        </p>
                                        <p className="mt-1 text-[11px] font-semibold text-zinc-600">
                                            Marketplace SaaS oficial
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ProjectSectionIconButton
                                            icon={RefreshCw}
                                            label="Renovar plan actual"
                                            onClick={() => navigate(buildMarketplaceSaasUrl({ code: currentLicenseMonthlyCode, intent: 'renewal' }))}
                                            className="hover:border-[#F39200]/30 hover:bg-orange-50 hover:text-[#F39200]"
                                        />
                                        <ProjectSectionIconButton
                                            icon={ShieldCheck}
                                            label="Evaluar cambio de plan"
                                            onClick={() => navigate(buildMarketplaceSaasUrl({ code: suggestedUpgradeCode, intent: 'plan_change' }))}
                                            className="hover:border-[#136191]/25 hover:bg-blue-50 hover:text-[#136191]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Proyectos activos</p>
                                        <p className="text-sm font-black text-[#1A1A1A]">{licenseInfo.usados.proyectos} / {licenseInfo.limites.proyectos === -1 ? '∞' : licenseInfo.limites.proyectos}</p>
                                    </div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-100 bg-white">
                                        <Briefcase className="h-4 w-4 text-zinc-400" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Usuarios registrados</p>
                                        <p className="text-sm font-black text-[#1A1A1A]">{licenseInfo.usados.usuarios} / {licenseInfo.limites.usuarios === -1 ? '∞' : licenseInfo.limites.usuarios}</p>
                                    </div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-100 bg-white">
                                        <Users className="h-4 w-4 text-zinc-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50/40 p-4" data-settings-saas-rights="compact">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#136191]">SaaS</p>
                                        <h4 className="mt-1 text-sm font-black uppercase tracking-tight text-[#1A1A1A]">Derechos efectivos</h4>
                                    </div>
                                    <ProjectSectionIconButton
                                        icon={Eye}
                                        label="Ver planes en Marketplace"
                                        onClick={() => navigate('/marketplace?saas=1')}
                                        className="hover:border-[#136191]/25 hover:bg-blue-50 hover:text-[#136191]"
                                    />
                                </div>

                                <div className="mt-3 grid grid-cols-3 gap-2">
                                    <div className="rounded-xl border border-white bg-white/90 px-3 py-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Productos adicionales</p>
                                        <p className="mt-1 text-sm font-black text-[#1A1A1A]">{saasProducts.length}</p>
                                    </div>
                                    <div className="rounded-xl border border-white bg-white/90 px-3 py-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Derechos efectivos</p>
                                        <p className="mt-1 text-sm font-black text-[#1A1A1A]">{effectiveRightCodes.length}</p>
                                    </div>
                                    <div className="rounded-xl border border-white bg-white/90 px-3 py-2">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Capacidades habilitadas</p>
                                        <p className="mt-1 text-sm font-black text-[#1A1A1A]">{enabledCapabilities.length}</p>
                                    </div>
                                </div>

                                {saasProducts.length > 0 ? (
                                    <div className="mt-3 divide-y divide-blue-100 overflow-hidden rounded-xl border border-blue-100 bg-white">
                                        {saasProducts.slice(0, 4).map((product, index) => (
                                            <div key={`${product.order_item_id || product.product_id || product.commercial_code || 'saas-product'}-${index}`} className="px-3 py-2.5">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-black text-[#1A1A1A]">{product.title || formatCommercialCode(product.commercial_code)}</p>
                                                        <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.13em] text-zinc-400">
                                                            {formatCommercialCode(product.right_code || product.commercial_code)}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-emerald-700">
                                                        {product.status || 'active'}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                                                    Vigencia: {formatSaasDate(product.starts_at)} - {formatSaasDate(product.ends_at)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-3 rounded-xl border border-dashed border-blue-200 bg-white/70 px-3 py-3">
                                        <p className="text-xs font-bold text-zinc-600">
                                            Sin productos SaaS adicionales activos.
                                        </p>
                                    </div>
                                )}

                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <div className="rounded-xl border border-white bg-white/90 p-3">
                                        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-emerald-700">Habilitado</p>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {enabledCapabilities.length > 0 ? enabledCapabilities.map(([key]) => (
                                                <span key={key} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-700">
                                                    {COMMERCIAL_CAPABILITY_LABELS[key]}
                                                </span>
                                            )) : (
                                                <span className="text-xs font-semibold text-zinc-500">Sin capacidades habilitadas.</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-white bg-white/90 p-3">
                                        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-500">No incluido</p>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {disabledCapabilities.length > 0 ? disabledCapabilities.map(([key]) => (
                                                <span key={key} className="rounded-full bg-zinc-100 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-zinc-500">
                                                    {COMMERCIAL_CAPABILITY_LABELS[key]}
                                                </span>
                                            )) : (
                                                <span className="text-xs font-semibold text-zinc-500">Sin restricciones reportadas.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            </>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end pt-8 border-t border-zinc-100">
                        <LiquidButton type="submit" className="w-full md:w-auto px-12 !h-14 bg-[#1A1A1A] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:shadow-zinc-200 transition-all">
                            Actualizar Información Empresarial
                        </LiquidButton>
                    </div>
                </form>
            </CardContent>
        </Card>
    );

    const renderProyectoConfig = () => (
        <Card className="bg-white border-zinc-100 shadow-sm max-w-5xl mx-auto md:mx-0" data-settings-company-zone="codigos-proyecto">
            <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Códigos Proyecto</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Prefijo, periodo y secuencia</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateProyectoConfig} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">Prefijo / Empresa</Label>
                            <Input
                                value={miEmpresa?.proy_prefijo || ''}
                                onChange={e => setMiEmpresa({ ...miEmpresa, proy_prefijo: e.target.value.substring(0, 20) })}
                                placeholder={miEmpresa?.nombre?.replace(/\s/g, '').substring(0, 20)}
                                className="h-12 rounded-xl bg-zinc-50 border-zinc-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">Referencia / Periodo</Label>
                            <Input
                                value={miEmpresa?.proy_periodo || ''}
                                onChange={e => setMiEmpresa({ ...miEmpresa, proy_periodo: e.target.value.substring(0, 5) })}
                                placeholder={new Date().getFullYear().toString()}
                                className="h-12 rounded-xl bg-zinc-50 border-zinc-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">Secuencial Inicial</Label>
                            <Input
                                type="number"
                                value={miEmpresa?.proy_secuencial || 1}
                                onChange={e => setMiEmpresa({ ...miEmpresa, proy_secuencial: parseInt(e.target.value) || 1 })}
                                className="h-12 rounded-xl bg-zinc-50 border-zinc-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">Tamaño Secuencial</Label>
                            <Input
                                type="number" min="1" max="9"
                                value={miEmpresa?.proy_secuencial_size || 9}
                                onChange={e => setMiEmpresa({ ...miEmpresa, proy_secuencial_size: parseInt(e.target.value) || 9 })}
                                className="h-12 rounded-xl bg-zinc-50 border-zinc-200"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 border border-zinc-200 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#F39200]/5 blur-[60px] rounded-full -mr-20 -mt-20" />

                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                                <Eye className="w-4 h-4 text-[#F39200]" />
                            </div>
                            <div>
                                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Previsualización Técnica</span>
                                <span className="block text-[9px] font-bold uppercase tracking-widest text-[#F39200]">Formato de código dinámico</span>
                            </div>
                        </div>

                        <div className="relative z-10 flex items-center justify-center h-24 bg-zinc-50/80 rounded-3xl border border-zinc-200 backdrop-blur-sm shadow-inner group-hover:bg-white transition-colors duration-500">
                            <span className="text-2xl font-black tracking-[0.3em] font-mono uppercase">
                                <span className="text-[#F39200]">
                                    {(miEmpresa?.proy_prefijo || miEmpresa?.nombre?.replace(/\s/g, '').substring(0, 20) || 'CODE')}
                                </span>
                                <span className="text-zinc-300 mx-1">-</span>
                                <span className="text-[#3B82F6]">
                                    {(miEmpresa?.proy_periodo || new Date().getFullYear().toString())}
                                </span>
                                <span className="text-zinc-300 mx-1">-</span>
                                <span className="text-[#A855F7]">
                                    {String(miEmpresa?.proy_secuencial || 1).padStart(miEmpresa?.proy_secuencial_size || 9, '0')}
                                </span>
                            </span>
                        </div>

                        <div className="mt-6 flex justify-center gap-8 relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#F39200] shadow-[0_0_8px_rgba(243,146,0,0.4)]" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Prefijo</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Periodo</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Secuencial</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-zinc-100">
                        {['Superadministrador', 'administrador'].includes(user?.rol) ? (
                            <LiquidButton type="submit" className="w-full md:w-auto px-12 !h-14 bg-[#1A1A1A] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl">
                                Guardar Configuración de Proyecto
                            </LiquidButton>
                        ) : (
                            <div className="flex items-center gap-3 p-4 bg-zinc-100 rounded-2xl border border-zinc-200 italic">
                                <AlertTriangle className="w-4 h-4 text-zinc-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Configuración de Solo Lectura</span>
                            </div>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );

    const renderPlantillasConfig = () => (
        <Card className="bg-white border-zinc-100 shadow-sm max-w-5xl mx-auto md:mx-0" data-settings-company-zone="plantillas-informes">
            <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Plantillas</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Reportes y salida documental</p>
                    </div>
                </div>

                <form onSubmit={handleUpdatePlantillasConfig} className="space-y-10">
                    {activeProject && (
                        <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#F39200] border border-orange-100 shadow-sm">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-tight text-[#F39200]">Modo de Anulación Activo</h4>
                                <p className="text-[10px] font-bold text-orange-700/80 leading-relaxed uppercase tracking-widest mt-0.5">
                                    Editando plantillas para: <span className="text-[#1A1A1A] underline decoration-2 decoration-[#F39200] underline-offset-4">{activeProject.codigo || activeProject.nombre}</span>
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                        {Object.entries(PLANTILLAS_OPCIONES).map(([key, data]) => (
                            <div key={key} className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-1">{data.label}</Label>
                                <SearchableSelect
                                    disabled={!['Superadministrador', 'administrador'].includes(user?.rol)}
                                    options={data.options}
                                    value={(activeProject ? activeProject.plantillas_config?.[key] : miEmpresa?.plantillas_config?.[key]) || data.options[0]?.id}
                                    onChange={(val) => {
                                        if (activeProject) {
                                            const newConfig = { ...(activeProject.plantillas_config || {}) };
                                            newConfig[key] = val;
                                            setActiveProject({ ...activeProject, plantillas_config: newConfig });
                                        } else {
                                            const newConfig = { ...(miEmpresa?.plantillas_config || {}) };
                                            newConfig[key] = val;
                                            setMiEmpresa({ ...miEmpresa, plantillas_config: newConfig });
                                        }
                                    }}
                                    placeholder="Seleccionar plantilla..."
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-6 border-t border-zinc-100">
                        {['Superadministrador', 'administrador'].includes(user?.rol) ? (
                            <LiquidButton type="submit" className="w-full md:w-auto px-12 !h-14 bg-[#1A1A1A] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl">
                                Guardar Configuración de Plantillas
                            </LiquidButton>
                        ) : (
                            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100 italic">
                                <AlertTriangle className="w-4 h-4 text-purple-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">Configuración de Solo Lectura</span>
                            </div>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );

    return (
        <div className="h-full min-h-0 flex flex-col bg-[#F2F4F7] text-[#1A1A1A] overflow-hidden">
            <header className="bg-white border-b border-zinc-200 px-8 py-4 sticky top-0 z-40 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-500">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <SettingsIcon className="w-5 h-5 text-[#F39200]" />
                                <h1 className="text-xl font-black uppercase tracking-tight">Settings <span className="text-[#F39200]">Empresa</span></h1>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Empresa activa, permisos y datos operativos</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="flex gap-12">
                    <aside className="sticky top-8 h-fit w-64 space-y-2">
                        {((user?.rol || '').toLowerCase() === 'administrador' || isSuperAdmin) && (
                            <button
                                onClick={() => setActiveTab('mi-empresa')}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${activeTab === 'mi-empresa' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-zinc-400 hover:bg-white hover:text-[#1A1A1A]'}`}
                            >
                                <Building2 className="w-4 h-4" /> Mi Empresa
                            </button>
                        )}
                        {((user?.rol || '').toLowerCase() === 'administrador' || isSuperAdmin) && (
                            <button
                                onClick={() => setActiveTab('backup-empresa')}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${activeTab === 'backup-empresa' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-zinc-400 hover:bg-white hover:text-[#1A1A1A]'}`}
                            >
                                <ShieldCheck className="w-4 h-4" /> Backup Empresa
                            </button>
                        )}
                        {(user?.rol || '').toLowerCase() !== 'usuario' && (
                            <button
                                onClick={() => setActiveTab('usuarios')}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${activeTab === 'usuarios' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-zinc-400 hover:bg-white hover:text-[#1A1A1A]'}`}
                            >
                                <Users className="w-4 h-4" /> Gestión de Usuarios
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('plantillas')}
                            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${activeTab === 'plantillas' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-zinc-400 hover:bg-white hover:text-[#1A1A1A]'}`}
                        >
                            <FileText className="w-4 h-4" /> Plantillas
                        </button>
                        <button
                            onClick={() => setActiveTab('config-proyecto')}
                            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${activeTab === 'config-proyecto' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-zinc-400 hover:bg-white hover:text-[#1A1A1A]'}`}
                        >
                            <Briefcase className="w-4 h-4" /> Códigos Proyecto
                        </button>
                        {((user?.rol || '').toLowerCase() === 'administrador' || isSuperAdmin) && (
                            <button
                                onClick={() => setActiveTab('preferencias')}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${activeTab === 'preferencias' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-zinc-400 hover:bg-white hover:text-[#1A1A1A]'}`}
                            >
                                <SettingsIcon className="w-4 h-4" /> Preferencias
                            </button>
                        )}
                        {isSuperAdmin && (
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin-global')}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50/50 px-4 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#F39200] hover:bg-orange-100/70 transition-all shadow-sm shadow-orange-100"
                                >
                                    <ShieldCheck className="w-4 h-4" /> Abrir Administración Global
                                </button>
                            </div>
                        )}
                    </aside>

                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            <Motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                                        <Loader2 className="w-8 h-8 text-[#F39200] animate-spin" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sincronizando Sistema...</p>
                                    </div>
                                ) : (
                                    activeTab === 'empresas' ? renderEmpresas() :
                                            activeTab === 'superadmins' ? renderSuperadmins() :
                                            activeTab === 'preferencias' ? renderPreferencias() :
                                            activeTab === 'mi-empresa' ? renderMiEmpresa() :
                                                activeTab === 'backup-empresa' ? renderCompanyBackupPanel() :
                                                activeTab === 'config-proyecto' ? renderProyectoConfig() :
                                                    activeTab === 'plantillas' ? renderPlantillasConfig() :
                                                        renderUsuarios()
                                )}
                            </Motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {showCreateModal && (
                <AppModalShell
                    size="lg"
                    zIndex="z-[120]"
                    onClose={() => setShowCreateModal(false)}
                    panelClassName="bg-[#f7f7f5]"
                    overlayClassName="overflow-y-auto"
                >
                    <form onSubmit={activeTab === 'empresas' ? handleCreateEmpresa : handleCreateUsuario} className="flex max-h-[92dvh] min-h-0 flex-col">
                        <AppModalHeader
                            title={activeTab === 'empresas'
                                ? (editMode ? 'Editar Empresa' : 'Registrar Empresa')
                                : (editMode ? 'Editar Perfil' : 'Añadir Nuevo Perfil')}
                            subtitle={activeTab === 'empresas'
                                ? 'Ficha administrativa y fiscal de la empresa'
                                : 'Credenciales y perfil operativo de la empresa activa'}
                            icon={activeTab === 'empresas' ? Building : Users}
                            iconClassName={activeTab === 'empresas' ? 'text-[#F39200]' : 'text-[#136191]'}
                            iconWrapClassName={activeTab === 'empresas' ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}
                            onClose={() => setShowCreateModal(false)}
                            closeButton={(
                                <ProjectSectionIconButton
                                    icon={X}
                                    label="Cerrar"
                                    onClick={() => setShowCreateModal(false)}
                                    iconClassName="text-zinc-600"
                                />
                            )}
                        />

                        <AppModalBody className="min-h-0 flex-1 overflow-y-auto bg-[#f7f7f5] p-5 custom-scrollbar">
                            {activeTab === 'empresas' ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-6 mb-8 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                                        <div className="w-24 h-24 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center overflow-hidden relative group">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                                            ) : (
                                                <Building className="w-10 h-10 text-zinc-200" />
                                            )}
                                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                <Plus className="w-8 h-8 text-white" />
                                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                            </label>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Identidad Visual</h4>
                                            <p className="text-xs font-bold text-zinc-600">Subir logo institucional (PNG/JPG)</p>
                                        </div>
                                    </div>

                                    <h3 className="text-[10px] font-black text-[#F39200] uppercase tracking-[0.2em] border-b border-orange-100 pb-2">Datos Identificativos</h3>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Nombre Legal / Comercial</Label>
                                        <Input required value={newEmpresa.nombre} onChange={e => setNewEmpresa({ ...newEmpresa, nombre: e.target.value })} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Alias de Empresa</Label>
                                        <Input value={newEmpresa.alias || ''} onChange={e => setNewEmpresa({ ...newEmpresa, alias: e.target.value })} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight ml-1">Opcional. Si existe, será el nombre visible en menús y selectores.</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">{newEmpresa.pais === 'Ecuador' ? 'RUC' : 'Identificación fiscal'}</Label>
                                            <Input required maxLength={newEmpresa.pais === 'Ecuador' ? 13 : 20} inputMode={newEmpresa.pais === 'Ecuador' ? 'numeric' : 'text'} value={newEmpresa.ruc} onChange={e => setNewEmpresa({ ...newEmpresa, ruc: e.target.value })} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                                            {newEmpresa.pais && newEmpresa.pais !== 'Ecuador' && <p className="text-[9px] font-bold text-zinc-500 ml-1">NIF/NIE/CIF o identificador fiscal equivalente. No se consulta el SRI.</p>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Dirección</Label>
                                        <Input required value={newEmpresa.direccion} onChange={e => setNewEmpresa({ ...newEmpresa, direccion: e.target.value })} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">País</Label>
                                        <SearchableSelect
                                            options={paises.map(p => ({ id: p.id, nombre: p.nombre }))}
                                            value={newEmpresa.pais}
                                            onChange={(val) => setNewEmpresa({ ...newEmpresa, pais: val, provincia: '', canton: '', localidad: '' })}
                                            placeholder="Buscar país..."
                                            valueKey="nombre"
                                        />
                                    </div>

                                    {newEmpresa.pais === 'Ecuador' ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Provincia</Label>
                                                <SearchableSelect
                                                    options={empresaProvincias.map(p => ({ id: p, nombre: p }))}
                                                    value={newEmpresa.provincia}
                                                    onChange={(val) => setNewEmpresa(prev => ({ ...prev, provincia: val, canton: '', localidad: val }))}
                                                    placeholder="Seleccionar provincia..."
                                                    valueKey="id"
                                                    labelKey="nombre"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Cantón / Localidad</Label>
                                                <SearchableSelect
                                                    options={empresaCantones.map(c => ({ id: c, nombre: c }))}
                                                    value={newEmpresa.canton || newEmpresa.localidad}
                                                    onChange={(val) => setNewEmpresa(prev => ({ ...prev, canton: val, localidad: val }))}
                                                    placeholder="Seleccionar cantón..."
                                                    valueKey="id"
                                                    labelKey="nombre"
                                                    disabled={!newEmpresa.provincia}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Provincia / Región</Label>
                                                <Input
                                                    value={newEmpresa.provincia}
                                                    onChange={e => setNewEmpresa({ ...newEmpresa, provincia: e.target.value })}
                                                    className="h-12 rounded-xl bg-zinc-50 border-zinc-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Localidad / Ciudad</Label>
                                                <Input
                                                    value={newEmpresa.localidad}
                                                    onChange={e => setNewEmpresa({ ...newEmpresa, localidad: e.target.value, canton: e.target.value })}
                                                    className="h-12 rounded-xl bg-zinc-50 border-zinc-200"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Teléfono</Label>
                                        <Input
                                            value={newEmpresa.telefono}
                                            onChange={e => setNewEmpresa({ ...newEmpresa, telefono: e.target.value })}
                                            onBlur={e => {
                                                if (!e.target.value || !isValidPhone(e.target.value)) return;
                                                setNewEmpresa({ ...newEmpresa, telefono: formatInternationalPhone(e.target.value, resolveCountryPhonePrefix(newEmpresa.pais)) });
                                            }}
                                            className="h-12 rounded-xl bg-zinc-50 border-zinc-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Email</Label>
                                        <Input type="email" required value={newEmpresa.email} onChange={e => setNewEmpresa({ ...newEmpresa, email: e.target.value })} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                                    </div>

                                    <h3 className="text-[10px] font-black text-[#F39200] uppercase tracking-[0.2em] border-b border-orange-100 pb-2 mt-6">Datos de Contacto</h3>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Nombre Contacto</Label>
                                        <Input value={newEmpresa.contacto_nombre} onChange={e => setNewEmpresa({ ...newEmpresa, contacto_nombre: e.target.value })} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Email Contacto</Label>
                                            <Input type="email" value={newEmpresa.contacto_email} onChange={e => setNewEmpresa({ ...newEmpresa, contacto_email: e.target.value })} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Teléfono Contacto</Label>
                                            <Input
                                                value={newEmpresa.contacto_telefono}
                                                onChange={e => setNewEmpresa({ ...newEmpresa, contacto_telefono: e.target.value })}
                                                onBlur={e => {
                                                    if (!e.target.value || !isValidPhone(e.target.value)) return;
                                                    setNewEmpresa({ ...newEmpresa, contacto_telefono: formatInternationalPhone(e.target.value, resolveCountryPhonePrefix(newEmpresa.pais)) });
                                                }}
                                                className="h-12 rounded-xl bg-zinc-50 border-zinc-200"
                                            />
                                        </div>
                                    </div>

                                    {isSuperAdmin && (
                                        <>
                                            <h3 className="text-[10px] font-black text-[#F39200] uppercase tracking-[0.2em] border-b border-orange-100 pb-2 mt-6">Cuotas de Personal</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Administradores Máx.</Label>
                                                    <Input type="number" min="1" required value={newEmpresa.limite_administradores} onChange={e => setNewEmpresa({ ...newEmpresa, limite_administradores: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl bg-orange-50/50 border-orange-100 focus:border-[#F39200]" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Colaboradores (Staff) Máx.</Label>
                                                    <Input type="number" min="0" required value={newEmpresa.limite_usuarios} onChange={e => setNewEmpresa({ ...newEmpresa, limite_usuarios: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl bg-orange-50/50 border-orange-100 focus:border-[#F39200]" />
                                                </div>
                                            </div>

                                            <h3 className="text-[10px] font-black text-[#F39200] uppercase tracking-[0.2em] border-b border-orange-100 pb-2 mt-6">Preferencias de Sistema</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Tiempo Sesión (Min)</Label>
                                                    <Input type="number" min="1" required value={newEmpresa.session_timeout_minutes} onChange={e => setNewEmpresa({ ...newEmpresa, session_timeout_minutes: parseInt(e.target.value) || 30 })} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Dec. Moneda</Label>
                                                    <Input type="number" min="0" max="6" required value={newEmpresa.decimales_moneda} onChange={e => setNewEmpresa({ ...newEmpresa, decimales_moneda: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Dec. Cálculos</Label>
                                                    <Input type="number" min="0" max="8" required value={newEmpresa.decimales_calculos} onChange={e => setNewEmpresa({ ...newEmpresa, decimales_calculos: parseInt(e.target.value) || 0 })} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F39200]">Marketplace</h4>
                                                        <p className="mt-2 text-sm font-semibold text-zinc-700">
                                                            Habilita o revoca la capacidad de esta empresa para publicar y vender en el marketplace.
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 rounded-full border border-orange-200 bg-white px-4 py-2">
                                                        <Checkbox
                                                            checked={Boolean(newEmpresa.marketplace_can_sell)}
                                                            onCheckedChange={(checked) => setNewEmpresa((prev) => ({ ...prev, marketplace_can_sell: Boolean(checked) }))}
                                                        />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-700">
                                                            {newEmpresa.marketplace_can_sell ? 'Venta habilitada' : 'Venta revocada'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <PersonnelFormFields
                                        formData={newUsuario}
                                        setFormData={setNewUsuario}
                                        isSuperAdmin={isSuperAdmin}
                                        allowSuperAdminRole={false}
                                        hidePolicies={editMode}
                                        isEditing={editMode}
                                        paises={paises}
                                        availableRoles={getAvailableRoles()}
                                    />
                                </div>
                            )}

                        </AppModalBody>
                        <AppModalFooter variant="flat" className="border-t border-[#ececec] bg-[#f7f7f5] px-5 py-4">
                            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700">
                                    Cancelar
                                </button>
                                <LiquidButton type="submit" className={`!h-11 !px-8 text-white ${activeTab === 'empresas' ? 'bg-[#1A1A1A]' : 'bg-[#F39200]'}`}>
                                    <Save className="h-4 w-4" />
                                    {editMode ? 'Guardar Cambios' : activeTab === 'empresas' ? 'Guardar Empresa' : 'Confirmar Registro'}
                                </LiquidButton>
                            </div>
                        </AppModalFooter>
                    </form>
                </AppModalShell>
            )}

            <AnimatePresence>
                {showDeleteEmpresaModal && (
                    <AppModalShell
                        size="sm"
                        zIndex="z-[140]"
                        onClose={() => setShowDeleteEmpresaModal(false)}
                        panelClassName="bg-[#f7f7f5]"
                    >
                        <div className="p-10">
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 ${deleteEmpresaStep === 1 ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
                                    {deleteEmpresaStep === 1 ? <AlertTriangle className="w-10 h-10" /> : <Trash2 className="w-10 h-10" />}
                                </div>

                                {deleteEmpresaStep === 1 ? (
                                    <>
                                        <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-zinc-900">¿Eliminar Empresa?</h2>
                                        <p className="text-zinc-500 text-sm font-medium mb-8">
                                            Estás a punto de eliminar <strong>{empresaToDelete?.nombre}</strong>. Esta acción borrará usuarios, proyectos y datos relacionados de forma permanente.
                                        </p>
                                        <div className="flex flex-col w-full gap-3">
                                            <LiquidButton
                                                onClick={() => setDeleteEmpresaStep(2)}
                                                className="w-full !h-14 bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl"
                                            >
                                                Entiendo, Continuar
                                            </LiquidButton>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowDeleteEmpresaModal(false);
                                                    setDeleteEmpresaStep(1);
                                                    setEmpresaToDelete(null);
                                                }}
                                                className="w-full h-14 bg-zinc-50 text-zinc-500 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-100 transition-all"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-red-600">Confirmación Final</h2>
                                        <p className="text-zinc-500 text-sm font-medium mb-8">
                                            ¿Estás absolutamente seguro? Esta acción es <strong>IRREVERSIBLE</strong> y no se podrán recuperar los datos de la empresa.
                                        </p>
                                        <div className="flex flex-col w-full gap-3">
                                            <LiquidButton
                                                onClick={handleDeleteEmpresaConfirm}
                                                disabled={deletingEmpresa}
                                                className="w-full !h-14 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
                                            >
                                                {deletingEmpresa ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                                Confirmar Eliminación Permanente
                                            </LiquidButton>
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteEmpresaModal(false)}
                                                disabled={deletingEmpresa}
                                                className="w-full h-14 bg-zinc-50 text-zinc-500 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-100 transition-all"
                                            >
                                                Dar Marcha Atrás
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </AppModalShell>
                )}
            </AnimatePresence>

        </div >
    );
};

export default Settings;
