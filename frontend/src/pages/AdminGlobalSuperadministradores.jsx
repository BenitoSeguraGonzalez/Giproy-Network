import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit2, Loader2, Save, Shield, ShieldCheck, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { usuariosApi } from '../api/usuarios';
import { maestrosApi } from '../api/maestros';
import { Card, CardContent } from '../components/ui/card';
import { LiquidButton } from '../components/ui/liquid-button';
import PersonnelFormFields from '../components/PersonnelFormFields';
import ClearSearchField from '../components/ui/ClearSearchField';
import { AppModalShell, AppModalHeader, AppModalBody, AppModalFooter } from '../components/ui/app-modal';
import { ProjectSectionIconButton } from '../components/projects/ProjectSectionReportButton';
import { appAlert } from '../utils/appDialog';
import { formatInternationalPhone, isValidPhone, resolveCountryPhonePrefix } from '../utils/phoneFormatter';
import { includesNormalized } from '../utils/normalizeSearch';
import { getCompanyDisplayName } from '../utils/companyDisplayName';

const emptySuperadminForm = {
    email: '',
    password: '',
    confirmPassword: '',
    nombre_completo: '',
    rol: 'Superadministrador',
    empresa_id: '',
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
    autoriza_publicidad: false,
};

const buildSuperadminPayload = (formData) => {
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
    ];
    const payload = {};
    allowedKeys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(formData, key)) {
            payload[key] = formData[key];
        }
    });
    payload.email = String(payload.email || '').trim();
    payload.nombre_completo = String(payload.nombre_completo || '').trim();
    payload.rol = 'Superadministrador';
    if (!payload.password) delete payload.password;
    return payload;
};

