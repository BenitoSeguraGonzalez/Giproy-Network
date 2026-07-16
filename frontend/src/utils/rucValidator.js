/**
 * rucValidator.js
 * Prevalidación de formato. La autoridad final es el catálogo oficial importado:
 * un registro oficial de 13 dígitos no se rechaza por algoritmos locales incompletos.
 */

/**
 * Valida la estructura de un RUC ecuatoriano (persona natural o jurídica).
 * @param {string} ruc - El RUC a validar
 * @returns {{ valido: boolean, mensaje: string }}
 */
export function validarRucEcuador(ruc) {
  if (!ruc) {
    return { valido: false, mensaje: 'El RUC es obligatorio.' };
  }

  const cleaned = String(ruc).replace(/\s/g, '');

  if (!/^\d{13}$/.test(cleaned)) {
    return { valido: false, mensaje: 'El RUC debe contener exactamente 13 dígitos.' };
  }

  return { valido: true, mensaje: '' };
}

/**
 * Determina si debe aplicarse validación rigurosa de RUC
 * basada en estructura ecuatoriana.
 * @param {string} pais
 * @returns {boolean}
 */
export function requiereValidacionRucEcuador(pais) {
  return String(pais ?? '').toLowerCase() === 'ecuador';
}
