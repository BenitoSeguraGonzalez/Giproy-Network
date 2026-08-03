import { spawnSync } from 'node:child_process';

for (const profile of ['desktop', 'tablet-landscape', 'tablet-portrait']) {
  const result = spawnSync(process.execPath, ['scripts/validate-formula-responsive-dom.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      FORMULA_VIEWPORT: profile === 'desktop' ? '' : profile,
    },
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    throw new Error(`validate-formula-adaptive-matrix: fallo ${profile}`);
  }
  const marker = result.stdout.split(/\r?\n/).find((line) => line.startsWith('formula-responsive-dom='));
  console.log(`${profile}: ${marker || 'sin resultado'}`);
}

console.log('validate-formula-adaptive-matrix: ok');
