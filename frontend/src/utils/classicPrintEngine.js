import { normalizePersonName } from './descriptionCapitalization.js';

const PAGE_SIZE_MM = {
    A0: { width: 841, height: 1189 },
    A1: { width: 594, height: 841 },
    A2: { width: 420, height: 594 },
    A3: { width: 297, height: 420 },
    A4: { width: 210, height: 297 },
};

const MM_TO_PT = 72 / 25.4;
const PAGE_SIZE_PT = Object.fromEntries(
    Object.entries(PAGE_SIZE_MM).map(([key, value]) => [
        key,
        { width: value.width * MM_TO_PT, height: value.height * MM_TO_PT },
    ])
);

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const normalizeDate = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
    const date = normalizeDate(value);
    if (!date) return '-';
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
};

const formatDateTime = (value) => {
    const date = normalizeDate(value);
    if (!date) return '-';
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const formatNumber = (value, decimals = 2) => {
    const numeric = Number(value || 0);
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(Number.isFinite(numeric) ? numeric : 0);
};

const formatCurrency = (value, currency = 'USD', decimals = 2) => {
    const numeric = Number(value || 0);
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(Number.isFinite(numeric) ? numeric : 0);
};

const flattenTree = (nodes = [], level = 0, bucket = []) => {
    nodes.forEach((node) => {
        bucket.push({ ...node, level });
        flattenTree(node.hijos || [], level + 1, bucket);
    });
    return bucket;
};

const countNodes = (nodes = []) => nodes.reduce((acc, node) => acc + 1 + countNodes(node.hijos || []), 0);

const resolveProjectLabel = (project = {}) => (
    project?.nombre || project?.codigo_root || project?.codigo || 'Proyecto'
);

const resolveRevisionLabel = (project = {}, fallback = null) => {
    const value = project?.revision ?? fallback ?? 0;
    return `Rev${value}`;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const sanitizePdfFilename = (value) => String(value || 'lamina-grafica')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120) || 'lamina-grafica';

const PRINT_MODE_PAGINATED = 'paginated';
const HIERARCHY_CARD_MIN_GAP = 10;

const normalizePrintMode = (value) => (value === PRINT_MODE_PAGINATED ? PRINT_MODE_PAGINATED : 'complete');

const normalizeRowsPerPage = (value, fallback = 40) => {
    const numeric = Math.trunc(Number(value || fallback));
    return clamp(Number.isFinite(numeric) ? numeric : fallback, 10, 120);
};

const chunkArray = (items = [], size = 40) => {
    const chunkSize = normalizeRowsPerPage(size);
    const chunks = [];
    for (let index = 0; index < items.length; index += chunkSize) {
        chunks.push(items.slice(index, index + chunkSize));
    }
    return chunks.length ? chunks : [[]];
};

const sanitizePdfText = (value) => String(value ?? '')
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const PDF_TEXT_ENCODING_DIFFERENCES = [
    { code: 128, char: 'Á', glyph: 'Aacute' },
    { code: 129, char: 'É', glyph: 'Eacute' },
    { code: 130, char: 'Í', glyph: 'Iacute' },
    { code: 131, char: 'Ó', glyph: 'Oacute' },
    { code: 132, char: 'Ú', glyph: 'Uacute' },
    { code: 133, char: 'á', glyph: 'aacute' },
    { code: 134, char: 'é', glyph: 'eacute' },
    { code: 135, char: 'í', glyph: 'iacute' },
    { code: 136, char: 'ó', glyph: 'oacute' },
    { code: 137, char: 'ú', glyph: 'uacute' },
    { code: 138, char: 'Ñ', glyph: 'Ntilde' },
    { code: 139, char: 'ñ', glyph: 'ntilde' },
    { code: 140, char: 'Ü', glyph: 'Udieresis' },
    { code: 141, char: 'ü', glyph: 'udieresis' },
    { code: 142, char: '®', glyph: 'registered' },
    { code: 143, char: '°', glyph: 'degree' },
];

const PDF_TEXT_CHAR_CODES = new Map(PDF_TEXT_ENCODING_DIFFERENCES.map((item) => [item.char, item.code]));
const PDF_TEXT_DIFFERENCES_DECLARATION = `[${PDF_TEXT_ENCODING_DIFFERENCES.map((item) => `${item.code} /${item.glyph}`).join(' ')}]`;

const pdfString = (value) => {
    const display = sanitizePdfText(value);
    if (!display) return '()';
    const bytes = Array.from(display, (char) => {
        const mappedCode = PDF_TEXT_CHAR_CODES.get(char);
        if (mappedCode) return mappedCode;
        const code = char.charCodeAt(0);
        return code >= 0x20 && code <= 0xFF ? code : 0x20;
    });
    return `<${bytesToHex(bytes)}>`;
};

const formatPdfNumber = (value) => {
    const numeric = Number(value || 0);
    return Number.isFinite(numeric) ? numeric.toFixed(3).replace(/\.?0+$/, '') : '0';
};

const bytesToHex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const dataUrlToBytes = (dataUrl) => {
    const base64 = String(dataUrl || '').split(',')[1] || '';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
};

const resolveJpegSize = (bytes) => {
    let index = 2;
    while (index < bytes.length) {
        if (bytes[index] !== 0xFF) {
            index += 1;
            continue;
        }
        const marker = bytes[index + 1];
        const length = (bytes[index + 2] << 8) + bytes[index + 3];
        if (marker >= 0xC0 && marker <= 0xC3) {
            return {
                height: (bytes[index + 5] << 8) + bytes[index + 6],
                width: (bytes[index + 7] << 8) + bytes[index + 8],
            };
        }
        index += 2 + length;
    }
    throw new Error('No se pudo leer el tamano de la imagen embebida en el PDF.');
};

const estimateTextWidth = (text, size, bold = false) => sanitizePdfText(text).length * size * (bold ? 0.58 : 0.52);

const truncateText = (text, maxWidth, size, bold = false) => {
    const value = sanitizePdfText(text);
    if (estimateTextWidth(value, size, bold) <= maxWidth) return value;
    const suffix = '...';
    let current = value;
    while (current.length > 0 && estimateTextWidth(`${current}${suffix}`, size, bold) > maxWidth) {
        current = current.slice(0, -1);
    }
    return `${current}${suffix}`;
};

const wrapText = (text, maxWidth, size, bold = false, maxLines = 2) => {
    const words = sanitizePdfText(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (estimateTextWidth(candidate, size, bold) <= maxWidth) {
            line = candidate;
            return;
        }
        if (line) lines.push(line);
        line = word;
    });
    if (line) lines.push(line);
    if (lines.length <= maxLines) return lines;
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = truncateText(kept[maxLines - 1], maxWidth, size, bold);
    return kept;
};

const normalizeColor = (hex) => {
    const raw = String(hex || '#000000').replace('#', '');
    const value = raw.length === 3
        ? raw.split('').map((char) => `${char}${char}`).join('')
        : raw.padEnd(6, '0').slice(0, 6);
    return [
        parseInt(value.slice(0, 2), 16) / 255,
        parseInt(value.slice(2, 4), 16) / 255,
        parseInt(value.slice(4, 6), 16) / 255,
    ].map(formatPdfNumber).join(' ');
};

