/**
 * Módulo de Identificación de Dispositivo
 * Genera un fingerprint único para cada computadora
 * Utilizado para seguridad y control de acceso
 */

const STORAGE_KEY = 'giproy_device_id';
const DEVICE_INFO_KEY = 'giproy_device_info';

/**
 * Genera un hash simple a partir de una cadena
 * @param {string} str - Cadena a hashear
 * @returns {string} - Hash en formato hexadecimal
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir a entero de 32 bits
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Obtiene información del navegador y sistema
 * @returns {Object} - Objeto con información del dispositivo
 */
export function getDeviceInfo() {
    const nav = navigator;
    const screen = window.screen;

    return {
        // Información del navegador
        userAgent: nav.userAgent,
        language: nav.language,
        languages: nav.languages ? nav.languages.join(',') : '',
        platform: nav.platform,
        vendor: nav.vendor,

        // Información de pantalla
        screenWidth: screen.width,
        screenHeight: screen.height,
        screenColorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio,

        // Información de zona horaria
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),

        // Características del navegador
        cookiesEnabled: nav.cookieEnabled,
        doNotTrack: nav.doNotTrack,

        // Hardware
        hardwareConcurrency: nav.hardwareConcurrency || 0,
        deviceMemory: nav.deviceMemory || 0,

        // Canvas fingerprint (se genera dinámicamente)
        canvasFingerprint: null,

        // WebGL fingerprint (se genera dinámicamente)
        webglVendor: null,
        webglRenderer: null,
    };
}

/**
 * Genera un canvas fingerprint único
 * @returns {string} - Hash del canvas
 */
function generateCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 200;
        canvas.height = 50;

        // Texto con diferentes estilos para generar uniqueness
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('GIPROY ERP', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('GIPROY ERP', 4, 17);

        const dataURI = canvas.toDataURL();
        return simpleHash(dataURI);
    } catch {
        return 'canvas_error';
    }
}

/**
 * Obtiene información de WebGL
 * @returns {Object} - Vendor y renderer de WebGL
 */
function getWebGLInfo() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) {
            return { vendor: 'no_webgl', renderer: 'no_webgl' };
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

        if (debugInfo) {
            return {
                vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            };
        }

        return {
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER)
        };
    } catch {
        return { vendor: 'webgl_error', renderer: 'webgl_error' };
    }
}

/**
 * Genera el identificador único del dispositivo
 * @returns {Promise<string>} - Device ID único
 */
export async function getDeviceId() {
    // Verificar si ya tenemos un deviceId almacenado
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) {
        return storedId;
    }

    // Recolectar información del dispositivo
    const info = getDeviceInfo();

    // Agregar canvas fingerprint
    info.canvasFingerprint = generateCanvasFingerprint();

    // Agregar WebGL info
    const webglInfo = getWebGLInfo();
    info.webglVendor = webglInfo.vendor;
    info.webglRenderer = webglInfo.renderer;

    // Generar hash único combinando toda la información
    const deviceString = [
        info.userAgent,
        info.language,
        info.platform,
        info.screenWidth,
        info.screenHeight,
        info.timezone,
        info.canvasFingerprint,
        info.webglVendor,
        info.webglRenderer,
        info.hardwareConcurrency,
        info.deviceMemory
    ].join('|');

    // Generar ID único
    const deviceId = simpleHash(deviceString) + '-' + Date.now().toString(36).slice(-8);

    // Almacenar para sesiones futuras
    localStorage.setItem(STORAGE_KEY, deviceId);
    localStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(info));

    return deviceId;
}

export default {
    getDeviceId,
    getDeviceInfo
};
