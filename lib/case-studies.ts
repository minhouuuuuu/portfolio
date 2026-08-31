// ─── Case studies ─────────────────────────────────────────────────────────────
// Decision-first structure: problem → for whom → decisions made and why →
// what I chose not to do → what I'd measure → what I'd redo differently.
// Rendered at /projects/[slug].

import type { Locale } from '@/lib/i18n/dictionaries'

export interface CaseStudyDecision {
  decision: Record<Locale, string>
  why: Record<Locale, string>
}

export interface CaseStudyNotDone {
  choice: Record<Locale, string>
  reason: Record<Locale, string>
}

export interface CaseStudyStat {
  value: string
  label: Record<Locale, string>
}

export interface CaseStudy {
  slug: string
  title: string
  titleStroke: string
  year: string
  client: Record<Locale, string>
  role: Record<Locale, string>
  stack: string[]
  color: string
  image: string
  liveUrl: string | null
  metaDescription: string

  // ── 01 — The problem ────────────────────────────────────────────────────
  problem: Record<Locale, string[]>
  forWho: Record<Locale, string>

  // ── 02 — Decisions made, and why ────────────────────────────────────────
  decisions: CaseStudyDecision[]

  // ── 03 — What I chose not to do ─────────────────────────────────────────
  notDone: CaseStudyNotDone[]

  // ── 04 — What I'd measure ───────────────────────────────────────────────
  wouldMeasure: CaseStudyStat[]
  wouldMeasureBody: Record<Locale, string>

  // ── 05 — What I'd redo differently ──────────────────────────────────────
  wouldRedo: Record<Locale, string>
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'askar',
    title: 'ASKAR',
    titleStroke: 'CASE STUDY',
    year: '2026',
    client: { en: 'Personal project', fr: 'Projet personnel' },
    role: { en: 'Lead front-end', fr: 'Lead front-end' },
    stack: ['Next.js', 'Sanity CMS', 'GROQ', 'i18n'],
    color: '#c8ff00',
    image: '/photo/askar.png',
    liveUrl: 'https://askar-site.vercel.app/',
    metaDescription:
      'Disintermediating a Kyrgyz family trekking agency from platforms taking 40-60% commission — a scoping and content-architecture case study.',

    problem: {
      en: [
        'A family-run trekking agency in Kyrgyzstan was losing 40-60% of every booking to intermediary platforms — commission that made the difference between a sustainable business and a struggling one.',
        'The obvious fix looks like "build a booking site." The real constraint was different: trust, not payment friction, is what stops a family from wiring money to a stranger for a multi-week trek abroad.',
      ],
      fr: [
        'Une agence de trek familiale kirghize perdait 40 à 60 % de chaque réservation au profit de plateformes intermédiaires — une commission qui fait la différence entre une activité viable et une activité qui survit.',
        "La solution évidente ressemble à « construire un site de réservation ». La vraie contrainte était différente : c'est la confiance, pas le frein au paiement, qui empêche une famille de virer de l'argent à un inconnu pour un trek de plusieurs semaines à l'étranger.",
      ],
    },
    forWho: {
      en: 'A small agency owner who needed to own the customer relationship again, without pretending to be a bigger company than it is. Before any code, the project started with a full scoping pass: stakeholder mapping, personas, a SWOT, 9 risks scored by criticality, a MoSCoW backlog, a 36-person-day estimate, budget, and a C4 architecture diagram — the kind of groundwork that decides whether "no online payment" is a defensible call or just a guess.',
      fr: "Un propriétaire de petite agence qui avait besoin de reprendre la relation client, sans prétendre être une entreprise plus grande qu'elle ne l'est. Avant la moindre ligne de code, le projet a démarré par un cadrage complet : cartographie des parties prenantes, personas, SWOT, 9 risques cotés par criticité, backlog MoSCoW, estimation à 36 jours-homme, budget, et un diagramme d'architecture C4 — le travail de fond qui décide si « pas de paiement en ligne » est un choix défendable ou juste un pari.",
    },

