const LABELS = {
    automatic: 'Auto',
    performance: 'Rendimiento',
    high: 'Alta',
};

const BimRenderQualityControl = ({ mode, setMode, pixelRatio }) => (
    <label className="inline-flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 text-[10px] font-semibold text-zinc-600">
        Calidad
        <select
            value={mode}
            onChange={(event) => setMode(event.target.value)}
            className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-[10px]"
            aria-label="Calidad de renderizado BIM"
            data-bim-render-quality={mode}
        >
            {Object.entries(LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <span className="text-zinc-400">{pixelRatio.toFixed(2)}×</span>
    </label>
);

export default BimRenderQualityControl;
