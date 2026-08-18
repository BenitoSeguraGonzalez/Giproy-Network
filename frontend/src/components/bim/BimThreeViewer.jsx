import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Box, ChevronDown, Layers3, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { adaptViewerArtifactToElements } from './bimViewerArtifactAdapter';
import useBimRenderQuality from '../../hooks/useBimRenderQuality';
import BimRenderQualityControl from './BimRenderQualityControl';

const TYPE_COLORS = {
    ifcwall: 0xf39200,
    ifcslab: 0x136191,
    ifcbeam: 0x475569,
    ifccolumn: 0x22c55e,
    ifcgrid: 0x94a3b8,
    ifcroof: 0xe94e1b,
};

const normalizePoints = (points = []) =>
    points
        .map((point) => ({ x: Number(point?.x), y: Number(point?.y) }))
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

const getElementBounds = (element, index) => {
    const geometry = element?.metadata_json?.geometry_2d || {};
    const points = normalizePoints(geometry.points || []);
    if (points.length >= 2) {
        const xs = points.map((point) => point.x);
        const ys = points.map((point) => point.y);
        return {
            x: Math.min(...xs),
            y: Math.min(...ys),
            width: Math.max(12, Math.max(...xs) - Math.min(...xs)),
            depth: Math.max(12, Math.max(...ys) - Math.min(...ys)),
            source: 'imported',
        };
    }

    if (
        Number.isFinite(Number(geometry.x)) &&
        Number.isFinite(Number(geometry.y)) &&
        Number.isFinite(Number(geometry.width)) &&
        Number.isFinite(Number(geometry.height))
    ) {
        return {
            x: Number(geometry.x),
            y: Number(geometry.y),
            width: Math.max(12, Number(geometry.width)),
            depth: Math.max(12, Number(geometry.height)),
            source: 'imported',
        };
    }

    return {
        x: 32 + (index % 5) * 90,
        y: 48 + Math.floor(index / 5) * 70,
        width: 56,
        depth: 40,
        source: 'derived',
    };
};

const buildThreeElements = (elements = []) => {
    const prepared = elements.map((element, index) => {
        const bounds = getElementBounds(element, index);
        const ifcClass = (element.ifc_class || '').toLowerCase();
        const heightSeed = ifcClass.includes('slab') ? 10 : ifcClass.includes('grid') ? 4 : 32 + (index % 4) * 8;
        return {
            ...element,
            ...bounds,
            height: heightSeed,
            color: TYPE_COLORS[ifcClass] || 0xcbd5e1,
        };
    });

    const minX = Math.min(...prepared.map((element) => element.x), 0);
    const minY = Math.min(...prepared.map((element) => element.y), 0);
    const maxX = Math.max(...prepared.map((element) => element.x + element.width), 1);
    const maxY = Math.max(...prepared.map((element) => element.y + element.depth), 1);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return prepared.map((element) => ({
        ...element,
        sceneX: element.x - centerX + element.width / 2,
        sceneZ: element.y - centerY + element.depth / 2,
    }));
};

