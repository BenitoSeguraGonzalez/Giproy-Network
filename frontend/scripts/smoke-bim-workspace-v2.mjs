import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    isMinimumDesktopDisplaySupported,
    readPhysicalDisplayResolution,
} from '../src/utils/displayResolution.js';
import { getErrorMessage } from '../src/utils/errorMessage.js';

const workspaceSource = readFileSync(new URL('../src/components/bim/BimWorkspace.jsx', import.meta.url), 'utf8');
const shellSource = readFileSync(new URL('../src/components/bim/BimWorkspaceV2.jsx', import.meta.url), 'utf8');
const appLayoutSource = readFileSync(new URL('../src/layouts/AppLayout.jsx', import.meta.url), 'utf8');

assert.match(workspaceSource, /return\s*\([\s\S]*<BimWorkspaceV2/, 'V2 debe ser el unico retorno del workspace BIM');
assert.doesNotMatch(workspaceSource, /VITE_BIM_WORKSPACE_V2|BIM_WORKSPACE_V2_ENABLED|BimShellContextBar|Herramientas de carga BIM/, 'No debe sobrevivir una rama de workspace legado');
for (const label of ['Visor', 'Coordinación', 'Planificación 4D', 'Producción', 'Campo', 'Entrega', 'Informes']) {
    assert.ok(shellSource.includes(`label: '${label}'`), `Debe existir el workspace ${label}`);
}
assert.match(shellSource, /isMinimumDesktopDisplaySupported/, 'Debe mantenerse la guarda de resolución física');
assert.match(shellSource, /getErrorMessage/, 'El workspace no debe renderizar objetos Error directamente');
assert.match(appLayoutSource, /readPhysicalDisplayResolution/, 'El layout general debe medir la resolución física');
assert.doesNotMatch(appLayoutSource, /readBrowserWindowSize|window\.outerWidth/, 'El aviso general no debe depender del tamaño de la ventana');
assert.match(shellSource, /selectedTool\?\.content\s*\|\|\s*inspector/, 'Solo debe montarse la herramienta contextual seleccionada');
assert.match(shellSource, /data-bim-bottom-drawer[\s\S]*selectedBottomTool\?\.content/, 'Planificación debe usar un drawer inferior único');
assert.match(shellSource, /BIM_V2_PREFERENCES_KEY[\s\S]*leftWidth[\s\S]*rightWidth[\s\S]*bottomHeight/, 'El layout debe persistirse por proyecto');
assert.match(shellSource, /event\.key\.toLowerCase\(\)\s*===\s*['"]k['"][\s\S]*event\.altKey/, 'Búsqueda y workspaces deben ser accesibles por teclado');

const browserAt = ({ screenWidth, screenHeight, pixelRatio = 1, innerWidth = screenWidth, innerHeight = screenHeight }) => ({
    devicePixelRatio: pixelRatio,
    innerWidth,
    innerHeight,
    outerWidth: innerWidth,
    outerHeight: innerHeight,
    screen: {
        width: screenWidth,
        height: screenHeight,
        availWidth: screenWidth,
        availHeight: screenHeight,
    },
});

assert.equal(isMinimumDesktopDisplaySupported(browserAt({ screenWidth: 1920, screenHeight: 1080 })), true);
assert.equal(isMinimumDesktopDisplaySupported(browserAt({ screenWidth: 1536, screenHeight: 864, pixelRatio: 1.25 })), true);
assert.equal(isMinimumDesktopDisplaySupported(browserAt({
    screenWidth: 2560,
    screenHeight: 1440,
    innerWidth: 1600,
    innerHeight: 836,
})), true);
assert.equal(isMinimumDesktopDisplaySupported(browserAt({ screenWidth: 1600, screenHeight: 900 })), false);
assert.deepEqual(
    readPhysicalDisplayResolution(browserAt({ screenWidth: 2048, screenHeight: 1152, pixelRatio: 1.25 })),
    { width: 2560, height: 1440 },
);
assert.equal(getErrorMessage(new Error('Fallo de carga')), 'Fallo de carga');
assert.equal(getErrorMessage({ response: { data: { detail: 'Proyecto BIM no disponible' } } }), 'Proyecto BIM no disponible');
assert.equal(getErrorMessage({ response: { data: { detail: [{ msg: 'Campo requerido' }] } } }), 'Campo requerido');
assert.equal(getErrorMessage({ unexpected: true }, 'Error BIM'), 'Error BIM');

console.log('smoke-bim-workspace-v2: ok');
