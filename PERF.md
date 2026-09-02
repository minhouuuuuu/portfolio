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

## Still open (Phase 2)

Not yet done, in rough order of expected value:

- **Forced reflow, ~252ms**, from layout reads interleaved with writes
  (likely the Lenis/scroll path). Batch reads before writes and cache
  measurements across frames.
- **Static gsap imports** in `hooks/useGSAP.ts`, `components/ui/CountUp.tsx`
  and `components/ui/MarqueeText.tsx`, where every other call site uses
  `await import('gsap')`. `MarqueeText` is on the homepage.
- **Unused JavaScript, ~164KiB.** Affects Speed Index more than TBT, so expect
  a small gain.
- **Four font files on first load (161KiB).** Check every weight is used and
  that subsetting is tight — without disturbing the current CLS.
