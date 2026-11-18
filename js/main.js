// The Urban Game: Chicago. Interface, game clock, and the two ways to play.
import { Sim } from './sim.js';
import { World } from './world.js';
import { Sound } from './audio.js';
import { buildReport } from './report.js';
import { BW, T, B, GROUPS, EVENTS, EVENT, ROUNDS, MONTHS, QUOTES, JOBS, START_YEAR, END_YEAR, arrivalsFor } from './data.js';

const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const fmt = n => Math.round(n).toLocaleString('en-US');
const money = n => (n < 0 ? '-$' : '$') + fmt(Math.abs(n));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const params = new URLSearchParams(location.search);
const SAVE_KEY = 'urbangame-chicago-v1';

const sim = new Sim();
const world = new World($('#c'), sim, { low: params.has('lowgfx') });
const snd = new Sound();
const G = { mode: 'solo', pace: 45, name: '', started: false, running: false, paused: false, locked: true, round: 0, tool: 'look', brush: 'block', acc: 0, fireAcc: 0, speed: +(params.get('speed') || 1), photos: [], modal: null, gf: false };
window.__game = { sim, world, G }; // handy for testing in the console

// ---------- tools ----------
const TOOLS = [
  { id: 'look', icon: '✋', name: 'Look around', hint: '<b>Look around.</b> Drag to move, scroll to zoom, right-drag to turn.' },
  { id: 'inspect', icon: '🔍', name: 'Meet residents', hint: '<b>Meet residents.</b> Click any building to see who lives there and what they say.' },
  { h: 'Zone land (free)' },
  { id: 'zr', icon: '🏠', name: 'Housing', zone: 1, hint: '<b>Housing zone.</b> Builders put up homes here as people arrive. You do not choose what kind.' },
  { id: 'zi', icon: '🏭', name: 'Industry', zone: 2, hint: '<b>Industry zone.</b> Jobs and taxes, smoke and fire. Fills fastest near the river and rails.' },
  { id: 'zc', icon: '🏪', name: 'Shops', zone: 3, hint: '<b>Shop zone.</b> Stores and saloons open where customers live nearby.' },
  { id: 'z0', icon: '⬜', name: 'Unzone', zone: 0, hint: '<b>Unzone.</b> Empty unzoned land is where squatters build shanties.' },
  { brush: 1 },
  { h: 'City works' },
  { id: 'sewer', icon: '🚰', name: 'Sewer + water', cost: 'sewer', per: 'block', hint: '<b>Sewers and piped water</b> for one block. The best defense against cholera and typhoid.' },
  { id: 'pave', icon: '🧱', name: 'Pave streets', cost: 'pave', per: 'block', hint: '<b>Pave the streets</b> around one block. Less mud, less filth, happier residents.' },
  { id: 'line', icon: '🚋', name: 'Streetcar line', cost: 'line', per: 'street', hint: '<b>Streetcar line.</b> Click a street. Families along it can move out of crowded blocks.' },
  { id: 'el', icon: '🚆', name: 'Elevated line', cost: 'el', per: 'street', lock: s => !s.pol.el, hint: '<b>Elevated line.</b> Moves far more people than a streetcar. The blocks beneath it live in shadow.' },
  { h: 'Build' },
  { id: 'b' + T.FIRE, icon: '🚒', b: T.FIRE }, { id: 'b' + T.SCHOOL, icon: '🏫', b: T.SCHOOL }, { id: 'b' + T.PARK, icon: '🌳', b: T.PARK },
  { id: 'b' + T.CHURCH, icon: '⛪', b: T.CHURCH }, { id: 'b' + T.BATH, icon: '🛁', b: T.BATH }, { id: 'b' + T.POLICE, icon: '👮', b: T.POLICE }, { id: 'b' + T.HOSP, icon: '🏥', b: T.HOSP },
  { id: 'doze', icon: '💥', name: 'Tear down', cost: 'bulldoze', per: 'lot', hint: '<b>Tear down</b> a building. The people living in it lose their home. Empty lots stop fires.' },
];
for (const t of TOOLS) if (t.b) { t.name = B[t.b].name; t.per = 'lot'; t.hint = `<b>${B[t.b].name}.</b> ${B[t.b].note}`; }
const TOOL = Object.fromEntries(TOOLS.filter(t => t.id).map(t => [t.id, t]));
const toolCost = t => t.b ? sim.cost(t.b) : t.cost ? sim.cost(t.cost) : 0;

