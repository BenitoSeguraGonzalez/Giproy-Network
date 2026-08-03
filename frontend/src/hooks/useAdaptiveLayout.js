import { useEffect, useMemo, useState } from 'react';
import {
    ADAPTIVE_UI_MODE_KEY,
    classifyAdaptiveProfile,
    normalizeAdaptiveMode,
    readAdaptiveEnvironment,
    resolveAdaptiveUiEnabled,
    resolveAdaptiveModuleEnabled,
} from '../utils/adaptiveLayout';

const readStoredMode = () => {
    if (typeof window === 'undefined') return 'automatic';
    try {
        return normalizeAdaptiveMode(window.localStorage.getItem(ADAPTIVE_UI_MODE_KEY));
    } catch {
        return 'automatic';
    }
};

const useAdaptiveLayout = ({ containerRef = null, moduleKey = 'global' } = {}) => {
    const [environment, setEnvironment] = useState(() => readAdaptiveEnvironment());
    const [mode, setModeState] = useState(readStoredMode);
    const [container, setContainer] = useState(null);
    const masterEnabled = resolveAdaptiveUiEnabled({
        buildFlag: import.meta.env.VITE_ADAPTIVE_UI_ENABLED,
        storage: typeof window !== 'undefined' ? window.localStorage : null,
    });
    const enabled = resolveAdaptiveModuleEnabled({
        masterEnabled,
        moduleKey,
        buildFlags: import.meta.env.VITE_ADAPTIVE_UI_MODULES,
        storage: typeof window !== 'undefined' ? window.localStorage : null,
    });

    useEffect(() => {
        const updateEnvironment = () => setEnvironment(readAdaptiveEnvironment());
        const coarseQuery = window.matchMedia?.('(pointer: coarse)');
        const hoverQuery = window.matchMedia?.('(hover: hover)');

        updateEnvironment();
        window.addEventListener('resize', updateEnvironment);
        window.addEventListener('orientationchange', updateEnvironment);
        window.visualViewport?.addEventListener('resize', updateEnvironment);
        window.visualViewport?.addEventListener('scroll', updateEnvironment);
        coarseQuery?.addEventListener?.('change', updateEnvironment);
        hoverQuery?.addEventListener?.('change', updateEnvironment);

        return () => {
            window.removeEventListener('resize', updateEnvironment);
            window.removeEventListener('orientationchange', updateEnvironment);
            window.visualViewport?.removeEventListener('resize', updateEnvironment);
            window.visualViewport?.removeEventListener('scroll', updateEnvironment);
            coarseQuery?.removeEventListener?.('change', updateEnvironment);
            hoverQuery?.removeEventListener?.('change', updateEnvironment);
        };
    }, []);

    useEffect(() => {
        const node = containerRef?.current;
        if (!node || typeof ResizeObserver === 'undefined') {
            return undefined;
        }

        const updateContainer = () => {
            const rect = node.getBoundingClientRect();
            setContainer({ width: rect.width, height: rect.height });
        };
        const observer = new ResizeObserver(updateContainer);
        observer.observe(node);
        updateContainer();
        return () => observer.disconnect();
    }, [containerRef]);

    const classification = useMemo(
        () => classifyAdaptiveProfile(environment, { container, mode }),
        [container, environment, mode],
    );

    const setMode = (nextMode) => {
        const normalizedMode = normalizeAdaptiveMode(nextMode);
        setModeState(normalizedMode);
        try {
            window.localStorage.setItem(ADAPTIVE_UI_MODE_KEY, normalizedMode);
        } catch {
            // A visual preference must never block the product.
        }
    };

    return {
        enabled,
        environment,
        mode,
        setMode,
        ...classification,
    };
};

export default useAdaptiveLayout;
