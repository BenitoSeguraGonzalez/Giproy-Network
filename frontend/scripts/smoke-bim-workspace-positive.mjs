import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const readSource = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');
const exists = (relativePath) => existsSync(new URL(relativePath, import.meta.url));

const bimWorkspaceSource = readSource('../src/components/bim/BimWorkspace.jsx');
const bimPlanning4dSource = readSource('../src/components/bim/BimPlanning4dPanel.jsx');
const bimCanvasSource = readSource('../src/components/bim/BimCanvasViewer.jsx');
const bimFragmentsHarnessSource = readSource('../src/components/bim/BimFragmentsHarness.jsx');
const bimFragmentsBinaryFixtureSource = readSource('../src/components/bim/bimFragmentsBinaryFixture.js');
const bimThreeSource = readSource('../src/components/bim/BimThreeViewer.jsx');
const bimViewerArtifactAdapterSource = readSource('../src/components/bim/bimViewerArtifactAdapter.js');
const bimFragmentsSmokeIfcSource = readSource('../src/components/bim/bimFragmentsSmokeIfc.js');
const bimFragmentsVolumeIfcSource = readSource('../src/components/bim/bimFragmentsVolumeIfc.js');
const bimViewerHarnessSource = readSource('../src/features/bim/BimViewerHarness.jsx');
const bimModelsApiSource = readSource('../src/api/bimModels.js');
const bimImportJobsSource = readSource('../src/components/bim/BimImportJobsPanel.jsx');
const bimQualityReportSource = readSource('../src/components/bim/BimQualityReportPanel.jsx');
const bimFragmentsProductSource = readSource('../src/components/bim/BimFragmentsViewport.jsx');
const bimTabSource = readSource('../src/components/projects/BimTab.jsx');
const proyectosSource = readSource('../src/pages/Proyectos.jsx');
const packageSource = readSource('../package.json');
const fragmentsSmokeSource = readSource('./smoke-bim-fragments-importer.mjs');
const fragmentsVolumeSmokeSource = readSource('./smoke-bim-fragments-volume.mjs');
const realDatasetCorpusSmokeSource = readSource('./smoke-bim-real-dataset-corpus.mjs');
const realIfcCsgSmokeSource = readSource('./smoke-bim-real-ifc-csg.mjs');
const realIfcFragmentsChildSource = readSource('./smoke-bim-real-ifc-fragments-child.mjs');

const requiredBimFiles = [
    '../src/api/bim.js',
    '../src/api/bimModels.js',
    '../src/api/bimLinks.js',
    '../src/api/bimViewStates.js',
    '../src/api/adminBim.js',
    '../src/hooks/bim/useBimFeatureAccess.js',
    '../src/hooks/bim/useBimProjectWorkspace.js',
    '../src/features/bim/BimViewerHarness.jsx',
    '../src/components/bim/BimWorkspace.jsx',
    '../src/components/bim/BimImportJobsPanel.jsx',
    '../src/components/bim/BimQualityReportPanel.jsx',
    '../src/components/bim/BimFragmentsViewport.jsx',
    '../src/features/bim/BimFragmentsProductHarness.jsx',
    '../bim-fragments-product-harness.html',
    './validate-bim-fragments-product-dom.mjs',
    '../src/components/bim/BimCanvasViewer.jsx',
    '../src/components/bim/BimFragmentsHarness.jsx',
    '../src/components/bim/bimFragmentsBinaryFixture.js',
    '../src/components/bim/bimFragmentsSmokeIfc.js',
    '../src/components/bim/bimFragmentsVolumeIfc.js',
    '../src/components/bim/BimThreeViewer.jsx',
    '../src/components/bim/bimViewerArtifactAdapter.js',
    './smoke-bim-fragments-importer.mjs',
    './smoke-bim-fragments-volume.mjs',
    './smoke-bim-real-dataset-corpus.mjs',
    './smoke-bim-real-ifc-csg.mjs',
    './smoke-bim-real-ifc-fragments-child.mjs',
    '../src/bim-fragments-csg-harness.jsx',
    '../bim-fragments-csg-harness.html',
    './validate-bim-fragments-csg-dom.mjs',
    '../src/components/bim/BimLinksPanel.jsx',
    '../src/components/bim/BimPropertiesPanel.jsx',
    '../src/components/bim/BimTreePanel.jsx',
    '../src/components/bim/BimVersionSelector.jsx',
    '../src/components/bim/BimViewStateToolbar.jsx',
    '../src/components/bim/BimResourceCapacityPanel.jsx',
    '../src/components/bim/BimSpaceTimeConflictPanel.jsx',
    '../src/components/bim/BimGanttPanel.jsx',
    '../src/components/bim/BimReportsPanel.jsx',
    '../src/components/bim/BimConstructiblePartitionPanel.jsx',
    '../src/components/bim/BimEquipmentMotionPanel.jsx',
    '../src/components/bim/BimSafetyRiskPanel.jsx',
    '../bim-safety-harness.html',
    './validate-bim-safety-dom.mjs',
    './validate-bim-advanced-4d-gate.mjs',
    '../bim-equipment-motion-harness.html',
    './validate-bim-equipment-motion-dom.mjs',
    '../bim-partition-harness.html',
    './validate-bim-partition-dom.mjs',
    './validate-bim-partition-csg-product-dom.mjs',
    '../src/bim-csg-harness.jsx',
    '../bim-csg-harness.html',
    './validate-bim-csg-dom.mjs',
];

