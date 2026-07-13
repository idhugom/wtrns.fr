# CLAUDE.md — WTRNS (wtrns.fr)

Guide de référence pour toute intervention de Claude sur ce dépôt. À lire **avant**
chaque session. Ce fichier documente les règles de travail, la ligne éditoriale et le
workflow concret de publication. Il ne modifie pas le site existant : il cadre les
prochaines interventions.

---

## ⚠️ Règles d'intervention (non négociables)

### Règle n°1 — TOUJOURS travailler sur `main`
Toute session (développement, rédaction, amélioration, correction…) se fait
**directement sur la branche `main`**. Ne **JAMAIS** créer de branche ni travailler
sur une branche secondaire. `main` est la branche de production Cloudflare Pages :
chaque push déclenche le déploiement.

### Règle n°2 — Toujours en qualité optimale
Se mettre systématiquement dans le réglage **le plus intelligent / le plus performant**
du modèle pour chaque intervention (rédaction, code, raisonnement).
**Seule exception :** la génération d'images OpenAI reste en `quality: "medium"` (voir §6).

### Règle n°3 — Clés API / tokens depuis l'environnement
Les clés et tokens nécessaires sont fournis dans l'environnement cloud de Claude Code
via les **variables d'environnement** (`process.env` / `os.environ`) :
`OPENAI_API_KEY`, `OPENAI_TEXT_MODEL`, `OPENAI_IMAGE_MODEL`, clés Cloudflare, etc.
Les **récupérer depuis l'environnement** ; ne jamais les redemander, ne **jamais** les
écrire en dur dans le code ni dans un commit.

---

## 0. Règles d'or rédaction (prioritaires)

1. **Rédaction par Claude, pas par l'API.** Le contenu de chaque article est écrit par
   **toi, Claude** (le réglage le plus intelligent), **directement en session** — plus
   par le pipeline OpenAI Batch. *Historiquement* le contenu était généré via l'API
   (`gpt-5.6-terra`, Batch API — cf. `scripts/`, `README.md`) ; **cette approche est
   dépassée pour la rédaction**. Désormais **Claude rédige**. **Seules les images**
   passent encore par OpenAI (§6).
2. **Anti-cannibalisation.** Si le sujet est libre, **vérifie d'abord l'existant**
   (`data/posts.json` + `data/content/`) : chaque nouvel article doit porter sur un
   angle **différent** de ce qui est déjà publié, pour éviter la cannibalisation SEO (§3).
3. **Qualité avant tout.** Chaque article doit réellement apporter **la meilleure info
   du web** sur son sujet : des détails en plus et, **selon la pertinence**, des éléments
   riches (tableau, comparaison, astuces, FAQ, citation, chiffres…). Ce sont des
   **exemples** — pas une checklist à cocher intégralement à chaque fois (§4).
4. **Photo OpenAI obligatoire.** Ne **jamais** publier un article sans visuel. Toujours
   une **vraie photo à la une générée par OpenAI**, « photo généraliste sur le thème,
   ultra réaliste », **avant publication** (§6).
5. **Liens internes.** Ajouter **1 à 4 liens internes** par article vers d'autres pages
   réelles du site (§5).

---

## 1. Le site en bref

