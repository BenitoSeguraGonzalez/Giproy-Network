import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { IfcImporter } from '@thatopen/fragments';

const [, , sourcePath, webIfcDir] = process.argv;
assert.ok(sourcePath && webIfcDir, 'Se requieren fuente IFC y directorio WASM');
const sourceBytes = new Uint8Array(await readFile(sourcePath));
const importer = new IfcImporter();
importer.wasm = { path: `${webIfcDir}${path.sep}`, absolute: true };
importer.includeUniqueAttributes = true;
const fragments = await importer.process({ bytes: sourceBytes, raw: false });
console.log(JSON.stringify({ source_bytes: sourceBytes.byteLength, fragment_bytes: fragments.byteLength }));
