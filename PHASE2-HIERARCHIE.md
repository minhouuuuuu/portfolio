# PHASE 2 — Nouvelle hiérarchie (home + navigation)

Prérequis : [POSITIONNEMENT.md](POSITIONNEMENT.md). Ce document propose la structure qui opérationnalise les 5 leviers du verdict. Aucune reconstruction : mêmes composants, mêmes assets, ordre et cadrage différents.

---

## Principe d'organisation

Un lead technique lit la home de haut en bas une seule fois, en 60 secondes, avant de décider s'il clique sur une case study ou s'il ferme l'onglet. La hiérarchie doit donc faire, dans l'ordre : **prouver que je résous des problèmes → prouver que je livre en prod → prouver que je maîtrise la technique → laisser une trace de curiosité**. Le recruteur non technique doit pouvoir suivre la même page sans se perdre : chaque section garde un titre lisible sans jargon, même quand la preuve en dessous est technique.

---

## Nouvelle navigation

| Ordre | Item | Change vs actuel | Pourquoi |
|---|---|---|---|
| 1 | **Work** (ex-"Projects") | renommé | "Work" est le mot que lit un lead produit ; "Projects" sonne portfolio étudiant. Pointe vers `#work`, qui *est* les case studies. |
| 2 | **About** | inchangé de position | Reste tôt dans la nav — un recruteur veut vérifier qui tu es avant de creuser. |
| 3 | **Lab** | inchangé de position dans la nav | La nav n'a pas besoin de refléter l'ordre de scroll de la home ; garder Lab visible et nommé pareil évite de le cacher, cf. Phase 4. |
| 4 | **Contact** | inchangé | — |
| — | **Services** | **retiré de la nav et de la home** | Décision explicite ci-dessous. |

Le CTA `HIRE ME` / `ME RECRUTER` reste, il ne dessert rien — c'est un signal de disponibilité, pas de positionnement créatif.

### Décision : Services

Le bloc Services est retiré de la home et de la nav, pas juste recadré. Argument : un product engineer ne présente pas un menu de "prestations" (3D & WebGL / Motion / Creative Engineering) — c'est un réflexe d'agence/freelance qui cadre le visiteur comme un client potentiel de prestation plutôt que comme un recruteur évaluant une embauche. Les compétences que ce bloc voulait montrer (WebGL, motion, code propre) sont mieux démontrées *en preuve* dans les case studies et le Lab qu'*en déclaration* dans une carte de service. Le composant `Services.tsx` n'est pas supprimé du code — il sort simplement de `app/page.tsx` — au cas où tu voudrais le récupérer pour une page freelance séparée plus tard.

---

## Nouvelle structure de la home

| # | Section | Ce qu'il prouve | À qui il s'adresse | Pourquoi à cette place |
|---|---|---|---|---|
| 1 | **Hero** (recadré) | Identité + disponibilité + preuve sociale immédiate | Les trois publics | Premier écran, doit rester lisible par tous en 3 secondes. Le badge passe de "Creative Developer" à un intitulé product/fullstack (texte exact à trancher avec toi, ex. "Fullstack Developer — Product-minded" ou "Product Engineer"). Le "Trusted by" (Licorne, Salpa, BDR Thermea, Viettel) monte en priorité visuelle : c'est ta seule preuve sociale immédiate et elle est aujourd'hui sous-exploitée. |
| 2 | **Work / Case studies** (déplacé en 2ème position, ex-8ème) | **Preuve de raisonnement produit** — la contrainte non négociable de la Phase 2 | Lead technique en premier, fondateur en second | C'est le changement structurel le plus important : les case studies passaient après About, Services, et un marquee — désormais elles arrivent immédiatement après le Hero, avant toute autre section. Un lead technique qui scrolle une fois tombe directement sur la preuve, pas sur de la décoration. |
| 3 | **About** (contenu inchangé, headline à revoir) | Qui tu es, où, depuis quand — contexte humain après la preuve | Recruteur non technique surtout | Descend en 3ème position : utile pour situer la personne, mais n'a pas besoin de précéder la preuve. Le headline "A developer who thinks like a designer" est à remplacer (proposition Phase 2 ci-dessous). |
| 4 | **Lab** (recadré, ex-10ème → reste après About/Work) | Profondeur technique et curiosité — pas l'argument principal | Lead technique qui veut vérifier la substance | Reste après le contenu produit, comme demandé. Change de justification en Phase 4 : "compute shaders, contrat pause/resume, contrainte GPU" plutôt que "Touch it. Break it." |
| 5 | **Contact** | Disponibilité, canal de prise de contact | Les trois publics | Position finale inchangée — c'est la bonne place pour un CTA de clôture. |