function buildTools() {
  const box = $('#tools');
  for (const t of TOOLS) {
    if (t.h) { box.append(el('h4', '', t.h)); continue; }
    if (t.brush) { const d = el('div'); d.id = 'brush'; d.innerHTML = '<button data-b="block" class="on">Whole block</button><button data-b="lot">One lot</button>'; d.onclick = e => { const b = e.target.dataset.b; if (!b) return; G.brush = b; d.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.b === b)); }; box.append(d); continue; }
    const b = el('button', 'tool', `<em>${t.icon}</em><span>${t.name}</span><small></small>`); b.dataset.id = t.id; b.onclick = () => setTool(t.id); t.el = b; box.append(b);
  }
  setTool('look');
}
function setTool(id) {
  if (world.street && id !== 'look') return;
  G.tool = id; for (const t of TOOLS) if (t.el) t.el.classList.toggle('on', t.id === id);
  $('#tip').innerHTML = TOOL[id].hint; world.highlight(null);
  const zv = id[0] === 'z' && id !== 'zoom'; if (world.zoneView !== zv) { world.zoneView = zv; sim.groundDirty = true; }
  $('#c').style.cursor = id === 'look' ? 'grab' : 'crosshair';
}

// ---------- overlays ----------
const OVERLAYS = [['none', 'City view'], ['zones', 'Zones'], ['crowd', 'Crowding'], ['health', 'Death risk'], ['smoke', 'Smoke'], ['fire', 'Fire danger'], ['happy', 'Unhappiness'], ['groups', 'Nationalities'], ['pipes', 'Sewers + paving']];
const LEGEND = {
  zones: '<div class="sw"><i style="background:#4fae46"></i>Housing</div><div class="sw"><i style="background:#e0b532"></i>Industry</div><div class="sw"><i style="background:#4a8fe0"></i>Shops</div>',
  crowd: ['Room to spare', 'Packed'], health: ['Safer', 'Deadly'], smoke: ['Clear', 'Choking'], fire: ['Brick', 'Tinder'], happy: ['Content', 'Miserable'],
  groups: GROUPS.map(g => `<div class="sw"><i style="background:${g.color}"></i>${g.short}</div>`).join(''),
  pipes: '<div class="sw"><i style="background:#3f7fd0"></i>Sewer and paved</div><div class="sw"><i style="background:#7fb4e6"></i>Sewer only</div><div class="sw"><i style="background:#c9b48a"></i>Paved only</div><div class="sw"><i style="background:#c8503c"></i>Neither</div>',
};
function buildOverlays() {
  const box = $('#overlays');
  for (const [id, name] of OVERLAYS) { const b = el('button', id === 'none' ? 'on' : '', name); b.dataset.o = id; box.append(b); }
  box.onclick = e => { const o = e.target.dataset.o; if (o) setOverlay(o); };
}
function setOverlay(o) {
  world.setOverlay(o); document.querySelectorAll('#overlays button').forEach(b => b.classList.toggle('on', b.dataset.o === o));
  const L = LEGEND[o]; $('#legend').innerHTML = !L ? '' : Array.isArray(L) ? `<div class="bar"></div><div class="lr"><span>${L[0]}</span><span>${L[1]}</span></div>` : L;
}

