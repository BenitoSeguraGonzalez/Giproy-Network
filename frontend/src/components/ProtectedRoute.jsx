import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) return (
        <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-[#F39200] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Cargando...</span>
            </div>
        </div>
    );

    if (!user) return <Navigate to="/login" replace />;

    if ((user?.rol || '').toLowerCase() === 'usuario_comunidad' && location.pathname !== '/servicios/comunidad') {
        return <Navigate to="/servicios/comunidad" replace />;
    }

    return children;
};

export default ProtectedRoute;
