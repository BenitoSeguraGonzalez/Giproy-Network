import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        globalThis.reportClientError?.('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[2rem] text-center max-w-2xl mx-auto my-12 shadow-sm">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 mb-2 uppercase tracking-tight">Interrupción en el Proceso</h2>
                    <p className="text-sm text-zinc-500 font-medium mb-8 max-w-md">Se ha detectado una excepción en tiempo de ejecución. El sistema ha contenido el error para prevenir un colapso total.</p>

                    <div className="w-full text-left bg-zinc-900 rounded-xl p-6 overflow-hidden shadow-2xl">
                        <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Detalles Técnicos</span>
                        </div>
                        <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar leading-relaxed">
                            {this.state.error && this.state.error.toString()}
                            {"\n\n"}
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-3 bg-zinc-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#F39200] transition-colors shadow-lg shadow-zinc-200"
                    >
                        Reiniciar Módulo
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
