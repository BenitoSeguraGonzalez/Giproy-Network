export const PORTABLE_WORKSPACE_OVERRIDE_KEY = 'giproy_force_portable_workspace';
export const PORTABLE_WORKSPACE_EVENT = 'giproy:portable-workspace-changed';

export const readPortableWorkspaceOverride = () => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(PORTABLE_WORKSPACE_OVERRIDE_KEY) === '1';
};

export const writePortableWorkspaceOverride = (enabled) => {
    if (typeof window === 'undefined') return;
    if (enabled) {
        window.localStorage.setItem(PORTABLE_WORKSPACE_OVERRIDE_KEY, '1');
    } else {
        window.localStorage.removeItem(PORTABLE_WORKSPACE_OVERRIDE_KEY);
    }
    window.dispatchEvent(new CustomEvent(PORTABLE_WORKSPACE_EVENT, { detail: { enabled } }));
};

export const resolvePortableWorkspace = ({ forced = false }) => Boolean(forced);