const BimThreeViewer = ({
    elements = [],
    ready,
    selectedElement,
    linkedElementIds = [],
    highlightedElementIds = [],
    activeVersionLabel,
    activeStoreyName,
    viewerArtifact = null,
    onSelectElement,
}) => {
    const mountRef = useRef(null);
    const rendererRef = useRef(null);
    const animationRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const onSelectElementRef = useRef(onSelectElement);
    const [raycastHit, setRaycastHit] = useState(null);
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [focusedElement, setFocusedElement] = useState(null);
    const [viewControlsOpen, setViewControlsOpen] = useState(false);
    const renderQuality = useBimRenderQuality();
    const artifactElements = useMemo(() => adaptViewerArtifactToElements(viewerArtifact), [viewerArtifact]);
    const sourceElements = artifactElements.length > 0 ? artifactElements : elements;
    const preparedElements = useMemo(() => buildThreeElements(sourceElements), [sourceElements]);
    const [activeIfcClass, setActiveIfcClass] = useState('all');
    const [hiddenIfcClasses, setHiddenIfcClasses] = useState(() => new Set());
    const ifcClassFilters = useMemo(() => {
        const classes = new Set(preparedElements.map((element) => element.ifc_class).filter(Boolean));
        return ['all', ...Array.from(classes).sort((left, right) => left.localeCompare(right))];
    }, [preparedElements]);
    const visibleIfcClassCount = ifcClassFilters.filter((ifcClass) => ifcClass !== 'all' && !hiddenIfcClasses.has(ifcClass)).length;
    const visibleThreeElements = useMemo(
        () =>
            preparedElements.filter((element) => {
                if (hiddenIfcClasses.has(element.ifc_class)) return false;
                return activeIfcClass === 'all' || element.ifc_class === activeIfcClass;
            }),
        [activeIfcClass, hiddenIfcClasses, preparedElements],
    );
    const linkedElementIdSet = useMemo(() => new Set(linkedElementIds), [linkedElementIds]);
    const highlightedElementIdSet = useMemo(() => new Set(highlightedElementIds), [highlightedElementIds]);
    const artifactSource = artifactElements.length > 0 ? 'viewer-artifact' : 'elements';
    const selectedSceneElement = useMemo(
        () => visibleThreeElements.find((element) => element.id === selectedElement?.id) || null,
        [visibleThreeElements, selectedElement?.id],
    );
    const inspectedElementId = raycastHit?.elementId || selectedElement?.id || null;
    const inspectedSceneElement = useMemo(() => {
        return visibleThreeElements.find((element) => element.id === inspectedElementId) || null;
    }, [inspectedElementId, visibleThreeElements]);

    useEffect(() => {
        setInspectorOpen(Boolean(inspectedElementId));
    }, [inspectedElementId]);

    const inspectedProperties = inspectedSceneElement?.properties_json || inspectedSceneElement?.metadata_json?.properties || {};
    const inspectedPropertyCount =
        Number(inspectedSceneElement?.metadata_json?.viewer_artifact?.property_count) || Object.keys(inspectedProperties || {}).length;
    const inspectedMaterial = inspectedSceneElement?.metadata_json?.material_names?.[0] || inspectedSceneElement?.material_name || '';
    const inspectedSystem = inspectedSceneElement?.metadata_json?.system_name || inspectedSceneElement?.system_name || '';

    useEffect(() => {
        onSelectElementRef.current = onSelectElement;
    }, [onSelectElement]);

    const handleResetCamera = () => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) return;
        camera.position.set(260, 260, 360);
        controls.target.set(0, 0, 0);
        controls.update();
        setRaycastHit(null);
        setFocusedElement(null);
    };

    const handleSetView = (view) => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) return;
        const positions = {
            top: [0, 520, 0.01],
            front: [0, 260, 560],
            right: [560, 260, 0],
            iso: [260, 260, 360],
        };
        const [x, y, z] = positions[view] || positions.iso;
        camera.position.set(x, y, z);
        controls.target.set(0, 0, 0);
        camera.lookAt(0, 0, 0);
        controls.update();
    };

    const handleFocusSelectedElement = () => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls || !selectedSceneElement) return;
        const target = new THREE.Vector3(
            selectedSceneElement.sceneX,
            selectedSceneElement.height / 2,
            selectedSceneElement.sceneZ,
        );
        controls.target.copy(target);
        camera.position.set(target.x + 180, target.y + 150, target.z + 240);
        camera.lookAt(target);
        controls.update();
        setFocusedElement({
            elementId: selectedSceneElement.id,
            globalId: selectedSceneElement.global_id || '',
            ifcClass: selectedSceneElement.ifc_class || '',
        });
    };

    const toggleIfcClassVisibility = (ifcClass) => {
        setHiddenIfcClasses((current) => {
            const next = new Set(current);
            if (next.has(ifcClass)) {
                next.delete(ifcClass);
            } else {
                next.add(ifcClass);
            }
            return next;
        });
    };

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount || !ready || visibleThreeElements.length === 0) {
            return undefined;
        }

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc);
        const camera = new THREE.PerspectiveCamera(42, 1, 1, 5000);
        camera.position.set(260, 260, 360);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
        renderer.setPixelRatio(renderQuality.pixelRatio);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.domElement.setAttribute('data-bim-three-canvas', 'true');
        rendererRef.current = renderer;
        mount.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.screenSpacePanning = true;
        controls.minDistance = 120;
        controls.maxDistance = 1200;
        controls.target.set(0, 0, 0);
        controls.update();
        controlsRef.current = controls;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
        keyLight.position.set(180, 260, 140);
        scene.add(ambientLight, keyLight);

        const grid = new THREE.GridHelper(620, 18, 0xcbd5e1, 0xe4e4e7);
        grid.position.y = -2;
        scene.add(grid);

        const group = new THREE.Group();
        visibleThreeElements.forEach((element) => {
            const geometry = new THREE.BoxGeometry(element.width, element.height, element.depth);
            const isSelected = element.id === selectedElement?.id;
            const isHighlighted = highlightedElementIdSet.has(element.id);
            const isLinked = linkedElementIdSet.has(element.id);
            const material = new THREE.MeshStandardMaterial({
                color: isSelected ? 0xf39200 : isHighlighted ? 0x2563eb : isLinked ? 0x60a5fa : element.color,
                roughness: 0.52,
                metalness: 0.08,
                transparent: true,
                opacity: element.source === 'derived' ? 0.78 : 0.95,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(element.sceneX, element.height / 2, element.sceneZ);
            mesh.userData = {
                element,
                elementId: element.id,
                globalId: element.global_id,
                ifcClass: element.ifc_class,
                geometrySource: element.source,
            };
            group.add(mesh);

            const edges = new THREE.EdgesGeometry(geometry);
            const edgeMaterial = new THREE.LineBasicMaterial({ color: isSelected ? 0xc26f00 : isHighlighted ? 0x1d4ed8 : 0x475569 });
            const line = new THREE.LineSegments(edges, edgeMaterial);
            line.position.copy(mesh.position);
            group.add(line);
        });
        scene.add(group);

        const resize = () => {
            const width = Math.max(320, mount.clientWidth);
            const height = Math.max(320, mount.clientHeight);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
        };

        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(mount);

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const selectableMeshes = [];
        group.traverse((node) => {
            if (node.isMesh && node.userData?.element) selectableMeshes.push(node);
        });

        const findRaycastElement = (event) => {
            const rect = renderer.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
            const [hit] = raycaster.intersectObjects(selectableMeshes, false);
            return hit?.object?.userData?.element || null;
        };

        const pickElement = (event) => {
            const element = findRaycastElement(event);
            if (!element) {
                setRaycastHit(null);
                return;
            }
            setRaycastHit({
                elementId: element.id,
                globalId: element.global_id || '',
                ifcClass: element.ifc_class || '',
            });
            if (typeof onSelectElementRef.current === 'function') {
                onSelectElementRef.current(element);
            }
        };

        renderer.domElement.addEventListener('pointerdown', pickElement);

        const animate = () => {
            controls.update();
            renderer.render(scene, camera);
            animationRef.current = window.requestAnimationFrame(animate);
        };
        animate();

        return () => {
            observer.disconnect();
            if (animationRef.current) {
                window.cancelAnimationFrame(animationRef.current);
            }
            renderer.domElement.removeEventListener('pointerdown', pickElement);
            controls.dispose();
            scene.traverse((node) => {
                if (node.geometry) node.geometry.dispose();
                if (node.material) {
                    if (Array.isArray(node.material)) {
                        node.material.forEach((material) => material.dispose());
                    } else {
                        node.material.dispose();
                    }
                }
            });
            renderer.dispose();
            renderer.forceContextLoss();
            if (renderer.domElement.parentNode === mount) {
                mount.removeChild(renderer.domElement);
            }
            rendererRef.current = null;
            cameraRef.current = null;
            controlsRef.current = null;
        };
    }, [highlightedElementIdSet, linkedElementIdSet, ready, renderQuality.pixelRatio, selectedElement?.id, visibleThreeElements]);

    return (
        <section
            data-bim-three-viewer="isolated"
            data-bim-artifact-source={artifactSource}
            data-bim-artifact-elements={artifactElements.length}
            data-bim-three-raycast="enabled"
            data-bim-three-raycast-hit={raycastHit?.elementId || ''}
            data-bim-three-raycast-global-id={raycastHit?.globalId || ''}
            data-bim-three-raycast-ifc-class={raycastHit?.ifcClass || ''}
            data-bim-three-hover-element=""
            data-bim-three-hover-global-id=""
            data-bim-three-hover-ifc-class=""
            data-bim-three-controls="orbit"
            data-bim-three-focus-element={focusedElement?.elementId || ''}
            data-bim-three-focus-global-id={focusedElement?.globalId || ''}
            data-bim-three-inspector-element={inspectedSceneElement?.id || ''}
            data-bim-three-inspector-global-id={inspectedSceneElement?.global_id || ''}
            data-bim-three-inspector-properties={inspectedPropertyCount}
            data-bim-three-ifc-filter={activeIfcClass}
            data-bim-three-filtered-elements={visibleThreeElements.length}
            data-bim-three-ifc-filter-count={ifcClassFilters.length}
            data-bim-three-hidden-ifc-classes={hiddenIfcClasses.size}
            data-bim-three-visible-ifc-classes={visibleIfcClassCount}
            data-bim-render-pixel-ratio={renderQuality.pixelRatio}
            className="flex h-full min-h-[360px] flex-col overflow-hidden border border-zinc-200 bg-white"
        >
            <div className="relative flex h-11 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-3">
                <div className="flex min-w-0 items-center gap-2">
                    <h3 className="text-xs font-semibold text-zinc-900">Modelo 3D</h3>
                    <div className="flex gap-1.5 text-[10px] font-semibold">
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[#C26F00]">
                        <Box className="h-3 w-3" /> {preparedElements.length} elementos
                    </span>
                    {visibleThreeElements.length !== preparedElements.length ? <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-[#136191]">
                        <Layers3 className="h-3 w-3" /> {visibleThreeElements.length} visibles
                    </span> : null}
                    </div>
                </div>
                <button type="button" onClick={() => setViewControlsOpen((value) => !value)} className="inline-flex h-8 items-center gap-2 rounded-md border border-zinc-300 bg-white px-2.5 text-xs font-semibold text-zinc-700 hover:border-orange-500 hover:text-orange-700" aria-expanded={viewControlsOpen}><SlidersHorizontal className="size-3.5" />Vista<ChevronDown className={`size-3 transition-transform ${viewControlsOpen ? 'rotate-180' : ''}`} /></button>
                {viewControlsOpen ? <div className="absolute right-3 top-10 z-30 w-[min(34rem,calc(100%-1.5rem))] rounded-md border border-zinc-300 bg-white p-3 shadow-xl">
                    <div className="flex items-center gap-1.5">
                        <button type="button" title="Restablecer vista" aria-label="Restablecer vista" data-bim-three-reset-view="true" onClick={handleResetCamera} disabled={!ready || preparedElements.length === 0} className="grid size-8 place-items-center rounded-md border border-zinc-200 text-zinc-700 hover:border-orange-500 disabled:opacity-40"><RotateCcw className="size-3.5" /></button>
                        <button type="button" title="Enfocar selecciÃ³n" aria-label="Enfocar selecciÃ³n" data-bim-three-focus-selected="true" onClick={handleFocusSelectedElement} disabled={!ready || !selectedSceneElement} className="grid size-8 place-items-center rounded-md border border-zinc-200 text-zinc-700 hover:border-orange-500 disabled:opacity-40"><Box className="size-3.5" /></button>
                        <BimRenderQualityControl {...renderQuality} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">Filtrar clase<select value={activeIfcClass} onChange={(event) => setActiveIfcClass(event.target.value)} className="mt-1 h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-[11px] font-semibold normal-case tracking-normal text-zinc-700">{ifcClassFilters.map((ifcClass) => <option key={ifcClass} value={ifcClass}>{ifcClass === 'all' ? 'Todas las clases' : ifcClass}</option>)}</select></label>
                      <fieldset className="min-w-0"><legend className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">Visibilidad</legend><div className="mt-1 flex h-8 items-center gap-2 overflow-x-auto rounded-md border border-zinc-200 bg-white px-2">{ifcClassFilters.filter((ifcClass) => ifcClass !== 'all').map((ifcClass) => { const isVisible = !hiddenIfcClasses.has(ifcClass); return <label key={ifcClass} className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-zinc-600"><input type="checkbox" checked={isVisible} onChange={() => toggleIfcClassVisibility(ifcClass)} className="accent-orange-600" />{ifcClass.replace(/^IFC/i, '')}</label>; })}</div></fieldset>
                    </div>
                </div> : null}
            </div>
            <div className="relative min-h-[320px] flex-1 bg-zinc-50" ref={mountRef}>
                <div className="pointer-events-auto absolute right-3 top-3 z-20 flex flex-col items-center gap-1" data-bim-three-orientation-gizmo>
                    <div className="grid size-12 place-items-center rounded-lg border border-zinc-300 bg-white/90 text-[9px] font-black uppercase tracking-wide text-zinc-500 shadow-sm" title="Gizmo de orientación">3D</div>
                    <div className="grid grid-cols-3 gap-1">
                        <button type="button" aria-label="Vista superior" title="Vista superior" onClick={() => handleSetView('top')} className="grid size-7 place-items-center rounded-md border border-zinc-200 bg-white/90 text-[9px] font-bold text-zinc-600 hover:border-orange-500 hover:text-orange-700">T</button>
                        <button type="button" aria-label="Vista frontal" title="Vista frontal" onClick={() => handleSetView('front')} className="grid size-7 place-items-center rounded-md border border-zinc-200 bg-white/90 text-[9px] font-bold text-zinc-600 hover:border-orange-500 hover:text-orange-700">F</button>
                        <button type="button" aria-label="Vista derecha" title="Vista derecha" onClick={() => handleSetView('right')} className="grid size-7 place-items-center rounded-md border border-zinc-200 bg-white/90 text-[9px] font-bold text-zinc-600 hover:border-orange-500 hover:text-orange-700">R</button>
                    </div>
                    <button type="button" aria-label="Vista isométrica" title="Vista isométrica" onClick={() => handleSetView('iso')} className="h-7 rounded-md border border-orange-200 bg-orange-50 px-2 text-[9px] font-bold text-orange-700 hover:border-orange-500">ISO</button>
                </div>

                {!ready || visibleThreeElements.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                        <div>
                            <p className="text-sm font-black uppercase tracking-tight text-zinc-800">
                                Escena 3D BIM en espera
                            </p>
                            <p className="mt-2 max-w-md text-sm text-zinc-500">
                                Carga o simula elementos BIM para materializar la escena 3D local.
                            </p>
                        </div>
                    </div>
                ) : null}
                <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-zinc-200 bg-white/90 px-2.5 py-1.5 text-[10px] text-zinc-600 shadow-sm">
                    <p className="font-semibold text-zinc-800">
                        {activeVersionLabel || 'Version BIM'} {activeStoreyName ? `Â· ${activeStoreyName}` : ''}
                    </p>
                    {raycastHit ? <p className="mt-0.5 text-orange-700">{raycastHit.ifcClass || 'IFC'} Â· {raycastHit.globalId || raycastHit.elementId}</p> : null}
                </div>
                {inspectedSceneElement && inspectorOpen ? (
                    <aside className="pointer-events-auto absolute right-3 top-3 w-[min(280px,calc(100%-1.5rem))] rounded-2xl border border-zinc-200 bg-white/95 p-3 text-[11px] shadow-sm">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                            Inspector 3D
                        </p>
                        <button type="button" aria-label="Cerrar inspector 3D" title="Cerrar inspector" onClick={() => setInspectorOpen(false)} className="absolute right-2 top-2 grid size-7 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                            <X className="size-3.5" aria-hidden="true" />
                        </button>
                        <p className="mt-1 truncate text-sm font-black uppercase tracking-tight text-zinc-900">
                            {inspectedSceneElement.name || inspectedSceneElement.element_type || 'Elemento BIM'}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-xl bg-zinc-50 px-2 py-1.5">
                                <p className="font-black uppercase tracking-[0.14em] text-zinc-400">Clase</p>
                                <p className="mt-1 truncate font-bold text-zinc-800">
                                    {inspectedSceneElement.ifc_class || 'IFC'}
                                </p>
                            </div>
                            <div className="rounded-xl bg-zinc-50 px-2 py-1.5">
                                <p className="font-black uppercase tracking-[0.14em] text-zinc-400">Props</p>
                                <p className="mt-1 font-bold text-zinc-800">{inspectedPropertyCount}</p>
                            </div>
                            <div className="col-span-2 rounded-xl bg-orange-50 px-2 py-1.5">
                                <p className="font-black uppercase tracking-[0.14em] text-[#C26F00]">GlobalId</p>
                                <p className="mt-1 truncate font-bold text-[#7C4A00]">
                                    {inspectedSceneElement.global_id || 'sin GlobalId'}
                                </p>
                            </div>
                            {inspectedMaterial || inspectedSystem ? (
                                <div className="col-span-2 rounded-xl bg-sky-50 px-2 py-1.5">
                                    <p className="font-black uppercase tracking-[0.14em] text-[#136191]">
                                        Material / sistema
                                    </p>
                                    <p className="mt-1 truncate font-bold text-[#0F4D73]">
                                        {[inspectedMaterial, inspectedSystem].filter(Boolean).join(' Â· ')}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </aside>
                ) : null}
            </div>
        </section>
    );
};

export default BimThreeViewer;
