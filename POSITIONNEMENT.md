# POSITIONNEMENT.md — Diagnostic de perception

Contexte : ce document analyse ce que le site dit de toi tel qu'il existe **après le LOT 0** (case studies dépubliées, TEMP DEBUG retiré, OG image générée — commit `519b79d`). Le contenu et la structure n'ont pas changé, seulement l'atteignabilité de trois routes.

Public visé, par ordre : lead technique / EM (60 secondes) → recruteur non technique → fondateur startup.

---

## 1. Ce que le site dit de toi, dans l'ordre où un visiteur le perçoit

### Avant même la page (métadonnées, partage de lien, onglet)
Le `<title>` du navigateur, la description du moteur de recherche, la carte OpenGraph partagée sur LinkedIn/Slack — les trois disent la même chose, verbatim, trois fois : **« Creative Web Developer »**. Les `keywords` du `<head>` listent 15 termes ; aucun n'est « fullstack », « product », « backend », ni « engineer ». Un lead technique qui reçoit ton lien sur Slack voit cette phrase **avant d'avoir cliqué**.

### Premier écran (0-3 secondes)
Le Hero affiche, dans cet ordre visuel : un badge « Creative Developer » juste au-dessus de ton nom, un canvas Three.js avec particules et lumières colorées en fond, ton nom en typographie géante, puis « Crafting immersive web experiences with code & creativity ». Le rôle explicite, littéral, est écrit noir sur blanc : **Creative Developer**. Ce n'est pas une ambiance suggérée par le design — c'est un label texte.

Le bandeau de confiance en dessous (« Trusted by » Brasserie Licorne, Salpa, BDR Thermea, Viettel) est le seul élément qui suggère une pratique professionnelle réelle avec de vrais clients — mais il est en petit texte, sous la ligne, après l'impression visuelle déjà formée.

### 10 premières secondes (scroll initial)
Immédiatement après le Hero : un marquee défilant répète « CREATIVE DEVELOPER · NEXT JS · GSAP · THREE.JS · FRAMER MOTION · OPEN TO WORK ». C'est la **deuxième** fois en 10 secondes que le mot « Creative Developer » apparaît à l'écran, cette fois comme une bannière qui traverse tout l'écran.

Puis vient About, dont le titre est : **« A developer who thinks like a designer. »** Troisième variation sur le même thème en moins de 15 secondes : pas ingénieur, pas produit — designer-qui-code.

### Premier scroll complet (structure de la home)
L'ordre complet : Hero → marquee → About → marquee → **Services** → marquee → Projects → marquee → **Lab** → Contact.

Le bloc Services (« SERVICES & CRAFT ») liste trois offres : 3D & WebGL, Motion & Interaction, Creative Engineering — dans cet ordre. Les deux premières sont explicitement de l'animation/WebGL. La troisième, la seule à mentionner l'ingénierie, est sous-titrée « with a designer's eye » et vient en dernier. Un lead technique qui lit ce bloc comprend : *cette personne vend de l'animation, et accessoirement du code propre*.

Le Lab arrive après Projects, pas en annexe — il est dans le flux principal de scroll, avec pour accroche « Touch it. Break it. Make it yours. » : trois jouets génératifs (ASCII fluide, particules physiques, flow field). Encore une couche de « creative coder ».

Quatre marquees, interposés entre chaque section, répètent en boucle : CREATIVE DEVELOPER, ANIMATION · INTERACTION · DESIGN · CODE · CRAFT, EXPERIMENTS · WEBGL · MATTER.JS · SIMPLEX NOISE. Impossible de scroller la home sans retraverser ce message au moins six fois.

**Verdict de la séquence complète** : un lead technique qui passe 60 secondes sur cette page reçoit le même signal répété nine fois (title, description, keywords, badge Hero, marquee ×4, headline About, Services) avant de croiser la moindre preuve de raisonnement produit, de décision d'architecture, ou de résultat mesuré. Le signal est cohérent, professionnel, bien exécuté — et c'est exactement le problème : c'est un positionnement agence créative parfaitement clair, qui n'est pas celui que tu vises.

---

