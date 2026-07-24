import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const frontendRoot = path.resolve(import.meta.dirname, '..');
const sourceRoot = path.join(frontendRoot, 'src');
const routerPath = path.join(sourceRoot, 'routes', 'AppRouter.jsx');
const outputPath = path.resolve(frontendRoot, '..', 'docs', 'architecture', 'visual-surface-inventory.json');
const checkOnly = process.argv.includes('--check');

const profiles = [
    { id: 'desktop-fhd-100', viewport: [1920, 1080], dpr: 1, touch: false },
    { id: 'desktop-fhd-125', viewport: [1536, 864], dpr: 1.25, touch: false },
    { id: 'desktop-fhd-150', viewport: [1280, 720], dpr: 1.5, touch: false },
    { id: 'desktop-4k-200', viewport: [1920, 1080], dpr: 2, touch: false },
    { id: 'tablet-fhd-landscape', viewport: [1280, 720], dpr: 1.5, touch: true },
    { id: 'tablet-fhd-portrait', viewport: [720, 1200], dpr: 1.5, touch: true },
    { id: 'tablet-2k-landscape', viewport: [1280, 800], dpr: 2, touch: true },
    { id: 'tablet-2k-portrait', viewport: [800, 1280], dpr: 2, touch: true },
    { id: 'lenovo-p12-landscape', viewport: [1472, 820], dpr: 2, touch: true },
    { id: 'lenovo-p12-portrait', viewport: [920, 1372], dpr: 2, touch: true },
];

const toPosix = (value) => value.split(path.sep).join('/');

async function walk(directory) {
    const entries = await readdir(directory);
    const files = [];
    for (const entry of entries.sort()) {
        const absolute = path.join(directory, entry);
        const details = await stat(absolute);
        if (details.isDirectory()) files.push(...await walk(absolute));
        else files.push(absolute);
    }
    return files;
}

const routerSource = await readFile(routerPath, 'utf8');
const importMap = new Map();
for (const match of routerSource.matchAll(/(?:import\s+(\w+)\s+from\s+|const\s+(\w+)\s*=.*?import\()(['"])(\.\.[^'"]+)\3/g)) {
    importMap.set(match[1] || match[2], match[4]);
}

const routes = [];
for (const match of routerSource.matchAll(/<Route\s+path="([^"]+)"\s+element=\{([^\n]+)\}/g)) {
    const routePath = match[1];
    const expression = match[2];
    const component = expression.match(/<([A-Z][A-Za-z0-9]*)\s*\/?/u)?.[1] ?? null;
    routes.push({
        id: `route:${routePath}`,
        kind: 'route',
        mode: routePath.includes('bim') ? 'bim' : 'classic',
        access: expression.includes('withProtectedLayout') ? 'protected' : 'public',
        path: routePath,
        component,
        source: component && importMap.has(component) ? `${importMap.get(component).replace(/^\.\.\//, 'src/')}.jsx` : 'src/routes/AppRouter.jsx',
        profiles: profiles.map(({ id }) => id),
    });
}

const allFiles = await walk(sourceRoot);
const jsxFiles = allFiles.filter((file) => /\.(jsx|tsx)$/u.test(file));
const surfacePattern = /\b(Dialog|Modal|Drawer|Sheet|Popover|Overlay|Panel|Table|Grid|Canvas|Viewer|Workspace|Gantt|Timeline|Map)\b/u;
const surfaceFiles = [];
for (const file of jsxFiles) {
    const source = await readFile(file, 'utf8');
    if (!surfacePattern.test(source) && !surfacePattern.test(path.basename(file))) continue;
    const relative = toPosix(path.relative(frontendRoot, file));
    const names = [...source.matchAll(/(?:const|function|class)\s+([A-Z][A-Za-z0-9]*(?:Dialog|Modal|Drawer|Sheet|Popover|Overlay|Panel|Table|Grid|Canvas|Viewer|Workspace|Gantt|Timeline|Map)[A-Za-z0-9]*)/gu)]
        .map((match) => match[1]);
    surfaceFiles.push({
        id: `component:${relative}`,
        kind: 'interactive-surface-file',
        mode: relative.includes('/bim/') ? 'bim' : 'classic',
        source: relative,
        namedSurfaces: [...new Set(names)].sort(),
        profiles: profiles.map(({ id }) => id),
    });
}

const htmlFiles = (await readdir(frontendRoot)).filter((name) => /-harness\.html$/u.test(name)).sort();
const scriptsRoot = path.join(frontendRoot, 'scripts');
const validatorFiles = (await readdir(scriptsRoot))
    .filter((name) => /^(?:validate|certify)-.*\.mjs$/u.test(name))
    .sort();
const validatorsSource = await Promise.all(validatorFiles.map(async (name) => ({
    name,
    source: await readFile(path.join(scriptsRoot, name), 'utf8'),
})));

const harnesses = htmlFiles.map((name) => {
    const stem = name.replace(/-harness\.html$/u, '');
    const validators = validatorsSource
        .filter(({ source }) => source.includes(name))
        .map(({ name: validator }) => validator);
    validators.push('certify-visual-surface-matrix.mjs');
    return {
        id: `harness:${name}`,
        kind: 'harness',
        mode: stem.startsWith('bim-') ? 'bim' : 'classic',
        path: `/${name}`,
        source: name,
        validators: [...new Set(validators)].sort(),
        profiles: profiles.map(({ id }) => id),
    };
});

const inventory = {
    schemaVersion: 1,
    generatedFrom: [
        'frontend/src/routes/AppRouter.jsx',
        'frontend/src/**/*.{jsx,tsx}',
        'frontend/*-harness.html',
        'frontend/scripts/{validate,certify}-*.mjs',
    ],
    profiles,
    counts: {
        routes: routes.length,
        protectedRoutes: routes.filter(({ access }) => access === 'protected').length,
        publicRoutes: routes.filter(({ access }) => access === 'public').length,
        interactiveSurfaceFiles: surfaceFiles.length,
        harnesses: harnesses.length,
        harnessesWithoutValidator: harnesses.filter(({ validators }) => validators.length === 0).length,
    },
    routes,
    interactiveSurfaceFiles: surfaceFiles,
    harnesses,
};

const serialized = `${JSON.stringify(inventory, null, 2)}\n`;
if (checkOnly) {
    const current = await readFile(outputPath, 'utf8').catch(() => '');
    if (current !== serialized) {
        console.error('visual-surface-inventory.json is stale; run npm run inventory:visual.');
        process.exit(1);
    }
    console.log(`Visual inventory current: ${routes.length} routes, ${surfaceFiles.length} interactive files, ${harnesses.length} harnesses.`);
} else {
    await writeFile(outputPath, serialized, 'utf8');
    console.log(`Visual inventory written: ${routes.length} routes, ${surfaceFiles.length} interactive files, ${harnesses.length} harnesses.`);
}
