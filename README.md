# WTRNS — le mag qui pétte

Refonte complète de [wtrns.fr](https://wtrns.fr) : un magazine de guides ultra-complets,
webdesign **neo-brutalist électrique**, généré statiquement avec **Astro** et déployé sur
**Cloudflare Pages**.

## Stack

- **Astro** (SSG) → sortie `dist/`
- Polices self-hosted (`@fontsource` : Archivo, Space Grotesk, Space Mono)
- Zéro dépendance runtime externe (tout est inliné/bundlé)
- Sitemap + RSS + JSON-LD (Article, FAQPage, BreadcrumbList)

## Contenu

- Les **posts** (titre, slug, image à la une) sont récupérés depuis l'API REST WordPress
  existante — les slugs sont conservés **à l'identique** pour préserver le SEO.
- Le **contenu de chaque article est entièrement réécrit** via l'API OpenAI
  (`gpt-5.6-terra`, Responses API + Batch API) : guides exhaustifs avec tableaux,
  encadrés « à retenir », FAQ et comparaisons 2 colonnes.
- Les données vivent dans `data/` :
  - `data/posts.json` — métadonnées des 661 posts
  - `data/content/<slug>.json` — contenu généré (meta, toc, html)
  - `data/img_manifest.json` — images téléchargées localement

## Scripts (`scripts/`)

| Script | Rôle |
|---|---|
| `fetch_posts.py` | récupère posts + images depuis l'API WordPress |
| `submit_batch.py` | construit + soumet le batch OpenAI des 661 articles |
| `gen_sync.py` | génère un échantillon d'articles en synchrone |
| `collect_batch.py` | récupère les résultats du batch → `data/content/` |
| `download_images.mjs` | télécharge + optimise les images à la une |
| `img_manifest.mjs` | régénère le manifeste d'images |

## Développement

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview
```

## Déploiement

Cloudflare Pages, connecté à GitHub :

- **Branche de production** : `main`
- **Commande de build** : `npm run build`
- **Répertoire de sortie** : `dist`
- **Répertoire racine** : (vide)