// ---------- meters ----------
const METERS = [['pop', 'People'], ['money', 'Treasury'], ['crowd', 'People per room'], ['dr', 'Deaths per 1,000'], ['happy', 'Happiness'], ['jobs', 'Have work'], ['smoke', 'Smoke'], ['fire', 'Fire danger'], ['boodle', 'Graft']];
const M = {};
function buildMeters() { for (const [id, label] of METERS) { const d = el('div', 'meter', `<label>${label}</label><b></b><small></small><i><u></u></i>`); M[id] = { el: d, b: d.querySelector('b'), s: d.querySelector('small'), u: d.querySelector('u'), last: 0 }; $('#meters').append(d); } }
function setMeter(id, text, small, frac, level) {
  const m = M[id]; m.b.textContent = text; m.s.textContent = small || ''; m.u.style.width = clamp(frac, 0, 1) * 100 + '%';
  m.u.style.background = level === 2 ? '#e0563c' : level === 1 ? '#e6b93a' : '#6fae58';
  m.el.classList.toggle('bad', level === 2); m.el.classList.toggle('warn', level === 1);
  if (level === 2 && m.last !== 2) { m.el.classList.remove('flash'); void m.el.offsetWidth; m.el.classList.add('flash'); } m.last = level;
}
function updateHud() {
  const s = sim, y = Math.max(START_YEAR, s.year);
  $('#month').textContent = MONTHS[s.year < START_YEAR ? 0 : s.month]; $('#year').textContent = y;
  $('#tfill').style.width = clamp((s.t) / ((END_YEAR - START_YEAR + 1) * 12), 0, 1) * 100 + '%';
  const ppr = s.crowd * 1.5;
  setMeter('pop', fmt(s.totPop), '+' + fmt(arrivalsFor(y).n) + '/yr', s.totPop / 45000, 0);
  setMeter('money', money(s.money), (s.income >= 0 ? '+' : '') + fmt(s.income) + '/yr', s.money / 12000, s.money < 0 ? 2 : s.money < 400 ? 1 : 0);
  setMeter('crowd', ppr.toFixed(1), '', s.crowd / 2.2, s.crowd > 1.6 ? 2 : s.crowd > 1.2 ? 1 : 0);
  setMeter('dr', s.deathRate.toFixed(0), '', s.deathRate / 50, s.deathRate > 32 ? 2 : s.deathRate > 25 ? 1 : 0);
  setMeter('happy', Math.round(s.happy) + '%', '', s.happy / 100, s.happy < 35 ? 2 : s.happy < 50 ? 1 : 0);
  setMeter('jobs', Math.round(s.emp * 100) + '%', '', s.emp, s.emp < .7 ? 2 : s.emp < .88 ? 1 : 0);
  setMeter('smoke', Math.round(s.smoke), '', s.smoke / 100, s.smoke > 45 ? 2 : s.smoke > 25 ? 1 : 0);
  setMeter('fire', Math.round(s.fireRisk), '', s.fireRisk / 100, s.fireRisk > 70 ? 2 : s.fireRisk > 45 ? 1 : 0);
  setMeter('boodle', Math.round(s.boodle) + '%', '', s.boodle / 100, s.boodle > 40 ? 2 : s.boodle > 20 ? 1 : 0);
  for (const t of TOOLS) if (t.el) {
    const c = toolCost(t); if (c) { t.el.querySelector('small').textContent = '$' + fmt(c); t.el.classList.toggle('poor', s.money < c); }
    if (t.lock) t.el.classList.toggle('locked', t.lock(s));
  }
  $('#pause').textContent = G.paused ? '▶' : '⏸';
  if (G.gf) $('#banner').innerHTML = `THE GREAT FIRE<small>${s.burning.length} buildings burning. Tear down buildings in its path to make a firebreak.</small>`;
  updateSteps();
  snd.city(clamp(s.totPop / 40000, 0, 1));
}
const STEPS = [
  ['Zone some land for <b>housing</b>', s => count(s, 1) > Z0[1] + 30], ['Zone <b>industry</b> near the river', s => count(s, 2) > Z0[2] + 12],
  ['Zone a few lots for <b>shops</b>', s => count(s, 3) > Z0[3] + 6], ['Build a <b>sewer</b> under a crowded block', s => s.sewer.some(v => v)],
  ['Use <b>Meet residents</b> on any house', () => G.inspected],
];
const Z0 = [0, 0, 0, 0];
const count = (s, z) => { let n = 0; for (let i = 0; i < s.z.length; i++) if (s.z[i] === z) n++; return n; };
function updateSteps() {
  const box = $('#steps'); if (G.stepsDone) return;
  if (sim.year >= 1868) { box.hidden = true; G.stepsDone = true; return; }
  const st = STEPS.map(([, f]) => f(sim)); if (st.every(Boolean)) { box.hidden = true; G.stepsDone = true; return; }
  box.hidden = false; box.innerHTML = '<h5>First things first</h5>' + STEPS.map(([t], k) => `<div class="${st[k] ? 'done' : ''}">${t}</div>`).join('');
}

// ---------- ticker, toasts ----------
const tickQ = []; let tickHold = 0;
function say(html, cls) { tickQ.push({ html, cls }); if (tickQ.length > 6) tickQ.splice(0, tickQ.length - 6); }
function pumpTicker(dt) {
  tickHold -= dt; if (tickHold > 0 || !tickQ.length) return;
  const m = tickQ.shift(); const p = el('p', m.cls || '', m.html); const box = $('#ticker'); box.innerHTML = ''; box.append(p); tickHold = m.cls ? 5 : 4;
}
function toast(html, kind, ms = 5000) { const t = el('div', 'toast ' + (kind || ''), html); $('#toasts').append(t); while ($('#toasts').children.length > 4) $('#toasts').firstChild.remove(); setTimeout(() => t.remove(), ms); return t; }
let lastErr = 0; function fail(msg) { const n = performance.now(); if (n - lastErr > 900) { lastErr = n; toast(msg, 'bad', 2200); snd.err(); } }