    decisions: [
      {
        decision: {
          en: 'No online payment. Booking routes through WhatsApp instead.',
          fr: 'Pas de paiement en ligne. La réservation passe par WhatsApp.',
        },
        why: {
          en: 'If the real friction is trust, adding a payment form does not remove it — it just adds a second thing to trust (the site, and the transaction). A WhatsApp conversation lets the agency answer questions, sound human, and close the sale the way trust actually gets built for this kind of purchase.',
          fr: "Si le vrai frein est la confiance, ajouter un formulaire de paiement ne le supprime pas — ça ajoute une deuxième chose à faire confiance (le site, et la transaction). Une conversation WhatsApp permet à l'agence de répondre aux questions, de sonner humain, et de conclure la vente de la façon dont la confiance se construit réellement pour ce type d'achat.",
        },
      },
      {
        decision: {
          en: 'A content layer that degrades field by field: CMS → JSON fallback, active locale → English fallback.',
          fr: 'Une couche de contenu qui dégrade champ par champ : CMS → repli JSON, locale active → repli anglais.',
        },
        why: {
          en: 'A single missing field in one language should never take down a page. Each field resolves independently — if the CMS is down or a translation is missing, the site falls back silently instead of rendering broken or empty.',
          fr: "Un seul champ manquant dans une langue ne doit jamais faire tomber une page. Chaque champ se résout indépendamment — si le CMS est indisponible ou qu'une traduction manque, le site se replie silencieusement au lieu de s'afficher cassé ou vide.",
        },
      },
      {
        decision: {
          en: 'A typed translation registry derived from the English source — 349 keys × 11 languages, 3,839 strings. A missing key is a build error, not a runtime surprise.',
          fr: "Un registre de traduction typé dérivé de la source anglaise — 349 clés × 11 langues, 3 839 chaînes. Une clé manquante est une erreur de build, pas une surprise en production.",
        },
        why: {
          en: 'At 11 languages, a missing translation silently falling back to a blank string is the kind of bug nobody notices until a real visitor hits it. Moving that failure to build time means it gets caught before it ships, not after.',
          fr: "À 11 langues, une traduction manquante qui se replie silencieusement sur une chaîne vide est le genre de bug que personne ne remarque avant qu'un vrai visiteur ne tombe dessus. Déplacer cet échec au moment du build permet de l'attraper avant l'envoi en production, pas après.",
        },
      },
      {
        decision: {
          en: 'One aggregated GROQ projection, resolved once in the root layout, instead of scattered per-page queries.',
          fr: 'Une projection GROQ agrégée, résolue une seule fois dans le root layout, plutôt que des requêtes éparpillées par page.',
        },
        why: {
          en: 'Every page needs a subset of the same shared content (nav, footer, locale strings). Resolving it once at the root avoids duplicate CMS calls per route and keeps the data shape consistent everywhere it is consumed.',
          fr: "Chaque page a besoin d'un sous-ensemble du même contenu partagé (nav, footer, chaînes de locale). Le résoudre une fois à la racine évite les appels CMS dupliqués par route et garde une forme de donnée cohérente partout où elle est consommée.",
        },
      },
    ],

    notDone: [
      {
        choice: {
          en: 'No online payment integration (see decisions above).',
          fr: "Pas d'intégration de paiement en ligne (voir décisions ci-dessus).",
        },
        reason: {
          en: 'Building it would have solved a problem the client did not have, while leaving the real one — trust — untouched.',
          fr: "L'intégrer aurait résolu un problème que le client n'avait pas, en laissant le vrai — la confiance — intact.",
        },
      },
      {
        choice: {
          en: 'Prices are versioned in code, not editable through the CMS.',
          fr: "Les prix sont versionnés dans le code, pas éditables depuis le CMS.",
        },
        reason: {
          en: 'The rest of the content architecture is built so a non-technical owner can edit anything, with the CMS→JSON fallback absorbing failure at every field. Prices are the one exception — a scope call made under the project\'s time budget, not a technical constraint. It breaks the architecture\'s own principle: the client cannot change a price without asking me to ship a code change.',
          fr: "Le reste de l'architecture de contenu est construit pour qu'un propriétaire non technique puisse tout éditer, avec le repli CMS→JSON qui absorbe l'échec à chaque champ. Les prix sont la seule exception — un arbitrage de périmètre pris sous la contrainte de temps du projet, pas une contrainte technique. Ça rompt le principe même de l'architecture : le client ne peut pas changer un prix sans me demander de livrer un changement de code.",
        },
      },
    ],

