# Wispr — Cursor Trail Designer

**Live site:** [https://wispr-f6610.web.app/](https://wispr-f6610.web.app/)

A browser-based playground for designing animated mouse cursor trail effects and exporting production-ready code for vanilla JS, CSS, HTML, React, Vue 3, and Angular.

---

## Overview

Wispr lets developers and designers build and preview mouse trail effects directly in the browser, then copy a framework-specific snippet with one click.

---

## Features

| Area | Details |
|---|---|
| **Presets** | 7 built-in presets to start from |
| **Particle shapes** | 12 shapes (circle, star, ring, and more) |
| **Color modes** | Gradient, mixed, and random |
| **Blend modes** | Standard CSS blend modes with optional glow |
| **Motion controls** | Trail length, fade speed, and chase mode (smooth / elastic / delayed) |
| **Export targets** | Vanilla JS · CSS · HTML embed · React · Vue 3 · Angular |
| **Download** | Export all assets as a single file |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Build tool | [Vite](https://vitejs.dev/) v8 |
| Hosting | [Firebase Hosting](https://firebase.google.com/docs/hosting) |
| CI/CD | GitHub Actions |
| Runtime | Vanilla HTML/CSS/JS — zero runtime dependencies |

---

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
git clone <repo-url>
cd wispr
npm install
```

Copy the environment template and fill in any optional values:

```bash
cp .env.example .env
```

Start the dev server:

```bash
npm run dev
```

The site is served at `http://localhost:5173` by default.

### Build

```bash
npm run build
```

Output is written to `dist/`. Preview the production build locally:

```bash
npm run preview
```

---

## Environment Variables

All variables are optional unless noted. Vite only exposes `VITE_*` prefixed variables to the client bundle.

| Variable | Purpose |
|---|---|
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 Measurement ID (Admin → Data streams → Web) |
| `VITE_GOOGLE_SITE_VERIFICATION` | Google Search Console HTML-tag verification token |
| `INDEXNOW_KEY` | IndexNow key for Bing/Yandex — used only by `npm run seo:launch` (server-side) |
| `SITE_ORIGIN` | Canonical origin used by SEO scripts, e.g. `https://wispr.dev` |

See `.env.example` for the full reference.

---

## Deployment

### Automatic (CI/CD)

Every push to `main` triggers a live deploy to Firebase Hosting via GitHub Actions.
Every pull request against `main` triggers a **preview channel** deploy with a unique URL posted as a PR comment.

Required GitHub repository secrets:

| Secret | Description |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON (base64 or raw) |
| `VITE_GA_MEASUREMENT_ID` | Passed to the build step |
| `VITE_GOOGLE_SITE_VERIFICATION` | Passed to the build step |

### Manual

```bash
npm run build
npx firebase deploy --only hosting
```

---

## Project Structure

```
wispr/
├── index.html                  # Landing page
├── src/
│   └── trail-ambient.js        # Ambient trail effect for the landing page
├── scripts/
│   └── seo-launch.mjs          # IndexNow submission script
├── .env.example                # Environment variable reference
├── firebase.json               # Firebase Hosting config (cleanUrls, caching headers)
├── .firebaserc                 # Firebase project alias (wispr-f6610)
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── vite.config.*               # Vite configuration (if present)
└── dist/                       # Build output (git-ignored)
```

---

## Caching Strategy

Configured in `firebase.json`:

| Resource | Cache policy |
|---|---|
| `/assets/**`, `*.js`, `*.css` | `public, max-age=31536000, immutable` (1 year, content-hashed) |
| `*.html` | `no-cache, no-store, must-revalidate` (always fresh) |
| `/sitemap.xml` | `public, max-age=3600` (1 hour) |

---

## SEO

- Structured data: `WebSite`, `SoftwareApplication`, and `FAQPage` JSON-LD schemas embedded in `index.html`
- Open Graph and Twitter card meta tags
- Canonical URL pointing to `https://wispr.dev/`
- Google Search Console verification via `VITE_GOOGLE_SITE_VERIFICATION`
- IndexNow submission available via `npm run seo:launch` (requires `INDEXNOW_KEY` and `SITE_ORIGIN`)

---

## Performance Tips (for exported effects)

- Prefer shorter trail lengths and smaller particle sizes on mobile
- Lower glow values reduce GPU composite cost
- Use smooth chase mode for the lowest CPU overhead
- Mount the exported effect at root/layout level so it initialises once

---

## License

Private repository. All rights reserved.