## 2. Élément par élément — sert / neutre / dessert

| Élément | Verdict | Argument |
|---|---|---|
| **Loader** | *(n'existe plus)* | Retiré au commit `6f35cbe` — le Hero s'anime au mount. Non pertinent pour ce diagnostic, mais bon réflexe : un lead technique n'a pas à attendre une animation d'intro pour lire du contenu. |
| **Badge « Creative Developer » (Hero)** | **Dessert** | C'est l'affirmation la plus directe et la plus visible du mauvais positionnement. Un lead technique de boîte produit qui lit « Creative Developer » classe immédiatement le profil dans « agence / freelance visuel », avant même de voir un seul projet. |
| **Canvas Three.js en fond du Hero** | **Neutre à légèrement dessert** | Techniquement solide (tu le démontres en Phase 4 avec le Lab), mais en fond du Hero, sans légende, il se lit comme de la décoration, pas comme une preuve d'ingénierie. Un lead technique ne sait pas qu'il regarde un système de particules GPU maîtrisé — il voit juste « joli fond animé ». |
| **Curseur custom** | **Dessert légèrement** | Pur flourish esthétique (4 variants, physique de ressort, squash/stretch). Aucune fonction produit. Sur desktop uniquement, donc pas gênant pour l'usage, mais renforce le signal « soin visuel avant tout » à chaque mouvement de souris — y compris pendant que le lead technique lit le reste du site. |
| **Marquees (×4)** | **Dessert fortement** | Le pire multiplicateur du problème : ce ne sont pas des éléments qu'on peut ignorer une fois, ils reviennent à chaque transition de section et répètent « CREATIVE DEVELOPER » / « ANIMATION · INTERACTION · DESIGN · CODE · CRAFT » / « EXPERIMENTS · WEBGL ». Ils transforment un mauvais message en message inévitable. |
| **Headline About : « thinks like a designer »** | **Dessert** | Direct, explicite, mémorable — donc d'autant plus problématique. Pour un lead technique, « pense comme un designer » ne dit rien sur la capacité à cadrer un projet, chiffrer un risque, ou tenir une prod. C'est un compliment de studio créatif, pas une preuve de compétence produit. |
| **Bloc Services (« SERVICES & CRAFT »)** | **Dessert** | Auto-déclaré comme offre de service — 2 des 3 cartes sont de l'animation/WebGL, la 3ème (« Creative Engineering ») est reléguée en dernier et qualifiée « avec l'œil d'un designer ». Le terminal factice dans cette 3ème carte (`git commit -m 'pixel-perfect'`) est la seule esquisse d'ingénierie du bloc, et elle est cosmétique. |
| **Projects (structure horizontale scroll-jackée)** | **Neutre** | Le mécanisme (carousel horizontal pinné) est un choix d'expérience, pas un signal de positionnement en soi — il fonctionne, il est fluide. Le vrai problème n'est pas le mécanisme, c'est ce qu'il transporte (voir point 3). |
| **Lab** | **Dessert dans sa position actuelle, mais l'actif est bon** | Le Lab lui-même (WebGL, compute shaders, contrat pause/resume) est ton meilleur travail technique. Mais présenté comme « Touch it. Break it. Make it yours. » dans le flux principal, juste après Projects, il referme la visite sur une note « jouets créatifs » plutôt que « ingénierie sous contrainte ». C'est un problème de cadrage et de position, pas de contenu — traité en Phase 4. |
| **404 piano** | **Dessert, mais avec la meilleure excuse** | Un piano 3D jouable entièrement en français, sans fallback anglais, avec une esthétique « galerie/luxe » différente du reste du site. C'est un effort d'ingénierie réel (rotation, zoom, interaction clavier) mais il ne sera vu que par un visiteur qui a cliqué un lien mort — l'investissement créatif est mal placé : il brille là où (quasi) personne ne le voit, et son absence d'anglais est un vrai defaut pour un profil qui vise l'international (Vietnam, ESN). |
| **Page/section About : contenu (story, stats)** | **Neutre à dessert** | Le texte factuel (« 4+ yrs exp, 20+ clients, 3 countries », « shipped to real clients, in real production ») est un bon matériau brut — mais il est encadré par un headline design-first et ne contient aucune preuve de raisonnement (pas de décision citée, pas de risque, pas de méthode). C'est une biographie, pas une démonstration de compétence produit. |
| **Contact (carte Europe, "Open to relocate")** | **Neutre** | Fonctionnel et sobre. Ne dessert pas, ne sert pas particulièrement le repositionnement — mais gagnerait à afficher clairement Hanoi/Vietnam si c'est la cible géographique désormais. |
| **Nav : item "Services"** | **Dessert légèrement** | Le simple fait d'avoir "Services" dans la nav principale, au même niveau que Projects, cadre le site comme une vitrine de prestataire créatif plutôt qu'un portfolio d'ingénieur produit qui documente son travail. |

---

## 3. Ce qui manque totalement pour un positionnement product engineer

Rien, nulle part sur le site actuel, ne montre :

- **Une décision de cadrage justifiée** — pourquoi tel choix technique ou produit plutôt qu'un autre, et ce qu'il en coûte. (Le refus du paiement en ligne sur Askar, le choix CMS vs code en dur, le revert de LazyMotion : zéro trace.)
- **Un risque identifié et coté** — aucune mention de ce qui aurait pu mal tourner, ni de comment tu l'as anticipé.
- **Une mesure, avant/après** — pas un seul chiffre de performance, de fiabilité, ou d'impact business sur tout le site (les "20+ CLIENTS" et "4+ YRS EXP" sont les seuls chiffres, et ce sont des chiffres de CV, pas de résultat).
- **Une preuve d'exploitation en production** — supervision, incident, correctif, tests. Le mot "production" apparaît une fois dans le body About ("shipped to real clients, in real production") mais sans aucune preuve derrière.
- **Une preuve de traitement de données à l'échelle** — le cas Brasserie Licorne (50k+ lignes CSV → 2 250 fiches) existe dans la vraie vie mais est invisible : sur le site, ce projet n'est qu'une carte "Production site... custom GSAP animations."
- **Une trace de renoncement assumé** — "ce que j'ai choisi de ne pas faire" n'existe nulle part ; tout ce qui est montré est présenté comme un succès plat, jamais comme un arbitrage.

Autrement dit : le site documente **ce qui a été livré**, jamais **comment la décision a été prise**. C'est exactement l'inverse de ce qui fait la différence pour le public visé.

---

## 4. Verdict — la plus petite série de changements qui bascule la perception

Je ne recommande pas de reconstruire le site. Le craft est réel, bien exécuté, et reste un différenciateur — il doit juste changer de place et de justification. Les cinq leviers minimaux, par ordre d'impact :

1. **Remplacer "Creative Developer" par un rôle product/fullstack partout où il apparaît en dur** : `<title>`, meta description, keywords, badge Hero, headline About, marquees. C'est un changement de texte, pas de structure — mais il élimine 8 des 9 répétitions du mauvais signal identifiées en partie 1.
2. **Faire des case studies le cœur du site** (déjà en cours, Phase 3) — c'est le seul endroit qui peut porter la preuve de raisonnement (Askar, Licorne). Sans ce contenu, changer les mots-clés seulement produirait un site qui *dit* "product engineer" sans le *prouver* — pire à terme qu'un positionnement créatif honnête.
3. **Redescendre le Lab d'un cran et le recadrer** comme preuve de rigueur technique sous contrainte (GPU, pause/resume) plutôt que comme argument principal — sans supprimer son contenu.
4. **Retirer ou requalifier le bloc Services** : soit il disparaît de la nav/home (un product engineer ne "vend pas des services créatifs"), soit il devient une preuve de polyvalence technique cadrée différemment.
5. **Traiter les décorations (marquees, curseur, 404 piano) comme des accents, pas des porte-drapeaux** : elles peuvent rester, mais ne doivent plus porter le message textuel principal du site à elles seules.

La Phase 2 propose la nouvelle hiérarchie qui opérationnalise ces cinq points.

---

*Prêt pour validation avant la Phase 2 (nouvelle hiérarchie de la home et de la navigation).*
