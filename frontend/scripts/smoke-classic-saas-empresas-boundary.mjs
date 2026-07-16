import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const adminGlobalSource = readFileSync(new URL('../src/pages/AdminGlobal.jsx', import.meta.url), 'utf8');
const adminGlobalEmpresasSource = readFileSync(new URL('../src/pages/AdminGlobalEmpresas.jsx', import.meta.url), 'utf8');
const adminGlobalGobernanzaSource = readFileSync(new URL('../src/pages/AdminGlobalGobernanza.jsx', import.meta.url), 'utf8');
const settingsSource = readFileSync(new URL('../src/pages/Settings.jsx', import.meta.url), 'utf8');
const routerSource = readFileSync(new URL('../src/routes/AppRouter.jsx', import.meta.url), 'utf8');
const empresaSchemaSource = readFileSync(new URL('../../backend/app/schemas/empresa.py', import.meta.url), 'utf8');
const empresasEndpointSource = readFileSync(new URL('../../backend/app/api/endpoints/empresas.py', import.meta.url), 'utf8');

assert.match(
    adminGlobalSource,
    /id:\s*'empresas'[\s\S]*?title:\s*'Empresas'[\s\S]*?href:\s*'\/admin-global\/empresas'/,
    'La card SaaS Empresas debe apuntar solo a /admin-global/empresas',
);

assert.equal(
    adminGlobalSource.includes("href: '/settings?tab=empresas'"),
    false,
    'AdminGlobal no debe enlazar Empresas a Settings',
);

assert.equal(
    adminGlobalGobernanzaSource.includes("navigate('/settings?tab=empresas')"),
    false,
    'Gobernanza no debe abrir gestion de empresas en Settings',
);

assert.equal(
    settingsSource.includes("activeTab === 'empresas' ? renderEmpresas()"),
    false,
    'Settings no debe renderizar Gestion de Empresas SaaS',
);

assert.equal(
    settingsSource.includes("navigate('/admin-global/empresas', { replace: true })"),
    true,
    'Settings debe redirigir /settings?tab=empresas hacia la superficie SaaS',
);

for (const token of [
    "const AdminGlobalEmpresas = lazyWithChunkRecovery(() => import('../pages/AdminGlobalEmpresas'));",
    'path="/admin-global/empresas"',
]) {
    assert.equal(routerSource.includes(token), true, `Router debe conservar ${token}`);
}

for (const token of [
    'registration_status',
    'pending_email_verification',
    'Pendiente validación',
    'resolveEmpresaStatus',
    'STATUS_FILTERS',
    'statusFilter',
    'statusCounts',
    'rounded-[1.5rem] border border-zinc-200 bg-white/90 p-3',
    'Activas',
    'Suspendidas',
    'Baja',
    'Pendientes',
    'Expiradas',
    'appConfirm',
    'Suspender empresa',
    'Confirmacion final',
    'afecta el acceso de todos los usuarios',
    'baja_purgada',
    'Baja purgada',
    'openOffboarding',
    'executeOffboarding',
    'openRecovery',
    'executeRecovery',
    'CONFIRMO BAJA PURGADA',
    'CONFIRMO IMPORTACION',
]) {
    assert.equal(adminGlobalEmpresasSource.includes(token), true, `AdminGlobalEmpresas debe mostrar pendientes: ${token}`);
}

assert.equal(
    adminGlobalEmpresasSource.includes('<select'),
    false,
    'AdminGlobalEmpresas debe usar filtro segmentado, no select nativo',
);

assert.equal(
    empresaSchemaSource.includes('registration_status: str = "active"'),
    true,
    'EmpresaResponse debe exponer registration_status',
);

for (const token of [
    'lifecycle_status: str = "active"',
    'baja_backup_hash',
    'baja_recovery_required',
]) {
    assert.equal(empresaSchemaSource.includes(token), true, `EmpresaResponse debe exponer ciclo de baja: ${token}`);
}

for (const token of [
    'RegistrationVerificationToken',
    'pending_email_verification',
    'pending_email_expired',
    '_attach_registration_status',
]) {
    assert.equal(empresasEndpointSource.includes(token), true, `Endpoint empresas debe derivar estado de registro: ${token}`);
}

console.log('smoke-classic-saas-empresas-boundary: ok');
