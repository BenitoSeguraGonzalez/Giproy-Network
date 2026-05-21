let dialogHandler = null;

export const registerAppDialogHandler = (handler) => {
    dialogHandler = handler;
};

export const unregisterAppDialogHandler = () => {
    dialogHandler = null;
};

const normalizeOptions = (input, type) => {
    if (typeof input === 'string') {
        return { type, message: input };
    }
    return { ...(input || {}), type };
};

export const appAlert = (input) => {
    const options = normalizeOptions(input, 'alert');
    if (!dialogHandler?.alert) {
        window.setTimeout(() => {
            window.console?.warn?.('appAlert called without dialog handler', options);
        }, 0);
        return Promise.resolve();
    }
    return dialogHandler.alert(options);
};

export const appConfirm = (input) => {
    const options = normalizeOptions(input, 'confirm');
    if (!dialogHandler?.confirm) {
        window.setTimeout(() => {
            window.console?.warn?.('appConfirm called without dialog handler', options);
        }, 0);
        return Promise.resolve(false);
    }
    return dialogHandler.confirm(options);
};

export const appPrompt = (input) => {
    const options = normalizeOptions(input, 'prompt');
    if (!dialogHandler?.prompt) {
        window.setTimeout(() => {
            window.console?.warn?.('appPrompt called without dialog handler', options);
        }, 0);
        return Promise.resolve(null);
    }
    return dialogHandler.prompt(options);
};
