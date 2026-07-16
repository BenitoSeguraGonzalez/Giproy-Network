import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4218;
const baseUrl = `http://127.0.0.1:${port}`;

const waitForServer = async (url, timeoutMs = 40000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        try {
            const response = await fetch(url);
            if (response.ok) return;
        } catch {
            // retry
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
    }
    throw new Error(`Vite no respondio en ${url}`);
};

const vite = spawn(
    process.platform === 'win32' ? 'cmd.exe' : 'npm',
    process.platform === 'win32'
        ? ['/c', 'npm', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)]
        : ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
);

let viteOutput = '';
vite.stdout?.on('data', (chunk) => {
    viteOutput += chunk.toString();
});
vite.stderr?.on('data', (chunk) => {
    viteOutput += chunk.toString();
});

const cleanup = () => {
    if (vite.killed) return;
    if (process.platform === 'win32' && vite.pid) {
        spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' });
        return;
    }
    vite.kill();
};

process.on('exit', cleanup);
process.on('uncaughtException', (error) => {
    cleanup();
    console.error(error);
    process.exit(1);
});
process.on('unhandledRejection', (error) => {
    cleanup();
    console.error(error);
    process.exit(1);
});

try {
    await waitForServer(baseUrl);
} catch (error) {
    cleanup();
    console.error(viteOutput.trim());
    throw error;
}

const browser = await chromium.launch({
    headless: true,
    executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
});

const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
];

