import { normalizeReportDescription, normalizeReportUnit } from './reportTextFormatting';

const formatMoney = (value) => {
    const number = Number(value || 0);
    return new Intl.NumberFormat('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
};

const getDisplayDescription = (value, isStructural = false) => {
    return normalizeReportDescription(value, isStructural);
};

const getLineDescriptionHtml = (linea) => {
    const description = getDisplayDescription(linea.descripcion, Boolean(linea.is_structural)) || '';
    if (linea.is_structural) {
        return description;
    }
    return `<div class="line-indent">${description}</div>`;
};

export const buildReportPreviewPrintHtml = (preview) => {
    const pages = (preview?.items || []).map((item, index) => `
        <section class="page ${index > 0 ? 'page-break' : ''}">
            <header class="header">
                <div class="eyebrow">${preview.title || 'Reporte'}</div>
                <h1 class="${item.is_structural ? 'structural-title' : ''}">${item.codigo} - ${getDisplayDescription(item.descripcion, item.is_structural)}</h1>
                ${item.categoria_base ? `<div class="category-base">Categoría base: ${getDisplayDescription(item.categoria_base, false)}</div>` : ''}
                <div class="meta">Unidad: ${normalizeReportUnit(item.unidad || '-')} | Costo Directo: $${formatMoney(item.costo_directo)} | Total: $${formatMoney(item.precio_total)}</div>
            </header>
            <table>
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Descripción</th>
                        <th>Unidad</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Rendimiento</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${(item.lineas || []).map(linea => `
                        <tr class="${linea.is_structural ? 'structural-row' : ''}">
                            <td>${linea.codigo || ''}</td>
                            <td>${getLineDescriptionHtml(linea)}</td>
                            <td>${normalizeReportUnit(linea.unidad || '-') || ''}</td>
                            <td>${linea.cantidad ?? ''}</td>
                            <td>$${formatMoney(linea.precio)}</td>
                            <td>${linea.rendimiento ?? ''}</td>
                            <td>$${formatMoney(linea.subtotal)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </section>
    `).join('');

    return `<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <title>${preview?.title || 'Reporte'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; color: #1f2937; background: #fff; }
        .page { padding: 32px 36px; }
        .page-break { page-break-before: always; }
        .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: #d97706; margin-bottom: 10px; }
        h1 { margin: 0 0 10px; font-size: 22px; line-height: 1.2; }
        .structural-title { font-weight: 800; text-transform: uppercase; }
        .category-base { font-size: 11px; font-weight: 700; color: #52525b; margin-bottom: 8px; }
        .meta { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #e5e7eb; padding: 8px 10px; vertical-align: top; text-align: left; }
        th { background: #f3f4f6; text-transform: uppercase; font-size: 10px; letter-spacing: .08em; }
        .structural-row td:nth-child(2) { font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
        .line-indent { padding-left: 12px; }
    </style>
</head>
<body>${pages}</body>
</html>`;
};

export const printReportPreviewAsPdf = (preview) => {
    const html = buildReportPreviewPrintHtml(preview);
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=900');
    if (!printWindow) {
        throw new Error('No se pudo abrir la ventana de impresión.');
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
        printWindow.print();
    };
};
