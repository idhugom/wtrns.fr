import sharp from 'sharp';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FBF6EA"/>
  <g fill="none" stroke="#0B0B0B" stroke-width="3" opacity="0.08">
    ${Array.from({length:13},(_,i)=>`<line x1="${i*100}" y1="0" x2="${i*100}" y2="630"/>`).join('')}
  </g>
  <circle cx="1010" cy="150" r="150" fill="#34E1F2" opacity="0.55"/>
  <circle cx="180" cy="520" r="120" fill="#FF3D9A" opacity="0.5"/>
  <g transform="translate(90,150)">
    <rect x="0" y="0" width="120" height="120" rx="22" fill="#C8F84A" stroke="#0B0B0B" stroke-width="8" transform="rotate(-4 60 60)"/>
    <path d="M28 40 L48 96 L70 56 L92 96 L112 40" fill="none" stroke="#0B0B0B" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-4 60 60)"/>
  </g>
  <text x="90" y="410" font-family="Archivo, Arial, sans-serif" font-size="128" font-weight="900" fill="#0B0B0B" letter-spacing="-4">WTRNS</text>
  <text x="94" y="480" font-family="Archivo, Arial, sans-serif" font-size="40" font-weight="800" fill="#0B0B0B">Le mag qui pétte — guides sans blabla.</text>
  <rect x="90" y="510" width="360" height="60" rx="30" fill="#FF3D9A" stroke="#0B0B0B" stroke-width="4"/>
  <text x="120" y="550" font-family="Archivo, Arial, sans-serif" font-size="30" font-weight="900" fill="#FFFFFF">661 GUIDES · 8 THÉMATIQUES</text>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/og-default.png');
console.log('og-default.png written');