const createPdfDocument = ({ pageSize = 'A3', orientation = 'landscape' } = {}) => {
    const safeSize = PAGE_SIZE_PT[pageSize] ? pageSize : 'A3';
    const safeOrientation = orientation === 'portrait' ? 'portrait' : 'landscape';
    const dims = PAGE_SIZE_PT[safeSize];
    const pageWidth = safeOrientation === 'landscape' ? dims.height : dims.width;
    const pageHeight = safeOrientation === 'landscape' ? dims.width : dims.height;
    const objects = [];
    const pages = [];
    const images = [];
    const addObject = (body) => {
        objects.push(body);
        return objects.length;
    };
    const textEncodingId = addObject(`<< /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences ${PDF_TEXT_DIFFERENCES_DECLARATION} >>`);
    const fontRegularId = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding ${textEncodingId} 0 R >>`);
    const fontBoldId = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding ${textEncodingId} 0 R >>`);
    const pagesId = addObject('');

    const addJpegImage = (dataUrl) => {
        const bytes = dataUrlToBytes(dataUrl);
        const size = resolveJpegSize(bytes);
        const name = `Im${images.length + 1}`;
        const stream = `${bytesToHex(bytes)}>`;
        const imageId = addObject(`<< /Type /XObject /Subtype /Image /Width ${size.width} /Height ${size.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
        images.push({ name, imageId, ...size });
        return { name, imageId, ...size };
    };

    const addPage = (commands) => {
        const stream = commands.join('\n');
        const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
        const imageResources = images.length
            ? `/XObject << ${images.map((image) => `/${image.name} ${image.imageId} 0 R`).join(' ')} >>`
            : '';
        const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${formatPdfNumber(pageWidth)} ${formatPdfNumber(pageHeight)}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> ${imageResources} >> /Contents ${contentId} 0 R >>`);
        pages.push(pageId);
    };

    const finish = () => {
        objects[pagesId - 1] = `<< /Type /Pages /Kids [${pages.map((pageId) => `${pageId} 0 R`).join(' ')}] /Count ${pages.length} >>`;
        const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
        let pdf = '%PDF-1.4\n%\x7F\x7F\x7F\x7F\n';
        const offsets = [0];
        objects.forEach((body, index) => {
            offsets.push(pdf.length);
            pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
        });
        const xrefOffset = pdf.length;
        pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
        offsets.slice(1).forEach((offset) => {
            pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
        });
        pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
        return new Blob([pdf], { type: 'application/pdf' });
    };

    return { addJpegImage, addPage, finish, pageWidth, pageHeight, safeSize, safeOrientation };
};

const createPdfCanvas = (doc) => {
    const commands = [];
    const h = doc.pageHeight;
    const yRect = (y, height) => h - y - height;
    const yText = (y) => h - y;
    return {
        commands,
        rect(x, y, width, height, { fill = null, stroke = null, lineWidth = 1 } = {}) {
            if (fill) commands.push(`${normalizeColor(fill)} rg`);
            if (stroke) commands.push(`${normalizeColor(stroke)} RG ${formatPdfNumber(lineWidth)} w`);
            commands.push(`${formatPdfNumber(x)} ${formatPdfNumber(yRect(y, height))} ${formatPdfNumber(width)} ${formatPdfNumber(height)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`);
        },
        line(x1, y1, x2, y2, { stroke = '#000000', lineWidth = 1 } = {}) {
            commands.push(`${normalizeColor(stroke)} RG ${formatPdfNumber(lineWidth)} w ${formatPdfNumber(x1)} ${formatPdfNumber(yText(y1))} m ${formatPdfNumber(x2)} ${formatPdfNumber(yText(y2))} l S`);
        },
        polyline(points, { stroke = '#000000', lineWidth = 1 } = {}) {
            if (!points.length) return;
            const [first, ...rest] = points;
            commands.push(`${normalizeColor(stroke)} RG ${formatPdfNumber(lineWidth)} w ${formatPdfNumber(first.x)} ${formatPdfNumber(yText(first.y))} m`);
            rest.forEach((point) => commands.push(`${formatPdfNumber(point.x)} ${formatPdfNumber(yText(point.y))} l`));
            commands.push('S');
        },
        polygon(points, { fill = '#000000', stroke = null, lineWidth = 1 } = {}) {
            if (!points.length) return;
            commands.push(`${normalizeColor(fill)} rg`);
            if (stroke) commands.push(`${normalizeColor(stroke)} RG ${formatPdfNumber(lineWidth)} w`);
            const [first, ...rest] = points;
            commands.push(`${formatPdfNumber(first.x)} ${formatPdfNumber(yText(first.y))} m`);
            rest.forEach((point) => commands.push(`${formatPdfNumber(point.x)} ${formatPdfNumber(yText(point.y))} l`));
            commands.push(`h ${stroke ? 'B' : 'f'}`);
        },
        text(x, y, value, { size = 10, bold = false, color = '#1A1A1A', maxWidth = null } = {}) {
            const display = maxWidth ? truncateText(value, maxWidth, size, bold) : sanitizePdfText(value);
            if (!display) return;
            commands.push(`BT /${bold ? 'F2' : 'F1'} ${formatPdfNumber(size)} Tf ${normalizeColor(color)} rg 1 0 0 1 ${formatPdfNumber(x)} ${formatPdfNumber(yText(y))} Tm ${pdfString(display)} Tj ET`);
        },
        image(image, x, y, width, height) {
            commands.push(`q ${formatPdfNumber(width)} 0 0 ${formatPdfNumber(height)} ${formatPdfNumber(x)} ${formatPdfNumber(yRect(y, height))} cm /${image.name} Do Q`);
        },
    };
};

const drawSheetHeader = (canvas, doc, { title, subtitle, project, accent = '#F39200' }) => {
    const margin = 22;
    const headerHeight = 62;
    canvas.rect(margin, margin, doc.pageWidth - margin * 2, doc.pageHeight - margin * 2, {
        stroke: '#1A1A1A',
        lineWidth: 1.1,
    });
    canvas.rect(margin, margin, doc.pageWidth - margin * 2, headerHeight, {
        fill: '#FFFFFF',
        stroke: '#1A1A1A',
        lineWidth: 0.8,
    });
    canvas.text(margin + 16, margin + 18, 'Lámina Técnica Generada por GIPROY®', {
        size: 7,
        bold: true,
        color: accent,
    });
    canvas.text(margin + 16, margin + 37, title, {
        size: 16,
        bold: true,
        maxWidth: doc.pageWidth * 0.46,
    });
    canvas.text(margin + 16, margin + 52, subtitle, {
        size: 7.5,
        bold: true,
        color: '#4B5563',
        maxWidth: doc.pageWidth * 0.52,
    });

    const metaX = doc.pageWidth - margin - 250;
    const meta = [
        ['Proyecto', resolveProjectLabel(project)],
        ['Revision', resolveRevisionLabel(project)],
        ['Formato', doc.safeSize],
        ['Generado', formatDateTime(new Date())],
    ];
    meta.forEach(([label, value], index) => {
        const y = margin + 16 + index * 11;
        canvas.text(metaX, y, label, { size: 6, bold: true, color: '#6B7280', maxWidth: 58 });
        canvas.text(metaX + 64, y, value, { size: 6.3, bold: true, maxWidth: 180 });
    });
    return { x: margin + 16, y: margin + headerHeight + 16, width: doc.pageWidth - margin * 2 - 32, height: doc.pageHeight - margin * 2 - headerHeight - 32 };
};

const savePdfBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

const isHierarchyStructuralNode = (node, moduleType) => (
    moduleType === 'edt'
        ? node?.tipo_nodo === 'CUENTA_PAQUETE'
        : node?.tipo_nodo === 'HITO'
);

const projectHierarchyPrintTree = (nodes = [], moduleType = 'edo') => {
    const projected = (nodes || [])
        .filter((node) => isHierarchyStructuralNode(node, moduleType))
        .map((node) => {
            const children = node.hijos || [];
            const structuralChildren = children.filter((child) => isHierarchyStructuralNode(child, moduleType));
            const embeddedStakeholders = children.filter((child) => !isHierarchyStructuralNode(child, moduleType));
            return {
                ...node,
                embeddedStakeholders,
                hijos: projectHierarchyPrintTree(structuralChildren, moduleType),
            };
        });
    return projected.length ? projected : (nodes || []);
};

const countHierarchyLeaves = (node) => {
    const children = node?.hijos || [];
    if (!children.length) return 1;
    return children.reduce((acc, child) => acc + countHierarchyLeaves(child), 0);
};

const resolveHierarchyDepth = (nodes = [], level = 0) => (
    nodes.reduce((acc, node) => Math.max(acc, level, resolveHierarchyDepth(node.hijos || [], level + 1)), level)
);

