/**
 * @typedef {import('./schema').components['schemas']} Schemas
 * @typedef {import('./schema').paths} Paths
 */

import api from './axiosConfig';

/**
 * Type helper to access Schemas easily in JSDoc
 * Usage: @type {import('./api-client').Schemas['APUResponse']}
 */
export const client = api;

export default api;
