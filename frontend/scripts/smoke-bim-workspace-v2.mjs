import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workspaceSource = readFileSync(new URL('../src/components/bim/BimWorkspace.jsx', import.meta.url), 'utf8');
const shellSource = readFileSync(new URL('../src/components/bim/BimWorkspaceV2.jsx', import.meta.url), 'utf8');

assert.match(workspaceSource, /return\s*\([\s\S]*<BimWorkspaceV2/, 'V2 debe ser el unico retorno del workspace BIM');
assert.doesNotMatch(workspaceSource, /VITE_BIM_WORKSPACE_V2|BIM_WORKSPACE_V2_ENABLED|BimShellContextBar|Herramientas de carga BIM/, 'No debe sobrevivir una rama de workspace legado');
for (const label of ['Visor', 'Coordinación', 'Planificación 4D', 'Producción', 'Campo', 'Informes']) {
    assert.ok(shellSource.includes(`label: '${label}'`), `Debe existir el workspace ${label}`);
}
assert.match(shellSource, /window\.screen\.width\s*>=\s*1920[\s\S]*window\.screen\.height\s*>=\s*1080/, 'Debe mantenerse la guarda de resolución');
assert.match(shellSource, /selectedTool\?\.content\s*\|\|\s*inspector/, 'Solo debe montarse la herramienta contextual seleccionada');
assert.match(shellSource, /data-bim-bottom-drawer[\s\S]*selectedBottomTool\?\.content/, 'Planificación debe usar un drawer inferior único');
assert.match(shellSource, /BIM_V2_PREFERENCES_KEY[\s\S]*leftWidth[\s\S]*rightWidth[\s\S]*bottomHeight/, 'El layout debe persistirse por proyecto');
assert.match(shellSource, /event\.key\.toLowerCase\(\)\s*===\s*['"]k['"][\s\S]*event\.altKey/, 'Búsqueda y workspaces deben ser accesibles por teclado');

console.log('smoke-bim-workspace-v2: ok');
