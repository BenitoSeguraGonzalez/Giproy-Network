import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/components/projects/GanttParetoModal.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

if (!source.includes('fixed inset-0 z-[1000]')) {
  throw new Error('La ventana Pareto debe permanecer por encima de la cabecera del proyecto.');
}

console.log('OK: la ventana Pareto conserva una capa superior segura.');
