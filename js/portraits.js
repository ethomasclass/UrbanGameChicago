// Character portraits. Until real art exists, each character gets a placeholder cameo drawn in code.
// To use real art: put the raw image in art/raw/portraits/<id>.png and run tools/art.py. See docs/FLOW.md.
import { CHARACTERS, T, B, SPECIAL } from './data.js';

const cache = {};
const HATS = {
  top: '<rect x="27" y="6" width="26" height="20" rx="2"/><rect x="20" y="24" width="40" height="4" rx="2"/>',
  bowler: '<path d="M25 27 Q40 4 55 27 Z"/><rect x="20" y="25" width="40" height="3.5" rx="1.7"/>',
  cap: '<path d="M26 28 Q40 12 54 28 Z"/><path d="M40 26 L62 29 L60 32 L40 30 Z"/>',
  bun: '<circle cx="40" cy="17" r="7.5"/><ellipse cx="40" cy="32" rx="16.5" ry="12"/>',
  shawl: '<path d="M21 46 Q18 16 40 16 Q62 16 59 46 L66 74 L14 74 Z"/>',
  none: '',
};
function cameo(c) {
  const ink = '#2a2622', beard = c.beard ? '<path d="M27 44 Q40 70 53 44 Q40 54 27 44 Z"/>' : '';
  const collar = c.collar ? '<rect x="34" y="59" width="12" height="4" fill="#f4efe2"/>' : c.look === 'bun' || c.look === 'shawl' ? '<path d="M33 62 Q40 70 47 62 Z" fill="#f4efe2"/>' : '<path d="M40 62 L33 60 L40 78 L47 60 Z" fill="#f4efe2"/>';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 96"><defs><clipPath id="o"><ellipse cx="40" cy="48" rx="35" ry="43"/></clipPath></defs>
<ellipse cx="40" cy="48" rx="37" ry="45" fill="${c.color}"/><g clip-path="url(#o)" fill="${ink}">${c.look === 'shawl' ? HATS.shawl : ''}<path d="M6 98 Q8 68 30 62 L50 62 Q72 68 74 98 Z"/><rect x="34" y="50" width="12" height="14"/><ellipse cx="40" cy="40" rx="13.5" ry="16.5"/>${c.look === 'shawl' ? '<ellipse cx="40" cy="41" rx="10" ry="13" fill="#eadfc8"/>' : HATS[c.look] || ''}${beard}${collar}</g>
<ellipse cx="40" cy="48" rx="37" ry="45" fill="none" stroke="#c9973a" stroke-width="3.5"/><ellipse cx="40" cy="48" rx="33.5" ry="41.5" fill="none" stroke="rgba(42,38,34,.35)" stroke-width="1"/></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
// assets/manifest.json lists the real art that exists (tools/art.py writes it). Everything else falls back to a placeholder.
export const ART = { portraits: [], icons: [], rounds: [], ui: [] };
export async function loadArt() { try { const r = await fetch('assets/manifest.json', { cache: 'no-cache' }); if (r.ok) Object.assign(ART, await r.json()); } catch (e) { /* no art yet */ } }
// Characters can have later-life portraits named <id>-2 (from 1871) and <id>-3 (from 1889).
export function portrait(id, round = 0) {
  const c = CHARACTERS[id]; if (!c) return '';
  for (const v of round >= 8 ? ['-3', '-2', ''] : round >= 4 ? ['-2', ''] : ['']) if (ART.portraits.includes(id + v)) return `assets/portraits/${id}${v}.jpg`;
  return cache[id] || (cache[id] = cameo(c));
}
// name of the icon file for something on the build list, e.g. T.COTTAGE -> "cottage"
const NAMES = Object.fromEntries(Object.entries(T).map(([k, v]) => [v, k.toLowerCase()]));
export function icon(k) { const n = NAMES[k] || k, d = SPECIAL[k] || B[k]; return ART.icons.includes(n) ? `<img class="ico" src="assets/icons/${n}.png" alt="">` : d.icon; }
