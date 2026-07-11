import rawPosts from '../../data/posts.json';
import imgManifest from '../../data/img_manifest.json';

/* Content JSON is loaded via Vite glob so it is bundled correctly at build time
   (runtime fs + import.meta.url paths break inside the SSR bundle). */
const contentModules = import.meta.glob('../../data/content/*.json', { eager: true });
const contentBySlug = {};
for (const [path, mod] of Object.entries(contentModules)) {
  const slug = path.split('/').pop().replace(/\.json$/, '');
  contentBySlug[slug] = mod.default || mod;
}

const localImgSet = new Set(imgManifest); // slugs that have /img/posts/<slug>.jpg

/* ---------- topic clusters (derived from slug/title) ---------- */
const TOPICS = [
  { key: 'assurance', label: 'Assurance & Finance', color: 'violet',
    re: /assurance|mutuelle|credit|crédit|pret|prêt|emprunteur|bourquin|lemoine|banque|hamon|resiliation|résiliation|epargne|épargne|placement|impot|impôt|fiscal|retraite|prevoyance|prévoyance|juridique/i },
  { key: 'cuisine', label: 'Cuisine & Recettes', color: 'orange',
    re: /recette|magret|canard|cuisine|plat|dessert|gateau|gâteau|sauce|poulet|boeuf|bœuf|vin|fromage|chocolat|apero|apéro|cocktail|patisserie|pâtisserie|repas|marinade|four|cuisson|culinaire|gastronom/i },
  { key: 'moto', label: 'Moto & Mobilité', color: 'cyan',
    re: /moto|scooter|casque|deux-roues|permis|voiture|auto|velo|vélo|trottinette|conduite|location.*(moto|voiture|vehicule|véhicule)|road.?trip|circuit/i },
  { key: 'deco', label: 'Déco & Lifestyle', color: 'pink',
    re: /deco|déco|osier|liege|liège|scandinave|meuble|interieur|intérieur|salon|chambre|jardin|bijou|collier|sac|mode|tendance|design|cadeau|artisan|bois|rangement|luminaire|potager|plante/i },
  { key: 'impression', label: 'Impression & Print', color: 'lime',
    re: /impress|imprim|sticker|flyer|affiche|carte.*visite|packaging|etiquette|étiquette|vitrine|enseigne|serigraphie|sérigraphie|brochure|papeterie|kakemono|banderole/i },
  { key: 'immobilier', label: 'Immobilier & Habitat', color: 'yellow',
    re: /immobili|panneau.*solaire|solaire|maison|appartement|location.*(saison|meuble)|logement|travaux|renovation|rénovation|isolation|chauffage|toiture|bailleur|locataire|dpe|annonce.*immo/i },
  { key: 'sante', label: 'Santé & Bien-être', color: 'cyan',
    re: /sante|santé|bien-etre|bien-être|medecin|médecin|dentaire|osteo|ostéo|sport|fitness|nutrition|sommeil|stress|beaute|beauté|soin|cosmetique|cosmétique|meditation|méditation|pilates|yoga/i },
  { key: 'digital', label: 'Digital & Business', color: 'violet',
    re: /site.*web|seo|referencement|référencement|marketing|entreprise|business|startup|logiciel|application|crm|ecommerce|e-commerce|reseau|réseau|communication|freelance|auto-entrepreneur|disque.*dur|onduleur|donnee|donnée/i },
];

function topicFor(post) {
  const hay = `${post.slug} ${post.title}`;
  for (const t of TOPICS) if (t.re.test(hay)) return t;
  const colors = ['lime', 'pink', 'cyan', 'violet', 'yellow', 'orange'];
  let h = 0; for (const c of post.slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { key: 'divers', label: 'Le mag', color: colors[h % colors.length] };
}

export function getContent(slug) {
  return contentBySlug[slug] || null;
}

function localImage(post) {
  return post.image && localImgSet.has(post.slug) ? `/img/posts/${post.slug}.jpg` : null;
}

/* ---------- build enriched post list ---------- */
const enriched = rawPosts.map((p) => {
  const topic = topicFor(p);
  return {
    ...p,
    topic: topic.key,
    topicLabel: topic.label,
    color: topic.color,
    localImage: localImage(p),
    hasContent: !!contentBySlug[p.slug],
    href: `/${p.slug}`,
  };
});

// stable order: generated first, then by date desc
enriched.sort((a, b) => {
  if (a.hasContent !== b.hasContent) return a.hasContent ? -1 : 1;
  return (b.date || '').localeCompare(a.date || '');
});

export const allPosts = enriched;
export const publishedPosts = enriched.filter((p) => p.hasContent);

export function getPost(slug) { return enriched.find((p) => p.slug === slug); }

export function relatedPosts(post, n = 3) {
  const sameTopic = enriched.filter((p) => p.slug !== post.slug && p.topic === post.topic);
  // prefer related posts that already have content
  const rank = (p) => (p.hasContent ? 0 : 1);
  const pool = (sameTopic.length >= n ? sameTopic : enriched.filter((p) => p.slug !== post.slug));
  return [...pool].sort((a, b) => rank(a) - rank(b)).slice(0, n);
}

export function topicsSummary() {
  const map = new Map();
  for (const t of TOPICS) map.set(t.key, { key: t.key, label: t.label, color: t.color, count: 0 });
  map.set('divers', { key: 'divers', label: 'Le mag', color: 'lime', count: 0 });
  for (const p of enriched) { const m = map.get(p.topic); if (m) m.count++; }
  return [...map.values()].filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
}

export function readingTime(slug, fallback = 8) {
  return contentBySlug[slug]?.reading_time_min || fallback;
}
