import { IfcImporter } from '@thatopen/fragments';
import webIfcWasmUrl from 'web-ifc/web-ifc.wasm?url';

self.onmessage = async (event) => {
    try {
        const importer = new IfcImporter();
        importer.wasm = { path: webIfcWasmUrl, absolute: true };
        importer.includeUniqueAttributes = true;
        importer.includeRelationNames = true;
        const bytes = await importer.process({ bytes: new Uint8Array(event.data.bytes), raw: false });
        const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        self.postMessage({ ok: true, bytes: buffer }, [buffer]);
    } catch (error) {
        self.postMessage({ ok: false, error: error?.message || 'No se pudo convertir el IFC.' });
    }
};
