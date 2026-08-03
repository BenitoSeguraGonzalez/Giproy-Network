import {
    ADAPTIVE_UI_MODE_KEY,
    classifyAdaptiveProfile,
    normalizeAdaptiveMode,
    readAdaptiveEnvironment,
    resolveAdaptiveModuleEnabled,
    resolveAdaptiveUiEnabled,
} from './adaptiveLayout.js';

export const PORTABLE_WORKSPACE_EVENT = 'giproy:portable-workspace-changed';

export const readPortableWorkspaceOverride = () => {
    if (typeof window === 'undefined') return false;
    try {
        return normalizeAdaptiveMode(window.localStorage.getItem(ADAPTIVE_UI_MODE_KEY)) === 'compact';
    } catch {
        return false;
    }
};

export const resolvePortableWorkspaceProfile = ({
    width,
    height,
    forced = false,
    enabled = false,
    environment = {},
    mode = 'automatic',
} = {}) => {
    if (forced) return true;
    if (!enabled) return false;
    const classification = classifyAdaptiveProfile({
        ...environment,
        width: Number(width) || environment.width,
        height: Number(height) || environment.height,
    }, { mode: normalizeAdaptiveMode(mode) });
    return classification.profile !== 'wide';
};

export const resolvePortableWorkspace = ({ width, height, forced = false, moduleKey = 'classic-workspaces' } = {}) => {
    const masterEnabled = resolveAdaptiveUiEnabled({
        buildFlag: import.meta.env?.VITE_ADAPTIVE_UI_ENABLED,
        storage: typeof window !== 'undefined' ? window.localStorage : null,
    });
    const enabled = resolveAdaptiveModuleEnabled({
        masterEnabled,
        moduleKey,
        buildFlags: import.meta.env?.VITE_ADAPTIVE_UI_MODULES,
        storage: typeof window !== 'undefined' ? window.localStorage : null,
    });
    const environment = readAdaptiveEnvironment();
    return resolvePortableWorkspaceProfile({
        width,
        height,
        forced,
        enabled,
        environment,
        mode: typeof window === 'undefined'
            ? 'automatic'
            : normalizeAdaptiveMode(window.localStorage.getItem(ADAPTIVE_UI_MODE_KEY)),
    });
};
