import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/pages/Proyectos.jsx', import.meta.url), 'utf8');

const count = (value) => source.split(value).length - 1;

assert.equal(count('const renderProjectDeleteModal = () => ('), 1, 'Debe existir una única implementación del modal');
assert.equal(count('¿Eliminar Proyecto?'), 1, 'El contenido de primera confirmación no debe duplicarse');
assert.equal(count('CONFIRMACIÓN FINAL'), 1, 'La confirmación final no debe duplicarse');
assert.equal(count('Mover a Papelera'), 1, 'La acción destructiva debe tener una única fuente');
assert.equal(count('{renderProjectDeleteModal()}'), 2, 'Ambas vistas deben reutilizar el mismo modal');

for (const marker of [
  'setDeleteStep(2)',
  'setDeleteProjectBase((value) => !value)',
  'disabled={deleting}',
  'onClick={handleDeleteProject}',
  'Esta acción moverá el proyecto y sus revisiones a papelera durante 7 días.',
]) {
  assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Falta contrato de borrado: ${marker}`);
}

console.log('OK: modal de borrado de Proyectos con fuente única');
