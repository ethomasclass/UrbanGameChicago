// End-of-game report: grades, charts, decisions, photographs, and the written debrief. Prints cleanly.
import { GROUPS, EVENT, NB, T } from './data.js';

const fmt = n => Math.round(n).toLocaleString('en-US');
const grade = (v, cuts, lowIsGood) => { const L = ['A', 'B', 'C', 'D', 'F']; for (let k = 0; k < 4; k++) if (lowIsGood ? v < cuts[k] : v > cuts[k]) return L[k]; return 'F'; };
const avg = (h, f) => h.length ? h.reduce((a, x) => a + f(x), 0) / h.length : 0;

const nice = m => { if (!m) return 0; const p = Math.pow(10, Math.floor(Math.log10(m))); for (const k of [1, 2, 4, 5, 8, 10]) if (k * p >= m) return k * p; return 10 * p; };

function chart(cv, hist, series, opts = {}) {
  const W = cv.width = 560, H = cv.height = 220, x = cv.getContext('2d'), L = 44, R = 10, Tp = 10, Bt = 24, n = hist.length;
  let max = opts.max || 0; if (!max) for (const h of hist) { let s = 0; for (const sr of series) { const v = sr.f(h); if (opts.stack) s += v; else max = Math.max(max, v); } if (opts.stack) max = Math.max(max, s); }
  max = nice(max) || 1; const X = k => L + (W - L - R) * (n > 1 ? k / (n - 1) : 0), Y = v => H - Bt - (H - Bt - Tp) * v / max;
  x.font = '11px system-ui, sans-serif'; x.fillStyle = '#5a4f43'; x.strokeStyle = '#d8c9a2'; x.lineWidth = 1;
  for (let g = 0; g <= 4; g++) { const v = max * g / 4, y = Y(v); x.beginPath(); x.moveTo(L, y); x.lineTo(W - R, y); x.stroke(); x.textAlign = 'right'; x.fillText(opts.fmt ? opts.fmt(v) : fmt(v), L - 5, y + 4); }
  x.textAlign = 'center'; hist.forEach((h, k) => { if (h.y % 5 === 0) x.fillText(h.y, X(k), H - 7); });
  for (const mark of [1871, 1873, 1893]) { const k = hist.findIndex(h => h.y === mark); if (k >= 0) { x.strokeStyle = 'rgba(168,50,42,.45)'; x.setLineDash([4, 3]); x.beginPath(); x.moveTo(X(k), Tp); x.lineTo(X(k), H - Bt); x.stroke(); x.setLineDash([]); } }
  if (opts.stack) { const base = new Array(n).fill(0); for (const sr of series) { x.beginPath(); hist.forEach((h, k) => { const v = base[k] + sr.f(h); k ? x.lineTo(X(k), Y(v)) : x.moveTo(X(k), Y(v)); }); for (let k = n - 1; k >= 0; k--) x.lineTo(X(k), Y(base[k])); x.closePath(); x.fillStyle = sr.color; x.fill(); hist.forEach((h, k) => base[k] += sr.f(h)); } }
  else for (const sr of series) { x.beginPath(); hist.forEach((h, k) => { const v = sr.f(h); k ? x.lineTo(X(k), Y(v)) : x.moveTo(X(k), Y(v)); }); x.strokeStyle = sr.color; x.lineWidth = 2.5; x.stroke(); }
}

