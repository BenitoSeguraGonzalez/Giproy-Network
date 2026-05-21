import api from './axiosConfig';

export const communityApi = {
    getBootstrap: async (empresaId = null) => {
        const response = await api.get('/community/bootstrap', { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    getPosts: async (scope, empresaId = null, order = 'recent_activity') => {
        const response = await api.get('/community/posts', { params: { scope, order, ...(empresaId ? { empresa_id: empresaId } : {}) } });
        return response.data;
    },
    getPostsByTopic: async (scope, topicId, empresaId = null, order = 'recent_activity') => {
        const response = await api.get('/community/posts', { params: { scope, topic_id: topicId, order, ...(empresaId ? { empresa_id: empresaId } : {}) } });
        return response.data;
    },
    createPost: async (payload, empresaId = null) => {
        const response = await api.post('/community/posts', payload, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    updatePost: async (postId, payload, empresaId = null) => {
        const response = await api.put(`/community/posts/${postId}`, payload, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    deletePost: async (postId, empresaId = null) => {
        const response = await api.delete(`/community/posts/${postId}`, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    getPostReplies: async (postId, empresaId = null) => {
        const response = await api.get(`/community/posts/${postId}/replies`, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    createReply: async (postId, payload, empresaId = null) => {
        const response = await api.post(`/community/posts/${postId}/replies`, payload, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    uploadPostAttachment: async (postId, file, empresaId = null) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/community/posts/${postId}/attachments`, formData, {
            params: empresaId ? { empresa_id: empresaId } : {},
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    deletePostAttachment: async (attachmentId, empresaId = null) => {
        const response = await api.delete(`/community/attachments/${attachmentId}/post`, {
            params: empresaId ? { empresa_id: empresaId } : {},
        });
        return response.data;
    },
    updateReply: async (replyId, payload, empresaId = null) => {
        const response = await api.put(`/community/replies/${replyId}`, payload, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    deleteReply: async (replyId, empresaId = null) => {
        const response = await api.delete(`/community/replies/${replyId}`, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    uploadReplyAttachment: async (replyId, file, empresaId = null) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/community/replies/${replyId}/attachments`, formData, {
            params: empresaId ? { empresa_id: empresaId } : {},
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    deleteReplyAttachment: async (attachmentId, empresaId = null) => {
        const response = await api.delete(`/community/attachments/${attachmentId}/reply`, {
            params: empresaId ? { empresa_id: empresaId } : {},
        });
        return response.data;
    },
    moderateAttachment: async (attachmentId, empresaId = null) => {
        const response = await api.delete(`/community/attachments/${attachmentId}/moderate`, {
            params: empresaId ? { empresa_id: empresaId } : {},
        });
        return response.data;
    },
    getTopics: async (scope, empresaId = null) => {
        const response = await api.get('/community/topics', { params: { scope, ...(empresaId ? { empresa_id: empresaId } : {}) } });
        return response.data;
    },
    getCategories: async (scope, empresaId = null) => {
        const response = await api.get('/community/categories', { params: { scope, ...(empresaId ? { empresa_id: empresaId } : {}) } });
        return response.data;
    },
    createCategory: async (payload, empresaId = null) => {
        const response = await api.post('/community/categories', payload, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    updateCategory: async (categoryId, payload, empresaId = null) => {
        const response = await api.put(`/community/categories/${categoryId}`, payload, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    createTopic: async (payload, empresaId = null) => {
        const response = await api.post('/community/topics', payload, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    followTopic: async (topicId, empresaId = null) => {
        const response = await api.post(`/community/topics/${topicId}/follow`, {}, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    unfollowTopic: async (topicId, empresaId = null) => {
        const response = await api.delete(`/community/topics/${topicId}/follow`, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    updateTopic: async (topicId, payload, empresaId = null) => {
        const response = await api.put(`/community/topics/${topicId}`, payload, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    getDmThreads: async (empresaId = null) => {
        const response = await api.get('/community/dm/threads', { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    getDmThreadMessages: async (threadId, empresaId = null) => {
        const response = await api.get(`/community/dm/threads/${threadId}/messages`, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    getVisibleUsers: async (empresaId = null, q = '') => {
        const response = await api.get('/community/users', { params: { ...(empresaId ? { empresa_id: empresaId } : {}), ...(q ? { q } : {}) } });
        return response.data;
    },
    getAdminUsers: async (empresaId = null, q = '') => {
        const response = await api.get('/community/admin/users', { params: { ...(empresaId ? { empresa_id: empresaId } : {}), ...(q ? { q } : {}) } });
        return response.data;
    },
    sendDmMessage: async (payload, empresaId = null) => {
        const response = await api.post('/community/dm/messages', payload, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    blockDmThread: async (threadId, empresaId = null) => {
        const response = await api.post(`/community/dm/threads/${threadId}/block`, {}, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    unblockDmThread: async (threadId, empresaId = null) => {
        const response = await api.post(`/community/dm/threads/${threadId}/unblock`, {}, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    moderatePost: async (postId, action, empresaId = null) => {
        const response = await api.post(`/community/posts/${postId}/moderate`, { action }, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    getSanctions: async (empresaId = null) => {
        const response = await api.get('/community/sanctions', { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    createSanction: async (payload, empresaId = null) => {
        const response = await api.post('/community/sanctions', payload, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    getSanctionAppeals: async (empresaId = null) => {
        const response = await api.get('/community/sanction-appeals', { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    createSanctionAppeal: async (payload, empresaId = null) => {
        const response = await api.post('/community/sanction-appeals', payload, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    resolveSanctionAppeal: async (appealId, payload, empresaId = null) => {
        const response = await api.post(`/community/sanction-appeals/${appealId}/resolve`, payload, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    getInfractions: async (empresaId = null) => {
        const response = await api.get('/community/infractions', { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    getAdminAlerts: async (empresaId = null) => {
        const response = await api.get('/community/admin-alerts', { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    markAdminAlertRead: async (alertId, empresaId = null) => {
        const response = await api.post(`/community/admin-alerts/${alertId}/read`, {}, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
    markAllAdminAlertsRead: async (empresaId = null) => {
        const response = await api.post('/community/admin-alerts/mark-all-read', {}, { params: empresaId ? { empresa_id: empresaId } : {} });
        return response.data;
    },
};
