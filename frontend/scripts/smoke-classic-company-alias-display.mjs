import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getCompanyDisplayName } from '../src/utils/companyDisplayName.js';

const appLayoutSource = readFileSync(new URL('../src/layouts/AppLayout.jsx', import.meta.url), 'utf8');
const loginSource = readFileSync(new URL('../src/pages/Login.jsx', import.meta.url), 'utf8');
const settingsSource = readFileSync(new URL('../src/pages/Settings.jsx', import.meta.url), 'utf8');
const registerSource = readFileSync(new URL('../src/components/RegisterModal.jsx', import.meta.url), 'utf8');
const personnelFieldsSource = readFileSync(new URL('../src/components/PersonnelFormFields.jsx', import.meta.url), 'utf8');

assert.equal(getCompanyDisplayName({ alias: 'Constructora Norte', nombre: 'Empresa Legal SA' }), 'Constructora Norte');
assert.equal(getCompanyDisplayName({ empresa_alias: 'Alias Login', empresa_nombre: 'Legal Login' }), 'Alias Login');
assert.equal(getCompanyDisplayName({ nombre: 'Empresa Legal SA' }), 'Empresa Legal SA');
assert.equal(getCompanyDisplayName(null, 'Global'), 'Global');

for (const [sourceName, source] of [
    ['AppLayout', appLayoutSource],
    ['Login', loginSource],
    ['Settings', settingsSource],
]) {
    assert.equal(
        source.includes('getCompanyDisplayName'),
        true,
        `${sourceName} debe usar getCompanyDisplayName para mostrar empresas`,
    );
}

for (const token of [
    'empresa_alias',
    "empresa_alias: ''",
]) {
    assert.equal(
        registerSource.includes(token),
        true,
        `RegisterModal debe conservar alias de empresa: ${token}`,
    );
}

assert.equal(
    personnelFieldsSource.includes('Alias de Empresa'),
    true,
    'PersonnelFormFields debe mostrar Alias de Empresa en registro publico',
);

assert.equal(
    settingsSource.includes("alias: ''"),
    true,
    'Settings debe conservar alias al crear empresa',
);

console.log('smoke-classic-company-alias-display: ok');
