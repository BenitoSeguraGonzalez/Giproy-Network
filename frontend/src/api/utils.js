import api from './axiosConfig';
import { withoutTenant } from './tenant';

export const utilsApi = {
    spellcheck: (text) => api.post('/utils/spellcheck', { text }, withoutTenant()),
};

export default utilsApi;
