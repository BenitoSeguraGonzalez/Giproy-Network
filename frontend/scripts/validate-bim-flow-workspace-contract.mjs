import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const flow = read('src/components/bim/BimFlowWorkspace.jsx');
const fragments = read('src/components/bim/BimFragmentsViewport.jsx');
const imports = read('src/components/bim/BimImportJobsPanel.jsx');
const tab = read('src/components/projects/BimTab.jsx');
const plan = read('../docs/architecture/BIM_FLOW_ADECUACION_PLAN.md');

const required = [
  'data-bim-flow-workspace',
  'data-bim-tri-sync-status',
  'data-bim-coordination-gate',
  'BimImportJobsPanel',
  'BimCostEstimatePanel',
  'BimGanttPanel',
  'BimCoordinationControlPanel',
  'BimReportsPanel',
  'BimHandoverDossierPanel',
  'presupuestosApi',
  'cronogramasApi',
  'empresasApi',
  'proyectosApi',
  'BimFragmentsViewport',
  'BimViewerEmptyState',
  'data-bim-viewer-empty',
];
for (const token of required) {
  if (!flow.includes(token)) throw new Error(`contrato BIM incompleto: falta ${token}`);
}
if (!tab.includes('BimFlowWorkspace')) throw new Error('BimTab no enruta al flujo nuevo');
if (tab.includes('import BimWorkspace from')) throw new Error('BimTab todavía enruta al workspace antiguo');
if (flow.includes('<canvas')) throw new Error('el flujo nuevo no debe montar visor 3D por defecto');
for (const token of ['IfcImporter', 'source_ifc', 'importer.process', 'web-ifc.wasm?url']) {
  if (!fragments.includes(token)) throw new Error(`contrato IFC/Fragments incompleto: falta ${token}`);
}
if (!imports.includes('onImportReadyRef.current?.();')) throw new Error('la revision IFC debe refrescar el workspace al decidir una version');
for (const token of ['sincronización', 'Modelo', 'Presupuesto 5D', 'Planificación 4D', 'Coordinación', 'Entrega']) {
  if (!plan.toLocaleLowerCase().includes(token.toLocaleLowerCase())) throw new Error(`documento de flujo sin criterio: ${token}`);
}
console.log('validate-bim-flow-workspace-contract: ok');
