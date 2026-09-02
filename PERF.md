# Performance — the 3-second blocking task

## Summary

The homepage scored **65** on Lighthouse desktop despite near-perfect paint
metrics (FCP 0.3s, LCP 1.0s, CLS 0.01). The entire deficit was **Total
Blocking Time: 3,060ms**, and effectively all of it came from a single
component rendering a world map that nobody could see yet.

| | Desktop | | Mobile | |
|---|---|---|---|---|
| | before | after | before | after |
| Performance | 64 | **98** | 39 | **65** |
| Total Blocking Time | 2,386ms | **8ms** | 9,755ms | **412ms** |
| Speed Index | 1.9s | **0.93s** | — | — |
| Time to Interactive | 4.2s | **1.19s** | — | — |
| CLS | 0.001 | 0.001 | 0.009 | 0.009-0.011 |
| Accessibility / SEO | 100 | 100 | 100 | 100 |

Desktop: median of 5 runs. Mobile: median of an interleaved A/B run (see
**Measurement method** below). Production build (`next build && next start`),
same machine. "Before" figures are the local reproduction of the reported
production score of 65; they track it closely enough to iterate against
without deploying.

### Measurement method — and a warning

Mobile numbers on this machine are **noisy enough to invent results that are
not there**. Measured over 5 runs of an unchanged build, mobile TBT ranged
386-578ms: an amplitude of ~190ms, and under background load (Spotify, Adobe
Creative Cloud; load average ~4) a single sample drifted as far as 3,800ms.

Any mobile delta smaller than ~200ms is noise. Three-run medians taken minutes
apart are **not** a valid comparison, because machine load drifts between them.
Two conclusions in an earlier draft of this document were wrong for exactly
that reason and have been corrected below.

The reliable protocol, used for every mobile A/B here, is
`scratchpad/ab.sh`-style **interleaving**: build A and build B are kept side by
side and measured alternately on the same port, one run each per cycle, so both
variants absorb the same drift. Report min/median/max, and refuse to conclude
on any delta smaller than the observed intra-variant amplitude.

## Diagnosis — and why the obvious suspect was wrong

The initial hypothesis was the WebGPU/Three.js/TSL startup path: node-material
graph construction, shader compilation, and seeding a GPU particle system.
That turned out to be innocent. `three/webgpu` and `three/tsl` are imported
only by `/donut` and `/performancetest`, which never load on `/`. Matter.js is
already behind `await import()`. The Hero's react-three-fiber scene is already
`next/dynamic`.

Lighthouse blamed a specific chunk, `0r7m44~cm1a3r.js`, for 3,025ms. Grepping
the built file showed it contains `rendererPackageName: "react-dom"` — it is
**React DOM's reconciler plus the Next.js App Router runtime**, not
application code.

This is the key trap. **Lighthouse attributes a long task to the script at the
bottom of the call stack**, and during hydration that is always React, because
React is the caller. The chunk's own numbers said as much and were easy to
misread: only 7ms of parse/compile and 22KiB unused out of 222KiB. React is
compact and fully used. The 3,269ms of "script evaluation" was application
code running *through* React.

Reading the trace settled it. The long task was one `FunctionCall` into
function `O` of that chunk, entered from a `MessagePort` `message` handler.
Decompiling that offset showed `O` is React's `performWorkUntilDeadline` — the
scheduler's task loop. Inside the 2,485ms task:

- ~2,000 `UpdateLayoutTree`
- 3,578 `UpdateLayer`
- 410 minor GCs

That signature is DOM construction and layout, not GPU work. React only checks
`shouldYield` *between* work units, so one component producing a huge subtree
blocks uninterruptibly no matter how well the rest of the app is code-split.

The culprit: `components/sections/ContactMap.tsx` renders
`components/ui/DottedMap.tsx` (vendored magicui), which calls
`createMap({ mapSamples: 5000 })` during render and emits one `<circle>` per
point. Measured directly, `createMap` takes **~4 seconds in Node**, and the
served HTML contained **1,881 `<circle>` elements out of 2,392 total — 79% of
the homepage's DOM**, for a below-the-fold decoration that is byte-identical
on every single page load.

