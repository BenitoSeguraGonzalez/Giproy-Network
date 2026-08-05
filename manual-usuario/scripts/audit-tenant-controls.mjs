import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDir, '..', '..');
const frontendRoot = path.join(repositoryRoot, 'frontend', 'src');
const outputPath = path.join(repositoryRoot, 'manual-usuario', 'coverage-report.json');
const manualPath = path.join(repositoryRoot, 'manual-usuario', 'index.html');

const tenantPages = [
  'Dashboard.jsx',
  'Proyectos.jsx',
  'ProjectManager.jsx',
  'PreciosUnitarios.jsx',
  'BasesTrabajo.jsx',
  'Subcategorias.jsx',
  'Recursos.jsx',
  'APUs.jsx',
  'Presupuestos.jsx',
  'Community.jsx',
  'EnviosTransferencias.jsx',
  'Marketplace.jsx',
  'MarketplaceProductDetail.jsx',
  'MarketplaceOrderDetail.jsx',
  'MarketplaceBuyerDashboard.jsx',
  'SellerDashboard.jsx',
  'MarketplaceAdminDashboard.jsx',
  'Settings.jsx',
];

const collectFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolutePath = path.join(directory, entry.name);
  if (entry.isDirectory()) return collectFiles(absolutePath);
  return /\.(jsx|js)$/.test(entry.name) ? [absolutePath] : [];
});

const sourceFiles = [
  ...tenantPages.map((name) => path.join(frontendRoot, 'pages', name)),
  ...collectFiles(path.join(frontendRoot, 'components', 'bim')),
  ...collectFiles(path.join(frontendRoot, 'components', 'projects')),
  ...collectFiles(path.join(frontendRoot, 'components', 'presupuestos')),
  ...collectFiles(path.join(frontendRoot, 'components', 'precios-unitarios')),
].filter(fs.existsSync);

const clean = (value) => value
  .replace(/\s+/g, ' ')
  .replace(/&amp;/g, '&')
  .trim();

const captureLiteralAttributes = (source, attribute) => {
  const values = [];
  const expression = new RegExp(`${attribute}=(?:"([^"]+)"|'([^']+)')`, 'g');
  for (const match of source.matchAll(expression)) {
    const value = clean(match[1] || match[2] || '');
    if (value && !value.includes('${')) values.push(value);
  }
  return values;
};

const captureModalTitles = (source) => {
  const values = [];
  const expression = /<AppModalHeader[\s\S]{0,500}?title=(?:"([^"]+)"|'([^']+)')/g;
  for (const match of source.matchAll(expression)) {
    const value = clean(match[1] || match[2] || '');
    if (value) values.push(value);
  }
  return values;
};

const captureButtonText = (source) => {
  const values = [];
  const expression = /<(?:button|LiquidButton)\b[^>]*>([\s\S]{0,240}?)<\/(?:button|LiquidButton)>/g;
  for (const match of source.matchAll(expression)) {
    const withoutTags = match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\{[^}]+\}/g, ' ');
    const value = clean(withoutTags);
    if (value.length >= 2 && value.length <= 90) values.push(value);
  }
  return values;
};

const unique = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'es'));
const isHumanFacingLabel = (value) => (
  value.length >= 2
  && value.length <= 120
  && !/[{}]|className|=>|setMode|transition\(|decide\(|onClick/i.test(value)
);
const normalizeForCoverage = (value) => clean(value)
  .toLocaleLowerCase('es')
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
  .trim();

const manualText = normalizeForCoverage(
  fs.readFileSync(manualPath, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' '),
);

// Este control vive en Proyectos.jsx, pero la propia página lo renderiza solo
// para el rol superadministrador y una empresa técnica concreta. No forma parte
// de la interfaz de empresa que audita este informe.
const excludedNonTenantControls = new Set(['Importar SOCE/SERCOP']);

const files = sourceFiles.map((absolutePath) => {
  const source = fs.readFileSync(absolutePath, 'utf8');
  const controls = unique([
    ...captureLiteralAttributes(source, 'aria-label'),
    ...captureLiteralAttributes(source, 'title'),
    ...captureModalTitles(source),
    ...captureButtonText(source),
  ]).filter(isHumanFacingLabel);
  return {
    file: path.relative(repositoryRoot, absolutePath).replaceAll('\\', '/'),
    aria_labels: unique(captureLiteralAttributes(source, 'aria-label')).filter(isHumanFacingLabel),
    titles: unique(captureLiteralAttributes(source, 'title')).filter(isHumanFacingLabel),
    modal_titles: unique(captureModalTitles(source)).filter(isHumanFacingLabel),
    button_text: unique(captureButtonText(source)).filter(isHumanFacingLabel),
    undocumented_controls: controls.filter((value) => {
      if (excludedNonTenantControls.has(value)) return false;
      const normalized = normalizeForCoverage(value);
      return normalized.length >= 3 && !manualText.includes(normalized);
    }),
  };
}).filter((item) => (
  item.aria_labels.length
  + item.titles.length
  + item.modal_titles.length
  + item.button_text.length
) > 0);

const summary = files.reduce((totals, item) => ({
  files: totals.files + 1,
  aria_labels: totals.aria_labels + item.aria_labels.length,
  titles: totals.titles + item.titles.length,
  modal_titles: totals.modal_titles + item.modal_titles.length,
  button_text: totals.button_text + item.button_text.length,
  undocumented_controls: totals.undocumented_controls + item.undocumented_controls.length,
}), { files: 0, aria_labels: 0, titles: 0, modal_titles: 0, button_text: 0, undocumented_controls: 0 });

fs.writeFileSync(outputPath, `${JSON.stringify({
  generated_at: new Date().toISOString(),
  scope: 'Interfaz de empresa; se excluyen deliberadamente las páginas AdminGlobal.',
  summary,
  files,
}, null, 2)}\n`);

process.stdout.write(`${JSON.stringify(summary)}\n`);
