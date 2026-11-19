// The Urban Game: Chicago. The rules. Students place what each round requires; this file works out what happens to the people.
// No DOM or three.js here. The renderer watches sim.dirty.
import { BW, BH, TW, TH, NB, NL, T, B, ROUNDS, FAMILIES } from './data.js';

export const lotId = (bx, by, lx, ly) => ((by * BW + bx) << 4) | (ly << 2) | lx;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const NG = 7, fmt = n => Math.round(n).toLocaleString('en-US');
const isHome = b => b >= 1 && b <= 7;
const GF_JUMP = [[2, -2], [2, -1], [1, -2], [2, 0], [0, -2], [3, -3], [3, -2], [2, -3]];

export class Sim {
  constructor() { this.buildStatic(); this.reset(); }

  buildStatic() {
    this.tx = new Int16Array(NL); this.ty = new Int16Array(NL); this.blk = new Int16Array(NL);
    this.tileLot = new Int16Array(TW * TH).fill(-1);
    for (let by = 0; by < BH; by++) for (let bx = 0; bx < BW; bx++) for (let ly = 0; ly < 4; ly++) for (let lx = 0; lx < 4; lx++) {
      const i = lotId(bx, by, lx, ly);
      this.tx[i] = bx * 5 + 1 + lx; this.ty[i] = by * 5 + 1 + ly; this.blk[i] = by * BW + bx;
      this.tileLot[this.ty[i] * TW + this.tx[i]] = i;
    }
    this.nbr = [];
    for (let i = 0; i < NL; i++) {
      const list = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        let x = this.tx[i] + dx, y = this.ty[i] + dy, cross = 0, j = this.lotAt(x, y);
        if (j < 0) { x += dx; y += dy; cross = 1; j = this.lotAt(x, y); }
        if (j >= 0) list.push({ j, dx, dy, cross });
      }
      this.nbr.push(list);
    }
  }
  lotAt(x, y) { return (x < 0 || y < 0 || x >= TW || y >= TH) ? -1 : this.tileLot[y * TW + x]; }

  reset() {
    this.rs = 18711008; this.round = -1; this.year = ROUNDS[0].year; this.econ = 1;
    this.b = new Uint8Array(NL); this.g = new Uint8Array(NL); this.burn = new Uint8Array(NL); this.lock = new Uint8Array(NL);
    this.pop = new Float32Array(NL); this.health = new Float32Array(NL); this.happyLot = new Float32Array(NL); this.jobLot = new Float32Array(NL); this.poll = new Float32Array(NL);
    this.sewer = new Uint8Array(NB); this.paved = new Uint8Array(NB); this.z = new Uint8Array(NL); // paved, z: unused, kept for the renderer
    this.lines = []; this.P = 0; this.deaths = 0; this.todo = []; this.undoStack = [];
    this.burning = []; this.greatFire = false; this.done = {}; this.pol = { cable: false, hull: false, canal: false };
    this.stats = { burned: 0, gfBurned: 0, gfDead: 0, epiDead: 0, shanties: 0, rears: 0, arrived: 0, auto: 0 };
    this.hist = []; this.dirty = []; this.groundDirty = true; this.fam = {}; // family id -> the lot they live on
    this.cov = {}; for (const k of ['fire', 'police', 'school', 'church', 'park', 'bath', 'hosp', 'hull', 'shop', 'saloon', 'transit', 'el']) this.cov[k] = new Uint8Array(NL);
    this.cFire = this.cov.fire;
    this.bgPop = new Float32Array(NB * NG); this.bPop = new Float32Array(NB); this.groupPop = new Float32Array(NG);
    this.totPop = 0; this.cap = 0; this.crowd = 0; this.healthAvg = 0; this.happy = 0; this.emp = 1; this.smoke = 0;
    this.metrics();
  }
  rnd() { let a = this.rs = (this.rs + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  touch(i) { this.dirty.push(i); }

  // ---------- rounds ----------
  startRound(r) {
    const R = ROUNDS[r]; this.round = r; this.year = R.year; this.econ = R.econ || 1; this.undoStack = [];
    this.todo = R.build.map(x => ({ k: x.k, n: x.n, left: x.n }));
    this.pol.cable = R.year >= 1882; this.pol.canal = R.year >= 1900;
    if (r >= 7) for (let i = 0; i < NL; i++) if (this.b[i] === T.RUBBLE) { this.b[i] = 0; this.touch(i); } // the last ruins are finally carted away
    if (R.fire && !this.done.barn) { // the O'Learys move in on DeKoven Street, wherever there is room
      this.done.barn = 1; const want = lotId(2, 3, 1, 3); let best = want, bd = 1e9;
      if (this.b[want]) for (let i = 0; i < NL; i++) if (!this.b[i]) { const d = Math.hypot(this.tx[i] - this.tx[want], this.ty[i] - this.ty[want]); if (d < bd) { bd = d; best = i; } }
      this.b[best] = T.BARN; this.lock[best] = 1; this.barn = best; this.touch(best);
    }
    this.metrics();
  }
  item(k) { return this.todo.find(t => t.k === k && t.left > 0); }
  left() { return this.todo.reduce((a, t) => a + t.left, 0); }

  // Can this thing go here? Returns '' if yes, or the reason why not.
  valid(k, t) {
    if (k === 'sewer') return this.sewer[t] ? 'That block already has sewers.' : '';
    if (k === 'line' || k === 'el') { const c = this.lines.find(l => l.axis === t.axis && l.idx === t.idx); return c && (k === 'line' || c.el) ? 'That street already has a line.' : ''; }
    if (this.lock[t] || this.burn[t]) return 'You cannot build there.';
    const cur = this.b[t];
    if (k === 'rear') return cur === T.COTTAGE ? '' : 'A rear house goes behind a frame cottage.';
    if (!cur || cur === T.RUBBLE || cur === T.SHANTY) return '';
    if ((k === T.WTEN || k === T.BTEN || k === T.NEWTEN) && (cur === T.COTTAGE || cur === T.REAR || (k !== T.WTEN && cur === T.WTEN))) return '';
    return 'That lot is taken.';
  }
  place(k, t, auto) {
    const it = this.item(k); if (!it) return 'Nothing left of that to build.';
    const why = this.valid(k, t); if (why) return why;
    const u = { k, t };
    if (k === 'sewer') this.sewer[t] = 1;
    else if (k === 'line' || k === 'el') { const c = this.lines.find(l => l.axis === t.axis && l.idx === t.idx); u.was = c ? 1 : 0; if (c) c.el = true; else this.lines.push({ axis: t.axis, idx: t.idx, el: k === 'el' }); this.linesDirty = true; }
    else {
      u.b = this.b[t]; u.g = this.g[t];
      this.b[t] = k === 'rear' ? T.REAR : k;
      if (k !== 'rear' && isHome(this.b[t])) this.g[t] = this.pickGroup(t);
      if (k === T.HULL) this.pol.hull = true;
      for (const F of FAMILIES) if (F.start === this.round && F.kind === k && this.fam[F.id] == null) { this.fam[F.id] = t; u.fam = F.id; }
      this.touch(t);
    }
    it.left--; if (auto) this.stats.auto++; else this.undoStack.push(u);
    this.groundDirty = true; this.metrics();
    return '';
  }
  undo() {
    const u = this.undoStack.pop(); if (!u) return false;
    if (u.k === 'sewer') this.sewer[u.t] = 0;
    else if (u.k === 'line' || u.k === 'el') { const q = this.lines.findIndex(l => l.axis === u.t.axis && l.idx === u.t.idx); if (u.was) this.lines[q].el = false; else this.lines.splice(q, 1); this.linesDirty = true; }
    else { this.b[u.t] = u.b; this.g[u.t] = u.g; this.touch(u.t); if (u.fam) delete this.fam[u.fam]; }
    this.todo.find(t => t.k === u.k).left++; this.groundDirty = true; this.metrics();
    return true;
  }
  // Time ran out: the builders finish the job wherever it suits them.
  autoFinish() {
    let guard = 0;
    for (const it of this.todo) while (it.left > 0 && guard++ < 4000) {
      const k = it.k; let t;
      if (k === 'sewer') t = (this.rnd() * NB) | 0;
      else if (k === 'line' || k === 'el') t = { axis: this.rnd() < .5 ? 0 : 1, idx: 1 + ((this.rnd() * 3) | 0) };
      else { t = (this.rnd() * NL) | 0; if (k !== 'rear' && this.b[t] && guard < 3000) continue; }
      this.place(k, t, true);
    }
    for (const it of this.todo) it.left = 0;
  }
  // newcomers settle near people like themselves
  pickGroup(i) {
    const mix = ROUNDS[Math.max(0, this.round)].mix, near = new Float32Array(NG);
    for (let j = 0; j < NL; j++) if (j !== i && isHome(this.b[j]) && Math.abs(this.tx[j] - this.tx[i]) <= 3 && Math.abs(this.ty[j] - this.ty[i]) <= 3) near[this.g[j]] += 1;
    let best = -1, bs = 0, tot = 0; for (let g = 0; g < NG; g++) { const s = near[g] * mix[g]; if (s > bs) { bs = s; best = g; } tot += mix[g]; }
    if (best >= 0 && this.rnd() < .7) return best;
    let r = this.rnd() * tot; for (let g = 0; g < NG; g++) { r -= mix[g]; if (r <= 0) return g; } return 0;
  }

  // ---------- what the layout means for the people living in it ----------
  metrics() {
    const c = this.cov; for (const k in c) c[k].fill(0);
    const stamp = (arr, i, r, add) => { const cx = this.tx[i], cy = this.ty[i]; for (let j = 0; j < NL; j++) { const dx = this.tx[j] - cx, dy = this.ty[j] - cy; if (dx * dx + dy * dy <= r * r) arr[j] = add ? Math.min(9, arr[j] + 1) : 1; } };
    const which = { [T.FIRE]: c.fire, [T.POLICE]: c.police, [T.SCHOOL]: c.school, [T.CHURCH]: c.church, [T.PARK]: c.park, [T.BATH]: c.bath, [T.HOSP]: c.hosp, [T.HULL]: c.hull, [T.SHOP]: c.shop, [T.SALOON]: c.saloon, [T.MARKET]: c.shop, [T.BOSS]: c.saloon, [T.STPAT]: c.church };
    this.poll.fill(0); const work = []; let jobs = 0, cap = 0;
    for (let i = 0; i < NL; i++) {
      const b = this.b[i]; if (!b) continue; const d = B[b];
      if (which[b]) stamp(which[b], i, d.r, b === T.PARK);
      if (d.jobs) { jobs += d.jobs * (b >= 20 && b < 30 ? this.econ : 1); if (d.jobs >= 20) work.push(i); }
      if (d.poll && !this.burn[i]) { const cx = this.tx[i] + 1, cy = this.ty[i] - 1, R = 6; for (let j = 0; j < NL; j++) { const q = Math.hypot(this.tx[j] - cx, this.ty[j] - cy); if (q < R) this.poll[j] = Math.min(3, this.poll[j] + d.poll * this.econ * (1 - q / R)); } }
      if (isHome(b)) cap += d.cap;
    }
    for (const L of this.lines) for (let i = 0; i < NL; i++) { const q = Math.abs((L.axis ? this.tx[i] : this.ty[i]) - L.idx * 5); if (q <= 3) c.transit[i] = 1; if (L.el && q <= 1) c.el[i] = 1; }
    const P = this.P, ratio = cap ? P / cap : 0, crowd = clamp(ratio - 1, 0, 2), dens = clamp(P / 1500, 0, 1);
    this.cap = cap; this.crowd = ratio;
    // who can get to work: on foot within 8 lots, or anywhere by streetcar
    let reachW = 0;
    for (let i = 0; i < NL; i++) {
      const b = this.b[i]; if (!isHome(b)) { this.pop[i] = 0; this.jobLot[i] = 0; continue; }
      this.pop[i] = B[b].cap * ratio; let reach = c.transit[i] ? 1 : 0;
      if (!reach) for (const w of work) if (Math.hypot(this.tx[w] - this.tx[i], this.ty[w] - this.ty[i]) <= 8) { reach = 1; break; }
      this.jobLot[i] = reach; if (reach) reachW += this.pop[i] * .4;
    }
    let fill = reachW > 0 ? Math.min(1, jobs / reachW) : 0;
    if (!work.length && this.round < 1) { fill = 1; for (let i = 0; i < NL; i++) if (this.pop[i] > 0) this.jobLot[i] = 1; } // the first settlers farm and trade for themselves
    let hs = 0, ps = 0, ss = 0, emp = 0; this.groupPop.fill(0); this.bgPop.fill(0); this.bPop.fill(0);
    for (let i = 0; i < NL; i++) {
      const p = this.pop[i]; if (p <= 0) { this.health[i] = 0; this.happyLot[i] = 0; continue; }
      const b = this.b[i], sw = this.sewer[this.blk[i]], jf = this.jobLot[i] * fill; this.jobLot[i] = jf;
      let h = 88 - crowd * 16 - this.poll[i] * 13 - (sw ? 0 : 8 + 10 * dens) + (c.hosp[i] ? 6 : 0) + (c.bath[i] ? 4 : 0) + (c.hull[i] ? 4 : 0) + (c.park[i] ? 3 : 0) + (this.pol.canal ? 4 : 0);
      if (b === T.SHANTY) h -= 12; else if (b === T.WTEN || b === T.BTEN) h -= 4; else if (b === T.NEWTEN) h += 6;
      let y = 58 - crowd * 12 - this.poll[i] * 9 + (c.church[i] ? 6 : 0) + (c.school[i] ? 6 : 0) + (c.shop[i] ? 4 : 0) + Math.min(2, c.park[i]) * 4 + (c.saloon[i] ? 2 : 0) + (c.transit[i] ? 5 : 0) - (c.el[i] ? 7 : 0) + (c.hull[i] ? 6 : 0) + (c.fire[i] ? 2 : 0) + (c.police[i] ? 2 : 0) - (sw ? 0 : 4) + jf * 10 - (1 - jf) * 16 - (this.econ < 1 ? 5 : 0);
      if (b === T.SHANTY) y -= 12; else if (b === T.NEWTEN) y += 5;
      this.health[i] = h = clamp(h, 5, 98); this.happyLot[i] = y = clamp(y, 0, 100);
      hs += h * p; ps += y * p; ss += this.poll[i] * p; emp += jf * p;
      this.groupPop[this.g[i]] += p; this.bgPop[this.blk[i] * NG + this.g[i]] += p; this.bPop[this.blk[i]] += p;
    }
    const ok = P > 0 && cap > 0;
    this.totPop = P; this.jobs = jobs;
    this.healthAvg = ok ? hs / P : 0; this.happy = ok ? ps / P : 0; this.emp = ok ? emp / P : 0; this.smoke = ok ? clamp(ss / P * 40, 0, 100) : 0;
  }

  // ---------- end of a round: newcomers, crowding, disease, death ----------
  endRound() {
    const R = ROUNDS[this.round], next = ROUNDS[this.round + 1], span = clamp(next ? next.year - R.year : 1, 1, 4), out = [];
    const say = (t, bad, pri = 2) => out.push({ t, bad: !!bad, pri });
    this.P += R.arrive; this.stats.arrived += R.arrive; this.metrics();
    say(`${fmt(R.arrive)} newcomers moved in. Your ward now holds ${fmt(this.P)} people.`);
    if (R.fire) say(`The Great Fire destroyed ${this.stats.gfBurned} of your buildings, ${this.stats.gfHomes} of them homes${this.stats.gfDead >= 1 ? `, and killed about ${Math.round(this.stats.gfDead)} of your people` : ''}. The burned-out families crowd in with their neighbors. Across Chicago about 300 died and 100,000 lost their homes.`, true);
    // too many people, too few rooms: landlords and squatters fill the gap
    let rears = 0, shanties = 0;
    if (this.crowd > 1.3) {
      const cots = []; for (let i = 0; i < NL; i++) if (this.b[i] === T.COTTAGE && !this.lock[i]) cots.push(i);
      for (let k = 0; k < 6 && cots.length && this.crowd > 1.25; k++) { const q = (this.rnd() * cots.length) | 0, i = cots[q]; cots.splice(q, 1); this.b[i] = T.REAR; this.touch(i); rears++; this.metrics(); }
    }
    if (this.crowd > 1.38 || !this.cap) {
      const open = []; for (let i = 0; i < NL; i++) if (!this.b[i] || this.b[i] === T.RUBBLE) open.push(i);
      const want = Math.min(8, Math.ceil((this.P - 1.38 * this.cap) / 8));
      for (let k = 0; k < want && open.length; k++) {
        let best = 0, bs = -1; for (let s = 0; s < 10; s++) { const q = (this.rnd() * open.length) | 0, sc = this.poll[open[q]] + this.tx[open[q]] * .05 + this.rnd(); if (sc > bs) { bs = sc; best = q; } }
        const i = open[best]; open.splice(best, 1); this.b[i] = T.SHANTY; this.g[i] = this.pickGroup(i); this.touch(i); shanties++;
      }
    }
    this.stats.rears += rears; this.stats.shanties += shanties; this.groundDirty = true; this.metrics();
    if (rears) say(`Rents are rising. Landlords squeezed rear houses behind ${rears} more cottages.`, true);
    if (shanties) say(`${shanties} families with nowhere to live nailed together shanties on empty lots.`, true);
    if (this.crowd > 1.3) say(`Homes built for ${fmt(this.cap)} people now hold ${fmt(this.P)}: about ${(this.crowd * 1.5).toFixed(1)} people in every room.`, true);
    // disease and death
    let dead = 0, epi = 0, epiNo = 0, noSew = 0, smoky = 0, far = 0, homes = 0;
    for (let i = 0; i < NL; i++) {
      const p = this.pop[i]; if (p <= 0) continue; homes++;
      const sw = this.sewer[this.blk[i]]; if (!sw) noSew++; if (this.poll[i] > 0.9) smoky++; if (this.jobLot[i] <= 0) far++;
      dead += p * (12 + (100 - this.health[i]) * .42) / 1000 * span;
      if (R.epi) { const e = p * (sw ? .008 : .07); epi += e; if (!sw) epiNo += e; }
    }
    if (R.epi) { say(`${R.epi} killed about ${Math.round(epi)} of your people. ${Math.round(epiNo)} of them lived on blocks without sewers.`, true); this.stats.epiDead += epi; }
    if (smoky > 2) say(`Factory and coal smoke hangs over ${smoky} of your ${homes} homes.`, true, 1);
    if (this.emp < .9) say(far > 2 && this.econ >= 1 ? `Only ${Math.round(this.emp * 100)}% of workers have jobs. ${far} homes are too far from any workplace to walk.` : `Only ${Math.round(this.emp * 100)}% of workers have jobs${this.econ < 1 ? ' while the factories run short shifts' : ''}.`, true);
    if (this.pol.hull && this.round >= 8) { // what Hull House is doing for the homes it can reach
      let n = 0; for (let i = 0; i < NL; i++) if (this.pop[i] > 0 && this.cov.hull[i]) n++;
      say(`Hull House is within walking distance of ${n} of your ${homes} homes. ` + ['Their small children are in its kindergarten and day nursery while the parents work, and the adults learn English there at night.', 'Its residents have just helped win a state law keeping children under fourteen out of factories, and they are opening the city\'s first public playground.', 'Its residents have pushed the city into building public baths and the first juvenile court in the country.'][this.round - 8]);
    }
    if (this.round >= 2 && noSew > homes * .4 && !R.epi) say(`${noSew} of your ${homes} homes still have no sewer or clean water.`, true, 0);
    const born = this.P * .024 * span; dead += epi;
    this.deaths += dead; this.P = Math.max(0, this.P + born - dead);
    say(`About ${fmt(dead)} of your people died in these years.`, dead > this.P * .1);
    // the families: find them (they move if their home is gone) and tell what this round did to them
    const family = [];
    for (const F of FAMILIES) {
      let i = this.fam[F.id]; if (i == null || !F.beats[this.round]) continue;
      const c = { burned: this.b[i] === T.RUBBLE, moved: false };
      if (!isHome(this.b[i])) { let bd = 1e9, best = -1; for (let j = 0; j < NL; j++) if (isHome(this.b[j])) { const d = Math.hypot(this.tx[j] - this.tx[i], this.ty[j] - this.ty[i]); if (d < bd) { bd = d; best = j; } } if (best < 0) continue; c.moved = !c.burned; i = this.fam[F.id] = best; }
      const b = this.b[i], cv = this.cov;
      Object.assign(c, { sewer: !!this.sewer[this.blk[i]], smoke: this.poll[i] > .9, job: this.jobLot[i] > .5, health: this.health[i], hull: !!cv.hull[i], school: !!cv.school[i], park: !!cv.park[i], transit: !!cv.transit[i], rear: b === T.REAR, reform: b === T.NEWTEN });
      family.push({ id: F.id, name: F.name, lot: i, text: (c.moved ? 'Their old home is gone, so they have moved in down the street. ' : '') + F.beats[this.round](c) });
    }
    out.family = family;
    while (out.length > (family.length > 1 ? 4 : 5)) { let q = 0; for (let k = 1; k < out.length; k++) if (out[k].pri < out[q].pri) q = k; out.splice(q, 1); } // keep the card short
    this.metrics();
    this.hist.push({ y: R.year, name: R.name, pop: Math.round(this.P), crowd: +this.crowd.toFixed(2), health: Math.round(this.healthAvg), happy: Math.round(this.happy), emp: Math.round(this.emp * 100), smoke: Math.round(this.smoke), dead: Math.round(dead), g: Array.from(this.groupPop, Math.round) });
    return out;
  }

  // ---------- fire ----------
  startGreatFire() {
    this.greatFire = true; this.done.fire = 1; this.stats.gfBurned = 0; this.stats.gfDead = 0; this.stats.gfHomes = 0;
    this.ignite(this.barn); this.burn[this.barn] = 34; for (const n of this.nbr[this.barn]) this.ignite(n.j);
  }
  ignite(i) {
    if (this.burn[i]) return; const b = this.b[i]; if (!b || b === T.RUBBLE || b === T.PARK) return;
    this.burn[i] = 4 + ((this.rnd() * 3) | 0); this.burning.push(i); this.touch(i);
  }
  fireStep() {
    const next = [];
    for (const i of this.burning) {
      if (!this.burn[i]) continue;
      if (--this.burn[i] === 2) {
        for (const n of this.nbr[i]) {
          const j = n.j, b = this.b[j]; if (!b || this.burn[j]) continue;
          const dot = (n.dx - n.dy) / (Math.hypot(n.dx, n.dy) * 1.4142);
          if (this.rnd() < 1.2 * B[b].flam * (.1 + .8 * Math.max(0, dot)) * (n.cross ? .55 : 1) * (this.cFire[j] ? .5 : 1)) this.ignite(j);
        }
        for (const [dx, dy] of GF_JUMP) { // the firestorm leaps empty lots and streets downwind
          const j = this.lotAt(this.tx[i] + dx, this.ty[i] + dy);
          if (j >= 0 && this.b[j] && !this.burn[j] && this.rnd() < .45 * B[this.b[j]].flam * (this.cFire[j] ? .5 : 1)) this.ignite(j);
        }
      }
      if (this.burn[i] <= 0) { this.stats.burned++; this.stats.gfBurned++; this.stats.gfDead += this.pop[i] * .012; if (this.pop[i] > 0) this.stats.gfHomes++; this.b[i] = T.RUBBLE; this.lock[i] = 0; this.burn[i] = 0; this.touch(i); }
      else next.push(i);
    }
    for (const i of this.burning) if (this.burn[i] && !next.includes(i)) next.push(i);
    for (let k = 0, m = 3 + (next.length >> 1); k < m && next.length; k++) { // burning embers ride the wind north and east
      const i = next[(this.rnd() * next.length) | 0], j = (this.rnd() * NL) | 0, b = this.b[j];
      if (b && !this.burn[j] && B[b].flam >= .9 && this.tx[j] >= this.tx[i] - 2 && this.ty[j] <= this.ty[i] + 2 && Math.hypot(this.tx[j] - this.tx[i], this.ty[j] - this.ty[i]) < 13 && this.rnd() < (this.cFire[j] ? .3 : .75)) { this.ignite(j); if (this.burn[j]) next.push(j); }
    }
    this.burning = next;
    if (!next.length) { this.greatFire = false; this.P -= this.stats.gfDead; this.deaths += this.stats.gfDead; this.groundDirty = true; this.metrics(); }
  }

  where(i) { const k = this.blk[i]; return ['Halsted', 'Desplaines', 'Jefferson', 'Clinton', 'Canal'][k % BW] + ' near ' + ['Van Buren', 'Harrison', 'Polk', 'Taylor'][(k / BW) | 0]; }

  save() {
    const o = {}; for (const k of ['rs', 'round', 'year', 'P', 'deaths', 'lines', 'stats', 'hist', 'done', 'pol', 'barn', 'fam']) o[k] = this[k];
    for (const k of ['b', 'g', 'lock', 'sewer']) o[k] = Array.from(this[k]); return o;
  }
  load(o) {
    for (const k of ['rs', 'round', 'year', 'P', 'deaths', 'lines', 'stats', 'hist', 'done', 'pol', 'barn', 'fam']) this[k] = o[k];
    for (const k of ['b', 'g', 'lock', 'sewer']) this[k].set(o[k]);
    this.dirty = []; this.groundDirty = true; this.linesDirty = true; this.metrics();
  }
}