A controlled experiment confirmed causation before anything was changed:
stubbing out `<ContactMap />` alone moved desktop TBT from 2,386ms to 6ms and
Performance from 64 to 98.

## The fix

The map is fully static, so it is now computed once at build time by
`scripts/generate-dotted-map.mjs` into `lib/generated/dotted-map.ts`, and
`components/ui/StaticDottedMap.tsx` renders the dot field as a **single
`<path>`** (1,833 subpaths, two arcs each) instead of 1,833 elements.

This removes both costs the profile identified, which are distinct:

1. **Allocation and reconciliation** — `createMap` projection and React
   building 1,833 elements. Killed by precomputing.
2. **Layout and compositing** — the per-node cost that produced the ~2,000
   `UpdateLayoutTree` and 3,578 `UpdateLayer` events. Killed by collapsing to
   one node. *Precomputing alone would not have fixed this.*

Homepage element count: **2,392 → 560**.

### Why inline SVG and not a static `.svg` file

Both were built and measured:

| | inline `<path>` | `.svg` via `<img>` |
|---|---|---|
| Desktop TBT | 18ms | 9ms |
| Mobile TBT | 532ms | 444ms |
| HTML served (raw / gzipped) | 175KB / 20.1KB | 67KB / 11.3KB + a separate .svg |
| Follows light/dark theme | **yes** | **no** |

`<img>` won on raw numbers, but by ~88ms out of ~9,300ms recovered — under 2%,
and within run-to-run variance (the inline variant ranged 414–642ms across
runs). It loses on the thing that matters: an `<img>` renders in an isolated
document and cannot inherit `var(--text-muted)` or `var(--accent)`, so the
colours have to be hard-coded. With `next-themes` the map would freeze in one
palette and stop following the theme. Inline SVG was kept.

### Fidelity

The generator's stagger maths is a deliberate transcription of `DottedMap.tsx`
so the output is pixel-identical. Verified three ways:

- All 15 marker positions are **byte-identical** to the previous render.
- The path contains exactly **1,833 subpaths**, one per original dot.
- A screenshot pixel diff shows 0.089% of pixels differing, confined to the
  map's bounding box and 56% accent-green — the pulse rings caught at
  different animation phases. SMIL animations are unsynchronised between page
  loads, so a nonzero diff here is expected.

All 15 markers still pulse, with the same two phase-offset rings each (60
`<animate>` elements, unchanged).

## Trade-offs accepted

- **The generated file is committed.** `lib/generated/dotted-map.ts` is a
  ~100KB build artefact in version control. The alternative — regenerating on
  every build — costs ~4s per build for output that changes only when the
  marker list or map parameters change. **Re-run `npm run generate:map` after
  editing the markers in the generator, or after updating
  `svg-dotted-map` or the vendored `DottedMap.tsx`.** It is not wired into
  `build` on purpose.
- **Two sources of truth for the marker list.** The lat/lng array lives in
  both `ContactMap.tsx` and the generator. `ContactMap.tsx`'s copy is now
  unused by the render but kept as the readable reference the generator
  mirrors.
- **`DottedMap.tsx` is untouched and now unused by the homepage.** Kept
  deliberately as the vendored reference so it can be diffed against upstream.
- **The dot field is `aria-hidden`.** It is decorative and the locations are
  already stated in the caption text; exposing 1,833 anonymous dots would add
  noise without information. Accessibility stays at 100.

## Notes for whoever reads this next

- **Do not trust Lighthouse's script attribution for hydration-time long
  tasks.** It names the bottom of the stack, which is almost always React. Read
  the trace: `UpdateLayoutTree` / `UpdateLayer` counts point at DOM volume,
  minor-GC counts point at allocation, and neither points at the framework.
- **Check mobile.** Desktop hid the severity — the same component cost 9,755ms
  of blocking under mobile's 4× CPU throttle versus 2,386ms on desktop.
