import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [styles, router, dashboard, precios] = await Promise.all([
  readFile(new URL('../src/index.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/routes/AppRouter.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/Dashboard.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/PreciosUnitarios.jsx', import.meta.url), 'utf8'),
]);

assert.match(styles, /:focus-visible\s*\{/u, 'Debe existir una señal global de foco visible');
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/u, 'Debe respetarse movimiento reducido');
assert.match(styles, /--motion-fast:\s*120ms/u, 'El feedback reducido no debe desaparecer');

assert.match(router, /role="status"/u, 'El fallback de rutas debe anunciar su estado');
assert.match(router, /aria-live="polite"/u, 'El fallback de rutas debe ser accesible');
assert.match(router, /text-xs/u, 'El texto de carga debe conservar legibilidad mínima');

assert.match(dashboard, /useReducedMotion\(\)/u, 'Dashboard debe adaptar su motion');
assert.match(dashboard, /h-11 w-12/u, 'Los indicadores deben conservar objetivo táctil');
assert.doesNotMatch(dashboard, /whileHover=\{\{ y: -8 \}\}/u, 'No debe regresar el salto excesivo de tarjetas');

assert.doesNotMatch(precios, /hover:scale-105/u, 'El estado técnico no debe deformarse al pasar el cursor');
assert.match(precios, /text-\[10px\][^\n]*Base Técnica Activa|Base Técnica Activa[\s\S]*text-\[10px\]/u, 'La base activa debe mantener texto legible');

console.log('OK: guardas de calidad visual y accesibilidad del frontend clásico');
