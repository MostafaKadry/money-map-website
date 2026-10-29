// Fails if a built page links to a local file or image that does not exist.  node scripts/check-links.mjs
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(fileURLToPath(new URL('..', import.meta.url)), 'dist');
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
let bad = 0;
for (const file of walk(dist).filter((f) => f.endsWith('.html'))) {
  if (file.endsWith('404.html')) continue; // uses the site base path, checked on the live site
  const html = readFileSync(file, 'utf8');
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|#|data:)/.test(url)) continue;
    const target = resolve(dirname(file), url.split('#')[0].split('?')[0]);
    const ok = existsSync(target) && (!statSync(target).isDirectory() || existsSync(join(target, 'index.html')));
    if (!ok) { console.error(`${file.replace(dist, '')}: broken link ${url}`); bad++; }
  }
}
if (bad) process.exit(1);
console.log('All local links resolve.');
