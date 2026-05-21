import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const engineSource = readFileSync(new URL('../src/utils/classicPrintEngine.js', import.meta.url), 'utf8');
const modalSource = readFileSync(new URL('../src/components/reporting/ClassicPrintOptionsModal.jsx', import.meta.url), 'utf8');
const edoSource = readFileSync(new URL('../src/components/projects/Edo.jsx', import.meta.url), 'utf8');
const edtSource = readFileSync(new URL('../src/components/projects/Edt.jsx', import.meta.url), 'utf8');
const cronogramasSource = readFileSync(new URL('../src/components/projects/Cronogramas.jsx', import.meta.url), 'utf8');

['supportsPagination', 'PRINT_MODES', 'Paginada', 'rowsPerPage', 'paginationItemLabel'].forEach((token) => {
    assert.equal(
        modalSource.includes(token),
        true,
        `El modal comun de laminas debe exponer modo completo/paginado solo cuando el consumidor lo habilita: ${token}`,
    );
});

assert.match(
    edoSource,
    /downloadClassicHierarchyPdf\(\{[\s\S]*moduleType:\s*'edo'[\s\S]*printMode[\s\S]*rowsPerPage/,
    'EDO debe enviar modo de impresion y elementos por pagina al motor comun de jerarquia.',
);

assert.match(
    edtSource,
    /downloadClassicHierarchyPdf\(\{[\s\S]*moduleType:\s*'edt'[\s\S]*printMode[\s\S]*rowsPerPage/,
    'EDT debe enviar modo de impresion y elementos por pagina al motor comun de jerarquia.',
);

assert.match(
    cronogramasSource,
    /supportsPagination=\{classicPrintTarget === 'gantt'\}/,
    'Cronogramas debe habilitar paginacion solo para Presentacion Gantt.',
);

assert.match(
    cronogramasSource,
    /paginationItemLabel=\{classicPrintTarget === 'gantt' \? 'actividades' : 'elementos'\}/,
    'Presentacion Gantt debe mostrar actividades por pagina sin cambiar la etiqueta general de EDO/EDT.',
);

assert.match(
    cronogramasSource,
    /downloadClassicGanttPresentationPdf\(\{[\s\S]*printMode[\s\S]*rowsPerPage/,
    'Presentacion Gantt debe enviar modo de impresion y filas por pagina al motor comun.',
);

assert.doesNotMatch(
    cronogramasSource,
    /downloadClassicCurvePdf\(\{[\s\S]*printMode[\s\S]*\}\);/,
    'Curva S no debe recibir modo paginado ni ampliacion de impresion.',
);

['normalizePrintMode', 'splitHierarchyPrintPages', 'chunkArray', 'PRINT_MODE_PAGINATED'].forEach((token) => {
    assert.equal(
        engineSource.includes(token),
        true,
        `El motor comun debe centralizar la paginacion sin crear motores paralelos: ${token}`,
    );
});

assert.match(
    engineSource,
    /rawPoints\.every\(\(point\) => point\.y >= pageStartY && point\.y <= pageEndY\)/,
    'El Gantt paginado debe recortar dependencias al rango visible de la pagina.',
);

assert.doesNotMatch(
    engineSource,
    /window\.print\(|captureElementAsJpeg|foreignObject|XMLSerializer|getBoundingClientRect\(\)/,
    'La paginacion de laminas no debe reactivar captura DOM ni dialogo nativo de impresion.',
);

console.log('smoke-classic-print-pagination: ok');
