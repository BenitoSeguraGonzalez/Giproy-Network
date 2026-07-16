import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const formulaSource = readFileSync(new URL('../src/components/projects/FormulaPolinomicaTab.jsx', import.meta.url), 'utf8');
const polinomicaApiSource = readFileSync(new URL('../src/api/polinomica.js', import.meta.url), 'utf8');
const presupuestosApiSource = readFileSync(new URL('../src/api/presupuestos.js', import.meta.url), 'utf8');

assert.equal(
    formulaSource.includes("from '../../api/axiosConfig'"),
    false,
    'FormulaPolinomicaTab no debe importar axiosConfig directamente en MODO 1',
);

for (const importStatement of [
    "import { polinomicaApi } from '../../api/polinomica';",
    "import { presupuestosApi } from '../../api/presupuestos';",
]) {
    assert.equal(
        formulaSource.includes(importStatement),
        true,
        `FormulaPolinomicaTab debe conservar cliente API: ${importStatement}`,
    );
}

for (const token of [
    'presupuestosApi.getByProyecto(projectId)',
    'polinomicaApi.getIndicesInec()',
    'polinomicaApi.getResources(budgetId)',
    'polinomicaApi.getFormula(budgetId)',
    'polinomicaApi.regenerate(budgetId, finalType)',
    'polinomicaApi.saveAssignments(presupuestoId, payload)',
    'polinomicaApi.saveIndices(presupuestoId, payload)',
    'polinomicaApi.regenerate(presupuestoId, finalType)',
]) {
    assert.equal(
        formulaSource.includes(token),
        true,
        `FormulaPolinomicaTab debe conservar uso de cliente API: ${token}`,
    );
}

const expectedPolinomicaEndpoints = [
    "'/polinomica/indices-inec'",
    '`/polinomica/${presupuestoId}/resources`',
    '`/polinomica/${presupuestoId}`',
    '`/polinomica/${presupuestoId}/regenerate`',
    '`/polinomica/${presupuestoId}/assignments`',
    '`/polinomica/${presupuestoId}/indices`',
];

for (const endpoint of expectedPolinomicaEndpoints) {
    assert.equal(
        polinomicaApiSource.includes(endpoint),
        true,
        `polinomicaApi debe conservar endpoint: ${endpoint}`,
    );
}

for (const method of ['getIndicesInec', 'getResources', 'getFormula', 'regenerate', 'saveAssignments', 'saveIndices']) {
    assert.match(
        polinomicaApiSource,
        new RegExp(`\\b${method}\\s*:`),
        `polinomicaApi debe exponer ${method}`,
    );
}

assert.match(
    presupuestosApiSource,
    /getByProyecto\s*:[\s\S]*withTenantParams\(\{\s*proyecto_id:\s*proyectoId\s*\},\s*empresaId\)/,
    'presupuestosApi.getByProyecto debe conservar withTenantParams con proyecto_id y empresaId',
);

console.log('smoke-classic-formula-polinomica-api-boundary: ok');
