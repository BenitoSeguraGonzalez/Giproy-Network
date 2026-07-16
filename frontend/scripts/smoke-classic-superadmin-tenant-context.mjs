import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/context/AuthContext.jsx', import.meta.url), 'utf8');
const tenantSource = readFileSync(new URL('../src/api/tenant.js', import.meta.url), 'utf8');
const layoutSource = readFileSync(new URL('../src/layouts/AppLayout.jsx', import.meta.url), 'utf8');

const requiredTokens = [
    'basesTrabajoApi.deactivateAll',
    "localStorage.removeItem('giproy_working_base')",
    "localStorage.removeItem('giproy_working_project')",
    'setSelectedBaseTrabajo(null)',
    'setActiveProject(null)',
    'dispatchWorkingCompanyChanged(empresa)',
    'Cambiar de empresa debe comportarse como un login limpio',
];

for (const token of requiredTokens) {
    assert.equal(
        source.includes(token),
        true,
        `El cambio de empresa superadministrador debe conservar la guarda de contexto: ${token}`,
    );
}

assert.match(
    source,
    /const\s+empresaIdsToDeactivate\s*=\s*new\s+Set\(/,
    'El cambio de empresa debe desactivar bases en empresa saliente y entrante de forma explicita.',
);

assert.match(
    source,
    /const\s+empresaId\s*=\s*Number\(selectedEmpresa\.id\)[\s\S]*const\s+baseEmpresaId[\s\S]*const\s+projectEmpresaId[\s\S]*baseEmpresaId !== empresaId[\s\S]*setSelectedBaseTrabajo\(null\)[\s\S]*projectEmpresaId !== empresaId[\s\S]*setActiveProject\(null\)/,
    'AuthContext debe limpiar estado activo si base o proyecto no pertenecen a la empresa operativa.',
);

assert.match(
    tenantSource,
    /export const WORKING_COMPANY_CHANGED_EVENT = 'giproy:working-company-changed'/,
    'La capa tenant debe exponer un evento global de cambio de empresa operativa.',
);

assert.match(
    tenantSource,
    /export const dispatchWorkingCompanyChanged = \(empresa = null\) => \{[\s\S]*empresa_id: empresa\?\.id \?\? null/s,
    'La capa tenant debe emitir detalle de empresa y empresa_id al cambiar contexto.',
);

assert.match(
    layoutSource,
    /const tenantContentKey = `empresa-operativa:\$\{selectedEmpresa\?\.id \?\? 'sin-empresa'\}`/,
    'AppLayout debe derivar una key de contenido desde la empresa operativa.',
);

assert.match(
    layoutSource,
    /<div key=\{tenantContentKey\} data-tenant-content-key=\{tenantContentKey\} className="contents">[\s\S]*\{children\}[\s\S]*<\/div>/,
    'AppLayout debe remontar el contenido protegido al cambiar la empresa operativa.',
);

console.log('smoke-classic-superadmin-tenant-context: ok');
