import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    Users, Plus, Search, Mail, Phone, Briefcase,
    Building2, MapPin, Trash2, Edit3, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LiquidButton } from '../ui/liquid-button';
import SearchableSelect from '../ui/searchable-select';
import { stakeholdersApi } from '../../api/stakeholders';
import { maestrosApi } from '../../api/maestros';
import reportingApi from '../../api/reporting';
import { AuthContext } from '../../context/AuthContext';
import { normalizeTextInputValue } from '../../utils/normalizeInputValue';
import { appAlert, appConfirm } from '../../utils/appDialog';
import { formatInternationalPhone, isValidPhone, resolveCountryPhonePrefix } from '../../utils/phoneFormatter';
import ClearSearchField from '../ui/ClearSearchField';
import ProjectSectionReportButton from './ProjectSectionReportButton';
import CommonReportPreviewModal from '../reporting/CommonReportPreviewModal';
import ReportGenerationModal from '../reporting/ReportGenerationModal';
import AppHint from '../ui/AppHint';
import { APP_MODAL_CLOSE_BUTTON_CLASS } from '../ui/app-modal';
import { extractBlobErrorMessage } from '../../utils/apiBlobErrors';
import { buildReportFileName, sanitizeReportContext } from '../../utils/reportFileName';
import { normalizePersonName } from '../../utils/descriptionCapitalization';
import { downloadBlobResponse } from '../../utils/blobDownload';
import { PLANTILLAS_OPCIONES } from '../../constants/plantillas';

