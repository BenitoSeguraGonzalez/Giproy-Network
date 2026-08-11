import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { publicAuthApi } from '../api/publicAuth';

const documents = {
    terminos: {
        title: 'Términos y Condiciones',
        version: '2026-08-11',
        intro: 'Regulan el acceso y uso de GiProy Network como plataforma de gestión de proyectos.',
        sections: [
            ['Objeto y cuenta', 'El usuario debe proporcionar información veraz, proteger sus credenciales y usar el servicio dentro de las facultades concedidas por su organización.'],
            ['Servicio', 'GiProy ofrece funciones de planificación, presupuesto, colaboración y gestión documental. Las funciones beta pueden cambiar y se identificarán como tales.'],
            ['Contenido del cliente', 'El cliente conserva sus derechos sobre la información que incorpora y concede únicamente los permisos técnicos necesarios para alojarla, procesarla y respaldarla durante la prestación.'],
            ['Uso permitido', 'No se permite vulnerar seguridad, eludir controles, infringir derechos de terceros ni utilizar el servicio para actividades ilícitas.'],
            ['Disponibilidad y responsabilidad', 'Los niveles de servicio, soporte, precio, vigencia y límites aplicables son los indicados en la orden o contrato del cliente, dentro de los límites permitidos por la ley ecuatoriana.'],
            ['Terminación y ley aplicable', 'La terminación, exportación y eliminación de datos se rigen por el contrato y la normativa ecuatoriana aplicable.'],
        ],
    },
    privacidad: {
        title: 'Política de Privacidad',
        version: '2026-08-11',
        intro: 'Describe el tratamiento de datos personales asociado a GiProy Network conforme al marco ecuatoriano.',
        sections: [
            ['Datos tratados', 'Datos de identificación, contacto, empresa, acceso, seguridad, soporte y uso estrictamente necesarios para operar y proteger el servicio.'],
            ['Finalidades', 'Crear y administrar cuentas, prestar el servicio, verificar identidad empresarial, prevenir fraude, atender soporte y cumplir obligaciones legales. La publicidad requiere autorización separada.'],
            ['Base y conservación', 'El tratamiento se sustenta según corresponda en consentimiento, relación contractual, obligación legal o interés legítimo. Los datos se conservan sólo durante el plazo necesario y los periodos legales aplicables.'],
            ['Destinatarios y encargados', 'Pueden intervenir proveedores de infraestructura y soporte sujetos a instrucciones, confidencialidad y medidas de seguridad. No se venden datos personales.'],
            ['Derechos', 'El titular puede solicitar información, acceso, rectificación, actualización, eliminación, oposición, portabilidad o suspensión cuando proceda legalmente.'],
            ['Seguridad e incidentes', 'Se aplican controles técnicos y organizativos proporcionales al riesgo, junto con procedimientos de gestión y notificación de incidentes.'],
        ],
    },
    licencias: {
        title: 'Avisos de software de terceros',
        version: 'generado por release',
        intro: 'GiProy incorpora componentes de terceros. El inventario exacto y sus textos de licencia corresponden al artefacto publicado.',
        sections: [
            ['Alcance', 'Los avisos cubren dependencias distribuidas o ejecutadas por el frontend y backend publicados; no incluyen herramientas internas que no forman parte del servicio.'],
            ['Fuente verificable', 'El paquete de release incluye THIRD_PARTY_NOTICES, SBOM CycloneDX y hashes SHA-256 para relacionar estos avisos con el artefacto concreto.'],
        ],
    },
};

export default function LegalDocument() {
    const { document } = useParams();
    const [manifestContent, setManifestContent] = useState(null);
    useEffect(() => {
        if (document === 'licencias') return;
        publicAuthApi.getLegalManifest().then((manifest) => setManifestContent(manifest[document])).catch(() => setManifestContent(null));
    }, [document]);
    const content = manifestContent || documents[document];
    if (!content) return <main className="min-h-screen bg-zinc-50 p-8"><p>Documento no encontrado.</p></main>;
    return (
        <main className="h-full overflow-y-auto bg-zinc-50 text-zinc-900" data-legal-document-scroll>
            <article className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
                <Link to="/login" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"><ArrowLeft size={18} /> Volver al acceso</Link>
                <header className="mt-8 border-b border-zinc-300 pb-8">
                    <p className="text-sm font-semibold text-orange-700">GiProy Network · versión {content.version}</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{content.title}</h1>
                    <p className="mt-4 max-w-[70ch] text-base leading-7 text-zinc-700">{content.intro}</p>
                </header>
                <div className="space-y-9 py-9">
                    {content.sections.map(([title, body]) => <section key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 max-w-[70ch] leading-7 text-zinc-700">{body}</p></section>)}
                </div>
                <footer className="border-t border-zinc-300 pt-6 text-sm text-zinc-600">Este texto debe leerse junto con el contrato u orden aplicable. Las solicitudes legales deben enviarse por el canal de soporte identificado en ese documento o dentro de la cuenta.</footer>
            </article>
        </main>
    );
}
