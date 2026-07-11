// Branded fallback used when an image fails to load (e.g. remote source gone).
export const FALLBACK = "data:image/svg+xml," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'>
    <rect width='600' height='400' fill='#F3ECD9'/>
    <g fill='none' stroke='#0B0B0B' stroke-width='2' opacity='0.12'>
      ${Array.from({ length: 7 }, (_, i) => `<line x1='${i * 100}' y1='0' x2='${i * 100}' y2='400'/>`).join('')}
    </g>
    <rect x='250' y='150' width='100' height='100' rx='18' fill='#C8F84A' stroke='#0B0B0B' stroke-width='6' transform='rotate(-4 300 200)'/>
    <path d='M272 178 L288 232 L300 200 L312 232 L328 178' fill='none' stroke='#0B0B0B' stroke-width='9' stroke-linecap='round' stroke-linejoin='round' transform='rotate(-4 300 200)'/>
  </svg>`
);

// inline onerror handler string: swap to fallback once, avoid loops
export const ONERR = `if(!this.dataset.f){this.dataset.f=1;this.src='${FALLBACK}';}`;

// choose best available source
export function imgSrc(post) {
  return post.localImage || post.image || FALLBACK;
}
