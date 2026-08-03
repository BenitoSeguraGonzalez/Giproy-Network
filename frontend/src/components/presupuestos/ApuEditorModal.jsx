import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApuBudgetEditor from './ApuBudgetEditor';
import { appConfirm } from '../../utils/appDialog';

const MotionDiv = motion.div;

/**
 * ApuEditorModal
 * Abre el editor APU especializado para presupuestos en un Drawer (Slide-Over).
 * Utiliza ApuBudgetEditor para evitar conflictos de ruteo con la página de catálogo.
 *
 * Props:
 *   apuId            {number}   - ID del APU a editar
 *   projectBaseId    {number}   - ID de la base de trabajo del proyecto
 *   projectRevision  {number}   - Número de revisión del proyecto
 *   onClose          {function} - Callback al cerrar
 */
const ApuEditorModal = ({ apuId, projectBaseId, projectRevision, onClose }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [currentApuId, setCurrentApuId] = useState(apuId);
    const [apuHistory, setApuHistory] = useState([]);
    const [editorDirty, setEditorDirty] = useState(false);

    useEffect(() => {
        setCurrentApuId(apuId);
        setApuHistory([]);
        setEditorDirty(false);
    }, [apuId]);

    const handleClose = async ({ skipDirtyCheck = false } = {}) => {
        if (apuHistory.length > 0 && !skipDirtyCheck) {
            return;
        }
        if (editorDirty && !skipDirtyCheck) {
            const confirmed = await appConfirm({
                title: 'Cerrar editor APU',
                message: 'Hay cambios sin guardar en el editor actual. Si continúa, se descartarán. ¿Desea cerrar igualmente?',
                confirmLabel: 'Descartar y cerrar',
                cancelLabel: 'Seguir editando',
                tone: 'warning',
                zIndex: 'z-[360]',
            });
            if (!confirmed) return;
        }
        setEditorDirty(false);
        setIsOpen(false);
        // Esperar a que termine la animación antes de desmontar del componente padre
        setTimeout(() => {
            onClose?.();
        }, 300);
    };

    // Cerrar con Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOpenNestedApu = (nestedApuId, parentMeta = null) => {
        if (!nestedApuId || Number(nestedApuId) === Number(currentApuId)) return;
        setEditorDirty(false);
        setApuHistory((prev) => [...prev, parentMeta || { id: currentApuId }]);
        setCurrentApuId(Number(nestedApuId));
    };

    const handleGoBack = () => {
        setApuHistory((prev) => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            const previousApu = next.pop();
            if (previousApu?.id) {
                setEditorDirty(false);
                setCurrentApuId(previousApu.id);
            }
            return next;
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex justify-end">
                    {/* Backdrop (fondo oscurecido) */}
                    <MotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Panel Slide-Over */}
                    <MotionDiv
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full lg:w-[95%] xl:w-[98%] h-full bg-white shadow-2xl flex flex-col overflow-hidden border-l border-zinc-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Usamos el editor especializado de presupuestos */}
                        <div className="flex-1 w-full h-full relative">
                            <ApuBudgetEditor 
                                key={`apu-editor-${currentApuId}`}
                                apuId={currentApuId} 
                                projectBaseId={projectBaseId}
                                projectRevision={projectRevision}
                                onClose={handleClose}
                                canGoBack={apuHistory.length > 0}
                                nestedContext={apuHistory[apuHistory.length - 1] || null}
                                onGoBack={handleGoBack}
                                onOpenNestedApu={handleOpenNestedApu}
                                onDirtyChange={setEditorDirty}
                                onSaveSuccess={() => {
                                    // Podemos añadir lógica extra si es necesario después de un guardado exitoso
                                }}
                            />
                        </div>
                    </MotionDiv>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ApuEditorModal;
