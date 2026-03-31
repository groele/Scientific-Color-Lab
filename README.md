# Scientific Color Lab

Scientific Color Lab is a screen-first scientific color workspace for papers, figures, heatmaps, mechanism diagrams, and online academic documents. It combines palette building, diagnostics, image-based extraction, and export tools in a local-first React app.

## What this build now supports

- High-contrast academic templates rebuilt for scientific use
- Low-interference diagnostics with actionable quick fixes
- Image analysis with raw extraction vs scientific reconstruction
- Local favorites, projects, recents, and export profiles
- Chinese / English UI
- Installable PWA delivery for sharing without terminal-only usage

## Run locally

```bash
npm install
npm run dev
```

For a production-like local preview:

```bash
npm run build
npm run preview
```

Open:

- `http://127.0.0.1:5173/workspace` in dev
- `http://127.0.0.1:4173/workspace` in preview

Windows users can also double-click:

- `启动 Scientific Color Lab.cmd`

## Install as a PWA

After deployment, open the site in a modern Chromium browser and use the `Install PWA` action in the left navigation panel. Installed builds open directly into the workspace and keep local IndexedDB data on the current device/browser.

## Deploy

### Vercel

- Build command: `npm run build`
- Output directory: `dist`
- `vercel.json` already includes SPA route rewrites

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- `netlify.toml` already includes SPA route fallback

### GitHub Pages

A Pages workflow is included at `.github/workflows/deploy-pages.yml`.

Notes:

- The workflow builds with `DEPLOY_TARGET=github-pages`
- The Vite `base` path switches to `/Scientific-Color-Lab/`
- `public/404.html` keeps SPA route refreshes working on Pages

## Sharing guidance

- Share the deployed web URL for the simplest experience
- Recommend PWA installation for repeat users
- Export palette assets from the app when collaborators only need colors, not the full tool

## Quality checks

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
```
