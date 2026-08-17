import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Blend, Box, EyeOff, Focus, RefreshCw, RotateCcw, Ruler, ScanLine, View } from 'lucide-react';
import { FragmentsModels } from '@thatopen/fragments';
import fragmentsWorkerUrl from '@thatopen/fragments/worker?url';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { bimModelsApi } from '../../api/bimModels';
import useBimRenderQuality from '../../hooks/useBimRenderQuality';
import BimRenderQualityControl from './BimRenderQualityControl';

const REVIEW_BUTTON_CLASS =
    'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] disabled:cursor-not-allowed disabled:opacity-35';
const EMPTY_REVIEW_STATE = {
    hiddenCount: 0,
    hiddenLocalIds: [],
    isolated: false,
    ghosted: false,
    clipping: false,
    projection: 'perspective',
    measurement: null,
};

const buildViewerStateSnapshot = (runtime, data, versionId) => ({
    contract_version: 'giproy_bim_view_state_v2',
    source_version_id: versionId,
    camera: {
        projection: data.reviewState.projection,
        position: runtime?.camera?.position?.toArray?.() || [],
        target: runtime?.controls?.target?.toArray?.() || [],
    },
    selection: {
        global_id: data.selectedGuid || null,
        local_id: data.selectedLocalId || null,
    },
    visibility: {
        hidden_local_ids: data.reviewState.hiddenLocalIds || [],
        isolated: data.reviewState.isolated,
    },
    colors: [],
    filters: {},
    ghost: { enabled: data.reviewState.ghosted },
    clipping: { enabled: data.reviewState.clipping, offset: data.clipOffset },
    measurements: data.reviewState.measurement ? [data.reviewState.measurement] : [],
    units: data.measurementUnit,
});

