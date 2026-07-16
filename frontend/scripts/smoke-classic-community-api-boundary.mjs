import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const communitySource = readFileSync(new URL('../src/pages/Community.jsx', import.meta.url), 'utf8');
const communityApiSource = readFileSync(new URL('../src/api/community.js', import.meta.url), 'utf8');
const maestrosApiSource = readFileSync(new URL('../src/api/maestros.js', import.meta.url), 'utf8');
const usuariosApiSource = readFileSync(new URL('../src/api/usuarios.js', import.meta.url), 'utf8');

assert.equal(
    communitySource.includes("from '../api/axiosConfig'"),
    false,
    'Community no debe importar axiosConfig directamente en MODO 1',
);

for (const importStatement of [
    "import { communityApi } from '../api/community';",
    "import { maestrosApi } from '../api/maestros';",
    "import { usuariosApi } from '../api/usuarios';",
]) {
    assert.equal(
        communitySource.includes(importStatement),
        true,
        `Community debe conservar cliente API: ${importStatement}`,
    );
}

assert.equal(
    communitySource.includes('const empresaId = selectedEmpresa?.id || user?.empresa_id || null;'),
    true,
    'Community debe conservar resolucion de empresa activa desde selectedEmpresa/user',
);

for (const token of [
    'communityApi.getBootstrap(empresaId)',
    "communityApi.getCategories('publico', empresaId)",
    "communityApi.getCategories('interno_empresa', empresaId)",
    "communityApi.getTopics('publico', empresaId)",
    "communityApi.getTopics('interno_empresa', empresaId)",
    "communityApi.getPosts('publico', empresaId, DEFAULT_FEED_ORDER)",
    "communityApi.getPosts('interno_empresa', empresaId, DEFAULT_FEED_ORDER)",
    'communityApi.getDmThreads(empresaId)',
    'communityApi.getVisibleUsers(empresaId)',
    'communityApi.getSanctions(empresaId)',
    'communityApi.getSanctionAppeals(empresaId)',
    'communityApi.getAdminUsers(empresaId)',
    'communityApi.getAdminAlerts(empresaId)',
    'communityApi.getInfractions(empresaId)',
    'maestrosApi.getPaises()',
    'usuariosApi.create({',
    'communityApi.createPost(',
    'communityApi.uploadPostAttachment(createdPost.id, file, empresaId)',
    'communityApi.createReply(post.id, { body }, empresaId)',
    'communityApi.uploadReplyAttachment(createdReply.id, file, empresaId)',
    'communityApi.deletePostAttachment(attachment.id, empresaId)',
    'communityApi.deleteReplyAttachment(attachment.id, empresaId)',
    'communityApi.moderateAttachment(attachment.id, empresaId)',
    'communityApi.moderatePost(post.id, action, empresaId)',
    'communityApi.sendDmMessage({',
    'communityApi.blockDmThread(selectedThread.id, empresaId)',
    'communityApi.unblockDmThread(selectedThread.id, empresaId)',
    'communityApi.createSanction({',
    'communityApi.createSanctionAppeal({ sanction_id: sanctionId, reason }, empresaId)',
    'communityApi.resolveSanctionAppeal(appealId, { status, resolution_note: resolutionNote }, empresaId)',
]) {
    assert.equal(
        communitySource.includes(token),
        true,
        `Community debe conservar uso critico de API: ${token}`,
    );
}

for (const method of [
    'getBootstrap',
    'getPosts',
    'getPostsByTopic',
    'createPost',
    'updatePost',
    'deletePost',
    'getPostReplies',
    'createReply',
    'updateReply',
    'deleteReply',
    'uploadPostAttachment',
    'deletePostAttachment',
    'uploadReplyAttachment',
    'deleteReplyAttachment',
    'moderateAttachment',
    'getTopics',
    'getCategories',
    'createCategory',
    'updateCategory',
    'createTopic',
    'updateTopic',
    'followTopic',
    'unfollowTopic',
    'getDmThreads',
    'getDmThreadMessages',
    'getVisibleUsers',
    'getAdminUsers',
    'sendDmMessage',
    'blockDmThread',
    'unblockDmThread',
    'moderatePost',
    'getSanctions',
    'createSanction',
    'getSanctionAppeals',
    'createSanctionAppeal',
    'resolveSanctionAppeal',
    'getInfractions',
    'getAdminAlerts',
    'markAdminAlertRead',
    'markAllAdminAlertsRead',
]) {
    assert.match(
        communityApiSource,
        new RegExp(`\\b${method}\\s*:`),
        `communityApi debe exponer ${method}`,
    );
}

for (const endpoint of [
    "'/community/bootstrap'",
    "'/community/posts'",
    "'/community/topics'",
    "'/community/categories'",
    "'/community/dm/threads'",
    "'/community/dm/messages'",
    "'/community/sanctions'",
    "'/community/sanction-appeals'",
    "'/community/infractions'",
    "'/community/admin-alerts'",
]) {
    assert.equal(
        communityApiSource.includes(endpoint),
        true,
        `communityApi debe conservar endpoint: ${endpoint}`,
    );
}

assert.match(
    communityApiSource,
    /uploadPostAttachment\s*:[\s\S]*formData\.append\('file',\s*file\)[\s\S]*multipart\/form-data/,
    'communityApi.uploadPostAttachment debe conservar envio multipart del archivo',
);

assert.match(
    communityApiSource,
    /uploadReplyAttachment\s*:[\s\S]*formData\.append\('file',\s*file\)[\s\S]*multipart\/form-data/,
    'communityApi.uploadReplyAttachment debe conservar envio multipart del archivo',
);

assert.match(
    usuariosApiSource,
    /create\s*:\s*async\s*\(payload,\s*params\s*=\s*\{\}\)\s*=>[\s\S]*withTenantParams\(params\)/,
    'usuariosApi.create debe conservar params tenant para alta de usuario Comunidad',
);

assert.match(
    maestrosApiSource,
    /getPaises\s*:[\s\S]*withoutTenant\(\)/,
    'maestrosApi.getPaises debe conservar lectura tenantless de paises',
);

console.log('smoke-classic-community-api-boundary: ok');
