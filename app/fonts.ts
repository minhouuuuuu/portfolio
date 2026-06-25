import localFont from 'next/font/local'

// Self-hosted via next/font/local: Next fingerprints + serves these from our
// own origin, injects a metric-matched fallback (`size-adjust`) to remove the
// font-swap CLS, and preloads the display family (the hero headline = LCP).
//
// We only register weights actually used in the UI. The italic Monument face
// was declared in CSS but never used, so it's dropped.

export const monument = localFont({
  src: [
    { path: '../public/fonts/PPMonumentExtended-Light.otf', weight: '300', style: 'normal' },
    { path: '../public/fonts/PPMonumentExtended-Regular.otf', weight: '400', style: 'normal' },
    { path: '../public/fonts/PPMonumentExtended-Black.otf', weight: '900', style: 'normal' },
  ],
  variable: '--font-monument',
  display: 'swap',
  preload: true,
  fallback: ['sans-serif'],
})

export const neueMachina = localFont({
  src: [
    { path: '../public/fonts/PPNeueMachina-InktrapLight.otf', weight: '300', style: 'normal' },
    { path: '../public/fonts/PPNeueMachina-InktrapRegular.otf', weight: '400', style: 'normal' },
    { path: '../public/fonts/PPNeueMachina-InktrapUltrabold.otf', weight: '800', style: 'normal' },
  ],
  variable: '--font-neue',
  display: 'swap',
  // Body/mono font is mostly below the hero; let it follow the display preload.
  preload: false,
  fallback: ['monospace'],
})
