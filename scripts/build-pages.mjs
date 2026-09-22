import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'diagramador_logico';
const isUserSite = repo.endsWith('.github.io');
const fromEnv = process.env.BASE_HREF?.trim();
const baseHref = fromEnv || (isUserSite ? '/' : `/${repo}/`);

const build = spawnSync(
  'npx',
  ['ng', 'build', '--configuration', 'production', '--base-href', baseHref],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const candidates = ['dist/diagramador-logico/browser', 'dist/diagramador-logico'];
const dir = candidates.find((path) => existsSync(join(path, 'index.html')));

if (!dir) {
  console.error('No se encontró index.html del build de Angular.');
  process.exit(1);
}

copyFileSync(join(dir, 'index.html'), join(dir, '404.html'));
writeFileSync(join(dir, '.nojekyll'), '');
console.log(`GitHub Pages listo en ${dir} con base-href ${baseHref}`);
