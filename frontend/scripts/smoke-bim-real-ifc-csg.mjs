import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as THREE from 'three';
import { Brush, Evaluator, INTERSECTION } from 'three-bvh-csg/src/index.js';
import { IfcAPI } from 'web-ifc';

const frontendDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const repositoryDir = path.resolve(frontendDir, '..');
const corpusDir = path.join(repositoryDir, 'backend', 'app', 'tests', 'fixtures', 'bim', 'real');
const manifest = JSON.parse(await readFile(path.join(corpusDir, 'manifest.json'), 'utf8'));
const dataset = manifest.datasets.find((item) => item.id === 'bsi-pcert-ifc4-architecture');
assert.ok(dataset, 'El corpus debe contener buildingSMART PCERT Architecture');
const sourcePath = path.resolve(corpusDir, dataset.relative_path);
const sourceBytes = new Uint8Array(await readFile(sourcePath));
assert.equal(createHash('sha256').update(sourceBytes).digest('hex'), dataset.expected.sha256);

const webIfcDir = path.join(frontendDir, 'node_modules', 'web-ifc');
const fragmentsChild = spawnSync(
    process.execPath,
    [path.join(frontendDir, 'scripts', 'smoke-bim-real-ifc-fragments-child.mjs'), sourcePath, webIfcDir],
    { cwd: frontendDir, encoding: 'utf8', windowsHide: true },
);
assert.equal(fragmentsChild.status, 0, fragmentsChild.stderr || fragmentsChild.stdout);
const fragmentsResult = JSON.parse(fragmentsChild.stdout.trim().split(/\r?\n/).at(-1));
assert.ok(fragmentsResult.fragment_bytes > 0, 'El IFC real debe convertirse a Fragments');

const volumeOf = (geometry) => {
    const position = geometry.getAttribute('position');
    const index = geometry.index;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    let signed = 0;
    const count = index?.count ?? position.count;
    for (let offset = 0; offset < count; offset += 3) {
        a.fromBufferAttribute(position, index ? index.getX(offset) : offset);
        b.fromBufferAttribute(position, index ? index.getX(offset + 1) : offset + 1);
        c.fromBufferAttribute(position, index ? index.getX(offset + 2) : offset + 2);
        signed += a.dot(b.clone().cross(c)) / 6;
    }
    return Math.abs(signed);
};

