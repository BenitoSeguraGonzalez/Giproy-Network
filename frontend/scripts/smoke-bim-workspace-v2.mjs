import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    isMinimumDesktopDisplaySupported,
    readPhysicalDisplayResolution,
} from '../src/utils/displayResolution.js';
import { getErrorMessage } from '../src/utils/errorMessage.js';

const workspaceSource = readFileSync(new URL('../src/components/bim/BimWorkspace.jsx', import.meta.url), 'utf8');
const shellSource = readFileSync(new URL('../src/components/bim/BimWorkspaceV2.jsx', import.meta.url), 'utf8');
const coordinationSource = readFileSync(new URL('../src/components/bim/BimCoordinationControlPanel.jsx', import.meta.url), 'utf8');
const reportsSource = readFileSync(new URL('../src/components/bim/BimReportsPanel.jsx', import.meta.url), 'utf8');
const appLayoutSource = readFileSync(new URL('../src/layouts/AppLayout.jsx', import.meta.url), 'utf8');
const modelsApiSource = readFileSync(new URL('../src/api/bimModels.js', import.meta.url), 'utf8');

assert.match(workspaceSource, /return\s*\([\s\S]*<BimWorkspaceV2/, 'V2 debe ser el unico retorno del workspace BIM');
assert.match(workspaceSource, /hasProjectCapability\('bim\.admin'\)/, 'La administración BIM debe derivarse de la capacidad efectiva del proyecto');
assert.match(workspaceSource, /canAdminister=\{canAdministerBim\}/, 'La administracion BIM visible debe usar la politica empresarial canonica');
assert.match(workspaceSource, /projectCapabilities\?\.has\(capability\)\s*===\s*true/, 'Las acciones privilegiadas deben fallar cerradas mientras se cargan capacidades');
assert.doesNotMatch(workspaceSource, /!projectCapabilities\s*\|\|\s*projectCapabilities\.has/, 'No debe existir fallback permisivo durante la carga de capacidades');
assert.match(shellSource, /canAdminister\s*&&\s*!ready/, 'La configuración BIM sólo debe estar disponible para administradores cuando el proyecto aún no tiene modelo');
assert.match(shellSource, /Configurar BIM/, 'La acción de configuración BIM debe seguir visible en el flujo inicial');
assert.match(shellSource, /Administrar BIM/, 'La administración debe seguir accesible bajo divulgación progresiva cuando existe modelo');
assert.match(shellSource, /useState\(initial\.sidePanel\s*\|\|\s*["']none["']\)/, 'El workspace debe iniciar sin panel lateral compitiendo con el visor');
assert.match(shellSource, /initial\.bottomCollapsed\s*!==\s*false/, 'La secuencia 4D debe iniciar recogida');
assert.match(shellSource, /explorerShown\s*=\s*ready[\s\S]*contextShown\s*=\s*ready/, 'El estado sin modelo no debe competir con paneles BIM vacios');
assert.doesNotMatch(workspaceSource, /VITE_BIM_WORKSPACE_V2|BIM_WORKSPACE_V2_ENABLED|BimShellContextBar|Herramientas de carga BIM/, 'No debe sobrevivir una rama de workspace legado');
for (const label of ['Planificación y costes', 'Modelo', 'Coordinación', 'Seguimiento', 'Entrega']) {
    assert.ok(
        shellSource.includes(`label: "${label}"`) || shellSource.includes(`label: '${label}'`),
        `Debe existir el workspace ${label}`,
    );
}
assert.match(shellSource, /isMinimumDesktopDisplaySupported/, 'Debe mantenerse la guarda de resolución física');
assert.match(shellSource, /getErrorMessage/, 'El workspace no debe renderizar objetos Error directamente');
assert.match(appLayoutSource, /readPhysicalDisplayResolution/, 'El layout general debe medir la resolución física');
assert.doesNotMatch(appLayoutSource, /readBrowserWindowSize|window\.outerWidth/, 'El aviso general no debe depender del tamaño de la ventana');
assert.match(shellSource, /selectedTool\?\.content\s*\|\|\s*inspector/, 'Solo debe montarse la herramienta contextual seleccionada');
assert.match(shellSource, /data-bim-bottom-drawer[\s\S]*selectedBottom\.content/, 'Planificación debe usar un drawer inferior único');
assert.match(shellSource, /PREFERENCES_KEY[\s\S]*sidePanel[\s\S]*bottomHeight/, 'El layout debe persistirse por proyecto');
assert.match(shellSource, /event\.key\.toLowerCase\(\)\s*===\s*['"]k['"][\s\S]*event\.altKey/, 'Búsqueda y workspaces deben ser accesibles por teclado');
assert.match(modelsApiSource, /projects\/\$\{projectId\}\/search/, 'La búsqueda unificada debe resolverse en backend');
assert.match(workspaceSource, /searchProjectContext[\s\S]*resolveElementByGuid[\s\S]*presupuesto_detalle/, 'Los resultados autorizados deben restaurar contexto profundo por dominio');
assert.match(workspaceSource, /updateWorkspaceContext[\s\S]*Keep local fallback as non-blocking backup/, 'El contexto profundo debe persistir en servidor con fallback local no bloqueante');
assert.match(coordinationSource, /budgetsApi\.getByProyecto[\s\S]*schedulesApi\.getTrabajo/, 'La referencia debe descubrir Presupuesto y Gantt reales');
assert.match(coordinationSource, /api\.makeCoordinationSetOfficial[\s\S]*Motivo de aprobación/, 'La oficialización debe ser explícita y motivada');
assert.match(coordinationSource, /list4dBaselines/, 'El control debe cargar las baselines 4D del proyecto');
assert.match(coordinationSource, /baseline_id:\s*selectedBaselineId\s*\?\s*Number\(selectedBaselineId\)/, 'El conjunto debe fijar la baseline elegida');
assert.match(coordinationSource, /Borrador Gantt vigente \(no baseline\)/, 'La UI debe distinguir el borrador Gantt de una baseline fijada');
for (const action of ['Aprobar', 'Aplicar', 'Recuperar']) {
    assert.ok(coordinationSource.includes(action), `La bandeja coordinada debe ofrecer ${action}`);
}
assert.match(coordinationSource, /overallocated_count\s*>\s*0/, 'La UI debe bloquear oficialización con cobertura superior al 100%');
assert.match(workspaceSource, /selectedActivity=\{\(planningGantt\?\.activities[\s\S]*planningSelection\.primaryActivityId/, 'La actividad seleccionada debe llegar al control coordinado');
assert.match(coordinationSource, /data-coordination-shared-context/, 'Debe existir un contexto compartido 5D, 4D y BIM');
assert.match(coordinationSource, /api\.reconcileCoordinationLinkIdentity[\s\S]*Reconciliar vínculo/, 'Las referencias históricas deben poder reconciliarse desde la selección canónica');
assert.match(coordinationSource, /api\.createCoordinationLink[\s\S]*budget_line_id[\s\S]*activity_snapshot_id[\s\S]*bim_element_id/, 'La acción contextual debe crear un vínculo tridominio cuando la actividad conserva partida');
assert.match(coordinationSource, /seguirá incompleto en 5D/, 'Una actividad sin partida debe advertir la ruptura estructural');
assert.match(reportsSource, /PRELIMINAR|Salida preliminar/, 'Los informes de trabajo deben mostrar su falta de validez contractual');
assert.match(reportsSource, /disabled=\{!officialReference\}/, 'La salida oficial debe bloquearse sin referencia coordinada aprobada');
assert.match(reportsSource, /official:\s*outputMode\s*===\s*'official'/, 'La intención oficial debe llegar explícitamente al backend');

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
