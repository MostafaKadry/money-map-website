// Static site generator, no dependencies. Pages in src/pages/**/index.html (or 404.html) are
// wrapped in src/layout.html and written to dist/ with the same folder structure, so
// src/pages/privacy/index.html becomes /privacy/. Every link is relative, so the site works at
// the root of a domain, under a GitHub Pages project path, or from file://.
//   SITE_URL   absolute address of the site (enables canonical tags, sitemap.xml, social tags)
//   SITE_BASE  path prefix of the site, e.g. /money-map-website (only the 404 page needs it)
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const out = join(root, 'dist');

// A tiny .env loader (real environment variables win).
const envFile = join(root, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#') && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const site = JSON.parse(readFileSync(join(root, 'site.config.json'), 'utf8'));
const siteUrl = (process.env.SITE_URL ?? '').replace(/\/+$/, '');
const siteBase = (process.env.SITE_BASE ?? '').replace(/\/+$/, '');

const NAV = [
  { id: 'home', path: '' },
  { id: 'privacy', path: 'privacy/' },
  { id: 'delete-account', path: 'delete-account/' },
  { id: 'contact', path: 'contact/' },
];
const LANGS = Object.keys(site.langs);
const other = (l) => LANGS.find((x) => x !== l);
// Arabic (the default language) is served from the site root, other languages from /<lang>/.
const langDir = (l) => (l === site.defaultLang ? '' : `${l}/`);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (tpl, vars) =>
  tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`Unknown template variable {{${k}}}`);
    return vars[k];
  });

function parsePage(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('Page is missing its front matter');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2] };
}

function* pages(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* pages(p);
    else if (name.endsWith('.html')) yield p;
  }
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(src, 'assets'), join(out, 'assets'), { recursive: true });
writeFileSync(join(out, '.nojekyll'), '');

const layout = readFileSync(join(src, 'layout.html'), 'utf8');
const partial = (lang, name) => readFileSync(join(src, 'partials', lang, `${name}.html`), 'utf8');
const urls = [];
const hasPage = (lang, rel) => existsSync(join(src, 'pages', lang, rel));

for (const lang of LANGS) {
  const L = site.langs[lang];
  const pagesDir = join(src, 'pages', lang);
  for (const file of pages(pagesDir)) {
    const rel = relative(pagesDir, file).split('\\').join('/'); // privacy/index.html
    const { meta, body } = parsePage(readFileSync(file, 'utf8'));
    const is404 = rel === '404.html';
    const outRel = langDir(lang) + rel; // en/privacy/index.html
    const curDir = posix.dirname(outRel); // en/privacy
    const toRoot = curDir === '.' ? './' : '../'.repeat(curDir.split('/').length);
    const assets = is404 ? `${siteBase}/` : toRoot;
    const toDir = (target) => (posix.relative(curDir, target || '.') || '.') + '/';
    const home = is404 ? `${siteBase}/${langDir(lang)}` : toDir(langDir(lang).replace(/\/$/, ''));
    const pagePath = rel === 'index.html' || is404 ? '' : posix.dirname(rel) + '/';

    // The same page in the other language, for the switch button and hreflang.
    const ol = other(lang);
    const pairRel = is404 ? 'index.html' : rel;
    const hasPair = hasPage(ol, pairRel);
    const pairPath = hasPair ? langDir(ol) + (pairRel === 'index.html' ? '' : posix.dirname(pairRel) + '/') : langDir(ol);
    const switchHref = is404 ? `${siteBase}/${langDir(ol)}` : toDir(pairPath.replace(/\/$/, ''));

    const nav = NAV.map((n) => {
      const current = n.id === meta.nav ? ' aria-current="page"' : '';
      return `<li><a href="${home}${n.path}"${current}>${esc(L.nav[n.id])}</a></li>`;
    }).join('\n          ');

    const vars = {
      lang,
      dir: L.dir,
      home,
      assets,
      nav,
      'site.name': esc(L.name),
      'site.email': esc(site.email),
      'site.developer': esc(L.developer),
      'site.updated': esc(site.policyUpdated),
      'site.package': esc(site.androidPackage),
      'site.skip': esc(L.skip),
      'site.navLabel': esc(L.navLabel),
      'site.menu': esc(L.menu),
      'switch.label': esc(L.switchLabel),
      'switch.aria': esc(L.switchAria),
      'switch.lang': ol,
      'switch.href': switchHref,
      'site.play': site.playStoreUrl
        ? `<a class="btn btn-primary" href="${esc(site.playStoreUrl)}" rel="noopener">${esc(L.playCta)}</a>`
        : `<span class="btn btn-disabled" role="note">${esc(L.playSoon)}</span>`,
    };
    const content = fill(body, vars);
    const canonical = siteUrl && !is404 ? `${siteUrl}/${langDir(lang)}${pagePath}` : '';
    const title = meta.title.includes(L.name) ? meta.title : `${meta.title} – ${L.name}`;
    const alternates = siteUrl && !is404
      ? [lang, ...(hasPair ? [ol] : [])].map((l) => {
          const p = l === lang ? `${langDir(l)}${pagePath}` : pairPath;
          return `<link rel="alternate" hreflang="${l}" href="${esc(`${siteUrl}/${p}`)}">`;
        })
      : [];
    const head = [
      canonical && `<link rel="canonical" href="${esc(canonical)}">`,
      ...alternates,
      siteUrl && `<meta property="og:url" content="${esc(canonical || siteUrl + '/')}">`,
      siteUrl && `<meta property="og:image" content="${esc(siteUrl)}/assets/img/icon-512.png">`,
      meta.robots && `<meta name="robots" content="${esc(meta.robots)}">`,
      `<script src="${assets}assets/js/nav.js" defer></script>`,
    ]
      .filter(Boolean)
      .join('\n  ');

    const html = fill(layout, {
      ...vars,
      title: esc(title),
      description: esc(meta.description),
      locale: L.locale,
      head,
      header: fill(partial('shared', 'header'), vars),
      footer: fill(partial(lang, 'footer'), vars),
      content,
      bodyClass: esc(meta.nav ?? 'page'),
    });
    const dest = join(out, outRel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, html);
    if (!is404 && !meta.robots?.includes('noindex')) urls.push(canonical);
  }
}

if (siteUrl) {
  writeFileSync(
    join(out, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${esc(u)}</loc></url>`)
      .join('\n')}\n</urlset>\n`,
  );
  writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
}
console.log(`Built ${urls.length + 1} pages into dist/${siteUrl ? ` for ${siteUrl}` : ''}`);
