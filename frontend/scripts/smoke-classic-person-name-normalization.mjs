import fs from 'node:fs';
import path from 'node:path';
import { normalizePersonName } from '../src/utils/descriptionCapitalization.js';

const root = process.cwd();

const cases = [
    ['Jesús benito segura', 'Jesús Benito Segura'],
    ['SANTIAGO BERMEO QUINDE', 'Santiago Bermeo Quinde'],
    ['maria   jose   perez lopez', 'Maria Jose Perez Lopez'],
    ['ANA-MARÍA DEL CISNE', 'Ana-María Del Cisne'],
];

for (const [input, expected] of cases) {
    const actual = normalizePersonName(input);
    if (actual !== expected) {
        throw new Error(`person-name-normalization: expected "${expected}", got "${actual}"`);
    }
}

const requiredFiles = [
    ['src/components/projects/Edo.jsx', 'normalizePersonName'],
    ['src/components/projects/Edt.jsx', 'normalizePersonName'],
    ['src/components/projects/Stakeholders.jsx', 'normalizePersonName'],
    ['src/components/projects/HierarchyGraphView.jsx', 'normalizePersonName'],
    ['src/components/reporting/CommonReportPreviewModal.jsx', 'normalizeReportPersonName'],
    ['src/components/reporting/CommonReportPreviewModal.jsx', 'resolveDocumentTitleValue'],
    ['src/components/reporting/CommonReportPreviewModal.jsx', 'isDocumentPersonLine'],
    ['src/utils/classicPrintEngine.js', 'normalizePersonName'],
];

for (const [relativePath, snippet] of requiredFiles) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    if (!source.includes(snippet)) {
        throw new Error(`person-name-normalization: missing ${snippet} in ${relativePath}`);
    }
}

const forbiddenPatterns = [
    ['src/components/projects/Stakeholders.jsx', /font-black uppercase text-\[#1A1A1A\]/],
    ['src/components/projects/HierarchyGraphView.jsx', /font-black uppercase tracking-\[0\.08em\] text-\[#16304a\]/],
];

for (const [relativePath, pattern] of forbiddenPatterns) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    if (pattern.test(source)) {
        throw new Error(`person-name-normalization: forbidden uppercase person-name pattern in ${relativePath}`);
    }
}

const reportPreviewSource = fs.readFileSync(path.join(root, 'src/components/reporting/CommonReportPreviewModal.jsx'), 'utf8');
if (!reportPreviewSource.includes('const lineTitle = resolveDocumentTitleValue(linea, titleKey, reportKind)')) {
    throw new Error('person-name-normalization: documentary line titles must preserve person-name normalization');
}

console.log('smoke-classic-person-name-normalization: ok');
