import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const collectSourceFiles = (directoryUrl) => {
    const entries = readdirSync(directoryUrl, { withFileTypes: true });
    return entries.flatMap((entry) => {
        const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl);
        if (entry.isDirectory()) {
            return collectSourceFiles(entryUrl);
        }
        const path = entryUrl.pathname;
        if (!/\.(jsx?|tsx?)$/i.test(path)) return [];
        if (!statSync(entryUrl).isFile()) return [];
        return [entryUrl];
    });
};

const authContextSource = readFileSync(new URL('../src/context/AuthContext.jsx', import.meta.url), 'utf8');
const settingsSource = readFileSync(new URL('../src/pages/Settings.jsx', import.meta.url), 'utf8');
const authApiSource = readFileSync(new URL('../src/api/auth.js', import.meta.url), 'utf8');
const frontendSourceFiles = collectSourceFiles(new URL('../src/', import.meta.url));

assert.equal(
    authContextSource.includes("from '../api/axiosConfig'"),
    false,
    'AuthContext no debe importar axiosConfig directamente en MODO 1',
);

assert.equal(
    /\bconsole\.log\s*\(/.test(authContextSource),
    false,
    'AuthContext no debe conservar console.log productivos',
);

for (const fileUrl of frontendSourceFiles) {
    const source = readFileSync(fileUrl, 'utf8');
    assert.equal(
        /\bconsole\.error\s*\(/.test(source),
        false,
        `frontend/src no debe conservar console.error productivo: ${fileUrl.pathname}`,
    );
}

assert.match(
    authContextSource,
    /import\s+\{\s*authApi\s*\}\s+from\s+'..\/api\/auth';/,
    'AuthContext debe consumir authApi para login, refresh, usuario actual y logout',
);

assert.match(
    authContextSource,
    /adminLicensesApi\.getMyLicense\(/,
    'AuthContext debe consumir adminLicensesApi.getMyLicense() para licencia actual',
);

for (const token of [
    'const id = await getDeviceId();',
    'setDeviceId(id);',
    'authApi.getCurrentUser().catch(() => {',
    'const handleExpiration = (message) => {',
    'clearLifecycleTimers();',
    'clearSessionState(message);',
]) {
    assert.equal(
        authContextSource.includes(token),
        true,
        `AuthContext debe conservar flujo critico: ${token}`,
    );
}

for (const method of ['refreshAccessToken', 'getCurrentUser', 'login', 'logout']) {
    assert.match(
        authApiSource,
        new RegExp(`\\b${method}\\s*:`),
        `authApi debe exponer ${method}`,
    );
}

assert.equal(
    settingsSource.includes("from '../api/axiosConfig'"),
    false,
    'Settings no debe importar axiosConfig directamente en MODO 1',
);

for (const token of [
    'empresasApi.uploadLogo(',
    'empresasApi.update(',
    'empresasApi.getAll(',
    'usuariosApi.create(',
    'usuariosApi.update(',
    'usuariosApi.delete(',
    'proyectosApi.update(',
]) {
    assert.equal(
        settingsSource.includes(token),
        true,
        `Settings debe conservar el uso de cliente API: ${token}`,
    );
}

console.log('smoke-classic-api-boundaries: ok');
