import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const frontendDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const repositoryDir = path.resolve(frontendDir, '..');
const outputPath = path.join(repositoryDir, 'docs', 'quality', 'FRONTEND_ESLINT_BASELINE.md');
const eslint = new ESLint({ cwd: frontendDir });
const results = await eslint.lintFiles(['.']);
const affected = results.filter((result) => result.messages.length > 0);
const errors = affected.reduce((total, result) => total + result.errorCount, 0);
const warnings = affected.reduce((total, result) => total + result.warningCount, 0);
const normalize = (value) => String(value ?? '')
    .replaceAll('|', '\\|')
    .replaceAll(/\r?\n/gu, ' ')
    .replaceAll(/\s+/gu, ' ')
    .trim();
const relativeName = (filePath) => path.relative(frontendDir, filePath).replaceAll('\\', '/');
const ruleCounts = new Map();
for (const result of affected) {
    for (const message of result.messages) {
        const rule = message.ruleId || 'fatal/parsing';
        ruleCounts.set(rule, (ruleCounts.get(rule) || 0) + 1);
    }
}

const lines = [
    '# Baseline ESLint frontend',
    '',
    'Generado de forma reproducible con `npm run quality:eslint:baseline`.',
    'Este archivo registra deuda conocida; no convierte los hallazgos en aceptables.',
    '',
    `- Archivos afectados: ${affected.length}`,
    `- Errores: ${errors}`,
    `- Avisos: ${warnings}`,
    `- Total: ${errors + warnings}`,
    '',
    '## Resumen por regla',
    '',
    '| Regla | Hallazgos |',
    '|---|---:|',
    ...[...ruleCounts.entries()]
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .map(([rule, count]) => `| \`${rule}\` | ${count} |`),
    '',
    '## Hallazgos individuales',
    '',
];

for (const result of affected.sort((left, right) => relativeName(left.filePath).localeCompare(relativeName(right.filePath)))) {
    lines.push(`### ${relativeName(result.filePath)}`, '');
    lines.push('| # | Severidad | Linea | Columna | Regla | Mensaje |', '|---:|---|---:|---:|---|---|');
    result.messages.forEach((message, index) => {
        lines.push(`| ${index + 1} | ${message.severity === 2 ? 'ERROR' : 'AVISO'} | ${message.line || 0} | ${message.column || 0} | \`${message.ruleId || 'fatal/parsing'}\` | ${normalize(message.message)} |`);
    });
    lines.push('');
}

while (lines.at(-1) === '') lines.pop();
await writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`ESLint baseline written: ${affected.length} files, ${errors} errors, ${warnings} warnings.`);