export function buildReport(root, s, G) {
  const h = s.hist, last = h[h.length - 1] || { pop: 0, crowd: 0, dr: 0, happy: 0, emp: 0, smoke: 0, boodle: 0 }, at = y => h.find(x => x.y === y) || last;
  const late = h.slice(-5), cnt = {}; for (let i = 0; i < s.b.length; i++) cnt[s.b[i]] = (cnt[s.b[i]] || 0) + 1;
  const sew = s.sewer.reduce((a, v) => a + v, 0), pav = s.paved.reduce((a, v) => a + v, 0);
  const grades = [
    ['Health', grade(avg(late, x => x.dr), [20, 24, 29, 35], true), Math.round(avg(late, x => x.dr)) + ' deaths per 1,000'],
    ['Housing', grade(last.crowd, [1.2, 1.5, 1.8, 2.1], true), (last.crowd * 1.5).toFixed(1) + ' people per room'],
    ['Work', grade(avg(h, x => x.emp), [93, 85, 75, 65]), Math.round(avg(h, x => x.emp)) + '% had jobs'],
    ['Air', grade(last.smoke, [15, 25, 35, 50], true), 'smoke index ' + last.smoke],
    ['Honest gov.', grade(s.boodle, [10, 25, 40, 60], true), '$' + fmt(s.stats.skimmed) + ' skimmed'],
    ['Happiness', grade(avg(h, x => x.happy), [60, 50, 40, 30]), Math.round(avg(h, x => x.happy)) + '% on average'],
  ];
  const rows = [['People', x => fmt(x.pop)], ['People per room', x => (x.crowd * 1.5).toFixed(1)], ['Deaths per 1,000 a year', x => x.dr], ['Workers with jobs', x => x.emp + '%'], ['Happiness', x => x.happy + '%'], ['Smoke index', x => x.smoke]];
  const picks = Object.entries(s.picked).filter(([id]) => EVENT[id].choices).map(([id, c]) => `<tr><td>${EVENT[id].kicker}</td><td>${EVENT[id].head}</td><td><b>${EVENT[id].choices[c].label}</b></td></tr>`).join('');
  const qs = [
    ['cause', 'What caused your ward to grow so fast? Name at least two causes you saw in the game.'],
    ['env', 'What were the ENVIRONMENTAL effects of urbanization in your ward?'], ['eco', 'What were the ECONOMIC effects?'],
    ['cul', 'What were the CULTURAL effects? (Use your Nationalities map.)'], ['soc', 'What were the SOCIAL effects?'],
    ['claim', 'Was the growth of cities in the late 1800s a benefit to American society? Write a claim. Support it with at least two pieces of evidence from your own ward, and answer one reason someone might disagree.'],
  ];
  root.innerHTML = `<div class="rep">
    <p class="eyebrow">The Urban Game: Chicago &nbsp; Final report</p>
    <h1>The West Side, 1865 to 1900</h1>
    <p class="by">Ward run by <b>${G.name ? G.name.replace(/</g, '&lt;') : '________________'}</b> &nbsp; ${G.mode === 'teacher' ? 'Teacher-led game' : 'Solo game'}</p>
    <h2>Report card</h2>
    <div class="grades">${grades.map(g => `<div class="grade"><span>${g[0]}</span><b>${g[1]}</b><small>${g[2]}</small></div>`).join('')}</div>
    <h2>Your ward over time</h2>
    <table><tr><th></th><th>1870</th><th>1885</th><th>1900</th></tr>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1](at(1870))}</td><td>${r[1](at(1885))}</td><td>${r[1](at(1900))}</td></tr>`).join('')}</table>
    <div class="charts" style="margin-top:14px">
      <figure><figcaption>Who lived in your ward</figcaption><canvas id="ch1"></canvas><div class="legendrow">${GROUPS.map(g => `<span><i style="background:${g.color}"></i>${g.short}</span>`).join('')}</div></figure>
      <figure><figcaption>Deaths per 1,000 people each year</figcaption><canvas id="ch2"></canvas><div class="legendrow"><span>Dashed lines: 1871 fire, 1873 panic, 1893 panic</span></div></figure>
      <figure><figcaption>People per room</figcaption><canvas id="ch3"></canvas></figure>
      <figure><figcaption>Happiness and jobs</figcaption><canvas id="ch4"></canvas><div class="legendrow"><span><i style="background:#c9973a"></i>Happiness %</span><span><i style="background:#3f6f9a"></i>Workers with jobs %</span></div></figure>
    </div>
    <h2>The cost</h2>
    <table>
      <tr><td>Newcomers who arrived by train</td><td>${fmt(s.arrived)}</td><td>Residents who died, 1865 to 1900</td><td>${fmt(s.deaths)}</td></tr>
      <tr><td>Killed in epidemics</td><td>${fmt(s.stats.epiDead)}</td><td>Buildings lost to fire</td><td>${fmt(s.stats.burned)} (${fmt(s.stats.gfBurned)} in the Great Fire)</td></tr>
      <tr><td>Blocks with sewers</td><td>${sew} of ${NB}</td><td>Blocks with paved streets</td><td>${pav} of ${NB}</td></tr>
      <tr><td>Squatter shanties standing</td><td>${cnt[T.SHANTY] || 0}</td><td>Tenements (frame, brick, reform)</td><td>${(cnt[T.WTEN] || 0) + (cnt[T.BTEN] || 0) + (cnt[T.NEWTEN] || 0)}</td></tr>
      <tr><td>Sweatshops, in factories and in homes</td><td>${(cnt[T.SWEAT] || 0) + (s.sweatCount || 0)}</td><td>Children working or living on the street</td><td>about ${fmt(s.streetKids)}</td></tr>
      <tr><td>Spent on public works</td><td>$${fmt(s.stats.spent)}</td><td>Tax money lost to graft</td><td>$${fmt(s.stats.skimmed)}</td></tr>
    </table>
    ${picks ? `<h2>The decisions you made</h2><table><tr><th>When</th><th>Headline</th><th>Your ward chose</th></tr>${picks}</table>` : ''}
    <h2>The real Chicago</h2>
    <div class="real">In 1870 Chicago had 298,977 people. In 1900 it had 1,698,575. The city grew almost six times over in thirty years, faster than anyone could lay pipe, pave streets, or build decent housing. In 1895 the residents of Hull House mapped the blocks just east of their door, household by household, and counted people from eighteen nations living there. Your ward grew from about ${fmt(h[0] ? h[0].pop : 0)} people to ${fmt(last.pop)}. Compare your Nationalities map and your crowding to what Hull House found.</div>
    ${G.photos.length ? `<h2>Your photographs</h2><div class="photos">${G.photos.map(p => `<figure style="margin:0"><img src="${p.src}"><figcaption style="font:12px system-ui">${p.cap}</figcaption></figure>`).join('')}</div>` : ''}
    <h2>Think it through</h2>
    ${qs.map(q => `<div class="q"><label>${q[1]}</label><textarea data-q="${q[0]}"></textarea></div>`).join('')}
    <div class="btns"><button class="big" id="rprint">Print or save as PDF</button><button class="big ghost" id="ragain">Play again</button></div>
  </div>`;
  root.hidden = false; root.scrollTop = 0;
  chart(root.querySelector('#ch1'), h, GROUPS.map((g, k) => ({ color: g.color, f: x => x.g[k] })), { stack: true });
  chart(root.querySelector('#ch2'), h, [{ color: '#a8322a', f: x => x.dr }]);
  chart(root.querySelector('#ch3'), h, [{ color: '#221d18', f: x => x.crowd * 1.5 }], { fmt: v => v.toFixed(1) });
  chart(root.querySelector('#ch4'), h, [{ color: '#c9973a', f: x => x.happy }, { color: '#3f6f9a', f: x => x.emp }], { max: 100 });
  root.querySelector('#rprint').onclick = () => window.print();
  root.querySelector('#ragain').onclick = () => { if (confirm('Start a new game? Print or save this report first if you need it.')) location.reload(); };
}
