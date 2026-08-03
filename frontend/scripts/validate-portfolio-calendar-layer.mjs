import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('src/pages/Proyectos.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');
const calendarStart = source.indexOf('title="Calendario del portafolio"');
const modalStart = source.indexOf('<AppModalShell', calendarStart);
const modalEnd = source.indexOf('<AppModalHeader', modalStart);
const calendarModalOpening = source.slice(modalStart, modalEnd);

if (!calendarModalOpening.includes('zIndex="z-[1000]"')) {
  throw new Error('El calendario del portafolio debe permanecer por encima de la cabecera general.');
}

console.log('OK: el calendario del portafolio conserva una capa superior segura.');
