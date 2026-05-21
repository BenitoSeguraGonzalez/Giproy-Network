import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const previewModalPath = path.join(root, 'src', 'components', 'reporting', 'CommonReportPreviewModal.jsx');
const source = fs.readFileSync(previewModalPath, 'utf8');

const requiredSnippets = [
    'typeof onExportPdf === \'function\'',
    'title="Exportar PDF"',
    'title="Exportar Excel"',
    'title="Exportar PDF desde Excel"',
    'GIPROY',
    'giproyAppIcon',
    'iconSrc={giproyAppIcon}',
    'iconClassName="h-6 w-auto"',
    'labelClassName="sr-only"',
    'className="w-[5.25rem]"',
    'documentAccent',
    'document-card',
];

const requiredPatterns = [
    />\s*GIPROY\s*<\/ReportExportButton>/,
    />\s*Excel\s*<\/ReportExportButton>/,
    />\s*PDF\s*<\/ReportExportButton>/,
];

const forbiddenSnippets = [
    '!(isEdoReport || isEdtReport)',
    'isEdoReport || isEdtReport) ? null',
    'PDF Documento',
    'PDF Excel',
    'Excel -&gt; PDF',
    'Exportar PDF directo',
    'Exportar PDF documental A4',
    'isHierarchyDocumentReport',
    'table-fixed border-collapse',
    'border-zinc-900',
    'title="Exportar Excel"\n                        variant="accent"',
    'variant="accent"',
    'reportExportButtonAccent',
    'bg-[#F39200] text-white',
    'border-l-4 ${documentAccent.border}',
    'border-l-[#136191]',
    'border-l-emerald-500',
];

for (const snippet of requiredSnippets) {
    if (!source.includes(snippet)) {
        throw new Error(`smoke-edo-edt-pdf-document-button: missing snippet: ${snippet}`);
    }
}

for (const pattern of requiredPatterns) {
    if (!pattern.test(source)) {
        throw new Error(`smoke-edo-edt-pdf-document-button: missing pattern: ${pattern}`);
    }
}

for (const snippet of forbiddenSnippets) {
    if (source.includes(snippet)) {
        throw new Error(`smoke-edo-edt-pdf-document-button: forbidden snippet found: ${snippet}`);
    }
}

const pdfIndex = source.indexOf('title="Exportar PDF"');
const excelIndex = source.indexOf('title="Exportar Excel"');
const excelToPdfIndex = source.indexOf('title="Exportar PDF desde Excel"');

if (!(pdfIndex < excelIndex && excelIndex < excelToPdfIndex)) {
    throw new Error('smoke-edo-edt-pdf-document-button: invalid export action order, expected GIPROY, Excel, PDF');
}

console.log('smoke-edo-edt-pdf-document-button: ok');