// what someone living on this lot would tell you
function quoteFor(i) {
  const s = sim, b = s.b[i], k = s.blk[i], crowd = s.pop[i] / B[b].cap, opts = [];
  if (b === T.SHANTY) opts.push('shanty', 'shanty'); if (b === T.MANSION || b === T.HULL) return pickQ('mansion', i);
  if (crowd > 2) opts.push('crowd3', 'crowd3'); else if (crowd > 1.35) opts.push('crowd2');
  if (s.sweat[i]) opts.push('sweat'); if (s.emp < .78) opts.push('jobless'); if (!s.sewer[k]) opts.push('nosewer');
  if (s.poll[i] > 1) opts.push('smoke'); if (s.cEl[i]) opts.push('elshadow'); if (!s.paved[k] && crowd < 1.5) opts.push('mud');
  if (B[b].flam >= 1 && !s.cFire[i] && s.fireRisk > 55) opts.push('fear');
  if (!opts.length || crowd < 1.2) { if (s.cHull[i]) opts.push('hull'); if (s.cSchool[i]) opts.push('school'); if (s.cPark[i]) opts.push('park'); if (s.pol.boss) opts.push('boss'); if (!opts.length) opts.push('good'); }
  return pickQ(opts[(i * 7 + s.year * 3 + s.month) % opts.length], i);
}
function pickQ(key, i) { const q = QUOTES[key], g = GROUPS[sim.g[i]]; return { text: q[(i + sim.year + sim.month) % q.length], who: g.names[(i + sim.year) % 4] + ', ' + (key === 'mansion' ? 'at home' : JOBS[(i * 3 + sim.year) % JOBS.length]), g }; }
let voiceT = 6;
function voices(dt) {
  voiceT -= dt; if (voiceT > 0 || tickQ.length || sim.totPop < 50) return; voiceT = 7;
  for (let k = 0; k < 40; k++) { const i = (Math.random() * sim.pop.length) | 0; if (sim.pop[i] > 3) { const q = quoteFor(i); say(`“${q.text}” <i>${q.who}, ${sim.where(i)}</i>`); return; } }
}

// ---------- inspect ----------
function inspect(i) {
  const s = sim, b = s.b[i], box = $('#inspect'); if (!b) { box.hidden = true; return; }
  G.inspected = true; const d = B[b], k = s.blk[i], p = s.pop[i];
  let h = `<button class="x">✕</button><div class="where">${s.where(i)}</div><h5>${b === T.HULL && s.pol.hull ? 'Hull House' : d.name}${s.sweat[i] ? ' with a sweatshop inside' : ''}</h5><p>${b === T.HULL && s.pol.hull ? 'A settlement house: kindergarten, night classes, clubs, and a door that is always open.' : d.note || ''}</p>`;
  if (d.cap && p > 0) {
    const q = quoteFor(i);
    h += `<table><tr><td>People living here</td><td>${fmt(p)} (built for ${d.cap})</td></tr><tr><td>People per room</td><td>${(p / d.cap * 1.5).toFixed(1)}</td></tr><tr><td>Most are</td><td>${q.g.name}</td></tr><tr><td>Deaths per 1,000 a year</td><td>${Math.round(s.lotDeathRate(i) * 1000)}</td></tr><tr><td>Sewer / paved street</td><td>${s.sewer[k] ? 'yes' : 'no'} / ${s.paved[k] ? 'yes' : 'no'}</td></tr><tr><td>Fire station in reach</td><td>${s.cFire[i] ? 'yes' : 'no'}</td></tr></table><blockquote>“${q.text}”<cite>${q.who}</cite></blockquote>`;
  } else if (d.jobs) h += `<table><tr><td>Jobs here</td><td>${d.jobs}</td></tr>${d.up ? `<tr><td>Yearly upkeep</td><td>$${d.up}</td></tr>` : ''}</table>`;
  box.innerHTML = h; box.hidden = false; box.querySelector('.x').onclick = () => box.hidden = true;
}