    wouldMeasure: [
      { value: '—', label: { en: 'WHATSAPP CLICK-THROUGH', fr: 'CLICS VERS WHATSAPP' } },
      { value: '—', label: { en: 'BUILD FAILURES ON MISSING KEYS', fr: 'ÉCHECS DE BUILD SUR CLÉ MANQUANTE' } },
      { value: '—', label: { en: 'FALLBACK RENDER RATE', fr: 'TAUX DE REPLI CONTENU' } },
    ],
    wouldMeasureBody: {
      en: "The site is not yet carrying real booking traffic, so these are the metrics I'd track once it does, not results I already have: how many WhatsApp conversations start from the site per month, and what share turn into a booking. Both test the actual hypothesis directly — that trust, not payment friction, is what was costing the agency bookings. A click-through number with no conversation-to-booking rate next to it would prove nothing.",
      fr: "Le site ne porte pas encore de vrai trafic de réservation — ce sont donc les métriques que je suivrais une fois que ce sera le cas, pas des résultats déjà en main : combien de conversations WhatsApp démarrent depuis le site par mois, et quelle part se transforme en réservation. Les deux testent directement l'hypothèse de départ — que la confiance, pas le frein au paiement, coûtait des réservations à l'agence. Un chiffre de clics sans taux de transformation en réservation à côté ne prouverait rien.",
    },