try {
    for (const viewport of viewports) {
        const page = await browser.newPage({ viewport });
        const consoleErrors = [];
        page.on('console', (message) => {
            const text = message.text();
            const isHarnessFavicon404 =
                message.type() === 'error' &&
                text.includes('Failed to load resource') &&
                text.includes('404');
            if (message.type() === 'error' && !isHarnessFavicon404) consoleErrors.push(text);
        });
        page.on('pageerror', (error) => consoleErrors.push(error.message));

        await page.goto(`${baseUrl}/bim-viewer-harness.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('[data-bim-viewer-harness="isolated"] canvas', { timeout: 30000 });
        await page.waitForSelector('[data-bim-three-viewer="isolated"] canvas[data-bim-three-canvas="true"]', { timeout: 30000 });
        await page.waitForSelector('[data-bim-fragments-harness="isolated"]', { timeout: 30000 });
        try {
            await page.waitForSelector('[data-bim-fragments-harness="isolated"][data-bim-fragments-state="loaded"]', {
                timeout: 30000,
            });
        } catch (error) {
            const fragmentsDebug = await page.evaluate(() => {
                const node = document.querySelector('[data-bim-fragments-harness="isolated"]');
                return {
                    state: node?.getAttribute('data-bim-fragments-state'),
                    bytes: node?.getAttribute('data-bim-fragments-bytes'),
                    models: node?.getAttribute('data-bim-fragments-models'),
                    localIds: node?.getAttribute('data-bim-fragments-local-ids'),
                    guids: node?.getAttribute('data-bim-fragments-guids'),
                    items: node?.getAttribute('data-bim-fragments-items'),
                    sampleLocalId: node?.getAttribute('data-bim-fragments-sample-local-id'),
                    sampleGuid: node?.getAttribute('data-bim-fragments-sample-guid'),
                    sampleCategory: node?.getAttribute('data-bim-fragments-sample-category'),
                    sampleKeyCount: node?.getAttribute('data-bim-fragments-sample-key-count'),
                    sampleKeys: node?.getAttribute('data-bim-fragments-sample-keys'),
                    sampleGuidResolved: node?.getAttribute('data-bim-fragments-sample-guid-resolved'),
                    sampleType: node?.getAttribute('data-bim-fragments-sample-type'),
                    spatialNodes: node?.getAttribute('data-bim-fragments-spatial-nodes'),
                    spatialDepth: node?.getAttribute('data-bim-fragments-spatial-depth'),
                    spatialRootChildren: node?.getAttribute('data-bim-fragments-spatial-root-children'),
                    geometryItems: node?.getAttribute('data-bim-fragments-geometry-items'),
                    sampleBoxes: node?.getAttribute('data-bim-fragments-sample-boxes'),
                    sampleVolume: node?.getAttribute('data-bim-fragments-sample-volume'),
                    categories: node?.getAttribute('data-bim-fragments-categories'),
                    activeCategory: node?.getAttribute('data-bim-fragments-active-category'),
                    categoryLocalIds: node?.getAttribute('data-bim-fragments-category-local-ids'),
                    categoryVisible: node?.getAttribute('data-bim-fragments-category-visible'),
                    categoryHidden: node?.getAttribute('data-bim-fragments-category-hidden'),
                    categoryVolume: node?.getAttribute('data-bim-fragments-category-volume'),
                    categoryBox: node?.getAttribute('data-bim-fragments-category-box'),
                    categoryMaterials: node?.getAttribute('data-bim-fragments-category-materials'),
                    categorySubsetBytes: node?.getAttribute('data-bim-fragments-category-subset-bytes'),
                    categoryItemData: node?.getAttribute('data-bim-fragments-category-itemdata'),
                    categoryItemKeyCount: node?.getAttribute('data-bim-fragments-category-item-key-count'),
                    categoryItemKeys: node?.getAttribute('data-bim-fragments-category-item-keys'),
                    roundtripGuid: node?.getAttribute('data-bim-fragments-roundtrip-guid'),
                    roundtripLocalId: node?.getAttribute('data-bim-fragments-roundtrip-local-id'),
                    roundtripMatched: node?.getAttribute('data-bim-fragments-roundtrip-matched'),
                    nativeRaycast: node?.getAttribute('data-bim-fragments-native-raycast'),
                    nativeRaycastLocalId: node?.getAttribute('data-bim-fragments-native-raycast-local-id'),
                    nativeRaycastGuid: node?.getAttribute('data-bim-fragments-native-raycast-guid'),
                    nativeSelectionKeyCount: node?.getAttribute('data-bim-fragments-native-selection-key-count'),
                    nativeSelectionKeys: node?.getAttribute('data-bim-fragments-native-selection-keys'),
                    nativeSelectionType: node?.getAttribute('data-bim-fragments-native-selection-type'),
                    nativeSelectionVisible: node?.getAttribute('data-bim-fragments-native-selection-visible'),
                    nativePointerSelection: node?.getAttribute('data-bim-fragments-native-pointer-selection'),
                    nativeCategoryFilter: node?.getAttribute('data-bim-fragments-native-category-filter'),
                    nativeCategoryFilteredLocalIds: node?.getAttribute(
                        'data-bim-fragments-native-category-filtered-local-ids',
                    ),
                    visibleTotal: node?.getAttribute('data-bim-fragments-visible-total'),
                    hiddenTotal: node?.getAttribute('data-bim-fragments-hidden-total'),
                    operation: node?.getAttribute('data-bim-fragments-operation'),
                    error: node?.getAttribute('data-bim-fragments-error'),
                    text: node?.innerText,
                };
            });
            throw new Error(`${viewport.name}: FragmentsModels no cargo: ${JSON.stringify(fragmentsDebug)}`, {
                cause: error,
            });
        }
        await page.waitForSelector('[data-bim-fragments-native-viewer="isolated"] canvas[data-bim-fragments-native-canvas="true"]', {
            timeout: 30000,
        });
        try {
            await page.waitForFunction(() => {
                const node = document.querySelector('[data-bim-fragments-harness="isolated"]');
                return node?.getAttribute('data-bim-fragments-native-raycast') === 'hit';
            });
        } catch (error) {
            const nativeRaycastDebug = await page.evaluate(() => {
                const node = document.querySelector('[data-bim-fragments-harness="isolated"]');
                const canvas = document.querySelector(
                    '[data-bim-fragments-native-viewer="isolated"] canvas[data-bim-fragments-native-canvas="true"]',
                );
                return {
                    nativeRaycast: node?.getAttribute('data-bim-fragments-native-raycast'),
                    nativeRaycastLocalId: node?.getAttribute('data-bim-fragments-native-raycast-local-id'),
                    nativeRaycastGuid: node?.getAttribute('data-bim-fragments-native-raycast-guid'),
                    nativeRaycastDistance: node?.getAttribute('data-bim-fragments-native-raycast-distance'),
                    nativeSelectionKeyCount: node?.getAttribute('data-bim-fragments-native-selection-key-count'),
                    nativeSelectionKeys: node?.getAttribute('data-bim-fragments-native-selection-keys'),
                    nativeSelectionType: node?.getAttribute('data-bim-fragments-native-selection-type'),
                    nativeSelectionVisible: node?.getAttribute('data-bim-fragments-native-selection-visible'),
                    error: node?.getAttribute('data-bim-fragments-error'),
                    canvasWidth: canvas?.width,
                    canvasHeight: canvas?.height,
                    text: node?.innerText,
                };
            });
            throw new Error(`${viewport.name}: raycast nativo fragments sin hit: ${JSON.stringify(nativeRaycastDebug)}`, {
                cause: error,
            });
        }
        await page.waitForFunction(() => {
            const canvas = document.querySelector('[data-bim-canvas-viewer="isolated"] canvas');
            return Boolean(canvas && canvas.width >= 320 && canvas.height >= 320);
        });
        await page.waitForFunction(() => {
            const canvas = document.querySelector('[data-bim-three-viewer="isolated"] canvas[data-bim-three-canvas="true"]');
            return Boolean(canvas && canvas.width >= 320 && canvas.height >= 320);
        });
        await page.waitForTimeout(500);

        const raycastHit = await page.evaluate(async () => {
            const threeViewer = document.querySelector('[data-bim-three-viewer="isolated"]');
            const canvas = threeViewer?.querySelector('canvas[data-bim-three-canvas="true"]');
            if (!threeViewer || !canvas) return '';
            const rect = canvas.getBoundingClientRect();
            const points = [
                [0.5, 0.5],
                [0.42, 0.46],
                [0.58, 0.48],
                [0.36, 0.55],
                [0.64, 0.55],
                [0.5, 0.38],
                [0.5, 0.62],
            ];
            for (const [xRatio, yRatio] of points) {
                const clientX = rect.left + rect.width * xRatio;
                const clientY = rect.top + rect.height * yRatio;
                canvas.dispatchEvent(
                    new PointerEvent('pointerdown', {
                        bubbles: true,
                        clientX,
                        clientY,
                        pointerId: 1,
                        pointerType: 'mouse',
                    }),
                );
                await new Promise((resolve) => setTimeout(resolve, 80));
                const hit = threeViewer.getAttribute('data-bim-three-raycast-hit');
                if (hit) return hit;
            }
            return threeViewer.getAttribute('data-bim-three-raycast-hit') || '';
        });

        const raycastHover = await page.evaluate(async () => {
            const threeViewer = document.querySelector('[data-bim-three-viewer="isolated"]');
            const canvas = threeViewer?.querySelector('canvas[data-bim-three-canvas="true"]');
            if (!threeViewer || !canvas) return '';
            const rect = canvas.getBoundingClientRect();
            const points = [
                [0.5, 0.5],
                [0.42, 0.46],
                [0.58, 0.48],
                [0.36, 0.55],
                [0.64, 0.55],
            ];
            for (const [xRatio, yRatio] of points) {
                canvas.dispatchEvent(
                    new PointerEvent('pointermove', {
                        bubbles: true,
                        clientX: rect.left + rect.width * xRatio,
                        clientY: rect.top + rect.height * yRatio,
                        pointerId: 1,
                        pointerType: 'mouse',
                    }),
                );
                await new Promise((resolve) => setTimeout(resolve, 80));
                const hover = threeViewer.getAttribute('data-bim-three-hover-element');
                if (hover) return hover;
            }
            return threeViewer.getAttribute('data-bim-three-hover-element') || '';
        });

        const focusedElement = await page.evaluate(async () => {
            const threeViewer = document.querySelector('[data-bim-three-viewer="isolated"]');
            const focusButton = threeViewer?.querySelector('[data-bim-three-focus-selected="true"]');
            if (!threeViewer || !focusButton) return '';
            focusButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 80));
            return threeViewer.getAttribute('data-bim-three-focus-element') || '';
        });

        const state = await page.evaluate(() => {
            const root = document.querySelector('[data-bim-viewer-harness="isolated"]');
            const canvasViewer = root.querySelector('[data-bim-canvas-viewer="isolated"]');
            const canvas = canvasViewer.querySelector('canvas');
            const fragmentsHarness = root.querySelector('[data-bim-fragments-harness="isolated"]');
            const threeViewer = root.querySelector('[data-bim-three-viewer="isolated"]');
            const threeCanvas = threeViewer.querySelector('canvas[data-bim-three-canvas="true"]');
            const nativeFragmentsCanvas = fragmentsHarness.querySelector('canvas[data-bim-fragments-native-canvas="true"]');
            const rect = canvas.getBoundingClientRect();
            const context = canvas.getContext('2d');
            const image = context.getImageData(0, 0, canvas.width, canvas.height);
            let nonBackgroundPixels = 0;
            let coloredPixels = 0;
            for (let index = 0; index < image.data.length; index += 16) {
                const red = image.data[index];
                const green = image.data[index + 1];
                const blue = image.data[index + 2];
                const alpha = image.data[index + 3];
                const isBackground = red === 248 && green === 250 && blue === 252;
                if (alpha > 0 && !isBackground) nonBackgroundPixels += 1;
                if (alpha > 0 && Math.max(red, green, blue) - Math.min(red, green, blue) > 18) coloredPixels += 1;
            }

            const threeRect = threeCanvas.getBoundingClientRect();
            const gl = threeCanvas.getContext('webgl2') || threeCanvas.getContext('webgl');
            const threePixels = new Uint8Array(4 * 24 * 24);
            if (gl) {
                gl.readPixels(
                    Math.max(0, Math.floor(threeCanvas.width / 2) - 12),
                    Math.max(0, Math.floor(threeCanvas.height / 2) - 12),
                    24,
                    24,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    threePixels,
                );
            }
            let threeColoredPixels = 0;
            for (let index = 0; index < threePixels.length; index += 4) {
                const red = threePixels[index];
                const green = threePixels[index + 1];
                const blue = threePixels[index + 2];
                const alpha = threePixels[index + 3];
                if (alpha > 0 && Math.max(red, green, blue) - Math.min(red, green, blue) > 8) {
                    threeColoredPixels += 1;
                }
            }
            const nativeFragmentsGl =
                nativeFragmentsCanvas.getContext('webgl2') || nativeFragmentsCanvas.getContext('webgl');
            const nativeFragmentsSampleSize = 96;
            const nativeFragmentsPixels = new Uint8Array(4 * nativeFragmentsSampleSize * nativeFragmentsSampleSize);
            if (nativeFragmentsGl) {
                nativeFragmentsGl.readPixels(
                    Math.max(0, Math.floor(nativeFragmentsCanvas.width / 2) - nativeFragmentsSampleSize / 2),
                    Math.max(0, Math.floor(nativeFragmentsCanvas.height / 2) - nativeFragmentsSampleSize / 2),
                    nativeFragmentsSampleSize,
                    nativeFragmentsSampleSize,
                    nativeFragmentsGl.RGBA,
                    nativeFragmentsGl.UNSIGNED_BYTE,
                    nativeFragmentsPixels,
                );
            }
            let nativeFragmentsNonBackgroundPixels = 0;
            let nativeFragmentsColoredPixels = 0;
            for (let index = 0; index < nativeFragmentsPixels.length; index += 4) {
                const red = nativeFragmentsPixels[index];
                const green = nativeFragmentsPixels[index + 1];
                const blue = nativeFragmentsPixels[index + 2];
                const alpha = nativeFragmentsPixels[index + 3];
                const isBackground = red === 248 && green === 250 && blue === 252;
                if (alpha > 0 && !isBackground) nativeFragmentsNonBackgroundPixels += 1;
                if (alpha > 0 && Math.max(red, green, blue) - Math.min(red, green, blue) > 8) {
                    nativeFragmentsColoredPixels += 1;
                }
            }

            return {
                width: canvas.width,
                height: canvas.height,
                rectWidth: rect.width,
                rectHeight: rect.height,
                threeWidth: threeCanvas.width,
                threeHeight: threeCanvas.height,
                threeRectWidth: threeRect.width,
                threeRectHeight: threeRect.height,
                threeColoredPixels,
                nativeFragmentsWidth: nativeFragmentsCanvas.width,
                nativeFragmentsHeight: nativeFragmentsCanvas.height,
                nativeFragmentsNonBackgroundPixels,
                nativeFragmentsColoredPixels,
                raycastMode: threeViewer.getAttribute('data-bim-three-raycast'),
                raycastHit: threeViewer.getAttribute('data-bim-three-raycast-hit'),
                raycastGlobalId: threeViewer.getAttribute('data-bim-three-raycast-global-id'),
                raycastIfcClass: threeViewer.getAttribute('data-bim-three-raycast-ifc-class'),
                hoverElement: threeViewer.getAttribute('data-bim-three-hover-element'),
                hoverGlobalId: threeViewer.getAttribute('data-bim-three-hover-global-id'),
                hoverIfcClass: threeViewer.getAttribute('data-bim-three-hover-ifc-class'),
                threeControls: threeViewer.getAttribute('data-bim-three-controls'),
                focusedElement: threeViewer.getAttribute('data-bim-three-focus-element'),
                focusedGlobalId: threeViewer.getAttribute('data-bim-three-focus-global-id'),
                inspectorElement: threeViewer.getAttribute('data-bim-three-inspector-element'),
                inspectorGlobalId: threeViewer.getAttribute('data-bim-three-inspector-global-id'),
                inspectorProperties: Number(threeViewer.getAttribute('data-bim-three-inspector-properties') || 0),
                threeIfcFilter: threeViewer.getAttribute('data-bim-three-ifc-filter'),
                threeFilteredElements: Number(threeViewer.getAttribute('data-bim-three-filtered-elements') || 0),
                threeIfcFilterCount: Number(threeViewer.getAttribute('data-bim-three-ifc-filter-count') || 0),
                threeHiddenIfcClasses: Number(threeViewer.getAttribute('data-bim-three-hidden-ifc-classes') || 0),
                threeVisibleIfcClasses: Number(threeViewer.getAttribute('data-bim-three-visible-ifc-classes') || 0),
                nonBackgroundPixels,
                coloredPixels,
                selectedElementId: root.getAttribute('data-selected-element-id'),
                fragmentsState: fragmentsHarness.getAttribute('data-bim-fragments-state'),
                fragmentsBytes: Number(fragmentsHarness.getAttribute('data-bim-fragments-bytes') || 0),
                fragmentsModels: Number(fragmentsHarness.getAttribute('data-bim-fragments-models') || 0),
                fragmentsLocalIds: Number(fragmentsHarness.getAttribute('data-bim-fragments-local-ids') || 0),
                fragmentsGuids: Number(fragmentsHarness.getAttribute('data-bim-fragments-guids') || 0),
                fragmentsItems: Number(fragmentsHarness.getAttribute('data-bim-fragments-items') || 0),
                fragmentsSampleLocalId: fragmentsHarness.getAttribute('data-bim-fragments-sample-local-id'),
                fragmentsSampleGuid: fragmentsHarness.getAttribute('data-bim-fragments-sample-guid'),
                fragmentsSampleKeyCount: Number(fragmentsHarness.getAttribute('data-bim-fragments-sample-key-count') || 0),
                fragmentsSampleKeys: fragmentsHarness.getAttribute('data-bim-fragments-sample-keys'),
                fragmentsSampleGuidResolved: fragmentsHarness.getAttribute('data-bim-fragments-sample-guid-resolved'),
                fragmentsSampleType: fragmentsHarness.getAttribute('data-bim-fragments-sample-type'),
                fragmentsSpatialNodes: Number(fragmentsHarness.getAttribute('data-bim-fragments-spatial-nodes') || 0),
                fragmentsSpatialDepth: Number(fragmentsHarness.getAttribute('data-bim-fragments-spatial-depth') || 0),
                fragmentsSpatialRootChildren: Number(
                    fragmentsHarness.getAttribute('data-bim-fragments-spatial-root-children') || 0,
                ),
                fragmentsGeometryItems: Number(fragmentsHarness.getAttribute('data-bim-fragments-geometry-items') || 0),
                fragmentsSampleBoxes: Number(fragmentsHarness.getAttribute('data-bim-fragments-sample-boxes') || 0),
                fragmentsSampleVolume: Number(fragmentsHarness.getAttribute('data-bim-fragments-sample-volume') || 0),
                fragmentsCategories: Number(fragmentsHarness.getAttribute('data-bim-fragments-categories') || 0),
                fragmentsActiveCategory: fragmentsHarness.getAttribute('data-bim-fragments-active-category'),
                fragmentsCategoryLocalIds: Number(fragmentsHarness.getAttribute('data-bim-fragments-category-local-ids') || 0),
                fragmentsCategoryVisible: Number(fragmentsHarness.getAttribute('data-bim-fragments-category-visible') || 0),
                fragmentsCategoryHidden: Number(fragmentsHarness.getAttribute('data-bim-fragments-category-hidden') || 0),
                fragmentsCategoryVolume: Number(fragmentsHarness.getAttribute('data-bim-fragments-category-volume') || 0),
                fragmentsCategoryBox: Number(fragmentsHarness.getAttribute('data-bim-fragments-category-box') || 0),
                fragmentsCategoryMaterials: Number(fragmentsHarness.getAttribute('data-bim-fragments-category-materials') || 0),
                fragmentsCategorySubsetBytes: Number(
                    fragmentsHarness.getAttribute('data-bim-fragments-category-subset-bytes') || 0,
                ),
                fragmentsCategoryItemData: Number(
                    fragmentsHarness.getAttribute('data-bim-fragments-category-itemdata') || 0,
                ),
                fragmentsCategoryItemKeyCount: Number(
                    fragmentsHarness.getAttribute('data-bim-fragments-category-item-key-count') || 0,
                ),
                fragmentsCategoryItemKeys: fragmentsHarness.getAttribute('data-bim-fragments-category-item-keys'),
                fragmentsRoundtripGuid: fragmentsHarness.getAttribute('data-bim-fragments-roundtrip-guid'),
                fragmentsRoundtripLocalId: fragmentsHarness.getAttribute('data-bim-fragments-roundtrip-local-id'),
                fragmentsRoundtripMatched: Number(
                    fragmentsHarness.getAttribute('data-bim-fragments-roundtrip-matched') || 0,
                ),
                fragmentsNativeRaycast: fragmentsHarness.getAttribute('data-bim-fragments-native-raycast'),
                fragmentsNativeRaycastLocalId: fragmentsHarness.getAttribute('data-bim-fragments-native-raycast-local-id'),
                fragmentsNativeRaycastGuid: fragmentsHarness.getAttribute('data-bim-fragments-native-raycast-guid'),
                fragmentsNativeSelectionKeyCount: Number(
                    fragmentsHarness.getAttribute('data-bim-fragments-native-selection-key-count') || 0,
                ),
                fragmentsNativeSelectionKeys: fragmentsHarness.getAttribute('data-bim-fragments-native-selection-keys'),
                fragmentsNativeSelectionType: fragmentsHarness.getAttribute('data-bim-fragments-native-selection-type'),
                fragmentsNativeSelectionCategory: fragmentsHarness.getAttribute(
                    'data-bim-fragments-native-selection-category',
                ),
                fragmentsNativeSelectionVisible: fragmentsHarness.getAttribute(
                    'data-bim-fragments-native-selection-visible',
                ),
                fragmentsNativePointerSelection: fragmentsHarness.getAttribute(
                    'data-bim-fragments-native-pointer-selection',
                ),
                fragmentsNativeCategoryFilter: fragmentsHarness.getAttribute('data-bim-fragments-native-category-filter'),
                fragmentsNativeCategoryFilteredLocalIds: Number(
                    fragmentsHarness.getAttribute('data-bim-fragments-native-category-filtered-local-ids') || 0,
                ),
                fragmentsVisibleTotal: Number(fragmentsHarness.getAttribute('data-bim-fragments-visible-total') || 0),
                fragmentsHiddenTotal: Number(fragmentsHarness.getAttribute('data-bim-fragments-hidden-total') || 0),
                canvasIfcFilter: canvasViewer.getAttribute('data-bim-canvas-ifc-filter'),
                canvasFilteredElements: Number(canvasViewer.getAttribute('data-bim-canvas-filtered-elements') || 0),
                canvasIfcFilterCount: Number(canvasViewer.getAttribute('data-bim-canvas-ifc-filter-count') || 0),
                artifactSource: threeViewer.getAttribute('data-bim-artifact-source'),
                artifactElements: threeViewer.getAttribute('data-bim-artifact-elements'),
                bodyText: document.body.innerText,
                hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
            };
        });

        const visibilityToggle = await page.evaluate(async () => {
            const threeViewer = document.querySelector('[data-bim-three-viewer="isolated"]');
            const visibilityButton =
                threeViewer?.querySelector('[data-bim-three-ifc-visibility-button="IfcWall"]') ||
                threeViewer?.querySelector('[data-bim-three-ifc-visibility-button]');
            const resetButton = threeViewer?.querySelector('[data-bim-three-reset-visibility="true"]');
            if (!threeViewer || !visibilityButton || !resetButton) return null;
            visibilityButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 120));
            const hiddenAfterToggle = Number(threeViewer.getAttribute('data-bim-three-hidden-ifc-classes') || 0);
            const filteredAfterToggle = Number(threeViewer.getAttribute('data-bim-three-filtered-elements') || 0);
            resetButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 120));
            return {
                hiddenAfterToggle,
                filteredAfterToggle,
                hiddenAfterReset: Number(threeViewer.getAttribute('data-bim-three-hidden-ifc-classes') || 0),
            };
        });

        const nativeSelectionToggle = await page.evaluate(async () => {
            const fragmentsHarness = document.querySelector('[data-bim-fragments-harness="isolated"]');
            const toggleButton = fragmentsHarness?.querySelector('[data-bim-fragments-native-selection-toggle="true"]');
            if (!fragmentsHarness || !toggleButton) return null;
            const visibleBefore = fragmentsHarness.getAttribute('data-bim-fragments-native-selection-visible');
            toggleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 160));
            const visibleAfterToggle = fragmentsHarness.getAttribute('data-bim-fragments-native-selection-visible');
            toggleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 160));
            return {
                visibleBefore,
                visibleAfterToggle,
                visibleAfterReset: fragmentsHarness.getAttribute('data-bim-fragments-native-selection-visible'),
            };
        });

        const nativePointerSelection = await page.evaluate(async () => {
            const fragmentsHarness = document.querySelector('[data-bim-fragments-harness="isolated"]');
            const canvas = fragmentsHarness?.querySelector('canvas[data-bim-fragments-native-canvas="true"]');
            if (!fragmentsHarness || !canvas) return null;
            const rect = canvas.getBoundingClientRect();
            const points = [
                [0.5, 0.5],
                [0.45, 0.5],
                [0.55, 0.5],
                [0.5, 0.45],
                [0.5, 0.55],
            ];
            for (const [xRatio, yRatio] of points) {
                canvas.dispatchEvent(
                    new PointerEvent('pointerdown', {
                        bubbles: true,
                        clientX: rect.left + rect.width * xRatio,
                        clientY: rect.top + rect.height * yRatio,
                        pointerId: 2,
                        pointerType: 'mouse',
                    }),
                );
                await new Promise((resolve) => setTimeout(resolve, 160));
                if (fragmentsHarness.getAttribute('data-bim-fragments-operation') === 'seleccion nativa por puntero') {
                    break;
                }
            }
            return {
                pointerSelection: fragmentsHarness.getAttribute('data-bim-fragments-native-pointer-selection'),
                operation: fragmentsHarness.getAttribute('data-bim-fragments-operation'),
                localId: fragmentsHarness.getAttribute('data-bim-fragments-native-raycast-local-id'),
                guid: fragmentsHarness.getAttribute('data-bim-fragments-native-raycast-guid'),
                keyCount: Number(fragmentsHarness.getAttribute('data-bim-fragments-native-selection-key-count') || 0),
            };
        });

        const fragmentsCategoryVisibilityToggle = await page.evaluate(async () => {
            const fragmentsHarness = document.querySelector('[data-bim-fragments-harness="isolated"]');
            const toggleButton = fragmentsHarness?.querySelector('[data-bim-fragments-category-visibility-toggle="true"]');
            const resetButton = fragmentsHarness?.querySelector('[data-bim-fragments-category-visibility-reset="true"]');
            if (!fragmentsHarness || !toggleButton || !resetButton) return null;
            const visibleBefore = Number(fragmentsHarness.getAttribute('data-bim-fragments-category-visible') || 0);
            const hiddenBefore = Number(fragmentsHarness.getAttribute('data-bim-fragments-category-hidden') || 0);
            toggleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 180));
            const visibleAfterToggle = Number(fragmentsHarness.getAttribute('data-bim-fragments-category-visible') || 0);
            const hiddenAfterToggle = Number(fragmentsHarness.getAttribute('data-bim-fragments-category-hidden') || 0);
            resetButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 180));
            return {
                visibleBefore,
                hiddenBefore,
                visibleAfterToggle,
                hiddenAfterToggle,
                visibleAfterReset: Number(fragmentsHarness.getAttribute('data-bim-fragments-category-visible') || 0),
                hiddenAfterReset: Number(fragmentsHarness.getAttribute('data-bim-fragments-category-hidden') || 0),
                operationAfterReset: fragmentsHarness.getAttribute('data-bim-fragments-operation'),
            };
        });

        const fragmentsNativeCategoryFilterToggle = await page.evaluate(async () => {
            const fragmentsHarness = document.querySelector('[data-bim-fragments-harness="isolated"]');
            const filterButton = fragmentsHarness?.querySelector(
                '[data-bim-fragments-native-category-filter-button="true"]',
            );
            const resetButton = fragmentsHarness?.querySelector('[data-bim-fragments-category-visibility-reset="true"]');
            if (!fragmentsHarness || !filterButton || !resetButton) return null;
            const visibleBefore = Number(fragmentsHarness.getAttribute('data-bim-fragments-visible-total') || 0);
            const hiddenBefore = Number(fragmentsHarness.getAttribute('data-bim-fragments-hidden-total') || 0);
            const categoryLocalIds = Number(fragmentsHarness.getAttribute('data-bim-fragments-category-local-ids') || 0);
            filterButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 220));
            const filterAfterToggle = fragmentsHarness.getAttribute('data-bim-fragments-native-category-filter');
            const filteredLocalIds = Number(
                fragmentsHarness.getAttribute('data-bim-fragments-native-category-filtered-local-ids') || 0,
            );
            const visibleAfterToggle = Number(fragmentsHarness.getAttribute('data-bim-fragments-visible-total') || 0);
            const hiddenAfterToggle = Number(fragmentsHarness.getAttribute('data-bim-fragments-hidden-total') || 0);
            const categoryVisibleAfterToggle = Number(
                fragmentsHarness.getAttribute('data-bim-fragments-category-visible') || 0,
            );
            const categoryHiddenAfterToggle = Number(
                fragmentsHarness.getAttribute('data-bim-fragments-category-hidden') || 0,
            );
            const operationAfterToggle = fragmentsHarness.getAttribute('data-bim-fragments-operation');
            resetButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 220));
            return {
                visibleBefore,
                hiddenBefore,
                categoryLocalIds,
                filterAfterToggle,
                filteredLocalIds,
                visibleAfterToggle,
                hiddenAfterToggle,
                categoryVisibleAfterToggle,
                categoryHiddenAfterToggle,
                operationAfterToggle,
                filterAfterReset: fragmentsHarness.getAttribute('data-bim-fragments-native-category-filter'),
                filteredAfterReset: Number(
                    fragmentsHarness.getAttribute('data-bim-fragments-native-category-filtered-local-ids') || 0,
                ),
                visibleAfterReset: Number(fragmentsHarness.getAttribute('data-bim-fragments-visible-total') || 0),
                hiddenAfterReset: Number(fragmentsHarness.getAttribute('data-bim-fragments-hidden-total') || 0),
            };
        });

        assert.equal(consoleErrors.length, 0, `${viewport.name}: no debe haber errores de consola: ${consoleErrors.join(' | ')}`);
        assert.ok(state.width >= 320, `${viewport.name}: el canvas debe tener ancho estable`);
        assert.ok(state.height >= 320, `${viewport.name}: el canvas debe tener alto estable`);
        assert.ok(state.rectWidth > 0 && state.rectHeight > 0, `${viewport.name}: el canvas debe estar visible`);
        assert.ok(state.nonBackgroundPixels > 1200, `${viewport.name}: el canvas BIM no debe quedar en blanco`);
        assert.ok(state.coloredPixels > 600, `${viewport.name}: el canvas debe pintar geometria/overlays BIM`);
        assert.ok(state.threeWidth >= 320, `${viewport.name}: el canvas BIM 3D debe tener ancho estable`);
        assert.ok(state.threeHeight >= 320, `${viewport.name}: el canvas BIM 3D debe tener alto estable`);
        assert.ok(state.threeRectWidth > 0 && state.threeRectHeight > 0, `${viewport.name}: el canvas BIM 3D debe estar visible`);
        assert.ok(state.threeColoredPixels > 24, `${viewport.name}: el canvas BIM 3D no debe quedar en blanco`);
        assert.ok(state.nativeFragmentsWidth >= 320, `${viewport.name}: el canvas fragments nativo debe tener ancho estable`);
        assert.ok(state.nativeFragmentsHeight >= 200, `${viewport.name}: el canvas fragments nativo debe tener alto estable`);
        assert.ok(
            state.nativeFragmentsNonBackgroundPixels > 8,
            `${viewport.name}: el canvas fragments nativo no debe quedar en blanco`,
        );
        assert.equal(state.raycastMode, 'enabled', `${viewport.name}: el viewer BIM 3D debe exponer raycasting operativo`);
        assert.match(raycastHit || '', /^\d+$/, `${viewport.name}: el raycast 3D debe seleccionar un elemento BIM real`);
        assert.match(state.raycastGlobalId || '', /HARNESS-/, `${viewport.name}: el raycast 3D debe exponer GlobalId trazable`);
        assert.match(state.raycastIfcClass || '', /^Ifc/i, `${viewport.name}: el raycast 3D debe exponer clase IFC trazable`);
        assert.match(raycastHover || '', /^\d+$/, `${viewport.name}: el hover 3D debe detectar un elemento BIM real`);
        assert.equal(state.hoverElement, raycastHover, `${viewport.name}: el hover 3D debe quedar trazable en DOM`);
        assert.match(state.hoverGlobalId || '', /HARNESS-/, `${viewport.name}: el hover 3D debe exponer GlobalId trazable`);
        assert.match(state.hoverIfcClass || '', /^Ifc/i, `${viewport.name}: el hover 3D debe exponer clase IFC trazable`);
        assert.equal(state.threeControls, 'orbit', `${viewport.name}: el viewer BIM 3D debe exponer navegacion OrbitControls`);
        assert.match(focusedElement || '', /^\d+$/, `${viewport.name}: el viewer BIM 3D debe enfocar el elemento seleccionado`);
        assert.equal(state.focusedElement, focusedElement, `${viewport.name}: el foco 3D debe quedar trazable en DOM`);
        assert.match(state.focusedGlobalId || '', /HARNESS-/, `${viewport.name}: el foco 3D debe exponer GlobalId trazable`);
        assert.match(state.inspectorElement || '', /^\d+$/, `${viewport.name}: el inspector 3D debe exponer elemento trazable`);
        assert.match(state.inspectorGlobalId || '', /HARNESS-/, `${viewport.name}: el inspector 3D debe exponer GlobalId trazable`);
        assert.ok(state.inspectorProperties >= 0, `${viewport.name}: el inspector 3D debe exponer conteo de propiedades`);
        assert.equal(state.threeIfcFilter, 'all', `${viewport.name}: el viewer BIM 3D debe iniciar con filtro IFC total`);
        assert.ok(state.threeFilteredElements >= 3, `${viewport.name}: el viewer BIM 3D debe exponer elementos filtrados`);
        assert.ok(state.threeIfcFilterCount >= 3, `${viewport.name}: el viewer BIM 3D debe exponer filtros IFC reales`);
        assert.equal(state.threeHiddenIfcClasses, 0, `${viewport.name}: el viewer BIM 3D debe iniciar sin clases IFC ocultas`);
        assert.ok(state.threeVisibleIfcClasses >= 3, `${viewport.name}: el viewer BIM 3D debe exponer clases IFC visibles`);
        assert.ok(visibilityToggle, `${viewport.name}: debe existir control real de visibilidad IFC 3D`);
        assert.ok(visibilityToggle.hiddenAfterToggle >= 1, `${viewport.name}: el control debe ocultar una clase IFC 3D`);
        assert.ok(
            visibilityToggle.filteredAfterToggle < state.threeFilteredElements,
            `${viewport.name}: ocultar una clase IFC debe reducir elementos visibles 3D`,
        );
        assert.equal(visibilityToggle.hiddenAfterReset, 0, `${viewport.name}: reset debe restaurar visibilidad IFC 3D`);
        assert.equal(
            state.selectedElementId,
            raycastHit,
            `${viewport.name}: el raycast 3D debe sincronizar la seleccion BIM global`,
        );
        assert.equal(state.fragmentsState, 'loaded', `${viewport.name}: FragmentsModels debe cargar el fragments binario`);
        assert.ok(state.fragmentsBytes > 0, `${viewport.name}: el fragments binario cargado no debe quedar vacio`);
        assert.ok(state.fragmentsModels >= 1, `${viewport.name}: FragmentsModels debe registrar al menos un modelo`);
        assert.ok(state.fragmentsLocalIds >= 1, `${viewport.name}: el modelo fragments debe exponer localIds BIM consultables`);
        assert.ok(state.fragmentsGuids >= 1, `${viewport.name}: el modelo fragments debe exponer GlobalIds BIM consultables`);
        assert.ok(state.fragmentsItems >= 1, `${viewport.name}: el modelo fragments debe exponer ItemData consultable`);
        assert.match(state.fragmentsSampleLocalId || '', /^\d+$/, `${viewport.name}: el harness debe exponer localId de muestra`);
        assert.ok((state.fragmentsSampleGuid || '').length > 8, `${viewport.name}: el harness debe exponer GlobalId de muestra`);
        assert.ok(state.fragmentsSampleKeyCount >= 1, `${viewport.name}: el inspector ItemData debe exponer claves reales`);
        assert.ok((state.fragmentsSampleKeys || '').length >= 1, `${viewport.name}: el inspector ItemData debe listar claves reales`);
        assert.ok(
            (state.fragmentsSampleGuidResolved || '').length > 8,
            `${viewport.name}: el inspector ItemData debe resolver GlobalId real`,
        );
        assert.ok((state.fragmentsSampleType || '').length >= 1, `${viewport.name}: el inspector ItemData debe exponer tipo real`);
        assert.ok(state.fragmentsSpatialNodes >= 1, `${viewport.name}: el harness debe exponer nodos de estructura espacial`);
        assert.ok(state.fragmentsSpatialDepth >= 1, `${viewport.name}: el harness debe exponer profundidad espacial`);
        assert.ok(
            state.fragmentsSpatialRootChildren >= 1,
            `${viewport.name}: el harness debe exponer hijos de estructura espacial`,
        );
        assert.ok(state.fragmentsGeometryItems >= 1, `${viewport.name}: el harness debe exponer items con geometria`);
        assert.ok(state.fragmentsSampleBoxes >= 1, `${viewport.name}: el harness debe exponer caja geometrica de muestra`);
        assert.ok(state.fragmentsSampleVolume > 0, `${viewport.name}: el harness debe exponer volumen geometrico de muestra`);
        assert.ok(state.fragmentsCategories >= 1, `${viewport.name}: el harness debe exponer categorias IFC consultables`);
        assert.match(state.fragmentsActiveCategory || '', /IFC/i, `${viewport.name}: el harness debe seleccionar una categoria IFC activa`);
        assert.ok(state.fragmentsCategoryLocalIds >= 1, `${viewport.name}: la categoria IFC activa debe tener localIds`);
        assert.ok(state.fragmentsCategoryVisible >= 1, `${viewport.name}: la categoria IFC activa debe reportar elementos visibles`);
        assert.ok(state.fragmentsCategoryVolume > 0, `${viewport.name}: la categoria IFC activa debe exponer volumen`);
        assert.equal(state.fragmentsCategoryBox, 1, `${viewport.name}: la categoria IFC activa debe exponer caja geometrica`);
        assert.ok(state.fragmentsCategoryMaterials >= 0, `${viewport.name}: la categoria IFC activa debe exponer conteo de materiales`);
        assert.ok(
            state.fragmentsCategorySubsetBytes > 0,
            `${viewport.name}: la categoria IFC activa debe exponer subset fragments no vacio`,
        );
        assert.ok(
            state.fragmentsCategoryItemData >= 1,
            `${viewport.name}: la categoria IFC activa debe exponer ItemData batch`,
        );
        assert.ok(
            state.fragmentsCategoryItemKeyCount >= 1,
            `${viewport.name}: la categoria IFC activa debe exponer claves ItemData`,
        );
        assert.match(
            state.fragmentsCategoryItemKeys || '',
            /\w+/,
            `${viewport.name}: la categoria IFC activa debe exponer nombres de claves ItemData`,
        );
        assert.match(state.fragmentsRoundtripGuid || '', /\w+/, `${viewport.name}: el roundtrip debe resolver GlobalId`);
        assert.ok(state.fragmentsRoundtripLocalId, `${viewport.name}: el roundtrip debe resolver localId`);
        assert.equal(state.fragmentsRoundtripMatched, 1, `${viewport.name}: el roundtrip localId/GlobalId debe coincidir`);
        assert.equal(state.fragmentsNativeRaycast, 'hit', `${viewport.name}: el raycast nativo fragments debe devolver hit real`);
        assert.match(
            state.fragmentsNativeRaycastLocalId || '',
            /^\d+$/,
            `${viewport.name}: el raycast nativo fragments debe exponer localId`,
        );
        assert.match(
            state.fragmentsNativeRaycastGuid || '',
            /\w+/,
            `${viewport.name}: el raycast nativo fragments debe resolver GlobalId`,
        );
        assert.ok(
            state.fragmentsNativeSelectionKeyCount >= 1,
            `${viewport.name}: la seleccion nativa fragments debe exponer claves ItemData`,
        );
        assert.match(
            state.fragmentsNativeSelectionKeys || '',
            /\w+/,
            `${viewport.name}: la seleccion nativa fragments debe listar claves ItemData`,
        );
        assert.ok(
            (state.fragmentsNativeSelectionType || state.fragmentsNativeSelectionCategory || '').length >= 1,
            `${viewport.name}: la seleccion nativa fragments debe resolver tipo o categoria IFC`,
        );
        assert.ok(
            ['0', '1'].includes(state.fragmentsNativeSelectionVisible),
            `${viewport.name}: la seleccion nativa fragments debe exponer visibilidad`,
        );
        assert.equal(
            state.fragmentsNativePointerSelection,
            'enabled',
            `${viewport.name}: el canvas fragments nativo debe exponer seleccion por puntero habilitada`,
        );
        assert.ok(nativePointerSelection, `${viewport.name}: debe existir seleccion nativa por puntero`);
        assert.equal(
            nativePointerSelection.pointerSelection,
            'enabled',
            `${viewport.name}: la seleccion por puntero debe permanecer habilitada`,
        );
        assert.match(
            nativePointerSelection.operation || '',
            /seleccion nativa por puntero/,
            `${viewport.name}: pointerdown debe actualizar operacion de seleccion nativa`,
        );
        assert.match(
            nativePointerSelection.localId || '',
            /^\d+$/,
            `${viewport.name}: pointerdown debe resolver localId fragments`,
        );
        assert.match(
            nativePointerSelection.guid || '',
            /\w+/,
            `${viewport.name}: pointerdown debe resolver GlobalId fragments`,
        );
        assert.ok(
            nativePointerSelection.keyCount >= 1,
            `${viewport.name}: pointerdown debe mantener ItemData de seleccion nativa`,
        );
        assert.ok(nativeSelectionToggle, `${viewport.name}: debe existir control real de visibilidad de seleccion nativa`);
        assert.notEqual(
            nativeSelectionToggle.visibleAfterToggle,
            nativeSelectionToggle.visibleBefore,
            `${viewport.name}: alternar la seleccion nativa debe cambiar visibilidad`,
        );
        assert.equal(
            nativeSelectionToggle.visibleAfterReset,
            nativeSelectionToggle.visibleBefore,
            `${viewport.name}: alternar dos veces la seleccion nativa debe restaurar visibilidad`,
        );
        assert.ok(state.fragmentsVisibleTotal >= 1, `${viewport.name}: el modelo fragments debe reportar visibilidad total`);
        assert.equal(
            state.fragmentsNativeCategoryFilter,
            'all',
            `${viewport.name}: el filtro nativo fragments debe iniciar en modo total`,
        );
        assert.ok(
            fragmentsCategoryVisibilityToggle,
            `${viewport.name}: debe existir control real de visibilidad por categoria fragments`,
        );
        assert.ok(
            fragmentsCategoryVisibilityToggle.visibleAfterToggle < fragmentsCategoryVisibilityToggle.visibleBefore,
            `${viewport.name}: ocultar categoria fragments debe reducir visibles`,
        );
        assert.ok(
            fragmentsCategoryVisibilityToggle.hiddenAfterToggle > fragmentsCategoryVisibilityToggle.hiddenBefore,
            `${viewport.name}: ocultar categoria fragments debe aumentar ocultos`,
        );
        assert.equal(
            fragmentsCategoryVisibilityToggle.visibleAfterReset,
            fragmentsCategoryVisibilityToggle.visibleBefore,
            `${viewport.name}: reset fragments debe restaurar visibles de categoria`,
        );
        assert.equal(
            fragmentsCategoryVisibilityToggle.hiddenAfterReset,
            fragmentsCategoryVisibilityToggle.hiddenBefore,
            `${viewport.name}: reset fragments debe restaurar ocultos de categoria`,
        );
        assert.match(
            fragmentsCategoryVisibilityToggle.operationAfterReset || '',
            /visibilidad restaurada/,
            `${viewport.name}: reset fragments debe dejar operacion trazable`,
        );
        assert.ok(
            fragmentsNativeCategoryFilterToggle,
            `${viewport.name}: debe existir control real de filtro por categoria en canvas fragments nativo`,
        );
        assert.equal(
            fragmentsNativeCategoryFilterToggle.filterAfterToggle,
            'category',
            `${viewport.name}: aislar categoria debe activar filtro nativo por categoria`,
        );
        assert.ok(
            fragmentsNativeCategoryFilterToggle.filteredLocalIds >= 1,
            `${viewport.name}: aislar categoria debe reportar localIds filtrados`,
        );
        assert.equal(
            fragmentsNativeCategoryFilterToggle.filteredLocalIds,
            fragmentsNativeCategoryFilterToggle.categoryLocalIds,
            `${viewport.name}: los localIds filtrados deben coincidir con la categoria activa`,
        );
        assert.ok(
            fragmentsNativeCategoryFilterToggle.visibleAfterToggle <=
                fragmentsNativeCategoryFilterToggle.visibleBefore,
            `${viewport.name}: aislar categoria no debe aumentar visibles totales del canvas fragments`,
        );
        assert.equal(
            fragmentsNativeCategoryFilterToggle.categoryVisibleAfterToggle,
            fragmentsNativeCategoryFilterToggle.categoryLocalIds,
            `${viewport.name}: aislar categoria debe mantener visibles los localIds de la categoria activa`,
        );
        assert.equal(
            fragmentsNativeCategoryFilterToggle.categoryHiddenAfterToggle,
            0,
            `${viewport.name}: aislar categoria no debe ocultar localIds de la categoria activa`,
        );
        assert.match(
            fragmentsNativeCategoryFilterToggle.operationAfterToggle || '',
            /categoria aislada/,
            `${viewport.name}: aislar categoria debe dejar operacion trazable`,
        );
        assert.equal(
            fragmentsNativeCategoryFilterToggle.filterAfterReset,
            'all',
            `${viewport.name}: reset debe restaurar filtro nativo total`,
        );
        assert.equal(
            fragmentsNativeCategoryFilterToggle.filteredAfterReset,
            0,
            `${viewport.name}: reset debe limpiar contador de filtro nativo`,
        );
        assert.equal(
            fragmentsNativeCategoryFilterToggle.visibleAfterReset,
            fragmentsNativeCategoryFilterToggle.visibleBefore,
            `${viewport.name}: reset debe restaurar visibles tras filtro nativo`,
        );
        assert.equal(
            fragmentsNativeCategoryFilterToggle.hiddenAfterReset,
            fragmentsNativeCategoryFilterToggle.hiddenBefore,
            `${viewport.name}: reset debe restaurar ocultos tras filtro nativo`,
        );
        assert.equal(state.canvasIfcFilter, 'all', `${viewport.name}: el canvas BIM debe iniciar con filtro IFC total`);
        assert.ok(state.canvasFilteredElements >= 3, `${viewport.name}: el canvas BIM debe exponer elementos filtrados`);
        assert.ok(state.canvasIfcFilterCount >= 3, `${viewport.name}: el canvas BIM debe exponer filtros por clase IFC`);
        assert.equal(state.artifactSource, 'viewer-artifact', `${viewport.name}: el viewer 3D debe consumir artefacto optimizado`);
        assert.equal(state.artifactElements, '3', `${viewport.name}: el artefacto optimizado debe poblar elementos 3D`);
        assert.match(state.bodyText, /Muro harness|Losa harness|Leyenda BIM|Viewer BIM 3D/, `${viewport.name}: debe renderizar UI BIM visible`);
        assert.match(state.bodyText, /MOTOR BIM|FRAGMENTS CONSULTABLES|GLOBALID|ITEMDATA/i, `${viewport.name}: debe renderizar inspector fragments visible`);
        assert.match(state.bodyText, /INSPECTOR ITEMDATA|CLAVES|TIPO/i, `${viewport.name}: debe renderizar inspector ItemData trazable`);
        assert.match(state.bodyText, /ESTRUCTURA ESPACIAL|NODOS|PROFUNDIDAD/i, `${viewport.name}: debe renderizar estructura espacial fragments`);
        assert.match(state.bodyText, /GEOMETRIA FRAGMENTS|ITEMS|CAJAS|VOL/i, `${viewport.name}: debe renderizar geometria fragments trazable`);
        assert.match(state.bodyText, /CONTROL POR CATEGORIA IFC|VISIBILIDAD|RESET/i, `${viewport.name}: debe renderizar controles fragments reales`);
        assert.match(state.bodyText, /MEDICION CATEGORIA|VOL|CAJA|MATERIALES/i, `${viewport.name}: debe renderizar medicion por categoria`);
        assert.match(state.bodyText, /RAYCAST FRAGMENTS|ESTADO HIT/i, `${viewport.name}: debe renderizar raycast nativo fragments`);
        assert.match(state.bodyText, /SELECCION FRAGMENTS|CLAVES|TIPO|VISIBLE/i, `${viewport.name}: debe renderizar seleccion nativa fragments`);
        assert.match(state.bodyText, /SOLO CAT\.|FILTRO/i, `${viewport.name}: debe renderizar filtro nativo por categoria`);
        assert.match(state.bodyText, /IFCWALL|IFCSLAB|IFCGRID|IFC todas/i, `${viewport.name}: debe renderizar filtros IFC reales en el canvas`);
        assert.match(state.bodyText, /RAYCAST 3D|HIT 3D/i, `${viewport.name}: debe renderizar seleccion 3D real`);
        assert.match(state.bodyText, /HOVER 3D/i, `${viewport.name}: debe renderizar feedback de hover 3D real`);
        assert.match(state.bodyText, /ORBITCONTROLS|RESET VISTA 3D/i, `${viewport.name}: debe renderizar controles 3D profesionales`);
        assert.match(state.bodyText, /ENFOCAR ELEMENTO|FOCO 3D/i, `${viewport.name}: debe renderizar foco 3D profesional`);
        assert.match(state.bodyText, /INSPECTOR 3D|GLOBALID|PROPS/i, `${viewport.name}: debe renderizar inspector 3D con datos reales`);
        assert.match(state.bodyText, /IFC 3D|IFCWALL|IFCSLAB|IFCGRID/i, `${viewport.name}: debe renderizar filtros IFC 3D reales`);
        assert.match(state.bodyText, /VISIBILIDAD 3D|RESET/i, `${viewport.name}: debe renderizar controles reales de visibilidad IFC 3D`);
        assert.equal(state.hasHorizontalOverflow, false, `${viewport.name}: no debe producir overflow horizontal`);

        await page.close();
    }
} finally {
    await browser.close();
    cleanup();
}

console.log('validate-bim-viewer-dom: ok');