// ---------- pointer and keyboard ----------
const cv = $('#c'), ptrs = new Map(), keys = new Set(); let drag = null, lastKey = '', pinch = 0;
function nearestStreet(o) { const mx = o.tx % 5, my = o.ty % 5, dx = Math.min(mx, 5 - mx), dy = Math.min(my, 5 - my); return dx < dy ? { axis: 1, idx: Math.round(o.tx / 5) } : { axis: 0, idx: Math.round(o.ty / 5) }; }
function target(o) { // what the current tool would act on
  const t = TOOL[G.tool]; if (!o || o.out || G.tool === 'look') return null;
  if (t.per === 'street') return { kind: 'line', v: nearestStreet(o) };
  let lot = o.lot;
  if (lot < 0) { // on a street: snap to the closest lot so trackpad clicks are forgiving
    let best = 9; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const j = sim.lotAt(o.tx + dx, o.ty + dy); if (j < 0) continue; const d = Math.hypot(o.x - (o.tx + dx - 25), o.z - (o.ty + dy - 30)); if (d < best) { best = d; lot = j; } }
    if (lot < 0) return null;
  }
  if (t.per === 'block' || (t.zone != null && G.brush === 'block')) return { kind: 'block', v: sim.blk[lot] };
  return { kind: 'lot', v: lot };
}
function hover(e) { const tg = target(world.pick(e.clientX, e.clientY)); if (!tg) return world.highlight(null); world.highlight(tg.kind, tg.v, !toolCost(TOOL[G.tool]) || sim.money >= toolCost(TOOL[G.tool])); }
function useTool(e, first) {
  if (G.locked) { if (first) fail('Wait for the round to begin.'); return; }
  if (G.paused) { if (first) fail('The clock is stopped. Start it to build.'); return; }
  const o = world.pick(e.clientX, e.clientY), tg = target(o), t = TOOL[G.tool]; if (!tg) return;
  const key = G.tool + tg.kind + (tg.kind === 'line' ? tg.v.axis + '_' + tg.v.idx : tg.v); if (key === lastKey) return; lastKey = key;
  if (G.tool === 'inspect') return inspect(tg.v);
  if (t.zone != null) { let ch = false; if (tg.kind === 'block') { for (let l = 0; l < 16; l++) ch = sim.setZone((tg.v << 4) | l, t.zone) || ch; } else ch = sim.setZone(tg.v, t.zone); if (ch) snd.zone(); return; }
  if (G.tool === 'sewer' || G.tool === 'pave') { const done = G.tool === 'sewer' ? sim.sewer[tg.v] : sim.paved[tg.v]; if (done) return; const ok = G.tool === 'sewer' ? sim.buildSewer(tg.v) : sim.pave(tg.v); ok ? snd.place() : fail('Not enough money.'); return; }
  if (t.per === 'street') { if (!first) return; const msg = sim.addLine(tg.v.axis, tg.v.idx, G.tool === 'el'); msg ? fail(msg) : (snd.place(), snd.coin()); return; }
  if (G.tool === 'doze') { if (!sim.b[tg.v]) return; const msg = sim.bulldoze(tg.v); msg ? (first && fail(msg)) : snd.place(); return; }
  if (t.b) { if (!first && t.b !== T.PARK) return; const msg = sim.place(t.b, tg.v); msg ? (first && fail(msg)) : snd.place(); }
}
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointerdown', e => {
  if (!G.started) return; cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { drag = null; const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); return; }
  const mode = e.button === 2 || e.shiftKey ? 'turn' : (e.button === 1 || G.tool === 'look' || keys.has(' ') || world.street) ? 'pan' : 'tool';
  drag = { mode, x: e.clientX, y: e.clientY }; lastKey = ''; if (mode === 'tool') useTool(e, true); else cv.style.cursor = 'grabbing';
});
cv.addEventListener('pointermove', e => {
  if (!G.started) return; const p = ptrs.get(e.pointerId);
  if (ptrs.size === 2 && p) { // two-finger pan and pinch on touchscreens
    const [a0, b0] = [...ptrs.values()]; const ox = (a0.x + b0.x) / 2, oy = (a0.y + b0.y) / 2; p.x = e.clientX; p.y = e.clientY;
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), k = world.cam.dist * .7 / cv.clientHeight;
    world.pan(-((a.x + b.x) / 2 - ox) * k, -((a.y + b.y) / 2 - oy) * k / Math.sin(world.cam.pitch)); if (pinch) world.zoom(pinch / d); pinch = d; return;
  }
  if (p) { p.x = e.clientX; p.y = e.clientY; }
  if (!drag) return hover(e);
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
  if (world.street) { world.street.yaw -= dx * .005; world.street.pitch = clamp(world.street.pitch + dy * .004, -.5, .9); }
  else if (drag.mode === 'turn') world.rotate(-dx * .006, dy * .005);
  else if (drag.mode === 'pan') { const k = world.cam.dist * .7 / cv.clientHeight; world.pan(-dx * k, -dy * k / Math.sin(world.cam.pitch)); }
  else { useTool(e, false); hover(e); }
});
const up = e => { ptrs.delete(e.pointerId); drag = null; pinch = 0; cv.style.cursor = G.tool === 'look' ? 'grab' : 'crosshair'; };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
cv.addEventListener('wheel', e => { e.preventDefault(); if (e.shiftKey) world.rotate(e.deltaY * .002); else world.zoom(Math.exp(clamp(e.deltaY, -120, 120) * (e.ctrlKey ? .01 : .0022))); }, { passive: false });
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys.add(k);
  if (k === 'Escape') { $('#inspect').hidden = true; if (world.street) toggleStreet(); else setTool('look'); }
  if (k === ' ') { e.preventDefault(); if (!e.repeat && G.started && !G.modal) togglePause(); }
  if (G.modal && !EVENT[G.modal.id].choices && k === 'Enter') closeEvent(undefined);
});
addEventListener('keyup', e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
addEventListener('blur', () => keys.clear());
function handleKeys(dt) {
  const K = k => keys.has(k), f = (K('w') || K('ArrowUp') ? 1 : 0) - (K('s') || K('ArrowDown') ? 1 : 0), r = (K('d') || K('ArrowRight') ? 1 : 0) - (K('a') || K('ArrowLeft') ? 1 : 0);
  if (world.street) { if (f) world.walk(f * dt * 2.2, 0); if (r) world.street.yaw -= r * dt * 1.6; return; }
  const sp = world.cam.dist * .9 * dt; if (f || r) world.pan(r * sp, -f * sp);
  if (K('q')) world.rotate(-dt * 1.4); if (K('e')) world.rotate(dt * 1.4);
  if (K('=') || K('+')) world.zoom(1 - dt * 1.2); if (K('-')) world.zoom(1 + dt * 1.2);
}
$('#cambtns').onclick = e => { const c = e.target.dataset.cam; if (c === 'rl') world.rotate(-.4); if (c === 'rr') world.rotate(.4); if (c === 'zi') world.zoom(.75); if (c === 'zo') world.zoom(1.33); };
function toggleStreet() {
  const b = $('#streetbtn');
  if (world.street) { world.exitStreet(); b.classList.remove('on'); b.textContent = '👁 Street view'; setTool('look'); }
  else { setTool('look'); world.enterStreet(world.cam.x, world.cam.z); b.classList.add('on'); b.textContent = '⬆ Back to the sky'; $('#tip').innerHTML = '<b>Street view.</b> Arrow keys walk and turn. Drag to look around. Take a photograph of what you find.'; }
}
$('#streetbtn').onclick = toggleStreet;
$('#photobtn').onclick = () => {
  const src = world.photo(); snd.shutter(); const fl = el('div'); fl.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:50;opacity:.85;transition:opacity .4s;pointer-events:none'; document.body.append(fl); requestAnimationFrame(() => fl.style.opacity = 0); setTimeout(() => fl.remove(), 500);
  if (G.photos.length >= 6) G.photos.shift();
  G.photos.push({ src, cap: `${MONTHS[sim.month]} ${Math.max(START_YEAR, sim.year)}` }); drawAlbum(); toast('<b>Photograph saved.</b> It will appear in your final report.', '', 2500);
};
function drawAlbum() { $('#album').innerHTML = G.photos.map(p => `<img src="${p.src}" title="${p.cap}">`).join(''); }
function togglePause() { if (G.locked) return; G.paused = !G.paused; toast(G.paused ? '<b>Clock stopped.</b> You cannot build while it is stopped.' : '<b>Clock running.</b>', '', 1800); }
$('#pause').onclick = togglePause;
$('#sound').onclick = () => { snd.setOn(!snd.on); $('#sound').textContent = snd.on ? '🔊' : '🔇'; };
addEventListener('resize', () => world.resize());

// ---------- newspaper events ----------
function openEvent(id) {
  const ev = EVENT[id]; G.modal = { id, t: 0, max: ev.choices && G.mode === 'solo' ? 45 : 0 }; snd.paper(); if (ev.choices) snd.bell();
  $('#mkick').textContent = ev.kicker; $('#mhead').textContent = ev.head;
  const body = typeof ev.body === 'function' ? ev.body(sim) : ev.body; $('#mbody').innerHTML = body.map(p => `<p>${p}</p>`).join('');
  const box = $('#mchoices'); box.innerHTML = ''; box.classList.toggle('one', !ev.choices);
  if (ev.choices) ev.choices.forEach((c, k) => { const b = el('button', '', `<b>${c.label}</b><span>${c.detail}</span>`); b.onclick = () => closeEvent(k); box.append(b); });
  else { const b = el('button', '', `<b>${id === 'fire' ? 'Sound the alarm' : 'Continue'}</b>`); b.onclick = () => closeEvent(undefined); box.append(b); }
  $('#mtimer').hidden = !G.modal.max; $('#mdefault').hidden = !G.modal.max;
  if (G.modal.max) $('#mdefault').textContent = `Decide before the bar runs out, or the ward drifts into: "${ev.choices[ev.def].label}."`;
  $('#modal').hidden = false; $('#inspect').hidden = true;
}
function closeEvent(c) {
  const id = G.modal.id; G.modal = null; $('#modal').hidden = true;
  sim.choose(id, c);
  if (id === 'start') say('The first trains of the year are on their way. Start zoning.', 'event');
}
function tickModal(dt) {
  const m = G.modal; if (!m.max) return; m.t += dt; $('#mtimer div').style.transform = `scaleX(${clamp(1 - m.t / m.max, 0, 1)})`;
  if (m.t >= m.max) closeEvent(EVENT[m.id].def);
}

// ---------- teacher-led rounds ----------
function roundCard(html) { const c = $('#roundcard'); c.innerHTML = html; c.hidden = false; return c; }
function showRoundStart() {
  const r = ROUNDS[G.round]; G.locked = true; G.running = false;
  const c = roundCard(`<div class="yrs">Round ${G.round + 1} of ${ROUNDS.length} &nbsp; ${r.from} to ${r.to}</div><h2>${r.name}</h2><p>${r.intro}</p><button class="big">Begin round ${G.round + 1}</button><p class="fine">Wait for your teacher before you press the button.</p>`);
  c.querySelector('button').onclick = () => { c.hidden = true; G.locked = false; G.running = true; snd.bell(); };
}
function showRoundEnd() {
  const r = ROUNDS[G.round]; G.locked = true; G.running = false; world.highlight(null); snd.bell();
  const c = roundCard(`<div class="yrs">End of round ${G.round + 1} &nbsp; December ${r.to}</div><h2>Hands off. Look at your ward.</h2><ul>${r.ask.map(q => `<li>${q}</li>`).join('')}</ul><p class="fine">You can still move the camera and change the map view while you talk.</p><button class="big ghost">Go on to round ${G.round + 2}</button>`);
  c.querySelector('button').onclick = () => { G.round++; showRoundStart(); };
}

// ---------- clock ----------
function month() {
  sim.step(); world.updateCemetery();
  if (sim.month === 0) world.yearly();
  if (sim.month === 11) { save(); if (sim.over) return finish(); if (G.mode === 'teacher' && sim.year === ROUNDS[G.round].to) showRoundEnd(); }
}
function drainFx() {
  for (const f of sim.fx) {
    if (f.k === 'train') { world.runTrain(); snd.whistle(); say(`A train pulls into Union Depot: ${fmt(f.n)} newcomers this season, most of them ${GROUPS[f.g].name}.`, 'arrive'); }
    else if (f.k === 'lines') world.rebuildLines();
    else if (f.k === 'greatfire') { G.gf = true; world.nightT = 1; world.shake = 3; world.flyTo(f.lot, 32); $('#banner').hidden = false; snd.fire(1); snd.bell(); if (world.street) toggleStreet(); }
    else if (f.k === 'fire') { snd.bell(); const t = toast(`<b>Fire!</b> ${sim.where(f.lot)}. <button>Show me</button>`, 'bad', 7000); t.querySelector('button').onclick = () => world.flyTo(f.lot, 26); snd.fire(.5); }
    else if (f.k === 'epidemic') { toast(`<b>${f.name}</b> is spreading through the ward.`, 'bad', 6000); }
  }
  sim.fx.length = 0;
  for (const n of sim.news) { say(n.text, n.kind === 'info' ? '' : n.kind); if (n.kind === 'event') toast(n.text, '', 7000); if (n.kind === 'bad' && !/^Fire on/.test(n.text)) toast(n.text, 'bad', 7000); }
  sim.news.length = 0;
}
function fireEnded() { snd.fire(0); if (G.gf) { G.gf = false; world.nightT = 0; $('#banner').hidden = true; world.setEra(sim.year, true); } }

let last = performance.now(), hudT = 0;
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (G.started) {
    handleKeys(dt);
    if (sim.burning.length) { G.fireAcc += dt; if (G.fireAcc > .26 && !G.modal) { G.fireAcc = 0; sim.fireStep(); if (!sim.burning.length) fireEnded(); } }
    if (G.running && !G.paused && !G.modal && !sim.greatFire && !sim.over) {
      G.acc += dt * G.speed; const md = G.pace / 12; let n = 0;
      while (G.acc >= md && n++ < 6 && !sim.pending.length && G.running) { G.acc -= md; month(); }
    }
    if (!G.modal && sim.pending.length && $('#report').hidden) openEvent(sim.pending.shift());
    drainFx(); pumpTicker(dt); voices(dt);
    if (G.modal) tickModal(dt);
    if ((hudT += dt) > .25) { hudT = 0; updateHud(); }
  }
  world.update(dt);
  requestAnimationFrame(frame);
}