const countDirectHierarchyChildren = (node) => (node?.hijos || []).length;

const countTotalHierarchyDescendants = (node) => countNodes(node?.hijos || []);

const countMaxHierarchySiblings = (nodes = []) => nodes.reduce((acc, node) => (
    Math.max(acc, (node?.hijos || []).length, countMaxHierarchySiblings(node?.hijos || []))
), nodes.length);

const formatHierarchyCount = (value, singular, plural = `${singular}s`) => {
    const numeric = Number(value || 0);
    return `${numeric} ${numeric === 1 ? singular : plural}`;
};

const resolveEmbeddedPeople = (node) => (node?.embeddedStakeholders || [])
    .map((stakeholderNode) => {
        const person = stakeholderNode?.stakeholder || null;
        const name = person
            ? normalizePersonName(`${person.nombre || ''} ${person.apellidos || ''}`)
            : normalizePersonName(stakeholderNode?.responsable_nombre || stakeholderNode?.stakeholder_nombre || '');
        return {
            name,
            role: stakeholderNode?.rol?.nombre || stakeholderNode?.actividades_claves || '',
        };
    })
    .filter((person) => person.name || person.role);

const assignHierarchyPositions = ({ nodes, area, cardWidth, cardHeight }) => {
    const totalLeaves = Math.max(1, nodes.reduce((acc, node) => acc + countHierarchyLeaves(node), 0));
    const maxDepth = resolveHierarchyDepth(nodes);
    const horizontalUnit = area.width / totalLeaves;
    const verticalGap = maxDepth <= 0 ? 0 : (area.height - cardHeight) / maxDepth;
    const positioned = [];
    const connectors = [];
    let cursor = 0;

    const visit = (node, level, parent = null) => {
        const leafCount = countHierarchyLeaves(node);
        const centerX = area.x + (cursor + leafCount / 2) * horizontalUnit;
        const y = area.y + level * verticalGap;
        const position = {
            node,
            level,
            x: clamp(centerX - cardWidth / 2, area.x, area.x + area.width - cardWidth),
            y,
            width: cardWidth,
            height: cardHeight,
        };
        positioned.push(position);
        if (parent) connectors.push({ parent, child: position });
        const children = node.hijos || [];
        if (children.length) {
            children.forEach((child) => visit(child, level + 1, position));
        } else {
            cursor += 1;
        }
        return position;
    };

    nodes.forEach((node) => visit(node, 0, null));
    return { positioned, connectors };
};

const hasHierarchyCardCollisions = (positioned = [], minGap = HIERARCHY_CARD_MIN_GAP) => {
    const byLevel = new Map();
    positioned.forEach((item) => {
        const bucket = byLevel.get(item.level) || [];
        bucket.push(item);
        byLevel.set(item.level, bucket);
    });

    for (const items of byLevel.values()) {
        const sorted = [...items].sort((a, b) => a.x - b.x);
        for (let index = 1; index < sorted.length; index += 1) {
            const previous = sorted[index - 1];
            const current = sorted[index];
            if (previous.x + previous.width + minGap > current.x) {
                return true;
            }
        }
    }
    return false;
};

const drawHierarchyConnector = (canvas, parent, child) => {
    const parentBottom = { x: parent.x + parent.width / 2, y: parent.y + parent.height };
    const childTop = { x: child.x + child.width / 2, y: child.y };
    const midY = parentBottom.y + Math.max(14, (childTop.y - parentBottom.y) * 0.46);
    canvas.line(parentBottom.x, parentBottom.y, parentBottom.x, midY, { stroke: '#CBD5E1', lineWidth: 0.8 });
    canvas.line(parentBottom.x, midY, childTop.x, midY, { stroke: '#CBD5E1', lineWidth: 0.8 });
    canvas.line(childTop.x, midY, childTop.x, childTop.y, { stroke: '#CBD5E1', lineWidth: 0.8 });
};

const resolveHierarchyCardBodyRows = (node, { isEdt = false, currency = 'USD', totalValorado = 0 } = {}) => {
    const embeddedPeople = resolveEmbeddedPeople(node);
    if (!isEdt) {
        return embeddedPeople.length
            ? embeddedPeople.slice(0, 3).map((person) => ({
                label: person.role || 'Rol sin definir',
                value: person.name || 'Sin asignado',
            }))
            : [{ label: '', value: 'Sin responsables o participantes vinculados' }];
    }

    const rows = [];
    const definition = node.definicion || node.descripcion || '';
    if (definition) {
        rows.push({ label: 'Definicion', value: definition });
    }
    if (embeddedPeople.length) {
        const owner = embeddedPeople[0];
        rows.push({ label: owner.role || 'Responsable', value: owner.name || 'Sin asignado' });
    }
    if (node.metrics) {
        const metricValue = totalValorado > 0
            ? `${formatCurrency(node.metrics.valorado || 0, currency, 0)} · ${formatNumber(((Number(node.metrics.valorado || 0) / totalValorado) * 100), 1)}%`
            : formatCurrency(node.metrics.valorado || 0, currency, 0);
        rows.push({ label: 'Valorado', value: metricValue });
    }
    return rows.length ? rows : [{ label: '', value: 'Sin definicion o responsable vinculado' }];
};

const drawHierarchyCard = (canvas, item, { moduleType = 'edo', currency = 'USD', totalValorado = 0 }) => {
    const { node, x, y, width, height } = item;
    const isEdt = moduleType === 'edt';
    const code = node.codigo || node.codigo_visible || node.item_visible || '-';
    const title = node.nombre || node.descripcion || 'Sin descripcion';
    const childCount = countDirectHierarchyChildren(node);
    const descendantCount = countTotalHierarchyDescendants(node);
    const lineX = x + 10;
    const lineRight = x + width - 10;
    const lineMaxWidth = width - 20;
    const topY = y + 8;
    const titleSize = clamp(width * 0.052, 8.2, 10.8);
    const metaSize = clamp(width * 0.034, 5.8, 7);
    const bodySize = clamp(width * 0.038, 6.4, 7.6);
    const chipSize = clamp(width * 0.032, 5.6, 6.6);
    const titleLines = wrapText(String(title).toUpperCase(), lineMaxWidth, titleSize, true, 2);
    const moduleColor = isEdt ? '#059669' : '#136191';
    const softFill = isEdt ? '#F0FDF4' : '#EFF6FF';
    const borderColor = isEdt ? '#BBF7D0' : '#BFDBFE';

    canvas.rect(x + 3, y + 4, width, height, { fill: '#E7E9EE' });
    canvas.rect(x, y, width, height, { fill: '#FFFFFF', stroke: '#D9DDE5', lineWidth: 0.55 });
    canvas.rect(x, y, 5, height, { fill: moduleColor });
    canvas.rect(lineX, topY - 1, Math.min(width * 0.36, 74), 13, { fill: softFill, stroke: borderColor, lineWidth: 0.35 });
    canvas.text(lineX + 4, topY + 8, `${isEdt ? 'EDT' : 'EDO'} ${code}`.toUpperCase(), {
        size: metaSize,
        bold: true,
        color: moduleColor,
        maxWidth: Math.min(width * 0.36, 68),
    });
    canvas.text(lineRight - 60, topY + 8, formatHierarchyCount(childCount, 'hijo'), {
        size: metaSize,
        bold: true,
        color: '#6B7280',
        maxWidth: 58,
    });

    const titleY = topY + 22;
    titleLines.forEach((line, index) => {
        canvas.text(lineX, titleY + index * (titleSize + 2.2), line, {
            size: titleSize,
            bold: true,
            color: '#111827',
            maxWidth: lineMaxWidth,
        });
    });

    const titleBottomY = titleY + titleLines.length * (titleSize + 2.2) + 2;
    canvas.line(lineX, titleBottomY, lineRight, titleBottomY, { stroke: '#E5E7EB', lineWidth: 0.45 });

    const peopleY = titleBottomY + 10;
    const bodyRows = resolveHierarchyCardBodyRows(node, { isEdt, currency, totalValorado });
    bodyRows.slice(0, 3).forEach((row, index) => {
        const rowY = peopleY + index * 14;
        if (row.label) {
            canvas.text(lineX, rowY, row.label, {
                size: chipSize,
                bold: true,
                color: '#6B7280',
                maxWidth: lineMaxWidth * 0.34,
            });
        }
        canvas.text(row.label ? lineX + lineMaxWidth * 0.38 : lineX, rowY, row.value, {
            size: bodySize,
            bold: true,
            color: row.label ? moduleColor : '#6B7280',
            maxWidth: row.label ? lineMaxWidth * 0.58 : lineMaxWidth,
        });
    });
    if (bodyRows.length > 3) {
        canvas.text(lineX, y + height - 9, `+ ${bodyRows.length - 3} dato(s) adicionales`, {
            size: chipSize,
            bold: true,
            color: '#6B7280',
            maxWidth: lineMaxWidth,
        });
        return;
    }
    canvas.text(lineX, y + height - 9, `${formatHierarchyCount(descendantCount, 'descendiente')} en rama`, {
        size: chipSize,
        bold: true,
        color: '#6B7280',
        maxWidth: lineMaxWidth,
    });
};

