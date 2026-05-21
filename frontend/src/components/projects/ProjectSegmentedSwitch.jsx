const SIZE_PRESETS = {
    sm: {
        width: 118,
        height: 38,
        toggleWidth: 58,
        toggleHeight: 30,
        toggleTop: 4,
        leftOff: 4,
        leftOn: 56,
        fontSize: '8px',
        letterSpacing: '0.14em',
    },
    md: {
        width: 138,
        height: 42,
        toggleWidth: 68,
        toggleHeight: 34,
        toggleTop: 4,
        leftOff: 4,
        leftOn: 66,
        fontSize: '8px',
        letterSpacing: '0.14em',
    },
    lg: {
        width: 160,
        height: 46,
        toggleWidth: 78,
        toggleHeight: 38,
        toggleTop: 4,
        leftOff: 4,
        leftOn: 78,
        fontSize: '8px',
        letterSpacing: '0.14em',
    },
};

const shellShadow = {
    boxShadow: 'inset -5px -5px 10px #ffffff, inset 5px 5px 10px #d0d0d0',
};

const knobShadow = {
    boxShadow: '-3px -3px 6px #ffffff, 3px 3px 6px #c7c7c7',
};

const hoverKnobShadow = {
    boxShadow: '-3px -3px 8px #ffffff, 3px 3px 8px #c4c4c4',
};

const ProjectSegmentedSwitch = ({
    value,
    onChange,
    options,
    size = 'md',
    className = '',
    ariaLabel,
    disabled = false,
    minSegmentWidth = 84,
}) => {
    const normalizedOptions = Array.isArray(options) ? options.filter(Boolean) : [];
    if (normalizedOptions.length < 2) return null;

    const preset = SIZE_PRESETS[size] || SIZE_PRESETS.md;
    const activeIndex = Math.max(
        0,
        normalizedOptions.findIndex((option) => option.value === value)
    );
    const activeOption = normalizedOptions[activeIndex] || normalizedOptions[0];
    const segmentWidth = 100 / normalizedOptions.length;
    const knobWidth = `calc(${segmentWidth}% - 8px)`;

    return (
        <div
            className={`relative shrink-0 rounded-[999px] bg-[#ededed] ${className}`.trim()}
            style={{
                width: `${Math.max(preset.width, normalizedOptions.length * minSegmentWidth)}px`,
                height: `${preset.height}px`,
                ...shellShadow,
            }}
            role="tablist"
            aria-label={ariaLabel || activeOption.label}
            aria-disabled={disabled}
        >
            <div className="pointer-events-none absolute inset-0 rounded-[999px]" style={shellShadow} />

            {normalizedOptions.map((option, index) => {
                const isActive = option.value === activeOption.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        title={option.title || option.label}
                        disabled={disabled}
                        onClick={() => {
                            if (!disabled) onChange?.(option.value);
                        }}
                        className={`absolute top-0 z-10 h-full bg-transparent px-2 text-center font-black uppercase leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            isActive ? 'text-transparent' : 'text-[#6b7280] hover:text-[#136191]'
                        }`}
                        style={{
                            left: `${segmentWidth * index}%`,
                            width: `${segmentWidth}%`,
                            fontSize: preset.fontSize,
                            letterSpacing: preset.letterSpacing,
                        }}
                    >
                        {option.label}
                    </button>
                );
            })}

            <div
                className="pointer-events-none absolute z-20 flex items-center justify-center rounded-[999px] bg-gradient-to-br from-[#f3f3f3] to-[#dddddd] text-[#136191] transition-all duration-300 ease-in-out"
                style={{
                    top: `${preset.toggleTop}px`,
                    left: `calc(${segmentWidth * activeIndex}% + 4px)`,
                    width: knobWidth,
                    height: `${preset.toggleHeight}px`,
                    ...knobShadow,
                }}
            >
                <span
                    className="whitespace-nowrap font-black uppercase leading-none"
                    style={{
                        fontSize: preset.fontSize,
                        letterSpacing: preset.letterSpacing,
                    }}
                >
                    {activeOption.label}
                </span>
            </div>

            <div
                className="pointer-events-none absolute inset-0 rounded-[999px] opacity-0 transition-opacity duration-200 hover:opacity-100"
                style={hoverKnobShadow}
            />
        </div>
    );
};

export default ProjectSegmentedSwitch;
