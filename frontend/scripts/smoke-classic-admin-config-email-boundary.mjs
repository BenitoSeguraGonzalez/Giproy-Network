import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const settingsSource = readFileSync(new URL('../src/pages/Settings.jsx', import.meta.url), 'utf8');
const adminConfigApiSource = readFileSync(new URL('../src/api/adminConfig.js', import.meta.url), 'utf8');
const adminGlobalSource = readFileSync(new URL('../src/pages/AdminGlobal.jsx', import.meta.url), 'utf8');
const adminGlobalEmailSource = readFileSync(new URL('../src/pages/AdminGlobalEmail.jsx', import.meta.url), 'utf8');
const routerSource = readFileSync(new URL('../src/routes/AppRouter.jsx', import.meta.url), 'utf8');

assert.equal(
    settingsSource.includes("from '../api/axiosConfig'"),
    false,
    'Settings no debe importar axiosConfig directamente en MODO 1',
);

assert.equal(
    settingsSource.includes('getEmailSettings') || settingsSource.includes('setEmailSettings') || settingsSource.includes('testEmailSettings'),
    false,
    'Settings no debe gestionar email corporativo SaaS; esa gestión vive solo en AdminGlobalEmail',
);

assert.equal(
    settingsSource.includes('SMTP_HOST') || settingsSource.includes('FRONTEND_PUBLIC_URL'),
    false,
    'Settings no debe contener campos SMTP/URL publica del email corporativo SaaS',
);

assert.equal(
    adminGlobalEmailSource.includes("import { adminConfigApi } from '../api/adminConfig';"),
    true,
    'AdminGlobalEmail debe consumir adminConfigApi para configuracion SaaS',
);

for (const token of [
    'adminConfigApi.getEmailSettings()',
    'adminConfigApi.setEmailSettings(form)',
    'adminConfigApi.testEmailSettings(',
    'applyGmailPreset',
    'isGmailAddress',
    'withGmailSmtpDefaults',
    'GMAIL_DOMAINS',
    'GOOGLE_APP_PASSWORD_HELP_URL',
    'GOOGLE_APP_PASSWORD_DIRECT_URL',
    'GOOGLE_2SV_DIRECT_URL',
    'https://myaccount.google.com/apppasswords',
    'https://myaccount.google.com/signinoptions/two-step-verification',
    'https://myaccount.google.com/',
    'App password no disponible',
    'Ir a cuenta Google',
    'Ver causas Google',
    'canTestGmailSettings',
    'gmailSecurityReady',
    'GMAIL_2SV_CONFIRMED',
    'GMAIL_APP_PASSWORD_CONFIRMED',
    'Completa la validación Gmail',
    'Gmail STARTTLS',
    'Gmail SSL',
    'Verificación en 2 pasos activa',
    'Contraseña de aplicación generada',
    'Gmail requiere una contraseña de aplicación',
    'Abrir Google',
    'Gmail detectado',
    'showHelp',
    'Tipos soportados',
    'Gmail paso a paso',
    'Activar app passwords',
    'Valores Gmail',
    'Si Google no deja',
    'Confirmar con móvil, prompt o Authenticator',
    'Volver a esta ayuda y abrir App passwords',
    '2 pasos debe estar activo',
    'Google genera 16 caracteres',
    'Copiar los 16 caracteres en SMTP Password',
    'no uses la contraseña normal',
    "SMTP_HOST: 'smtp.gmail.com'",
    "SMTP_PORT: '587'",
    "SMTP_USE_TLS: 'true'",
    "SMTP_USE_SSL: 'false'",
    'FRONTEND_PUBLIC_URL',
]) {
    assert.equal(
        adminGlobalEmailSource.includes(token),
        true,
        `AdminGlobalEmail debe conservar configuracion email SaaS: ${token}`,
    );
}

for (const method of [
    'getEmailSettings',
    'setEmailSettings',
    'testEmailSettings',
]) {
    assert.match(
        adminConfigApiSource,
        new RegExp(`\\b${method}\\s*\\(`),
        `adminConfigApi debe exponer ${method}`,
    );
}

for (const endpoint of [
    "'/admin-config/email-settings'",
    "'/admin-config/email-settings/test'",
]) {
    assert.equal(
        adminConfigApiSource.includes(endpoint),
        true,
        `adminConfigApi debe conservar endpoint: ${endpoint}`,
    );
}

assert.match(
    adminGlobalSource,
    /id:\s*'email-corporativo'[\s\S]*?title:\s*'Email corporativo'[\s\S]*?href:\s*'\/admin-global\/email-corporativo'/,
    'AdminGlobal debe mostrar la entrada Email corporativo apuntando a /admin-global/email-corporativo',
);

assert.match(
    adminGlobalSource,
    /id:\s*'superadmins'[\s\S]*?title:\s*'Superadministradores'[\s\S]*?href:\s*'\/admin-global\/superadministradores'/,
    'AdminGlobal debe conservar Superadministradores como submodulo SaaS propio, sin mezclarlo con Email corporativo',
);

assert.equal(
    routerSource.includes("const AdminGlobalEmail = lazyWithChunkRecovery(() => import('../pages/AdminGlobalEmail'));"),
    true,
    'AppRouter debe cargar AdminGlobalEmail como submodulo SaaS',
);

assert.equal(
    routerSource.includes('path="/admin-global/email-corporativo"'),
    true,
    'AppRouter debe exponer /admin-global/email-corporativo',
);

assert.equal(
    /api\.(get|post|put|patch|delete)\(['"`]\/admin-config\/email-settings/.test(adminGlobalEmailSource),
    false,
    'AdminGlobalEmail debe usar adminConfigApi y no llamadas directas a /admin-config/email-settings',
);

assert.equal(
    adminGlobalEmailSource.includes("bg-[#1A1A1A]"),
    false,
    'AdminGlobalEmail no debe reintroducir la card oscura informativa de Gmail',
);

console.log('smoke-classic-admin-config-email-boundary: ok');
