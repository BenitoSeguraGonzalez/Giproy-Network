import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { globSync } from 'node:fs';

const packageLock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const nginxConfig = readFileSync(new URL('../nginx.conf', import.meta.url), 'utf8');
const viteConfig = readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8');
const composeConfig = readFileSync(new URL('../../deploy/docker-compose.beta.yml', import.meta.url), 'utf8');
const deployScript = readFileSync(new URL('../../deploy/scripts/giproy-beta-deploy.sh', import.meta.url), 'utf8');
assert.match(packageJson.version, /^\d+\.\d+\.\d+(?:[+-][0-9A-Za-z.-]+)?$/, 'La aplicacion debe declarar una version SemVer');
assert.equal(packageLock.version, packageJson.version, 'package-lock debe compartir la version de aplicacion');
assert.equal(packageLock.packages['']?.version, packageJson.version, 'el paquete raiz del lock debe compartir la version');
assert.equal(packageLock.packages['node_modules/axios']?.version, '1.18.1', 'Axios debe conservar la version corregida');
assert.equal(packageLock.packages['node_modules/form-data']?.version, '4.0.6', 'form-data debe conservar la version corregida');
assert.equal(packageLock.packages['node_modules/react-router-dom']?.version, '7.18.1', 'React Router DOM debe conservar la ultima version SPA validada');
assert.match(nginxConfig, /location = \/index\.html[\s\S]*no-store, no-cache, must-revalidate/, 'El indice SPA no debe quedar obsoleto en tablet tras un deploy');
assert.match(nginxConfig, /location \^~ \/assets\/[\s\S]*max-age=31536000, immutable/, 'Los assets con hash deben conservar cache inmutable');
assert.match(nginxConfig, /location = \/version\.json[\s\S]*no-store/, 'El manifiesto de version no debe almacenarse en cache');
assert.match(viteConfig, /fileName: "version\.json"/, 'El build debe emitir un manifiesto de version');
assert.match(composeConfig, /VITE_APP_VERSION: \$\{GIPROY_APP_VERSION:\?/, 'Compose debe exigir la version de release');
assert.match(deployScript, /Refusing deploy:[\s\S]*already active/, 'El deploy debe impedir reutilizar una version activa');

const sourceFiles = globSync('src/**/*.{js,jsx}', { cwd: new URL('..', import.meta.url), exclude: ['**/node_modules/**'] });
const rscTokens = ['unstable_RSC', 'RSCStaticRouter', 'createCallServer', 'decodeReply', 'react-server-dom'];
for (const relativePath of sourceFiles) {
  const source = readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
  for (const token of rscTokens) assert.equal(source.includes(token), false, `${relativePath}: GiProy SPA no debe incorporar superficie RSC (${token})`);
}

const audit = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['audit', '--omit=dev', '--json'], { cwd: new URL('..', import.meta.url), encoding: 'utf8', windowsHide: true });
const report = JSON.parse(audit.stdout || '{}');
const vulnerabilities = Object.values(report.vulnerabilities || {});
for (const vulnerability of vulnerabilities) {
  const advisories = (vulnerability.via || []).filter((item) => typeof item === 'object');
  assert.ok(advisories.length > 0, `${vulnerability.name}: vulnerabilidad de produccion sin advisory inspeccionable`);
  for (const advisory of advisories) {
    assert.equal(advisory.url, 'https://github.com/advisories/GHSA-qwww-vcr4-c8h2', `${vulnerability.name}: advisory de produccion no autorizado: ${advisory.url}`);
  }
}
assert.ok(vulnerabilities.every((item) => ['react-router', 'react-router-dom'].includes(item.name)), 'Solo se admite el advisory RSC no aplicable a la SPA');

console.log('smoke-deployment-security-boundaries: ok (Axios/form-data corregidos; unico advisory RSC sin superficie en GiProy SPA)');
