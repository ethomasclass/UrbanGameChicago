// The Urban Game: Chicago. Round flow and the (deliberately small) interface.
// Every round: read the history, place what the list requires, see what happened.
import { Sim } from './sim.js';
import { World } from './world.js';
import { Sound } from './audio.js';
import { buildReport } from './report.js';
import { T, B, GROUPS, ROUNDS, QUOTES, JOBS, FAMILIES, CHARACTERS, ADVICE, howTo, itemOf } from './data.js';
import { portrait } from './portraits.js';

const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const fmt = n => Math.round(n).toLocaleString('en-US');
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const params = new URLSearchParams(location.search);
const SAVE_KEY = 'urbangame-chicago-v2';

const sim = new Sim();
const world = new World($('#c'), sim, { low: params.has('lowgfx') });
const snd = new Sound();
const G = { phase: 'start', name: '', timed: true, clock: 1.6, marks: {}, active: null, tLeft: 0, tMax: 0, photos: [], before: null, fireAcc: 0, wait: 0, then: null };
window.__game = { sim, world, G };

// ---------- top bar ----------
const METERS = [['pop', 'People'], ['health', 'Health'], ['happy', 'Happiness'], ['work', 'Have work']], M = {};
for (const [id, label] of METERS) { const d = el('div', 'meter', `<label>${label}</label><b></b><i><u></u></i>`); M[id] = { el: d, b: d.querySelector('b'), u: d.querySelector('u') }; $('#meters').append(d); }
for (let r = 0; r < ROUNDS.length; r++) $('#dots').append(el('i'));
function setMeter(id, text, frac, level) { const m = M[id]; m.b.textContent = text; m.u.style.width = clamp(frac, 0, 1) * 100 + '%'; m.u.style.background = level === 2 ? '#e0563c' : level === 1 ? '#e6b93a' : '#6fae58'; m.el.classList.toggle('bad', level === 2); m.el.classList.toggle('warn', level === 1); }
const lvl = (v, bad, warn) => v < bad ? 2 : v < warn ? 1 : 0;
const built = () => { let n = 0; for (let i = 0; i < sim.b.length; i++) if (sim.b[i] && sim.b[i] !== T.RUBBLE && sim.b[i] !== T.SHANTY) n++; return n; };
function snapshot() { return { pop: sim.totPop, health: sim.healthAvg, happy: sim.happy, work: sim.emp * 100 }; }
function updateHud() {
  const s = sim, R = ROUNDS[Math.max(0, s.round)], has = s.totPop > 0 && s.cap > 0;
  $('#year').textContent = R.year; $('#rname').textContent = `Round ${Math.max(0, s.round) + 1} of ${ROUNDS.length}: ${R.name}`;
  [...$('#dots').children].forEach((d, k) => { d.className = k < s.round ? 'done' : k === s.round ? 'now' : ''; });
  setMeter('pop', fmt(s.totPop), s.totPop / 3600, 0);
  setMeter('health', has ? Math.round(s.healthAvg) : 'n/a', s.healthAvg / 100, has ? lvl(s.healthAvg, 55, 70) : 0);
  setMeter('happy', has ? Math.round(s.happy) : 'n/a', s.happy / 100, has ? lvl(s.happy, 40, 55) : 0);
  setMeter('work', has ? Math.round(s.emp * 100) + '%' : 'n/a', s.emp, has ? lvl(s.emp, .65, .85) : 0);
  $('#clock').textContent = G.phase === 'build' && G.timed ? Math.floor(Math.max(0, G.tLeft) / 60) + ':' + String(Math.floor(Math.max(0, G.tLeft) % 60)).padStart(2, '0') : '';
  const t = $('#timer'); t.hidden = !(G.phase === 'build' && G.timed); if (!t.hidden) { t.firstChild.style.transform = `scaleX(${clamp(G.tLeft / G.tMax, 0, 1)})`; t.classList.toggle('low', G.tLeft < 15); }
  if (G.phase === 'fire') $('#banner').innerHTML = `THE GREAT FIRE<small>${s.burning.length} buildings burning. The wind is from the southwest.</small>`;
  snd.city(clamp(s.totPop / 3500, 0, 1)); world.setCity(built());
}
let toastT = 0; function toast(msg, ms = 2200) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, ms); }

