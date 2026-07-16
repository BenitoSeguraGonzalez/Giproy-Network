import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const conectaApiSource = readFileSync(new URL('../src/api/conecta.js', import.meta.url), 'utf8');
const settingsSource = readFileSync(new URL('../src/pages/Settings.jsx', import.meta.url), 'utf8');
const adminLicensesSource = readFileSync(new URL('../src/pages/AdminGlobalLicencias.jsx', import.meta.url), 'utf8');

assert.match(
    conectaApiSource,
    /import\s+api\s+from\s+'\.\/axiosConfig';/,
    'conectaApi debe encapsular axiosConfig dentro de frontend/src/api',
);

for (const endpoint of ['/conecta/limits', '/conecta/slots', '/conecta/admin/summary']) {
    assert.equal(
        conectaApiSource.includes(endpoint),
        true,
        `conectaApi debe conservar endpoint ${endpoint}`,
    );
}

for (const [name, source] of [
    ['AdminGlobalLicencias', adminLicensesSource],
]) {
    assert.equal(
        source.includes("from '../api/axiosConfig'"),
        false,
        `${name} no debe importar axiosConfig directamente`,
    );
    assert.match(
        source,
        /import\s+\{\s*conectaApi\s*\}\s+from\s+'..\/api\/conecta';/,
        `${name} debe consumir conectaApi`,
    );
    assert.equal(
        /['"`]\/conecta\//.test(source),
        false,
        `${name} no debe hardcodear rutas /conecta fuera del cliente API`,
    );
    assert.equal(
        /\bconsole\.log\s*\(/.test(source),
        false,
        `${name} no debe introducir console.log productivos`,
    );
}

assert.equal(
    settingsSource.includes("from '../api/conecta'"),
    false,
    'Settings Empresa no debe consumir conectaApi ni gestionar cupos Conecta',
);

assert.equal(
    settingsSource.includes('Cupos usuario-usuario') ||
        settingsSource.includes('handleCreateConectaInvite') ||
        settingsSource.includes('handleReleaseConectaSlot') ||
        settingsSource.includes('data-settings-conecta-panel="compact"'),
    false,
    'Settings Empresa no debe exponer gestion operativa Conecta usuario-usuario',
);

console.log('smoke-classic-conecta-api-boundary: ok');
