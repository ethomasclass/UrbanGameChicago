// The Urban Game: Chicago. three.js renderer. Everything is instanced or GPU-animated so it runs on Chromebooks.
import * as THREE from '../vendor/three.module.min.js';
import { BW, BH, TW, TH, NB, NL, T, B, GROUPS, HOOD_NAMES, NS_STREETS, EW_STREETS } from './data.js';
import { lotId } from './sim.js';

const HX = TW / 2, HZ = TH / 2;
const wx = tx => tx - HX + 0.5, wz = ty => ty - HZ + 0.5;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const hash = i => { let x = Math.imul(i + 1, 0x9E3779B1); x ^= x >>> 15; x = Math.imul(x, 0x85EBCA6B); x ^= x >>> 13; return ((x >>> 0) % 10000) / 10000; };
const C = h => new THREE.Color(h);
const _c = new THREE.Color(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);

// ---------- tiny geometry builder: colored boxes and gable roofs merged into one mesh ----------
class GB {
  constructor() { this.p = []; this.n = []; this.c = []; this.u = []; this.i = []; this.j = []; }
  // top = true puts the face in the roof material group; uv is then four [u, v] pairs
  quad(a, b, c, d, n, col, uv, top) {
    const k = this.p.length / 3;
    for (const v of [a, b, c, d]) { this.p.push(v[0], v[1], v[2]); this.n.push(n[0], n[1], n[2]); this.c.push(col.r, col.g, col.b); }
    if (top) for (const q of uv) this.u.push(q[0], q[1]);
    else if (uv) this.u.push(0, 0, uv[0], 0, uv[0], uv[1], 0, uv[1]); else this.u.push(.03, .03, .03, .03, .03, .03, .03, .03);
    (top ? this.j : this.i).push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  // box sitting on y0. win = [windows across x faces, across z faces, floors]
  box(x, y0, z, sx, h, sz, color, win) {
    const col = C(color), x0 = x - sx / 2, x1 = x + sx / 2, z0 = z - sz / 2, z1 = z + sz / 2, y1 = y0 + h, S = 5;
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], col, win && [win[0], win[2]]);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], col, win && [win[0], win[2]]);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], col, win && [win[1], win[2]]);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], col, win && [win[1], win[2]]);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], col, [[x0 * S, z1 * S], [x1 * S, z1 * S], [x1 * S, z0 * S], [x0 * S, z0 * S]], true);
    return this;
  }
  // gable roof, ridge running along 'z' or 'x'
  roof(x, y0, z, sx, h, sz, color, axis) {
    const col = C(color), x0 = x - sx / 2, x1 = x + sx / 2, z0 = z - sz / 2, z1 = z + sz / 2, y1 = y0 + h, S = 5;
    if (axis === 'z') {
      const a = Math.atan2(h, sx / 2), nx = Math.sin(a), ny = Math.cos(a), L = Math.hypot(h, sx / 2) * S, uv = [[z1 * S, 0], [z0 * S, 0], [z0 * S, L], [z1 * S, L]];
      this.quad([x1, y0, z1], [x1, y0, z0], [x, y1, z0], [x, y1, z1], [nx, ny, 0], col, uv, true);
      this.quad([x0, y0, z0], [x0, y0, z1], [x, y1, z1], [x, y1, z0], [-nx, ny, 0], col, uv, true);
      this.quad([x0, y0, z1], [x1, y0, z1], [x, y1, z1], [x, y1, z1], [0, 0, 1], col);
      this.quad([x1, y0, z0], [x0, y0, z0], [x, y1, z0], [x, y1, z0], [0, 0, -1], col);
    } else {
      const a = Math.atan2(h, sz / 2), nz = Math.sin(a), ny = Math.cos(a), L = Math.hypot(h, sz / 2) * S, uv = [[x0 * S, 0], [x1 * S, 0], [x1 * S, L], [x0 * S, L]];
      this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z], [x0, y1, z], [0, ny, nz], col, uv, true);
      this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z], [x1, y1, z], [0, ny, -nz], col, uv, true);
      this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z], [x1, y1, z], [1, 0, 0], col);
      this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z], [x0, y1, z], [-1, 0, 0], col);
    }
    return this;
  }
  tree(x, z, s = 1) { this.box(x, 0, z, .04 * s, .14 * s, .04 * s, '#5a4632'); this.box(x, .12 * s, z, .2 * s, .16 * s, .2 * s, '#3f6f3a'); this.box(x, .26 * s, z, .13 * s, .1 * s, .13 * s, '#4a7d42'); return this; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setIndex(this.i.concat(this.j)); g.addGroup(0, this.i.length, 0); g.addGroup(this.i.length, this.j.length, 1);
    return g;
  }
}

