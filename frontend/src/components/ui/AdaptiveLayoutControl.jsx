import { useEffect, useRef, useState } from 'react';
import { Check, MonitorCog, RotateCcw } from 'lucide-react';

const MODES = [
    { id: 'automatic', label: 'Automático' },
    { id: 'compact', label: 'Compacto' },
    { id: 'wide', label: 'Amplio' },
];

const AdaptiveLayoutControl = ({ layout }) => {
    const [open, setOpen] = useState(false);
    const controlRef = useRef(null);
    const triggerRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const closeAndRestoreFocus = () => {
            setOpen(false);
            triggerRef.current?.focus();
        };
        const handlePointerDown = (event) => {
            if (!controlRef.current?.contains(event.target)) closeAndRestoreFocus();
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') closeAndRestoreFocus();
        };
        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    if (!layout?.enabled) return null;

    return (
        <div ref={controlRef} className="relative shrink-0" data-adaptive-layout-control>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-[#F39200] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200]"
                aria-label="Ajustar distribución visual"
                aria-expanded={open}
                aria-controls="adaptive-layout-menu"
                aria-haspopup="dialog"
                title={`Distribución ${layout.profile}`}
            >
                <MonitorCog className="h-5 w-5" aria-hidden="true" />
            </button>
            {open ? (
                <div
                    id="adaptive-layout-menu"
                    className="absolute right-0 top-12 z-[540] max-h-[min(28rem,calc(100dvh-5rem))] w-[min(18rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-xl border border-zinc-200 bg-white p-3 shadow-lg"
                    role="dialog"
                    aria-label="Distribución visual"
                    data-adaptive-layout-menu
                >
                    <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-tight text-zinc-900">Distribución visual</p>
                            <p className="mt-1 text-[11px] leading-4 text-zinc-500">
                                Perfil detectado: <strong className="text-zinc-700">{layout.detectedProfile}</strong>
                            </p>
                        </div>
                        <button type="button" onClick={() => layout.setMode('automatic')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100" aria-label="Restablecer distribución" title="Restablecer distribución">
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="mt-3 grid gap-1" role="radiogroup" aria-label="Modo de distribución">
                        {MODES.map((option) => {
                            const unsafe = option.id === 'wide' && !layout.wideSafe;
                            const active = layout.mode === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    disabled={unsafe}
                                    onClick={() => layout.setMode(option.id)}
                                    className={`flex min-h-11 items-center justify-between rounded-lg px-3 text-left text-xs font-bold transition-colors ${active ? 'bg-orange-50 text-[#A55A00]' : 'text-zinc-700 hover:bg-zinc-50'} disabled:cursor-not-allowed disabled:opacity-40`}
                                >
                                    <span>{option.label}</span>
                                    {active ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                                </button>
                            );
                        })}
                    </div>
                    {!layout.wideSafe ? <p className="mt-2 text-[10px] leading-4 text-zinc-500">El modo amplio no está disponible porque produciría una geometría insegura.</p> : null}
                </div>
            ) : null}
        </div>
    );
};

export default AdaptiveLayoutControl;
