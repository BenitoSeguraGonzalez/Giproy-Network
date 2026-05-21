import React, { useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { presupuestosApi } from '../api/presupuestos';
import { appAlert } from '../utils/appDialog';

const Presupuestos = () => {
    const { proyectoId } = useParams();
    const navigate = useNavigate();
    const { user, selectedEmpresa } = useContext(AuthContext);

    useEffect(() => {
        let cancelled = false;

        const resolveOperationalBudget = async () => {
            if (!proyectoId) {
                navigate('/proyectos', { replace: true });
                return;
            }

            try {
                const empresaId = selectedEmpresa?.id || user?.empresa_id;
                const response = await presupuestosApi.getByProyecto(proyectoId, empresaId);
                const presupuestos = response?.data || [];

                if (cancelled) {
                    return;
                }

                if (presupuestos.length === 0) {
                    appAlert('No se pudo resolver el presupuesto operativo del proyecto.');
                    navigate('/proyectos', { replace: true });
                    return;
                }

                navigate(`/proyectos/${proyectoId}/presupuestos/${presupuestos[0].id}`, { replace: true });
            } catch (error) {
                console.error('Error resolviendo presupuesto operativo:', error);
                if (!cancelled) {
                    appAlert('No se pudo abrir el presupuesto operativo del proyecto.');
                    navigate('/proyectos', { replace: true });
                }
            }
        };

        resolveOperationalBudget();

        return () => {
            cancelled = true;
        };
    }, [navigate, proyectoId, selectedEmpresa?.id, user?.empresa_id]);

    return (
        <div className="min-h-[40vh] flex items-center justify-center bg-[#F8FAFC]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-zinc-200 border-t-[#F39200] rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    Resolviendo presupuesto operativo
                </p>
            </div>
        </div>
    );
};

export default Presupuestos;
