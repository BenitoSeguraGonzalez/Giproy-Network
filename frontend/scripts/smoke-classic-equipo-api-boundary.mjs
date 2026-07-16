import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const equipoApiSource = readFileSync(new URL('../src/api/equipo.js', import.meta.url), 'utf8');
const adminLicensesSource = readFileSync(new URL('../src/pages/AdminGlobalLicencias.jsx', import.meta.url), 'utf8');

assert.match(
    equipoApiSource,
    /import\s+api\s+from\s+'\.\/axiosConfig';/,
    'equipoApi debe encapsular axiosConfig dentro de frontend/src/api',
);

for (const endpoint of [
    '/equipo/limits',
    '/equipo/seats',
    '/equipo/operations',
    '/equipo/context',
    '/equipo/admin/summary',
    '/equipo/assignments',
    '/equipo/locks',
    '/equipo/proposals',
]) {
    assert.equal(
        equipoApiSource.includes(endpoint),
        true,
        `equipoApi debe conservar endpoint ${endpoint}`,
    );
}

assert.equal(
    adminLicensesSource.includes("from '../api/axiosConfig'"),
    false,
    'AdminGlobalLicencias no debe importar axiosConfig directamente',
);
assert.match(
    adminLicensesSource,
    /import\s+\{\s*equipoApi\s*\}\s+from\s+'..\/api\/equipo';/,
    'AdminGlobalLicencias debe consumir equipoApi',
);
assert.equal(
    /['"`]\/equipo\//.test(adminLicensesSource),
    false,
    'AdminGlobalLicencias no debe hardcodear rutas /equipo fuera del cliente API',
);
assert.equal(
    /\bconsole\.log\s*\(/.test(adminLicensesSource),
    false,
    'AdminGlobalLicencias no debe introducir console.log productivos',
);

console.log('smoke-classic-equipo-api-boundary: ok');