// ---------- the build list ----------
// One thing at a time: the card shows only what to place now, and who has an opinion about it.
function drawList() {
  const it = sim.todo.find(t => t.left > 0), idx = sim.todo.indexOf(it), k = it ? it.k : null, changed = k !== G.shown; G.active = k; if (!it) return;
  $('#lstep').textContent = `Step ${idx + 1} of ${sim.todo.length}`;
  const d = itemOf(k), pips = it.n > 1 ? `<div class="pips">${Array.from({ length: it.n }, (_, q) => `<i class="${q < it.n - it.left ? 'd' : ''}"></i>`).join('')}</div>` : '';
  if (changed) { $('#lnow').outerHTML = `<div id="lnow"><em>${d.icon}</em><div><h3>${d.name}</h3><small></small>${pips}</div></div>`; }
  $('#lnow small').textContent = it.n > 1 ? `${it.left} of ${it.n} left to place` : 'Just one. Choose well.'; if (!changed && pips) $('#lnow .pips').outerHTML = pips;
  if (changed) {
    const who = (ADVICE[k] || []).filter(v => v.from <= sim.round).slice(0, 2);
    $('#advice').innerHTML = who.map(v => `<div class="voice"><img src="${portrait(v.who)}" alt=""><div><b>${CHARACTERS[v.who].name} <span>${CHARACTERS[v.who].role}</span></b><q>${v.say}</q></div></div>`).join('');
    $('#tip').textContent = howTo(k); const more = sim.todo.length - idx - 1; $('#lnext').textContent = more ? `${more} more thing${more > 1 ? 's' : ''} after this.` : 'This is the last thing this round.';
    if (G.shown != null) snd.zone();
  }
  G.shown = k;
}
function nextItem() { drawList(); }
$('#undo').onclick = undo;
function undo() { if (G.phase !== 'build') return; if (sim.undo()) { snd.zone(); remark(); drawList(); } else toast('Nothing to undo this round.'); }

// ---------- tutorial: five short pointers the first time through ----------
const COACH = [
  { at: 'c-mid', text: '<b>Welcome to the West Side.</b> Right now it is empty prairie. The river, and downtown Chicago, are to the east. <b>Drag</b> to move the map and <b>scroll</b> to zoom. Try it.' },
  { at: 'c-list', text: 'This card shows <b>one thing to build at a time</b>, and who has an opinion about where it goes. They will not agree. That is your problem now.' },
  { at: 'c-list', text: '<b>Click any empty lot</b> to build your first cottage.', wait: () => sim.undoStack.length > 0 },
  { at: 'c-top', text: 'Every placement moves these. People need <b>work they can walk to</b>, <b>clean water</b>, and <b>air they can breathe</b>. You will not manage all three for everyone.' },
  { at: 'c-mid', text: '<b>Point at a home</b> to meet who lives there. <b>Undo</b> takes back your last placement. When the list is done, you will see what happened to your people.' },
];
function coach(n) {
  const c = $('#coach'); if (n == null || n >= COACH.length) { G.coach = null; c.hidden = true; return; }
  G.coach = n; const st = COACH[n]; c.className = st.at; c.hidden = false;
  c.innerHTML = `${st.text}<div class="row"><button class="skip">Skip the tour</button>${st.wait ? '<span></span>' : `<button class="go">${n === COACH.length - 1 ? 'Got it' : 'Next'}</button>`}</div>`;
  c.querySelector('.skip').onclick = () => coach(null); const go = c.querySelector('.go'); if (go) go.onclick = () => coach(n + 1);
}

