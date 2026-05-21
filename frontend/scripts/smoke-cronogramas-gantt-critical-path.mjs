import assert from 'node:assert/strict';
import {
    resolveBackendCriticalPathMembership,
    resolveCriticalEdgeKeys,
} from '../src/components/projects/cronogramasGanttCriticalPath.js';

const nodes = new Map([
    ['3', { id: '3', es: 0, totalSlack: 0 }],
    ['4', { id: '4', es: 2, totalSlack: 0 }],
    ['5', { id: '5', es: 7, totalSlack: 0 }],
    ['6', { id: '6', es: 7, totalSlack: 2 }],
]);

const outgoing = new Map([
    ['3', [
        { sourceId: '3', targetId: '4', dependency: { type: 'FS' } },
        { sourceId: '3', targetId: '6', dependency: { type: 'FS' } },
    ]],
    ['4', [
        { sourceId: '4', targetId: '5', dependency: { type: 'FS' } },
    ]],
    ['5', []],
    ['6', []],
]);

const constraints = new Map([
    ['3-4', 2],
    ['3-6', 1],
    ['4-5', 7],
]);

const { criticalOutgoingByNode, criticalIncomingByNode } = resolveCriticalEdgeKeys({
    nodes,
    outgoing,
    targetStartConstraint: (source, target) => constraints.get(`${source.id}-${target.id}`),
});

assert.deepEqual(
    criticalOutgoingByNode.get('3'),
    ['3-4'],
    'Solo el arco que realmente ata a otra tarea crítica debe quedar marcado como saliente crítico',
);
assert.deepEqual(
    criticalIncomingByNode.get('4'),
    ['3-4'],
    'La tarea destino debe registrar el arco crítico entrante correcto',
);
assert.deepEqual(
    criticalOutgoingByNode.get('4'),
    ['4-5'],
    'La cadena crítica debe seguir marcando el siguiente arco vinculante',
);
assert.deepEqual(
    criticalIncomingByNode.get('5'),
    ['4-5'],
    'El último nodo crítico debe recibir su arco crítico entrante',
);
assert.deepEqual(
    criticalOutgoingByNode.get('3')?.includes('3-6'),
    false,
    'Un arco hacia una tarea no crítica no debe pintarse como crítico',
);

const backendMembership = resolveBackendCriticalPathMembership({
    cpm_network: {
        critical_paths: [
            ['49', '271', '63'],
            ['10', '11'],
        ],
    },
}, '271');

assert.deepEqual(
    backendMembership.criticalIncomingKeys,
    ['49-271'],
    'La pertenencia backend debe reconstruir el arco crítico entrante desde cpm_network.critical_paths',
);
assert.deepEqual(
    backendMembership.criticalOutgoingKeys,
    ['271-63'],
    'La pertenencia backend debe reconstruir el arco crítico saliente desde cpm_network.critical_paths',
);
assert.deepEqual(
    backendMembership.criticalPathIndexes,
    [1],
    'La pertenencia backend debe conservar el índice de ruta crítica que contiene al nodo',
);
assert.equal(
    backendMembership.criticalPathCount,
    2,
    'La pertenencia backend debe conservar el número total de rutas críticas publicadas',
);

const backendTerminalMembership = resolveBackendCriticalPathMembership({
    cpm_network: {
        critical_paths: [['99']],
    },
}, '99');

assert.deepEqual(
    backendTerminalMembership.criticalIncomingKeys,
    [],
    'Un nodo crítico terminal sin arcos debe mantener entrantes vacíos',
);
assert.deepEqual(
    backendTerminalMembership.criticalOutgoingKeys,
    [],
    'Un nodo crítico terminal sin arcos debe mantener salientes vacíos',
);
assert.deepEqual(
    backendTerminalMembership.criticalPathIndexes,
    [1],
    'Un nodo crítico terminal debe seguir contando como miembro de ruta crítica',
);

console.log('smoke-cronogramas-gantt-critical-path: ok');
