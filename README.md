# MoneyMap website

Static site for MoneyMap: Home, Privacy Policy, Account Deletion, Contact, 404. No backend, no runtime dependencies (Node 20+ only for the build). Hosted on GitHub Pages.

## Layout

```
site.config.json        name, developer, support e-mail, Google Play URL, policy date
build.mjs               src/pages/** + src/layout.html + src/partials -> dist/
src/pages/              index.html, privacy/index.html, delete-account/index.html, contact/index.html, 404.html
src/assets/             css, js (delete-account.js), img, vendor/supabase-2.118.0.js
scripts/                serve.mjs (preview), check-links.mjs
.github/workflows/pages.yml
```

Each page is a fragment with front matter (`title`, `description`, `nav`, optional `script`, `robots`). Add a page by creating `src/pages/<name>/index.html` and adding it to `NAV` in `build.mjs`. All links are relative, so the site works at a domain root, under `/repo-name/`, or from `file://`.

## Local preview

```bash
cp .env.example .env     # fill SUPABASE_URL and SUPABASE_ANON_KEY (public anon key only)
npm run preview          # builds, then serves http://localhost:4173/
```

`npm run check` builds and verifies local links.

## Account-deletion page

`assets/js/delete-account.js` signs the user in to the app's Supabase project (e-mail one-time code, no account creation, or Google) and calls the app's existing `delete_my_account()` function, which deletes the caller from `auth.users` and cascades to backups, entitlements and workspaces. Only the public URL and anon key are used; never add the service-role key. The build refuses a `service_role` key.

## Play Console cheat-sheet

- Privacy policy URL: `<site>/privacy/`
- Account deletion URL (Data safety > Data deletion): `<site>/delete-account/`
- Data types, per the policy: e-mail address (optional account); financial info and app activity (cloud backup and sync, paid plans, only if signed in); device ID (random install ID with sync). Verify against the final release.
