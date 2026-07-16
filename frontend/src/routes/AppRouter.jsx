import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import VerifyRegistration from '../pages/VerifyRegistration';
import RucReviewStatus from '../pages/RucReviewStatus';
import ProtectedRoute from '../components/ProtectedRoute';
import AppLayout from '../layouts/AppLayout';
import { PresupuestoProvider } from '../context/PresupuestoContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { lazyWithChunkRecovery } from '../utils/lazyImportRecovery';

const Dashboard = lazyWithChunkRecovery(() => import('../pages/Dashboard'));
const BasesTrabajo = lazyWithChunkRecovery(() => import('../pages/BasesTrabajo'));
const Subcategorias = lazyWithChunkRecovery(() => import('../pages/Subcategorias'));
const Proyectos = lazyWithChunkRecovery(() => import('../pages/Proyectos'));
const ProjectManager = lazyWithChunkRecovery(() => import('../pages/ProjectManager'));
const APUs = lazyWithChunkRecovery(() => import('../pages/APUs'));
const Recursos = lazyWithChunkRecovery(() => import('../pages/Recursos'));
const Presupuestos = lazyWithChunkRecovery(() => import('../pages/Presupuestos'));
const PreciosUnitarios = lazyWithChunkRecovery(() => import('../pages/PreciosUnitarios'));
const Settings = lazyWithChunkRecovery(() => import('../pages/Settings'));
const Community = lazyWithChunkRecovery(() => import('../pages/Community'));
const EnviosTransferencias = lazyWithChunkRecovery(() => import('../pages/EnviosTransferencias'));
const Marketplace = lazyWithChunkRecovery(() => import('../pages/Marketplace'));
const MarketplaceProductDetail = lazyWithChunkRecovery(() => import('../pages/MarketplaceProductDetail'));
const MarketplaceOrderDetail = lazyWithChunkRecovery(() => import('../pages/MarketplaceOrderDetail'));
const MarketplaceBuyerDashboard = lazyWithChunkRecovery(() => import('../pages/MarketplaceBuyerDashboard'));
const SellerDashboard = lazyWithChunkRecovery(() => import('../pages/SellerDashboard'));
const MarketplaceAdminDashboard = lazyWithChunkRecovery(() => import('../pages/MarketplaceAdminDashboard'));
const AdminGlobal = lazyWithChunkRecovery(() => import('../pages/AdminGlobal'));
const AdminGlobalEstado = lazyWithChunkRecovery(() => import('../pages/AdminGlobalEstado'));
const AdminGlobalSesiones = lazyWithChunkRecovery(() => import('../pages/AdminGlobalSesiones'));
const AdminGlobalMantenimiento = lazyWithChunkRecovery(() => import('../pages/AdminGlobalMantenimiento'));
const AdminGlobalBim = lazy(() => import('../pages/AdminGlobalBim'));
const AdminGlobalLicencias = lazyWithChunkRecovery(() => import('../pages/AdminGlobalLicencias'));
const AdminGlobalEmail = lazyWithChunkRecovery(() => import('../pages/AdminGlobalEmail'));
const AdminGlobalIntegraciones = lazyWithChunkRecovery(() => import('../pages/AdminGlobalIntegraciones'));
const AdminGlobalSuperadministradores = lazyWithChunkRecovery(() => import('../pages/AdminGlobalSuperadministradores'));
const AdminGlobalEmpresas = lazyWithChunkRecovery(() => import('../pages/AdminGlobalEmpresas'));
const AdminGlobalComunicados = lazyWithChunkRecovery(() => import('../pages/AdminGlobalComunicados'));
const AdminGlobalGobernanza = lazyWithChunkRecovery(() => import('../pages/AdminGlobalGobernanza'));
const AdminGlobalAuditoria = lazyWithChunkRecovery(() => import('../pages/AdminGlobalAuditoria'));
const AdminGlobalHerramientas = lazyWithChunkRecovery(() => import('../pages/AdminGlobalHerramientas'));
const AdminGlobalImportModels = lazyWithChunkRecovery(() => import('../pages/AdminGlobalImportModels'));
const AdminGlobalEmpresaAuditada = lazyWithChunkRecovery(() => import('../pages/AdminGlobalEmpresaAuditada'));
const PresupuestoDetail = lazyWithChunkRecovery(() => import('../components/presupuestos/PresupuestoDetail'));
const OtrosServicios = lazyWithChunkRecovery(() => import('../pages/Placeholders').then((module) => ({
    default: module.OtrosServicios,
})));

const RouteFallback = () => (
    <div className="min-h-[40vh] flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-[#F39200] rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Cargando modulo</p>
        </div>
    </div>
);

const withProtectedLayout = (element, withPresupuestoProvider = false) => {
    const content = withPresupuestoProvider ? (
        <PresupuestoProvider>{element}</PresupuestoProvider>
    ) : (
        element
    );

    return (
        <ProtectedRoute>
            <AppLayout>
                <Suspense fallback={<RouteFallback />}>
                    {content}
                </Suspense>
            </AppLayout>
        </ProtectedRoute>
    );
};

