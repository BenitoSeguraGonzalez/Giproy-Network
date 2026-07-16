import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');
const proyectosSource = readSource('../src/pages/Proyectos.jsx');
const edtSource = readSource('../src/components/projects/Edt.jsx');
const presupuestoSource = readSource('../src/components/presupuestos/PresupuestoDetail.jsx');
const lineasSource = readSource('../src/components/presupuestos/LineasPresupuestoTab.jsx');
const apusSource = readSource('../src/pages/APUs.jsx');

assert.match(
    proyectosSource,
    /setBimNavigationContext\(\{[\s\S]*targetType,[\s\S]*targetId:\s*Number\(link\?\.target_id\)/,
    'Proyectos debe conservar el destino BIM seleccionado sin persistirlo en modulos clasicos',
);
assert.match(
    proyectosSource,
    /<Edt[\s\S]*initialFocusNodeId=\{bimNavigationContext\?\.targetType\s*===\s*['"]edt['"]/,
    'El destino EDT debe viajar por el prop de foco existente',
);
assert.match(
    edtSource,
    /initialFocusNodeId[\s\S]*setActiveNodeId\(initialFocusNodeId\)[\s\S]*setSelectedIds\(new Set\(\[initialFocusNodeId\]\)\)[\s\S]*scrollIntoView/,
    'EDT debe seleccionar, expandir y desplazar el nodo recibido',
);
assert.match(
    proyectosSource,
    /<PresupuestoDetail[\s\S]*initialFocusLineId=\{bimNavigationContext\?\.targetType\s*===\s*['"]presupuesto['"]/,
    'La linea de Presupuesto debe viajar por el prop de foco existente',
);
assert.match(
    presupuestoSource,
    /initialFocusLineId[\s\S]*setSelectedLineId\(initialFocusLineId\)/,
    'Presupuesto debe seleccionar la linea recibida',
);
assert.match(
    lineasSource,
    /selectedLineId[\s\S]*scrollLineIntoView\(selectedLineId,\s*['"]smooth['"]\)/,
    'El grid de Presupuesto debe desplazar la linea seleccionada al viewport',
);
assert.match(
    proyectosSource,
    /PROJECT_APU_EDITOR_QUERY[\s\S]*apu_id:[\s\S]*project_id:[\s\S]*return_tab:\s*['"]bim['"]/,
    'La ida a APU debe incluir el retorno BIM contextual',
);
assert.match(
    apusSource,
    /cameFromProjectModule[\s\S]*handleReturnToProjectModule[\s\S]*project_id:[\s\S]*tab:\s*returnTab[\s\S]*navigate\(targetPath\)/,
    'APUs debe conservar su retorno seguro al proyecto y pestaña BIM',
);

console.log('smoke-bim-classic-navigation-gate: ok');
