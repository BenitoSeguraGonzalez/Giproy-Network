import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Brush, Evaluator, INTERSECTION, SUBTRACTION } from 'three-bvh-csg';
import { Database } from 'lucide-react';

import './index.css';
import { bimModelsApi } from './api/bimModels';

const METHOD = 'exact_bvh_csg_v1';

const prepareGeometry = (geometry) => {
    geometry.clearGroups();
    return geometry;
};

const createBrush = (geometry, material, configure = null) => {
    const brush = new Brush(prepareGeometry(geometry), material);
    configure?.(brush);
    brush.updateMatrixWorld(true);
    return brush;
};

const triangleCount = (geometry) => {
    const count = geometry.index?.count ?? geometry.getAttribute('position')?.count ?? 0;
    return Math.floor(count / 3);
};

const geometryVolume = (geometry) => {
    const position = geometry.getAttribute('position');
    const index = geometry.index;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    let signedVolume = 0;
    const count = index?.count ?? position.count;

    for (let offset = 0; offset < count; offset += 3) {
        const ia = index ? index.getX(offset) : offset;
        const ib = index ? index.getX(offset + 1) : offset + 1;
        const ic = index ? index.getX(offset + 2) : offset + 2;
        a.fromBufferAttribute(position, ia);
        b.fromBufferAttribute(position, ib);
        c.fromBufferAttribute(position, ic);
        signedVolume += a.dot(b.clone().cross(c)) / 6;
    }

    return Math.abs(signedVolume);
};

const serializeMesh = (geometry) => {
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    const indices = geometry.index
        ? Array.from(geometry.index.array, Number)
        : Array.from({ length: position.count }, (_, index) => index);
    return {
        positions: Array.from(position.array, Number),
        normals: normal ? Array.from(normal.array, Number) : [],
        indices,
        volume: geometryVolume(geometry),
        triangle_count: Math.floor(indices.length / 3),
    };
};

const makeExactPartitions = () => {
    const evaluator = new Evaluator();
    evaluator.attributes = ['position', 'normal'];
    evaluator.useGroups = false;

    const neutral = new THREE.MeshStandardMaterial({ color: '#9ca3af', roughness: 0.72, metalness: 0.05 });
    const wall = createBrush(new THREE.BoxGeometry(6, 3, 0.6), neutral);
    const opening = createBrush(
        new THREE.CylinderGeometry(0.55, 0.55, 1.2, 48),
        neutral,
        (brush) => {
            brush.rotation.x = Math.PI / 2;
            brush.position.y = 0.25;
        },
    );
    const source = evaluator.evaluate(wall, opening, SUBTRACTION);

    const sourceClone = () => createBrush(source.geometry.clone(), neutral);
    const leftCutter = createBrush(new THREE.BoxGeometry(8, 6, 4), neutral, (brush) => {
        brush.position.x = -4;
    });
    const rightCutter = createBrush(new THREE.BoxGeometry(8, 6, 4), neutral, (brush) => {
        brush.position.x = 4;
    });
    const left = evaluator.evaluate(sourceClone(), leftCutter, INTERSECTION);
    const right = evaluator.evaluate(sourceClone(), rightCutter, INTERSECTION);

    const sourceVolume = geometryVolume(source.geometry);
    const leftVolume = geometryVolume(left.geometry);
    const rightVolume = geometryVolume(right.geometry);
    const partitionVolume = leftVolume + rightVolume;
    const conservationDelta = Math.abs(sourceVolume - partitionVolume);

    wall.geometry.dispose();
    opening.geometry.dispose();
    leftCutter.geometry.dispose();
    rightCutter.geometry.dispose();

    return {
        source,
        segments: [left, right],
        artifactPayload: {
            contract_version: 'giproy_bim_4d_csg_artifact_v1',
            artifact_revision: 'CSG-HARNESS-R1',
            source_global_id: 'GUID-CSG-HARNESS',
            geometry_method: METHOD,
            source_mesh: serializeMesh(source.geometry),
            segments: [left, right].map((segment, index) => ({ index: index + 1, mesh: serializeMesh(segment.geometry) })),
            conservation_delta: conservationDelta,
        },
        metrics: {
            sourceVolume,
            segmentVolumes: [leftVolume, rightVolume],
            partitionVolume,
            conservationDelta,
            sourceTriangles: triangleCount(source.geometry),
            segmentTriangles: triangleCount(left.geometry) + triangleCount(right.geometry),
        },
    };
};

const format = (value, digits = 6) => Number(value || 0).toFixed(digits);

