import { Clock3, FileSpreadsheet, LoaderCircle } from 'lucide-react';
import { AppModalShell, AppModalBody } from '../ui/app-modal';

const ReportGenerationModal = ({
    isOpen,
    title = 'Generando reporte',
    message = 'Estamos preparando el documento. Esta operación puede tardar unos segundos.',
}) => {
    return (
        <AppModalShell
            isOpen={isOpen}
            onClose={null}
            size="sm"
            zIndex="z-[1120]"
            panelClassName="max-w-[420px]"
        >
            <AppModalBody className="px-8 py-8">
                <div className="flex flex-col items-center text-center">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-orange-200 bg-orange-50 text-[#F39200] shadow-sm">
                        <FileSpreadsheet className="h-7 w-7" />
                        <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-blue-100 bg-white shadow-sm">
                            <LoaderCircle className="absolute h-5 w-5 animate-spin text-[#136191]" />
                            <Clock3 className="h-3.5 w-3.5 text-[#136191]" />
                        </div>
                    </div>
                    <div className="mt-5 text-[13px] font-black uppercase tracking-[0.18em] text-zinc-900">
                        {title}
                    </div>
                    <div className="mt-3 max-w-[280px] text-[12px] font-medium leading-relaxed text-zinc-500">
                        {message}
                    </div>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                        <Clock3 className="h-3.5 w-3.5 animate-pulse text-[#F39200]" />
                        Procesando
                    </div>
                </div>
            </AppModalBody>
        </AppModalShell>
    );
};

export default ReportGenerationModal;
