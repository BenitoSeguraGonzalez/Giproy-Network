import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/components/presupuestos/ApuEditorModal.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

if (!source.includes('fixed inset-0 z-[1000]')) {
  throw new Error('El editor APU del presupuesto debe cubrir la cabecera general y mantener visibles Guardar y Cerrar.');
}

console.log('OK: el editor APU del presupuesto conserva una capa superior segura.');
