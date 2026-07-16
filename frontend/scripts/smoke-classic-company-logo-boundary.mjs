import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveMediaUrl } from '../src/utils/mediaUrl.js';

const layoutSource = readFileSync(new URL('../src/layouts/AppLayout.jsx', import.meta.url), 'utf8');
const settingsSource = readFileSync(new URL('../src/pages/Settings.jsx', import.meta.url), 'utf8');
const empresasApiSource = readFileSync(new URL('../src/api/empresas.js', import.meta.url), 'utf8');
const backendMainSource = readFileSync(new URL('../../backend/app/main.py', import.meta.url), 'utf8');

assert.match(
    layoutSource,
    /selectedEmpresa\?\.logo_url[\s\S]{0,220}resolveMediaUrl\(selectedEmpresa\.logo_url\)/,
    'AppLayout debe renderizar el logo de la empresa seleccionada usando resolveMediaUrl',
);

assert.match(
    settingsSource,
    /miEmpresa\?\.logo_url[\s\S]{0,260}resolveMediaUrl\(miEmpresa\.logo_url\)/,
    'Settings debe previsualizar logo_url de empresa usando resolveMediaUrl',
);

assert.match(
    settingsSource,
    /empresasApi\.uploadLogo\(empresaId,\s*formData\)/,
    'Settings debe subir logo en alta/edicion de empresa usando empresasApi.uploadLogo',
);

assert.match(
    settingsSource,
    /empresasApi\.uploadLogo\(empId,\s*formData\)/,
    'Settings debe subir logo de Mi Empresa usando empresasApi.uploadLogo',
);

assert.match(
    empresasApiSource,
    /api\.post\(`\/empresas\/upload-logo\/\$\{empresaId\}`,\s*formData,\s*\{[\s\S]*multipart\/form-data/,
    'empresasApi.uploadLogo debe conservar endpoint y multipart/form-data',
);

assert.match(
    backendMainSource,
    /app\.mount\("\/uploads",\s*StaticFiles\(directory="uploads"\),\s*name="uploads"\)/,
    'Backend debe mantener /uploads montado para servir logos de empresa',
);

assert.equal(resolveMediaUrl('/uploads/logos/logo.png'), '/uploads/logos/logo.png');
assert.equal(resolveMediaUrl('uploads/logos/logo.png'), '/uploads/logos/logo.png');
assert.equal(resolveMediaUrl('https://cdn.example/logo.png'), 'https://cdn.example/logo.png');
assert.equal(resolveMediaUrl('uploads\\logos\\logo.png'), '/uploads/logos/logo.png');

console.log('smoke-classic-company-logo-boundary: ok');
