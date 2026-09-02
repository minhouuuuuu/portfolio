# Performance — the 3-second blocking task

## Summary

The homepage scored **65** on Lighthouse desktop despite near-perfect paint
metrics (FCP 0.3s, LCP 1.0s, CLS 0.01). The entire deficit was **Total
Blocking Time: 3,060ms**, and effectively all of it came from a single
component rendering a world map that nobody could see yet.

| | Desktop | | Mobile | |
|---|---|---|---|---|
| | before | after | before | after |
| Performance | 64 | **97** | 39 | **65** |
| Total Blocking Time | 2,386ms | **9ms** | 9,755ms | **448ms** |
| Speed Index | 1.9s | **0.92s** | — | — |
| Time to Interactive | 4.2s | **1.19s** | — | — |
| CLS | 0.001 | 0.001 | 0.009 | 0.009 |
| Accessibility / SEO | 100 | 100 | 100 | 100 |

Median of 3 runs, production build (`next build && next start`), same machine.
"Before" figures are the local reproduction of the reported production score
of 65; they track it closely enough to iterate against without deploying.

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
| HTML served | 178KB | 69KB |
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
| gsap dynamic in CountUp/MarqueeText, delete dead useGSAP | 9 → 16ms | 448 → 423ms | **kept** |
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

## Where the remaining points are

Desktop is effectively done: the only imperfect audits left are LCP (1.2s,
score 0.90) and Speed Index (1.0s, score 0.98), both explicitly out of scope.

**Mobile is a different problem from the one this work fixed.** After Phase 1
the mobile breakdown is:

| Audit | Weight | Score |
|---|---|---|
| largest-contentful-paint (6.0s) | 25 | **0.13** |
| total-blocking-time (410ms) | 30 | 0.66 |
| speed-index (4.8s) | 10 | 0.67 |

LCP now dominates, not TBT. And it is not a network problem: every request
including all four fonts completes by ~1.2s, while LCP lands at 6.0s. The
~4.8s gap is CPU — the three.js/react-three-fiber hero scene evaluating on a
4x-throttled mobile CPU. `04.8wcmbi0sj7.js` is 98KB of three.js, 89% of it
unused on this route.

The fix would be to stop mounting the WebGL hero scene on mobile, or to defer
it until after LCP. Both touch the hero and the LCP element, so both need
sign-off before anything is changed.
