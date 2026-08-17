import assert from 'node:assert/strict';
import {
  detectConnectionCountry,
  getRegistrationCountryPolicy,
  resolveDetectedCountry,
} from '../src/utils/registrationCountry.js';

const spain = { id: 34, nombre: 'España', codigo: 'ES' };
const ecuador = { id: 593, nombre: 'Ecuador', codigo: 'EC' };
const france = { id: 33, nombre: 'Francia', codigo: 'FR' };

assert.equal(getRegistrationCountryPolicy('España').mode, 'spain');
assert.equal(getRegistrationCountryPolicy('Ecuador').mode, 'ecuador');
assert.equal(getRegistrationCountryPolicy('Francia').mode, 'generic');
assert.equal(getRegistrationCountryPolicy('España').requiresCanton, false);
assert.equal(getRegistrationCountryPolicy('Ecuador').requiresCanton, true);

assert.equal(resolveDetectedCountry({ country_code: 'ES' }, [spain, ecuador]).nombre, 'España');
assert.equal(resolveDetectedCountry({ country: 'Ecuador' }, [spain, ecuador]).nombre, 'Ecuador');
assert.equal(resolveDetectedCountry({ country_code: 'FR' }, [spain, ecuador]), null);

const detected = await detectConnectionCountry({
  fetchImpl: async () => ({ ok: true, json: async () => ({ country_code: 'ES', country: 'Spain' }) }),
  timeoutMs: 100,
});
assert.equal(detected.country_code, 'ES');

const fallback = await detectConnectionCountry({
  fetchImpl: async () => { throw new Error('provider unavailable'); },
  timeoutMs: 100,
});
assert.equal(fallback, null);

console.log('registration-country-policy: PASS');