**WTRNS — « le mag qui pétte »** ([wtrns.fr](https://wtrns.fr)) est un magazine de
**guides ultra-complets, sans blabla**. La promesse : transformer une requête banale en
**guide de référence**, clair, complet et **actionnable**, où l'on trouve sa réponse en
quelques secondes.

- **Volume :** ~660 guides couvrant des sujets grand public variés.
- **Positionnement :** no-bullshit, on répond à **l'intention de recherche de A à Z**
  (définition → méthode → critères de choix → prix/coûts → pièges → exemples → cadre
  légal si pertinent), pas juste la surface.
- **Design :** **neo-brutalist électrique** (bordures épaisses, ombres portées franches,
  aplats de couleurs vives lime/cyan/pink/yellow/violet, typo display Archivo /
  Space Grotesk / Space Mono).
- **Stack :** **Astro** (SSG, sortie `dist/`), polices self-hosted (`@fontsource`),
  **zéro dépendance runtime externe** (tout est inliné/bundlé), **Sharp** pour les images.
- **SEO :** sitemap, **RSS** (`/rss.xml`), **JSON-LD** (`Article`, `FAQPage`,
  `BreadcrumbList`) générés automatiquement à partir du HTML de l'article.
- **Déploiement :** **Cloudflare Pages** connecté à GitHub — branche prod `main`,
  build `npm run build`, sortie `dist`. Un middleware edge (`functions/_middleware.js`)
  redirige `www.*` → apex en 301.
- **URLs :** `trailingSlash: 'never'`, un article = `https://wtrns.fr/<slug>`. Les slugs
  hérités de l'ancien site WordPress sont **conservés à l'identique** (préservation SEO) —
  ne jamais renommer un slug existant.

**Thématiques (clusters, dérivées du slug/titre dans `src/lib/posts.js`) :**
Assurance & Finance · Cuisine & Recettes · Moto & Mobilité · Déco & Lifestyle ·
Impression & Print · Immobilier & Habitat · Santé & Bien-être · Digital & Business ·
« Le mag » (divers). Un article est classé automatiquement ; il apparaît sur sa page
thématique `/theme/<key>` et dans le fil d'Ariane.

---

## 2. Identité & ton

- **Tutoiement** systématique (« ta question », « tu repars avec une décision »).
- **Voix :** experte, directe, **no-bullshit**, un brin punchy (« ça pétte », « zéro
  blabla »). Signature éditoriale : « Par la rédac WTRNS ».
- **Jamais racoleur, jamais creux.** Pas de promesses trompeuses, pas d'infos inventées.
  Rester **factuel et prudent sur les chiffres** : « environ », « en général »,
  fourchettes plutôt que faux précis.
- **Clarté avant l'effet de style :** le ton punchy sert la lisibilité, il ne la remplace
  pas. Phrases nettes, vocabulaire concret, on va au but.
- **Utile et neutre :** on informe et on aide à décider, on ne survend pas un produit.
- **Français impeccable** (orthographe, typographie : espaces insécables avant `; : ? !`,
  guillemets « … », apostrophes typographiques ’).

---

## 3. Avant d'écrire — anti-cannibalisation

Objectif : **ne jamais publier deux articles qui se disputent le même mot-clé.**

1. **Inventaire de l'existant.** Avant toute rédaction à sujet libre, parcours
   `data/posts.json` (titres + slugs) et `data/content/` pour lister ce qui traite déjà,
   même de loin, le sujet visé.
2. **Test de recoupement.** Si un article existant couvre déjà **la même intention de
   recherche**, ne crée pas de doublon : soit tu choisis un **angle nettement différent**
   (sous-sujet, cas d'usage précis, comparatif, longue traîne), soit tu **enrichis
   l'article existant** plutôt que d'en publier un concurrent.
3. **Un article = une intention.** Chaque guide cible une intention claire et distincte.
   Les articles proches doivent se **compléter** (et se lier entre eux, cf. §5), pas se
   cannibaliser.
4. **Slug :** un slug court, descriptif, en minuscules, mots séparés par des tirets, sans
   accents. Pour un contenu qui reprend un ancien post WordPress, **garder le slug
   d'origine**.

---

## 4. Qualité rédactionnelle

**Objectif : être le meilleur résultat du web sur la requête.** On répond à 100 % de
l'intention, on anticipe **toutes** les questions annexes, zéro remplissage.

**Structure attendue (contrat HTML du champ `html`) :**
- **Pas de `<h1>`** (le titre est géré par le template). Commencer par un **`<p>`
  d'introduction fort** qui pose le sujet et la promesse (idéalement le `<strong>` de la
  question posée en ouverture).
- Sections en **`<h2>`** (elles alimentent le sommaire/TOC automatiquement), sous-sections
  en `<h3>`.
- **Balises autorisées uniquement :** `<h2> <h3> <p> <ul>/<li> <ol>/<li>
  <table><thead><tr><th> <tbody><tr><td> <blockquote> <strong> <em> <a href>`.
- **Encadré « à retenir » :** `<aside class="keybox"><h4>À retenir</h4><p>…</p></aside>`.
- **Comparaison 2 colonnes** (quand le sujet oppose deux options, sinon l'omettre) :
  `<div class="compare"><div class="col"><h4>Option A</h4>…</div><div class="col"><h4>Option B</h4>…</div></div>`.
- **FAQ finale** (5 à 7 vraies questions d'internautes) :
  `<section class="faq"><h2>FAQ</h2><details><summary>Question ?</summary><p>Réponse</p></details>…</section>`
  → alimente automatiquement le JSON-LD `FAQPage`.
- Les **`<table>`** sont automatiquement enveloppées pour le scroll horizontal mobile —
  écrire un tableau HTML simple suffit.

**Éléments riches — selon pertinence, pas systématiques** (ce sont des exemples) :
au moins un **tableau** comparatif/récapitulatif quand ça clarifie, un **encadré clé**,
des **listes** à puces/numérotées pour étapes et critères, une **comparaison 2 colonnes**
si deux options s'opposent, des **chiffres/fourchettes** prudents, une **citation**
(`<blockquote>`) si elle apporte. Ne pas tout empiler pour cocher des cases : **mettre ce
qui sert vraiment le lecteur.**

**Repères de forme :**
- Longueur cible : **~1300 à 2000 mots** de contenu réel et utile (adapter au sujet).
- `meta_description` : **150-160 caractères**, accrocheuse, avec le mot-clé principal.
- `reading_time_min` : entier réaliste.
- `toc` : liste des titres de `<h2>` dans l'ordre.

---

## 5. Liens internes (1 à 4 par article)

- Insérer **1 à 4 liens internes** dans le corps, en **texte naturel/contextuel**, vers
  d'autres **pages réelles** du site : `<a href="/<slug-existant>">ancre descriptive</a>`.
- **Vérifier que chaque slug cible existe** (`data/posts.json`) — pas de lien mort.
- **Privilégier la même thématique** ou un sujet réellement complémentaire (renforce le
  maillage du cluster). La section « À lire aussi » en bas d'article est **déjà
  automatique** (via `relatedPosts`) : les liens du §5 sont **en plus**, dans le texte.
- Ancre **descriptive** (pas de « cliquez ici ») ; lien pertinent, jamais forcé.
- Liens **internes** en chemin absolu racine (`/mon-slug`), sans `target`/`rel`
  particulier. Un éventuel lien **externe** contextuel doit rester rare, pertinent et
  justifié.

---

## 6. Photo — toujours une vraie photo OpenAI avant publication

**Règle absolue :** jamais d'article sans visuel. **Toujours** une **vraie photo de
couverture générée par OpenAI**, « photo généraliste sur le thème, **ultra réaliste** »,
**avant publication**.

**Modèle & paramètres** (via `OPENAI_API_KEY` de l'environnement — cf. Règle n°3) :

```json
{ "model": "gpt-image-2", "size": "1536x1024", "quality": "medium" }
```

- **Une seule image (hero)** par article. **Pas de galerie**, pas d'image dans le corps.
- **Style :** photographie éditoriale ultra-réaliste, lumière naturelle, faible
  profondeur de champ, cadrage paysage, couleurs crédibles.
- **Interdits dans l'image :** aucun texte/lettre/chiffre, aucun logo, aucun filigrane,
  **aucun visage reconnaissable**.
- **Post-traitement** (cohérence avec l'existant) : convertir en **JPEG**, redimensionner
  à **largeur max 1280 px** (ratio conservé), qualité ~82, progressif.
- **Emplacement :** `public/img/posts/<slug>.jpg`. Renseigner un **`image_alt`**
  descriptif dans `data/posts.json` (accessibilité + SEO).
- Le modèle peut être surchargé par `OPENAI_IMAGE_MODEL` s'il est défini dans
  l'environnement ; à défaut, `gpt-image-2`.

---

## Annexe technique — publier un article (workflow concret)

Un article publié = **4 éléments** ajoutés au dépôt, puis build + commit + push sur `main`.

1. **`data/content/<slug>.json`** — le contenu rédigé par Claude :
   ```json
   { "meta_description": "150-160 car.", "reading_time_min": 9,
     "toc": ["Titre h2 1", "Titre h2 2", "…", "FAQ"],
     "html": "<p><strong>…</strong> intro forte…</p><h2>…</h2>…<section class=\"faq\">…</section>" }
   ```
2. **`data/posts.json`** — **ajouter en tête** de tableau (les nouveaux d'abord) l'objet
   métadonnées :
   ```json
   { "id": <int unique>, "slug": "<slug>", "title": "<titre exact>",
     "date": "2026-07-13T09:00:00", "modified": "2026-07-13T09:00:00",
     "excerpt": "<résumé>", "image": "https://wtrns.fr/img/posts/<slug>.jpg",
     "image_alt": "<description de l'image>" }
   ```
   Le site trie « contenu publié d'abord, puis date décroissante » : un `date` récent et
   la présence du fichier `content/` suffisent à le faire remonter.
3. **`public/img/posts/<slug>.jpg`** — l'image hero OpenAI (§6).
4. **`data/img_manifest.json`** — ajouter le `<slug>` à la liste (déclare l'image locale ;
   `readingTime`/`Thumb` s'appuient dessus).

**Le contenu est bundlé au build via Vite glob** (`import.meta.glob` dans
`src/lib/posts.js`) : pas de lecture `fs` runtime — il suffit que les fichiers existent
au moment du `npm run build`.

**Commandes :**
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/  (valider AVANT de commit/push)
npm run preview
```

**Vérifs avant push :** `npm run build` passe · l'article s'affiche (TOC, tableaux, FAQ,
encadrés) · JSON-LD `FAQPage` généré (FAQ en `<details><summary>`) · 1 à 4 liens internes
valides · image hero présente et référencée dans le manifeste.

**Commit & push :** commits clairs et descriptifs, **directement sur `main`** (Règle n°1) :
```bash
git add data/ public/img
git commit -m "content: nouvel article <thème> (<sujet>)"
git push -u origin main   # retry avec backoff (2s,4s,8s,16s) si erreur réseau
```

**Ne pas créer de Pull Request** sauf demande explicite. Ne jamais committer de secret
(Règle n°3) ni de fichier de travail ignoré (`.env`, `data/*.log`, `dist/`, `node_modules/`).

**Scripts historiques** (`scripts/`) : `fetch_posts.py` (import WordPress),
`gen_images.py` / `regen_images.py` (images OpenAI en lot), `download_images.mjs`,
`img_manifest.mjs`, `make_og.mjs`, etc. Les scripts de **génération de texte**
(`submit_batch.py`, `gen_sync.py`, `gen_common.py`, `collect_batch.py`) sont **hérités** :
la rédaction se fait désormais **par Claude en session**, pas par ce pipeline.
