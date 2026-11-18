// The Urban Game: Chicago. Deterministic ward simulation. One step() = one month.
// No DOM or three.js in here. The renderer reads sim.dirty and sim.fx to stay in sync.
import { BW, BH, TW, TH, NB, NL, T, B, COST, EVENTS, EVENT, LANDMARKS, arrivalsFor, econTarget, START_YEAR, END_YEAR } from './data.js';

export const lotId = (bx, by, lx, ly) => ((by * BW + bx) << 4) | (ly << 2) | lx;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const NG = 7;
const isRes = b => b >= 1 && b <= 8;
const GF_JUMP = [[2, -2], [2, -1], [1, -2], [2, 0], [0, -2], [3, -3], [3, -2], [2, -3]];
const UP = { [T.SHANTY]: T.COTTAGE, [T.COTTAGE]: T.REAR, [T.REAR]: T.WTEN, [T.BRICK]: T.BTEN };

export class Sim {
  constructor() { this.buildStatic(); this.reset(); }

  // Geometry that never changes: where each lot sits and who its neighbors are.
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
        let x = this.tx[i] + dx, y = this.ty[i] + dy, cross = 0;
        let j = this.lotAt(x, y);
        if (j < 0) { x += dx; y += dy; cross = 1; j = this.lotAt(x, y); }
        if (j >= 0) list.push({ j, dx, dy, cross });
      }
      this.nbr.push(list);
    }
  }
  lotAt(x, y) { return (x < 0 || y < 0 || x >= TW || y >= TH) ? -1 : this.tileLot[y * TW + x]; }

  reset() {
    this.rs = 18711008;
    this.year = START_YEAR - 1; this.month = 11; this.t = 0; this.over = false;
    this.money = 4000; this.boodle = 5; this.econ = 1; this.costMult = 1; this.patronage = 0; this.mood = 0;
    this.pol = { brick: false, garbage: false, cable: false, canal: false, boss: false, hull: false, hullFund: false, el: false, reformWon: false };
    this.flags = {}; this.done = {}; this.picked = {}; this.pending = [];
    this.z = new Uint8Array(NL); this.b = new Uint8Array(NL); this.pop = new Float32Array(NL);
    this.g = new Uint8Array(NL); this.oth = new Float32Array(NL); this.burn = new Uint8Array(NL);
    this.sweat = new Uint8Array(NL); this.lock = new Uint8Array(NL);
    this.sewer = new Uint8Array(NB); this.paved = new Uint8Array(NB);
    this.lines = [];
    this.homeless = new Float32Array(NG);
    this.burning = []; this.greatFire = false;
    this.epi = null;
    this.deaths = 0; this.deaths12 = new Float32Array(12); this.arrived = 0;
    this.stats = { burned: 0, fireDead: 0, gfBurned: 0, gfDead: 0, gfHomeless: 0, epiDead: 0, spent: 0, skimmed: 0, peakCrowd: 0, peakPop: 0 };
    this.hist = [];
    this.dirty = []; this.fx = []; this.news = [];
    this.groundDirty = true; this.covDirty = true;
    // derived
    this.cFire = new Uint8Array(NL); this.cPolice = new Uint8Array(NL); this.cSchool = new Uint8Array(NL);
    this.cChurch = new Uint8Array(NL); this.cPark = new Uint8Array(NL); this.cBath = new Uint8Array(NL);
    this.cHosp = new Uint8Array(NL); this.cHull = new Uint8Array(NL); this.cShop = new Uint8Array(NL);
    this.cTransit = new Uint8Array(NL); this.cEl = new Uint8Array(NL);
    this.poll = new Float32Array(NL); this.lotHappy = new Float32Array(NL); this.lotRisk = new Float32Array(NL);
    this.pollGrid = new Float32Array(TW * TH);
    this.bgPop = new Float32Array(NB * NG); this.bPop = new Float32Array(NB);
    this.groupPop = new Float32Array(NG);
    this.totPop = 0; this.totCap = 1; this.crowd = 0; this.happy = 60; this.emp = 1; this.jobs = 0; this.workers = 0;
    this.deathRate = 0; this.smoke = 0; this.fireRisk = 0; this.income = 0; this.streetKids = 0;
    this.seed();
    this.recompute(); this.metrics();
  }

  rnd() { let a = this.rs = (this.rs + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }

  seed() {
    const set = (i, b, z, pop, g) => { this.b[i] = b; this.z[i] = z; this.pop[i] = pop || 0; this.g[i] = g || 0; };
    // rail yards and lumber yards along the river
    for (let by = 0; by < BH; by++) for (let ly = 0; ly < 4; ly++) {
      const i = lotId(9, by, 3, ly);
      if (by <= 2) { set(i, T.RAIL, 2); this.lock[i] = 1; }
      else if (by <= 8 && (ly + by) % 2 === 0) set(i, T.LUMBER, 2);
    }
    for (const [bx, by, lx, ly] of [[9, 4, 2, 1], [9, 5, 2, 2], [8, 4, 3, 0], [9, 7, 2, 0]]) set(lotId(bx, by, lx, ly), T.WORKSHOP, 2);
    // the old settled blocks near the river
    const dens = [0, 0, 0, 0, 0.04, 0.12, 0.26, 0.36, 0.42, 0.3];
    for (let by = 0; by <= 9; by++) for (let bx = 4; bx <= 9; bx++) for (let l = 0; l < 16; l++) {
      const i = ((by * BW + bx) << 4) | l;
      const r = this.rnd(), r2 = this.rnd(), r3 = this.rnd();
      if (this.b[i] || r > dens[bx]) continue;
      if (r2 < 0.06 && bx >= 7) set(i, r3 < 0.4 ? T.SALOON : T.SHOP, 3);
      else set(i, T.COTTAGE, 1, 5 + r3 * 3, r2 < 0.5 ? 1 : r2 < 0.8 ? 2 : 0);
    }
    for (const L of LANDMARKS) {
      const i = lotId(L.bx, L.by, L.lx, L.ly);
      set(i, L.b, L.b === T.HULL ? 1 : 0, L.b === T.HULL ? 5 : 0, 0);
      this.lock[i] = L.b === T.CHURCH ? 2 : 1; // 2 = also fireproof (both churches survived 1871)
    }
    const ol = lotId(7, 7, 1, 2); set(ol, T.COTTAGE, 1, 7, 1); this.lock[ol] = 2; // the O'Leary cottage survived too
  }

  // ---------- player actions ----------
  cost(k) { return Math.round((COST[k] ?? B[k].cost) * this.costMult); }
  spend(n) { if (this.money < n) return false; this.money -= n; this.stats.spent += n; return true; }
  touch(i) { this.dirty.push(i); }

  setZone(i, z) {
    if (this.lock[i] || this.z[i] === z) return false;
    const b = this.b[i];
    if (b >= 40) return false;
    this.z[i] = z; this.groundDirty = true; return true;
  }
  buildSewer(k) { if (this.sewer[k] || !this.spend(this.cost('sewer'))) return false; this.sewer[k] = 1; this.groundDirty = true; return true; }
  pave(k) { if (this.paved[k] || !this.spend(this.cost('pave'))) return false; this.paved[k] = 1; this.groundDirty = true; return true; }
  place(type, i) {
    if (this.lock[i] || this.burn[i] || this.b[i] >= 40) return 'That lot is taken.';
    if (!this.spend(this.cost(type))) return 'Not enough money.';
    this.evict(i);
    this.b[i] = type; this.z[i] = 0; this.sweat[i] = 0;
    this.touch(i); this.covDirty = true; this.groundDirty = true;
    return '';
  }
  bulldoze(i) {
    if (this.lock[i] || !this.b[i]) return 'Nothing to clear.';
    if (!this.spend(this.cost('bulldoze'))) return 'Not enough money.';
    if (this.burn[i]) { this.burn[i] = 0; this.burning = this.burning.filter(j => j !== i); }
    this.evict(i);
    if (this.b[i] >= 40) this.covDirty = true;
    this.b[i] = 0; this.sweat[i] = 0; this.touch(i); this.groundDirty = true;
    return '';
  }
  evict(i) { if (this.pop[i] > 0) { this.homeless[this.g[i]] += this.pop[i]; this.pop[i] = 0; this.oth[i] = 0; } }
  hasLine(axis, idx) { return this.lines.find(l => l.axis === axis && l.idx === idx); }
  addLine(axis, idx, el) {
    const cur = this.hasLine(axis, idx);
    if (cur && (cur.el || !el)) return 'There is already a line on that street.';
    if (!this.spend(this.cost(el ? 'el' : 'line'))) return 'Not enough money.';
    if (cur) cur.el = true; else this.lines.push({ axis, idx, el: !!el });
    this.covDirty = true; this.groundDirty = true; this.fx.push({ k: 'lines' });
    return '';
  }

  // ---------- scripted events ----------
  choose(id, c) {
    if (c !== undefined) this.picked[id] = c;
    const msg = EVENT[id].apply(this, c);
    if (msg) this.note(msg, 'event');
    this.metrics();
  }
  note(text, kind) { this.news.push({ text, kind: kind || 'info', y: this.year, m: this.month }); }
  startEpidemic(kind, months, k, name) { this.epi = { kind, left: months, k, name, dead: 0 }; this.fx.push({ k: 'epidemic', name }); }
  startGreatFire() {
    this.greatFire = true; this.stats.gfBurned = 0; this.stats.gfDead = 0; this.stats.gfHomeless = 0;
    const o = lotId(7, 7, 1, 3);
    this.ignite(o);
    for (const n of this.nbr[o]) if (this.b[n.j] && !this.lock[n.j]) this.ignite(n.j);
    this.fx.push({ k: 'greatfire', lot: o });
  }
  pullmanRiot() {
    this.flags.strike = 4;
    if (this.happy < 50) {
      let n = 0;
      for (let i = 0; i < NL && n < 5; i++) if ((this.b[i] === T.RAIL || this.b[i] === T.LUMBER || this.b[i] === T.WORKSHOP) && !this.lock[i] && this.rnd() < 0.25) { this.ignite(i); n++; }
      this.mood -= 5;
      return 'Angry crowds in your ward join the boycott. Fires break out in the yards.';
    }
    return 'Your ward stays calm, but the rail yards sit idle for weeks.';
  }

  // ---------- one month ----------
  step() {
    if (this.over) return;
    this.month++; if (this.month > 11) { this.month = 0; this.year++; }
    this.t++;
    for (const k in this.flags) if (typeof this.flags[k] === 'number' && --this.flags[k] <= 0) delete this.flags[k];
    for (const ev of EVENTS) if (ev.year === this.year && ev.month === this.month && !this.done[ev.id]) { this.done[ev.id] = 1; this.pending.push(ev.id); }
    this.econ += (econTarget(this.year, this.month) - this.econ) * 0.3;
    if (this.covDirty || this.t % 3 === 0) this.recompute();
    this.develop();
    this.arrive();
    this.vital();
    this.randomFire();
    this.budget();
    this.metrics();
    if (this.month === 11) this.snapshot();
    if (this.year === END_YEAR && this.month === 11) this.over = true;
  }

  // Coverage from civic buildings, transit, and the smoke plume from industry.
  recompute() {
    this.covDirty = false;
    const cov = [[T.FIRE, this.cFire], [T.POLICE, this.cPolice], [T.SCHOOL, this.cSchool], [T.CHURCH, this.cChurch], [T.PARK, this.cPark], [T.BATH, this.cBath], [T.HOSP, this.cHosp]];
    for (const [, a] of cov) a.fill(0);
    this.cHull.fill(0); this.cShop.fill(0); this.cTransit.fill(0); this.cEl.fill(0);
    const broke = this.money < -500; // unpaid firemen and teachers stop showing up
    const stamp = (arr, i, r, add) => {
      const cx = this.tx[i], cy = this.ty[i], r2 = r * r;
      for (let y = Math.max(0, cy - r); y <= Math.min(TH - 1, cy + r); y++) for (let x = Math.max(0, cx - r); x <= Math.min(TW - 1, cx + r); x++) {
        const j = this.tileLot[y * TW + x];
        if (j >= 0 && (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r2) arr[j] = add ? Math.min(250, arr[j] + 1) : 1;
      }
    };
    const pg = this.pollGrid; pg.fill(0);
    for (let i = 0; i < NL; i++) {
      const b = this.b[i]; if (!b) continue;
      if (b >= 40) {
        if (b === T.HULL) { if (this.pol.hull) stamp(this.cHull, i, this.pol.hullFund ? 15 : 8); }
        else for (const [t, a] of cov) if (t === b && (!broke || b === T.CHURCH || b === T.PARK)) stamp(a, i, B[b].r, b === T.PARK);
      } else if (b >= 10 && b <= 12) stamp(this.cShop, i, 5, true);
      const p = B[b].poll + (this.sweat[i] ? 0.15 : 0);
      if (p > 0 && !(this.burn[i])) {
        const cx = this.tx[i] + 1, cy = this.ty[i] - 1, R = 8, e = p * this.econ;
        for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(TH - 1, Math.ceil(cy + R)); y++) for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(TW - 1, Math.ceil(cx + R)); x++) {
          const d = Math.hypot(x - cx, y - cy); if (d < R) pg[y * TW + x] += e * (1 - d / R) * 0.7;
        }
      }
    }
    for (let i = 0; i < NL; i++) this.poll[i] = Math.min(3, pg[this.ty[i] * TW + this.tx[i]] + Math.min(0.8, this.bPop[this.blk[i]] / 700)); // factory smoke plus coal stoves
    for (const L of this.lines) for (let i = 0; i < NL; i++) {
      const d = Math.abs((L.axis ? this.tx[i] : this.ty[i]) - L.idx * 5);
      if (d <= 4) this.cTransit[i] = Math.max(this.cTransit[i], L.el ? 2 : 1);
      if (L.el && d <= 1) this.cEl[i] = 1;
    }
  }

  develop() {
    const y = this.year, emptyRes = [], emptyInd = [], emptyCom = [], dense = [];
    const blockBuilt = new Uint8Array(NB);
    for (let i = 0; i < NL; i++) {
      const b = this.b[i];
      if (b) blockBuilt[this.blk[i]]++;
      if (b === T.RUBBLE && this.z[i] && this.rnd() < 0.12) { this.b[i] = 0; this.touch(i); } // ruins get cleared for rebuilding
      if (!this.b[i]) { const z = this.z[i]; if (z === 1) emptyRes.push(i); else if (z === 2) emptyInd.push(i); else if (z === 3) emptyCom.push(i); }
      else if (isRes(b) && this.z[i] === 1 && UP[b] && !this.lock[i] && !this.burn[i] && this.pop[i] > B[b].cap * 1.3) dense.push(i);
    }
    const pick = (list, n, score) => {
      const out = [];
      for (let k = 0; k < n && list.length; k++) {
        let best = -1, bs = -1e9;
        for (let s = 0; s < 14; s++) { const q = (this.rnd() * list.length) | 0; const sc = score(list[q]) + this.rnd() * 3; if (sc > bs) { bs = sc; best = q; } }
        out.push(list[best]); list[best] = list[list.length - 1]; list.pop();
      }
      return out;
    };
    const put = (i, b) => { this.b[i] = b; this.touch(i); if (b >= 10) this.covDirty = true; };

    // housing: builders respond to demand, not to plans
    const A = arrivalsFor(y).n;
    let hl = 0; for (let g = 0; g < NG; g++) hl += this.homeless[g];
    const need = this.totPop + hl + A / 3 - this.totCap;
    if (need > 0) {
      const rush = this.flags.rebuild ? 2 : 1;
      const n = Math.min(Math.ceil(need / 7), (this.pol.brick ? 4 : 9) * rush);
      for (const i of pick(emptyRes, n, i => blockBuilt[this.blk[i]] * 0.5 + this.cTransit[i] * 2 - this.poll[i] * 2)) {
        let b = this.pol.brick ? T.BRICK : T.COTTAGE;
        if (y >= 1868 && this.poll[i] < 0.3 && this.tx[i] < 16 && this.rnd() < 0.3) b = T.MANSION;
        put(i, b); this.g[i] = 0; this.pop[i] = 0;
      }
      // landlords pack more onto the lots they already own
      if (this.crowd > 1.15 || !emptyRes.length) {
        dense.sort((a, c) => this.pop[c] / B[this.b[c]].cap - this.pop[a] / B[this.b[a]].cap);
        const m = Math.min(dense.length, this.pol.brick ? 3 : 6);
        for (let k = 0; k < m; k++) {
          const i = dense[k]; let nb = UP[this.b[i]];
          if (this.pol.brick && (nb === T.COTTAGE)) nb = T.BRICK;
          if (this.pol.brick && nb === T.WTEN) nb = T.BTEN;
          if (nb === T.BTEN && y >= 1890 && this.cHull[i]) nb = T.NEWTEN;
          put(i, nb);
        }
      }
    }
    // industry: follows idle hands, the river, and the rails
    const idle = this.workers - this.jobs;
    if (!this.flags.indFreeze && this.econ > 0.8 && (idle > 60 || this.flags.lumberBoom)) {
      const n = Math.min(3, 1 + Math.floor(idle / 400));
      for (const i of pick(emptyInd, n, i => this.tx[i] * 0.25 + blockBuilt[this.blk[i]] * 0.3)) {
        const r = this.rnd();
        let b = r < 0.5 ? T.WORKSHOP : T.FACTORY;
        if (this.tx[i] >= 40 && y < 1886 && r < 0.6) b = T.LUMBER;
        else if (y >= 1880 && r > 0.72) b = T.SWEAT;
        put(i, b);
      }
      if (!emptyInd.length && idle > 250) {
        if (this.rnd() < 0.5) { for (let k = 0; k < 40; k++) { const i = (this.rnd() * NL) | 0; if (this.b[i] === T.WORKSHOP) { put(i, T.FACTORY); break; } } }
        else if (y >= 1878) { for (let k = 0; k < 60; k++) { const i = (this.rnd() * NL) | 0; const b = this.b[i]; if ((b === T.WTEN || b === T.BTEN || b === T.REAR) && !this.sweat[i]) { this.sweat[i] = 1; this.covDirty = true; break; } } }
      }
    }
    // shops and saloons follow customers
    let com = 0; for (let i = 0; i < NL; i++) { const b = this.b[i]; if (b >= 10 && b <= 12) com++; }
    this.comCount = com;
    if (com < this.totPop / 240) {
      for (const i of pick(emptyCom, 2, i => this.bPop[this.blk[i]] * 0.02)) {
        const r = this.rnd();
        put(i, r < 0.3 ? T.SALOON : (y >= 1880 || this.pol.brick) && r > 0.6 ? T.STORE : T.SHOP);
      }
    }
    // people with nowhere to go build where nobody stops them
    if (hl > 25) {
      const open = [];
      for (let i = 0; i < NL; i++) if (!this.b[i] && this.z[i] !== 1 && !this.lock[i]) open.push(i);
      for (const i of pick(open, Math.min(7, Math.ceil(hl / 12)), i => this.tx[i] * 0.12 + this.poll[i] + blockBuilt[this.blk[i]] * 0.4)) { put(i, T.SHANTY); this.g[i] = 0; this.pop[i] = 0; }
    }
  }

  arrive() {
    const A = arrivalsFor(this.year);
    const season = [0.5, 0.5, 0.9, 1.3, 1.5, 1.4, 1.2, 1.1, 1.2, 1.1, 0.8, 0.5][this.month];
    const N = new Float32Array(NG); let total = 0, lead = 0;
    for (let g = 0; g < NG; g++) { const n = A.n / 12 * season * A.mix[g]; N[g] = n + this.homeless[g]; this.homeless[g] = 0; total += n; if (A.mix[g] > A.mix[lead]) lead = g; }
    this.arrived += total;
    if (this.month % 3 === 1) this.fx.push({ k: 'train', n: Math.round(total * 3), g: lead });
    // neighborhood makeup, for chain migration
    this.bgPop.fill(0); this.bPop.fill(0);
    const res = [];
    for (let i = 0; i < NL; i++) {
      const b = this.b[i];
      if (isRes(b) || b === T.HULL) { if (!this.burn[i]) res.push(i); if (this.pop[i] > 0) { this.bgPop[this.blk[i] * NG + this.g[i]] += this.pop[i]; this.bPop[this.blk[i]] += this.pop[i]; } }
    }
    const share = (k, g) => {
      let a = this.bgPop[k * NG + g], t = this.bPop[k]; const bx = k % BW, by = (k / BW) | 0;
      if (bx > 0) { a += 0.5 * this.bgPop[(k - 1) * NG + g]; t += 0.5 * this.bPop[k - 1]; }
      if (bx < BW - 1) { a += 0.5 * this.bgPop[(k + 1) * NG + g]; t += 0.5 * this.bPop[k + 1]; }
      if (by > 0) { a += 0.5 * this.bgPop[(k - BW) * NG + g]; t += 0.5 * this.bPop[k - BW]; }
      if (by < BH - 1) { a += 0.5 * this.bgPop[(k + BW) * NG + g]; t += 0.5 * this.bPop[k + BW]; }
      return t > 0 ? a / t : 0;
    };
    const w = new Float32Array(res.length);
    let anyOpen = false; for (let i = 0; i < NL; i++) if (!this.b[i] && this.z[i] !== 1) { anyOpen = true; break; }
    const limits = [1, 2, anyOpen ? 2 : 3.3];
    for (let g = 0; g < NG; g++) {
      let n = N[g]; if (n < 0.01) continue;
      for (let pass = 0; pass < 3 && n > 0.01; pass++) {
        if (pass === 2 && limits[2] === 2) break;
        for (let it = 0; it < 2 && n > 0.01; it++) {
          let W = 0;
          for (let q = 0; q < res.length; q++) {
            const i = res[q], b = this.b[i]; let cap = B[b].cap;
            if (b === T.MANSION || b === T.HULL) { w[q] = 0; continue; }
            const free = cap * limits[pass] - this.pop[i];
            if (free <= 0) { w[q] = 0; continue; }
            const aff = this.pop[i] < 1 ? 1 + 4 * share(this.blk[i], g) + (this.cChurch[i] ? 0.5 : 0) : this.g[i] === g ? 3 : 0.12;
            W += (w[q] = free * aff * (b === T.SHANTY ? 0.5 : 1));
          }
          if (W <= 0) break;
          const f = n / W; let placed = 0;
          for (let q = 0; q < res.length; q++) {
            if (!w[q]) continue;
            const i = res[q]; const free = B[this.b[i]].cap * limits[pass] - this.pop[i];
            const add = Math.min(free, w[q] * f); if (add <= 0) continue;
            if (this.pop[i] < 1) { this.g[i] = g; this.oth[i] = 0; }
            else if (this.g[i] !== g) { this.oth[i] += add; if (this.oth[i] > (this.pop[i] + add) / 2) { this.g[i] = g; this.oth[i] = this.pop[i] + add - this.oth[i]; } }
            this.pop[i] += add; placed += add;
          }
          n -= placed;
        }
      }
      if (n > 0.01) this.homeless[g] += n * 0.9; // one in ten gives up and leaves the city
    }
  }

  lotDeathRate(i) {
    const b = this.b[i], k = this.blk[i], crowd = clamp(this.pop[i] / B[b].cap - 1, 0, 2.3);
    let r = 0.012 + crowd * 0.011 + this.poll[i] * 0.0035;
    if (!this.sewer[k]) r += this.pol.canal ? 0.008 : 0.011; else if (!this.pol.canal) r += 0.002;
    if (!this.paved[k]) r += 0.002;
    if (!this.pol.garbage) r += 0.003;
    if (b === T.SHANTY) r += 0.007;
    if (b === T.NEWTEN) r -= 0.004;
    if (this.sweat[i]) r += 0.004;
    if (this.cHosp[i]) r -= 0.003;
    if (this.cBath[i]) r -= 0.002;
    if (this.cHull[i]) r -= 0.002;
    if (this.cPark[i]) r -= 0.001;
    if (this.flags.noRelief) r += 0.003;
    return Math.max(0.006, r);
  }

  vital() {
    let dead = 0; const e = this.epi;
    const outRate = this.pol.cable ? 0.003 : 0.002;
    for (let i = 0; i < NL; i++) {
      let p = this.pop[i]; if (p <= 0) continue;
      const b = this.b[i], cap = B[b].cap;
      let r = this.lotDeathRate(i); this.lotRisk[i] = r;
      let d = p * r / 12;
      if (e) {
        const x = e.kind === 'water' ? (this.sewer[this.blk[i]] ? 0.12 : 1) : 0.25 + clamp(p / cap - 1, 0, 2);
        const ed = p * e.k * x / 12 * 2.2; d += ed; e.dead += ed;
      }
      const born = p * 0.024 / 12;
      p += born - d; dead += d;
      // older immigrant groups move up and out, faster where the streetcar runs
      if (this.g[i] <= 2 && b !== T.MANSION && b !== T.HULL && p > cap * 0.8) {
        const tr = this.cTransit[i];
        p -= p * (tr === 2 ? outRate * 2.2 : tr === 1 ? outRate : this.year >= 1885 ? 0.001 : 0);
      }
      this.pop[i] = p < 0.5 ? 0 : p;
    }
    for (let g = 0; g < NG; g++) { const h = this.homeless[g]; dead += h * 0.004; this.homeless[g] = h * 0.93; }
    this.deaths += dead; this.deaths12[this.t % 12] = dead;
    if (e && --e.left <= 0) {
      this.stats.epiDead += e.dead;
      this.note(`${e.name} has passed. It killed about ${Math.round(e.dead).toLocaleString('en-US')} people in your ward.` + (e.kind === 'water' ? ' Blocks without sewers buried the most.' : ' The most crowded buildings buried the most.'), 'bad');
      this.epi = null;
    }
  }

  ignite(i) {
    if (this.burn[i] || (this.lock[i] && this.b[i] !== T.BARN)) return;
    const b = this.b[i]; if (!b || b === T.RUBBLE || b === T.PARK) return;
    this.burn[i] = 4 + ((this.rnd() * 3) | 0); this.burning.push(i); this.touch(i);
  }
  randomFire() {
    if (this.greatFire || this.burning.length || this.year < 1866 || (this.year === 1871 && this.month >= 7)) return;
    if (this.rnd() > 0.015 + this.fireRisk * 0.0011) return;
    let best = -1, bs = 0;
    for (let k = 0; k < 30; k++) {
      const i = (this.rnd() * NL) | 0, b = this.b[i]; if (!b || this.lock[i] || b === T.RUBBLE) continue;
      const s = B[b].flam * (this.cFire[i] ? 0.4 : 1) * (0.5 + this.rnd());
      if (s > bs) { bs = s; best = i; }
    }
    if (best >= 0 && bs > 0.5) { this.ignite(best); this.fx.push({ k: 'fire', lot: best }); this.note('Fire on ' + this.where(best) + '!', 'bad'); }
  }
  // Called several times a second while anything is burning.
  fireStep() {
    const next = [], gf = this.greatFire, base = gf ? 1.2 : 0.3;
    for (const i of this.burning) {
      if (!this.burn[i]) continue;
      if (--this.burn[i] === 2) {
        for (const n of this.nbr[i]) {
          const j = n.j, b = this.b[j]; if (!b || this.burn[j]) continue;
          const dot = (n.dx - n.dy) / (Math.hypot(n.dx, n.dy) * 1.4142);
          let p = base * B[b].flam * ((gf ? 0.07 : 0.2) + 0.8 * Math.max(0, dot)) * (n.cross ? 0.55 : 1) * (this.cFire[j] ? 0.55 : 1);
          if (gf && B[b].flam < 0.5) p *= 1.6; // in a firestorm even brick fails
          if (this.rnd() < p) { this.ignite(j); }
        }
        if (gf) for (const [dx, dy] of GF_JUMP) { // the firestorm leaps empty lots and streets downwind
          const j = this.lotAt(this.tx[i] + dx, this.ty[i] + dy);
          if (j >= 0 && this.b[j] && !this.burn[j] && this.rnd() < 0.5 * B[this.b[j]].flam * (this.cFire[j] ? 0.6 : 1)) this.ignite(j);
        }
      }
      if (this.burn[i] <= 0) this.burnDown(i); else next.push(i);
    }
    for (const i of this.burning) if (this.burn[i] && !next.includes(i)) next.push(i);
    if (gf && next.length && this.rnd() < 0.8) { // embers on the wind
      const i = next[(this.rnd() * next.length) | 0], d = 3 + ((this.rnd() * 7) | 0);
      const j = this.lotAt(this.tx[i] + d - ((this.rnd() * 2) | 0), this.ty[i] - d + ((this.rnd() * 2) | 0));
      if (j >= 0 && this.b[j] && B[this.b[j]].flam >= 0.9 && !this.burn[j]) { this.ignite(j); if (this.burn[j]) next.push(j); }
    }
    this.burning = next;
    if (!next.length) {
      this.covDirty = true; this.metrics();
      if (gf) { this.greatFire = false; this.flags.rebuild = 14; this.mood -= 12; let h = 0; for (let g = 0; g < NG; g++) h += this.homeless[g]; this.stats.gfHomeless = h; this.pending.push('fireAfter'); }
    }
  }
  burnDown(i) {
    const p = this.pop[i], dead = p * (this.greatFire ? 0.012 : 0.03);
    this.deaths += dead; this.stats.fireDead += dead; this.stats.burned++;
    if (this.greatFire) { this.stats.gfBurned++; this.stats.gfDead += dead; }
    this.homeless[this.g[i]] += p - dead; this.pop[i] = 0; this.oth[i] = 0; this.sweat[i] = 0;
    if (this.b[i] >= 40) this.covDirty = true;
    this.b[i] = this.lock[i] ? this.b[i] : T.RUBBLE; this.burn[i] = 0;
    if (this.lock[i] && this.b[i] === T.BARN) { this.b[i] = T.RUBBLE; this.lock[i] = 0; }
    this.touch(i); this.groundDirty = true;
  }

  budget() {
    let up = 0;
    for (let i = 0; i < NL; i++) { const b = this.b[i]; if (b >= 40 && B[b].up) up += B[b].up; }
    if (this.pol.garbage) up += 800;
    for (const L of this.lines) up += L.el ? 200 : 80;
    const filled = Math.min(this.jobs, this.workers);
    const gross = this.totPop * 0.010 + filled * 0.018 + (this.comCount || 0) * 1.1;
    const skim = gross * this.boodle / 100 * 0.5;
    this.stats.skimmed += skim;
    this.income = (gross - skim) * 12 - up;
    this.money += gross - skim - up / 12;
    if (this.pol.boss && this.month === 11 && this.rnd() < 0.35) { this.boodle = Math.min(100, this.boodle + 3); }
    this.mood *= 0.94;
  }

  metrics() {
    let pop = 0, cap = 0, jobs = 0, hs = 0, ps = 0, fr = 0, nb = 0, sw = 0;
    this.groupPop.fill(0);
    const strike = this.flags.strike ? 0.8 : 1;
    for (let i = 0; i < NL; i++) {
      const b = this.b[i]; if (!b) continue;
      const d = B[b];
      if (d.jobs) jobs += d.jobs * (b >= 20 && b < 30 ? this.econ * strike : b >= 10 && b < 20 ? 0.5 + 0.5 * this.econ : 1);
      if (this.sweat[i]) { jobs += 14 * this.econ; sw++; }
      if (b !== T.RUBBLE && b !== T.PARK) { nb++; fr += d.flam * (this.cFire[i] ? 0.5 : 1) * (d.cap ? 1 + clamp(this.pop[i] / d.cap - 1, 0, 2) * 0.3 : 1); }
      const p = this.pop[i]; if (p <= 0) continue;
      pop += p; cap += d.cap; this.groupPop[this.g[i]] += p;
    }
    for (let i = 0; i < NL; i++) { const b = this.b[i]; if (isRes(b) && this.pop[i] <= 0) cap += B[b].cap; }
    jobs += this.patronage;
    let hl = 0; for (let g = 0; g < NG; g++) hl += this.homeless[g];
    this.homelessTotal = hl;
    this.totPop = pop; this.totCap = Math.max(1, cap); this.crowd = pop / this.totCap;
    this.workers = (pop + hl) * 0.42; this.jobs = jobs; this.emp = this.workers > 0 ? Math.min(1, jobs / this.workers) : 1;
    const empTerm = clamp((this.emp - 0.92) * 70, -28, 4);
    const global = this.mood + empTerm + (this.epi ? -8 : 0) + (this.flags.relief ? 4 : 0) + (this.flags.noRelief ? -6 : 0) + (this.pol.boss ? 3 : 0) + (this.flags.order ? -3 : 0) - Math.min(8, hl / 60);
    for (let i = 0; i < NL; i++) {
      const p = this.pop[i]; if (p <= 0) { this.lotHappy[i] = 0; continue; }
      const b = this.b[i], k = this.blk[i];
      let h = 62 - clamp(p / B[b].cap - 1, 0, 2.3) * 17 - this.poll[i] * 6;
      if (!this.sewer[k]) h -= 5; if (!this.paved[k]) h -= 4;
      if (this.cSchool[i]) h += 5; if (this.cChurch[i]) h += 5; h += Math.min(4, this.cPark[i]) * 2.5;
      if (this.cShop[i]) h += 3; if (this.cPolice[i]) h += 2; if (this.cTransit[i]) h += 4; if (this.cEl[i]) h -= 6;
      if (this.cHull[i]) h += 6; if (this.cBath[i]) h += 2; if (this.cFire[i]) h += 2;
      if (b === T.SHANTY) h -= 10; if (b === T.NEWTEN) h += 5; if (this.sweat[i]) h -= 5; if (this.pol.garbage) h += 2;
      h = clamp(h + global, 0, 100); this.lotHappy[i] = h; hs += h * p; ps += this.poll[i] * p;
    }
    this.happy = pop > 0 ? hs / pop : 60;
    this.smoke = pop > 0 ? clamp(ps / pop * 38, 0, 100) : 0;
    this.fireRisk = nb ? clamp(fr / nb * 62, 0, 100) : 0;
    let d12 = 0; for (let k = 0; k < 12; k++) d12 += this.deaths12[k];
    this.deathRate = pop > 0 ? d12 / pop * 1000 * (this.t < 12 ? 12 / Math.max(1, this.t) : 1) : 0;
    this.sweatCount = sw;
    this.streetKids = Math.round(this.deaths * 0.05 + sw * 12 + hl * 0.2);
    if (this.crowd > this.stats.peakCrowd) this.stats.peakCrowd = this.crowd;
    if (pop > this.stats.peakPop) this.stats.peakPop = pop;
  }

  snapshot() {
    this.hist.push({ y: this.year, pop: Math.round(this.totPop), crowd: +this.crowd.toFixed(2), dr: +this.deathRate.toFixed(1), happy: Math.round(this.happy), emp: Math.round(this.emp * 100), smoke: Math.round(this.smoke), money: Math.round(this.money), boodle: Math.round(this.boodle), g: Array.from(this.groupPop, Math.round) });
  }

  where(i) {
    const k = this.blk[i], bx = k % BW, by = (k / BW) | 0;
    return ['Loomis', 'Throop', 'Centre', 'Aberdeen', 'Morgan', 'Halsted', 'Desplaines', 'Jefferson', 'Clinton', 'Canal'][bx] + ' near ' + ['Madison', 'Monroe', 'Adams', 'Jackson', 'Van Buren', 'Harrison', 'Polk', 'Taylor', 'DeKoven', '12th', 'Maxwell', '14th'][by];
  }

  // ---------- save / load ----------
  save() {
    const o = {};
    for (const k of ['rs', 'year', 'month', 't', 'over', 'money', 'boodle', 'econ', 'costMult', 'patronage', 'mood', 'pol', 'flags', 'done', 'picked', 'lines', 'deaths', 'arrived', 'stats', 'hist', 'epi', 'greatFire', 'burning']) o[k] = this[k];
    for (const k of ['z', 'b', 'pop', 'g', 'oth', 'burn', 'sweat', 'lock', 'sewer', 'paved', 'homeless', 'deaths12']) o[k] = Array.from(this[k], v => Math.round(v * 10) / 10);
    return o;
  }
  load(o) {
    for (const k of ['rs', 'year', 'month', 't', 'over', 'money', 'boodle', 'econ', 'costMult', 'patronage', 'mood', 'pol', 'flags', 'done', 'picked', 'lines', 'deaths', 'arrived', 'stats', 'hist', 'epi', 'greatFire', 'burning']) this[k] = o[k];
    for (const k of ['z', 'b', 'pop', 'g', 'oth', 'burn', 'sweat', 'lock', 'sewer', 'paved', 'homeless', 'deaths12']) this[k].set(o[k]);
    this.pending = []; this.fx = []; this.news = []; this.dirty = [];
    this.recompute(); this.metrics(); this.groundDirty = true;
  }
}
