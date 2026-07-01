# Portfolio — Nguyen Minh

Portfolio de développeur créatif construit avec **Next.js 16** (App Router) et **React 19**.
L'objectif : dépasser la simple page de présentation pour livrer une expérience interactive,
performante et bilingue (FR / EN), avec des animations et des simulations écrites à la main.

**Auteur :** Nguyen Minh — Creative Web Developer, Strasbourg.

---

## Stack technique

| Domaine        | Technologies                                                        |
| -------------- | ------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Server Components), React 19, TypeScript     |
| Style          | Tailwind CSS v4, variables CSS (thème clair / sombre)               |
| Animation      | GSAP + ScrollTrigger, Framer Motion                                 |
| Scroll         | Lenis (smooth scroll)                                               |
| 3D / WebGL     | Three.js, React Three Fiber, drei, postprocessing                  |
| Physique       | Matter.js                                                          |
| Génératif      | Simplex Noise, Canvas 2D                                            |
| i18n           | Provider de locale maison (FR / EN)                                 |

---

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # build de production
npm run start   # serveur de production
```

---

## Structure

```
app/                  Routes (page principale, /donut, /performancetest), layout, SEO
components/
  sections/           Hero, About, Services, Projects, Contact…
  lab/                Le « laboratoire » : simulations interactives (voir plus bas)
  three/              Scènes WebGL (Three.js)
  ui/                 Composants réutilisables (TiltCard, MagneticButton, SplitText…)
  providers/          Thème, locale, smooth scroll (Lenis)
lib/
  constants.ts        Données (projets, infos perso)
  i18n/               Traductions FR / EN
hooks/                Hooks maison (scroll, position souris, section active…)
```

---

## Réalisations « sans IA » — ma valeur ajoutée

Une partie du projet a été pensée et codée **par moi-même, sans génération IA**, notamment
**toutes les expériences de la section `Lab`** (`components/lab/`) et la **section `Projects`**
(`components/sections/Projects.tsx`). Voici les arguments qui montrent le raisonnement derrière
ce code — ce ne sont pas des composants « copiés-collés » mais des systèmes conçus à la main.

### 1. Section `Lab` — trois simulations écrites depuis zéro en Canvas 2D

La section `Lab` propose trois expériences interactives, chacune écrite comme une **classe TypeScript
autonome** avec son propre cycle de vie (`constructor` → `loop` → `pause` / `resume` → `destroy`) :

- **ASCII Fluid** (`AsciiFluid.ts`) — une carte de chaleur ASCII. J'ai implémenté moi-même la
  **diffusion gaussienne** de la chaleur autour du curseur (`Math.exp(-(dx²+dy²)/(2σ²))`), le
  refroidissement image par image (`heat *= 0.95`), et l'interpolation de couleur `COOL → HOT`.
  Le choix du caractère (`. , - ~ : ; = ! * # @`) est calculé en fonction de la densité de chaleur.

- **Physics Particles** (`PhysicsParticles.ts`) — simulation physique avec Matter.js, mais toute
  la logique d'interaction est maison : **drag & throw** avec calcul de vélocité lissée
  (filtre exponentiel `alpha`), **explosion radiale** (force ∝ distance), et un support **gyroscope**
  qui mappe l'inclinaison de l'appareil sur la gravité (`DeviceMotionEvent`).

- **Generative Flow Field** (`GenerativeFlowField.ts`) — 3000 particules qui suivent un champ de
  vecteurs guidé par du **bruit de Simplex 3D**. J'ai codé le **PRNG à graine** (générateur
  congruentiel linéaire) pour rendre chaque œuvre reproductible, le fondu des traînées, et
  l'export de l'image via **Web Share API** (long press sur mobile).

### 2. Un vrai souci de l'architecture et du cycle de vie

Chaque expérience expose la même interface (`pause`, `resume`, `destroy`). Dans `LabSection.tsx`,
un **IntersectionObserver** couplé à l'événement `visibilitychange` fait que :

- rien n'est initialisé tant que la section n'est pas proche du viewport (lazy init) ;
- la boucle `requestAnimationFrame` **se met en pause hors écran ou onglet caché** — donc zéro
  calcul GPU inutile ;
- les expériences sont **chargées à la demande** (`import()` dynamique) et le nombre de particules
  s'adapte à la puissance du GPU (`detect-gpu`).

Ce n'est pas juste « faire bouger des pixels » : c'est une gestion mémoire et performance pensée
pour ne pas dégrader le reste de la page.

### 3. Section `Projects` — scroll horizontal piloté au scroll vertical

Dans `Projects.tsx`, j'ai construit un **scroll horizontal** : la section est *pinée* et la
distance de scroll vertical est convertie en translation horizontale de la piste de cartes
(`x: -(track.scrollWidth - window.innerWidth)`). J'ai géré les points délicats moi-même :

- **parallaxe par carte** — chaque image dérive en sens inverse (`xPercent -8 → 8`) pour donner
  de la profondeur ;
- **recalcul au resize** (`invalidateOnRefresh`, `end` calculé dynamiquement) pour que ça tienne
  sur toutes les tailles d'écran ;
- des cartes qui **ne débordent jamais** du viewport sur petit écran (l'image se compresse pour
  laisser la place au contenu et au CTA).

### 4. Détails d'ingénierie soignés (transverses)

- **Coordonnées DPR-safe** : dans les canvas, la physique travaille en pixels CSS et le contexte
  est mis à l'échelle par `devicePixelRatio` — les particules ne se retrouvent jamais « coincées »
  quand la barre d'adresse mobile apparaît/disparaît.
- **Nettoyage rigoureux** : chaque `destroy()` retire tous les listeners, stoppe les runners
  Matter.js et libère les `requestAnimationFrame` — aucune fuite mémoire au démontage React.
- **Accessibilité / mobile** : hints contextuels desktop vs mobile, `prefers-reduced-motion`
  respecté sur les marquees, vibration haptique sur les explosions tactiles.

---

## Autres points notables

- **Bilingue FR / EN** via un provider de locale maison et un fichier de traductions.
- **Thème clair / sombre** avec `next-themes` et variables CSS.
- **Optimisation des performances** : polices auto-hébergées (`next/font`), images AVIF,
  canvas WebGL mis en pause hors écran (voir `PERF_AUDIT_RESULTS.md`).
- **SEO** : `sitemap.ts`, `robots.ts`, métadonnées et favicon générés côté App Router.
- Pages bonus interactives : `/donut` (rendu 3D) et `/performancetest` (flow field WebGL).

---

## Auteur

**Nguyen Minh** — Creative Web Developer
[Portfolio](https://nguyen-minh.dev) · [GitHub](https://github.com/minhouuuuuu) · [LinkedIn](https://www.linkedin.com/in/minh-nguyen-a16293227/)