for (const relativePath of requiredBimFiles) {
    assert.equal(exists(relativePath), true, `Debe existir el artefacto BIM dedicado: ${relativePath}`);
}

assert.match(packageSource, /"three-bvh-csg"\s*:\s*"\^0\.0\.18"/, 'El gate CSG BIM debe fijar el motor geometrico autorizado');
for (const token of ['bsi-pcert-ifc4-architecture', 'IfcAPI', 'INTERSECTION', 'globalId', 'conservation_delta']) {
    assert.equal(realIfcCsgSmokeSource.includes(token), true, `El smoke CSG IFC real debe trazar ${token}`);
}
assert.match(realIfcFragmentsChildSource, /IfcImporter[\s\S]*importer\.process/, 'El subproceso debe convertir la fuente IFC real a Fragments');

const forbiddenWorkspaceImports = [
    '../../axiosConfig',
    '../axiosConfig',
    'src/pages',
    '../projects/',
    '../../pages/',
    '../../components/projects/',
    '../../components/presupuesto',
    '../../components/cronogramas',
    '../../components/edt',
];

for (const token of forbiddenWorkspaceImports) {
    assert.equal(
        bimWorkspaceSource.includes(token),
        false,
        `BimWorkspace no debe importar dependencias clasicas ni axiosConfig directo: ${token}`,
    );
}

