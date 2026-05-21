export const getLicenseStatusLabel = (licenseInfo = {}) => {
    const status = String(licenseInfo?.license_status || '').toLowerCase();
    const accessMode = String(licenseInfo?.access_mode || '').toLowerCase();

    if (accessMode === 'readonly' && status === 'expired') return 'Solo lectura';
    if (status === 'pending') return 'Pendiente';
    if (status === 'expired') return 'Expirada';
    return 'Vigente';
};

export const getLicenseStatusTone = (licenseInfo = {}) => {
    const status = String(licenseInfo?.license_status || '').toLowerCase();
    const accessMode = String(licenseInfo?.access_mode || '').toLowerCase();

    if (accessMode === 'readonly' && status === 'expired') {
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }
    if (status === 'expired') {
        return 'border-red-200 bg-red-50 text-red-600';
    }
    if (status === 'pending') {
        return 'border-blue-200 bg-blue-50 text-blue-700';
    }
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
};

export const getLicenseBannerTone = (licenseInfo = {}) => {
    const status = String(licenseInfo?.license_status || '').toLowerCase();
    const accessMode = String(licenseInfo?.access_mode || '').toLowerCase();

    if (accessMode === 'readonly' && status === 'expired') return 'bg-amber-500 text-white';
    if (status === 'expired') return 'bg-red-600 text-white';
    return 'bg-emerald-600 text-white';
};

export const getLicenseBannerMessage = (licenseInfo = {}) => {
    if (licenseInfo?.license_banner_message) return licenseInfo.license_banner_message;

    const status = String(licenseInfo?.license_status || '').toLowerCase();
    const accessMode = String(licenseInfo?.access_mode || '').toLowerCase();

    if (accessMode === 'readonly' && status === 'expired') {
        return 'La empresa opera en solo lectura. Renueve o active una licencia para volver a editar.';
    }
    if (status === 'expired') {
        return 'La licencia de la empresa ha expirado.';
    }
    return 'La licencia de la empresa está vigente.';
};
