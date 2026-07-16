import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const proyectosSource = readFileSync(new URL('../src/pages/Proyectos.jsx', import.meta.url), 'utf8');

assert.match(
    proyectosSource,
    /import\s+\{\s*useBimFeatureAccess\s*\}[\s\S]*const\s+BimTab\s*=\s*lazyWithChunkRecovery/,
    'La integracion controlada debe resolver acceso y cargar BIM de forma diferida',
);
assert.match(
    proyectosSource,
    /const\s+bimEnabled\s*=\s*!bimAccessLoading\s*&&\s*bimAccess\.enabled;/,
    'La puerta BIM debe permanecer cerrada durante carga o acceso denegado',
);
assert.match(
    proyectosSource,
    /bimEnabled\s*\?\s*\[\.\.\.CLASSIC_SECTIONS,\s*BIM_SECTION\]\s*:\s*CLASSIC_SECTIONS/,
    'Las secciones clasicas deben conservarse sin cambios cuando BIM esta apagado',
);
assert.match(
    proyectosSource,
    /activeTab\s*===\s*['"]bim['"]\s*&&\s*bimEnabled\s*\?[\s\S]*<BimTab[\s\S]*access=\{bimAccess\}/,
    'El workspace BIM solo puede montarse tras la puerta de acceso positiva',
);
assert.match(
    proyectosSource,
    /!bimAccessLoading\s*&&\s*!bimAccess\.enabled\s*&&\s*activeTab\s*===\s*['"]bim['"][\s\S]*activateProjectTab\(['"]datos['"],\s*\{\s*replace:\s*true\s*\}\)/,
    'Una URL BIM no autorizada debe regresar a Datos del proyecto',
);

console.log('smoke-classic-no-bim-contamination: ok');
