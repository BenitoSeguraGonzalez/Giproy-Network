import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { PLANTILLAS_OPCIONES } from '../constants/plantillas';
import { Trash2, Edit2, Plus, Save, X, Building2, Users, Settings as SettingsIcon, Shield, Camera, Globe, ChevronDown, Check, AlertCircle, Info, RefreshCw, Loader2, CheckCircle2, XCircle, AlertTriangle, Briefcase, FileText, Eye, ShieldCheck, Search, Power, ArrowLeft, Building, Loader2 as LoaderIcon, CheckCircle2 as CheckIcon, XCircle as XIcon, AlertTriangle as AlertIcon, ShieldCheck as ShieldIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';
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
const Settings = () => {
    const { user, selectedEmpresa, setSelectedEmpresa, selectedBaseTrabajo, licenseInfo } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestedTab = searchParams.get('tab');
    const requestedEditUser = searchParams.get('edit_user');
    const isSuperAdmin = (user?.rol || '').toLowerCase() === 'superadministrador';
    const initialTab = requestedTab || (((user?.rol || '').toLowerCase() === 'administrador' || isSuperAdmin) ? 'mi-empresa' : 'config-proyecto');
    const marketplaceProfileEditHandledRef = useRef(false);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [empresas, setEmpresas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [paises, setPaises] = useState([]);
    const [activeProject, setActiveProject] = useState(null);

    // Estados para formularios de creación/edición
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [showDeleteEmpresaModal, setShowDeleteEmpresaModal] = useState(false);
    const [deleteEmpresaStep, setDeleteEmpresaStep] = useState(1);
    const [empresaToDelete, setEmpresaToDelete] = useState(null);
    const [deletingEmpresa, setDeletingEmpresa] = useState(false);

    const [newEmpresa, setNewEmpresa] = useState({
        nombre: '', ruc: '', codigo: '',
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
    const [empresaProvincias, setEmpresaProvincias] = useState([]);
    const [empresaCantones, setEmpresaCantones] = useState([]);

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
            console.error("Error loading empresa provinces:", error);
        }
    }, []);

    const loadEmpresaCantones = useCallback(async (provincia) => {
        if (!provincia) return;
        try {
            const data = await maestrosApi.getCantones(provincia);
            setEmpresaCantones(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading empresa cantons:", error);
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
                const res = await api.get('/empresas/');
                setEmpresas(res.data);
            } else if (activeTab === 'superadmins' && isSuperAdmin) {
                const res = await api.get('/usuarios/');
                setUsuarios(res.data);
            } else if (activeTab === 'usuarios') {
                const params = empId ? { empresa_id: empId } : {};
                const res = await api.get('/usuarios/', { params });
                setUsuarios(res.data);
            }

            const targetEmpresaId = isSuperAdmin ? selectedEmpresa?.id : user?.empresa_id;

            if (targetEmpresaId) {
                const empRes = await api.get(`/empresas/${targetEmpresaId}`);
                setMiEmpresa(empRes.data);
                if (selectedEmpresa?.id === empRes.data.id) {
                    setSelectedEmpresa(empRes.data);
                }

                if (activeTab === 'plantillas' && selectedBaseTrabajo?.tipo === 'Base de Proyecto') {
                    try {
                        const proyRes = await api.get('/proyectos/', { params: { empresa_id: targetEmpresaId } });
                        const project = proyRes.data.find(p => p.base_trabajo_id === selectedBaseTrabajo.id);
                        if (project) {
                            setActiveProject(project);
                        }
                    } catch (error) {
                        console.error("Error buscando proyecto activo:", error);
                    }
                }
            }
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, user?.rol, user?.empresa_id, selectedEmpresa?.id, selectedBaseTrabajo?.tipo, selectedBaseTrabajo?.id, isSuperAdmin]);

    const fetchPaises = useCallback(async () => {
        try {
            const response = await api.get('/paises/');
            setPaises(response.data);
        } catch (error) {
            console.error("Error fetching paises:", error);
        }
    }, []);

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
            setActiveTab('empresas');
            return;
        }
        if (requestedTab === 'superadmins' && isSuperAdmin) {
            setActiveTab('superadmins');
            return;
        }
        if (requestedTab === 'usuarios' && user?.rol !== 'usuario') {
            setActiveTab('usuarios');
        }
    }, [requestedTab, user?.rol, isSuperAdmin]);

    useEffect(() => {
        fetchData();
        fetchPaises();
    }, [fetchData, fetchPaises]);

    const handleToggleEmpresa = async (empresa) => {
        try {
            await api.put(`/empresas/${empresa.id}`, { activa: !empresa.activa });
            fetchData();
        } catch {
            appAlert("Error al actualizar estado de empresa");
        }
    };

    const handleUpdatePreferencias = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/empresas/${miEmpresa.id}`, {
                decimales_moneda: miEmpresa.decimales_moneda,
                decimales_calculos: miEmpresa.decimales_calculos,
                use_omniclass: miEmpresa.use_omniclass,
                session_timeout_minutes: miEmpresa.session_timeout_minutes
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
            await api.delete(`/empresas/${empresaToDelete.id}`);
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
                await api.put(`/empresas/${selectedId}`, payload);
            } else {
                const res = await api.post('/empresas/', payload);
                empresaId = res.data.id;
            }

            if (logoFile) {
                const formData = new FormData();
                formData.append('file', logoFile);
                await api.post(`/empresas/upload-logo/${empresaId}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setShowCreateModal(false);
            resetEmpresaForm();
            fetchData();
        } catch (error) {
            console.error("Error al procesar empresa:", error);
            appAlert("Error al procesar empresa");
        }
    };

    const resetEmpresaForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setNewEmpresa({
            nombre: '', ruc: '', codigo: '',
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
                await api.put(`/usuarios/${selectedId}`, payload, { params });
            } else {
                await api.post('/usuarios/', payload, { params });
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

        setActiveTab(isSuperAdmin ? 'superadmins' : 'usuarios');
        handleEditUsuario({
            ...user,
            rol: isSuperAdmin ? 'Superadministrador' : (user.rol || 'usuario'),
            empresa_id: user.empresa_id || '',
        });
        marketplaceProfileEditHandledRef.current = true;
    }, [requestedEditUser, user, isSuperAdmin]);

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
            await api.delete(`/usuarios/${u.id}`, { params });
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
        includesNormalized(`${empresa.nombre || ''} ${empresa.ruc || ''} ${empresa.codigo || ''}`, searchTerm)
    );

    const filteredUsuarios = usuarios.filter((usuario) =>
        includesNormalized(`${usuario.nombre_completo || ''} ${usuario.email || ''} ${usuario.empresa?.nombre || ''}`, searchTerm)
    );

    const filteredSuperadmins = usuarios.filter((usuario) => {
        const role = (usuario?.rol || '').toLowerCase();
        if (role !== 'superadministrador') return false;
        return includesNormalized(
            `${usuario.nombre_completo || ''} ${usuario.email || ''} ${usuario.empresa?.nombre || ''} ${usuario.alias || ''} ${usuario.profesion || ''}`,
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
                                        <h3 className="font-black text-sm uppercase tracking-tight text-[#1A1A1A]">{emp.nombre}</h3>
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

        return (
            <Card className="bg-white border-zinc-100 shadow-sm max-w-5xl mx-auto md:mx-0 overflow-hidden">
                <CardContent className="p-8">
                    {/* Header Estándar Industrial Light */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">Personal / Staff</h2>
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
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gestión de Usuarios y Roles</p>
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
                                {filteredUsuarios.map(u => (
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
                                ))}
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
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-2">Solo superadministración puede operar este ajuste SaaS.</p>
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
                                    <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">Ajuste SaaS</h2>
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
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600">Gobierno SaaS</p>
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
        <Card className="bg-white border-zinc-100 shadow-sm max-w-2xl mx-auto md:mx-0">
            <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#F39200]">
                        <SettingsIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Preferencias de Aplicación</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Configuración de Precisión Decimal</p>
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
                                    onCheckedChange={(checked) => setMiEmpresa({ ...miEmpresa, use_omniclass: checked === true })}
                                    className="mt-1 data-[state=checked]:bg-[#F39200] data-[state=checked]:border-[#F39200]"
                                />
                                <div className="space-y-1">
                                    <Label htmlFor="use_omniclass" className="text-[11px] uppercase font-black tracking-widest text-zinc-500 cursor-pointer">
                                        Uso de OmniClass
                                    </Label>
                                    <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                                        Si se desactiva, el sistema oculta OmniClass en catálogos, APUs, presupuesto y reportes, e ignora cualquier dato OmniClass entrante.
                                    </p>
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

                    <LiquidButton type="submit" className="w-full !h-14 bg-[#F39200] text-white text-xs font-black uppercase tracking-[0.2em]">
                        Guardar Preferencias Locales
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
                    await api.put(`/empresas/${id}`, { plantillas_config: config });
                } else {
                    await api.put(`/proyectos/${id}`, { plantillas_config: config });
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
            await api.put(`/empresas/${miEmpresa.id}`, {
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
                nombre: miEmpresa.nombre,
                codigo: miEmpresa.codigo,
                ruc: miEmpresa.ruc,
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

            await api.put(`/empresas/${empId}`, updateData);

            if (logoFile) {
                const formData = new FormData();
                formData.append('file', logoFile);
                await api.post(`/empresas/upload-logo/${empId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            appAlert("Datos de la empresa actualizados correctamente.");

            // Si es superadmin, actualizar la lista general tambien
            if (user?.rol === 'Superadministrador') {
                const res = await api.get('/empresas/');
                setEmpresas(res.data);
                // Actualizar la empresa seleccionada en el estado si es la misma
                if (selectedEmpresa?.id === empId) {
                    const updated = res.data.find(e => e.id === empId);
                    if (updated) setSelectedEmpresa(updated);
                }
            }

            fetchData();
        } catch (error) {
            console.error("Error al actualizar empresa:", error);
            appAlert("Error al actualizar datos de la empresa");
        }
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
                    <div className="flex items-center gap-6 mb-8 bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100">
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
                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Nombre Comercial</Label>
                                <Input required value={miEmpresa?.nombre || ''} onChange={e => setMiEmpresa({ ...miEmpresa, nombre: e.target.value })} className="h-12 rounded-xl bg-zinc-50/30 border-zinc-200" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">RUC</Label>
                                    <Input
                                        required
                                        value={miEmpresa?.ruc || ''}
                                        onChange={e => setMiEmpresa({ ...miEmpresa, ruc: e.target.value })}
                                        disabled={miEmpresa?.ruc && user?.rol !== 'Superadministrador'}
                                        className={`h-12 rounded-xl border-zinc-200 ${miEmpresa?.ruc && user?.rol !== 'Superadministrador' ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'bg-zinc-50/30'}`}
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

                    {/* Sección de Licencia y Uso (Nueva) */}
                    {licenseInfo && (
                        <div className="mt-12 pt-8 border-t border-zinc-100">
                            <h3 className="text-[10px] font-black text-[#F39200] uppercase tracking-[0.2em] mb-6">Licencia y Cuotas de Uso</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-200">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Plan contratado</p>
                                    <p className="text-xl font-black uppercase text-[#1A1A1A]">{licenseInfo.licencia_actual}</p>
                                    <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${getLicenseStatusTone(licenseInfo)}`}>
                                        {getLicenseStatusLabel(licenseInfo)}
                                    </span>
                                    {licenseInfo.next_license ? (
                                        <p className="mt-2 text-[9px] font-bold text-blue-600 uppercase tracking-widest">
                                            Sigue: {licenseInfo.next_license.nombre}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-200">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">{licenseInfo.access_mode === 'readonly' ? 'Lectura permitida hasta' : 'Vencimiento'}</p>
                                    <p className="text-lg font-black uppercase text-[#1A1A1A]">
                                        {licenseInfo.license_end_date ? new Date(licenseInfo.license_end_date).toLocaleDateString() : 'Indefinido'}
                                    </p>
                                    <p className="text-[9px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">
                                        {licenseInfo.grace_days_remaining > 0 ? `${licenseInfo.grace_days_remaining} días de gracia restantes` : (licenseInfo.access_mode === 'readonly' ? 'Modo solo lectura' : 'Renovación / cambio de plan')}
                                    </p>
                                </div>
                                <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-200">
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Uso de Almacenamiento</p>
                                    <p className="text-lg font-black uppercase text-[#1A1A1A]">
                                        {licenseInfo.usados.almacenamiento_gb.toFixed(2)} / {licenseInfo.limites.almacenamiento_gb === -1 ? '∞' : licenseInfo.limites.almacenamiento_gb} GB
                                    </p>
                                    <div className="w-full h-1.5 bg-zinc-200 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className={`h-full ${
                                                licenseInfo.limites.almacenamiento_gb === -1
                                                    ? 'bg-emerald-500'
                                                    : (() => {
                                                        const ratio = licenseInfo.limites.almacenamiento_gb > 0
                                                            ? licenseInfo.usados.almacenamiento_gb / licenseInfo.limites.almacenamiento_gb
                                                            : 0;
                                                        if (ratio >= 0.95) return 'bg-red-500';
                                                        if (ratio >= 0.75) return 'bg-orange-400';
                                                        return 'bg-emerald-500';
                                                    })()
                                            }`}
                                            style={{ width: `${licenseInfo.limites.almacenamiento_gb > 0 ? (licenseInfo.usados.almacenamiento_gb / licenseInfo.limites.almacenamiento_gb * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {licenseInfo.license_banner_message ? (
                                <div className={`mt-6 rounded-[2rem] border px-6 py-5 ${getLicenseStatusTone(licenseInfo)}`}>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em]">Estado operativo</p>
                                    <p className="mt-2 text-sm font-semibold leading-relaxed">
                                        {licenseInfo.license_banner_message}
                                    </p>
                                </div>
                            ) : null}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-200 flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Proyectos activos</p>
                                        <p className="text-xl font-black text-[#1A1A1A]">{licenseInfo.usados.proyectos} / {licenseInfo.limites.proyectos === -1 ? '∞' : licenseInfo.limites.proyectos}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-2xl border border-zinc-100 flex items-center justify-center">
                                        <Briefcase className="w-6 h-6 text-zinc-400" />
                                    </div>
                                </div>
                                <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-200 flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Usuarios registrados</p>
                                        <p className="text-xl font-black text-[#1A1A1A]">{licenseInfo.usados.usuarios} / {licenseInfo.limites.usuarios === -1 ? '∞' : licenseInfo.limites.usuarios}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-2xl border border-zinc-100 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-zinc-400" />
                                    </div>
                                </div>
                            </div>
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
        <Card className="bg-white border-zinc-100 shadow-sm max-w-5xl mx-auto md:mx-0">
            <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Configuración de Proyecto</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Reglas de Generación de Códigos</p>
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
        <Card className="bg-white border-zinc-100 shadow-sm max-w-5xl mx-auto md:mx-0">
            <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Plantillas de Informes</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Configuración Predeterminada de Reportes</p>
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
        <div className="h-[calc(100vh-theme(spacing.20))] flex flex-col bg-[#F2F4F7] text-[#1A1A1A] overflow-hidden">
            <header className="bg-white border-b border-zinc-200 px-8 py-4 sticky top-0 z-40 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-500">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <SettingsIcon className="w-5 h-5 text-[#F39200]" />
                                <h1 className="text-xl font-black uppercase tracking-tight">Ajustes <span className="text-[#F39200]">Globales</span></h1>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Configuración de Entorno y Permisos</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="flex gap-12">
                    <aside className="w-64 space-y-2">
                        {((user?.rol || '').toLowerCase() === 'administrador' || isSuperAdmin) && (
                            <button
                                onClick={() => setActiveTab('mi-empresa')}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${activeTab === 'mi-empresa' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-zinc-400 hover:bg-white hover:text-[#1A1A1A]'}`}
                            >
                                <Building2 className="w-4 h-4" /> Mi Empresa
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
                        {isSuperAdmin && (
                            <button
                                onClick={() => setActiveTab('superadmins')}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${activeTab === 'superadmins' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-zinc-400 hover:bg-white hover:text-[#1A1A1A]'}`}
                            >
                                <ShieldIcon className="w-4 h-4" /> Ajuste SaaS
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('plantillas')}
                            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${activeTab === 'plantillas' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-zinc-400 hover:bg-white hover:text-[#1A1A1A]'}`}
                        >
                            <FileText className="w-4 h-4" /> Plantillas de Informes
                        </button>
                        <button
                            onClick={() => setActiveTab('config-proyecto')}
                            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${activeTab === 'config-proyecto' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-zinc-400 hover:bg-white hover:text-[#1A1A1A]'}`}
                        >
                            <Briefcase className="w-4 h-4" /> Configuración de Proyecto
                        </button>
                        {((user?.rol || '').toLowerCase() === 'administrador' || isSuperAdmin) && (
                            <button
                                onClick={() => setActiveTab('preferencias')}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${activeTab === 'preferencias' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-zinc-400 hover:bg-white hover:text-[#1A1A1A]'}`}
                            >
                                <SettingsIcon className="w-4 h-4" /> Preferencias de Aplicación
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
                            <motion.div
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
                                        activeTab === 'preferencias' ? renderPreferencias() :
                                            activeTab === 'mi-empresa' ? renderMiEmpresa() :
                                                activeTab === 'superadmins' ? renderSuperadmins() :
                                                activeTab === 'config-proyecto' ? renderProyectoConfig() :
                                                    activeTab === 'plantillas' ? renderPlantillasConfig() :
                                                        renderUsuarios()
                                )}
                            </motion.div>
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
                    <form onSubmit={activeTab === 'empresas' ? handleCreateEmpresa : handleCreateUsuario} className="flex max-h-[92vh] min-h-0 flex-col">
                        <AppModalHeader
                            title={activeTab === 'empresas'
                                ? (editMode ? 'Editar Empresa' : 'Registrar Empresa')
                                : activeTab === 'superadmins'
                                    ? 'Editar Superadministrador'
                                    : (editMode ? 'Editar Perfil' : 'Añadir Nuevo Perfil')}
                            subtitle={activeTab === 'empresas'
                                ? 'Ficha administrativa y fiscal de la empresa'
                                : activeTab === 'superadmins'
                                    ? 'Cuenta de plataforma con privilegios globales'
                                    : 'Credenciales y perfil operativo de la empresa activa'}
                            icon={activeTab === 'empresas' ? Building : activeTab === 'superadmins' ? ShieldIcon : Users}
                            iconClassName={activeTab === 'empresas' ? 'text-[#F39200]' : activeTab === 'superadmins' ? 'text-violet-700' : 'text-[#136191]'}
                            iconWrapClassName={activeTab === 'empresas' ? 'border-orange-200 bg-orange-50' : activeTab === 'superadmins' ? 'border-violet-200 bg-violet-50' : 'border-blue-200 bg-blue-50'}
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
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Nombre Comercial</Label>
                                        <Input required value={newEmpresa.nombre} onChange={e => setNewEmpresa({ ...newEmpresa, nombre: e.target.value })} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">RUC</Label>
                                            <Input required value={newEmpresa.ruc} onChange={e => setNewEmpresa({ ...newEmpresa, ruc: e.target.value })} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
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
                                        allowSuperAdminRole={activeTab === 'superadmins'}
                                        hidePolicies={editMode}
                                        isEditing={editMode}
                                        paises={paises}
                                        availableRoles={activeTab === 'superadmins' ? ['Superadministrador'] : getAvailableRoles()}
                                    />
                                </div>
                            )}

                        </AppModalBody>
                        <AppModalFooter variant="flat" className="border-t border-[#ececec] bg-[#f7f7f5] px-5 py-4">
                            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700">
                                    Cancelar
                                </button>
                                <LiquidButton type="submit" className={`!h-11 !px-8 text-white ${activeTab === 'superadmins' ? 'bg-violet-700' : activeTab === 'empresas' ? 'bg-[#1A1A1A]' : 'bg-[#F39200]'}`}>
                                    <Save className="h-4 w-4" />
                                    {activeTab === 'superadmins' ? 'Guardar Superadministrador' : editMode ? 'Guardar Cambios' : activeTab === 'empresas' ? 'Guardar Empresa' : 'Confirmar Registro'}
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
