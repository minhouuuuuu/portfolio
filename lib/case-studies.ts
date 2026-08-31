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
  /** Extra gallery shots beyond `image` (which always fills slot 01). Up to
   *  2 — any missing slot falls back to a placeholder tile. Put files in
   *  public/photo/ and reference them here as '/photo/filename.png'. */
  gallery?: string[]
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
    role: { en: 'Product scoping & lead front-end', fr: 'Cadrage produit & lead front-end' },
    stack: ['Next.js 16', 'React 19', 'Sanity CMS', 'GROQ', 'i18n'],
    color: '#c8ff00',
    image: '/photo/askar.png',
    gallery: ['/photo/askar-2.png', '/photo/askar-3.png'],
    liveUrl: 'https://askar-site.vercel.app/',
    metaDescription:
      'Disintermediating a Kyrgyz family trekking agency from platforms taking 40-60% commission — a full scoping pass plus a content architecture built to degrade safely.',

    problem: {
      en: [
        'A family-run trekking agency in Kyrgyzstan — Askar the guide, Aizhan handling contacts and bookings, the wider family running logistics, yurts and horses — was losing 40-60% of every booking to OTA platforms (Kalpak, Indy Guide, GetYourGuide). Their existing site was a generic Wix template: a "built on Wix" banner, leftover Russian text nobody had cleaned up, tours with no listed price, and no real booking path.',
        'The obvious fix looks like "build a booking site." The scoping work said otherwise: nine risks were scored by criticality before a line of code was written, and the two highest were not technical. R4 ("stale content — wrong prices/currency") scored 16/25, and R3 ("poor conversion — visitors who never contact") scored 15/25. Both point at the same root cause: trust, not payment friction, is what stops a family from wiring money to a stranger for a multi-week trek abroad.',
      ],
      fr: [
        "Une agence de trek familiale kirghize — Askar le guide, Aizhan qui gère les contacts et réservations, le reste de la famille pour la logistique, les yourtes et les chevaux — perdait 40 à 60 % de chaque réservation au profit de plateformes OTA (Kalpak, Indy Guide, GetYourGuide). Leur site existant était un template Wix générique : bannière « built on Wix », restes de texte en russe jamais nettoyés, des tours sans prix affiché, et aucun vrai parcours de réservation.",
        "La solution évidente ressemble à « construire un site de réservation ». Le travail de cadrage a dit autre chose : neuf risques ont été cotés par criticité avant la moindre ligne de code, et les deux plus élevés n'étaient pas techniques. R4 (« contenu obsolète — prix/devises faux ») cotait 16/25, et R3 (« mauvaise conversion — visiteurs qui ne contactent jamais ») cotait 15/25. Les deux pointent vers la même cause racine : c'est la confiance, pas le frein au paiement, qui empêche une famille de virer de l'argent à un inconnu pour un trek de plusieurs semaines à l'étranger.",
      ],
    },
    forWho: {
      en: 'Askar and Aizhan directly — a small agency owner-operator who needed to own the customer relationship again, without pretending to be a bigger company than it is. Four personas shaped the scope: Tom, a budget backpacker afraid of being scammed abroad; Lena, a solo photographer who needs to see quality visuals and know the horse-riding difficulty before booking; Marc & Léa, a first-time-on-horseback couple who need to be reassured in their own language and currency; and Dmitry, an experienced rider who wants elevation profiles and group size, not marketing copy.',
      fr: "Askar et Aizhan directement — les propriétaires-opérateurs d'une petite agence qui avaient besoin de reprendre la relation client, sans prétendre être une entreprise plus grande qu'elle ne l'est. Quatre personas ont façonné le périmètre : Tom, un routard au budget serré qui craint l'arnaque à l'étranger ; Lena, photographe solo qui a besoin de voir des visuels de qualité et de connaître le niveau de difficulté à cheval avant de réserver ; Marc & Léa, un couple qui monte à cheval pour la première fois et a besoin d'être rassuré dans sa langue et sa devise ; et Dmitry, cavalier expérimenté qui veut un profil d'élévation et une taille de groupe, pas du texte marketing.",
    },

    decisions: [
      {
        decision: {
          en: 'No online payment. Booking routes through a pre-filled WhatsApp deep-link instead.',
          fr: 'Pas de paiement en ligne. La réservation passe par un lien WhatsApp pré-rempli.',
        },
        why: {
          en: 'If the real friction is trust, adding a payment form does not remove it — it just adds a second thing to trust (the site, and the transaction). Every "Book" button on the tours page opens WhatsApp with the message already written ("Hi! I\'m interested in the 3-day tour…"), so the family can answer questions, sound human, and close the sale the way trust actually gets built for this kind of purchase — with mailto and tel as the fallback channels for anyone who avoids WhatsApp.',
          fr: "Si le vrai frein est la confiance, ajouter un formulaire de paiement ne le supprime pas — ça ajoute une deuxième chose à faire confiance (le site, et la transaction). Chaque bouton « Réserver » sur la page tours ouvre WhatsApp avec le message déjà écrit (« Hi! I'm interested in the 3-day tour… »), pour que la famille puisse répondre aux questions, sonner humain, et conclure la vente de la façon dont la confiance se construit réellement pour ce type d'achat — avec mailto et tel en canaux de repli pour qui évite WhatsApp.",
        },
      },
      {
        decision: {
          en: 'A content layer that degrades field by field: Sanity CMS → static JSON fallback if no project ID is configured, English fallback per string.',
          fr: 'Une couche de contenu qui dégrade champ par champ : CMS Sanity → repli JSON statique si aucun identifiant de projet n\'est configuré, repli anglais par chaîne.',
        },
        why: {
          en: 'A single missing field, or the CMS being entirely unreachable, should never take down a page. If `NEXT_PUBLIC_SANITY_PROJECT_ID` is unset, the Sanity client is simply `null` and the app reads straight from the JSON files in `src/i18n/messages/` instead — the site works even with zero CMS configured, which matters for a family with no technical staff who might misconfigure or forget to renew something.',
          fr: "Un seul champ manquant, ou le CMS entièrement injoignable, ne doit jamais faire tomber une page. Si `NEXT_PUBLIC_SANITY_PROJECT_ID` n'est pas défini, le client Sanity vaut simplement `null` et l'app lit directement les fichiers JSON de `src/i18n/messages/` à la place — le site fonctionne même sans aucun CMS configuré, ce qui compte pour une famille sans personnel technique qui pourrait mal configurer ou oublier de renouveler quelque chose.",
        },
      },
      {
        decision: {
          en: '11 languages, fully localized — not just UI strings. Every tour, review and page section is translated, with prices converted to 11 currencies via the native `Intl.NumberFormat` API rather than a third-party library.',
          fr: "11 langues, entièrement localisées — pas seulement les chaînes d'interface. Chaque tour, avis et section de page est traduit, avec les prix convertis en 11 devises via l'API native `Intl.NumberFormat` plutôt qu'une bibliothèque tierce.",
        },
        why: {
          en: "Persona Marc & Léa's actual blocker was language and price, not the tour itself — a visitor who cannot read the itinerary or understand the cost in their own currency will not contact a stranger to ask. `en.json` alone runs 582 lines of real content, not boilerplate. Currency values themselves are hardcoded (see \"what I'd redo\") — a trade-off made under the project's time budget, not a technical limit.",
          fr: "Le vrai frein du persona Marc & Léa était la langue et le prix, pas le tour lui-même — un visiteur qui ne peut ni lire l'itinéraire ni comprendre le coût dans sa devise ne va pas contacter un inconnu pour demander. Le seul fichier `en.json` compte 582 lignes de vrai contenu, pas du texte générique. Les valeurs de devise elles-mêmes sont codées en dur (voir « ce que je referais ») — un arbitrage pris sous la contrainte de temps du projet, pas une limite technique.",
        },
      },
      {
        decision: {
          en: 'One aggregated GROQ projection (`ALL_CONTENT_QUERY`), resolved once with a 60-second revalidation and a `sanity` cache tag, instead of scattered per-page queries.',
          fr: "Une projection GROQ agrégée (`ALL_CONTENT_QUERY`), résolue une seule fois avec une revalidation de 60 secondes et un tag de cache `sanity`, plutôt que des requêtes éparpillées par page.",
        },
        why: {
          en: 'Every page needs a subset of the same shared content (nav, footer, locale strings, homepage sections). Resolving it once avoids duplicate CMS calls per route and keeps the data shape consistent everywhere it is consumed — and the cache tag means a content edit in the Sanity Studio invalidates cleanly instead of waiting out a blind TTL.',
          fr: "Chaque page a besoin d'un sous-ensemble du même contenu partagé (nav, footer, chaînes de locale, sections de la home). Le résoudre une fois évite les appels CMS dupliqués par route et garde une forme de donnée cohérente partout où elle est consommée — et le tag de cache signifie qu'une édition de contenu dans le Studio Sanity invalide proprement plutôt que d'attendre un TTL aveugle.",
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
          en: 'Building it would have solved a problem the client did not have — R3 and R4 in the risk register are both about trust and content freshness, not payment friction — while leaving the real one untouched.',
          fr: "L'intégrer aurait résolu un problème que le client n'avait pas — R3 et R4 dans le registre des risques portent tous deux sur la confiance et la fraîcheur du contenu, pas sur le frein au paiement — en laissant le vrai problème intact.",
        },
      },
      {
        choice: {
          en: 'No custom booking backend, no database, no transactional system at all.',
          fr: 'Aucun backend de réservation sur-mesure, aucune base de données, aucun système transactionnel.',
        },
        reason: {
          en: 'The feasibility review concluded the residual risk was functional, not technical: WhatsApp/mailto/tel are channels the family already operates daily. Building a reservation database would have added a system to maintain for a volume of bookings a TPE (very small business) with no marketing staff does not need yet.',
          fr: "L'avis de faisabilité a conclu que le risque résiduel était fonctionnel, pas technique : WhatsApp/mailto/tel sont des canaux que la famille utilise déjà au quotidien. Construire une base de données de réservation aurait ajouté un système à maintenir pour un volume de réservations qu'une TPE sans équipe marketing n'a pas encore besoin de gérer.",
        },
      },
      {
        choice: {
          en: 'Prices are versioned in code, not editable through the CMS.',
          fr: 'Les prix sont versionnés dans le code, pas éditables depuis le CMS.',
        },
        reason: {
          en: "The rest of the content architecture is built so a non-technical owner can edit anything, with the CMS→JSON fallback absorbing failure at every field. Prices are the one exception — a scope call made under the project's 36-person-day time budget, not a technical constraint. It breaks the architecture's own principle: the client cannot change a price without asking me to ship a code change, and R4 (stale content, scored 16/25) is precisely the risk this leaves unmitigated for the one field that changes most often.",
          fr: "Le reste de l'architecture de contenu est construit pour qu'un propriétaire non technique puisse tout éditer, avec le repli CMS→JSON qui absorbe l'échec à chaque champ. Les prix sont la seule exception — un arbitrage de périmètre pris sous la contrainte des 36 jours-homme du projet, pas une contrainte technique. Ça rompt le principe même de l'architecture : le client ne peut pas changer un prix sans me demander de livrer un changement de code, et R4 (contenu obsolète, coté 16/25) est précisément le risque que ça laisse non traité pour le champ qui change le plus souvent.",
        },
      },
    ],

    wouldMeasure: [
      {
        value: '—',
        label: { en: 'WHATSAPP CLICK-THROUGH', fr: 'CLICS VERS WHATSAPP' },
      },
      {
        value: '≥99.9%',
        label: { en: 'UPTIME TARGET (SET PRE-LAUNCH)', fr: 'CIBLE DE DISPONIBILITÉ (FIXÉE AVANT LANCEMENT)' },
      },
      {
        value: '<2.5s',
        label: { en: 'LCP TARGET', fr: 'CIBLE LCP' },
      },
    ],
    wouldMeasureBody: {
      en: "The site is not yet carrying real booking traffic, so these are the metrics I'd track once it does, not results I already have. The control-indicator table drawn up during scoping already names them: click-through rate to WhatsApp against total visits, LCP under 2.5s via Speed Insights, and uptime via an external monitor — with a conversion target of 3-5% flagged explicitly as a number to validate with the client, not invented from nowhere. What matters is that a click-through number with no conversation-to-booking rate next to it would prove nothing about whether the trust hypothesis (R3/R4) was actually right.",
      fr: "Le site ne porte pas encore de vrai trafic de réservation — ce sont donc les métriques que je suivrais une fois que ce sera le cas, pas des résultats déjà en main. Le tableau d'indicateurs de contrôle établi au cadrage les nomme déjà : taux de clic vers WhatsApp rapporté aux visites totales, LCP sous 2,5 s via Speed Insights, et disponibilité via un moniteur externe — avec une cible de conversion de 3 à 5 % explicitement signalée comme un chiffre à valider avec le client, pas inventé. Ce qui compte, c'est qu'un chiffre de clics sans taux de transformation en réservation à côté ne prouverait rien sur la justesse réelle de l'hypothèse de confiance (R3/R4).",
    },

    wouldRedo: {
      en: "I'd make prices editable in the CMS behind a structured field with validation, not free text — the same discipline already applied to every other piece of content. The current setup means the client has to message me to change a price, which quietly reintroduces the dependency the whole project was built to remove, and is exactly the failure mode R4 was scored against in the first place.",
      fr: "Je rendrais les prix éditables dans le CMS derrière un champ structuré avec validation, pas du texte libre — la même discipline déjà appliquée à tout le reste du contenu. Le montage actuel oblige le client à me contacter pour changer un prix, ce qui réintroduit discrètement la dépendance que tout le projet visait à supprimer, et c'est exactement le mode de défaillance contre lequel R4 avait été coté au départ.",
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
    role: {
      en: 'Front-end & data pipeline',
      fr: 'Front-end & pipeline de données',
    },
    stack: ['PHP', 'WordPress', 'WP-Cron', 'Leaflet', 'CSV processing'],
    color: '#7b61ff',
    image: '/photo/licorne.png',
    gallery: ['/photo/licorne-2.png', '/photo/licorne-3.png'],
    liveUrl: 'https://www.brasserielicorne.com/',
    metaDescription:
      'Turning 51,000+ denormalized CSV rows into 2,250 linked, geolocated retailer records for an industrial brewery — under a 40-second cron budget, after reverting a fragile ERP integration.',

    problem: {
      en: [
        'An Alsatian industrial brewery (190 employees, 750,000 hL/year, brand Licorne under the KarlsBräu group) needed to show thousands of retail points of sale on their WordPress site, filterable by product reference — a custom "revendeur" (retailer) post type with no built-in archive, driven entirely by custom WP_Query calls rather than WordPress\' native archive system.',
        'The data arrived as two denormalized CSVs from the supplier\'s ERP (Solvnet) — 19,696 rows (CHR: cafés/hotels/restaurants) plus 31,418 rows (GMS: large retail) — one row per (retailer, product) pair, so a single retailer could span dozens of consecutive rows. Neither file fit inside a single HTTP request. Products were named in free text with no shared identifier across systems, and there were no geographic coordinates anywhere in the source data.',
      ],
      fr: [
        "Une brasserie industrielle alsacienne (190 salariés, 750 000 hL/an, marque Licorne au sein du groupe KarlsBräu) avait besoin d'afficher plusieurs milliers de points de vente sur son site WordPress, filtrables par référence produit — un type de contenu personnalisé « revendeur », sans archive native, entièrement piloté par des requêtes WP_Query sur mesure plutôt que par le système d'archive natif de WordPress.",
        "La donnée arrivait en deux CSV dénormalisés depuis l'ERP du fournisseur (Solvnet) — 19 696 lignes (CHR : cafés-hôtels-restaurants) plus 31 418 lignes (GMS : grandes surfaces) — une ligne par couple (revendeur, produit), donc un même revendeur pouvait s'étaler sur des dizaines de lignes consécutives. Aucun des deux fichiers ne tenait dans une seule requête HTTP. Les produits étaient nommés en texte libre sans identifiant partagé entre systèmes, et aucune coordonnée géographique n'existait dans la donnée source.",
      ],
    },
    forWho: {
      en: 'A marketing team that needed the retailer map to just work, without ever touching a database or a WP-Cron schedule themselves — an admin screen with one upload button and a "delete all retailers" reset, nothing more.',
      fr: "Une équipe marketing qui avait besoin que la carte des revendeurs fonctionne, sans jamais avoir à toucher une base de données ou une planification WP-Cron elle-même — un écran d'administration avec un bouton d'upload et une réinitialisation « supprimer tous les revendeurs », rien de plus.",
    },

    decisions: [
      {
        decision: {
          en: "Aggregate at parse time, deduplicate on two levels using the client's external key (`reseller_id`) — never a content hash.",
          fr: "Agrégation au moment du parsing, dédoublonnement à deux niveaux sur la clé externe du client (`reseller_id`) — jamais un hash de contenu.",
        },
        why: {
          en: '19,696 + 31,418 raw rows collapse to 2,250 distinct retailers this way: intra-file, the first row for an ID creates the record and every following row for the same ID only appends its product to a running list; inter-import, a single SQL query with two INNER JOINs loads every existing retailer once per run so the plugin knows whether to create or update, rather than issuing one query per row.',
          fr: "19 696 + 31 418 lignes brutes se réduisent ainsi à 2 250 revendeurs distincts : en intra-fichier, la première ligne d'un identifiant crée l'enregistrement et chaque ligne suivante pour le même identifiant ne fait qu'ajouter son produit à une liste en cours ; en inter-import, une seule requête SQL à deux INNER JOIN charge tous les revendeurs existants une fois par exécution pour savoir s'il faut créer ou mettre à jour, plutôt qu'une requête par ligne.",
        },
      },
      {
        decision: {
          en: 'Batches of 300 rows, orchestrated by a self-rescheduling WP-Cron job under a 40-second budget per run, with parsed CSV data and the existing-retailer index carried between runs via transients.',
          fr: 'Des lots de 300 lignes, orchestrés par une tâche WP-Cron auto-replanifiée sous un budget de 40 secondes par exécution, avec la donnée CSV déjà parsée et l\'index des revendeurs existants transportés entre exécutions via des transients.',
        },
        why: {
          en: "The full import cannot run inside one request or one cron invocation without hitting PHP's execution limits. Chunking it and persisting progress between runs — while re-forcing WP-Cron via `spawn_cron()` so the job does not wait for organic site traffic — turns a single fragile operation into a resumable sequence with no `set_time_limit()` or raised `memory_limit` anywhere: the chunking itself is what works around the ceiling, not raising it.",
          fr: "L'import complet ne peut pas tenir dans une seule requête ou une seule invocation cron sans dépasser les limites d'exécution de PHP. Le découper et persister la progression entre les exécutions — en re-forçant WP-Cron via `spawn_cron()` pour que la tâche n'attende pas un trafic organique du site — transforme une opération fragile unique en une séquence reprenable, sans aucun `set_time_limit()` ni `memory_limit` relevé : c'est le découpage lui-même qui contourne le plafond, pas son relèvement.",
        },
      },
      {
        decision: {
          en: 'Product matching by tokenized, normalized string comparison with prefix fallback; geocoding that never overwrites an existing coordinate.',
          fr: "Correspondance produit par comparaison de chaînes tokenisées et normalisées, avec repli par préfixe ; géocodage qui n'écrase jamais une coordonnée existante.",
        },
        why: {
          en: 'Free-text product labels like "Licorne Black - 50 cl" and "Licorne Black - 75 cl" cannot be joined on an exact match — the resolver strips accents, lowercases, splits on separators, then matches by equality OR by prefix (`strpos($inputToken, $mappedToken) === 0`) against a per-segment mapping field on each product. And once a retailer has been geocoded once, a `meta_query` selects only rows with a missing latitude/longitude for re-geocoding — re-running the import must never silently degrade or replace a correct coordinate with a worse one.',
          fr: "Des libellés produit en texte libre comme « Licorne Black - 50 cl » et « Licorne Black - 75 cl » ne peuvent pas être joints par correspondance exacte — le résolveur retire les accents, met en minuscule, découpe sur les séparateurs, puis compare par égalité OU par préfixe (`strpos($inputToken, $mappedToken) === 0`) contre un champ de correspondance par segment sur chaque produit. Et une fois qu'un revendeur a été géocodé, une `meta_query` ne sélectionne que les lignes à latitude/longitude manquante pour un nouveau géocodage — relancer l'import ne doit jamais dégrader silencieusement ou remplacer une bonne coordonnée par une moins bonne.",
        },
      },
      {
        decision: {
          en: 'A Leaflet map with canvas-rendered clustering (`preferCanvas: true`, `chunkedLoading: true`), filtering and free-text search done entirely client-side against `data-*` attributes.',
          fr: 'Une carte Leaflet en clusters rendus sur canvas (`preferCanvas: true`, `chunkedLoading: true`), filtrage et recherche texte entièrement côté client contre des attributs `data-*`.',
        },
        why: {
          en: 'All 2,250 retailers are injected into the page HTML once (two unpaginated `get_posts()` calls with `no_found_rows` and `update_post_term_cache => false` to lighten each), read into Leaflet markers on mount, then filtered in memory: adding/removing product or type filters just calls `addLayer`/`removeLayer` on the already-loaded markers — no round trip to the server on every filter change, at the cost of one heavier initial page load.',
          fr: "Les 2 250 revendeurs sont injectés dans le HTML de la page une fois (deux appels `get_posts()` sans pagination avec `no_found_rows` et `update_post_term_cache => false` pour alléger chacun), lus en marqueurs Leaflet au montage, puis filtrés en mémoire : ajouter/retirer un filtre produit ou type appelle simplement `addLayer`/`removeLayer` sur les marqueurs déjà chargés — aucun aller-retour serveur à chaque changement de filtre, au prix d'un chargement initial de page plus lourd.",
        },
      },
    ],

    notDone: [
      {
        choice: {
          en: "Reverted the supplier's automated API integration — roughly 1,500 lines removed thirteen days after shipping it.",
          fr: "Abandon de l'intégration automatisée à l'API du fournisseur — environ 1 500 lignes supprimées treize jours après l'avoir livrée.",
        },
        reason: {
          en: 'The first version pulled retailer exports automatically from the Solvnet ERP API. It worked in principle, but the export was asynchronous and its response time undocumented: the retry delay before downloading a ready export was recalibrated four separate times in a single afternoon (12:02 → 16:32) chasing an `ErrorNoneFileForExecId` error, and a debug script was found testing the same call with SSL verification disabled — signs of a genuinely unstable integration, not a one-off bug. Reverting to manual CSV upload — while keeping the robust parsing/dedup/geocoding pipeline built for the automated version — swapped a fragile technical dependency on an undocumented third-party API for a simple human one: someone exports the file from the ERP and drops it in. That is the best decision in this project, and it is a reversal, not a success story.',
          fr: "La première version récupérait automatiquement les exports revendeurs depuis l'API de l'ERP Solvnet. Ça fonctionnait en principe, mais l'export était asynchrone et son temps de réponse non documenté : le délai de nouvelle tentative avant de télécharger un export prêt a été recalibré quatre fois séparées en un seul après-midi (12h02 → 16h32) pour traquer une erreur `ErrorNoneFileForExecId`, et un script de debug a été trouvé testant le même appel avec la vérification SSL désactivée — signes d'une intégration réellement instable, pas d'un bug ponctuel. Revenir à un upload CSV manuel — en conservant le pipeline robuste de parsing/dédoublonnement/géocodage construit pour la version automatisée — a échangé une dépendance technique fragile à une API tierce non documentée contre une dépendance humaine simple : quelqu'un exporte le fichier depuis l'ERP et le dépose. C'est la meilleure décision de ce projet, et c'est un retour en arrière, pas une success story.",
        },
      },
      {
        choice: {
          en: 'No automated tests on the parsing/dedup/geocoding pipeline, and no monitoring on the cron itself.',
          fr: 'Aucun test automatisé sur le pipeline de parsing/dédoublonnement/géocodage, et aucune supervision sur le cron lui-même.',
        },
        reason: {
          en: 'This was agency work under a fixed budget, and the pipeline was validated by hand against the real CSVs before shipping — plus a diagnostic panel, visible only to administrators, listing every product with its resolved retailer count directly inside the map template. That is a reasonable trade-off for a one-off import script; it stops being reasonable the moment the supplier changes their export format and nothing catches it automatically, which has already happened once (a header-validation rewrite was needed mid-project when the source format changed).',
          fr: "C'était un travail d'agence sous budget fixe, et le pipeline a été validé à la main contre les vrais CSV avant sa mise en production — plus un panneau de diagnostic, visible aux seuls administrateurs, listant chaque produit avec son nombre de revendeurs résolus directement dans le template de la carte. C'est un compromis raisonnable pour un script d'import ponctuel ; il cesse de l'être le jour où le fournisseur change son format d'export et que rien ne le détecte automatiquement — ce qui est déjà arrivé une fois (une réécriture de la validation d'en-tête a été nécessaire en cours de projet quand le format source a changé).",
        },
      },
    ],

    wouldMeasure: [
      {
        value: '2,250',
        label: {
          en: 'DISTINCT RETAILERS RESOLVED',
          fr: 'REVENDEURS DISTINCTS RÉSOLUS',
        },
      },
      {
        value: '<40s',
        label: { en: 'PER-BATCH CRON BUDGET', fr: 'BUDGET CRON PAR LOT' },
      },
      {
        value: '—',
        label: {
          en: 'GEOCODING FAILURE RATE',
          fr: "TAUX D'ÉCHEC DE GÉOCODAGE",
        },
      },
    ],
    wouldMeasureBody: {
      en: "There is no dashboard on this pipeline today — its correctness was proven once, by hand, against the real data, not tracked over time. If I instrumented it, geocoding failure rate is the number I'd want first: the rule never overwrites an existing coordinate, which is safe, but it also means a retailer that failed to geocode once stays unlocated forever unless someone notices via the admin diagnostic panel.",
      fr: "Il n'existe aujourd'hui aucun tableau de bord sur ce pipeline — sa justesse a été prouvée une fois, à la main, contre la donnée réelle, pas suivie dans le temps. Si je l'instrumentais, le taux d'échec de géocodage est le chiffre que je voudrais en premier : la règle qui n'écrase jamais une coordonnée existante est sûre, mais elle signifie aussi qu'un revendeur dont le géocodage a échoué une fois reste non localisé indéfiniment, sauf si quelqu'un s'en aperçoit via le panneau de diagnostic admin.",
    },

    wouldRedo: {
      en: "I'd add tests on the deduplication and product-matching logic from the start instead of trusting a manual check against the source CSVs — a prefix-match resolver is exactly the kind of thing that looks correct until two products with a shared prefix (\"Slash Mangue\" vs. \"Slash Mangue Passion\") silently capture each other's rows. I'd also fix the AJAX endpoints that check a nonce without first verifying it was actually supplied (`isset()` missing before `wp_verify_nonce()`), rotate the Google Maps key that is currently hardcoded in the client-visible admin template, and put a monitor on the cron itself — the same discipline I later applied on FileDrop.",
      fr: "J'ajouterais des tests sur la logique de dédoublonnement et de correspondance produit dès le départ, plutôt que de faire confiance à une vérification manuelle contre les CSV source — un résolveur par correspondance de préfixe est exactement le genre de logique qui a l'air correcte jusqu'à ce que deux produits partageant un préfixe (« Slash Mangue » vs « Slash Mangue Passion ») captent silencieusement les lignes l'un de l'autre. Je corrigerais aussi les points d'entrée AJAX qui vérifient un nonce sans d'abord s'assurer qu'il est bien fourni (`isset()` manquant avant `wp_verify_nonce()`), je changerais la clé Google Maps actuellement codée en dur dans le template d'administration visible côté client, et je mettrais une sonde sur le cron lui-même — la même discipline que j'ai appliquée plus tard sur FileDrop.",
    },
  },
  {
    slug: 'filedrop',
    title: 'FILEDROP',
    titleStroke: 'CASE STUDY',
    year: '2025',
    client: { en: 'Personal project', fr: 'Projet personnel' },
    role: {
      en: 'Maintainer — audit, security & ops',
      fr: 'Mainteneur — audit, sécurité & exploitation',
    },
    stack: ['Next.js 14', 'Firebase', 'Clerk', 'Vitest', 'GitHub Actions'],
    color: '#0061ff',
    image: '/photo/dropbox.png',
    gallery: ['/photo/dropbox-2.png', '/photo/dropbox-3.png'],
    liveUrl: 'https://nguyen-minh-dropbox-clone.vercel.app/',
    metaDescription:
      'Started from a tutorial. This case study is about what came after: a cross-user isolation bug I created myself, found and fixed with 7 tests proven by breaking them on purpose, plus production monitoring with a verified alert chain.',

    problem: {
      en: [
        // Honesty clause required by the brief — stated up front, not buried.
        'FileDrop started as a tutorial project (Josh tried coding, late 2023) — a personal file storage app: drag-and-drop upload, list, rename, download, delete. This case study is not about that initial build. It is about auditing it in July–August 2026 the way I would inherit someone else\'s product at a new job: reconstruct the decisions baked into the code, judge which ones still hold, and fix what is actually broken.',
        "The most serious thing that audit found was a security gap I had created myself in an earlier certification pass: Firebase security rules required `request.auth.uid`, but authentication ran through Clerk. Nothing bridged the two — every Firestore request arrived as anonymous. Neither `firebase.json` nor `.firebaserc` existed in the repo, so the rules were files sitting in the codebase, not a deployed protection. And my own certification writeup had stated, in writing, that access control (OWASP A01) was handled.",
      ],
      fr: [
        "FileDrop a démarré comme un projet-tutoriel (Josh tried coding, fin 2023) — une application de stockage de fichiers personnelle : dépôt par glisser-déposer, liste, renommage, téléchargement, suppression. Cette étude de cas ne porte pas sur cette construction initiale. Elle porte sur son audit en juillet-août 2026, de la même façon que j'hériterais du produit de quelqu'un d'autre dans un nouveau poste : reconstituer les décisions ancrées dans le code, juger lesquelles tiennent encore, corriger ce qui est réellement cassé.",
        "La chose la plus sérieuse que cet audit a trouvée est une faille de sécurité que j'avais moi-même créée lors d'une passe de certification antérieure : les règles de sécurité Firebase exigeaient `request.auth.uid`, mais l'authentification passait par Clerk. Rien ne reliait les deux — chaque requête Firestore arrivait anonyme. Ni `firebase.json` ni `.firebaserc` n'existaient dans le dépôt, donc les règles étaient des fichiers dans le code, pas une protection déployée. Et mon propre dossier de certification affirmait, par écrit, que le contrôle d'accès (OWASP A01) était traité.",
      ],
    },
    forWho: {
      en: 'Anyone reviewing whether I can find and close a real security gap in code I wrote myself under a false sense of confidence — not just ship a feature. Also a direct answer to a piece of feedback from a scale-up engineer who screens candidates: side projects matter less than proving you can read decisions you inherited, justify priorities, and stay pragmatic — which is exactly what auditing my own past work forced me to do.',
      fr: "Quiconque évalue si je suis capable de trouver et de refermer une vraie faille de sécurité dans du code que j'ai moi-même écrit sous un faux sentiment de confiance — pas seulement livrer une fonctionnalité. C'est aussi une réponse directe à un retour d'un ingénieur de scale-up qui fait passer des entretiens : les side projects comptent moins que la capacité à lire des décisions héritées, justifier des priorités, et rester pragmatique — exactement ce qu'auditer mon propre travail passé m'a forcé à faire.",
    },

    decisions: [
      {
        decision: {
          en: "A server-side Clerk → Firebase token bridge (`POST /api/firebase-token`), not Clerk's official Firebase JWT template.",
          fr: "Un pont de jeton Clerk → Firebase côté serveur (`POST /api/firebase-token`), pas le gabarit JWT Firebase officiel de Clerk.",
        },
        why: {
          en: "Clerk's built-in `integration_firebase` JWT template is deprecated and can no longer be activated on a new application — building on it would have shipped a dead end. Instead, a route reads the Clerk session server-side (`auth()`), and only then asks the Firebase Admin SDK to mint a custom token with that Clerk user ID as the Firebase `uid`. The client never sends an identifier, so it cannot request a token for someone else, and the existing `users/{userId}/files` paths stay valid — zero data migration.",
          fr: "Le gabarit JWT intégré `integration_firebase` de Clerk est déprécié et ne peut plus être activé sur une nouvelle application — construire dessus aurait livré une impasse. À la place, une route lit la session Clerk côté serveur (`auth()`), et c'est seulement à ce moment qu'elle demande au SDK Firebase Admin de générer un jeton personnalisé avec cet identifiant Clerk comme `uid` Firebase. Le client n'envoie jamais d'identifiant, il ne peut donc pas réclamer un jeton pour quelqu'un d'autre, et les chemins existants `users/{userId}/files` restent valides — zéro migration de données.",
        },
      },
      {
        decision: {
          en: '7 isolation tests against the Firestore emulator, validated by deliberately replacing the ownership rule with `allow read, write: if true` and watching 5 of 7 turn red.',
          fr: "7 tests d'isolation contre l'émulateur Firestore, validés en remplaçant délibérément la règle de propriété par `allow read, write: if true` et en observant 5 des 7 virer au rouge.",
        },
        why: {
          en: "A security test suite that has never seen its own tests fail is unproven — mine had been read, judged correct, and never once executed against a real check. The seven scenarios cover both directions (user A can read/write their own space; user A is refused on user B's files; an unauthenticated request is refused entirely). Deliberately reintroducing the bug and confirming the tests catch it — 5 failed, 2 passed, the two that still passed being unauthenticated-request checks unaffected by an ownership rule — is what makes the suite trustworthy rather than decorative.",
          fr: "Une suite de tests de sécurité qui n'a jamais vu ses propres tests échouer n'est pas prouvée — la mienne avait été lue, jugée correcte, et jamais exécutée contre une vraie vérification. Les sept scénarios couvrent les deux directions (l'utilisateur A lit/écrit dans son propre espace ; l'utilisateur A est refusé sur les fichiers de B ; une requête non authentifiée est refusée entièrement). Réintroduire délibérément le bug et confirmer que les tests l'attrapent — 5 en échec, 2 qui passaient encore, ces deux étant des vérifications de requête non authentifiée non affectées par une règle de propriété — est ce qui rend la suite fiable plutôt que décorative.",
        },
      },
      {
        decision: {
          en: 'A `/api/health` probe checking three critical dependencies in parallel (config, Firebase identity signing, Storage bucket reachability), each capped at 5s, returning 200 or 503 — plus a scheduled active probe that calls it and fires an alert.',
          fr: "Une sonde `/api/health` vérifiant trois dépendances critiques en parallèle (configuration, signature d'identité Firebase, accessibilité du bucket Storage), chacune plafonnée à 5 s, renvoyant 200 ou 503 — plus une sonde active planifiée qui l'appelle et déclenche une alerte.",
        },
        why: {
          en: "The identity check does not just ping Firebase — it actually signs a token for a reserved test UID, because a network-reachable Firebase can still fail to authenticate if the service key is revoked; only the real operation catches that. A 401/403 from the Storage bucket is treated as healthy (the service answered, it just refused an anonymous request) while only a 404 or 5xx counts as a failure — conflating \"refused\" with \"broken\" would page someone on every normal day. The whole chain was verified end-to-end by actually pulling `FIREBASE_PRIVATE_KEY` from the environment and watching the probe go from 200 to 503 and the alert fire with the exact missing variable named.",
          fr: "La vérification d'identité ne se contente pas de pinguer Firebase — elle signe réellement un jeton pour un UID de test réservé, car un Firebase joignable réseau peut quand même échouer à authentifier si la clé de service est révoquée ; seule l'opération réelle l'attrape. Un 401/403 du bucket Storage est traité comme sain (le service a répondu, il a juste refusé une requête anonyme) tandis que seul un 404 ou un 5xx compte comme une panne — confondre « refusé » et « cassé » déclencherait une alerte à chaque jour normal. Toute la chaîne a été vérifiée de bout en bout en retirant réellement `FIREBASE_PRIVATE_KEY` de l'environnement et en observant la sonde passer de 200 à 503, l'alerte se déclenchant en nommant précisément la variable manquante.",
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
          en: 'Did not apply `npm audit fix --force` on a proposed downgrade of `firebase-admin` from v14 to v10 to silence a moderate `uuid` advisory.',
          fr: "Ne pas appliquer `npm audit fix --force` sur une rétrogradation proposée de `firebase-admin` de la v14 vers la v10 pour faire taire un avis modéré sur `uuid`.",
        },
        reason: {
          en: 'The automated fix would have rolled back four major versions of the SDK that issues the identity tokens — the single most security-critical piece of the whole system — to resolve a minor transitive advisory. Applying it blindly would have traded a real regression for a cosmetic fix. The lesson kept from this: a proposed fix flagged `isSemVerMajor` must be read before it is applied, because the flag can hide a regression, not just a breaking change.',
          fr: "Le correctif automatique aurait fait reculer de quatre versions majeures le SDK qui émet les jetons d'identité — la pièce la plus critique en sécurité de tout le système — pour résoudre un avis transitif mineur. L'appliquer aveuglément aurait échangé une vraie régression contre un correctif cosmétique. La leçon retenue : un correctif proposé signalé `isSemVerMajor` doit être lu avant d'être appliqué, car le drapeau peut cacher une régression, pas seulement un changement cassant.",
        },
      },
      {
        choice: {
          en: 'Tested the upgrade path to Next.js 16 / React 19 in an isolated copy of the repo, confirmed it fixes 21 of 26 known vulnerabilities — and did not ship it.',
          fr: "Testé le chemin de montée vers Next.js 16 / React 19 dans une copie isolée du dépôt, confirmé qu'il corrige 21 des 26 vulnérabilités connues — et ne pas l'avoir livré.",
        },
        reason: {
          en: "Typing, the full test suite and the production build all passed clean on the upgrade. What none of that covers is React 19's runtime behavior on the real user flows (drag-drop upload, modals) — and this project has no staging environment, so the only place to validate that would be production itself. The vulnerabilities left unpatched target request rewriting, middleware and Server Actions — features this project does not use — so the real exposure is far lower than the raw count suggests. The upgrade stays queued behind setting up a staging environment first, not silently dropped.",
          fr: "Le typage, la suite de tests complète et le build de production sont tous passés proprement sur la montée de version. Ce qu'aucun de ces contrôles ne couvre, c'est le comportement de React 19 à l'exécution sur les vrais parcours utilisateur (dépôt glisser-déposer, modales) — et ce projet n'a pas d'environnement de préproduction, donc le seul endroit pour le valider serait la production elle-même. Les vulnérabilités laissées non corrigées visent la réécriture de requêtes, le middleware et les Server Actions — des fonctionnalités que ce projet n'utilise pas — donc l'exposition réelle est bien plus faible que le décompte brut ne le suggère. La montée de version reste en attente derrière la mise en place d'un environnement de préproduction d'abord, pas silencieusement abandonnée.",
        },
      },
    ],

    wouldMeasure: [
      {
        value: '5/7',
        label: {
          en: 'ISOLATION TESTS CAUGHT THE REGRESSION',
          fr: 'TESTS AYANT DÉTECTÉ LA RÉGRESSION',
        },
      },
      {
        value: '42',
        label: {
          en: 'AUTOMATED TESTS IN CI (UP FROM 26)',
          fr: 'TESTS AUTOMATISÉS EN CI (CONTRE 26 AVANT)',
        },
      },
      {
        value: '200/503',
        label: { en: 'HEALTH CHECK CONTRACT', fr: 'CONTRAT DE SONDE DE SANTÉ' },
      },
    ],
    wouldMeasureBody: {
      en: "This is a zero-user personal project, so the proof here is not usage data — it's deliberate verification: pulling the service key to confirm the alert chain actually fires, breaking the ownership rule on purpose to confirm 5 of 7 tests catch it. The product north star I did define — the number of users who come back on a later day to retrieve a file dropped in a previous session, over a trailing 7 days — has an instrumented event (`file_downloaded` with `sameSession` and `fileAgeHours` properties) and a pre-set kill threshold: fewer than 5 distinct users doing that over 30 days means the product solves no real problem. I have not looked at that number yet, because there is no real traffic to look at.",
      fr: "C'est un projet personnel à zéro utilisateur, donc la preuve ici n'est pas de la donnée d'usage — c'est la vérification volontaire : retirer la clé de service pour confirmer que la chaîne d'alerte se déclenche réellement, casser la règle de propriété exprès pour confirmer que 5 des 7 tests l'attrapent. La north star produit que j'ai définie — le nombre d'utilisateurs qui reviennent un autre jour récupérer un fichier déposé lors d'une session précédente, sur 7 jours glissants — a un événement instrumenté (`file_downloaded` avec les propriétés `sameSession` et `fileAgeHours`) et un seuil d'arrêt fixé à l'avance : moins de 5 utilisateurs distincts faisant cela sur 30 jours signifie que le produit ne résout aucun problème réel. Je n'ai pas encore regardé ce chiffre, parce qu'il n'y a pas de vrai trafic à regarder.",
    },

    wouldRedo: {
      en: "If I started this project over, I'd pick a single identity system for both auth and data authorization from day one — Firebase Auth alone, or Clerk with a database that reads its session directly — instead of Clerk for auth and Firebase for authorization. The token bridge is a solid fix, but it exists only because two systems were bolted together after the fact. I'd also not have shipped \"share\" as a missing feature from day one: the audit of the tutorial's own decisions found no sharing at all, on a storage product whose homepage literally promised \"securely collaborate\" — sharing is the one growth channel a storage product has, and its absence was the single most consequential inherited decision I found.",
      fr: "Si je recommençais ce projet depuis le départ, je choisirais un seul système d'identité pour l'authentification et l'autorisation des données dès le premier jour — Firebase Auth seul, ou Clerk avec une base qui lit directement sa session — plutôt que Clerk pour l'authentification et Firebase pour l'autorisation. Le pont de jeton est un correctif solide, mais il n'existe que parce que deux systèmes ont été assemblés après coup. Je n'aurais pas non plus laissé le « partage » comme fonctionnalité absente dès le départ : l'audit des décisions du tutoriel a trouvé une absence totale de partage, sur un produit de stockage dont la page d'accueil promettait littéralement « securely collaborate » — le partage est le seul canal de croissance qu'un produit de stockage possède, et son absence a été la décision héritée la plus lourde de conséquences que j'ai trouvée.",
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
    role: {
      en: 'Front-end & motion architecture',
      fr: 'Front-end & architecture motion',
    },
    stack: ['Web Components', 'GSAP', 'ScrollTrigger', 'Lenis', 'Taxi.js'],
    color: '#00c2a8',
    image: '/photo/wattwiller.png',
    gallery: ['/photo/wattwiller-2.png', '/photo/wattwiller-3.png'],
    liveUrl: 'https://www.wattwiller.com/',
    metaDescription:
      'A non-intrusive animation layer built as custom web components — <c-title>, <c-media>, <c-desc> and more — used 90+ times across 32 templates, each tearing down its own GSAP/ScrollTrigger work on disconnect so SPA-like page transitions never leak.',

    problem: {
      en: [
        'A WordPress theme built from 32 different PHP templates needed consistent scroll and entrance animation across all of them, without every template author hand-wiring GSAP timelines and manually cleaning up listeners and ScrollTrigger instances on every page — and it needed to work inside SPA-like page transitions (Taxi.js swaps the `<body>` content instead of doing a hard reload), which raises the stakes on cleanup considerably.',
        'The usual failure mode at this scale is not that the animations look wrong — it is that leftover listeners and ScrollTrigger instances from a page you already navigated away from keep running, pointing at DOM nodes that no longer exist. Without a lifecycle mechanism, every internal navigation would leak one more running animation loop, and the site would slow down the longer someone stayed on it.',
      ],
      fr: [
        "Un thème WordPress construit à partir de 32 gabarits PHP différents avait besoin d'une animation de scroll et d'entrée cohérente sur tous, sans que chaque auteur de gabarit câble des timelines GSAP à la main et nettoie manuellement écouteurs et instances ScrollTrigger sur chaque page — et ça devait fonctionner à l'intérieur de transitions de page façon SPA (Taxi.js échange le contenu du `<body>` plutôt qu'un rechargement complet), ce qui augmente considérablement l'enjeu du nettoyage.",
        "Le mode d'échec habituel à cette échelle n'est pas que les animations sont incorrectes — c'est que des écouteurs et des instances ScrollTrigger oubliés d'une page déjà quittée continuent de tourner, pointant vers des nœuds DOM qui n'existent plus. Sans mécanisme de cycle de vie, chaque navigation interne ferait fuir une boucle d'animation de plus, et le site ralentirait à mesure que quelqu'un y restait.",
      ],
    },
    forWho: {
      en: 'Other front-end contributors on the same codebase, who needed to drop animation into a new template without becoming an expert in the cleanup discipline every scroll-triggered animation requires.',
      fr: "D'autres contributeurs front-end sur la même base de code, qui avaient besoin d'ajouter de l'animation dans un nouveau gabarit sans devenir expert de la discipline de nettoyage qu'exige chaque animation pilotée par le scroll.",
    },

    decisions: [
      {
        decision: {
          en: 'Built the animation layer as native custom elements (`<c-title>`, `<c-paragraph>`, `<c-desc>`, `<c-content>`, `<c-media>`, `<c-translation>`, `<c-medias>`, `<c-faq>`, `<c-description>`, `<c-path>` — 10 files, via the `piecesjs` micro-library) rather than a shared JS utility function.',
          fr: "Construction de la couche d'animation en éléments personnalisés natifs (`<c-title>`, `<c-paragraph>`, `<c-desc>`, `<c-content>`, `<c-media>`, `<c-translation>`, `<c-medias>`, `<c-faq>`, `<c-description>`, `<c-path>` — 10 fichiers, via la micro-bibliothèque `piecesjs`) plutôt qu'une fonction utilitaire JS partagée.",
        },
        why: {
          en: 'A custom element has a defined lifecycle — `mount()`/`unmount()` mapping to the native `connectedCallback`/`disconnectedCallback` — that a plain utility function does not. Wrapping existing HTML in a tag (`<h2><c-title>…</c-title></h2>`) means the browser itself tells you exactly when to arm the animation and when to tear it down, so a template author enables animation by wrapping markup, not by importing and manually invoking anything.',
          fr: "Un élément personnalisé a un cycle de vie défini — `mount()`/`unmount()` correspondant aux natifs `connectedCallback`/`disconnectedCallback` — qu'une simple fonction utilitaire n'a pas. Envelopper du HTML existant dans une balise (`<h2><c-title>…</c-title></h2>`) signifie que le navigateur lui-même indique exactement quand armer l'animation et quand la démonter, donc un auteur de gabarit active l'animation en enveloppant du markup, pas en important et invoquant manuellement quoi que ce soit.",
        },
      },
      {
        decision: {
          en: 'Every element kills its own GSAP tweens and ScrollTrigger instances on `unmount()` — no exceptions — which is what makes Taxi.js page transitions without a full reload viable at all.',
          fr: 'Chaque élément tue ses propres tweens GSAP et instances ScrollTrigger à `unmount()` — sans exception — ce qui rend viables les transitions de page Taxi.js sans rechargement complet.',
        },
        why: {
          en: 'Without this contract, navigating between templates without a hard reload would leak a running ScrollTrigger per page visited, each still pointing at a detached DOM node — a real memory and performance cost that would only surface after several navigations, hard to catch by testing one page at a time. Site.js destroys and recreates the shared `Partials` controller on every `NAVIGATE_END`, and each Web Component independently cleans up at its own disconnection — no coordination between them is needed.',
          fr: "Sans ce contrat, naviguer entre gabarits sans rechargement dur ferait fuir un ScrollTrigger par page visitée, chacun pointant encore vers un nœud DOM détaché — un vrai coût mémoire et performance qui ne surgirait qu'après plusieurs navigations, difficile à attraper en testant une page à la fois. Site.js détruit et recrée le contrôleur `Partials` partagé à chaque `NAVIGATE_END`, et chaque composant web se nettoie indépendamment à sa propre déconnexion — aucune coordination entre eux n'est nécessaire.",
        },
      },
      {
        decision: {
          en: 'A single centralized `requestAnimationFrame` loop (`Site.js`) drives both Lenis smooth-scroll and `ScrollTrigger.update()`, bridged through `ScrollTrigger.scrollerProxy` since Lenis replaces native scroll.',
          fr: "Une seule boucle `requestAnimationFrame` centralisée (`Site.js`) pilote à la fois le scroll fluide Lenis et `ScrollTrigger.update()`, reliés via `ScrollTrigger.scrollerProxy` puisque Lenis remplace le scroll natif.",
        },
        why: {
          en: "ScrollTrigger expects `window.scrollY` to advance natively; Lenis instead tracks its own virtual scroll position, so `scrollerProxy` hands ScrollTrigger a function that returns Lenis's `store.smoothScroll.scroll` value in place of the native one. Rather than each of the 90+ component instances running its own RAF loop, one shared loop advances Lenis then tells ScrollTrigger to re-evaluate every active trigger — the cost scales with the number of animated sections on a page, but each frame does the minimum shared work once instead of duplicating it per component.",
          fr: "ScrollTrigger s'attend à ce que `window.scrollY` avance nativement ; Lenis suit à la place sa propre position de scroll virtuelle, donc `scrollerProxy` donne à ScrollTrigger une fonction qui retourne la valeur `store.smoothScroll.scroll` de Lenis à la place de la native. Plutôt que chacune des 90+ instances de composant fasse tourner sa propre boucle RAF, une boucle partagée fait avancer Lenis puis demande à ScrollTrigger de réévaluer chaque trigger actif — le coût grandit avec le nombre de sections animées sur une page, mais chaque frame fait le travail partagé minimal une fois plutôt que de le dupliquer par composant.",
        },
      },
      {
        decision: {
          en: 'Shipped as a small set of reusable components, adopted 90+ times across 32 templates — and reserved GSAP for cases where its sequencing engine earns its cost, using plain CSS transitions for binary hover/menu states instead.',
          fr: "Livré comme un petit ensemble de composants réutilisables, adopté plus de 90 fois sur 32 gabarits — et GSAP réservé aux cas où son moteur de séquençage justifie son coût, avec de simples transitions CSS pour les états binaires de hover/menu.",
        },
        why: {
          en: 'The point of building this as a component library rather than a one-off effect was reuse at scale — a template author drops in the element and gets the teardown contract for free. But the header show/hide-on-scroll and the mobile menu use CSS `transition` on `transform` driven by JS class toggles, not GSAP: a two-state animation with no scroll-scrub or complex sequencing does not need a sequencing engine, and shared `cubic-bezier` custom properties keep the CSS transitions visually consistent with the GSAP-driven ones without duplicating any easing logic.',
          fr: "L'intérêt de construire ceci comme une bibliothèque de composants plutôt qu'un effet ponctuel était la réutilisation à l'échelle — un auteur de gabarit place l'élément et obtient le contrat de démontage gratuitement. Mais le header qui s'affiche/se masque au scroll et le menu mobile utilisent une `transition` CSS sur `transform` pilotée par des bascules de classe JS, pas GSAP : une animation à deux états sans scrub de scroll ni séquençage complexe n'a pas besoin d'un moteur de séquençage, et des variables CSS `cubic-bezier` partagées gardent les transitions CSS visuellement cohérentes avec celles pilotées par GSAP sans dupliquer la logique d'easing.",
        },
      },
    ],

    notDone: [
      {
        choice: {
          en: 'No central animation registry or global timeline manager.',
          fr: "Aucun registre d'animation centralisé ni gestionnaire de timeline global.",
        },
        reason: {
          en: 'A central manager would need every template to register and unregister correctly with it — reintroducing the exact coordination problem the per-element teardown contract was built to avoid. Keeping teardown local to each element means there is nothing shared to get out of sync.',
          fr: "Un gestionnaire central aurait exigé que chaque gabarit s'y enregistre et s'en désinscrive correctement — réintroduisant exactement le problème de coordination que le contrat de démontage par élément visait à éviter. Garder le démontage local à chaque élément fait qu'il n'y a rien de partagé à désynchroniser.",
        },
      },
      {
        choice: {
          en: 'Did not apply `prefers-reduced-motion` consistently — the parallax components (`<c-media>`, `<c-translation>`) respect it, the text-reveal components (`<c-title>`, `<c-paragraph>`, `<c-content>`, `<c-desc>`) and the SVG path-draw (`<c-path>`) do not.',
          fr: "Ne pas avoir appliqué `prefers-reduced-motion` de façon cohérente — les composants de parallaxe (`<c-media>`, `<c-translation>`) le respectent, les composants de révélation de texte (`<c-title>`, `<c-paragraph>`, `<c-content>`, `<c-desc>`) et le tracé SVG (`<c-path>`) ne le respectent pas.",
        },
        reason: {
          en: 'The parallax effects were treated as the most likely to cause vestibular discomfort, so they got the guard first under time pressure; the text-reveal components were judged lower-risk and left unguarded. That reasoning does not actually hold — a visitor with reduced-motion enabled still gets flying letter-by-letter text on every heading — and it is an inconsistency I would not defend, just one I can point at precisely.',
          fr: "Les effets de parallaxe ont été traités comme les plus susceptibles de provoquer un inconfort vestibulaire, donc ils ont reçu la garde en premier sous la pression du temps ; les composants de révélation de texte ont été jugés moins risqués et laissés sans garde. Ce raisonnement ne tient pas vraiment — un visiteur ayant activé la réduction de mouvement voit quand même du texte qui vole lettre par lettre sur chaque titre — et c'est une incohérence que je ne défendrais pas, juste une que je peux pointer précisément.",
        },
      },
    ],

    wouldMeasure: [
      {
        value: '90+',
        label: { en: 'USES ACROSS THE SITE', fr: 'UTILISATIONS SUR LE SITE' },
      },
      {
        value: '32',
        label: {
          en: 'TEMPLATES ADOPTING IT',
          fr: 'GABARITS ADOPTANT LA COUCHE',
        },
      },
      {
        value: '10',
        label: {
          en: 'DISTINCT C-* COMPONENTS SHIPPED',
          fr: 'COMPOSANTS C-* DISTINCTS LIVRÉS',
        },
      },
    ],
    wouldMeasureBody: {
      en: "The number I'd want to track in production is listener/ScrollTrigger instance count after navigating through several templates in a row without a reload — the direct test of whether the teardown contract actually holds at scale, not just in the templates it was first tested against. `page-transition.js` also has a documented, unused `destroy()` method — never called from anywhere in the codebase — which is the kind of code-smell a leak-count metric would immediately make relevant or irrelevant.",
      fr: "Le chiffre que je voudrais suivre en production est le nombre d'instances de listener/ScrollTrigger après avoir navigué à travers plusieurs gabarits d'affilée sans rechargement — le test direct de si le contrat de démontage tient vraiment à l'échelle, pas seulement dans les gabarits sur lesquels il a d'abord été testé. `page-transition.js` a aussi une méthode `destroy()` documentée mais inutilisée — jamais appelée nulle part dans le code — le genre de signal qu'une métrique de fuites rendrait immédiatement pertinent ou non.",
    },

    wouldRedo: {
      en: "I'd write an automated test that mounts and unmounts every template in a loop and asserts the ScrollTrigger/listener count returns to zero each time — today that contract is enforced by convention and code review, not by a test that would catch a regression automatically the next time someone adds a template. I'd also fix the header's scroll-direction listener, which reads native `window.scrollY` directly instead of the Lenis-driven `store.currentScroll` the rest of the codebase treats as the source of truth — it happens to work today because Lenis lets native scroll advance in parallel, but it is the one place that quietly ignores the project's own convention.",
      fr: "J'écrirais un test automatisé qui monte et démonte chaque gabarit en boucle et vérifie que le nombre d'instances ScrollTrigger/listeners revient à zéro à chaque fois — aujourd'hui ce contrat est appliqué par convention et revue de code, pas par un test qui attraperait automatiquement une régression la prochaine fois que quelqu'un ajoute un gabarit. Je corrigerais aussi l'écouteur de direction de scroll du header, qui lit directement le `window.scrollY` natif plutôt que le `store.currentScroll` piloté par Lenis que le reste du code traite comme source de vérité — ça fonctionne aujourd'hui parce que Lenis laisse le scroll natif avancer en parallèle, mais c'est le seul endroit qui ignore discrètement la convention propre au projet.",
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
