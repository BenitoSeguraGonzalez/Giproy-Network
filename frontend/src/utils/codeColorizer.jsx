import React from 'react';

/**
 * SIRIS-CID: Sistema de Identificación por Colores
 * Renderiza códigos (Categorías, Subcategorías, Recursos, APUs) con colores segmentados.
 * 
 * Estándar:
 * - 2 Partes (C-SSS o APU-XXXX): [Naranja, Púrpura]
 * - 3 Partes (C-SSSS-RRRRR): [Naranja, Azul, Púrpura]
 */
const CodeColorizer = ({ code, className = "" }) => {
    if (!code || typeof code !== 'string') return <span>{code}</span>;

    const parts = code.split('-');

    // Naranja SIRIS: #F39200
    // Azul SIRIS: #3B82F6
    // Púrpura SIRIS: #A855F7

    const colors = {
        orange: 'text-[#F39200]',
        blue: 'text-blue-500',
        purple: 'text-purple-500'
    };

    if (parts.length === 2) {
        return (
            <span className={`font-black tracking-tighter ${className}`}>
                <span className={colors.orange}>{parts[0]}</span>
                <span className="text-zinc-400 mx-0.5">-</span>
                <span className={colors.purple}>{parts[1]}</span>
            </span>
        );
    }

    if (parts.length === 3) {
        return (
            <span className={`font-black tracking-tighter ${className}`}>
                <span className={colors.orange}>{parts[0]}</span>
                <span className="text-zinc-400 mx-0.5">-</span>
                <span className={colors.blue}>{parts[1]}</span>
                <span className="text-zinc-400 mx-0.5">-</span>
                <span className={colors.purple}>{parts[2]}</span>
            </span>
        );
    }

    // Fallback para códigos no estándar o largos
    return (
        <span className={`font-black tracking-tighter ${className}`}>
            {parts.map((p, i) => (
                <React.Fragment key={i}>
                    <span className={i === 0 ? colors.orange : i === 1 ? colors.blue : colors.purple}>
                        {p}
                    </span>
                    {i < parts.length - 1 && <span className="text-zinc-400 mx-0.5">-</span>}
                </React.Fragment>
            ))}
        </span>
    );
};

export default CodeColorizer;
