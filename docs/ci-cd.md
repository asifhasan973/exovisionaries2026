# Cloudflare production deployment

Production: https://zero-to-beyond.pages.dev/

Project: `zero-to-beyond` · production branch: `main` · output: `dist/`.

## Automatic releases

`.github/workflows/deploy.yml` runs for pushes and merges to `main`, or a manual
workflow dispatch on `main`. It installs locked npm dependencies with Node.js 22,
builds the production frontend, deploys through Wrangler 4.151.2, and verifies the
live URL. Releases run sequentially. Action versions are pinned to commit SHAs.

Missing credentials fail immediately; a green run cannot silently skip deployment.
Cloudflare credentials are available only to credential validation and deployment,
not dependency installation or the frontend build. Fork pull requests do not deploy.

## Repository secrets

Configure these in GitHub repository Settings → Secrets and variables → Actions:

- `CLOUDFLARE_ACCOUNT_ID`: the account containing the Pages project.
- `CLOUDFLARE_API_TOKEN`: a dedicated API token with Account → Cloudflare Pages → Edit,
  scoped to that Cloudflare account. No DNS, account administration or token
  provisioning permission is needed. Store its value only as a GitHub Actions secret.

The Cloudflare connection used for interactive releases cannot provision persistent
API tokens. An account administrator must create the dedicated CI token before the
first automatic release. Revoke/replace it if access is no longer needed.

Optional public GitHub Actions variables control loading timing:
`VITE_LOADING_PROGRESS_MULTIPLIER`, `VITE_SLIDE_DISPLAY_MIN_MS`, and
`VITE_INTRO_SPLASH_DISPLAY_MS`. Empty values use application defaults.

## Caching and previous host

`public/_headers` enables immutable caching for hashed assets, daily revalidation
for audio, and fresh HTML/service-worker checks. Pages serves the SPA fallback.

`vercel.json` disables automatic Git deployments to Vercel. Existing Vercel
releases are retained; Cloudflare is the production URL for new releases.

## Manual releases

After authenticating Wrangler to the same account:

```sh
VITE_APP_ENV=production npm run build
wrangler pages deploy dist --project-name=zero-to-beyond --branch=main
```

## Troubleshooting

Check the [GitHub Actions run](https://github.com/asifhasan973/exovisionaries2026/actions/workflows/deploy.yml).
Authentication errors require checking the dedicated token's permissions and
account scope. Install/build failures happen before publication, leaving the
current Cloudflare release available.