const AdminGlobalSuperadministradores = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestedEditUser = searchParams.get('edit_user');
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const editHandledRef = useRef(false);
    const [usuarios, setUsuarios] = useState([]);
    const [paises, setPaises] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState(emptySuperadminForm);

    const loadData = useCallback(async () => {
        if (!isSuperadmin) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await usuariosApi.getAllGlobal();
            setUsuarios(Array.isArray(data) ? data : []);
        } catch {
            appAlert('No se pudieron cargar los superadministradores.');
        } finally {
            setLoading(false);
        }
    }, [isSuperadmin]);

    const loadPaises = useCallback(async () => {
        try {
            const data = await maestrosApi.getPaises();
            setPaises(Array.isArray(data) ? data : []);
        } catch {
            setPaises([]);
        }
    }, []);

    useEffect(() => {
        loadData();
        loadPaises();
    }, [loadData, loadPaises]);

    const filteredSuperadmins = useMemo(() => (
        usuarios.filter((usuario) => {
            const role = (usuario?.rol || '').toLowerCase();
            if (role !== 'superadministrador') return false;
            return includesNormalized(
                `${usuario.nombre_completo || ''} ${usuario.email || ''} ${getCompanyDisplayName(usuario.empresa, '')} ${usuario.alias || ''} ${usuario.profesion || ''}`,
                searchTerm,
            );
        })
    ), [usuarios, searchTerm]);

    const openEditModal = useCallback((usuario) => {
        setSelectedId(usuario.id);
        setFormData({
            ...emptySuperadminForm,
            ...usuario,
            rol: 'Superadministrador',
            ruc: usuario.ruc || '',
            nombres: usuario.nombres || '',
            apellidos: usuario.apellidos || '',
            alias: usuario.alias || '',
            nacionalidad: usuario.nacionalidad || '',
            profesion: usuario.profesion || '',
            ciudad: usuario.ciudad || '',
            provincia: usuario.provincia || '',
            canton: usuario.canton || '',
            pais: usuario.pais || '',
            movil: usuario.movil || '',
            password: '',
            confirmPassword: '',
        });
        setShowEditModal(true);
    }, []);

    useEffect(() => {
        if (requestedEditUser !== 'me') {
            editHandledRef.current = false;
            return;
        }
        if (!isSuperadmin || editHandledRef.current || !user?.id) return;
        openEditModal({
            ...user,
            rol: 'Superadministrador',
            empresa_id: user.empresa_id || '',
        });
        editHandledRef.current = true;
    }, [requestedEditUser, user, isSuperadmin, openEditModal]);

    const submitEdit = async (event) => {
        event.preventDefault();
        if ((formData.password || formData.confirmPassword) && formData.password !== formData.confirmPassword) {
            appAlert('Las contraseñas no coinciden');
            return;
        }

        try {
            const payload = buildSuperadminPayload(formData);
            if (payload.movil) {
                if (!isValidPhone(payload.movil)) {
                    appAlert('El móvil debe tener un formato válido');
                    return;
                }
                payload.movil = formatInternationalPhone(payload.movil, resolveCountryPhonePrefix(payload.pais));
            }
            await usuariosApi.updateGlobal(selectedId, payload);
            setShowEditModal(false);
            setFormData(emptySuperadminForm);
            await loadData();
        } catch (error) {
            appAlert(error.response?.data?.detail || 'Error al guardar Superadministrador');
        }
    };

    if (!isSuperadmin) {
        return (
            <div className="h-[calc(100vh-theme(spacing.20))] bg-[#F2F4F7] p-12">
                <button onClick={() => navigate('/admin-global')} className="mb-8 flex items-center gap-2 text-xs font-bold uppercase text-zinc-500 transition-colors hover:text-[#F39200]">
                    <ArrowLeft className="h-4 w-4" /> Volver
                </button>
                <Card className="max-w-4xl border-none rounded-[2rem] shadow-sm">
                    <CardContent className="p-10">
                        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-red-400">Acceso restringido</p>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900">Superadministradores</h1>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-theme(spacing.20))] bg-[#F2F4F7] overflow-y-auto p-8 xl:p-12 custom-scrollbar">
            <div className="mx-auto max-w-7xl">
                <button onClick={() => navigate('/admin-global')} className="mb-8 flex items-center gap-2 text-xs font-bold uppercase text-zinc-500 transition-colors hover:text-[#F39200]">
                    <ArrowLeft className="h-4 w-4" /> Volver a Administración Global
                </button>

                <header className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-violet-600">SaaS / Superadministrador</p>
                        <h1 className="text-4xl font-black uppercase tracking-tight text-[#1A1A1A]">Superadministradores</h1>
                        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-600">
                            Gestión exclusiva de cuentas con privilegio máximo de plataforma. Esta superficie vive fuera de Settings Empresa.
                        </p>
                    </div>
                    <ClearSearchField
                        value={searchTerm || ''}
                        onValueChange={setSearchTerm}
                        placeholder="Buscar superadministrador..."
                        containerClassName="w-full xl:w-96"
                        inputClassName="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-10 text-xs font-bold uppercase tracking-widest transition-all focus:outline-none focus:border-violet-600"
                    />
                </header>

                <section className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.75rem] border border-violet-100 bg-white px-5 py-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-500">Cuentas</p>
                        <p className="mt-3 text-3xl font-black tracking-tight text-violet-700">{filteredSuperadmins.length}</p>
                    </div>
                    <div className="rounded-[1.75rem] border border-emerald-100 bg-white px-5 py-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Activas</p>
                        <p className="mt-3 text-3xl font-black tracking-tight text-emerald-700">
                            {filteredSuperadmins.filter((item) => item.activo !== false).length}
                        </p>
                    </div>
                    <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Ámbito</p>
                        <p className="mt-3 text-sm font-black uppercase tracking-widest text-zinc-900">Plataforma</p>
                    </div>
                </section>

                <Card className="border-none rounded-[2rem] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.05)]">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex h-80 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-[#F39200]" />
                            </div>
                        ) : filteredSuperadmins.length === 0 ? (
                            <div className="p-16 text-center">
                                <Shield className="mx-auto h-12 w-12 text-zinc-200" />
                                <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-zinc-400">Sin superadministradores para este filtro</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b border-zinc-200 bg-zinc-50">
                                        <tr>
                                            <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Cuenta</th>
                                            <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Contacto</th>
                                            <th className="px-8 py-5 text-center text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Ámbito</th>
                                            <th className="px-8 py-5 text-center text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Estado</th>
                                            <th className="px-8 py-5 text-center text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200/70">
                                        {filteredSuperadmins.map((item) => (
                                            <tr key={item.id} className="transition-colors hover:bg-zinc-50">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-[11px] font-black uppercase text-violet-700 shadow-sm">
                                                            {(item.nombre_completo || 'S').split(' ').map((part) => part[0]).join('').substring(0, 2)}
                                                        </div>
                                                        <div className="flex min-w-0 flex-col gap-0.5">
                                                            <span className="truncate text-xs font-black uppercase text-[#1A1A1A]">{item.nombre_completo}</span>
                                                            <span className="truncate text-[8px] font-bold uppercase tracking-widest text-zinc-400">{item.alias || 'Sin alias'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-bold text-zinc-600">{item.email}</span>
                                                        <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">{item.movil || 'Sin móvil'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-violet-700">
                                                        Plataforma
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center">
                                                        {item.activo !== false ? (
                                                            <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-1">
                                                                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-green-700">Activo</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-1 grayscale">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-red-700">Bloqueado</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <ProjectSectionIconButton
                                                        icon={Edit2}
                                                        label="Editar superadministrador"
                                                        onClick={() => openEditModal(item)}
                                                        className="hover:border-violet-200 hover:text-violet-700"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {showEditModal && (
                <AppModalShell
                    size="lg"
                    zIndex="z-[120]"
                    onClose={() => setShowEditModal(false)}
                    panelClassName="bg-[#f7f7f5]"
                    overlayClassName="overflow-y-auto"
                >
                    <form onSubmit={submitEdit} className="flex max-h-[92vh] min-h-0 flex-col">
                        <AppModalHeader
                            title="Editar Superadministrador"
                            subtitle="Cuenta de plataforma con privilegios globales"
                            icon={ShieldCheck}
                            iconClassName="text-violet-700"
                            iconWrapClassName="border-violet-200 bg-violet-50"
                            onClose={() => setShowEditModal(false)}
                            closeButton={(
                                <ProjectSectionIconButton
                                    icon={X}
                                    label="Cerrar"
                                    onClick={() => setShowEditModal(false)}
                                    iconClassName="text-zinc-600"
                                />
                            )}
                        />
                        <AppModalBody className="min-h-0 flex-1 overflow-y-auto bg-[#f7f7f5] p-5 custom-scrollbar">
                            <PersonnelFormFields
                                formData={formData}
                                setFormData={setFormData}
                                isSuperAdmin
                                allowSuperAdminRole
                                hidePolicies
                                isEditing
                                paises={paises}
                                availableRoles={['Superadministrador']}
                            />
                        </AppModalBody>
                        <AppModalFooter variant="flat" className="border-t border-[#ececec] bg-[#f7f7f5] px-5 py-4">
                            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
                                <button type="button" onClick={() => setShowEditModal(false)} className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700">
                                    Cancelar
                                </button>
                                <LiquidButton type="submit" className="!h-11 !px-8 bg-violet-700 text-white">
                                    <Save className="h-4 w-4" />
                                    Guardar Superadministrador
                                </LiquidButton>
                            </div>
                        </AppModalFooter>
                    </form>
                </AppModalShell>
            )}
        </div>
    );
};

export default AdminGlobalSuperadministradores;
