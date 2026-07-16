import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const datosProyectoSource = readFileSync(new URL('../src/components/projects/DatosProyecto.jsx', import.meta.url), 'utf8');

assert.equal(
    /\bconsole\.log\s*\(/.test(datosProyectoSource),
    false,
    'DatosProyecto no debe conservar console.log productivos',
);

for (const importStatement of [
    "import { maestrosApi } from '../../api/maestros';",
    "import { proyectoDetalleApi } from '../../api/proyectoDetalle';",
    "import { proyectosApi } from '../../api/proyectos';",
    "import reportingApi from '../../api/reporting';",
    "import { geocodingApi } from '../../api/geocoding';",
]) {
    assert.equal(
        datosProyectoSource.includes(importStatement),
        true,
        `DatosProyecto debe conservar cliente/API critico: ${importStatement}`,
    );
}

for (const token of [
    'maestrosApi.getCantones(provincia)',
    'proyectoDetalleApi.getByRoot(project.codigo_root || project.codigo, empId)',
    'loadCategorias(detalle.tipo_proyecto_id)',
    'loadCantones(detalle.provincia)',
    'geocodingApi.queryOverpass(query)',
    'geocodingApi.searchNominatim(params)',
]) {
    assert.equal(
        datosProyectoSource.includes(token),
        true,
        `DatosProyecto debe conservar flujo critico: ${token}`,
    );
}

console.log('smoke-classic-datos-proyecto-logging-boundary: ok');
