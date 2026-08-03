import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const datosProyectoSource = readFileSync(
    new URL('../src/components/projects/DatosProyecto.jsx', import.meta.url),
    'utf8',
);
const mediaUrlSource = readFileSync(
    new URL('../src/utils/mediaUrl.js', import.meta.url),
    'utf8',
);

assert.match(
    mediaUrlSource,
    /\/api\/v1\/proyecto-detalles\/media\/image-proxy\?path=/,
    'La imagen referencial debe usar el endpoint de media estable',
);
assert.match(
    datosProyectoSource,
    /const \[referentialImageFailed, setReferentialImageFailed\] = useState\(false\)/,
    'DatosProyecto debe controlar el fallo de carga de la imagen referencial',
);
assert.match(
    datosProyectoSource,
    /onError=\{\(\) => setReferentialImageFailed\(true\)\}/,
    'La previsualizacion debe degradar limpiamente cuando el archivo no existe',
);
assert.match(
    datosProyectoSource,
    /La imagen referencial no está disponible/,
    'La ausencia del archivo debe presentar un estado legible y no un icono roto',
);

console.log('smoke-classic-project-referential-image: ok');