// what the active item acts on at this spot: a lot, a block, or a street
function target(o) {
  const k = G.active; if (k == null || !o || o.out) return null;
  if (k === 'line' || k === 'el') { const mx = o.tx % 5, my = o.ty % 5, dx = Math.min(mx, 5 - mx), dy = Math.min(my, 5 - my); return { kind: 'line', v: dx < dy ? { axis: 1, idx: Math.round(o.tx / 5) } : { axis: 0, idx: Math.round(o.ty / 5) } }; }
  let lot = o.lot;
  if (lot < 0) { let best = 9; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const j = sim.lotAt(o.tx + dx, o.ty + dy); if (j < 0) continue; const d = Math.hypot(o.x - (sim.tx[j] - 12.5), o.z - (sim.ty[j] - 10)); if (d < best) { best = d; lot = j; } } if (lot < 0) return null; }
  return k === 'sewer' ? { kind: 'block', v: sim.blk[lot] } : { kind: 'lot', v: lot };
}
function click(e) {
  if (G.phase !== 'build' || world.street) return;
  const tg = target(world.pick(e.clientX, e.clientY)); if (!tg) return;
  const k = G.active, why = sim.place(k, tg.v);
  if (why) { toast(why); snd.err(); return; }
  snd.place(); remark();
  nextItem(); if (!sim.left()) finishBuild(false);
}

// ---------- hover: highlight where it would go, and say who lives there ----------
function quoteFor(i) {
  const s = sim, b = s.b[i], crowd = s.crowd, o = [];
  if (b === T.SHANTY) o.push('shanty'); if (crowd > 1.9) o.push('crowd3'); else if (crowd > 1.35) o.push('crowd2');
  if (s.jobLot[i] < .6) o.push('jobless'); if (!s.sewer[s.blk[i]] && s.round >= 2) o.push('nosewer'); if (s.poll[i] > .9) o.push('smoke'); if (s.cov.el[i]) o.push('elshadow');
  if (!o.length) { if (s.cov.hull[i]) o.push('hull'); if (s.cov.school[i]) o.push('school'); if (s.cov.park[i]) o.push('park'); o.push('good'); }
  const q = QUOTES[o[(i + s.round) % o.length]], g = GROUPS[s.g[i]];
  return `<i>“${q[(i + s.round) % q.length]}”</i>${g.names[i % 4]}, ${JOBS[(i * 3 + s.round) % JOBS.length]}`;
}
function hover(e) {
  const o = world.pick(e.clientX, e.clientY), box = $('#hover');
  if (G.phase === 'build' && !world.street) { const tg = target(o); if (tg) world.highlight(tg.kind, tg.v, !sim.valid(G.active, tg.v)); else world.highlight(null); } else world.highlight(null);
  const i = o && !o.out ? o.lot : -1, b = i >= 0 ? sim.b[i] : 0;
  if (!b || world.street || G.phase === 'brief') { box.hidden = true; return; }
  const d = B[b], p = sim.pop[i];
  box.innerHTML = `<b>${d.name}</b>` + (p > 0 ? `${fmt(p)} people in a home built for ${d.cap}. Mostly ${GROUPS[sim.g[i]].name}.<br>Health ${Math.round(sim.health[i])} of 100. ${sim.sewer[sim.blk[i]] ? 'Has sewers.' : 'No sewer.'} ${sim.jobLot[i] > 0 ? '' : 'No work in reach.'}${quoteFor(i)}` : d.note || '');
  box.hidden = false; box.style.left = Math.min(innerWidth - 280, e.clientX + 16) + 'px'; box.style.top = Math.min(innerHeight - 150, e.clientY + 16) + 'px';
}

