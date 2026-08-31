export const PERSONAL_INFO = {
  name: 'Nguyen Minh',
  role: 'Creative Web Developer',
  company: 'IZHAK INTERACT AGENCY',
  location: 'Strasbourg, France',
  email: 'minhstrasbourg@gmail.com',
  github: 'https://github.com/minhouuuuuu',
  linkedin: 'https://www.linkedin.com/in/nguyen-minh-dev',
  instagram: 'https://www.instagram.com/nguyen__minh/',
  portfolio: 'https://nguyen-minh.dev',
  available: true,
}

export const BIO = `Based in Strasbourg, France. Creative Developer at IZHAK INTERACT AGENCY.
I live at the intersection of code and creativity, building immersive digital experiences
that push the boundaries of what's possible on the web.`

// Per-project copy is localized. `description` carries both EN + FR;
// the Projects component picks the active locale. `role` signals scope to
// recruiters (agency client work vs. personal craft).
export const PROJECTS = [
  {
    id: 1,
    title: 'ASKAR',
    year: '2026',
    tags: ['Next.js', 'Lenis', 'Framer Motion', '3D'],
    role: { en: 'Personal · Lead front-end', fr: 'Personnel · Lead front-end' },
    description: {
      en: 'Immersive site for a travel agency — cinematic scroll transitions and 3D animations that turn browsing into a journey.',
      fr: 'Site immersif pour une agence de voyage — transitions de scroll cinématiques et animations 3D qui transforment la navigation en voyage.',
    },
    link: 'https://askar-site.vercel.app/',
    caseStudy: 'askar',
    color: '#c8ff00',
    image: '/photo/askar.png',
  },
  {
    id: 2,
    title: 'FILEDROP',
    year: '2025',
    tags: ['Next.js', 'TypeScript', 'Firebase', 'Clerk', 'Zustand'],
    role: { en: 'Personal · Full-stack', fr: 'Personnel · Full-stack' },
    description: {
      en: 'A Dropbox-style file storage app — authentication, uploads, and folder management rebuilt from the ground up.',
      fr: 'Une application de stockage de fichiers façon Dropbox — authentification, uploads et gestion de dossiers reconstruits de zéro.',
    },
    link: 'https://nguyen-minh-dropbox-clone.vercel.app/',
    caseStudy: 'filedrop',
    color: '#0061ff',
    image: '/photo/dropbox.png',
  },
  {
    id: 3,
    title: 'ART',
    year: '2024',
    tags: ['Next.js', 'GSAP', 'Lenis'],
    role: { en: 'Personal · Creative R&D', fr: 'Personnel · R&D créative' },
    description: {
      en: 'A personal art direction study — cinematic scroll choreography pushing typography and motion as the main subject.',
      fr: 'Une étude de direction artistique personnelle — chorégraphie de scroll cinématique où typographie et motion deviennent le sujet.',
    },
    link: 'https://nguyen-minh-fashion.vercel.app',
    color: '#ff6b35',
    image: '/photo/art.png',
  },
  {
    id: 4,
    title: 'BRASSERIE LICORNE',
    year: '2025',
    tags: ['PHP', 'Tailwind', 'GSAP', 'Agency'],
    role: {
      en: 'Agency · Front-end & motion',
      fr: 'Agence · Front-end & motion',
    },
    description: {
      en: 'Production site for a historic French brewery. Custom GSAP animations carrying a 150-year heritage into a modern interface.',
      fr: "Site en production pour une brasserie française historique. Animations GSAP sur-mesure portant 150 ans d'héritage dans une interface moderne.",
    },
    link: 'https://www.brasserielicorne.com/',
    caseStudy: 'brasserie-licorne',
    color: '#7b61ff',
    image: '/photo/licorne.png',
  },
  {
    id: 9,
    title: 'WATTWILLER',
    year: '2024',
    tags: ['Web Components', 'Custom Elements', 'Agency'],
    role: {
      en: 'Agency · Front-end & motion architecture',
      fr: 'Agence · Front-end & architecture motion',
    },
    description: {
      en: 'A non-intrusive animation layer built as custom web components — used 90+ times across 32 templates, each tearing down its own animations on disconnect.',
      fr: "Une couche d'animation non intrusive en composants web personnalisés — utilisée 90+ fois dans 32 gabarits, chacun démontant ses propres animations à la déconnexion.",
    },
    link: 'https://www.wattwiller.com/',
    caseStudy: 'wattwiller',
    color: '#00c2a8',
    image: '/photo/wattwiller.png',
  },
  {
    id: 5,
    title: 'SALPA',
    year: '2025',
    tags: ['PHP', 'Tailwind', 'GSAP', 'Agency'],
    role: { en: 'Agency · Front-end', fr: 'Agence · Front-end' },
    description: {
      en: 'Production site for a catering company. Clean editorial layout with fluid scroll interactions, shipped for a real client.',
      fr: 'Site en production pour une entreprise de restauration. Mise en page éditoriale épurée et interactions de scroll fluides, livré pour un vrai client.',
    },
    link: 'https://salpa-restauration.fr/',
    color: '#c8ff00',
    image: '/photo/salpa.png',
  },
  {
    id: 6,
    title: 'GRILLI',
    year: '2023',
    tags: ['HTML', 'CSS', 'JavaScript'],
    role: { en: 'Personal · Front-end', fr: 'Personnel · Front-end' },
    description: {
      en: 'A restaurant concept built from scratch in vanilla JS — proof that craft and polish do not require a framework.',
      fr: 'Un concept de restaurant codé de zéro en JS vanilla — la preuve que le craft et la finition ne nécessitent pas de framework.',
    },
    link: 'https://nguyen-minh-restaurant.vercel.app/',
    color: '#ff3d71',
    image: '/photo/grilli.png',
  },
  {
    id: 7,
    title: 'EPIC SAAS',
    year: '2023',
    tags: ['Next.js', 'Supabase', 'Tailwind'],
    role: { en: 'Personal · Full-stack', fr: 'Personnel · Full-stack' },
    description: {
      en: 'A full SaaS product with authentication and subscription management — front to back, end to end.',
      fr: "Un produit SaaS complet avec authentification et gestion d'abonnements — du front au back, de bout en bout.",
    },
    link: 'https://nguyen-minh-saas-project.vercel.app/',
    color: '#00d4ff',
    image: '/photo/epic-saas.png',
  },
  {
    id: 8,
    title: 'NEXT DROP',
    year: 'SOON',
    tags: ['WIP', 'Lab'],
    role: { en: 'In the works', fr: 'En préparation' },
    description: {
      en: 'More wild projects on the way — in the meantime, dive into the Lab.',
      fr: "D'autres projets fous arrivent — en attendant, plonge dans le Lab.",
    },
    link: null,
    comingSoon: true,
    color: '#e879f9',
    image: '/photo/upcoming.png',
  },
]

