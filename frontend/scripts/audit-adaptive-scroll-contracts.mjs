import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8');
const walkJsx = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const resolved = path.join(directory, entry.name);
  if (entry.isDirectory()) return walkJsx(resolved);
  return entry.isFile() && entry.name.endsWith('.jsx') ? [resolved] : [];
});

const routerSource = read('src', 'routes', 'AppRouter.jsx');
const protectedRoutes = [...routerSource.matchAll(/<Route\s+path="([^"]+)"\s+element=\{withProtectedLayout\(/g)].map((match) => match[1]);
if (protectedRoutes.length < 35) {
  throw new Error(`Inventario incompleto: solo se detectaron ${protectedRoutes.length} rutas protegidas`);
}

const layoutSource = read('src', 'layouts', 'AppLayout.jsx');
for (const contract of [
  'data-app-page-viewport',
  'h-full min-h-0 overflow-auto overscroll-contain',
  '[touch-action:pan-x_pan-y]',
]) {
  if (!layoutSource.includes(contract)) {
    throw new Error(`AppLayout no garantiza el contrato global de alcanzabilidad: falta ${contract}`);
  }
}

const sourceFiles = [
  ...walkJsx(path.join(root, 'src', 'pages')),
  ...walkJsx(path.join(root, 'src', 'components')),
];
const unguarded = [];

for (const file of sourceFiles) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const directWidths = [...line.matchAll(/(?:^|\s)min-w-\[(\d+)px\]/g)]
      .map((match) => Number(match[1]))
      .filter((width) => width >= 600);
    if (directWidths.length === 0) return;
    const ancestorWindow = lines.slice(Math.max(0, index - 60), index + 1).join(' ');
    if (!/overflow-(?:x-)?auto/.test(ancestorWindow)) {
      unguarded.push(`${path.relative(root, file)}:${index + 1} (${Math.max(...directWidths)}px)`);
    }
  });
}

if (unguarded.length > 0) {
  throw new Error(`Superficies anchas sin viewport horizontal alcanzable:\n${unguarded.join('\n')}`);
}

console.log(`audit-adaptive-scroll-contracts: ok (${protectedRoutes.length} rutas, ${sourceFiles.length} superficies JSX)`);
