import api from './axiosConfig';

export const companyBackupsApi = {
    getContract: async () => {
        const response = await api.get('/company-backups/contract');
        return response.data;
    },

    preflightExport: async ({ empresa_id = null, dry_run = true } = {}) => {
        const response = await api.post('/company-backups/preflight/export', {
            empresa_id,
            dry_run,
        });
        return response.data;
    },

    preflightOffboarding: async ({ empresa_id }) => {
        const response = await api.post('/company-backups/saas/offboarding/preflight', {
            empresa_id,
            dry_run: true,
        });
        return response.data;
    },

    exportBackup: async ({ empresa_id = null } = {}) => {
        const response = await api.post('/company-backups/export', {
            empresa_id,
            dry_run: false,
        }, {
            responseType: 'blob',
        });
        return {
            blob: response.data,
            filename: response.headers?.['content-disposition']?.match(/filename="?([^"]+)"?/i)?.[1] || 'giproy_empresa.giproybackup',
            backupHash: response.headers?.['x-giproy-backup-hash'] || '',
            operationId: response.headers?.['x-giproy-backup-operation-id'] || '',
        };
    },

    preflightRestore: async ({ empresa_id = null, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (empresa_id) {
            formData.append('empresa_id', String(empresa_id));
        }
        const response = await api.post('/company-backups/preflight/restore', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    prepareInternalSafetyBackup: async ({ empresa_id = null, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (empresa_id) {
            formData.append('empresa_id', String(empresa_id));
        }
        const response = await api.post('/company-backups/restore/prepare-internal-safety-backup', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    executeRestore: async ({
        empresa_id = null,
        file,
        internal_artifact_id = null,
        confirm_phrase,
    }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (internal_artifact_id) {
            formData.append('internal_artifact_id', String(internal_artifact_id));
        }
        formData.append('confirm_phrase', confirm_phrase);
        if (empresa_id) {
            formData.append('empresa_id', String(empresa_id));
        }
        const response = await api.post('/company-backups/restore/execute', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    executeOffboarding: async ({
        empresa_id,
        file,
        confirm_phrase,
    }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('empresa_id', String(empresa_id));
        formData.append('confirm_phrase', confirm_phrase);
        const response = await api.post('/company-backups/saas/offboarding/execute', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    executeInternalArtifactRestore: async ({
        empresa_id = null,
        internal_artifact_id,
        confirm_phrase,
    }) => {
        const formData = new FormData();
        formData.append('internal_artifact_id', String(internal_artifact_id));
        formData.append('confirm_phrase', confirm_phrase);
        if (empresa_id) {
            formData.append('empresa_id', String(empresa_id));
        }
        const response = await api.post('/company-backups/restore/internal-artifact/execute', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    listInternalArtifacts: async ({ empresa_id = null } = {}) => {
        const params = {};
        if (empresa_id) {
            params.empresa_id = empresa_id;
        }
        const response = await api.get('/company-backups/internal-artifacts', { params });
        return response.data;
    },

    listCrossCompanyRestoreAttempts: async ({ limit = 200 } = {}) => {
        const response = await api.get('/company-backups/restore/cross-company-attempts', {
            params: { limit },
        });
        return response.data;
    },
};

export default companyBackupsApi;
