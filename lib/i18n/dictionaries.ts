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
    caseStudy: string
  }
  caseStudy: {
    label: string
    back: string
    visitSite: string
    client: string
    role: string
    year: string
    stack: string
    problem: string
    forWho: string
    decisions: string
    gallery: string
    notDone: string
    wouldMeasure: string
    wouldRedo: string
    placeholder: string
    nextProject: string
    backHome: string
    keepScrolling: string
  }
  lab: {
    label: string
    title: string
    subtitle: string
    wannaSeeMore: string
    performanceTest: string
    engineeringNoteLabel: string
    engineeringNoteBody: string
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
    projects: 'Work',
    lab: 'Lab',
    contact: 'Contact',
    hireMe: 'HIRE ME',
  },
  hero: {
    label: 'Product Engineer',
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
    headline: 'Design instincts, shipped like an engineer.',
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
    caseStudy: 'CASE STUDY',
  },
  caseStudy: {
    label: 'CASE STUDY',
    back: 'PROJECTS',
    visitSite: 'VISIT LIVE SITE',
    client: 'CLIENT',
    role: 'ROLE',
    year: 'YEAR',
    stack: 'STACK',
    problem: 'The problem',
    forWho: 'Who this was for',
    decisions: 'Decisions made — and why',
    gallery: 'GALLERY',
    notDone: 'What I chose not to do',
    wouldMeasure: "What I'd measure",
    wouldRedo: "What I'd redo differently",
    placeholder: 'PLACEHOLDER — REAL CONTENT COMING',
    nextProject: 'NEXT PROJECT',
    backHome: 'BACK TO HOME',
    keepScrolling: 'KEEP SCROLLING',
  },
  lab: {
    label: 'ENGINEERING LAB',
    title: 'Built under constraint',
    subtitle: 'Hand-written rendering engines, tuned for the GPU budget they run on.',
    wannaSeeMore: 'WANNA SEE MORE?',
    performanceTest: 'PERFORMANCE TEST',
    engineeringNoteLabel: 'ENGINEERING NOTE',
    engineeringNoteBody:
      'LazyMotion — the textbook Framer Motion optimization — was implemented, measured, and reverted. Home first-load JS went 328 KB → 336 KB gzip: an 8 KB regression, not a win. Full trade-off write-up in the repo.',
  },
  contact: {
    label: "LET'S CREATE",
    line1: 'WORK',
    line2: 'TOGETHER',
    footer: '© 2026 Nguyen Minh — Crafted in Strasbourg',
    mapLabel: 'WHERE I AM',
    basedIn: 'Strasbourg, France — relocating to Hanoi, Vietnam',
    openTo: 'Open to remote work worldwide',
  },
}

const fr: Dictionary = {
  nav: {
    about: 'À propos',
    projects: 'Travail',
    lab: 'Lab',
    contact: 'Contact',
    hireMe: 'ME RECRUTER',
  },
  hero: {
    label: 'Product Engineer',
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
    headline: 'Des réflexes de designer, livrés comme un ingénieur.',
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
    caseStudy: 'ÉTUDE DE CAS',
  },
  caseStudy: {
    label: 'ÉTUDE DE CAS',
    back: 'PROJETS',
    visitSite: 'VOIR LE SITE LIVE',
    client: 'CLIENT',
    role: 'RÔLE',
    year: 'ANNÉE',
    stack: 'STACK',
    problem: 'Le problème',
    forWho: 'Pour qui',
    decisions: 'Décisions prises — et pourquoi',
    gallery: 'GALERIE',
    notDone: "Ce que j'ai choisi de ne pas faire",
    wouldMeasure: 'Ce que je mesurerais',
    wouldRedo: 'Ce que je referais autrement',
    placeholder: 'PLACEHOLDER — CONTENU À VENIR',
    nextProject: 'PROJET SUIVANT',
    backHome: 'RETOUR À L’ACCUEIL',
    keepScrolling: 'CONTINUE DE SCROLLER',
  },
  lab: {
    label: 'LAB D’INGÉNIERIE',
    title: 'Construit sous contrainte',
    subtitle: 'Moteurs de rendu écrits à la main, ajustés au budget GPU sur lequel ils tournent.',
    wannaSeeMore: 'EN VOIR PLUS ?',
    performanceTest: 'TEST DE PERFORMANCE',
    engineeringNoteLabel: 'NOTE D’INGÉNIERIE',
    engineeringNoteBody:
      'LazyMotion — l’optimisation canonique de Framer Motion — a été implémentée, mesurée, puis retirée. Le JS de premier chargement de la home est passé de 328 Ko à 336 Ko gzip : une régression de 8 Ko, pas un gain. Le raisonnement complet est consigné dans le dépôt.',
  },
  contact: {
    label: 'CRÉONS ENSEMBLE',
    line1: 'ELABORONS',
    line2: 'ENSEMBLE',
    footer: '© 2026 Nguyen Minh — Façonné à Strasbourg',
    mapLabel: 'OÙ JE SUIS',
    basedIn: 'Strasbourg, France — en cours de relocalisation à Hanoï, Vietnam',
    openTo: 'Ouvert au télétravail dans le monde entier',
  },
}

export const DICTIONARIES: Record<Locale, Dictionary> = { en, fr }
