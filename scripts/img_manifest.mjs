import { readdirSync, writeFileSync, existsSync } from 'node:fs';
const dir = 'public/img/posts';
const slugs = existsSync(dir)
  ? readdirSync(dir).filter((f) => f.endsWith('.jpg')).map((f) => f.replace(/\.jpg$/, ''))
  : [];
writeFileSync('data/img_manifest.json', JSON.stringify(slugs));
console.log('img_manifest:', slugs.length, 'images');
