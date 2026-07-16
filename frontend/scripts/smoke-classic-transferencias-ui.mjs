import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const pageSource = read('frontend/src/pages/EnviosTransferencias.jsx');
const routerSource = read('frontend/src/routes/AppRouter.jsx');
const placeholdersSource = read('frontend/src/pages/Placeholders.jsx');
const layoutSource = read('frontend/src/layouts/AppLayout.jsx');
const apiSource = read('frontend/src/api/transferencias.js');

assert.match(
    routerSource,
    /const EnviosTransferencias = lazyWithChunkRecovery\(\(\) => import\('\.\.\/pages\/EnviosTransferencias'\)\)/,
    'La pagina de transferencias debe cargarse como ruta lazy clasica',
);

assert.match(
    routerSource,
    /<Route path="\/servicios\/envios-transferencias" element=\{withProtectedLayout\(<EnviosTransferencias \/>\)\} \/>/,
    'Debe existir la ruta clasica /servicios/envios-transferencias',
);

assert.match(
    placeholdersSource,
    /path: '\/servicios\/envios-transferencias'/,
    'La card de Otros Servicios debe abrir la bandeja real de transferencias',
);

assert.match(
    layoutSource,
    /navigate\('\/servicios\/envios-transferencias\?bandeja=entrada'\)/,
    'El semaforo del header debe abrir la bandeja de entrada real',
);

for (const requiredToken of [
    'transferenciasApi.getTray',
    'transferenciasApi.preflight',
    'transferenciasApi.createShipment',
    'transferenciasApi.resolveRecipientCode',
    'transferenciasApi.createRecipient',
    'transferenciasApi.importShipment',
    'transferenciasApi.rejectShipment',
    'transferenciasApi.cancelShipment',
    'transferenciasApi.revalidateMarketplaceRequirements',
    'useContext(AuthContext)',
    'selectedEmpresaId',
    'empresaId={selectedEmpresaId}',
    'SearchableSelect',
    'AnimatedDateInput',
    'ProjectSegmentedSwitch',
    'ProjectHeaderActionButton',
    'ClearSearchField',
    'LiquidButton',
    'TransferSignalButton',
    'RecipientManagementModal',
    'RejectShipmentModal',
    'CancelShipmentModal',
    'ShipmentTimelineModal',
    'timelineTypeLabels',
    'getTimelineLabel(event)',
    'getTimelineTypeLabel(event)',
    'marketplace_confirmed',
    'Nuevo envio',
    'Empresas para comunicarse',
    'Codigo de conexion',
    'Confirmar empresa',
    'Empresas fijas incluidas',
    'Empresas adicionales Conecta',
    'additional_available',
    'fixed_available',
    'Refrescar',
    'Validación',
    'Revalidar compras',
    'variant="compact"',
    'TRANSFER_MICRO_BUTTON_CLASS',
    'title="Historial"',
    'title="Cancelar envio"',
    'setTimelineShipment(item)',
    'setCancelShipment(item)',
    'items-center justify-between',
    '[&>span:first-child]:truncate',
    "window.setInterval(loadTray, 30000)",
    "giproy:transfer-signal-opened",
    "setDirection('entrada')",
]) {
    assert.ok(pageSource.includes(requiredToken), `Falta token funcional esperado: ${requiredToken}`);
}

assert.doesNotMatch(pageSource, /axiosConfig/, 'La pagina no debe importar axiosConfig directamente');
assert.doesNotMatch(pageSource, /console\.log/, 'La pagina no debe tener console.log productivo');
assert.doesNotMatch(pageSource, /<select\b/, 'La pagina no debe usar select nativo');
assert.doesNotMatch(pageSource, /window\.prompt/, 'La pagina no debe usar window.prompt');
assert.doesNotMatch(pageSource, /<input\s+type="date"/, 'La pagina debe usar AnimatedDateInput para fechas visibles');

assert.match(apiSource, /import api from '\.\/axiosConfig';/, 'El cliente API de dominio debe concentrar axiosConfig');
assert.match(apiSource, /withTenantConfig/, 'El cliente API debe soportar empresa operativa explicita');
assert.match(apiSource, /withTenantParams/, 'El cliente API debe inyectar empresa operativa en params');
assert.match(apiSource, /getTray: async \(params = \{\}, empresaId = null\)/, 'La bandeja debe aceptar empresa operativa explicita');
assert.match(apiSource, /createShipment: async \(payload = \{\}, empresaId = null\)/, 'La creacion de envio debe aceptar empresa operativa explicita');
assert.match(apiSource, /rejectShipment: async \(shipmentId, reason, empresaId = null\)/, 'El rechazo debe aceptar empresa operativa explicita');
assert.match(apiSource, /cancelShipment: async \(shipmentId, reason = null, empresaId = null\)/, 'La cancelacion debe aceptar empresa operativa explicita');
assert.match(apiSource, /importShipment: async \(shipmentId, empresaId = null\)/, 'La importacion debe aceptar empresa operativa explicita');
assert.match(apiSource, /getTray: async/, 'El cliente API debe exponer bandeja');
assert.match(apiSource, /createShipment: async/, 'El cliente API debe exponer creacion de envios');
assert.match(apiSource, /resolveRecipientCode: async/, 'El cliente API debe exponer resolucion de codigo publico');
assert.match(apiSource, /createRecipient: async/, 'El cliente API debe exponer asociacion de destinatario');
assert.match(
    layoutSource,
    /transferenciasApi\.getTraySummary\(selectedEmpresa\?\.id \?\? null\)/,
    'El semaforo header debe usar la empresa operativa seleccionada',
);

assert.doesNotMatch(pageSource, /title="Abrir"/, 'La bandeja no debe exponer accion Abrir');
assert.doesNotMatch(pageSource, /openShipment/, 'La pagina no debe invocar apertura de envios');
assert.doesNotMatch(apiSource, /openShipment/, 'El cliente frontend no debe exponer apertura de envios');
assert.doesNotMatch(pageSource, />\{event\.type\}</, 'El historico no debe mostrar codigos tecnicos de evento');

console.log('smoke-classic-transferencias-ui: ok');
