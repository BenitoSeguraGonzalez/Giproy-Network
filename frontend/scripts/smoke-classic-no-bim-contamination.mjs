import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const proyectosSource = readFileSync(new URL('../src/pages/Proyectos.jsx', import.meta.url), 'utf8');

const forbiddenClassicRouteTokens = [
    'useBimFeatureAccess',
    'BimTab',
    'bimNavigationContext',
    'setBimNavigationContext',
    'handleBimNavigateTarget',
    'BIM_SECTION',
];

for (const token of forbiddenClassicRouteTokens) {
    assert.equal(
        proyectosSource.includes(token),
        false,
        `La ruta clasica Proyectos.jsx no debe montar ni depender de BIM en MODO 1: ${token}`,
    );
}

assert.match(
    proyectosSource,
    /CLASSIC_BIM_ACCESS_DISABLED\s*=\s*Object\.freeze\(\s*\{[\s\S]*?enabled:\s*false,/,
    'La ruta clasica debe conservar BIM apagado de forma explicita y no interferente',
);

assert.match(
    proyectosSource,
    /const\s+bimAccess\s*=\s*CLASSIC_BIM_ACCESS_DISABLED;/,
    'La ruta clasica debe usar el estado BIM neutro sin ejecutar hooks BIM',
);

console.log('smoke-classic-no-bim-contamination: ok');
