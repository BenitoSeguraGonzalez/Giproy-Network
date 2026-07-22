export const MIN_DESKTOP_DISPLAY_WIDTH = 1920;
export const MIN_DESKTOP_DISPLAY_HEIGHT = 1080;

const positiveNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
};

export const readPhysicalDisplayResolution = (browserWindow = typeof window !== 'undefined' ? window : null) => {
    if (!browserWindow) {
        return {
            width: MIN_DESKTOP_DISPLAY_WIDTH,
            height: MIN_DESKTOP_DISPLAY_HEIGHT,
        };
    }

    const screenWidth = Math.max(
        positiveNumber(browserWindow.screen?.width),
        positiveNumber(browserWindow.screen?.availWidth),
    );
    const screenHeight = Math.max(
        positiveNumber(browserWindow.screen?.height),
        positiveNumber(browserWindow.screen?.availHeight),
    );
    const cssWidth = screenWidth || Math.max(
        positiveNumber(browserWindow.outerWidth),
        positiveNumber(browserWindow.innerWidth),
    );
    const cssHeight = screenHeight || Math.max(
        positiveNumber(browserWindow.outerHeight),
        positiveNumber(browserWindow.innerHeight),
    );
    const pixelRatio = positiveNumber(browserWindow.devicePixelRatio) || 1;

    return {
        width: Math.round((cssWidth || MIN_DESKTOP_DISPLAY_WIDTH) * pixelRatio),
        height: Math.round((cssHeight || MIN_DESKTOP_DISPLAY_HEIGHT) * pixelRatio),
    };
};

export const isMinimumDesktopDisplaySupported = (browserWindow) => {
    const resolution = readPhysicalDisplayResolution(browserWindow);
    return resolution.width >= MIN_DESKTOP_DISPLAY_WIDTH
        && resolution.height >= MIN_DESKTOP_DISPLAY_HEIGHT;
};
