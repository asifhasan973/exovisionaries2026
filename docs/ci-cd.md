# Continuous Deployment with Cloudflare Pages

This document details the Continuous Deployment (CD) pipeline configured for **Zero To Beyond** using GitHub Actions and Cloudflare Pages.

---

## 1. Overview

The deployment workflow resides in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml). It automates building the Vite single-page application and uploading the static artifacts in `dist/` directly to Cloudflare Pages.

### Key Characteristics
- **Automated Deployments**: Pushes to `main` (including merged pull requests) automatically build and publish to production.
- **Manual Trigger Support**: Includes `workflow_dispatch` to allow manual deployments with an optional custom Pages branch name.
- **No Unsolicited PR Builds**: Pull requests do not trigger deployments, avoiding unneeded preview builds and saving CI minutes.
- **Safe Fallback**: If Cloudflare credentials are missing from repository secrets, the build finishes successfully while the deployment step gracefully logs a notice and skips without failing CI.

---

## 2. Configuration & Secrets

To enable Cloudflare Pages deployment, configure the following secrets and variables in your GitHub repository (**Settings → Secrets and variables → Actions**).

### Required Secrets

| Secret Name | Description | Where to find |
| :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token with `Cloudflare Pages: Edit` permissions. | **Cloudflare Dashboard → My Profile → API Tokens → Create Token** (use the *Edit Cloudflare Workers/Pages* template or custom token). |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID. | Found in your Cloudflare dashboard URL or on the right sidebar of the Workers & Pages dashboard. |

### Target Project
- **Project Name**: `zero-to-beyond`
- **Output Directory**: `dist`
- Create the `zero-to-beyond` Pages project in the intended Cloudflare account before enabling deployment. This workflow does not provision a project or credentials.

### Optional Build Variables

The following optional repository variables (defined in **Settings → Secrets and variables → Actions → Variables**) can be configured to customize build behavior:

| Variable Name | Default | Description |
| :--- | :--- | :--- |
| `VITE_APP_ENV` | `production` (in CI) / `development` (in `.env`) | Controls in-app debug routes (`#/debug/...`) and dev toolbar. Forced to `production` in CI/CD to disable debug bypasses. |
| `VITE_LOADING_PROGRESS_MULTIPLIER` | `1` | Multiplier to simulate slower network conditions during the loading screen. |
| `VITE_SLIDE_DISPLAY_MIN_MS` | `2800` | Minimum display duration in milliseconds for each loading carousel slide. |
| `VITE_INTRO_SPLASH_DISPLAY_MS` | `2800` | Display duration for the intro splash screen. |

---

## 3. Workflow Steps Breakdown

1. **Checkout**: Checks out the repository using `actions/checkout@v4` with credentials unpersisted.
2. **Setup pnpm & Node.js**: Installs `pnpm` (v9) via `pnpm/action-setup@v4` and Node.js (v20) via `actions/setup-node@v4` with automatic pnpm store caching keyed to `pnpm-lock.yaml`.
3. **Dependency Installation**: Runs `pnpm install --frozen-lockfile` to ensure reproducible builds.
4. **Project Build**: Executes `pnpm run build` (`tsc -b && vite build`) to generate production assets into `dist/`.
5. **Credential Verification**: Verifies presence of `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` via environment flags (preventing shell injection).
6. **Deploy**: Uses `cloudflare/wrangler-action@v3` to execute `pages deploy dist --project-name=zero-to-beyond --branch=<branch>`.

---

## 4. Manual Deployments

To trigger a deployment manually:
1. Navigate to the **Actions** tab in GitHub.
2. Select the **deploy-cloudflare** workflow.
3. Click **Run workflow**.
4. Specify the target Cloudflare Pages branch (defaults to `main` for production, or enter a custom name for a preview branch).
5. Click **Run workflow**.