- **The `errors-in-console` best-practices audit fails under headless Chrome**
  ("Error creating WebGL context") because the Hero's r3f scene cannot get a
  GPU context. This reproduces on the unmodified baseline too, so it is a
  testing artefact, not a regression — the same class of thing as the
  `BackForwardCacheDisabled` bf-cache failure. Production scores 100.

## Phase 2 — what was tried, and what survived

Phase 1 left desktop at 97-98 with TBT ~9ms, so Phase 2 had at most ~3 points
to win there. Each change below was measured on desktop and mobile, median of
3 runs, and reverted if it did not improve the median.

| Change | Desktop TBT | Mobile TBT | Verdict |
|---|---|---|---|
| gsap dynamic in CountUp/MarqueeText, delete dead useGSAP | no measurable change | no measurable change | **kept, on non-perf grounds** |
| CustomCursor: load framer-motion only on fine pointers | 16 → 10ms, perf 98 → 97 | 423 → 493ms, perf 64 → 62 | **reverted** |
| useScrollProgress / useActiveSection: cache layout reads, rAF-throttle | 11ms (flat) | 423 → 462ms | **reverted** |

### Reverted: dynamic framer-motion in CustomCursor

`CustomCursor` imports framer-motion but disables itself on touch devices via
`matchMedia` — 124KB downloaded and evaluated on phones for a cursor that can
never appear. Loading the implementation through `next/dynamic` behind the
pointer check should have removed it from mobile entirely.

It measured worse on both platforms: mobile perf 64 → 62 (TBT 423 → 493ms),
desktop 98 → 97. The reason is that `Navbar` imports framer-motion too, and
Navbar is in the layout — so the library loads regardless, and the only net
effect was an extra chunk and an extra round trip. Removing framer-motion from
mobile would mean converting Navbar as well, which is a visual-behaviour change
to a component on the critical path. Not done without asking.

### Reverted: batching layout reads in the scroll hooks

`useActiveSection` called `getBoundingClientRect()` per section on every
unthrottled scroll event and then setState — textbook layout thrash, and the
likely source of the 252ms of forced reflow in the original report.

Lighthouse barely scrolls, so it cannot see this. It was measured directly
instead, with a CDP script that scrolls the full page and back under 4x CPU
throttling, reading `Layout` / `UpdateLayoutTree` / `RunTask` totals from the
trace (median of 3):

| | Layout | Style recalc | RunTask total |
|---|---|---|---|
| original hooks | 149ms | 1,143ms | 8,718ms |
| cached + rAF-throttled | 173ms | 1,159ms | 9,205ms |

The rewrite was slightly *worse* on every axis. Lenis already drives scrolling
through the GSAP ticker, so the handlers were effectively rAF-aligned already;
the added throttle layer removed nothing and the rect cache saved nothing,
because those reads were already batched into one pass per scroll event.

Reverted. The lesson generalises: this codebase's scroll path is already
frame-aligned, so the standard "throttle and cache" advice has nothing left to
recover here.

### Not attempted, and why

- **WOFF2 conversion.** The fonts are 613KB of uncompressed `.otf` and Next
  serves them as-is. But `next start` already gzips them and Vercel serves
  Brotli — measured, the whole set compresses 53% on the wire (500KB → 236KB),
  so Lighthouse's raw figure overstates the prize. Converting needs `fonttools`
  or the `woff2` npm package, i.e. a new dependency, which needs sign-off.
  Worth doing, but it is a transport win, not a blocking-time win.
- **Dropping font weights.** Declared weights are 300/400/900 (Monument) and
  300/400/800 (Neue Machina); the CSS uses 300/600/700/900. There is a real
  mismatch — 700 is synthesised from 900 — but changing the declared set
  changes rendering, which needs sign-off.
- **`legacy-javascript`.** No longer reported by Lighthouse on this build; the
  14KiB in the original report has already gone. No browserslist key is set,
  and adding one measured nothing to fix.