assert.match(
    bimWorkspaceSource,
    /from\s+['"]\.\.\/\.\.\/api\/bimModels['"]/,
    'BimWorkspace debe consumir modelos BIM mediante cliente de dominio en frontend/src/api',
);
for (const componentName of ['BimResourceCapacityPanel', 'BimSpaceTimeConflictPanel', 'BimPlanning4dPanel', 'BimReportsPanel', 'BimConstructiblePartitionPanel', 'BimEquipmentMotionPanel', 'BimSafetyRiskPanel']) {
    assert.equal(bimWorkspaceSource.includes(`<${componentName}`), true, `BimWorkspace debe montar ${componentName}`);
}
for (const componentName of ['BimTimeline4dPanel', 'BimGanttPanel']) {
    assert.equal(bimPlanning4dSource.includes(`<${componentName}`), true, `La superficie 4D integrada debe montar ${componentName}`);
}
for (const apiMethod of ['get4dGantt', 'get4dSpaceTimeConflicts', 'list4dResources', 'get4dResourceHistogram', 'get4dReport', 'download4dReportCsv']) {
    assert.equal(bimModelsApiSource.includes(`${apiMethod}:`), true, `bimModelsApi debe exponer ${apiMethod}`);
}
for (const apiMethod of ['create4dPartitionCsgArtifact', 'list4dPartitionCsgArtifacts']) {
    assert.equal(bimModelsApiSource.includes(`${apiMethod}:`), true, `bimModelsApi debe exponer ${apiMethod}`);
}
assert.match(
    bimWorkspaceSource,
    /from\s+['"]\.\.\/\.\.\/api\/bimViewStates['"]/,
    'BimWorkspace debe consumir view states BIM mediante cliente de dominio en frontend/src/api',
);
assert.match(
    bimWorkspaceSource,
    /from\s+['"]\.\.\/\.\.\/hooks\/bim\/useBimProjectWorkspace['"]/,
    'BimWorkspace debe consumir workspace mediante hook BIM dedicado',
);
assert.match(
    bimWorkspaceSource,
    /<BimCanvasViewer[\s\S]*elements=\{visibleElements\}/,
    'BimWorkspace debe montar el canvas BIM con elementos filtrados del workspace',
);
assert.match(
    bimWorkspaceSource,
    /<BimThreeViewer[\s\S]*elements=\{visibleElements\}/,
    'BimWorkspace debe montar el viewer BIM 3D con elementos filtrados del workspace',
);
assert.doesNotMatch(
    bimWorkspaceSource,
    /validatePayloadsBeforeImport|importJsonPackage|importJsonBatch/,
    'El workspace unico no debe recuperar el importador JSON embebido del layout anterior',
);
assert.match(
    bimImportJobsSource,
    /\.endsWith\(['"]\.ifc['"]\)[\s\S]*createIfcImportJob/,
    'La administracion V2 debe conservar la importacion IFC real mediante jobs observables',
);
assert.match(
    bimModelsApiSource,
    /registerIfcManifest:\s*async\s*\(projectId,\s*payload,\s*empresaId\s*=\s*null\)[\s\S]*\/bim\/projects\/\$\{projectId\}\/imports\/ifc-manifest[\s\S]*withTenantConfig\(\{\},\s*empresaId\)/,
    'bimModelsApi debe exponer registro de manifiesto IFC mediante cliente BIM de dominio y tenant config',
);
assert.match(
    bimModelsApiSource,
    /createIfcImportJob:[\s\S]*\/imports\/ifc-jobs[\s\S]*listImportJobs:[\s\S]*\/imports\/jobs[\s\S]*cancelImportJob:[\s\S]*\/cancel[\s\S]*retryImportJob:[\s\S]*\/retry/,
    'bimModelsApi debe exponer el ciclo observable de jobs IFC mediante cliente BIM de dominio',
);
assert.match(bimWorkspaceSource, /const\s+adminTools\s*=\s*canCreateCompanyScope/, 'BimWorkspace debe aislar herramientas administrativas por capacidad');
assert.match(bimWorkspaceSource, /<BimImportJobsPanel/, 'BimWorkspace debe montar el panel de jobs IFC dentro del perímetro administrativo');
assert.match(
    bimImportJobsSource,
    /listImportJobs[\s\S]*setTimeout\(loadJobs,\s*1500\)[\s\S]*clearTimeout[\s\S]*createIfcImportJob[\s\S]*cancelImportJob[\s\S]*retryImportJob/,
    'El panel BIM debe consultar progreso, limitar polling y exponer cancelacion/reintento reales',
);
assert.match(
    bimModelsApiSource,
    /getIfcQualityReport:[\s\S]*\/quality-report[\s\S]*generateIfcQualityReport:[\s\S]*\/quality-report/,
    'bimModelsApi debe exponer lectura y generacion del reporte de calidad IFC',
);
assert.match(
    bimModelsApiSource,
    /listArtifacts:[\s\S]*\/artifacts[\s\S]*registerArtifact:[\s\S]*FormData[\s\S]*validateArtifact:[\s\S]*\/validate[\s\S]*rollbackArtifact:[\s\S]*\/rollback/,
    'bimModelsApi debe exponer lifecycle de artifacts BIM mediante cliente de dominio',
);
assert.match(
    bimWorkspaceSource,
    /import\s+BimQualityReportPanel[\s\S]*<BimQualityReportPanel[\s\S]*versionId=/,
    'BimWorkspace debe mostrar calidad IFC para la version seleccionada',
);
for (const token of ['step_status', 'schema_status', 'semantic_status', 'entity_ref', 'contract_version']) {
    assert.equal(bimQualityReportSource.includes(token), true, `El panel de calidad IFC debe exponer ${token}`);
}
for (const token of ['FragmentsModels', 'ResizeObserver', 'webglcontextlost', 'pointerdown', 'fragments.dispose', 'renderer?.dispose']) {
    assert.equal(bimFragmentsProductSource.includes(token), true, `El viewport Fragments de producto debe implementar ${token}`);
}
assert.match(
    bimWorkspaceSource,
    /import\s+BimFragmentsViewport[\s\S]*<BimFragmentsViewport[\s\S]*versionId=[\s\S]*onSelectGuid=/,
    'BimWorkspace debe montar el viewport Fragments de producto y sincronizar seleccion GUID',
);
assert.match(
    bimModelsApiSource,
    /importIfcText:\s*async\s*\(projectId,\s*payload,\s*empresaId\s*=\s*null\)[\s\S]*\/bim\/projects\/\$\{projectId\}\/imports\/ifc-text[\s\S]*withTenantConfig\(\{\},\s*empresaId\)/,
    'bimModelsApi debe exponer importacion IFC semantica inicial mediante cliente BIM de dominio y tenant config',
);
assert.match(
    bimModelsApiSource,
    /importIfcFile:\s*async\s*\(projectId,\s*payload,\s*empresaId\s*=\s*null\)[\s\S]*new\s+FormData\(\)[\s\S]*\/bim\/projects\/\$\{projectId\}\/imports\/ifc-file[\s\S]*multipart\/form-data/,
    'bimModelsApi debe exponer importacion IFC por archivo local mediante FormData y cliente BIM de dominio',
);
assert.match(
    bimModelsApiSource,
    /generateViewerArtifact:\s*async\s*\(projectId,\s*versionId,\s*empresaId\s*=\s*null\)[\s\S]*\/bim\/projects\/\$\{projectId\}\/versions\/\$\{versionId\}\/artifacts\/viewer[\s\S]*withTenantConfig\(\{\},\s*empresaId\)/,
    'bimModelsApi debe exponer generacion de artefacto optimizado para viewer BIM mediante cliente de dominio',
);

assert.match(bimCanvasSource, /const\s+canvasRef\s*=\s*useRef\(null\)/, 'BimCanvasViewer debe tener referencia canvas propia');
assert.match(bimCanvasSource, /getContext\(['"]2d['"]\)/, 'BimCanvasViewer debe renderizar sobre canvas 2D no vacio');
assert.match(bimCanvasSource, /onPointerDown=\{handlePointerDown\}/, 'BimCanvasViewer debe soportar seleccion/interaccion por puntero');
assert.match(bimCanvasSource, /onWheel=\{handleWheel\}/, 'BimCanvasViewer debe soportar navegacion/zoom del viewport');
assert.match(bimCanvasSource, /buildElementLayout/, 'BimCanvasViewer debe normalizar geometria BIM simplificada');
assert.match(
    bimCanvasSource,
    /activeIfcClass[\s\S]*ifcClassFilters[\s\S]*data-bim-canvas-ifc-filter[\s\S]*IFC \{activeIfcClass === 'all'/,
    'BimCanvasViewer debe exponer filtro operativo por clase IFC sobre elementos reales',
);
assert.match(bimThreeSource, /import\s+\*\s+as\s+THREE\s+from\s+['"]three['"]/, 'BimThreeViewer debe usar Three.js como base 3D BIM');
assert.match(
    bimThreeSource,
    /import\s+\{\s*OrbitControls\s*\}\s+from\s+['"]three\/examples\/jsm\/controls\/OrbitControls\.js['"]/,
    'BimThreeViewer debe usar OrbitControls de Three.js para navegacion 3D profesional',
);
assert.match(bimThreeSource, /new\s+THREE\.WebGLRenderer/, 'BimThreeViewer debe renderizar una escena WebGL local');
assert.match(bimThreeSource, /data-bim-three-canvas/, 'BimThreeViewer debe exponer canvas 3D verificable por harness');
assert.match(bimThreeSource, /data-bim-artifact-source/, 'BimThreeViewer debe exponer fuente de artefacto verificable por harness');
assert.match(bimThreeSource, /artifactSource|ifcClassFilters/, 'BimThreeViewer debe declarar fuente de artefacto y filtros IFC dentro del viewer');
assert.match(
    bimThreeSource,
    /new\s+OrbitControls\(camera,\s*renderer\.domElement\)[\s\S]*controls\.update\(\)[\s\S]*data-bim-three-controls="orbit"[\s\S]*data-bim-three-reset-view="true"/,
    'BimThreeViewer debe exponer navegacion OrbitControls y reset de camara',
);
assert.match(
    bimThreeSource,
    /selectedSceneElement[\s\S]*handleFocusSelectedElement[\s\S]*data-bim-three-focus-element[\s\S]*data-bim-three-focus-selected="true"[\s\S]*Enfocar selección/,
    'BimThreeViewer debe exponer foco 3D del elemento seleccionado con trazabilidad DOM',
);
assert.match(
    bimThreeSource,
    /onSelectElementRef[\s\S]*new\s+THREE\.Raycaster\(\)[\s\S]*intersectObjects[\s\S]*data-bim-three-raycast-hit/,
    'BimThreeViewer debe exponer seleccion 3D operativa con raycaster y callback trazable',
);
assert.match(
    bimThreeSource,
    /raycastHover[\s\S]*pointermove[\s\S]*data-bim-three-hover-element/,
    'BimThreeViewer debe exponer hover 3D operativo con raycaster y trazabilidad DOM',
);
assert.match(
    bimThreeSource,
    /inspectedSceneElement[\s\S]*data-bim-three-inspector-element[\s\S]*data-bim-three-inspector-global-id/,
    'BimThreeViewer debe exponer inspector 3D real para hover/seleccion con GlobalId trazable',
);
assert.match(
    bimThreeSource,
    /activeIfcClass[\s\S]*ifcClassFilters[\s\S]*visibleThreeElements[\s\S]*data-bim-three-ifc-filter/,
    'BimThreeViewer debe exponer filtro IFC 3D operativo sobre elementos reales',
);
assert.match(
    bimThreeSource,
    /hiddenIfcClasses[\s\S]*toggleIfcClassVisibility[\s\S]*data-bim-three-hidden-ifc-classes[\s\S]*data-bim-three-reset-visibility/,
    'BimThreeViewer debe exponer visibilidad IFC 3D operativa con reset trazable',
);
assert.equal(
    /group\.rotation\.y\s*\+=/.test(bimThreeSource),
    false,
    'BimThreeViewer no debe depender de autorrotacion cuando hay OrbitControls operativos',
);
assert.match(
    bimViewerArtifactAdapterSource,
    /export\s+const\s+adaptViewerArtifactToElements[\s\S]*bounds_2d[\s\S]*viewer_artifact/,
    'El viewer 3D debe tener adaptador BIM dedicado para consumir artefacto optimizado JSON',
);
assert.match(
    bimViewerHarnessSource,
    /viewerArtifact[\s\S]*artifact_type:\s*['"]giproy_bim_viewer_artifact['"][\s\S]*<BimThreeViewer[\s\S]*viewerArtifact=\{viewerArtifact\}/,
    'El harness BIM debe validar el flujo artefacto viewer -> BimThreeViewer',
);
assert.match(
    bimViewerHarnessSource,
    /<BimThreeViewer[\s\S]*onSelectElement=\{setSelectedElement\}/,
    'El harness BIM debe validar seleccion 3D conectada al estado BIM',
);
assert.match(
    fragmentsSmokeSource,
    /import\s+\{\s*IfcImporter\s*\}\s+from\s+['"]@thatopen\/fragments['"][\s\S]*importer\.process[\s\S]*byteLength\s*>\s*0/,
    'El cierre BIM debe mantener smoke local de fragments binarios reales mediante IfcImporter',
);
assert.match(
    bimFragmentsSmokeIfcSource,
    /ISO-10303-21[\s\S]*IFCWALL[\s\S]*END-ISO-10303-21/,
    'El harness fragments debe compartir fixture IFC controlado dentro del perimetro BIM',
);
assert.match(
    bimFragmentsHarnessSource,
    /import\s+\{\s*FragmentsModels\s*\}\s+from\s+['"]@thatopen\/fragments['"][\s\S]*getBimFragmentsSmokeBytes[\s\S]*new\s+FragmentsModels[\s\S]*fragments\.load[\s\S]*data-bim-fragments-state/,
    'El harness BIM debe cargar fragments binarios con FragmentsModels y exponer estado DOM verificable',
);
assert.match(
    bimFragmentsHarnessSource,
    /await\s+model\.getLocalIds\(\)[\s\S]*await\s+model\.getGuids\(\)/,
    'El harness BIM debe esperar localIds y GlobalIds consultables desde FragmentsModels',
);
assert.match(
    bimFragmentsHarnessSource,
    /await\s+model\.getItemsData\(\[sampleLocalId\],\s*\{\s*attributesDefault:\s*true\s*\}\)[\s\S]*data-bim-fragments-items/,
    'El harness BIM debe consultar ItemData real desde FragmentsModels',
);
assert.match(
    bimFragmentsHarnessSource,
    /summarizeItemData[\s\S]*Object\.keys\(item\)[\s\S]*data-bim-fragments-sample-key-count[\s\S]*Inspector ItemData/,
    'El harness BIM debe exponer inspector ItemData profundo con claves reales y trazabilidad DOM',
);
assert.match(
    bimFragmentsHarnessSource,
    /getSpatialStructure[\s\S]*summarizeSpatialTree[\s\S]*data-bim-fragments-spatial-nodes[\s\S]*Estructura espacial/,
    'El harness BIM debe exponer estructura espacial real desde FragmentsModels',
);
assert.match(
    bimFragmentsHarnessSource,
    /getItemsWithGeometry[\s\S]*getBoxes[\s\S]*getItemsVolume[\s\S]*data-bim-fragments-geometry-items[\s\S]*Geometria fragments/,
    'El harness BIM debe exponer geometria y medicion consultable desde FragmentsModels',
);
assert.match(
    bimFragmentsHarnessSource,
    /Fragments consultables[\s\S]*Motor BIM \/ fragments[\s\S]*GlobalId[\s\S]*ItemData/,
    'El harness BIM debe mostrar un inspector frontend visible para fragments consultables',
);
for (const token of [
    'getCategories',
    'getItemsOfCategories',
    'getVisible',
    'getMergedBox',
    'getItemsVolume',
    'getGuidsByLocalIds',
    'getLocalIdsByGuids',
    'getSubsetBuffer',
    'toggleVisible',
    'resetVisible',
    'data-bim-fragments-active-category',
    'data-bim-fragments-category-volume',
    'data-bim-fragments-category-subset-bytes',
    'data-bim-fragments-category-itemdata',
    'data-bim-fragments-roundtrip-matched',
    'model.raycast',
    'data-bim-fragments-native-canvas',
    'data-bim-fragments-native-raycast',
    'data-bim-fragments-native-selection-keys',
    'data-bim-fragments-native-selection-type',
    'data-bim-fragments-native-selection-visible',
    'data-bim-fragments-native-selection-toggle',
    'data-bim-fragments-native-pointer-selection',
    'data-bim-fragments-native-category-filter',
    'data-bim-fragments-native-category-filter-button',
    'data-bim-fragments-category-visibility-toggle',
    'data-bim-fragments-category-visibility-reset',
    'Control por categoria IFC',
    'Trazabilidad GUID',
    'Medicion categoria',
    'Subset fragments',
    'ItemData categoria',
    'Raycast fragments',
    'Seleccion fragments',
    'Puntero',
    'Solo cat.',
    'Visible',
]) {
    assert.equal(
        bimFragmentsHarnessSource.includes(token),
        true,
        `El harness BIM debe exponer controles frontend reales de categoria y visibilidad sobre FragmentsModels: ${token}`,
    );
}
assert.match(
    bimFragmentsBinaryFixtureSource,
    /BIM_FRAGMENTS_SMOKE_BASE64[\s\S]*window\.atob[\s\S]*Uint8Array/,
    'El harness BIM debe cargar bytes fragments binarios reales desde fixture controlado',
);
assert.match(
    bimFragmentsVolumeIfcSource,
    /buildBimFragmentsVolumeIfc[\s\S]*IFCWALL[\s\S]*IFCRELCONTAINEDINSPATIALSTRUCTURE/,
    'El cierre BIM debe mantener builder IFC de volumen representativo',
);
assert.match(
    fragmentsVolumeSmokeSource,
    /IfcImporter[\s\S]*byteLength\s*>\s*baseBytes\.byteLength[\s\S]*smoke-bim-fragments-volume/,
    'El cierre BIM debe validar fragments de volumen contra el fixture base',
);
assert.match(
    realDatasetCorpusSmokeSource,
    /IfcImporter[\s\S]*giproy_bim_dataset_manifest_v1[\s\S]*sha256[\s\S]*small[\s\S]*medium[\s\S]*large/,
    'El corpus IFC real debe conservar checksum, escalas y conversion Fragments reproducible',
);
assert.match(
    bimViewerHarnessSource,
    /import\s+BimFragmentsHarness[\s\S]*<BimFragmentsHarness\s*\/>/,
    'El harness visual BIM debe montar la carga fragments aislada',
);

const packageJson = JSON.parse(packageSource);
for (const dependencyName of ['three', 'web-ifc', '@thatopen/components', '@thatopen/components-front', '@thatopen/fragments']) {
    assert.equal(
        typeof packageJson.dependencies?.[dependencyName],
        'string',
        `El cierre BIM debe mantener dependencia autorizada IFC/3D: ${dependencyName}`,
    );
}

assert.equal(
    /console\.log\(/.test(`${bimWorkspaceSource}\n${bimCanvasSource}\n${bimThreeSource}`),
    false,
    'Los componentes BIM productivos no deben introducir console.log',
);

assert.match(
    bimTabSource,
    /import\s+BimWorkspace\s+from\s+['"]\.\.\/bim\/BimWorkspace['"]/,
    'BimTab debe ser solo wrapper hacia el workspace BIM dedicado',
);
assert.match(
    proyectosSource,
    /useBimFeatureAccess[\s\S]*const\s+bimEnabled\s*=\s*!bimAccessLoading\s*&&\s*bimAccess\.enabled[\s\S]*BIM_SECTION/,
    'Proyectos debe exponer BIM solo mediante la puerta de acceso existente',
);
assert.match(
    proyectosSource,
    /activeTab\s*===\s*['"]bim['"]\s*&&\s*bimEnabled\s*\?[\s\S]*<BimTab[\s\S]*onNavigateTarget=\{handleBimNavigateTarget\}/,
    'Proyectos debe montar el workspace BIM y su retorno de vinculos solo con acceso positivo',
);
assert.match(
    proyectosSource,
    /BIM_TARGET_TABS[\s\S]*edt:\s*['"]edt_wbs['"][\s\S]*presupuesto:\s*['"]presupuesto['"][\s\S]*setBimNavigationContext[\s\S]*initialFocusNodeId[\s\S]*initialFocusLineId/,
    'La navegacion BIM debe enfocar EDT y Presupuesto mediante sus contratos clasicos existentes',
);
assert.match(
    proyectosSource,
    /targetType\s*===\s*['"]apu['"][\s\S]*PROJECT_APU_EDITOR_QUERY[\s\S]*apu_id:[\s\S]*project_id:[\s\S]*return_tab:\s*['"]bim['"]/,
    'La navegacion BIM hacia APU debe reutilizar el retorno contextual seguro a Proyecto',
);

console.log('smoke-bim-workspace-positive: ok');
