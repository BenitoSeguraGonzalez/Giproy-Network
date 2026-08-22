import fs from 'node:fs';

const help = fs.readFileSync(new URL('../src/components/ui/ContextualHelpPanel.jsx', import.meta.url), 'utf8');
const bim = fs.readFileSync(new URL('../src/components/bim/BimWorkspaceV2.jsx', import.meta.url), 'utf8');
const shell = fs.readFileSync(new URL('../src/layouts/AppLayout.jsx', import.meta.url), 'utf8');

for (const [source, checks] of [[help, ['data-contextual-help-panel', 'aria-modal="true"', 'omniClassEnabled === false', 'project: {']], [bim, ['data-contextual-help-trigger', 'ContextualHelpPanel', 'omniClassEnabled']], [shell, ['data-contextual-help-trigger="shell"', "guide={location.pathname.startsWith('/proyectos') ? 'project' : 'overview'}"]]]) {
  for (const check of checks) {
    if (!source.includes(check)) throw new Error(`Falta contrato de ayuda contextual: ${check}`);
  }
}

console.log('validate-contextual-help-dom: ok');
