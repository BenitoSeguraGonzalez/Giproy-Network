import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const engineSource = readFileSync(path.resolve(__dirname, '../src/utils/classicPrintEngine.js'), 'utf8');

const requiredSnippets = [
  "['Formato', doc.safeSize]",
  '<span>Formato</span><span>${safeSize}</span>',
  'const resolveEdoNodeDetail',
  'person.role ? person.role.toUpperCase()',
];

for (const snippet of requiredSnippets) {
  if (!engineSource.includes(snippet)) {
    throw new Error(`Falta contrato grafico clasico: ${snippet}`);
  }
}

for (const forbidden of ['HIJOS ', '<span>Papel</span>', "['Papel'"]) {
  if (engineSource.includes(forbidden)) {
    throw new Error(`Contrato grafico clasico obsoleto detectado: ${forbidden}`);
  }
}

console.log('smoke-classic-edo-stakeholders-reporting: ok');
