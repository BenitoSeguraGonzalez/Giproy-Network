import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { globSync } from 'node:fs';

const packageLock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
assert.equal(packageLock.packages['node_modules/axios']?.version, '1.18.1', 'Axios debe conservar la version corregida');
assert.equal(packageLock.packages['node_modules/form-data']?.version, '4.0.6', 'form-data debe conservar la version corregida');
assert.equal(packageLock.packages['node_modules/react-router-dom']?.version, '7.18.1', 'React Router DOM debe conservar la ultima version SPA validada');

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