// ---------- pointer and keys: click builds, drag moves the map ----------
const cv = $('#c'), ptrs = new Map(), keys = new Set(); let drag = null, pinch = 0;
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointerdown', e => {
  if (G.phase === 'start') return; cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { drag = null; const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); return; }
  drag = { turn: e.button === 2 || e.shiftKey, x: e.clientX, y: e.clientY, moved: 0, btn: e.button };
});
cv.addEventListener('pointermove', e => {
  if (G.phase === 'start') return; const p = ptrs.get(e.pointerId);
  if (ptrs.size === 2 && p) {
    const [a0, b0] = [...ptrs.values()], ox = (a0.x + b0.x) / 2, oy = (a0.y + b0.y) / 2; p.x = e.clientX; p.y = e.clientY;
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), k = world.cam.dist * .7 / cv.clientHeight;
    world.pan(-((a.x + b.x) / 2 - ox) * k, -((a.y + b.y) / 2 - oy) * k / Math.sin(world.cam.pitch)); if (pinch) world.zoom(pinch / d); pinch = d; return;
  }
  if (p) { p.x = e.clientX; p.y = e.clientY; }
  if (!drag) return hover(e);
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
  if (drag.moved < 6) return; $('#hover').hidden = true; cv.style.cursor = 'grabbing';
  if (world.street) { world.street.yaw -= dx * .005; world.street.pitch = clamp(world.street.pitch + dy * .004, -.5, .9); }
  else if (drag.turn) world.rotate(-dx * .006, dy * .005);
  else { const k = world.cam.dist * .7 / cv.clientHeight; world.pan(-dx * k, -dy * k / Math.sin(world.cam.pitch)); }
});
const up = e => { if (drag && drag.moved < 6 && drag.btn === 0 && e.type === 'pointerup') click(e); ptrs.delete(e.pointerId); drag = null; pinch = 0; cv.style.cursor = ''; };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
cv.addEventListener('pointerleave', () => { $('#hover').hidden = true; world.highlight(null); });
cv.addEventListener('wheel', e => { e.preventDefault(); if (e.shiftKey) world.rotate(e.deltaY * .002); else world.zoom(Math.exp(clamp(e.deltaY, -120, 120) * (e.ctrlKey ? .01 : .0022))); }, { passive: false });
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys.add(k);
  if (k === 'Escape' && world.street) toggleStreet();
  if (k === 'z') undo();
  if (k === 'Enter') { const b = document.querySelector('#card:not([hidden]) .big'); if (b) b.click(); }
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
const LEGEND = { health: '<div class="bar"></div><div class="lr"><span>Healthy</span><span>Sickly</span></div>', groups: GROUPS.map(g => `<span class="sw"><i style="background:${g.color}"></i>${g.short}</span>`).join('') };
$('#mapview').onclick = e => { const o = e.target.dataset.o; if (!o) return; world.setOverlay(o); document.querySelectorAll('#mapview button').forEach(b => b.classList.toggle('on', b.dataset.o === o)); $('#legend').innerHTML = LEGEND[o] || ''; };
function toggleStreet() {
  const b = $('#streetbtn');
  if (world.street) { world.exitStreet(); b.classList.remove('on'); b.textContent = '👁 Walk the streets'; $('#photobtn').hidden = true; }
  else { world.enterStreet(world.cam.x, world.cam.z); world.highlight(null); b.classList.add('on'); b.textContent = '⬆ Back to the sky'; $('#photobtn').hidden = false; toast('Arrow keys walk and turn. Drag to look around.', 3500); }
}
$('#streetbtn').onclick = toggleStreet;
$('#photobtn').onclick = () => {
  const src = world.photo(); snd.shutter(); const fl = el('div'); fl.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:50;opacity:.85;transition:opacity .4s;pointer-events:none'; document.body.append(fl); requestAnimationFrame(() => fl.style.opacity = 0); setTimeout(() => fl.remove(), 500);
  if (G.photos.length >= 6) G.photos.shift(); G.photos.push({ src, cap: String(sim.year) }); toast('Photograph saved for your final report.');
};
$('#sound').onclick = () => { snd.setOn(!snd.on); $('#sound').textContent = snd.on ? '🔊' : '🔇'; };
addEventListener('resize', () => world.resize());

