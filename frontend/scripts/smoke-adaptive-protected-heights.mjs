import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const protectedPages = [
  'Dashboard.jsx',
  'PreciosUnitarios.jsx',
  'BasesTrabajo.jsx',
  'Subcategorias.jsx',
  'Community.jsx',
  'Settings.jsx',
  'AdminGlobal.jsx',
  'AdminGlobalAuditoria.jsx',
  'AdminGlobalBim.jsx',
  'AdminGlobalComunicados.jsx',
  'AdminGlobalEmail.jsx',
  'AdminGlobalEmpresaAuditada.jsx',
  'AdminGlobalEmpresas.jsx',
  'AdminGlobalEstado.jsx',
  'AdminGlobalGobernanza.jsx',
  'AdminGlobalHerramientas.jsx',
  'AdminGlobalImportModels.jsx',
  'AdminGlobalIntegraciones.jsx',
  'AdminGlobalLicencias.jsx',
  'AdminGlobalMantenimiento.jsx',
  'AdminGlobalSesiones.jsx',
  'AdminGlobalSuperadministradores.jsx',
];

const forbidden = [
  'h-[calc(100vh-theme(spacing.20))]',
  'h-[calc(100vh-5rem)]',
];

for (const file of protectedPages) {
  const source = fs.readFileSync(path.join(root, 'src', 'pages', file), 'utf8');
  if (!source.includes('h-full min-h-0')) {
    throw new Error(`${file}: falta la raiz basada en la altura del contenedor`);
  }
  for (const token of forbidden) {
    if (source.includes(token)) {
      throw new Error(`${file}: conserva una compensacion de viewport obsoleta (${token})`);
    }
  }
}

const projectsSource = fs.readFileSync(path.join(root, 'src', 'pages', 'Proyectos.jsx'), 'utf8');
if (!projectsSource.includes('h-[calc(100dvh-10rem)] max-h-full')) {
  throw new Error('Proyectos.jsx: el calendario no limita su altura al viewport dinamico y al modal');
}
if (!projectsSource.includes('h-full min-h-0 overflow-hidden bg-[#F2F4F7]')) {
  throw new Error('Proyectos.jsx: el portafolio permite desplazar la pagina completa');
}
if (!projectsSource.includes('data-projects-list-viewport')
  || !projectsSource.includes('h-full min-h-0 overflow-auto overscroll-contain [touch-action:pan-x_pan-y]')) {
  throw new Error('Proyectos.jsx: el listado no es el propietario exclusivo del scroll tactil');
}
if (!projectsSource.includes('w-full min-w-[1180px] table-fixed')) {
  throw new Error('Proyectos.jsx: la tabla no conserva su ancho operativo en tablet');
}

console.log(`smoke-adaptive-protected-heights: ok (${protectedPages.length} paginas)`);
