import React, { useContext, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { X, FileText, Save, Loader2, MessageSquareText, SpellCheck } from 'lucide-react';
import { LiquidButton } from '../ui/liquid-button';
import { presupuestosApi } from '../../api/presupuestos';
import { AuthContext } from '../../context/AuthContext';
import utilsApi from '../../api/utils';
import { appAlert, appConfirm } from '../../utils/appDialog';
import { APP_MODAL_CLOSE_BUTTON_CLASS } from '../ui/app-modal';

const formatDateTime = (value) => {
    if (!value) return '';
    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));
};

const NotasGeneralesModal = ({
    isOpen,
    onClose,
    presupuestoId,
    scope = 'general',
    linea = null,
    onNoteCreated,
    readOnly = false
}) => {
    const { user } = useContext(AuthContext);
    const [notes, setNotes] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [checkingSpell, setCheckingSpell] = useState(false);

    useEffect(() => {
        const fetchNotes = async () => {
            if (!isOpen || !presupuestoId) return;
            try {
                setLoading(true);
                const data = scope === 'linea' && linea?.id
                    ? await presupuestosApi.getLineNotes(linea.id)
                    : await presupuestosApi.getGeneralNotes(presupuestoId);
                setNotes(Array.isArray(data) ? data : []);
            } catch (error) {
                globalThis.reportClientError?.("Error cargando notas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, [isOpen, presupuestoId, scope, linea?.id]);

    if (!isOpen) return null;

    const title = scope === 'linea' ? 'Notas de Línea' : 'Notas del Presupuesto';
    const subtitle = scope === 'linea'
        ? `${linea?.codigo_item || 'Línea'} - ${linea?.descripcion || 'Detalle de la partida'}`
        : 'Observaciones generales del presupuesto';

    const handleSave = async () => {
        const trimmed = text.trim();
        if (!trimmed) return;

        try {
            setSaving(true);
            const created = scope === 'linea' && linea?.id
                ? await presupuestosApi.createLineNote(linea.id, { texto: trimmed })
                : await presupuestosApi.createGeneralNote(presupuestoId, { texto: trimmed });

            setNotes(prev => [...prev, created]);
            setText('');
            if (onNoteCreated) {
                onNoteCreated(created);
            }
        } catch (error) {
            globalThis.reportClientError?.("Error guardando nota:", error);
            appAlert(error.response?.data?.detail || "Error al guardar la nota.");
        } finally {
            setSaving(false);
        }
    };

    const handleSpellCheck = async () => {
        const trimmed = text.trim();
        if (!trimmed) {
            appAlert("No hay contenido en la nota para revisar.");
            return;
        }

        try {
            setCheckingSpell(true);
            const res = await utilsApi.spellcheck(trimmed);

            if (res.data.has_errors) {
                const suggestionsList = Array.isArray(res.data.suggestions)
                    ? res.data.suggestions.join('\n')
                    : '';

                const confirmed = await appConfirm({
                    title: 'Aplicar corrección ortográfica',
                    message: `Se han detectado posibles mejoras ortográficas en la anotación:\n\n${suggestionsList}\n\nTexto sugerido por el asistente:\n\n"${res.data.corrected}"\n\n¿Desea reemplazar el contenido actual por esta versión corregida?`,
                    confirmLabel: 'Aplicar',
                    cancelLabel: 'Mantener actual',
                    tone: 'info'
                });
                if (confirmed) {
                    setText(res.data.corrected);
                }
            } else {
                appAlert("No se detectaron correcciones ortográficas necesarias en la nota.");
            }
        } catch (error) {
            globalThis.reportClientError?.("Error revisando ortografía de la nota:", error);
            appAlert("No fue posible completar la revisión ortográfica: " + (error.response?.data?.detail || error.message));
        } finally {
            setCheckingSpell(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
            <Card className="w-full max-w-4xl bg-white rounded-[2.5rem] overflow-hidden border border-zinc-200">
                <CardHeader className="bg-zinc-900 text-white px-8 py-6 flex flex-row items-start justify-between border-b border-zinc-800">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
                            <FileText className="w-5 h-5 text-[#F39200]" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">{title}</CardTitle>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-2">
                                {subtitle}
                            </p>
                            {readOnly && (
                                <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-red-400">
                                    Solo lectura
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className={`${APP_MODAL_CLOSE_BUTTON_CLASS} !h-9 !w-9 !rounded-[0.75rem]`}>
                        <X className="w-4 h-4" />
                    </button>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] min-h-[560px]">
                        <div className="border-r border-zinc-100 bg-zinc-50/40">
                            <div className="px-8 py-5 border-b border-zinc-100 bg-white">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    Historial de Anotaciones
                                </h3>
                            </div>

                            <div className="h-[470px] overflow-y-auto custom-scrollbar px-6 py-6 space-y-4">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#F39200]" />
                                    </div>
                                ) : notes.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center px-8">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-100 flex items-center justify-center mb-4">
                                            <MessageSquareText className="w-7 h-7 text-zinc-300" />
                                        </div>
                                        <p className="text-sm font-black uppercase tracking-tight text-zinc-500 mb-2">
                                            Sin anotaciones todavía
                                        </p>
                                        <p className="text-xs text-zinc-400 font-medium max-w-sm">
                                            Este historial registrará cada nota con su autor y fecha, sin edición ni borrado posterior.
                                        </p>
                                    </div>
                                ) : (
                                    notes.map((note) => {
                                        const isOwn = note.autor_usuario_id === user?.id;
                                        return (
                                            <div
                                                key={note.id}
                                                className={`rounded-[1.75rem] border p-5 ${isOwn ? 'bg-orange-50/50 border-orange-200' : 'bg-white border-zinc-200'}`}
                                            >
                                                <div className="flex items-center justify-between gap-4 mb-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase ${isOwn ? 'bg-white text-[#F39200] border border-orange-200' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}>
                                                            {(note.autor_nombre_snapshot || 'U').split(' ').map(part => part[0]).join('').slice(0, 2)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-900 truncate">
                                                                {note.autor_nombre_snapshot}
                                                            </p>
                                                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                                                                {formatDateTime(note.fecha_creacion)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {isOwn && (
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-[#F39200]">
                                                            Tu nota
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
                                                    {note.texto}
                                                </p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="bg-white px-8 py-8 flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#F39200] mb-3">
                                    {readOnly ? 'Lectura de Anotaciones' : 'Nueva Anotación'}
                                </h3>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                                    {readOnly
                                        ? 'Esta línea está desincronizada. Puedes consultar su historial de notas, pero no añadir nuevas anotaciones.'
                                        : 'La nota quedará registrada en la bitácora con autor y fecha. Una vez guardada, no podrá editarse ni eliminarse.'}
                                </p>
                            </div>

                            <div className="flex-1 flex flex-col gap-4">
                                <div className="flex items-center justify-between gap-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                                        Texto de la nota
                                    </label>
                                    {!readOnly && (
                                        <button
                                            type="button"
                                            onClick={handleSpellCheck}
                                            disabled={checkingSpell}
                                            className="flex items-center gap-1 text-[10px] font-black text-[#F39200] hover:underline uppercase tracking-widest disabled:opacity-50"
                                        >
                                            <SpellCheck className={`w-3 h-3 ${checkingSpell ? 'animate-pulse' : ''}`} />
                                            Revisar Ortografía
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    spellCheck="true"
                                    disabled={readOnly}
                                    className="w-full flex-1 min-h-[240px] p-5 bg-zinc-50 border border-zinc-200 rounded-[2rem] resize-none outline-none focus:border-[#F39200] transition-all text-sm font-medium"
                                    placeholder={readOnly
                                        ? 'Las notas de una línea desincronizada solo pueden consultarse.'
                                        : scope === 'linea'
                                        ? "Ingrese una anotación vinculada a esta línea de presupuesto..."
                                        : "Ingrese una nota general que deba quedar registrada para el equipo..."}
                                />
                                {!readOnly && (
                                    <div className="bg-orange-50/50 border border-orange-100 rounded-[1.5rem] p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                            Registro automático
                                        </p>
                                        <p className="text-xs text-zinc-500 font-medium mt-2">
                                            Autor: <span className="font-black text-zinc-700">{user?.nombre_completo || 'Colaborador actual'}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button
                                    onClick={onClose}
                                    className="flex-1 h-12 rounded-2xl bg-zinc-50 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all"
                                >
                                    Cerrar
                                </button>
                                {!readOnly && (
                                    <LiquidButton
                                        onClick={handleSave}
                                        disabled={saving || !text.trim()}
                                        className="flex-[1.4] bg-[#1A1A1A] text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Guardar Nota
                                    </LiquidButton>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default NotasGeneralesModal;
