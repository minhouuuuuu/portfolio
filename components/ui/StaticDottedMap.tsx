'use client'

import {
  DOT_PATH,
  DOT_RADIUS,
  MAP_HEIGHT,
  MAP_WIDTH,
  MARKERS,
} from '@/lib/generated/dotted-map'

/**
 * Build-time equivalent of `DottedMap` for the Contact section.
 *
 * `DottedMap` (vendored magicui, kept untouched as the reference
 * implementation) projects the map on every render and emits one <circle> per
 * dot — ~1,833 nodes and a multi-second synchronous task. The geometry is
 * identical on every load, so it is precomputed by
 * `scripts/generate-dotted-map.mjs` and consumed here.
 *
 * The dot field collapses to a single <path>; markers stay discrete because
 * they use a different colour and each carries two pulsing rings. Node count
 * goes from ~1,878 to 46.
 *
 * Rendered inline rather than as an <img> so the dots and markers keep
 * inheriting `var(--text-muted)` / `var(--accent)` and follow the theme.
 */
export function StaticDottedMap({
  dotColor = 'currentColor',
  markerColor = '#FF6900',
  className,
}: {
  dotColor?: string
  markerColor?: string
  className?: string
}) {
  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      className={className}
      style={{ width: '100%', height: '100%' }}
      // Decorative: the surrounding caption already states the locations in
      // text, so exposing 1,833 anonymous dots to a screen reader would add
      // noise without information.
      aria-hidden="true"
      focusable="false"
    >
      <path d={DOT_PATH} fill={dotColor} />

      {MARKERS.map((m, i) => {
        const pulseTo = Number((m.size * 2.8).toFixed(2))
        return (
          <g key={i}>
            <circle cx={m.x} cy={m.y} r={m.size} fill={markerColor} />
            {m.pulse ? (
              <g pointerEvents="none">
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={m.size}
                  fill="none"
                  stroke={markerColor}
                  strokeOpacity={1}
                  strokeWidth={0.35}
                >
                  <animate
                    attributeName="r"
                    values={`${m.size};${pulseTo}`}
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="1;0"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={m.size}
                  fill="none"
                  stroke={markerColor}
                  strokeOpacity={0.9}
                  strokeWidth={0.3}
                >
                  <animate
                    attributeName="r"
                    values={`${m.size};${pulseTo}`}
                    dur="1.4s"
                    begin="0.7s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.9;0"
                    dur="1.4s"
                    begin="0.7s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}

export { DOT_RADIUS }