const splitHierarchyNodeIntoReadablePages = (node, leafBudget) => {
    const children = node?.hijos || [];
    if (!children.length || countHierarchyLeaves(node) <= leafBudget) {
        return [[node]];
    }
    const childPages = splitHierarchyPrintPagesReadable(children, Math.max(1, leafBudget - 1));
    return childPages.map((pageChildren, index) => ([{
        ...node,
        nombre: index === 0 ? node.nombre : `${node.nombre || 'Rama'} (continuacion ${index + 1})`,
        hijos: pageChildren,
    }]));
};

const splitNodeBySiblingCapacity = (node, siblingCapacity) => {
    const children = node?.hijos || [];
    if (!children.length) return [node];

    const normalizedChildren = children.flatMap((child) => splitNodeBySiblingCapacity(child, siblingCapacity));
    if (normalizedChildren.length <= siblingCapacity) {
        return [{ ...node, hijos: normalizedChildren }];
    }

    const pages = [];
    for (let index = 0; index < normalizedChildren.length; index += siblingCapacity) {
        const pageIndex = Math.floor(index / siblingCapacity);
        pages.push({
            ...node,
            nombre: pageIndex === 0 ? node.nombre : `${node.nombre || 'Rama'} (continuacion ${pageIndex + 1})`,
            hijos: normalizedChildren.slice(index, index + siblingCapacity),
        });
    }
    return pages;
};

const splitPagesBySiblingCapacity = (pages = [[]], siblingCapacity = 6) => (
    pages.flatMap((pageNodes) => {
        const normalizedNodes = pageNodes.flatMap((node) => splitNodeBySiblingCapacity(node, siblingCapacity));
        const result = [];
        for (let index = 0; index < normalizedNodes.length; index += siblingCapacity) {
            result.push(normalizedNodes.slice(index, index + siblingCapacity));
        }
        return result.length ? result : [[]];
    })
);

const splitHierarchyPrintPagesReadable = (nodes = [], rowsPerPage = 30) => {
    const leafBudget = normalizeRowsPerPage(rowsPerPage, 30);
    const pages = [];
    let current = [];
    let currentLeaves = 0;

    nodes.forEach((node) => {
        const nodeLeaves = Math.max(1, countHierarchyLeaves(node));
        if (nodeLeaves > leafBudget) {
            if (current.length) {
                pages.push(current);
                current = [];
                currentLeaves = 0;
            }
            splitHierarchyNodeIntoReadablePages(node, leafBudget).forEach((page) => pages.push(page));
            return;
        }
        if (current.length && currentLeaves + nodeLeaves > leafBudget) {
            pages.push(current);
            current = [];
            currentLeaves = 0;
        }
        current.push(node);
        currentLeaves += nodeLeaves;
    });

    if (current.length) pages.push(current);
    return pages.length ? pages : [[]];
};

const estimateArea = (pageSize, orientation, margin = 22, headerHeight = 62) => {
    const size = PAGE_SIZE_PT[pageSize] || PAGE_SIZE_PT.A3;
    const w = orientation === 'landscape' ? size.height : size.width;
    const h = orientation === 'landscape' ? size.width : size.height;
    return {
        width: w - margin * 2 - 32,
        height: h - margin * 2 - headerHeight - 32,
    };
};

const buildClassicHierarchyPdfBlob = ({
    tree = [],
    moduleType = 'edo',
    project = {},
    pageSize = 'A3',
    orientation = 'landscape',
    currency = 'USD',
    printMode = 'complete',
    rowsPerPage = 30,
}) => {
    const isEdt = moduleType === 'edt';
    const doc = createPdfDocument({ pageSize, orientation });
    const title = isEdt ? 'EDT Grafico Extendido' : 'EDO Grafico Extendido';
    const subtitleBase = isEdt ? 'Estructura de desglose completa, expandida y sin controles.' : 'Estructura organizacional completa, expandida y sin controles.';
    const graphTree = projectHierarchyPrintTree(tree, moduleType);
    const mode = normalizePrintMode(printMode);

    const estArea = estimateArea(pageSize, orientation);
    const targetCardWidth = isEdt ? 185 : 175;
    const minReadableCardWidth = isEdt ? 165 : 150;
    const siblingCapacity = Math.max(1, Math.floor((estArea.width + HIERARCHY_CARD_MIN_GAP) / (minReadableCardWidth + HIERARCHY_CARD_MIN_GAP)));
    const adaptiveBudget = Math.max(1, Math.min(
        Math.floor((estArea.width * 0.88) / targetCardWidth),
        siblingCapacity
    ));
    const leafBudget = Math.max(4, Math.min(normalizeRowsPerPage(rowsPerPage, 30), adaptiveBudget));
    const totalLeaves = graphTree.reduce((acc, node) => acc + countHierarchyLeaves(node), 0);
    const shouldForceReadablePagination = totalLeaves > adaptiveBudget || countMaxHierarchySiblings(graphTree) > siblingCapacity;

    const basePages = mode === PRINT_MODE_PAGINATED || shouldForceReadablePagination
        ? splitHierarchyPrintPagesReadable(graphTree, leafBudget)
        : [graphTree];
    const pages = splitPagesBySiblingCapacity(basePages, siblingCapacity);
    const totalValorado = isEdt
        ? graphTree.reduce((acc, node) => acc + Number(node.metrics?.valorado || 0), 0)
        : 0;

    pages.forEach((pageNodes, pageIndex) => {
        const canvas = createPdfCanvas(doc);
        const subtitle = pages.length > 1
            ? `${subtitleBase} Pagina ${pageIndex + 1} de ${pages.length}.`
            : subtitleBase;
        const area = drawSheetHeader(canvas, doc, { title, subtitle, project, accent: isEdt ? '#10B981' : '#F39200' });
        const totalPageLeaves = Math.max(1, pageNodes.reduce((acc, node) => acc + countHierarchyLeaves(node), 0));
        const maxDepth = resolveHierarchyDepth(pageNodes);
        const horizontalUnit = area.width / totalPageLeaves;
        const noOverlapCardHeight = (area.height / (maxDepth + 1)) * 0.82;
        const availableCardWidth = horizontalUnit - HIERARCHY_CARD_MIN_GAP;
        const cardWidth = clamp(
            Math.min(horizontalUnit * 0.86, availableCardWidth),
            Math.min(minReadableCardWidth, availableCardWidth),
            isEdt ? 230 : 220
        );
        const cardHeight = clamp(
            noOverlapCardHeight,
            Math.min(isEdt ? 100 : 96, noOverlapCardHeight),
            isEdt ? 140 : 132
        );
        const { positioned, connectors } = assignHierarchyPositions({ nodes: pageNodes, area, cardWidth, cardHeight });
        if (hasHierarchyCardCollisions(positioned)) {
            throw new Error('La lamina grafica excede la capacidad visual sin solape. Reduzca elementos por pagina.');
        }
        connectors.forEach((connector) => drawHierarchyConnector(canvas, connector.parent, connector.child));
        positioned.forEach((item) => drawHierarchyCard(canvas, item, {
            moduleType,
            accent: isEdt ? '#10B981' : '#F39200',
            currency,
            totalValorado,
        }));
        doc.addPage(canvas.commands);
    });
    return doc.finish();
};

