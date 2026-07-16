import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { IfcImporter } from '@thatopen/fragments';

import { BIM_FRAGMENTS_SMOKE_IFC } from '../src/components/bim/bimFragmentsSmokeIfc.js';
import { buildBimFragmentsVolumeIfc } from '../src/components/bim/bimFragmentsVolumeIfc.js';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const webIfcDir = path.join(rootDir, 'node_modules', 'web-ifc');
const outDir = path.join(rootDir, 'tmp', 'bim-fragments-smoke');
const outFile = path.join(outDir, 'volume-smoke.frag');
const wallCount = 25;

const importer = new IfcImporter();
importer.wasm = {
    path: `${webIfcDir}${path.sep}`,
    absolute: true,
};
importer.includeUniqueAttributes = true;
importer.includeRelationNames = true;

const encodeIfc = (ifcText) => new TextEncoder().encode(ifcText);
const baseBytes = await importer.process({
    bytes: encodeIfc(BIM_FRAGMENTS_SMOKE_IFC),
    raw: false,
});
const volumeIfc = buildBimFragmentsVolumeIfc({ wallCount });
const volumeBytes = await importer.process({
    bytes: encodeIfc(volumeIfc),
    raw: false,
});

await mkdir(outDir, { recursive: true });
await writeFile(outFile, volumeBytes);

assert.equal((volumeIfc.match(/IFCWALL\(/g) || []).length, wallCount, 'La simulacion debe generar el volumen de muros esperado');
assert.ok(volumeBytes instanceof Uint8Array, 'IfcImporter debe devolver bytes binarios Uint8Array');
assert.ok(volumeBytes.byteLength > baseBytes.byteLength, 'El fragments de volumen debe superar el fixture base');

console.log(`smoke-bim-fragments-volume: ok ${wallCount} walls ${volumeBytes.byteLength} bytes`);
