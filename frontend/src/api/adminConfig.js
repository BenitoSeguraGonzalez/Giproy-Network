import api from './axiosConfig';

export const adminConfigApi = {
  async list() {
    const { data } = await api.get('/admin-config');
    return data;
  },

  async update(clave, valor, descripcion = '') {
    const { data } = await api.put(`/admin-config/${clave}`, { valor, descripcion });
    return data;
  },

  async getEmailSettings() {
    const { data } = await api.get('/admin-config/email-settings');
    return data;
  },

  async setEmailSettings(values) {
    const { data } = await api.put('/admin-config/email-settings', { values });
    return data;
  },

  async testEmailSettings(toEmail) {
    const { data } = await api.post('/admin-config/email-settings/test', { to_email: toEmail });
    return data;
  },
};