const buildClassicCurvePdfBlob = ({
    project = {},
    cronograma = {},
    periods = [],
    pageSize = 'A4',
    orientation = 'landscape',
}) => {
    const doc = createPdfDocument({ pageSize, orientation });
    const canvas = createPdfCanvas(doc);
    const area = drawSheetHeader(canvas, doc, {
        title: 'Cronograma Valorado - Curva S',
        subtitle: 'Curva S completa, sin controles de edicion ni navegacion.',
        project,
        accent: '#0EA5E9',
    });
    const currency = cronograma?.moneda || 'USD';
    const decimals = cronograma?.dec_moneda ?? 2;
    const points = (cronograma?.curve_s || []).map((point, index) => ({
        label: point?.label || periods[index]?.label || `P${index + 1}`,
        range: periods[index] ? `${formatDate(periods[index]?.starts_at)} - ${formatDate(periods[index]?.ends_at)}` : '',
        value: Number(point?.value || 0),
    }));
    const chartHeight = area.height * 0.66;
    const tableY = area.y + chartHeight + 14;
    const x0 = area.x + 34;
    const y0 = area.y + chartHeight - 24;
    const chartW = area.width - 52;
    const chartH = chartHeight - 34;
    const maxValue = Math.max(...points.map((point) => point.value), 1);
    canvas.rect(area.x, area.y, area.width, chartHeight, { fill: '#FFFDFA', stroke: '#D9DDE5', lineWidth: 0.6 });
    [0, 25, 50, 75, 100].forEach((pct) => {
        const y = y0 - (pct / 100) * chartH;
        canvas.line(x0, y, x0 + chartW, y, { stroke: pct === 0 ? '#1A1A1A' : '#D9DDE5', lineWidth: pct === 0 ? 1 : 0.45 });
        canvas.text(area.x + 8, y + 2, `${pct}%`, { size: 6, bold: true, color: '#4B5563' });
    });
    canvas.line(x0, area.y + 12, x0, y0, { stroke: '#1A1A1A', lineWidth: 1 });
    const graphPoints = points.map((point, index) => ({
        x: x0 + (points.length <= 1 ? chartW / 2 : (chartW / (points.length - 1)) * index),
        y: y0 - (point.value / maxValue) * chartH,
    }));
    canvas.polyline(graphPoints, { stroke: '#F39200', lineWidth: 2.4 });
    graphPoints.forEach((point, index) => {
        canvas.rect(point.x - 2.3, point.y - 2.3, 4.6, 4.6, { fill: '#FFFFFF', stroke: '#F39200', lineWidth: 1.2 });
        if (index % Math.ceil(Math.max(points.length, 1) / 12) === 0) {
            canvas.text(point.x - 18, point.y - 7, formatCurrency(points[index].value, currency, decimals), { size: 5.5, bold: true, maxWidth: 52 });
        }
    });
    const tableRows = Math.max(points.length, 1);
    const rowH = clamp((area.y + area.height - tableY - 16) / (tableRows + 1), 5.5, 14);
    const cols = [area.width * 0.2, area.width * 0.38, area.width * 0.42];
    canvas.rect(area.x, tableY, area.width, rowH, { fill: '#111318' });
    ['Periodo', 'Rango', 'Inversion acumulada'].forEach((label, index) => {
        const x = area.x + cols.slice(0, index).reduce((sum, value) => sum + value, 0) + 6;
        canvas.text(x, tableY + rowH * 0.65, label, { size: clamp(rowH * 0.42, 4.5, 7), bold: true, color: '#FFFFFF', maxWidth: cols[index] - 8 });
    });
    points.forEach((point, index) => {
        const y = tableY + rowH * (index + 1);
        canvas.rect(area.x, y, area.width, rowH, { stroke: '#D9DDE5', lineWidth: 0.35 });
        [point.label, point.range, formatCurrency(point.value, currency, decimals)].forEach((value, colIndex) => {
            const x = area.x + cols.slice(0, colIndex).reduce((sum, width) => sum + width, 0) + 6;
            canvas.text(x, y + rowH * 0.65, value, { size: clamp(rowH * 0.4, 4.2, 6.5), bold: true, maxWidth: cols[colIndex] - 8 });
        });
    });
    doc.addPage(canvas.commands);
    return doc.finish();
};

export const downloadClassicHierarchyPdf = (options = {}) => {
    const blob = buildClassicHierarchyPdfBlob(options);
    const prefix = options.moduleType === 'edt' ? 'lamina_edt_grafico' : 'lamina_edo_grafico';
    const modeSuffix = normalizePrintMode(options.printMode) === PRINT_MODE_PAGINATED ? '_paginado' : '';
    const filename = `${prefix}${modeSuffix}_${sanitizePdfFilename(resolveProjectLabel(options.project))}_${options.pageSize || 'A3'}_${options.orientation === 'portrait' ? 'vertical' : 'horizontal'}.pdf`;
    savePdfBlob(blob, filename);
    return filename;
};

export const downloadClassicCurvePdf = (options = {}) => {
    const blob = buildClassicCurvePdfBlob(options);
    const filename = `lamina_curva_s_${sanitizePdfFilename(resolveProjectLabel(options.project))}_${options.pageSize || 'A4'}_${options.orientation === 'portrait' ? 'vertical' : 'horizontal'}.pdf`;
    savePdfBlob(blob, filename);
    return filename;
};

const parseSimplePathPoints = (path = '') => {
    const matches = String(path || '').match(/[ML]\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/g) || [];
    return matches.map((token) => {
        const [, x, y] = token.match(/[ML]\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/) || [];
        return { x: Number(x || 0), y: Number(y || 0) };
    });
};

const GANTT_PDF_DEPENDENCY_COLOR_BASE = '#136191';
const GANTT_PDF_BAR_NORMAL = {
    fill: '#146493',
    stroke: '#4f99c8',
    innerFill: '#136191',
    highlight: '#79bee8',
};

const drawGanttAppBar = (canvas, x, y, width, height, visual = {}) => {
    const fill = visual.fill || GANTT_PDF_BAR_NORMAL.fill;
    const stroke = visual.stroke || GANTT_PDF_BAR_NORMAL.stroke;
    const innerFill = visual.innerFill || fill;
    const highlight = visual.highlight || innerFill;
    canvas.rect(x, y, width, height, { fill, stroke, lineWidth: 0.35 });
    canvas.rect(x + 0.7, y + 0.7, Math.max(0.6, width - 1.4), Math.max(0.6, height * 0.35), {
        fill: highlight,
    });
    canvas.rect(x + 0.7, y + Math.max(1, height * 0.38), Math.max(0.6, width - 1.4), Math.max(0.6, height * 0.5), {
        fill: innerFill,
    });
};

const drawGanttArrowHead = (canvas, x, y, direction = 'down', { color = GANTT_PDF_DEPENDENCY_COLOR_BASE, size = 1.45 } = {}) => {
    const tip = Math.max(0.8, Number(size || 1.45));
    const wing = tip * 0.42;
    const back = tip * 0.52;
    if (direction === 'up') {
        canvas.polygon([
            { x, y: y - tip },
            { x: x - wing, y: y + back },
            { x: x + wing, y: y + back },
        ], { fill: color });
        return;
    }
    if (direction === 'left') {
        canvas.polygon([
            { x: x - tip, y },
            { x: x + back, y: y - wing },
            { x: x + back, y: y + wing },
        ], { fill: color });
        return;
    }
    if (direction === 'right') {
        canvas.polygon([
            { x: x + tip, y },
            { x: x - back, y: y - wing },
            { x: x - back, y: y + wing },
        ], { fill: color });
        return;
    }
    canvas.polygon([
        { x, y: y + tip },
        { x: x - wing, y: y - back },
        { x: x + wing, y: y - back },
    ], { fill: color });
};

