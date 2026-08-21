import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const viewport = read('src/components/bim/BimFragmentsViewport.jsx');
const worker = read('src/components/bim/ifcFragmentsWorker.js');

if (!worker.includes('IfcImporter')) throw new Error('El worker debe encapsular IfcImporter');
if (!worker.includes('self.onmessage')) throw new Error('El worker debe exponer un canal de mensajes');
if (!viewport.includes("new Worker(new URL('./ifcFragmentsWorker.js', import.meta.url)")) {
    throw new Error('El visor debe convertir IFC dentro de un Web Worker');
}
if (viewport.includes('await importer.process({ bytes: sourceBytes, raw: false })')) {
    throw new Error('La conversión IFC no puede ejecutarse en el hilo principal');
}
if (!viewport.includes('worker.terminate()')) throw new Error('La conversión debe cancelarse al desmontar');
console.log('validate-bim-ifc-worker-contract: ok');
