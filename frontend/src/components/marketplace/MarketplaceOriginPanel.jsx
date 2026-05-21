import { Link } from 'react-router-dom';
import { Archive, BadgeCheck, Link2 } from 'lucide-react';

const boolLabel = (value) => (value ? 'Si' : 'No');

const MarketplaceOriginPanel = ({ title, entityTypeLabel, originData, loading = false, compact = false, className = '' }) => {
    const { origin, ownershipKind, originKind, usagePolicy } = originData || {};

    if (loading) {
        return (
            <div className={`rounded-[1.5rem] border border-zinc-200 bg-white p-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 ${className}`}>
                Cargando origen
            </div>
        );
    }

    return (
        <div className={`rounded-[1.5rem] border ${origin ? 'border-orange-200 bg-orange-50/60' : 'border-emerald-200 bg-emerald-50/70'} p-4 ${className}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        {origin ? <Link2 className="h-4 w-4 text-[#F39200]" /> : <BadgeCheck className="h-4 w-4 text-emerald-600" />}
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{title || 'Origen del activo'}</p>
                    </div>
                    <p className="mt-2 text-sm font-black text-zinc-900">
                        {entityTypeLabel || 'Activo'} {origin ? 'adquirido' : 'propio'}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-zinc-600">
                        {origin
                            ? (origin.origin_label || 'Marketplace')
                            : 'Creado dentro de la empresa y habilitado como activo nativo.'}
                    </p>
                    {origin?.source_entity_type && origin?.source_entity_id && (
                        <p className="mt-1 text-xs font-medium text-zinc-500">
                            Referencia origen: {origin.source_entity_type} #{origin.source_entity_id}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${ownershipKind === 'acquired' ? 'border-orange-200 bg-white text-[#A55A00]' : 'border-emerald-200 bg-white text-emerald-700'}`}>
                        {ownershipKind === 'acquired' ? 'Adquirido' : 'Propio'}
                    </span>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${originKind === 'marketplace' ? 'border-orange-200 bg-white text-[#A55A00]' : 'border-emerald-200 bg-white text-emerald-700'}`}>
                        {originKind === 'marketplace' ? 'Marketplace' : 'Nativo'}
                    </span>
                </div>
            </div>

            <div className={`mt-4 grid gap-3 ${compact ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
                <div className="rounded-2xl border border-white bg-white px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Editable</p>
                    <p className="mt-1 text-sm font-black text-zinc-700">{boolLabel(usagePolicy?.editable_internal)}</p>
                </div>
                <div className="rounded-2xl border border-white bg-white px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Duplicable</p>
                    <p className="mt-1 text-sm font-black text-zinc-700">{boolLabel(usagePolicy?.duplicable_internal)}</p>
                </div>
                <div className="rounded-2xl border border-white bg-white px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Republicable</p>
                    <p className="mt-1 text-sm font-black text-zinc-700">{boolLabel(usagePolicy?.publishable_marketplace)}</p>
                </div>
                {!compact && (
                    <div className="rounded-2xl border border-white bg-white px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Trazabilidad</p>
                        <p className="mt-1 text-sm font-black text-zinc-700">{boolLabel(usagePolicy?.requires_origin_traceability)}</p>
                    </div>
                )}
            </div>

            {origin?.marketplace_order_id && (
                <div className="mt-4">
                    <Link
                        to={`/pedido/${origin.marketplace_order_id}`}
                        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200]"
                    >
                        <Archive className="h-4 w-4" />
                        Ver pedido origen
                    </Link>
                </div>
            )}
        </div>
    );
};

export default MarketplaceOriginPanel;
