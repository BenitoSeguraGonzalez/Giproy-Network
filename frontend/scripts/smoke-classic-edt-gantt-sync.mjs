import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const edtSource = readFileSync(new URL('../src/components/projects/Edt.jsx', import.meta.url), 'utf8');
const syncSource = readFileSync(new URL('../src/utils/edtGanttSync.js', import.meta.url), 'utf8');
const valuationSource = readFileSync(new URL('../src/utils/edtValuation.js', import.meta.url), 'utf8');

assert.match(
    edtSource,
    /cronogramasApi\.getTrabajo\(activeBudget\.id,\s*empId\)/,
    'La EDT clasica debe leer el cronograma de trabajo vigente del presupuesto activo',
);

assert.match(
    edtSource,
    /buildEdtGanttDurationSync\(\{\s*tree:\s*valuedTreeBase,\s*rows:\s*ganttTrabajo\?\.rows\s*\|\|\s*\[\],/s,
    'La EDT debe derivar duraciones Gantt desde rows sin persistencia nueva',
);

assert.match(
    edtSource,
    /gantt_duration_sync/,
    'Los nodos EDT deben recibir un bloque de sincronizacion Gantt',
);

assert.match(
    edtSource,
    /Dur\.\s*\{formatEdtGanttDurationDays/,
    'La vista arbol debe mostrar el semaforo adicional de duracion Gantt',
);

assert.match(
    syncSource,
    /:\s*'defined'/,
    'El sincronizador debe exponer estado definido para partidas con duracion',
);

assert.match(
    syncSource,
    /scheduledRows\s*<\s*merged\.totalRows/,
    'El sincronizador debe distinguir duracion parcial',
);

assert.match(
    valuationSource,
    /sumBudgetOperationalSubtotals/,
    'El valor directo de EDT debe seguir saliendo del subtotal operativo de presupuesto',
);

assert.match(
    valuationSource,
    /multiplyDecimalNumber\(\[directo,\s*factor\]/,
    'El valor valorizado EDT debe seguir siendo directo + indirectos, sin IVA',
);

for (const source of [edtSource, syncSource]) {
    assert.equal(source.includes('bim'), false, 'El slice EDT-Gantt clasico no debe introducir referencias BIM');
    assert.equal(source.includes('BIM'), false, 'El slice EDT-Gantt clasico no debe introducir referencias BIM');
}

console.log('smoke-classic-edt-gantt-sync: ok');