const BimFragmentsViewport = ({
    projectId,
    versionId,
    empresaId,
    loadBytes = null,
    loadMemberBytes = null,
    onSelectGuid,
    onAvailabilityChange,
    onViewerStateChange,
    viewerStateToApply = null,
    onViewerStateApplied,
    federationMembers = [],
    temporalProfile = null,
    selectionProfile = null,
}) => {
    const mountRef = useRef(null);
    const onSelectGuidRef = useRef(onSelectGuid);
    const onAvailabilityRef = useRef(onAvailabilityChange);
    const runtimeRef = useRef(null);
    const presentationWasActiveRef = useRef(false);
    const focusedSelectionTokenRef = useRef(null);
    const onViewerStateChangeRef = useRef(onViewerStateChange);
    const onViewerStateAppliedRef = useRef(onViewerStateApplied);
    const viewerStateDataRef = useRef(null);
    const appliedViewStateTokenRef = useRef(null);
    const [state, setState] = useState({ status: 'idle', error: '', bytes: 0, localIds: 0, selectedGuid: '' });
    const [recoveryToken, setRecoveryToken] = useState(0);
    const [federationVisibleCount, setFederationVisibleCount] = useState(0);
    const [selectedLocalId, setSelectedLocalId] = useState(null);
    const [reviewState, setReviewState] = useState(EMPTY_REVIEW_STATE);
    const renderQuality = useBimRenderQuality();
    const [clipOffset, setClipOffset] = useState(0);
    const [measurementUnit, setMeasurementUnit] = useState(() => {
        if (typeof window === 'undefined') return 'm';
        return window.localStorage.getItem('giproy_bim_measurement_unit') || 'm';
    });
    const [temporalApplied, setTemporalApplied] = useState({ items: 0, hidden: 0, colors: 0 });
    const [selectionApplied, setSelectionApplied] = useState(0);
    const renderMembers = useMemo(() => {
        if (!federationMembers.length) return [{ version_id: versionId, enabled: true, transform: null }];
        return federationMembers;
    }, [federationMembers, versionId]);
    const federationStructureKey = useMemo(
        () => renderMembers.map((member) => `${member.version_id}:${JSON.stringify(member.transform || {})}`).join('|'),
        [renderMembers],
    );
    const federationVisibilityKey = useMemo(
        () => renderMembers.map((member) => `${member.version_id}:${member.enabled !== false}`).join('|'),
        [renderMembers],
    );

    useEffect(() => {
        onSelectGuidRef.current = onSelectGuid;
        onAvailabilityRef.current = onAvailabilityChange;
        onViewerStateChangeRef.current = onViewerStateChange;
        onViewerStateAppliedRef.current = onViewerStateApplied;
    }, [onAvailabilityChange, onSelectGuid, onViewerStateApplied, onViewerStateChange]);

    useEffect(() => {
        window.localStorage.setItem('giproy_bim_measurement_unit', measurementUnit);
    }, [measurementUnit]);

    useEffect(() => {
        viewerStateDataRef.current = { reviewState, selectedGuid: state.selectedGuid, selectedLocalId, clipOffset, measurementUnit };
        if (runtimeRef.current) {
            onViewerStateChangeRef.current?.(buildViewerStateSnapshot(runtimeRef.current, viewerStateDataRef.current, versionId));
        }
    }, [clipOffset, measurementUnit, reviewState, selectedLocalId, state.selectedGuid, versionId]);

    useEffect(() => {
        const mountNode = mountRef.current;
        if (!versionId || (!projectId && !loadBytes)) {
            onAvailabilityRef.current?.(false);
            setState({ status: 'idle', error: '', bytes: 0, localIds: 0, selectedGuid: '' });
            return undefined;
        }
        let disposed = false;
        let fragments = null;
        let renderer = null;
        let controls = null;
        let resizeObserver = null;
        let canvas = null;
        let handlePointerDown = null;
        let handleContextLost = null;

        const run = async () => {
            try {
                runtimeRef.current = null;
                setSelectedLocalId(null);
                setReviewState(EMPTY_REVIEW_STATE);
                setState((current) => ({ ...current, status: 'loading', error: '' }));
                let artifactBytes;
                let memberPayloads;
                if (loadMemberBytes) {
                    memberPayloads = (await Promise.all(renderMembers.map(async (member) => ({
                        ...member,
                        bytes: await loadMemberBytes(member),
                    })))).filter((member) => member.bytes?.byteLength);
                    artifactBytes = memberPayloads[0]?.bytes;
                } else if (loadBytes) {
                    artifactBytes = await loadBytes();
                    memberPayloads = [{ version_id: versionId, enabled: true, transform: null, bytes: artifactBytes }];
                } else {
                    memberPayloads = (await Promise.all(renderMembers.map(async (member) => {
                        const artifacts = await bimModelsApi.listArtifacts(projectId, member.version_id, empresaId);
                        const artifact = (artifacts || []).find((item) => item.artifact_type === 'fragments' && item.status === 'active');
                        if (!artifact) return null;
                        const bytes = await bimModelsApi.downloadArtifact(projectId, artifact.id, empresaId);
                        return { ...member, bytes };
                    }))).filter(Boolean);
                    artifactBytes = memberPayloads[0]?.bytes;
                }
                if (disposed) return;
                const mount = mountNode;
                if (!mount) throw new Error('No se pudo montar el canvas Fragments.');
                if (!artifactBytes?.byteLength || !memberPayloads?.length) throw new Error('No hay artifacts Fragments activos para la federacion.');

                fragments = new FragmentsModels(fragmentsWorkerUrl, { maxWorkers: 2 });
                const loadedModels = [];
                for (const member of memberPayloads) {
                    const loadedModel = await fragments.load(member.bytes, {
                        modelId: `giproy-bim-product-${member.version_id}`,
                        raw: false,
                        userData: { source: 'giproy-bim-federation', versionId: member.version_id },
                    });
                    if (typeof loadedModel.setupData === 'function') await loadedModel.setupData();
                    const transform = member.transform || {};
                    loadedModel.object.position.fromArray(transform.translation || [0, 0, 0]);
                    loadedModel.object.rotation.fromArray((transform.rotation_degrees || [0, 0, 0]).map(THREE.MathUtils.degToRad));
                    loadedModel.object.scale.fromArray(transform.scale || [1, 1, 1]);
                    loadedModel.object.visible = member.enabled !== false;
                    loadedModel.object.updateMatrixWorld(true);
                    loadedModels.push({ member, model: loadedModel });
                }
                const primaryEntry = loadedModels.find((entry) => Number(entry.member.version_id) === Number(versionId)) || loadedModels[0];
                const model = primaryEntry.model;

                const scene = new THREE.Scene();
                scene.background = new THREE.Color(0xf7f7f5);
                let camera = new THREE.PerspectiveCamera(42, 1, 0.01, 10000);
                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
                renderer.setPixelRatio(renderQuality.pixelRatio);
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                canvas = renderer.domElement;
                canvas.setAttribute('data-bim-fragments-product-canvas', 'true');
                mount.replaceChildren(canvas);
                scene.add(new THREE.AmbientLight(0xffffff, 1.15));
                const directional = new THREE.DirectionalLight(0xffffff, 0.75);
                directional.position.set(5, 8, 6);
                scene.add(directional, ...loadedModels.map((entry) => entry.model.object));

                controls = new OrbitControls(camera, canvas);
                controls.enableDamping = true;
                controls.dampingFactor = 0.08;
                const box = new THREE.Box3();
                loadedModels.filter((entry) => entry.member.enabled !== false).forEach((entry) => box.expandByObject(entry.model.object));
                const center = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
                const size = box.isEmpty() ? 8 : Math.max(box.getSize(new THREE.Vector3()).length(), 4);
                let projectionMode = 'perspective';
                let viewportWidth = 640;
                let viewportHeight = 520;
                const frameBounds = (bounds = box) => {
                    const targetCenter = bounds?.isEmpty?.() === false ? bounds.getCenter(new THREE.Vector3()) : center;
                    const targetSize = bounds?.isEmpty?.() === false ? Math.max(bounds.getSize(new THREE.Vector3()).length(), 1) : size;
                    controls.target.copy(targetCenter);
                    camera.position.set(targetCenter.x + targetSize * 0.72, targetCenter.y + targetSize * 0.55, targetCenter.z + targetSize * 0.9);
                    camera.near = Math.max(0.01, targetSize / 500);
                    camera.far = Math.max(1000, targetSize * 20);
                    camera.updateProjectionMatrix();
                    controls.update();
                };
                const frame = () => frameBounds(box);
                frame();

                const render = () => {
                    renderer.render(scene, camera);
                };
                const handleControlsChange = () => {
                    render();
                    if (runtimeRef.current && viewerStateDataRef.current) {
                        onViewerStateChangeRef.current?.(
                            buildViewerStateSnapshot(runtimeRef.current, viewerStateDataRef.current, versionId),
                        );
                    }
                };
                const resize = () => {
                    const width = Math.max(280, Math.floor(mount.clientWidth || 640));
                    const height = Math.max(360, Math.floor(mount.clientHeight || 520));
                    viewportWidth = width;
                    viewportHeight = height;
                    renderer.setSize(width, height, false);
                    if (camera.isPerspectiveCamera) {
                        camera.aspect = width / height;
                    } else {
                        const halfHeight = size * 0.62;
                        const halfWidth = halfHeight * (width / height);
                        camera.left = -halfWidth;
                        camera.right = halfWidth;
                        camera.top = halfHeight;
                        camera.bottom = -halfHeight;
                    }
                    camera.updateProjectionMatrix();
                    render();
                };
                resizeObserver = new ResizeObserver(resize);
                resizeObserver.observe(mount);
                controls.addEventListener('change', handleControlsChange);

                loadedModels.forEach((entry) => entry.model.useCamera?.(camera));
                await fragments.update(true);
                resize();
                const localIds = typeof model.getLocalIds === 'function' ? await model.getLocalIds() : [];
                const memberLocalIds = await Promise.all(loadedModels.map(async (entry) => ({
                    ...entry,
                    localIds: typeof entry.model.getLocalIds === 'function' ? await entry.model.getLocalIds() : [],
                })));

                const updateModel = async () => {
                    await fragments.update(true);
                    render();
                };
                const switchProjection = async (nextProjection) => {
                    if (nextProjection === projectionMode) return;
                    const previousPosition = camera.position.clone();
                    const previousTarget = controls.target.clone();
                    controls.removeEventListener('change', handleControlsChange);
                    controls.dispose();
                    if (nextProjection === 'orthographic') {
                        const halfHeight = size * 0.62;
                        const halfWidth = halfHeight * (viewportWidth / viewportHeight);
                        camera = new THREE.OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, 0.01, Math.max(1000, size * 20));
                    } else {
                        camera = new THREE.PerspectiveCamera(42, viewportWidth / viewportHeight, Math.max(0.01, size / 500), Math.max(1000, size * 20));
                    }
                    camera.position.copy(previousPosition);
                    controls = new OrbitControls(camera, canvas);
                    controls.enableDamping = true;
                    controls.dampingFactor = 0.08;
                    controls.target.copy(previousTarget);
                    controls.addEventListener('change', handleControlsChange);
                    projectionMode = nextProjection;
                    memberLocalIds.forEach((entry) => entry.model.useCamera?.(camera));
                    runtimeRef.current.camera = camera;
                    runtimeRef.current.controls = controls;
                    resize();
                };
                memberLocalIds.forEach((entry) => {
                    entry.model.getClippingPlanesEvent = () => runtimeRef.current?.clippingPlanes || [];
                });
                runtimeRef.current = {
                    model,
                    fragments,
                    renderer,
                    controls,
                    camera,
                    center,
                    size,
                    localIds,
                    models: memberLocalIds,
                    selectedLocalId: null,
                    clippingPlanes: [],
                    frame,
                    frameBounds,
                    render,
                    resize,
                    updateModel,
                    switchProjection,
                };

                handlePointerDown = async (event) => {
                    if (disposed) return;
                    let hit = null;
                    let hitModel = null;
                    for (const entry of memberLocalIds.filter((item) => item.model.object.visible)) {
                        const candidate = await entry.model.raycast?.({ camera, mouse: new THREE.Vector2(event.clientX, event.clientY), dom: canvas });
                        if (candidate?.localId && (!hit || candidate.distance < hit.distance)) {
                            hit = candidate;
                            hitModel = entry.model;
                        }
                    }
                    if (!hit?.localId || !hitModel) return;
                    const guids = typeof hitModel.getGuidsByLocalIds === 'function'
                        ? await hitModel.getGuidsByLocalIds([hit.localId])
                        : [];
                    const guid = guids[0] || '';
                    if (!disposed) {
                        runtimeRef.current.model = hitModel;
                        runtimeRef.current.localIds = memberLocalIds.find((entry) => entry.model === hitModel)?.localIds || [];
                        runtimeRef.current.selectedLocalId = hit.localId;
                        setSelectedLocalId(hit.localId);
                        setState((current) => ({ ...current, selectedGuid: guid }));
                        onSelectGuidRef.current?.(guid, hit.localId);
                    }
                };
                handleContextLost = (event) => {
                    event.preventDefault();
                    if (!disposed) {
                        setState((current) => ({ ...current, status: 'recovering', error: 'Contexto WebGL perdido.' }));
                        window.setTimeout(() => setRecoveryToken((value) => value + 1), 250);
                    }
                };
                canvas.addEventListener('pointerdown', handlePointerDown);
                canvas.addEventListener('webglcontextlost', handleContextLost);
                if (!disposed) {
                    onAvailabilityRef.current?.(true);
                    setState({
                        status: 'loaded',
                        error: '',
                        bytes: memberPayloads.reduce((total, member) => total + member.bytes.byteLength, 0),
                        localIds: memberLocalIds.reduce((total, member) => total + member.localIds.length, 0),
                        selectedGuid: '',
                    });
                    setFederationVisibleCount(memberPayloads.filter((member) => member.enabled !== false).length);
                }
            } catch (error) {
                if (!disposed) {
                    onAvailabilityRef.current?.(false);
                    setState((current) => ({ ...current, status: 'error', error: error?.message || 'No se pudo cargar Fragments.' }));
                }
            }
        };

        run();
        return () => {
            disposed = true;
            runtimeRef.current = null;
            resizeObserver?.disconnect();
            if (canvas && handlePointerDown) canvas.removeEventListener('pointerdown', handlePointerDown);
            if (canvas && handleContextLost) canvas.removeEventListener('webglcontextlost', handleContextLost);
            controls?.dispose();
            if (fragments) void fragments.dispose();
            renderer?.dispose();
            mountNode?.replaceChildren();
        };
    }, [empresaId, federationStructureKey, loadBytes, loadMemberBytes, projectId, recoveryToken, renderMembers, renderQuality.pixelRatio, versionId]);

    useEffect(() => {
        const runtime = runtimeRef.current;
        if (!runtime?.models) return;
        const enabledByVersion = new Map(renderMembers.map((member) => [Number(member.version_id), member.enabled !== false]));
        runtime.models.forEach((entry) => {
            entry.model.object.visible = enabledByVersion.get(Number(entry.member.version_id)) !== false;
        });
        setFederationVisibleCount(runtime.models.filter((entry) => entry.model.object.visible).length);
        runtime.render();
    }, [federationVisibilityKey, renderMembers]);

    const runReviewAction = async (action) => {
        if (temporalProfile) return;
        const runtime = runtimeRef.current;
        if (!runtime) return;
        try {
            const actionResult = await action(runtime);
            await runtime.updateModel();
            const visibility = await runtime.model.getVisible(runtime.localIds);
            const queriedHiddenCount = visibility.filter((visible) => !visible).length;
            const hiddenCount = Number.isInteger(actionResult?.hiddenCount)
                ? actionResult.hiddenCount
                : queriedHiddenCount;
            setReviewState((current) => ({
                ...current,
                hiddenCount,
                hiddenLocalIds: Array.isArray(actionResult?.hiddenLocalIds)
                    ? actionResult.hiddenLocalIds
                    : current.hiddenLocalIds,
            }));
        } catch (error) {
            setState((current) => ({ ...current, error: error?.message || 'No se pudo aplicar la herramienta BIM.' }));
        }
    };

    const hideSelected = () => runReviewAction(async ({ model, selectedLocalId: localId }) => {
        if (!localId) return undefined;
        await model.toggleVisible([localId]);
        const hiddenLocalIds = Array.from(new Set([...(reviewState.hiddenLocalIds || []), localId]));
        return { hiddenCount: hiddenLocalIds.length, hiddenLocalIds };
    });

    const isolateSelected = () => runReviewAction(async ({ model, localIds, selectedLocalId: localId }) => {
        if (!localId) return;
        await model.resetVisible();
        await model.toggleVisible(localIds);
        await model.toggleVisible([localId]);
        setReviewState((current) => ({ ...current, isolated: true }));
        const hiddenLocalIds = localIds.filter((id) => id !== localId);
        return { hiddenCount: hiddenLocalIds.length, hiddenLocalIds };
    });

    const toggleGhost = () => runReviewAction(async ({ model, localIds, selectedLocalId: localId }) => {
        const nextGhosted = !reviewState.ghosted;
        await model.resetOpacity(undefined);
        if (nextGhosted && localId) {
            await model.setOpacity(localIds.filter((id) => id !== localId), 0.16);
            await model.resetOpacity([localId]);
        }
        setReviewState((current) => ({ ...current, ghosted: nextGhosted }));
    });

    const applyClipping = (enabled, offset = clipOffset) => runReviewAction(async (runtime) => {
        runtime.clippingPlanes = enabled
            ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), runtime.center.y + offset * runtime.size * 0.5)]
            : [];
        runtime.renderer.localClippingEnabled = enabled;
        setReviewState((current) => ({ ...current, clipping: enabled }));
    });

    const toggleProjection = async () => {
        const runtime = runtimeRef.current;
        if (!runtime) return;
        const projection = reviewState.projection === 'perspective' ? 'orthographic' : 'perspective';
        try {
            await runtime.switchProjection(projection);
            setReviewState((current) => ({ ...current, projection }));
        } catch (error) {
            setState((current) => ({ ...current, error: error?.message || 'No se pudo cambiar la proyección.' }));
        }
    };

    const measureSelected = () => runReviewAction(async ({ model, selectedLocalId: localId }) => {
        if (!localId) return;
        const [volume, mergedBox] = await Promise.all([
            model.getItemsVolume([localId]),
            model.getMergedBox([localId]),
        ]);
        const dimensions = mergedBox.getSize(new THREE.Vector3());
        setReviewState((current) => ({
            ...current,
            measurement: { volume, x: dimensions.x, y: dimensions.y, z: dimensions.z },
        }));
    });

    const resetReview = () => runReviewAction(async (runtime) => {
        await runtime.model.resetVisible();
        await runtime.model.resetOpacity(undefined);
        await runtime.model.resetHighlight();
        runtime.clippingPlanes = [];
        runtime.renderer.localClippingEnabled = false;
        if (reviewState.projection !== 'perspective') await runtime.switchProjection('perspective');
        runtime.frame();
        setClipOffset(0);
        setReviewState(EMPTY_REVIEW_STATE);
        return { hiddenCount: 0, hiddenLocalIds: [] };
    });

    useEffect(() => {
        const runtime = runtimeRef.current;
        if (!runtime || state.status !== 'loaded' || !viewerStateToApply) return undefined;
        const applyToken = viewerStateToApply.apply_token || JSON.stringify(viewerStateToApply);
        if (appliedViewStateTokenRef.current === applyToken) return undefined;
        appliedViewStateTokenRef.current = applyToken;
        if (
            viewerStateToApply.contract_version !== 'giproy_bim_view_state_v2' ||
            Number(viewerStateToApply.source_version_id) !== Number(versionId)
        ) {
            onViewerStateAppliedRef.current?.({ status: 'incompatible', source_version_id: viewerStateToApply.source_version_id });
            return undefined;
        }

        let cancelled = false;
        const applyViewerState = async () => {
            try {
                const selectionGuid = viewerStateToApply.selection?.global_id || null;
                const selectedIds = selectionGuid && typeof runtime.model.getLocalIdsByGuids === 'function'
                    ? await runtime.model.getLocalIdsByGuids([selectionGuid])
                    : [];
                const appliedLocalId = selectedIds[0] || viewerStateToApply.selection?.local_id || null;
                const requestedProjection = viewerStateToApply.camera?.projection === 'orthographic' ? 'orthographic' : 'perspective';
                await runtime.switchProjection(requestedProjection);
                const position = viewerStateToApply.camera?.position;
                const target = viewerStateToApply.camera?.target;
                if (Array.isArray(position) && position.length === 3) runtime.camera.position.fromArray(position);
                if (Array.isArray(target) && target.length === 3) runtime.controls.target.fromArray(target);
                runtime.controls.update();

                await runtime.model.resetVisible();
                const validLocalIds = new Set(runtime.localIds);
                const hiddenLocalIds = (viewerStateToApply.visibility?.hidden_local_ids || [])
                    .filter((localId) => validLocalIds.has(localId));
                if (hiddenLocalIds.length > 0) await runtime.model.toggleVisible(hiddenLocalIds);
                await runtime.model.resetOpacity(undefined);
                if (viewerStateToApply.ghost?.enabled && appliedLocalId) {
                    await runtime.model.setOpacity(runtime.localIds.filter((id) => id !== appliedLocalId), 0.16);
                    await runtime.model.resetOpacity([appliedLocalId]);
                }
                await runtime.model.resetColor(undefined);
                for (const colorOverride of viewerStateToApply.colors || []) {
                    const localIds = (colorOverride.local_ids || []).filter((localId) => validLocalIds.has(localId));
                    if (localIds.length > 0 && colorOverride.color != null) {
                        await runtime.model.setColor(localIds, new THREE.Color(colorOverride.color));
                    }
                }

                const clippingEnabled = Boolean(viewerStateToApply.clipping?.enabled);
                const appliedClipOffset = Number(viewerStateToApply.clipping?.offset || 0);
                runtime.clippingPlanes = clippingEnabled
                    ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), runtime.center.y + appliedClipOffset * runtime.size * 0.5)]
                    : [];
                runtime.renderer.localClippingEnabled = clippingEnabled;
                await runtime.updateModel();
                if (cancelled) return;

                const measurement = viewerStateToApply.measurements?.[0] || null;
                runtime.selectedLocalId = appliedLocalId;
                setSelectedLocalId(appliedLocalId);
                setClipOffset(appliedClipOffset);
                setMeasurementUnit(viewerStateToApply.units === 'mm' ? 'mm' : 'm');
                setState((current) => ({ ...current, selectedGuid: selectionGuid || '' }));
                if (selectionGuid) onSelectGuidRef.current?.(selectionGuid, appliedLocalId);
                setReviewState({
                    hiddenCount: hiddenLocalIds.length,
                    hiddenLocalIds,
                    isolated: Boolean(viewerStateToApply.visibility?.isolated),
                    ghosted: Boolean(viewerStateToApply.ghost?.enabled),
                    clipping: clippingEnabled,
                    projection: requestedProjection,
                    measurement,
                });
                onViewerStateAppliedRef.current?.({ status: 'applied', source_version_id: versionId });
            } catch (error) {
                if (!cancelled) {
                    onViewerStateAppliedRef.current?.({ status: 'error', message: error?.message || 'No se pudo reproducir la vista.' });
                }
            }
        };
        void applyViewerState();
        return () => {
            cancelled = true;
        };
    }, [state.status, versionId, viewerStateToApply]);

    useEffect(() => {
        const runtime = runtimeRef.current;
        if (!runtime || state.status !== 'loaded') return undefined;
        let cancelled = false;
        const applyPresentation = async () => {
            try {
                const selectionGuids = Array.from(new Set((selectionProfile?.guids || []).filter(Boolean)));
                const hasPresentation = Boolean(temporalProfile) || selectionGuids.length > 0;
                if (!hasPresentation && !presentationWasActiveRef.current) return;
                const modelEntries = runtime.models?.length
                    ? runtime.models
                    : [{ model: runtime.model, localIds: runtime.localIds, member: { version_id: versionId } }];

                for (const entry of modelEntries) {
                    await entry.model.resetVisible();
                    await entry.model.resetOpacity(undefined);
                    await entry.model.resetColor(undefined);
                }

                let temporalItems = 0;
                let temporalHidden = 0;
                const temporalColors = new Set();
                if (temporalProfile) {
                    for (const entry of modelEntries) {
                        const memberVersionId = entry.member?.version_id ?? versionId;
                        const items = (temporalProfile.items || []).filter((item) => Number(item.version_id) === Number(memberVersionId));
                        const resolved = await Promise.all(items.map(async (item) => ({
                            item,
                            localIds: typeof entry.model.getLocalIdsByGuids === 'function'
                                ? await entry.model.getLocalIdsByGuids([item.global_id])
                                : [],
                        })));
                        const hidden = resolved.filter(({ item }) => !item.visible).flatMap(({ localIds }) => localIds);
                        if (hidden.length) await entry.model.toggleVisible(hidden);
                        const byColor = new Map();
                        resolved.filter(({ item }) => item.visible).forEach(({ item, localIds }) => {
                            const ids = byColor.get(item.color) || [];
                            byColor.set(item.color, [...ids, ...localIds]);
                        });
                        for (const [color, localIds] of byColor.entries()) {
                            if (localIds.length) await entry.model.setColor(localIds, new THREE.Color(color));
                            temporalColors.add(color);
                        }
                        temporalItems += resolved.length;
                        temporalHidden += hidden.length;
                    }
                } else {
                    if (reviewState.hiddenLocalIds.length) await runtime.model.toggleVisible(reviewState.hiddenLocalIds);
                    if (reviewState.ghosted && selectedLocalId) {
                        await runtime.model.setOpacity(runtime.localIds.filter((id) => id !== selectedLocalId), 0.16);
                        await runtime.model.resetOpacity([selectedLocalId]);
                    }
                }

                const selectedByModel = [];
                for (const entry of modelEntries) {
                    const localIds = selectionGuids.length && typeof entry.model.getLocalIdsByGuids === 'function'
                        ? await entry.model.getLocalIdsByGuids(selectionGuids)
                        : [];
                    if (localIds.length) {
                        await entry.model.setColor(localIds, new THREE.Color('#2563eb'));
                        await entry.model.resetOpacity(localIds);
                        selectedByModel.push({ entry, localIds });
                    }
                }

                const primaryGuid = selectionProfile?.primaryGuid || selectionGuids[0] || '';
                let primarySelection = null;
                if (primaryGuid) {
                    for (const entry of modelEntries) {
                        const localIds = typeof entry.model.getLocalIdsByGuids === 'function'
                            ? await entry.model.getLocalIdsByGuids([primaryGuid])
                            : [];
                        if (localIds.length) {
                            await entry.model.setColor(localIds, new THREE.Color('#F39200'));
                            primarySelection = { entry, localId: localIds[0] };
                            break;
                        }
                    }
                }

                if (primarySelection) {
                    runtime.model = primarySelection.entry.model;
                    runtime.localIds = primarySelection.entry.localIds;
                    runtime.selectedLocalId = primarySelection.localId;
                    setSelectedLocalId(primarySelection.localId);
                    setState((current) => ({ ...current, selectedGuid: primaryGuid }));
                } else if (!selectionGuids.length) {
                    runtime.selectedLocalId = null;
                    setSelectedLocalId(null);
                    setState((current) => ({ ...current, selectedGuid: '' }));
                }

                const focusToken = selectionProfile?.focusToken;
                if (focusToken && focusedSelectionTokenRef.current !== focusToken && selectedByModel.length) {
                    const bounds = new THREE.Box3();
                    for (const selection of selectedByModel) {
                        const box = await selection.entry.model.getMergedBox?.(selection.localIds);
                        if (box?.isBox3) bounds.union(box);
                    }
                    if (!bounds.isEmpty()) runtime.frameBounds(bounds);
                    focusedSelectionTokenRef.current = focusToken;
                }

                presentationWasActiveRef.current = hasPresentation;
                await runtime.updateModel();
                if (!cancelled) {
                    setTemporalApplied({ items: temporalItems, hidden: temporalHidden, colors: temporalColors.size });
                    setSelectionApplied(selectedByModel.reduce((total, selection) => total + selection.localIds.length, 0));
                }
            } catch (error) {
                if (!cancelled) setState((current) => ({ ...current, error: error?.message || 'No se pudo aplicar la presentación 4D.' }));
            }
        };
        void applyPresentation();
        return () => { cancelled = true; };
    }, [reviewState.ghosted, reviewState.hiddenLocalIds, selectedLocalId, selectionProfile, state.status, temporalProfile, versionId]);

    const measurementFactor = measurementUnit === 'mm' ? 1000 : 1;
    const measurementVolumeFactor = measurementUnit === 'mm' ? 1_000_000_000 : 1;

    if ((!versionId && state.status === 'idle') || state.status === 'missing') return null;

    return (
        <section
            className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white"
            data-bim-fragments-product={state.status}
            data-bim-fragments-product-bytes={state.bytes}
            data-bim-fragments-product-local-ids={state.localIds}
            data-bim-fragments-product-selection={state.selectedGuid}
            data-bim-review-hidden={reviewState.hiddenCount}
            data-bim-review-isolated={reviewState.isolated}
            data-bim-review-ghosted={reviewState.ghosted}
            data-bim-review-clipping={reviewState.clipping}
            data-bim-review-projection={reviewState.projection}
            data-bim-review-measured={Boolean(reviewState.measurement)}
            data-bim-temporal-cutoff={temporalProfile?.cutoff || ''}
            data-bim-temporal-active={Boolean(temporalProfile)}
            data-bim-temporal-items={temporalApplied.items}
            data-bim-temporal-hidden={temporalApplied.hidden}
            data-bim-temporal-colors={temporalApplied.colors}
            data-bim-planning-selection={selectionApplied}
            data-bim-federation-models={runtimeRef.current?.models?.length || 0}
            data-bim-federation-visible={federationVisibleCount}
            data-bim-render-pixel-ratio={renderQuality.pixelRatio}
        >
            <div className="flex min-h-11 items-center justify-between gap-3 border-b border-zinc-200 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                    <Box className="h-4 w-4 shrink-0 text-[#F39200]" />
                    <h3 className="truncate text-xs font-black text-zinc-900">Viewport Fragments</h3>
                    <span className="text-[10px] font-semibold text-zinc-500">{state.localIds} elementos</span>
                </div>
                <div className="flex items-center gap-1">
                    <BimRenderQualityControl {...renderQuality} />
                    <button type="button" onClick={resetReview} disabled={Boolean(temporalProfile)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-35" title="Restablecer revisión BIM" aria-label="Restablecer revisión BIM">
                        <RotateCcw className="h-4 w-4" />
                    </button>
                    {state.status === 'error' || state.status === 'recovering' ? (
                        <button type="button" onClick={() => setRecoveryToken((value) => value + 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50" title="Reintentar carga Fragments" aria-label="Reintentar carga Fragments">
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>
            </div>
            <div className="flex min-h-10 flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50 px-3 py-1.5" aria-label="Herramientas de revisión BIM">
                <button type="button" onClick={hideSelected} disabled={!selectedLocalId || Boolean(temporalProfile)} className={REVIEW_BUTTON_CLASS} title="Ocultar selección" aria-label="Ocultar selección"><EyeOff className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={isolateSelected} disabled={!selectedLocalId || Boolean(temporalProfile)} className={REVIEW_BUTTON_CLASS} title="Aislar selección" aria-label="Aislar selección"><Focus className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={toggleGhost} disabled={!selectedLocalId || Boolean(temporalProfile)} className={`${REVIEW_BUTTON_CLASS} ${reviewState.ghosted ? 'border-[#F39200] text-[#F39200]' : ''}`} title="Alternar ghost" aria-label="Alternar ghost" aria-pressed={reviewState.ghosted}><Blend className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => applyClipping(!reviewState.clipping)} disabled={Boolean(temporalProfile)} className={`${REVIEW_BUTTON_CLASS} ${reviewState.clipping ? 'border-[#F39200] text-[#F39200]' : ''}`} title="Alternar plano de corte" aria-label="Alternar plano de corte" aria-pressed={reviewState.clipping}><ScanLine className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={measureSelected} disabled={!selectedLocalId || Boolean(temporalProfile)} className={REVIEW_BUTTON_CLASS} title="Medir selección" aria-label="Medir selección"><Ruler className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={toggleProjection} disabled={Boolean(temporalProfile)} className={`${REVIEW_BUTTON_CLASS} ${reviewState.projection === 'orthographic' ? 'border-[#F39200] text-[#F39200]' : ''}`} title="Alternar proyección" aria-label="Alternar proyección" aria-pressed={reviewState.projection === 'orthographic'}><View className="h-3.5 w-3.5" /></button>
                {reviewState.clipping ? (
                    <label className="ml-1 flex min-w-28 flex-1 items-center gap-2 text-[10px] font-medium text-zinc-500">
                        Corte
                        <input
                            type="range"
                            min="-1"
                            max="1"
                            step="0.05"
                            value={clipOffset}
                            onChange={(event) => {
                                const nextOffset = Number(event.target.value);
                                setClipOffset(nextOffset);
                                void applyClipping(true, nextOffset);
                            }}
                            className="min-w-20 flex-1 accent-[#F39200]"
                            aria-label="Posición del plano de corte"
                        />
                    </label>
                ) : null}
                {reviewState.measurement ? (
                    <div className="ml-auto flex min-w-0 items-center gap-2 text-[10px] text-zinc-600" data-bim-review-measurement>
                        <span className="truncate font-semibold">
                            {`${(reviewState.measurement.x * measurementFactor).toFixed(2)} × ${(reviewState.measurement.y * measurementFactor).toFixed(2)} × ${(reviewState.measurement.z * measurementFactor).toFixed(2)} ${measurementUnit}`}
                        </span>
                        <span className="truncate text-zinc-400">{(reviewState.measurement.volume * measurementVolumeFactor).toFixed(2)} {measurementUnit}³</span>
                        <select value={measurementUnit} onChange={(event) => setMeasurementUnit(event.target.value)} className="h-7 rounded-md border border-zinc-200 bg-white px-1 text-[10px]" aria-label="Unidad de medición"><option value="m">m</option><option value="mm">mm</option></select>
                    </div>
                ) : null}
            </div>
            <div ref={mountRef} className="relative min-h-[360px] flex-1 bg-[#f7f7f5]" />
            {state.error ? <p className="border-t border-zinc-100 px-3 py-2 text-xs font-semibold text-rose-700" role="alert">{state.error}</p> : null}
        </section>
    );
};

export default BimFragmentsViewport;
