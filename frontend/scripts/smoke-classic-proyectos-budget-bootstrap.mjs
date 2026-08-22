import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const proyectosSource = readFileSync(new URL('../src/pages/Proyectos.jsx', import.meta.url), 'utf8');
const formulaSource = readFileSync(new URL('../src/components/projects/FormulaPolinomicaTab.jsx', import.meta.url), 'utf8');
const desagregacionSource = readFileSync(new URL('../src/components/projects/DesagregacionTab.jsx', import.meta.url), 'utf8');

assert.equal(
    proyectosSource.includes("import { PresupuestoProvider } from '../context/PresupuestoContext';"),
    true,
    'Proyectos debe importar PresupuestoProvider antes de usarlo en la sección Presupuesto.',
);

assert.equal(
    formulaSource.includes("import { normalizeBudgetCollection } from '../../utils/budgetResponse';")
        && formulaSource.includes('const budgets = normalizeBudgetCollection(response);')
        && formulaSource.includes('presupuestosApi.getByProyecto(projectId, empresaId)'),
    true,
    'Fórmula Polinómica debe resolver presupuestos normalizados dentro del tenant activo.',
);

assert.equal(
    desagregacionSource.includes("import { normalizeBudgetCollection } from '../../utils/budgetResponse';")
        && desagregacionSource.includes('empresa_id: empresaId')
        && /const presData = presupuestoResult\.status === 'fulfilled'[\s\S]*?normalizeBudgetCollection\(presupuestoResult\.value\)/.test(desagregacionSource),
    true,
    'Desagregación debe cargar presupuestos normalizados dentro del tenant activo.',
);

assert.match(
    desagregacionSource,
    /if \(!project\?\.id\) return;[\s\S]*?setSelectedPresId\(null\);[\s\S]*?setBudgetData\(null\);/,
    'DesagregaciÃ³n debe limpiar la selecciÃ³n anterior al cambiar de proyecto.',
);

const { normalizeBudgetCollection } = await import('../src/components/projects/cronogramasGanttBootstrap.js');

for (const response of [
    [{ id: 1 }],
    { data: [{ id: 2 }] },
    { data: { items: [{ id: 3 }] } },
    { items: [{ id: 4 }] },
]) {
    assert.deepEqual(
        normalizeBudgetCollection(response),
        [{ id: Number(response?.data?.items?.[0]?.id || response?.data?.[0]?.id || response?.items?.[0]?.id || response?.[0]?.id) }],
        `Debe normalizar respuestas de presupuestos con forma ${JSON.stringify(response)}.`,
    );
}

assert.deepEqual(normalizeBudgetCollection(null), [], 'Una respuesta vacía debe producir una lista segura.');

console.log('smoke-classic-proyectos-budget-bootstrap: ok');
