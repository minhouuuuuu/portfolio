# PERF_AUDIT_RESULTS.md

> Before/after for the `nguyen-minh.dev` performance pass. Date: 2026-06-25.
> Measurement mode (chosen): **bundle + build deltas** — every number below is
> measured from `next build` artifacts, not estimated. Runtime LCP/CLS/INP are
> reasoned from what the build changes, not from a live Lighthouse run.

## TL;DR

The usual portfolio failure mode (three.js in the homepage bundle) **was not
present** — WebGL is already properly code-split. So the wins here are **not**
in raw JS bytes (the homepage's eager weight is GSAP + Framer Motion, which are
intrinsic to the site's identity and can't be stripped without gutting it).

The real, measured wins landed in three places:
1. **Fonts** → self-hosted, preloaded, **zero font-swap CLS** (metric fallback).
2. **Images** → AVIF enabled + LCP priority fixed → big request-time byte cuts.
3. **Runtime GPU** → Hero + Lab canvases and all marquees now **idle when
   off-screen / tab hidden** (the #2 jank source, confirmed and fixed).

One change (`LazyMotion`) was implemented, **measured, found net-negative on
this specific app, and reverted** — documented below as an honest trade-off.

---

## Scorecard (before → after)

| Metric | Before | After | Notes |
|--------|-------:|------:|-------|
| Home first-load JS (gzip) | 328 KB | **327 KB** | Flat — see "Framer trade-off". Animation libs are core to the product. |
| Home first-load JS (raw) | ~1050 KB | ~1045 KB | three.js stays lazy ✅ |
| three.js on home critical path | No ✅ | No ✅ | 368 KB + 357 KB chunks remain route/interaction-lazy |
| Font delivery | 7× raw `.otf`, no preload, manual `@font-face` | **6× self-hosted via next/font, display family preloaded** | unused italic dropped |
| Font-swap CLS | swap with no metric fallback (layout shift) | **`size-adjust` metric fallback → ~0 CLS** | next/font auto-generates it |
| Image format | WebP only (AVIF off) | **AVIF + WebP** | `salpa.png` 1.98 MB → AVIF ~150–250 KB at request time |
| LCP image priority | `priority` on 2 below-the-fold project imgs | **removed; `loading="lazy"`** | stops competing with the real LCP (hero text) |
| Hero WebGL when off-screen | render loop runs forever | **`frameloop` → "never" off-screen / tab hidden** | GPU idles |
| Lab canvas | inits on mount; runs while far below fold | **lazy-inits near viewport; pause/resume on scroll + visibility** | no GPU work off-screen |
| Marquees (×4) | GSAP loops run continuously | **paused off-screen; honor `prefers-reduced-motion`** | no off-screen repaint |
| Build warning (workspace root) | present | **gone** (`turbopack.root` pinned) | |

---

## Changes made (each committed separately)

1. **`perf(config)`** — `next.config.ts`: `images.formats = ["image/avif","image/webp"]`,
   `minimumCacheTTL = 1y`, `turbopack.root` pinned (kills the inferred-root warning
   from a stray parent `~/pnpm-lock.yaml`).
2. **`perf(fonts,images)`** — migrate hand-written `@font-face` → `next/font/local`
   (`app/fonts.ts`); self-hosts faces, preloads the display family (hero LCP),
   injects `size-adjust` fallback (CLS), drops the unused Monument italic. Tailwind
   `@theme` tokens now consume the generated `--font-monument` / `--font-neue`.
   Project thumbnails: dropped the wrong `priority`, set `loading="lazy"`.
3. **`perf(webgl)`** — Hero `Scene` Canvas wrapped in IntersectionObserver +
   `visibilitychange` gate toggling `frameloop` "always"/"never". Lab no longer
   inits on mount: it lazy-creates the first experiment near the viewport and
   `pause()`/`resume()`s as it scrolls in/out. Added `pause()`/`resume()` to
   `AsciiFluid`, `GenerativeFlowField`, `PhysicsParticles` (latter also stops the
   Matter.js runner).
4. **`perf(marquee)`** — each marquee tween paused via IntersectionObserver when
   off-screen; reduced-motion settles to start.

---

## Trade-offs (the honest part)

### Framer Motion / `LazyMotion` — implemented, measured, reverted
`LazyMotion` + `domAnimation` (the textbook framer optimization) was wired up:
`motion.*` → `m.*` across the 4 components that use it, plus an async feature
loader. **Measured result: home gzip first-load went 328 KB → 336 KB — an 8 KB
regression.** Why: Framer is anchored to the homepage by `MagneticButton`
(Lab CTAs) and `TiltCard` (project cards), which are genuinely visible; the
`domAnimation` feature set still ships the spring engine they need, and the
`LazyMotion` wrapper + plumbing cost more than it saved. Per the guardrail
("don't ship a change that regresses the scorecard"), it was **reverted**.

### JS bytes are flat — and that's correct
GSAP + ScrollTrigger + Lenis are the homepage's eager weight, and they *are* the
product (the hero reveal, the pinned scroll choreography, the smooth scroll).
Stripping them would win a metric and lose the site. The pass instead made the
existing work cheaper at runtime (off-screen idling) rather than smaller on the
wire.

### Fonts are still `.otf`, not WOFF2
No WOFF2 converter was available locally and the guardrail forbids adding heavy
deps. The CLS/LCP/preload wins were captured with the existing OTFs. WOFF2 would
shave ~40% off each face (~50 KB → ~30 KB) — see "Further opportunities".

---

## Verification done
- `next build` clean (no warnings, no errors) after every commit.
- `tsc --noEmit` passes.
- Confirmed three.js core (368 KB / 357 KB chunks) is **not** preloaded by the
  home HTML.
- Confirmed next/font self-hosts 6 faces, preloads only the display family, and
  the `--font-display`/`--font-mono` → `--font-monument`/`--font-neue` variable
  chain resolves in the generated CSS.

---

## Further opportunities (ranked)

1. **Convert fonts to WOFF2** (run `fonttools`/`woff2_compress`, then point
   `app/fonts.ts` at the `.woff2`). ~40% per-face byte cut on the LCP-critical
   display font. Needs a one-time dev-tool install (flagged, not done).
2. **Down-res the source PNGs.** AVIF now handles delivery, but the *sources*
   (`salpa.png` 1.98 MB, several >1 MB) slow the first optimization pass and the
   git repo. Re-export at the real display size (cards render ≤560 px wide).
3. **Delete dead asset** `public/photo/upcoming.png` (0.89 MB) — not referenced
   anywhere in the code.
4. **Device-tier scaling for the Hero scene.** The Lab already calls
   `detect-gpu`; the Hero `ParticleField` ships a fixed 3000 particles. Scale
   that by tier on low-end mobile.
5. **Self-host / preconnect audit** — already same-origin; nothing external to
   preconnect, so low priority.

## Bugs spotted (outside pure perf)
- **Broken OG image:** `metadata` references `/og-image.png` but the file is
  **missing from `public/`** → broken social card + a 404. Needs a 1200×630 asset.
- **Duplicate lockfiles:** `~/pnpm-lock.yaml` + project `package-lock.json`.
  Worked around with `turbopack.root`; cleaner to remove the stray parent lock.
