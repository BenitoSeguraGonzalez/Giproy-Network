const decode5987Value = (value) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

export const extractFilenameFromContentDisposition = (contentDisposition) => {
    const raw = String(contentDisposition || '').trim();
    if (!raw) return '';

    const utf8Match = raw.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        return decode5987Value(utf8Match[1]).replace(/^["']|["']$/g, '').trim();
    }

    const quotedMatch = raw.match(/filename\s*=\s*"([^"]+)"/i);
    if (quotedMatch?.[1]) {
        return quotedMatch[1].trim();
    }

    const bareMatch = raw.match(/filename\s*=\s*([^;]+)/i);
    if (bareMatch?.[1]) {
        return bareMatch[1].replace(/^["']|["']$/g, '').trim();
    }

    return '';
};

export const downloadBlobResponse = (response, fallbackFilename, explicitMimeType = null) => {
    const contentType = explicitMimeType || response?.headers?.['content-type'] || 'application/octet-stream';
    const serverFilename = extractFilenameFromContentDisposition(response?.headers?.['content-disposition']);
    const fileName = serverFilename || fallbackFilename || 'Documento';
    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return fileName;
};
