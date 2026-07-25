import {
    AlertTriangle,
    CloudOff,
    Inbox,
    LoaderCircle,
    ShieldAlert,
} from 'lucide-react';

const stateConfiguration = {
    loading: {
        icon: LoaderCircle,
        iconClassName: 'animate-spin motion-reduce:animate-none text-[#D97706]',
        title: 'Cargando información',
    },
    empty: {
        icon: Inbox,
        iconClassName: 'text-zinc-500',
        title: 'Todavía no hay información',
    },
    error: {
        icon: AlertTriangle,
        iconClassName: 'text-red-600',
        title: 'No se pudo completar la operación',
    },
    offline: {
        icon: CloudOff,
        iconClassName: 'text-amber-700',
        title: 'Sin conexión',
    },
    forbidden: {
        icon: ShieldAlert,
        iconClassName: 'text-zinc-700',
        title: 'Acceso no disponible',
    },
};

const AsyncState = ({
    state = 'loading',
    title,
    description,
    actionLabel,
    onAction,
    compact = false,
    className = '',
    ...props
}) => {
    const configuration = stateConfiguration[state] || stateConfiguration.error;
    const Icon = configuration.icon;
    const isError = state === 'error';

    return (
        <section
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
            aria-busy={state === 'loading' ? 'true' : undefined}
            data-async-state={state}
            className={`flex w-full min-w-0 flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white text-center ${
                compact ? 'min-h-28 gap-2 p-4' : 'min-h-48 gap-3 p-6 sm:p-8'
            } ${className}`.trim()}
            {...props}
        >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100" aria-hidden="true">
                <Icon className={`h-5 w-5 ${configuration.iconClassName}`} />
            </span>
            <div className="min-w-0 max-w-xl">
                <h2 className="break-words text-base font-black leading-snug text-zinc-900">
                    {title || configuration.title}
                </h2>
                {description ? (
                    <p className="mt-1 break-words text-sm leading-relaxed text-zinc-600">{description}</p>
                ) : null}
            </div>
            {actionLabel && onAction ? (
                <button
                    type="button"
                    onClick={onAction}
                    className="min-h-[var(--app-control-target,2.5rem)] max-w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-bold text-white outline-none transition-colors hover:bg-[#B45309] focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
                >
                    <span className="break-words">{actionLabel}</span>
                </button>
            ) : null}
        </section>
    );
};

export default AsyncState;
