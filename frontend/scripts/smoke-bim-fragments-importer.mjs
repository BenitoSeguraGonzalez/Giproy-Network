import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { IfcImporter } from '@thatopen/fragments';

import { BIM_FRAGMENTS_SMOKE_IFC } from '../src/components/bim/bimFragmentsSmokeIfc.js';

const rootDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const webIfcDir = path.join(rootDir, 'node_modules', 'web-ifc');
const outDir = path.join(rootDir, 'tmp', 'bim-fragments-smoke');
const outFile = path.join(outDir, 'synthetic-smoke.frag');

const importer = new IfcImporter();
importer.wasm = {
    path: `${webIfcDir}${path.sep}`,
    absolute: true,
};
importer.includeUniqueAttributes = true;
importer.includeRelationNames = true;

const fragmentsBytes = await importer.process({
    bytes: new TextEncoder().encode(BIM_FRAGMENTS_SMOKE_IFC),
    raw: false,
});

await mkdir(outDir, { recursive: true });
await writeFile(outFile, fragmentsBytes);

assert.ok(fragmentsBytes instanceof Uint8Array, 'IfcImporter debe devolver bytes binarios Uint8Array');
assert.ok(fragmentsBytes.byteLength > 0, 'El artefacto fragments no debe quedar vacio');

console.log(`smoke-bim-fragments-importer: ok ${fragmentsBytes.byteLength} bytes`);
