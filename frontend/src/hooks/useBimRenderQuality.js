import { useMemo, useState } from 'react';

export const BIM_RENDER_QUALITY_KEY = 'giproy_bim_render_quality';
export const BIM_RENDER_QUALITY_MODES = ['automatic', 'performance', 'high'];

const normalizeMode = (value) => BIM_RENDER_QUALITY_MODES.includes(value) ? value : 'automatic';

const readMode = () => {
    if (typeof window === 'undefined') return 'automatic';
    try {
        return normalizeMode(window.localStorage.getItem(BIM_RENDER_QUALITY_KEY));
    } catch {
        return 'automatic';
    }
};

export const resolveBimPixelRatio = ({ mode, devicePixelRatio = 1, coarse = false, width = 1920 }) => {
    const safeDpr = Math.max(1, Number(devicePixelRatio) || 1);
    if (mode === 'performance') return 1;
    if (mode === 'high') return Math.min(safeDpr, 2);
    return Math.min(safeDpr, coarse || width < 1440 ? 1.25 : 1.5);
};

const useBimRenderQuality = () => {
    const [mode, setModeState] = useState(readMode);
    const pixelRatio = useMemo(() => resolveBimPixelRatio({
        mode,
        devicePixelRatio: typeof window === 'undefined' ? 1 : window.devicePixelRatio,
        coarse: typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches,
        width: typeof window === 'undefined' ? 1920 : window.innerWidth,
    }), [mode]);

    const setMode = (nextMode) => {
        const normalized = normalizeMode(nextMode);
        setModeState(normalized);
        try {
            window.localStorage.setItem(BIM_RENDER_QUALITY_KEY, normalized);
        } catch {
            // La preferencia grafica no debe bloquear el visor.
        }
    };

    return { mode, setMode, pixelRatio };
};

export default useBimRenderQuality;
