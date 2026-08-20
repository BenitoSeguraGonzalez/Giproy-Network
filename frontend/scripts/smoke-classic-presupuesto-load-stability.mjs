import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/components/presupuestos/PresupuestoDetail.jsx', import.meta.url), 'utf8');

const loadEffect = source.match(
    /const fetchDetalle = async \(\) =>[\s\S]*?fetchDetalle\(\);[\s\S]*?\}, \[([^\]]+)\]\);/,
);
assert.ok(loadEffect, 'Debe existir un efecto identificable de carga del presupuesto.');
assert.doesNotMatch(
    loadEffect[1],
    /(?:^|,)\s*activePresupuesto\s*(?:,|$)/,
    'La carga del presupuesto no debe depender del objeto activePresupuesto que actualiza el propio efecto.',
);

assert.match(
    source,
    /const fetchDetalle = async \(\) =>[\s\S]*?setActivePresupuesto\(presData\)[\s\S]*?fetchDetalle\(\);/,
    'La carga debe conservar la actualización del presupuesto activo.',
);

console.log('smoke-classic-presupuesto-load-stability: ok');