/**
 * AppRouter — Enrutador principal del sistema GIPROY ERP.
 *
 * Rutas públicas: /login, /forgot-password, /reset-password
 * Rutas protegidas: envueltas en <ProtectedRoute> + <AppLayout> para mostrar
 * el encabezado persistente en todas las páginas autenticadas.
 */
const AppRouter = () => {
    return (
        <ErrorBoundary>
            <Router>
                <Routes>
                {/* Rutas públicas — sin encabezado */}
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-registration" element={<VerifyRegistration />} />
                <Route path="/ruc-review" element={<RucReviewStatus />} />

                {/* Rutas protegidas — con encabezado persistente (AppLayout) */}
                <Route path="/" element={withProtectedLayout(<Dashboard />)} />
                <Route path="/dashboard" element={withProtectedLayout(<Dashboard />)} />
                <Route path="/proyectos" element={withProtectedLayout(<Proyectos />)} />
                <Route path="/proyectos/gestor" element={withProtectedLayout(<ProjectManager />)} />
                <Route path="/precios-unitarios" element={withProtectedLayout(<PreciosUnitarios />)} />
                <Route path="/precios-unitarios/bases" element={withProtectedLayout(<BasesTrabajo />)} />
                <Route path="/precios-unitarios/subcategorias" element={withProtectedLayout(<Subcategorias />)} />
                <Route path="/apus" element={withProtectedLayout(<APUs />)} />
                <Route path="/recursos" element={withProtectedLayout(<Recursos />)} />
                <Route path="/proyectos/:proyectoId/presupuestos" element={withProtectedLayout(<Presupuestos />, true)} />
                <Route path="/proyectos/:proyectoId/presupuestos/:presupuestoId" element={withProtectedLayout(<PresupuestoDetail />, true)} />
                <Route path="/servicios" element={withProtectedLayout(<OtrosServicios />)} />
                <Route path="/servicios/comunidad" element={withProtectedLayout(<Community />)} />
                <Route path="/servicios/envios-transferencias" element={withProtectedLayout(<EnviosTransferencias />)} />
                <Route path="/marketplace" element={withProtectedLayout(<Marketplace />)} />
                <Route path="/product/:productId" element={withProtectedLayout(<MarketplaceProductDetail />)} />
                <Route path="/pedido/:orderId" element={withProtectedLayout(<MarketplaceOrderDetail />)} />
                <Route path="/marketplace/buyer" element={withProtectedLayout(<MarketplaceBuyerDashboard />)} />
                <Route path="/dashboard/buyer" element={withProtectedLayout(<MarketplaceBuyerDashboard />)} />
                <Route path="/dashboard/seller" element={withProtectedLayout(<SellerDashboard />)} />
                <Route path="/dashboard/admin" element={withProtectedLayout(<MarketplaceAdminDashboard />)} />
                <Route path="/settings" element={withProtectedLayout(<Settings />)} />
                <Route path="/admin-global" element={withProtectedLayout(<AdminGlobal />)} />
                <Route path="/admin-global/estado" element={withProtectedLayout(<AdminGlobalEstado />)} />
                <Route path="/admin-global/sesiones" element={withProtectedLayout(<AdminGlobalSesiones />)} />
                <Route path="/admin-global/mantenimiento" element={withProtectedLayout(<AdminGlobalMantenimiento />)} />
                <Route path="/admin-global/bim" element={withProtectedLayout(<AdminGlobalBim />)} />
                <Route path="/admin-global/licencias" element={withProtectedLayout(<AdminGlobalLicencias />)} />
                <Route path="/admin-global/email-corporativo" element={withProtectedLayout(<AdminGlobalEmail />)} />
                <Route path="/admin-global/integraciones" element={withProtectedLayout(<AdminGlobalIntegraciones />)} />
                <Route path="/admin-global/superadministradores" element={withProtectedLayout(<AdminGlobalSuperadministradores />)} />
                <Route path="/admin-global/empresas" element={withProtectedLayout(<AdminGlobalEmpresas />)} />
                <Route path="/admin-global/comunicados" element={withProtectedLayout(<AdminGlobalComunicados />)} />
                <Route path="/admin-global/gobernanza" element={withProtectedLayout(<AdminGlobalGobernanza />)} />
                <Route path="/admin-global/auditoria" element={withProtectedLayout(<AdminGlobalAuditoria />)} />
                <Route path="/admin-global/herramientas" element={withProtectedLayout(<AdminGlobalHerramientas />)} />
                <Route path="/admin-global/modelos-importacion" element={withProtectedLayout(<AdminGlobalImportModels />)} />
                <Route path="/admin-global/empresa-auditada" element={withProtectedLayout(<AdminGlobalEmpresaAuditada />)} />
            </Routes>
        </Router>
    </ErrorBoundary>
);
};

export default AppRouter;