**Marquees** : réduits de 4 à 1, placé uniquement entre Hero et Work. Contenu remplacé : au lieu de répéter "CREATIVE DEVELOPER / ANIMATION / EXPERIMENTS", il porte les mots-clés produit + stack réelle (ex. "PRODUCT ENGINEERING · NEXT.JS · TYPESCRIPT · SYSTEM DESIGN · SHIPPED TO PRODUCTION"). Un seul passage, pas un multiplicateur de message à chaque scroll.

---

## Décisions explicites : loader, curseur, 404

### Loader
N'existe déjà plus (retiré au commit `6f35cbe`, confirmé en Phase 1). **Rien à faire.** Bon état : le contenu s'affiche immédiatement, ce qui sert n'importe quel positionnement.

### Curseur custom
**Décision : garder, ne pas mettre en avant.** Il ne dessert pas activement une fois qu'on a compris le problème principal (le texte, pas l'interaction) — c'est un raffinement discret que seul un visiteur desktop remarque, et il ne contredit rien pour un lead technique qui l'associe correctement à du soin d'exécution *une fois* le reste du site repositionné. Le risque n'est pas le curseur lui-même, c'est qu'il agisse comme accélérateur du mauvais signal quand tout le reste (badge, headline, marquees) dit "creative developer" en boucle. Une fois ces textes changés, le curseur redevient un détail plutôt qu'un porte-drapeau. Aucune modification nécessaire.

### 404 piano
**Décision : garder le piano, corriger le manque d'anglais.** L'argument de suppression serait : personne ne le voit, donc l'effort est mal placé. Mais le supprimer perd un actif d'ingénierie réel sans gain de perception (une 404 générique n'aide personne). La correction minimale et proportionnée : ajouter le fallback anglais (le reste du site est bilingue, la 404 ne doit pas être la seule exception) — cf. `decisions/ADR-002` à rédiger si tu valides. Aucun changement de position ou de mise en avant : la 404 reste ce qu'elle est, un easter egg technique, pas un argument de vente.

---

## Proposition de headline About (à valider)

Remplacer :
> EN: "A developer who thinks like a designer." / FR: "Un développeur qui pense comme un designer."

Par une formulation qui garde ton origine design (différenciateur réel, à ne pas effacer) mais la subordonne à la compétence produit :
> EN: "Design instincts, shipped like an engineer." / FR: "Des réflexes de designer, livrés comme un ingénieur."

C'est une proposition, pas une décision arrêtée — à ajuster avec toi une fois les case studies rédigées (Phase 3), pour que le headline ne promette rien que le contenu en dessous ne prouve pas.

---

## Ce que cette phase ne change PAS

- Aucun composant supprimé (Services sort de `page.tsx`, pas du repo).
- Aucune nouvelle techno, aucun refactor technique.
- Le Lab garde tout son contenu (3 expériences, tabs, détection GPU) — seule la home autour de lui change.
- Les stats About (4+ yrs, 20+ clients, 3 countries) restent — elles sont factuelles et neutres.

---

## Ce qui reste en attente de ta décision

1. **Le texte exact du badge Hero** (remplaçant "Creative Developer") — je propose "Product Engineer" ou "Fullstack Developer" selon la cible d'offre exacte que tu vises en priorité (les deux sont dans ton brief initial).
2. **Le headline About** proposé ci-dessus — à valider ou ajuster.
3. **Le contenu du marquee unique** — wording exact à arrêter une fois le badge Hero tranché (les deux doivent être cohérents).

Une fois validée, cette hiérarchie sert de charpente pour la Phase 3 (les case studies, qui devient la section la plus longue et la plus travaillée de la home) et la Phase 4 (recadrage du Lab).

---

*Prêt pour validation avant la Phase 3 (structure et squelette des 4 case studies).*
