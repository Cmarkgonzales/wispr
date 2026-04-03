# Weekly guide publishing loop (long-tail SEO)

This loop turns **real exports from the Wispr playground** into indexable guides that reinforce intent (cursor trail designer, CSS trail generator, framework-specific trails) and earn backlinks over time.

## Cadence

- **One guide per week**, same weekday if possible (predictable ship rhythm).
- Batch outline in 15–20 minutes; first draft in 45–60 minutes; polish + internal links in 20 minutes.

## Input: exported snippets (the source of truth)

Each post starts from **one concrete export**:

1. Open [Playground](https://wispr.dev/playground.html) and build a look that matches the article promise (e.g. “subtle lag on a marketing hero,” “neon burst for a dark landing page”).
2. Copy the tab that matches the story: **JS**, **CSS**, **HTML**, **React**, **Vue**, or **Angular** — or use **Export all** when the post compares stacks.
3. Save a **minimal** snippet in the draft (trim unrelated lines). Prefer “drop-in” steps: where to paste, one gotcha, one performance note.

Naming the export in the article (“React tab,” “Vue `script setup` tab”) teaches readers how to reproduce the same look and reinforces Wispr’s multi-export positioning.

## Weekly checklist (repeatable)

| Step | Action |
|------|--------|
| 1 | Pick **one primary keyword phrase** and 2 semantic variants (e.g. primary: “cursor trail effect CSS”; variants: “custom cursor trail,” “mouse trail animation CSS”). |
| 2 | Draft **H1 + meta title/description** before writing body (match search intent, avoid generic “cursor”-only titles; disambiguate from the Cursor IDE in intro if needed). |
| 3 | Structure: problem → Wispr steps (3–5 bullets) → **annotated snippet** → integration note (layout/global mount, SSR caveats if any) → **FAQ** (2–3 items). |
| 4 | **Internal links**: home, playground, [guides index](https://wispr.dev/guides/), and 1–2 related guides (CSS ↔ React ↔ Vue/Angular). |
| 5 | **CTA**: “Generate in Wispr” linking to the playground with a short line on what to tweak first. |
| 6 | Ship as static HTML under `guides/` (same head pattern as existing guides: canonical, description, OG). |
| 7 | Update `public/sitemap.xml` `lastmod` for the new URL; run `npm run seo:launch` after deploy for checklist + optional IndexNow. |

## Topic backlog (from exports)

Rotate frameworks so coverage compounds:

- **Vanilla / CSS** — embed, `@layer`, reduced motion, mobile perf.
- **React** — root provider, `useEffect` cleanup, concurrent-safe patterns.
- **Vue** — composition API, teleport, Nuxt notes if relevant.
- **Angular** — zone vs `NgZone`, standalone component, SSR cautions.

Add “vertical” angles when exports support it: portfolio sites, SaaS marketing pages, WebGL landing pages (trail only, no GL).

## Backlinks and distribution (lightweight)

- **Share where the snippet lives**: Reddit (`r/webdev`, `r/reactjs`, etc.), framework Discords, personal blog cross-posts — always with a short “generated with Wispr” line and link to the guide, not only the homepage.
- **Changelog-worthy** changes: if the export format changes, note it in a short changelog entry on the site and link from the affected guide.

## 30-day review

In Search Console, compare **new guide URL** vs baseline guides: impressions, queries containing “trail,” “cursor,” framework names, and CTR. Double down on angles that get impressions but need stronger titles or snippets.
