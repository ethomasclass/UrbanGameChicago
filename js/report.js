// End-of-game report: the ward round by round, the cost, photographs, and the written debrief. Prints cleanly.
import { GROUPS, NB, T } from './data.js';

const fmt = n => Math.round(n).toLocaleString('en-US');
const nice = m => { if (!m) return 0; const p = Math.pow(10, Math.floor(Math.log10(m))); for (const k of [1, 2, 4, 5, 8, 10]) if (k * p >= m) return k * p; return 10 * p; };

function chart(cv, hist, series, opts = {}) {
  const W = cv.width = 560, H = cv.height = 220, x = cv.getContext('2d'), L = 44, R = 12, Tp = 10, Bt = 24, n = hist.length;
  let max = opts.max || 0; if (!max) { for (const h of hist) { let s = 0; for (const sr of series) { const v = sr.f(h); if (opts.stack) s += v; else max = Math.max(max, v); } if (opts.stack) max = Math.max(max, s); } max = nice(max) || 1; }
  const X = k => L + (W - L - R) * (n > 1 ? k / (n - 1) : 0), Y = v => H - Bt - (H - Bt - Tp) * v / max;
  x.font = '11px system-ui, sans-serif'; x.fillStyle = '#5a4f43'; x.strokeStyle = '#d8c9a2'; x.lineWidth = 1;
  for (let g = 0; g <= 4; g++) { const v = max * g / 4, y = Y(v); x.beginPath(); x.moveTo(L, y); x.lineTo(W - R, y); x.stroke(); x.textAlign = 'right'; x.fillText(fmt(v), L - 5, y + 4); }
  x.textAlign = 'center'; hist.forEach((h, k) => { if (k % 2 === 0 || n < 7) x.fillText(h.y, X(k), H - 7); });
  if (opts.stack) { const base = new Array(n).fill(0); for (const sr of series) { x.beginPath(); hist.forEach((h, k) => { const v = base[k] + sr.f(h); k ? x.lineTo(X(k), Y(v)) : x.moveTo(X(k), Y(v)); }); for (let k = n - 1; k >= 0; k--) x.lineTo(X(k), Y(base[k])); x.closePath(); x.fillStyle = sr.color; x.fill(); hist.forEach((h, k) => base[k] += sr.f(h)); } }
  else for (const sr of series) { x.beginPath(); hist.forEach((h, k) => { const v = sr.f(h); k ? x.lineTo(X(k), Y(v)) : x.moveTo(X(k), Y(v)); }); x.strokeStyle = sr.color; x.lineWidth = 2.5; x.stroke(); }
}

