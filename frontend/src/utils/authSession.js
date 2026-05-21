export const AUTH_REDIRECT_MESSAGE_KEY = 'giproy_auth_redirect_message';
export const AUTH_SESSION_EXPIRED_EVENT = 'giproy:auth-session-expired';

export const clearStoredAuthSession = () => {
    localStorage.removeItem('giproy_token');
    localStorage.removeItem('giproy_working_company');
    localStorage.removeItem('giproy_working_base');
    localStorage.removeItem('giproy_working_project');
    sessionStorage.removeItem('giproy_login_session_id');
};

export const storeAuthRedirectMessage = (message) => {
    if (typeof message !== 'string') return;
    const trimmed = message.trim();
    if (!trimmed) return;
    sessionStorage.setItem(AUTH_REDIRECT_MESSAGE_KEY, trimmed);
};

export const expireAuthSession = (message = null) => {
    if (message) {
        storeAuthRedirectMessage(message);
    }
    clearStoredAuthSession();

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, {
            detail: { message: message || null },
        }));
    }
};
