import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sourcePath = resolve('src/components/projects/FormulaPolinomicaTab.jsx');
const source = readFileSync(sourcePath, 'utf8');

const requiredFragments = [
  "const useWideWorkbench = !isCompactViewport && viewport.width >= 1440;",
  "FORMULA_PANEL_RESIZER_WIDTH_PX",
  "formulaWorkbenchGridStyle",
  "role=\"separator\"",
  "aria-label=\"Ajustar ancho entre recursos e índices\"",
  "handleFormulaResizePointerDown",
  "grid-cols-[220px_minmax(0,1fr)]",
  "giproy-motion-scrollbar-hide h-full overflow-auto",
  "FORMULA_GRID_PANEL_CLASS",
  "FORMULA_GRID_HEADER_CLASS",
  "border-t border-[#ececec] bg-[#f2f2f0] p-3 text-center",
];

const forbiddenFragments = [
  "grid-cols-12 items-stretch min-h-[360px] max-h-[420px]",
  "grid grid-cols-12 gap-4",
  "col-span-7 min-h-0",
  "col-span-5 min-h-0",
  "flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm",
];

const failures = [];

for (const fragment of requiredFragments) {
  if (!source.includes(fragment)) {
    failures.push(`Falta fragmento responsive requerido: ${fragment}`);
  }
}

for (const fragment of forbiddenFragments) {
  if (source.includes(fragment)) {
    failures.push(`Permanece fragmento de layout apilado antiguo: ${fragment}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('formula-polinomica-responsive-smoke=ok');
console.log('viewport_target=1920x1080');
console.log('wide_workbench=true');
console.log('main_panels=resources:left,indices:right');
console.log('scroll_strategy=internal-panels');
