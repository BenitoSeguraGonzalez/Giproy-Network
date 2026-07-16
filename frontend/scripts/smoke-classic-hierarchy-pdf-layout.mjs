import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/utils/classicPrintEngine.js', import.meta.url), 'utf8');

const cardStart = source.indexOf('const drawHierarchyCard =');
const cardEnd = source.indexOf('const splitHierarchyPrintPages', cardStart);
assert.notEqual(cardStart, -1, 'Debe existir un render comun de cards de jerarquia.');
assert.notEqual(cardEnd, -1, 'Debe poder aislarse el render comun de cards.');

const cardSource = source.slice(cardStart, cardEnd);

[
    "const isEdt = moduleType === 'edt'",
    "`${isEdt ? 'EDT' : 'EDO'} ${code}`.toUpperCase()",
    'resolveHierarchyCardBodyRows(node, { isEdt, currency, totalValorado })',
    'countDirectHierarchyChildren(node)',
    'countTotalHierarchyDescendants(node)',
    'canvas.rect(x, y, 5, height',
].forEach((token) => {
    assert.equal(cardSource.includes(token), true, `EDT/EDO deben compartir la familia visual profesional: ${token}`);
});

assert.doesNotMatch(
    cardSource,
    /ROL|ASIGNADO|Gerente de Proyecto|Sin función/,
    'La lamina grafica no debe volver al card EDT legacy con bloques ROL/ASIGNADO.',
);

[
    'splitHierarchyPrintPagesReadable',
    'splitHierarchyNodeIntoReadablePages',
    'splitPagesBySiblingCapacity',
    'hasHierarchyCardCollisions',
    'HIERARCHY_CARD_MIN_GAP',
    'countMaxHierarchySiblings',
    'shouldForceReadablePagination',
    'targetCardWidth = isEdt ? 185 : 175',
    'siblingCapacity = Math.max(1, Math.floor((estArea.width + HIERARCHY_CARD_MIN_GAP) / (minReadableCardWidth + HIERARCHY_CARD_MIN_GAP)))',
    'noOverlapCardHeight = (area.height / (maxDepth + 1)) * 0.82',
    'Math.min(horizontalUnit * 0.86, availableCardWidth)',
    'Math.min(isEdt ? 100 : 96, noOverlapCardHeight)',
    'isEdt ? 140 : 132',
].forEach((token) => {
    assert.equal(source.includes(token), true, `El motor PDF debe conservar calculo legible/no solapado: ${token}`);
});

assert.doesNotMatch(
    source,
    /window\.print\(|getBoundingClientRect\(|foreignObject|XMLSerializer/,
    'Las laminas graficas deben seguir sin depender de captura DOM ni impresion nativa.',
);

console.log('smoke-classic-hierarchy-pdf-layout: ok');