// ---------- save, start, finish ----------
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, sim: sim.save(), mode: G.mode, pace: G.pace, name: G.name, round: G.round, photos: G.photos })); } catch (e) { /* storage full or blocked: keep playing */ } }
function loadSave() { try { const o = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return o && o.v === 1 && !o.sim.over ? o : null; } catch (e) { return null; } }
function begin(saved) {
  G.name = $('#pname').value.trim(); G.mode = document.querySelector('input[name=mode]:checked').value; G.pace = +document.querySelector('input[name=pace]:checked').value;
  snd.setOn($('#sndopt').checked); $('#sound').textContent = snd.on ? '🔊' : '🔇';
  if (saved) { sim.load(saved.sim); G.mode = saved.mode; G.pace = saved.pace; G.name = saved.name; G.photos = saved.photos || []; world.syncAll(); drawAlbum(); G.round = Math.max(0, ROUNDS.findIndex(r => sim.year + (sim.month === 11 ? 1 : 0) <= r.to)); }
  $('#start').hidden = true; $('#hud').hidden = false; G.started = true; updateHud();
  if (!saved) for (let z = 1; z < 4; z++) Z0[z] = count(sim, z);
  if (!saved && +params.get('skip') > START_YEAR) skipTo(+params.get('skip'));
  G.acc = G.pace / 12; // first month right away
  if (G.mode === 'teacher') showRoundStart(); else { G.locked = false; G.running = true; }
}
// Jump ahead silently (for teachers previewing a later era): add ?skip=1871 to the address.
function skipTo(year) {
  let guard = 0;
  while (!sim.over && (sim.year < year - 1 || sim.month < 11) && guard++ < 600) {
    sim.step(); while (sim.burning.length) sim.fireStep();
    while (sim.pending.length) { const id = sim.pending.shift(); sim.choose(id, EVENT[id].choices ? EVENT[id].def : undefined); }
  }
  sim.fx.length = 0; sim.news.length = 0; world.syncAll(); G.round = Math.max(0, ROUNDS.findIndex(r => year <= r.to));
}
function finish() {
  G.running = false; G.locked = true; try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
  if (world.street) toggleStreet(); $('#modal').hidden = true; $('#roundcard').hidden = true; snd.bell();
  buildReport($('#report'), sim, G);
}
window.__finish = finish;

buildTools(); buildOverlays(); buildMeters();
{ const tt = $('#tticks'), span = (END_YEAR - START_YEAR + 1) * 12; for (const e of EVENTS) if (e.year) { const s = el('span'); s.style.left = ((e.year - START_YEAR) * 12 + e.month) / span * 100 + '%'; s.title = e.year; tt.append(s); } }
const saved = loadSave(); if (saved) { $('#resume').hidden = false; $('#resume').textContent = `Continue saved game (${saved.sim.year}${saved.name ? ', ' + saved.name : ''})`; $('#resume').onclick = () => begin(saved); }
$('#go').onclick = () => begin(null);
world.cam.yaw = -.5; requestAnimationFrame(frame);
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
// slow turn of the camera behind the start screen
(function idle() { if (!G.started) { world.cam.yaw += .0012; requestAnimationFrame(idle); } })();
