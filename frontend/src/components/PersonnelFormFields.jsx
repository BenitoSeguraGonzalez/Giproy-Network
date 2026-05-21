import React, { useState, useEffect, useCallback } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import SearchableSelect from './ui/searchable-select';
import { maestrosApi } from '../api/maestros';
import { formatInternationalPhone, isValidPhone, resolveCountryPhonePrefix } from '../utils/phoneFormatter';
import AnimatedSelect from './ui/AnimatedSelect';

const PERSONNEL_SECTION_CLASS = 'rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[4px_4px_12px_#e1e1e1,-4px_-4px_12px_#ffffff]';
const PERSONNEL_SECTION_TITLE_CLASS = 'mb-4 text-[10px] font-black text-[#F39200] uppercase tracking-[0.2em] border-b border-orange-100 pb-2';

const PersonnelFormFields = ({ formData, setFormData, isSuperAdmin = false, allowSuperAdminRole = false, hidePolicies = false, isEditing = false, paises = [], availableRoles = [] }) => {
    const [provincias, setProvincias] = useState([]);
    const [cantones, setCantones] = useState([]);

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    const loadProvincias = useCallback(async () => {
        try {
            const data = await maestrosApi.getProvincias();
            setProvincias(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading provinces:", error);
        }
    }, []);

    const loadCantones = useCallback(async (provincia) => {
        if (!provincia) return;
        try {
            const data = await maestrosApi.getCantones(provincia);
            setCantones(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading cantons:", error);
            setCantones([]);
        }
    }, []);

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

    return (
        <div className="space-y-4">
            <section className={PERSONNEL_SECTION_CLASS}>
            <h3 className={PERSONNEL_SECTION_TITLE_CLASS}>Credenciales de Acceso</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Email / Usuario de Login</Label>
                    <Input id="email" type="email" required value={formData.email} onChange={handleChange} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                    <p className="text-[9px] font-bold text-[#F39200] uppercase tracking-tight ml-1 animate-pulse">Este correo será su usuario para acceder</p>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <Label htmlFor="password" name="password" className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Contraseña</Label>
                        {isEditing && <span className="text-[8px] font-black uppercase text-zinc-400">Opcional</span>}
                    </div>
                    <Input id="password" type="password" required={!isEditing} value={formData.password} onChange={handleChange} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                    {isEditing && <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight ml-1 leading-tight">Dejar vacío para no cambiar</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword" name="confirmPassword" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Confirmar Contraseña</Label>
                    <Input id="confirmPassword" type="password" required={!isEditing} value={formData.confirmPassword || ''} onChange={handleChange} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="nombre_completo" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Nombre Completo</Label>
                <Input id="nombre_completo" required value={formData.nombre_completo} onChange={handleChange} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
            </div>

                <div className="space-y-2">
                    <Label htmlFor="rol" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Rol de Colaborador</Label>
                    <AnimatedSelect id="rol" name="rol" value={formData.rol} onChange={handleChange} className="h-12 w-full px-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-bold uppercase overflow-hidden text-ellipsis whitespace-nowrap">
                        {/* Si estamos editando, permitimos ver todos los roles ya que la cuota ya está ocupada.
                            Si es nuevo registro y hay cuotas definidas, filtramos.
                            Si no se pasan cuotas (ej: Registro nuevo), permitimos roles base. */}
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
            </section>

            <section className={PERSONNEL_SECTION_CLASS}>
            <h3 className={PERSONNEL_SECTION_TITLE_CLASS}>Datos Personales (RUC)</h3>
            <div className="space-y-2">
                <Label htmlFor="ruc" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Identificación Fiscal / Documento (RUC/DNI/NIT)</Label>
                <div className="flex gap-2">
                    <Input 
                        id="ruc" 
                        required={!isEditing}
                        value={formData.ruc} 
                        onChange={handleChange} 
                        disabled={isEditing && formData.ruc && !isSuperAdmin} 
                        className={`h-12 rounded-xl border-zinc-200 flex-1 ${(isEditing && formData.ruc && !isSuperAdmin) ? 'bg-zinc-100 text-zinc-500 cursor-not-allowed' : 'bg-zinc-50'}`} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="nombres" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Nombres</Label>
                    <Input id="nombres" value={formData.nombres} onChange={handleChange} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="apellidos" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Apellidos</Label>
                    <Input id="apellidos" value={formData.apellidos} onChange={handleChange} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="alias" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Alias / Nombre Corto</Label>
                    <Input id="alias" value={formData.alias} onChange={handleChange} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="movil" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Móvil de Contacto</Label>
                    <Input
                        id="movil"
                        value={formData.movil}
                        onChange={handleChange}
                        onBlur={(e) => {
                            if (!e.target.value || !isValidPhone(e.target.value)) return;
                            setFormData(prev => ({ ...prev, movil: formatInternationalPhone(e.target.value, resolveCountryPhonePrefix(prev.pais)) }));
                        }}
                        className="h-12 rounded-xl bg-zinc-50 border-zinc-200"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="nacionalidad" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Nacionalidad</Label>
                    <Input id="nacionalidad" value={formData.nacionalidad} onChange={handleChange} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="profesion" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Profesión / Cargo</Label>
                    <Input id="profesion" value={formData.profesion} onChange={handleChange} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                </div>
            </div>
            </section>

            <section className={PERSONNEL_SECTION_CLASS}>
            <h3 className={PERSONNEL_SECTION_TITLE_CLASS}>Ubicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="ciudad" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Ciudad</Label>
                    <Input id="ciudad" value={formData.ciudad} onChange={handleChange} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                </div>
                {formData.pais === 'Ecuador' ? (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="provincia" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Provincia</Label>
                            <SearchableSelect
                                options={provincias.map(p => ({ id: p, nombre: p }))}
                                value={formData.provincia}
                                onChange={(val) => setFormData(prev => ({ ...prev, provincia: val, canton: '' }))}
                                placeholder="Seleccionar provincia..."
                                valueKey="id"
                                labelKey="nombre"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="canton" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Cantón</Label>
                            <SearchableSelect
                                options={cantones.map(c => ({ id: c, nombre: c }))}
                                value={formData.canton}
                                onChange={(val) => setFormData(prev => ({ ...prev, canton: val }))}
                                placeholder="Seleccionar cantón..."
                                valueKey="id"
                                labelKey="nombre"
                                disabled={!formData.provincia}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="provincia" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Provincia / Región</Label>
                            <Input id="provincia" value={formData.provincia} onChange={handleChange} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                        </div>
                        <div className="space-y-2 opacity-50">
                            <Label htmlFor="canton" className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">Cantón (Opcional)</Label>
                            <Input id="canton" value={formData.canton} onChange={handleChange} className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                        </div>
                    </>
                )}
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 ml-1">País</Label>
                <SearchableSelect
                    options={paises.map(p => ({ id: p.id, nombre: p.nombre }))}
                    value={formData.pais}
                    onChange={(val) => setFormData(prev => ({ ...prev, pais: val, provincia: '', canton: '' }))}
                    placeholder="Buscar país..."
                    label="País"
                    valueKey="nombre"
                />
            </div>
            </section>

            {!hidePolicies && (
                <section className={PERSONNEL_SECTION_CLASS}>
                    <h3 className={PERSONNEL_SECTION_TITLE_CLASS}>Política de Privacidad</h3>
                    <div className="mt-4 space-y-3 bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input id="acepta_politica_privacidad" type="checkbox" checked={formData.acepta_politica_privacidad} onChange={handleChange} className="w-5 h-5 rounded border-zinc-300 text-[#F39200] focus:ring-[#F39200]" />
                            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-tight group-hover:text-zinc-900 transition-colors">Acepto la política de privacidad y tratamiento de datos</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input id="acepta_politicas_comunicacion" type="checkbox" checked={formData.acepta_politicas_comunicacion} onChange={handleChange} className="w-5 h-5 rounded border-zinc-300 text-[#F39200] focus:ring-[#F39200]" />
                            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-tight group-hover:text-zinc-900 transition-colors">Deseo recibir comunicaciones operativas vía email/móvil</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input id="autoriza_publicidad" type="checkbox" checked={formData.autoriza_publicidad} onChange={handleChange} className="w-5 h-5 rounded border-zinc-300 text-[#F39200] focus:ring-[#F39200]" />
                            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-tight group-hover:text-zinc-900 transition-colors">Autorizo el uso de mis datos para fines publicitarios</span>
                        </label>
                    </div>
                </section>
            )}
        </div>
    );
};

export default PersonnelFormFields;
