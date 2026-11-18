// Headless playthroughs for tuning: node tools/bot.mjs
import { Sim } from '../js/sim.js';
import { ROUNDS, T, B, NL, NB } from '../js/data.js';
const isHome = k => typeof k === 'number' && k >= 1 && k <= 7;
function careful(s) { // homes west and upwind, industry by the river, services amid homes
  for (const it of s.todo) { let guard = 0; while (it.left > 0 && guard++ < 3000) {
    const k = it.k; let t;
    if (k === 'sewer') { t = [...Array(NB).keys()].filter(b => !s.sewer[b]).sort((a, b) => s.bPop[b] - s.bPop[a])[0]; }
    else if (k === 'line' || k === 'el') t = { axis: 0, idx: k === 'el' ? 3 : 2 };
    else if (k === 'rear') { t = [...Array(NL).keys()].find(i => s.b[i] === T.COTTAGE && !s.lock[i]); }
    else { const ind = typeof k === 'number' && k >= 20 && k < 30 || k === T.DEPOT;
      const c = [...Array(NL).keys()].filter(i => !s.valid(k, i) && (!s.b[i] || s.b[i] === T.RUBBLE));
      c.sort((a, b) => ind ? (s.tx[b] - s.ty[b] * .3) - (s.tx[a] - s.ty[a] * .3) : (Math.abs(s.tx[a] - 9) + Math.abs(s.ty[a] - 11) * .6 + s.poll[a] * 4) - (Math.abs(s.tx[b] - 9) + Math.abs(s.ty[b] - 11) * .6 + s.poll[b] * 4));
      t = c[isHome(k) ? 0 : ind ? 0 : Math.min(c.length - 1, 6)]; }
    if (t === undefined) break; s.place(k, t);
  } }
  s.autoFinish();
}
for (const [name, play] of [['builders (random)', s => s.autoFinish()], ['careful', careful]]) {
  const s = new Sim(); console.log('\n== ' + name);
  for (let r = 0; r < ROUNDS.length; r++) {
    s.startRound(r); play(s);
    if (ROUNDS[r].fire) { s.startGreatFire(); let g = 0; while (s.burning.length && g++ < 5000) s.fireStep(); }
    const out = s.endRound(), h = s.hist[r];
    console.log(h.y, 'pop', h.pop, 'cap', s.cap, 'crowd', h.crowd, 'health', h.health, 'happy', h.happy, 'emp', h.emp, 'smoke', h.smoke, 'dead', h.dead, 'jobs', Math.round(s.jobs));
    if (r === 4 || r === 2 || r === 9) console.log('   ' + out.map(o => o.t).join('\n   '));
  }
  console.log('deaths', Math.round(s.deaths), 'shanties', s.stats.shanties, 'rears', s.stats.rears, 'groups', Array.from(s.groupPop, Math.round).join(','));
}