## Mobile LCP: measured, and it is not what it looked like

The plan was to keep the WebGL hero on every device but defer it behind a
static poster, on the theory that mobile LCP (6.0s, score 0.13) was three.js
evaluating on a throttled CPU.

**That theory was wrong, and the fix would have gained nothing.** Two
measurements settle it.

**1. What the LCP element actually is.** Rather than assume, the real
`PerformanceObserver` entry was read from the page under mobile emulation (412
x823, 4x CPU, throttled network). The LCP element is neither the headline nor
the canvas:

```
t= 376ms  <A>    "NM"                                    (nav logo)
t=1576ms  <SPAN> "PRODUCT ENGINEER"                      (hero label)
t=2228ms  <P>    "Je cadre les problemes, ..."           <- LCP
```

It is the hero **subtitle paragraph**, and it carries the class `hero-anim`.

**2. Why it lands where it lands.** `hero-anim` elements are hidden by CSS
(`#hero:not([data-hero-ready]) .hero-anim`) and revealed by the GSAP entrance
timeline in `Hero.tsx`. The subtitle's fade is scheduled at **t=1.2s into that
timeline**, which itself only starts once gsap has been dynamically imported.
The LCP is therefore the deliberate choreography of the hero entrance, not
script evaluation.

The WebGL scene is revealed at t=1.8s in the same timeline — i.e. **after** the
LCP element. It is already deferred by design.

**3. The control.** Removing `<Scene />` from the hero entirely and
re-measuring:

| | LCP |
|---|---|
| with the WebGL scene | 2,228ms |
| with the scene removed | 2,304ms |

Deleting three.js from the hero does not improve LCP at all. A poster-plus-swap
would have added a component, a state transition and a swap risk to CLS in
exchange for nothing.

(The 6.0s Lighthouse LCP and the 2.2s observed here differ because Lighthouse
applies its own simulated throttling on top; the *ordering* — subtitle last,
canvas after it — is what matters, and is consistent in both.)

**What would actually move mobile LCP** is shortening the hero entrance
choreography: the subtitle currently waits 1.2s of timeline before it starts
fading in. That is a deliberate design decision about how the site feels, not a
bug, so it is not something to "optimise" unilaterally. Reducing that delay, or
revealing the subtitle earlier in the sequence, is the lever — and it is a
design call.

## The three.js chunk (`04.8wcmbi0sj7.js`, 97KB, 89% unused)

Checked, as a suspected over-broad import. The scene uses `Canvas` and
`useFrame` from `@react-three/fiber`, two helpers (`AdaptiveDpr`,
`AdaptiveEvents`) from `@react-three/drei`, and a handful of three primitives
(`points`, `mesh`, two lights, four geometries, two materials).

`@react-three/drei` is 2.9MB installed and re-exports its whole surface from a
barrel, and unlike `three` it is **not** listed in `optimizePackageImports` in
`next.config.ts` — so deep-importing the two helpers looked promising. It was
tried:

| | total chunk bytes |
|---|---|
| barrel import | 2,840KB |
| deep imports | 2,841KB |

No gain — Turbopack already tree-shakes the barrel. **Reverted**, since it makes
imports uglier for nothing.

The 89%-unused figure is structural: three.js is a monolithic engine and a
simple scene exercises a fraction of it. The chunk is already behind
`next/dynamic` and loads after the hero text. Shrinking it further means
changing engine, not changing imports.

## Still open

- **WOFF2 conversion.** Needs `fonttools` or the `woff2` npm package — a new
  dependency. And the prize is smaller than the raw numbers suggest: the fonts
  are 613KB of `.otf`, but they compress 53% on the wire already (500KB → 236KB
  measured). A transport win, not a blocking-time win.
- **Font weights.** Declared: 300/400/900 (Monument), 300/400/800 (Neue
  Machina). Used in CSS: 300/600/700/900 — so 700 is being synthesised from
  900. Worth reconciling, but it changes rendering.
- **Hero entrance timing** — the actual mobile LCP lever, and a design call.
