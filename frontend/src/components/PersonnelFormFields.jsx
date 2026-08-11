import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import SearchableSelect from './ui/searchable-select';
import { maestrosApi } from '../api/maestros';
import { formatInternationalPhone, getInternationalPhoneValidationMessage, resolveCountryPhonePrefix } from '../utils/phoneFormatter';
import { validarRucEcuador, requiereValidacionRucEcuador } from '../utils/rucValidator';
import { publicAuthApi } from '../api/publicAuth';
import AnimatedSelect from './ui/AnimatedSelect';

const PERSONNEL_SECTION_CLASS = 'rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[4px_4px_12px_#e1e1e1,-4px_-4px_12px_#ffffff]';
const PERSONNEL_SECTION_TITLE_CLASS = 'mb-4 text-[10px] font-black text-[#F39200] uppercase tracking-[0.2em] border-b border-orange-100 pb-2';

const PersonnelFormFields = ({ formData, setFormData, isSuperAdmin = false, allowSuperAdminRole = false, hidePolicies = false, isEditing = false, paises = [], availableRoles = [], publicRegister = false, countryLocked = false, onRucStatusChange }) => {
    const [provincias, setProvincias] = useState([]);
    const [cantones, setCantones] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordMismatchTouched, setPasswordMismatchTouched] = useState(false);
    const [mobileValidationMessage, setMobileValidationMessage] = useState('');
    const [rucError, setRucError] = useState('');
    const [rucTouched, setRucTouched] = useState(false);
    const [rucLoading, setRucLoading] = useState(false);
    const [rucVerified, setRucVerified] = useState(false);
    const [rucLookup, setRucLookup] = useState(null);
    const rucLoadingRef = useRef(false);
    const isEcuador = requiereValidacionRucEcuador(formData.pais);

    const consultarRucApi = async (ruc) => {
        if (!publicRegister || rucLoadingRef.current || rucVerified) return;
        if (!requiereValidacionRucEcuador(formData.pais)) return;
        rucLoadingRef.current = true;
        setRucLoading(true);
        try {
            const data = await publicAuthApi.validarRuc(ruc);
            if (!data.valido) {
                setRucLookup(data);
                setRucError(data.mensaje || 'El RUC no consta en la fuente fiscal disponible.');
                return;
            }
            setRucLookup(data);
            setRucError('');
            setRucVerified(true);
        } catch {
            setRucError('No se pudo verificar el RUC. Verifica tu conexión e intenta de nuevo.');
        } finally {
            rucLoadingRef.current = false;
            setRucLoading(false);
        }
    };

    const sectionClass = publicRegister
        ? 'rounded-[0.95rem] border border-[#ececec] bg-white p-3 shadow-[3px_3px_9px_#e1e1e1,-3px_-3px_9px_#ffffff]'
        : PERSONNEL_SECTION_CLASS;
    const sectionTitleClass = publicRegister
        ? 'mb-3 text-[9px] font-black text-[#F39200] uppercase tracking-[0.18em] border-b border-orange-100 pb-2'
        : PERSONNEL_SECTION_TITLE_CLASS;
    const inputClass = publicRegister
        ? 'h-10 rounded-lg bg-zinc-50 border-zinc-200 text-[12px] font-semibold'
        : 'h-12 rounded-xl bg-zinc-50 border-zinc-200';
    const selectTriggerClass = publicRegister
        ? 'font-sans flex items-center justify-between w-full h-10 px-3 py-2 text-[12px] font-semibold border cursor-pointer transition-all duration-200 rounded-lg bg-zinc-50 border-zinc-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent'
        : '';
    const fieldGapClass = publicRegister ? 'gap-3' : 'gap-4';
    const fieldSpaceClass = publicRegister ? 'space-y-1.5' : 'space-y-2';
    const passwordMismatch = publicRegister
        && passwordMismatchTouched
        && Boolean(formData.password)
        && Boolean(formData.confirmPassword)
        && formData.password !== formData.confirmPassword;

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        if (id === 'movil' && mobileValidationMessage) {
            setMobileValidationMessage('');
        }
        if (id === 'ruc') {
            setRucVerified(false);
            setRucLookup(null);
            if (requiereValidacionRucEcuador(formData.pais)) {
                if (value.length === 13 || rucTouched) {
                    // Al completar 13 dígitos se considera "tocado" para mostrar errores de inmediato
                    if (value.length === 13 && !rucTouched) setRucTouched(true);
                    const result = validarRucEcuador(value);
                    setRucError(result.valido ? '' : result.mensaje);
                    // Auto-consulta del catálogo PostgreSQL alimentado por el SRI.
                    if (publicRegister && value.length === 13 && result.valido && !rucLoadingRef.current) {
                        consultarRucApi(value);
                    }
                } else {
                    setRucError('');
                }
            } else {
                setRucError('');
            }
        }
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    const hasRucError = publicRegister && rucTouched && Boolean(rucError);
    const rucStatusClass = !publicRegister ? '' : (
        rucLoading ? 'border-amber-300 bg-amber-50/30 animate-pulse' :
        rucVerified ? 'border-emerald-400 bg-emerald-50/60 text-emerald-900 focus-visible:ring-emerald-300' :
        hasRucError ? 'border-red-400 bg-red-50/60 text-red-900 focus-visible:ring-red-300' :
        ''
    );

    const loadProvincias = useCallback(async () => {
        try {
            const data = await maestrosApi.getProvincias();
            setProvincias(Array.isArray(data) ? data : []);
        } catch {
            setProvincias([]);
        }
    }, []);

    const loadCantones = useCallback(async (provincia) => {
        if (!provincia) return;
        try {
            const data = await maestrosApi.getCantones(provincia);
            setCantones(Array.isArray(data) ? data : []);
        } catch {
            setCantones([]);
        }
    }, []);

    const handlePasswordBlur = () => {
        if (!publicRegister) return;
        if (formData.password || formData.confirmPassword) {
            setPasswordMismatchTouched(true);
        }
    };

    const handleMobileBlur = (e) => {
        const value = e.target.value;
        if (!value) {
            setMobileValidationMessage('');
            return;
        }

        const validationMessage = getInternationalPhoneValidationMessage(value, formData.pais);
        setMobileValidationMessage(validationMessage);

        if (validationMessage) return;

        setFormData(prev => ({
            ...prev,
            movil: formatInternationalPhone(value, resolveCountryPhonePrefix(prev.pais)),
        }));
    };

    const handleRucBlur = async () => {
        if (!publicRegister) return;
        const value = formData.ruc;
        if (!value) {
            setRucTouched(false);
            setRucError('');
            return;
        }
        setRucTouched(true);

        // Validación estructural primero
        if (requiereValidacionRucEcuador(formData.pais)) {
            const result = validarRucEcuador(value);
            if (!result.valido) {
                setRucError(result.mensaje);
                return;
            }
            setRucError('');
        } else {
            setRucError('');
            return;
        }

        // Consultar API (el guard interno evita duplicados si ya se disparó automáticamente)
        consultarRucApi(value);
    };

    const renderPasswordVisibilityIcon = (visible) => (
        visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
    );

    useEffect(() => {
        if (formData.pais === 'Ecuador' && provincias.length === 0) {
            setTimeout(() => loadProvincias(), 0);
        }
    }, [formData.pais, loadProvincias, provincias.length]);

    useEffect(() => {
        // Solo cargar si cambió la provincia y el país es Ecuador
        if (formData.pais === 'Ecuador' && formData.provincia) {
            setTimeout(() => loadCantones(formData.provincia), 0);
        } else if (formData.pais !== 'Ecuador') {
            setTimeout(() => setCantones(prev => prev.length > 0 ? [] : prev), 0);
        }
    }, [formData.provincia, formData.pais, loadCantones]);

    // Propagar estado de verificación del RUC al padre (RegisterModal)
    useEffect(() => {
        if (onRucStatusChange) onRucStatusChange(rucVerified, rucLookup);
    }, [rucVerified, rucLookup, onRucStatusChange]);

    return (
        <div className="space-y-4">
            {/* ============ DATOS DE PERSONA NATURAL / REPRESENTANTE LEGAL ============ */}
            <section className={sectionClass}>
            <h3 className={sectionTitleClass}>Datos de Persona Natural / Representante Legal</h3>
            <div className={fieldSpaceClass}>
                <Label htmlFor="ruc" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">
                    {isEcuador ? 'RUC' : 'Identificación fiscal (NIF/NIE/CIF u homólogo)'}
                </Label>
                <div className="flex gap-2 items-start">
                    <Input
                        id="ruc"
                        required={!isEditing}
                        value={formData.ruc}
                        onChange={handleChange}
                        onBlur={handleRucBlur}
                        maxLength={isEcuador ? 13 : 20}
                        inputMode={isEcuador ? 'numeric' : 'text'}
                        disabled={Boolean(isEditing && formData.ruc)}
                        className={`${publicRegister ? 'h-10 rounded-lg text-[12px] font-semibold' : 'h-12 rounded-xl'} border-zinc-200 flex-1 ${(isEditing && formData.ruc) ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'bg-zinc-50'} ${rucStatusClass}`}
                    />
                    {publicRegister && rucLoading && (
                        <Loader2 className="h-5 w-5 text-amber-500 shrink-0 mt-2.5 animate-spin" />
                    )}
                    {publicRegister && !rucLoading && rucVerified && (
                        <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-2.5" />
                    )}
                </div>
                {hasRucError && (
                    <p className="text-[9px] font-black uppercase tracking-tight text-red-600 ml-1">
                        {rucError}
                    </p>
                )}
                {publicRegister && !isEcuador && formData.pais && (
                    <p className="text-[10px] font-semibold text-zinc-500">
                        Se guardará como identificación declarada; la consulta SRI se aplica únicamente a Ecuador.
                    </p>
                )}
                {publicRegister && !isEcuador && (
                    <div className={fieldSpaceClass}>
                        <Label htmlFor="empresa_nombre" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Razón social / nombre legal</Label>
                        <Input id="empresa_nombre" required value={formData.empresa_nombre || ''} onChange={handleChange} className={inputClass} />
                    </div>
                )}
                {publicRegister && rucVerified && rucLookup?.source_date && (
                    <p className="text-[9px] font-semibold text-emerald-700 ml-1">
                        Fuente fiscal verificada · datos vigentes desde {new Date(rucLookup.source_date).toLocaleDateString()}
                    </p>
                )}
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 ${fieldGapClass}`}>
                <div className={fieldSpaceClass}>
                    <Label htmlFor="nombres" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Nombres</Label>
                    <Input
                        id="nombres"
                        value={formData.nombres}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>
                <div className={fieldSpaceClass}>
                    <Label htmlFor="apellidos" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Apellidos</Label>
                    <Input
                        id="apellidos"
                        value={formData.apellidos}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 ${fieldGapClass}`}>
                <div className={fieldSpaceClass}>
                    <Label htmlFor="alias" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Alias / Nombre Corto</Label>
                    <Input id="alias" value={formData.alias} onChange={handleChange} className={inputClass} />
                </div>
                {publicRegister && (
                    <div className={fieldSpaceClass}>
                        <Label htmlFor="empresa_alias" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Alias de Empresa</Label>
                        <Input id="empresa_alias" value={formData.empresa_alias || ''} onChange={handleChange} className={inputClass} />
                    </div>
                )}
                {!publicRegister && (
                <div className={fieldSpaceClass}>
                    <Label htmlFor="movil" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Móvil de Contacto</Label>
                    <Input
                        id="movil"
                        value={formData.movil}
                        onChange={handleChange}
                        onBlur={handleMobileBlur}
                        className={`${inputClass} ${mobileValidationMessage ? 'border-red-400 bg-red-50/60 text-red-900 focus-visible:ring-red-300' : ''}`}
                    />
                    {mobileValidationMessage && (
                        <p className="text-[9px] font-black uppercase tracking-tight text-red-600 ml-1">
                            {mobileValidationMessage}
                        </p>
                    )}
                </div>
                )}
            </div>

            {publicRegister && (
                <div className={fieldSpaceClass}>
                    <Label htmlFor="movil" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Móvil de Contacto</Label>
                    <Input
                        id="movil"
                        value={formData.movil}
                        onChange={handleChange}
                        onBlur={handleMobileBlur}
                        className={`${inputClass} ${mobileValidationMessage ? 'border-red-400 bg-red-50/60 text-red-900 focus-visible:ring-red-300' : ''}`}
                    />
                    {mobileValidationMessage && (
                        <p className="text-[9px] font-black uppercase tracking-tight text-red-600 ml-1">
                            {mobileValidationMessage}
                        </p>
                    )}
                </div>
            )}

            <div className={`grid grid-cols-1 md:grid-cols-2 ${fieldGapClass}`}>
                <div className={fieldSpaceClass}>
                    <Label htmlFor="nacionalidad" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Nacionalidad</Label>
                    <Input id="nacionalidad" value={formData.nacionalidad} onChange={handleChange} className={inputClass} />
                </div>
                <div className={fieldSpaceClass}>
                    <Label htmlFor="profesion" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Profesión / Cargo</Label>
                    <Input id="profesion" value={formData.profesion} onChange={handleChange} className={inputClass} />
                </div>
            </div>
            </section>

            {/* ============ UBICACIÓN ============ */}
            <section className={sectionClass}>
            <h3 className={sectionTitleClass}>Ubicación</h3>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${fieldGapClass}`}>
                <div className={fieldSpaceClass}>
                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">País</Label>
                    <SearchableSelect
                        options={paises.map(p => ({ id: p.id, nombre: p.nombre }))}
                        value={formData.pais}
                        onChange={(val) => { setFormData(prev => ({ ...prev, pais: val, provincia: '', canton: '', empresa_nombre: requiereValidacionRucEcuador(val) ? '' : prev.empresa_nombre })); setRucError(''); setRucTouched(false); setRucVerified(false); setRucLookup(null); }}
                        placeholder={countryLocked ? 'País detectado por IP' : 'Buscar país...'}
                        label="País"
                        valueKey="nombre"
                        disabled={countryLocked}
                        triggerClassName={selectTriggerClass}
                    />
                </div>
                {formData.pais === 'Ecuador' ? (
                    <>
                        <div className={fieldSpaceClass}>
                            <Label htmlFor="provincia" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Provincia</Label>
                            <SearchableSelect
                                options={provincias.map(p => ({ id: p, nombre: p }))}
                                value={formData.provincia}
                                onChange={(val) => setFormData(prev => ({ ...prev, provincia: val, canton: '' }))}
                                placeholder="Seleccionar provincia..."
                                valueKey="id"
                                labelKey="nombre"
                                triggerClassName={selectTriggerClass}
                            />
                        </div>
                        <div className={fieldSpaceClass}>
                            <Label htmlFor="canton" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Cantón</Label>
                            <SearchableSelect
                                options={cantones.map(c => ({ id: c, nombre: c }))}
                                value={formData.canton}
                                onChange={(val) => setFormData(prev => ({ ...prev, canton: val }))}
                                placeholder="Seleccionar cantón..."
                                valueKey="id"
                                labelKey="nombre"
                                disabled={!formData.provincia}
                                triggerClassName={selectTriggerClass}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className={fieldSpaceClass}>
                            <Label htmlFor="provincia" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Provincia / Región</Label>
                            <Input id="provincia" value={formData.provincia} onChange={handleChange} className={inputClass} />
                        </div>
                        <div className={`${fieldSpaceClass} ${publicRegister ? '' : 'opacity-50'}`}>
                            <Label htmlFor="canton" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">{publicRegister ? 'Cantón' : 'Cantón (Opcional)'}</Label>
                            <Input id="canton" value={formData.canton} onChange={handleChange} className={inputClass} />
                        </div>
                    </>
                )}
                <div className={fieldSpaceClass}>
                    <Label htmlFor="ciudad" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Ciudad</Label>
                    <Input id="ciudad" value={formData.ciudad} onChange={handleChange} className={inputClass} />
                </div>
            </div>
            </section>

            {/* ============ CREDENCIALES DE ACCESO ============ */}
            <section className={sectionClass}>
            <h3 className={sectionTitleClass}>Credenciales de Acceso</h3>
            <div className={`grid grid-cols-1 ${publicRegister ? 'md:grid-cols-2' : 'md:grid-cols-3'} ${fieldGapClass}`}>
                <div className={`${fieldSpaceClass} ${publicRegister ? 'md:col-span-2' : ''}`}>
                    <Label htmlFor="email" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Email (login)</Label>
                    <Input id="email" type="email" required value={formData.email} onChange={handleChange} className={inputClass} />
                    <p className="text-[9px] font-bold text-[#F39200] uppercase tracking-tight ml-1 animate-pulse">Este correo será su usuario para acceder</p>
                </div>
                <div className={fieldSpaceClass}>
                    <div className="flex justify-between items-center ml-1">
                        <Label htmlFor="password" name="password" className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Contraseña</Label>
                        {isEditing && <span className="text-[8px] font-black uppercase text-zinc-400">Opcional</span>}
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            required={!isEditing}
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={handlePasswordBlur}
                            className={`${inputClass} pr-11 ${passwordMismatch ? 'border-red-400 bg-red-50/60 text-red-900 focus-visible:ring-red-300' : ''}`}
                        />
                        {publicRegister && (
                            <button
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#F39200]/30"
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                            >
                                {renderPasswordVisibilityIcon(showPassword)}
                            </button>
                        )}
                    </div>
                    {isEditing && <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight ml-1 leading-tight">Dejar vacío para no cambiar</p>}
                </div>
                <div className={fieldSpaceClass}>
                    <Label htmlFor="confirmPassword" name="confirmPassword" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Confirmar Contraseña</Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            required={!isEditing}
                            value={formData.confirmPassword || ''}
                            onChange={handleChange}
                            onBlur={handlePasswordBlur}
                            className={`${inputClass} pr-11 ${passwordMismatch ? 'border-red-400 bg-red-50/60 text-red-900 focus-visible:ring-red-300' : ''}`}
                        />
                        {publicRegister && (
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(prev => !prev)}
                                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#F39200]/30"
                                aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Ver confirmación'}
                                title={showConfirmPassword ? 'Ocultar confirmación' : 'Ver confirmación'}
                            >
                                {renderPasswordVisibilityIcon(showConfirmPassword)}
                            </button>
                        )}
                    </div>
                    {passwordMismatch && (
                        <p className="text-[9px] font-black uppercase tracking-tight text-red-600 ml-1">
                            Las contraseñas no coinciden.
                        </p>
                    )}
                </div>
            </div>

            {!publicRegister && (
            <div className={fieldSpaceClass}>
                <Label htmlFor="nombre_completo" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Nombre Completo</Label>
                <Input id="nombre_completo" required value={formData.nombre_completo} onChange={handleChange} className={inputClass} />
            </div>
            )}

                {!publicRegister && (
                <div className="space-y-2">
                    <Label htmlFor="rol" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Rol de Colaborador</Label>
                    <AnimatedSelect id="rol" name="rol" value={formData.rol} onChange={handleChange} className="h-12 w-full px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-bold uppercase overflow-hidden text-ellipsis whitespace-nowrap">
                        {(isEditing || !availableRoles || availableRoles.length === 0 || availableRoles.includes('usuario')) && (
                            <option value="usuario">Colaborador Estándar</option>
                        )}
                        {(isEditing || !availableRoles || availableRoles.length === 0 || availableRoles.includes('usuario_comunidad')) && (
                            <option value="usuario_comunidad">Usuario Comunidad</option>
                        )}
                        {(isEditing || !availableRoles || availableRoles.length === 0 || availableRoles.includes('administrador')) && (
                            <option value="administrador">Administrador</option>
                        )}
                        {isSuperAdmin && allowSuperAdminRole && (
                            <option value="Superadministrador">Superadministrador</option>
                        )}
                    </AnimatedSelect>
                </div>
                )}
            </section>

            {/* ============ POLÍTICA DE PRIVACIDAD ============ */}
            {!hidePolicies && (
                <section className={PERSONNEL_SECTION_CLASS}>
                    <h3 className={PERSONNEL_SECTION_TITLE_CLASS}>Política de Privacidad</h3>
                    <div className="mt-4 space-y-3 bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input id="acepta_terminos" type="checkbox" checked={Boolean(formData.acepta_terminos)} onChange={handleChange} className="mt-0.5 w-5 h-5 rounded border-zinc-300 text-[#F39200] focus:ring-[#F39200]" />
                            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-tight group-hover:text-zinc-900 transition-colors">
                                Acepto los <a href="/legal/terminos" target="_blank" rel="noreferrer" className="text-orange-700 underline underline-offset-2">Términos y Condiciones</a> (obligatorio)
                            </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input id="acepta_politica_privacidad" type="checkbox" checked={formData.acepta_politica_privacidad} onChange={handleChange} className="w-5 h-5 rounded border-zinc-300 text-[#F39200] focus:ring-[#F39200]" />
                            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-tight group-hover:text-zinc-900 transition-colors">Acepto la <a href="/legal/privacidad" target="_blank" rel="noreferrer" className="text-orange-700 underline underline-offset-2">política de privacidad y tratamiento de datos</a> (obligatorio)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input id="acepta_politicas_comunicacion" type="checkbox" checked={formData.acepta_politicas_comunicacion} onChange={handleChange} className="w-5 h-5 rounded border-zinc-300 text-[#F39200] focus:ring-[#F39200]" />
                            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-tight group-hover:text-zinc-900 transition-colors">Deseo recibir comunicaciones informativas no esenciales vía email/móvil (opcional)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input id="autoriza_publicidad" type="checkbox" checked={formData.autoriza_publicidad} onChange={handleChange} className="w-5 h-5 rounded border-zinc-300 text-[#F39200] focus:ring-[#F39200]" />
                            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-tight group-hover:text-zinc-900 transition-colors">Autorizo el uso de mis datos para fines publicitarios (opcional)</span>
                        </label>
                    </div>
                </section>
            )}
        </div>
    );
};

export default PersonnelFormFields;
