/**
 * Single source of truth for the contact map's markers.
 *
 * Imported both by `scripts/generate-dotted-map.mjs`, which projects these
 * lat/lng pairs to SVG coordinates at build time, and (for its type) by the
 * rendering code. Editing this file and re-running `npm run generate:map` is
 * the whole update path — there is deliberately no second copy anywhere.
 */

export interface Marker {
  lat: number
  lng: number
  size?: number
  /** Markers pulse unless they explicitly opt out. */
  pulse?: boolean
}

/** Two pulsing home bases — relocating Strasbourg → Hanoi. */
export const HOMES: Marker[] = [
  { lat: 48.5734, lng: 7.7521, size: 0.9, pulse: true }, // Strasbourg
  { lat: 21.0278, lng: 105.8342, size: 0.9, pulse: true }, // Hanoi
]

/**
 * Surrounding hubs spanning every inhabited continent, to signal "open to
 * remote work worldwide" rather than a single region.
 */
export const WORLD_HUBS: Marker[] = [
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

/** The full marker set, in the order the map draws them. */
export const MARKERS: Marker[] = [
  ...HOMES,
  ...WORLD_HUBS.map((m) => ({ ...m, size: 0.45 })),
]
