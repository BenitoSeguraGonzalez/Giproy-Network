import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const engineSource = readFileSync(new URL('../src/utils/classicPrintEngine.js', import.meta.url), 'utf8');
const edoCardStart = engineSource.indexOf("if (!isEdt) {");
const edoCardEnd = engineSource.indexOf("canvas.rect(x + 12, y + 11", edoCardStart);

assert.notEqual(edoCardStart, -1, 'La lamina grafica EDO debe tener rama propia de tarjeta.');
assert.notEqual(edoCardEnd, -1, 'La rama EDO debe terminar antes de la maqueta EDT con icono.');

const edoCardSource = engineSource.slice(edoCardStart, edoCardEnd);

assert.match(
    engineSource,
    /const cardFill = isEdt \? '#F7F7F5' : '#FFFFFF'/,
    'La ficha EDO debe conservar fondo principal blanco puro.',
);

assert.match(
    edoCardSource,
    /`EDO: \$\{code\}`\.toUpperCase\(\)/,
    'La tarjeta EDO debe mostrar el identificador exacto EDO: codigo como texto acentuado.',
);

assert.match(
    edoCardSource,
    /String\(title\)\.toUpperCase\(\)/,
    'La descripcion EDO debe vivir como titulo fuerte independiente del badge.',
);

assert.match(
    edoCardSource,
    /const roleLine = person\.role \|\| 'Sin función definida'/,
    'La tarjeta EDO debe mostrar el rol del stakeholder.',
);

assert.match(
    edoCardSource,
    /const personLine = person\.name \|\| '-'/,
    'La tarjeta EDO debe mostrar el stakeholder asignado o un guion compacto.',
);

assert.match(
    edoCardSource,
    /const edoTitleSize = clamp\(width \* 0\.064, 9\.2, 12\)/,
    'La tarjeta EDO de organigrama debe mantener titulo compacto y no escala de ficha gigante.',
);

assert.match(
    edoCardSource,
    /let labelSize = clamp\(width \* 0\.039, 6\.8, 7\.6\)/,
    'Las etiquetas desde ROL hacia abajo deben tener lectura suficiente dentro del card.',
);

assert.match(
    edoCardSource,
    /let valueSize = clamp\(width \* 0\.052, 8\.6, 10\.2\)/,
    'Los valores desde ROL hacia abajo deben tener mayor presencia sin salir del card.',
);

assert.match(
    edoCardSource,
    /const valueColor = '#136191'/,
    'Los datos de rol y asignado deben usar azul oscuro corporativo.',
);

assert.match(
    engineSource,
    /: clamp\(\(area\.width \/ totalLeaves\) \* 0\.82, 124, 176\)/,
    'La lamina EDO debe limitar el ancho de tarjeta a escala de organigrama.',
);

assert.match(
    engineSource,
    /: clamp\(\(area\.height \/ \(maxDepth \+ 1\)\) \* 0\.62, 94, 118\)/,
    'La lamina EDO debe mantener la altura original compacta sin agrandar la tarjeta.',
);

[
    'const solidSeparatorY',
    'const roleLabelY',
    'const dottedSeparatorY',
    'const assignedLabelY',
    'const assignedValueY',
    'const roleLayoutLines = wrapText(roleLine, lineMaxWidth, valueSize, true, 2)',
    'const assignedLayoutLines',
    'const solidSeparatorY = titleBottomY + 3',
    'const roleLabelY = solidSeparatorY + 10',
    'while (infoLayout.bottomOverflow > 0 && valueSize > 8)',
].forEach((token) => {
    assert.equal(
        edoCardSource.includes(token),
        true,
        `La tarjeta EDO debe usar una reticula interna compacta para evitar desbordes: ${token}`,
    );
});

assert.doesNotMatch(
    edoCardSource,
    /let cursorY|cursorY \+=|0\.7, 128, 146/,
    'La tarjeta EDO no debe agrandarse ni depender de flujo vertical acumulativo que pueda expulsar ASIGNADO.',
);

['EDO:', 'ROL', 'ASIGNADO', '#E5E7EB', '#111827', '#6B7280', '#D97706', 'drawDottedSeparator'].forEach((token) => {
    assert.equal(
        edoCardSource.includes(token),
        true,
        `La tarjeta EDO debe reproducir la ficha documental corporativa: ${token}`,
    );
});

assert.doesNotMatch(
    edoCardSource,
    /#FFF4E3|#EDF2F7|badgeWidth|capsula|chipFill|canvas\.rect\(lineX, cursorY - 8|width \* 0\.14|24, 42/,
    'La tarjeta EDO no debe usar badges, chips ni capsulas internas.',
);

assert.doesNotMatch(
    edoCardSource,
    /roleLine,[\s\S]{0,160}maxWidth|personLine,[\s\S]{0,160}maxWidth/,
    'La funcion y el stakeholder no deben truncarse con maxWidth; deben envolverse como texto completo.',
);

assert.doesNotMatch(
    edoCardSource,
    /actividades_claves|responsabilidades|edoDetail|HITO|FUNCION|STAKE|canvas\.line\(x \+ 22/,
    'La tarjeta EDO de lamina no debe imprimir actividades, chip HITO ni icono superior heredado.',
);

console.log('smoke-classic-edo-graphic-print-card: ok');