    wouldRedo: {
      en: 'I\'d make prices editable in the CMS behind a structured field with validation, not free text — the same discipline already applied to every other piece of content. The current setup means the client has to message me to change a price, which quietly reintroduces the dependency the whole project was built to remove.',
      fr: "Je rendrais les prix éditables dans le CMS derrière un champ structuré avec validation, pas du texte libre — la même discipline déjà appliquée à tout le reste du contenu. Le montage actuel oblige le client à me contacter pour changer un prix, ce qui réintroduit discrètement la dépendance que tout le projet visait à supprimer.",
    },
  },
  {
    slug: 'brasserie-licorne',
    title: 'BRASSERIE LICORNE',
    titleStroke: 'CASE STUDY',
    year: '2025',
    client: {
      en: 'Agency client — Izhak Interact',
      fr: 'Client agence — Izhak Interact',
    },
    role: { en: 'Front-end & data pipeline', fr: 'Front-end & pipeline de données' },
    stack: ['PHP', 'Cron', 'Leaflet', 'CSV processing'],
    color: '#7b61ff',
    image: '/photo/licorne.png',
    liveUrl: 'https://www.brasserielicorne.com/',
    metaDescription:
      'Turning 50,000+ denormalized CSV rows into 2,250 linked, geolocated retailer records for an industrial brewery — under a 40-second cron budget.',

    problem: {
      en: [
        'An Alsatian industrial brewery (190 employees, 750,000 hL/year) needed to show thousands of retail points of sale on their site, filterable by product reference.',
        'The data arrived as denormalized CSVs — 19,696 + 31,418 rows — that did not fit inside a single HTTP request. Products were named in free text with no shared identifier, and there were no geographic coordinates anywhere in the source data.',
      ],
      fr: [
        "Une brasserie industrielle alsacienne (190 salariés, 750 000 hL/an) avait besoin d'afficher plusieurs milliers de points de vente sur son site, filtrables par référence produit.",
        "La donnée arrivait en CSV dénormalisés — 19 696 + 31 418 lignes — qui ne tenaient pas dans une seule requête HTTP. Les produits étaient nommés en texte libre sans identifiant partagé, et aucune coordonnée géographique n'existait dans la donnée source.",
      ],
    },
    forWho: {
      en: 'A marketing team that needed the retailer map to just work, without ever touching a database or a cron schedule themselves.',
      fr: "Une équipe marketing qui avait besoin que la carte des revendeurs fonctionne, sans jamais avoir à toucher une base de données ou une planification cron elle-même.",
    },

    decisions: [
      {
        decision: {
          en: 'Aggregate at parse time, deduplicate on two levels using the client\'s external key.',
          fr: "Agrégation au moment du parsing, dédoublonnement à deux niveaux sur la clé externe du client.",
        },
        why: {
          en: '19,696 + 31,418 raw rows collapse to 2,250 distinct retailers once the same point of sale — listed multiple times across product lines — is recognized as one entity instead of many.',
          fr: "19 696 + 31 418 lignes brutes se réduisent à 2 250 revendeurs distincts une fois qu'un même point de vente — listé plusieurs fois selon les lignes de produit — est reconnu comme une seule entité plutôt que plusieurs.",
        },
      },
      {
        decision: {
          en: 'Batches of 300 rows, orchestrated by a self-rescheduling cron under a 40-second budget, with state carried between runs.',
          fr: 'Des lots de 300 lignes, orchestrés par un cron auto-replanifié sous un budget de 40 secondes, avec un état transporté entre les exécutions.',
        },
        why: {
          en: 'The full import cannot run inside one request or one cron invocation without hitting a timeout. Chunking it and persisting progress between runs turns a single fragile operation into a resumable sequence.',
          fr: "L'import complet ne peut pas tenir dans une seule requête ou une seule invocation cron sans dépasser le timeout. Le découper et persister la progression entre les exécutions transforme une opération fragile unique en une séquence reprenable.",
        },
      },
      {
        decision: {
          en: 'Product matching by normalized prefix; geocoding that never overwrites an existing coordinate.',
          fr: "Correspondance produit par préfixe normalisé ; géocodage qui n'écrase jamais une coordonnée existante.",
        },
        why: {
          en: 'Free-text product names cannot be joined on an exact match, so prefix normalization absorbs the inconsistency. And once a retailer has been geocoded once, re-running the import must never silently degrade or replace a correct coordinate with a worse one.',
          fr: "Des noms de produit en texte libre ne peuvent pas être joints par correspondance exacte, donc la normalisation par préfixe absorbe l'incohérence. Et une fois qu'un revendeur a été géocodé, relancer l'import ne doit jamais dégrader silencieusement ou remplacer une bonne coordonnée par une moins bonne.",
        },
      },
      {
        decision: {
          en: 'A Leaflet map with clustering, filtering done entirely client-side.',
          fr: 'Une carte Leaflet en clusters, avec un filtrage entièrement côté client.',
        },
        why: {
          en: 'At 2,250 points, client-side filtering keeps the interaction instant — no round trip to the server every time someone changes a product filter.',
          fr: "À 2 250 points, le filtrage côté client garde l'interaction instantanée — aucun aller-retour serveur à chaque changement de filtre produit.",
        },
      },
    ],

    notDone: [
      {
        choice: {
          en: 'Reverted the supplier API integration — 1,501 lines removed thirteen days after shipping it.',
          fr: "Abandon de l'intégration à l'API du fournisseur — 1 501 lignes supprimées treize jours après l'avoir livrée.",
        },
        reason: {
          en: 'The first version pulled retailer data automatically through the supplier\'s API. It worked, but it traded a simple, robust manual import for a fragile technical dependency on a third party. Reverting to manual import — keeping the robust parsing/dedup/geocoding pipeline built for it — swapped a fragile technical dependency for a simple human one. That is the best decision in this project, and it is a reversal, not a success story.',
          fr: "La première version récupérait automatiquement les données revendeurs via l'API du fournisseur. Ça fonctionnait, mais ça échangeait un import manuel simple et robuste contre une dépendance technique fragile à un tiers. Revenir à l'import manuel — en conservant le pipeline robuste de parsing/dédoublonnement/géocodage construit pour elle — a échangé une dépendance technique fragile contre une dépendance humaine simple. C'est la meilleure décision de ce projet, et c'est un retour en arrière, pas une success story.",
        },
      },
      {
        choice: {
          en: 'No automated tests on the parsing/dedup/geocoding pipeline, and no monitoring on the cron itself.',
          fr: "Aucun test automatisé sur le pipeline de parsing/dédoublonnement/géocodage, et aucune supervision sur le cron lui-même.",
        },
        reason: {
          en: 'This was agency work under a fixed budget, and the pipeline was validated by hand against the real CSVs before shipping. That is a reasonable trade-off for a one-off import script — it stops being reasonable the moment the supplier changes their export format and nothing catches it automatically.',
          fr: "C'était un travail d'agence sous budget fixe, et le pipeline a été validé à la main contre les vrais CSV avant sa mise en production. C'est un compromis raisonnable pour un script d'import ponctuel — il cesse de l'être le jour où le fournisseur change son format d'export et que rien ne le détecte automatiquement.",
        },
      },
    ],

    wouldMeasure: [
      { value: '2,250', label: { en: 'DISTINCT RETAILERS RESOLVED', fr: 'REVENDEURS DISTINCTS RÉSOLUS' } },
      { value: '<40s', label: { en: 'PER-BATCH CRON BUDGET', fr: 'BUDGET CRON PAR LOT' } },
      { value: '—', label: { en: 'GEOCODING FAILURE RATE', fr: "TAUX D'ÉCHEC DE GÉOCODAGE" } },
    ],
    wouldMeasureBody: {
      en: "There is no dashboard on this pipeline today — its correctness was proven once, by hand, against the real data, not tracked over time. If I instrumented it, geocoding failure rate is the number I'd want first: the rule never overwrites an existing coordinate, which is safe, but it also means a retailer that failed to geocode once stays unlocated forever unless someone notices.",
      fr: "Il n'existe aujourd'hui aucun tableau de bord sur ce pipeline — sa justesse a été prouvée une fois, à la main, contre la donnée réelle, pas suivie dans le temps. Si je l'instrumentais, le taux d'échec de géocodage est le chiffre que je voudrais en premier : la règle qui n'écrase jamais une coordonnée existante est sûre, mais elle signifie aussi qu'un revendeur dont le géocodage a échoué une fois reste non localisé indéfiniment, sauf si quelqu'un s'en aperçoit.",
    },

    wouldRedo: {
      en: "I'd add tests on the deduplication logic from the start instead of trusting a manual check against the source CSVs — that logic is exactly the kind of thing that looks correct until a new edge case in the data proves it wrong. I'd also put a monitor on the cron itself, the same discipline I later applied on FileDrop.",
      fr: "J'ajouterais des tests sur la logique de dédoublonnement dès le départ, plutôt que de faire confiance à une vérification manuelle contre les CSV source — c'est exactement le genre de logique qui a l'air correcte jusqu'à ce qu'un nouveau cas limite dans la donnée prouve le contraire. Je mettrais aussi une sonde sur le cron lui-même, la même discipline que j'ai appliquée plus tard sur FileDrop.",
    },
  },
  {
    slug: 'filedrop',
    title: 'FILEDROP',
    titleStroke: 'CASE STUDY',
    year: '2025',
    client: { en: 'Personal project', fr: 'Projet personnel' },
    role: { en: 'Maintainer — security & ops', fr: 'Mainteneur — sécurité & exploitation' },
    stack: ['Next.js', 'Firebase', 'Clerk', 'Vitest'],
    color: '#0061ff',
    image: '/photo/dropbox.png',
    liveUrl: 'https://nguyen-minh-dropbox-clone.vercel.app/',
    metaDescription:
      'Started from a tutorial. This case study is about what came after: a cross-user isolation bug fixed and proven with 7 tests, and production monitoring with a verified alert chain.',

    problem: {
      en: [
        // Honesty clause required by the brief — stated up front, not buried.
        'FileDrop started as a tutorial project. This case study is not about that initial build — it is about what I found and fixed once I started treating it as something that had to survive real use.',
        'The Firebase security rules required a user identity that the app never actually provided. In practice, that meant the isolation between users\' files was not enforced by the rules — it depended on the client behaving correctly, which is not a security boundary.',
      ],
      fr: [
        "FileDrop a démarré comme un projet-tutoriel. Cette étude de cas ne porte pas sur cette construction initiale — elle porte sur ce que j'ai trouvé et corrigé une fois que j'ai commencé à le traiter comme quelque chose qui devait survivre à un usage réel.",
        "Les règles de sécurité Firebase exigeaient une identité utilisateur que l'application ne fournissait en réalité jamais. En pratique, cela signifiait que l'isolation entre les fichiers des utilisateurs n'était pas garantie par les règles — elle dépendait du bon comportement du client, ce qui n'est pas une frontière de sécurité.",
      ],
    },
    forWho: {
      en: 'Anyone reviewing whether I can find and close a real security gap in code I did not originally design — not just ship a feature.',
      fr: "Quiconque évalue si je suis capable de trouver et de refermer une vraie faille de sécurité dans du code que je n'ai pas conçu à l'origine — pas seulement livrer une fonctionnalité.",
    },

    decisions: [
      {
        decision: {
          en: 'A server-side Clerk → Firebase token bridge, with no data migration.',
          fr: 'Un pont de jeton Clerk → Firebase côté serveur, sans migration de données.',
        },
        why: {
          en: 'The app used Clerk for auth but Firebase security rules for authorization — two identity systems that never actually talked to each other. Minting a Firebase custom token server-side from the verified Clerk session closes the gap without touching a single existing file or record.',
          fr: "L'application utilisait Clerk pour l'authentification mais les règles de sécurité Firebase pour l'autorisation — deux systèmes d'identité qui ne se parlaient en réalité jamais. Générer un jeton personnalisé Firebase côté serveur à partir de la session Clerk vérifiée referme l'écart sans toucher un seul fichier ou enregistrement existant.",
        },
      },
      {
        decision: {
          en: '7 isolation tests against the Firebase emulator, validated by deliberately breaking the ownership rule and watching 5 of 7 turn red.',
          fr: "7 tests d'isolation contre l'émulateur Firebase, validés en cassant délibérément la règle de propriété et en observant 5 des 7 virer au rouge.",
        },
        why: {
          en: 'A security test suite that has never seen its own tests fail is unproven — it might be passing because the vulnerability was never real, or because the tests do not actually exercise it. Deliberately reintroducing the bug and confirming the tests catch it is what makes the suite trustworthy.',
          fr: "Une suite de tests de sécurité qui n'a jamais vu ses propres tests échouer n'est pas prouvée — elle pourrait passer parce que la vulnérabilité n'était jamais réelle, ou parce que les tests ne l'exercent pas réellement. Réintroduire délibérément le bug et confirmer que les tests l'attrapent est ce qui rend la suite fiable.",
        },
      },
      {
        decision: {
          en: 'Monitoring on the three critical dependencies with a 200/503 contract and explicit thresholds, alert chain verified by pulling the service key from the environment.',
          fr: "Supervision des trois dépendances critiques avec un contrat 200/503 et des seuils explicites, chaîne d'alerte vérifiée en retirant la clé de service de l'environnement.",
        },
        why: {
          en: 'A health check that has never actually fired is a health check nobody trusts. Removing a real credential in a controlled way and confirming the alert fires end-to-end is the only way to know the monitoring works before it is needed for real.',
          fr: "Une sonde de supervision qui ne s'est jamais réellement déclenchée est une sonde à laquelle personne ne fait confiance. Retirer un vrai identifiant de façon contrôlée et confirmer que l'alerte se déclenche de bout en bout est la seule façon de savoir que la supervision fonctionne avant qu'on en ait réellement besoin.",
        },
      },
    ],

    notDone: [
      {
        choice: {
          en: 'No data migration alongside the auth bridge fix.',
          fr: "Aucune migration de données en même temps que la correction du pont d'authentification.",
        },
        reason: {
          en: 'Migrating existing records while also changing the authorization model doubles the blast radius of a security fix. Bridging the identity systems at the token level fixed the isolation gap without needing to touch a single stored record.',
          fr: "Migrer les enregistrements existants tout en changeant le modèle d'autorisation double le rayon d'impact d'un correctif de sécurité. Faire le pont entre les systèmes d'identité au niveau du jeton a corrigé la faille d'isolation sans avoir à toucher un seul enregistrement stocké.",
        },
      },
      {
        choice: {
          en: 'No rewrite of the original tutorial UI or file-upload flow.',
          fr: "Aucune réécriture de l'interface tutoriel d'origine ni du flux d'upload de fichiers.",
        },
        reason: {
          en: 'The value of this project is what I found and fixed once I stopped treating it as a tutorial — the isolation gap, the missing monitoring. Rewriting the parts that already worked would have been effort spent polishing, not effort spent closing the gap that actually mattered.',
          fr: "La valeur de ce projet est ce que j'ai trouvé et corrigé une fois que j'ai arrêté de le traiter comme un tutoriel — la faille d'isolation, la supervision absente. Réécrire les parties qui fonctionnaient déjà aurait été de l'effort dépensé à polir, pas de l'effort dépensé à refermer la faille qui comptait réellement.",
        },
      },
    ],

    wouldMeasure: [
      { value: '5/7', label: { en: 'ISOLATION TESTS CAUGHT THE REGRESSION', fr: 'TESTS AYANT DÉTECTÉ LA RÉGRESSION' } },
      { value: '3', label: { en: 'CRITICAL DEPENDENCIES MONITORED', fr: 'DÉPENDANCES CRITIQUES SUPERVISÉES' } },
      { value: '200/503', label: { en: 'HEALTH CHECK CONTRACT', fr: 'CONTRAT DE SONDE DE SANTÉ' } },
    ],
    wouldMeasureBody: {
      en: "This is a low-traffic personal project, so the proof here is not an incident history — it's the deliberate verification: pulling the service key to confirm the alert chain actually fires, and breaking the ownership rule on purpose to confirm 5 of 7 tests catch it. That is a stronger signal than an uptime number with no incidents to test whether it means anything.",
      fr: "C'est un projet personnel à faible trafic, donc la preuve ici n'est pas un historique d'incidents — c'est la vérification volontaire : retirer la clé de service pour confirmer que la chaîne d'alerte se déclenche réellement, et casser la règle de propriété exprès pour confirmer que 5 des 7 tests l'attrapent. C'est un signal plus fort qu'un taux de disponibilité sans incident pour tester s'il veut dire quelque chose.",
    },

    wouldRedo: {
      en: "If I started this project over, I'd pick a single identity system for both auth and data authorization from day one — Firebase Auth alone, or Clerk with a database that reads its session directly — instead of Clerk for auth and Firebase for authorization. The token bridge is a solid fix, but it exists only because two systems were bolted together after the fact; a from-scratch build should not need that seam at all.",
      fr: "Si je recommençais ce projet depuis le départ, je choisirais un seul système d'identité pour l'authentification et l'autorisation des données dès le premier jour — Firebase Auth seul, ou Clerk avec une base qui lit directement sa session — plutôt que Clerk pour l'authentification et Firebase pour l'autorisation. Le pont de jeton est un correctif solide, mais il n'existe que parce que deux systèmes ont été assemblés après coup ; une construction faite depuis zéro ne devrait pas avoir besoin de cette jointure du tout.",
    },
  },
  {
    slug: 'wattwiller',
    title: 'WATTWILLER',
    titleStroke: 'CASE STUDY',
    year: '2024',
    client: {
      en: 'Agency client — Izhak Interact',
      fr: 'Client agence — Izhak Interact',
    },
    role: { en: 'Front-end & motion architecture', fr: 'Front-end & architecture motion' },
    stack: ['Web Components', 'Custom Elements', 'JavaScript'],
    color: '#00c2a8',
    image: '/photo/wattwiller.png',
    liveUrl: 'https://www.wattwiller.com/',
    metaDescription:
      'A non-intrusive animation layer built as custom web components, used 90+ times across 32 templates — each element tearing down its own animations on disconnect.',

    problem: {
      en: [
        'A site built from 32 different templates needed consistent scroll and entrance animation across all of them, without every template author having to hand-wire GSAP timelines and manually clean up listeners and RAF loops on every page.',
        'The usual failure mode at this scale is not that the animations look wrong — it is that leftover listeners and animation loops from a page you already navigated away from keep running, slowly degrading performance until a full page reload is the only fix.',
      ],
      fr: [
        "Un site construit à partir de 32 gabarits différents avait besoin d'une animation de scroll et d'entrée cohérente sur tous, sans que chaque auteur de gabarit ait à câbler des timelines GSAP à la main et à nettoyer manuellement écouteurs et boucles RAF sur chaque page.",
        "Le mode d'échec habituel à cette échelle n'est pas que les animations sont incorrectes — c'est que des écouteurs et des boucles d'animation oubliés d'une page déjà quittée continuent de tourner, dégradant lentement la performance jusqu'à ce qu'un rechargement complet devienne le seul recours.",
      ],
    },
    forWho: {
      en: 'Other front-end contributors on the same codebase, who needed to drop animation into a new template without becoming an expert in the cleanup discipline every animation loop requires.',
      fr: "D'autres contributeurs front-end sur la même base de code, qui avaient besoin d'ajouter de l'animation dans un nouveau gabarit sans devenir expert de la discipline de nettoyage qu'exige chaque boucle d'animation.",
    },

    decisions: [
      {
        decision: {
          en: 'Built the animation layer as custom web components rather than a shared JS utility function.',
          fr: 'Construction de la couche d\'animation en composants web personnalisés plutôt qu\'en fonction utilitaire JS partagée.',
        },
        why: {
          en: 'A custom element has a defined lifecycle — connectedCallback / disconnectedCallback — that a plain utility function does not. Wrapping the animation in an element means the browser itself tells you exactly when to start and when to tear down, instead of relying on every template author to remember to call a cleanup function.',
          fr: "Un élément personnalisé a un cycle de vie défini — connectedCallback / disconnectedCallback — qu'une simple fonction utilitaire n'a pas. Envelopper l'animation dans un élément signifie que le navigateur lui-même indique exactement quand démarrer et quand démonter, plutôt que de compter sur chaque auteur de gabarit pour se souvenir d'appeler une fonction de nettoyage.",
        },
      },
      {
        decision: {
          en: 'Every element tears down its own animations, listeners, and RAF loops on disconnect — no exceptions.',
          fr: "Chaque élément démonte lui-même ses animations, écouteurs et boucles RAF à la déconnexion — sans exception.",
        },
        why: {
          en: 'This single rule is what makes page transitions without a full reload viable at all. Without it, navigating between templates without a hard reload would leak a running animation loop per page visited, and the site would slow down the longer someone stayed on it.',
          fr: "Cette seule règle est ce qui rend viables les transitions de page sans rechargement complet. Sans elle, naviguer entre gabarits sans rechargement dur ferait fuir une boucle d'animation par page visitée, et le site ralentirait à mesure que quelqu'un y restait.",
        },
      },
      {
        decision: {
          en: 'Shipped as a small set of reusable components, adopted 90+ times across 32 templates.',
          fr: "Livré comme un petit ensemble de composants réutilisables, adopté plus de 90 fois sur 32 gabarits.",
        },
        why: {
          en: 'The point of building this as a component library rather than a one-off effect was reuse at scale — a template author drops in the element and gets the teardown contract for free, they never have to think about it.',
          fr: "L'intérêt de construire ceci comme une bibliothèque de composants plutôt qu'un effet ponctuel était la réutilisation à l'échelle — un auteur de gabarit place l'élément et obtient le contrat de démontage gratuitement, sans jamais avoir à y penser.",
        },
      },
    ],

    notDone: [
      {
        choice: {
          en: 'No central animation registry or global timeline manager.',
          fr: 'Aucun registre d\'animation centralisé ni gestionnaire de timeline global.',
        },
        reason: {
          en: 'A central manager would need every template to register and unregister correctly with it — reintroducing the exact coordination problem the per-element teardown contract was built to avoid. Keeping teardown local to each element means there is nothing shared to get out of sync.',
          fr: "Un gestionnaire central aurait exigé que chaque gabarit s'y enregistre et s'en désinscrive correctement — réintroduisant exactement le problème de coordination que le contrat de démontage par élément visait à éviter. Garder le démontage local à chaque élément fait qu'il n'y a rien de partagé à désynchroniser.",
        },
      },
    ],

    wouldMeasure: [
      { value: '90+', label: { en: 'USES ACROSS THE SITE', fr: "UTILISATIONS SUR LE SITE" } },
      { value: '32', label: { en: 'TEMPLATES ADOPTING IT', fr: 'GABARITS ADOPTANT LA COUCHE' } },
      { value: '0', label: { en: 'LEAKED LOOPS AFTER TEARDOWN', fr: 'BOUCLES OUBLIÉES APRÈS DÉMONTAGE' } },
    ],
    wouldMeasureBody: {
      en: "The number I'd want to track in production is memory/listener count after navigating through several templates in a row without a reload — the direct test of whether the teardown contract actually holds at scale, not just in the templates it was first tested against.",
      fr: "Le chiffre que je voudrais suivre en production est le nombre de listeners/la mémoire après avoir navigué à travers plusieurs gabarits d'affilée sans rechargement — le test direct de si le contrat de démontage tient vraiment à l'échelle, pas seulement dans les gabarits sur lesquels il a d'abord été testé.",
    },

    wouldRedo: {
      en: "I'd write an automated test that mounts and unmounts every template in a loop and asserts the listener/RAF count returns to zero each time — today that contract is enforced by convention and code review, not by a test that would catch a regression automatically the next time someone adds a template.",
      fr: "J'écrirais un test automatisé qui monte et démonte chaque gabarit en boucle et vérifie que le nombre de listeners/RAF revient à zéro à chaque fois — aujourd'hui ce contrat est appliqué par convention et revue de code, pas par un test qui attraperait automatiquement une régression la prochaine fois que quelqu'un ajoute un gabarit.",
    },
  },
]

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((cs) => cs.slug === slug)
}

export function getNextCaseStudy(slug: string): CaseStudy {
  const index = CASE_STUDIES.findIndex((cs) => cs.slug === slug)
  return CASE_STUDIES[(index + 1) % CASE_STUDIES.length]
}