export function buildReport(root, s, G) {
  const h = s.hist, last = h[h.length - 1], cnt = {}; for (let i = 0; i < s.b.length; i++) cnt[s.b[i]] = (cnt[s.b[i]] || 0) + 1;
  const sew = s.sewer.reduce((a, v) => a + v, 0);
  const qs = [
    ['cause', 'What caused your ward to grow so fast? Name at least two causes you saw in the game.'],
    ['env', 'What were the ENVIRONMENTAL effects of urbanization in your ward?'], ['eco', 'What were the ECONOMIC effects?'],
    ['cul', 'What were the CULTURAL effects? (Use your Nationalities map.)'], ['soc', 'What were the SOCIAL effects?'],
    ['redo', 'Everyone in class had to build the same things. Only where you put them was up to you. Name one placement you would change, and why.'],
    ['claim', 'Was the growth of cities in the late 1800s a benefit to American society? Write a claim. Support it with at least two pieces of evidence from your own ward, and answer one reason someone might disagree.'],
  ];
  root.innerHTML = `<div class="rep">
    <p class="eyebrow">The Urban Game: Chicago &nbsp; Final report</p>
    <h1>From Prairie to City, 1837 to 1900</h1>
    <p class="by">Ward built by <b>${G.name ? G.name.replace(/</g, '&lt;') : '________________'}</b>${s.stats.auto ? ` &nbsp; (${s.stats.auto} buildings were placed by the builders when time ran out)` : ''}</p>
    <h2>Your ward, round by round</h2>
    <table><tr><th>Year</th><th>Round</th><th>People</th><th>People per room</th><th>Health</th><th>Happiness</th><th>Have work</th><th>Died</th></tr>
    ${h.map(x => `<tr><td>${x.y}</td><td>${x.name}</td><td>${fmt(x.pop)}</td><td>${(x.crowd * 1.5).toFixed(1)}</td><td>${x.health}</td><td>${x.happy}</td><td>${x.emp}%</td><td>${fmt(x.dead)}</td></tr>`).join('')}</table>
    <div class="charts" style="margin-top:14px">
      <figure><figcaption>Who lived in your ward</figcaption><canvas id="ch1"></canvas><div class="legendrow">${GROUPS.map(g => `<span><i style="background:${g.color}"></i>${g.short}</span>`).join('')}</div></figure>
      <figure><figcaption>Health, happiness, and work (0 to 100)</figcaption><canvas id="ch2"></canvas><div class="legendrow"><span><i style="background:#a8322a"></i>Health</span><span><i style="background:#c9973a"></i>Happiness</span><span><i style="background:#3f6f9a"></i>Have work %</span></div></figure>
    </div>
    <h2>The cost</h2>
    <table>
      <tr><td>Newcomers who arrived</td><td>${fmt(s.stats.arrived)}</td><td>Residents who died, 1837 to 1900</td><td>${fmt(s.deaths)}</td></tr>
      <tr><td>Killed by cholera and typhoid</td><td>${fmt(s.stats.epiDead)}</td><td>Buildings lost in the Great Fire</td><td>${fmt(s.stats.gfBurned)}</td></tr>
      <tr><td>Blocks with sewers</td><td>${sew} of ${NB}</td><td>Tenements standing in 1900</td><td>${(cnt[T.WTEN] || 0) + (cnt[T.BTEN] || 0) + (cnt[T.NEWTEN] || 0)}</td></tr>
      <tr><td>Shanties put up by squatters</td><td>${s.stats.shanties}</td><td>Rear houses added by landlords</td><td>${s.stats.rears}</td></tr>
    </table>
    <h2>The real Chicago</h2>
    <div class="real">In 1837 Chicago had about 4,000 people. In 1870 it had 298,977. In 1900 it had 1,698,575. No large city on earth had ever grown that fast, and it grew faster than anyone could lay pipe, pave streets, or build decent housing. In 1895 the residents of Hull House mapped the blocks just east of their door, household by household, and counted people from eighteen nations living there. Your ward grew from ${fmt(h[0].pop)} people to ${fmt(last.pop)}.</div>
    ${G.photos.length ? `<h2>Your photographs</h2><div class="photos">${G.photos.map(p => `<figure style="margin:0"><img src="${p.src}"><figcaption style="font:12px system-ui">${p.cap}</figcaption></figure>`).join('')}</div>` : ''}
    <h2>Think it through</h2>
    ${qs.map(q => `<div class="q"><label>${q[1]}</label><textarea data-q="${q[0]}"></textarea></div>`).join('')}
    <div class="btns"><button class="big" id="rprint">Print or save as PDF</button><button class="big ghost" id="rcity">Back to the city</button><button class="big ghost" id="ragain">Play again</button></div>
  </div>`;
  root.hidden = false; root.scrollTop = 0;
  chart(root.querySelector('#ch1'), h, GROUPS.map((g, k) => ({ color: g.color, f: x => x.g[k] })), { stack: true });
  chart(root.querySelector('#ch2'), h, [{ color: '#a8322a', f: x => x.health }, { color: '#c9973a', f: x => x.happy }, { color: '#3f6f9a', f: x => x.emp }], { max: 100 });
  root.querySelector('#rprint').onclick = () => window.print();
  root.querySelector('#ragain').onclick = () => { if (confirm('Start a new game? Print or save this report first if you need it.')) location.reload(); };
}
