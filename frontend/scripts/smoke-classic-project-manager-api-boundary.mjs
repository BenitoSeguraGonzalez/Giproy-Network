import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const projectManagerSource = readFileSync(new URL('../src/pages/ProjectManager.jsx', import.meta.url), 'utf8');
const proyectosApiSource = readFileSync(new URL('../src/api/proyectos.js', import.meta.url), 'utf8');
const basesTrabajoApiSource = readFileSync(new URL('../src/api/basesTrabajo.js', import.meta.url), 'utf8');
const usuariosApiSource = readFileSync(new URL('../src/api/usuarios.js', import.meta.url), 'utf8');
const edtApiSource = readFileSync(new URL('../src/api/edt.js', import.meta.url), 'utf8');

assert.equal(
    projectManagerSource.includes("from '../api/axiosConfig'"),
    false,
    'ProjectManager no debe importar axiosConfig directamente en MODO 1',
);

for (const importStatement of [
    "import { proyectosApi } from '../api/proyectos';",
    "import { basesTrabajoApi } from '../api/basesTrabajo';",
    "import { edtApi } from '../api/edt';",
    "import { usuariosApi } from '../api/usuarios';",
]) {
    assert.equal(
        projectManagerSource.includes(importStatement),
        true,
        `ProjectManager debe conservar cliente de dominio: ${importStatement}`,
    );
}

for (const token of [
    'proyectosApi.getAll(',
    'basesTrabajoApi.getAll(',
    'usuariosApi.getAll(',
    'edtApi.getTree(',
    'proyectosApi.getAssignmentDashboard(',
    'proyectosApi.getAssignedUsers(',
    'basesTrabajoApi.getAssignedUsers(',
    'proyectosApi.assignUser(',
    'basesTrabajoApi.assignUser(',
    'proyectosApi.unassignUser(',
    'basesTrabajoApi.unassignUser(',
]) {
    assert.equal(
        projectManagerSource.includes(token),
        true,
        `ProjectManager debe conservar uso de cliente API: ${token}`,
    );
}

for (const method of ['getAssignedUsers', 'assignUser', 'unassignUser']) {
    assert.match(
        proyectosApiSource,
        new RegExp(`\\b${method}\\s*:`),
        `proyectosApi debe exponer ${method}`,
    );
    assert.match(
        basesTrabajoApiSource,
        new RegExp(`\\b${method}\\s*:`),
        `basesTrabajoApi debe exponer ${method}`,
    );
}

assert.match(
    proyectosApiSource,
    /getAssignmentDashboard\s*:[\s\S]*withTenantConfig\(\{\s*params:\s*\{\s*modulo\s*\}\s*\},\s*empresaId\)/,
    'proyectosApi.getAssignmentDashboard debe conservar empresaId via withTenantConfig',
);

assert.match(
    usuariosApiSource,
    /getAll\s*:[\s\S]*withTenantParams\(params\)/,
    'usuariosApi.getAll debe conservar withTenantParams(params)',
);

assert.match(
    edtApiSource,
    /getTree\s*:[\s\S]*withTenantConfig\(\{\},\s*empresaId\)/,
    'edtApi.getTree debe conservar empresaId via withTenantConfig',
);

console.log('smoke-classic-project-manager-api-boundary: ok');