const buildClassicGanttPresentationPdfBlob = ({
    snapshot,
    project = {},
    pageSize = 'A1',
    orientation = 'landscape',
    printMode = 'complete',
    rowsPerPage = 40,
} = {}) => {
    if (!snapshot || !Array.isArray(snapshot.rows) || !snapshot.rows.length) {
        throw new Error('No se encontro el snapshot grafico del Gantt para descargar.');
    }

    const doc = createPdfDocument({ pageSize, orientation });
    const rows = snapshot.rows || [];
    const rowHeightTotal = Math.max(1, Number(snapshot.heightPx || rows.reduce((sum, item) => sum + Number(item.heightPx || 0), 0)));
    const timelineWidth = Math.max(1, Number(snapshot.widthPx || 1));
    const mode = normalizePrintMode(printMode);
    const rowPages = mode === PRINT_MODE_PAGINATED ? chunkArray(rows, rowsPerPage) : [rows];

    rowPages.forEach((pageRows, pageIndex) => {
        const canvas = createPdfCanvas(doc);
        const subtitleBase = 'Snapshot grafico emitido por CronogramaGantt: escala, barras, subbarras y rutas ya resueltas.';
        const area = drawSheetHeader(canvas, doc, {
            title: 'Cronograma Gantt - Presentacion',
            subtitle: rowPages.length > 1 ? `${subtitleBase} Pagina ${pageIndex + 1} de ${rowPages.length}.` : subtitleBase,
            project,
            accent: '#136191',
        });
        const pageStartY = mode === PRINT_MODE_PAGINATED
            ? Math.min(...pageRows.map((item) => Number(item.yPx || 0)))
            : 0;
        const pageEndY = mode === PRINT_MODE_PAGINATED
            ? Math.max(...pageRows.map((item) => Number(item.yPx || 0) + Number(item.heightPx || 0)))
            : rowHeightTotal;
        const pageHeightPx = Math.max(1, pageEndY - pageStartY);
        const leftWidth = clamp(area.width * 0.36, 210, area.width * 0.48);
        const timelineArea = {
            x: area.x + leftWidth,
            y: area.y + 28,
            width: area.width - leftWidth,
            height: area.height - 28,
        };
        const tableArea = {
            x: area.x,
            y: area.y + 28,
            width: leftWidth,
            height: timelineArea.height,
        };
        const scaleX = timelineArea.width / timelineWidth;
        const scaleY = timelineArea.height / pageHeightPx;
        const rowScale = Math.min(scaleY, 1);
        const graphHeight = pageHeightPx * rowScale;
        const graphY = timelineArea.y;
        const tx = (value) => timelineArea.x + Number(value || 0) * scaleX;
        const ty = (value) => graphY + (Number(value || 0) - pageStartY) * rowScale;

        canvas.rect(area.x, area.y, area.width, 24, { fill: '#111318' });
        ['Item', 'Cod EDT', 'Descripcion', 'Pred.', 'Inicio', 'Fin', 'Dur.'].forEach((label, index) => {
            const weights = [0.08, 0.12, 0.37, 0.12, 0.11, 0.11, 0.09];
            const x = area.x + 4 + weights.slice(0, index).reduce((sum, weight) => sum + weight * (leftWidth - 8), 0);
            canvas.text(x, area.y + 15, label, { size: 5.8, bold: true, color: '#FFFFFF', maxWidth: weights[index] * leftWidth - 4 });
        });
        const segmentStep = Math.max(1, Math.ceil((snapshot.segments || []).length / 12));
        (snapshot.segments || []).forEach((segment, index) => {
            const x = timelineArea.x + index * (timelineWidth / Math.max(1, (snapshot.segments || []).length)) * scaleX;
            if (index % segmentStep === 0) {
                canvas.text(x + 2, area.y + 15, segment.secondaryLabel || segment.primaryLabel || '', {
                    size: 5.6,
                    bold: true,
                    color: '#FFFFFF',
                    maxWidth: 38,
                });
            }
            canvas.line(x, graphY, x, graphY + graphHeight, { stroke: '#EEF2F7', lineWidth: 0.35 });
        });
        canvas.rect(tableArea.x, tableArea.y, tableArea.width + timelineArea.width, graphHeight, {
            stroke: '#D9DDE5',
            lineWidth: 0.55,
        });

        pageRows.forEach((layout, index) => {
            const y = ty(layout.yPx || 0);
            const h = Math.max(3.4, Number(layout.heightPx || 24) * rowScale);
            const row = layout.row || {};
            const fill = row.is_calculable ? (index % 2 === 0 ? '#FFFFFF' : '#FAFAFA') : '#F1F5F9';
            canvas.rect(tableArea.x, y, tableArea.width + timelineArea.width, h, { fill, stroke: '#E5E7EB', lineWidth: 0.25 });
            const textY = y + Math.min(h * 0.62, h - 1);
            canvas.text(tableArea.x + 4, textY, row.item || '', { size: 5.4, bold: true, color: '#136191', maxWidth: leftWidth * 0.07 });
            canvas.text(tableArea.x + leftWidth * 0.08, textY, row.codigo || '', { size: 5.4, bold: true, color: '#136191', maxWidth: leftWidth * 0.11 });
            canvas.text(tableArea.x + leftWidth * 0.2, textY, row.descripcion || '', { size: 5.2, bold: true, color: row.is_calculable ? '#1A1A1A' : '#0F3F7A', maxWidth: leftWidth * 0.34 });
            canvas.text(tableArea.x + leftWidth * 0.57, textY, row.predecessors || '-', { size: 5, bold: true, color: '#4B5563', maxWidth: leftWidth * 0.11 });
            canvas.text(tableArea.x + leftWidth * 0.69, textY, formatDate(row.start_date), { size: 4.8, bold: true, color: '#4B5563', maxWidth: leftWidth * 0.1 });
            canvas.text(tableArea.x + leftWidth * 0.8, textY, formatDate(row.end_date), { size: 4.8, bold: true, color: '#4B5563', maxWidth: leftWidth * 0.1 });
            canvas.text(tableArea.x + leftWidth * 0.91, textY, `${formatNumber(row.duration || 0, 1)} d`, { size: 4.8, bold: true, color: '#4B5563', maxWidth: leftWidth * 0.08 });

            const barY = ty(Number(layout.geometry?.topPx ?? layout.yPx ?? 0));
            const barH = Math.max(2.4, Number(layout.geometry?.bottomPx ?? 0) > Number(layout.geometry?.topPx ?? 0)
                ? (Number(layout.geometry.bottomPx) - Number(layout.geometry.topPx)) * rowScale
                : 4);
            if (row.is_milestone && layout.geometry) {
                const cx = tx(layout.geometry.centerPx);
                const cy = ty(layout.geometry.centerY);
                const size = Math.max(3.2, barH * 0.55);
                canvas.polygon([
                    { x: cx, y: cy - size },
                    { x: cx + size, y: cy },
                    { x: cx, y: cy + size },
                    { x: cx - size, y: cy },
                ], { fill: '#F39200', stroke: '#FFFFFF', lineWidth: 0.4 });
            } else if (layout.geometry) {
                const barVisual = layout.visual?.bar || GANTT_PDF_BAR_NORMAL;
                drawGanttAppBar(
                    canvas,
                    tx(layout.geometry.leftPx),
                    barY,
                    Math.max(1.8, Number(layout.geometry.widthPx || 1) * scaleX),
                    barH,
                    barVisual,
                );
            }
        });

        (snapshot.dependencies || []).forEach((dependency) => {
            const rawPoints = parseSimplePathPoints(dependency.d);
            const dependencyFitsPage = mode !== PRINT_MODE_PAGINATED
                || rawPoints.every((point) => point.y >= pageStartY && point.y <= pageEndY);
            if (!dependencyFitsPage) return;
            const points = rawPoints.map((point) => ({ x: tx(point.x), y: ty(point.y) }));
            if (points.length < 2) return;
            const color = dependency.visual?.stroke || GANTT_PDF_DEPENDENCY_COLOR_BASE;
            canvas.polyline(points, { stroke: color, lineWidth: Math.max(0.55, Number(dependency.visual?.strokeWidth || 1.4) * 0.55) });
            const end = points[points.length - 1];
            const before = points[points.length - 2];
            const direction = Math.abs(end.x - before.x) > Math.abs(end.y - before.y)
                ? (end.x >= before.x ? 'right' : 'left')
                : (end.y >= before.y ? 'down' : 'up');
            drawGanttArrowHead(canvas, end.x, end.y, direction, { color, size: 1.45 });
        });

        doc.addPage(canvas.commands);
    });
    return doc.finish();
};