const buildGeometry = (vertices, indices, transform) => {
    const vertexCount = vertices.length / 6;
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    for (let index = 0; index < vertexCount; index += 1) {
        positions.set(vertices.subarray(index * 6, index * 6 + 3), index * 3);
        normals.set(vertices.subarray(index * 6 + 3, index * 6 + 6), index * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geometry.applyMatrix4(new THREE.Matrix4().fromArray(transform));
    geometry.clearGroups();
    return geometry;
};

const ifcApi = new IfcAPI();
ifcApi.SetWasmPath(`${webIfcDir}${path.sep}`, true);
await ifcApi.Init();
const modelId = ifcApi.OpenModel(sourceBytes);
const candidates = [];
ifcApi.StreamAllMeshes(modelId, (flatMesh) => {
    const line = ifcApi.GetLine(modelId, flatMesh.expressID);
    const globalId = line?.GlobalId?.value || line?.GlobalId || '';
    for (let index = 0; index < flatMesh.geometries.size(); index += 1) {
        const placed = flatMesh.geometries.get(index);
        const raw = ifcApi.GetGeometry(modelId, placed.geometryExpressID);
        const vertices = ifcApi.GetVertexArray(raw.GetVertexData(), raw.GetVertexDataSize()).slice();
        const indices = ifcApi.GetIndexArray(raw.GetIndexData(), raw.GetIndexDataSize()).slice();
        raw.delete();
        if (vertices.length >= 24 && indices.length >= 12) {
            const geometry = buildGeometry(vertices, indices, placed.flatTransformation);
            const volume = volumeOf(geometry);
            if (Number.isFinite(volume) && volume > 0.000001) {
                candidates.push({ expressId: flatMesh.expressID, globalId: String(globalId), geometry, volume });
            } else {
                geometry.dispose();
            }
        }
    }
});
ifcApi.CloseModel(modelId);

assert.ok(candidates.length > 0, 'El IFC real debe exponer al menos una malla cerrada con volumen');
candidates.sort((left, right) => right.volume - left.volume);
const evaluator = new Evaluator();
evaluator.attributes = ['position', 'normal'];
evaluator.useGroups = false;
let result = null;

for (const candidate of candidates) {
    try {
        candidate.geometry.computeBoundingBox();
        const box = candidate.geometry.boundingBox;
        const size = box.getSize(new THREE.Vector3());
        const axis = size.x >= size.y && size.x >= size.z ? 'x' : size.y >= size.z ? 'y' : 'z';
        const midpoint = (box.min[axis] + box.max[axis]) / 2;
        const margin = Math.max(size.x, size.y, size.z) * 0.2 + 0.01;
        const cutterSize = new THREE.Vector3(size.x + margin * 2, size.y + margin * 2, size.z + margin * 2);
        const makeSource = () => {
            const brush = new Brush(candidate.geometry.clone());
            brush.updateMatrixWorld(true);
            return brush;
        };
        const makeCutter = (side) => {
            const minimum = box.min[axis] - (side < 0 ? margin : 0);
            const maximum = box.max[axis] + (side > 0 ? margin : 0);
            const start = side < 0 ? minimum : midpoint;
            const finish = side < 0 ? midpoint : maximum;
            cutterSize[axis] = finish - start;
            const cutter = new Brush(new THREE.BoxGeometry(cutterSize.x, cutterSize.y, cutterSize.z));
            cutter.position.copy(box.getCenter(new THREE.Vector3()));
            cutter.position[axis] = (start + finish) / 2;
            cutter.updateMatrixWorld(true);
            return cutter;
        };
        const leftCutter = makeCutter(-1);
        const rightCutter = makeCutter(1);
        const left = evaluator.evaluate(makeSource(), leftCutter, INTERSECTION);
        const right = evaluator.evaluate(makeSource(), rightCutter, INTERSECTION);
        const leftVolume = volumeOf(left.geometry);
        const rightVolume = volumeOf(right.geometry);
        const delta = Math.abs(candidate.volume - leftVolume - rightVolume);
        const tolerance = Math.max(0.00001, candidate.volume * 0.0001);
        leftCutter.geometry.dispose();
        rightCutter.geometry.dispose();
        if (leftVolume > 0 && rightVolume > 0 && delta <= tolerance) {
            result = { candidate, axis, left, right, leftVolume, rightVolume, delta, tolerance };
            break;
        }
        left.geometry.dispose();
        right.geometry.dispose();
    } catch {
        // Se prueban sólidos IFC reales hasta encontrar uno manifold para el gate CSG.
    }
}

assert.ok(result, 'Debe existir una malla IFC real manifold que admita partición CSG conservativa');
assert.ok(result.candidate.globalId, 'La malla CSG debe conservar un GlobalId IFC real');
assert.ok(result.left.geometry.getAttribute('position').count > 0);
assert.ok(result.right.geometry.getAttribute('position').count > 0);
assert.ok(result.delta <= result.tolerance);

console.log(JSON.stringify({
    contract_version: 'giproy_bim_real_ifc_csg_gate_v1',
    dataset_id: dataset.id,
    source_sha256: dataset.expected.sha256,
    fragment_bytes: fragmentsResult.fragment_bytes,
    express_id: result.candidate.expressId,
    global_id: result.candidate.globalId,
    split_axis: result.axis,
    source_volume: Number(result.candidate.volume.toFixed(6)),
    partition_volume: Number((result.leftVolume + result.rightVolume).toFixed(6)),
    conservation_delta: Number(result.delta.toFixed(9)),
}));

for (const candidate of candidates) candidate.geometry.dispose();
result.left.geometry.dispose();
result.right.geometry.dispose();
console.log('smoke-bim-real-ifc-csg: ok');
