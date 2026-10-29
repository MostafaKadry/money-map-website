# MoneyMap website

Static site for MoneyMap: Home, Privacy Policy, Account Deletion, Contact, 404. No backend, no runtime dependencies (Node 20+ only for the build). Hosted on GitHub Pages.

## Layout

```
site.config.json        name, developer, support e-mail, Google Play URL, policy date
build.mjs               src/pages/** + src/layout.html + src/partials -> dist/
src/pages/ar/           Arabic (default, served at the site root): index, privacy/, delete-account/, contact/, 404.html
src/pages/en/           English (served under /en/): same pages
src/partials/           shared/header.html, ar|en/footer.html
src/assets/             css, js (nav.js), img
scripts/                serve.mjs (preview), check-links.mjs
.github/workflows/pages.yml
```

Each page is a fragment with front matter (`title`, `description`, `nav`, optional `script`, `robots`). Arabic is the default language (RTL) and English lives under `/en/`; every page has a switch button to its counterpart. Add a page by creating it in both `src/pages/ar/` and `src/pages/en/` and adding it to `NAV` in `build.mjs` (labels are in `site.config.json`). Use `{{home}}` for links between pages and `{{assets}}` for files. All links are relative, so the site works at a domain root, under `/repo-name/`, or from `file://`.

## Local preview

```bash
npm run preview          # builds, then serves http://localhost:4173/
```

`npm run check` builds and verifies local links.


## Play Console cheat-sheet

- Privacy policy URL: `<site>/privacy/` (Arabic) or `<site>/en/privacy/`
- Account deletion URL (Data safety > Data deletion; describes the e-mail request and the in-app path): `<site>/delete-account/` or `<site>/en/delete-account/`
- Data types, per the policy: e-mail address (optional account); financial info and app activity (cloud backup and sync, paid plans, only if signed in); device ID (random install ID with sync). Verify against the final release.
