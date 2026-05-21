import licenseBannerStandard from '../../assets/tienda/licencias/Licencia 01 - Estandart.webp';
import licenseBannerProfessional from '../../assets/tienda/licencias/Licencia 02 - Profesional.webp';
import licenseBannerEnterprise from '../../assets/tienda/licencias/Licencia 03 - Empresarial.webp';

export const resolveMarketplaceLicenseOfferMeta = (product) => {
    const preview = product?.vista_previa || {};
    const productMeta = preview?.product_meta || {};
    const offer = productMeta?.license_offer || {};
    const planKind = String(
        offer?.plan_kind
        || productMeta?.plan_kind
        || offer?.license_plan_kind
        || productMeta?.license_plan_kind
        || ''
    ).trim().toLowerCase();
    const licenseName = String(
        offer?.license_name
        || productMeta?.license_name
        || product?.titulo
        || ''
    ).trim();
    const billingCycle = String(
        offer?.billing_cycle
        || productMeta?.billing_cycle
        || ''
    ).trim().toLowerCase();
    const rawDuration = Number(offer?.duration_months || productMeta?.duration_months || 0);
    const durationMonths = Number.isFinite(rawDuration) && rawDuration > 0
        ? rawDuration
        : (billingCycle === 'annual' ? 12 : 1);

    return {
        planKind,
        licenseName,
        billingCycle: billingCycle || (durationMonths >= 12 ? 'annual' : 'monthly'),
        durationMonths,
    };
};

export const resolveMarketplaceLicenseBanner = (product) => {
    const { planKind } = resolveMarketplaceLicenseOfferMeta(product);
    if (planKind === 'estandar' || planKind === 'estándar') return licenseBannerStandard;
    if (planKind === 'profesional') return licenseBannerProfessional;
    if (planKind === 'empresarial') return licenseBannerEnterprise;
    return null;
};
