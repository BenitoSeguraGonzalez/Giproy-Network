import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const settingsSource = readFileSync(new URL('../src/pages/Settings.jsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../src/api/companyBackups.js', import.meta.url), 'utf8');

assert.equal(
    settingsSource.includes("from '../api/axiosConfig'"),
    false,
    'Settings no debe importar axiosConfig directamente en MODO 1',
);

assert.equal(
    settingsSource.includes("import { companyBackupsApi } from '../api/companyBackups';"),
    true,
    'Settings debe consumir companyBackupsApi para backup/restauracion de empresa',
);

assert.equal(
    settingsSource.includes('loadCompanyBackupPreflight'),
    true,
    'Settings debe exponer un preflight no destructivo para copia 1:1',
);

assert.equal(
    settingsSource.includes('Backup Empresa / Restore Empresa'),
    true,
    'El panel debe separar claramente Backup Empresa y Restore Empresa',
);

assert.equal(
    settingsSource.includes('handleCompanyBackupExport'),
    true,
    'Settings debe exponer accion no destructiva para generar backup cifrado',
);

assert.equal(
    settingsSource.includes('Backup Empresa'),
    true,
    'Settings debe mostrar accion y menu de Backup Empresa',
);

assert.equal(
    settingsSource.includes('handleCompanyBackupRestorePreflight'),
    true,
    'Settings debe exponer preflight no destructivo de restauracion',
);

assert.equal(
    settingsSource.includes('Validar copia'),
    true,
    'Settings debe permitir validar un .giproybackup sin restaurar',
);

assert.equal(
    settingsSource.includes('No restaura ni borra datos.'),
    true,
    'El preflight de restauracion debe comunicar ausencia de borrado',
);

assert.equal(
    settingsSource.includes('Restore Empresa'),
    true,
    'Settings debe mostrar zona diferenciada de Restore Empresa',
);

assert.equal(
    settingsSource.includes('Preparar copia interna'),
    false,
    'Settings no debe exponer preparacion manual de copia interna previa',
);

assert.equal(
    settingsSource.includes('Copias automaticas internas'),
    true,
    'Settings debe listar copias automaticas internas para superadmin',
);

assert.equal(
    settingsSource.includes('handleCompanyBackupExecuteRestore'),
    true,
    'Settings debe exponer la ejecucion destructiva solo tras confirmacion final',
);

assert.equal(
    settingsSource.includes('Triple confirmacion destructiva'),
    false,
    'Settings no debe reintroducir triple confirmacion destructiva',
);

assert.equal(
    settingsSource.includes('BORRAR DATOS ACTUALES'),
    false,
    'Settings no debe exigir confirmaciones intermedias de borrado',
);

assert.equal(
    settingsSource.includes('CONFIRMO IMPORTACION'),
    true,
    'Settings debe exigir la frase final compacta de Restore Empresa',
);

assert.equal(
    settingsSource.includes('Ejecutar Restore Empresa'),
    true,
    'Settings debe mostrar la accion destructiva final protegida',
);

assert.equal(
    settingsSource.includes('Intentos bloqueados entre empresas'),
    true,
    'Settings debe mostrar auditoria superadmin de intentos bloqueados entre empresas',
);

assert.equal(
    settingsSource.includes('listCrossCompanyRestoreAttempts'),
    true,
    'Settings debe consumir el listado superadmin de intentos cross-company',
);

assert.equal(
    settingsSource.includes('handleCompanyBackupExecuteInternalRestore'),
    true,
    'Settings debe permitir restaurar copias automaticas internas desde menu superadmin',
);

assert.equal(
    settingsSource.includes('Restaurar copia interna #'),
    true,
    'Settings debe mostrar contexto identificable antes de restaurar una copia interna',
);

assert.equal(
    settingsSource.includes('Ejecutar restauracion interna'),
    true,
    'Settings debe mostrar accion final para restauracion interna protegida',
);

assert.equal(
    apiSource.includes("import api from './axiosConfig';"),
    true,
    'El cliente de dominio companyBackups debe ser el unico punto que importa axiosConfig',
);

assert.equal(
    apiSource.includes("'/company-backups/contract'"),
    true,
    'companyBackupsApi debe exponer el contrato backend',
);

assert.equal(
    apiSource.includes("'/company-backups/preflight/export'"),
    true,
    'companyBackupsApi debe exponer el preflight de exportacion',
);

assert.equal(
    apiSource.includes("'/company-backups/export'"),
    true,
    'companyBackupsApi debe exponer la exportacion cifrada',
);

assert.equal(
    apiSource.includes("responseType: 'blob'"),
    true,
    'La exportacion cifrada debe descargarse como blob',
);

assert.equal(
    apiSource.includes("'/company-backups/preflight/restore'"),
    true,
    'companyBackupsApi debe exponer el preflight de restauracion',
);

assert.equal(
    apiSource.includes("'/company-backups/restore/prepare-internal-safety-backup'"),
    true,
    'companyBackupsApi debe exponer la preparacion de copia automatica interna',
);

assert.equal(
    apiSource.includes("'/company-backups/restore/execute'"),
    true,
    'companyBackupsApi debe exponer la ejecucion de restauracion destructiva protegida',
);

assert.equal(
    apiSource.includes("'/company-backups/restore/internal-artifact/execute'"),
    true,
    'companyBackupsApi debe exponer restauracion directa desde artefacto interno',
);

assert.equal(
    apiSource.includes("'/company-backups/internal-artifacts'"),
    true,
    'companyBackupsApi debe exponer el listado de copias automaticas internas',
);

assert.equal(
    apiSource.includes("'/company-backups/restore/cross-company-attempts'"),
    true,
    'companyBackupsApi debe exponer auditoria de intentos cross-company',
);

assert.equal(
    apiSource.includes('new FormData()'),
    true,
    'El preflight de restauracion debe subir el archivo como multipart',
);

console.log('smoke-classic-company-backup-settings: ok');
