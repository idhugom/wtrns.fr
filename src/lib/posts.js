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
    re: /\bassur|\bmutuelle|\bcredit|\bemprunt|\bbanqu|\bbancaire|\bepargne|\bimpot|\bfiscal|\bretraite|\bprevoyance|\bjuridique|\bjuriste|\bavocat|\bnotaire|bourquin|lemoine|hamon|\bresiliation|\bplacement|\bpatrimoine|\bprets?\b|\bfinanc|\bcotisation|\bsinistre|\bassureur/ },
  { key: 'cuisine', label: 'Cuisine & Recettes', color: 'orange',
    re: /\brecette|\bmagret|\bcanard|\bcuisin|\bculinaire|\bplats?\b|\bdessert|\bgateau|\bsauce|\bpoulet|\bboeuf|\bagneau|\bvins?\b|\bfromage|\bchocolat|\bapero|\baperitif|\bcocktail|\bpatiss|\brepas|\bmarinade|\bmariner|\bfour\b|\bcuisson|\bgastronom|\bconfit/ },
  { key: 'moto', label: 'Moto & Mobilité', color: 'cyan',
    re: /\bmoto|\bscooter|\bcasque|deux-roues|\bpermis|\bvoiture|\bauto\b|\bautomobile|\bvelos?\b|\btrottinette|\bconduite|\bconduire|\bcircuit|road.?trip|\bpneu|\bmobylette|\bcylindr/ },
  { key: 'deco', label: 'Déco & Lifestyle', color: 'pink',
    re: /\bdecor|\bosier|\bliege|\bscandinave|\bmeuble|\bmobilier|\binterieur|\bsalon\b|\bchambre|\bjardin|\bbijou|\bcollier|\bsacs?\b|\bmode\b|\btendance|\bdesign|\bcadeau|\bartisan|\bbois\b|\brangement|\bluminaire|\bpotager|\bplantes?\b|\bcoussin|\brideau|\btapis\b|\bceramique/ },
  { key: 'impression', label: 'Impression & Print', color: 'lime',
    re: /\bimprim|\bimpress|\bsticker|\bflyer|\baffiche|carte.*visite|\bpackaging|\betiquette|\bvitrine|\benseigne|\bserigraph|\bbrochure|\bpapeterie|\bkakemono|\bbanderole|\bgravure/ },
  { key: 'immobilier', label: 'Immobilier & Habitat', color: 'yellow',
    re: /\bimmobili|\bsolaire|\bpanneau|\bmaison|\bappartement|\blogement|\btravaux|\brenovation|\bisolation|\bchauffage|\btoiture|\btoit\b|\bbailleur|\blocataire|\bdpe\b|location.*(saison|meubl)|\bparcelle|\bterrain|\bhabitat|\bplomberie|\bphotovolta/ },
  { key: 'sante', label: 'Santé & Bien-être', color: 'cyan',
    re: /\bsante\b|bien-etre|\bmedecin|\bdentaire|\bdentiste|\bosteo|\bsport|\bfitness|\bnutrition|\bsommeil|\bstress|\bbeaute|\bsoins?\b|\bcosmetique|\bmeditation|\bpilates|\byoga|\bmassage|\bcheveux|\bcapillaire|\bmusculation|\bcomplement/ },
  { key: 'digital', label: 'Digital & Business', color: 'violet',
    re: /site.*web|\bseo\b|\breferencement|\bmarketing|\bentreprise|\bbusiness|\bstartup|\blogiciel|\bapplication|\bcrm\b|\becommerce|e-commerce|\bfreelance|auto-entrepreneur|\btelesecretariat|\bteletravail|disque.*dur|\bonduleur|\bdonnees?\b|\bordinateur|\binformatique|\bnumerique|smartphone/ },
];

const normTopic = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function topicFor(post) {
  const hay = normTopic(`${post.slug} ${post.title}`);
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
