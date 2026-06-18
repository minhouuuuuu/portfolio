// ─── i18n dictionaries ────────────────────────────────────────────────────────
// Single-page portfolio → lightweight client-side dictionary (no routing).
// Keep keys flat-ish and grouped by section for readability.

export type Locale = 'en' | 'fr'

export const LOCALES: Locale[] = ['en', 'fr']
export const DEFAULT_LOCALE: Locale = 'en'

export const CV_FILES: Record<Locale, string> = {
  en: '/CV_NGUYEN_EN.pdf',
  fr: '/CV_NGUYEN.pdf',
}

export interface Dictionary {
  nav: {
    about: string
    services: string
    projects: string
    lab: string
    contact: string
    hireMe: string
  }
  hero: {
    label: string
    available: string
    availableShort: string
    subtitle1: string
    subtitle2: string
    viewProjects: string
    downloadCv: string
    currentlyAt: string
    trustedBy: string
    scroll: string
  }
  about: {
    label: string
    headline: string
    body1Pre: string
    body1Post: string
    body2: string
    stats: { yrsExp: string; projects: string; countries: string }
  }
  services: {
    label: string
    title: string
    titleStroke: string
    items: { title: string; description: string }[]
  }
  projects: {
    label: string
    title: string
    visit: string
    soon: string
  }
  lab: {
    label: string
    title: string
    subtitle: string
    wannaSeeMore: string
    performanceTest: string
  }
  contact: {
    label: string
    line1: string
    line2: string
    footer: string
    mapLabel: string
    basedIn: string
    openTo: string
  }
}

const en: Dictionary = {
  nav: {
    about: 'About',
    services: 'Services',
    projects: 'Projects',
    lab: 'Lab',
    contact: 'Contact',
    hireMe: 'HIRE ME',
  },
  hero: {
    label: 'Creative Developer',
    available: 'Open to work',
    availableShort: 'Available',
    subtitle1: 'Crafting immersive web experiences',
    subtitle2: 'with code & creativity.',
    viewProjects: 'VIEW PROJECTS ↗',
    downloadCv: 'DOWNLOAD CV',
    currentlyAt: 'Currently at',
    trustedBy: 'Trusted by',
    scroll: 'SCROLL',
  },
  about: {
    label: 'ABOUT ME',
    headline: 'A developer who thinks like a designer.',
    body1Pre:
      'Based in Strasbourg, France. Currently crafting production-grade experiences at ',
    body1Post: '.',
    body2:
      'I live at the intersection of code and creativity, turning complex ideas into fluid digital experiences — shipped to real clients, in real production.',
    stats: { yrsExp: 'YRS EXP', projects: 'CLIENTS', countries: 'COUNTRIES' },
  },
  services: {
    label: 'WHAT I CRAFT',
    title: 'SERVICES',
    titleStroke: '& CRAFT',
    items: [
      {
        title: '3D & WebGL',
        description:
          'Immersive browser experiences built atom by atom. Particle fields, interactive geometry, custom shaders — the browser as a canvas with no limits.',
      },
      {
        title: 'Motion & Interaction',
        description:
          'Animation that earns its place. Scroll choreography, spring physics, micro-interactions — every state transition deliberate and intentional.',
      },
      {
        title: 'Creative Engineering',
        description:
          'Production React applications with a designer’s eye. Performance, accessibility, and visual craft — without choosing between them.',
      },
    ],
  },
  projects: {
    label: 'SELECTED WORK',
    title: 'PROJECTS',
    visit: 'VISIT',
    soon: 'SOON',
  },
  lab: {
    label: 'INTERACTIVE LAB',
    title: 'In motions',
    subtitle: 'Touch it. Break it. Make it yours.',
    wannaSeeMore: 'WANNA SEE MORE?',
    performanceTest: 'PERFORMANCE TEST',
  },
  contact: {
    label: "LET'S CREATE",
    line1: 'WORK',
    line2: 'TOGETHER',
    footer: '© 2026 Nguyen Minh — Crafted in Strasbourg',
    mapLabel: 'WHERE I AM',
    basedIn: 'Based in Strasbourg, France',
    openTo: 'Open to relocate & work anywhere across Europe',
  },
}

const fr: Dictionary = {
  nav: {
    about: 'À propos',
    services: 'Services',
    projects: 'Projets',
    lab: 'Lab',
    contact: 'Contact',
    hireMe: 'ME RECRUTER',
  },
  hero: {
    label: 'Développeur Créatif',
    available: 'Disponible',
    availableShort: 'Dispo',
    subtitle1: 'Je façonne des expériences web immersives',
    subtitle2: 'à la croisée du code & de la créativité.',
    viewProjects: 'VOIR LES PROJETS ↗',
    downloadCv: 'TÉLÉCHARGER LE CV',
    currentlyAt: 'Actuellement chez',
    trustedBy: 'Ils m’ont fait confiance',
    scroll: 'DÉFILER',
  },
  about: {
    label: 'À PROPOS',
    headline: 'Un développeur qui pense comme un designer.',
    body1Pre:
      'Basé à Strasbourg, France. Je conçois des expériences en production chez ',
    body1Post: '.',
    body2:
      'Je vis à l’intersection du code et de la créativité, transformant des idées complexes en expériences digitales fluides — livrées à de vrais clients, en vraie production.',
    stats: { yrsExp: 'ANS D’EXP', projects: 'CLIENTS', countries: 'PAYS' },
  },
  services: {
    label: 'CE QUE JE FAÇONNE',
    title: 'SERVICES',
    titleStroke: '& CRAFT',
    items: [
      {
        title: '3D & WebGL',
        description:
          'Des expériences immersives construites atome par atome. Champs de particules, géométrie interactive, shaders sur-mesure — le navigateur comme une toile sans limites.',
      },
      {
        title: 'Motion & Interaction',
        description:
          'Une animation qui mérite sa place. Chorégraphie de scroll, physique de ressort, micro-interactions — chaque transition pensée et intentionnelle.',
      },
      {
        title: 'Ingénierie Créative',
        description:
          'Des applications React de production avec l’œil d’un designer. Performance, accessibilité et craft visuel — sans avoir à choisir.',
      },
    ],
  },
  projects: {
    label: 'PROJETS SÉLECTIONNÉS',
    title: 'PROJETS',
    visit: 'VISITER',
    soon: 'BIENTÔT',
  },
  lab: {
    label: 'LAB INTERACTIF',
    title: 'En mouvement',
    subtitle: 'Touche. Casse. Approprie-toi-le.',
    wannaSeeMore: 'EN VOIR PLUS ?',
    performanceTest: 'TEST DE PERFORMANCE',
  },
  contact: {
    label: 'CRÉONS ENSEMBLE',
    line1: 'TRAVAILLONS',
    line2: 'ENSEMBLE',
    footer: '© 2026 Nguyen Minh — Façonné à Strasbourg',
    mapLabel: 'OÙ JE SUIS',
    basedIn: 'Basé à Strasbourg, France',
    openTo: 'Ouvert à la mobilité partout en Europe',
  },
}

export const DICTIONARIES: Record<Locale, Dictionary> = { en, fr }
