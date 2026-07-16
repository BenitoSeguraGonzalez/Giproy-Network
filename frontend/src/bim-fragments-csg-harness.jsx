import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Brush, Evaluator, INTERSECTION } from 'three-bvh-csg';
import { FragmentsModels } from '@thatopen/fragments';
import fragmentsWorkerUrl from '@thatopen/fragments/worker?url';
import { Database } from 'lucide-react';

import './index.css';
import { bimModelsApi } from './api/bimModels';

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

const geometryFromMeshData = (meshData) => {
    if (!meshData?.positions?.length || !meshData?.indices?.length) return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(meshData.positions), 3));
    if (meshData.normals?.length === meshData.positions.length) {
        const normals = new Float32Array(meshData.normals.length);
        for (let index = 0; index < normals.length; index += 1) normals[index] = meshData.normals[index] / 32767;
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    } else {
        geometry.computeVertexNormals();
    }
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(meshData.indices), 1));
    const transform = meshData.transform?.isMatrix4
        ? meshData.transform
        : new THREE.Matrix4().fromArray(meshData.transform?.elements || meshData.transform || new THREE.Matrix4().elements);
    geometry.applyMatrix4(transform);
    geometry.clearGroups();
    return geometry;
};

const splitGeometry = (geometry) => {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const size = box.getSize(new THREE.Vector3());
    const axis = size.x >= size.y && size.x >= size.z ? 'x' : size.y >= size.z ? 'y' : 'z';
    const midpoint = (box.min[axis] + box.max[axis]) / 2;
    const margin = Math.max(size.x, size.y, size.z) * 0.2 + 0.01;
    const evaluator = new Evaluator();
    evaluator.attributes = ['position', 'normal'];
    evaluator.useGroups = false;
    const makeSource = () => {
        const brush = new Brush(geometry.clone());
        brush.updateMatrixWorld(true);
        return brush;
    };
    const makeCutter = (side) => {
        const start = side < 0 ? box.min[axis] - margin : midpoint;
        const finish = side < 0 ? midpoint : box.max[axis] + margin;
        const cutterSize = new THREE.Vector3(size.x + margin * 2, size.y + margin * 2, size.z + margin * 2);
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
    leftCutter.geometry.dispose();
    rightCutter.geometry.dispose();
    const sourceVolume = volumeOf(geometry);
    const leftVolume = volumeOf(left.geometry);
    const rightVolume = volumeOf(right.geometry);
    const delta = Math.abs(sourceVolume - leftVolume - rightVolume);
    return { axis, left, right, sourceVolume, leftVolume, rightVolume, delta };
};

const serializeGeometry = (geometry) => {
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    const indices = geometry.index ? Array.from(geometry.index.array, Number) : Array.from({ length: position.count }, (_, index) => index);
    return {
        positions: Array.from(position.array, Number),
        normals: normal ? Array.from(normal.array, Number) : [],
        indices,
        volume: volumeOf(geometry),
        triangle_count: Math.floor(indices.length / 3),
    };
};

const format = (value, digits = 6) => Number(value || 0).toFixed(digits);

function BimFragmentsCsgHarness() {
    const mountRef = useRef(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [persisting, setPersisting] = useState(false);
    const [persisted, setPersisted] = useState(null);
    const payloadRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        let disposed = false;
        let fragments = null;
        let renderer = null;
        let controls = null;
        let frameId = 0;
        let resizeObserver = null;
        const geometries = [];
        const csgSegments = [];

        const run = async () => {
            try {
                const response = await fetch('/bim-real-csg.frag');
                if (!response.ok) throw new Error('No se pudo cargar el Fragments real.');
                const bytes = new Uint8Array(await response.arrayBuffer());
                fragments = new FragmentsModels(fragmentsWorkerUrl, { maxWorkers: 2 });
                const model = await fragments.load(bytes, { modelId: 'bim-real-ifc-csg', raw: false, userData: { source: 'buildingSMART PCERT' } });
                await model.setupData?.();
                await fragments.update(true);
                const localIds = typeof model.getItemsIdsWithGeometry === 'function'
                    ? await model.getItemsIdsWithGeometry()
                    : (await model.getItemsWithGeometry()).filter((item) => Number.isInteger(item));
                let selected = null;
                for (const localId of localIds) {
                    const meshGroups = await model.getItemsGeometry([localId]);
                    const guids = await model.getGuidsByLocalIds([localId]);
                    for (const meshData of meshGroups.flat()) {
                        const geometry = geometryFromMeshData(meshData);
                        if (!geometry) continue;
                        geometries.push(geometry);
                        const sourceVolume = volumeOf(geometry);
                        if (!Number.isFinite(sourceVolume) || sourceVolume <= 0.000001) continue;
                        try {
                            const split = splitGeometry(geometry);
                            const tolerance = Math.max(0.00001, split.sourceVolume * 0.0001);
                            if (split.leftVolume > 0 && split.rightVolume > 0 && split.delta <= tolerance) {
                                selected = { localId, globalId: guids[0] || '', bytes: bytes.byteLength, geometry, ...split };
                                break;
                            }
                            split.left.geometry.dispose();
                            split.right.geometry.dispose();
                        } catch {
                            // Continúa con el siguiente sólido real consultable.
                        }
                    }
                    if (selected) break;
                }
                if (!selected?.globalId) throw new Error('FragmentsModels no entregó un sólido CSG trazable por GlobalId.');
                if (disposed) return;
                const segments = [selected.left, selected.right];
                csgSegments.push(...segments);
                payloadRef.current = {
                    contract_version: 'giproy_bim_4d_csg_artifact_v1',
                    artifact_revision: 'FRAGMENTS-CSG-R1',
                    source_global_id: selected.globalId,
                    geometry_method: 'exact_bvh_csg_v1',
                    source_mesh: serializeGeometry(selected.geometry),
                    segments: segments.map((segment, index) => ({ index: index + 1, mesh: serializeGeometry(segment.geometry) })),
                    conservation_delta: selected.delta,
                };
                setResult(selected);

                const scene = new THREE.Scene();
                scene.background = new THREE.Color('#eef2f7');
                const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 10000);
                selected.geometry.computeBoundingSphere();
                const sphere = selected.geometry.boundingSphere;
                const distance = Math.max(sphere.radius * 3, 4);
                camera.position.copy(sphere.center).add(new THREE.Vector3(distance, distance * 0.7, distance));
                camera.near = Math.max(distance / 1000, 0.01);
                camera.far = distance * 20;
                camera.updateProjectionMatrix();
                renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                mount.appendChild(renderer.domElement);
                controls = new OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                controls.target.copy(sphere.center);
                scene.add(new THREE.HemisphereLight('#ffffff', '#475569', 2));
                const light = new THREE.DirectionalLight('#ffffff', 2.4);
                light.position.copy(camera.position);
                scene.add(light);
                const colors = ['#0f766e', '#dc6b19'];
                segments.forEach((segment, index) => {
                    segment.material = new THREE.MeshStandardMaterial({ color: colors[index], roughness: 0.66 });
                    segment.position[selected.axis] += index === 0 ? -sphere.radius * 0.015 : sphere.radius * 0.015;
                    scene.add(segment);
                });
                const resize = () => {
                    const width = Math.max(mount.clientWidth, 1);
                    const height = Math.max(mount.clientHeight, 1);
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                    renderer.setSize(width, height, false);
                };
                resizeObserver = new ResizeObserver(resize);
                resizeObserver.observe(mount);
                resize();
                const render = () => {
                    controls.update();
                    renderer.render(scene, camera);
                    frameId = requestAnimationFrame(render);
                };
                render();
            } catch (caughtError) {
                if (!disposed) setError(caughtError instanceof Error ? caughtError.message : String(caughtError));
            }
        };
        run();
        return () => {
            disposed = true;
            cancelAnimationFrame(frameId);
            resizeObserver?.disconnect();
            controls?.dispose();
            renderer?.dispose();
            renderer?.domElement.remove();
            geometries.forEach((geometry) => geometry.dispose());
            csgSegments.forEach((segment) => {
                segment.geometry?.dispose?.();
                segment.material?.dispose?.();
            });
            fragments?.dispose?.();
        };
    }, []);

    const persist = async () => {
        if (!payloadRef.current || persisting) return;
        setPersisting(true);
        setError('');
        try {
            const created = await bimModelsApi.create4dPartitionCsgArtifact(91, 11, payloadRef.current, 7);
            const list = await bimModelsApi.list4dPartitionCsgArtifacts(91, 11, 7);
            const verified = list.find((artifact) => artifact.checksum_sha256 === created.checksum_sha256);
            if (!verified) throw new Error('El round-trip Fragments CSG no coincide por checksum.');
            setPersisted(verified);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : String(caughtError));
        } finally {
            setPersisting(false);
        }
    };

    return (
        <main
            className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-3 bg-white p-3 text-slate-900 sm:p-5"
            data-bim-fragments-csg-ready={String(Boolean(result))}
            data-bim-fragments-csg-local-id={result?.localId ?? ''}
            data-bim-fragments-csg-global-id={result?.globalId ?? ''}
            data-bim-fragments-csg-bytes={result?.bytes ?? ''}
            data-bim-fragments-csg-source-volume={result ? format(result.sourceVolume) : ''}
            data-bim-fragments-csg-partition-volume={result ? format(result.leftVolume + result.rightVolume) : ''}
            data-bim-fragments-csg-delta={result ? format(result.delta, 9) : ''}
            data-bim-fragments-csg-persisted={String(Boolean(persisted))}
        >
            <header className="border-b border-slate-200 pb-3">
                <p className="text-xs font-semibold uppercase text-teal-700">BIM · Fragments nativo</p>
                <h1 className="text-xl font-semibold sm:text-2xl">Round-trip geometrico CSG</h1>
            </header>
            <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_270px]">
                <div ref={mountRef} className="min-h-[280px] overflow-hidden border border-slate-300 bg-slate-100" style={{ height: 'clamp(280px, 52vw, 420px)' }} data-bim-fragments-csg-canvas="webgl" />
                <aside className="grid content-start gap-3 border-l-4 border-orange-500 bg-slate-50 p-3 text-sm">
                    <div><p className="text-xs font-semibold text-slate-500">Trazabilidad</p><p className="break-all">{result ? `${result.localId} · ${result.globalId}` : 'Procesando Fragments'}</p></div>
                    <div><p className="text-xs font-semibold text-slate-500">Volumen fuente</p><strong>{result ? `${format(result.sourceVolume)} m3` : '--'}</strong></div>
                    <div><p className="text-xs font-semibold text-slate-500">Conservacion</p><p>{result ? `Delta ${format(result.delta, 9)} m3` : '--'}</p></div>
                    <button type="button" onClick={persist} disabled={!result || persisting} className="inline-flex min-h-10 items-center justify-center gap-2 border border-teal-700 bg-teal-700 px-3 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-50">
                        <Database size={16} aria-hidden="true" />
                        {persisting ? 'Persistiendo' : persisted ? 'Round-trip verificado' : 'Persistir artefacto'}
                    </button>
                    {persisted ? <p className="break-all border border-teal-200 bg-teal-50 p-2 text-xs" data-bim-fragments-csg-roundtrip="verified">SHA-256 {persisted.checksum_sha256}</p> : null}
                    {error ? <p role="alert" className="border border-red-300 bg-red-50 p-2 text-red-800">{error}</p> : null}
                </aside>
            </section>
        </main>
    );
}

createRoot(document.getElementById('root')).render(<BimFragmentsCsgHarness />);