const normalizeStakeholderSearchToken = (value) =>
    normalizeTextInputValue(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

const STAKEHOLDER_HEADER_SURFACE =
    'rounded-[1.1rem] border border-[#ececec] bg-[#f3f3f1] px-4 py-3 shadow-[8px_8px_20px_#dddddd,-8px_-8px_20px_#ffffff]';

const STAKEHOLDER_HEADER_TITLE =
    'text-lg font-black uppercase tracking-tight text-purple-500';

const STAKEHOLDER_HEADER_SUBTITLE =
    'text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400';

const STAKEHOLDER_LABEL_CLASS =
    'text-[10px] font-black uppercase tracking-widest text-zinc-500';

const STAKEHOLDER_INPUT_CLASS =
    'h-11 rounded-xl border-zinc-200 bg-white font-medium text-zinc-800 focus:border-[#F39200]';

const STAKEHOLDER_ROW_ACTION_BUTTON_BASE =
    'inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#ececec] bg-[#ededed] shadow-[3px_3px_8px_#d5d5d5,-3px_-3px_8px_#ffffff] transition hover:brightness-[0.99] active:scale-[0.98] active:shadow-[inset_2px_2px_6px_#d0d0d0,inset_-2px_-2px_6px_#ffffff] disabled:cursor-not-allowed disabled:opacity-60';

const compactLocationLabel = (stakeholder) =>
    stakeholder?.ciudad || stakeholder?.canton || stakeholder?.provincia || stakeholder?.pais || 'Sin ubicación';

const buildNormalizedStakeholderPayload = (formData) => {
    const payload = {
        ...formData,
        nombre: normalizeTextInputValue(formData.nombre),
        apellidos: normalizeTextInputValue(formData.apellidos),
        email: normalizeTextInputValue(formData.email),
        profesion: normalizeTextInputValue(formData.profesion),
        institucion: normalizeTextInputValue(formData.institucion),
        pais: normalizeTextInputValue(formData.pais) || 'Ecuador',
        provincia: normalizeTextInputValue(formData.provincia),
        canton: normalizeTextInputValue(formData.canton),
        ciudad: normalizeTextInputValue(formData.ciudad),
        direccion_detalle: normalizeTextInputValue(formData.direccion_detalle),
    };

    const rawPhone = normalizeTextInputValue(formData.movil);
    if (!rawPhone) {
        payload.movil = '';
        return payload;
    }

    if (!isValidPhone(rawPhone)) {
        throw new Error('Telefono invalido');
    }

    payload.movil = formatInternationalPhone(rawPhone, resolveCountryPhonePrefix(payload.pais));
    return payload;
};


const Stakeholders = ({ project }) => {
    const { user, selectedEmpresa } = useContext(AuthContext);
    const normalizedRole = (user?.rol || '').toLowerCase();
    const empId = selectedEmpresa?.id || user?.empresa_id || null;
    const [stakeholders, setStakeholders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingStk, setEditingStk] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastAddedId, setLastAddedId] = useState(null);
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [reportPreview, setReportPreview] = useState(null);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [loadingReportPreview, setLoadingReportPreview] = useState(false);
    const [reportTemplateId, setReportTemplateId] = useState(
        project?.plantillas_config?.stakeholders
            || selectedEmpresa?.plantillas_config?.stakeholders
            || PLANTILLAS_OPCIONES.stakeholders.options[0]?.id
            || '001'
    );

    const [provincias, setProvincias] = useState([]);
    const [cantones, setCantones] = useState([]);

    const [formData, setFormData] = useState({
        nombre: '', apellidos: '', email: '', movil: '',
        profesion: '', institucion: '',
        pais: 'Ecuador', provincia: '', canton: '', ciudad: '',
        direccion_detalle: '', proyecto_codigo_root: project.codigo_root
    });

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const stksData = await stakeholdersApi.getByProject(project.codigo_root, project.id, empId);
            setStakeholders(stksData);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    }, [project.codigo_root, project.id, empId]);

    const fetchProvincias = useCallback(async () => {
        try {
            const res = await maestrosApi.getProvincias();
            setProvincias(res.data || res);
        } catch (error) { console.error("Error provincias:", error); }
    }, []);

    const fetchCantones = useCallback(async (provincia) => {
        try {
            const res = await maestrosApi.getCantones(provincia);
            setCantones(res.data || res);
        } catch (error) { console.error("Error cantones:", error); }
    }, []);

    useEffect(() => {
        fetchAll();
        fetchProvincias();
    }, [fetchAll, fetchProvincias]);

    useEffect(() => {
        if (formData.pais === 'Ecuador' && formData.provincia) {
            fetchCantones(formData.provincia);
        } else {
            setCantones([]);
        }
    }, [formData.provincia, formData.pais, fetchCantones]);

    const handleOpenModal = (stk = null) => {
        if (stk) {
            setEditingStk(stk);
            const { assigned: _assigned, rol_id: _rol_id, rol_nombre: _rol_nombre, id: _id, codigo: _codigo, empresa_id: _empId, ...data } = stk;
            setFormData({ ...data });
        } else {
            setEditingStk(null);
            setFormData({
                nombre: '', apellidos: '', email: '', movil: '',
                profesion: '', institucion: '',
                pais: 'Ecuador', provincia: '', canton: '', ciudad: '',
                direccion_detalle: '', proyecto_codigo_root: project.codigo_root
            });
        }
        setShowFormModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            const payload = buildNormalizedStakeholderPayload(formData);
            if (editingStk) {
                await stakeholdersApi.update(editingStk.id, payload, empId);
            } else {
                const newStk = await stakeholdersApi.create(payload, empId);
                setLastAddedId(newStk.id);
            }
            setShowFormModal(false);
            fetchAll();
        } catch (err) {
            console.error("Submit stakeholder error:", err);
            if (err instanceof Error && err.message === 'Telefono invalido') {
                appAlert("El móvil debe tener un formato válido.");
            } else {
                appAlert("Error al guardar.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await appConfirm({
            title: 'Eliminar Stakeholder',
            message: '¿Seguro que desea eliminar este responsable del directorio maestro? Esta acción no se puede deshacer.',
            confirmLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            tone: 'danger'
        });
        if (!confirmed) return;

        try {
            await stakeholdersApi.delete(id, empId);
            fetchAll();
        } catch (err) {
            console.error("Delete stakeholder error:", err);
            appAlert(err?.response?.data?.detail || "Error al eliminar.");
        }
    };

    const filteredStakeholders = stakeholders.filter(s => {
        const searchString = `${s.nombre} ${s.apellidos} ${s.email || ''} ${s.profesion || ''} ${s.institucion || ''}`;
        return normalizeStakeholderSearchToken(searchString).includes(normalizeStakeholderSearchToken(searchTerm));
    });

    useEffect(() => {
        if (lastAddedId && !loading) {
            const element = document.getElementById(`stk-row-${lastAddedId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setLastAddedId(null);
            }
        }
    }, [stakeholders, lastAddedId, loading]);

    useEffect(() => {
        setReportTemplateId(
            project?.plantillas_config?.stakeholders
                || selectedEmpresa?.plantillas_config?.stakeholders
                || PLANTILLAS_OPCIONES.stakeholders.options[0]?.id
                || '001'
        );
    }, [project?.plantillas_config?.stakeholders, selectedEmpresa?.plantillas_config?.stakeholders]);

    const buildStakeholdersReportFilename = useCallback((extension) => buildReportFileName({
        reportLabel: 'Equipo del Proyecto (Stakeholders)',
        contextLabel: sanitizeReportContext(project?.nombre || project?.codigo_root || 'Proyecto', 'Proyecto'),
        revision: project?.revision ?? 0,
        extension,
    }), [project?.nombre, project?.codigo_root, project?.revision]);

    const handleOpenReportPreview = useCallback(async () => {
        if (!project?.id) return;
        try {
            setLoadingReportPreview(true);
            const reportEmpresaId = project?.empresa_id || empId;
            const response = await reportingApi.previewReport({
                report_type: 'stakeholders',
                entity_ids: [project.id],
                template_id: reportTemplateId || '001',
                empresa_id: reportEmpresaId,
            }, reportEmpresaId);
            setReportPreview(response.data);
            setShowReportPreview(true);
        } catch (error) {
            console.error('Error generando vista previa de stakeholders:', error);
            appAlert(await extractBlobErrorMessage(error, 'No fue posible generar la vista previa del reporte de stakeholders.'));
        } finally {
            setLoadingReportPreview(false);
        }
    }, [project?.id, project?.empresa_id, reportTemplateId, empId]);

    const handleExportReport = useCallback(async (format) => {
        if (!project?.id) return;
        try {
            setGeneratingReport(true);
            const reportEmpresaId = project?.empresa_id || empId;
            const response = await reportingApi.exportReport({
                report_type: 'stakeholders',
                entity_ids: [project.id],
                template_id: reportPreview?.template_id || reportTemplateId || '001',
                format,
                empresa_id: reportEmpresaId,
            }, reportEmpresaId);
            downloadBlobResponse(
                response,
                buildStakeholdersReportFilename(format === 'xlsx' ? 'xlsx' : 'pdf'),
                format === 'xlsx' ? undefined : 'application/pdf'
            );
        } catch (error) {
            console.error('Error exportando reporte de stakeholders:', error);
            const fallbackMessage =
                format === 'xlsx'
                    ? 'No fue posible exportar el reporte de stakeholders en Excel.'
                    : format === 'pdf_excel'
                        ? 'No fue posible exportar el reporte de stakeholders en PDF desde Excel.'
                        : 'No fue posible exportar el reporte de stakeholders en PDF.';
            appAlert(await extractBlobErrorMessage(error, fallbackMessage));
        } finally {
            setGeneratingReport(false);
        }
    }, [project?.id, project?.empresa_id, reportPreview?.template_id, reportTemplateId, empId, buildStakeholdersReportFilename]);

    return (
        <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
            <div className={STAKEHOLDER_HEADER_SURFACE}>
                <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.9rem] border border-purple-200/70 bg-purple-50 text-purple-500">
                            <Users className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <h2 className={STAKEHOLDER_HEADER_TITLE}>Stakeholders</h2>
                            <p className={STAKEHOLDER_HEADER_SUBTITLE}>
                            Directorio común del proyecto
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center xl:justify-end">
                            <ProjectSectionReportButton
                                sectionLabel="Stakeholders"
                                onClick={handleOpenReportPreview}
                                disabled={generatingReport || loadingReportPreview}
                            />
                    </div>
                </div>
            </div>

            <Card className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-[1.25rem] border border-[#ececec] bg-[#f7f7f5] shadow-[10px_10px_26px_#dddddd,-10px_-10px_26px_#ffffff]">
                <CardContent className="flex flex-1 min-h-0 flex-col p-0">
                    <div className="border-b border-[#101318] bg-[#111318] px-5 py-2">
                        <div className="flex items-center justify-start gap-3">
                            <button
                                type="button"
                                onClick={() => handleOpenModal()}
                                title="Nuevo stakeholder"
                                aria-label="Nuevo stakeholder"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/80 bg-[#f7f7f5] text-purple-500 shadow-[0_4px_12px_rgba(0,0,0,0.26),0_0_0_1px_rgba(255,255,255,0.42)] transition hover:bg-white hover:text-purple-600 active:scale-[0.98] active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.18),inset_-2px_-2px_6px_rgba(255,255,255,0.75)]"
                            >
                                <Plus className="h-[18px] w-[18px]" strokeWidth={2.2} />
                            </button>
                            <ClearSearchField
                                value={normalizeTextInputValue(searchTerm)}
                                onValueChange={(value) => setSearchTerm(normalizeTextInputValue(value))}
                                placeholder="Buscar responsable..."
                                containerClassName="w-full sm:max-w-md"
                                searchIconClassName="left-4 text-zinc-400 group-focus-within:text-[#F39200]"
                                inputClassName="w-full h-9 rounded-xl border border-zinc-200 bg-white pl-10 pr-9 text-sm font-semibold text-zinc-700 shadow-[inset_1px_1px_3px_rgba(186,190,204,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] placeholder:text-zinc-400 focus:border-[#F39200] focus:ring-[#F39200]"
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto giproy-motion-scrollbar-hide">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-20 border-b border-[#101318] bg-[#111318] shadow-sm">
                                <tr>
                                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white/60">Responsable</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/60">Perfil</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/60">Contacto</th>
                                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white/60 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 bg-white">
                                {loading ? (
                                    <tr><td colSpan={4} className="py-16 text-center text-zinc-300 uppercase font-black text-[10px] tracking-widest">Cargando directorio...</td></tr>
                                ) : filteredStakeholders.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-16 text-center">
                                            <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-400">
                                                    <Users className="h-5 w-5" />
                                                </span>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                                        Sin stakeholders visibles
                                                    </p>
                                                    <p className="mt-1 text-xs font-semibold text-zinc-400">
                                                        Ajusta la búsqueda o registra un nuevo responsable.
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredStakeholders.map((stk) => (
                                    <tr
                                        key={stk.id}
                                        id={`stk-row-${stk.id}`}
                                        className="group transition-colors hover:bg-[#f7f7f5]"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex min-w-0 flex-col">
                                                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#F39200]">{stk.codigo}</span>
                                                <AppHint content={normalizePersonName(`${stk.nombre || ''} ${stk.apellidos || ''}`)} tone="light" disabled={normalizePersonName(`${stk.nombre || ''} ${stk.apellidos || ''}`).length < 28}>
                                                    <span className="block max-w-[22rem] truncate text-sm font-black text-[#1A1A1A]">{normalizePersonName(`${stk.nombre || ''} ${stk.apellidos || ''}`)}</span>
                                                </AppHint>
                                                <span className="truncate text-[10px] font-medium text-zinc-400">{stk.email || 'Sin email'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex min-w-0 flex-col">
                                                <span className="truncate text-xs font-bold uppercase text-zinc-600">{stk.profesion || 'Sin profesión'}</span>
                                                <AppHint content={stk.institucion || 'Sin institución'} tone="light" disabled={(stk.institucion || '').length < 28}>
                                                    <span className="block max-w-[18rem] truncate text-[10px] font-medium uppercase text-zinc-400">{stk.institucion || 'Sin institución'}</span>
                                                </AppHint>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex min-w-0 flex-col">
                                                <span className="text-[10px] font-semibold text-zinc-600">{stk.movil || 'Sin móvil'}</span>
                                                <AppHint content={compactLocationLabel(stk)} tone="light" disabled={compactLocationLabel(stk).length < 24}>
                                                    <span className="block max-w-[16rem] truncate text-[10px] font-medium uppercase text-zinc-400">{compactLocationLabel(stk)}</span>
                                                </AppHint>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleOpenModal(stk)} className={`${STAKEHOLDER_ROW_ACTION_BUTTON_BASE} text-[#136191]`} title="Editar stakeholder">
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                {['administrador', 'superadministrador'].includes(normalizedRole) && (
                                                    <button onClick={() => handleDelete(stk.id)} className={`${STAKEHOLDER_ROW_ACTION_BUTTON_BASE} text-zinc-300 hover:text-red-500`} title="Eliminar stakeholder">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
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

            <CommonReportPreviewModal
                isOpen={showReportPreview}
                onClose={() => setShowReportPreview(false)}
                preview={reportPreview}
                onExportExcel={() => handleExportReport('xlsx')}
                onExportPdf={() => handleExportReport('pdf')}
                onExportPdfFromExcel={() => handleExportReport('pdf_excel')}
                exporting={generatingReport}
            />

            <ReportGenerationModal
                isOpen={generatingReport}
                title="Generando reporte"
                message="Estamos preparando el reporte de stakeholders. La descarga comenzará automáticamente cuando esté lista."
            />

            {/* Modal Formulario Stakeholder */}
            <AnimatePresence>
                {showFormModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/35 backdrop-blur-[2px] p-4">
                        <MotionDiv initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }} transition={{ duration: 0.18 }} className="w-full max-w-4xl overflow-hidden rounded-[1.7rem] border border-[#ececec] bg-[#f7f7f5] shadow-[12px_12px_30px_rgba(148,163,184,0.28),-10px_-10px_26px_rgba(255,255,255,0.82)]">
                            <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                                <div className="flex items-center justify-between gap-4 border-b border-[#101318] bg-[#111318] px-5 py-4">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border border-purple-300/20 bg-purple-400/10 text-purple-400">
                                            <Users className="h-[18px] w-[18px]" />
                                        </span>
                                        <div className="min-w-0">
                                            <h2 className="text-sm font-black uppercase tracking-tight text-purple-400">{editingStk ? 'Editar ficha' : 'Nueva ficha'}</h2>
                                            <p className={STAKEHOLDER_HEADER_SUBTITLE}>Directorio maestro · {editingStk ? editingStk.codigo : 'Nueva entrada'}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowFormModal(false)}
                                        className={`${APP_MODAL_CLOSE_BUTTON_CLASS} !h-10 !w-10`}
                                        title="Cerrar"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="space-y-4 overflow-y-auto p-5 custom-scrollbar">
                                    <section className="rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[4px_4px_12px_#e1e1e1,-4px_-4px_12px_#ffffff]">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Users className="h-4 w-4 text-purple-500" />
                                            <p className={STAKEHOLDER_LABEL_CLASS}>Identidad</p>
                                        </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className={STAKEHOLDER_LABEL_CLASS}>Nombres</Label>
                                            <Input required value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className={STAKEHOLDER_INPUT_CLASS} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className={STAKEHOLDER_LABEL_CLASS}>Apellidos</Label>
                                            <Input required value={formData.apellidos} onChange={e => setFormData({ ...formData, apellidos: e.target.value })} className={STAKEHOLDER_INPUT_CLASS} />
                                        </div>
                                    </div>
                                    </section>

                                    <section className="rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[4px_4px_12px_#e1e1e1,-4px_-4px_12px_#ffffff]">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-[#136191]" />
                                            <p className={STAKEHOLDER_LABEL_CLASS}>Contacto</p>
                                        </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className={STAKEHOLDER_LABEL_CLASS}>Email</Label>
                                            <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={STAKEHOLDER_INPUT_CLASS} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className={STAKEHOLDER_LABEL_CLASS}>Móvil</Label>
                                            <Input
                                                value={formData.movil}
                                                onChange={e => setFormData({ ...formData, movil: e.target.value })}
                                                onBlur={e => {
                                                    const rawValue = normalizeTextInputValue(e.target.value);
                                                    if (!rawValue) {
                                                        setFormData({ ...formData, movil: '' });
                                                        return;
                                                    }
                                                    if (!isValidPhone(rawValue)) {
                                                        return;
                                                    }
                                                    const prefix = resolveCountryPhonePrefix(formData.pais);
                                                    setFormData({ ...formData, movil: formatInternationalPhone(rawValue, prefix) });
                                                }}
                                                className={STAKEHOLDER_INPUT_CLASS}
                                            />
                                        </div>
                                    </div>
                                    </section>

                                    <section className="rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[4px_4px_12px_#e1e1e1,-4px_-4px_12px_#ffffff]">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-[#F39200]" />
                                            <p className={STAKEHOLDER_LABEL_CLASS}>Perfil profesional</p>
                                        </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className={STAKEHOLDER_LABEL_CLASS}>Profesión</Label>
                                            <Input value={formData.profesion} onChange={e => setFormData({ ...formData, profesion: e.target.value })} className={STAKEHOLDER_INPUT_CLASS} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className={STAKEHOLDER_LABEL_CLASS}>Institución</Label>
                                            <Input value={formData.institucion} onChange={e => setFormData({ ...formData, institucion: e.target.value })} className={STAKEHOLDER_INPUT_CLASS} />
                                        </div>
                                    </div>
                                    </section>

                                    <section className="rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[4px_4px_12px_#e1e1e1,-4px_-4px_12px_#ffffff]">
                                        <div className="mb-4 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-[#136191]" />
                                            <p className={STAKEHOLDER_LABEL_CLASS}>Ubicación</p>
                                        </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className={STAKEHOLDER_LABEL_CLASS}>País</Label>
                                            <SearchableSelect options={[{ id: 'Ecuador', nombre: 'Ecuador' }, { id: 'Otros', nombre: 'Otros' }]} value={formData.pais} onChange={val => setFormData({ ...formData, pais: val, provincia: '' })} valueKey="id" />
                                        </div>
                                        {formData.pais === 'Ecuador' ? (
                                            <div className="space-y-2">
                                                <Label className={STAKEHOLDER_LABEL_CLASS}>Provincia</Label>
                                                <SearchableSelect options={provincias.map(p => ({ id: p, nombre: p }))} value={formData.provincia} onChange={val => setFormData({ ...formData, provincia: val, canton: '' })} valueKey="id" />
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label className={STAKEHOLDER_LABEL_CLASS}>Estado</Label>
                                                <Input value={formData.provincia} onChange={e => setFormData({ ...formData, provincia: e.target.value })} className={STAKEHOLDER_INPUT_CLASS} />
                                            </div>
                                        )}
                                        {formData.pais === 'Ecuador' && (
                                            <div className="space-y-2">
                                                <Label className={STAKEHOLDER_LABEL_CLASS}>Cantón</Label>
                                                <SearchableSelect options={cantones.map(c => ({ id: c, nombre: c }))} value={formData.canton} onChange={val => setFormData({ ...formData, canton: val })} valueKey="id" />
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label className={STAKEHOLDER_LABEL_CLASS}>Dirección</Label>
                                            <Input value={formData.direccion_detalle} onChange={e => setFormData({ ...formData, direccion_detalle: e.target.value })} className={STAKEHOLDER_INPUT_CLASS} />
                                        </div>
                                    </div>
                                    </section>
                                </div>
                                <div className="flex items-center justify-end gap-3 border-t border-[#ececec] bg-[#f7f7f5] px-5 py-4">
                                    <button type="button" onClick={() => setShowFormModal(false)} className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700">Cancelar</button>
                                    <LiquidButton type="submit" disabled={isSaving} className="!h-11 !rounded-xl bg-purple-600 px-7 text-white shadow-[0_10px_22px_rgba(147,51,234,0.16)]">{isSaving ? 'Guardando...' : 'Guardar'}</LiquidButton>
                                </div>
                            </form>
                        </MotionDiv>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Stakeholders;
