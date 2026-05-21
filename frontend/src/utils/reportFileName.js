const sanitizeFilenamePart = (value, fallback = 'Documento') => {
    const sanitized = String(value || '')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return sanitized || fallback;
};

const normalizeRevision = (revision) => {
    const numeric = Number(revision);
    if (Number.isFinite(numeric) && numeric >= 0) {
        return String(Math.trunc(numeric)).padStart(3, '0');
    }
    return '000';
};

export const buildReportFileName = ({
    reportLabel,
    contextLabel,
    revision,
    extension,
}) => {
    const label = sanitizeFilenamePart(reportLabel, 'Reporte');
    const context = sanitizeFilenamePart(contextLabel, 'Documento');
    const ext = String(extension || 'xlsx').replace(/^\./, '').trim() || 'xlsx';
    return `${label} - ${context} R${normalizeRevision(revision)}.${ext}`;
};

export const sanitizeReportContext = sanitizeFilenamePart;
