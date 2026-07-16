import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const routerSource = readFileSync(new URL('../src/routes/AppRouter.jsx', import.meta.url), 'utf8');

for (const eagerImport of [
    "import Dashboard from '../pages/Dashboard';",
    "import BasesTrabajo from '../pages/BasesTrabajo';",
    "import Subcategorias from '../pages/Subcategorias';",
    "import Proyectos from '../pages/Proyectos';",
    "import { OtrosServicios } from '../pages/Placeholders';",
]) {
    assert.equal(
        routerSource.includes(eagerImport),
        false,
        `AppRouter no debe cargar ruta protegida pesada de forma eager: ${eagerImport}`,
    );
}

for (const lazyRoute of [
    "const Dashboard = lazyWithChunkRecovery(() => import('../pages/Dashboard'));",
    "const BasesTrabajo = lazyWithChunkRecovery(() => import('../pages/BasesTrabajo'));",
    "const Subcategorias = lazyWithChunkRecovery(() => import('../pages/Subcategorias'));",
    "const Proyectos = lazyWithChunkRecovery(() => import('../pages/Proyectos'));",
    "const OtrosServicios = lazyWithChunkRecovery(() => import('../pages/Placeholders').then((module) => ({",
]) {
    assert.equal(
        routerSource.includes(lazyRoute),
        true,
        `AppRouter debe conservar lazy-load con recuperacion de chunk: ${lazyRoute}`,
    );
}

for (const publicImport of [
    "import Login from '../pages/Login';",
    "import ForgotPassword from '../pages/ForgotPassword';",
    "import ResetPassword from '../pages/ResetPassword';",
    "import VerifyRegistration from '../pages/VerifyRegistration';",
]) {
    assert.equal(
        routerSource.includes(publicImport),
        true,
        `AppRouter debe conservar rutas publicas directas: ${publicImport}`,
    );
}

console.log('smoke-classic-route-lazy-boundary: ok');