function BimCsgHarness() {
    const mountRef = useRef(null);
    const [error, setError] = useState('');
    const [metrics, setMetrics] = useState(null);
    const [artifactPayload, setArtifactPayload] = useState(null);
    const [persisting, setPersisting] = useState(false);
    const [persistedArtifact, setPersistedArtifact] = useState(null);
    const colors = useMemo(() => ['#13795b', '#d97706'], []);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return undefined;

        let frameId = 0;
        let resizeObserver = null;
        let renderer = null;
        let controls = null;
        let source = null;
        let segments = [];

        try {
            const result = makeExactPartitions();
            source = result.source;
            segments = result.segments;
            setMetrics(result.metrics);
            setArtifactPayload(result.artifactPayload);

            const scene = new THREE.Scene();
            scene.background = new THREE.Color('#f3f4f6');
            const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
            camera.position.set(7.4, 4.8, 7.8);

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.shadowMap.enabled = true;
            mount.appendChild(renderer.domElement);

            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.target.set(0, 0.15, 0);

            scene.add(new THREE.HemisphereLight('#ffffff', '#64748b', 1.8));
            const key = new THREE.DirectionalLight('#ffffff', 2.5);
            key.position.set(4, 8, 6);
            key.castShadow = true;
            scene.add(key);

            segments.forEach((segment, index) => {
                segment.material = new THREE.MeshStandardMaterial({
                    color: colors[index],
                    roughness: 0.62,
                    metalness: 0.08,
                });
                segment.position.x += index === 0 ? -0.06 : 0.06;
                segment.castShadow = true;
                segment.receiveShadow = true;
                scene.add(segment);
            });

            const floor = new THREE.Mesh(
                new THREE.PlaneGeometry(16, 12),
                new THREE.MeshStandardMaterial({ color: '#d1d5db', roughness: 0.9 }),
            );
            floor.rotation.x = -Math.PI / 2;
            floor.position.y = -1.55;
            floor.receiveShadow = true;
            scene.add(floor);

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
            setError(caughtError instanceof Error ? caughtError.message : String(caughtError));
        }

        return () => {
            cancelAnimationFrame(frameId);
            resizeObserver?.disconnect();
            controls?.dispose();
            segments.forEach((segment) => {
                segment.geometry.dispose();
                segment.material.dispose();
            });
            source?.geometry.dispose();
            source?.material?.dispose?.();
            renderer?.dispose();
            renderer?.domElement.remove();
        };
    }, [colors]);

    const ready = Boolean(metrics && !error);
    const persistArtifact = async () => {
        if (!artifactPayload || persisting) return;
        setPersisting(true);
        setError('');
        try {
            const created = await bimModelsApi.create4dPartitionCsgArtifact(91, 11, artifactPayload, 7);
            const artifacts = await bimModelsApi.list4dPartitionCsgArtifacts(91, 11, 7);
            const roundTrip = artifacts.find((artifact) => artifact.checksum_sha256 === created.checksum_sha256);
            if (!roundTrip) throw new Error('El artefacto CSG persistido no pudo verificarse por checksum.');
            setPersistedArtifact(roundTrip);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : String(caughtError));
        } finally {
            setPersisting(false);
        }
    };
    return (
        <main
            className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-3 bg-white p-3 text-slate-900 sm:p-5"
            data-bim-csg-ready={String(ready)}
            data-bim-csg-method={METHOD}
            data-bim-csg-source-volume={metrics ? format(metrics.sourceVolume) : ''}
            data-bim-csg-partition-volume={metrics ? format(metrics.partitionVolume) : ''}
            data-bim-csg-conservation-delta={metrics ? format(metrics.conservationDelta, 9) : ''}
            data-bim-csg-source-triangles={metrics?.sourceTriangles ?? ''}
            data-bim-csg-segment-triangles={metrics?.segmentTriangles ?? ''}
            data-bim-csg-persisted={String(Boolean(persistedArtifact))}
            data-bim-csg-checksum={persistedArtifact?.checksum_sha256 ?? ''}
        >
            <header className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                    <p className="text-xs font-semibold uppercase text-emerald-700">BIM · Geometria constructiva</p>
                    <h1 className="text-xl font-semibold sm:text-2xl">Particion CSG exacta</h1>
                </div>
                <span className="border border-emerald-700 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                    {ready ? 'Malla calculada' : 'Calculando'}
                </span>
            </header>

            <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div
                    ref={mountRef}
                    className="min-h-[280px] w-full overflow-hidden border border-slate-300 bg-slate-100"
                    style={{ height: 'clamp(280px, 52vw, 420px)' }}
                    data-bim-csg-canvas="webgl"
                />
                <aside className="grid content-start gap-3 border-l-4 border-amber-500 bg-slate-50 p-3">
                    <div>
                        <p className="text-xs font-semibold text-slate-500">Metodo</p>
                        <p className="break-words text-sm font-semibold">BVH CSG: sustraccion + interseccion</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="border border-slate-200 bg-white p-2">
                            <p className="text-xs text-slate-500">Volumen fuente</p>
                            <strong>{metrics ? `${format(metrics.sourceVolume, 4)} m3` : '--'}</strong>
                        </div>
                        <div className="border border-slate-200 bg-white p-2">
                            <p className="text-xs text-slate-500">Volumen partes</p>
                            <strong>{metrics ? `${format(metrics.partitionVolume, 4)} m3` : '--'}</strong>
                        </div>
                    </div>
                    <div className="text-sm" data-bim-csg-segments={metrics ? metrics.segmentVolumes.map((value) => format(value)).join(',') : ''}>
                        <p className="text-xs font-semibold text-slate-500">Conservacion</p>
                        <p>{metrics ? `Delta ${format(metrics.conservationDelta, 9)} m3` : '--'}</p>
                    </div>
                    <div className="text-sm">
                        <p className="text-xs font-semibold text-slate-500">Triangulos</p>
                        <p>{metrics ? `${metrics.sourceTriangles} fuente · ${metrics.segmentTriangles} particiones` : '--'}</p>
                    </div>
                    <button
                        type="button"
                        onClick={persistArtifact}
                        disabled={!ready || persisting}
                        className="inline-flex min-h-10 items-center justify-center gap-2 border border-emerald-700 bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Database size={16} aria-hidden="true" />
                        {persisting ? 'Persistiendo' : persistedArtifact ? 'CSG verificado' : 'Persistir CSG'}
                    </button>
                    {persistedArtifact ? (
                        <p className="break-all border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900" data-bim-csg-roundtrip="verified">
                            SHA-256 {persistedArtifact.checksum_sha256}
                        </p>
                    ) : null}
                    {error ? <p className="border border-red-300 bg-red-50 p-2 text-sm text-red-800" role="alert">{error}</p> : null}
                </aside>
            </section>
        </main>
    );
}

createRoot(document.getElementById('root')).render(<BimCsgHarness />);