const W = '#f4f0e8', ROOF = '#8a7d70', TRIM = '#6a645e', FLAT = '#b9b1a4';
const MODELS = {
  [T.SHANTY]: [
    g => g.box(-.08, 0, 0, .42, .2, .38, '#9a8565').box(-.08, .2, 0, .5, .03, .46, '#5b5046').box(.24, 0, .08, .2, .14, .3, '#86745a').box(.24, .14, .08, .24, .02, .34, '#4f463e'),
    g => g.box(.05, 0, -.1, .5, .18, .34, '#8c7a5e').box(.05, .18, -.1, .58, .03, .42, '#6a5d4c').box(-.22, 0, .22, .26, .22, .26, '#a08a68').box(-.22, .22, .22, .32, .03, .32, '#4f463e').box(.2, 0, .3, .12, .1, .12, '#6b4a2f'),
  ],
  [T.COTTAGE]: [
    g => g.box(0, 0, 0, .54, .28, .72, W, [1, 2, 1]).roof(0, .28, 0, .62, .22, .78, ROOF, 'z').box(.12, .34, -.18, .08, .2, .08, '#8a5444').box(0, 0, .4, .2, .06, .08, '#8d7c64'),
    g => g.box(.06, 0, -.06, .5, .28, .6, W, [1, 2, 1]).roof(.06, .28, -.06, .58, .2, .66, ROOF, 'z').box(-.2, 0, .2, .34, .26, .34, '#ebe5d6', [1, 1, 1]).roof(-.2, .26, .2, .4, .14, .4, ROOF, 'x').box(.16, 0, .3, .26, .04, .16, '#8d7c64').box(.16, .22, .3, .3, .02, .2, '#7a6d62').box(.2, .34, -.2, .08, .18, .08, '#8a5444'),
    g => g.box(0, 0, -.02, .7, .26, .5, W, [2, 1, 1]).roof(0, .26, -.02, .76, .24, .58, ROOF, 'x').box(0, .3, .12, .18, .14, .14, '#ebe5d6').roof(0, .44, .12, .22, .08, .18, ROOF, 'z').box(-.24, .36, -.1, .08, .2, .08, '#8a5444').box(0, 0, .3, .5, .05, .12, '#8d7c64').box(.34, 0, .36, .02, .14, .22, '#e8e2d2').box(-.34, 0, .36, .02, .14, .22, '#e8e2d2'),
  ],
  [T.REAR]: g => g.box(0, 0, .2, .46, .26, .44, W, [1, 1, 1]).roof(0, .26, .2, .54, .18, .5, ROOF, 'z').box(0, 0, -.26, .52, .44, .3, '#e2dccd', [2, 1, 2]).roof(0, .44, -.26, .58, .14, .36, ROOF, 'x').box(.2, .5, -.26, .06, .16, .06, '#8a5444').box(-.3, 0, .0, .1, .16, .12, '#7b6a54'),
  [T.WTEN]: [
    g => g.box(0, 0, .02, .64, .84, .8, W, [3, 4, 3]).box(0, .84, .02, .68, .04, .84, FLAT).box(0, 0, -.44, .44, .72, .1, '#8b7a60').box(.18, .88, -.1, .08, .14, .08, '#7a4a3c').box(-.18, .88, .15, .08, .14, .08, '#7a4a3c'),
    g => g.box(0, 0, 0, .6, .9, .78, W, [3, 4, 3]).box(.14, 0, .42, .26, .9, .1, '#efe9da', [1, 1, 3]).roof(0, .9, 0, .66, .16, .82, ROOF, 'z').box(0, 0, -.43, .5, .76, .1, '#8b7a60').box(-.16, 0, .43, .2, .08, .08, '#8d7c64').box(-.2, .98, -.2, .08, .16, .08, '#7a4a3c'),
  ],
  [T.BRICK]: [
    g => g.box(0, 0, 0, .52, .56, .7, W, [2, 3, 2]).box(0, .56, 0, .56, .04, .74, FLAT).box(.15, .6, -.2, .08, .14, .08, '#6d5a50').box(0, 0, .4, .2, .1, .1, '#b9b3a8'),
    g => g.box(0, 0, 0, .46, .62, .74, W, [2, 3, 2]).roof(0, .62, 0, .5, .2, .78, '#5d5762', 'z').box(-.1, 0, .42, .18, .16, .12, '#c9c3b8').box(.12, .12, .4, .2, .44, .06, '#f1ece0', [1, 1, 2]).box(-.14, .7, -.22, .08, .2, .08, '#6d5a50'),
  ],
  [T.BTEN]: [
    g => g.box(0, 0, .03, .8, 1.15, .86, W, [4, 5, 4]).box(0, 1.15, .03, .84, .06, .9, FLAT).box(0, 0, -.46, .56, 1.0, .1, '#7a6a55').box(.25, 1.21, -.2, .1, .16, .1, '#5b4a44').box(-.25, 1.21, .1, .1, .16, .1, '#5b4a44'),
    g => g.box(0, 0, 0, .76, 1.05, .84, W, [4, 5, 4]).box(-.2, 0, .44, .24, 1.05, .1, '#f1ece0', [1, 1, 4]).box(.2, 0, .44, .24, 1.05, .1, '#f1ece0', [1, 1, 4]).box(0, 1.05, .02, .82, .08, .94, TRIM).box(0, 1.13, 0, .7, .03, .8, FLAT).box(0, 0, -.45, .5, .9, .08, '#7a6a55').box(.22, 1.16, -.2, .1, .16, .1, '#5b4a44'),
    g => g.box(0, .24, 0, .82, 1.0, .86, W, [4, 5, 4]).box(0, 0, 0, .8, .24, .84, '#3d3a37').box(0, .22, .49, .76, .03, .14, '#8a3a32').box(0, 1.24, 0, .86, .06, .9, FLAT).box(.3, 1.3, .3, .2, .14, .2, TRIM).box(-.24, 1.3, -.2, .1, .16, .1, '#5b4a44').box(0, .3, -.46, .5, .8, .08, '#7a6a55'),
  ],
  [T.NEWTEN]: g => g.box(-.26, 0, 0, .32, 1.0, .9, W, [2, 5, 4]).box(.26, 0, 0, .32, 1.0, .9, W, [2, 5, 4]).box(0, 0, -.28, .2, 1.0, .34, '#e6e0d2', [1, 2, 4]).box(-.26, 1.0, 0, .36, .05, .94, FLAT).box(.26, 1.0, 0, .36, .05, .94, FLAT).box(0, 0, .22, .18, .02, .5, '#6f9a58'),
  [T.MANSION]: g => g.box(0, 0, 0, .96, .02, .96, '#6f9a58').box(-.05, .02, -.08, .5, .5, .5, W, [2, 2, 2]).box(-.05, .52, -.08, .44, .16, .44, '#3d3a48').box(.2, .02, .14, .17, .8, .17, W, [1, 1, 3]).box(.2, .82, .14, .21, .1, .21, '#3d3a48').box(-.05, .02, .22, .4, .2, .1, '#efe9dd').tree(-.34, .32).tree(.36, -.3, 1.2),
  [T.SHOP]: [
    g => g.box(0, 0, -.02, .6, .4, .8, W, [1, 2, 1]).box(0, 0, .4, .64, .58, .04, '#e9e2d0').box(0, .22, .5, .6, .03, .18, '#a84238').box(0, .4, -.02, .62, .03, .8, ROOF),
    g => g.box(0, 0, -.02, .58, .5, .78, W, [2, 2, 2]).roof(0, .5, -.02, .64, .18, .84, ROOF, 'z').box(0, 0, .39, .6, .22, .04, '#3d3a37').box(0, .2, .5, .58, .03, .2, '#2f6a4a').box(.34, 0, .5, .14, .1, .14, '#c9a55a').box(-.34, 0, .52, .1, .14, .1, '#7a5a3a'),
  ],
  [T.SALOON]: g => g.box(0, 0, -.02, .62, .46, .8, W, [1, 2, 1]).box(0, 0, .4, .66, .64, .04, '#d9cfb8').box(0, .46, .43, .44, .12, .03, '#27503c').box(0, .46, -.02, .64, .03, .8, ROOF).box(.38, 0, .34, .1, .12, .1, '#6b4a2f').box(.38, 0, .2, .1, .12, .1, '#6b4a2f'),
  [T.STORE]: g => g.box(0, .26, 0, .86, .7, .86, W, [4, 4, 2]).box(0, 0, 0, .84, .26, .84, '#3a3836').box(0, .96, 0, .9, .06, .9, FLAT).box(0, .24, .5, .8, .03, .16, '#2f5a7a'),
  [T.WORKSHOP]: [
    g => g.box(0, 0, 0, .8, .32, .8, '#cdbf9e', [2, 2, 1]).roof(0, .32, 0, .86, .16, .86, '#5a5148', 'x').box(.26, .3, -.22, .08, .46, .08, '#5b5550'),
    g => g.box(-.1, 0, 0, .6, .4, .84, '#b89a78', [2, 3, 1]).roof(-.1, .4, 0, .66, .14, .88, '#5a5148', 'z').box(.32, 0, .1, .26, .22, .5, '#a58a6a').box(.32, .22, .1, .3, .02, .54, '#4f463e').box(.26, .3, -.22, .08, .46, .08, '#5b5550').box(.34, 0, -.3, .2, .12, .2, '#d6b676'),
  ],
  [T.FACTORY]: [
    g => g.box(0, 0, 0, .9, .6, .9, W, [4, 4, 2]).roof(0, .6, .3, .9, .12, .3, '#4c4a4a', 'x').roof(0, .6, 0, .9, .12, .3, '#4c4a4a', 'x').roof(0, .6, -.3, .9, .12, .3, '#4c4a4a', 'x').box(.3, 0, -.3, .14, 1.5, .14, '#7a5648').box(.3, 1.5, -.3, .18, .06, .18, '#3a3432'),
    g => g.box(-.08, 0, .06, .7, 1.0, .74, W, [4, 4, 4]).box(-.08, 1.0, .06, .74, .05, .78, FLAT).box(-.26, 1.05, .2, .2, .2, .2, '#5d4a3a').box(-.26, 1.25, .2, .24, .04, .24, '#3a302a').box(.36, 0, .1, .18, .4, .6, '#cfc6b4', [1, 2, 1]).box(.36, .4, .1, .22, .03, .64, '#4c4a4a').box(.3, 0, -.3, .14, 1.5, .14, '#7a5648').box(.3, 1.5, -.3, .18, .06, .18, '#3a3432'),
  ],
  [T.LUMBER]: [
    g => g.box(0, 0, 0, .96, .02, .96, '#a08a62').box(-.25, .02, .25, .36, .24, .36, '#dcbc7c').box(.22, .02, .28, .34, .16, .3, '#cfae6e').box(-.25, .02, -.2, .36, .32, .32, '#e2c486').box(.22, .02, -.05, .3, .22, .28, '#d6b676').box(.25, .02, -.36, .26, .2, .16, '#7b6a54').box(-.25, .34, -.2, .3, .02, .1, '#bfa064'),
    g => g.box(0, 0, 0, .96, .02, .96, '#a08a62').box(-.28, .02, 0, .3, .38, .8, '#e0c282').box(.05, .02, .2, .28, .26, .4, '#d2b272').box(.05, .02, -.24, .28, .18, .36, '#dcbc7c').box(.34, .02, .3, .2, .3, .22, '#7b6a54').roof(.34, .32, .3, .24, .1, .26, '#4f463e', 'z').box(.34, .02, -.1, .16, .1, .5, '#c8a868'),
  ],
  [T.SWEAT]: g => g.box(0, 0, 0, .72, 1.3, .86, W, [3, 4, 5]).box(0, 1.3, 0, .76, .05, .9, FLAT).box(.15, 1.35, -.2, .2, .22, .2, '#5d4a3a').box(.15, 1.57, -.2, .24, .04, .24, '#3a302a'),
  [T.RAIL]: g => g.box(0, 0, 0, 1, .02, 1, '#6c665c').box(-.3, .02, 0, .03, .02, 1, '#2b2a2a').box(-.14, .02, 0, .03, .02, 1, '#2b2a2a').box(.14, .02, 0, .03, .02, 1, '#2b2a2a').box(.3, .02, 0, .03, .02, 1, '#2b2a2a').box(-.22, .05, .15, .2, .2, .5, '#7d3b2e').box(.22, .05, -.2, .2, .2, .5, '#5c4a3a'),
  [T.RUBBLE]: g => g.box(-.15, 0, .1, .3, .08, .25, '#2b2724').box(.2, 0, -.15, .25, .12, .2, '#1f1c1a').box(.05, 0, -.05, .08, .38, .08, '#4a3a34').box(-.25, 0, -.25, .2, .05, .3, '#3a3430').box(.2, 0, .25, .3, .04, .2, '#33302c'),
  [T.FIRE]: g => g.box(0, 0, 0, .6, .5, .8, '#b0563f', [2, 2, 2]).box(0, 0, .405, .38, .3, .01, '#7a1f1a').box(0, .5, 0, .64, .04, .84, TRIM).box(.2, .5, -.25, .17, .55, .17, '#b0563f', [1, 1, 2]).box(.2, 1.05, -.25, .22, .06, .22, '#3a3432'),
  [T.POLICE]: g => g.box(0, 0, 0, .62, .52, .76, '#8d909b', [2, 3, 2]).box(0, .52, 0, .66, .05, .8, '#3a3d48').box(0, 0, .42, .24, .08, .1, '#b9b3a8').box(-.2, 0, .46, .03, .3, .03, '#2f4a3a').box(-.2, .3, .46, .07, .07, .07, '#4a7fd1').box(.2, 0, .46, .03, .3, .03, '#2f4a3a').box(.2, .3, .46, .07, .07, .07, '#4a7fd1'),
  [T.SCHOOL]: g => g.box(0, 0, 0, .86, .7, .7, '#a8513d', [4, 3, 3]).roof(0, .7, 0, .9, .2, .74, '#4a4a52', 'x').box(0, .8, 0, .16, .24, .16, '#e9e2d0').box(0, 1.04, 0, .2, .06, .2, '#4a4a52').box(.36, 0, .42, .02, .9, .02, '#ddd').box(.42, .78, .42, .12, .08, .01, '#b03030'),
  [T.CHURCH]: [
    g => g.box(0, 0, -.08, .42, .5, .76, '#cfc7b6', [1, 3, 1]).roof(0, .5, -.08, .48, .28, .8, '#5a4a44', 'z').box(0, 0, .34, .22, .9, .22, '#cfc7b6', [1, 1, 3]).box(0, .9, .34, .16, .28, .16, '#5a4a44').box(0, 1.18, .34, .08, .3, .08, '#5a4a44').box(0, 1.48, .34, .02, .14, .02, '#e8d48a').box(0, 1.55, .34, .08, .02, .02, '#e8d48a'),
    g => g.box(0, 0, -.04, .6, .56, .7, '#c9a37a', [2, 3, 1]).roof(0, .56, -.04, .66, .2, .74, '#4a5560', 'z').box(-.24, 0, .34, .16, .8, .16, '#c9a37a', [1, 1, 3]).box(.24, 0, .34, .16, .8, .16, '#c9a37a', [1, 1, 3]).box(-.24, .8, .34, .2, .08, .2, '#3f6a78').box(.24, .8, .34, .2, .08, .2, '#3f6a78').box(-.24, .88, .34, .12, .1, .12, '#3f6a78').box(.24, .88, .34, .12, .1, .12, '#3f6a78').box(0, .1, .33, .18, .34, .04, '#5a3a2a'),
  ],
  [T.PARK]: [
    g => g.box(0, 0, 0, 1, .03, 1, '#5f9c4c').box(0, .03, 0, .92, .006, .1, '#d2c198').box(0, .03, 0, .1, .006, .92, '#d2c198').tree(-.3, -.3, 1.2).tree(.3, -.28).tree(-.28, .3).tree(.32, .32, 1.3).box(0, .03, 0, .16, .1, .16, '#e9e2d0').box(0, .13, 0, .2, .03, .2, '#a84238'),
    g => g.box(0, 0, 0, 1, .03, 1, '#64a050').box(0, .03, 0, .44, .008, .44, '#d2c198').box(0, .035, 0, .3, .03, .3, '#6fa3b8').box(0, .06, 0, .06, .16, .06, '#d9d4c8').tree(-.34, -.34).tree(.34, -.34, 1.3).tree(-.34, .34, 1.2).tree(.36, .3).tree(0, -.4, .9).box(-.4, .03, 0, .04, .06, .2, '#7a5a3a').box(.4, .03, 0, .04, .06, .2, '#7a5a3a'),
  ],
  [T.BATH]: g => g.box(0, 0, 0, .6, .4, .76, '#e8e6de', [2, 3, 1]).box(0, .4, 0, .64, .05, .8, '#4f7a8c').box(-.18, .45, -.2, .08, .3, .08, '#9a9a9a'),
  [T.HOSP]: g => g.box(0, 0, 0, .9, .8, .56, '#eeeae0', [4, 2, 3]).box(0, .8, 0, .94, .05, .6, '#7a8a94').box(0, 0, .34, .3, .5, .16, '#eeeae0', [1, 1, 2]).box(0, .9, .3, .06, .2, .02, '#c0302a').box(0, .96, .3, .18, .06, .02, '#c0302a'),
  [T.HULL]: g => g.box(0, 0, 0, .96, .02, .96, '#7c9a5c').box(0, .02, -.04, .6, .56, .6, '#a3553f', [3, 3, 2]).box(0, .58, -.04, .68, .05, .68, '#3d3a3a').box(0, .63, -.04, .2, .16, .2, '#e9e2d0').box(0, .79, -.04, .24, .04, .24, '#3d3a3a').box(0, .02, .32, .64, .22, .12, '#efe9dd').tree(-.38, .36).tree(.38, -.36, 1.2),
  [T.DEPOT]: g => g.box(0, 0, 0, .74, .46, .96, '#9b7b5a', [2, 5, 1]).roof(0, .46, 0, .8, .22, .98, '#4a4744', 'z').box(-.2, .46, .36, .18, .5, .18, '#9b7b5a', [1, 1, 2]).box(-.2, .96, .36, .22, .08, .22, '#3a3836').box(-.2, .8, .455, .1, .1, .01, '#f4efe0'),
  [T.MARKET]: g => { g.box(0, 0, 0, 1, .015, 1, '#8a7a62'); const aw = ['#a8322a', '#2f6a4a', '#c9973a', '#3f6f9a', '#e9e2d0', '#8a3a6a']; for (let k = 0; k < 6; k++) { const x = -.32 + (k % 3) * .32, z = k < 3 ? -.24 : .24; g.box(x, .015, z, .24, .1, .16, '#7a5a3a').box(x, .2, z, .28, .02, .24, aw[k]).box(x - .12, .015, z + .1, .02, .19, .02, '#4a3a2a').box(x + .12, .015, z + .1, .02, .19, .02, '#4a3a2a').box(x, .115, z, .18, .04, .1, k % 2 ? '#d9a03a' : '#b84a3a'); } return g.box(.42, .015, 0, .1, .1, .1, '#c9a55a').box(-.42, .015, .02, .1, .14, .1, '#6b4a2f'); },
  [T.BOSS]: g => g.box(0, 0, 0, .82, .62, .84, '#b8674f', [3, 3, 2]).box(0, 0, .43, .84, .26, .02, '#2a2622').box(0, .62, 0, .88, .08, .9, '#27503c').box(0, .7, 0, .76, .03, .78, FLAT).box(0, .34, .46, .6, .14, .03, '#27503c').box(0, .36, .48, .5, .1, .01, '#e8d48a').box(.34, .73, .34, .02, .5, .02, '#ddd').box(.42, 1.14, .34, .14, .09, .01, '#b03030').box(-.3, 0, .52, .12, .14, .12, '#6b4a2f').box(-.14, 0, .52, .12, .14, .12, '#6b4a2f'),
  [T.ELEV]: g => g.box(0, 0, 0, .82, 1.5, .7, '#b89a6a', [0, 0, 1]).box(0, 1.5, 0, .86, .04, .74, '#6a5d4c').box(0, 1.54, 0, .3, .5, .7, '#a88a5c', [1, 3, 1]).roof(0, 2.04, 0, .36, .16, .76, '#5a5148', 'z').box(.48, 0, .1, .1, 1.3, .1, '#8a7452').box(.48, 1.3, .1, .16, .08, .3, '#6a5d4c').box(-.3, 0, .38, .2, .3, .1, '#8a7452').box(0, .5, .355, .5, .12, .01, '#f1ece0'),
  [T.GAS]: g => { g.box(0, 0, 0, 1, .015, 1, '#6c665c').box(-.12, .015, -.1, .56, .46, .56, '#6b4038').box(-.12, .475, -.1, .5, .05, .5, '#7a4a40').box(-.12, .525, -.1, .3, .04, .3, '#8a5a50'); for (const [x, z] of [[-.42, -.4], [.18, -.4], [-.42, .2], [.18, .2]]) g.box(x, .015, z, .04, .78, .04, '#2e2b2a'); g.box(-.12, .78, -.4, .64, .03, .04, '#2e2b2a').box(-.12, .78, .2, .64, .03, .04, '#2e2b2a').box(-.42, .78, -.1, .04, .03, .64, '#2e2b2a').box(.18, .78, -.1, .04, .03, .64, '#2e2b2a'); return g.box(.34, .015, .28, .26, .3, .36, '#a8674f', [1, 1, 1]).roof(.34, .315, .28, .3, .1, .4, '#4c4a4a', 'z').box(.4, .015, .1, .09, 1.1, .09, '#7a5648').box(.1, .015, .38, .16, .1, .16, '#1f1c1a'); },
  [T.STPAT]: g => g.box(0, 0, -.1, .5, .6, .72, '#d9c9a0', [1, 4, 1]).roof(0, .6, -.1, .56, .3, .76, '#4a4a52', 'z').box(-.2, 0, .34, .2, 1.0, .2, '#d9c9a0', [1, 1, 4]).box(.2, 0, .34, .2, 1.0, .2, '#d9c9a0', [1, 1, 4]).box(0, 0, .34, .2, .7, .16, '#d9c9a0').box(0, .1, .425, .12, .3, .01, '#5a3a2a').box(-.2, 1.0, .34, .16, .22, .16, '#3f6a5a').box(-.2, 1.22, .34, .1, .22, .1, '#3f6a5a').box(-.2, 1.44, .34, .04, .3, .04, '#3f6a5a').box(.2, 1.0, .34, .22, .1, .22, '#3f6a5a').box(.2, 1.1, .34, .16, .16, .16, '#3f6a5a').box(.2, 1.26, .34, .1, .12, .1, '#3f6a5a').box(.2, 1.38, .34, .02, .12, .02, '#e8d48a'),
  [T.BARN]: g => g.box(0, 0, 0, .42, .3, .52, '#8a5a3a').roof(0, .3, 0, .48, .2, .56, '#4a3a30', 'z').box(.3, 0, .2, .16, .1, .16, '#d9c070').box(-.34, 0, -.1, .02, .12, .7, '#7b6a54'),
};
const TINTS = {
  wood: ['#f4f0e6', '#dccaa0', '#c8d2c0', '#b9b3a6', '#cc9478', '#eadfc2', '#a9b6ba', '#d8b98a'],
  frame: ['#cfc2a6', '#b8ad98', '#a89c8a', '#c4b08a', '#b5a58c'],
  brick: ['#cf765c', '#c06a52', '#d68f6c', '#b25e4c', '#e2cc98', '#a85a4a'],
  dark: ['#b06a56', '#9e5c4e', '#b87e64', '#93564a'],
};
const TINT_OF = { [T.COTTAGE]: 'wood', [T.REAR]: 'wood', [T.SHOP]: 'wood', [T.SALOON]: 'wood', [T.WTEN]: 'frame', [T.BRICK]: 'brick', [T.BTEN]: 'brick', [T.NEWTEN]: 'brick', [T.MANSION]: 'brick', [T.STORE]: 'brick', [T.FACTORY]: 'dark', [T.SWEAT]: 'dark' };
for (const k in TINTS) TINTS[k] = TINTS[k].map(C);
// where the smoke comes out, in building-local coordinates: [x, y, z, particles, size]
const STACKS = { [T.GAS]: [.4, 1.14, .1, 5, 1.2], [T.ELEV]: [.48, 1.4, .1, 1, .6], [T.FACTORY]: [.3, 1.56, -.3, 7, 1.5], [T.WORKSHOP]: [.26, .78, -.22, 3, .9], [T.RAIL]: [.2, .3, -.2, 2, .9], [T.SWEAT]: [-.2, 1.36, .2, 2, .7], [T.BTEN]: [.25, 1.38, -.2, 1, .6], [T.WTEN]: [.18, 1.04, -.1, 1, .6] };

