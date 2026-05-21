import tramo01 from '../../assets/tienda/Compras Publicas/Compras Publicas - Tramo 01.webp';
import tramo02 from '../../assets/tienda/Compras Publicas/Compras Publicas - Tramo 02.webp';
import tramo03 from '../../assets/tienda/Compras Publicas/Compras Publicas - Tramo 03.webp';
import tramo04 from '../../assets/tienda/Compras Publicas/Compras Publicas - Tramo 04.webp';

const PROCUREMENT_BANNER_RANGES = [
    { max: 10000, image: tramo01 },
    { max: 50000, image: tramo02 },
    { max: 250000, image: tramo03 },
    { max: Number.POSITIVE_INFINITY, image: tramo04 },
];

export const resolveMarketplacePublicProcurementBanner = (product) => {
    const portalMeta = product?.vista_previa?.portal_meta || {};
    const rawValue = Number(
        portalMeta?.precio_licitacion
        || product?.precio
        || 0
    );

    if (!Number.isFinite(rawValue) || rawValue <= 0) {
        return tramo01;
    }

    return PROCUREMENT_BANNER_RANGES.find((range) => rawValue <= range.max)?.image || tramo04;
};
