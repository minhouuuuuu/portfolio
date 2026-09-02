/**
 * Build-time generator for the Contact section's world map.
 *
 * Why this exists
 * ---------------
 * `components/ui/DottedMap.tsx` (vendored magicui) calls `createMap()` at
 * render time and emits one <circle> per point. On this site that is ~4s of
 * synchronous work in Node and 1,833 DOM nodes — 79% of the homepage's
 * elements — for a picture that is identical on every load. It was the single
 * cause of a 2.4s (desktop) / 9.8s (mobile) blocking task.
 *
 * The map geometry never changes, so it is computed here once at build time
 * into lib/generated/dotted-map.ts: the dot field as ONE SVG path `d` string,
 * consumed by an inline <svg>.
 *
 * A standalone public/dotted-map.svg served via <img> was also built and
 * measured. It was marginally faster (desktop TBT 9ms vs 18ms, mobile 444ms
 * vs 532ms — inside run-to-run variance) and shipped 109KB less HTML, but an
 * <img> renders in an isolated document and cannot inherit
 * var(--text-muted) / var(--accent), so the map would stop following the
 * light/dark theme. Inline SVG was kept: the theme is worth more than ~2% of
 * the recovered blocking time.
 *
 * The stagger maths below is a deliberate transcription of DottedMap.tsx so
 * the output is pixel-identical to the component it replaces. If the vendored
 * component is ever updated, re-run this script.
 *
 * Run: node scripts/generate-dotted-map.mjs
 */
import { createMap } from 'svg-dotted-map'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Must match the props ContactMap passes to DottedMap.
const WIDTH = 150
const HEIGHT = 75
const MAP_SAMPLES = 5000
const DOT_RADIUS = 0.2
const STAGGER = true

// Coordinates are rounded to 2dp: the SVG is 150 units wide displayed at
// ~768px, so 1 unit ≈ 5px and 0.01 unit ≈ 0.05px — far below one device pixel,
// but it cuts the path string roughly in half versus full float precision.
const PRECISION = 2
const r = (n) => Number(n.toFixed(PRECISION))

const { points, addMarkers } = createMap({
  width: WIDTH,
  height: HEIGHT,
  mapSamples: MAP_SAMPLES,
})

/**
 * Row-stagger offsets, transcribed from DottedMap.tsx.
 *
 * Points are sorted by (y, x); each distinct y is a row, and odd-indexed rows
 * are nudged right by half the smallest horizontal gap found in any row. This
 * is what gives the field its honeycomb look rather than a square grid.
 */
function computeStagger(pts) {
  const sorted = [...pts].sort((a, b) => a.y - b.y || a.x - b.x)
  const rowMap = new Map()
  let step = 0
  let prevY = Number.NaN
  let prevXInRow = Number.NaN

  for (const p of sorted) {
    if (p.y !== prevY) {
      prevY = p.y
      prevXInRow = Number.NaN
      if (!rowMap.has(p.y)) rowMap.set(p.y, rowMap.size)
    }
    if (!Number.isNaN(prevXInRow)) {
      const delta = p.x - prevXInRow
      if (delta > 0) step = step === 0 ? delta : Math.min(step, delta)
    }
    prevXInRow = p.x
  }

  return { xStep: step || 1, yToRowIndex: rowMap }
}

const { xStep, yToRowIndex } = computeStagger(points)

const offsetFor = (y) => ((yToRowIndex.get(y) ?? 0) % 2 === 1 && STAGGER ? xStep / 2 : 0)

/**
 * Emit every dot as a single path of independent subpaths.
 *
 * Each dot is two arcs forming a full circle, then `z`. Using one path instead
 * of 1,833 <circle> elements is the whole point: the browser gets one node to
 * style, lay out and composite rather than one per dot.
 */
function buildDotPath(pts, radius) {
  const rad = r(radius)
  const d = []
  for (const p of pts) {
    const cx = r(p.x + offsetFor(p.y))
    const cy = r(p.y)
    // Move to the left edge of the dot, arc over the top, arc back under.
    d.push(`M${r(cx - radius)} ${cy}a${rad} ${rad} 0 1 0 ${r(radius * 2)} 0a${rad} ${rad} 0 1 0 ${r(-radius * 2)} 0z`)
  }
  return d.join('')
}

const dotPath = buildDotPath(points, DOT_RADIUS)

// ── Markers ────────────────────────────────────────────────────────────────
// Kept as discrete elements (not folded into the path) because they are a
// different colour from the dot field and two of them pulse. Their positions
// are still resolved here so the browser never projects lat/lng at runtime.
const HOMES = [
  { lat: 48.5734, lng: 7.7521, size: 0.9, pulse: true }, // Strasbourg
  { lat: 21.0278, lng: 105.8342, size: 0.9, pulse: true }, // Hanoi
]
const WORLD_HUBS = [
  { lat: 51.5074, lng: -0.1278 }, // London
  { lat: 52.52, lng: 13.405 }, // Berlin
  { lat: 40.4168, lng: -3.7038 }, // Madrid
  { lat: 52.3676, lng: 4.9041 }, // Amsterdam
  { lat: 59.3293, lng: 18.0686 }, // Stockholm
  { lat: 1.3521, lng: 103.8198 }, // Singapore
  { lat: 13.7563, lng: 100.5018 }, // Bangkok
  { lat: 35.6762, lng: 139.6503 }, // Tokyo
  { lat: 22.3193, lng: 114.1694 }, // Hong Kong
  { lat: -33.8688, lng: 151.2093 }, // Sydney
  { lat: 40.7128, lng: -74.006 }, // New York
  { lat: 37.7749, lng: -122.4194 }, // San Francisco
  { lat: -23.5505, lng: -46.6333 }, // São Paulo
]

const MARKERS = [...HOMES, ...WORLD_HUBS.map((m) => ({ ...m, size: 0.45 }))]

const placed = addMarkers(MARKERS).map((m) => ({
  x: r(m.x + offsetFor(m.y)),
  y: r(m.y),
  size: m.size ?? DOT_RADIUS,
  // ContactMap passes `pulse`, so the component's rule is: pulse unless the
  // marker explicitly opts out.
  pulse: m.pulse !== false,
}))

// ── Artefact 1: TS module for the inline-SVG component ─────────────────────
const ts = `// GENERATED by scripts/generate-dotted-map.mjs — do not edit by hand.
// Re-run \`node scripts/generate-dotted-map.mjs\` to regenerate.
//
// Precomputed geometry for the Contact world map. Replaces a ~4s runtime
// createMap() call and ${points.length} <circle> nodes with one path string.

export const MAP_WIDTH = ${WIDTH}
export const MAP_HEIGHT = ${HEIGHT}
export const DOT_RADIUS = ${DOT_RADIUS}

/** ${points.length} dots as a single path: one subpath (two arcs) per dot. */
export const DOT_PATH =
  '${dotPath}'

export interface PlacedMarker {
  x: number
  y: number
  size: number
  pulse: boolean
}

/** Marker positions already projected from lat/lng at build time. */
export const MARKERS: PlacedMarker[] = ${JSON.stringify(placed, null, 2)}
`

mkdirSync(resolve(ROOT, 'lib/generated'), { recursive: true })
writeFileSync(resolve(ROOT, 'lib/generated/dotted-map.ts'), ts)

console.log(`dots           : ${points.length}`)
console.log(`path length    : ${(dotPath.length / 1024).toFixed(1)} KB`)
console.log(`markers        : ${placed.length} (${placed.filter((m) => m.pulse).length} pulsing)`)
console.log(`wrote          : lib/generated/dotted-map.ts`)
