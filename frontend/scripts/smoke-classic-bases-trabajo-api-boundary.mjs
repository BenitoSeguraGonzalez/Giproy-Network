import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const basesSource = readFileSync(new URL('../src/pages/BasesTrabajo.jsx', import.meta.url), 'utf8');
const basesApiSource = readFileSync(new URL('../src/api/basesTrabajo.js', import.meta.url), 'utf8');
const maestrosApiSource = readFileSync(new URL('../src/api/maestros.js', import.meta.url), 'utf8');
const proyectosApiSource = readFileSync(new URL('../src/api/proyectos.js', import.meta.url), 'utf8');

assert.equal(
    basesSource.includes("from '../api/axiosConfig'"),
    false,
    'BasesTrabajo no debe importar axiosConfig directamente en MODO 1',
);

for (const importStatement of [
    "import basesTrabajoApi from '../api/basesTrabajo';",
    "import { maestrosApi } from '../api/maestros';",
    "import { proyectosApi } from '../api/proyectos';",
]) {
    assert.equal(
        basesSource.includes(importStatement),
        true,
        `BasesTrabajo debe conservar cliente API: ${importStatement}`,
    );
}

for (const token of [
    'DEBUG BASES',
    'DEBUG CREATE',
]) {
    assert.equal(
        basesSource.includes(token),
        false,
        `BasesTrabajo no debe conservar trazas DEBUG productivas: ${token}`,
    );
}

for (const token of [
    'text-sm font-black uppercase tracking-tight truncate leading-tight text-zinc-900',
    'text-[10px] text-zinc-400 font-medium italic line-clamp-2 leading-relaxed',
]) {
    assert.equal(
        basesSource.includes(token),
        false,
        `BasesTrabajo no debe recortar nombre/descripcion principal del card: ${token}`,
    );
}

for (const token of [
    'text-[13px] font-black uppercase tracking-tight leading-snug text-zinc-900 break-words [overflow-wrap:anywhere]',
    'max-h-16 overflow-y-auto pr-1 text-[10px] text-zinc-500 font-medium italic leading-relaxed custom-scrollbar break-words [overflow-wrap:anywhere]',
]) {
    assert.equal(
        basesSource.includes(token),
        true,
        `BasesTrabajo debe conservar lectura visible de nombre/descripcion en card: ${token}`,
    );
}

for (const token of [
    'basesTrabajoApi.executeSyncOperation(base.id, mode, selectedEmpresa?.id)',
    "basesTrabajoApi.getAll({ empresa_id: selectedEmpresa?.id })",
    'maestrosApi.getPaises()',
    'basesTrabajoApi.getNextCode(selectedEmpresa?.id)',
    'basesTrabajoApi.getById(requestedBaseId, selectedEmpresa?.id)',
    'basesTrabajoApi.activate(targetBase.id, selectedEmpresa?.id)',
    'basesTrabajoApi.activate(base.id, selectedEmpresa?.id)',
    'basesTrabajoApi.previewSyncOperation(baseId, mode, selectedEmpresa?.id)',
    'basesTrabajoApi.revertSyncOperation(base.id, eventId, selectedEmpresa?.id)',
    'basesTrabajoApi.getSyncHistory(base.id, selectedEmpresa?.id, 8)',
    'basesTrabajoApi.update(editingBase.id, payload, eid)',
    'basesTrabajoApi.create(payload, eid)',
    'proyectosApi.getByBaseId(base.id)',
    'proyectosApi.delete(linkedProject.id)',
    'basesTrabajoApi.delete(baseToDelete.id, eid)',
]) {
    assert.equal(
        basesSource.includes(token),
        true,
        `BasesTrabajo debe conservar uso critico de API: ${token}`,
    );
}

for (const method of [
    'getAll',
    'getById',
    'create',
    'update',
    'delete',
    'getNextCode',
    'activate',
    'deactivateAll',
    'syncMissing',
    'previewSyncMissing',
    'repairInherited',
    'previewSyncOperation',
    'executeSyncOperation',
    'revertSyncOperation',
    'getSyncHistory',
    'getAssignedUsers',
    'assignUser',
    'unassignUser',
]) {
    assert.match(
        basesApiSource,
        new RegExp(`\\b${method}\\s*:`),
        `basesTrabajoApi debe exponer ${method}`,
    );
}

for (const endpoint of [
    "'/bases-trabajo/'",
    "'/bases-trabajo/generate-base-code'",
    "'/bases-trabajo/active'",
    "'/bases-trabajo/deactivate-all'",
    '`/bases-trabajo/${id}`',
    '`/bases-trabajo/${id}/activate`',
    '`/bases-trabajo/${id}/sync-missing`',
    '`/bases-trabajo/${id}/sync-missing/preview`',
    '`/bases-trabajo/${id}/repair-inherited`',
    '`/bases-trabajo/${id}/sync/preview`',
    '`/bases-trabajo/${id}/sync/execute`',
    '`/bases-trabajo/${id}/sync/revert`',
    '`/bases-trabajo/${id}/sync-history`',
    '`/bases-trabajo/${id}/assigned-users`',
    '`/bases-trabajo/${id}/assign`',
    '`/bases-trabajo/${id}/assign/${usuarioId}`',
]) {
    assert.equal(
        basesApiSource.includes(endpoint),
        true,
        `basesTrabajoApi debe conservar endpoint: ${endpoint}`,
    );
}

for (const token of [
    'withTenantParams(params)',
    'withTenantConfig({}, empresaId)',
    "throw new Error('El backend activo no soporta todavía la previsualización operativa de sincronización con reversión. Reinicie o actualice el backend antes de sincronizar.')",
    "throw new Error('El backend activo no soporta todavía la ejecución de sincronización con reversión. No se ejecutó ningún sincronismo. Reinicie o actualice el backend.')",
]) {
    assert.equal(
        basesApiSource.includes(token),
        true,
        `basesTrabajoApi debe conservar contrato tenant/fallback: ${token}`,
    );
}

assert.match(
    maestrosApiSource,
    /getPaises\s*:[\s\S]*withoutTenant\(\)/,
    'maestrosApi.getPaises debe conservar lectura tenantless',
);

assert.match(
    proyectosApiSource,
    /getByBaseId\s*:[\s\S]*withTenantConfig\(\{\},\s*empresaId\)/,
    'proyectosApi.getByBaseId debe conservar empresaId',
);

console.log('smoke-classic-bases-trabajo-api-boundary: ok');
