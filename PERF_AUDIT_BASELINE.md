# PERF_AUDIT_BASELINE.md

> Measured baseline for `nguyen-minh.dev` **before** any optimization.
> Build: `next build` (Next.js 16.2.2, Turbopack), React 19.2.4. Date: 2026-06-25.
> Every later change is measured against this scorecard.

## How this was measured

Next 16 + Turbopack suppresses the classic per-route "First Load JS" text table, so
route bundles were derived directly from the build artifacts:

- Per-route **client** chunks: parsed from
  `.next/server/app/<route>/page_client-reference-manifest.js`, summing the real
  on-disk size of each referenced `/static/chunks/*.js`.
- Shared/root baseline: `rootMainFiles` from `.next/build-manifest.json`.
- Library attribution: grep of bundled chunk contents for `THREE`, `framer-motion`,
  `gsap`, `Matter`, `Lenis`.

These are **uncompressed** on-disk bytes (Vercel serves Brotli; wire size is ~25-35% of this).

---

## Per-route First Load JS (uncompressed, route-specific chunks)

| Route              | Route chunks | Notes |
|--------------------|-------------:|-------|
| `/` (home)         | **~489 KB**  | framer-motion + GSAP + Lenis eager; 3D & Lab lazy ✅ |
| `/donut`           | ~233 KB      | three.js loaded lazily inside CrystalCanvas |
| `/performancetest` | ~237 KB      | flow-field canvas |

**Shared root baseline (all routes):** ~445 KB
(of which one 222 KB chunk = react-dom + scheduler — framework floor, not actionable).

### Largest static chunks on disk (top of treemap)

| Size     | Chunk | Contents (by grep) |
|---------:|-------|--------------------|
| 603 KB   | `0miztp15gqrtl.js` | three.js core (lazy — `/donut`, Scene) |
| 368 KB   | `0d_yly-h2by-r.js`  | three.js / r3f (lazy) |
| 357 KB   | `09qzp7h-2-0_4.js`  | three.js ecosystem (lazy) |
| 222 KB   | `0bubn3595zs8b.js`  | react-dom + scheduler (shared floor) |
| 151 KB   | `0l4p3xvz-tr1d.js`  | **GSAP + ScrollTrigger + framer + Lenis (EAGER on `/`)** |
| 138 KB   | `0rk4d.k33fhuw.js`  | shared/runtime |
| 128 KB   | `0ic0at~m-cm9q.js`  | **framer-motion full (EAGER, layout-level)** |
|  69 KB   | `0z7d-k-evhmbf.js`  | **GSAP (EAGER on `/`)** |

---

## Library load analysis (the heart of the audit)

| Library | In `/` first-load? | How it's loaded | Verdict |
|---------|:-----------------:|-----------------|---------|
| **three.js / R3F** | ❌ NO | `dynamic(ssr:false)` Scene; Lab experiments via `import()`; `/donut` lazy | ✅ Already well split |
| **framer-motion** | ✅ YES (~128 KB) | Static import in CustomCursor, Navbar, MagneticButton, TiltCard. **No `LazyMotion`.** | ❌ Biggest cheap win |
| **GSAP** | ✅ YES (~69 KB + in 151 KB chunk) | Mostly dynamic `import('gsap')` ✅, but **static** in `MarqueeText` (×4 on home) + `CountUp` + `useGSAP` hook | ⚠️ Partially eager |
| **Lenis** | ✅ YES | Static import in LenisProvider (layout) | OK — small, needed early |
| **matter-js** | ❌ NO | lazy `import('./PhysicsParticles')` in Lab | ✅ |
| **simplex-noise** | ❌ NO | lazy in flow field | ✅ |

**Key insight:** Contrary to the usual portfolio failure mode, three.js is NOT in the
homepage bundle — it's properly code-split. The homepage's eager weight is the
**2D animation libraries (framer-motion + GSAP)**, and framer-motion is the standout
because it ships ~128 KB to serve only 4 small components with **no `LazyMotion` tree-shaking**.

---

## Single RAF loop check (the #1 portfolio jank cause)

