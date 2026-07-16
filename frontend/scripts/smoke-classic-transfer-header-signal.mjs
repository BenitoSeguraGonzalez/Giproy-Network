import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appLayoutSource = readFileSync(new URL('../src/layouts/AppLayout.jsx', import.meta.url), 'utf8');
const transferApiSource = readFileSync(new URL('../src/api/transferencias.js', import.meta.url), 'utf8');

assert.match(
    transferApiSource,
    /api\.get\('\/transferencias\/tray-summary'/,
    'transferenciasApi debe consumir /transferencias/tray-summary desde frontend/src/api',
);

assert.equal(
    appLayoutSource.includes("from '../api/axiosConfig'"),
    false,
    'AppLayout no debe importar axiosConfig directamente',
);

assert.equal(
    appLayoutSource.includes('../utils/portableWorkspace'),
    false,
    'AppLayout no debe depender del override manual de modo portatil',
);

assert.equal(
    appLayoutSource.includes('Portátil') || appLayoutSource.includes('Portatil'),
    false,
    'El header no debe mostrar la accion Portatil',
);

assert.equal(
    appLayoutSource.includes('writePortableWorkspaceOverride'),
    false,
    'El header no debe poder activar modo portatil manual',
);

assert.match(
    appLayoutSource,
    /import transferenciasApi from '\.\.\/api\/transferencias'/,
    'AppLayout debe usar el cliente de dominio transferenciasApi',
);

assert.match(
    appLayoutSource,
    /const canSeeTransferSignal = \['superadministrador', 'administrador'\]\.includes\(roleKey\)/,
    'El semaforo debe estar restringido a administrador y superadministrador',
);

assert.match(
    appLayoutSource,
    /window\.setInterval\(loadTransferSignal, 30000\)/,
    'El semaforo debe refrescar con polling ligero de 30 segundos',
);

assert.match(
    appLayoutSource,
    /const hasNewTransferSignal = transferSignal\.nuevos > 0/,
    'El indicador debe derivar un estado explicito cuando hay comunicaciones nuevas',
);

assert.match(
    appLayoutSource,
    /hasNewTransferSignal[\s\S]*ring-2 ring-emerald-300\/70 animate-pulse/,
    'El icono de comunicacion debe brillar cuando hay comunicaciones nuevas',
);

assert.match(
    appLayoutSource,
    /hasNewTransferSignal[\s\S]*transferSignal\.nuevos/,
    'El indicador compacto debe mostrar un badge con el numero de nuevos',
);

assert.match(
    appLayoutSource,
    /title=\{`Nuevos envios pendientes: \$\{transferSignal\.nuevos\}`\}/,
    'El tooltip del indicador compacto debe enfocarse solo en nuevos pendientes',
);

assert.match(
    appLayoutSource,
    /window\.dispatchEvent\(new CustomEvent\('giproy:transfer-signal-opened'\)\)/,
    'El indicador debe emitir evento local para refrescar la bandeja si ya esta abierta',
);

assert.match(
    appLayoutSource,
    /data-testid="transfer-header-signal"/,
    'El header debe exponer el indicador de transferencias',
);

assert.match(
    appLayoutSource,
    /navigate\('\/servicios\/envios-transferencias\?bandeja=entrada'\)/,
    'El click del semaforo debe navegar a la bandeja de entrada preparada',
);

assert.doesNotMatch(
    appLayoutSource,
    /Comunicación: \{transferSignal\.total\}/,
    'El header no debe volver a mostrar el texto redundante Comunicación',
);

assert.doesNotMatch(
    appLayoutSource,
    /Nuevos: \{transferSignal\.nuevos\}/,
    'El header no debe volver a mostrar el texto redundante Nuevos',
);

console.log('smoke-classic-transfer-header-signal: ok');
