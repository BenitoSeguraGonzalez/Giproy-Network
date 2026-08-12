/*
THESIS: El centro legal hace verificable qué se lee y qué software directo usa el frontend, sin prometer una certificación que aún depende del release.
OWN-WORLD: Superficies zinc claras, una regla técnica naranja, bordes finos y tipografía Inter del sistema GiProy.
STORY: La persona encuentra los documentos esenciales, distingue el inventario del SBOM y puede abrir la licencia de cada componente.
FIRST VIEWPORT: Retorno al acceso, título y alcance a la izquierda; los tres documentos públicos a la derecha y el inventario comienza inmediatamente después.
FORM: Extensión Read del documento legal existente; lista editorial agrupada, no una cuadrícula de tarjetas.
*/
import { ArrowLeft, ExternalLink, FileText, ShieldCheck } from 'lucide-react';
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
};

const frontendNotices = [
    ['React', '18.3.1', 'MIT', 'https://github.com/facebook/react/blob/main/LICENSE'],
    ['React DOM', '18.3.1', 'MIT', 'https://github.com/facebook/react/blob/main/LICENSE'],
    ['React Router DOM', '7.18.2', 'MIT', 'https://github.com/remix-run/react-router/blob/main/LICENSE.md'],
    ['Axios', '1.18.1', 'MIT', 'https://github.com/axios/axios/blob/v1.x/LICENSE'],
    ['Lucide React', '0.575.0', 'ISC', 'https://github.com/lucide-icons/lucide/blob/main/LICENSE'],
    ['Leaflet', '1.9.4', 'BSD-2-Clause', 'https://github.com/Leaflet/Leaflet/blob/main/LICENSE'],
    ['Radix UI Primitives', '1.1–2.1', 'MIT', 'https://github.com/radix-ui/primitives/blob/main/LICENSE'],
    ['React Spring', '10.0.3', 'MIT', 'https://github.com/pmndrs/react-spring/blob/main/LICENSE'],
    ['Framer Motion', '12.34.3', 'MIT', 'https://github.com/motiondivision/motion/blob/main/LICENSE.md'],
    ['Class Variance Authority', '0.7.1', 'Apache-2.0', 'https://github.com/joe-bell/cva/blob/main/LICENSE'],
    ['clsx', '2.1.1', 'MIT', 'https://github.com/lukeed/clsx/blob/master/license'],
    ['decimal.js', '10.6.0', 'MIT', 'https://github.com/MikeMcl/decimal.js/blob/master/LICENCE.md'],
    ['Tailwind Merge', '3.5.0', 'MIT', 'https://github.com/dcastil/tailwind-merge/blob/v3.5.0/LICENSE.md'],
    ['tailwindcss-animate', '1.0.7', 'MIT', 'https://github.com/jamiebuilds/tailwindcss-animate/blob/main/LICENSE'],
    ['Three.js', '0.185.1', 'MIT', 'https://github.com/mrdoob/three.js/blob/dev/LICENSE'],
    ['three-bvh-csg', '0.0.18', 'MIT', 'https://github.com/gkjohnson/three-bvh-csg/blob/master/LICENSE'],
    ['That Open Components', '3.4.x', 'MIT', 'https://github.com/ThatOpen/engine_components/blob/main/LICENSE.md'],
    ['That Open Components Front', '3.4.3', 'MIT', 'https://github.com/ThatOpen/engine_components/blob/main/LICENSE.md'],
    ['That Open Fragments', '3.4.6', 'MIT', 'https://github.com/ThatOpen/engine_fragment/blob/main/LICENSE.md'],
    ['web-ifc', '0.0.77', 'MPL-2.0', 'https://github.com/ThatOpen/engine_web-ifc/blob/main/LICENSE.md'],
];

const legalLinks = [
    ['Términos y Condiciones', '/legal/terminos'],
    ['Política de Privacidad', '/legal/privacidad'],
    ['Avisos de terceros', '/legal/licencias'],
];