export const SKILLS = {
  frontend: [
    { name: 'React JS', level: 95 },
    { name: 'Next.js', level: 90 },
    { name: 'TypeScript', level: 85 },
    { name: 'TailwindCSS', level: 90 },
    { name: 'HTML / CSS', level: 98 },
  ],
  animation: [
    { name: 'GSAP', level: 90 },
    { name: 'Framer Motion', level: 88 },
    { name: 'Three.js / R3F', level: 75 },
    { name: 'Lenis', level: 95 },
  ],
  backend: [
    { name: 'NestJS', level: 70 },
    { name: 'Express', level: 72 },
    { name: 'Supabase', level: 80 },
  ],
  design: [
    { name: 'Figma', level: 85 },
    { name: 'UI Design', level: 80 },
  ],
}

export const TECH_STACK = [
  'React',
  'Next.js',
  'TypeScript',
  'GSAP',
  'Three.js',
  'Framer Motion',
  'TailwindCSS',
  'Lenis',
  'Supabase',
  'NestJS',
  'Figma',
  'Node.js',
]

export const STATS = [
  { value: 4, suffix: '+', label: 'YRS EXP' },
  { value: 20, suffix: '+', label: 'PROJECTS' },
  { value: 3, suffix: '', label: 'COUNTRIES' },
]

export const NAV_LINKS = [
  { label: 'Work', href: '#projects' },
  { label: 'About', href: '#about' },
  { label: 'Lab', href: '#lab' },
  { label: 'Contact', href: '#contact' },
]