const HGT = { [T.SHANTY]: .2, [T.COTTAGE]: .45, [T.REAR]: .5, [T.WTEN]: .9, [T.BRICK]: .6, [T.BTEN]: 1.2, [T.NEWTEN]: 1.05, [T.SHOP]: .5, [T.SALOON]: .55, [T.MARKET]: .2, [T.BOSS]: .7, [T.WORKSHOP]: .45, [T.FACTORY]: .75, [T.LUMBER]: .28, [T.SWEAT]: 1.35, [T.ELEV]: 1.7, [T.GAS]: .6, [T.RUBBLE]: .08, [T.FIRE]: .6, [T.POLICE]: .55, [T.SCHOOL]: .8, [T.CHURCH]: .7, [T.STPAT]: .9, [T.PARK]: .12, [T.BATH]: .45, [T.HOSP]: .85, [T.HULL]: .6, [T.DEPOT]: .6, [T.BARN]: .4 };

export const heat = (v, out = _c) => { v = clamp(v, 0, 1); if (v < .5) out.setRGB(.25 + v * 1.5, .64 + v * .24, .3 - v * .4, THREE.SRGBColorSpace); else out.setRGB(1 - (v - .5) * .3, .76 - (v - .5) * 1.1, .1 + (v - .5) * .1, THREE.SRGBColorSpace); return out; };

const PART_VS = `attribute vec4 aS; uniform float uTime, uScale; uniform vec3 uWind; varying float vA;
void main(){ float t=fract(uTime*aS.y+aS.x); vec3 p=position+vec3(uWind.x*t*t*aS.w*1.8+sin(aS.x*40.+uTime*.7)*.1*t, t*aS.w, uWind.z*t*t*aS.w*1.8);
vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=min(160., aS.z*(.3+1.5*t)*uScale/-mv.z); vA=smoothstep(0.,.1,t)*(1.-t); }`;
const PART_FS = `uniform vec3 uColor; uniform float uOpacity; varying float vA;
void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.12,d)*vA*uOpacity; if(a<.01) discard; gl_FragColor=vec4(uColor,a); }`;
const AGENT_VS = `attribute vec3 aA; attribute vec3 aB; attribute vec4 aP; attribute vec3 aCol; uniform float uTime; uniform vec3 uTint; varying vec3 vC;
void main(){ float f=fract(uTime*aP.x+aP.y)*2.; float sgn=f>1.?-1.:1.; f=f>1.?2.-f:f; vec3 d=aB-aA; vec3 dir=normalize(d+vec3(0.,0.,.0001))*sgn; vec3 rt=vec3(dir.z,0.,-dir.x);
vec3 lp=position*aP.z; vec3 wp=mix(aA,aB,f)+rt*lp.x+vec3(0.,lp.y,0.)+dir*lp.z+rt*.12*sgn; wp.y+=abs(sin(uTime*9.+aP.y*50.))*.012*aP.w;
vec3 n=normalize(rt*normal.x+vec3(0.,normal.y,0.)+dir*normal.z); float l=.6+.4*max(dot(n,normalize(vec3(.4,.8,.3))),0.); vC=aCol*l*uTint;
gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.); }`;
const AGENT_FS = `varying vec3 vC; void main(){ gl_FragColor=vec4(pow(vC,vec3(.4545)),1.); }`;

// Chicago street addresses to world coordinates, using the ward's own scale: e = east (+) or west (-) of State St, s = south (+) or north (-) of Madison St.
const AX = e => -HX + .5 + (e + 800) / 15, AZ = s => -HZ + .5 + (s - 400) / 35;

class Pool {
  constructor(geo, mat, cap, scene) { this.mesh = new THREE.InstancedMesh(geo, mat, cap); this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.lots = new Int32Array(cap); this.cap = cap; this.mesh.setColorAt(0, _c.set(1, 1, 1)); scene.add(this.mesh); }
}