export const downloadClassicGanttPresentationPdf = async (options = {}) => {
    const blob = buildClassicGanttPresentationPdfBlob(options);
    const modeSuffix = normalizePrintMode(options.printMode) === PRINT_MODE_PAGINATED ? '_paginado' : '';
    const filename = `lamina_gantt_presentacion${modeSuffix}_${sanitizePdfFilename(resolveProjectLabel(options.project))}_${options.pageSize || 'A1'}_${options.orientation === 'portrait' ? 'vertical' : 'horizontal'}.pdf`;
    savePdfBlob(blob, filename);
    return filename;
};

const buildSheetScaffold = ({
    title,
    subtitle,
    project,
    pageSize,
    orientation,
    body,
    accent = '#F39200',
}) => {
    const safeSize = PAGE_SIZE_MM[pageSize] ? pageSize : 'A3';
    const safeOrientation = orientation === 'portrait' ? 'portrait' : 'landscape';
    const dims = PAGE_SIZE_MM[safeSize];
    const width = safeOrientation === 'landscape' ? dims.height : dims.width;
    const height = safeOrientation === 'landscape' ? dims.width : dims.height;
    const generatedAt = new Date();
    const documentTitle = `${title || 'Lamina'} - ${resolveProjectLabel(project)} - ${resolveRevisionLabel(project)}`;

    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(documentTitle)}</title>
