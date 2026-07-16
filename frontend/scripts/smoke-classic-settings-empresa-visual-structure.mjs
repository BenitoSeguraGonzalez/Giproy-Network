import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const settingsSource = readFileSync(new URL('../src/pages/Settings.jsx', import.meta.url), 'utf8');

assert.equal(
    settingsSource.includes("from '../api/axiosConfig'"),
    false,
    'Settings no debe importar axiosConfig directamente en MODO 1',
);

assert.equal(
    settingsSource.includes('COMPANY_SETTINGS_ZONES'),
    true,
    'Settings empresa debe declarar zonas visuales internas para evitar listados interminables',
);

assert.equal(
    settingsSource.includes('Ajustes <span className="text-[#F39200]">Globales</span>'),
    false,
    'Settings empresa no debe presentarse como Ajustes Globales',
);

assert.equal(
    settingsSource.includes('Settings <span className="text-[#F39200]">Empresa</span>'),
    true,
    'Settings empresa debe presentarse como configuracion de empresa, no como control global',
);

assert.equal(
    settingsSource.includes("id: 'datos'"),
    true,
    'Mi Empresa debe mantener una zona Datos empresa',
);

assert.equal(
    settingsSource.includes("id: 'licencia'"),
    true,
    'Mi Empresa debe separar Licencia y SaaS en una zona propia',
);

assert.equal(
    settingsSource.includes('data-settings-company-tabs="mi-empresa"'),
    true,
    'Mi Empresa debe renderizar tabs internos por tipo de dato',
);

assert.equal(
    settingsSource.includes('data-settings-company-zone="datos-empresa"'),
    true,
    'Mi Empresa debe marcar el bloque de datos empresariales',
);

assert.equal(
    settingsSource.includes('data-settings-company-zone="licencia-conecta"'),
    true,
    'Mi Empresa debe marcar el bloque Licencia/SaaS como zona separada',
);

assert.equal(
    settingsSource.includes('data-settings-license-conecta-compact="true"'),
    true,
    'Licencia y SaaS debe conservar la variante visual compacta',
);

assert.equal(
    settingsSource.includes('data-settings-license-summary="compact"') &&
        settingsSource.includes('data-settings-license-actions="compact"') &&
        settingsSource.includes('data-settings-saas-rights="compact"'),
    true,
    'Licencia y SaaS debe separar resumen, acciones y derechos SaaS en bloques compactos',
);

assert.equal(
    settingsSource.includes("equipo: 'Equipo'") ||
        settingsSource.includes("mod_fusion: 'Fusion'") ||
        settingsSource.includes("mod_migracion: 'Migracion'"),
    false,
    'Licencia y SaaS no debe mostrar Equipo/Fusion/Migracion como derechos efectivos visibles',
);

assert.equal(
    settingsSource.includes('data-settings-conecta-panel="compact"') ||
        settingsSource.includes('Cupos usuario-usuario') ||
        settingsSource.includes("from '../api/conecta'") ||
        settingsSource.includes('handleCreateConectaInvite') ||
        settingsSource.includes('handleReleaseConectaSlot') ||
        settingsSource.includes('loadConectaState') ||
        settingsSource.includes('Los cupos Conecta se gestionan aparte') ||
        settingsSource.includes('Lectura de la licencia vigente'),
    false,
    'Settings Empresa no debe recuperar gestion operativa de cupos Conecta',
);

assert.equal(
    settingsSource.includes('USER_SETTINGS_ZONES'),
    true,
    'Usuarios debe declarar zonas visuales internas dentro de Settings empresa',
);

assert.equal(
    settingsSource.includes('data-settings-users-tenant-lock="true"'),
    true,
    'Usuarios debe bloquear la vista superadmin si no hay empresa activa seleccionada',
);

assert.equal(
    settingsSource.includes('if (isSuperAdmin && !selectedEmpresa?.id)'),
    true,
    'Usuarios debe impedir listados sin empresa activa para superadministradores',
);

assert.equal(
    settingsSource.includes('setUsuarios([]);') && settingsSource.includes('const params = empId ? { empresa_id: empId } : {};'),
    true,
    'Usuarios debe limpiar listado antes de construir params si superadmin no tiene empresa activa',
);

assert.equal(
    settingsSource.includes('data-settings-company-zone="usuarios-empresa"'),
    true,
    'Usuarios debe marcarse como zona de empresa, no como control global',
);

assert.equal(
    settingsSource.includes('data-settings-users-summary="empresa-activa"'),
    true,
    'Usuarios debe mostrar resumen compacto de la empresa activa',
);

assert.equal(
    settingsSource.includes('data-settings-users-tabs="empresa"'),
    true,
    'Usuarios debe ofrecer tabs internos por rol/estado',
);

assert.equal(
    settingsSource.includes('filteredCompanyUsers.length > 0 ? filteredCompanyUsers.map'),
    true,
    'La tabla de Usuarios debe usar el filtro visual interno activo',
);

assert.equal(
    settingsSource.includes('data-settings-company-zone="preferencias-empresa"'),
    true,
    'Preferencias debe quedar marcada como zona de empresa',
);

assert.equal(
    settingsSource.includes('Preferencias Empresa'),
    true,
    'Preferencias debe usar rotulo compacto y acotado a empresa',
);

assert.equal(
    settingsSource.includes('data-settings-company-zone="codigos-proyecto"'),
    true,
    'Configuracion de proyecto debe quedar marcada como zona de codigos de empresa',
);

assert.equal(
    settingsSource.includes('Códigos Proyecto'),
    true,
    'Configuracion de proyecto debe usar rotulo compacto',
);

assert.equal(
    settingsSource.includes('data-settings-company-zone="plantillas-informes"'),
    true,
    'Plantillas debe quedar marcada como zona visual propia',
);

assert.equal(
    settingsSource.includes('Plantillas</h2>'),
    true,
    'Plantillas debe usar rotulo principal compacto',
);

assert.equal(
    settingsSource.includes('data-settings-company-zone="backup-restore-empresa"'),
    true,
    'Backup/Restore debe quedar marcado como zona de empresa completa',
);

assert.equal(
    settingsSource.includes('data-settings-backup-tabs="empresa"'),
    true,
    'Backup/Restore debe conservar tabs internas diferenciadas',
);

assert.equal(
    settingsSource.includes('Validacion Restore'),
    true,
    'Restore Empresa debe usar rotulo compacto de validacion',
);

assert.equal(
    settingsSource.includes("activeTab === 'backup-empresa' ? renderCompanyBackupPanel()"),
    true,
    'Backup Empresa debe seguir como seccion principal independiente de Mi Empresa',
);

assert.equal(
    settingsSource.includes('Backup Empresa'),
    true,
    'Settings empresa debe conservar Backup Empresa',
);

assert.equal(
    settingsSource.includes('Restore Empresa'),
    true,
    'Settings empresa debe conservar Restore Empresa',
);

assert.equal(
    settingsSource.includes('CONFIRMO IMPORTACION'),
    true,
    'Restore Empresa debe conservar confirmacion final compacta',
);

assert.equal(
    settingsSource.includes('Intentos bloqueados entre empresas'),
    true,
    'Settings empresa debe conservar auditoria cross-company solo superadmin',
);

assert.equal(
    settingsSource.includes('BIM'),
    false,
    'Settings empresa no debe introducir referencias BIM',
);

console.log('smoke-classic-settings-empresa-visual-structure OK');