export class World {
  constructor(canvas, sim, opts = {}) {
    this.sim = sim; this.canvas = canvas;
    const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
    this.tier = opts.low ? 2 : (mem <= 4 || cores <= 4) ? 1 : 0;
    this.Q = [{ dpr: 1.5, smoke: 2600, agents: 1500 }, { dpr: 1, smoke: 1500, agents: 900 }, { dpr: .75, smoke: 700, agents: 450 }];
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.tier < 2, powerPreference: 'high-performance', stencil: false });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.Q[this.tier].dpr));
    this.scene = new THREE.Scene();
    this.sky = C('#b9cdd8'); this.scene.background = this.sky.clone(); this.scene.fog = new THREE.Fog(this.sky.clone(), 70, 300);
    this.camera = new THREE.PerspectiveCamera(38, 1, .5, 600);
    this.cam = { x: 1, z: 0, dist: 36, yaw: -.5, pitch: .86, tx: 1, tz: 0, td: 36 };
    this.street = null; this.shake = 0; this.night = 0; this.nightT = 0; this.haze = 0; this.time = 0;
    this.overlay = 'none'; this.zoneView = false;
    this.hemi = new THREE.HemisphereLight('#eef4f8', '#8a7d68', 1.5); this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff1d6', 2.2); this.sun.position.set(-40, 70, 45); this.scene.add(this.sun);
    this.slotT = new Uint16Array(NL); this.slotI = new Int32Array(NL).fill(-1);
    this.anims = []; this.raycaster = new THREE.Raycaster(); this.plane = new THREE.Plane(_up, -.15);
    this.buildMaterials(); this.buildGround(); this.buildSurround(); this.buildPools(); this.buildParticles(); this.buildAgents(); this.buildExtras(); this.buildLabels();
    this.fps = { n: 0, t: 0, v: 60 };
    this.resize(); this.syncAll();
  }

  buildMaterials() {
    const tex = (size, draw) => { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
    // one window per repeat, on siding lines that read as clapboard on wood and courses on brick
    const wall = tex(64, x => {
      x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 64);
      x.fillStyle = 'rgba(60,40,20,.10)'; for (let y = 7; y < 64; y += 8) x.fillRect(0, y, 64, 1);
      x.fillStyle = 'rgba(60,40,20,.05)'; for (let y = 0; y < 64; y += 8) for (let q = (y % 16 ? 8 : 0); q < 64; q += 16) x.fillRect(q, y, 1, 7);
      x.fillStyle = '#e9e4d8'; x.fillRect(17, 10, 30, 42);            // frame
      x.fillStyle = '#343842'; x.fillRect(20, 13, 24, 36);            // glass
      x.fillStyle = '#566070'; x.fillRect(20, 13, 24, 14);            // sky reflection
      x.fillStyle = '#e9e4d8'; x.fillRect(31, 13, 2, 36); x.fillRect(20, 30, 24, 2); // muntins
      x.fillStyle = '#d2ccbe'; x.fillRect(15, 52, 34, 4);             // sill
      x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(15, 56, 34, 2);
      x.fillStyle = '#f6f2e8'; x.fillRect(15, 6, 34, 4);              // lintel
    });
    const top = tex(64, x => {
      x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 64);
      for (let r = 0; r < 8; r++) { x.fillStyle = `rgba(0,0,0,${.04 + hash(r) * .06})`; x.fillRect(0, r * 8, 64, 8); x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(0, r * 8 + 7, 64, 1); x.fillStyle = 'rgba(0,0,0,.12)'; for (let q = (r % 2) * 5; q < 64; q += 10) x.fillRect(q, r * 8, 1, 7); }
    });
    this.bMats = [new THREE.MeshLambertMaterial({ map: wall, vertexColors: true }), new THREE.MeshLambertMaterial({ map: top, vertexColors: true })];
    this.bMat = this.bMats;
  }

  // ---------- ground: one canvas texture redrawn when zoning or streets change ----------
  buildGround() {
    const PX = this.PX = 32;
    const c = this.gCanvas = document.createElement('canvas'); c.width = TW * PX; c.height = TH * PX; const gx = this.gx = c.getContext('2d');
    // small hand-painted tiles: prairie, mud, plank road, granite block, yard dirt, ash
    const tile = (base, paint) => { const q = document.createElement('canvas'); q.width = q.height = 64; const x = q.getContext('2d'); x.fillStyle = base; x.fillRect(0, 0, 64, 64); let k = 1; paint(x, () => hash(k++ * 7 + base.charCodeAt(2))); return q; };
    const T_ = this.tiles = {
      grass: tile('#b0b07a', (x, r) => { const cs = ['#98a860', '#c6c088', '#8c9c58', '#d2ca92', '#a2a868', '#7f9450']; for (let k = 0; k < 700; k++) { x.fillStyle = cs[(r() * cs.length) | 0]; x.fillRect(r() * 64, r() * 64, 1, 2 + r() * 3); } for (let k = 0; k < 14; k++) { x.fillStyle = r() < .5 ? '#ecd66a' : '#e2a8b8'; x.fillRect(r() * 64, r() * 64, 2, 2); } }),
      mud: tile('#7c6a50', (x, r) => { for (let k = 0; k < 120; k++) { x.fillStyle = r() < .5 ? 'rgba(40,28,14,.18)' : 'rgba(170,150,110,.14)'; x.beginPath(); x.ellipse(r() * 64, r() * 64, 2 + r() * 7, 1 + r() * 3, 0, 0, 7); x.fill(); } x.fillStyle = 'rgba(40,30,18,.3)'; for (let k = 0; k < 5; k++) x.fillRect(0, 8 + k * 12 + r() * 3, 64, 1.5); for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(90,110,120,.35)'; x.beginPath(); x.ellipse(r() * 64, r() * 64, 3 + r() * 4, 1.5, 0, 0, 7); x.fill(); } }),
      plank: tile('#a08a64', (x, r) => { for (let k = 0; k < 8; k++) { x.fillStyle = `rgba(${r() < .5 ? '60,40,20' : '220,200,160'},${.05 + r() * .12})`; x.fillRect(k * 8, 0, 8, 64); x.fillStyle = 'rgba(50,35,20,.45)'; x.fillRect(k * 8, 0, 1, 64); x.fillStyle = 'rgba(40,30,20,.5)'; x.fillRect(k * 8 + 3, 6 + r() * 4, 1.5, 1.5); x.fillRect(k * 8 + 3, 54 + r() * 4, 1.5, 1.5); } }),
      block: tile('#77746e', (x, r) => { for (let y = 0; y < 8; y++) for (let q = -1; q < 6; q++) { const g = 120 + r() * 50; x.fillStyle = `rgb(${g},${g - 3},${g - 9})`; x.fillRect(q * 12 + (y % 2) * 6 + 1, y * 8 + 1, 10, 6); } }),
      dirt: tile('#94866a', (x, r) => { for (let k = 0; k < 400; k++) { x.fillStyle = r() < .5 ? 'rgba(60,45,25,.2)' : 'rgba(200,185,150,.2)'; x.fillRect(r() * 64, r() * 64, 2, 2); } for (let k = 0; k < 20; k++) { x.fillStyle = '#8f9c5c'; x.fillRect(r() * 64, r() * 64, 2, 3); } }),
      ash: tile('#3b3632', (x, r) => { for (let k = 0; k < 400; k++) { x.fillStyle = r() < .5 ? 'rgba(0,0,0,.3)' : 'rgba(150,140,130,.18)'; x.fillRect(r() * 64, r() * 64, 2, 2); } }),
    };
    this.pat = {}; for (const k in T_) this.pat[k] = gx.createPattern(T_[k], 'repeat');
    const t = this.gTex = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
    const g = new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), new THREE.MeshLambertMaterial({ map: t })); g.rotation.x = -Math.PI / 2; this.scene.add(g);
    const ft = new THREE.CanvasTexture(T_.grass); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(450, 450); ft.colorSpace = THREE.SRGBColorSpace; ft.anisotropy = 4;
    const far = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshLambertMaterial({ map: ft })); far.rotation.x = -Math.PI / 2; far.position.y = -.05; this.scene.add(far);
    // the river: moving ripples and glints, and it turns brown as the city fouls it
    this.waterMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: C('#5e7f8c') }, uX: { value: new THREE.Vector2(HX + .6, HX + 8.6) } },
      vertexShader: 'varying vec3 vP; void main(){ vec4 w=modelMatrix*vec4(position,1.); vP=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
      fragmentShader: `uniform float uTime; uniform vec3 uColor; uniform vec2 uX; varying vec3 vP;
        void main(){ vec2 p=vP.xz; float a=sin(p.y*1.6+uTime*.8+sin(p.x*2.3+uTime*.35)*1.4)*.5+.5; float b=sin(p.y*4.1-uTime*1.2+p.x*3.3)*.5+.5; float c=sin((p.x+p.y)*7.+uTime*1.7)*.5+.5;
        float r=a*.55+b*.3+c*.15; vec3 col=mix(uColor*.72,uColor*1.22,r); col+=smoothstep(.86,1.,a*b+c*.12)*.22*(uColor+.25);
        float bank=smoothstep(0.,1.1,min(p.x-uX.x,uX.y-p.x)); col*=.72+.28*bank; gl_FragColor=vec4(pow(col,vec3(.4545)),1.); }`,
    });
    this.riverMat = { color: this.waterMat.uniforms.uColor.value };
    const main = new THREE.Mesh(new THREE.PlaneGeometry(AX(120) - HX - 8, 3.4), this.waterMat); main.rotation.x = -Math.PI / 2; main.position.set((AX(120) + HX + 8) / 2, -.02, AZ(-330)); this.scene.add(main);
    // Lake Michigan, beyond downtown
    this.lakeMat = this.waterMat.clone(); this.lakeMat.uniforms.uColor.value = C('#6d9bb0'); this.lakeMat.uniforms.uX.value = new THREE.Vector2(AX(120), AX(120) + 900);
    const lake = new THREE.Mesh(new THREE.PlaneGeometry(420, 900), this.lakeMat); lake.rotation.x = -Math.PI / 2; lake.position.set(AX(120) + 210, -.03, 0); this.scene.add(lake);
    const riv = new THREE.Mesh(new THREE.PlaneGeometry(8, 900), this.waterMat); riv.rotation.x = -Math.PI / 2; riv.position.set(HX + 4.6, -.02, 0); this.scene.add(riv);
    const gb = new GB();
    for (const row of [0, 2, 4]) { const z = wz(row * 5); gb.box(HX + 4.6, 0, z, 9.4, .12, .8, '#6b5a48').box(HX + 4.6, .12, z - .42, 9.4, .14, .05, '#3a3430').box(HX + 4.6, .12, z + .42, 9.4, .14, .05, '#3a3430').box(HX + 4.6, 0, z, .7, .5, 1.1, '#4a4038').box(HX + 4.6, .5, z, .5, .3, .5, '#5a4a40'); }
    for (let k = 0; k < 5; k++) { const z = -HZ + 3 + k * 4.2 + (k % 2), x = HX + 2.2 + (k % 3) * 1.6; gb.box(x, 0, z, .5, .16, 1.9, '#4a3d33').box(x, .16, z - .3, .04, 1.2, .04, '#6b5a48').box(x, .16, z + .5, .04, .9, .04, '#6b5a48').box(x, .5, z - .3, .02, .6, .5, '#e9e2d0').box(x, .4, z + .5, .02, .5, .4, '#e2dac6').box(x, .16, z, .36, .1, .8, '#d9bd80'); }
    for (let z = -HZ; z < HZ; z += 1.3) gb.box(HX + .75, 0, z, .12, .22, .12, '#4a3d33'); // dock pilings
    this.scene.add(new THREE.Mesh(gb.build(), new THREE.MeshLambertMaterial({ vertexColors: true })));
    this.hi = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: .4, depthTest: false })); this.hi.rotation.x = -Math.PI / 2; this.hi.visible = false; this.hi.renderOrder = 5; this.scene.add(this.hi);
  }

  drawGround() {
    const s = this.sim, x = this.gx, PX = this.PX, ov = this.overlay, y = s.year, P = this.pat;
    // streets change with the times: prairie mud, then plank roads, then granite block
    x.fillStyle = y < 1855 ? P.mud : y < 1877 ? P.plank : P.block; x.fillRect(0, 0, TW * PX, TH * PX);
    if (y >= 1848) { x.strokeStyle = y < 1877 ? '#c4ad80' : '#b9b5aa'; x.lineWidth = 5; for (let k = 0; k < NB; k++) x.strokeRect(((k % BW) * 5 + 1) * PX - 3.5, (((k / BW) | 0) * 5 + 1) * PX - 3.5, 4 * PX + 7, 4 * PX + 7); } // sidewalks
    for (let k = 0; k < NB; k++) if (s.sewer[k]) {
      const X = (k % BW) * 5 * PX, Y = ((k / BW) | 0) * 5 * PX;
      x.strokeStyle = 'rgba(30,60,80,.7)'; x.lineWidth = 3; x.setLineDash([9, 7]); x.strokeRect(X + PX / 2, Y + PX / 2, 5 * PX, 5 * PX); x.setLineDash([]);
      for (const [a, b] of [[0, 0], [5, 0], [0, 5], [5, 5], [2.5, 0], [2.5, 5], [0, 2.5], [5, 2.5]]) { x.fillStyle = '#1e262b'; x.beginPath(); x.arc(X + a * PX + PX / 2, Y + b * PX + PX / 2, 5, 0, 7); x.fill(); x.strokeStyle = '#59646a'; x.lineWidth = 1.5; x.stroke(); }
    }
    for (let i = 0; i < NL; i++) {
      const X = s.tx[i] * PX, Y = s.ty[i] * PX, b = s.b[i];
      x.fillStyle = !b || b === T.PARK ? P.grass : b === T.RUBBLE ? P.ash : P.dirt; x.fillRect(X, Y, PX, PX);
      if (ov !== 'none') { const col = this.overlayColor(i); if (col) { x.globalAlpha = .78; x.fillStyle = '#' + col.getHexString(); x.fillRect(X, Y, PX, PX); x.globalAlpha = 1; } else { x.fillStyle = 'rgba(40,40,44,.4)'; x.fillRect(X, Y, PX, PX); } }
      if (b && b !== T.PARK && b !== T.RUBBLE && b !== T.MARKET) { x.strokeStyle = 'rgba(70,50,30,.45)'; x.lineWidth = 1.5; x.strokeRect(X + 1.5, Y + 1.5, PX - 3, PX - 3); } // fences
      else { x.strokeStyle = 'rgba(0,0,0,.07)'; x.lineWidth = 1; x.strokeRect(X + .5, Y + .5, PX - 1, PX - 1); }
    }
    x.fillStyle = 'rgba(25,18,10,.3)'; // shadows fall to the northeast
    for (let i = 0; i < NL; i++) {
      const h = HGT[s.b[i]]; if (!h) continue;
      const X = s.tx[i] * PX, Y = s.ty[i] * PX, m = PX * .16, x0 = X + m, x1 = X + PX - m, y0 = Y + m, y1 = Y + PX - m, dx = h * .6 * PX, dy = h * .68 * PX;
      x.beginPath(); x.moveTo(x0, y1); x.lineTo(x1, y1); x.lineTo(x1 + dx, y1 - dy); x.lineTo(x1 + dx, y0 - dy); x.lineTo(x0 + dx, y0 - dy); x.lineTo(x0, y0); x.closePath(); x.fill();
    }
    for (const L of s.lines) { // streetcar rails
      x.fillStyle = '#26221f';
      for (const o of [10, 21]) { if (L.axis) x.fillRect(L.idx * 5 * PX + o, 0, 2, TH * PX); else x.fillRect(0, L.idx * 5 * PX + o, TW * PX, 2); }
    }
    if (y >= 1848) { const X = (TW - 1) * PX; x.fillStyle = '#6a645a'; x.fillRect(X + 3, 0, PX - 6, TH * PX); x.fillStyle = '#4a3d30'; for (let q = 0; q < TH * PX; q += 7) x.fillRect(X + 4, q, PX - 8, 3); x.fillStyle = '#1f1d1c'; for (const o of [8, 14, 19, 25]) x.fillRect(X + o - 1, 0, 2, TH * PX); } // freight tracks on the docks
    this.gTex.needsUpdate = true;
  }

  // The rest of Chicago grows up around the ward, and the Loop rises across the river.
  buildSurround() {
    const gb = new GB().box(0, 0, 0, 1, 1, 1, '#b3a694', [2, 2, 3]);
    const spots = [];
    for (let z = -HZ - 30; z < HZ + 30; z += 2.6) for (let x = -HX - 34; x < HX; x += 2.6) {
      if (x > -HX - 4 && z > -HZ - 4 && z < HZ + 5) continue;
      if (x < -HX - 1 && x > -HX - 12.5 && z > -HZ - 2 && z < HZ + 2) continue; // cemetery
      const d = Math.max(0, -HX - x) + Math.max(0, Math.abs(z) - HZ) + (HX - x) * .35;
      spots.push({ x: x + hash(spots.length) * 1.2, z: z + hash(spots.length + 7) * 1.2, d, h: hash(spots.length + 3) });
    }
    spots.sort((a, b) => a.d - b.d); this.spots = spots;
    const m = this.surround = new THREE.InstancedMesh(gb.build(), this.bMats, spots.length); m.frustumCulled = false; m.count = 0; this.scene.add(m);
    spots.forEach((p, k) => { m.setColorAt(k, _c.copy(TINTS.frame[k % 5]).lerp(C('#e2d9c4'), .45).multiplyScalar(1 + p.h * .15)); });
    const dt = []; for (let z = AZ(-900); z < HZ + 30; z += 3.4) for (let x = HX + 10; x < AX(110) - 1.5; x += 3.4) { if (Math.abs(z - AZ(-330)) < 3.2) continue; const loop = z > AZ(-330) && z < AZ(560) ? 1 : .3; dt.push({ x, z, h: hash(dt.length + 99), d: (x - HX) * .5 + Math.abs(z - AZ(-50)) * .7, loop }); }
    const LM = this.buildLandmarks();
    for (let k = dt.length - 1; k >= 0; k--) if (LM.some(m => Math.abs(m.x - dt[k].x) < 3.4 && Math.abs(m.z - dt[k].z) < 3.4)) dt.splice(k, 1);
    dt.sort((p, q) => (p.d + p.h * 9) - (q.d + q.h * 9)); this.dtN = Math.round(dt.length * .04); this.dtAnims = [];
    this.dtSpots = dt; const d = this.downtown = new THREE.InstancedMesh(gb.build(), this.bMats, dt.length); d.frustumCulled = false; this.scene.add(d);
    this.setEra(1837, false);
  }
  // Real Chicago landmarks that rise (and burn, and rise again) across the river as the years pass.
  buildLandmarks() {
    this.lms = [];
    const add = (name, from, to, x, z, top, build, burns) => { const m = new THREE.Mesh(build(new GB()).build(), this.bMats); m.position.set(x, 0, z); m.visible = false; this.scene.add(m); const L = this.label(name, 24, '#f3ecdc'); L.position.set(x, top + 1.2, z); L.userData.h = 1.15; L.visible = false; this.lms.push({ m, L, from, to, x, z, burns }); };
    add('Grain elevators', 1848, 1900, AX(60), AZ(-290), 5, g => g.box(0, 0, 0, 1.8, 4, 3.2, '#b89a6a', [0, 0, 1]).box(0, 4, 0, .8, 1, 3.2, '#a88a5c', [1, 6, 1]).roof(0, 5, 0, .9, .3, 3.3, '#5a5148', 'z').box(0, 0, 4.6, 1.8, 3.2, 2.6, '#b0926a', [0, 0, 1]).box(0, 3.2, 4.6, .8, .9, 2.6, '#a88a5c', [1, 5, 1]).roof(0, 4.1, 4.6, .9, .3, 2.7, '#5a5148', 'z'), true);
    add('Courthouse', 1853, 1871, AX(-120), AZ(-125), 5.6, g => g.box(0, 0, 0, 3, 1.8, 4.4, '#d8d0bc', [5, 7, 2]).box(0, 1.8, 0, 3.2, .15, 4.6, '#b9b1a4').box(0, 1.95, 0, 1.5, .9, 1.5, '#d8d0bc', [3, 3, 1]).box(0, 2.85, 0, 1.2, .6, 1.2, '#8fa39a').box(0, 3.45, 0, .8, .5, .8, '#8fa39a').box(0, 3.95, 0, .4, .5, .4, '#8fa39a').box(0, 4.45, 0, .05, 1, .05, '#ddd').box(.22, 5.2, 0, .4, .25, .02, '#b03030'), true);
    add('Water Tower', 1869, 1900, AX(100), AZ(-800), 5.6, g => { g.box(0, 0, 0, 2, 1, 2, '#e2d8b8', [3, 3, 1]).box(0, 1, 0, 1.3, .5, 1.3, '#e2d8b8').box(0, 1.5, 0, .7, 3, .7, '#e2d8b8', [1, 1, 5]).box(0, 4.5, 0, .95, .25, .95, '#d2c8a8').box(0, 4.75, 0, .5, .5, .5, '#8fa39a').box(0, 5.25, 0, .16, .5, .16, '#8fa39a'); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.box(a * .9, 0, b * .9, .3, 1.5, .3, '#e2d8b8').box(a * .9, 1.5, b * .9, .2, .3, .2, '#8fa39a'); return g; }, false);
    add('Home Insurance Building', 1885, 1900, AX(-140), AZ(190), 6.2, g => g.box(0, 0, 0, 2.8, .9, 2.4, '#8a8478', [5, 4, 1]).box(0, .9, 0, 2.7, 5, 2.3, '#a8674f', [6, 5, 9]).box(0, 5.9, 0, 2.9, .25, 2.5, '#6a4a3c'), false);
    add('Auditorium', 1889, 1900, AX(70), AZ(450), 9.6, g => g.box(0, 0, 0, 4.2, 4.6, 3, '#b9b0a0', [8, 6, 8]).box(0, 4.6, 0, 4.3, .2, 3.1, '#8a8478').box(1.2, 4.8, .6, 1.5, 4.2, 1.5, '#b9b0a0', [3, 3, 8]).box(1.2, 9, .6, 1.7, .25, 1.7, '#8a8478').box(1.2, 9.25, .6, .9, .3, .9, '#8a8478'), false);
    add('Masonic Temple', 1892, 1900, AX(15), AZ(-160), 11.4, g => g.box(0, 0, 0, 2.6, 9.6, 2.6, '#8f6a58', [5, 5, 18]).box(0, 9.6, 0, 2.8, .25, 2.8, '#5a4038').roof(0, 9.85, 0, 2.6, 1.3, 2.6, '#4a5560', 'z'), false);
    add('Dearborn Station', 1885, 1900, AX(-36), AZ(830), 7.4, g => g.box(0, 0, 0, 2.6, 1.6, 1.8, '#b0604a', [5, 3, 2]).roof(0, 1.6, 0, 2.7, .7, 1.9, '#4a4a52', 'x').box(0, 0, 2.6, 2, 1, 3.4, '#8a8478', [0, 0, 1]).roof(0, 1, 2.6, 2.1, .5, 3.5, '#5a5550', 'z').box(.7, 0, -.5, .8, 5, .8, '#b0604a', [1, 1, 8]).box(.7, 5, -.5, 1, .25, 1, '#6a4a3c').roof(.7, 5.25, -.5, .9, 1.6, .9, '#4a4a52', 'z').box(.7, 4.2, -.08, .4, .4, .02, '#f4efe0'), false);
    // Too far away to show at true distance, so these two sit on the southern horizon in the right direction, with the real distance on the label.
    add('Union Stock Yards, 4 miles south', 1865, 1900, AX(-900), HZ + 46, 2.2, g => { g.box(0, 0, 0, 16, .03, 9, '#7a6a52'); for (let q = -7; q <= 7; q += 2) g.box(q, .03, 0, .06, .25, 9, '#4a3d30'); for (let q = -4; q <= 4; q += 2) g.box(0, .03, q, 16, .25, .06, '#4a3d30'); return g.box(-5, .03, -3, 2.4, 1.3, 1.6, '#a8674f', [4, 3, 2]).box(-4.4, 1.33, -3.4, .25, 1.6, .25, '#6a4a3c').box(4, .03, 2, 3, .9, 1.4, '#b89a6a', [5, 2, 1]).box(0, .03, -4.2, 1, 1.5, .5, '#d8d0bc').roof(0, 1.53, -4.2, 1.1, .5, .6, '#4a4a52', 'x'); }, false);
    // the Ferris wheel of 1893, on the Midway beside the World's Fair
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.translate(128, 128); x.strokeStyle = '#2a2622'; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 112, 0, 7); x.stroke(); x.lineWidth = 2.5; x.beginPath(); x.arc(0, 0, 96, 0, 7); x.stroke();
    for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; x.lineWidth = 1.2; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * 112, Math.sin(a) * 112); x.stroke(); x.fillStyle = k % 2 ? '#a8322a' : '#c9973a'; x.fillRect(Math.cos(a) * 118 - 5, Math.sin(a) * 118 - 4, 10, 8); }
    x.fillStyle = '#2a2622'; x.beginPath(); x.arc(0, 0, 7, 0, 7); x.fill();
    const wt = new THREE.CanvasTexture(c); wt.colorSpace = THREE.SRGBColorSpace;
    const fx = AX(40), fz = HZ + 62, wheel = this.wheel = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), new THREE.MeshBasicMaterial({ map: wt, transparent: true, alphaTest: .25, side: THREE.DoubleSide }));
    wheel.rotation.order = 'YXZ'; wheel.rotation.y = Math.PI / 2; wheel.position.set(fx, 7.2, fz); wheel.visible = false; this.scene.add(wheel);
    add('Ferris Wheel at the Fair, 6 miles south', 1893, 1893, fx, fz, 14, g => g.box(0, 0, -2.2, .3, 7.2, .3, '#3a3634').box(0, 0, 2.2, .3, 7.2, .3, '#3a3634').box(.5, 0, 0, .3, 7.2, .3, '#3a3634').box(-.5, 0, 0, .3, 7.2, .3, '#3a3634').box(0, 0, 0, 3, .4, 6, '#e9e2d0', [4, 8, 1]), false);
    return this.lms;
  }
  setEra(year, burned) {
    for (const k of this.lms) { k.m.visible = year >= k.from && year <= k.to && !(burned && k.burns); }
    this.wheel.visible = year === 1893;
    const t = clamp((year - 1837) / 63, 0, 1), tall = clamp((year - 1875) / 25, 0, 1), m = this.surround, n = Math.floor(this.spots.length * (.02 + .98 * t * t));
    for (let k = 0; k < n; k++) { const p = this.spots[k], age = clamp((n - k) / 200, 0, 1); _m.compose(_p.set(p.x, 0, p.z), _q.identity(), p.h < .32 ? _s.set(0, 0, 0) : _s.set(1.4, .18 + age * (.2 + p.h * .35), 1.4)); m.setMatrixAt(k, _m); }
    m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    this.era = { tall, burned }; this.paintDowntown();
  }
  // Downtown is only as big as the ward that feeds it: it grows as the student builds.
  dtHeight(k) { const p = this.dtSpots[k], e = this.era, near = 1 - clamp(p.d / 34, 0, 1); return e.burned ? .15 + p.h * .3 : .7 + p.h * 1.1 + near * .8 + e.tall * e.tall * (4 + p.h * 9) * (p.h > .45 ? 1 : .3) * p.loop; }
  paintDowntown() {
    const d = this.downtown, e = this.era;
    for (let k = 0; k < this.dtN; k++) { const p = this.dtSpots[k]; _m.compose(_p.set(p.x, 0, p.z), _q.identity(), _s.set(2.1, this.dtHeight(k), 2.1)); d.setMatrixAt(k, _m); d.setColorAt(k, e.burned ? _c.setRGB(.05, .045, .04) : _c.copy(TINTS.brick[k % 6]).lerp(C('#d6cfc0'), .62 + p.h * .3)); }
    d.count = this.dtN; d.instanceMatrix.needsUpdate = true; d.instanceColor.needsUpdate = true;
  }
  setCity(n, instant) {
    const want = Math.round(this.dtSpots.length * clamp(.04 + n / 175, 0, 1)); if (want === this.dtN) return;
    const was = this.dtN; this.dtN = want; this.paintDowntown();
    if (!instant) for (let k = was; k < want; k++) { const p = this.dtSpots[k]; this.dtAnims.push({ k, t: -(k - was) * .12 }); _m.compose(_p.set(p.x, 0, p.z), _q.identity(), _s.set(2.1, .001, 2.1)); this.downtown.setMatrixAt(k, _m); }
  }

  buildPools() {
    this.pools = {}; this.nvar = {};
    for (const k in MODELS) {
      const t = +k, list = Array.isArray(MODELS[k]) ? MODELS[k] : [MODELS[k]], cap = t >= 40 || t === T.MARKET || t === T.BOSS || t === T.ELEV || t === T.GAS ? 40 : NL; this.nvar[t] = list.length;
      list.forEach((f, v) => { this.pools[t * 8 + v] = new Pool(f(new GB()).build(), this.bMats, cap, this.scene); });
    }
  }
  keyFor(i) { const t = this.sim.b[i]; return t && this.nvar[t] ? t * 8 + ((hash(i + 17) * this.nvar[t]) | 0) : 0; }
  facing(i) { const lx = i & 3, ly = (i >> 2) & 3; return ly === 3 ? 0 : ly === 0 ? Math.PI : lx === 3 ? Math.PI / 2 : lx === 0 ? -Math.PI / 2 : ly === 2 ? 0 : Math.PI; }
  matrixFor(i, grow = 1) {
    const h = hash(i), s = .95 + h * .09, t = this.sim.b[i], fixed = t >= 40 || t === T.RAIL || t === T.LUMBER || t === T.MARKET || t === T.BOSS || t === T.ELEV || t === T.GAS;
    _q.setFromAxisAngle(_up, this.facing(i));
    return _m.compose(_p.set(wx(this.sim.tx[i]), 0, wz(this.sim.ty[i])), _q, _s.set(fixed ? 1 : s, Math.max(.001, (fixed ? 1 : .9 + hash(i + 31) * .24) * grow), fixed ? 1 : s));
  }
  overlayColor(i) {
    const s = this.sim, ov = this.overlay, p = s.pop[i], b = s.b[i];
    if (ov === 'health') return p > 0 ? heat(1 - (s.health[i] - 35) / 55) : null;
    if (ov === 'groups') return p > 0 ? _c.set(GROUPS[s.g[i]].color) : null;
    return null;
  }
  colorFor(i) {
    const s = this.sim, t = s.b[i];
    if (s.burn[i]) return _c.setRGB(2.2, .7, .15);
    if (this.overlay !== 'none' && this.overlay !== 'zones') { const c = this.overlayColor(i); if (c) return c.multiplyScalar(1.7); return _c.setRGB(.42, .42, .44); }
    const tn = TINT_OF[t];
    if (tn) { const pal = TINTS[tn]; _c.copy(pal[(hash(i + 5) * pal.length) | 0]); } else _c.setRGB(1, 1, 1);
    if (t !== T.PARK && t !== T.RUBBLE) _c.multiplyScalar(1 - .3 * clamp(s.poll[i] / 2.4, 0, 1)); // soot
    return _c;
  }
  removeLot(i) {
    const t = this.slotT[i]; if (!t) return;
    const P = this.pools[t], idx = this.slotI[i], last = P.mesh.count - 1;
    if (idx !== last) { const mv = P.lots[last]; P.mesh.getMatrixAt(last, _m); P.mesh.setMatrixAt(idx, _m); P.mesh.getColorAt(last, _c); P.mesh.setColorAt(idx, _c); P.lots[idx] = mv; this.slotI[mv] = idx; }
    P.mesh.count = last; P.mesh.instanceMatrix.needsUpdate = true; P.mesh.instanceColor.needsUpdate = true;
    this.slotT[i] = 0; this.slotI[i] = -1;
  }
  setLot(i, animate) {
    const t = this.keyFor(i);
    if (this.slotT[i] !== t) {
      this.removeLot(i);
      if (t && this.pools[t]) {
        const P = this.pools[t]; if (P.mesh.count >= P.cap) return;
        const idx = P.mesh.count++; P.lots[idx] = i; this.slotT[i] = t; this.slotI[i] = idx;
        P.mesh.setMatrixAt(idx, this.matrixFor(i, animate ? .02 : 1)); P.mesh.instanceMatrix.needsUpdate = true;
        if (animate) this.anims.push({ i, t: 0 });
      }
      this.smokeDirty = true;
    }
    if (this.slotT[i]) { const P = this.pools[this.slotT[i]]; P.mesh.setColorAt(this.slotI[i], this.colorFor(i)); P.mesh.instanceColor.needsUpdate = true; }
  }
  syncAll() { for (let i = 0; i < NL; i++) this.setLot(i, false); this.drawGround(); this.rebuildSmoke(); this.rebuildFire(); this.rebuildAgents(); this.rebuildLines(); this.updateCemetery(); this.updateHoods(); this.setEra(this.sim.year, this.sim.year === 1871 && !!this.sim.done.fire); }
  recolor() { for (let i = 0; i < NL; i++) if (this.slotT[i]) this.pools[this.slotT[i]].mesh.setColorAt(this.slotI[i], this.colorFor(i)); for (const k in this.pools) { const m = this.pools[k].mesh; if (m.count) m.instanceColor.needsUpdate = true; } }
  setOverlay(o) { this.overlay = o; this.recolor(); this.drawGround(); }

  // ---------- smoke and fire: GPU points, no per-frame CPU work ----------
  buildParticles() {
    const mk = (color, blend, op) => new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uScale: { value: 600 }, uWind: { value: new THREE.Vector3(.75, 0, -.75) }, uColor: { value: C(color) }, uOpacity: { value: op } }, vertexShader: PART_VS, fragmentShader: PART_FS, transparent: true, depthWrite: false, blending: blend });
    this.smokeMat = mk('#3d3a38', THREE.NormalBlending, .42); this.fireMat = mk('#ff8a2a', THREE.AdditiveBlending, .85); this.fsmokeMat = mk('#1c1917', THREE.NormalBlending, .6);
    const pts = m => { const p = new THREE.Points(new THREE.BufferGeometry(), m); p.frustumCulled = false; this.scene.add(p); return p; };
    this.smoke = pts(this.smokeMat); this.fsmoke = pts(this.fsmokeMat); this.fire = pts(this.fireMat); this.fire.renderOrder = 3;
  }
  fillPoints(points, list) { // list of [x,y,z, seed, speed, size, rise]
    const n = list.length, pos = new Float32Array(n * 3), a = new Float32Array(n * 4);
    for (let k = 0; k < n; k++) { const e = list[k]; pos[k * 3] = e[0]; pos[k * 3 + 1] = e[1]; pos[k * 3 + 2] = e[2]; a[k * 4] = e[3]; a[k * 4 + 1] = e[4]; a[k * 4 + 2] = e[5]; a[k * 4 + 3] = e[6]; }
    points.geometry.dispose(); const g = points.geometry = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(a, 4)); points.visible = n > 0;
  }
  rebuildSmoke() {
    this.smokeDirty = false; const s = this.sim, src = []; let want = 0;
    for (let i = 0; i < NL; i++) { const st = STACKS[s.b[i]]; if (!st || s.burn[i]) continue; if (st[3] === 1 && (hash(i + 77) > .35 || this.tier > 0)) continue; src.push(i); want += st[3]; }
    const keep = Math.min(1, this.Q[this.tier].smoke / Math.max(1, want)), list = [], slow = .55 + .45 * s.econ;
    for (const i of src) {
      const st = STACKS[s.b[i]], a = this.facing(i), cs = Math.cos(a), sn = Math.sin(a), sy = (s.b[i] >= 40 ? 1 : .9 + hash(i + 31) * .24);
      const x = wx(s.tx[i]) + st[0] * cs + st[2] * sn, z = wz(s.ty[i]) - st[0] * sn + st[2] * cs, n = Math.max(1, Math.round(st[3] * keep));
      for (let k = 0; k < n; k++) list.push([x, st[1] * sy, z, hash(i * 13 + k), (.07 + hash(i + k * 5) * .05) * slow, st[4] * (1.1 + hash(i + k) * .7), 3.2 + hash(i * 3 + k) * 2.2]);
    }
    this.fillPoints(this.smoke, list);
  }
  rebuildFire() {
    const s = this.sim, f = [], sm = []; const max = this.tier === 2 ? 3 : 6;
    for (const i of s.burning) {
      const x = wx(s.tx[i]), z = wz(s.ty[i]), h = B[s.b[i]].cap > 20 ? .8 : .3;
      for (let k = 0; k < max; k++) f.push([x + (hash(i * 7 + k) - .5) * .7, h * hash(i + k * 3), z + (hash(i * 11 + k) - .5) * .7, hash(i * 13 + k), .5 + hash(i + k) * .5, 2.6 + hash(i * 5 + k) * 2.4, 1.5 + hash(i + k * 9) * 1.6]);
      for (let k = 0; k < (max >> 1); k++) sm.push([x, h + .5, z, hash(i * 17 + k), .12 + hash(i + k) * .08, 3 + hash(i + k * 2) * 2.5, 6 + hash(i * 3 + k) * 5]);
    }
    this.fillPoints(this.fire, f); this.fillPoints(this.fsmoke, sm);
  }

  // ---------- crowds, wagons, and streetcars: instanced, animated in the vertex shader ----------
  buildAgents() {
    this.agentMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uTint: { value: new THREE.Vector3(1, 1, 1) } }, vertexShader: AGENT_VS, fragmentShader: AGENT_FS });
    const mk = geo => { const g = new THREE.InstancedBufferGeometry(); g.index = geo.index; g.setAttribute('position', geo.getAttribute('position')); g.setAttribute('normal', geo.getAttribute('normal')); g.instanceCount = 0; const m = new THREE.Mesh(g, this.agentMat); m.frustumCulled = false; this.scene.add(m); return m; };
    const person = new THREE.BoxGeometry(.065, .16, .065); person.translate(0, .08, 0);
    const wagon = new GB().box(0, .05, -.08, .16, .12, .3, '#fff').box(0, .03, .2, .07, .13, .2, '#fff').build();
    const car = new GB().box(0, .05, 0, .26, .26, .7, '#fff').box(0, .31, 0, .28, .03, .74, '#fff').build();
    this.people = mk(person); this.wagons = mk(wagon); this.cars = mk(car);
  }
  fillAgents(mesh, list) { // [ax,ay,az, bx,by,bz, speed, phase, scale, bob, r,g,b]
    const n = list.length, A = new Float32Array(n * 3), Bv = new Float32Array(n * 3), P = new Float32Array(n * 4), Cc = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { const e = list[k]; A.set(e.slice(0, 3), k * 3); Bv.set(e.slice(3, 6), k * 3); P.set(e.slice(6, 10), k * 4); Cc.set(e.slice(10, 13), k * 3); }
    const g = mesh.geometry;
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 3)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(Bv, 3)); g.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 4)); g.setAttribute('aCol', new THREE.InstancedBufferAttribute(Cc, 3));
    g.instanceCount = n; mesh.visible = n > 0;
  }
  rebuildAgents() {
    const s = this.sim, cum = []; let tot = 0;
    for (let i = 0; i < NL; i++) { const b = s.b[i]; const w = s.pop[i] + (b >= 10 && b < 30 ? 14 : 0); if (w > 0) { tot += w; cum.push(i, tot); } }
    const n = tot ? Math.min(this.Q[this.tier].agents, Math.round(8 + s.totPop / 5)) : 0, ppl = [], wag = [];
    const cloth = ['#3a3836', '#5b4a3c', '#6b6558', '#2f3a4a', '#7a3b33', '#8a8372', '#4a4f3c', '#b9b0a0', '#3f3530'].map(C);
    let seed = 1; const rnd = () => hash(seed++);
    for (let k = 0; k < n; k++) {
      const r = rnd() * tot; let lo = 0, hi = cum.length / 2 - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m * 2 + 1] < r) lo = m + 1; else hi = m; }
      const i = cum[lo * 2], lx = i & 3, ly = (i >> 2) & 3, bx = s.blk[i] % BW, by = (s.blk[i] / BW) | 0;
      const horiz = rnd() < .5, len = 2 + rnd() * 6, off = (rnd() - .5) * .62, c = cloth[(rnd() * cloth.length) | 0];
      let a, b;
      if (horiz) { const row = (ly < 2 ? by : by + 1) * 5, x0 = clamp(s.tx[i] - len / 2, 0, TW - 1), x1 = clamp(s.tx[i] + len / 2, 0, TW - 1); a = [wx(x0), 0, wz(row) + off]; b = [wx(x1), 0, wz(row) + off]; }
      else { const col = (lx < 2 ? bx : bx + 1) * 5, y0 = clamp(s.ty[i] - len / 2, 0, TH - 1), y1 = clamp(s.ty[i] + len / 2, 0, TH - 1); a = [wx(col) + off, 0, wz(y0)]; b = [wx(col) + off, 0, wz(y1)]; }
      if (k % 17 === 0) wag.push([...a, ...b, .025 + rnd() * .02, rnd(), 1, .3, .42 + rnd() * .2, .3 + rnd() * .12, .2]);
      else { const kid = rnd() < .25; ppl.push([...a, ...b, (.018 + rnd() * .02) * (kid ? 1.5 : 1) * (8 / len), rnd(), kid ? .62 : .9 + rnd() * .2, 1, c.r, c.g, c.b]); }
    }
    this.fillAgents(this.people, ppl); this.fillAgents(this.wagons, wag);
  }
  rebuildLines() {
    const s = this.sim, cars = [], gb = new GB(); let el = false;
    for (const L of s.lines) {
      const y = L.el ? 1.02 : 0, col = L.el ? [.45, .2, .16] : s.pol.cable ? [.72, .58, .2] : [.3, .45, .3];
      const a = L.axis ? [wx(L.idx * 5), y, -HZ + .5] : [-HX + .5, y, wz(L.idx * 5)], b = L.axis ? [wx(L.idx * 5), y, HZ - .5] : [HX - .5, y, wz(L.idx * 5)];
      for (let k = 0; k < (L.el ? 3 : 4); k++) cars.push([...a, ...b, L.el ? .03 : .012, k / 4 + hash(L.idx + k) * .1, L.el ? 1.1 : .8, 0, ...col]);
      if (L.el) { el = true; const len = L.axis ? TH : TW;
        if (L.axis) gb.box(wx(L.idx * 5), .92, 0, .7, .1, len, '#3a3634'); else gb.box(0, .92, wz(L.idx * 5), len, .1, .7, '#3a3634');
        for (let t = 1; t < len; t += 2.5) for (const o of [-.3, .3]) { if (L.axis) gb.box(wx(L.idx * 5) + o, 0, -HZ + t, .06, .92, .06, '#2e2b2a'); else gb.box(-HX + t, 0, wz(L.idx * 5) + o, .06, .92, .06, '#2e2b2a'); }
      }
    }
    this.fillAgents(this.cars, cars);
    if (this.elMesh) { this.scene.remove(this.elMesh); this.elMesh.geometry.dispose(); this.elMesh = null; }
    if (el) { this.elMesh = new THREE.Mesh(gb.build(), new THREE.MeshLambertMaterial({ vertexColors: true })); this.scene.add(this.elMesh); }
  }

  buildExtras() {
    // potter's field: one marker for every 14 deaths
    const cg = new GB().box(0, 0, 0, .05, .26, .03, '#e6e0d2').box(0, .15, 0, .16, .05, .03, '#e6e0d2').build();
    this.graves = new THREE.InstancedMesh(cg, new THREE.MeshLambertMaterial({ vertexColors: true }), 1000); this.graves.count = 0; this.graves.frustumCulled = false; this.scene.add(this.graves);
    const fg = new GB().box(-HX - 6.5, 0, 0, 10.4, .012, TH + 1, '#6f7d55');
    for (let z = -HZ - .5; z <= HZ + .5; z += 1) for (const x of [-HX - 11.6, -HX - 1.4]) fg.box(x, 0, z, .05, .22, .05, '#3a3632');
    this.scene.add(new THREE.Mesh(fg.build(), new THREE.MeshLambertMaterial({ vertexColors: true })));
    // the train that brings the newcomers
    const tg = new GB().box(0, .04, 0, .3, .26, .9, '#1f1e1e').box(0, .3, .25, .12, .2, .12, '#1f1e1e').box(0, .04, -.55, .32, .34, .5, '#2b2928');
    for (let k = 0; k < 5; k++) tg.box(0, .04, -1.45 - k * 1.05, .32, .34, .95, k % 2 ? '#7a3b2e' : '#5d5140', [0, 4, 1]);
    this.train = new THREE.Mesh(tg.build(), this.bMats); this.train.visible = false; this.train.position.x = wx(TW - 1); this.scene.add(this.train); this.trainT = -1;
  }
  updateCemetery() {
    const n = Math.min(1000, Math.floor(this.sim.deaths / 1.2)), g = this.graves; if (n === this.graveN) return; if (n < (this.graveN || 0)) this.graveN = 0;
    for (let k = this.graveN || 0; k < n; k++) { const col = k % 20, row = (k / 20) | 0; _q.setFromAxisAngle(_up, (hash(k) - .5) * .5); _m.compose(_p.set(-HX - 2.2 - col * .46, 0, HZ - .6 - row * .42), _q, _s.set(1, .8 + hash(k + 3) * .4, 1)); g.setMatrixAt(k, _m); }
    g.count = n; this.graveN = n; g.instanceMatrix.needsUpdate = true;
  }
  runTrain() { this.trainT = 0; this.train.visible = true; }

  // ---------- labels ----------
  label(text, size, color, bg) {
    const c = document.createElement('canvas'), x = c.getContext('2d'); const f = `${bg ? 'italic ' : ''}600 ${size}px Georgia, "Noto Serif", serif`; x.font = f;
    const w = Math.ceil(x.measureText(text).width) + 20; c.width = w; c.height = size + 16; x.font = f; x.textBaseline = 'middle';
    if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, c.height); }
    x.lineWidth = 5; x.strokeStyle = bg ? 'rgba(0,0,0,0)' : 'rgba(20,18,16,.75)'; x.strokeText(text, 10, c.height / 2 + 1); x.fillStyle = color; x.fillText(text, 10, c.height / 2 + 1);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true, fog: false })); sp.renderOrder = 6; sp.userData.ar = w / c.height; this.scene.add(sp); return sp;
  }
  buildLabels() {
    this.streetLabels = [];
    NS_STREETS.forEach((n, k) => { const s = this.label(n, 30, '#f3ecdc'); s.position.set(wx(k * 5), .2, HZ + 1.4); s.userData.h = 1.1; this.streetLabels.push(s); });
    EW_STREETS.forEach((n, k) => { const s = this.label(n, 30, '#f3ecdc'); s.position.set(-HX - 2.4, .2, wz(k * 5)); s.userData.h = 1.1; this.streetLabels.push(s); });
    this.markLabels = []; this.marks = {};
    const extra = [['The Loop', AX(-60), 8, AZ(0), 1.9], ['Lake Michigan', AX(120) + 12, 2, AZ(300), 1.8], ['Haymarket Square', AX(-660), 1, AZ(-150), 1], ['Halsted Street viaduct', AX(-800), 1, AZ(1600), 1], ['North Side', AX(-60), 3, AZ(-700), 1.3], ["Potter's field", -HX - 6.5, 1.2, -HZ - 1.5, 1], ['Chicago River', HX + 4.6, .6, HZ + 2.5, 1]];
    for (const [t, x, y, z, h] of extra) { const s = this.label(t, 28, '#f3ecdc'); s.position.set(x, y, z); s.userData.h = h; this.streetLabels.push(s); }
    this.hoodLabels = GROUPS.map((g, k) => { if (!k) return null; const s = this.label(HOOD_NAMES[k], 34, '#fff', g.color); s.visible = false; s.userData.h = 1.5; return s; });
  }
  updateHoods() {
    const s = this.sim;
    for (let g = 1; g < GROUPS.length; g++) {
      const L = this.hoodLabels[g]; let best = -1, bv = 0;
      for (let k = 0; k < NB; k++) { const v = s.bgPop[k * 7 + g]; if (v > bv && v > s.bPop[k] * .5) { bv = v; best = k; } }
      if (best < 0 || bv < 40 || s.groupPop[g] < 150) { L.visible = false; continue; }
      L.visible = true; L.position.set(wx((best % BW) * 5 + 2.5), 3.2, wz(((best / BW) | 0) * 5 + 2.5));
    }
    
  }

  // ---------- camera and picking ----------
  resize() {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    const ps = this.renderer.getPixelRatio() * h / (2 * Math.tan(this.camera.fov * Math.PI / 360)) * .2;
    for (const m of [this.smokeMat, this.fireMat, this.fsmokeMat]) m.uniforms.uScale.value = ps;
  }
  pan(dx, dz) { const c = this.cam, cs = Math.cos(c.yaw), sn = Math.sin(c.yaw); c.tx = clamp(c.tx + dx * cs + dz * sn, -HX - 14, AX(120)); c.tz = clamp(c.tz - dx * sn + dz * cs, AZ(-800), HZ + 30); }
  zoom(f) { this.cam.td = clamp(this.cam.td * f, 6, 120); }
  rotate(a, p = 0) { this.cam.yaw += a; this.cam.pitch = clamp(this.cam.pitch + p, .3, 1.45); }
  flyTo(i, d) { this.cam.tx = wx(this.sim.tx[i]); this.cam.tz = wz(this.sim.ty[i]); if (d) this.cam.td = d; }
  enterStreet(x, z) { const tx = clamp(Math.round((x + HX - .5) / 5) * 5, 0, TW - 1); this.street = { x: wx(tx), z: clamp(z, -HZ + 1, HZ - 1), yaw: Math.PI, pitch: .05 }; this.camera.fov = 68; this.camera.near = .03; this.resize(); }
  exitStreet() { this.street = null; this.camera.fov = 38; this.camera.near = .5; this.resize(); }
  walk(f, sd) { const s = this.street, cs = Math.cos(s.yaw), sn = Math.sin(s.yaw); s.x = clamp(s.x + sn * f + cs * sd, -HX, HX); s.z = clamp(s.z + cs * f - sn * sd, -HZ, HZ); }
  pick(cx, cy) {
    const r = this.canvas.getBoundingClientRect(); _p.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1, .5);
    this.raycaster.setFromCamera(_p, this.camera); const hit = this.raycaster.ray.intersectPlane(this.plane, new THREE.Vector3()); if (!hit) return null;
    const tx = Math.floor(hit.x + HX), ty = Math.floor(hit.z + HZ); if (tx < 0 || ty < 0 || tx >= TW || ty >= TH) return { out: true, x: hit.x, z: hit.z };
    const lot = this.sim.tileLot[ty * TW + tx], o = { tx, ty, lot, x: hit.x, z: hit.z };
    if (lot >= 0) o.block = this.sim.blk[lot]; else if (tx % 5 === 0 && ty % 5 !== 0) { o.axis = 1; o.idx = tx / 5; } else if (ty % 5 === 0 && tx % 5 !== 0) { o.axis = 0; o.idx = ty / 5; } else { o.axis = 0; o.idx = ty / 5; }
    return o;
  }
  highlight(kind, v, ok = true) {
    const h = this.hi; if (!kind) { h.visible = false; return; }
    h.visible = true; h.material.color.set(ok ? '#ffffff' : '#ff4030');
    if (kind === 'lot') { h.position.set(wx(this.sim.tx[v]), .05, wz(this.sim.ty[v])); h.scale.set(1, 1, 1); }
    else if (kind === 'block') { h.position.set(wx((v % BW) * 5 + 2.5), .05, wz(((v / BW) | 0) * 5 + 2.5)); h.scale.set(4, 4, 1); }
    else if (kind === 'line') { if (v.axis) { h.position.set(wx(v.idx * 5), .05, 0); h.scale.set(1, TH, 1); } else { h.position.set(0, .05, wz(v.idx * 5)); h.scale.set(TW, 1, 1); } }
  }

  // ---------- frame ----------
  update(dt) {
    const s = this.sim; this.time += dt;
    if (s.dirty.length) { const seen = new Set(s.dirty); s.dirty.length = 0; for (const i of seen) this.setLot(i, true); if (!(this.groundWait > 0)) this.groundWait = .6; if (s.burning.length || this.fire.visible) this.rebuildFire(); }
    if (s.groundDirty) { s.groundDirty = false; this.groundWait = .12; }
    if (this.groundWait > 0 && (this.groundWait -= dt) <= 0) this.drawGround();
    if (this.smokeDirty && !(this.smokeWait > 0)) this.smokeWait = .6;
    if (this.smokeWait > 0 && (this.smokeWait -= dt) <= 0) this.rebuildSmoke();
    for (let k = this.anims.length - 1; k >= 0; k--) {
      const a = this.anims[k]; a.t += dt * 2.6; const t = Math.min(1, a.t), e = 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
      if (this.slotT[a.i]) { const P = this.pools[this.slotT[a.i]]; P.mesh.setMatrixAt(this.slotI[a.i], this.matrixFor(a.i, e)); P.mesh.instanceMatrix.needsUpdate = true; }
      if (t >= 1) { this.anims[k] = this.anims[this.anims.length - 1]; this.anims.pop(); }
    }
    if (this.trainT >= 0) { this.trainT += dt; const t = this.trainT, z0 = -HZ - 26, zs = wz(8); this.train.position.z = t < 4 ? z0 + (zs - z0) * (1 - Math.pow(1 - t / 4, 2)) : t < 6.5 ? zs : zs + Math.pow(t - 6.5, 2) * 4; if (t > 11) { this.trainT = -1; this.train.visible = false; } }
    // mood: haze thickens with smoke, the sky goes dark and red during the Great Fire
    this.haze += (clamp(s.smoke / 70, 0, 1) - this.haze) * Math.min(1, dt * .5);
    this.night += (this.nightT - this.night) * Math.min(1, dt * .8);
    const n = this.night, h = this.haze, bg = this.scene.background;
    bg.copy(this.sky).lerp(_c.set('#8f8676'), h * .85).lerp(_c.set('#1a0d08'), n * .92); this.scene.fog.color.copy(bg);
    const st = !!this.street; this.scene.fog.near = st ? 3 - h * 2 : 70 - h * 30; this.scene.fog.far = st ? 75 - h * 40 : 300 - h * 120;
    this.hemi.intensity = 1.5 * (1 - n * .7) * (1 - h * .22); this.sun.intensity = 2.2 * (1 - n * .92) * (1 - h * .3);
    this.hemi.color.set('#e6eef5').lerp(_c.set('#ff7a30'), n * .8);
    this.riverMat.color.set('#5e7f8c').lerp(_c.set('#5a5238'), clamp(s.totPop / 3000, 0, 1) * (s.pol.canal ? .5 : 1)).multiplyScalar(1 - n * .6);
    this.agentMat.uniforms.uTint.value.setScalar(1 - n * .6);
    for (const m of [this.smokeMat, this.fireMat, this.fsmokeMat, this.agentMat]) m.uniforms.uTime.value = this.time;
    // camera
    const c = this.cam, k = Math.min(1, dt * 7); c.x += (c.tx - c.x) * k; c.z += (c.tz - c.z) * k; c.dist += (c.td - c.dist) * k;
    if (this.street) { const v = this.street; this.camera.position.set(v.x, .19, v.z); this.camera.lookAt(v.x + Math.sin(v.yaw) * Math.cos(v.pitch), .19 + Math.sin(v.pitch), v.z + Math.cos(v.yaw) * Math.cos(v.pitch)); }
    else {
      const cp = Math.cos(c.pitch); let sx = 0, sz = 0; if (this.shake > 0) { this.shake -= dt; sx = (Math.random() - .5) * this.shake * .5; sz = (Math.random() - .5) * this.shake * .5; }
      this.camera.position.set(c.x + Math.sin(c.yaw) * cp * c.dist + sx, Math.sin(c.pitch) * c.dist, c.z + Math.cos(c.yaw) * cp * c.dist + sz); this.camera.lookAt(c.x + sx, 0, c.z + sz);
    }
    const ls = this.street ? .02 : c.dist * .021;
    for (const L of this.streetLabels) { L.visible = !this.street && c.dist > 9; L.scale.set(L.userData.h * L.userData.ar * ls, L.userData.h * ls, 1); }
    for (const L of this.markLabels) { L.visible = !this.street && (L.userData.type < 0 ? this.sim.pop[L.userData.lot] > 0 : this.sim.b[L.userData.lot] === L.userData.type); L.scale.set(L.userData.h * L.userData.ar * ls, L.userData.h * ls, 1); }
    for (const k of this.lms) { const L = k.L; L.visible = !this.street && k.m.visible && c.dist > 14; L.scale.set(L.userData.h * L.userData.ar * ls, L.userData.h * ls, 1); }
    if (this.wheel.visible) this.wheel.rotation.z = this.time * .12;
    this.waterMat.uniforms.uTime.value = this.lakeMat.uniforms.uTime.value = this.time;
    for (let q = this.dtAnims.length - 1; q >= 0; q--) { // new downtown buildings rise one after another
      const a = this.dtAnims[q]; a.t += dt * 1.6; if (a.k >= this.dtN) { this.dtAnims.splice(q, 1); continue; }
      const t = clamp(a.t, 0, 1), p = this.dtSpots[a.k]; _m.compose(_p.set(p.x, 0, p.z), _q.identity(), _s.set(2.1, Math.max(.001, this.dtHeight(a.k) * (1 - Math.pow(1 - t, 3))), 2.1)); this.downtown.setMatrixAt(a.k, _m); this.downtown.instanceMatrix.needsUpdate = true;
      if (a.t >= 1) this.dtAnims.splice(q, 1);
    }
    for (const L of this.hoodLabels) if (L) { if (this.street) L.visible = false; L.scale.set(L.userData.h * L.userData.ar * ls, L.userData.h * ls, 1); }
    this.renderer.render(this.scene, this.camera);
    // drop quality if the machine is struggling
    const f = this.fps; f.n++; f.t += dt; if (f.t > 4) { f.v = f.n / f.t; f.n = 0; f.t = 0; if (f.v < 24 && this.tier < 2 && !document.hidden) { this.tier++; this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.Q[this.tier].dpr)); this.resize(); this.rebuildSmoke(); this.rebuildAgents(); } }
  }
  yearly() { this.recolor(); this.rebuildAgents(); this.rebuildSmoke(); this.updateHoods(); this.updateCemetery(); }
  // name tags for the two buildings students should be able to find again
  mark(lot, name, fam) { if (this.marks[name]) { this.scene.remove(this.marks[name]); this.markLabels.splice(this.markLabels.indexOf(this.marks[name]), 1); } const s = this.label(name, 26, '#2a2622', 'rgba(244,236,216,.92)'); s.position.set(wx(this.sim.tx[lot]), 2, wz(this.sim.ty[lot])); s.userData.h = .62; s.userData.lot = lot; s.userData.type = fam ? -1 : this.sim.b[lot]; this.marks[name] = s; this.markLabels.push(s); }

  // A "Jacob Riis" photograph of whatever the camera sees.
  photo() {
    this.renderer.render(this.scene, this.camera);
    const c = document.createElement('canvas'); c.width = 560; c.height = 360; const x = c.getContext('2d'), src = this.canvas;
    const ar = c.width / c.height, sw = Math.min(src.width, src.height * ar), sh = sw / ar;
    x.filter = 'grayscale(1) sepia(.55) contrast(1.2) brightness(.92)'; x.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, c.width, c.height); x.filter = 'none';
    const g = x.createRadialGradient(280, 180, 120, 280, 180, 340); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,10,0,.6)'); x.fillStyle = g; x.fillRect(0, 0, 560, 360);
    for (let k = 0; k < 900; k++) { x.fillStyle = `rgba(${Math.random() < .5 ? 255 : 0},${Math.random() < .5 ? 240 : 0},200,.05)`; x.fillRect(Math.random() * 560, Math.random() * 360, 1.5, 1.5); }
    return c.toDataURL('image/jpeg', .72);
  }
}
