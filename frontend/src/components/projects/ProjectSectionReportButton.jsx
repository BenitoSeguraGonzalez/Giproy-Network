import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { appAlert } from '../../utils/appDialog';
import AppHint from '../ui/AppHint';

export const PROJECT_REPORT_BUTTON_ACTIVE_CLASS = 'border-[#F39200] bg-[#fff7ed]';

export const PROJECT_REPORT_MENU_CLASS = [
    'absolute right-0 top-[calc(100%+0.55rem)] z-[220]',
    'flex flex-col gap-2.5 rounded-[1rem] border border-zinc-200 bg-white p-3',
    'shadow-[0_16px_36px_rgba(15,23,42,0.14)]',
].join(' ');

export const PROJECT_REPORT_MENU_ITEM_CLASS = [
    'inline-flex h-8 w-full shrink-0 items-center justify-between rounded-full px-3',
    'border border-[#ececec] bg-[#f3f3f1]',
    'text-left text-[10px] font-black uppercase tracking-[0.12em] text-zinc-700',
    'shadow-[4px_4px_10px_#d6d6d1,-4px_-4px_10px_#ffffff]',
    'transition-[color,box-shadow,filter] duration-200 hover:brightness-[0.99]',
    'active:shadow-[inset_2px_2px_8px_#d0d0d0,inset_-2px_-2px_8px_#ffffff]',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

export const ProjectReportMenu = ({ children, className = '', widthClassName = 'w-[17rem]' }) => (
    <div className={`${PROJECT_REPORT_MENU_CLASS} ${widthClassName} ${className}`}>
        {children}
    </div>
);

export const ProjectReportMenuItem = ({
    children,
    icon: Icon,
    className = '',
    accent = 'orange',
    ...buttonProps
}) => {
    const accentClass = accent === 'blue' ? 'hover:text-[#136191]' : 'hover:text-[#F39200]';
    return (
        <button
            type="button"
            className={`${PROJECT_REPORT_MENU_ITEM_CLASS} ${accentClass} ${className}`}
            {...buttonProps}
        >
            <span>{children}</span>
            {Icon ? <Icon className="h-4 w-4" /> : null}
        </button>
    );
};

export const ProjectSectionIconButton = ({
    icon: Icon = FileSpreadsheet,
    label = 'Acción',
    hintContent = null,
    onClick = null,
    disabled = false,
    className = '',
    iconClassName = '',
    hintTone = 'light',
    hintClassName = '',
    children = null,
    ...buttonProps
}) => (
    <AppHint content={hintContent || label} tone={hintTone} className={hintClassName}>
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className={[
                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem]',
                'border border-[#ececec] bg-[#ededed] text-zinc-600',
                'shadow-[3px_3px_8px_#d5d5d5,-3px_-3px_8px_#ffffff]',
                'transition-[color,border-color,filter,transform,box-shadow] duration-200 hover:brightness-[0.99] hover:text-[#136191]',
                'focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#136191]/15',
                'active:scale-[0.98] active:shadow-[inset_2px_2px_6px_#d0d0d0,inset_-2px_-2px_6px_#ffffff]',
                'disabled:pointer-events-none disabled:opacity-50',
                className,
            ].join(' ')}
            {...buttonProps}
        >
            {children || (Icon ? <Icon className={`h-4 w-4 ${iconClassName}`.trim()} /> : null)}
        </button>
    </AppHint>
);

const ProjectSectionReportButton = ({
    sectionLabel = 'Sección',
    onClick = null,
    disabled = false,
    className = '',
    title = null,
}) => {
    const handleClick = async () => {
        if (disabled) return;
        if (onClick) {
            await onClick();
            return;
        }
        await appAlert({
            title: 'Reporte de sección',
            message: `El reporte de ${sectionLabel} se definirá en el siguiente paso.`,
            tone: 'info',
        });
    };
    const buttonTitle = title || `Reporte de ${sectionLabel}`;

    return (
        <ProjectSectionIconButton
            icon={FileSpreadsheet}
            label={buttonTitle}
            onClick={handleClick}
            disabled={disabled}
            className={className}
            hintClassName="ml-auto"
        />
    );
};

export default ProjectSectionReportButton;
