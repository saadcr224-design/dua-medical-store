# DUA Medical Store — Vercel and Netlify

This repository now builds a standard Next.js application using `npm run build` (`next build --webpack`). The production output is `.next`, including `routes-manifest.json`.

## Deploy

Connect this repository's `main` branch. Root directory must be the repository root, not `app`. Remove old dashboard build-command overrides that run Vinext/Vite, and clear the old build cache once.

- Vercel: Next.js framework; build `npm run build`; output `.next`. `vercel.json` supplies these settings.
- Netlify: build `npm run build`; publish `.next`; use the current automatic Next.js adapter. `netlify.toml` supplies the build, publish and Node settings. Remove any manually pinned legacy Next.js plugin or `NETLIFY_NEXT_PLUGIN_SKIP` override.
- Node: 22.x. Keep the committed pnpm lockfile and package manager version.

Connected hosting providers can build future pushes to main when automatic Git deployments are enabled in their dashboards. This repository does not configure those account settings.

## Shared backend and records

The frontend and same-origin API proxy run on Vercel/Netlify. Database operations, authentication, billing and formula lookup continue to run on the existing Sites backend:
https://dua-medical-store.saadcr224.chatgpt.site

Keep that backend online and public at the site level; its store APIs still require administrator authentication. Each domain needs its own sign-in; all use the same backend accounts and records. Offline data is local to each browser/domain. No production database records or credentials are copied into GitHub.

`DUA_BACKEND_URL` is an optional server environment variable for an intentional future backend move. It defaults to the URL above. It must be an HTTPS origin, never this frontend's own URL. Do not point it to another frontend proxy, which would create a loop.

The proxy validates browser write origins, forwards only the store session cookie, preserves backend authentication and host-only secure cookies, disables caching and rejects redirects. The backend remains responsible for authorization and transactions. Login rate limits are enforced by the backend; several visitors to a proxy may share its upstream IP bucket.

This is a shared-backend deployment, not an independent database migration. Original Cloudflare backend source remains in Git history; database helper files remain in this repository for reference. Do not replace the original Sites backend with the proxy routes: that would create a loop. Backend changes must be applied and published through Sites separately.

## Validation

`npm run build` generates the production manifest and both API routes. `node tests/hosting-proxy.test.mjs` checks forwarding, session cookies, origin protection, authentication errors and backend failures (Node 22.18+).

Host-specific deployments must still be verified in Vercel/Netlify after redeploying. This repository does not contain their account credentials or deployment access.
