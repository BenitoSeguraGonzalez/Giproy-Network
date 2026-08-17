import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [pageSource, modalSource] = await Promise.all([
  readFile(new URL('../src/pages/Proyectos.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/projects/ProjectRecycleModal.jsx', import.meta.url), 'utf8'),
]);

assert.match(pageSource, /lazyWithChunkRecovery\(\(\) => import\('\.\.\/components\/projects\/ProjectRecycleModal'\)\)/u, 'La papelera debe usar lazy loading recuperable');
assert.match(pageSource, /setRecycleModalActivated\(true\)[\s\S]*?setShowRecycleModal\(true\)/u, 'La activación debe ocurrir antes de abrir');
assert.match(pageSource, /recycleModalActivated \? \([\s\S]*?<Suspense/u, 'El chunk no debe pedirse antes del primer uso');
assert.match(pageSource, /Preparando papelera de proyectos/u, 'Debe existir fallback local accesible');

for (const marker of [
  'projects={recycledProjects}',
  'loading={recycleLoading}',
  'actionId={recycleActionId}',
  'onRefresh={fetchRecycledProjects}',
  'onRestore={handleRestoreRecycledProject}',
  'onPurge={handlePurgeRecycledProject}',
]) {
  assert.ok(pageSource.includes(marker), `Falta contrato del modal extraído: ${marker}`);
}

for (const marker of [
  'Papelera de proyectos',
  'Retención operativa de 7 días',
  'Cargando papelera...',
  'Sin proyectos en papelera',
  'onRestore(project)',
  'onPurge(project)',
  'onClick={onRefresh}',
  'motion-reduce:animate-none',
]) {
  assert.ok(modalSource.includes(marker), `Falta estado o acción de papelera: ${marker}`);
}

console.log('OK: papelera de Proyectos aislada bajo lazy boundary');
