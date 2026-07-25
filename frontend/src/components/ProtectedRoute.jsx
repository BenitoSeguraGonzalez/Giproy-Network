import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AsyncState from './ui/async-state';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) return (
        <div className="flex min-h-dvh items-center justify-center bg-[#F2F4F7] p-[var(--app-page-gutter,1rem)]">
            <AsyncState
                className="max-w-xl"
                state="loading"
                title="Preparando el entorno de trabajo"
                description="Estamos verificando tu sesión y permisos."
            />
        </div>
    );

    if (!user) return <Navigate to="/login" replace />;

    if ((user?.rol || '').toLowerCase() === 'usuario_comunidad' && location.pathname !== '/servicios/comunidad') {
        return <Navigate to="/servicios/comunidad" replace />;
    }

    return children;
};

export default ProtectedRoute;