// ---------- the round: history, build, what happened ----------
function card(html, side) { $('#hover').hidden = true; const c = $('#card'); c.className = side ? 'side' : ''; c.innerHTML = `<article class="paper">${html}</article>`; c.hidden = false; return c; }
function showBrief(r) {
  G.phase = 'brief'; sim.startRound(r); const R = ROUNDS[r]; $('#list').hidden = true; $('#hover').hidden = true;
  remark();
  if (sim.b.includes(T.DEPOT)) { world.runTrain(); snd.whistle(); } snd.paper(); updateHud();
  const need = R.build.map(x => `<li><b>${x.n}</b>${itemOf(x.k).icon} ${itemOf(x.k).name}${x.n > 1 && !/s$/.test(itemOf(x.k).name) ? 's' : ''}</li>`).join('');
  const c = card(`<div class="yrs">Round ${r + 1} of ${ROUNDS.length}</div><h2>${R.year}: ${R.name}</h2><p>${R.story}</p><p class="scene"><b>On the street:</b> ${R.scene}</p><h4>You must build</h4><ul class="need">${need}</ul><button class="big">Start building</button>`);
  c.querySelector('.big').onclick = startBuild;
}
function startBuild() {
  $('#card').hidden = true; G.phase = 'build'; G.before = snapshot(); G.dtBefore = world.dtN; G.shown = null; drawList(); $('#list').hidden = false;
  if (G.tour && sim.round === 0) { G.tour = false; coach(0); }
  G.tMax = G.tLeft = (30 + 6 * sim.left()) * G.clock; snd.bell(); updateHud();
}
function finishBuild(timedOut) {
  G.phase = 'wait'; $('#list').hidden = true; world.highlight(null); coach(null);
  if (timedOut) { toast('Time is up. The builders finished the job wherever they liked.', 4000); remark(); }
  if (ROUNDS[sim.round].fire) { G.wait = 1.6; G.then = startFire; } else { G.wait = .7; G.then = showResult; }
}
function startFire() {
  G.phase = 'fire'; if (world.street) toggleStreet(); G.camWas = [world.cam.tx, world.cam.tz, world.cam.td]; sim.startGreatFire(); world.nightT = 1; world.shake = 3; world.flyTo(sim.barn, 34); $('#banner').hidden = false; snd.fire(1); snd.bell(); updateHud();
}
function showResult() {
  G.phase = 'result'; const r = sim.round, R = ROUNDS[r], out = sim.endRound(), now = snapshot(), last = r === ROUNDS.length - 1;
  world.yearly(); world.setEra(R.year, !!R.fire); remark(); save(); updateHud(); snd.paper();
  const fam = (out.family || []).map(f => `<div class="fam"><img src="${portrait(FAMILIES.find(F => F.id === f.id).face)}" alt=""><div><h4>${f.name}</h4><p>${f.text}</p></div></div>`).join('');
  world.setCity(built()); const grew = world.dtN - (G.dtBefore || 0); if (grew > 0) out.splice(1, 0, { t: `Across the river, downtown Chicago put up ${grew} new buildings, raised on your ward's lumber, labor, and rents.` });
  const d = (k, label, suf = '') => { const a = G.before[k], b = now[k], df = Math.round(b - a); return `<div>${label}<b>${fmt(b)}${suf}${df ? `<u class="${df > 0 ? 'up' : 'dn'}">${df > 0 ? '▲' : '▼'}${Math.abs(df)}</u>` : ''}</b></div>`; };
  const c = card(`<div class="yrs">${R.year} &nbsp; What happened</div><h2>${R.name}</h2><ul class="what">${out.map(o => `<li class="${o.bad ? 'bad' : ''}">${o.t}</li>`).join('')}</ul><div class="deltas">${d('pop', 'People')}${d('health', 'Health')}${d('happy', 'Happiness')}${d('work', 'Have work', '%')}</div>${fam}<p class="askq"><b>Talk about it:</b> ${R.ask}</p><button class="big">${last ? 'See your final report' : `Go on to ${ROUNDS[r + 1].year}`}</button>`, true);
  c.querySelector('.big').onclick = () => { if (last) finish(); else showBrief(r + 1); };
}