function LegalNavigation({ activeDocument }) {
    return (
        <nav aria-label="Documentos legales" className="border-y border-zinc-200 py-3">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                {legalLinks.map(([label, to]) => (
                    <li key={to}>
                        <Link to={to} aria-current={activeDocument === to.split('/').at(-1) ? 'page' : undefined} className="rounded-sm text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition-colors duration-150 hover:text-orange-800 hover:decoration-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

function ThirdPartyLicenses() {
    const [releaseEvidence, setReleaseEvidence] = useState(null);

    useEffect(() => {
        fetch('/legal/release/public-release-manifest.json')
            .then((response) => response.ok ? response.json() : null)
            .then(setReleaseEvidence)
            .catch(() => setReleaseEvidence(null));
    }, []);

    return (
        <main className="h-full overflow-y-auto bg-zinc-50 text-zinc-900" data-legal-document-scroll data-third-party-licenses>
            <article className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
                <Link to="/login" className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-orange-800 transition-colors duration-150 hover:text-orange-950 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"><ArrowLeft size={18} aria-hidden="true" /> Volver al acceso</Link>
                <div className="mt-8 grid gap-8 border-b border-zinc-300 pb-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-12">
                    <header>
                        <p className="text-sm font-semibold text-orange-800">GiProy Network · inventario frontend · 2026-08-12</p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Avisos de software de terceros</h1>
                        <p className="mt-4 max-w-[70ch] text-base leading-7 text-zinc-700">Esta relación identifica las dependencias directas declaradas por el frontend de GiProy. Cada enlace abre la licencia que publica su titular.</p>
                    </header>
                    <div className="lg:border-l lg:border-zinc-200 lg:pl-6">
                        <p className="mb-3 text-sm font-semibold text-zinc-700">Documentos públicos</p>
                        <LegalNavigation activeDocument="licencias" />
                    </div>
                </div>
                <aside className="mt-8 grid gap-4 border-y border-zinc-300 py-5 sm:grid-cols-[auto_1fr]" aria-label="Alcance del inventario">
                    <ShieldCheck className="mt-0.5 size-5 text-orange-700" aria-hidden="true" />
                    <div>
                        <h2 className="font-semibold">Alcance verificable</h2>
                        <p className="mt-1 max-w-[70ch] text-sm leading-6 text-zinc-700">Incluye 20 familias de dependencias directas del `package.json` del frontend. No reemplaza el SBOM CycloneDX, los avisos completos transitivos ni el análisis de licencias del backend que deben generarse para cada release.</p>
                    </div>
                </aside>
                <section className="mt-8 border-b border-zinc-300 pb-8" aria-labelledby="evidencia-release">
                    <h2 id="evidencia-release" className="text-xl font-semibold">Evidencia del release</h2>
                    {releaseEvidence ? (
                        <>
                            <p className="mt-2 max-w-[70ch] text-sm leading-6 text-zinc-700">Estado técnico: <strong>{releaseEvidence.release.certification_status}</strong>. Los artefactos se generaron para la imagen identificada en este manifiesto.</p>
                            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                                {Object.entries(releaseEvidence.artifacts).map(([name, artifact]) => <li key={name}><a href={artifact.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-sm text-orange-800 underline decoration-orange-300 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">{name} <ExternalLink size={15} aria-hidden="true" /><span className="sr-only">(abre una pestaña nueva)</span></a></li>)}
                            </ul>
                        </>
                    ) : <p className="mt-2 max-w-[70ch] text-sm leading-6 text-zinc-700">La evidencia verificable se publica con cada release. Este inventario directo permanece disponible mientras el manifiesto de release no esté presente.</p>}
                </section>
                <section className="mt-10" aria-labelledby="inventario-frontend">
                    <div className="flex items-baseline justify-between gap-4 border-b border-zinc-300 pb-3">
                        <h2 id="inventario-frontend" className="text-xl font-semibold">Dependencias directas del frontend</h2>
                        <p className="shrink-0 text-sm text-zinc-600">{frontendNotices.length} familias</p>
                    </div>
                    <ul className="divide-y divide-zinc-200" aria-label="Inventario de dependencias y licencias">
                        {frontendNotices.map(([name, version, license, licenseUrl]) => (
                            <li key={name} className="grid gap-2 py-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6">
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-zinc-900">{name}</h3>
                                    <p className="mt-0.5 text-sm text-zinc-600">Versión {version}</p>
                                </div>
                                <p className="text-sm font-semibold text-zinc-800">{license}</p>
                                <a href={licenseUrl} target="_blank" rel="noreferrer" aria-label={`Ver licencia de ${name} (abre una pestaña nueva)`} className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-orange-800 underline decoration-orange-300 underline-offset-4 transition-colors duration-150 hover:text-orange-950 hover:decoration-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                                    Ver licencia <ExternalLink size={15} aria-hidden="true" /> <span className="sr-only">(abre una pestaña nueva)</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
                <footer className="mt-10 border-t border-zinc-300 pt-6 text-sm leading-6 text-zinc-600">Para una revisión contractual o de cumplimiento de un artefacto concreto, consulte el paquete de evidencia del release correspondiente. Este aviso no modifica los Términos, la Política de Privacidad ni los derechos de las personas usuarias.</footer>
            </article>
        </main>
    );
}

export default function LegalDocument() {
    const { document } = useParams();
    const [manifestContent, setManifestContent] = useState(null);

    useEffect(() => {
        if (document === 'licencias') return;
        publicAuthApi.getLegalManifest().then((manifest) => setManifestContent(manifest[document])).catch(() => setManifestContent(null));
    }, [document]);

    if (document === 'licencias') return <ThirdPartyLicenses />;
    const content = manifestContent || documents[document];
    if (!content) return <main className="min-h-screen bg-zinc-50 p-8"><p>Documento no encontrado.</p></main>;

    return (
        <main className="h-full overflow-y-auto bg-zinc-50 text-zinc-900" data-legal-document-scroll>
            <article className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
                <Link to="/login" className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-orange-800 transition-colors duration-150 hover:text-orange-950 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"><ArrowLeft size={18} aria-hidden="true" /> Volver al acceso</Link>
                <header className="mt-8 border-b border-zinc-300 pb-8">
                    <p className="text-sm font-semibold text-orange-800">GiProy Network · versión {content.version}</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{content.title}</h1>
                    <p className="mt-4 max-w-[70ch] text-base leading-7 text-zinc-700">{content.intro}</p>
                </header>
                <div className="mt-6"><LegalNavigation activeDocument={document} /></div>
                <div className="space-y-9 py-9">
                    {content.sections.map(([title, body]) => <section key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 max-w-[70ch] leading-7 text-zinc-700">{body}</p></section>)}
                </div>
                <footer className="border-t border-zinc-300 pt-6 text-sm text-zinc-600">Este texto debe leerse junto con el contrato u orden aplicable. Las solicitudes legales deben enviarse por el canal de soporte identificado en ese documento o dentro de la cuenta.</footer>
            </article>
        </main>
    );
}