<style>
@page { size: ${safeSize} ${safeOrientation}; margin: 8mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #f2f4f7; color: #1A1A1A; font-family: Inter, Arial, sans-serif; }
body { width: ${width}mm; min-height: ${height}mm; }
.sheet { width: 100%; min-height: calc(${height}mm - 16mm); background: #fff; border: 0.45mm solid #1A1A1A; display: flex; flex-direction: column; }
.sheet-header { display: grid; grid-template-columns: 1fr auto; gap: 8mm; align-items: start; border-bottom: 0.35mm solid #1A1A1A; padding: 5mm 6mm; }
.sheet-kicker { color: ${accent}; font-size: 8pt; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; }
.sheet-title { margin: 1.5mm 0 0; font-size: 16pt; line-height: 1.05; font-weight: 900; text-transform: uppercase; }
.sheet-subtitle { margin-top: 1.5mm; color: #4B5563; font-size: 8.5pt; font-weight: 700; }
.sheet-meta { display: grid; grid-template-columns: auto auto; gap: 1.8mm 6mm; min-width: 70mm; font-size: 7pt; text-align: right; }
.sheet-meta span:nth-child(odd) { color: #6b7280; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
.sheet-meta span:nth-child(even) { font-weight: 800; }
.sheet-body { flex: 1; min-height: 0; padding: 5mm 6mm 6mm; overflow: hidden; }
.print-note { margin-top: 2mm; color: #6b7280; font-size: 6.6pt; font-weight: 700; }
.hierarchy-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(64mm, 1fr)); gap: 3mm; align-items: start; }
.tree-node { break-inside: avoid; border: 0.25mm solid #d9dde5; border-left: 1.1mm solid var(--node-accent); border-radius: 2mm; background: #fbfbfa; padding: 2.4mm 2.8mm; min-height: 16mm; }
.tree-node.level-0 { background: #f7f7f5; }
.tree-node-title { display: flex; gap: 2mm; align-items: baseline; }
.tree-node-code { color: var(--node-accent); font-size: 8pt; font-weight: 900; white-space: nowrap; }
.tree-node-name { font-size: 8pt; font-weight: 900; line-height: 1.2; }
.tree-node-detail { margin-top: 1.2mm; color: #4B5563; font-size: 6.8pt; font-weight: 700; line-height: 1.25; }
.tree-node-metrics { margin-top: 1.5mm; display: flex; flex-wrap: wrap; gap: 1mm; }
.metric-chip { border: 0.2mm solid #e4e7ec; border-radius: 999px; padding: 0.7mm 1.6mm; background: #fff; color: #374151; font-size: 6.3pt; font-weight: 900; }
.curve-wrap { height: 100%; min-height: 160mm; display: grid; grid-template-rows: 1fr auto; gap: 4mm; }
.curve-svg { width: 100%; height: 100%; min-height: 145mm; border: 0.25mm solid #d9dde5; background: #fffdfa; }
.curve-table { width: 100%; border-collapse: collapse; font-size: 6.4pt; }
.curve-table th, .curve-table td { border: 0.2mm solid #d9dde5; padding: 1mm; text-align: center; }
.curve-table th { background: #111318; color: #fff; text-transform: uppercase; letter-spacing: 0.08em; }
.gantt-wrap { display: grid; grid-template-columns: 102mm 1fr; height: 100%; min-height: 165mm; border: 0.25mm solid #d9dde5; overflow: hidden; }
.gantt-left, .gantt-right { display: grid; grid-auto-rows: 8.5mm; }
.gantt-left { border-right: 0.35mm solid #1A1A1A; }
.gantt-header, .gantt-cell { border-bottom: 0.2mm solid #e4e7ec; padding: 1.1mm 1.4mm; overflow: hidden; }
.gantt-header { background: #111318; color: #fff; font-size: 6.1pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.09em; }
.gantt-row-title { display: grid; grid-template-columns: 13mm 15mm 1fr 23mm; gap: 1.2mm; align-items: center; font-size: 5.9pt; font-weight: 800; }
.gantt-row-title .desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gantt-row-title .pred { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #136191; }
.gantt-timeline-row { position: relative; border-bottom: 0.2mm solid #e4e7ec; background-image: linear-gradient(to right, rgba(19,97,145,0.08) 1px, transparent 1px); background-size: var(--tick-width) 100%; }
.gantt-bar { position: absolute; top: 1.7mm; height: 5.1mm; min-width: 1.3mm; border-radius: 999px; background: #136191; box-shadow: 0 0.6mm 1.8mm rgba(19,97,145,0.18); }
.gantt-milestone { position: absolute; top: 2mm; width: 4.4mm; height: 4.4mm; transform: rotate(45deg); background: #F39200; border: 0.3mm solid #fff; box-shadow: 0 0.6mm 1.8mm rgba(243,146,0,0.25); }
.gantt-axis { position: relative; display: flex; border-bottom: 0.35mm solid #1A1A1A; background: #111318; color: #fff; }
.gantt-axis span { flex: 1 1 0; min-width: 8mm; border-right: 0.15mm solid rgba(255,255,255,0.18); padding: 1.2mm 0.6mm; font-size: 5.6pt; font-weight: 900; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
@media print {
  html, body { background: #fff; }
  .sheet { page-break-after: avoid; }
}
</style>
</head>
<body>
<main class="sheet">
<header class="sheet-header">
<div>
<div class="sheet-kicker">GiProy Clásico · Lámina técnica</div>
<h1 class="sheet-title">${escapeHtml(title)}</h1>
<div class="sheet-subtitle">${escapeHtml(subtitle || '')}</div>
</div>
<div class="sheet-meta">
<span>Proyecto</span><span>${escapeHtml(resolveProjectLabel(project))}</span>
<span>Revisión</span><span>${escapeHtml(resolveRevisionLabel(project))}</span>
<span>Formato</span><span>${safeSize}</span>
<span>Generado</span><span>${escapeHtml(formatDateTime(generatedAt))}</span>
</div>
</header>
<section class="sheet-body">${body}</section>
</main>
</body>
</html>`;
};

const buildHierarchyNodes = (tree = [], moduleType = 'edo', currency = 'USD') => {
    const accent = moduleType === 'edt' ? '#10b981' : '#136191';
    const flat = flattenTree(tree);
    return flat.map((node) => {
        const depth = Math.min(Number(node.level || 0), 8);
        const isEdt = moduleType === 'edt';
        const detail = isEdt
            ? (node.definicion || `${countNodes(node.hijos || [])} descendiente(s)`)
            : [
                node.rol?.nombre,
                node.actividades_claves,
                node.responsabilidades,
                node.stakeholder ? normalizePersonName(`${node.stakeholder?.nombre || ''} ${node.stakeholder?.apellidos || ''}`) : '',
            ].filter(Boolean).join(' · ');
        const metrics = isEdt && node.metrics ? `
<div class="tree-node-metrics">
<span class="metric-chip">Dir. ${escapeHtml(formatCurrency(node.metrics.directo, currency, 2))}</span>
<span class="metric-chip">Val. ${escapeHtml(formatCurrency(node.metrics.valorado, currency, 2))}</span>
</div>` : '';
        return `<article class="tree-node level-${depth}" style="--node-accent:${accent}; margin-left:${depth * 4}mm">
<div class="tree-node-title">
<span class="tree-node-code">${escapeHtml(node.codigo || node.codigo_visible || '-')}</span>
<span class="tree-node-name">${escapeHtml(node.nombre || 'Sin descripción')}</span>
</div>
${detail ? `<div class="tree-node-detail">${escapeHtml(detail)}</div>` : ''}
${metrics}
</article>`;
    }).join('');
};

export const buildClassicHierarchyPrintHtml = ({
    tree = [],
    moduleType = 'edo',
    project = {},
    pageSize = 'A3',
    orientation = 'landscape',
    currency = 'USD',
}) => {
    const isEdt = moduleType === 'edt';
    const title = isEdt ? 'EDT Gráfico Extendido' : 'EDO Gráfico Extendido';
    const subtitle = isEdt
        ? 'Estructura de desglose completa, expandida y sin controles de edición.'
        : 'Estructura de organización completa, expandida y sin controles de edición.';
    const totalNodes = countNodes(tree);
    const body = `
<div class="hierarchy-grid">
${buildHierarchyNodes(tree, moduleType, currency)}
</div>
<p class="print-note">Contenido extendido: ${totalNodes} nodo(s). No incluye botones, buscadores, menús, scrollbars ni controles interactivos.</p>`;
    return buildSheetScaffold({
        title,
        subtitle,
        project,
        pageSize,
        orientation,
        accent: isEdt ? '#10b981' : '#136191',
        body,
    });
};

const buildCurvePoints = (values, width = 1100, height = 520, padding = 62) => {
    if (!values.length) return '';
    const maxValue = Math.max(...values.map((value) => Number(value || 0)), 1);
    const stepX = values.length === 1 ? 0 : (width - padding * 2) / (values.length - 1);
    const baseline = height - padding;
    const chartHeight = height - padding * 2;
    return values.map((value, index) => {
        const x = padding + stepX * index;
        const y = baseline - ((Number(value || 0) / maxValue) * chartHeight);
        return `${x},${y}`;
    }).join(' ');
};

export const buildClassicCurvePrintHtml = ({
    project = {},
    cronograma = {},
    periods = [],
    pageSize = 'A3',
    orientation = 'landscape',
}) => {
    const currency = cronograma?.moneda || 'USD';
    const decimals = cronograma?.dec_moneda ?? 2;
    const points = (cronograma?.curve_s || []).map((point, index) => ({
        label: point?.label || periods[index]?.label || `P${index + 1}`,
        range: periods[index] ? `${formatDate(periods[index]?.starts_at)} - ${formatDate(periods[index]?.ends_at)}` : '',
        value: Number(point?.value || 0),
    }));
    const values = points.map((point) => point.value);
    const polyline = buildCurvePoints(values);
    const [firstPoint = '62,458'] = polyline.split(' ');
    const areaPath = polyline ? `M 62 458 L ${polyline} L 1038 458 Z` : '';
    const body = `
<div class="curve-wrap">
<svg class="curve-svg" viewBox="0 0 1100 520" preserveAspectRatio="xMidYMid meet">
<defs>
<linearGradient id="curvePrintGradient" x1="0%" y1="0%" x2="0%" y2="100%">
<stop offset="0%" stop-color="#F39200" stop-opacity="0.28" />
<stop offset="100%" stop-color="#F39200" stop-opacity="0.02" />
</linearGradient>
</defs>
<rect x="0" y="0" width="1100" height="520" fill="#fffdfa" />
<line x1="62" y1="458" x2="1038" y2="458" stroke="#1A1A1A" stroke-width="2" />
<line x1="62" y1="62" x2="62" y2="458" stroke="#1A1A1A" stroke-width="2" />
${[0, 25, 50, 75, 100].map((pct) => {
    const y = 458 - (pct / 100) * 396;
    return `<line x1="62" y1="${y}" x2="1038" y2="${y}" stroke="#d9dde5" stroke-width="1" /><text x="52" y="${y + 4}" text-anchor="end" font-size="18" font-weight="800" fill="#4B5563">${pct}%</text>`;
}).join('')}
${areaPath ? `<path d="${areaPath}" fill="url(#curvePrintGradient)" />` : ''}
${polyline ? `<polyline fill="none" stroke="#F39200" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" points="${polyline}" />` : ''}
${points.map((point, index) => {
    if (!polyline) return '';
    const [x, y] = (polyline.split(' ')[index] || firstPoint).split(',').map(Number);
    return `<circle cx="${x}" cy="${y}" r="6" fill="#fff" stroke="#F39200" stroke-width="4" /><text x="${x}" y="${y - 16}" text-anchor="middle" font-size="17" font-weight="900" fill="#1A1A1A">${escapeHtml(formatCurrency(point.value, currency, decimals))}</text>`;
}).join('')}
</svg>
<table class="curve-table">
<thead><tr><th>Periodo</th><th>Rango</th><th>Inversión acumulada</th></tr></thead>
<tbody>
${points.map((point) => `<tr><td>${escapeHtml(point.label)}</td><td>${escapeHtml(point.range)}</td><td>${escapeHtml(formatCurrency(point.value, currency, decimals))}</td></tr>`).join('')}
</tbody>
</table>
</div>`;
    return buildSheetScaffold({
        title: 'Cronograma Valorado · Curva S',
        subtitle: 'Curva S completa de avance acumulado, sin controles de edición ni navegación.',
        project,
        pageSize,
        orientation,
        accent: '#0ea5e9',
        body,
    });
};

export const summarizeHierarchyPrint = (tree = []) => ([
    { label: 'Nodos', value: String(countNodes(tree)) },
    { label: 'Raíces', value: String((tree || []).length) },
    { label: 'Salida', value: 'Extendida' },
    { label: 'Controles', value: 'No' },
]);

export const summarizeCurvePrint = (cronograma = {}) => ([
    { label: 'Periodos', value: String((cronograma?.curve_s || []).length) },
    { label: 'Salida', value: 'Curva S' },
    { label: 'Controles', value: 'No' },
    { label: 'Datos', value: 'Completos' },
]);

export const summarizeGanttPrint = (rows = []) => ([
    { label: 'Filas', value: String((rows || []).length) },
    { label: 'Fuente', value: 'Gantt vivo' },
    { label: 'Salida', value: 'PDF directo' },
    { label: 'Reconstrucción', value: 'No' },
]);
