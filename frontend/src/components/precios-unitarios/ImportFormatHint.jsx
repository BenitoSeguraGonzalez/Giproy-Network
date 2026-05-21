import { Info } from 'lucide-react';

const TONES = {
    orange: {
        wrap: 'bg-orange-50 border-orange-100',
        icon: 'text-[#F39200]',
        title: 'text-[#C46000]',
        format: 'text-[#F39200]'
    },
    blue: {
        wrap: 'bg-blue-50 border-blue-100',
        icon: 'text-blue-500',
        title: 'text-blue-700',
        format: 'text-blue-900'
    }
};

const ImportFormatHint = ({ title = 'Formato esperado', format, hint, lines = [], tone = 'orange' }) => {
    const palette = TONES[tone] || TONES.orange;
    const normalizedLines = Array.isArray(lines)
        ? lines.filter(Boolean)
        : [];
    const primaryFormat = format || normalizedLines[0] || '';
    const extraLines = normalizedLines.slice(format ? 0 : 1);

    return (
        <div className={`rounded-2xl border p-4 flex items-start gap-3 ${palette.wrap}`}>
            <Info className={`w-4 h-4 mt-0.5 shrink-0 ${palette.icon}`} />
            <div className="space-y-1">
                <p className={`text-[10px] font-black uppercase tracking-wider ${palette.title}`}>
                    {title}
                </p>
                {primaryFormat && (
                    <p className={`text-sm font-black uppercase tracking-wide ${palette.format}`}>
                        {primaryFormat}
                    </p>
                )}
                {extraLines.length > 0 && (
                    <div className="space-y-1">
                        {extraLines.map((line, index) => (
                            <p key={`${title}-line-${index}`} className="text-[10px] font-medium text-zinc-600 leading-relaxed">
                                {line}
                            </p>
                        ))}
                    </div>
                )}
                {hint && (
                    <p className="text-[10px] font-medium text-zinc-600 leading-relaxed">
                        {hint}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ImportFormatHint;
