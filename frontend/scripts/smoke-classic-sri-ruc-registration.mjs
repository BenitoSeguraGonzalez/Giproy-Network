import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const api = readFileSync(new URL('../src/api/publicAuth.js', import.meta.url), 'utf8');
const register = readFileSync(new URL('../src/components/RegisterModal.jsx', import.meta.url), 'utf8');
const personnel = readFileSync(new URL('../src/components/PersonnelFormFields.jsx', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../src/pages/AdminGlobalIntegraciones.jsx', import.meta.url), 'utf8');

for (const token of [
  '/sri-ruc/public/lookup/',
  '/sri-ruc/public/manual-review',
  '/sri-ruc/public/manual-review/status',
]) assert.equal(api.includes(token), true, `publicAuth debe conservar ${token}`);

assert.equal(register.includes('En revisión manual'), true);
assert.equal(register.includes('certificate_code'), true);
assert.equal(personnel.includes('catálogo PostgreSQL'), true);
assert.equal(admin.includes('24'), true);

for (const source of [api, register, personnel, admin]) {
  assert.equal(source.includes('EcuadorAPI'), false, 'La frontera fiscal no debe depender del proveedor retirado.');
  assert.equal(source.includes('axiosConfig'), source === api ? true : false, 'Solo el cliente API puede importar axiosConfig.');
}

console.log('smoke-classic-sri-ruc-registration: ok');
