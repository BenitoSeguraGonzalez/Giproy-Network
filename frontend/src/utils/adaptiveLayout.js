export const ADAPTIVE_UI_MODE_KEY = 'giproy_adaptive_ui_mode';
export const ADAPTIVE_UI_PILOT_KEY = 'giproy_adaptive_ui_pilot';
export const ADAPTIVE_UI_MODULE_FLAGS_KEY = 'giproy_adaptive_ui_modules';

export const ADAPTIVE_UI_MODES = Object.freeze([
    'automatic',
    'compact',
    'wide',
]);

export const ADAPTIVE_UI_PROFILES = Object.freeze({
    WIDE: 'wide',
    COMPACT: 'compact',
    TABLET_LANDSCAPE: 'tablet-landscape',
    TABLET_PORTRAIT: 'tablet-portrait',
    CONSTRAINED: 'constrained',
});

export const ADAPTIVE_LAYOUT_LIMITS = Object.freeze({
    wideWidth: 1680,
    wideHeight: 840,
    compactWidth: 1180,
    compactHeight: 700,
    tabletLandscapeWidth: 900,
    tabletLandscapeHeight: 600,
    tabletPortraitWidth: 700,
    tabletPortraitHeight: 900,
});

const positiveNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
};

export const normalizeAdaptiveMode = (value) => (
    ADAPTIVE_UI_MODES.includes(value) ? value : 'automatic'
);

export const readAdaptiveEnvironment = (browserWindow = typeof window !== 'undefined' ? window : null) => {
    if (!browserWindow) {
        return {
            viewportWidth: 1920,
            viewportHeight: 1080,
            visualWidth: 1920,
            visualHeight: 1080,
            visualScale: 1,
            devicePixelRatio: 1,
            screenWidth: 1920,
            screenHeight: 1080,
            orientation: 'landscape',
            coarsePointer: false,
            hoverAvailable: true,
            touchPoints: 0,
        };
    }

    const viewportWidth = positiveNumber(browserWindow.innerWidth, 1920);
    const viewportHeight = positiveNumber(browserWindow.innerHeight, 1080);
    const visualWidth = positiveNumber(browserWindow.visualViewport?.width, viewportWidth);
    const visualHeight = positiveNumber(browserWindow.visualViewport?.height, viewportHeight);
    const coarsePointer = Boolean(browserWindow.matchMedia?.('(pointer: coarse)')?.matches);
    const hoverAvailable = Boolean(browserWindow.matchMedia?.('(hover: hover)')?.matches);
    const touchPoints = Math.max(0, Number(browserWindow.navigator?.maxTouchPoints || 0));

    return {
        viewportWidth,
        viewportHeight,
        visualWidth,
        visualHeight,
        visualScale: positiveNumber(browserWindow.visualViewport?.scale, 1),
        devicePixelRatio: positiveNumber(browserWindow.devicePixelRatio, 1),
        screenWidth: positiveNumber(browserWindow.screen?.width, viewportWidth),
        screenHeight: positiveNumber(browserWindow.screen?.height, viewportHeight),
        orientation: visualWidth >= visualHeight ? 'landscape' : 'portrait',
        coarsePointer,
        hoverAvailable,
        touchPoints,
    };
};

export const resolveAdaptiveLayoutSize = (environment, container = null) => {
    const visualWidth = positiveNumber(environment?.visualWidth, 1920);
    const visualHeight = positiveNumber(environment?.visualHeight, 1080);
    const containerWidth = positiveNumber(container?.width, visualWidth);
    const containerHeight = positiveNumber(container?.height, visualHeight);

    return {
        width: Math.min(visualWidth, containerWidth),
        height: Math.min(visualHeight, containerHeight),
    };
};

export const classifyAdaptiveProfile = (
    environment,
    { container = null, mode = 'automatic', limits = ADAPTIVE_LAYOUT_LIMITS } = {},
) => {
    const size = resolveAdaptiveLayoutSize(environment, container);
    const normalizedMode = normalizeAdaptiveMode(mode);
    const touchCapable = Boolean(
        environment?.coarsePointer
        || (Number(environment?.touchPoints || 0) > 0 && !environment?.hoverAvailable),
    );
    const landscape = size.width >= size.height;
    const wideSafe = size.width >= limits.wideWidth && size.height >= limits.wideHeight;
    const compactSafe = size.width >= limits.compactWidth && size.height >= limits.compactHeight;

    let detectedProfile;
    if (touchCapable) {
        if (landscape && size.width >= limits.tabletLandscapeWidth && size.height >= limits.tabletLandscapeHeight) {
            detectedProfile = ADAPTIVE_UI_PROFILES.TABLET_LANDSCAPE;
        } else if (!landscape && size.width >= limits.tabletPortraitWidth && size.height >= limits.tabletPortraitHeight) {
            detectedProfile = ADAPTIVE_UI_PROFILES.TABLET_PORTRAIT;
        } else {
            detectedProfile = ADAPTIVE_UI_PROFILES.CONSTRAINED;
        }
    } else if (wideSafe) {
        detectedProfile = ADAPTIVE_UI_PROFILES.WIDE;
    } else if (compactSafe) {
        detectedProfile = ADAPTIVE_UI_PROFILES.COMPACT;
    } else {
        detectedProfile = ADAPTIVE_UI_PROFILES.CONSTRAINED;
    }

    let profile = detectedProfile;
    if (normalizedMode === 'wide' && wideSafe) {
        profile = ADAPTIVE_UI_PROFILES.WIDE;
    } else if (normalizedMode === 'compact' && compactSafe && !touchCapable) {
        profile = ADAPTIVE_UI_PROFILES.COMPACT;
    }

    return {
        profile,
        detectedProfile,
        requestedMode: normalizedMode,
        requestedModeApplied: normalizedMode === 'automatic' || profile !== detectedProfile,
        width: size.width,
        height: size.height,
        touchCapable,
        wideSafe,
        compactSafe,
    };
};

export const resolveAdaptiveUiEnabled = ({ buildFlag = false, storage = null } = {}) => {
    if (String(buildFlag).toLowerCase() === 'true') return true;
    try {
        return storage?.getItem(ADAPTIVE_UI_PILOT_KEY) === 'true';
    } catch {
        return false;
    }
};

const readModuleFlags = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return String(value).split(',').reduce((flags, item) => {
            const [key, rawState = 'true'] = item.split(':').map((part) => part.trim());
            if (key) flags[key] = rawState.toLowerCase() !== 'false';
            return flags;
        }, {});
    }
};

export const resolveAdaptiveModuleEnabled = ({
    masterEnabled = false,
    moduleKey = 'global',
    buildFlags = null,
    storage = null,
} = {}) => {
    if (!masterEnabled) return false;
    let storageFlags = {};
    try {
        storageFlags = readModuleFlags(storage?.getItem(ADAPTIVE_UI_MODULE_FLAGS_KEY));
    } catch {
        storageFlags = {};
    }
    const flags = { ...readModuleFlags(buildFlags), ...storageFlags };
    return flags[moduleKey] !== false && flags.global !== false;
};
