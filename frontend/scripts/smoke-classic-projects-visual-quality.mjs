import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/pages/Proyectos.jsx', import.meta.url), 'utf8');

const kanbanConfig = source.slice(
  source.indexOf('const PROJECTS_KANBAN_COLUMNS'),
  source.indexOf('const PORTFOLIO_CALENDAR_PREVIEW_LIMIT'),
);

assert.doesNotMatch(kanbanConfig, /emoji/u, 'El Kanban no debe depender de emoji como iconografía estructural');
for (const icon of ['Circle', 'Pencil', 'FileText', 'Building2', 'CheckCircle2']) {
  assert.match(kanbanConfig, new RegExp(`icon: ${icon}`), `Falta icono vectorial de fase: ${icon}`);
}
assert.match(source, /const PhaseIcon = column\.icon/u, 'Las fases deben renderizar el icono configurado');
assert.match(source, /role="status"[\s\S]*?aria-live="polite"/u, 'La carga de sección debe anunciarse');
assert.match(source, /motion-reduce:animate-none/u, 'El spinner debe respetar movimiento reducido');

console.log('OK: calidad visual y accesible del portafolio de Proyectos');