✅ **Verified healthy.** `LenisProvider` drives Lenis via `gsap.ticker.add(...)` with
`lagSmoothing(0)`, and ScrollTrigger updates on Lenis's `scroll` event. GSAP + Lenis +
ScrollTrigger share **one** RAF. R3F runs its own loop (unavoidable; it's WebGL) but the
2D animation stack is unified. No three competing `requestAnimationFrame` loops.

---

## Off-screen / off-route canvas check

| Canvas | Off-screen pause? | Issue |
|--------|:-----------------:|-------|
| Hero `Scene` (R3F) | ❌ No `frameloop="demand"`, no IO pause | Renders continuously even when scrolled past |
| Lab canvas | ❌ Inits `'fluid'` **on mount** regardless of viewport; no IO gate; no pause when scrolled away | Runs RAF while far below the fold |
| `/donut`, `/performancetest` | Separate routes — not mounted on `/` ✅ | But no `visibilitychange` pause |

This is the #2 known suspect and it's **present**: the Lab and Hero canvases burn GPU
while invisible.

---

## Assets inventory

### Images — `public/photo/` = **7.1 MB of raw PNG** (the big problem)

| File | Size | |
|------|-----:|--|
| salpa.png    | **1.98 MB** | project thumb served as PNG |
| licorne.png  | 1.21 MB | |
| grilli.png   | 1.19 MB | |
| art.png      | 1.15 MB | |
| upcoming.png | 0.89 MB | "NEXT DROP" asset |
| askar.png    | 0.52 MB | |
| dropbox.png  | 0.34 MB | |
| epic-saas.png| 0.18 MB | |

- `images.formats` = **`['image/webp']` only → AVIF is OFF** (default). Enabling AVIF
  is a large, free byte reduction on these thumbnails.
- `Projects.tsx` uses `next/image` with `fill` + `sizes="(max-width:768px) 80vw, 560px"`
  ✅ and `priority={index < 2}` — but those 2 priority images are **below the fold**
  (Projects is the 4th section). `priority` should be on the true LCP only.
- **`/og-image.png` is referenced in metadata but does NOT exist in `public/`** → broken
  OG card + a 404. (Bug, flagged.)

### Fonts — `public/fonts/` = 568 KB, **raw `.otf`**

- 7× `.otf` loaded via hand-written `@font-face` in `globals.css`.
- `font-display: swap` ✅ but: **no `next/font`, no WOFF2, no subsetting, no `<link rel=preload>`.**
- OTF is larger and slower to parse than WOFF2; not subset to EN+FR Latin → wasted bytes
  and a render-blocking FOUT risk on the display headline (likely LCP text).

### Other
- CV PDFs (58 KB + 83 KB) — should never be fetched until the link is clicked (verify).
- `upcoming.png` (0.89 MB) — compress.

---

## Runtime / FPS observations (from code review; live profiling pending Phase 0b)

- Hero R3F: continuous render loop, no demand mode → constant GPU even when off-screen.
- Lab: `initExperiment('fluid')` fires on mount → ASCII fluid RAF runs immediately,
  before the section is anywhere near the viewport.
- Marquees (`MarqueeText` ×4): GPU-friendly transform tween ✅ but never paused off-screen;
  each reads `offsetWidth` once on mount (one forced reflow each — minor).
- `next/config` `optimizePackageImports: ["gsap","framer-motion","three"]` is set ✅
  (helps tree-shaking) but does not replace `LazyMotion` for framer's runtime.

---

## Prioritized fix list — preview (full ranking in Phase 1)

| # | Fix | Impact | Effort | Area |
|---|-----|:------:|:------:|------|
| 1 | `LazyMotion` + `domAnimation`, drop full `motion` import | High (−~80–90 KB eager) | Low | Bundle |
| 2 | Enable AVIF (`images.formats`) | High (−MBs on thumbs) | Trivial | Images |
| 3 | IntersectionObserver-gate Lab canvas init + pause off-screen | High (GPU/INP) | Med | WebGL |
| 4 | `frameloop="demand"` / IO-pause Hero Scene + `visibilitychange` | High (GPU/battery) | Med | WebGL |
| 5 | Migrate fonts to `next/font/local` (WOFF2 + subset + preload) | Med (LCP, CLS) | Med | Fonts |
| 6 | Fix `priority` (true LCP only); compress upcoming.png; add og-image | Med (LCP, OG) | Low | Images |
| 7 | Pause marquees off-screen | Low | Low | Marquee |
| 8 | Lazy-import GSAP in MarqueeText/CountUp (or keep — small) | Low | Low | Bundle |
| 9 | Fix workspace-root warning (`turbopack.root`) + dup lockfile | n/a (cleanliness) | Trivial | Config |

## Open bugs spotted (non-perf, flagged for later)
- Broken OG image (`/og-image.png` missing).
- Multiple lockfiles (`~/pnpm-lock.yaml` + project `package-lock.json`) → Next picks wrong
  workspace root.
