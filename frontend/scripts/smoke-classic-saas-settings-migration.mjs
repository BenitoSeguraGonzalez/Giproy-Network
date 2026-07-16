import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const settingsSource = readFileSync(new URL('../src/pages/Settings.jsx', import.meta.url), 'utf8');
const adminGlobalSource = readFileSync(new URL('../src/pages/AdminGlobal.jsx', import.meta.url), 'utf8');
const routerSource = readFileSync(new URL('../src/routes/AppRouter.jsx', import.meta.url), 'utf8');
const adminGlobalIntegracionesSource = readFileSync(new URL('../src/pages/AdminGlobalIntegraciones.jsx', import.meta.url), 'utf8');
const adminGlobalSuperadministradoresSource = readFileSync(new URL('../src/pages/AdminGlobalSuperadministradores.jsx', import.meta.url), 'utf8');
const usuariosApiSource = readFileSync(new URL('../src/api/usuarios.js', import.meta.url), 'utf8');

assert.equal(
  settingsSource.includes('Ajuste SaaS'),
  false,
  'Settings Empresa no debe mostrar ni conservar la etiqueta Ajuste SaaS',
);

assert.equal(
  settingsSource.includes('EcuadorAPI'),
  false,
  'Settings Empresa no debe gestionar EcuadorAPI',
);

assert.equal(
  settingsSource.includes('ECUADOR_API_KEY'),
  false,
  'Settings Empresa no debe leer ni escribir ECUADOR_API_KEY',
);

assert.equal(
  settingsSource.includes("setActiveTab('superadmins')"),
  false,
  'Settings Empresa no debe activar una pestaña interna de superadministradores',
);

assert.equal(
  settingsSource.includes("activeTab === 'superadmins' ? renderSuperadmins()"),
  false,
  'Settings Empresa no debe renderizar superadministradores como seccion propia',
);

assert.equal(
  settingsSource.includes("navigate('/admin-global/superadministradores', { replace: true })"),
  true,
  'Settings debe redirigir /settings?tab=superadmins hacia Administracion Global',
);

assert.match(
  adminGlobalSource,
  /id:\s*'superadmins'[\s\S]*?title:\s*'Superadministradores'[\s\S]*?href:\s*'\/admin-global\/superadministradores'/,
  'AdminGlobal debe exponer Superadministradores como submodulo SaaS propio',
);

assert.match(
  adminGlobalSource,
  /id:\s*'integraciones'[\s\S]*?title:\s*'Integraciones'[\s\S]*?href:\s*'\/admin-global\/integraciones'/,
  'AdminGlobal debe exponer Integraciones como submodulo SaaS propio',
);

for (const token of [
  "const AdminGlobalIntegraciones = lazyWithChunkRecovery(() => import('../pages/AdminGlobalIntegraciones'));",
  "const AdminGlobalSuperadministradores = lazyWithChunkRecovery(() => import('../pages/AdminGlobalSuperadministradores'));",
  'path="/admin-global/integraciones"',
  'path="/admin-global/superadministradores"',
]) {
  assert.equal(routerSource.includes(token), true, `Router debe conservar ${token}`);
}

for (const token of [
  "import { sriRucApi } from '../api/sriRuc';",
  'sriRucApi.getStatus()',
  'sriRucApi.listManualReviews()',
  'Catálogo RUC SRI',
  'En revisión manual',
]) {
  assert.equal(adminGlobalIntegracionesSource.includes(token), true, `Integraciones debe exponer ${token}`);
}

for (const retiredToken of ['ECUADOR_API_KEY', 'EcuadorAPI']) {
  assert.equal(adminGlobalIntegracionesSource.includes(retiredToken), false, `Integraciones no debe conservar ${retiredToken}`);
}

for (const token of [
  "import { usuariosApi } from '../api/usuarios';",
  'usuariosApi.getAllGlobal()',
  'usuariosApi.updateGlobal(selectedId, payload)',
  'Superadministradores',
  'allowSuperAdminRole',
  "availableRoles={['Superadministrador']}",
]) {
  assert.equal(adminGlobalSuperadministradoresSource.includes(token), true, `Superadministradores debe conservar ${token}`);
}

for (const token of [
  'withoutTenant',
  'getAllGlobal',
  'updateGlobal',
]) {
  assert.equal(usuariosApiSource.includes(token), true, `usuariosApi debe exponer operacion global tenantless: ${token}`);
}

assert.equal(
  /api\.(get|post|put|patch|delete)\(/.test(adminGlobalIntegracionesSource),
  false,
  'Integraciones debe usar sriRucApi y no llamadas API directas',
);

assert.equal(
  /api\.(get|post|put|patch|delete)\(/.test(adminGlobalSuperadministradoresSource),
  false,
  'Superadministradores debe usar usuariosApi y no llamadas API directas',
);

console.log('smoke-classic-saas-settings-migration: ok');