let last = performance.now(), hudT = 0;
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (G.phase !== 'start') {
    handleKeys(dt);
    if (G.coach != null && COACH[G.coach].wait && COACH[G.coach].wait()) coach(G.coach + 1);
    if (G.phase === 'build' && G.timed && G.coach == null && (G.tLeft -= dt) <= 0) { sim.autoFinish(); snd.err(); finishBuild(true); }
    if (G.phase === 'wait' && (G.wait -= dt) <= 0) { const f = G.then; G.then = null; f(); }
    if (G.phase === 'fire') {
      if ((G.fireAcc += dt) > .24) { G.fireAcc = 0; sim.fireStep(); }
      if (!sim.burning.length) { snd.fire(0); world.nightT = 0; $('#banner').hidden = true; [world.cam.tx, world.cam.tz, world.cam.td] = G.camWas; G.phase = 'wait'; G.wait = 2; G.then = showResult; }
    }
    if (sim.linesDirty) { sim.linesDirty = false; world.rebuildLines(); }
    if ((hudT += dt) > .2) { hudT = 0; updateHud(); }
  }
  world.update(dt);
  requestAnimationFrame(frame);
}

// ---------- save, start, finish ----------
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 2, sim: sim.save(), name: G.name, timed: G.timed, photos: G.photos })); } catch (e) { /* storage blocked or full: keep playing */ } }
function loadSave() { try { const o = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return o && o.v === 2 && o.sim.round < ROUNDS.length - 1 ? o : null; } catch (e) { return null; } }
// name tags on the map: landmark buildings, and the homes of the two families students follow
function remark() {
  const want = {};
  for (let i = 0; i < sim.b.length; i++) { const L = B[sim.b[i]] && B[sim.b[i]].label; if (L) want[L] = i; }
  for (const F of FAMILIES) if (sim.fam[F.id] != null) want[F.name] = sim.fam[F.id];
  for (const n in want) if (G.marks[n] !== want[n]) { G.marks[n] = want[n]; world.mark(want[n], n, FAMILIES.some(F => F.name === n)); }
}
function begin(saved) {
  G.name = $('#pname').value.trim(); G.clock = +document.querySelector('input[name=clock]:checked').value; G.timed = G.clock > 0; snd.setOn($('#sndopt').checked); $('#sound').textContent = snd.on ? '🔊' : '🔇';
  if (saved) { sim.load(saved.sim); G.name = saved.name; G.photos = saved.photos || []; }
  const skip = saved ? 0 : Math.min(ROUNDS.length - 1, +params.get('skip') || 0); // ?skip=5 lets the builders play the first five rounds
  for (let r = 0; r < skip; r++) { sim.startRound(r); sim.autoFinish(); if (ROUNDS[r].fire) { sim.startGreatFire(); while (sim.burning.length) sim.fireStep(); } sim.endRound(); }
  if (saved || skip) { world.syncAll(); world.setEra(sim.year, false); world.setCity(built(), true); remark(); }
  G.tour = $('#tutopt').checked && !saved && !skip;
  $('#start').hidden = true; $('#hud').hidden = false; showBrief(sim.round + 1);
}
function finish() {
  G.phase = 'done'; try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
  if (world.street) toggleStreet(); $('#card').hidden = true; snd.bell(); buildReport($('#report'), sim, G);
}

const saved = loadSave(); if (saved) { $('#resume').hidden = false; $('#resume').textContent = `Continue saved game (${ROUNDS[saved.sim.round + 1].year}${saved.name ? ', ' + saved.name : ''})`; $('#resume').onclick = () => begin(saved); }
$('#go').onclick = () => begin(null);
requestAnimationFrame(frame);
(function idle() { if (G.phase === 'start') { world.cam.yaw += .0012; requestAnimationFrame(idle); } })();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
