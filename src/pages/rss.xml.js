import { publishedPosts, allPosts, getContent } from '../lib/posts.js';

export async function GET() {
  const site = 'https://wtrns.fr';
  const posts = (publishedPosts.length ? publishedPosts : allPosts).slice(0, 50);
  const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const items = posts.map((p) => {
    const c = getContent(p.slug);
    const desc = c?.meta_description || p.excerpt || '';
    const date = p.date ? new Date(p.date).toUTCString() : new Date().toUTCString();
    return `<item><title>${esc(p.title)}</title><link>${site}/${p.slug}</link><guid>${site}/${p.slug}</guid><pubDate>${date}</pubDate><description>${esc(desc)}</description></item>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>WTRNS — le mag qui pétte</title><link>${site}</link><description>Des guides ultra-complets, sans blabla.</description><language>fr-FR</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
