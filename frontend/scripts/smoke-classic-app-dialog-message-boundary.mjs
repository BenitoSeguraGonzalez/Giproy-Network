import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const providerSource = readFileSync(
    new URL('../src/components/ui/AppDialogProvider.jsx', import.meta.url),
    'utf8',
);

assert.match(
    providerSource,
    /const normalizeDialogMessage = \(dialog\) => \{/,
    'AppDialogProvider debe centralizar la normalizacion de mensajes',
);

for (const token of [
    'dialog.message ?? dialog.detail ?? dialog.description ?? dialog.error',
    'rawMessage instanceof Error',
    'Array.isArray(rawMessage)',
    'rawMessage.message',
    'rawMessage.detail',
    'rawMessage.msg',
]) {
    assert.equal(
        providerSource.includes(token),
        true,
        `AppDialogProvider debe conservar soporte para mensajes no estandar: ${token}`,
    );
}

assert.match(
    providerSource,
    /message:\s*normalizedMessage\s*\|\|\s*'Se produjo un evento del sistema sin detalle adicional disponible\.'/,
    'El fallback generico debe quedar solo despues de agotar fuentes de mensaje',
);

console.log('smoke-classic-app-dialog-message-boundary: ok');
