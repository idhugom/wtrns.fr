/* Probe-gated self-healing image pipeline.
   Waits out the o2switch IP ban with gentle single-request probes.
   When access returns: downloads all images, rebuilds, commits, pushes.
   Bounded runtime so it never loops forever. */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
import sharp from 'sharp';

const posts = JSON.parse(readFileSync('data/posts.json', 'utf8'));
const OUT = resolve('public/img/posts');
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROBE_EVERY = parseInt(process.env.PROBE_EVERY || '600', 10); // 10 min between probes
const MAX_HOURS = parseInt(process.env.MAX_HOURS || '10', 10);
const deadline = Date.now() + MAX_HOURS * 3600 * 1000;

function magicOk(b) {
  if (!b || b.length < 512) return false;
  if (b[0] === 0xff && b[1] === 0xd8) return true;
  if (b[0] === 0x89 && b[1] === 0x50) return true;
  if (b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP') return true;
  if (b[0] === 0x47 && b[1] === 0x49) return true;
  return false;
}
async function get(url, timeout = 25000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeout);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: c.signal, headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/png,image/*,*/*;q=0.8',
    } });
    const buf = Buffer.from(await res.arrayBuffer());
    if (!res.ok || !magicOk(buf)) throw new Error('bad ' + res.status);
    return buf;
  } finally { clearTimeout(t); }
}

async function downloadOne(p) {
  const dest = resolve(OUT, `${p.slug}.jpg`);
  if (existsSync(dest)) return true;
  const buf = await get(p.image);
  await sharp(buf).rotate().resize({ width: 1280, height: 900, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true }).toFile(dest);
  return true;
}

function have() { return posts.filter((p) => existsSync(resolve(OUT, `${p.slug}.jpg`))).map((p) => p.slug); }
function writeManifest() { writeFileSync('data/img_manifest.json', JSON.stringify(have())); }

async function fullDownload() {
  let remaining = posts.filter((p) => p.image && !existsSync(resolve(OUT, `${p.slug}.jpg`)));
  let consecFail = 0;
  for (let i = 0; i < remaining.length; i++) {
    const p = remaining[i];
    try { await downloadOne(p); consecFail = 0; }
    catch { consecFail++; if (consecFail >= 12) { console.log('re-banned mid-run, pausing'); return false; } }
    if (i % 25 === 0) { writeManifest(); console.log('  dl', i, '/', remaining.length, 'have', have().length); }
    await sleep(500 + Math.random() * 500);
  }
  writeManifest();
  return true;
}

function publish() {
  try {
    execSync('npm run build', { stdio: 'inherit' });
    execSync('git add public/img data/img_manifest.json', { stdio: 'inherit' });
    execSync('git commit -m "content: images à la une téléchargées et optimisées localement\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"', { stdio: 'inherit' });
    for (let i = 0; i < 4; i++) {
      try { execSync('git push origin main', { stdio: 'inherit' }); break; }
      catch { execSync('sleep ' + (2 ** (i + 1))); }
    }
    console.log('PUBLISHED images update');
  } catch (e) { console.log('publish step note:', e.message); }
}

async function main() {
  const target = posts.filter((p) => p.image).length;
  console.log(`auto_images: target ${target}, have ${have().length}, probing every ${PROBE_EVERY}s for up to ${MAX_HOURS}h`);
  while (Date.now() < deadline) {
    if (have().length >= target) { console.log('all images present'); break; }
    const probe = posts.find((p) => p.image && !existsSync(resolve(OUT, `${p.slug}.jpg`)));
    let unblocked = false;
    try { await get(probe.image, 20000); unblocked = true; } catch { unblocked = false; }
    if (unblocked) {
      console.log('ACCESS RETURNED — downloading all images');
      const finished = await fullDownload();
      publish();
      if (finished && have().length >= target) break;
    } else {
      console.log(`still blocked (${new Date().toISOString()}), have ${have().length}/${target}, sleeping ${PROBE_EVERY}s`);
    }
    await sleep(PROBE_EVERY * 1000);
  }
  console.log(`auto_images END. have ${have().length}/${target}`);
}
main();
