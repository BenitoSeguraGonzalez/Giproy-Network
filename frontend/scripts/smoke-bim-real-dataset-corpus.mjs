import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { IfcImporter } from '@thatopen/fragments';

const frontendDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const repositoryDir = path.resolve(frontendDir, '..');
const corpusDir = path.join(repositoryDir, 'backend', 'app', 'tests', 'fixtures', 'bim', 'real');
const manifestPath = path.join(corpusDir, 'manifest.json');
const webIfcDir = path.join(frontendDir, 'node_modules', 'web-ifc');

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
assert.equal(manifest.contract_version, 'giproy_bim_dataset_manifest_v1');

const importer = new IfcImporter();
importer.wasm = {
    path: `${webIfcDir}${path.sep}`,
    absolute: true,
};
importer.includeUniqueAttributes = true;
importer.includeRelationNames = true;

const results = [];
for (const dataset of manifest.datasets) {
    const sourcePath = path.resolve(corpusDir, dataset.relative_path);
    assert.ok(sourcePath.startsWith(`${corpusDir}${path.sep}`), `${dataset.id} debe permanecer dentro del corpus BIM`);
    const sourceBytes = await readFile(sourcePath);
    const sha256 = createHash('sha256').update(sourceBytes).digest('hex');
    assert.equal(sha256, dataset.expected.sha256, `${dataset.id} debe conservar su checksum`);

    const startedAt = performance.now();
    const fragmentBytes = await importer.process({ bytes: sourceBytes, raw: false });
    const durationMs = Math.round(performance.now() - startedAt);
    assert.ok(fragmentBytes instanceof Uint8Array, `${dataset.id} debe producir Uint8Array fragments`);
    assert.ok(fragmentBytes.byteLength > 0, `${dataset.id} debe producir fragments no vacio`);
    results.push({
        id: dataset.id,
        sourceBytes: sourceBytes.byteLength,
        fragmentBytes: fragmentBytes.byteLength,
        durationMs,
    });
}

assert.deepEqual(new Set(manifest.datasets.map((dataset) => dataset.scale)), new Set(['small', 'medium', 'large']));
assert.equal(results.length, manifest.datasets.length);

for (const result of results) {
    console.log(
        `bim-real-dataset ${result.id}: ${result.sourceBytes} source bytes -> ${result.fragmentBytes} fragment bytes in ${result.durationMs} ms`,
    );
}
console.log(`smoke-bim-real-dataset-corpus: ok ${results.length} datasets`);
