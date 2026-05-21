import { lazy } from 'react';

const CHUNK_RELOAD_KEY = 'giproy:chunk-reload-url';

const isChunkLoadError = (error) => {
    const message = String(error?.message || error || '');

    return (
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Importing a module script failed') ||
        message.includes('Loading chunk') ||
        message.includes('ChunkLoadError')
    );
};

const wait = (milliseconds) => new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
});

const reloadOnceForFreshAssets = () => {
    if (typeof window === 'undefined') return false;

    const currentUrl = window.location.href;
    const previousUrl = window.sessionStorage.getItem(CHUNK_RELOAD_KEY);

    if (previousUrl === currentUrl) {
        return false;
    }

    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, currentUrl);
    window.location.reload();
    return true;
};

const clearRecoveredReloadMark = () => {
    if (typeof window === 'undefined') return;

    window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
};

export const lazyWithChunkRecovery = (importer) => lazy(async () => {
    try {
        const module = await importer();
        clearRecoveredReloadMark();
        return module;
    } catch (firstError) {
        if (!isChunkLoadError(firstError) || typeof window === 'undefined') {
            throw firstError;
        }

        await wait(350);

        try {
            const module = await importer();
            clearRecoveredReloadMark();
            return module;
        } catch (secondError) {
            if (isChunkLoadError(secondError) && reloadOnceForFreshAssets()) {
                return new Promise(() => {});
            }

            throw secondError;
        }
    }
});
