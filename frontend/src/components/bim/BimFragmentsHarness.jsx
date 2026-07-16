import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Cuboid, EyeOff, RotateCcw } from 'lucide-react';
import { FragmentsModels } from '@thatopen/fragments';
import fragmentsWorkerUrl from '@thatopen/fragments/worker?url';

import { getBimFragmentsSmokeBytes } from './bimFragmentsBinaryFixture';

const buildCategoryMatcher = (category) => new RegExp(`^${String(category || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

const readCategoryMetrics = async (model, category) => {
    if (!model || !category || typeof model.getItemsOfCategories !== 'function') {
        return {
            categoryLocalIdCount: 0,
            categoryVisibleCount: 0,
            categoryHiddenCount: 0,
            categoryVolume: 0,
            categoryBoxAvailable: 0,
            categoryMaterialDefinitionCount: 0,
            categorySubsetBytes: 0,
            categoryItemDataCount: 0,
            categoryItemKeyCount: 0,
            categoryItemKeys: '',
        };
    }
    const categoryItems = await model.getItemsOfCategories([buildCategoryMatcher(category)]);
    const localIds = Object.values(categoryItems || {}).flat();
    const sampleLocalIds = localIds.slice(0, 8);
    const [visibility, volume, mergedBox, materialDefinitions, subsetBuffer, categoryItemData] = await Promise.all([
        localIds.length > 0 && typeof model.getVisible === 'function' ? model.getVisible(localIds) : [],
        localIds.length > 0 && typeof model.getItemsVolume === 'function' ? model.getItemsVolume(localIds) : 0,
        localIds.length > 0 && typeof model.getMergedBox === 'function' ? model.getMergedBox(localIds) : null,
        localIds.length > 0 && typeof model.getItemsMaterialDefinition === 'function'
            ? model.getItemsMaterialDefinition(localIds)
            : [],
        localIds.length > 0 && typeof model.getSubsetBuffer === 'function' ? model.getSubsetBuffer(localIds, false) : null,
        sampleLocalIds.length > 0 && typeof model.getItemsData === 'function'
            ? model.getItemsData(sampleLocalIds, { attributesDefault: true })
            : [],
    ]);
    const categoryVisibleCount = visibility.filter(Boolean).length;
    const categoryItemKeys = Array.from(
        new Set(
            categoryItemData
                .flatMap((item) => Object.keys(item || {}))
                .filter((key) => !key.startsWith('_'))
                .slice(0, 8),
        ),
    );
    return {
        categoryLocalIdCount: localIds.length,
        categoryVisibleCount,
        categoryHiddenCount: Math.max(0, localIds.length - categoryVisibleCount),
        categoryVolume: Number.isFinite(volume) ? Number(volume.toFixed(3)) : 0,
        categoryBoxAvailable: mergedBox && !mergedBox.isEmpty?.() ? 1 : 0,
        categoryMaterialDefinitionCount: materialDefinitions.length,
        categorySubsetBytes: subsetBuffer?.byteLength || 0,
        categoryItemDataCount: categoryItemData.length,
        categoryItemKeyCount: categoryItemKeys.length,
        categoryItemKeys: categoryItemKeys.join(','),
    };
};

const readVisibilityTotals = async (model) => {
    if (!model || typeof model.getItemsByVisibility !== 'function') {
        return { totalVisibleCount: 0, totalHiddenCount: 0 };
    }
    const [visible, hidden] = await Promise.all([model.getItemsByVisibility(true), model.getItemsByVisibility(false)]);
    return {
        totalVisibleCount: visible.length,
        totalHiddenCount: hidden.length,
    };
};

const readItemDataValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object' && 'value' in value) return readItemDataValue(value.value);
    return '';
};

const summarizeItemData = (sampleItem, fallbackGuid, fallbackType = '') => {
    const item = sampleItem && typeof sampleItem === 'object' ? sampleItem : {};
    const keys = Object.keys(item);
    const visibleKeys = keys.filter((key) => !key.startsWith('_')).slice(0, 6);
    const category = Array.isArray(item.category) ? item.category.join(',') : item.category || '';
    return {
        sampleItemKeyCount: keys.length,
        sampleItemKeys: visibleKeys.join(','),
        sampleItemGuid:
            readItemDataValue(item.GlobalId) ||
            readItemDataValue(item.globalId) ||
            readItemDataValue(item.guid) ||
            fallbackGuid ||
            '',
        sampleItemName: readItemDataValue(item.Name) || readItemDataValue(item.name) || readItemDataValue(item.LongName),
        sampleItemType:
            readItemDataValue(item.ObjectType) ||
            readItemDataValue(item.PredefinedType) ||
            readItemDataValue(item.type) ||
            category ||
            fallbackType,
    };
};

const resolveSampleCategory = async (model, categories, sampleLocalId, sampleItem) => {
    const itemCategory = Array.isArray(sampleItem.category) ? sampleItem.category.join(',') : sampleItem.category || '';
    if (itemCategory || !sampleLocalId || typeof model.getItemsOfCategories !== 'function') return itemCategory;
    for (const category of categories) {
        const categoryItems = await model.getItemsOfCategories([buildCategoryMatcher(category)]);
        const localIds = Object.values(categoryItems || {}).flat();
        if (localIds.includes(sampleLocalId)) return category;
    }
    return '';
};

const summarizeSpatialTree = (node, depth = 1) => {
    if (!node || typeof node !== 'object') {
        return { spatialNodeCount: 0, spatialDepth: 0, spatialRootChildren: 0, spatialRootName: '' };
    }
    const children = Array.isArray(node.children) ? node.children : [];
    const childSummaries = children.map((child) => summarizeSpatialTree(child, depth + 1));
    const childNodeCount = childSummaries.reduce((total, summary) => total + summary.spatialNodeCount, 0);
    const childDepth = childSummaries.reduce((max, summary) => Math.max(max, summary.spatialDepth), depth);
    const rootName =
        readItemDataValue(node.Name) ||
        readItemDataValue(node.name) ||
        readItemDataValue(node.type) ||
        readItemDataValue(node.category);
    return {
        spatialNodeCount: 1 + childNodeCount,
        spatialDepth: childDepth,
        spatialRootChildren: children.length,
        spatialRootName: rootName,
    };
};

const summarizeGeometryData = async (model, sampleLocalId) => {
    if (!model || !sampleLocalId) {
        return {
            geometryItemCount: 0,
            sampleBoxCount: 0,
            sampleVolume: 0,
            materialDefinitionCount: 0,
        };
    }
    const [geometryItems, boxes, volume, materialDefinitions] = await Promise.all([
        typeof model.getItemsWithGeometry === 'function' ? model.getItemsWithGeometry() : [],
        typeof model.getBoxes === 'function' ? model.getBoxes([sampleLocalId]) : [],
        typeof model.getItemsVolume === 'function' ? model.getItemsVolume([sampleLocalId]) : 0,
        typeof model.getItemsMaterialDefinition === 'function' ? model.getItemsMaterialDefinition([sampleLocalId]) : [],
    ]);
    return {
        geometryItemCount: geometryItems.length,
        sampleBoxCount: boxes.length,
        sampleVolume: Number.isFinite(volume) ? Number(volume.toFixed(3)) : 0,
        materialDefinitionCount: materialDefinitions.length,
    };
};

const summarizeTraceRoundtrip = async (model, sampleLocalId) => {
    if (!model || !sampleLocalId) {
        return {
            roundtripGuid: '',
            roundtripLocalId: '',
            roundtripMatched: 0,
        };
    }
    const guidResults =
        typeof model.getGuidsByLocalIds === 'function' ? await model.getGuidsByLocalIds([sampleLocalId]) : [];
    const roundtripGuid = guidResults[0] || '';
    const localIdResults =
        roundtripGuid && typeof model.getLocalIdsByGuids === 'function'
            ? await model.getLocalIdsByGuids([roundtripGuid])
            : [];
    const roundtripLocalId = localIdResults[0];
    return {
        roundtripGuid,
        roundtripLocalId: roundtripLocalId ? String(roundtripLocalId) : '',
        roundtripMatched: roundtripLocalId === sampleLocalId ? 1 : 0,
    };
};

const readNativeRaycast = async (model, camera, canvas, categories = [], priorityMouseAttempts = []) => {
    if (!model || !camera || !canvas || typeof model.raycast !== 'function') {
        return {
            nativeRaycastState: 'unavailable',
            nativeRaycastLocalId: '',
            nativeRaycastGuid: '',
            nativeRaycastDistance: '',
            nativeSelectionKeyCount: 0,
            nativeSelectionKeys: '',
            nativeSelectionName: '',
            nativeSelectionType: '',
            nativeSelectionCategory: '',
            nativeSelectionVisible: '',
        };
    }

    const rect = canvas.getBoundingClientRect();
    const fallbackMouseAttempts = [
        new THREE.Vector2(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5),
        new THREE.Vector2(rect.left + rect.width * 0.45, rect.top + rect.height * 0.5),
        new THREE.Vector2(rect.left + rect.width * 0.55, rect.top + rect.height * 0.5),
        new THREE.Vector2(rect.left + rect.width * 0.5, rect.top + rect.height * 0.45),
        new THREE.Vector2(rect.left + rect.width * 0.5, rect.top + rect.height * 0.55),
    ];
    const mouseAttempts =
        priorityMouseAttempts.length > 0 ? [...priorityMouseAttempts, ...fallbackMouseAttempts] : fallbackMouseAttempts;
    for (const mouse of mouseAttempts) {
        const hit = await model.raycast({ camera, mouse, dom: canvas });
        if (hit?.localId) {
            const guids =
                typeof model.getGuidsByLocalIds === 'function' ? await model.getGuidsByLocalIds([hit.localId]) : [];
            const nativeItemData =
                typeof model.getItemsData === 'function'
                    ? await model.getItemsData([hit.localId], { attributesDefault: true })
                    : [];
            const nativeCategory = await resolveSampleCategory(model, categories, hit.localId, nativeItemData[0] || {});
            const nativeItemSummary = summarizeItemData(nativeItemData[0] || {}, guids[0] || '', nativeCategory);
            const nativeVisibility =
                typeof model.getVisible === 'function' ? await model.getVisible([hit.localId]) : [];
            return {
                nativeRaycastState: 'hit',
                nativeRaycastLocalId: String(hit.localId),
                nativeRaycastGuid: guids[0] || '',
                nativeRaycastDistance: Number.isFinite(hit.distance) ? Number(hit.distance.toFixed(3)) : '',
                nativeSelectionKeyCount: nativeItemSummary.sampleItemKeyCount,
                nativeSelectionKeys: nativeItemSummary.sampleItemKeys,
                nativeSelectionName: nativeItemSummary.sampleItemName,
                nativeSelectionType: nativeItemSummary.sampleItemType,
                nativeSelectionCategory: nativeCategory,
                nativeSelectionVisible: nativeVisibility[0] === false ? '0' : '1',
            };
        }
    }

    return {
        nativeRaycastState: 'miss',
        nativeRaycastLocalId: '',
        nativeRaycastGuid: '',
        nativeRaycastDistance: '',
        nativeSelectionKeyCount: 0,
        nativeSelectionKeys: '',
        nativeSelectionName: '',
        nativeSelectionType: '',
        nativeSelectionCategory: '',
        nativeSelectionVisible: '',
    };
};

const BimFragmentsHarness = ({ modelId = 'giproy-bim-fragments-harness' }) => {
    const nativeCanvasMountRef = useRef(null);
    const nativeSceneRef = useRef(null);
    const nativeCameraRef = useRef(null);
    const nativeRendererRef = useRef(null);
    const modelRef = useRef(null);
    const fragmentsRef = useRef(null);
    const [status, setStatus] = useState({
        state: 'idle',
        bytes: 0,
        modelCount: 0,
        localIdCount: 0,
        guidCount: 0,
        itemDataCount: 0,
        sampleLocalId: '',
        sampleGuid: '',
        sampleCategory: '',
        sampleItemKeyCount: 0,
        sampleItemKeys: '',
        sampleItemGuid: '',
        sampleItemName: '',
        sampleItemType: '',
        spatialNodeCount: 0,
        spatialDepth: 0,
        spatialRootChildren: 0,
        spatialRootName: '',
        geometryItemCount: 0,
        sampleBoxCount: 0,
        sampleVolume: 0,
        materialDefinitionCount: 0,
        roundtripGuid: '',
        roundtripLocalId: '',
        roundtripMatched: 0,
        categories: [],
        activeCategory: '',
        categoryLocalIdCount: 0,
        categoryVisibleCount: 0,
        categoryHiddenCount: 0,
        categoryVolume: 0,
        categoryBoxAvailable: 0,
        categoryMaterialDefinitionCount: 0,
        categorySubsetBytes: 0,
        categoryItemDataCount: 0,
        categoryItemKeyCount: 0,
        categoryItemKeys: '',
        nativeRaycastState: 'idle',
        nativeRaycastLocalId: '',
        nativeRaycastGuid: '',
        nativeRaycastDistance: '',
        nativeSelectionKeyCount: 0,
        nativeSelectionKeys: '',
        nativeSelectionName: '',
        nativeSelectionType: '',
        nativeSelectionCategory: '',
        nativeSelectionVisible: '',
        nativeCategoryFilter: 'all',
        nativeCategoryFilteredLocalIds: 0,
        totalVisibleCount: 0,
        totalHiddenCount: 0,
        operation: '',
        error: '',
    });
    const loaded = status.state === 'loaded';
    const statusLabel = useMemo(() => {
        if (loaded) return 'Fragments consultables';
        if (status.state === 'error') return 'Fragments error';
        if (status.state === 'loading') return 'Fragments cargando';
        return 'Fragments listo';
    }, [loaded, status.state]);

    const renderNativeCanvas = () => {
        if (nativeRendererRef.current && nativeSceneRef.current && nativeCameraRef.current) {
            nativeRendererRef.current.render(nativeSceneRef.current, nativeCameraRef.current);
        }
    };

    useEffect(() => {
        let disposed = false;
        let fragments = null;

        const run = async () => {
            setStatus((current) => ({ ...current, state: 'loading', error: '' }));
            try {
                const fragmentsBytes = getBimFragmentsSmokeBytes();
                fragments = new FragmentsModels(fragmentsWorkerUrl, { maxWorkers: 2 });
                const model = await fragments.load(fragmentsBytes, {
                    modelId,
                    raw: false,
                    userData: { source: 'giproy-bim-fragments-harness' },
                });
                if (typeof model.setupData === 'function') {
                    await model.setupData();
                }
                await fragments.update(true);

                if (disposed) return;
                const localIds = typeof model.getLocalIds === 'function' ? await model.getLocalIds() : [];
                const guids = typeof model.getGuids === 'function' ? await model.getGuids() : [];
                const sampleLocalId = localIds[0];
                const itemData =
                    sampleLocalId && typeof model.getItemsData === 'function'
                        ? await model.getItemsData([sampleLocalId], { attributesDefault: true })
                        : [];
                const categories = typeof model.getCategories === 'function' ? await model.getCategories() : [];
                const sampleItem = itemData[0] || {};
                const resolvedSampleCategory = await resolveSampleCategory(model, categories, sampleLocalId, sampleItem);
                const itemDataSummary = summarizeItemData(sampleItem, guids[0] || '', resolvedSampleCategory);
                const spatialTree =
                    typeof model.getSpatialStructure === 'function' ? await model.getSpatialStructure() : null;
                const spatialSummary = summarizeSpatialTree(spatialTree);
                const geometrySummary = await summarizeGeometryData(model, sampleLocalId);
                const traceRoundtrip = await summarizeTraceRoundtrip(model, sampleLocalId);
                const activeCategory = categories.find((category) => /WALL/i.test(category)) || categories[0] || '';
                const categoryMetrics = await readCategoryMetrics(model, activeCategory);
                const visibilityTotals = await readVisibilityTotals(model);
                modelRef.current = model;
                fragmentsRef.current = fragments;
                setStatus({
                    state: 'loaded',
                    bytes: fragmentsBytes.byteLength,
                    modelCount: fragments.models?.list?.size || 1,
                    localIdCount: localIds.length,
                    guidCount: guids.length,
                    itemDataCount: itemData.length,
                    sampleLocalId: sampleLocalId ? String(sampleLocalId) : '',
                    sampleGuid: guids[0] || '',
                    sampleCategory: resolvedSampleCategory,
                    ...itemDataSummary,
                    ...spatialSummary,
                    ...geometrySummary,
                    ...traceRoundtrip,
                    categories,
                    activeCategory,
                    ...categoryMetrics,
                    ...visibilityTotals,
                    nativeRaycastState: 'pending',
                    nativeRaycastLocalId: '',
                    nativeRaycastGuid: '',
                    nativeRaycastDistance: '',
                    nativeSelectionKeyCount: 0,
                    nativeSelectionKeys: '',
                    nativeSelectionName: '',
                    nativeSelectionType: '',
                    nativeSelectionCategory: '',
                    nativeSelectionVisible: '',
                    nativeCategoryFilter: 'all',
                    nativeCategoryFilteredLocalIds: 0,
                    operation: 'categoria lista',
                    error: '',
                });
            } catch (error) {
                if (!disposed) {
                    setStatus({
                        state: 'error',
                        bytes: 0,
                        modelCount: 0,
                        localIdCount: 0,
                        guidCount: 0,
                        itemDataCount: 0,
                        sampleLocalId: '',
                        sampleGuid: '',
                        sampleCategory: '',
                        sampleItemKeyCount: 0,
                        sampleItemKeys: '',
                        sampleItemGuid: '',
                        sampleItemName: '',
                        sampleItemType: '',
                        spatialNodeCount: 0,
                        spatialDepth: 0,
                        spatialRootChildren: 0,
                        spatialRootName: '',
                        geometryItemCount: 0,
                        sampleBoxCount: 0,
                        sampleVolume: 0,
                        materialDefinitionCount: 0,
                        roundtripGuid: '',
                        roundtripLocalId: '',
                        roundtripMatched: 0,
                        categories: [],
                        activeCategory: '',
                        categoryLocalIdCount: 0,
                        categoryVisibleCount: 0,
                        categoryHiddenCount: 0,
                        categoryVolume: 0,
                        categoryBoxAvailable: 0,
                        categoryMaterialDefinitionCount: 0,
                        categorySubsetBytes: 0,
                        categoryItemDataCount: 0,
                        categoryItemKeyCount: 0,
                        categoryItemKeys: '',
                        nativeRaycastState: 'error',
                        nativeRaycastLocalId: '',
                        nativeRaycastGuid: '',
                        nativeRaycastDistance: '',
                        nativeSelectionKeyCount: 0,
                        nativeSelectionKeys: '',
                        nativeSelectionName: '',
                        nativeSelectionType: '',
                        nativeSelectionCategory: '',
                        nativeSelectionVisible: '',
                        nativeCategoryFilter: 'all',
                        nativeCategoryFilteredLocalIds: 0,
                        totalVisibleCount: 0,
                        totalHiddenCount: 0,
                        operation: '',
                        error: error?.message || 'Error cargando fragments',
                    });
                }
            }
        };

        run();

        return () => {
            disposed = true;
            modelRef.current = null;
            fragmentsRef.current = null;
            if (fragments) {
                void fragments.dispose();
            }
        };
    }, [modelId]);

    useEffect(() => {
        if (status.state !== 'loaded') return undefined;
        const model = modelRef.current;
        const fragments = fragmentsRef.current;
        const mount = nativeCanvasMountRef.current;
        if (!model || !fragments || !mount) return undefined;

        let disposed = false;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc);
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 5000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.domElement.setAttribute('data-bim-fragments-native-canvas', 'true');
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        mount.replaceChildren(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 1.1);
        const directional = new THREE.DirectionalLight(0xffffff, 0.7);
        directional.position.set(4, 7, 5);
        scene.add(ambient, directional, model.object);
        nativeSceneRef.current = scene;
        nativeCameraRef.current = camera;
        nativeRendererRef.current = renderer;

        const resizeAndFrame = () => {
            const width = Math.max(320, Math.floor(mount.clientWidth || 360));
            const height = 220;
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            const objectBox = new THREE.Box3().setFromObject(model.object);
            const box = model.box && !model.box.isEmpty?.() ? model.box : objectBox;
            const center = box.isEmpty() ? new THREE.Vector3(0, 0, 0) : box.getCenter(new THREE.Vector3());
            const size = box.isEmpty() ? 8 : Math.max(box.getSize(new THREE.Vector3()).length(), 4);
            camera.position.set(center.x + size * 0.75, center.y + size * 0.55, center.z + size * 0.95);
            camera.lookAt(center);
            camera.near = Math.max(0.01, size / 200);
            camera.far = Math.max(100, size * 10);
            camera.updateProjectionMatrix();
        };

        const run = async () => {
            try {
                resizeAndFrame();
                if (typeof model.useCamera === 'function') {
                    model.useCamera(camera);
                }
                await fragments.update(true);
                renderer.render(scene, camera);
                const raycastSummary = await readNativeRaycast(model, camera, renderer.domElement, status.categories);
                if (!disposed) {
                    setStatus((current) => ({ ...current, ...raycastSummary }));
                }
            } catch (error) {
                if (!disposed) {
                    setStatus((current) => ({
                        ...current,
                        nativeRaycastState: 'error',
                        nativeRaycastLocalId: '',
                        nativeRaycastGuid: '',
                        nativeRaycastDistance: '',
                        nativeSelectionKeyCount: 0,
                        nativeSelectionKeys: '',
                        nativeSelectionName: '',
                        nativeSelectionType: '',
                        nativeSelectionCategory: '',
                        nativeSelectionVisible: '',
                        error: current.error || error?.message || 'Error en raycast fragments',
                    }));
                }
            }
        };

        const handleNativePointerDown = async (event) => {
            if (disposed) return;
            try {
                const raycastSummary = await readNativeRaycast(model, camera, renderer.domElement, status.categories, [
                    new THREE.Vector2(event.clientX, event.clientY),
                ]);
                if (!disposed) {
                    setStatus((current) => ({
                        ...current,
                        ...raycastSummary,
                        operation:
                            raycastSummary.nativeRaycastState === 'hit'
                                ? 'seleccion nativa por puntero'
                                : 'seleccion nativa sin hit',
                    }));
                }
            } catch (error) {
                if (!disposed) {
                    setStatus((current) => ({
                        ...current,
                        nativeRaycastState: 'error',
                        error: current.error || error?.message || 'Error en seleccion nativa fragments',
                    }));
                }
            }
        };

        run();
        renderer.domElement.addEventListener('pointerdown', handleNativePointerDown);
        window.addEventListener('resize', resizeAndFrame);

        return () => {
            disposed = true;
            renderer.domElement.removeEventListener('pointerdown', handleNativePointerDown);
            window.removeEventListener('resize', resizeAndFrame);
            scene.remove(model.object);
            renderer.dispose();
            mount.replaceChildren();
            nativeSceneRef.current = null;
            nativeCameraRef.current = null;
            nativeRendererRef.current = null;
        };
    }, [status.state]);

    const refreshCategoryState = async (category, operation, extraState = {}) => {
        const model = modelRef.current;
        if (!model) return;
        const [categoryMetrics, visibilityTotals] = await Promise.all([
            readCategoryMetrics(model, category),
            readVisibilityTotals(model),
        ]);
        setStatus((current) => ({
            ...current,
            activeCategory: category,
            ...categoryMetrics,
            ...visibilityTotals,
            operation,
            ...extraState,
        }));
    };

    const handleSelectCategory = async (category) => {
        await refreshCategoryState(category, 'categoria seleccionada', {
            nativeCategoryFilter: 'all',
            nativeCategoryFilteredLocalIds: 0,
        });
    };

    const handleToggleActiveCategory = async () => {
        const model = modelRef.current;
        const fragments = fragmentsRef.current;
        if (!model || !status.activeCategory || typeof model.getItemsOfCategories !== 'function') return;
        const categoryItems = await model.getItemsOfCategories([buildCategoryMatcher(status.activeCategory)]);
        const localIds = Object.values(categoryItems || {}).flat();
        if (localIds.length === 0 || typeof model.toggleVisible !== 'function') return;
        await model.toggleVisible(localIds);
        if (fragments) {
            await fragments.update(true);
        }
        renderNativeCanvas();
        await refreshCategoryState(status.activeCategory, 'visibilidad alternada', {
            nativeCategoryFilter: 'all',
            nativeCategoryFilteredLocalIds: 0,
        });
    };

    const handleResetVisibility = async () => {
        const model = modelRef.current;
        const fragments = fragmentsRef.current;
        if (!model || typeof model.resetVisible !== 'function') return;
        await model.resetVisible();
        if (fragments) {
            await fragments.update(true);
        }
        renderNativeCanvas();
        await refreshCategoryState(status.activeCategory, 'visibilidad restaurada', {
            nativeCategoryFilter: 'all',
            nativeCategoryFilteredLocalIds: 0,
        });
    };

    const handleIsolateNativeCategory = async () => {
        const model = modelRef.current;
        const fragments = fragmentsRef.current;
        if (
            !model ||
            !status.activeCategory ||
            typeof model.getItemsOfCategories !== 'function' ||
            typeof model.getLocalIds !== 'function' ||
            typeof model.resetVisible !== 'function' ||
            typeof model.toggleVisible !== 'function'
        ) {
            return;
        }
        const categoryItems = await model.getItemsOfCategories([buildCategoryMatcher(status.activeCategory)]);
        const categoryLocalIds = new Set(Object.values(categoryItems || {}).flat());
        if (categoryLocalIds.size === 0) return;
        const allLocalIds = await model.getLocalIds();
        await model.resetVisible();
        if (allLocalIds.length > 0) {
            await model.toggleVisible(allLocalIds);
        }
        await model.toggleVisible(Array.from(categoryLocalIds));
        if (fragments) {
            await fragments.update(true);
        }
        renderNativeCanvas();
        await refreshCategoryState(status.activeCategory, 'categoria aislada', {
            nativeCategoryFilter: 'category',
            nativeCategoryFilteredLocalIds: categoryLocalIds.size,
        });
    };

    const handleToggleNativeSelection = async () => {
        const model = modelRef.current;
        const fragments = fragmentsRef.current;
        const nativeLocalId = Number(status.nativeRaycastLocalId);
        if (!model || !nativeLocalId || typeof model.toggleVisible !== 'function') return;
        await model.toggleVisible([nativeLocalId]);
        if (fragments) {
            await fragments.update(true);
        }
        renderNativeCanvas();
        const visibility = typeof model.getVisible === 'function' ? await model.getVisible([nativeLocalId]) : [];
        const visibilityTotals = await readVisibilityTotals(model);
        setStatus((current) => ({
            ...current,
            nativeSelectionVisible: visibility[0] === false ? '0' : '1',
            ...visibilityTotals,
            operation: 'seleccion nativa alternada',
        }));
    };

    return (
        <aside
            data-bim-fragments-harness="isolated"
            data-bim-fragments-state={status.state}
            data-bim-fragments-bytes={status.bytes}
            data-bim-fragments-models={status.modelCount}
            data-bim-fragments-local-ids={status.localIdCount}
            data-bim-fragments-guids={status.guidCount}
            data-bim-fragments-items={status.itemDataCount}
            data-bim-fragments-sample-local-id={status.sampleLocalId}
            data-bim-fragments-sample-guid={status.sampleGuid}
            data-bim-fragments-sample-category={status.sampleCategory}
            data-bim-fragments-sample-key-count={status.sampleItemKeyCount}
            data-bim-fragments-sample-keys={status.sampleItemKeys}
            data-bim-fragments-sample-guid-resolved={status.sampleItemGuid}
            data-bim-fragments-sample-name={status.sampleItemName}
            data-bim-fragments-sample-type={status.sampleItemType}
            data-bim-fragments-spatial-nodes={status.spatialNodeCount}
            data-bim-fragments-spatial-depth={status.spatialDepth}
            data-bim-fragments-spatial-root-children={status.spatialRootChildren}
            data-bim-fragments-spatial-root-name={status.spatialRootName}
            data-bim-fragments-geometry-items={status.geometryItemCount}
            data-bim-fragments-sample-boxes={status.sampleBoxCount}
            data-bim-fragments-sample-volume={status.sampleVolume}
            data-bim-fragments-material-definitions={status.materialDefinitionCount}
            data-bim-fragments-roundtrip-guid={status.roundtripGuid}
            data-bim-fragments-roundtrip-local-id={status.roundtripLocalId}
            data-bim-fragments-roundtrip-matched={status.roundtripMatched}
            data-bim-fragments-categories={status.categories.length}
            data-bim-fragments-active-category={status.activeCategory}
            data-bim-fragments-category-local-ids={status.categoryLocalIdCount}
            data-bim-fragments-category-visible={status.categoryVisibleCount}
            data-bim-fragments-category-hidden={status.categoryHiddenCount}
            data-bim-fragments-category-volume={status.categoryVolume}
            data-bim-fragments-category-box={status.categoryBoxAvailable}
            data-bim-fragments-category-materials={status.categoryMaterialDefinitionCount}
            data-bim-fragments-category-subset-bytes={status.categorySubsetBytes}
            data-bim-fragments-category-itemdata={status.categoryItemDataCount}
            data-bim-fragments-category-item-keys={status.categoryItemKeys}
            data-bim-fragments-category-item-key-count={status.categoryItemKeyCount}
            data-bim-fragments-native-raycast={status.nativeRaycastState}
            data-bim-fragments-native-raycast-local-id={status.nativeRaycastLocalId}
            data-bim-fragments-native-raycast-guid={status.nativeRaycastGuid}
            data-bim-fragments-native-raycast-distance={status.nativeRaycastDistance}
            data-bim-fragments-native-selection-key-count={status.nativeSelectionKeyCount}
            data-bim-fragments-native-selection-keys={status.nativeSelectionKeys}
            data-bim-fragments-native-selection-name={status.nativeSelectionName}
            data-bim-fragments-native-selection-type={status.nativeSelectionType}
            data-bim-fragments-native-selection-category={status.nativeSelectionCategory}
            data-bim-fragments-native-selection-visible={status.nativeSelectionVisible}
            data-bim-fragments-native-pointer-selection={loaded ? 'enabled' : 'disabled'}
            data-bim-fragments-native-category-filter={status.nativeCategoryFilter}
            data-bim-fragments-native-category-filtered-local-ids={status.nativeCategoryFilteredLocalIds}
            data-bim-fragments-visible-total={status.totalVisibleCount}
            data-bim-fragments-hidden-total={status.totalHiddenCount}
            data-bim-fragments-operation={status.operation}
            data-bim-fragments-error={status.error}
            className="flex flex-col gap-3 rounded-[1.05rem] border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-600 shadow-sm"
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-[#F39200]">
                        <Cuboid className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                            Motor BIM / fragments
                        </p>
                        <p className="mt-1 truncate font-black uppercase tracking-tight text-zinc-900">{statusLabel}</p>
                        <dl className="mt-2 grid gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 sm:grid-cols-3">
                            <div className="min-w-0">
                                <dt className="text-zinc-400">LocalId</dt>
                                <dd className="truncate text-zinc-800">{status.sampleLocalId || '-'}</dd>
                            </div>
                            <div className="min-w-0">
                                <dt className="text-zinc-400">GlobalId</dt>
                                <dd className="truncate font-mono text-[9px] normal-case tracking-normal text-zinc-800">
                                    {status.sampleGuid || '-'}
                                </dd>
                            </div>
                            <div className="min-w-0">
                                <dt className="text-zinc-400">ItemData</dt>
                                <dd className="truncate text-zinc-800">{status.sampleCategory || `${status.itemDataCount} item`}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-600">
                        {status.bytes} bytes
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
                        {status.modelCount} modelo
                    </span>
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-sky-700">
                        {status.localIdCount} ids
                    </span>
                    <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-[#F39200]">
                        {status.itemDataCount} itemdata
                    </span>
                </div>
            </div>
            <div className="grid gap-2 border-t border-zinc-100 pt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 sm:grid-cols-4">
                <span className="rounded-[0.75rem] border border-zinc-200 bg-white px-2 py-1.5">
                    Inspector ItemData
                </span>
                <span className="min-w-0 rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Claves {status.sampleItemKeyCount}
                </span>
                <span className="min-w-0 rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Tipo {status.sampleItemType || '-'}
                </span>
                <span className="min-w-0 truncate rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5 font-mono text-[9px] normal-case tracking-normal text-zinc-700">
                    {status.sampleItemGuid || '-'}
                </span>
            </div>
            <div className="grid gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500 sm:grid-cols-4">
                <span className="rounded-[0.75rem] border border-zinc-200 bg-white px-2 py-1.5">
                    Estructura espacial
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Nodos {status.spatialNodeCount}
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Profundidad {status.spatialDepth}
                </span>
                <span className="min-w-0 truncate rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    {status.spatialRootName || `${status.spatialRootChildren} hijos`}
                </span>
            </div>
            <div className="grid gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500 sm:grid-cols-4">
                <span className="rounded-[0.75rem] border border-zinc-200 bg-white px-2 py-1.5">
                    Geometria fragments
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Items {status.geometryItemCount}
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Cajas {status.sampleBoxCount}
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Vol {status.sampleVolume}
                </span>
            </div>
            <div className="grid gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500 sm:grid-cols-4">
                <span className="rounded-[0.75rem] border border-zinc-200 bg-white px-2 py-1.5">
                    Trazabilidad GUID
                </span>
                <span className="min-w-0 truncate rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5 font-mono text-[9px] normal-case tracking-normal text-zinc-700">
                    {status.roundtripGuid || '-'}
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    LocalId {status.roundtripLocalId || '-'}
                </span>
                <span className="rounded-[0.75rem] border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-700">
                    Match {status.roundtripMatched ? 'ok' : '-'}
                </span>
            </div>
            <div className="grid gap-3 border-t border-zinc-100 pt-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                        Control por categoria IFC
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {status.categories.slice(0, 4).map((category) => {
                            const active = category === status.activeCategory;
                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => handleSelectCategory(category)}
                                    className={`rounded-[0.8rem] border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] transition-colors ${
                                        active
                                            ? 'border-[#F39200] bg-orange-50 text-[#F39200]'
                                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-[#F39200] hover:text-[#F39200]'
                                    }`}
                                >
                                    {category}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleToggleActiveCategory}
                        disabled={!loaded || !status.activeCategory}
                        data-bim-fragments-category-visibility-toggle="true"
                        title="Alternar visibilidad de la categoria IFC"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-[0.85rem] border border-zinc-200 bg-white px-3 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600 transition hover:border-[#F39200] hover:text-[#F39200] disabled:pointer-events-none disabled:opacity-40"
                    >
                        <EyeOff className="h-3.5 w-3.5" />
                        Visibilidad
                    </button>
                    <button
                        type="button"
                        onClick={handleIsolateNativeCategory}
                        disabled={!loaded || !status.activeCategory}
                        data-bim-fragments-native-category-filter-button="true"
                        title="Aislar la categoria IFC activa en el canvas fragments nativo"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-[0.85rem] border border-zinc-200 bg-white px-3 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600 transition hover:border-[#F39200] hover:text-[#F39200] disabled:pointer-events-none disabled:opacity-40"
                    >
                        <Cuboid className="h-3.5 w-3.5" />
                        Solo cat.
                    </button>
                    <button
                        type="button"
                        onClick={handleResetVisibility}
                        disabled={!loaded}
                        data-bim-fragments-category-visibility-reset="true"
                        title="Restaurar visibilidad del modelo fragments"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-[0.85rem] border border-zinc-200 bg-white px-3 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600 transition hover:border-[#F39200] hover:text-[#F39200] disabled:pointer-events-none disabled:opacity-40"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                    </button>
                </div>
            </div>
            <div className="grid gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500 sm:grid-cols-4">
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Categoria {status.activeCategory || '-'}
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    LocalIds {status.categoryLocalIdCount}
                </span>
                <span className="rounded-[0.75rem] border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-700">
                    Visibles {status.categoryVisibleCount}
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-white px-2 py-1.5">
                    Ocultos {status.categoryHiddenCount}
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Filtro {status.nativeCategoryFilter === 'category' ? status.activeCategory : 'Todas'}
                </span>
            </div>
            <div className="grid gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500 sm:grid-cols-4">
                <span className="rounded-[0.75rem] border border-zinc-200 bg-white px-2 py-1.5">
                    Medicion categoria
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Vol {status.categoryVolume}
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Caja {status.categoryBoxAvailable ? 'ok' : '-'}
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Materiales {status.categoryMaterialDefinitionCount}
                </span>
            </div>
            <div className="grid gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500 sm:grid-cols-4">
                <span className="rounded-[0.75rem] border border-zinc-200 bg-white px-2 py-1.5">
                    Subset fragments
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Bytes {status.categorySubsetBytes}
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Fuente {status.activeCategory || '-'}
                </span>
                <span className="rounded-[0.75rem] border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-700">
                    LocalIds {status.categoryLocalIdCount}
                </span>
            </div>
            <div className="grid gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500 sm:grid-cols-4">
                <span className="rounded-[0.75rem] border border-zinc-200 bg-white px-2 py-1.5">
                    ItemData categoria
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Items {status.categoryItemDataCount}
                </span>
                <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    Claves {status.categoryItemKeyCount}
                </span>
                <span className="min-w-0 truncate rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                    {status.categoryItemKeys || '-'}
                </span>
            </div>
            <div className="grid gap-3 border-t border-zinc-100 pt-3 lg:grid-cols-[minmax(320px,0.95fr)_minmax(0,1fr)]">
                <div
                    ref={nativeCanvasMountRef}
                    data-bim-fragments-native-viewer="isolated"
                    className="min-h-[220px] overflow-hidden rounded-[0.9rem] border border-zinc-200 bg-slate-50"
                />
                <div className="grid gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500 sm:grid-cols-2 lg:grid-cols-1">
                    <span className="rounded-[0.75rem] border border-zinc-200 bg-white px-2 py-1.5">
                        Raycast fragments
                    </span>
                    <span className="rounded-[0.75rem] border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-700">
                        Estado {status.nativeRaycastState}
                    </span>
                    <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                        LocalId {status.nativeRaycastLocalId || '-'}
                    </span>
                    <span className="min-w-0 truncate rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5 font-mono text-[9px] normal-case tracking-normal text-zinc-700">
                        {status.nativeRaycastGuid || '-'}
                    </span>
                    <span className="rounded-[0.75rem] border border-zinc-200 bg-white px-2 py-1.5">
                        Seleccion fragments
                    </span>
                    <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                        Puntero {loaded ? 'activo' : '-'}
                    </span>
                    <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                        Claves {status.nativeSelectionKeyCount}
                    </span>
                    <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                        Tipo {status.nativeSelectionType || status.nativeSelectionCategory || '-'}
                    </span>
                    <span className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                        Visible {status.nativeSelectionVisible === '0' ? 'no' : status.nativeSelectionVisible === '1' ? 'si' : '-'}
                    </span>
                    <span className="min-w-0 truncate rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                        {status.nativeSelectionName || status.nativeSelectionKeys || '-'}
                    </span>
                    <button
                        type="button"
                        onClick={handleToggleNativeSelection}
                        disabled={!loaded || !status.nativeRaycastLocalId}
                        data-bim-fragments-native-selection-toggle="true"
                        title="Alternar visibilidad del elemento seleccionado en fragments"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-[0.85rem] border border-zinc-200 bg-white px-3 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600 transition hover:border-[#F39200] hover:text-[#F39200] disabled:pointer-events-none disabled:opacity-40"
                    >
                        <EyeOff className="h-3.5 w-3.5" />
                        Sel.
                    </button>
                </div>
            </div>
            {status.error ? <span className="sr-only" data-bim-fragments-error-message>{status.error}</span> : null}
        </aside>
    );
};

export default BimFragmentsHarness;
