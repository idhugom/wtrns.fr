import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const posts = JSON.parse(readFileSync('data/posts.json', 'utf8'));
const OUT = resolve('public/img/posts');
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PACE = parseInt(process.env.PACE || '900', 10);
const PASS_COOLDOWN = parseInt(process.env.PASS_COOLDOWN || '240', 10); // sec between passes
const MAX_PASSES = parseInt(process.env.MAX_PASSES || '40', 10);
const CONC = parseInt(process.env.CONC || '2', 10);

function looksLikeImage(buf) {
  if (!buf || buf.length < 512) return false;
  // JPEG FFD8, PNG 89504E47, GIF 4749, WEBP 'RIFF'....'WEBP', BMP 424D
  const b = buf;
  if (b[0] === 0xff && b[1] === 0xd8) return true;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return true;
  if (b[0] === 0x47 && b[1] === 0x49) return true;
  if (b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP') return true;
  return false;
}

async function fetchImg(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 30000);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: c.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/png,image/*,*/*;q=0.8',
      },
    });
    const ct = res.headers.get('content-type') || '';
    const buf = Buffer.from(await res.arrayBuffer());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    if (!ct.startsWith('image/') && !looksLikeImage(buf)) throw new Error('not-image ct=' + ct + ' len=' + buf.length);
    if (!looksLikeImage(buf)) throw new Error('bad-magic len=' + buf.length);
    return buf;
  } finally {
    clearTimeout(t);
  }
}

async function saveOne(p) {
  const dest = resolve(OUT, `${p.slug}.jpg`);
  if (existsSync(dest)) return 'skip';
  const buf = await fetchImg(p.image);
  await sharp(buf).rotate().resize({ width: 1280, height: 900, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true }).toFile(dest);
  return 'ok';
}

async function run() {
  const initial = parseInt(process.env.COOLDOWN || '0', 10);
  if (initial) { console.log(`initial cooldown ${initial}s`); await sleep(initial * 1000); }

  let remaining = posts.filter((p) => p.image && !existsSync(resolve(OUT, `${p.slug}.jpg`)));
  console.log(`START: ${remaining.length} images to fetch`);

  for (let pass = 1; pass <= MAX_PASSES && remaining.length; pass++) {
    let ok = 0, fail = 0, done = 0;
    const queue = [...remaining];
    const worker = async () => {
      while (queue.length) {
        const p = queue.shift();
        try { const r = await saveOne(p); if (r === 'ok') ok++; }
        catch (e) { fail++; }
        done++;
        if (done % 25 === 0) console.log(`  pass${pass} ${done}/${remaining.length} ok:${ok} fail:${fail}`);
        await sleep(PACE + Math.random() * 500);
      }
    };
    await Promise.all(Array.from({ length: CONC }, worker));

    // update manifest so a rebuild can pick up whatever we have
    const have = posts.filter((p) => existsSync(resolve(OUT, `${p.slug}.jpg`))).map((p) => p.slug);
    writeFileSync('data/img_manifest.json', JSON.stringify(have));
    remaining = posts.filter((p) => p.image && !existsSync(resolve(OUT, `${p.slug}.jpg`)));
    console.log(`PASS ${pass} done. ok:${ok} fail:${fail} | total have:${have.length} remaining:${remaining.length}`);

    if (remaining.length && pass < MAX_PASSES) {
      if (ok === 0) { console.log(`  no progress — cooldown ${PASS_COOLDOWN}s (o2switch throttle)`); await sleep(PASS_COOLDOWN * 1000); }
      else { await sleep(5000); }
    }
  }
  const have = posts.filter((p) => existsSync(resolve(OUT, `${p.slug}.jpg`))).map((p) => p.slug);
  writeFileSync('data/img_manifest.json', JSON.stringify(have));
  console.log(`ALL DONE. have:${have.length} / ${posts.filter((p) => p.image).length}`);
}
run();
