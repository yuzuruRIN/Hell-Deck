/*!
 * pixelfx (subset) — https://github.com/patch-gg/pixelfx @ 5294518
 * Bundled for Hell's Deck as one classic script (window.PixelFX). Effects: fire/fireball, ice/ice-lance,
 * projectiles/laser-bolt, projectiles/bullet-tracer, impacts/hit-spark, impacts/bullet-impact, explosions/plasma-explosion,
 * impacts/ground-slam, melee/heavy-cleave, impacts/crit-hit, fire/flame-pillar, fire/fire-ring, ui/confetti, explosions/firework-burst.
 *
 * MIT License
 * 
 * Copyright (c) 2026 Patch
 * Copyright (c) 2026 Hugo Duprez
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Notices (from pixelfx NOTICE.md): src/core/sim.js and some effects adapt Sprite Fusion pixel art VFX,
 * Copyright (c) 2026 Hugo Duprez, MIT License. src/core/act.js adapts Hollow Crown, Copyright (c) 2026 rehan-remade, MIT License.
 */
(function () {
"use strict";
var __defs = [], __cache = [];
function __get(o, k, g) { Object.defineProperty(o, k, { get: g, enumerable: true, configurable: true }); }
function __star(o, m) { Object.keys(m).forEach(function (k) { if (k !== "default" && !(k in o)) __get(o, k, function () { return m[k]; }); }); }
function __req(id) { if (__cache[id]) return __cache[id]; var e = __cache[id] = {}; __defs[id](e); return e; }
/* ../pixelfx_src/src/core/math.js */
__defs[3] = function (__exports) {
__get(__exports, "hash", () => hash);
__get(__exports, "Rng", () => Rng);
__get(__exports, "noise", () => noise);
__get(__exports, "noise2", () => noise2);
__get(__exports, "fbm", () => fbm);
__get(__exports, "tileNoise", () => tileNoise);
__get(__exports, "tileFbm", () => tileFbm);
__get(__exports, "loopNoise", () => loopNoise);
__get(__exports, "TAU", () => TAU);
__get(__exports, "clamp", () => clamp);
__get(__exports, "lerp", () => lerp);
__get(__exports, "invLerp", () => invLerp);
__get(__exports, "remap", () => remap);
__get(__exports, "fract", () => fract);
__get(__exports, "wrap", () => wrap);
__get(__exports, "seg", () => seg);
__get(__exports, "smooth", () => smooth);
__get(__exports, "bump", () => bump);
__get(__exports, "pingpong", () => pingpong);
__get(__exports, "dist", () => dist);
__get(__exports, "angleTo", () => angleTo);
__get(__exports, "ease", () => ease);
__get(__exports, "rand", () => rand);
__get(__exports, "rng", () => rng);
// Numbers, easing, randomness and noise. Everything here is pure and deterministic,
// so an effect drawn at time t always looks the same.

const TAU = Math.PI * 2;

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, x) => (b === a ? 0 : (x - a) / (b - a));
const remap = (x, a0, a1, b0, b1) => lerp(b0, b1, invLerp(a0, a1, x));
const fract = (x) => x - Math.floor(x);
const wrap = (x, m) => ((x % m) + m) % m;
/** Progress 0..1 of t through the window [t0, t1]: 0 before it, 1 after it. */
const seg = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
/** Hermite smoothstep of x between e0 and e1. */
const smooth = (e0, e1, x) => {
  const t = seg(x, e0, e1);
  return t * t * (3 - 2 * t);
};
/** 0 → 1 → 0 over the window [t0, t1] (sine bump). */
const bump = (t, t0, t1) => (t <= t0 || t >= t1 ? 0 : Math.sin(Math.PI * seg(t, t0, t1)));
const pingpong = (x) => 1 - Math.abs(wrap(x, 2) - 1);
const dist = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0);
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);

/** Easing curves: input 0..1, output 0..1 (back and elastic overshoot). */
const ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inQuart: (t) => t * t * t * t,
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  outSine: (t) => Math.sin((t * Math.PI) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  inBack: (t, s = 1.70158) => (t <= 0 ? 0 : t >= 1 ? 1 : (s + 1) * t * t * t - s * t * t),
  outBack: (t, s = 1.70158) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2)),
  outElastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  outBounce: (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};

/** 32-bit integer hash of any number of integers. */
function hash(...ns) {
  let h = 0x9e3779b9;
  for (const n of ns) {
    h = Math.imul(h ^ (n | 0), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
  }
  return h >>> 0;
}
/** Deterministic random number in [0, 1) from integers (seed, particle index, which value...). */
const rand = (...ns) => hash(...ns) / 4294967296;

/** Seeded random generator (mulberry32). */
class Rng {
  constructor(seed = 1) {
    this.s = seed >>> 0 || 1;
  }
  next() {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) {
    return a + (b - a) * this.next();
  }
  int(a, b) {
    return Math.floor(this.range(a, b + 1));
  }
  chance(p) {
    return this.next() < p;
  }
  sign() {
    return this.next() < 0.5 ? -1 : 1;
  }
  pick(list) {
    return list[Math.floor(this.next() * list.length)];
  }
  /** Roughly normal, mean 0, sd 1. */
  gauss() {
    return (this.next() + this.next() + this.next() + this.next() - 2) * 1.732;
  }
}
/** A generator for one particle: rng(seed, i) gives the same numbers every frame. */
const rng = (...ns) => new Rng(hash(...ns));

/** Smooth 1D value noise in [-1, 1]. */
function noise(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(rand(i, seed), rand(i + 1, seed), u) * 2 - 1;
}
/** Smooth 2D value noise in [-1, 1]. */
function noise2(x, y, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = rand(ix, iy, seed), b = rand(ix + 1, iy, seed), c = rand(ix, iy + 1, seed), d = rand(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy) * 2 - 1;
}
/** Fractal 2D noise in about [-1, 1]. */
function fbm(x, y, seed = 0, octaves = 3) {
  let s = 0, a = 0.5, n = 0;
  for (let o = 0; o < octaves; o++) {
    s += noise2(x, y, seed + o * 101) * a;
    n += a;
    x *= 2.03;
    y *= 2.03;
    a *= 0.5;
  }
  return s / n;
}
/**
 * 2D value noise whose lattice repeats every px cells in x and py cells in y (0: no repeat). Scroll it by
 * exactly py cells over a loop and the loop has no seam: tileNoise(x, y + phase * py, 0, py).
 */
function tileNoise(x, y, px = 0, py = 0, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const x0 = px ? wrap(ix, px) : ix, x1 = px ? wrap(ix + 1, px) : ix + 1;
  const y0 = py ? wrap(iy, py) : iy, y1 = py ? wrap(iy + 1, py) : iy + 1;
  const a = rand(x0, y0, seed), b = rand(x1, y0, seed), c = rand(x0, y1, seed), d = rand(x1, y1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy) * 2 - 1;
}
/** Fractal tileNoise: every octave keeps the repeat, so scrolled fields still loop. */
function tileFbm(x, y, px = 0, py = 0, seed = 0, octaves = 3) {
  let s = 0, a = 0.5, n = 0, k = 1;
  for (let o = 0; o < octaves; o++) {
    s += tileNoise(x * k, y * k, px * k, py * k, seed + o * 101) * a;
    n += a;
    a *= 0.5;
    k *= 2;
  }
  return s / n;
}
/** Noise that loops: the same value at phase 0 and phase 1 (for seamless loops). */
function loopNoise(phase, radius = 1, seed = 0) {
  const a = phase * TAU;
  return noise2(Math.cos(a) * radius + 50, Math.sin(a) * radius + 50, seed);
}

};
/* ../pixelfx_src/src/core/color.js */
__defs[4] = function (__exports) {
__get(__exports, "hex", () => hex);
__get(__exports, "mix", () => mix);
__get(__exports, "fit", () => fit);
__get(__exports, "blend", () => blend);
__get(__exports, "rgb", () => rgb);
__get(__exports, "red", () => red);
__get(__exports, "green", () => green);
__get(__exports, "blue", () => blue);
__get(__exports, "toHex", () => toHex);
__get(__exports, "scale", () => scale);
__get(__exports, "luma", () => luma);
__get(__exports, "ramp", () => ramp);
__get(__exports, "at", () => at);
__get(__exports, "PAL", () => PAL);
__get(__exports, "RAMP", () => RAMP);
__get(__exports, "WHITE", () => WHITE);
__get(__exports, "BLACK", () => BLACK);
__get(__exports, "INK", () => INK);
__get(__exports, "PATCH", () => PATCH);
// Colors are 32-bit integers laid out like ImageData bytes (R, G, B, A in memory),
// so a frame's color buffer can be shown with new ImageData(new Uint8ClampedArray(buf.buffer), w, h).

const { clamp } = __req(3);

const rgb = (r, g, b) => (255 << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);
const red = (c) => c & 255;
const green = (c) => (c >>> 8) & 255;
const blue = (c) => (c >>> 16) & 255;

/** "#rgb" or "#rrggbb" (or a color number, passed through) to a color number. */
function hex(h) {
  if (typeof h === "number") return h;
  let s = h.replace("#", "");
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  const v = parseInt(s.slice(0, 6), 16);
  return rgb((v >> 16) & 255, (v >> 8) & 255, v & 255);
}
const toHex = (c) => "#" + [red(c), green(c), blue(c)].map((v) => v.toString(16).padStart(2, "0")).join("");

/** Linear mix of two colors. */
function mix(a, b, t) {
  t = clamp(t);
  return rgb(red(a) + (red(b) - red(a)) * t, green(a) + (green(b) - green(a)) * t, blue(a) + (blue(b) - blue(a)) * t);
}
/** Multiply a color's brightness by k. */
const scale = (c, k) => rgb(Math.min(255, red(c) * k), Math.min(255, green(c) * k), Math.min(255, blue(c) * k));
/** Perceived brightness 0..1. */
const luma = (c) => (0.299 * red(c) + 0.587 * green(c) + 0.114 * blue(c)) / 255;

/** A list of hex strings (dark to bright) to color numbers. */
const ramp = (list) => list.map(hex);
/**
 * Resample a ramp to exactly n steps, keeping its ends (the darkest and brightest stay put). Lets an effect
 * index steps by number (C[5]) whatever length of palette a caller passes.
 */
function fit(r, n) {
  r = r.map(hex);
  if (r.length === n) return r;
  return Array.from({ length: n }, (_, i) => r[Math.round((i * (r.length - 1)) / Math.max(1, n - 1))]);
}
/** The ramp step for t in 0..1, no blending: pixel art picks a color, it doesn't fade between two. */
const at = (r, t) => r[clamp(Math.floor(t * r.length), 0, r.length - 1)];
/** Blended color along a ramp (for light, where smooth is right). */
function blend(r, t) {
  const x = clamp(t) * (r.length - 1), i = Math.min(r.length - 2, Math.floor(x));
  return mix(r[i], r[i + 1], x - i);
}

// Hue-shifted ramps, dark to bright: shadows lean cool or deep, highlights lean warm or white.
// Effects take `palette` as an option, so any of these (or your own) can recolor them.
const PAL = {
  fire: ["#1f0b10", "#4a1118", "#8c1d1c", "#cc3a1a", "#f2701f", "#ffae35", "#ffe27a", "#fff8d6"],
  ember: ["#1a0a0e", "#3d1012", "#701a14", "#a8301a", "#e0561e", "#ff8a2a", "#ffc46a"],
  lava: ["#14060a", "#380a10", "#6e1210", "#ac2410", "#e8501a", "#ff8c2a", "#ffd25a"],
  smoke: ["#0e0c12", "#1d1a22", "#2e2a35", "#433e4b", "#5c5664", "#7b7484", "#a39cab"],
  dust: ["#1c1610", "#33281c", "#4f3f2c", "#6e5a40", "#927a58", "#b89f78", "#dcc8a2"],
  ice: ["#0c1430", "#162c5c", "#1f4f94", "#2f7fcc", "#58b4ec", "#9bdcff", "#d8f4ff", "#ffffff"],
  water: ["#081830", "#0e2e5a", "#14508c", "#1c76bc", "#36a2e0", "#78ccf4", "#c4ecff", "#ffffff"],
  electric: ["#0a0f2e", "#172a78", "#2550d0", "#3f8cff", "#7cc8ff", "#c8f0ff", "#ffffff"],
  volt: ["#24160a", "#5e3a0c", "#a8680f", "#e8a218", "#ffd23c", "#fff08a", "#ffffff"],
  poison: ["#0d1a0c", "#173a14", "#265e18", "#3f8a1e", "#6cb82a", "#a8e04a", "#e0ff8a"],
  holy: ["#2a1c08", "#5a3e10", "#9a6c18", "#d8a428", "#ffd84a", "#fff09a", "#fffbe6", "#ffffff"],
  heal: ["#08201a", "#0f3f2c", "#17663e", "#24924e", "#3ec466", "#7ee88a", "#c8ffc4", "#ffffff"],
  arcane: ["#140a26", "#2b1252", "#481c88", "#6b2cc0", "#9a48ec", "#c684ff", "#ecc8ff", "#ffffff"],
  shadow: ["#050308", "#0f0a18", "#1c1230", "#2c1a4a", "#432468", "#5e3290", "#8048b8", "#a970e0"],
  blood: ["#14040a", "#3a0a14", "#6a101c", "#a01824", "#d42a30", "#ff5a50", "#ff9a8a"],
  earth: ["#140e0a", "#2a1e14", "#47321e", "#69492a", "#8e6638", "#b88a52", "#dcb47c"],
  stone: ["#0e0e12", "#1c1c24", "#2c2c38", "#42424f", "#5c5c6b", "#7d7d8c", "#a4a4b2", "#d0d0da"],
  gold: ["#1e1206", "#4a2c08", "#86520c", "#c48412", "#f0b424", "#ffe066", "#fff6c4", "#ffffff"],
  leaf: ["#0c1a0e", "#163418", "#225224", "#357530", "#4f9a3a", "#7cc048", "#b4e070", "#e4ffb0"],
  wood: ["#160c06", "#2e1a0c", "#4a2c14", "#6a421e", "#8e5c2c", "#b47c40", "#d8a464"],
  metal: ["#0c0e14", "#1c2230", "#2e3648", "#4a5468", "#6e7a90", "#9aa6ba", "#d0d8e6", "#ffffff"],
  bone: ["#1a1814", "#3a352c", "#5e5648", "#8a806c", "#b8ad96", "#e4dcc8", "#fffaf0"],
  neon: ["#1a0516", "#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"],
  cyber: ["#041418", "#08303a", "#0c5260", "#108088", "#18b4b0", "#4ce8d8", "#b4fff0", "#ffffff"],
  matrix: ["#020a04", "#05200c", "#0a3c16", "#106624", "#1a9a34", "#3cd650", "#a4ffa8", "#e8ffe8"],
  candy: ["#ff4a5a", "#ff9a2a", "#ffe03c", "#5ad84a", "#3cc8ff", "#7a6cff", "#f53cd1"],
  night: ["#07060d", "#0c0a18", "#131026", "#1b1734", "#241f44", "#2f2956"],
};
/** The same ramps as color numbers. */
const RAMP = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, ramp(v)]));

const WHITE = hex("#ffffff");
const BLACK = hex("#000000");
const INK = hex("#0b0a10");
const PATCH = hex("#f53cd1");

};
/* ../pixelfx_src/src/core/particles.js */
__defs[5] = function (__exports) {
__get(__exports, "fly", () => fly);
__get(__exports, "flyV", () => flyV);
__get(__exports, "burst", () => burst);
__get(__exports, "cycle", () => cycle);
__get(__exports, "stream", () => stream);
__get(__exports, "Particles", () => Particles);
// Particles without a simulation: each one's position is a closed-form function of its age, so an effect
// can be drawn at any time t, scrubbed, looped and rendered to a sprite sheet frame by frame.

const { rng, clamp } = __req(3);

/**
 * Where a particle is after t seconds, launched from (x, y) at (vx, vy) px/s, under gravity g (px/s²,
 * positive is down) and linear drag (1/s). Returns [x, y].
 */
function fly(x, y, vx, vy, t, g = 0, drag = 0) {
  if (drag <= 0) return [x + vx * t, y + vy * t + 0.5 * g * t * t];
  const f = (1 - Math.exp(-drag * t)) / drag, vt = g / drag;
  return [x + vx * f, y + vt * t + (vy - vt) * f];
}
/** Its velocity at t, for streaks that point along the motion. Returns [vx, vy]. */
function flyV(vx, vy, t, g = 0, drag = 0) {
  if (drag <= 0) return [vx, vy + g * t];
  const e = Math.exp(-drag * t), vt = g / drag;
  return [vx * e, vt + (vy - vt) * e];
}

/**
 * n one-shot particles: fn(r, i) with a repeatable rng per particle (the same numbers every frame).
 */
function burst(n, seed, fn) {
  for (let i = 0; i < n; i++) fn(rng(seed, i), i);
}

/**
 * Particles that repeat every `period` seconds, for loops with no seam. Particle i is born at its own
 * phase in the period and lives `life` seconds (a number, or a function of an rng). For every live copy,
 * fn(age, life, r, i) is called; r is a fresh rng for particle i, the same each period.
 */
function cycle(t, period, count, seed, life, fn) {
  for (let i = 0; i < count; i++) {
    const g = rng(seed, i, 911);
    const born = g.next() * period;
    const L = typeof life === "function" ? life(g) : life;
    let age = (((t - born) % period) + period) % period;
    for (; age < L; age += period) fn(age, L, rng(seed, i), i);
  }
}

/**
 * Particles born at a steady rate between t0 and t1 (an emitter that stops): fn(age, life, r, i) for every
 * particle alive at t. rate is particles per second.
 */
function stream(t, t0, t1, rate, seed, life, fn) {
  const n = Math.floor((Math.min(t, t1) - t0) * rate);
  for (let i = 0; i <= n; i++) {
    const born = t0 + i / rate, g = rng(seed, i, 911), L = typeof life === "function" ? life(g) : life;
    const age = t - born;
    if (age >= 0 && age < L) fn(age, L, rng(seed, i), i);
  }
}

/** A simple simulated particle list, for effects that export create() and keep state. */
class Particles {
  constructor() {
    this.list = [];
  }
  /** p: { x, y, vx, vy, life, g?, drag?, ground?, bounce? } plus anything you want to draw with. */
  add(p) {
    p.age = 0;
    p.g ??= 0;
    p.drag ??= 0;
    this.list.push(p);
    return p;
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      if ((p.age += dt) >= p.life) {
        this.list.splice(i, 1);
        continue;
      }
      p.vx -= p.vx * p.drag * dt;
      p.vy += p.g * dt - p.vy * p.drag * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.ground !== undefined && p.y > p.ground) {
        p.y = p.ground;
        p.vy = -Math.abs(p.vy) * (p.bounce ?? 0.3);
        p.vx *= 0.7;
      }
    }
  }
  /** Life left, 1 at birth to 0 at death. */
  static k(p) {
    return clamp(1 - p.age / p.life);
  }
}

};
/* ../pixelfx_src/src/core/shapes.js */
__defs[6] = function (__exports) {
__get(__exports, "bolt", () => bolt);
__get(__exports, "forks", () => forks);
__get(__exports, "star", () => star);
__get(__exports, "ngon", () => ngon);
__get(__exports, "trail", () => trail);
// Point lists for shapes effects keep reaching for: lightning paths, stars, polygons, trails.

const { TAU } = __req(3);

/**
 * A jagged lightning path from (x0, y0) to (x1, y1) by midpoint displacement. jag is how far a midpoint
 * may move sideways, as a share of the segment's length. Returns [[x, y], ...].
 */
function bolt(r, x0, y0, x1, y1, { jag = 0.22, depth = 5 } = {}) {
  let pts = [[x0, y0], [x1, y1]];
  for (let d = 0; d < depth; d++) {
    const next = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
      const off = (r.next() * 2 - 1) * jag * L;
      next.push([(ax + bx) / 2 + (-dy / (L || 1)) * off, (ay + by) / 2 + (dx / (L || 1)) * off], pts[i]);
    }
    pts = next;
  }
  return pts;
}

/** Forks off a bolt path: count branches, each up to len px long. Returns a list of paths. */
function forks(r, path, { count = 3, len = 20, jag = 0.3, spread = 0.9 } = {}) {
  const out = [];
  for (let k = 0; k < count; k++) {
    const i = 1 + Math.floor(r.next() * (path.length - 2)), [x, y] = path[i], [px, py] = path[i - 1];
    const a = Math.atan2(y - py, x - px) + (r.next() < 0.5 ? -1 : 1) * spread * (0.4 + 0.6 * r.next());
    const l = len * (0.4 + 0.6 * r.next());
    out.push(bolt(r, x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, { jag, depth: 3 }));
  }
  return out;
}

/** A star: n points between radii r1 (tips) and r0 (inner corners). */
function star(cx, cy, r0, r1, n = 5, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n, r = i % 2 ? r0 : r1;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

/** A regular polygon with n sides. */
function ngon(cx, cy, r, n = 6, rot = 0) {
  return Array.from({ length: n }, (_, i) => [cx + Math.cos(rot + (i * TAU) / n) * r, cy + Math.sin(rot + (i * TAU) / n) * r]);
}

/** Positions of pos(t - i * dt) for i = 0..n-1: a moving thing's trail, newest first. */
function trail(pos, t, n, dt) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(pos(Math.max(0, t - i * dt)));
  return out;
}

};
/* ../pixelfx_src/src/core/sim.js */
__defs[7] = function (__exports) {
__get(__exports, "Particles", () => Particles);
__get(__exports, "Blazes", () => Blazes);
__get(__exports, "Bits", () => Bits);
__get(__exports, "Lights", () => Lights);
__get(__exports, "sparkle", () => sparkle);
__get(__exports, "flare", () => flare);
__get(__exports, "band", () => band);
__get(__exports, "crystal", () => crystal);
__get(__exports, "GRAVITY", () => GRAVITY);
__get(__exports, "FIRE_RAMP", () => FIRE_RAMP);
__get(__exports, "SMOKE_RAMP", () => SMOKE_RAMP);
__get(__exports, "P", () => P);
__get(__exports, "PF", () => PF);
__get(__exports, "B", () => B);
// Simulated particles, debris and lights, for effects that want real physics: sparks that streak and bounce
// off the floor, shards that tumble and settle, vapour and smoke that swell and thin, lights that flare and die.
// Adapted from Sprite Fusion's open-source pixel art VFX (https://www.spritefusion.com/pixel-art-vfx),
// MIT License, Copyright (c) 2026 Hugo Duprez. Units here are art pixels and seconds; draw through a Painter,
// so effects stay in local space and mirror or rotate like any other.

const { Rng, clamp, TAU } = __req(3);
const { hex, scale, mix, rgb, WHITE } = __req(4);

const GRAVITY = 950; // px/s²
const CROSS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const HOT = ["#fff3a6", "#ffe26b", "#ff8a2a", "#f2561d"].map(hex);
/** Fire from white-hot to smouldering, and smoke from fresh to thin: the ramps FIRE puffs and SMOKE walk down. */
const FIRE_RAMP = ["#ffffff", "#fff3a6", "#ffe26b", "#ffc23d", "#ff8a2a", "#f2561d", "#c9281f", "#8a1f17", "#4a1712"].map(hex);
const SMOKE_RAMP = ["#7b6f72", "#5d5660", "#433d48", "#2b2630", "#1a171e"].map(hex);
const rampAt = (r, t) => r[Math.min(r.length - 1, Math.max(0, Math.floor(t * r.length)))];

/** Particle kinds. */
const P = { SPARK: 0, MOTE: 1, STREAK: 2, FLAKE: 3, VAPOUR: 4, DUST: 5, STAR: 6, EMBER: 7, SMOKE: 8, FIRE: 9, BRAND: 10, GRIT: 11 };
/** Particle flags: SMOKES (a FIRE puff leaves smoke when it dies), BIG (bigger, slower smoke), BACK (draw behind). */
const PF = { SMOKES: 1, BIG: 2, BACK: 4 };
const SOFT = new Set([P.VAPOUR, P.DUST, P.SMOKE]);

/**
 * A particle system. opts: { seed, ground: (x) => floor y (local px; sparks bounce on it), sparks: [head..tail]
 * colors for SPARK, haze: color vapour glows with }.
 * spawn(kind, x, y, vx, vy, life, color, size); update(dt); draw(p, layer): "back" draws the soft kinds
 * (vapour, dust, smoke), "front" the rest, nothing for both.
 */
class Particles {
  constructor(opts = {}) {
    this.R = opts.rng ?? new Rng(opts.seed ?? 1);
    this.list = [];
    this.t = 0;
    this.ground = opts.ground ?? (() => Infinity);
    this.sparks = (opts.sparks ?? HOT).map(hex);
    this.haze = opts.haze === undefined ? null : hex(opts.haze);
    this.onLand = opts.onLand ?? null; // (x, y) when a BRAND hits the floor
  }
  /** delay: seconds before it appears; flag: PF bits. col 0 lets FIRE and SMOKE use their own ramps. */
  spawn(k, x, y, vx, vy, life, col = WHITE, size = 1, delay = 0, flag = 0) {
    this.list.push({ k, x, y, vx, vy, life, max: life, col: col ? hex(col) : 0, size, seed: this.R.next() * 100, delay, flag });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    this.t += dt;
    const R = this.R, t = this.t;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      if (p.delay > 0) {
        p.delay -= dt;
        continue;
      }
      if ((p.life -= dt) <= 0) {
        if (p.k === P.FIRE && p.flag & PF.SMOKES) {
          const big = p.flag & PF.BIG;
          this.spawn(P.SMOKE, p.x, p.y, p.vx * 0.6, p.vy * 0.6 - 6, big ? R.range(1.3, 2.3) : R.range(0.8, 1.4), 0, p.size * (big ? 0.85 : 0.7), 0, big ? PF.BIG : 0);
        }
        this.list.splice(i, 1);
        continue;
      }
      switch (p.k) {
        case P.FIRE:
          p.vy -= 95 * dt;
          p.vx += Math.sin(t * 17 + p.seed) * 30 * dt;
          p.vx -= p.vx * 5 * dt;
          p.vy -= p.vy * 3.2 * dt;
          break;
        case P.GRIT: {
          p.vy += GRAVITY * dt;
          p.vx -= p.vx * 0.8 * dt;
          const g = this.ground(p.x), ny = p.y + p.vy * dt;
          p.x += p.vx * dt;
          if (p.vy > 0 && p.y <= g && ny >= g) {
            p.y = g - 0.25;
            if (p.vy > 130 && R.chance(0.4)) (p.vy = -p.vy * 0.25), (p.vx = p.vx * 0.5 + R.range(-10, 10));
            else (p.vx = p.vy = 0), (p.life = Math.min(p.life, 0.5));
          } else p.y = ny;
          continue;
        }
        case P.BRAND: {
          // a burning chunk: arcs, trails flame, and starts a little fire where it lands
          p.vy += GRAVITY * 0.8 * dt;
          p.vx -= p.vx * 0.9 * dt;
          if (R.chance(0.9 * Math.min(1, dt * 60))) this.spawn(P.FIRE, p.x, p.y, p.vx * 0.1 + R.range(-7, 7), p.vy * 0.1 - 10, R.range(0.16, 0.32), 0, R.range(0.9, 1.7) * (0.5 + (p.life / p.max) * 0.6), 0, R.chance(0.4) ? PF.SMOKES : 0);
          const g = this.ground(p.x), ny = p.y + p.vy * dt;
          p.x += p.vx * dt;
          if (p.vy > 0 && p.y <= g && ny >= g) {
            this.onLand?.(p.x, g);
            this.list.splice(i, 1);
          } else p.y = ny;
          continue;
        }
        case P.SPARK: {
          p.vy += GRAVITY * 0.45 * dt;
          p.vx -= p.vx * 2.2 * dt;
          p.vy -= p.vy * 2.2 * dt;
          const g = this.ground(p.x), ny = p.y + p.vy * dt;
          p.x += p.vx * dt;
          if (p.vy > 0 && p.y <= g && ny >= g) (p.vy = -p.vy * 0.45), (p.vx *= 0.7), (p.y = g - 0.25);
          else p.y = ny;
          continue;
        }
        case P.STREAK: (p.vx += p.vx * 3 * dt), (p.vy += p.vy * 3 * dt); break;
        case P.FLAKE:
          p.vx -= p.vx * 2.2 * dt;
          p.vy -= p.vy * 2.2 * dt - 35 * dt;
          p.x += Math.sin(this.t * 2.5 + p.seed) * 7 * dt;
          break;
        case P.EMBER:
          p.vy += (-30 + Math.sin(t * 3 + p.seed) * 20) * dt;
          p.vx += Math.cos(t * 2.3 + p.seed) * 45 * dt;
          p.vx -= p.vx * 1.6 * dt;
          p.vy -= p.vy * 1.6 * dt;
          break;
        case P.SMOKE: {
          const big = p.flag & PF.BIG;
          p.vy -= (big ? 23 : 16) * dt;
          p.vx += Math.sin(t * 1.3 + p.seed) * 8 * dt;
          p.vx -= p.vx * 1.6 * dt;
          p.vy -= p.vy * 1.2 * dt;
          break;
        }
        case P.MOTE: p.vx -= p.vx * 0.6 * dt; p.vy -= p.vy * 0.6 * dt; break;
        default: {
          const drag = SOFT.has(p.k) ? 4 : 1.6;
          p.vx -= p.vx * drag * dt;
          p.vy -= p.vy * drag * dt + 5 * dt;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }
  draw(p, layer) {
    for (const q of this.list) {
      if (q.delay > 0) continue;
      if (layer && (SOFT.has(q.k) || q.flag & PF.BACK ? "back" : "front") !== layer) continue;
      const k = q.life / q.max, x = q.x, y = q.y, sp = Math.hypot(q.vx, q.vy) || 1, ux = q.vx / sp, uy = q.vy / sp;
      switch (q.k) {
        case P.SPARK: {
          const S = this.sparks, head = k > 0.6 ? S[0] : k > 0.3 ? S[1] : S[2], len = Math.min(9, 1 + sp * 0.022);
          p.line(x - ux * len, y - uy * len, x - ux * len * 0.4, y - uy * len * 0.4, k > 0.5 ? head : S[S.length - 1]);
          p.line(x - ux * len * 0.45, y - uy * len * 0.45, x, y, head);
          p.glow(x, y, 3, head, 0.45 * k);
          break;
        }
        case P.MOTE: {
          const len = Math.min(16, 0.5 + sp * 0.026) * q.size, a = k < 0.35 ? k / 0.35 : 1;
          p.line(x - ux * len, y - uy * len, x - ux * len * 0.35, y - uy * len * 0.35, scale(q.col, 0.55), a);
          p.line(x - ux * len * 0.4, y - uy * len * 0.4, x, y, q.col, a);
          p.glow(x, y, 2.5 + q.size, q.col, 0.4 * k);
          break;
        }
        case P.STREAK: {
          const L = clamp(sp / 30, 1, 7);
          for (let d = L; d >= 0; d -= 0.5) p.dot(x - ux * d, y - uy * d, d < 1 ? WHITE : d < L * 0.5 ? q.col : scale(q.col, 0.6), d < L * 0.5 ? 1 : 1.2 - d / L);
          p.glow(x, y, 4, q.col, 0.4);
          break;
        }
        case P.FLAKE: {
          const a = Math.min(1, k * 3);
          p.dot(x, y, q.col, a);
          if (q.size > 1.3) for (const [dx, dy] of CROSS) p.dot(x + dx, y + dy, scale(q.col, 0.8), a * 0.8);
          break;
        }
        case P.VAPOUR: {
          const r = q.size * (0.6 + (1 - k) * 0.9);
          p.disc(x, y, r, q.col, Math.pow(k, 1.3) * 0.45);
          if (this.haze) p.glow(x, y, r * 1.8, this.haze, 0.16 * k);
          break;
        }
        case P.DUST: p.disc(x, y, q.size * (0.6 + (1 - k) * 0.9), q.col, Math.pow(k, 1.3) * 0.7); break;
        case P.SMOKE: {
          // three soft discs: a body, a denser core sitting low, a lit cap while it's young
          const age = 1 - k, big = q.flag & PF.BIG;
          const r = q.size * (0.65 + Math.min(1, age * 2.5) * 0.45 + age * (big ? 0.5 : 0.4));
          const a = Math.min(1, age * 12) * Math.min(1, k * 2.4) * (big ? 0.7 : 0.58);
          const c = q.col ? mix(q.col, rampAt(SMOKE_RAMP, age), age) : rampAt(SMOKE_RAMP, age * 1.05);
          p.disc(x, y, r, c, a * 0.45);
          p.disc(x + r * 0.05, y + r * 0.06, r * 0.74, c, a * 0.62);
          if (age < 0.5) p.disc(x - r * 0.22, y - r * 0.3, r * 0.5, mix(c, WHITE, 0.12), a * 0.4 * (1 - age * 2));
          break;
        }
        case P.FIRE: {
          // a ball of flame that cools down the ramp as it rises: a darker rim, a lit core, a tongue on top
          const age = 1 - k, heat = Math.min(0.999, Math.pow(age, 0.62) + (q.seed % 1) * 0.1), F = FIRE_RAMP, n = F.length;
          const idx = Math.min(n - 2, Math.floor(heat * (n - 1)));
          const r = q.size * (0.55 + 0.45 * Math.min(1, age * 7)) * (1 - age * 0.55), c = F[idx];
          if (idx >= n - 2) p.disc(x, y, r, c, Math.min(1, k * 3) * 0.85);
          else {
            p.circle(x, y, r, F[Math.min(n - 1, idx + 2)]);
            p.circle(x - r * 0.16, y - r * 0.22, r * 0.78, c);
            if (r > 1.6) p.circle(x, y - r * 0.9, r * 0.42, c);
            if (idx <= 3 && r > 1.8) p.circle(x - r * 0.28, y - r * 0.34, r * 0.36, F[Math.max(0, idx - 1)]);
            if (idx < 6) p.glow(x, y, r * 2.4 + 2, c, 0.18 * k);
          }
          break;
        }
        case P.BRAND:
          p.circle(x, y, 1.6, HOT[3]);
          p.px(x, y, Math.sin(this.t * 40 + q.seed) > 0 ? HOT[0] : HOT[1]);
          p.px(x + 1, y, HOT[1]);
          p.glow(x, y, 7, HOT[2], 0.45);
          break;
        case P.GRIT:
          if (k > 0.25 || k * 4 > 0.5) {
            p.px(x, y, q.col);
            if (q.size >= 2) p.px(x + 1, y, q.col), p.px(x, y + 1, scale(q.col, 0.8)), p.px(x + 1, y + 1, scale(q.col, 0.7));
          }
          break;
        case P.EMBER: {
          const c = k > 0.6 ? this.sparks[0] : k > 0.3 ? this.sparks[1] : this.sparks[2];
          if (k < 0.25 && Math.sin(this.t * 40 + q.seed) < 0) break;
          p.px(x, y, c);
          if (q.size > 1.5) p.px(x, y + 1, this.sparks[this.sparks.length - 1]);
          p.glow(x, y, 3 + q.size, c, 0.35 * k);
          break;
        }
        default: {
          // STAR: a twinkling cross, arms set by size
          const tw = 0.6 + 0.4 * Math.sin(this.t * (8 + (q.seed % 5)) + q.seed);
          if (q.size < 1) {
            if (tw * k > 0.25) p.px(x, y, tw > 0.8 ? WHITE : q.col);
            p.glow(x, y, 3, q.col, 0.4 * k * tw);
            break;
          }
          sparkle(p, x, y, q.size * tw * Math.min(1, k * 3), q.col, scale(q.col, 0.75), 0.5 * k * tw);
        }
      }
    }
  }
}

/**
 * Little fires burning where something landed: add(x, y, life, power) feeds FIRE puffs (and the odd ember)
 * into a particle system, fading over its life. update(dt); drawBack(p) adds a hot pixel and a glow at its foot.
 */
class Blazes {
  constructor(ps) {
    this.ps = ps;
    this.list = [];
  }
  add(x, y, life, power) {
    this.list.push({ x, y, life, max: life, acc: this.ps.R.next(), power });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    const ps = this.ps, R = ps.R;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i];
      if ((b.life -= dt) <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      const k = b.life / b.max, intensity = b.power * (k > 0.7 ? 1 : 0.35 + (k / 0.7) * 0.65);
      for (b.acc += dt * (6 + 16 * intensity); b.acc > 1; b.acc--) {
        const s = R.range(1.2, 2.8) * intensity;
        ps.spawn(P.FIRE, b.x + R.range(-1.5, 1.5), b.y - s * 0.6, R.range(-6, 6), R.range(-30, -12), R.range(0.28, 0.6), 0, s, 0, PF.BACK | (R.chance(0.3) ? PF.SMOKES : 0));
        if (R.chance(0.06)) ps.spawn(P.EMBER, b.x, b.y - 1.5, R.range(-15, 15), R.range(-45, -15), R.range(0.6, 1.4), HOT[2], 1, 0, PF.BACK);
      }
    }
  }
  drawBack(p) {
    for (const b of this.list) {
      const k = b.life / b.max;
      p.px(b.x, b.y, k > 0.4 ? (Math.sin(b.life * 31 + b.x) > 0 ? HOT[1] : HOT[2]) : HOT[3]);
      p.glow(b.x, b.y, 6 + 5 * k * b.power, HOT[2], 0.3 * k * b.power);
    }
  }
}

/** Debris kinds. */
const B = { SHARD: 0, CHUNK: 1, DRIP: 2 };

/**
 * Rigid debris that tumbles, bounces and settles. add({ kind, x, y, vx, vy, a, va, s (size), c (color), ramp
 * (chunk shading, dark to bright), g (gravity scale), drag, bounce, life }); update(dt); draw(p).
 */
class Bits {
  constructor(opts = {}) {
    this.list = [];
    this.ground = opts.ground ?? (() => Infinity);
  }
  add(b) {
    const life = b.life ?? 1;
    this.list.push({ kind: B.SHARD, vx: 0, vy: 0, a: 0, va: 0, s: 1, c: WHITE, g: 1, drag: 0, bounce: 0, rest: false, ...b, life, max: life });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i];
      if ((b.life -= dt) <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      if (b.rest) continue;
      b.vy += GRAVITY * b.g * dt;
      b.vx -= b.vx * b.drag * dt;
      b.vy -= b.vy * b.drag * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.a += b.va * dt;
      const floor = this.ground(b.x), sp = b.vy;
      if (b.g <= 0 || b.y < floor || sp <= 0) continue;
      b.y = floor - 0.01;
      if (b.kind === B.DRIP) b.life = 0;
      else if (b.bounce > 0 && sp > 70) (b.vy = -sp * b.bounce), (b.vx *= 0.7), (b.va *= 0.6);
      else (b.rest = true), (b.vx = b.vy = 0);
    }
  }
  draw(p) {
    for (const b of this.list) {
      const a = Math.min(1, b.life / 0.4), ca = Math.cos(b.a), sa = Math.sin(b.a);
      if (b.kind === B.SHARD) {
        for (let d = -b.s / 2; d <= b.s / 2; d += 0.5) p.dot(b.x + ca * d, b.y + sa * d, d > b.s / 2 - 0.6 ? WHITE : hex(b.c), a);
      } else if (b.kind === B.DRIP) {
        p.dot(b.x, b.y, hex(b.c), a);
        p.dot(b.x, b.y - 1, hex(b.c), a * 0.5);
      } else {
        // a shaded chunk: lit top-left, dark bottom-right, a dark rim
        const R = (b.ramp ?? ["#1c2030", "#3a4a66", "#6e86a8", "#a8c0dc", "#e8f2ff"]).map(hex), n = R.length;
        const x = Math.round(b.x), y = Math.round(b.y), r = Math.ceil(b.s) + 1;
        for (let py = -r; py <= r; py++)
          for (let px = -r; px <= r; px++) {
            const u = (px + 0.5) * ca + (py + 0.5) * sa, v = -(px + 0.5) * sa + (py + 0.5) * ca;
            const d = Math.abs(u) / b.s + Math.abs(v) / (b.s * 0.62);
            if (d > 1.3) continue;
            p.dot(x + px, y + py, d > 1 ? R[0] : v < 0 ? (u < 0 ? R[n - 1] : R[n - 2]) : u < 0 ? R[n - 3] : R[Math.max(1, n - 4)], a);
          }
      }
    }
  }
}

/** Lights that flare and die: add(x, y, r, color, k, life); update(dt); draw(p). */
class Lights {
  constructor() {
    this.list = [];
  }
  add(x, y, r, color, k, life) {
    this.list.push({ x, y, r, color: hex(color), k, life, max: life });
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) if ((this.list[i].life -= dt) <= 0) this.list.splice(i, 1);
  }
  draw(p) {
    for (const l of this.list) {
      const k = l.life / l.max;
      p.glow(l.x, l.y, l.r * (0.55 + 0.45 * k), l.color, l.k * k * k);
    }
  }
}

/** A star glint: arms of length arm in color c with tips in tip, a white heart, light. */
function sparkle(p, x, y, arm, c, tip = c, k = 0.6) {
  const n = Math.round(arm);
  if (n < 1) return;
  const X = Math.floor(x), Y = Math.floor(y);
  for (let d = 1; d <= n; d++) {
    const cc = d > n * 0.6 ? tip : c;
    for (const [dx, dy] of CROSS) p.px(X + dx * d, Y + dy * d, cc);
  }
  if (n >= 3) for (const [dx, dy] of DIAG) p.px(X + dx, Y + dy, c);
  if (n >= 6) for (const [dx, dy] of DIAG) p.px(X + dx * 2, Y + dy * 2, tip);
  p.px(X, Y, WHITE);
  p.glow(x, y, 4 + n * 2, c, k);
}

/** An 8-ray flare: long rays on the axes, shorter between, fading out along their length. ramp dark to bright. */
function flare(p, x, y, L, k, ramp) {
  if (L < 1) return;
  const R = ramp.map(hex), n = R.length;
  for (let i = 0; i < 8; i++) {
    const an = (i * Math.PI) / 4, len = i % 4 === 0 ? L : i % 2 === 0 ? L * 0.6 : L * 0.3, ca = Math.cos(an), sa = Math.sin(an);
    for (let d = 0; d <= len; d += 0.5) {
      const u = d / len;
      p.dot(x + ca * d, y + sa * d, u < 0.35 ? WHITE : u < 0.7 ? R[n - 2] : R[n - 3], u < 0.6 ? 1 : k * 1.5 * (1 - u) + 0.2);
    }
  }
}

/**
 * A ring on a tilted plane (sy squashes it: 0.16 lies on the floor, 1 stands up), thickness th inward, alpha k,
 * colored by depth through the band with ramp (dark to bright). keep(angle) picks which part to draw, so the
 * far half can go behind things and the near half in front: (g) => Math.sin(g) < 0 is the far half.
 */
function band(p, cx, cy, r, sy, th, k, ramp, keep = () => true, hot = false) {
  if (r <= 0 || k <= 0) return;
  const R = ramp.map(hex), n = R.length;
  for (let j = 0, m = Math.ceil(r * TAU * 1.2); j < m; j++) {
    const ang = (j / m) * TAU, ca = Math.cos(ang), sa = Math.sin(ang);
    if (!keep(ang)) continue;
    for (let o = th; o >= 0; o -= 0.5) {
      const u = o / th, c = u < 0.15 ? (hot ? WHITE : R[n - 1]) : u < 0.4 ? R[n - 2] : u < 0.7 ? R[n - 3] : R[n - 4];
      p.dot(cx + ca * (r - o), cy + sa * (r - o) * sy, c, k * (u < 0.4 ? 1.2 : 1.15 - u));
    }
  }
}

/**
 * A faceted crystal spike standing on (x, base), height h, base width w, leaning lean px at the tip, shaded in
 * ramp (dark to bright, 6+ steps): a lit ridge, a bright left face, a darker right face, a dark rim.
 * opts: { a (alpha), white (flash it white), glint (0..1 height of a sweeping highlight, or -1) }.
 */
function crystal(p, x, base, h, w, lean, ramp, opts = {}) {
  if (h < 1.5) return;
  const R = ramp.map(hex), n = R.length, C = (i) => R[Math.max(0, n - 1 - i)];
  const a = opts.a ?? 1, top = base - h, ridge0 = x - w * 0.14, glint = opts.glint ?? -1;
  const inside = (px, py) => {
    const u = (base - (py + 0.5)) / h;
    return u >= 0 && u <= 1 && Math.abs(px + 0.5 - (x + lean * u)) <= (w / 2) * (1 - u) + 0.35;
  };
  for (let py = Math.floor(top) - 1; py < Math.ceil(base); py++)
    for (let px = Math.floor(x - w / 2 - Math.abs(lean) - 2); px <= Math.ceil(x + w / 2 + Math.abs(lean) + 2); px++) {
      if (!inside(px, py)) {
        if (inside(px - 1, py) || inside(px + 1, py) || inside(px, py + 1) || (inside(px, py - 1) && py < base - 1)) p.dot(px, py, R[0], a);
        continue;
      }
      if (opts.white) {
        p.dot(px, py, WHITE, a);
        continue;
      }
      const u = (base - (py + 0.5)) / h, rx = ridge0 + (x + lean - ridge0) * u, c = x + lean * u, hw = (w / 2) * (1 - u) + 0.35, fx = px + 0.5;
      let col = u > 0.9 ? WHITE : Math.abs(fx - rx) < 0.55 ? C(1)
        : fx < rx ? (fx - (c - hw) < 1 ? C(1) : (fx - (c - hw)) / Math.max(1, rx - (c - hw)) > 0.55 ? C(2) : C(3))
        : c + hw - fx < 1.2 ? C(Math.min(n - 2, 6)) : (fx - rx) / Math.max(1, c + hw - rx) > 0.5 ? C(5) : C(4);
      if (glint >= 0 && fx <= rx + 0.6) {
        const g = Math.abs(u - glint);
        if (g < 0.05) col = WHITE;
        else if (g < 0.1) col = C(1);
      }
      p.dot(px, py, col, a);
    }
}

};
/* ../pixelfx_src/src/core/font.js */
__defs[9] = function (__exports) {
__get(__exports, "textWidth", () => textWidth);
__get(__exports, "rasterText", () => rasterText);
__get(__exports, "FONTS", () => FONTS);
// Two pixel fonts: "mini" (3x5) for small numbers and tags, "big" (5x7) for words like LEVEL UP.
// Glyphs are trimmed to their inked columns, so text sets proportionally (an I is narrower than an M).

const MINI = {
  A: ".#.|#.#|###|#.#|#.#", B: "##.|#.#|##.|#.#|##.", C: ".##|#..|#..|#..|.##", D: "##.|#.#|#.#|#.#|##.",
  E: "###|#..|##.|#..|###", F: "###|#..|##.|#..|#..", G: ".##|#..|#.#|#.#|.##", H: "#.#|#.#|###|#.#|#.#",
  I: "###|.#.|.#.|.#.|###", J: "..#|..#|..#|#.#|.#.", K: "#.#|#.#|##.|#.#|#.#", L: "#..|#..|#..|#..|###",
  M: "#.#|###|###|#.#|#.#", N: "##.|#.#|#.#|#.#|#.#", O: ".#.|#.#|#.#|#.#|.#.", P: "##.|#.#|##.|#..|#..",
  Q: ".#.|#.#|#.#|##.|.##", R: "##.|#.#|##.|#.#|#.#", S: ".##|#..|.#.|..#|##.", T: "###|.#.|.#.|.#.|.#.",
  U: "#.#|#.#|#.#|#.#|###", V: "#.#|#.#|#.#|#.#|.#.", W: "#.#|#.#|###|###|#.#", X: "#.#|#.#|.#.|#.#|#.#",
  Y: "#.#|#.#|.#.|.#.|.#.", Z: "###|..#|.#.|#..|###",
  0: "###|#.#|#.#|#.#|###", 1: ".#.|##.|.#.|.#.|###", 2: "##.|..#|.#.|#..|###", 3: "##.|..#|.#.|..#|##.",
  4: "#.#|#.#|###|..#|..#", 5: "###|#..|##.|..#|##.", 6: ".##|#..|###|#.#|###", 7: "###|..#|.#.|.#.|.#.",
  8: "###|#.#|###|#.#|###", 9: "###|#.#|###|..#|##.",
  "+": "...|.#.|###|.#.|...", "-": "...|...|###|...|...", "!": "#|#|#|.|#", "?": "##.|..#|.#.|...|.#.",
  ".": ".|.|.|.|#", ",": "..|..|..|.#|#.", ":": ".|#|.|#|.", "/": "..#|..#|.#.|#..|#..",
  "%": "#.#|..#|.#.|#..|#.#", x: "...|#.#|.#.|#.#|...", "*": "#.#|.#.|#.#|...|...", "'": "#|#|.|.|.",
  "(": ".#|#.|#.|#.|.#", ")": "#.|.#|.#|.#|#.", "<": "..#|.#.|#..|.#.|..#", ">": "#..|.#.|..#|.#.|#..",
  "=": "...|###|...|###|...", _: "...|...|...|...|###", "#": "#.#|###|#.#|###|#.#",
};

const BIG = {
  A: ".###.|#...#|#...#|#####|#...#|#...#|#...#", B: "####.|#...#|#...#|####.|#...#|#...#|####.",
  C: ".###.|#...#|#....|#....|#....|#...#|.###.", D: "####.|#...#|#...#|#...#|#...#|#...#|####.",
  E: "#####|#....|#....|####.|#....|#....|#####", F: "#####|#....|#....|####.|#....|#....|#....",
  G: ".###.|#...#|#....|#.###|#...#|#...#|.####", H: "#...#|#...#|#...#|#####|#...#|#...#|#...#",
  I: "###|.#.|.#.|.#.|.#.|.#.|###", J: "..###|...#.|...#.|...#.|...#.|#..#.|.##..",
  K: "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#", L: "#....|#....|#....|#....|#....|#....|#####",
  M: "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#", N: "#...#|#...#|##..#|#.#.#|#..##|#...#|#...#",
  O: ".###.|#...#|#...#|#...#|#...#|#...#|.###.", P: "####.|#...#|#...#|####.|#....|#....|#....",
  Q: ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#", R: "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
  S: ".####|#....|#....|.###.|....#|....#|####.", T: "#####|..#..|..#..|..#..|..#..|..#..|..#..",
  U: "#...#|#...#|#...#|#...#|#...#|#...#|.###.", V: "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..",
  W: "#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.", X: "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
  Y: "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..", Z: "#####|....#|...#.|..#..|.#...|#....|#####",
  0: ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.", 1: ".#.|##.|.#.|.#.|.#.|.#.|###",
  2: ".###.|#...#|....#|...#.|..#..|.#...|#####", 3: "#####|...#.|..#..|...#.|....#|#...#|.###.",
  4: "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.", 5: "#####|#....|####.|....#|....#|#...#|.###.",
  6: "..##.|.#...|#....|####.|#...#|#...#|.###.", 7: "#####|....#|...#.|..#..|.#...|.#...|.#...",
  8: ".###.|#...#|#...#|.###.|#...#|#...#|.###.", 9: ".###.|#...#|#...#|.####|....#|...#.|.##..",
  "!": "#|#|#|#|#|.|#", "?": ".###.|#...#|....#|...#.|..#..|.....|..#..", "+": ".....|..#..|..#..|#####|..#..|..#..|.....",
  "-": "....|....|....|####|....|....|....", ".": ".|.|.|.|.|.|#", ",": "..|..|..|..|..|.#|#.", ":": ".|.|#|.|.|#|.",
  "/": "....#|....#|...#.|..#..|.#...|#....|#....", "%": "##...|##..#|...#.|..#..|.#...|#..##|...##",
  x: ".....|.....|#...#|.#.#.|..#..|.#.#.|#...#", "*": ".....|..#..|#.#.#|.###.|#.#.#|..#..|.....", "'": "#|#|.|.|.|.|.",
  "<": "...#|..#.|.#..|#...|.#..|..#.|...#", ">": "#...|.#..|..#.|...#|..#.|.#..|#...", "=": "....|....|####|....|####|....|....",
  "(": "..#|.#.|#..|#..|#..|.#.|..#", ")": "#..|.#.|..#|..#|..#|.#.|#..", "#": ".#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.",
};

function build(table, h) {
  const out = {};
  for (const [ch, src] of Object.entries(table)) {
    const rows = src.split("|");
    out[ch] = { w: rows[0].length, rows: rows.map((r) => [...r].map((c) => c === "#")) };
    if (rows.length !== h) throw new Error(`glyph ${ch} has ${rows.length} rows, expected ${h}`);
  }
  return out;
}

const FONTS = {
  mini: { h: 5, space: 2, gap: 1, glyphs: build(MINI, 5) },
  big: { h: 7, space: 3, gap: 1, glyphs: build(BIG, 7) },
};

/** Width in font pixels of a string (before scaling). */
function textWidth(str, font = "mini") {
  const F = FONTS[font];
  let w = 0;
  for (const ch of String(str)) {
    const g = F.glyphs[ch] ?? F.glyphs[ch.toUpperCase()];
    w += (g ? g.w : F.space) + F.gap;
  }
  return Math.max(0, w - F.gap);
}

/** Calls plot(x, y) for every inked font pixel of str, with the top-left of the text at (0, 0). */
function rasterText(str, font, plot) {
  const F = FONTS[font];
  let x = 0;
  for (const ch of String(str)) {
    const g = F.glyphs[ch] ?? F.glyphs[ch.toUpperCase()];
    if (!g) {
      x += F.space + F.gap;
      continue;
    }
    for (let r = 0; r < F.h; r++) for (let c = 0; c < g.w; c++) if (g.rows[r][c]) plot(x + c, r);
    x += g.w + F.gap;
  }
}

};
/* ../pixelfx_src/src/core/painter.js */
__defs[8] = function (__exports) {
__get(__exports, "Painter", () => Painter);
// The painter draws into a frame's two buffers: `color` (opaque pixels, faded with ordered dither, never
// blended) and `light` (additive glow, composited on top). Effects draw in local coordinates around their
// origin; the painter places, mirrors and rotates them, so an effect never needs to know where it is.

const { clamp } = __req(3);
const { hex } = __req(4);
const { rasterText, textWidth, FONTS } = __req(9);

// 4x4 ordered (Bayer) thresholds: a pixel at alpha a is drawn when a is above its cell's threshold.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const OUT = { c: 0, a: 1, l: 0, k: 0 };
const sprites = new WeakMap();
const call = (v, ...args) => (typeof v === "function" ? v(...args) : v);

class Painter {
  constructor(frame) {
    this.frame = frame;
    this.reset();
  }

  /** Re-read the frame and clear placement, fade and light strength. */
  reset() {
    const f = this.frame;
    this.w = f.w; this.h = f.h; this.ox = f.ox | 0; this.oy = f.oy | 0; this.C = f.color; this.L = f.light;
    this.tx = 0; this.ty = 0; this.fx = 1; this.cs = 1; this.sn = 0;
    this.fade = 1; this.lightK = 1; this.layer = "front";
    return this;
  }

  /** Put the effect's origin at (x, y) in frame space, mirrored if flip, rotated by angle (radians). */
  place(x, y, flip = false, angle = 0) {
    this.tx = x; this.ty = y; this.fx = flip ? -1 : 1; this.cs = Math.cos(angle); this.sn = Math.sin(angle);
    return this;
  }

  // ---- transforms: local (effect) space <-> screen (frame) space
  toX(x, y) { return this.tx + x * this.fx * this.cs - y * this.sn; }
  toY(x, y) { return this.ty + x * this.fx * this.sn + y * this.cs; }
  fromX(sx, sy) { const dx = sx - this.tx, dy = sy - this.ty; return (dx * this.cs + dy * this.sn) * this.fx; }
  fromY(sx, sy) { const dx = sx - this.tx, dy = sy - this.ty; return -dx * this.sn + dy * this.cs; }
  // the screen pixel of the local pixel cell holding (x, y): mirrors and rotations land on whole cells
  cellX(x, y) { return Math.floor(this.toX(Math.floor(x) + 0.5, Math.floor(y) + 0.5)); }
  cellY(x, y) { return Math.floor(this.toY(Math.floor(x) + 0.5, Math.floor(y) + 0.5)); }

  // ---- raw writes, screen space, whole pixels. Color 0 means "nothing": it never erases what's there.
  put(sx, sy, c, a = 1) {
    if (!c) return;
    a *= this.fade;
    if (a < 1 && a <= BAYER[((sy & 3) << 2) | (sx & 3)]) return;
    const x = sx - this.ox, y = sy - this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.C[y * this.w + x] = c;
  }
  add(sx, sy, c, k = 1) {
    k *= this.fade * this.lightK;
    if (k <= 0.004) return;
    const x = sx - this.ox, y = sy - this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x, d = this.L[i];
    const r = Math.min(255, (d & 255) + (c & 255) * k) | 0;
    const g = Math.min(255, ((d >>> 8) & 255) + ((c >>> 8) & 255) * k) | 0;
    const b = Math.min(255, ((d >>> 16) & 255) + ((c >>> 16) & 255) * k) | 0;
    this.L[i] = (255 << 24) | (b << 16) | (g << 8) | r;
  }
  /**
   * Blend a color over what's there at alpha a (0..1), keeping the result's own alpha: soft smoke, vapour and
   * mist. Use dithered dot() for hard pixel fades and blend() for translucent volumes.
   */
  blendPx(sx, sy, c, a) {
    a *= this.fade;
    if (!c || a <= 0.004) return;
    const x = sx - this.ox, y = sy - this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x, d = this.C[i], da = (d >>> 24) / 255, oa = a + da * (1 - a), k = a / oa;
    const ch = (s) => ((((c >>> s) & 255) * k + ((d >>> s) & 255) * (1 - k)) & 255);
    this.C[i] = (((oa * 255) & 255) << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0);
  }
  /** Translucent pixel at a local point. */
  blend(x, y, c, a) { this.blendPx(this.cellX(x, y), this.cellY(x, y), c, a); }
  /** A translucent disc: puffs of smoke, vapour, dust. c and a may be functions of (d: 0 center..1 rim, angle). */
  disc(cx, cy, r, c, a) {
    if (r < 0.5) return this.blend(cx, cy, call(c, 0, 0), call(a, 0, 0));
    this.each(cx - r, cy - r, cx + r, cy + r, (x, y, sx, sy) => {
      const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
      if (d2 > r * r) return;
      const d = Math.sqrt(d2) / r, ang = Math.atan2(dy, dx);
      this.blendPx(sx, sy, call(c, d, ang), call(a, d, ang));
    });
  }
  /** Read back the color under a local point (0 if empty). */
  get(x, y) {
    const sx = this.cellX(x, y) - this.ox, sy = this.cellY(x, y) - this.oy;
    return sx < 0 || sy < 0 || sx >= this.w || sy >= this.h ? 0 : this.C[sy * this.w + sx];
  }

  // ---- pixels
  /** One opaque pixel. */
  px(x, y, c) { this.put(this.cellX(x, y), this.cellY(x, y), c, 1); }
  /** One pixel at alpha a (0..1), faded by ordered dither. */
  dot(x, y, c, a = 1) { if (a > 0) this.put(this.cellX(x, y), this.cellY(x, y), c, a); }
  /** Add light to one pixel. */
  light(x, y, c, k = 1) { this.add(this.cellX(x, y), this.cellY(x, y), c, k); }

  /**
   * Visit every screen pixel whose center falls in the local box [x0, x1] x [y0, y1], with that center in
   * local space: fn(lx, ly, sx, sy). The basis of every filled shape, so shapes mirror and rotate exactly.
   */
  each(x0, y0, x1, y1, fn) {
    let ax = Infinity, bx = -Infinity, ay = Infinity, by = -Infinity;
    for (let k = 0; k < 4; k++) {
      const x = k & 1 ? x1 : x0, y = k & 2 ? y1 : y0, sx = this.toX(x, y), sy = this.toY(x, y);
      if (sx < ax) ax = sx; if (sx > bx) bx = sx; if (sy < ay) ay = sy; if (sy > by) by = sy;
    }
    const sx0 = Math.max(Math.floor(ax), this.ox), sx1 = Math.min(Math.ceil(bx), this.ox + this.w - 1);
    const sy0 = Math.max(Math.floor(ay), this.oy), sy1 = Math.min(Math.ceil(by), this.oy + this.h - 1);
    for (let sy = sy0; sy <= sy1; sy++)
      for (let sx = sx0; sx <= sx1; sx++) {
        const cx = sx + 0.5, cy = sy + 0.5;
        fn(this.fromX(cx, cy), this.fromY(cx, cy), sx, sy);
      }
  }

  /**
   * A pixel shader over a local box. fn(x, y, out) returns a color, or sets out.c (color), out.a (alpha),
   * out.l (light color, defaults to out.c) and out.k (light amount). Return nothing to leave the pixel alone.
   */
  shade(x0, y0, x1, y1, fn) {
    const o = OUT;
    this.each(x0, y0, x1, y1, (lx, ly, sx, sy) => {
      o.c = 0; o.a = 1; o.l = 0; o.k = 0;
      const c = fn(lx, ly, o) || o.c;
      if (c) this.put(sx, sy, c, o.a);
      if (o.k > 0) this.add(sx, sy, o.l || c, o.k);
    });
  }

  // ---- shapes. Colors (c) and alphas (a) can be numbers or functions of the shape's own coordinates.
  /** 1 px line. c and a may be functions of u (0 at the start, 1 at the end). */
  line(x0, y0, x1, y1, c, a = 1) {
    let sx = this.cellX(x0, y0), sy = this.cellY(x0, y0);
    const ex = this.cellX(x1, y1), ey = this.cellY(x1, y1);
    const dx = Math.abs(ex - sx), dy = -Math.abs(ey - sy), stepx = sx < ex ? 1 : -1, stepy = sy < ey ? 1 : -1;
    const n = Math.max(dx, -dy) || 1, fc = typeof c === "function", fa = typeof a === "function";
    let err = dx + dy, i = 0;
    for (;;) {
      const u = i++ / n;
      this.put(sx, sy, fc ? c(u) : c, fa ? a(u) : a);
      if (sx === ex && sy === ey) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; sx += stepx; }
      if (e2 <= dx) { err += dx; sy += stepy; }
    }
  }
  /** Lines through a list of points [[x, y], ...]. */
  polyline(pts, c, a = 1) {
    for (let i = 1; i < pts.length; i++) this.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], c, a);
  }
  /** Thick segment with round ends. c and a may be functions of (u along, v across: 0 center, 1 edge). */
  beam(x0, y0, x1, y1, width, c, a = 1) {
    const r = width / 2, dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1e-9;
    this.shade(Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r, (x, y, o) => {
      const u = clamp(((x - x0) * dx + (y - y0) * dy) / L2), px = x0 + dx * u - x, py = y0 + dy * u - y;
      const d2 = px * px + py * py;
      if (d2 > r * r) return;
      const v = Math.sqrt(d2) / r;
      o.c = call(c, u, v);
      o.a = call(a, u, v);
    });
  }
  /** Filled disc. c and a may be functions of (d: 0 center to 1 rim, angle). */
  circle(cx, cy, r, c, a = 1) {
    if (r < 0.6) return this.dot(cx, cy, call(c, 0, 0), call(a, 0, 0));
    this.shade(cx - r, cy - r, cx + r, cy + r, (x, y, o) => {
      const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
      if (d2 > r * r) return;
      const d = Math.sqrt(d2) / r, ang = Math.atan2(dy, dx);
      o.c = call(c, d, ang);
      o.a = call(a, d, ang);
    });
  }
  /** Ellipse. c and a may be functions of (d: 0 center to 1 rim, angle). */
  ellipse(cx, cy, rx, ry, c, a = 1) {
    if (rx <= 0 || ry <= 0) return;
    this.shade(cx - rx, cy - ry, cx + rx, cy + ry, (x, y, o) => {
      const dx = (x - cx) / rx, dy = (y - cy) / ry, d2 = dx * dx + dy * dy;
      if (d2 > 1) return;
      const d = Math.sqrt(d2), ang = Math.atan2(dy, dx);
      o.c = call(c, d, ang);
      o.a = call(a, d, ang);
    });
  }
  /** Ring from radius r - w to r. c and a may be functions of (v: 0 inner to 1 outer, angle). */
  ring(cx, cy, r, w, c, a = 1) {
    const r0 = Math.max(0, r - w);
    this.shade(cx - r, cy - r, cx + r, cy + r, (x, y, o) => {
      const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
      if (d2 > r * r || d2 < r0 * r0) return;
      const v = w > 0 ? (Math.sqrt(d2) - r0) / (r - r0 || 1) : 1, ang = Math.atan2(dy, dx);
      o.c = call(c, v, ang);
      o.a = call(a, v, ang);
    });
  }
  /**
   * Band of a ring from angle a0 to a1 (radians, a1 > a0), radius r - w to r: the slash and smear shape.
   * c and a may be functions of (u: 0 at a0 to 1 at a1, v: 0 inner to 1 outer). w can be a function of u
   * for a crescent that tapers at both ends.
   */
  arc(cx, cy, r, w, a0, a1, c, a = 1) {
    const span = a1 - a0, wf = typeof w === "function";
    this.shade(cx - r, cy - r, cx + r, cy + r, (x, y, o) => {
      const dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy);
      if (d > r) return;
      let ang = Math.atan2(dy, dx) - a0;
      ang -= Math.floor(ang / (Math.PI * 2)) * Math.PI * 2;
      if (ang > span) return;
      const u = ang / span, ww = wf ? w(u) : w;
      if (ww <= 0 || d < r - ww) return;
      const v = (d - (r - ww)) / ww;
      o.c = call(c, u, v);
      o.a = call(a, u, v);
    });
  }
  /** Filled rectangle. */
  rect(x, y, w, h, c, a = 1) {
    if (this.sn === 0) {
      const X0 = Math.round(x), Y0 = Math.round(y), X1 = Math.round(x + w), Y1 = Math.round(y + h);
      for (let yy = Y0; yy < Y1; yy++) for (let xx = X0; xx < X1; xx++) this.put(this.cellX(xx, yy), this.cellY(xx, yy), c, a);
      return;
    }
    this.shade(x, y, x + w, y + h, (lx, ly, o) => {
      if (lx < x || ly < y || lx >= x + w || ly >= y + h) return;
      o.c = c; o.a = a;
    });
  }
  /** Filled polygon from points [[x, y], ...] (even-odd rule). */
  poly(pts, c, a = 1) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const n = pts.length;
    this.shade(x0, y0, x1, y1, (x, y, o) => {
      let inside = false;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (!inside) return;
      o.c = call(c, x, y);
      o.a = call(a, x, y);
    });
  }
  tri(x0, y0, x1, y1, x2, y2, c, a = 1) { this.poly([[x0, y0], [x1, y1], [x2, y2]], c, a); }

  // ---- light
  /** Radial glow into the light buffer: k at the center, falling to 0 at radius r. */
  glow(x, y, r, c, k = 0.5) {
    if (r < 1 || k <= 0.004) return;
    const cx = this.toX(x, y), cy = this.toY(x, y);
    const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r), y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r);
    for (let sy = y0; sy <= y1; sy++) {
      const dy = (sy + 0.5 - cy) / r;
      for (let sx = x0; sx <= x1; sx++) {
        const dx = (sx + 0.5 - cx) / r, d = dx * dx + dy * dy;
        if (d >= 1) continue;
        const f = 1 - Math.sqrt(d);
        this.add(sx, sy, c, f * f * k);
      }
    }
  }
  /** Glow around a segment (a soft beam of light). */
  glowLine(x0, y0, x1, y1, r, c, k = 0.5) {
    if (r < 1 || k <= 0.004) return;
    const ax = this.toX(x0, y0), ay = this.toY(x0, y0), bx = this.toX(x1, y1), by = this.toY(x1, y1);
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-9;
    const X0 = Math.floor(Math.min(ax, bx) - r), X1 = Math.ceil(Math.max(ax, bx) + r);
    const Y0 = Math.floor(Math.min(ay, by) - r), Y1 = Math.ceil(Math.max(ay, by) + r);
    for (let sy = Y0; sy <= Y1; sy++)
      for (let sx = X0; sx <= X1; sx++) {
        const px = sx + 0.5, py = sy + 0.5, u = clamp(((px - ax) * dx + (py - ay) * dy) / L2);
        const ex = ax + dx * u - px, ey = ay + dy * u - py, d = Math.sqrt(ex * ex + ey * ey) / r;
        if (d >= 1) continue;
        const f = 1 - d;
        this.add(sx, sy, c, f * f * k);
      }
  }
  /** Glow hugging a circle of radius R (a shockwave's light), falling off over width r. */
  glowRing(x, y, R, r, c, k = 0.5) {
    if (r < 1 || k <= 0.004) return;
    const cx = this.toX(x, y), cy = this.toY(x, y), E = R + r;
    for (let sy = Math.floor(cy - E); sy <= Math.ceil(cy + E); sy++)
      for (let sx = Math.floor(cx - E); sx <= Math.ceil(cx + E); sx++) {
        const d = Math.abs(Math.hypot(sx + 0.5 - cx, sy + 0.5 - cy) - R) / r;
        if (d >= 1) continue;
        const f = 1 - d;
        this.add(sx, sy, c, f * f * k);
      }
  }

  // ---- sprites, text, masks
  /**
   * A little sprite from strings: rows like ["..##..", ".#oo#."], pal maps characters to colors
   * ({ "#": "#222034", o: 0xff... }); "." and " " are empty. Top-left at (x, y).
   * opts: { scale, a, flip (mirror left-right), flipY (upside down), tint (draw every pixel in one color) }.
   */
  sprite(rows, pal, x, y, opts = {}) {
    let s = sprites.get(rows);
    if (!s) sprites.set(rows, (s = rows.map((r) => [...r])));
    const k = opts.scale ?? 1, a = opts.a ?? 1, W = s[0]?.length ?? 0, cache = {};
    for (let r = 0; r < s.length; r++)
      for (let q = 0; q < s[r].length; q++) {
        const ch = s[r][q];
        if (ch === "." || ch === " ") continue;
        let c = opts.tint;
        if (c === undefined) {
          c = cache[ch];
          if (c === undefined) c = cache[ch] = pal[ch] === undefined ? 0 : hex(pal[ch]);
        }
        if (!c) continue;
        const col = opts.flip ? W - 1 - q : q, row = opts.flipY ? s.length - 1 - r : r;
        if (k === 1) this.dot(x + col, y + row, c, a);
        else this.rect(x + col * k, y + row * k, k, k, c, a);
      }
  }
  /**
   * Pixel text. opts: { font: "mini" (3x5) | "big" (5x7), scale, align: "left" | "center" | "right",
   * outline: color, shadow: color, a }. (x, y) is the top of the text, at the left, center or right.
   */
  text(str, x, y, c, opts = {}) {
    const font = opts.font ?? "mini", k = opts.scale ?? 1, a = opts.a ?? 1, w = textWidth(str, font) * k;
    const left = Math.round(opts.align === "center" ? x - w / 2 : opts.align === "right" ? x - w : x), top = Math.round(y);
    const ol = opts.outline, sh = opts.shadow;
    if (ol !== undefined) rasterText(str, font, (gx, gy) => this.rect(left + gx * k - 1, top + gy * k - 1, k + 2, k + 2, ol, a));
    if (sh !== undefined) rasterText(str, font, (gx, gy) => this.rect(left + gx * k + 1, top + gy * k + 1, k, k, sh, a));
    rasterText(str, font, (gx, gy) => this.rect(left + gx * k, top + gy * k, k, k, call(c, gx, gy), a));
  }
  /** Size of text in pixels: [w, h]. */
  measure(str, opts = {}) {
    const k = opts.scale ?? 1;
    return [textWidth(str, opts.font ?? "mini") * k, FONTS[opts.font ?? "mini"].h * k];
  }
  /** Fill a mask ({ w, h, data }) with its top-left at (x, y). c may be a function of (mx, my). */
  mask(m, x, y, c, a = 1) {
    for (let my = 0; my < m.h; my++)
      for (let mx = 0; mx < m.w; mx++) if (m.data[my * m.w + mx]) this.dot(x + mx, y + my, call(c, mx, my), call(a, mx, my));
  }
  /** The 1 px outline just outside a mask. */
  outline(m, x, y, c, a = 1) {
    const at = (mx, my) => mx >= 0 && my >= 0 && mx < m.w && my < m.h && m.data[my * m.w + mx];
    for (let my = -1; my <= m.h; my++)
      for (let mx = -1; mx <= m.w; mx++)
        if (!at(mx, my) && (at(mx - 1, my) || at(mx + 1, my) || at(mx, my - 1) || at(mx, my + 1)))
          this.dot(x + mx, y + my, call(c, mx, my), call(a, mx, my));
  }
}

};
/* ../pixelfx_src/src/core/actor.js */
__defs[11] = function (__exports) {
__get(__exports, "HERO", () => HERO);
__get(__exports, "HERO2", () => HERO2);
__get(__exports, "HERO_PAL", () => HERO_PAL);
__get(__exports, "DUMMY_PAL", () => DUMMY_PAL);
__get(__exports, "stockActor", () => stockActor);
__get(__exports, "drawActor", () => drawActor);
__get(__exports, "actorAlphaOf", () => actorAlphaOf);
const { hex } = __req(4);
// A stock character to try effects on: status effects wrap its silhouette, hits land on it, auras sit
// behind it. Previews and the gallery draw it; effects only read its mask through o.actor.

const HERO = [
  "....kkkkk...",
  "..kkhhhhhk..",
  ".khhhhhhhhk.",
  ".khhhhhhhhhk",
  ".khhssssshhk",
  ".khsessesshk",
  ".khsessesshk",
  "..ksssssssk.",
  "...kkSSSkk..",
  "..kttttttk..",
  ".kttTttTttk.",
  ".ksttTTttsk.",
  ".kstttttttk.",
  "..kbbbbbbk..",
  "..kppkkppk..",
  "..kppk.kppk.",
  "..kppk.kppk.",
  "..koook.kook",
  "..kkkkk.kkkk",
];
const HERO_PAL = {
  k: "#17121f", h: "#7a4128", s: "#f3c49d", S: "#c98b6c", e: "#17121f",
  t: "#5f6f94", T: "#46536f", b: "#8a5a32", p: "#38334a", o: "#6a4030",
  // the 2x character's extra detail
  H: "#a35d34", w: "#ffffff", m: "#a3564a", g: "#e8c060", L: "#7f90b6", O: "#8f5a3f", P: "#4b4560",
  // the scarf
  c: "#f53cd1", C: "#ff8fe6", D: "#a31f8a",
};
// the dummy: a neutral shell that lets any effect's colors do the talking, near and far limbs, dark bands at the joints, a small mark
const DUMMY_PAL = {
  k: "#0e0c14", A: "#e4e6ec", B: "#b6b9c3", C: "#868995", D: "#5c5e6a", E: "#6e707c", F: "#4b4d58", G: "#34353f", J: "#2a2b33", m: "#f53cd1",
};
// The same character at twice the size (24 x 38), standing easy: the rest pose of src/core/rig.js, baked.
const HERO2 = [
  "...........kkk..........",
  "..........kAABk.........",
  ".........kAAABJk........",
  ".........kABBJJk........",
  ".........kBBBJCDk.......",
  ".........kBCJDDDk.......",
  ".........kkJJJDk........",
  ".......kkkkABBJCkk......",
  "......kAABCJBCCCkDk.....",
  "......kABBCJCCCmDkDk....",
  "......kBBCDDJCDDDkDk....",
  "......kABCDJDDDDDkk.....",
  ".....kAABDkDDDDJkk......",
  ".....kABCDkDDJJGkk......",
  ".....kABCkJJJGGGkk......",
  "....kJJCDkFFFGGGk.......",
  "....kAJJDkJJJGGGk.......",
  "....kJCJJkABBJGGk.......",
  ".....kJCCkBBCDJJJk......",
  ".....kCCCJBBCDJJDk......",
  ".....kCCCDJCCDkJDDk.....",
  "......kCDDJBCDkDDDk.....",
  ".......kDJJJCDkDDDkk....",
  ".......kJBCJCDkDDDkk....",
  ".......kBDJBCDkCDDkk....",
  "........kJJBCDkCDDk.....",
  "........kBBBCDkCCDDk....",
  "........kBBBCDkCCDDk....",
  ".........kBBCDkJDDDk....",
  "........kBJJJJkCJJJk....",
  "........kBBCCDkCCDDk....",
  "........kBBCDDkCDDk.....",
  "........kBBCDkCCDDk.....",
  "........kBCCDkCCDDk.....",
  "........kBCDDkCDDDk.....",
  ".......kJBCJkkkDJkkkk...",
  ".......kAJJAAAAkCCCCCk..",
  "........kkkkkkkkkkkkk...",
];


function maskOf(rows, k = 1) {
  const h = rows.length * k, w = rows[0].length * k, data = new Uint8Array(w * h);
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === ".") return;
    for (let j = 0; j < k * k; j++) data[(y * k + ((j / k) | 0)) * w + x * k + (j % k)] = 1;
  }));
  return { w, h, data };
}

const MASKS = { 1: maskOf(HERO, 1), 2: maskOf(HERO2, 1) };
const SPRITES = { 1: HERO, 2: HERO2 };
// the character's own colors, row by row (0 where empty), for effects that recolor it: frozen, poisoned, stone
function pixelsOf(rows, pal) {
  const w = rows[0].length, data = new Uint32Array(w * rows.length);
  rows.forEach((r, y) => [...r].forEach((ch, x) => (data[y * w + x] = ch === "." ? 0 : hex(pal[ch]))));
  return data;
}
const PIXELS = { 1: pixelsOf(HERO, HERO_PAL), 2: pixelsOf(HERO2, DUMMY_PAL) };

/**
 * The stock actor at scale k (1: 12 x 19 px, 2: 24 x 38 px), in local space with its feet at (0, 0):
 * { mask, x, y (top-left of the mask), w, h, k, head: [x, y] (top of the head), chest: [x, y] }.
 */
function stockActor(k = 1) {
  k = k === 2 ? 2 : 1;
  const m = MASKS[k], x = -Math.floor(m.w / 2), y = -m.h;
  return { mask: m, pixels: PIXELS[k], x, y, w: m.w, h: m.h, k, head: [0, y], chest: [0, k === 2 ? -26 : y + 11], ...(k === 2 ? { eyes: [[13, 3], [15, 3]] } : {}) };
}

/** Draw the stock actor with its feet at the painter's origin, at alpha a (dithered). */
function drawActor(p, actor = stockActor(), a = 1) {
  if (a > 0) p.sprite(SPRITES[actor.k === 2 ? 2 : 1], actor.k === 2 ? DUMMY_PAL : HERO_PAL, actor.x, actor.y, { a });
}
/** How visible an effect wants the stand-in character at time t (effects may export actorAlpha). */
const actorAlphaOf = (mod, t, o) => (typeof mod.actorAlpha === "function" ? mod.actorAlpha(t, o) : 1);



};
/* ../pixelfx_src/src/core/fx.js */
__defs[10] = function (__exports) {
__get(__exports, "createFrame", () => createFrame);
__get(__exports, "clearFrame", () => clearFrame);
__get(__exports, "painterFor", () => painterFor);
__get(__exports, "resolveOptions", () => resolveOptions);
__get(__exports, "createFx", () => createFx);
__get(__exports, "composite", () => composite);
// Frames and live effect instances.

const { Painter } = __req(8);
const { clamp } = __req(3);
const { stockActor } = __req(11);
const { fit, toHex } = __req(4);

/**
 * A frame: w x h pixels whose top-left sits at (ox, oy) in world space. `color` holds opaque pixels,
 * `light` additive glow; composite() puts them together. Same shape as Sprite Fusion's VFX frames.
 */
function createFrame(w, h, ox = 0, oy = 0) {
  return { w, h, ox, oy, color: new Uint32Array(w * h), light: new Uint32Array(w * h) };
}
function clearFrame(f) {
  f.color.fill(0);
  f.light.fill(0);
  return f;
}

const painters = new WeakMap();
/** The painter for a frame (one per frame, reused). */
function painterFor(frame) {
  let p = painters.get(frame);
  if (!p) painters.set(frame, (p = new Painter(frame)));
  return p.reset();
}

const FADE = 0.3;

const isRamp = (v) => Array.isArray(v) && v.length > 0 && v.every((c) => typeof c === "number" || /^#[0-9a-f]{3,8}$/i.test(c));

/**
 * An effect's options: its defaults with the caller's on top. Any color ramp (palette, or another ramp option
 * like dust or smoke) of a different length than its default is resampled to the default's length, so effects
 * can index steps by number whatever a caller passes.
 */
function resolveOptions(meta, o = {}) {
  const opts = { ...(meta.options ?? {}), ...o };
  for (const [k, def] of Object.entries(meta.options ?? {}))
    if (isRamp(def) && isRamp(o[k]) && o[k].length !== def.length) opts[k] = fit(o[k], def.length).map(toHex);
  if (meta.actor && !opts.actor) opts.actor = stockActor(meta.actor === 2 ? 2 : 1);
  return opts;
}

/**
 * A live instance of an effect module: { update(dt), draw(frame, layer), stop(), done() }.
 * o: { x, y, flip, angle, seed, palette, light (glow strength), actor, ...the effect's own options }.
 * draw(frame, "back") draws what goes behind a character, "front" what goes in front, nothing both.
 */
function createFx(mod, o = {}) {
  const meta = mod.meta ?? {};
  const opts = resolveOptions(meta, o);
  const impl = mod.create ? mod.create(opts) : mod;
  const D = meta.duration ?? 1;
  let t = 0, stopAt = Infinity;
  return {
    meta,
    options: opts,
    get t() {
      return t;
    },
    update(dt) {
      t += dt;
      if (!impl.update) return;
      // simulations step at 120 Hz or finer whatever the caller's frame rate, so they look the same everywhere
      const n = Math.max(1, Math.ceil(dt * 120 - 1e-9));
      for (let i = 0; i < n; i++) impl.update(dt / n, opts);
    },
    draw(frame, layer) {
      const p = painterFor(frame);
      p.place(opts.x ?? 0, opts.y ?? 0, !!opts.flip, opts.angle ?? 0);
      p.fade = stopAt === Infinity ? 1 : clamp(1 - (t - stopAt) / FADE);
      p.lightK = opts.light ?? 1;
      const tt = meta.loop ? t % D : Math.min(t, D);
      if (layer !== "front" && impl.drawBack) {
        p.layer = "back";
        impl.drawBack(p, tt, opts);
      }
      if (layer !== "back") {
        p.layer = "front";
        impl.draw(p, tt, opts);
      }
    },
    /** Let it end: loops fade out, one-shots cut short. */
    stop() {
      if (stopAt === Infinity) stopAt = t;
    },
    done() {
      return t - stopAt >= FADE || (!meta.loop && t >= D);
    },
  };
}

/**
 * Color over a background, plus light, into RGBA bytes (a Uint8ClampedArray or Buffer, w * h * 4).
 * bg: null for transparent, a color number, or a Uint32Array of the frame's size. Over transparency, light
 * becomes color with alpha (its brightest channel), which reads as additive over dark backgrounds.
 */
function composite(f, out, bg = null, lightK = 1) {
  const n = f.w * f.h, C = f.color, L = f.light, flat = typeof bg === "number";
  for (let i = 0; i < n; i++) {
    const c = C[i], l = L[i] & 0xffffff;
    let r, g, b, a;
    const ca = c >>> 24;
    if (ca === 255) {
      r = c & 255; g = (c >>> 8) & 255; b = (c >>> 16) & 255; a = 255;
    } else if (bg === null) {
      // translucent color over nothing keeps its alpha
      r = c & 255; g = (c >>> 8) & 255; b = (c >>> 16) & 255; a = ca;
    } else {
      const k = flat ? bg : bg[i], f = ca / 255;
      r = (c & 255) * f + (k & 255) * (1 - f); g = ((c >>> 8) & 255) * f + ((k >>> 8) & 255) * (1 - f);
      b = ((c >>> 16) & 255) * f + ((k >>> 16) & 255) * (1 - f); a = 255;
    }
    if (l) {
      const lr = (l & 255) * lightK, lg = ((l >>> 8) & 255) * lightK, lb = ((l >>> 16) & 255) * lightK;
      if (a < 255) {
        // over transparency: premultiply what's there, add the light, divide by the new alpha
        const pa = a / 255, pr = r * pa + lr, pg = g * pa + lg, pb = b * pa + lb;
        const na = Math.min(1, Math.max(pa, Math.max(lr, lg, lb) / 255));
        if (na > 0) { r = Math.min(255, pr / na); g = Math.min(255, pg / na); b = Math.min(255, pb / na); a = na * 255; }
      } else {
        r = Math.min(255, r + lr); g = Math.min(255, g + lg); b = Math.min(255, b + lb);
      }
    }
    const j = i * 4;
    out[j] = r; out[j + 1] = g; out[j + 2] = b; out[j + 3] = a;
  }
  return out;
}

};
/* ../pixelfx_src/src/core/scene.js */
__defs[12] = function (__exports) {
__get(__exports, "backdrop", () => backdrop);
__get(__exports, "BACKDROPS", () => BACKDROPS);
// Preview backdrops: what the tools and the gallery draw behind an effect. Sprite sheets stay transparent.

const { hex, mix } = __req(4);
const { rand } = __req(3);

const SKY = hex("#15131d"), SKY_TOP = hex("#0d0b14"), SKY_LOW = hex("#221d33");
const FLOOR_EDGE = hex("#4a4263"), FLOOR = hex("#2b2639"), FLOOR_DARK = hex("#211d2d"), MORTAR = hex("#1a1724");
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const BACKDROPS = ["dark", "ground", "sky", "light", "black"];

/**
 * A backdrop as a Uint32Array of w x h colors. kind: "dark" | "ground" (a stone floor from groundY down)
 * | "sky" (night gradient with stars) | "light" | "black".
 */
function backdrop(kind, w, h, groundY = h) {
  const out = new Uint32Array(w * h);
  if (kind === "light") return out.fill(hex("#ebe8f0"));
  if (kind === "black") return out.fill(hex("#000000"));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let c = SKY;
      if (kind === "sky") {
        const t = y / Math.max(1, h - 1), step = (t * 5 + BAYER[((y & 3) << 2) | (x & 3)] / 16) | 0;
        c = mix(SKY_TOP, SKY_LOW, Math.min(1, step / 4));
        const r = rand(x, y, 77);
        if (r > 0.994) c = mix(c, hex("#cfc8ff"), 0.35 + (r - 0.994) * 90);
      }
      if (kind === "ground" && y >= groundY) {
        const gy = y - groundY;
        if (gy === 0) c = FLOOR_EDGE;
        else {
          const row = Math.floor((gy - 1) / 5), off = row % 2 ? 6 : 0;
          const mortar = (gy - 1) % 5 === 4 || (x + off) % 12 === 0;
          c = mortar ? MORTAR : gy < 3 ? FLOOR : FLOOR_DARK;
        }
      }
      out[y * w + x] = c;
    }
  return out;
}

};
/* ../pixelfx_src/src/core/rig.js */
__defs[14] = function (__exports) {
__get(__exports, "shortfall", () => shortfall);
__get(__exports, "posed", () => posed);
__get(__exports, "skeleton", () => skeleton);
__get(__exports, "posedParts", () => posedParts);
__get(__exports, "STAND", () => STAND);
__get(__exports, "WEAPONS", () => WEAPONS);
// The character who acts: a real skeleton in 3D, drawn down to pixels the way Dead Cells makes its sprites. Bones have
// fixed lengths and hang from each other, pelvis to spine to chest to shoulders, so the body can twist, bend and turn round,
// and depth decides what's in front. A pose only says where the hands and feet should be and how the body is carrying
// itself; the solver works out every joint, and the renderer shades it into a few flat tones with one clean ink line.
//
// Coordinates: x right, y up, z towards the viewer, in pixels, the feet at the origin. Poses are in screen terms (y negative
// is up), as effects are. The character faces +x with his right side towards the viewer, so the right hand is the near one.
//
// A rendered pose also knows, for each of its pixels, which pixel of the standing character it came from (`src`). That
// is what lets an effect drawn on the standing body (frost, poison, a scan line) follow the body wherever it goes.

const { hex } = __req(4);
const { DUMMY_PAL } = __req(11);

const PAL = Object.fromEntries(Object.entries(DUMMY_PAL).map(([k, v]) => [k, hex(v) >>> 0]));
const INK = PAL.k, SEAM = PAL.J, MARK = PAL.m;
// plates and joints: lit to dark
const SHELL = [PAL.A, PAL.B, PAL.C, PAL.D], CORE = [PAL.E, PAL.F, PAL.G, PAL.G];
const DEG = Math.PI / 180, W0 = 24, H0 = 38;

// ---- vectors and turns
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => mul(a, 1 / (len(a) || 1e-6));
const rotY = (t) => { const c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const rotZ = (t) => { const c = Math.cos(t), s = Math.sin(t); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
const mm = (A, B) => { const o = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]; return o; };
const mv = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
const tv = (M, v) => [M[0] * v[0] + M[3] * v[1] + M[6] * v[2], M[1] * v[0] + M[4] * v[1] + M[7] * v[2], M[2] * v[0] + M[5] * v[1] + M[8] * v[2]];
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ---- the body's measurements, in pixels
const M = {
  pelvis: 19.7, spine1: 2.8, spine2: 4.6, shoulderUp: 2.5, shoulderOut: 5.9, neckUp: 4.0, headUp: 3.1,
  hipDown: 1.1, hipOut: 2.8, thigh: 8.6, shin: 8.3, upper: 7.6, fore: 7.4, turn: 36 * DEG,
};
/** Standing easy, in screen terms: hands and feet are where they should end up, y negative is up. */
const STAND = { lean: 0, crouch: 0, yaw: 0, fx: -3, fy: -15, bx: 5, by: -15, ffx: -2, ffy: -4, fbx: 3, fby: -4 };

// ---- solving a pose: from where the hands and feet should be, to every joint
function ik(a, target, L1, L2, pole) {
  let to = sub(target, a), d = len(to);
  const reach = L1 + L2 - 0.02;
  if (d > reach) { to = mul(to, reach / d); d = reach; }
  const u = unit(to), along = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - along * along));
  let v = sub(pole, mul(u, dot(pole, u)));
  v = len(v) < 1e-4 ? unit(cross(u, [0, 0, 1])) : unit(v);
  return { joint: add(a, add(mul(u, along), mul(v, h))), end: add(a, to), u, v };
}
function frame(t, R) {
  return { t, R };
}
// a frame along a bone: its local x runs down the bone
function boneFrame(a, b, pole) {
  const x = unit(sub(b, a));
  let y = sub(pole, mul(x, dot(pole, x)));
  y = len(y) < 1e-4 ? unit(cross(x, [0, 0, 1])) : unit(y);
  const z = cross(x, y);
  return frame(a, [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]]);
}
const weaponOf = (name) => WEAPONS[name];

function solve(pose) {
  const q = { ...STAND, ...pose }, lean = q.lean, W = q.weapon && weaponOf(q.weapon), OW = q.offWeapon && weaponOf(q.offWeapon);
  const sa = q.sa ?? 0, wl = q.wl ?? 1, axisZ = Math.sqrt(Math.max(0, 1 - wl * wl)) * (q.wz ?? 1);
  const axis = [Math.cos(sa) * wl, -Math.sin(sa) * wl, axisZ], side = [-Math.sin(sa), -Math.cos(sa), 0];
  const two = !!(q.two && W), nearZ = q.fz ?? (two ? 3 : 4.5);
  // how the chest is turned follows the hands: a hand driving forward brings its shoulder round; one drawn back opens him up
  const fwd = (q.fx - STAND.fx) / 24, farFwd = two ? 0 : (q.bx - STAND.bx) / 22;
  let turn = M.turn + (fwd >= 0 ? -44 * DEG * Math.min(1, fwd) : 28 * DEG * Math.min(1, -fwd * 1.8));
  turn += (farFwd > 0 ? 34 * DEG * Math.min(1, farFwd) : 0) + (q.twist ?? 0) * 4 * DEG;
  if (q.turn !== undefined) turn = q.turn;
  const hipTurn = M.turn + (turn - M.turn) * 0.45, tilt = Math.atan2(lean, 13);
  const Rp = mm(rotZ(-tilt * 0.25), rotY(-hipTurn)), Rc = mm(rotZ(-tilt), rotY(-turn));
  // feet first: the pelvis sinks if that's what it takes for both legs to reach them
  const ankleN = [q.ffx, -q.ffy - 1.8, q.fzz ?? 2.4], ankleF = [q.fbx, -q.fby - 1.8, q.bzz ?? -2.4];
  let pelvis = [lean * 0.2, M.pelvis - q.crouch, 0];
  const hipAt = (s) => add(pelvis, mv(Rp, [0, -M.hipDown, s * M.hipOut]));
  const maxLeg = (M.thigh + M.shin) * 0.995;
  for (const [s, a] of [[1, ankleN], [-1, ankleF]]) {
    const h = hipAt(s), dx = h[0] - a[0], dz = h[2] - a[2], flat = dx * dx + dz * dz;
    if (flat < maxLeg * maxLeg) {
      const top = a[1] + Math.sqrt(maxLeg * maxLeg - flat);
      if (h[1] > top) pelvis = [pelvis[0], pelvis[1] - (h[1] - top), pelvis[2]];
    }
  }
  const waist = add(pelvis, [Math.sin(tilt * 0.45) * M.spine1, Math.cos(tilt * 0.45) * M.spine1, 0]);
  const chest = add(waist, [Math.sin(tilt) * M.spine2, Math.cos(tilt) * M.spine2, 0]);
  const neck = add(chest, mv(Rc, [0, M.neckUp, 0]));
  // the head keeps looking where he's going: it takes only part of the lean and part of the turn
  const headTurn = M.turn * 0.9 + (turn - M.turn) * 0.35, nod = tilt * 0.35 + (q.hy ?? 0) * 7 * DEG, roll = (q.hx ?? 0) * 7 * DEG;
  const Rh = mm(rotZ(-nod - roll), rotY(-headTurn));
  const head = add(neck, mv(Rh, [0.15, M.headUp, 0]));
  // the arms: shoulders reach a little towards a far hand
  const pick = (s, target) => {
    const base = add(chest, mv(Rc, [0, M.shoulderUp, s * M.shoulderOut])), to = sub(target, base), d = len(to);
    return add(base, mul(unit(to), Math.min(1.8, Math.max(0, d - 11) * 0.35)));
  };
  const nearT = [q.fx, -q.fy, nearZ];
  const farT = two ? [q.fx + axis[0] * W.two, -q.fy + axis[1] * W.two, nearZ + axis[2] * W.two] : [q.bx, -q.by, q.bz ?? (q.armsFront ? 5.5 : -4.5)];
  const sN = pick(1, nearT), sF = pick(-1, farT);
  const pole = (s, T, shoulder, hold) => {
    // elbows hang down and back; overhead they go out and forward
    const up = clamp01((T[1] - shoulder[1] + 2) / 10);
    const base = [-0.55 + up * 1.1, -1 + up * 0.9, s * (0.45 + up * 0.5)];
    if (!hold) return base;
    // holding something, the forearm wants to meet the handle side on: try round the circle, keep the best
    const u = unit(sub(T, shoulder));
    let best = base, score = Infinity;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, x = unit(cross(u, [0.3, 1, 0.2])), y = cross(u, x), v = add(mul(x, Math.cos(a)), mul(y, Math.sin(a)));
      const A = ik(shoulder, T, M.upper, M.fore, v), f = unit(sub(A.end, A.joint));
      const cost = Math.abs(dot(f, hold)) * 0.7 + (1 - dot(unit(base), v)) * 0.55;
      if (cost < score) { score = cost; best = v; }
    }
    return best;
  };
  const holdN = W ? (W.across ? side : axis) : null, holdF = two ? (W.across ? side : axis) : OW ? [Math.cos(q.sb ?? Math.PI), -Math.sin(q.sb ?? Math.PI), 0] : null;
  const armN = ik(sN, nearT, M.upper, M.fore, pole(1, nearT, sN, holdN)), armF = ik(sF, farT, M.upper, M.fore, pole(-1, farT, sF, holdF));
  // the legs: knees forward, a little out
  const kneePole = (s) => mv(Rp, [1, 0, s * 0.35]);
  const hipN = hipAt(1), hipF = hipAt(-1);
  const legN = ik(hipN, ankleN, M.thigh, M.shin, kneePole(1)), legF = ik(hipF, ankleF, M.thigh, M.shin, kneePole(-1));
  const footDir = (s) => { const t = hipTurn * 0.6 + s * 8 * DEG; return [Math.cos(t), 0, Math.sin(t)]; };
  const B = {
    pelvis: frame(pelvis, Rp), waist: frame(waist, mm(rotZ(-tilt * 0.6), rotY(-(turn + hipTurn) / 2))), chest: frame(chest, Rc), head: frame(head, Rh), neck: frame(neck, Rh),
    upperN: boneFrame(sN, armN.joint, armN.v), foreN: boneFrame(armN.joint, armN.end, armN.v), upperF: boneFrame(sF, armF.joint, armF.v), foreF: boneFrame(armF.joint, armF.end, armF.v),
    thighN: boneFrame(hipN, legN.joint, legN.v), shinN: boneFrame(legN.joint, legN.end, legN.v), thighF: boneFrame(hipF, legF.joint, legF.v), shinF: boneFrame(legF.joint, legF.end, legF.v),
  };
  B.footN = frame(legN.end, mm(rotY(-Math.atan2(footDir(1)[2], footDir(1)[0])), rotZ(q.toeF ? -55 * DEG : 0)));
  B.footF = frame(legF.end, mm(rotY(-Math.atan2(footDir(-1)[2], footDir(-1)[0])), rotZ(q.toeB ? -55 * DEG : 0)));
  return { B, W, OW, q, axis, side, armN, armF, legN, legF, sN, sF, hipN, hipF, turn };
}

// ---- drawing: every part goes through one depth buffer
const BW = 300, BH = 240, OX = 150, OY = 180; // the scratch grid, big enough for a raised scythe; feet at (OX, OY)
const Zb = new Float32Array(BW * BH), Tone = new Float32Array(BW * BH), Part = new Int8Array(BW * BH), Mat = new Int8Array(BW * BH), Fr = new Int8Array(BW * BH), LX = new Float32Array(BW * BH), LY = new Float32Array(BW * BH), Col = new Uint32Array(BW * BH);
const touched = [];
const LIGHT = unit([-0.55, 0.72, 0.5]);
let clipBody = false, clipWeapon = false, curFrameIndex = 0, curDim = 0, onlyPart = 0;
const FRAME_IDS = ["pelvis", "waist", "chest", "head", "neck", "upperN", "foreN", "upperF", "foreF", "thighN", "shinN", "thighF", "shinF", "footN", "footF"];
function plot(i, z, tone, part, mat, wx, wy, color) {
  if (onlyPart && part !== onlyPart) return;
  if (Part[i] === 0) touched.push(i);
  else if (z <= Zb[i]) return;
  Zb[i] = z;
  Tone[i] = tone;
  Part[i] = part;
  Mat[i] = mat;
  Fr[i] = curFrameIndex;
  LX[i] = wx;
  LY[i] = wy;
  Col[i] = color;
}
function sphere(c, r, part, mat) {
  const x0 = Math.floor(c[0] - r), x1 = Math.ceil(c[0] + r), y0 = Math.floor(c[1] - r), y1 = Math.ceil(c[1] + r);
  for (let wy = y0; wy <= y1; wy++)
    for (let wx = x0; wx <= x1; wx++) {
      const dx = wx - c[0], dy = wy - c[1], d2 = dx * dx + dy * dy;
      if (d2 > r * r || (clipBody && wy < 1.5)) continue;
      const dz = Math.sqrt(r * r - d2), n = [dx / r, dy / r, dz / r], i = (OY - wy) * BW + (OX + wx);
      plot(i, c[2] + dz, dot(n, LIGHT), part, mat, wx, wy, 0);
    }
}
function sweep(a, b, ra, rb, part, mat, bulge = 0) {
  const n = Math.max(2, Math.ceil(len(sub(b, a)) / 0.4));
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    sphere(add(a, mul(sub(b, a), u)), ra + (rb - ra) * u + bulge * Math.sin(u * Math.PI), part, mat);
  }
}
// an ellipsoid with radii r along the axes of frame R, seen along z
function ellipsoid(c, R, r, part, mat) {
  const big = Math.max(r[0], r[1], r[2]), x0 = Math.floor(c[0] - big), x1 = Math.ceil(c[0] + big), y0 = Math.floor(c[1] - big), y1 = Math.ceil(c[1] + big);
  const Rt = [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]], D = [1 / (r[0] * r[0]), 1 / (r[1] * r[1]), 1 / (r[2] * r[2])];
  // A = R diag(D) R^T
  const A = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) A[i * 3 + j] = R[i * 3] * D[0] * R[j * 3] + R[i * 3 + 1] * D[1] * R[j * 3 + 1] + R[i * 3 + 2] * D[2] * R[j * 3 + 2];
  void Rt;
  for (let wy = y0; wy <= y1; wy++)
    for (let wx = x0; wx <= x1; wx++) {
      if (clipBody && wy < 1.5) continue;
      const dx = wx - c[0], dy = wy - c[1];
      const qa = A[8], qb = 2 * (A[2] * dx + A[5] * dy), qc = A[0] * dx * dx + 2 * A[1] * dx * dy + A[4] * dy * dy - 1, disc = qb * qb - 4 * qa * qc;
      if (disc < 0) continue;
      const dz = (-qb + Math.sqrt(disc)) / (2 * qa);
      const n = unit([A[0] * dx + A[1] * dy + A[2] * dz, A[3] * dx + A[4] * dy + A[5] * dz, A[6] * dx + A[7] * dy + A[8] * dz]);
      plot((OY - wy) * BW + (OX + wx), c[2] + dz, dot(n, LIGHT), part, mat, wx, wy, 0);
    }
}
// parts: each has its own number, so edges between them can be seen
const PART = { pelvis: 1, waist: 2, chest: 3, neck: 4, head: 5, face: 6, upperN: 7, elbowN: 8, foreN: 9, handN: 10, upperF: 11, elbowF: 12, foreF: 13, handF: 14, thighN: 15, kneeN: 16, shinN: 17, footN: 18, thighF: 19, kneeF: 20, shinF: 21, footF: 22, weapon: 23, offWeapon: 24 };
const useFrame = (name) => { curFrameIndex = FRAME_IDS.indexOf(name); };

function drawBody(S) {
  const { B, armN, armF, legN, legF, sN, sF, hipN, hipF, turn } = S, F_ = (name) => B[name];
  useFrame("pelvis");
  ellipsoid(add(F_("pelvis").t, mv(F_("pelvis").R, [0, -0.2, 0])), F_("pelvis").R, [2.9, 2.6, 4.2], PART.pelvis, 0);
  useFrame("waist");
  sweep(F_("pelvis").t, F_("chest").t, 3, 3.3, PART.waist, 1);
  useFrame("chest");
  ellipsoid(add(F_("chest").t, mv(F_("chest").R, [0.2, 0.9, 0])), F_("chest").R, [3.4, 4.2, 5.5], PART.chest, 0);
  useFrame("neck");
  sweep(F_("neck").t, add(F_("neck").t, mv(F_("head").R, [0, 1.6, 0])), 1.25, 1.15, PART.neck, 1);
  useFrame("head");
  ellipsoid(F_("head").t, F_("head").R, [3, 3.3, 2.8], PART.head, 0);
  ellipsoid(add(F_("head").t, mv(F_("head").R, [0.85, -0.45, 0])), F_("head").R, [2.4, 2.7, 2.35], PART.face, 0);
  const arm = (far, A, sh, up, el, fo, ha, nameU, nameF) => {
    curDim = far ? 1 : 0;
    useFrame(nameU);
    sphere(sh, 2.5, up, 0);
    sweep(sh, A.joint, 2.1, 1.6, up, 0);
    sphere(A.joint, 1.45, el, 1);
    useFrame(nameF);
    sweep(A.joint, A.end, 1.6, 1.2, fo, 0, 0.15);
    sphere(A.end, 1.9, ha, 0);
    curDim = 0;
  };
  arm(false, armN, sN, PART.upperN, PART.elbowN, PART.foreN, PART.handN, "upperN", "foreN");
  arm(true, armF, sF, PART.upperF, PART.elbowF, PART.foreF, PART.handF, "upperF", "foreF");
  const leg = (far, L, hip, th, kn, sh, fo, nameT, nameS, nameFt) => {
    useFrame(nameT);
    sweep(hip, L.joint, 3.2, 2.2, th, 0);
    sphere(L.joint, 1.9, kn, 1);
    useFrame(nameS);
    sweep(L.joint, L.end, 2.15, 1.4, sh, 0, 0.4);
    useFrame(nameFt);
    const R = F_(nameFt).R, a = F_(nameFt).t;
    sweep(add(a, mv(R, [-1.5, -0.6, 0])), add(a, mv(R, [4.6, -1.1, 0])), 1.7, 1.25, fo, 0);
  };
  leg(false, legN, hipN, PART.thighN, PART.kneeN, PART.shinN, PART.footN, "thighN", "shinN", "footN");
  leg(true, legF, hipF, PART.thighF, PART.kneeF, PART.shinF, PART.footF, "thighF", "shinF", "footF");
  void turn;
}

// ---- what they hold: drawn along the handle from the fist, through the same depth buffer
function along(H, axis, side, part) {
  const n = cross(axis, side);
  const T = (i, k, c, lift = 0) => {
    const x = H[0] + axis[0] * i + side[0] * k + n[0] * lift, y = H[1] + axis[1] * i + side[1] * k + n[1] * lift, z = H[2] + axis[2] * i + side[2] * k + n[2] * lift;
    const wx = Math.round(x), wy = Math.round(y);
    if (clipWeapon && wy < 0) return;
    const idx = (OY - wy) * BW + (OX + wx);
    if (idx < 0 || idx >= BW * BH) return;
    curFrameIndex = -1;
    plot(idx, z + 0.05, 2, part, 2, wx, wy, c);
  };
  T.at = (i, k) => [H[0] + axis[0] * i + side[0] * k, H[1] + axis[1] * i + side[1] * k, H[2] + axis[2] * i + side[2] * k];
  return T;
}
const STEEL = Object.fromEntries(Object.entries({ hi: "#ffffff", a: "#e8edf6", b: "#a4afc6", d: "#68748f", gold: "#ffd84a", goldD: "#b8862a", grip: "#7a3a2a", gripD: "#4a2018", wood: "#8a5a32", woodD: "#5a3820", dark: "#3a3448", darkD: "#262033", olive: "#58663f", oliveA: "#7d8c58", oliveD: "#3a4529" }).map(([k, v]) => [k, hex(v) >>> 0]));
function blade(T, from, length, w) {
  for (let i = from; i <= from + length + 0.01; i += 0.4) {
    const r = i - from, wd = r > length - 5 ? Math.max(0, ((length - r) / 5) * w) : w;
    for (let k = -wd; k <= wd + 0.01; k += 0.4) T(i, k, k < -w * 0.4 ? STEEL.hi : k > w * 0.4 ? STEEL.d : STEEL.a);
  }
}
const haft = (T, from, to, a, d, r = 0.8) => {
  for (let i = from; i <= to; i += 0.4) for (let k = -r; k <= r + 0.01; k += 0.4) T(i, k, k > 0.1 ? d : a);
};
const WEAPONS = {
  // the fist is at i = 0; `two` is where the other hand goes; `across`: the handle lies across the weapon's length
  sword: { two: -4.4, draw(T, q) {
    const end = q.two ? -6.5 : -2.6;
    haft(T, end, 2.2, STEEL.grip, STEEL.gripD);
    for (let k = -1.4; k <= 1.4; k += 0.4) T(end - 0.4, k, STEEL.gold);
    for (let k = -4.6; k <= 4.6; k += 0.4) (T(2.6, k, Math.abs(k) > 3.8 ? STEEL.goldD : STEEL.gold), T(3, k, STEEL.goldD));
    blade(T, 3.2, 25, 2.2);
  } },
  greatsword: { two: -4.8, draw(T) {
    haft(T, -7.2, 2.2, STEEL.grip, STEEL.gripD);
    for (let k = -1.8; k <= 1.8; k += 0.4) T(-7.6, k, STEEL.gold);
    for (let k = -6.6; k <= 6.6; k += 0.4) (T(2.6, k, Math.abs(k) > 5.6 ? STEEL.goldD : STEEL.gold), T(3, k, STEEL.goldD));
    blade(T, 3.2, 31, 3);
    for (let i = 4; i <= 28; i += 0.4) T(i, 0, STEEL.b);
  } },
  dagger: { draw(T) {
    haft(T, -2.4, 1.8, STEEL.grip, STEEL.gripD);
    for (let k = -2.6; k <= 2.6; k += 0.4) T(2.2, k, STEEL.goldD);
    blade(T, 2.6, 10, 1.3);
  } },
  spear: { two: -12, draw(T) {
    haft(T, -18, 36, STEEL.wood, STEEL.woodD, 0.5);
    blade(T, 36, 11, 2);
    for (let k = -2.4; k <= 2.4; k += 0.4) T(36, k, STEEL.goldD);
  } },
  hammer: { two: -7, draw(T) {
    for (const lift of [-0.8, 0, 0.8]) for (let i = -10; i <= 18; i += 0.4) for (let k = -0.8; k <= 0.81; k += 0.4) T(i, k, k > 0.1 ? STEEL.woodD : STEEL.wood, lift);
    // the head is a block: its two faces, and the steel between them
    for (let i = 18; i <= 28; i += 0.4) for (let k = -9; k <= 9; k += 0.4) {
      const face = Math.abs(k) > 7.4 ? (k < 0 ? STEEL.a : STEEL.d) : i < 20 ? STEEL.hi : i > 26.4 ? STEEL.d : Math.abs(k) < 2 ? STEEL.gold : STEEL.b;
      T(i, k, face, 4.5);
      T(i, k, face, -4.5);
      if (i < 18.4 || i > 27.6 || Math.abs(k) > 8.6) for (let l = -4; l <= 4; l += 0.4) T(i, k, k < 0 ? STEEL.a : i > 27.6 ? STEEL.d : STEEL.b, l);
    }
  } },
  scythe: { two: -11, draw(T) {
    haft(T, -16, 31, STEEL.dark, STEEL.darkD, 0.5);
    for (let j = 0; j <= 28; j += 0.4) {
      const u = j / 28, w = 3.2 * (1 - u) + 0.3, b = 31.5 - u * u * 12;
      for (let k = -w; k <= w; k += 0.4) T(b + k, j + 0.8, k > w * 0.3 ? STEEL.hi : k < -w * 0.4 ? STEEL.d : STEEL.b);
    }
  } },
  claw: { draw(T) {
    for (const q0 of [-2.4, 0, 2.4])
      for (let i = 2; i <= 9.5; i += 0.4) {
        const u = (i - 2) / 7.5, k = q0 + u * u * 1.8;
        T(i, k, u > 0.55 ? STEEL.hi : STEEL.a);
        if (u < 0.6) T(i, k + 0.8, STEEL.d);
      }
  } },
  bow: { across: true, draw(T, q, off) {
    for (let u = -1; u <= 1.001; u += 0.025) {
      const k = u * 17, i = 6 * (1 - u * u) - 1;
      T(i, k, Math.abs(u) > 0.85 ? STEEL.goldD : STEEL.wood);
      T(i + 0.8, k, STEEL.woodD);
    }
    const tipA = T.at(-1, -17), tipB = T.at(-1, 17), mid = q.pull ? off : T.at(-1, 0);
    const line = (A, B, c) => {
      const n = Math.max(2, Math.ceil(len(sub(B, A)) / 0.4)), Z = STEEL.a;
      for (let k = 0; k <= n; k++) {
        const P = add(A, mul(sub(B, A), k / n)), wx = Math.round(P[0]), wy = Math.round(P[1]), idx = (OY - wy) * BW + (OX + wx);
        curFrameIndex = -1;
        plot(idx, P[2] + 0.05, 2, PART.weapon, 2, wx, wy, c ?? Z);
      }
    };
    line(tipA, mid);
    line(tipB, mid);
    if (q.nocked) {
      const nock = mid, tip = T.at(13, 0);
      line(nock, tip, STEEL.wood);
      for (let i = 9; i <= 13; i += 0.4) for (let k = -(13 - i) * 0.45; k <= (13 - i) * 0.45; k += 0.4) T(i, k, STEEL.hi);
    }
  } },
  pistol: { across: true, draw(T) {
    for (let i = -1; i <= 9.5; i += 0.4) for (let k = -4.2; k <= -2.4; k += 0.4) T(i, k, k < -3.6 ? STEEL.a : k > -2.9 ? STEEL.d : STEEL.b);
    for (let i = -1.2; i <= 1.2; i += 0.4) for (let k = -2.4; k <= 2.4; k += 0.4) T(i, k, STEEL.gripD);
    T(9, -4.6, STEEL.hi);
  } },
  launcher: { two: -9, draw(T) {
    for (let i = -14; i <= 22; i += 0.4) for (let k = -6; k <= -1; k += 0.4) T(i, k, k < -4.8 ? STEEL.oliveA : k > -2.2 ? STEEL.oliveD : Math.abs(i - 3) < 1.4 ? STEEL.gold : STEEL.olive);
    for (let k = -6.8; k <= -0.2; k += 0.4) (T(22.4, k, STEEL.b), T(-14.4, k, STEEL.d));
  } },
  handle: { draw(T) {
    haft(T, -2.6, 6, STEEL.grip, STEEL.gripD);
    for (let k = -1.6; k <= 1.6; k += 0.4) (T(-3, k, STEEL.gold), T(6.4, k, STEEL.gold));
  } },
};

// ---- flat tones, seams, and one clean ink line
function finish(S, restFrames) {
  const dim = (part) => part >= PART.upperF && part <= PART.handF ? 1 : part >= PART.thighF && part <= PART.footF ? 1 : 0;
  const toneOf = (v, part) => {
    let t = v > 0.8 ? 0 : v > 0.42 ? 1 : v > 0.08 ? 2 : 3;
    t = Math.min(3, t + dim(part));
    return t;
  };
  const tones = new Map();
  for (const i of touched) tones.set(i, toneOf(Tone[i], Part[i]));
  // a lone pixel of a tone, with no neighbour like it on the same part, takes its neighbours' tone
  for (const i of touched) {
    if (Mat[i] === 2) continue;
    const t = tones.get(i), votes = [0, 0, 0, 0];
    let same = false;
    for (const d of [-1, 1, -BW, BW]) {
      const j = i + d;
      if (Part[j] !== Part[i] || !tones.has(j)) continue;
      const u = tones.get(j);
      votes[u]++;
      if (u === t) same = true;
    }
    if (!same && votes.some((v) => v > 0)) tones.set(i, votes.indexOf(Math.max(...votes)));
  }
  for (const i of touched) {
    if (Mat[i] === 2) continue;
    Col[i] = (Mat[i] === 1 ? CORE : SHELL)[tones.get(i)];
  }
  // where two parts meet: a soft seam if they touch, ink if one stands in front of the other
  const marks = new Map();
  for (const i of touched) {
    for (const d of [1, BW]) {
      const j = i + d;
      if (Part[j] === 0 || Part[j] === Part[i]) continue;
      const far = Zb[i] < Zb[j] ? i : j, dz = Math.abs(Zb[i] - Zb[j]), steel = Mat[i] === 2 || Mat[j] === 2;
      if (Mat[far] === 2 && dz < 1) continue;
      const ink = steel || dz > 2.2;
      if (ink) marks.set(far, INK);
      else if (!marks.has(far)) marks.set(far, SEAM);
    }
  }
  for (const [i, c] of marks) Col[i] = c;
  // the mark on his chest, when it's facing us
  const { B } = S, chestAt = add(B.chest.t, mv(B.chest.R, [3, 1.6, -1.8]));
  if (mv(B.chest.R, [1, 0, 0])[2] > 0.15) {
    const i = (OY - Math.round(chestAt[1])) * BW + (OX + Math.round(chestAt[0]));
    if (Part[i] === PART.chest) Col[i] = MARK;
  }
  // the outline, and everything into a small list of pixels
  const list = touched.slice(), ring = new Map();
  for (const i of list) for (const d of [-1, 1, -BW, BW]) { const j = i + d; if (Part[j] === 0 && !ring.has(j)) ring.set(j, i); }
  const n = list.length + ring.size, out = { n, xs: new Int16Array(n), ys: new Int16Array(n), color: new Uint32Array(n), src: new Int16Array(n), ink: new Uint8Array(n), x0: 0, y0: 0, x1: 0, y1: 0 };
  const srcFor = (i) => {
    const f = Fr[i];
    if (f < 0 || !restFrames) return -1;
    const name = FRAME_IDS[f], A = B[name], R0 = restFrames[name], wx = (i % BW) - OX, wy = OY - ((i / BW) | 0), P = [wx, wy, Zb[i]];
    const lp = tv(A.R, sub(P, A.t)), rp = add(R0.t, mv(R0.R, lp)), c = Math.round(rp[0]) + 12, r = 38 - Math.round(rp[1]);
    return c < 0 || r < 0 || c >= W0 || r >= H0 ? -1 : r * W0 + c;
  };
  let k = 0, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const push = (i, c, s, isInk) => {
    const x = (i % BW) - OX, y = ((i / BW) | 0) - OY;
    out.xs[k] = x; out.ys[k] = y; out.color[k] = c; out.src[k] = s; out.ink[k] = isInk ? 1 : 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    k++;
  };
  for (const i of list) push(i, Col[i], srcFor(i), Col[i] === INK);
  for (const [j, i] of ring) push(j, INK, srcFor(i), true);
  let zs = 0;
  for (const i of list) zs += Zb[i];
  Object.assign(out, { x0, y0, x1, y1, z: list.length ? zs / list.length : 0 });
  for (const i of list) Part[i] = 0;
  touched.length = 0;
  return out;
}

const turnAll = (S, a) => {
  // the whole figure turned about the vertical through the feet
  const R = rotY(-a), P = (v) => mv(R, v);
  for (const f of Object.values(S.B)) { f.t = P(f.t); f.R = mm(R, f.R); }
  for (const A of [S.armN, S.armF, S.legN, S.legF]) { A.joint = P(A.joint); A.end = P(A.end); }
  S.sN = P(S.sN); S.sF = P(S.sF); S.hipN = P(S.hipN); S.hipF = P(S.hipF);
  S.axis = P(S.axis); S.side = P(S.side);
};
let REST_FRAMES = null;
function render(pose) {
  const S = solve(pose), q = S.q, whole = (q.yaw ?? 0) + (q.face === -1 ? Math.PI : 0);
  if (whole) turnAll(S, whole);
  const air = (q.y ?? 0) < -0.5;
  clipBody = !air;
  clipWeapon = !air;
  drawBody(S);
  clipBody = false;
  if (S.W) S.W.draw(along(S.armN.end, S.axis, S.side, PART.weapon), q, S.armF.end);
  if (S.OW) {
    const sb = q.sb ?? Math.PI;
    let ax = [Math.cos(sb), -Math.sin(sb), 0], sd = [-Math.sin(sb), -Math.cos(sb), 0];
    if (whole) { const R = rotY(-whole); ax = mv(R, ax); sd = mv(R, sd); }
    S.OW.draw(along(S.armF.end, ax, sd, PART.offWeapon), q, S.armF.end);
  }
  clipWeapon = false;
  return finish(S, REST_FRAMES);
}
REST_FRAMES = solve({}).B;

const CACHE = new Map();
const keyOf = (p) => {
  let s = (p.y ?? 0) < -0.5 ? "air," : "";
  for (const k of Object.keys(p).sort()) {
    const v = p[k];
    if (v === undefined || k === "x" || k === "y" || k === "ghost") continue;
    s += k + (typeof v === "number" ? (k === "sa" || k === "sb" || k === "wl" || k === "yaw" || k === "turn" ? Math.round(v * 20) : Math.round(v)) : v) + ",";
  }
  return s;
};
/** How far short of where the pose wants them the hands fall, in px: arms don't stretch. */
function shortfall(pose) {
  const S = solve(pose), q = S.q, near = len(sub(S.armN.end, [q.fx, -q.fy, S.armN.end[2]])), far = q.two ? 0 : len(sub(S.armF.end, [q.bx, -q.by, S.armF.end[2]]));
  return Math.max(near, far);
}
/** The pixels of a pose: { n, xs, ys, color, src, ink, x0, y0, x1, y1 }, in local space with the feet at (0, 0). */
function posed(pose) {
  const key = keyOf(pose);
  let r = CACHE.get(key);
  if (!r) {
    if (CACHE.size > 6000) CACHE.clear();
    CACHE.set(key, (r = render(pose)));
  }
  return r;
}

/**
 * The skeleton of a pose, in the same local space as posed(): x right, y down, feet at (0, 0), z toward the viewer, whole
 * figure turned by its yaw. { joints: { name: [x, y, z] }, bones: [[from, to], ...], handles: [name, ...] }: the handles
 * are what a pose moves (hands and feet); everything else is solved from them.
 */
function skeleton(pose) {
  const S = solve(pose), q = S.q, whole = (q.yaw ?? 0) + (q.face === -1 ? Math.PI : 0);
  if (whole) turnAll(S, whole);
  const { B, armN, armF, legN, legF, sN, sF, hipN, hipF } = S, at = (f, v) => add(f.t, mv(f.R, v));
  const J = {
    pelvis: B.pelvis.t, waist: B.waist.t, chest: B.chest.t, neck: B.neck.t, head: B.head.t, crown: at(B.head, [0, 3.3, 0]),
    shoulderN: sN, elbowN: armN.joint, handN: armN.end, shoulderF: sF, elbowF: armF.joint, handF: armF.end,
    hipN, kneeN: legN.joint, ankleN: legN.end, toeN: at(B.footN, [4.6, -1.1, 0]), hipF, kneeF: legF.joint, ankleF: legF.end, toeF: at(B.footF, [4.6, -1.1, 0]),
  };
  const joints = Object.fromEntries(Object.entries(J).map(([k, v]) => [k, [v[0], -v[1], v[2]]]));
  const bones = [["pelvis", "waist"], ["waist", "chest"], ["chest", "neck"], ["neck", "head"], ["head", "crown"], ["chest", "shoulderN"], ["shoulderN", "elbowN"], ["elbowN", "handN"], ["chest", "shoulderF"], ["shoulderF", "elbowF"], ["elbowF", "handF"], ["pelvis", "hipN"], ["hipN", "kneeN"], ["kneeN", "ankleN"], ["ankleN", "toeN"], ["pelvis", "hipF"], ["hipF", "kneeF"], ["kneeF", "ankleF"], ["ankleF", "toeF"]];
  return { joints, bones, handles: ["handN", "handF", "ankleN", "ankleF"] };
}
/** The figure taken apart: each part drawn alone, with its own outline, and where its middle is. For exploded views. */
function posedParts(pose) {
  const out = [];
  for (const [name, part] of Object.entries(PART)) {
    onlyPart = part;
    const r = render(pose);
    onlyPart = 0;
    if (!r.n) continue;
    let cx = 0, cy = 0;
    for (let i = 0; i < r.n; i++) { cx += r.xs[i]; cy += r.ys[i]; }
    out.push({ name, part, n: r.n, xs: r.xs, ys: r.ys, color: r.color, cx: cx / r.n, cy: cy / r.n, z: r.z });
  }
  return out;
}

};
/* ../pixelfx_src/src/core/act.js */
__defs[13] = function (__exports) {
__get(__exports, "STAND", () => STAND);
__get(__exports, "posed", () => posed);
__get(__exports, "lerpPose", () => lerpPose);
__get(__exports, "poseAt", () => poseAt);
__get(__exports, "Target", () => Target);
__get(__exports, "actSpan", () => actSpan);
__get(__exports, "createAct", () => createAct);
__get(__exports, "actTiming", () => actTiming);
__get(__exports, "actBounds", () => actBounds);
__get(__exports, "SKINS", () => SKINS);
// An act: an effect performed. The character winds up, lets go and recovers, a target takes the hit, and everything
// freezes for a moment on contact. Effects describe it as data (`export const act`), so a game with its own character
// can read the same timing. The freeze, the shake, the springy target and poses held on 12 fps steps are how Hollow Crown
// plays its skills (https://github.com/rehan-remade/hollow-crown), MIT License, Copyright (c) 2026 rehan-remade.

const { Rng, clamp } = __req(3);
const { hex, mix } = __req(4);
const { createFrame, clearFrame, createFx, painterFor } = __req(10);
const { stockActor, drawActor, actorAlphaOf, HERO2, DUMMY_PAL } = __req(11);
const { posed, STAND } = __req(14);



// ---- poses over time
const lerp = (a, b, u) => a + (b - a) * u;
/** Between two poses: numbers move, everything else changes at the later key. */
function lerpPose(a, b, u) {
  const out = { ...STAND, ...a };
  const B = { ...STAND, ...b };
  for (const k of Object.keys(B)) {
    const v = B[k];
    if (typeof v === "number" && typeof out[k] === "number") out[k] = lerp(out[k], v, u);
    else if (out[k] === undefined && typeof v === "number") out[k] = v;
  }
  // what the later pose doesn't mention eases back to its default
  for (const k of ["hx", "hy", "lean", "crouch"]) if (B[k] === undefined && typeof out[k] === "number") out[k] = lerp(out[k], 0, u);
  if (B.wl === undefined && typeof out.wl === "number") out.wl = lerp(out.wl, 1, u);
  return out;
}
const eases = { out: (u) => 1 - (1 - u) * (1 - u), in: (u) => u * u, line: (u) => u };
/**
 * The pose at time t on a track of keys [t, pose, how]: `how` says how the pose arrives: smoothly by default, "out"
 * fast then settling, "in" slowly then fast, "snap" holding the last pose and jumping on the key. Limbs move in whole
 * 12 fps steps counted from each key, so they read as held drawings; the feet's position over the floor (x, y) stays smooth.
 */
function poseAt(track, t) {
  if (t <= track[0][0]) return track[0][1];
  for (let i = 0; i < track.length - 1; i++) {
    const [t0, a] = track[i], [t1, b, how] = track[i + 1];
    if (t >= t1) continue;
    if (how === "snap") return a;
    const e = eases[how] ?? ((u) => u * u * (3 - 2 * u));
    const stepped = t0 + Math.floor((t - t0) * 12 + 1e-6) / 12;
    const out = lerpPose(a, b, e((stepped - t0) / (t1 - t0)));
    const u = e((t - t0) / (t1 - t0));
    out.x = lerp(a.x ?? 0, b.x ?? 0, u);
    out.y = lerp(a.y ?? 0, b.y ?? 0, u);
    return out;
  }
  return track[track.length - 1][1];
}

/** Is the body between keys that hardly differ, or past the last? */
function isHeld(track, t) {
  if (t >= track[track.length - 1][0] || t < track[0][0]) return true;
  for (let i = 0; i < track.length - 1; i++) {
    if (t >= track[i + 1][0]) continue;
    const a = { ...STAND, ...track[i][1] }, b = { ...STAND, ...track[i + 1][1] };
    return track[i + 1][0] - track[i][0] > 0.4 && ["fx", "fy", "bx", "by", "crouch", "lean", "x", "y"].every((k) => Math.abs((a[k] ?? 0) - (b[k] ?? 0)) < 1.5);
  }
  return true;
}

// ---- the target
const TW = 38, TH = 52;
const TP = Object.fromEntries(Object.entries({ ink: "#0b0a1a", wood: "#724c2e", woodL: "#a0703a", woodD: "#4e331f", straw: "#d2aa55", strawL: "#f0d98a", burlapD: "#86643a", burlap: "#b38b57", burlapL: "#c9a26c", red: "#9a2f3c", redL: "#c4434f", white: "#ffffff" }).map(([k, v]) => [k, hex(v)]));
const DUST = ["#efe7dc", "#c9bfb8", "#8f8693", "#5a5468"].map(hex);
const DUMMY = new Uint32Array(TW * TH);
(function buildDummy() {
  const px = (x, y, c) => { if (x >= 0 && y >= 0 && x < TW && y < TH) DUMMY[y * TW + x] = c; };
  const R = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); };
  // the post and the crossbar
  R(15, 38, 8, 14, TP.ink); R(16, 34, 6, 18, TP.wood); R(16, 34, 2, 18, TP.woodL); R(20, 34, 2, 18, TP.woodD);
  R(1, 18, 36, 1, TP.ink); R(1, 23, 36, 1, TP.ink); R(1, 19, 36, 4, TP.wood); R(1, 19, 36, 1, TP.woodL); R(1, 22, 36, 1, TP.woodD);
  // straw bursting out of the ends of the arms
  for (const [bx, s] of [[0, -1], [33, 1]]) {
    R(bx, 17, 5, 8, TP.straw);
    for (const [dx, dy, c] of [[2, 16, TP.straw], [3, 15, TP.strawL], [1, 17, TP.strawL], [2, 25, TP.straw], [1, 26, TP.strawL], [3, 25, TP.burlapD], [2, 19, TP.strawL], [3, 21, TP.strawL], [1, 22, TP.burlapD], [2, 23, TP.strawL]]) px(bx + dx, dy, c);
    px(s < 0 ? bx - 1 : bx + 5, 19, TP.straw); px(s < 0 ? bx - 1 : bx + 5, 22, TP.strawL);
  }
  const sack = (x, y, w, h) => {
    R(x + 1, y, w - 2, 1, TP.ink); R(x + 1, y + h - 1, w - 2, 1, TP.ink);
    R(x, y + 1, 1, h - 2, TP.ink); R(x + w - 1, y + 1, 1, h - 2, TP.ink);
    R(x + 1, y + 1, w - 2, h - 2, TP.burlap);
    R(x + w - 4, y + 1, 3, h - 2, TP.burlapD);
    R(x + 1, y + h - 3, w - 2, 2, TP.burlapD);
    R(x + 1, y + 1, 1, h - 4, TP.burlapL); R(x + 1, y + 1, w - 6, 1, TP.burlapL);
    // the weave
    for (let j = y + 2; j < y + h - 2; j += 3) for (let i = x + 3 + (j % 2); i < x + w - 4; i += 4) px(i, j, TP.burlapD);
  };
  sack(9, 17, 20, 24);
  // the rings on its chest
  for (let y = 19; y < 36; y++) for (let x = 11; x < 27; x++) { const d = Math.hypot(x - 18.5, y - 27); if ((d > 4 && d < 5.4) || d < 1.9) px(x, y, x + y < 45 ? TP.redL : TP.red); }
  // the rope belt, and straw coming out under it
  for (let x = 10; x < 28; x++) { px(x, 36, x & 1 ? TP.woodL : TP.straw); px(x, 37, x & 1 ? TP.woodD : TP.wood); }
  for (const [x, y, c] of [[11, 41, TP.straw], [12, 42, TP.strawL], [14, 41, TP.strawL], [15, 42, TP.straw], [23, 41, TP.straw], [24, 42, TP.strawL], [26, 41, TP.straw], [13, 43, TP.straw], [25, 43, TP.straw]]) px(x, y, c);
  sack(10, 1, 18, 16);
  // X for eyes and a stitched mouth
  for (const ex of [14, 23]) for (let d = -2; d <= 2; d++) { px(ex + d, 7 + d, TP.ink); px(ex - d, 7 + d, TP.ink); }
  for (let x = 14; x < 24; x++) px(x, 12, x & 1 ? TP.ink : TP.burlapD);
  for (const x of [15, 18, 21]) { px(x, 11, TP.ink); px(x, 13, TP.ink); }
  // the rope at its neck, and straw for hair
  for (let x = 12; x < 26; x++) { px(x, 16, x & 1 ? TP.woodL : TP.straw); px(x, 17, x & 1 ? TP.wood : TP.woodD); }
  for (const [x, y, c] of [[13, 0, TP.straw], [15, 0, TP.strawL], [18, 0, TP.straw], [21, 0, TP.strawL], [24, 0, TP.straw], [9, 4, TP.straw], [28, 6, TP.straw], [8, 7, TP.strawL], [29, 3, TP.strawL]]) px(x, y, c);
})();
/** What a hit can leave on the target: [color, how much of it]. */
const SKINS = { flash: [TP.white, 1], char: [hex("#1a0c0e"), 0.72], ice: [hex("#a8e8ff"), 0.72], shadow: [hex("#3a1a70"), 0.5], holy: [hex("#fff4c0"), 0.5], red: [hex("#ff2040"), 0.45], shock: [hex("#8fd6ff"), 0.6], poison: [hex("#58c43a"), 0.5] };
const STRAW = [TP.strawL, TP.straw, TP.straw, TP.burlapD, TP.burlapD];

/** A straw target on a spring: it sways, flashes, takes a skin, shivers and sheds straw. (x, y): the floor under it, local space. */
class Target {
  constructor(x, seed = 5) {
    Object.assign(this, { x, theta: 0, omega: 0, flashT: 0, skin: null, skinFade: 0, shiver: 0, clock: 0, R: new Rng(seed), straw: [] });
  }
  hit({ push = 1.2, straw = 8, flash = 0.05, skin, shiver = 0, y = -26 } = {}) {
    this.omega += push;
    this.flashT = Math.max(this.flashT, flash);
    if (skin !== undefined) this.skin = skin;
    if (shiver) this.shiver = shiver;
    const R = this.R;
    for (let k = 0; k < straw; k++) {
      const back = R.next() < 0.3;
      this.straw.push({ x: this.x + R.range(-3, 3), y: y + R.range(-3, 3), vx: back ? R.range(-60, -5) : R.range(10, 130), vy: R.range(-120, -5), age: 0, life: R.range(1.2, 2.2), big: R.next() < 0.5 });
    }
  }
  step(dt) {
    this.clock += dt;
    this.omega += (-60 * this.theta - 3.4 * this.omega) * dt;
    this.theta = clamp(this.theta + this.omega * dt, -0.4, 0.42);
    if (this.flashT > 0) this.flashT -= dt;
    if (this.shiver > 0) this.shiver -= dt;
    for (const s of this.straw) {
      s.age += dt;
      s.vy += 210 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y >= 0) { s.y = 0; s.vx *= 0.2; s.vy = 0; }
    }
    this.straw = this.straw.filter((s) => s.age < s.life);
  }
  draw(C, W, H, X, Y, flip) {
    const tan = Math.tan(this.theta), sv = this.shiver > 0 ? (Math.floor(this.clock * 30) & 1 ? 1 : -1) : 0, name = this.flashT > 0 ? "flash" : this.skin, sk = name ? SKINS[name] : null;
    const base = X + (flip ? -this.x - 1 : this.x);
    for (let r = 0; r < TH; r++) {
      const o = Math.round((TH - 1 - r) * tan * 0.8) + sv;
      for (let x = 0; x < TW; x++) {
        const c = DUMMY[r * TW + x];
        if (!c) continue;
        const px = base + (flip ? -(x - 19 + o) - 1 : x - 19 + o), py = Y - TH + r;
        if (px >= 0 && py >= 0 && px < W && py < H) C[py * W + px] = sk ? mix(c, sk[0], sk[1]) : c;
      }
    }
  }
  drawStraw(C, W, H, X, Y, flip) {
    for (const s of this.straw) {
      const c = STRAW[Math.min(4, Math.floor((s.age / s.life) * 5))], lx = Math.round(s.x), ly = Math.round(s.y) - 1;
      for (let i = 0; i < (s.big ? 2 : 1); i++) {
        const px = X + (flip ? -(lx + i) - 1 : lx + i), py = Y + ly;
        if (px >= 0 && py >= 0 && px < W && py < H) C[py * W + px] = c;
      }
    }
  }
}

// ---- the act itself
const GHOST_LIFE = 0.16;
const REST_MASK = new Uint8Array(24 * 38), REST_PX = new Uint32Array(24 * 38);
HERO2.forEach((row, r) => [...row].forEach((ch, c) => {
  if (ch !== ".") {
    REST_MASK[r * 24 + c] = 1;
    REST_PX[r * 24 + c] = hex(DUMMY_PAL[ch]);
  }
}));

// every cell of the standing sprite, mapped to the nearest cell that's on the body
const NEAREST = new Int16Array(24 * 38).fill(-1);
for (let r = 0; r < 38; r++)
  for (let c = 0; c < 24; c++) {
    let best = -1, bd = 1e9;
    for (let y = Math.max(0, r - 7); y < Math.min(38, r + 8); y++)
      for (let x = Math.max(0, c - 7); x < Math.min(24, c + 8); x++) {
        const d = (x - c) * (x - c) + (y - r) * (y - r);
        if (REST_MASK[y * 24 + x] && d < bd) { bd = d; best = y * 24 + x; }
      }
    NEAREST[r * 24 + c] = best;
  }
const lum = (c) => (0.3 * (c & 255) + 0.59 * ((c >>> 8) & 255) + 0.11 * ((c >>> 16) & 255)) / 255;
// an effect's color over the standing body, moved onto a pixel of the pose: its color, at this pixel's own light and shade
function carry(v, rest, own) {
  const lv = lum(v);
  if (lv > 0.9 || v >>> 24 < 255) return v;
  const k = Math.max(0.45, Math.min(1.5, lum(own) / Math.max(0.08, lum(rest))));
  const ch = (n) => Math.min(255, Math.round(((v >>> n) & 255) * k));
  return (255 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** When an act's poses begin and end, in effect time (a loop ends when it's told to). */
function actSpan(mod) {
  const a = mod.act, D = mod.meta?.duration ?? 1, k = a?.poses;
  return { from: Math.min(0, k?.[0]?.[0] ?? 0), to: mod.meta?.loop ? Infinity : Math.max(D, k?.[k.length - 1]?.[0] ?? 0) };
}

/**
 * An effect performed: { fx, t, update(dt), draw(frame, { body, target }), shake, done() }. t runs from the first pose
 * (before the effect's own t = 0) to the last. update() holds everything still during a freeze; draw() paints the effect, the
 * character and the target together. o: the effect's options, with x, y placing the feet. Without an act, it just plays.
 */
function createAct(mod, o = {}) {
  const a = mod.act ?? {}, meta = mod.meta ?? {}, D = meta.duration ?? 1, flip = !!o.flip, seed = o.seed ?? meta.options?.seed ?? 1;
  const fx = createFx(mod, o), track = a.poses ?? [[0, { ...STAND }]], span = actSpan(mod);
  const X = o.x ?? 0, Y = o.y ?? 0;
  const targets = (a.targets ?? (a.target ? [a.target] : [])).map((g, i) => new Target(g.x ?? 66, seed + 4 + i));
  const hits = (a.hits ?? []).map((h) => ({ ...h })).sort((p, q) => p.t - q.t), dust = (a.dust ?? []).slice();
  const R = new Rng(seed + 9), specks = [];
  // after-images take the effect's own color unless the act names one
  const ramp = o.palette ?? meta.options?.palette, ghosts = [], gc = hex(a.ghost ?? ramp?.[Math.floor(ramp.length * 0.7)] ?? "#8fb4ff");
  let t = span.from, stop = 0, stopped = false, shakeT = 0, shake0 = 0, amp = 0, nh = 0, nd = 0, loopN = 0, gAcc = 0, last = null;
  const poseNow = () => {
    let tt = t;
    if (meta.loop && t >= D) tt = t % D;
    let q = poseAt(track, tt);
    // nothing is asked of him: he breathes
    if (!meta.loop && isHeld(track, tt)) {
      const up = Math.floor(tt * 3) & 1;
      q = { ...STAND, ...q, crouch: (q.crouch ?? 0) + up, fy: (q.fy ?? STAND.fy) + up, by: (q.by ?? STAND.by) + up };
    }
    last = q;
    return q;
  };
  let scratch = null;
  const scratchFor = (f) => {
    if (!scratch || scratch.a.w !== f.w || scratch.a.h !== f.h) scratch = { a: createFrame(f.w, f.h, f.ox, f.oy), b: createFrame(f.w, f.h, f.ox, f.oy) };
    return scratch;
  };
  const out = {
    fx, meta, act: a, targets,
    get t() { return t; },
    /** How far the whole picture is thrown right now, in px. */
    get shake() {
      if (shakeT <= 0) return [0, 0];
      const k = amp * (shakeT / shake0), f = Math.floor(shakeT * 60);
      return [Math.round(Math.sin(f * 2.4) * k), Math.round(Math.cos(f * 3.7) * k * 0.7)];
    },
    get frozen() { return stop > 0; },
    /** The pose he's in right now. */
    get pose() { return last; },
    update(dt) {
      if (shakeT > 0) shakeT -= dt;
      if (stop > 0) {
        stop -= dt;
        return;
      }
      const t0 = t;
      t += dt;
      if (t >= 0) fx.update(t0 < 0 ? t : dt);
      if (meta.loop && t >= D) {
        const n = Math.floor(t / D);
        if (n !== loopN) {
          loopN = n;
          nh = 0;
          nd = 0;
        }
      }
      const tt = meta.loop && t >= D ? t % D : t;
      for (; nh < hits.length && hits[nh].t <= tt; nh++) {
        const h = hits[nh];
        if (h.stop) stop = Math.max(stop, h.stop);
        if (h.shake) {
          shakeT = shake0 = h.shake;
          amp = h.amp ?? 2;
        }
        if (h.target !== false) targets.forEach((g, i) => (h.at === undefined || h.at === i) && g.hit(h));
        out.onHit?.(h);
      }
      for (; nd < dust.length && dust[nd].t <= tt; nd++) {
        const d = dust[nd], n = d.n ?? 6;
        for (let i = 0; i < n; i++) {
          const dir = d.dir ?? (R.next() < 0.5 ? -1 : 1);
          specks.push({ x: d.x + R.range(-3, 3), y: -1 - R.range(0, 2), vx: dir * R.range(22, 90), vy: R.range(-34, -6), age: 0, life: R.range(0.16, 0.4), big: R.next() < 0.45, c: d.c ? hex(d.c) : 0 });
        }
      }
      for (const k of specks) {
        k.age += dt;
        k.vx *= 1 - 5 * dt;
        k.vy += 110 * dt;
        k.x += k.vx * dt;
        k.y = Math.min(-1, k.y + k.vy * dt);
      }
      for (let i = specks.length - 1; i >= 0; i--) if (specks[i].age >= specks[i].life) specks.splice(i, 1);
      const q = poseNow();
      for (const g of targets) g.step(dt);
      // after-images while a key asks for them
      gAcc += dt;
      if (q.ghost && gAcc >= 1 / 30) {
        gAcc = 0;
        ghosts.push({ q, age: 0 });
        if (ghosts.length > 7) ghosts.shift();
      }
      for (const g of ghosts) g.age += dt;
      while (ghosts.length && ghosts[0].age > GHOST_LIFE) ghosts.shift();
    },
    /** Paint it. { body: false } leaves the character out, { target: false } the target. */
    draw(frame, { body = true, target: showTarget = true } = {}) {
      const W = frame.w, H = frame.h, q = last ?? poseNow(), active = t >= 0;
      const tgt = showTarget ? targets : [];
      const drawTargets = () => tgt.forEach((g) => g.draw(frame.color, W, H, FX, FY, flip));
      const drawStraw = () => tgt.forEach((g) => g.drawStraw(frame.color, W, H, FX, FY, flip));
      const drawDust = () => {
        for (const k of specks) {
          const c = k.c || DUST[Math.min(3, Math.floor((k.age / k.life) * 4))], lx = Math.round(k.x), py = FY + Math.round(k.y);
          for (let i = 0; i < (k.big ? 2 : 1); i++) {
            const px = flip ? FX - lx - i - 1 : FX + lx + i;
            if (px >= 0 && py >= 0 && px < W && py < H) frame.color[py * W + px] = c;
          }
        }
      };
      const FX = X - (frame.ox | 0), FY = Y - (frame.oy | 0);
      if (!body) {
        if (active) fx.draw(frame, "back");
        drawTargets();
        if (active) fx.draw(frame, "front");
        drawStraw();
        return;
      }
      const rx = Math.round(q.x ?? 0), ry = Math.round(q.y ?? 0), BX = FX + (flip ? -rx : rx), BY = FY + ry;
      const r = posed(q), mirror = flip;
      const paint = (i, color) => {
        const px = mirror ? BX - r.xs[i] - 1 : BX + r.xs[i], py = BY + r.ys[i];
        if (px < 0 || py < 0 || px >= W || py >= H) return;
        frame.color[py * W + px] = color;
        // he stays crisp in front of his own after-images
        if (ghosts.length) frame.light[py * W + px] = 0;
      };
      const drawGhosts = () => {
        for (const g of ghosts) {
          // after-images are light, not paint: they brighten what's behind them and leave nothing muddy
          const gr = posed(g.q), gx = FX + (flip ? -Math.round(g.q.x ?? 0) : Math.round(g.q.x ?? 0)), gy = FY + Math.round(g.q.y ?? 0), k = 0.5 * (1 - g.age / GHOST_LIFE);
          const gm = flip, r0 = (gc & 255) * k, g0 = ((gc >>> 8) & 255) * k, b0 = ((gc >>> 16) & 255) * k;
          for (let i = 0; i < gr.n; i++) {
            const px = gm ? gx - gr.xs[i] - 1 : gx + gr.xs[i], py = gy + gr.ys[i];
            if (px < 0 || py < 0 || px >= W || py >= H) continue;
            const j = py * W + px, d = frame.light[j];
            frame.light[j] = (255 << 24) | (Math.min(255, ((d >>> 16) & 255) + b0) << 16) | (Math.min(255, ((d >>> 8) & 255) + g0) << 8) | Math.min(255, (d & 255) + r0);
          }
        }
      };
      const shadow = () => {
        const sy = FY, cx = FX + (flip ? -rx : rx), hw = 10 + (Math.abs(q.ffx - q.fbx) >> 1) - Math.min(8, Math.abs(ry) >> 1);
        if (sy < 0 || sy >= H) return;
        for (let dy = 0; dy < 2; dy++)
          for (let x = -hw + dy * 2; x <= hw - dy * 2; x++) {
            const px = cx + x, i = (sy + dy) * W + px;
            if (px < 0 || px >= W || sy + dy >= H) continue;
            frame.color[i] = (frame.color[i] & 0xffffff) | (Math.max(frame.color[i] >>> 24, 110) << 24);
          }
      };
      if (!a.onBody) {
        // the effect doesn't care about the body: back, body, front
        if (active) fx.draw(frame, "back");
        drawTargets();
        shadow();
        drawGhosts();
        for (let i = 0; i < r.n; i++) paint(i, r.color[i]);
        if (active) fx.draw(frame, "front");
        drawStraw();
        drawDust();
        return;
      }
      // the effect paints the standing body: draw it there, then carry each body pixel to where the pose put it
      const { a: A, b: B } = scratchFor(frame);
      clearFrame(A);
      clearFrame(B);
      if (active) fx.draw(A, "back");
      B.color.set(A.color);
      B.light.set(A.light);
      const tt = meta.loop ? (t < 0 ? 0 : t % D) : clamp(t, 0, D), alpha = active ? actorAlphaOf(mod, tt, fx.options) : 1;
      drawActor(painterFor(B).place(FX, FY, flip), fx.options.actor ?? stockActor(2), alpha);
      if (active) fx.draw(B, "front");
      const follow = a.follow ?? 1, lean = (q.lean ?? 0) * follow, cr = (q.crouch ?? 0) * follow;
      // what's up on the body goes with it; what's on the floor stays on the floor
      const shiftOf = (ly) => {
        const k = clamp((-11 - ly) / 7, 0, 1), f = clamp((-1 - ly) / 6, 0, 1);
        return [Math.round(lean * k + rx * f), Math.round(cr * k + ry * f)];
      };
      const rest = (sx, sy) => {
        const c = (flip ? FX - sx - 1 : sx - FX) + 12, r0 = sy - FY + 38;
        return c >= 0 && r0 >= 0 && c < 24 && r0 < 38 && REST_MASK[r0 * 24 + c] === 1;
      };
      const C = frame.color, Ls = frame.light;
      const copy = (buf, sx, sy, s) => {
        const [dx, dy] = shiftOf(sy - FY), px = sx + (flip ? -dx : dx), py = sy + dy;
        if (px < 0 || py < 0 || px >= W || py >= H) return;
        const i = py * W + px;
        if (buf === Ls) {
          const d = Ls[i];
          Ls[i] = (255 << 24) | (Math.min(255, ((d >>> 16) & 255) + ((s >>> 16) & 255)) << 16) | (Math.min(255, ((d >>> 8) & 255) + ((s >>> 8) & 255)) << 8) | Math.min(255, (d & 255) + (s & 255));
        } else if (s >>> 24 === 255 || !C[i]) C[i] = s;
        else {
          const k = (s >>> 24) / 255, d = C[i];
          const ch = (n) => Math.round(((s >>> n) & 255) * k + ((d >>> n) & 255) * (1 - k));
          C[i] = (Math.max(s >>> 24, d >>> 24) << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0);
        }
      };
      drawTargets();
      shadow();
      for (let sy = 0; sy < H; sy++)
        for (let sx = 0; sx < W; sx++) {
          const c = A.color[sy * W + sx];
          if (c) copy(C, sx, sy, c);
        }
      drawGhosts();
      const restIndex = (s) => {
        const c = s % 24, r0 = (s / 24) | 0, sx = flip ? FX - (c - 12) - 1 : FX + c - 12, sy = FY + r0 - 38;
        return sx >= 0 && sy >= 0 && sx < W && sy < H ? sy * W + sx : -1;
      };
      for (let i = 0; i < r.n; i++) {
        const s = r.src[i] >= 0 ? NEAREST[r.src[i]] : -1;
        if (s < 0) {
          if (alpha > 0.5) paint(i, r.color[i]);
          continue;
        }
        const j = restIndex(s), v = j >= 0 ? B.color[j] : REST_PX[s];
        if (!v) continue;
        // the effect left this bit of body alone, or changed it: carry the change, on top of this pixel's own shading
        paint(i, v === REST_PX[s] ? r.color[i] : carry(v, REST_PX[s], r.color[i]));
      }
      for (let sy = 0; sy < H; sy++)
        for (let sx = 0; sx < W; sx++) {
          const j = sy * W + sx;
          if (B.color[j] && B.color[j] !== A.color[j] && !rest(sx, sy)) copy(C, sx, sy, B.color[j]);
          if (B.light[j] & 0xffffff) copy(Ls, sx, sy, B.light[j]);
        }
      drawStraw();
      drawDust();
    },
    /** Let a loop end: it fades out and done() goes true. */
    stop() {
      fx.stop();
      stopped = true;
    },
    /** One-shots end when the last pose is over. */
    done() {
      return stopped ? fx.done() : t >= span.to && stop <= 0;
    },
  };
  poseNow();
  return out;
}

/**
 * An act as plain data, for a game with its own character: how long the wind-up and recovery are, when to freeze and shake,
 * what a target should do, and the poses themselves. Times are in the effect's own seconds: start the effect at 0.
 */
function actTiming(mod) {
  const a = mod.act;
  if (!a) return null;
  const { from, to } = actSpan(mod), D = mod.meta?.duration ?? 1;
  return {
    windup: -from,
    recovery: mod.meta?.loop ? 0 : Math.max(0, to - D),
    onBody: !!a.onBody,
    targets: (a.targets ?? (a.target ? [a.target] : [])).map((g) => g.x ?? 66),
    hits: (a.hits ?? []).map((h) => ({ t: h.t, freeze: h.stop ?? 0, shake: h.shake ?? 0, amp: h.amp ?? 0, push: h.target === false ? 0 : h.push ?? 1.2, skin: h.skin, at: h.at })),
    poses: (a.poses ?? []).map(([t, pose, how]) => ({ t, how: how ?? "smooth", pose })),
  };
}

/** The box an act needs in local space, so nothing gets cut off: { x0, y0, x1, y1 }, sampled over its poses. */
function actBounds(mod) {
  const a = mod.act, [w, h] = mod.meta.size, [ox, oy] = mod.meta.origin;
  let x0 = -ox, y0 = -oy, x1 = w - ox, y1 = h - oy;
  const see = (p) => {
    const r = posed(p), X = Math.round(p.x ?? 0), Y = Math.round(p.y ?? 0), a = r.x0, b = r.x1;
    x0 = Math.min(x0, a + X - 1); x1 = Math.max(x1, b + X + 1); y0 = Math.min(y0, r.y0 + Y - 1); y1 = Math.max(y1, r.y1 + Y + 1);
  };
  const k = a?.poses;
  if (k) {
    for (let t = k[0][0]; t <= k[k.length - 1][0]; t += 1 / 12) see(poseAt(k, t));
    for (const key of k) see(key[1]);
  } else see(STAND);
  for (const g of a?.targets ?? (a?.target ? [a.target] : [])) {
    const tx = g.x ?? 66;
    x0 = Math.min(x0, tx - 30); x1 = Math.max(x1, tx + 36); y0 = Math.min(y0, -56);
  }
  return { x0, y0, x1, y1 };
}

};
/* ../pixelfx_src/src/core/poses.js */
__defs[15] = function (__exports) {
__get(__exports, "READY", () => READY);
// The stance acts start from. A pose only says what differs from standing easy (STAND in rig.js), in screen terms, px from
// the feet, y negative up. Give the hands and feet; the skeleton works out the rest.
//   x, y       where the feet are, from the effect's origin
//   crouch     hips lowered; lean  the spine bent forward (+) or back (-); hx, hy  the head rolled, nodded
//   fx, fy, fz the near (right) hand; bx, by, bz  the far (left) hand; ffx, ffy  the near foot; fbx, fby  the far foot
//   turn       how far the chest faces us, in radians (it follows the hands if you leave it out); yaw  the whole body turned
//              about its feet (0 faces right, pi faces left, in between towards us; a spin is really a spin)
//   twist      extra chest turn; armsFront  the far hand comes round in front of the chest
//   weapon, sa what the near hand holds and its angle on screen (radians, 0 points forward); two  both hands on it
//   wl, wz     foreshorten the weapon towards (or, wz -1, away from) the viewer: wl is its length on screen, 1 is full
//   pull, nocked  a bow drawn to the far hand, an arrow on the string
//   offWeapon, sb  a weapon in the far hand and its angle
//   toeF, toeB up on the toes; ghost  leave after-images
//
// How the body works. He faces right, three-quarters towards us, so his near shoulder is on the LEFT of the chest on screen and
// his far shoulder on the right: for arms raised or open to us, the near hand goes left (fx < 0) and the far hand right (bx > 0). A hand
// driving forward closes the chest and brings its shoulder round; a hand drawn back opens him up. Bones have fixed lengths: an arm reaches
// about 15 px from its shoulder (shoulders are near y = -29), a leg 17 px. Arms don't stretch, so step the body in rather than ask too much.
//
// How to hold things. Keep a little bend in the elbow. The blade lags the hand on a swing, so the wrist breaks and it whips. Long weapons
// rest in one hand with the butt on the floor and take the second hand to swing. Everything is in depth, so a weapon can swing round the front
// of him: turn the body (yaw) and the weapon goes with it.

const READY = { crouch: 3, fx: 11, fy: -21, bx: 9, by: -21, ffx: 7, fbx: -7 };

};
/* ../pixelfx_src/src/core/chain.js */
__defs[16] = function (__exports) {
__get(__exports, "chain", () => chain);
__get(__exports, "shiftKeys", () => shiftKeys);
__get(__exports, "shiftHits", () => shiftHits);
// Moves: several effects played as one. A cue says which effect, when, where and for how long; a projectile is just an
// effect whose x is a function of time. It's an ordinary effect from the outside: it plays, recolors and exports.

const { createFx } = __req(10);

/**
 * create(o) for a list of cues: { fx (an effect module), t (when it starts), until (cut it off here), x, y (numbers, or
 * functions of the move's time, local space), flip, ...any of that effect's options }.
 */
function chain(cues) {
  return (o) => {
    const list = cues.map(({ fx, t, until, x, y, flip, ...opts }, i) => ({ fx, t: t ?? 0, until: until ?? Infinity, x: x ?? 0, y: y ?? 0, flip: !!flip, opts: { ...opts, seed: (o.seed ?? 1) + i }, inst: null, over: false }));
    let t = 0;
    const at = (v) => (typeof v === "function" ? v(t) : v);
    const each = (p, layer) => {
      const { frame, tx, ty, fx: sign, cs, sn, fade, lightK } = p;
      for (const c of list) {
        if (!c.inst || c.over) continue;
        c.inst.options.x = tx + sign * at(c.x);
        c.inst.options.y = ty + at(c.y);
        c.inst.options.flip = sign < 0 !== c.flip;
        c.inst.draw(frame, layer);
      }
      // each one places the painter for itself: put it back for whoever draws next
      Object.assign(p, { tx, ty, fx: sign, cs, sn, fade, lightK });
    };
    return {
      update(dt) {
        t += dt;
        for (const c of list) {
          if (c.over || t < c.t) continue;
          if (!c.inst) c.inst = createFx(c.fx, c.opts);
          else c.inst.update(dt);
          if (t >= c.until || (c.inst.done() && !c.fx.meta?.loop)) c.over = true;
        }
      },
      drawBack: (p) => each(p, "back"),
      draw: (p) => each(p, "front"),
    };
  };
}

/** Reuse an act's keys in a longer move: later by dt, moved along by dx, with anything else laid over each pose. */
const shiftKeys = (keys, dt, { dx = 0, ...over } = {}) => keys.map(([t, pose, how]) => [t + dt, { ...pose, ...over, x: (pose.x ?? 0) + dx }, how]);
/** The same for hits. */
const shiftHits = (hits, dt) => hits.map((h) => ({ ...h, t: h.t + dt }));

};
/* ../pixelfx_src/src/core/index.js */
__defs[2] = function (__exports) {

// pixelfx core: everything an effect imports comes from here.

__star(__exports, __req(3));
__star(__exports, __req(4));
__star(__exports, __req(5));
__star(__exports, __req(6));
__get(__exports, "Particles", () => __req(7).Particles); __get(__exports, "Bits", () => __req(7).Bits); __get(__exports, "Lights", () => __req(7).Lights); __get(__exports, "Blazes", () => __req(7).Blazes); __get(__exports, "P", () => __req(7).P); __get(__exports, "PF", () => __req(7).PF); __get(__exports, "B", () => __req(7).B); __get(__exports, "GRAVITY", () => __req(7).GRAVITY); __get(__exports, "FIRE_RAMP", () => __req(7).FIRE_RAMP); __get(__exports, "SMOKE_RAMP", () => __req(7).SMOKE_RAMP); __get(__exports, "sparkle", () => __req(7).sparkle); __get(__exports, "flare", () => __req(7).flare); __get(__exports, "band", () => __req(7).band); __get(__exports, "crystal", () => __req(7).crystal);
__get(__exports, "Painter", () => __req(8).Painter);
__get(__exports, "FONTS", () => __req(9).FONTS); __get(__exports, "textWidth", () => __req(9).textWidth);
__get(__exports, "createFrame", () => __req(10).createFrame); __get(__exports, "clearFrame", () => __req(10).clearFrame); __get(__exports, "createFx", () => __req(10).createFx); __get(__exports, "composite", () => __req(10).composite); __get(__exports, "painterFor", () => __req(10).painterFor); __get(__exports, "resolveOptions", () => __req(10).resolveOptions);
__get(__exports, "stockActor", () => __req(11).stockActor); __get(__exports, "drawActor", () => __req(11).drawActor); __get(__exports, "actorAlphaOf", () => __req(11).actorAlphaOf); __get(__exports, "HERO", () => __req(11).HERO); __get(__exports, "HERO2", () => __req(11).HERO2); __get(__exports, "HERO_PAL", () => __req(11).HERO_PAL); __get(__exports, "DUMMY_PAL", () => __req(11).DUMMY_PAL);
__get(__exports, "backdrop", () => __req(12).backdrop); __get(__exports, "BACKDROPS", () => __req(12).BACKDROPS);
__get(__exports, "createAct", () => __req(13).createAct); __get(__exports, "actBounds", () => __req(13).actBounds); __get(__exports, "actSpan", () => __req(13).actSpan); __get(__exports, "actTiming", () => __req(13).actTiming); __get(__exports, "poseAt", () => __req(13).poseAt); __get(__exports, "lerpPose", () => __req(13).lerpPose); __get(__exports, "Target", () => __req(13).Target); __get(__exports, "STAND", () => __req(13).STAND); __get(__exports, "SKINS", () => __req(13).SKINS); __get(__exports, "posed", () => __req(13).posed);
__get(__exports, "skeleton", () => __req(14).skeleton); __get(__exports, "posedParts", () => __req(14).posedParts);
__get(__exports, "READY", () => __req(15).READY);
__get(__exports, "chain", () => __req(16).chain); __get(__exports, "shiftKeys", () => __req(16).shiftKeys); __get(__exports, "shiftHits", () => __req(16).shiftHits);

};
/* ../pixelfx_src/src/fx/fire/_lib.js */
__defs[17] = function (__exports) {
__get(__exports, "pnoise", () => pnoise);
__get(__exports, "noiseFor", () => noiseFor);
__get(__exports, "looped", () => looped);
__get(__exports, "flameTongue", () => flameTongue);
__get(__exports, "flameBlade", () => flameBlade);
__get(__exports, "solid", () => solid);
__get(__exports, "soft", () => soft);
__get(__exports, "firePuff", () => firePuff);
__get(__exports, "lick", () => lick);
__get(__exports, "smokePuff", () => smokePuff);
__get(__exports, "ember", () => ember);
__get(__exports, "spark", () => spark);
__get(__exports, "drift", () => drift);
__get(__exports, "sparkAt", () => sparkAt);
__get(__exports, "floorLight", () => floorLight);
__get(__exports, "simDraw", () => simDraw);
__get(__exports, "burn", () => burn);
__get(__exports, "flicker", () => flicker);
__get(__exports, "hotFirst", () => hotFirst);
__get(__exports, "LAYERS", () => LAYERS);
__get(__exports, "BIG_LAYERS", () => BIG_LAYERS);
__get(__exports, "BACK_LAYERS", () => BACK_LAYERS);
// Shared by the fire effects (the leading _ keeps the tools from listing it as an effect).
// Flame tongues, licks, flame puffs that cool into smoke, embers and sparks, with their motion in closed form so
// looping effects can draw them from t alone and stay seamless. The tongue, lick, puff, smoke, ember and spark
// recipes are adapted from Sprite Fusion's open-source fire (https://www.spritefusion.com/pixel-art-vfx/fire),
// MIT License, Copyright (c) 2026 Hugo Duprez.

const { rand, rng, wrap, noise, mix, hex, clamp, WHITE, SMOKE_RAMP, P, PF } = __req(2);

/** Smooth value noise in [-1, 1] that repeats every `period` cells (a whole number). */
function pnoise(x, period, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const a = rand(wrap(i, period), seed), b = rand(wrap(i + 1, period), seed);
  return (a + (b - a) * u) * 2 - 1;
}

/**
 * Noise for a loop D seconds long: N(tt, rate, seed, off) wobbles about `rate` times a second and is the same at
 * tt and tt + D. Pass D = 0 for one-shots (plain noise, no repeat).
 */
function noiseFor(D) {
  if (!D) return (tt, rate, seed = 0, off = 0) => noise(tt * rate + off, seed);
  return (tt, rate, seed = 0, off = 0) => {
    const P = Math.max(1, Math.round(rate * D));
    return pnoise((tt / D) * P + off, P, seed);
  };
}

/**
 * Seamless particles for a loop D seconds long: count particles, each born at its own phase and reborn every D.
 * make(r, i) builds particle i from its own rng (the same every frame) and returns it with a .life (which may
 * be longer than D); draw(q, age, i) is called for every live copy.
 */
function looped(t, D, count, seed, make, draw) {
  for (let i = 0; i < count; i++) {
    const r = rng(seed, i), born = r.next() * D, q = make(r, i);
    for (let age = wrap(t - born, D); age < q.life; age += D) draw(q, age, i);
  }
}

/** Hugo's flicker, 0.74 to 1: a slow breath and a fast crackle. N(rate, seed) at the current time. */
const flicker = (N, s = 0) => 0.74 + 0.16 * N(7.3, 1 + s) + 0.1 * N(19, 2 + s);

/** A fire ramp hot-first (H[0] white .. H[8] smouldering) from a palette dark to bright, any length. */
const hotFirst = (F) => [...F].reverse();

/** Tongue layers [width share, height share, step of the hot-first ramp]: red rim, orange, yellow, white heart. */
const LAYERS = [[1, 1, 6], [0.76, 0.86, 4], [0.54, 0.68, 2], [0.3, 0.42, 0]];

/** Layers for big tongues: more orange and a smaller white heart, so the light doesn't wash them out. */
const BIG_LAYERS = [[1, 1, 6], [0.8, 0.9, 5], [0.62, 0.78, 4], [0.44, 0.6, 3], [0.26, 0.4, 1], [0.12, 0.22, 0]];

/** The same layers a step cooler, for flames further back: dark red rim, deep orange, gold, yellow. */
const BACK_LAYERS = [[1, 1, 7], [0.76, 0.86, 5], [0.54, 0.68, 3], [0.3, 0.42, 2]];

/**
 * A flame tongue standing at (x, y), h tall, w its half-width at the base, its tip swept sx px sideways: a red
 * rim round orange round yellow round a white heart, every row's width and centre jittered by noise so the
 * edges crackle. N(rate, seed, off) is the effect's noise at this frame; n seeds this tongue. H: hot-first ramp.
 * jit: how far the edges crackle (px); wob: how far the tip wanders (px).
 */
function flameTongue(p, x, y, h, w, sx, N, n, H, layers = LAYERS, jit = 0.5, wob = 1.1) {
  if (h < 1) return;
  for (const [lw, lh, ri] of layers) {
    const L = h * lh, c = H[ri];
    for (let r = 0; r <= L; r++) {
      const u = r / Math.max(1, L);
      const half = w * lw * Math.pow(1 - u, 0.85) * Math.min(1, (r + 1.5) / 3.5) + N(9, n, r * 0.45) * jit;
      if (half < 0.3) continue;
      const cx = x + sx * u * u * lh + N(4, n + 7, r * 0.2) * u * wob, Y = Math.round(y - r);
      for (let px = Math.round(cx - half), x1 = Math.round(cx + half); px <= x1; px++) p.px(px, Y, c);
    }
  }
}

/**
 * The same tongue lying along any direction (ux, uy) from its root (x, y): for jets, breath and comet tails.
 * len long, w half-width at the root, bend: px the tip is swept sideways (to the left of the direction).
 */
function flameBlade(p, x, y, ux, uy, len, w, bend, N, n, H, layers = LAYERS, jit = 0.5, wob = 1.1) {
  if (len < 1) return;
  const nx = -uy, ny = ux;
  for (const [lw, lh, ri] of layers) {
    const L = len * lh, c = H[ri];
    for (let r = 0; r <= L; r += 0.5) {
      const u = r / Math.max(1, L);
      const half = w * lw * Math.pow(1 - u, 0.85) * Math.min(1, (r + 1.5) / 3.5) + N(9, n, r * 0.45) * jit;
      if (half < 0.3) continue;
      const off = bend * u * u * lh + N(4, n + 7, r * 0.2) * u * wob, cx = x + ux * r + nx * off, cy = y + uy * r + ny * off;
      for (let q = -half; q <= half; q += 0.5) p.px(cx + nx * q, cy + ny * q, c);
    }
  }
}

/** A solid disc drawn straight in screen space (fast; a disc looks the same mirrored or turned). */
function solid(p, x, y, r, c) {
  if (r < 0.6) return p.px(x, y, c);
  const cx = p.toX(x, y), cy = p.toY(x, y), r2 = r * r;
  for (let sy = Math.floor(cy - r); sy <= Math.ceil(cy + r); sy++) {
    const dy = sy + 0.5 - cy, s2 = r2 - dy * dy;
    if (s2 < 0) continue;
    const s = Math.sqrt(s2);
    for (let sx = Math.ceil(cx - s - 0.5); sx <= Math.floor(cx + s - 0.5); sx++) p.put(sx, sy, c, 1);
  }
}

/** A translucent disc in screen space: smoke and haze. */
function soft(p, x, y, r, c, a) {
  if (a <= 0.004) return;
  if (r < 0.5) return p.blend(x, y, c, a);
  const cx = p.toX(x, y), cy = p.toY(x, y), r2 = r * r;
  for (let sy = Math.floor(cy - r); sy <= Math.ceil(cy + r); sy++) {
    const dy = sy + 0.5 - cy, s2 = r2 - dy * dy;
    if (s2 < 0) continue;
    const s = Math.sqrt(s2);
    for (let sx = Math.ceil(cx - s - 0.5); sx <= Math.floor(cx + s - 0.5); sx++) p.blendPx(sx, sy, c, a);
  }
}

/**
 * A ball of flame with life left k (1 new, 0 gone) cooling down the hot-first ramp H as it ages: a darker rim,
 * a lit core up and to the left, a little tongue on top, a hot heart while it's young, and its light.
 * frac (0..1) nudges how hot it starts. (tx, ty): which way its tongue points (up, unless it's streaming).
 */
function firePuff(p, x, y, k, size, frac, H, glowK = 0.18, tx = 0, ty = -1) {
  const age = 1 - k, n = H.length, heat = Math.min(0.999, Math.pow(age, 0.62) + frac * 0.1);
  const idx = Math.min(n - 2, Math.floor(heat * (n - 1)));
  const r = size * (0.55 + 0.45 * Math.min(1, age * 7)) * (1 - age * 0.55), c = H[idx];
  if (idx >= n - 2) return soft(p, x, y, r, c, Math.min(1, k * 3) * 0.85);
  solid(p, x, y, r, H[Math.min(n - 1, idx + 2)]);
  if (r > 1.6 && ty > -0.99) solid(p, x + tx * r * 1.5, y + ty * r * 1.5, r * 0.3, H[Math.min(n - 1, idx + 1)]);
  solid(p, x - r * 0.16, y - r * 0.22, r * 0.78, c);
  if (r > 1.6) solid(p, x + tx * r * 0.9, y + ty * r * 0.9, r * 0.42, c);
  if (idx <= 3 && r > 1.8) solid(p, x - r * 0.28, y - r * 0.34, r * 0.36, H[Math.max(0, idx - 1)]);
  if (idx < 6) p.glow(x, y, r * 2.4 + 2, c, glowK * k);
}

/** A lick: a blob of flame torn off a tongue's tip, a red rim round a yellow heart, shrinking as it rises. */
function lick(p, x, y, k, s, H) {
  const r = s * (0.4 + 0.6 * k);
  solid(p, x, y, r + 0.6, k > 0.5 ? H[5] : H[6]);
  if (k > 0.35) solid(p, x, y - 0.3, r * 0.6, k > 0.7 ? H[2] : H[4]);
}

const rampAt = (r, t) => r[Math.min(r.length - 1, Math.max(0, Math.floor(t * r.length)))];

/**
 * A puff of smoke with life left k: three soft discs (a body, a denser core sitting low, a lit cap while it's
 * young), swelling and thinning. col tints it (0 for plain smoke); big for slower, fuller smoke.
 */
function smokePuff(p, x, y, k, size, col = 0, big = false, aMul = 1) {
  const age = 1 - k;
  const r = size * (0.65 + Math.min(1, age * 2.5) * 0.45 + age * (big ? 0.5 : 0.4));
  const a = Math.min(1, age * 12) * Math.min(1, k * 2.4) * (big ? 0.7 : 0.58) * aMul;
  const c = col ? mix(col, rampAt(SMOKE_RAMP, age), age) : rampAt(SMOKE_RAMP, age * 1.05);
  soft(p, x, y, r, c, a * 0.45);
  soft(p, x + r * 0.05, y + r * 0.06, r * 0.74, c, a * 0.62);
  if (age < 0.5) soft(p, x - r * 0.22, y - r * 0.3, r * 0.5, mix(c, WHITE, 0.12), a * 0.4 * (1 - age * 2));
}

/**
 * An ember with life left k: a hot pixel cooling through cols [hot, warm, cool, rim], flickering out near the
 * end (ph: its flicker phase), with its own light. Big ones (size 2) are a little cross with a darker rim.
 */
function ember(p, x, y, k, size, cols, ph) {
  if (k < 0.25 && Math.sin(ph) < 0) return;
  const c = k > 0.6 ? cols[0] : k > 0.3 ? cols[1] : cols[2];
  if (size >= 2) {
    const rim = k > 0.45 ? cols[2] : cols[3];
    p.px(x - 1, y, rim), p.px(x + 1, y, rim), p.px(x, y - 1, rim), p.px(x, y + 1, rim);
    p.px(x, y, c);
    p.glow(x, y, 8, c, 0.4 * k);
    return;
  }
  p.px(x, y, c);
  if (size > 1.4) p.px(x, y + 1, cols[3]);
  p.glow(x, y, 3 + size, c, 0.35 * k);
}

/** A spark: a streak stretched along its velocity, a hot head and a cooler tail, and a point of light. */
function spark(p, x, y, vx, vy, k, cols) {
  const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp, len = Math.min(9, 1 + sp * 0.022);
  const head = k > 0.6 ? cols[0] : k > 0.3 ? cols[1] : cols[2];
  p.line(x - ux * len, y - uy * len, x - ux * len * 0.4, y - uy * len * 0.4, k > 0.5 ? head : cols[cols.length - 1]);
  p.line(x - ux * len * 0.45, y - uy * len * 0.45, x, y, head);
  p.glow(x, y, 3, head, 0.45 * k);
}

function along(x, v, a, k, t) {
  if (k <= 0) return [x + v * t + 0.5 * a * t * t, v + a * t];
  const e = Math.exp(-k * t), vt = a / k;
  return [x + vt * t + ((v - vt) * (1 - e)) / k, vt + (v - vt) * e];
}

/**
 * Where a body is t seconds after launch from (x, y) at (vx, vy), under acceleration (ax, ay) px/s² and linear
 * drag kx, ky (1/s): [x, y, vx, vy]. The particle kinds' own numbers: FIRE (0, -95, 5, 3.2), SMOKE
 * (0, -16, 1.6, 1.2), EMBER (0, -30, 1.6, 1.6), SPARK (0, 427, 2.2, 2.2).
 */
function drift(x, y, vx, vy, t, ax, ay, kx, ky) {
  const X = along(x, vx, ax, kx, t), Y = along(y, vy, ay, ky, t);
  return [X[0], Y[0], X[1], Y[1]];
}

/** A spark's flight: falls, drags, and bounces off the floor at y = floor, losing speed each time. */
function sparkAt(x, y, vx, vy, t, floor = 0, g = 427, k = 2.2) {
  let s = [x, y, vx, vy], left = t;
  for (let b = 0; b < 3; b++) {
    const e = drift(s[0], s[1], s[2], s[3], left, 0, g, k, k);
    if (e[1] < floor || s[1] >= floor) return e;
    let lo = 0, hi = left;
    for (let i = 0; i < 16; i++) {
      const m = (lo + hi) / 2;
      if (drift(s[0], s[1], s[2], s[3], m, 0, g, k, k)[1] < floor) lo = m;
      else hi = m;
    }
    const c = drift(s[0], s[1], s[2], s[3], hi, 0, g, k, k);
    s = [c[0], floor - 0.25, c[2] * 0.7, -Math.abs(c[3]) * 0.45];
    left -= hi;
  }
  const e = drift(s[0], s[1], s[2], s[3], left, 0, g, k, k);
  return e[1] < floor ? e : [e[0], floor - 0.25, e[2], 0];
}

/** A pool of light on the floor: an ellipse of glow, k at its middle falling to 0 at its rim. */
function floorLight(p, x, y, rx, ry, c, k) {
  if (k <= 0.004 || rx < 1 || ry < 0.5) return;
  p.shade(x - rx, y - ry, x + rx, y + ry, (px, py, out) => {
    const dx = (px - x) / rx, dy = (py - y) / ry, d = dx * dx + dy * dy;
    if (d >= 1) return;
    const f = 1 - Math.sqrt(d);
    out.l = c;
    out.k = f * f * k;
  });
}

/**
 * A core Particles system drawn with its flame puffs recoloured down the hot-first ramp H (the core draws them
 * in its own fire colours): smoke and back particles, then the flames, then sparks and the rest on top.
 */
function simDraw(p, ps, H, layer) {
  const all = ps.list, rest = [], fire = [];
  for (const q of all) (q.k === P.FIRE ? fire : rest).push(q);
  const puffs = (back) => {
    for (const q of fire) if (q.delay <= 0 && !!(q.flag & PF.BACK) === back) firePuff(p, q.x, q.y, q.life / q.max, q.size, q.seed % 1, H);
  };
  ps.list = rest;
  if (layer !== "front") ps.draw(p, "back"), puffs(true);
  if (layer !== "back") puffs(false), ps.draw(p, "front");
  ps.list = all;
}

const SMOKE1 = hex("#5b5566");

/**
 * A fire for loops, drawn from t alone. Tongues T: [[dx, dy, height share, half-width, back row?], ...] from the
 * base (o.x, o.y), back row first then outer to inner; licks torn off their tips, flame puffs that burn out into
 * smoke, a smoke plume curling off with the draught, embers, and the fire's light.
 * o: { H, D, NL (noiseFor(D)), S (seed), height, lean, rates per second: puffs and licks (per tongue), smoke,
 * embers; spread (how wide embers and smoke leave), glow (light strength), glowR, mid() (called after the
 * tongues, before what flies off them: draw what the fire burns out of there) }. Wide tongues get BIG_LAYERS.
 * Returns { tip(i, tt), fl (this frame's flicker) }.
 */
function burn(p, t, T, o) {
  const { H, D, NL, S } = o, HC = o.height, X = o.x ?? 0, Y = o.y ?? 0, W = o.spread ?? 6, G = o.glow ?? 1;
  const N = (rate, seed = 0, off = 0) => NL(t, rate, seed, off);
  const fla = (tt) => 0.74 + 0.16 * NL(tt, 7.3, S + 1) + 0.1 * NL(tt, 19, S + 2), fl = fla(t);
  const SMOKE = mix(SMOKE1, H[6], 0.25), EMB = [H[1], H[2], H[4], H[6]], GLOW = mix(mix(H[3], H[4], 0.5), WHITE, 0.25);
  const R = rng(S, 77), count = (rate) => Math.round(rate * D);
  const TT = T.map(([dx, dy, h, w, back], i) => ({ dx: dx + R.range(-0.3, 0.3), y: dy, h: 2 + HC * h * R.range(0.92, 1.08), w: w * R.range(0.92, 1.08), back, env: h, n: (S * 7 + i) * 13 }));
  const lean = (tt) => NL(tt, 0.67, S + 90) * (o.lean ?? 0.1);
  const height = (i, tt) => {
    const { h, n } = TT[i], leap = Math.max(0, NL(tt, 2.6, n + 70) - 0.55) * 1.4;
    return (h + 0.25 * h * NL(tt, 3.3, n) + h * leap) * (0.9 + 0.1 * fla(tt));
  };
  const sweep = (i, tt, h) => NL(tt, 2.2, TT[i].n + 40) * (1 + h * 0.08) + lean(tt) * h * 0.9 - clamp(TT[i].dx * 0.3, -2.5, 2.5);
  const tip = (i, tt) => {
    const h = height(i, tt);
    return [X + TT[i].dx + sweep(i, tt, h) * 0.85, Y + TT[i].y - h * 0.88 + 3, h];
  };
  const tongueAt = (i) => {
    const { dx, y, w, n, back } = TT[i], h = height(i, t);
    flameTongue(p, X + dx, Y + y, h, w, sweep(i, t, h), N, n, H, back ? BACK_LAYERS : w > 2.2 ? BIG_LAYERS : LAYERS, 0.5, 1.1 + h * 0.04);
  };

  // the plume: each puff keeps the sway the plume had when it left, so the wiggle climbs it
  looped(t, D, count(o.smoke ?? 12), S + 300, (r) => ({ x: r.range(-W, W) * 0.7, y: -HC * 0.8 - r.range(0, 6), vx: r.range(-2, 2), vy: -r.range(10, 17), life: r.range(...(o.smokeLife ?? [1.6, 2.6])), s: r.range(0.7, 1.1) * (o.smokeSize ?? 3) }), (q, age) => {
    const [x, y] = drift(q.x, q.y, q.vx, q.vy, age, o.wind ?? 3, -20, 1.6, 1);
    smokePuff(p, X + x + NL(t - age, 0.8, S + 60) * (1.5 + 2.5 * age), Y + y, 1 - age / q.life, q.s, SMOKE);
  });
  // flame puffs shed from the tips
  const puffs = [];
  looped(t, D, TT.length * count(o.puffs ?? 8), S + 200, (r, j) => {
    const i = j % TT.length, fire = r.range(0.14, 0.3), smokes = r.chance(0.45);
    return { i, fire, smokes, sl: r.range(0.8, 1.4), ox: r.range(-1, 1), oy: r.range(0, 4), vx: r.range(-4, 4), vy: -r.range(15, 30), s: r.range(0.8, 1.6) * (0.8 + 0.6 * TT[i].env), f: r.next(), life: fire + (smokes ? 1.4 : 0) };
  }, (q, age) => {
    const [tx, ty] = tip(q.i, t - age);
    const [x, y, vx, vy] = drift(tx + q.ox, ty + q.oy, q.vx, q.vy, Math.min(age, q.fire), 0, -95, 5, 3.2);
    if (age < q.fire) return puffs.push([x, y, 1 - age / q.fire, q.s, q.f]);
    if (age - q.fire > q.sl) return;
    const [sx, sy] = drift(x, y, vx * 0.6, vy * 0.6 - 6, age - q.fire, o.wind ?? 3, -16, 1.6, 1.2);
    smokePuff(p, sx, sy, 1 - (age - q.fire) / q.sl, q.s * 0.7, 0);
  });
  for (let i = 0; i < TT.length; i++) if (TT[i].back) tongueAt(i);
  for (let i = 0; i < TT.length; i++) if (!TT[i].back) tongueAt(i);
  o.mid?.(fl);
  // licks torn off the tips, rising and shrinking
  looped(t, D, TT.length * count(o.licks ?? 4), S + 220, (r, j) => ({ i: j % TT.length, vx: r.range(-3, 3), vy: -r.range(12, 22), s: r.range(0.9, 1.6) * (0.8 + 0.5 * TT[j % TT.length].env), life: 0.26 }), (q, age) => {
    const [tx, ty] = tip(q.i, t - age);
    lick(p, tx + q.vx * age, ty - 2 + q.vy * age, 1 - age / q.life, q.s, H);
  });
  for (const [x, y, k, s, f] of puffs) firePuff(p, x, y, k, s, f, H);
  // embers carried up by the heat, wandering and cooling
  looped(t, D, count(o.embers ?? 8), S + 500, (r) => ({ x: r.range(-W, W), y: -r.range(HC * 0.3, HC * 0.8), vx: r.range(-15, 15), vy: -r.range(25, 60), life: r.range(1.1, 2.4), s: r.chance(0.15) ? 2 : r.range(1, 1.6), a: r.range(0, 6.3), b: r.range(0, 6.3) }), (q, age) => {
    const [x, y] = drift(q.x, q.y, q.vx, q.vy, age, 0, -30, 1.6, 1.6);
    ember(p, X + x + 7 * (Math.sin(age * 2.3 + q.a) - Math.sin(q.a)), Y + y + 2 * (Math.sin(age * 3 + q.b) - Math.sin(q.b)), 1 - age / q.life, q.s, EMB, age * 40 + q.a);
  });
  // light: a broad warm wash, lights on the flames, a hot heart at the base
  if (G > 0) {
    const R1 = o.glowR ?? 46, lx = X + lean(t) * 12;
    p.glow(lx, Y - HC * 0.35, R1 * 1.5, GLOW, 0.22 * fl * G);
    p.glow(lx, Y - HC * 0.75, R1, GLOW, 0.34 * fl * G);
    p.glow(X, Y - HC * 0.2, R1 * 0.32, H[2], 0.2 * fl * G);
    p.glow(X, Y - 2, 8, H[0], 0.14 * fl * G);
  }
  return { tip, fl };
}

};
/* ../pixelfx_src/src/fx/fire/fireball.js */
__defs[1] = function (__exports) {
__get(__exports, "draw", () => draw);
__get(__exports, "meta", () => meta);
// The flame-puff, smoke and spark recipe is adapted from Sprite Fusion's open-source explosion
// (https://www.spritefusion.com/pixel-art-vfx/explosion), MIT License, Copyright (c) 2026 Hugo Duprez.
const { fit, mix, hex, clamp, WHITE, TAU } = __req(2);
const { noiseFor, pnoise, hotFirst, flameBlade, firePuff, smokePuff, spark, ember, drift, looped, LAYERS } = __req(17);

const meta = {
  name: "Fireball",
  desc: "A fireball flying right: a churning white-hot head with a corona of flame, a long torn tail of flame puffs cooling into smoke, embers shed behind.",
  tags: ["fire", "fireball", "projectile", "magic", "directional", "loop"],
  size: [136, 56],
  origin: [112, 28],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"],
    radius: 5,
    speed: 120,
    seed: 5,
  },
};

const D = meta.duration, NL = noiseFor(D), SMOKE1 = hex("#5b5566");
// the comet body: tongues rooted in the head streaming back, the longest behind [length, half-width, y offset]
const BODY = [[30, 4.2, 0], [23, 4.4, -1.6], [22, 4.4, 1.6], [15, 4.6, 0]];
// the corona: thin licks peeling back off the head [angle on the head (0 is the nose), length, half-width]
const CORONA = [[-1.3, 6, 1.1], [-1.8, 8, 1.2], [-2.3, 7, 1.1], [1.3, 6, 1.1], [1.8, 8, 1.2], [2.3, 7, 1.1]];

// the head: a ball whose outline churns and whose heat swirls in a spiral, white at the heart, swept back
function head(p, H, t, R0, S, hx, hy) {
  const ph = t / D;
  p.shade(hx - R0 * 2.4, hy - R0 * 1.7, hx + R0 * 1.5, hy + R0 * 1.7, (x, y, out) => {
    x -= hx;
    y -= hy;
    const d = Math.hypot(x, y), th = Math.atan2(y, x), back = Math.max(0, -Math.cos(th)), a = th / TAU;
    const bump = 0.55 * pnoise(a * 9 + ph * 9, 9, S) + 0.35 * pnoise(a * 5 - ph * 10, 5, S + 1);
    const rim = R0 * (1 + 0.55 * back * back) + bump;
    if (d > rim) return;
    const swirl = pnoise(a * 5 - ph * 10 + d * 0.45, 5, S + 2);
    const h = 1 - d / rim + 0.26 * swirl + 0.1 * (1 - back);
    // the leading edge: a crisp hot rim where it cuts the air
    if (rim - d < 1 && back < 0.3) return h > 0.3 ? H[3] : H[5];
    return h > 0.74 ? H[0] : h > 0.58 ? H[1] : h > 0.42 ? H[2] : h > 0.27 ? H[4] : h > 0.13 ? H[5] : H[6];
  });
}

function draw(p, t, o) {
  const F = fit(o.palette, 9), H = hotFirst(F), S = o.seed, R0 = o.radius, V = o.speed;
  const N = (rate, seed = 0, off = 0) => NL(t, rate, seed, off);
  const GLOW = mix(mix(H[3], H[4], 0.5), WHITE, 0.25), SMOKE = mix(SMOKE1, H[6], 0.3), SPARKS = [H[1], H[2], H[4], H[5]], EMB = [H[1], H[2], H[4], H[6]];
  // the head bobs a hair as it flies
  const hx = N(3, S + 50) * 0.5, hy = N(2.5, S + 51) * 0.7;

  // the tail: flame puffs thrown off the back that the head leaves behind; they cool, swell, rise and some
  // burn out into smoke. Positions are relative to the head, which outruns them.
  const fire = [], smoke = [];
  looped(t, D, 130, S + 100, (r) => {
    const fl = r.range(0.22, 0.55), sm = r.chance(0.55), x = -r.range(2, 24);
    return { x, y: r.range(-1, 1) * (R0 - 0.1 * -x), v: V * r.range(0.3, 0.6), vy: r.range(-16, 16), fl, sm, sl: r.range(0.25, 0.45), s: r.range(1.3, 2.9), f: r.next() * 0.5 + 0.5 * (-x / 24), life: fl + (sm ? 0.45 : 0) };
  }, (q, age) => {
    const ta = Math.min(age, q.fl), [wx, y, wvx, vy] = drift(0, q.y, q.v, q.vy, ta, 0, -70, 4.5, 3);
    const x = q.x + wx - V * ta;
    if (age < q.fl) return fire.push([age, x, y, q]);
    if (!q.sm || age - q.fl > q.sl) return;
    const sa = age - q.fl, [sx, sy] = drift(x, y, wvx - V, vy * 0.6 - 6, sa, V * 2, -30, 2, 1.2);
    smoke.push([sa, sx, sy, q]);
  });
  for (const [sa, x, y, q] of smoke) smokePuff(p, x, y, 1 - sa / q.sl, q.s * 0.9, SMOKE);
  fire.sort((a, b) => b[0] - a[0]);
  for (const [age, x, y, q] of fire) {
    const u = age / q.fl;
    firePuff(p, x, y, 1 - u, q.s * (1 + 1.3 * u), q.f, H, 0.07, -0.86, -0.5);
  }

  // the body: tongues of flame rooted in the head streaming back, and a corona licking round it
  BODY.forEach(([len, w, dy], i) => {
    const n = (S * 5 + i) * 17, L = len * (0.82 + 0.25 * N(4, n)) * (1 + 0.3 * Math.max(0, N(2.4, n + 3)));
    flameBlade(p, hx + 1, hy + dy * 0.5, -1, dy * 0.02, L, w * R0 / 5, N(3, n + 5) * 3 + dy, N, n, H, LAYERS, 0.5, 1.1 + L * 0.05);
  });
  CORONA.forEach(([a, len, w], i) => {
    const n = (S * 5 + i + 20) * 17, L = len * (0.7 + 0.4 * (0.5 + 0.5 * N(6, n))), ox = Math.cos(a) * R0 * 0.85, oy = Math.sin(a) * R0 * 0.85;
    const dx = Math.cos(a) * 0.55 - 1, dy = Math.sin(a) * 0.55, l = Math.hypot(dx, dy);
    flameBlade(p, hx + ox, hy + oy, dx / l, dy / l, L, w, -Math.sign(a) * 1.5, N, n, H, LAYERS);
  });
  head(p, H, t, R0, S, hx, hy);

  // motes flicked off the head's skin: short hot streaks that die at once
  looped(t, D, 26, S + 200, (r) => ({ a: r.range(-2.4, 2.4), v: r.range(30, 70), life: r.range(0.08, 0.18) }), (q, age) => {
    const ca = Math.cos(q.a), sa = Math.sin(q.a), d = R0 * 0.9 + q.v * age, x = hx + ca * d - V * 0.4 * age, y = hy + sa * d;
    const k = 1 - age / q.life, L = 1 + 2 * k;
    p.line(x - ca * L + V * 0.02, y - sa * L, x, y, k > 0.5 ? H[1] : H[3]);
    p.glow(x, y, 3, H[2], 0.4 * k);
  });
  // embers left behind: streaks that the head outruns, falling as they cool
  looped(t, D, 30, S + 300, (r) => ({ x: -r.range(2, 16), y: r.range(-3, 3), v: V * r.range(0.3, 0.8), vy: r.range(-20, 20), life: r.range(0.25, 0.55), big: r.chance(0.25), ph: r.range(0, 6.3) }), (q, age) => {
    const [wx, y, wvx, vy] = drift(0, q.y, q.v, q.vy, age, 0, 50, 3, 2);
    const x = q.x + wx - V * age, k = 1 - age / q.life;
    if (q.big) ember(p, x, y, k, 2, EMB, age * 40 + q.ph);
    else spark(p, x, y, wvx - V, vy, k, SPARKS);
  });

  // light: a hot heart, a warm halo, light running down the tail
  const fl = 0.85 + 0.15 * N(9, S + 7);
  p.glowLine(hx - 6, hy, -50, -2, 12, GLOW, 0.2 * fl);
  p.glow(hx - 2, hy, 42, GLOW, 0.42 * fl);
  p.glow(hx, hy, 13, H[1], 0.3 * fl);
}

};
/* ../pixelfx_src/src/fx/ice/_lib.js */
__defs[19] = function (__exports) {
__get(__exports, "inPoly", () => inPoly);
__get(__exports, "centroid", () => centroid);
__get(__exports, "splitPoly", () => splitPoly);
__get(__exports, "iceOf", () => iceOf);
__get(__exports, "glassPoly", () => glassPoly);
__get(__exports, "Panes", () => Panes);
__get(__exports, "blade", () => blade);
__get(__exports, "flakeDesign", () => flakeDesign);
__get(__exports, "snowflake", () => snowflake);
__get(__exports, "endBy", () => endBy);
__get(__exports, "fractures", () => fractures);
__get(__exports, "drawFractures", () => drawFractures);
// Shared by the ice effects: panes of ice that tumble and skid, polygon helpers, a character turned to ice,
// cracks that race through a shape. Files starting with _ are helpers, not effects.
// The crack walk and the faceted crystal shading are adapted from Sprite Fusion's open-source ice
// (https://www.spritefusion.com/pixel-art-vfx/ice), MIT License, Copyright (c) 2026 Hugo Duprez.

const { GRAVITY, clamp, luma, TAU, WHITE } = __req(2);

/** Is (x, y) inside the polygon pts [[x, y], ...]? (even-odd rule) */
function inPoly(pts, x, y) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** A polygon's centroid and area: { x, y, area }. */
function centroid(pts) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [x0, y0] = pts[j], [x1, y1] = pts[i], k = x0 * y1 - x1 * y0;
    a += k;
    cx += (x0 + x1) * k;
    cy += (y0 + y1) * k;
  }
  if (Math.abs(a) < 1e-6) {
    const n = pts.length;
    return { x: pts.reduce((s, q) => s + q[0], 0) / n, y: pts.reduce((s, q) => s + q[1], 0) / n, area: 0 };
  }
  return { x: cx / (3 * a), y: cy / (3 * a), area: Math.abs(a) / 2 };
}

/** Cut a polygon along the line through (x, y) at angle a: the pieces with three corners or more. */
function splitPoly(pts, x, y, a) {
  const nx = -Math.sin(a), ny = Math.cos(a), side = (q) => (q[0] - x) * nx + (q[1] - y) * ny, L = [], Rt = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length], sp = side(p), sq = side(q);
    (sp >= 0 ? L : Rt).push(p);
    if (sp >= 0 !== sq >= 0) {
      const u = sp / (sp - sq), m = [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
      L.push(m);
      Rt.push(m);
    }
  }
  return [L, Rt].filter((s) => s.length >= 3);
}

/** A color turned to ice: its brightness picks a step of the ice ramp C (dark to bright), never the darkest. */
function iceOf(c, C) {
  const n = C.length, l = luma(c);
  return C[clamp(Math.round(((l < 0.12 ? 2 : 2 + l * 5.2) * (n - 1)) / 7), 1, n - 1)];
}

/** Fill a polygon with translucent color (true blending, no dither): glass, ice, light. */
function glassPoly(p, pts, c, a) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++)
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) if (inPoly(pts, x + 0.5, y + 0.5)) p.blend(x, y, c, a);
}

/**
 * Panes of ice: flat polygons that fly, spin and tumble end over end (they squash as they turn edge-on and
 * flash as they square up to the light), bounce on the floor, skid, settle and fade. Drawn as glass: a
 * translucent face, edges lit where they face the light, a glint.
 * add({ pts (corners around 0, 0), x, y, vx, vy, a (turn), va, f (tumble), vf, lit (0..1: how much light its
 * face catches), g, drag, bounce, life, brittle (breaks on that many hard landings), crumble (seconds it lies
 * still before it crumbles), solid (opaque: one `tone` 0..1, or shaded like a blade split along `ridge`, an angle) });
 * update(dt); draw(p, C)
 * with an ice ramp, dark to bright. onLand(q, x, y, speed) when one hits the floor hard, onCrumble(q) when one
 * that lay still crumbles away, onSkid(q, x, y) while one slides along the floor.
 */
class Panes {
  constructor(opts = {}) {
    this.list = [];
    this.ground = opts.ground ?? (() => Infinity);
    this.onLand = opts.onLand ?? null;
    this.onCrumble = opts.onCrumble ?? null;
    this.onSkid = opts.onSkid ?? null;
  }
  add(q) {
    const life = q.life ?? 1;
    this.list.push({ vx: 0, vy: 0, a: 0, va: 0, f: 0, vf: 0, lit: 0.6, g: 1, drag: 0.3, bounce: 0.35, rest: false, brittle: false, ...q, life, max: life });
  }
  get count() {
    return this.list.length;
  }
  /** The pane's corners as drawn: tumbled (squashed across its own width), turned and placed. */
  corners(q) {
    const ca = Math.cos(q.a), sa = Math.sin(q.a), k = Math.cos(q.f);
    return q.pts.map(([x, y]) => {
      const yy = y * k;
      return [q.x + x * ca - yy * sa, q.y + x * sa + yy * ca];
    });
  }
  seat(q) {
    let low = -Infinity;
    for (const c of this.corners(q)) low = Math.max(low, c[1]);
    return low;
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const q = this.list[i];
      if ((q.life -= dt) <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      const floor = this.ground(q.x) - 0.5;
      if (q.rest && q.crumble !== undefined && (q.restT = (q.restT ?? 0) + dt) > q.crumble) {
        this.onCrumble?.(q);
        this.list.splice(i, 1);
        continue;
      }
      if (q.rest) {
        // skidding: friction slows the slide and the spin, the pane stays seated on the floor
        if (Math.abs(q.vx) > 8) this.onSkid?.(q, q.x, floor + 0.5);
        q.x += q.vx * dt;
        q.vx -= q.vx * 7 * dt;
        q.a += q.va * dt;
        q.va -= q.va * 9 * dt;
        q.vf -= q.vf * 9 * dt;
        q.f += q.vf * dt;
        q.y -= this.seat(q) - floor;
        continue;
      }
      q.vy += GRAVITY * q.g * dt;
      q.vx -= q.vx * q.drag * dt;
      q.vy -= q.vy * q.drag * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.a += q.va * dt;
      q.f += q.vf * dt;
      const low = this.seat(q);
      if (q.g <= 0 || low < floor || q.vy <= 0) continue;
      q.y -= low - floor;
      if (q.vy > 70) (q.hits = (q.hits ?? 0) + 1), this.onLand?.(q, q.x, floor + 0.5, q.vy);
      if (q.brittle && q.vy > 70 && q.hits >= q.brittle) {
        this.list.splice(i, 1);
        continue;
      }
      if (q.vy > 70 && q.bounce > 0) {
        q.vy = -q.vy * q.bounce;
        q.vx *= 0.75;
        q.va *= 0.6;
        q.vf *= 0.5;
      } else {
        q.rest = true;
        q.vy = 0;
      }
    }
  }
  draw(p, C) {
    const n = C.length;
    for (const q of this.list) {
      const a = Math.min(1, q.life / 0.35), pts = this.corners(q), k = Math.cos(q.f), face = Math.abs(k);
      // the face: glassy, brighter the more it faces us and the more light it catches; it flashes as it squares up
      const lv = q.lit * (0.35 + 0.65 * face), flash = face > 0.97 && !q.rest;
      if (face > 0.25) {
        if (q.solid && q.tone !== undefined) {
          // a chunk of one face: its tone, brighter as it squares up to the light
          p.poly(pts, flash ? C[n - 1] : C[clamp(Math.round(1 + q.tone * 5 * (0.6 + 0.4 * face)), 1, n - 2)], a);
        } else if (q.solid) {
          // shaded like the blade it broke from: a lit side, a pale ridge, a deep side
          const rr = q.ridge ?? -Math.PI / 2, cr = Math.cos(rr), sr = Math.sin(rr), ca = Math.cos(q.a), sa = Math.sin(q.a);
          const rx = cr * ca - sr * k * sa, ry = cr * sa + sr * k * ca;
          let nx = -ry, ny = rx;
          if (nx * -0.55 + ny * -0.84 < 0) (nx = -nx), (ny = -ny);
          const lit = flash ? C[n - 1] : C[clamp(Math.round(3 + lv * 3), 3, n - 2)], deep = C[clamp(Math.round(1 + lv * 2), 1, 3)];
          p.poly(pts, (x, y) => {
            const d = (x - q.x) * nx + (y - q.y) * ny;
            return d > 0.6 ? lit : d > -0.6 ? C[n - 2] : deep;
          }, a);
        } else glassPoly(p, pts, flash ? C[n - 1] : C[clamp(Math.round(3 + lv * 3), 3, n - 2)], (0.3 + 0.35 * lv + (flash ? 0.3 : 0)) * a);
      }
      let cx = 0, cy = 0, top = 0;
      for (const [x, y] of pts) (cx += x), (cy += y);
      cx /= pts.length;
      cy /= pts.length;
      // edges: lit where they face the light (up and left), cool where they face away
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
        let nx = y1 - y0, ny = x0 - x1;
        if (nx * ((x0 + x1) / 2 - cx) + ny * ((y0 + y1) / 2 - cy) < 0) (nx = -nx), (ny = -ny);
        const l = Math.hypot(nx, ny) || 1, lit = (-nx * 0.55 - ny * 0.84) / l;
        p.line(x0, y0, x1, y1, face < 0.25 || lit > 0.35 ? C[n - 1] : lit > -0.25 ? C[n - 2] : q.solid ? C[1] : C[Math.max(2, n - 4)], a);
        if (pts[i][1] < pts[top][1]) top = i;
      }
      if (face > 0.7) p.dot(pts[top][0], pts[top][1], WHITE, a);
      p.glow(cx, cy, 5, C[n - 3], (flash ? 0.5 : 0.14) * a);
    }
  }
}

/**
 * A jagged ice blade standing on its base (bx, by), tip at (tx, ty), w wide at the base. Shaded in an ice ramp
 * C (dark to bright, 8 steps): a lit facet on the left with a pale edge, a bright ridge, a deep facet on the
 * right, a white tip, a dark rim, and a notch cut into one side so it reads as a shard, not a cone.
 * opts: { a (alpha), white (flash it white), glint (0..1: a highlight across it at that height, or -1),
 * jag (0..1: where the notch starts, or -1), dim (steps darker, for back rows) }.
 */
function blade(p, bx, by, tx, ty, w, C, opts = {}) {
  const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy);
  if (L < 1.5 || w < 0.5) return;
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, a = opts.a ?? 1, dim = opts.dim ?? 0, jag = opts.jag ?? -1, glint = opts.glint ?? -1;
  const K = (i) => C[clamp(i - dim, 0, C.length - 1)], hw = w / 2;
  // half widths on the left (lit) and right (shadow) sides at height u; the notch steps the right side in
  const left = (u) => hw * (1 - u) + 0.35, right = (u) => hw * (1 - u) * (jag >= 0 && u > jag ? 0.55 : 1) + 0.35, ridge = (u) => -w * 0.12 * (1 - u);
  const pad = hw + 2;
  p.shade(Math.min(bx, tx) - pad, Math.min(by, ty) - pad, Math.max(bx, tx) + pad, Math.max(by, ty), (x, y, o) => {
    const rx = x - bx, ry = y - by, u = (rx * ux + ry * uy) / L, s = rx * nx + ry * ny;
    if (u < 0) return;
    const l = left(Math.min(u, 1)), r = right(Math.min(u, 1));
    if (u > 1 || s < -l || s > r) {
      // a dark rim just outside the blade
      const over = u > 1 ? (u - 1) * L : 0, out = Math.max(over, s < -l ? -l - s : s - r);
      if (out < 1 && u < 1 + 1 / L) {
        o.c = K(0);
        o.a = a;
      }
      return;
    }
    o.a = a;
    if (opts.white) return (o.c = WHITE);
    const rd = ridge(u);
    let c;
    if (u > 0.88) c = WHITE;
    else if (Math.abs(s - rd) < 0.55) c = K(6);
    else if (s < rd) c = s + l < 1 ? K(6) : (s + l) / Math.max(1, rd + l) > 0.55 ? K(5) : K(4);
    else c = r - s < 1.1 ? K(1) : (s - rd) / Math.max(1, r - rd) > 0.5 ? K(2) : K(3);
    // the notch's ledge catches light; a little glitter in the lit facet
    if (jag >= 0 && Math.abs(u - jag) * L < 0.8 && s > rd) c = K(6);
    else if (s < rd && c !== K(6) && ((Math.floor(x) * 73856093) ^ (Math.floor(y) * 19349663)) % 997 < 30) c = K(7);
    if (glint >= 0 && s <= rd + 0.6) {
      const g = Math.abs(u - glint) * L;
      if (g < 0.8) c = WHITE;
      else if (g < 1.8) c = K(6);
    }
    o.c = c;
  });
}

/**
 * A snowflake design, seeded: pairs of side branches along each arm ([where 0..1, length 0..1 of the arm]),
 * maybe a hexagonal plate round the heart, maybe forked tips.
 */
function flakeDesign(R) {
  const n = R.int(1, 3), branches = [];
  for (let i = 0; i < n; i++) branches.push([0.38 + (0.4 * (i + R.range(0.2, 0.8))) / n, R.range(0.24, 0.36) * (1 - i * 0.15)]);
  return { branches, plate: R.chance(0.45), fork: R.chance(0.45) };
}

/**
 * A six-armed snowflake of radius r turned by rot, crisp 1 px lines: pale arms, side branches at 60 degrees,
 * a plate or forked tips by design, a white heart, light. hot (0..1) makes it twinkle white.
 */
function snowflake(p, x, y, r, rot, d, C, opts = {}) {
  const n = C.length, a = opts.a ?? 1, hot = opts.hot ?? 0;
  rot = Math.round(rot / (Math.PI / 18)) * (Math.PI / 18); // turn in 10 degree ticks, like sprite frames
  if (r < 1.2) {
    p.dot(x, y, WHITE, a);
    return;
  }
  if (r < 2.6) {
    // too small for branches: a six-point star that flips between two poses as it turns
    const pose = Math.floor(((rot % (Math.PI / 3)) + Math.PI / 3) / (Math.PI / 6)) % 2;
    const pts = pose ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 1], [-1, -1], [1, -1], [-1, 1]];
    for (const [dx, dy] of pts) p.dot(x + dx, y + dy, hot > 0.5 ? WHITE : C[n - 3], a);
    p.dot(x, y, WHITE, a);
    p.glow(x, y, 4, C[n - 3], 0.2 * a);
    return;
  }
  // detail by size: a bare star when small, one pair of branches when middling, the full design when big
  const arm = hot > 0.5 ? WHITE : C[n - 2], br = hot > 0.5 ? C[n - 2] : C[n - 3], big = r >= 7;
  const branches = r < 4 ? [] : big ? d.branches.slice(0, 2) : [[0.58, 0.36]];
  for (let k = 0; k < 6; k++) {
    const g = rot + (k * TAU) / 6, ca = Math.cos(g), sa = Math.sin(g);
    p.line(x, y, x + ca * r, y + sa * r, arm, a);
    for (const [u, l] of branches) {
      const bx = x + ca * r * u, by = y + sa * r * u, bl = Math.max(1, r * l);
      for (const s of [-1, 1]) p.line(bx, by, bx + Math.cos(g + (s * Math.PI) / 3) * bl, by + Math.sin(g + (s * Math.PI) / 3) * bl, br, a);
    }
    if (d.fork && big && !d.plate)
      for (const s of [-1, 1]) p.dot(x + ca * r + Math.cos(g + s * 0.9) * 1.2, y + sa * r + Math.sin(g + s * 0.9) * 1.2, br, a);
    p.dot(x + ca * r, y + sa * r, WHITE, a);
  }
  if (d.plate && big) {
    const q = r * 0.34;
    for (let k = 0; k < 6; k++) {
      const g0 = rot + Math.PI / 6 + (k * TAU) / 6, g1 = g0 + TAU / 6;
      p.line(x + Math.cos(g0) * q, y + Math.sin(g0) * q, x + Math.cos(g1) * q, y + Math.sin(g1) * q, C[n - 3], a);
    }
  }
  p.px(x, y, WHITE);
  p.glow(x, y, 3 + r * 1.2, C[n - 4], (0.14 + 0.35 * hot) * a);
  if (hot > 0.3) p.glow(x, y, 2 + r * 0.5, WHITE, 0.3 * hot * a);
}

/** Nothing outlives the effect: trims the life of every particle, bit and pane that would last past D. */
function endBy(t, D, ...systems) {
  const left = Math.max(0.001, D - 0.05 - t);
  for (const sys of systems) for (const q of sys.list) if (q.life > left) q.life = left;
}

/**
 * Cracks racing out from (x, y) through a shape: n jagged lines that wander, fork now and then and stop at
 * the shape's edge (inside(x, y) says what's in it). Each point carries its distance from the start along the
 * crack, so drawFractures can grow them at a speed. Returns polylines [[x, y, d], ...].
 */
function fractures(R, inside, x, y, n, opts = {}) {
  const out = [], step = opts.step ?? [1.6, 2.6], len = opts.len ?? 18, fork = opts.fork ?? 0.16, a0 = opts.a0 ?? R.range(0, TAU), spread = opts.spread ?? TAU;
  const walk = (x, y, d, a, len, depth) => {
    const pts = [[x, y, d]];
    for (let s = 0; s < len; s++) {
      a += R.range(-0.55, 0.55);
      const st = R.range(step[0], step[1]), nx = x + Math.cos(a) * st, ny = y + Math.sin(a) * st;
      if (!inside(nx, ny)) break;
      (x = nx), (y = ny), (d += st);
      pts.push([x, y, d]);
      if (depth < 2 && pts.length > 2 && R.chance(fork)) walk(x, y, d, a + R.sign() * R.range(0.6, 1.2), Math.ceil(len * 0.5), depth + 1);
    }
    if (pts.length > 1) out.push(pts);
  };
  for (let i = 0; i < n; i++) walk(x, y, 0, a0 + (i / n) * spread + R.range(-0.3, 0.3) * Math.min(1, spread / TAU), len, 0);
  return out;
}

/**
 * Draw cracks grown out to distance `reach` from their start: a bright line over a dark one a pixel lower (an
 * engraved fracture), a white-hot tip while they run, light leaking out along them. ox, oy shift them.
 */
function drawFractures(p, cracks, reach, C, opts = {}) {
  const n = C.length, ox = opts.ox ?? 0, oy = opts.oy ?? 0, hot = opts.hot ?? true, a = opts.a ?? 1;
  const seg = (pts, i) => {
    const [x0, y0, d0] = pts[i - 1], [x1, y1, d1] = pts[i];
    if (d0 >= reach) return null;
    const u = Math.min(1, (reach - d0) / Math.max(0.01, d1 - d0));
    return [x0 + ox, y0 + oy, x0 + ox + (x1 - x0) * u, y0 + oy + (y1 - y0) * u, reach - d1 < 3];
  };
  for (const pts of cracks)
    for (let i = 1; i < pts.length; i++) {
      const s = seg(pts, i);
      if (!s) break;
      p.line(s[0], s[1] + 1, s[2], s[3] + 1, C[Math.min(2, n - 1)], a);
    }
  for (const pts of cracks)
    for (let i = 1; i < pts.length; i++) {
      const s = seg(pts, i);
      if (!s) break;
      const tip = hot && s[4];
      p.line(s[0], s[1], s[2], s[3], tip ? WHITE : C[n - 2], a);
      if (tip) p.glow(s[2], s[3], 5, C[n - 3], 0.5 * a);
      else if (i % 2) p.glow(s[2], s[3], 3, C[n - 3], 0.18 * a);
    }
}

};
/* ../pixelfx_src/src/fx/ice/ice-lance.js */
__defs[18] = function (__exports) {
__get(__exports, "draw", () => draw);
__get(__exports, "meta", () => meta);
// The projectile recipe (a hot head, a trail that thins behind it, motes shed along the way, light riding the
// head) is adapted from Sprite Fusion's open-source energy bolt (https://www.spritefusion.com/pixel-art-vfx/energy),
// MIT License, Copyright (c) 2026 Hugo Duprez.
const { fit, cycle, fly, clamp, TAU, WHITE } = __req(2);
const { blade } = __req(19);

const meta = {
  name: "Ice lance",
  desc: "A faceted ice spear flying right: a light pulse runs through its core, rings of cold air shear off the tip, frost peels off into a wake and crystals shed behind it.",
  tags: ["ice", "lance", "spear", "projectile", "directional", "magic", "loop"],
  size: [176, 64],
  origin: [146, 32],
  duration: 0.8,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#151a3d", "#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#a6ecff", "#dcfbff", "#ffffff"], length: 40, seed: 13 },
};

// the spear: a hexagonal shaft seen from the side, row by row (a white top edge, a lit upper facet, a bright
// ridge, a cool lower facet, a deep keel, a dark rim), a long cutting point, a light pulse running through
// its ridge to the tip, a glint sliding back along the top
function spear(p, C, L, pulse, glint) {
  const T = 16, H = 3.5;
  const half = (x) => (x > -T ? H * (-x / T) + 0.3 : x < -L + 3 ? H * (0.7 + 0.3 * ((x + L) / 3)) : H);
  p.shade(-L - 1, -H - 2, 1, H + 2, (x, y, o) => {
    if (x > 0 || x < -L) return;
    const h = half(x);
    if (Math.abs(y) > h + 0.5) {
      if (Math.abs(y) < h + 1.5) o.c = C[1];
      return;
    }
    const v = y / Math.max(0.5, h);
    if (x > -1.5) return (o.c = WHITE);
    // three faces lit from above: a pale top facet, a mid front facet with a bright ridge, a deep underside
    if (v > -0.3 && v < 0.35 && Math.abs(x - pulse) < 2.5) return (o.c = WHITE);
    if (v < -0.3 && Math.abs(x - glint) < 1) return (o.c = WHITE);
    o.c = v < -0.72 ? WHITE : v < -0.36 ? C[6] : v < -0.18 ? C[7] : v < 0.38 ? C[4] : v < 0.78 ? C[2] : C[1];
  });
}

function draw(p, t, o) {
  const C = fit(o.palette, 8), D = meta.duration, S = o.seed, L = o.length, ph = t / D;
  // the wake: a ribbon of frost narrowing behind the spear, with cold light in it
  p.each(-L - 100, -12, -L + 4, 12, (x, y, sx, sy) => {
    const u = (-L + 4 - x) / 104, w = 4.5 * (1 - u) ** 0.7 + 0.5 + 1.5 * Math.sin(u * 9 - ph * TAU * 2) * u, v = Math.abs(y) / w;
    if (v >= 1) return;
    const a = (1 - v * v) * (1 - u) ** 1.4;
    if (a < 0.04) return;
    p.blendPx(sx, sy, v < 0.25 && u < 0.4 ? C[6] : v < 0.6 ? C[5] : C[4], a * 0.7);
    if (a > 0.3) p.add(sx, sy, C[5], 0.12 * a);
  });
  p.glowLine(-L - 60, 0, 0, 0, 14, C[4], 0.22);
  // frost peeling off the shaft into soft puffs left behind
  cycle(t, D, 14, S, (g) => g.range(0.35, 0.55), (age, life, r) => {
    const x0 = r.range(-L + 2, -8), [x, y] = fly(x0, r.range(-2.5, 2.5), -r.range(150, 230), r.sign() * r.range(8, 30), age, 0, 2.2);
    const k = age / life, rad = 1.2 + 5.5 * k, a = 0.5 * (1 - k) ** 1.3;
    p.disc(x, y, rad, k < 0.3 ? C[6] : C[5], (d) => a * (1 - d * d));
    p.glow(x, y, rad * 1.6, C[4], 0.1 * (1 - k));
  });
  // crystals shed along the way: short tumbling shards with a white edge, glinting, falling back
  cycle(t, D, 9, S + 1, (g) => g.range(0.4, 0.6), (age, life, r) => {
    const [x, y] = fly(r.range(-L, -6), r.range(-3, 3), -r.range(170, 260), r.range(-35, 35), age, 60, 1.2);
    const k = age / life, a = r.range(0, TAU) + age * r.range(10, 18) * r.sign(), l = r.range(1.2, 2.2), ca = Math.cos(a), sa = Math.sin(a);
    if (k > 0.85 && (age * 30) % 2 < 1) return;
    p.line(x - ca * l, y - sa * l, x + ca * l, y + sa * l, C[5]);
    p.px(x + ca * l, y + sa * l, WHITE);
    if (Math.cos(a * 2) > 0.9) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.px(x + dx, y + dy, C[6]);
      p.glow(x, y, 6, C[5], 0.45);
    }
  });
  // speed lines: the air streaming past above and below
  cycle(t, D, 12, S + 2, (g) => g.range(0.16, 0.26), (age, life, r) => {
    const y = r.sign() * r.range(4, 13), x = r.range(-20, 0) - age * r.range(280, 380), l = r.range(6, 16), k = age / life;
    p.line(x, y, x + l, y, (u) => (u > 0.7 ? C[6] : C[4]), (u) => u * (1 - k) * 1.4);
  });
  // rings of cold air shearing off the point and sliding back along the shaft: the near arc bright, the far dim
  for (let i = 0; i < 3; i++) {
    const q = (ph * 3 + i / 3) % 1, x = -4 - q * (L + 20), ry = 4.5 + q * 8, rx = 1.2 + q * 2.6;
    if (q > 0.8) continue;
    for (let k = 0; k < 40; k++) {
      const an = (k / 40) * TAU, px = x + Math.cos(an) * rx, py = Math.sin(an) * ry;
      if (Math.abs(py) < 4.6 && px > -L - 2) continue;
      p.px(px, py, Math.cos(an) > 0 ? (q < 0.35 ? WHITE : C[6]) : q < 0.4 ? C[5] : C[4]);
    }
    p.glowRing(x, 0, ry * 0.75, 3, C[5], 0.14 * (1 - q));
  }
  // the ice fletching at the back: three shards fanning out behind the shaft
  for (const [dy, l, w] of [[-1, 10, 4], [1, 9, 4], [-0.2, 6, 3]]) blade(p, -L + 3, dy * 1.5, -L + 3 - l, dy * (2 + l * 0.5), w, C);
  // the spear itself, a pulse of light running through it, a glint sliding back along the top
  const pulse = -L + ((ph * 2) % 1) * (L + 6), glint = -((ph * 2 + 0.5) % 1) * L * 1.2;
  spear(p, C, L, pulse, glint);
  p.glowLine(-L, 0, 0, 0, 10, C[4], 0.1);
  p.glow(pulse, 0, 8, C[6], 0.3);
  p.glow(0, 0, 8, WHITE, 0.4);
  p.glow(-L * 0.4, 0, 30, C[3], 0.16);
}

};
/* ../pixelfx_src/src/fx/projectiles/_lib.js */
__defs[21] = function (__exports) {
__get(__exports, "beat", () => beat);
__get(__exports, "wake", () => wake);
__get(__exports, "puff", () => puff);
__get(__exports, "cloud", () => cloud);
__get(__exports, "Smoke", () => Smoke);
__get(__exports, "spark", () => spark);
__get(__exports, "flashShape", () => flashShape);
__get(__exports, "flash", () => flash);
__get(__exports, "casing", () => casing);
__get(__exports, "drawCasing", () => drawCasing);
__get(__exports, "turnSprite", () => turnSprite);
__get(__exports, "pixelShape", () => pixelShape);
// Shared by the projectile effects: a steady emitter for loops, motion in a projectile's own frame, soft smoke
// puffs, speed-stretched sparks, muzzle-flash lobes, brass casings that bounce, and outlined pixel shapes.
// The smoke puff, spark streak, flash lobe and casing recipes are adapted from Sprite Fusion's open-source
// muzzle-flash and explosion (https://www.spritefusion.com/pixel-art-vfx/muzzle-flash),
// MIT License, Copyright (c) 2026 Hugo Duprez. Files starting with _ are helpers, not effects.

const { clamp, mix, rand, rng, wrap, WHITE } = __req(2);

/**
 * Like cycle(), but particle i is born exactly at i * period / n: an emitter with a steady beat, so a trail
 * has no clumps or gaps. Loops seamlessly over period. fn(age, life, r, i), r the same rng every period.
 */
function beat(t, period, n, seed, life, fn) {
  for (let i = 0; i < n; i++) {
    const L = typeof life === "function" ? life(rng(seed, i, 911)) : life;
    for (let age = wrap(t - (i * period) / n + 1e-7, period); age < L; age += period) fn(age, L, rng(seed, i), i);
  }
}

/**
 * Where something is after `age` seconds in the frame of a projectile that flies right at V px/s: launched
 * from (x, y) at (vx, vy) relative to the still air, slowed toward the air by drag k (1/s), pulled by g.
 * The air streams left at V, so whatever it carries streams left too. Returns [x, y, vx, vy] (screen motion).
 */
function wake(x, y, vx, vy, age, V, k, g = 0) {
  const e = Math.exp(-k * age), f = (1 - e) / k, vt = g / k;
  return [x + vx * f - V * age, y + vt * age + (vy - vt) * f, vx * e - V, vt + (vy - vt) * e];
}

/**
 * A soft smoke puff: a body, a denser core sitting low, a lit cap on top while it's young (cap 0..1), and
 * light from a fire on one side (warm 0..1 of color wc, coming from angle wa).
 */
function puff(p, x, y, r, a, c, cap = 1, warm = 0, wc = 0, wa = 0) {
  if (a <= 0.01 || r < 0.5) return;
  p.disc(x, y, r, c, a * 0.45);
  p.disc(x + r * 0.05, y + r * 0.06, r * 0.74, c, a * 0.62);
  if (cap > 0.02) p.disc(x - r * 0.22, y - r * 0.3, r * 0.5, mix(c, WHITE, 0.14), a * 0.42 * cap);
  if (warm > 0.02) p.disc(x + Math.cos(wa) * r * 0.32, y + Math.sin(wa) * r * 0.32, r * 0.55, wc, a * 0.7 * warm);
}

/**
 * Puffs [{ x, y, r, a, b (brightness 0..1), w (fire light 0..1) }] merged into one translucent volume: each
 * puff is lit on top and shaded underneath, densities add up, and tone and density come out in clean steps, so
 * a trail reads as one billowing cloud with lit crowns instead of a string of beads. R: smoke ramp, dark to
 * bright; WR: the same smoke lit by fire (a ramp as long as R), which young puffs (w) lean to. clip(x, y) can
 * keep it off part of the canvas.
 */
function cloud(p, list, R, WR, { dens = 1.5, max = 0.86, clip, lit = 1 } = {}) {
  if (!list.length) return;
  let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity;
  for (const q of list) {
    X0 = Math.min(X0, Math.floor(q.x - q.r)); X1 = Math.max(X1, Math.ceil(q.x + q.r));
    Y0 = Math.min(Y0, Math.floor(q.y - q.r)); Y1 = Math.max(Y1, Math.ceil(q.y + q.r));
  }
  const W = X1 - X0 + 3, H = Y1 - Y0 + 3, D = new Float32Array(W * H), L = new Float32Array(W * H), F = new Float32Array(W * H);
  X0--, Y0--;
  for (const q of list) {
    const r = q.r, r2 = r * r;
    for (let y = Math.floor(q.y - r); y <= Math.ceil(q.y + r); y++) {
      const dy = y + 0.5 - q.y;
      for (let x = Math.floor(q.x - r); x <= Math.ceil(q.x + r); x++) {
        const dx = x + 0.5 - q.x, d2 = (dx * dx + dy * dy) / r2;
        if (d2 >= 1) continue;
        // a ball's thickness: flat in the middle, steep at the rim, so every lump keeps its own crown
        const k = Math.sqrt(1 - d2) * q.a, i = (y - Y0) * W + (x - X0);
        D[i] += k;
        L[i] += k * q.b;
        F[i] += k * q.w * (0.5 + 0.5 * clamp(0.5 + dx / r));
      }
    }
  }
  // light the merged surface: where density climbs downward the cloud faces up and catches the light. The
  // gradient comes off a blurred copy, so only lump-sized features catch it, never the crossing rims
  const B = blur(blur(D, W, H, 1, 2), W, H, W, 2), n = R.length;
  p.each(X0 + 1, Y0 + 1, X1 + 1, Y1 + 1, (lx, ly, sx, sy) => {
    const cx = Math.floor(lx) - X0, cy = Math.floor(ly) - Y0;
    if (cx < 1 || cy < 1 || cx >= W - 1 || cy >= H - 1) return;
    const i = cy * W + cx, d = D[i];
    if (d < 0.05 || (clip && !clip(lx, ly))) return;
    const a = Math.min(max, Math.ceil((1 - Math.exp(-d * dens)) * 6) / 6);
    if (a < 0.15) return;
    const gy = B[i + W] - B[i - W], gx = B[i + 1] - B[i - 1], up = clamp(0.5 + Math.atan((gy * 0.9 + gx * 0.35) / (B[i] * 0.16 + 0.03)) * 0.42 * lit);
    const w = F[i] / d, j = clamp(Math.round((L[i] / d) * (0.3 + 0.7 * up) * (n - 1) + 0.25 + w * 1.5), 0, n - 1);
    p.blendPx(sx, sy, w > 0.03 ? mix(R[j], WR[j], Math.min(0.9, Math.ceil(w * 10) / 10)) : R[j], a);
  });
}

/**
 * Simulated smoke for one-shots, drawn with cloud(): add({ x, y, vx, vy, r0, r1, life, a, b, warm, drag, rise,
 * grow, curl, delay }). Puffs push out, slow (drag, 1/s), lift (rise, px/s²), sway, swell from r0 to r1, thin away
 * and darken as they age; warm (fire light) fades fast; curl (rad/s) keeps turning a puff's heading, so a chain of
 * them hooks round into a curl. puffs() gives the live list for cloud().
 */
class Smoke {
  constructor(rng) {
    this.R = rng;
    this.list = [];
    this.t = 0;
  }
  add(q) {
    this.list.push({ vx: 0, vy: 0, drag: 2.5, rise: 12, grow: 2, curl: 0, a: 0.6, b: 0.85, warm: 0, delay: 0, age: 0, seed: this.R.next() * 100, ...q });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    this.t += dt;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const q = this.list[i];
      if (q.delay > 0) {
        q.delay -= dt;
        continue;
      }
      if ((q.age += dt) >= q.life) {
        this.list.splice(i, 1);
        continue;
      }
      if (q.curl) {
        const c = Math.cos(q.curl * dt), s = Math.sin(q.curl * dt), vx = q.vx;
        q.vx = vx * c - q.vy * s;
        q.vy = vx * s + q.vy * c;
      }
      q.vy -= q.rise * dt;
      q.vx += Math.sin(this.t * 1.3 + q.seed) * 8 * dt;
      q.vx -= q.vx * q.drag * dt;
      q.vy -= q.vy * q.drag * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
  }
  puffs() {
    const out = [];
    for (const q of this.list) {
      if (q.delay > 0) continue;
      const k = q.age / q.life;
      out.push({ x: q.x, y: q.y, r: q.r0 + (q.r1 - q.r0) * (1 - Math.exp(-q.grow * q.age)), a: q.a * Math.min(1, q.age * 30) * Math.pow(1 - k, 1.3), b: q.b * (1 - k * 0.5), w: q.warm * Math.exp(-q.age * 5) });
    }
    return out;
  }
}

// a box blur of radius r along one axis of a w x h field (step 1 for rows, w for columns)
function blur(src, w, h, step, r) {
  const out = new Float32Array(src.length), n = step === 1 ? w : h, lines = step === 1 ? h : w, k = 1 / (2 * r + 1);
  for (let l = 0; l < lines; l++) {
    const base = step === 1 ? l * w : l;
    let acc = 0;
    for (let j = -r; j <= r; j++) acc += j >= 0 && j < n ? src[base + j * step] : 0;
    for (let j = 0; j < n; j++) {
      out[base + j * step] = acc * k;
      const a = j - r, b = j + r + 1;
      if (a >= 0) acc -= src[base + a * step];
      if (b < n) acc += src[base + b * step];
    }
  }
  return out;
}

/**
 * A spark: a two-tone streak stretched along its screen velocity, its head cooling down S (hot, warm, cool,
 * tail colors) as k (life left, 1..0) falls, with a point of light.
 */
function spark(p, x, y, vx, vy, k, S, glow = 0.45, stretch = 0.022, max = 9) {
  const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp, len = Math.min(max, 1 + sp * stretch);
  const head = k > 0.6 ? S[0] : k > 0.3 ? S[1] : S[2];
  p.line(x - ux * len, y - uy * len, x - ux * len * 0.4, y - uy * len * 0.4, k > 0.5 ? head : S[3]);
  p.line(x - ux * len * 0.45, y - uy * len * 0.45, x, y, head);
  p.glow(x, y, 3, head, glow * k);
}

/**
 * The lobes of one muzzle flash, drawn from rng r: a fat fireball at the muzzle, a spike forward, and a burst of
 * rays round it, longest forward, shortest blown back, each side on its own (diagonals, crossways, back),
 * so every shot is a different spiky star. Frame f 2 is the same shape cooled, shorter and thinner; the same r
 * sequence gives the same shape, so a shot keeps its shape across its frames.
 */
function flashShape(r, f, { size = 1, spike = [12, 20], diag = [5, 10], cross = [3, 6], back = [2, 4.5], core = 0.7 } = {}) {
  const k = f === 1 ? 1 : 0.6, w = f === 1 ? 1 : 0.72, S = size;
  const L = [
    { off: 0.5, a: r.range(-0.08, 0.08), len: r.range(5.5, 8) * S * k, wid: r.range(2.1, 2.6) * S * w, core: 0.5 * core },
    { off: 2, a: r.range(-0.07, 0.07), len: r.range(spike[0], spike[1]) * S * k, wid: r.range(1, 1.3) * S * w, core: 0.35 * core },
  ];
  const ray = (a, len, wid, on) => on && L.push({ off: r.range(0.5, 2), a, len: len * S * k, wid: wid * S * w, core: 0.25 * core });
  for (const s of [-1, 1]) {
    ray(s * r.range(0.3, 0.8), r.range(diag[0], diag[1]), r.range(1.1, 1.5), r.chance(0.85));
    ray(s * r.range(1.15, 1.7), r.range(cross[0], cross[1]), r.range(1, 1.3), r.chance(0.6));
    ray(s * r.range(2, 2.7), r.range(back[0], back[1]), 1, r.chance(0.7) && f === 1);
  }
  return L;
}
const profile = (l, u) => {
  const k = u / l.len;
  return l.wid * Math.pow(Math.max(0, 1 - k), 0.8) * Math.min(1, 0.45 + k * 3);
};

/**
 * Draw flash lobes L at (x, y) pointing along angle a: a white (or hot) core, a hot inner flame, a body and
 * a ragged rim, chosen by how deep a pixel sits inside its lobe. C: [core, inner, body, rim]. seed varies the
 * ragged edge. Returns the flash's reach.
 */
function flash(p, x, y, a, L, C, seed) {
  const c = Math.cos(a), s = Math.sin(a);
  let ext = 2;
  for (const l of L) ext = Math.max(ext, l.off + l.len + 2);
  p.shade(x - ext, y - ext, x + ext, y + ext, (px, py) => {
    const dx = px - x, dy = py - y, along = dx * c + dy * s, across = -dx * s + dy * c;
    let m = -9, hot = false, warm = false;
    for (const l of L) {
      const ca = Math.cos(l.a), sa = Math.sin(l.a), lu = (along - l.off) * ca + across * sa, lv = -(along - l.off) * sa + across * ca;
      if (lu < -1.5 || lu > l.len + 1) continue;
      const r = profile(l, Math.max(0, lu)), mm = r - Math.abs(lv);
      if (mm > m) m = mm;
      if (lu < l.len * l.core && Math.abs(lv) <= r * 0.5) hot = true;
      if (mm > r * 0.4) warm = true;
    }
    const dm = 1.6 - Math.hypot(along - 0.5, across);
    if (dm > m) m = dm;
    if (dm > 0.6) hot = true;
    m += (rand(Math.floor(px) * 73 + Math.floor(py) * 151, seed) - 0.5) * 0.5 * Math.min(1, ext / 14);
    if (m < -0.85) return;
    return m < 0 ? C[3] : hot ? C[0] : warm ? C[1] : C[2];
  });
  return ext;
}

/**
 * A brass casing thrown from (x, y) at (vx, vy) with spin va, falling under g onto a floor at y = floor:
 * it bounces (keeping `bounce` of its speed) until it's too slow, then slides to a stop. Closed form, so a
 * loop can draw it at any age. Returns { x, y, a (angle), rest, hit (seconds since the last bounce, or -1) }.
 */
function casing(x, y, vx, vy, va, age, g, floor, bounce = 0.42, a0 = 0) {
  let t0 = 0, a = a0, hit = -1;
  for (let n = 0; n < 6; n++) {
    // time to reach the floor from (x, y) moving (vx, vy)
    const d = floor - y, T = (-vy + Math.sqrt(Math.max(0, vy * vy + 2 * g * d))) / g;
    if (age - t0 < T) {
      const u = age - t0;
      return { x: x + vx * u, y: y + vy * u + 0.5 * g * u * u, a: a + va * u, rest: false, hit };
    }
    x += vx * T;
    a += va * T;
    t0 += T;
    hit = age - t0;
    const vin = vy + g * T;
    y = floor;
    if (vin * bounce < 45) {
      // too slow to hop again: slide to a stop, settling flat
      const u = age - t0, k = 7, s = (1 - Math.exp(-k * u)) / k;
      return { x: x + vx * 0.6 * s, y: floor, a: Math.round(a / Math.PI) * Math.PI, rest: true, hit };
    }
    vy = -vin * bounce;
    vx *= 0.55;
    va *= 0.6;
  }
  return { x, y: floor, a: Math.round(a / Math.PI) * Math.PI, rest: true, hit };
}

/** Draw a casing: a 3 px brass slug turned by its angle, lit on one end; a glint when it has just hit. */
function drawCasing(p, k, B, fade = 1) {
  const ca = Math.cos(k.a), sa = Math.sin(k.a), x = k.x, y = k.y - 0.5;
  p.dot(x - ca, y - sa, B[1], fade);
  p.dot(x, y, B[2], fade);
  p.dot(x + ca, y + sa, B[3], fade);
  if (k.hit >= 0 && k.hit < 0.07) {
    p.px(x + ca * 0.5, y - 1, WHITE);
    p.glow(x, y, 5, B[3], 0.55 * (1 - k.hit / 0.07));
  }
}

/**
 * A little sprite (rows of characters, pal mapping them to colors, "." empty) turned by ang about its pivot
 * (px, py in sprite pixels) placed at (x, y), sampled nearest-pixel so it stays hard-edged at any angle.
 */
function turnSprite(p, rows, pal, x, y, ang, px, py, a = 1) {
  const H = rows.length, W = rows[0].length, cs = Math.cos(ang), sn = Math.sin(ang), R = Math.hypot(Math.max(px, W - px), Math.max(py, H - py)) + 1;
  p.shade(x - R, y - R, x + R, y + R, (lx, ly, out) => {
    const dx = lx - x, dy = ly - y, i = Math.floor(dx * cs + dy * sn + px), j = Math.floor(-dx * sn + dy * cs + py);
    if (i < 0 || j < 0 || i >= W || j >= H) return;
    const c = pal[rows[j][i]];
    if (!c) return;
    out.c = c;
    out.a = a;
  });
}

/**
 * A pixel shape from a builder: build(set) calls set(px, py, ch) for every interior pixel; an outline ('o')
 * is added round it. Returns { rows, x0, y0 } ready for p.sprite at (x0, y0).
 */
function pixelShape(x0, y0, w, h, build) {
  const g = Array.from({ length: h }, () => Array(w).fill("."));
  const set = (px, py, ch) => {
    const i = px - x0, j = py - y0;
    if (i >= 0 && j >= 0 && i < w && j < h) g[j][i] = ch;
  };
  build(set);
  const solid = (i, j) => i >= 0 && j >= 0 && i < w && j < h && g[j][i] !== "." && g[j][i] !== "o";
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++)
      if (g[j][i] === "." && (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1))) g[j][i] = "o";
  return { rows: g.map((r) => r.join("")), x0, y0 };
}


};
/* ../pixelfx_src/src/fx/projectiles/laser-bolt.js */
__defs[20] = function (__exports) {
__get(__exports, "draw", () => draw);
__get(__exports, "meta", () => meta);
// The banded body, travelling pulses and spiralling sparks follow Sprite Fusion's open-source energy beam
// (https://www.spritefusion.com/pixel-art-vfx/energy), MIT License, Copyright (c) 2026 Hugo Duprez.
const { fit, rand, sparkle, TAU, WHITE } = __req(2);
const { beat } = __req(21);

const meta = {
  name: "Laser bolt",
  desc: "A red laser bolt: a white-hot core in a rounded head, red bands tapering back, pulses racing down it, a tail that shimmers apart into wavering dashes.",
  tags: ["projectile", "laser", "energy", "sci-fi", "directional", "loop"],
  size: [128, 32],
  origin: [108, 16],
  duration: 0.5,
  loop: true,
  fps: 30,
  bg: "sky",
  options: { palette: ["#2a0610", "#5c0d1c", "#9a1428", "#d8243a", "#ff4d5e", "#ff8a94", "#ffd0d4", "#ffffff"], length: 40, seed: 2 },
};

function draw(p, t, o) {
  const C = fit(o.palette, 8), L = o.length, S = o.seed, D = meta.duration, ph = t / D, fr = Math.floor(t * 30 + 1e-6);
  const left = -meta.origin[0] + 2;

  // the shimmering tail: dashes shed off the bolt's end, wavering, flickering and cooling as they fall behind
  beat(t, D, 14, S, (r) => r.range(0.18, 0.3), (age, life, r) => {
    const k = age / life, x0 = -L * 0.8 - age * r.range(150, 230), len = r.range(3, 7) * (1 - k * 0.5), y = 0.5 + Math.sin(x0 * 0.25 + ph * TAU * 2) * (0.5 + k * 1.5) + r.range(-0.6, 0.6) * k;
    if (x0 - len < left || rand(fr, r.int(0, 999)) < k * 0.5) return;
    p.line(x0, y, x0 - len, y, k < 0.3 ? C[5] : k < 0.6 ? C[4] : C[3]);
    if (k < 0.4) p.glow(x0 - len / 2, y, 4, C[4], 0.3 * (1 - k));
  });

  // the body: bands round a white core, thickest just behind the rounded head and tapering to a thread, a
  // pulse running back down it every so often; the edge breaks up a little as the light shimmers
  p.shade(-L - 1, -5, 4, 6, (x, y) => {
    const d = -x + 3, u = d / (L + 3);
    if (u < 0 || u > 1) return;
    const head = d < 3 ? Math.sqrt(Math.max(0, 1 - ((3 - d) / 3) ** 2)) : 1;
    const w = (3.4 * Math.pow(1 - u, 0.9) + 0.5) * head * (1 + 0.08 * Math.sin(d * 0.9 - ph * TAU * 4)), v = Math.abs(y - 0.5) / w;
    if (v > 1.2) return;
    if (v > 1 && (u > 0.5 || rand(Math.floor(x), fr) > 0.6)) return;
    const pulse = ((d * 0.05 - ph * 3) % 1 + 1) % 1 < 0.12 ? 1 : 0;
    const lvl = v < 0.22 ? (u < 0.6 ? 7 : 6) : v < 0.45 ? 6 - (u > 0.5 ? 1 : 0) : v < 0.72 ? 4 : v <= 1 ? 3 : 2;
    return C[Math.min(7, lvl + (v < 0.72 ? pulse : 0))];
  });
  // sparks spiralling round the core, a bright one on the near side and a dim one behind
  for (const s of [0, Math.PI]) {
    for (let d = 2; d < L * 0.7; d += 1) {
      const a = d * 0.45 - ph * TAU * 3 + s, y = 0.5 + Math.sin(a) * (2.2 * (1 - d / L) + 0.6);
      if (Math.cos(a) > 0.3) p.dot(-d, y, Math.cos(a) > 0.8 ? WHITE : C[6]);
    }
  }
  // the head's glint, flickering, and the light
  const g = 0.75 + 0.25 * Math.sin(ph * TAU * 2);
  sparkle(p, 1, 0.5, 3 + Math.round(g * 2), C[6], C[4], 0.5);
  p.glowLine(1, 0.5, -L, 0.5, 9, C[3], 0.4);
  p.glow(-2, 0.5, 20, C[3], 0.5 * g);
  p.glow(1, 0.5, 6, WHITE, 0.25);
}

};
/* ../pixelfx_src/src/fx/projectiles/bullet-tracer.js */
__defs[22] = function (__exports) {
__get(__exports, "draw", () => draw);
__get(__exports, "meta", () => meta);
// The spark and streak recipes are adapted from Sprite Fusion's open-source impact ricochet
// (https://www.spritefusion.com/pixel-art-vfx/impact), MIT License, Copyright (c) 2026 Hugo Duprez.
const { fit, rand, noise, smooth, TAU, WHITE } = __req(2);
const { beat, wake, spark, cloud } = __req(21);

const meta = {
  name: "Bullet tracer",
  desc: "A white-hot slug tearing along, its tracer burning behind it in a long streak that sputters and cools from white through gold to red, shedding sparks and a thread of smoke.",
  tags: ["projectile", "bullet", "tracer", "gun", "directional", "loop"],
  size: [200, 40],
  origin: [184, 18],
  duration: 0.6,
  loop: true,
  fps: 30,
  bg: "sky",
  options: {
    palette: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"],
    smoke: ["#2e2a36", "#46404f", "#625b6b", "#817a8a", "#a39caa"],
    length: 120,
    speed: 520,
    seed: 4,
  },
};

const SLUG = ["..oyyp..", ".ypwwwwp", "ywwwwwww", ".ypwwwwp", "..oyyp.."];

function draw(p, t, o) {
  const F = fit(o.palette, 9), SM = fit(o.smoke, 5), S = o.seed, D = meta.duration, L = o.length, V = o.speed;
  const fr = Math.floor(t * 30 + 1e-6), ph = (TAU * t) / D, left = -meta.origin[0] + 2;

  // a thread of smoke off the cool end of the trace, wavering as it thins
  const puffs = [];
  beat(t, D, 18, S + 7, (r) => r.range(0.5, 0.7), (age, life, r) => {
    const k = age / life, x = -L * r.range(0.45, 0.8) - age * 90, y = 0.5 + Math.sin(age * 6 + r.range(0, TAU)) * age * 3 - age * age * 8;
    if (x < left + 6) return;
    puffs.push({ x, y, r: 1.2 + age * 4, a: 0.55 * (1 - k) * Math.min(1, age * 8) * smooth(left, left + 30, x), b: 0.95 - k * 0.4, w: 0 });
  });
  cloud(p, puffs, SM, SM, { dens: 1.2, max: 0.6 });

  // the trace: a tapering body of burning gas near the slug, banded white core, gold, an orange rim; past it a
  // one-pixel line cooling to red. The compound sputters, so brightness ripples back along it, and the cold end
  // breaks into dashes
  const heat = (d) => 1 - Math.pow(d / L, 0.8) + noise(d * 0.12 - t * 40, S) * 0.12 + 0.08 * Math.sin(d * 0.35 - ph * 9);
  const yAt = (d) => 0.5 + Math.sin(d * 0.09 + ph * 2) * (d / L) * 0.8, HOT = L * 0.32;
  p.shade(-HOT - 1, -4, 1, 5, (x, y) => {
    const d = -x, u = d / HOT;
    if (u < 0 || u > 1) return;
    const w = 0.7 + 2.3 * Math.pow(1 - u, 1.4) * (0.9 + 0.1 * Math.sin(d * 0.8 - ph * 12)), v = Math.abs(y - yAt(d)) / w;
    if (v > 1) return;
    const h = heat(d);
    return v < 0.38 ? (h > 0.8 ? WHITE : F[7]) : v < 0.7 ? (h > 0.75 ? F[7] : h > 0.6 ? F[6] : F[5]) : u < 0.5 ? F[5] : F[4];
  });
  for (let d = HOT; d <= L; d += 0.5) {
    const u = d / L, h = heat(d);
    if (u > 0.55 && rand(Math.floor(d / 3), fr, S) < (u - 0.55) * 1.6) continue;
    const c = h > 0.55 ? F[6] : h > 0.42 ? F[5] : h > 0.3 ? F[4] : h > 0.18 ? F[3] : h > 0.08 ? F[2] : F[1];
    p.dot(-d, yAt(d), c, u < 0.85 ? 1 : (1 - u) / 0.15);
  }
  p.glowLine(-2, 1, -L * 0.45, 1, 6, F[4], 0.35);
  p.glowLine(-2, 1, -L * 0.2, 1, 3, F[7], 0.3);

  // sparks of burning compound shed off the trace, dropping and cooling as they fall behind
  const SP = [F[7], F[6], F[4], F[3]];
  beat(t, D, 16, S + 2, (r) => r.range(0.1, 0.28), (age, life, r) => {
    const [x, y, vx, vy] = wake(-r.range(4, L * 0.5), 0.5 + r.range(-0.5, 1), -r.range(10, 80), r.range(-60, 50), age, V * 0.35, 3, 260);
    if (x > left + 8) spark(p, x, y, vx, vy, 1 - age / life, SP, 0.45, 0.012, 6);
  });

  // the slug: a white-hot pointed round, pale-rimmed, its nose a point of light
  p.sprite(SLUG, { w: WHITE, p: F[7], y: F[6], o: F[5] }, -1, -1);
  p.glow(2, 1, 24, F[4], 0.5);
  p.glow(3, 1, 8, WHITE, 0.55);
}

};
/* ../pixelfx_src/src/fx/impacts/hit-spark.js */
__defs[23] = function (__exports) {
__get(__exports, "create", () => create);
__get(__exports, "meta", () => meta);
// The two-tone spark spray and the light pop are adapted from Sprite Fusion's open-source impact
// (https://www.spritefusion.com/pixel-art-vfx/impact), MIT License, Copyright (c) 2026 Hugo Duprez.
const { Particles, Lights, P, Rng, fit, WHITE } = __req(2);

const meta = {
  name: "Hit spark",
  desc: "The everyday hit: a sharp, lopsided cross flare with one long ray along the blow round a white diamond core, then a cone of sparks and hot chips that fall and bounce.",
  tags: ["impact", "hit", "spark", "combat", "directional", "one-shot"],
  size: [136, 80],
  origin: [44, 64],
  duration: 0.5,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#4a1712", "#c9281f", "#f2561d", "#ff8a2a", "#ffe26b", "#fff3a6", "#ffffff"], height: 20, aim: 0.1, seed: 4 },
};

// one ray of the cross: fat at the root, a hair at the tip, white cooling outward; from..to draws a stretch of it
function ray(p, x, y, a, L, w, C, from = 0) {
  const c = Math.cos(a), s = Math.sin(a);
  for (let d = from * L; d <= L; d += 0.5) {
    const u = d / L, hw = w * Math.pow(1 - u, 1.6);
    const col = u < 0.3 ? WHITE : u < 0.62 ? C[5] : u < 0.88 ? C[4] : C[3];
    p.px(x + c * d, y + s * d, col);
    if (hw > 0.45) for (let o = 0.5; o <= hw; o += 0.5) for (const e of [-o, o]) p.px(x + c * d - s * e, y + s * d + c * e, u < 0.3 && o < 1 ? C[5] : C[4]);
  }
}

// the core: a crisp white diamond with a pale rim
function diamond(p, x, y, r, C) {
  for (let dy = -r - 1; dy <= r + 1; dy++)
    for (let dx = -r - 1; dx <= r + 1; dx++) {
      const m = Math.abs(dx) + Math.abs(dy);
      if (m <= r) p.px(x + dx, y + dy, WHITE);
      else if (m === r + 1) p.px(x + dx, y + dy, C[3]);
    }
}

function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), X = 0, Y = -o.height, A = o.aim, floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[6], C[5], C[4], C[2]] });
  const lights = new Lights();
  // the cross: a long thin ray along the blow, a stub behind, two unequal arms across, and a glint between
  const tilt = R.range(-0.08, 0.08);
  const rays = [
    { a: A + tilt, L: R.range(33, 37), w: 2.2 },
    { a: A + Math.PI + tilt, L: R.range(8, 10), w: 2.2 },
    { a: A - Math.PI / 2 + tilt, L: R.range(15, 18), w: 2.6 },
    { a: A + Math.PI / 2 + tilt, L: R.range(10, 12), w: 2.3 },
    { a: A - Math.PI / 4 + tilt, L: R.range(5, 7), w: 1 },
  ];

  lights.add(X, Y, 38, C[4], 0.35, 0.18);
  lights.add(X + Math.cos(A) * 10, Y + Math.sin(A) * 10, 22, C[5], 0.45, 0.1);
  lights.add(X, -2, 26, C[3], 0.22, 0.22);
  // a cone of sparks sprayed on along the blow: they fall, bounce off the floor and die
  for (let i = 0; i < 9; i++) {
    const a = A + R.range(-0.6, 0.6) - 0.15, v = R.range(170, 360);
    ps.spawn(P.SPARK, X + 1, Y, Math.cos(a) * v, Math.sin(a) * v - 40, R.range(0.25, 0.45), WHITE, 1, i > 6 ? R.range(0.01, 0.03) : 0);
  }
  // hot pixel chips knocked off, tumbling down to tick off the floor
  for (let i = 0; i < 6; i++) {
    const a = A + R.range(-1.1, 0.5) - 0.3, v = R.range(70, 170);
    ps.spawn(P.GRIT, X + 1, Y, Math.cos(a) * v, Math.sin(a) * v - R.range(30, 80), R.range(0.35, 0.45), R.pick([C[5], C[4], C[4], C[3]]), 1);
  }

  let t = 0;
  return {
    update(dt) {
      t += dt;
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      ps.draw(p);
      if (t < 0.025) {
        // the flash: the whole cross round the diamond
        for (const r of rays) ray(p, X, Y, r.a, r.L, r.w, C);
        diamond(p, X, Y, 4, C);
      } else if (t < 0.058) {
        // reaching further and thinning, the diamond still crisp
        for (const r of rays) ray(p, X, Y, r.a, r.L * 1.2, r.w * 0.55, C, 0.12);
        diamond(p, X, Y, 3, C);
      } else if (t < 0.092) {
        // only the long ray lingers, its root burning away
        const r = rays[0];
        ray(p, X, Y, r.a, r.L * 1.3, 0.6, [C[0], C[1], C[2], C[3], C[3], C[4]], 0.4);
      }
      const pop = Math.exp(-t / 0.045);
      if (pop > 0.02) {
        p.glow(X, Y, 22, C[4], 0.3 * pop);
        p.glow(X, Y, 7, WHITE, 0.15 * pop);
        p.glowLine(X, Y, X + Math.cos(A) * 26, Y + Math.sin(A) * 26, 4, C[5], 0.25 * pop);
      }
      lights.draw(p);
    },
  };
}

};
/* ../pixelfx_src/src/fx/impacts/_lib.js */
__defs[25] = function (__exports) {
__get(__exports, "stone", () => stone);
__get(__exports, "spikes", () => spikes);
__get(__exports, "star", () => star);
__get(__exports, "brokenRing", () => brokenRing);
__get(__exports, "makeCracks", () => makeCracks);
__get(__exports, "drawCracks", () => drawCracks);
__get(__exports, "frontCrescent", () => frontCrescent);
__get(__exports, "dustRing", () => dustRing);
__get(__exports, "rock", () => rock);
__get(__exports, "SOOT", () => SOOT);
__get(__exports, "OUTLINE", () => OUTLINE);
__get(__exports, "rockShape", () => rockShape);
// Shared by the impacts: the hit star, a ring that breaks into flying arcs, floor cracks that glow and cool,
// standing shock fronts, soft lumpy dust rings, faceted tumbling rocks, and the stone colors they share.
// The star and flying-arc recipes are adapted from Sprite Fusion's open-source impact
// (https://www.spritefusion.com/pixel-art-vfx/impact), and the stone colors from its explosion
// (https://www.spritefusion.com/pixel-art-vfx/explosion), MIT License, Copyright (c) 2026 Hugo Duprez.
// Files starting with _ are helpers, not effects.

const { clamp, rand, TAU, hex, mix, scale, rgb, WHITE } = __req(2);

const SOOT = hex("#0d0a12");
const OUTLINE = hex("#1a1422");
const LIGHT = Math.atan2(-1, -1); // light comes from the top left

/** Stone colors from one body color: light, body, shade, dust (lighter and greyer), lip (a lit broken edge). */
function stone(c) {
  c = hex(c);
  return { light: mix(scale(c, 1.35), WHITE, 0.08), body: c, shade: scale(c, 0.64), dust: mix(scale(c, 1.2), rgb(150, 140, 150), 0.3), lip: mix(scale(c, 1.55), WHITE, 0.12) };
}

/**
 * Spikes for a hit star: n of them round the circle, longer towards aim (fwd) and a little behind it (back).
 * len and w: [min, max] base length and root half-width; jag scales every other spike (short teeth between).
 */
function spikes(R, n, aim, { len = [7, 10], w = [1.5, 2.1], fwd = 1.8, back = 0.6, jag = 1, jit = 0.18 } = {}) {
  return Array.from({ length: n }, (_, i) => {
    const a = aim + (i / n) * TAU + R.range(-jit, jit), cb = Math.cos(a - aim);
    const L = R.range(len[0], len[1]) * (1 + fwd * Math.pow(Math.max(0, cb), 3) + back * Math.pow(Math.max(0, -cb), 3)) * (i % 2 ? jag : 1);
    return { a, len: L, w: R.range(w[0], w[1]) * (i % 2 ? Math.sqrt(jag) : 1) };
  });
}

/**
 * A hit star: tapered spikes in three passes (a rim, a body that's paler near the root, a hot core) round a
 * hot heart. sc stretches the spikes, th thins them, cols [rim, body, inner, core], a dithers it out.
 */
function star(p, x, y, list, sc, th, [rim, body, inner, core], a = 1, heart = 2.4) {
  for (let pass = 0; pass < 3; pass++)
    for (const s of list) {
      const c = Math.cos(s.a), sn = Math.sin(s.a), L = s.len * sc;
      for (let d = 0; d <= L; d += 0.5) {
        if (pass === 2 && d > L * 0.55) break;
        const hw0 = s.w * th * (1 - d / L) * Math.min(1, 0.5 + d / 3);
        const hw = pass === 0 ? hw0 + 0.8 : pass === 1 ? hw0 : hw0 * 0.45;
        const col = pass === 0 ? rim : pass === 1 ? (d < L * 0.35 ? inner : body) : core;
        for (let o = -hw; o <= hw; o += 0.5) p.dot(x + c * d - sn * o, y + sn * d + c * o, col, a);
      }
    }
  const r = heart * sc * Math.sqrt(th);
  p.circle(x, y, r + 0.8, inner, a);
  p.circle(x, y, r, core, a);
}

/**
 * A ring that breaks into arcs: segs [{ a (centre angle), gap (0..1), dr (how fast it flies out), w (thickness
 * scale, default 1) }] evenly round the ring. brk 0 draws a whole ring th thick; as brk grows each arc shrinks,
 * tapers at both ends into a crescent and drifts out at its own speed. c is the outer edge's color, c2 the
 * inner's; sy squashes it onto a plane; nothing is drawn below maxY (a floor).
 */
function brokenRing(p, x, y, r, th, segs, brk, c, c2 = c, k = 1, sy = 1, maxY = Infinity) {
  if (r <= 0 || k <= 0) return;
  const full = TAU / segs.length;
  for (const s of segs) {
    const span = full * (1 - s.gap * brk) + 0.02, rr = r * (1 + s.dr * brk), m = Math.max(4, Math.ceil(rr * span * 1.8));
    for (let j = 0; j <= m; j++) {
      const u = j / m, ang = s.a + (u - 0.5) * span, w = Math.max(0.5, th * (s.w ?? 1) * (1 - brk * Math.pow(Math.abs(2 * u - 1), 1.6)));
      const ca = Math.cos(ang), sa = Math.sin(ang);
      for (let o = -w / 2; o <= w / 2 + 0.01; o += 0.5) if (y + sa * (rr + o) * sy < maxY) p.dot(x + ca * (rr + o), y + sa * (rr + o) * sy, o > -0.26 ? c : c2, k);
    }
  }
}

// a jagged walk from (x, y) heading a for L px; each point is [x, y, distance along]
function walk(R, x, y, a, L, { jit = 0.55, steer = 0.45, step = [2, 4], maxY = Infinity, d0 = 0 } = {}) {
  const pts = [[x, y, d0]];
  let d = 0, cur = a;
  while (d < L - 0.01) {
    const s = Math.min(L - d, R.range(step[0], step[1]));
    cur += R.range(-jit, jit) + (a - cur) * steer;
    x += Math.cos(cur) * s;
    y = clamp(y + Math.sin(cur) * s, 0.5, maxY);
    d += s;
    pts.push([x, y, d0 + d]);
  }
  return pts;
}

/**
 * Cracks in the floor face below (0, 0): n jagged lines, alternately left and right, mostly shallow, a few
 * diving steeply, some forked. len [min, max], maxY how deep they may go, forks 0..1.
 */
function makeCracks(R, n, { len = [14, 40], dive = 0.85, maxY = 22, forks = 0.5, x0 = [1, 5] } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1, dip = 0.06 + Math.pow(R.next(), 1.7) * dive, L = R.range(len[0], len[1]) * (1 - (0.5 * dip) / (dive + 0.06));
    const a = side > 0 ? dip : Math.PI - dip, pts = walk(R, side * R.range(x0[0], x0[1]), R.range(0.5, 1.5), a, L, { maxY });
    const c = { pts, len: L, t0: R.range(0, 0.035), kids: [] };
    for (let j = 2; j < pts.length - 1; j++)
      if (R.chance(forks * 0.4)) {
        const [fx, fy, fd] = pts[j];
        c.kids.push(walk(R, fx, fy, a + R.sign() * R.range(0.45, 1), R.range(3, 9) * (1 - (0.5 * j) / pts.length), { maxY, d0: fd, jit: 0.7, step: [1.5, 3] }));
      }
    out.push(c);
  }
  return out;
}

/**
 * Draw cracks grown to g(c) px of their length. heat(d) 0..1 at distance d along a crack lights it from the
 * hot ramp (bright to dark) before it cools to dark; lip is the lit lower edge; k dithers them out.
 * Returns nothing; adds a glow along the hot parts.
 */
function drawCracks(p, cracks, g, heat, hot, dark, lip, k = 1) {
  if (k <= 0) return;
  const col = (d) => {
    const h = heat(d);
    return h > 0.75 ? hot[0] : h > 0.5 ? hot[1] : h > 0.3 ? hot[2] : h > 0.12 ? hot[3] : dark;
  };
  for (const c of cracks) {
    const G = g(c);
    if (G <= 0) continue;
    for (const path of [c.pts, ...c.kids]) {
      for (let i = 1; i < path.length; i++) {
        const [x0, y0, d0] = path[i - 1], [x1, y1, d1] = path[i];
        if (d0 >= G) break;
        const f = d1 > G ? (G - d0) / (d1 - d0) : 1, ex = x0 + (x1 - x0) * f, ey = y0 + (y1 - y0) * f;
        p.line(x0, y0 + 1, ex, ey + 1, lip, (u) => (rand(Math.round(x0 + (ex - x0) * u), Math.round(y0 + (ey - y0) * u), 5) < 0.3 ? k * 0.8 : 0));
        p.line(x0, y0, ex, ey, (u) => col(d0 + (d1 - d0) * f * u), k);
        const h = heat(d0);
        if (h > 0.12) p.glow((x0 + ex) / 2, (y0 + ey) / 2, 4 + h * 4, hot[2], 0.22 * h * k);
      }
    }
  }
}

/**
 * A standing crescent shock front on the floor (y = 0): it leans back from a leading edge low at x, dir 1
 * racing right ")", -1 left "(". h tall, w thick at its widest (thick where it meets the floor, a point at
 * the top); cols [edge, body, back] bright to dark; k dithers it out.
 */
function frontCrescent(p, x, dir, h, w, cols, k = 1) {
  if (h < 1 || w < 0.3 || k <= 0) return;
  const ry = h * 0.8, cy = -h * 0.2, rx = Math.max(2, h * 0.55);
  const x0 = dir > 0 ? x - rx - w - 1 : x - 1, x1 = dir > 0 ? x + 1 : x + rx + w + 1;
  p.shade(x0, -h - 1, x1, 0, (px, py, out) => {
    if (py > 0) return;
    const ey = (py - cy) / ry;
    if (ey <= -1 || ey >= 1) return;
    const e2 = 1 - ey * ey, edge = rx * Math.sqrt(e2) - rx, wt = w * Math.pow(e2, 0.45), q = (edge - (px - x) * dir) / Math.max(0.5, wt);
    if (q < 0 || q > 1) return;
    out.c = q < 0.28 ? cols[0] : q < 0.62 ? cols[1] : cols[2];
    out.a = k * (ey < -0.8 ? 0.7 : 1) * (q > 0.7 ? 1.25 - q * 0.8 : 1);
  });
}

/**
 * A soft, lumpy ring of dust round (cx, cy): radius r, w thick (lumps swell it), alpha k, translucent and lit
 * on its upper side. sy squashes it onto the floor; brk 0..1 tears it into clumps as it thins; ph varies it;
 * nothing is drawn below maxY; half -1 draws only the far half (above cy), 1 only the near half.
 */
function dustRing(p, cx, cy, r, w, k, c, { sy = 1, ph = 0, brk = 0, lit = 0.35, maxY = Infinity, half = 0 } = {}) {
  if (k <= 0.01 || r <= 0) return;
  const W = w * 1.6, lite = mix(c, WHITE, lit);
  for (let y = Math.floor(cy - (r + W) * sy) - 1; y <= Math.min(maxY - 1, Math.ceil(cy + (r + W) * sy) + 1); y++)
    for (let x = Math.floor(cx - r - W) - 1; x <= Math.ceil(cx + r + W) + 1; x++) {
      const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) / sy, d = Math.hypot(dx, dy), g = Math.atan2(dy, dx);
      if ((half < 0 && dy >= 0) || (half > 0 && dy < 0)) continue;
      const lumpy = 0.6 + 0.3 * Math.sin(5 * g + ph) + 0.18 * Math.sin(11 * g + ph * 2.1) + 0.12 * Math.sin(17 * g + ph * 0.7);
      const wt = w * lumpy, off = Math.abs(d - r - w * 0.25 * Math.sin(7 * g + ph));
      if (off >= wt) continue;
      const tear = brk > 0 ? clamp((0.55 + 0.45 * Math.sin(6 * g + ph * 1.7) - brk) / 0.25) : 1;
      const a = k * (1 - Math.pow(off / wt, 2)) * tear;
      if (a > 0.01) p.blend(x, y, dy < 0 && d > r - wt * 0.3 ? lite : c, a);
    }
}

/** A rock's outline: n vertex radii round its centre. */
const rockShape = (R, n = 6) => Array.from({ length: n }, () => R.range(0.7, 1.12));

/**
 * A faceted rock tumbling at angle b.a: every facet shaded by how it faces the light, a lit top face, a dark
 * outline, dithering out over its last half second. b: { x, y, a, s (1..3), life, pts }, st: stone().
 */
function rock(p, b, st) {
  const r = 0.75 + b.s * 0.8, n = b.pts.length, fade = Math.min(1, b.life / 0.5), ca = Math.cos(b.a), sa = Math.sin(b.a);
  p.shade(b.x - r - 2, b.y - r - 2, b.x + r + 2, b.y + r + 2, (x, y, out) => {
    const dx = x - b.x, dy = y - b.y, u = dx * ca + dy * sa, v = -dx * sa + dy * ca, d = Math.hypot(u, v);
    let ang = Math.atan2(v, u);
    if (ang < 0) ang += TAU;
    const f = (ang / TAU) * n, i = Math.floor(f) % n, w = f - Math.floor(f), edge = r * (b.pts[i] * (1 - w) + b.pts[(i + 1) % n] * w);
    if (d > edge + 0.85) return;
    out.a = fade;
    if (d > edge) return OUTLINE;
    const lit = Math.cos(((i + 0.5) / n) * TAU + b.a - LIGHT);
    if (d < edge * 0.42) return lit > 0.55 ? st.light : st.body;
    return lit > 0.35 ? st.light : lit < -0.4 ? st.shade : st.body;
  });
}

};
/* ../pixelfx_src/src/fx/impacts/bullet-impact.js */
__defs[24] = function (__exports) {
__get(__exports, "create", () => create);
__get(__exports, "meta", () => meta);
// The open-sided star, the spark cone off the surface, the chips, dust and smoke are adapted from Sprite Fusion's
// open-source impact (https://www.spritefusion.com/pixel-art-vfx/impact), MIT License, Copyright (c) 2026 Hugo Duprez.
const { Particles, Lights, P, Rng, fit, clamp, smooth, ease, rand, TAU, WHITE, mix } = __req(2);
const { stone, spikes, star, SOOT } = __req(25);

const meta = {
  name: "Bullet impact",
  desc: "A bullet hits a wall on the right: a hot half-star, sparks sprayed back in a cone, a puff of grit, chips that fall and bounce, a pock mark cooling to soot.",
  tags: ["impact", "bullet", "gun", "wall", "sparks", "debris", "directional", "one-shot"],
  size: [152, 100],
  origin: [116, 84],
  duration: 1.4,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#4a1712", "#c9281f", "#f2561d", "#ff8a2a", "#ffe26b", "#fff3a6", "#ffffff"], stone: "#5b5079", height: 24, seed: 6 },
};

function create(o) {
  const C = fit(o.palette, 7), st = stone(o.stone), R = new Rng(o.seed), X = 0, Y = -o.height, floor = () => 0, D = meta.duration;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[6], C[5], C[4], C[2]] });
  const lights = new Lights();
  // the wall's face looks left (N); the bullet came in level, a touch downward, and the spray bounces back off it
  const N = Math.PI, IN = 0.08, B = Math.PI - IN, open = (a) => Math.cos(a - N) > -0.25;
  const sp = spikes(R, 9, B, { len: [7, 10.5], w: [1.6, 2.1], fwd: 1.8, back: 0.4 });
  for (const s of sp) if (Math.cos(s.a - N) < -0.2) s.len *= 0.3;
  // the pock mark: a ragged hole with a rim that glows and cools
  const rim = [];
  for (let y = -2; y <= 2; y++)
    for (let x = 0; x <= 3; x++) {
      const d = Math.hypot((x - 1) / 1.6, y / 2.1) + rand(x, y, o.seed) * 0.35;
      if (d < 0.75) rim.push([x, y, 0]);
      else if (d < 1.25) rim.push([x, y, 1]);
    }
  const cracks = [0, 1, 2].map(() => {
    const a = R.range(-1.2, 1.2), L = R.range(2, 4.5);
    return [Math.cos(a) * 2.2 + 1, Math.sin(a) * 2.2, Math.cos(a) * (2.2 + L) + 1, Math.sin(a) * (2.2 + L)];
  });

  lights.add(X - 4, Y, 40, C[4], 0.6, 0.22);
  lights.add(X - 2, Y, 14, WHITE, 0.6, 0.06);
  // sparks bounce back off the wall in a cone
  for (let i = 0; i < 18; i++) {
    const a = B + R.range(-1, 1) * 0.8, v = R.range(170, 450);
    ps.spawn(P.SPARK, X - 1, Y, Math.cos(a) * v, Math.sin(a) * v - 30, R.range(0.12, 0.4), WHITE, 1, i > 13 ? R.range(0.01, 0.04) : 0);
  }
  // chips of the wall: flung out, falling, bouncing once and settling
  for (let i = 0; i < 8; i++) {
    const a = N + R.range(-0.8, 0.6), v = R.range(60, 190);
    ps.spawn(P.GRIT, X - 1, Y + R.range(-1, 1), Math.cos(a) * v, Math.sin(a) * v - R.range(20, 70), R.range(0.9, 1.3), R.pick([st.light, st.body, st.body, st.lip]), i < 3 ? 2 : 1);
  }
  // a puff of grit dust and a wisp of smoke drifting off
  for (let i = 0; i < 9; i++) {
    const a = N + R.range(-1.1, 1.1), v = R.range(15, 60);
    ps.spawn(P.DUST, X - 2, Y + R.range(-1.5, 1.5), Math.cos(a) * v, Math.sin(a) * v, R.range(0.3, 0.55), R.chance(0.5) ? st.dust : mix(st.dust, WHITE, 0.25), R.range(1.2, 2.3));
  }
  ps.spawn(P.SMOKE, X - 4, Y, R.range(-10, -4), R.range(-16, -8), R.range(0.8, 1.2), st.dust, R.range(1.8, 2.4), 0.05);

  let t = 0;
  return {
    update(dt) {
      t += dt;
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p) {
      // the pock mark: white-hot, cooling through the ramp to a dark rim, fading at the very end
      const heat = Math.pow(clamp(1 - t / 0.9), 1.3), fade = 1 - smooth(D - 0.45, D - 0.1, t);
      if (fade > 0) {
        for (const [x0, y0, x1, y1] of cracks) p.line(X + x0, Y + y0, X + x1, Y + y1, heat > 0.5 ? C[3] : st.shade, fade * (heat > 0.5 ? 1 : 0.85));
        for (const [x, y, k] of rim) {
          const h = heat * (k ? 0.85 : 1.15);
          p.dot(X + x, Y + y, k === 0 && h < 0.75 ? SOOT : h > 0.85 ? WHITE : h > 0.6 ? C[5] : h > 0.4 ? C[4] : h > 0.22 ? C[3] : h > 0.1 ? C[2] : st.shade, fade);
        }
        if (heat > 0) p.glow(X + 1, Y, 6 + 6 * heat, C[3], 0.5 * heat);
      }
      // a half ring opening away from the wall
      const u = (t - 0.03) / 0.18;
      if (u >= 0 && u < 1) {
        const r = 5 + 12 * ease.outCubic(u), c = u < 0.3 ? C[5] : u < 0.6 ? C[4] : C[3];
        for (let j = 0, n = Math.ceil(r * TAU * 1.3); j < n; j++) {
          const g = (j / n) * TAU;
          if (open(g)) p.dot(X + Math.cos(g) * r, Y + Math.sin(g) * r, c, 1.15 - u);
        }
      }
      ps.draw(p, "front");
      if (t < 0.03) star(p, X, Y, sp, 1, 1, [C[2], C[5], C[4], WHITE], 1, 2.2);
      else if (t < 0.06) star(p, X, Y, sp, 1.25, 0.55, [C[1], C[4], C[3], C[5]], 1, 2.2);
      const pop = Math.exp(-t / 0.045);
      if (pop > 0.02) {
        p.glow(X - 2, Y, 22, C[3], 0.6 * pop);
        p.glow(X - 1, Y, 8, WHITE, 0.5 * pop);
        p.glowLine(X + 1, Y - 16, X + 1, Y + 16, 4, C[4], 0.4 * pop); // light grazing the wall's face
      }
      lights.draw(p);
    },
  };
}

};
/* ../pixelfx_src/src/fx/explosions/_lib.js */
__defs[27] = function (__exports) {
__get(__exports, "stone", () => stone);
__get(__exports, "fireBall", () => fireBall);
__get(__exports, "drawPs", () => drawPs);
__get(__exports, "draft", () => draft);
__get(__exports, "cull", () => cull);
__get(__exports, "fadeEdges", () => fadeEdges);
__get(__exports, "pool", () => pool);
__get(__exports, "haze", () => haze);
__get(__exports, "scorch", () => scorch);
__get(__exports, "rock", () => rock);
__get(__exports, "glowDome", () => glowDome);
__get(__exports, "trail", () => trail);
__get(__exports, "drawDirt", () => drawDirt);
__get(__exports, "crater", () => crater);
__get(__exports, "dome", () => dome);
__get(__exports, "lobe", () => lobe);
__get(__exports, "Plume", () => Plume);
__get(__exports, "Column", () => Column);
__get(__exports, "OUTLINE", () => OUTLINE);
__get(__exports, "SOOT", () => SOOT);
__get(__exports, "SOOT2", () => SOOT2);
__get(__exports, "fireRamp", () => fireRamp);
__get(__exports, "heatRamp", () => heatRamp);
// Shared by the explosions. Not an effect (the leading _ keeps the tools away).
// The fire balls, rocks and scorch are adapted from Sprite Fusion's open-source explosion
// (https://www.spritefusion.com/pixel-art-vfx/explosion), MIT License, Copyright (c) 2026 Hugo Duprez.

const { P, PF, clamp, smooth, rand, TAU, WHITE, hex, mix, scale, rgb } = __req(2);

const OUTLINE = hex("#1a1422"), SOOT = hex("#0d0a12"), SOOT2 = hex("#17121d");

/** Stone colors from one body color: a lit face, the body, a shaded face, and the dust it makes. */
function stone(c) {
  c = hex(c);
  return { light: mix(scale(c, 1.35), WHITE, 0.08), body: c, shade: scale(c, 0.64), dust: mix(scale(c, 1.2), rgb(150, 140, 150), 0.3) };
}

/** A 9-step fire ramp, white-hot down to smouldering (the shape of FIRE_RAMP), from an 8-step palette (dark to bright). */
const fireRamp = (F) => [F[7], F[6], F[5], F[4], F[3], F[2], F[1], mix(F[1], F[0], 0.5), F[0]];

/** One FIRE particle drawn in the fire ramp FR: a darker rim, a lit core, a tongue on top, a hot heart. */
function fireBall(p, q, FR) {
  const k = q.life / q.max, age = 1 - k, n = FR.length, x = q.x, y = q.y;
  const heat = Math.min(0.999, Math.pow(age, 0.62) + (q.seed % 1) * 0.1), idx = Math.min(n - 2, Math.floor(heat * (n - 1)));
  const r = q.size * (0.55 + 0.45 * Math.min(1, age * 7)) * (1 - age * 0.55), c = FR[idx];
  if (idx >= n - 2) return p.disc(x, y, r, c, Math.min(1, k * 3) * 0.85);
  // the hottest puffs get a rim a step darker still, so a mass of them reads as separate balls
  p.circle(x, y, r, FR[Math.min(n - 1, idx + (idx <= 2 ? 3 : 2))]);
  p.circle(x - r * 0.16, y - r * 0.22, r * 0.78, c);
  if (r > 1.6) p.circle(x, y - r * 0.9, r * 0.42, c);
  if (idx <= 3 && r > 1.8) p.circle(x - r * 0.28, y - r * 0.34, r * 0.36, FR[Math.max(0, idx - 1)]);
  if (idx < 6) p.glow(x, y, r * 2.4 + 2, c, 0.18 * k);
}

/** A particle system's layer ("back" or "front") with its FIRE puffs in the fire ramp FR, so a palette recolors them. */
function drawPs(p, ps, layer, FR) {
  const all = ps.list, fires = [], rest = [];
  for (const q of all) (q.k === P.FIRE ? fires : rest).push(q);
  const back = layer === "back";
  if (!back) for (const q of fires) if (q.delay <= 0 && !(q.flag & PF.BACK)) fireBall(p, q, FR);
  ps.list = rest;
  ps.draw(p, layer);
  ps.list = all;
  if (back) for (const q of fires) if (q.delay <= 0 && q.flag & PF.BACK) fireBall(p, q, FR);
}

const LIFTS = new Set([P.SMOKE, P.DUST, P.FIRE, P.EMBER, P.VAPOUR]);
/**
 * An updraft column at x: smoke, dust, fire and embers below `top` and within w of the axis are carried up
 * (up px/s²) and squeezed toward it; near the floor (within `low` px) they're drawn in from as far as `reach`:
 * the afterwinds that feed a blast's column. k scales it all.
 */
function draft(ps, dt, { x = 0, top = -Infinity, w = 12, up = 150, squeeze = 4, pull = 0, low = 10, reach = 100, k = 1 }) {
  if (k <= 0) return;
  for (const q of ps.list) {
    if (q.delay > 0 || !LIFTS.has(q.k) || q.y < top) continue;
    const dx = q.x - x, ax = Math.abs(dx), u = ax / w;
    if (u < 1) {
      const f = (1 - u * u) * k;
      q.vy -= up * f * dt;
      q.vx -= dx * squeeze * f * dt;
    }
    if (pull && q.y > -low && ax > w * 0.4 && ax < reach) q.vx -= Math.sign(dx) * pull * k * (1 - ax / reach) * dt;
  }
}

/** Drop particles that leave the box (local px), so nothing is drawn past the canvas. */
function cull(ps, x0, y0, x1, y1) {
  const L = ps.list;
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i];
    if (q.x < x0 || q.x > x1 || q.y < y0 || q.y > y1) L.splice(i, 1);
  }
}

const SOFT = new Set([P.SMOKE, P.DUST, P.VAPOUR]);
/**
 * Soft particles (smoke, dust, vapour) fade out over w px as they near the sides x0, x1 and go before they reach
 * them; y1, a bottom edge, gets a thin w of 6 (keep things off it by design).
 */
function fadeEdges(ps, x0, x1, w = 30, y1 = Infinity) {
  const L = ps.list;
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i];
    if (!SOFT.has(q.k)) continue;
    const r = q.size * 1.65, e = Math.min((Math.min(q.x - x0, x1 - q.x) - r) / w, (y1 - q.y - r) / 6);
    if (e <= 0) L.splice(i, 1);
    else if (e < 1) q.life = Math.min(q.life, q.max * 0.42 * e);
  }
}

/** A soft pool of light, an ellipse rx by ry at (x, y): light falling on the floor (keep ry small, it's perspective). */
function pool(p, x, y, rx, ry, c, k) {
  if (k <= 0.004 || rx < 1 || ry < 0.5) return;
  p.shade(x - rx, y - ry, x + rx, y + ry, (px, py, out) => {
    const dx = (px - x) / rx, dy = (py - y) / ry, d = dx * dx + dy * dy;
    if (d >= 1) return;
    const f = 1 - Math.sqrt(d);
    out.l = c;
    out.k = f * f * k;
  });
}

/** A translucent ellipse (blended, never dithered): c and a may be functions of d (0 centre .. 1 rim). */
function haze(p, x, y, rx, ry, c, a) {
  if (rx < 0.5 || ry < 0.5) return;
  const fc = typeof c === "function", fa = typeof a === "function";
  p.each(x - rx, y - ry, x + rx, y + ry, (lx, ly, sx, sy) => {
    const dx = (lx - x) / rx, dy = (ly - y) / ry, d2 = dx * dx + dy * dy;
    if (d2 > 1) return;
    const d = Math.sqrt(d2);
    p.blendPx(sx, sy, fc ? c(d) : c, fa ? a(d) : a);
  });
}

/** Heat for a scorch, from a fire ramp (bright to dark) down to cinders. */
const heatRamp = (FR) => [...FR.slice(0, 8), mix(FR[8], SOOT, 0.3), mix(FR[8], SOOT, 0.65)];

/**
 * The floor under a blast: a burn that spreads out in a blink, glows white-hot and cools through the heat ramp
 * HR to soot over `cool` seconds; a few cracks hold their glow twice as long. rows deep, fade 0..1.
 */
function scorch(p, HR, t, rx0, cool, fade, rows = 3) {
  if (fade <= 0) return;
  const rx = rx0 * Math.min(1, t / 0.08), ry = rows + 1.5, n = HR.length;
  for (let y = 0; y < rows; y++)
    for (let x = Math.floor(-rx); x <= Math.ceil(rx); x++) {
      const dx = (x + 0.5) / rx, dy = (y + 0.5) / ry, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) continue;
      const k = rand(x * 31 + y, 3), T = Math.pow(clamp(1 - t / cool), 1.4) * (1.25 - d) - k * 0.35;
      const crack = k > 0.88 && d < 0.85 ? Math.pow(clamp(1 - t / (cool * 2)), 1.2) * (1.15 - d) * 0.8 : 0, H = Math.max(T, crack);
      if (H > 0.06) {
        const c = HR[Math.min(n - 1, Math.floor((1 - Math.min(1, H)) * (n - 1)))];
        p.dot(x, y, c, fade);
        if ((x & 3) === 0 || crack > T) p.glow(x + 0.5, y, 6, c, 0.18 * H * fade);
      } else p.dot(x, y, d < 0.5 ? SOOT : SOOT2, (d < 0.95 - k * 0.3 ? 1 : 1 - d) * fade);
    }
}

/**
 * A rock (a Bits CHUNK): a lit side, a shaded side and an outline, turning as it spins. b.heat (0..1) makes
 * it molten: its heart and shaded side glow through the fire ramp FR and it gives off light, cooling to stone.
 */
function rock(p, b, st, FR) {
  const r = 0.6 + b.s * 0.75, fade = Math.min(1, b.life / 0.5), lx = Math.cos(b.a) * r * 0.4, ly = Math.sin(b.a) * r * 0.4, heat = b.heat ?? 0;
  p.shade(b.x - r - 1, b.y - r - 1, b.x + r + 1, b.y + r + 1, (x, y, out) => {
    const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx * 1.15, dy);
    if (d > r + 0.9) return;
    out.a = fade;
    if (d > r) return OUTLINE;
    const lit = dx * lx + dy * ly;
    if (heat > 0.08) {
      const g = heat * (1.1 - d / (r + 0.5)) + (lit > 0.3 ? heat * 0.45 : 0);
      if (g > 0.5) return FR[g > 1 ? 1 : g > 0.8 ? 2 : g > 0.62 ? 3 : 4];
      if (g > 0.32) return FR[5];
    }
    return lit < -0.4 ? st.light : lit > 0.6 ? st.shade : st.body;
  });
  if (heat > 0.05) p.glow(b.x, b.y, r * 2 + 3, FR[3], 0.32 * heat * fade);
}

/**
 * Light hugging the upper half of a circle of radius R at (x, y) (a dome's shock), falling off over width w.
 * box [x0, y0, x1, y1] (local) keeps it inside a canvas.
 */
function glowDome(p, x, y, R, w, c, k, box = [-Infinity, -Infinity, Infinity, Infinity]) {
  if (k <= 0.004 || w < 1) return;
  p.shade(Math.max(box[0], x - R - w), Math.max(box[1], y - R - w), Math.min(box[2], x + R + w), Math.min(box[3], y + 0.5), (px, py, out) => {
    const d = Math.abs(Math.hypot(px - x, py - y) - R) / w;
    if (d >= 1) return;
    out.l = c;
    out.k = (1 - d) * (1 - d) * k;
  });
}

/**
 * A burning thing's trail: pts [{ x, y, t }] (oldest first) at time t, drawn as a ribbon that is fire near the
 * head (fire ramp FR) and swells into thin smoke behind (smoke ramp SM, light to dark) over life seconds.
 */
function trail(p, pts, t, FR, SM, life = 0.5, w = 1, heat = 1) {
  let lx = NaN, ly = NaN;
  for (let i = pts.length - 1; i >= 0; i--) {
    const q = pts[i], age = (t - q.t) / life;
    if (age >= 1) break;
    if (Math.hypot(q.x - lx, q.y - ly) < 1.6) continue;
    lx = q.x;
    ly = q.y;
    const r = w * (0.7 + age * 2.6);
    if (age < 0.12 * heat) p.circle(q.x, q.y - age * 6, r * 0.8, FR[age < 0.05 ? 3 : 5]);
    else p.disc(q.x, q.y - age * 6, r, SM[Math.min(SM.length - 1, 1 + Math.floor(age * 3))], 0.55 * (1 - age));
  }
}

/**
 * Draw a particle system's GRIT as dirt in flight: fast bits stretch into short streaks (a darker tail, the bit at
 * the head), slow ones are the usual 1 or 2 px chips. The rest of the system draws as usual. layer as in draw.
 */
function drawDirt(p, ps, layer) {
  const all = ps.list, grit = [], rest = [];
  for (const q of all) (q.k === P.GRIT ? grit : rest).push(q);
  ps.list = rest;
  ps.draw(p, layer);
  ps.list = all;
  if (layer === "back") return;
  for (const q of grit) {
    if (q.delay > 0) continue;
    const k = q.life / q.max, sp = Math.hypot(q.vx, q.vy);
    if (k < 0.25 && k * 4 < 0.5) continue;
    if (sp > 140) {
      const L = Math.min(5, sp * 0.012), ux = q.vx / sp, uy = q.vy / sp;
      p.line(q.x - ux * L, q.y - uy * L, q.x, q.y, (u) => (u < 0.5 ? scale(q.col, 0.7) : q.col));
    } else {
      p.px(q.x, q.y, q.col);
      if (q.size >= 2) p.px(q.x + 1, q.y, q.col), p.px(q.x, q.y + 1, scale(q.col, 0.8)), p.px(q.x + 1, q.y + 1, scale(q.col, 0.7));
    }
  }
}

/**
 * A crater in the floor at x: a dark pit (an ellipse in perspective) with its far wall lit, dirt heaped in a lip on
 * either side, and loose earth scattered round it. E: an earth ramp (dark to bright, 5+ steps); r: half-width;
 * k: 0..1 how far it has opened; a: alpha (fade it out).
 */
function crater(p, E, x, r, k, a = 1) {
  if (k <= 0 || a <= 0) return;
  const n = E.length, rx = r * k, ry = Math.max(1.5, r * 0.17 * k);
  for (let py = -1; py <= Math.ceil(ry) + 1; py++)
    for (let px = Math.floor(-rx - 1); px <= Math.ceil(rx + 1); px++) {
      const dx = (px + 0.5) / rx, dy = (py + 0.5 - ry * 0.35) / ry, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1.08) continue;
      // the pit: darkest at its far side under the lit rim, the near wall a step lighter
      const c = d > 0.92 ? (dy < 0 ? E[n - 2] : E[2]) : dy < -0.2 ? E[0] : dy < 0.35 ? E[1] : E[2];
      p.dot(x + px, py, c, a);
    }
  // the lip: dirt heaped up either side, lit on top, and a scatter of loose earth
  for (const s of [-1, 1])
    for (let i = 0; i < 9; i++) {
      const u = i / 8, h = Math.round(Math.sin(Math.PI * u) * 2.2 * k + (rand(i, s > 0 ? 3 : 4) < 0.4 ? 1 : 0) * k);
      const hx = x + s * (rx * 0.82 + u * r * 0.55);
      for (let j = 0; j <= h; j++) p.dot(hx, -j, j === h ? E[n - 2] : j === h - 1 ? E[3] : E[2], a);
    }
  for (let i = 0; i < 26; i++) {
    const s = rand(i, 7) < 0.5 ? -1 : 1, d = rx * (1.05 + rand(i, 8) * 1.4), y = Math.round(rand(i, 9) * 3) - 1;
    if (rand(i, 10) < k) p.dot(x + s * d, y, rand(i, 11) < 0.5 ? E[3] : E[2], a);
  }
}

/** A hemisphere of white-hot air on the floor at x, radius r: an orange rim, a hot body, a white core; k 1 → 0 as it dies. */
function dome(p, F, x, r, k) {
  const e = 1.4 / r;
  p.shade(x - r - 1.5, -r - 1.5, x + r + 1.5, 0.5, (px, py) => {
    const d = Math.hypot(px - x, py) / r;
    if (d > 1 + e) return;
    return d > 1 ? F[2] : d > 0.8 ? (k > 0.45 ? F[6] : F[5]) : d > 0.5 ? (k > 0.45 ? WHITE : F[6]) : k > 0.2 ? WHITE : F[6];
  });
}

/**
 * A lobe of a billowing cloud, shaded like a ball. The sky lights it from the top left through the smoke ramp SM
 * (light to dark); fire (0..1) burns in its heart in the fire ramp FR (bright to dark), shrinking toward the
 * middle as it cools, with a darker band and a dark orange-red seam at its edge so a mass of burning lobes reads
 * apart; glow (0..1) lights its underside from below in fire colors. a: opacity (smoke edges stay soft); z: -1 far
 * .. 1 near (the far side sits a step darker); dark shifts the smoke down the ramp. style 1 cel-shades the smoke:
 * a lit crescent on top, a mid tone, a dark underside the fire tints while it's hot.
 */
function lobe(p, x, y, r, FR, SM, fire, glow, a, z = 0, dark = 0, style = 0) {
  if (r < 0.7 || a <= 0.01) return;
  const n = FR.length, m = SM.length, back = z < -0.35 ? 1 : 0, rim = 1 - Math.min(0.35, 1.6 / r), seam = 1 - Math.min(0.3, 1.3 / r);
  // the soft edge: a step more see-through than the body, less of a step as the whole lobe thins (no bubble rims)
  const D = (i) => SM[Math.min(m - 1, i + back + dark)], soft = 0.55 + 0.4 * (1 - Math.min(1, a));
  const px = (lx, ly, sx, sy) => {
    const dx = (lx - x) / r, dy = (ly - y) / r, d2 = dx * dx + dy * dy;
    if (d2 > 1) return;
    const d = Math.sqrt(d2), nz = Math.sqrt(1 - d2), sky = -0.5 * dx - 0.66 * dy + 0.56 * nz;
    const v = fire * (1.32 - 0.78 * d) + 0.14 * sky * fire;
    let c, k = 0, solid = false;
    if (v > 0.44) {
      let i = Math.min(n - 3, Math.max(0, Math.floor((1.3 - v) * (n - 1) * 0.78)));
      if (d > seam) i = Math.min(6, Math.max(4, i + 2));
      else if (d > seam - 0.22) i = Math.min(n - 3, i + 1);
      c = FR[i];
      k = 0.05 * fire;
      solid = true;
    } else if (style) {
      const lam = -0.42 * dx - 0.78 * dy + 0.46 * nz;
      if (lam > 0.66 && d > 0.4) c = D(0);
      else if (lam > 0.16) c = D(1);
      else if (lam > -0.3) c = D(2);
      else {
        c = D(lam < -0.64 ? 4 : 3);
        const g = glow * (0.6 + 0.4 * dy);
        if (g > 0.55) (c = FR[g > 0.8 ? 5 : 6]), (k = 0.08 * g);
        else if (g > 0.34) c = mix(c, FR[6], 0.6);
        else if (g > 0.16) c = mix(c, FR[7], 0.45);
      }
    } else {
      const g = glow * (0.82 * dy + 0.3 * nz);
      if (g > 0.45) (c = FR[g > 0.66 ? 4 : 5]), (k = 0.1 * glow);
      else if (g > 0.3) c = FR[6];
      else if (g > 0.2) c = FR[7];
      else {
        const s = sky * 0.5 + 0.5;
        c = D(s > 0.8 ? 0 : s > 0.62 ? 1 : s > 0.42 ? 2 : s > 0.22 ? 3 : 4);
      }
    }
    p.blendPx(sx, sy, c, solid || d <= rim ? a : a * soft);
    if (k > 0) p.add(sx, sy, c, k);
  };
  if (p.sn !== 0 || p.cs !== 1) return p.each(x - r, y - r, x + r, y + r, px);
  // unrotated (the usual case): walk the screen pixels directly
  const ax = p.tx + (x - r) * p.fx, bx = p.tx + (x + r) * p.fx;
  const sx0 = Math.max(p.ox, Math.floor(Math.min(ax, bx))), sx1 = Math.min(p.ox + p.w - 1, Math.ceil(Math.max(ax, bx)));
  const sy0 = Math.max(p.oy, Math.floor(p.ty + y - r)), sy1 = Math.min(p.oy + p.h - 1, Math.ceil(p.ty + y + r));
  for (let sy = sy0; sy <= sy1; sy++) {
    const ly = sy + 0.5 - p.ty, q = (ly - y) / r;
    if (q * q >= 1) continue;
    // only the span of this row inside the circle
    const hw = r * Math.sqrt(1 - q * q), cx = p.tx + x * p.fx;
    for (let sx = Math.max(sx0, Math.floor(cx - hw - 0.5)), e = Math.min(sx1, Math.ceil(cx + hw)); sx <= e; sx++) px((sx + 0.5 - p.tx) * p.fx, ly, sx, sy);
  }
}

/**
 * A rolling fireball. n lobes ride a vortex ring that climbs (rise px, slowing with time constant tau, then
 * drifting up at drift px/s), swells (tube and ring radii grow with time constant grow) and rolls (up through
 * the middle, out over the top, down the outside, back in underneath), while it cools from white-hot fire
 * into smoke that glows from inside, then thins away. Seen from a little below: the near side sits lower.
 * update(dt); draw(p, FR (fire ramp, bright to dark), SM (smoke ramp, light to dark), { mid }) (mid() is drawn
 * between the far and near lobes: a stem going up into it); shape() its centre and radii; hot() how hot its heart
 * still is; ember() how strongly its inside still glows. Options for a nuclear cap: style 1 (cel-shaded lobes),
 * inner (a glow that lingers inside and draws back to the middle as it cools), hollow (the underside sits a step
 * darker), fray [t0, rate, t1] with onFray(x, y, r, ux, uy) (the rim sheds small puffs late on).
 */
class Plume {
  constructor(R, o = {}) {
    this.o = o = {
      x: 0, y: -20, rise: 100, tau: 1.2, drift: 4, tube: [8, 20], ring: [1, 18], grow: 0.9, n: 40, size: [5, 10], swell: 0.5,
      spin: 2.4, spinTau: 1.6, heat: 1.15, cool: 0.45, under: 0.5, tilt: 0.2, squash: 0.7, fade: [4, 6], glow: 1, spread: 10,
      style: 0, inner: false, hollow: false, fray: null, ...o,
    };
    this.R = R;
    this.t = 0;
    this.roll = 0;
    this.onFray = null;
    // spread over the ring evenly: the roll angle on a golden-ratio walk, the turn round the axis in order
    this.lobes = Array.from({ length: o.n }, (_, i) => ({
      th: TAU * ((i * 0.618034 + R.range(-0.08, 0.08)) % 1), ph: (TAU * (i + R.range(-0.35, 0.35))) / o.n,
      j: R.range(-0.55, 0.12), s: R.range(o.size[0], o.size[1]), h: R.range(-0.22, 0.08), dx: R.range(-1, 1), dy: R.range(-1, 0.4),
      f: R.range(-0.9, 0.5), gv: R.range(0.55, 1.15),
    }));
  }
  shape(t = this.t) {
    const o = this.o, u = Math.max(0, t), g = 1 - Math.exp(-u / o.grow);
    return { x: o.x, y: o.y - o.rise * (1 - Math.exp(-u / o.tau)) - o.drift * u, tube: o.tube[0] + (o.tube[1] - o.tube[0]) * g, ring: o.ring[0] + (o.ring[1] - o.ring[0]) * g, g };
  }
  hot(t = this.t) {
    return clamp(this.o.heat - this.o.cool * t + 0.3);
  }
  /** How strongly the inside still glows (0..1), lingering well after the fire has gone. */
  ember(t = this.t) {
    return clamp((this.o.heat - this.o.cool * t + 1) / 1.1);
  }
  // where every lobe is at time t
  lobesAt(t) {
    const o = this.o, S = this.shape(t), base = o.heat - o.cool * t, span = S.ring + S.tube || 1, list = [];
    for (const q of this.lobes) {
      const fade = 1 - smooth(o.fade[0] + q.f, o.fade[1] + q.f * 0.5, t), loose = Math.pow(smooth(o.fade[0] - 1.8 + q.f, o.fade[1], t), 1.5) * o.spread;
      if (fade <= 0) continue;
      const th = q.th - this.roll, rt = S.tube * (1 + q.j), rho = S.ring + rt * Math.cos(th), up = Math.sin(th);
      const X = rho * Math.cos(q.ph), Z = rho * Math.sin(q.ph);
      // the outside cools first; the underside keeps its heat, fed from below
      const heat = base + q.h - 0.18 * Math.max(0, Math.cos(th)) * clamp(t * 2) + o.under * Math.max(0, -up) * clamp(base + 0.6);
      const r = q.s * (0.5 + 0.5 * S.g) * (1 + o.swell * clamp(1 - heat)) * (1 + 0.35 * (1 - fade));
      list.push({ x: S.x + X + q.dx * loose, y: S.y - rt * up * o.squash + Z * o.tilt + q.dy * loose, z: Z / span, up, out: Math.cos(th), heat, q, fade, r, d: Math.hypot(X, Z) / span, c: 1 - Math.min(1, Math.abs(X) / span) });
    }
    return list.sort((a, b) => a.z - b.z);
  }
  update(dt) {
    const o = this.o;
    this.t += dt;
    this.roll += o.spin * (0.12 + 0.88 * Math.exp(-this.t / o.spinTau)) * dt;
    // late on, the rim frays: lobes on the outside shed small puffs that drift off and thin
    if (o.fray && this.onFray && this.t > o.fray[0] && this.t < (o.fray[2] ?? Infinity)) {
      const S = this.shape(), k = o.fray[1] * dt * smooth(o.fray[0], o.fray[0] + 1, this.t);
      for (const e of this.lobesAt(this.t)) {
        if (e.out < 0.2 || !this.R.chance(k * e.fade)) continue;
        const ux = e.x - S.x, uy = e.y - S.y, l = Math.hypot(ux, uy) || 1;
        this.onFray(e.x + (ux / l) * e.r * 0.6, e.y + (uy / l) * e.r * 0.6, e.r, ux / l, uy / l);
      }
    }
  }
  draw(p, FR, SM, { mid } = {}) {
    const o = this.o, t = this.t;
    if (t >= o.fade[1] + 0.5) return;
    const S = this.shape(t), base = o.heat - o.cool * t, span = S.ring + S.tube || 1, list = this.lobesAt(t), age = clamp(t / o.fade[1]);
    const E = this.ember(t), reach = 0.3 + 1.15 * E;
    let drawn = false;
    for (const e of list) {
      if (!drawn && e.z >= 0 && mid) (drawn = true), mid();
      const h = e.heat, fade = e.fade, fire = clamp((h - 0.2) / 0.75);
      // the glow from inside: strongest under the middle, uneven from lobe to lobe; with inner, it draws back to the
      // middle as the cap cools
      const glow = o.inner
        ? E * clamp((reach - e.d) / 0.45) * (0.45 + 0.55 * Math.max(0, -e.up)) * e.q.gv * o.glow
        : clamp((base + 0.45) / 0.85) * o.glow * (0.4 + 0.35 * Math.max(0, -e.up) + 0.4 * e.c) * e.q.gv;
      lobe(p, e.x, e.y, e.r, FR, SM, fire, glow, fade * (0.82 + 0.18 * fire), e.z, (age > 0.72 ? 1 : 0) + (o.hollow && e.up < -0.35 ? 1 : 0), o.style);
      if (fire > 0.25) p.glow(e.x, e.y, e.r * 1.25 + 2, FR[2], 0.07 * fire);
    }
    if (!drawn && mid) mid();
    const hot = this.hot(t);
    if (hot > 0) p.glow(S.x, S.y, span * 1.8 + 14, FR[3], 0.32 * hot * o.glow);
    if (o.inner && E > 0.05) p.glow(S.x, S.y + S.tube * 0.3, span * (0.5 + 0.7 * E) + 8, FR[4], 0.22 * E * E);
  }
}

/**
 * A rising column: lobes boil up a stem from the floor into whatever sits on top, wide at the foot, swaying,
 * cooling from fire to smoke and dust. update(dt, top, feed): top is the y the stem rises to, feed 0..1 how
 * strongly it's still being fed (new lobes stop when it's 0, and the stem breaks up from the bottom).
 * draw(p, FR, SM, fire (0..1 heat at the foot), glow (0..1 under-light)).
 */
class Column {
  constructor(R, o = {}) {
    this.R = R;
    this.o = o = { w: 7, foot: 16, speed: 70, size: [5, 8], n: 18, sway: 2.5, fade: 0.5, style: 0, ...o };
    this.t = 0;
    this.lobes = [];
    this.acc = 0;
  }
  spawn(y) {
    const R = this.R, o = this.o;
    this.lobes.push({ y, x: R.range(-1, 1), s: R.range(o.size[0], o.size[1]), ph: R.range(0, TAU), a: 0, v: R.range(0.8, 1.2) });
  }
  update(dt, top, feed) {
    const o = this.o, L = Math.max(10, -top);
    this.t += dt;
    if (feed > 0) for (this.acc += dt * feed * o.n * (o.speed / L); this.acc > 1; this.acc--) this.spawn(-1);
    for (let i = this.lobes.length - 1; i >= 0; i--) {
      const b = this.lobes[i], u = clamp(-b.y / L);
      b.y -= o.speed * b.v * (0.45 + 0.55 * Math.min(1, -b.y / 24)) * dt;
      b.a = Math.min(1, b.a + dt * 4);
      if (b.y < top || (feed <= 0 && (b.a -= dt * (2 - u)) <= 0)) this.lobes.splice(i, 1);
    }
  }
  draw(p, top, FR, SM, fire, glow) {
    const o = this.o, L = Math.max(10, -top);
    // draw from the top down so the foot sits in front
    const list = [...this.lobes].sort((a, b) => a.y - b.y);
    for (const b of list) {
      const u = clamp(-b.y / L), foot = Math.pow(1 - u, 4), w = o.w + o.foot * foot;
      const x = b.x * w * 0.45 + Math.sin(this.t * 1.7 + b.ph + u * 3) * o.sway * u;
      const r = b.s * (0.75 + 0.5 * foot + 0.35 * u) * Math.min(1, b.a * 1.5);
      const end = 1 - smooth(0.85, 1, u);
      lobe(p, x, b.y - r * 0.3 * foot, r, FR, SM, clamp(fire * (1.1 - u * 0.9)), glow * smooth(0.55, 1, u), Math.min(1, b.a) * end * 0.9, 0, u > 0.5 ? 0 : 1, o.style);
    }
  }
}

};
/* ../pixelfx_src/src/fx/explosions/plasma-explosion.js */
__defs[26] = function (__exports) {
__get(__exports, "create", () => create);
__get(__exports, "meta", () => meta);
// The release (flash, rings, flare, light) and the arcs are adapted from Sprite Fusion's open-source energy
// (https://www.spritefusion.com/pixel-art-vfx/energy), MIT License, Copyright (c) 2026 Hugo Duprez.
const { Particles, Lights, P, Rng, rng, fit, band, bolt, forks, flare, sparkle, clamp, smooth, ease, noise, TAU, WHITE } = __req(2);
const { cull } = __req(27);

const meta = {
  name: "Plasma explosion",
  desc: "A blue-violet energy blast with no smoke: a white flash, a ball of plasma swelling into a thinning shell, shock rings in and out of depth, lightning arcs crackling off it.",
  tags: ["explosion", "plasma", "energy", "electric", "magic", "sci-fi", "one-shot"],
  size: [224, 200],
  origin: [112, 100],
  duration: 1.7,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#0a0828", "#1a1c6e", "#2c3cc0", "#4a7cf0", "#7cc0ff", "#c8ecff", "#ffffff"],
    accent: ["#1c0a30", "#4a1a8c", "#8a3ce0", "#c48cff", "#f0d8ff"],
    seed: 7,
  },
};

const BALL = 0.55;

function create(o) {
  const C = fit(o.palette, 7), V = fit(o.accent, 5), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, sparks: [C[6], C[5], C[4], V[3]] }), lights = new Lights();
  lights.add(0, 0, 96, C[4], 1, 0.6);
  lights.add(0, 0, 40, WHITE, 0.9, 0.1);
  lights.add(0, 0, 70, V[2], 0.5, 1.1);
  for (let i = 0; i < 46; i++) {
    const a = R.range(0, TAU), sp = R.range(140, 360);
    ps.spawn(P.MOTE, Math.cos(a) * 4, Math.sin(a) * 4, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.2, 0.42), R.pick([C[6], C[5], C[4], V[3]]), R.range(0.7, 1.1));
  }
  for (let i = 0; i < 26; i++) {
    const a = R.range(0, TAU), sp = R.range(40, 140);
    ps.spawn(P.FLAKE, Math.cos(a) * 10, Math.sin(a) * 10, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.8, 1.5), R.pick([C[5], V[3], V[4]]), R.range(0.6, 1.6));
  }
  let t = 0;
  return {
    update(dt) {
      t += dt;
      // the shell sheds sparkles and motes as it thins
      if (t > 0.12 && t < 0.9 && R.chance(30 * dt)) {
        const a = R.range(0, TAU), r = shell(t);
        ps.spawn(P.STAR, Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * R.range(10, 40), Math.sin(a) * R.range(10, 40), R.range(0.3, 0.6), R.chance(0.5) ? C[5] : V[4], R.range(0.5, 1.8));
      }
      ps.update(dt);
      cull(ps, -meta.origin[0] + 3, -meta.origin[1] + 3, meta.size[0] - meta.origin[0] - 3, meta.size[1] - meta.origin[1] - 3);
      lights.update(dt);
    },
    drawBack(p) {
      // the tilted ring's far half, behind the ball
      tilted(p, t, C, V, true);
    },
    draw(p) {
      // the ball: a white heart, cyan and blue bands, a violet rim boiling at the edge; it swells, then hollows out
      if (t < BALL) {
        const u = t / BALL, r = shell(t), hollow = smooth(0.35, 1, u), boil = Math.floor(t * 20);
        p.shade(-r - 3, -r - 3, r + 3, r + 3, (x, y, out) => {
          const d = Math.hypot(x, y), a = Math.atan2(y, x), edge = r * (1 + 0.1 * noise(a * 3 + boil * 0.7, 3));
          if (d > edge) return;
          const v = d / edge;
          if (v < hollow * 0.92) return;
          // turbulent bands swirling round the heart, and bright filaments twisting through them
          const n = noise(a * 4 + d * 0.25 + boil * 0.5, 5), w = v + n * 0.14, fil = Math.abs(Math.sin(a * 5 + d * 0.32 - t * 14 + n * 2.5)) < 0.1;
          out.k = 0.25 * (1 - u);
          if (v > 0.9) return V[2];
          if (fil && v > 0.3) return u < 0.5 ? WHITE : C[5];
          return w < 0.32 - u * 0.25 ? WHITE : w < 0.52 ? C[5] : w < 0.72 ? C[4] : w < 0.86 ? (u < 0.5 ? C[3] : V[3]) : V[2];
        });
        p.glow(0, 0, r * 1.6 + 6, C[4], 0.6 * (1 - u));
      }
      if (t < 0.07) p.circle(0, 0, 9 - t * 60, WHITE);
      if (t < 0.25) flare(p, 0, 0, 52 * Math.pow(1 - t / 0.25, 1.3), 1 - t / 0.25, C);
      // shock rings: a fast bright one, a slower violet one
      const u1 = t / 0.42;
      if (u1 < 1) {
        p.ring(0, 0, 8 + 84 * ease.outCubic(u1), Math.max(1, 3 * (1 - u1)), u1 < 0.25 ? WHITE : C[5], 1.15 - u1);
        p.glowRing(0, 0, 8 + 84 * ease.outCubic(u1), 5, C[4], 0.35 * (1 - u1));
      }
      const u2 = (t - 0.06) / 0.6;
      if (u2 > 0 && u2 < 1) p.ring(0, 0, 6 + 60 * ease.outCubic(u2), Math.max(1, 2 * (1 - u2)), V[3], 1.1 - u2);
      // arcs: lightning crackling out of the heart, re-struck every few frames, shorter as the charge runs out
      const left = 1 - smooth(0.15, 0.85, t), strike = Math.floor(t * 18);
      if (left > 0) {
        const r = rng(o.seed, strike, 17), n = 2 + Math.round(4 * left);
        for (let i = 0; i < n; i++) {
          const a = r.range(0, TAU), L = r.range(26, 58) * (0.45 + 0.55 * left), path = bolt(r, 0, 0, Math.cos(a) * L, Math.sin(a) * L, { jag: 0.28, depth: 4 });
          arc(p, path, C, V, 0.8 * left);
          if (r.chance(0.5)) for (const f of forks(r, path, { count: 1, len: 14, jag: 0.35 })) arc(p, f, C, V, 0.5 * left);
        }
        // and little arcs crawling over the shell
        const rs = shell(t);
        for (let i = 0; i < 3; i++) {
          const a = r.range(0, TAU), b = a + r.range(0.3, 0.6);
          arc(p, bolt(r, Math.cos(a) * rs, Math.sin(a) * rs, Math.cos(b) * rs, Math.sin(b) * rs, { jag: 0.4, depth: 3 }), C, V, 0.6 * left);
        }
      }
      tilted(p, t, C, V, false);
      ps.draw(p);
      lights.draw(p);
    },
  };
}

// the ball's radius: punched out fast, then easing
function shell(t) {
  return 5 + 30 * ease.outCubic(clamp(t / BALL));
}

// a ring on a tilted plane racing out round the blast: far half behind, near half in front
function tilted(p, t, C, V, back) {
  const u = (t - 0.03) / 0.5;
  if (u <= 0 || u >= 1) return;
  band(p, 0, 4, 12 + 86 * ease.outCubic(u), 0.28, Math.max(1, 4 * (1 - u)), 1.15 - u, [V[1], V[2], C[4], C[5]], (g) => (Math.sin(g) < 0) === back, u < 0.15);
}

// one arc: a soft glow along it, a cyan halo line, a white core
function arc(p, path, C, V, k) {
  if (k <= 0.05) return;
  for (let i = 1; i < path.length; i++) {
    const [ax, ay] = path[i - 1], [bx, by] = path[i];
    p.glowLine(ax, ay, bx, by, 5, V[2], 0.18 * k);
    p.line(ax + 1, ay, bx + 1, by, C[4], k * 0.8);
    p.line(ax, ay, bx, by, i < path.length * 0.6 ? WHITE : C[5], Math.min(1, k * 1.4));
  }
}

};
/* ../pixelfx_src/src/fx/impacts/ground-slam.js */
__defs[28] = function (__exports) {
__get(__exports, "create", () => create);
__get(__exports, "meta", () => meta);
// The rocks, grit, rolling floor dust and dust column are adapted from Sprite Fusion's open-source explosion
// (https://www.spritefusion.com/pixel-art-vfx/explosion), MIT License, Copyright (c) 2026 Hugo Duprez.
const { Particles, Bits, Lights, P, PF, B, Rng, fit, band, clamp, smooth, ease, TAU, WHITE, mix } = __req(2);
const { stone, star, makeCracks, drawCracks, frontCrescent, rock, rockShape, SOOT } = __req(25);

const meta = {
  name: "Ground slam",
  desc: "Something lands hard: the floor flashes and cracks, two crescent shock waves race out along it, a dust wave and a tall dust cloud rise, rocks erupt, bounce and settle.",
  tags: ["impact", "ground", "slam", "shockwave", "quake", "rocks", "dust", "one-shot"],
  size: [288, 208],
  origin: [144, 164],
  duration: 3.2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#2a1712", "#5e2c1c", "#a4502a", "#e8893a", "#ffc764", "#fff0b4", "#ffffff"], stone: "#4a3f69", reach: 104, seed: 5 },
};

const WAVE = 0.6; // seconds for the shock fronts to run out

// the dent: the floor's edge caves into a shallow dish, its bottom glowing while hot, lips thrown up either side
function crater(p, st, hot, C, k) {
  for (let x = -12; x <= 11; x++) {
    const q = Math.abs(x + 0.5) / 12, dep = Math.round(2.6 * (1 - q * q));
    if (q < 0.84) {
      for (let y = 0; y < dep; y++) p.dot(x, y, SOOT, k);
      p.dot(x, dep, hot > 0.5 ? C[5] : hot > 0.2 ? C[4] : st.lip, k);
    } else {
      p.dot(x, -1, q > 0.93 ? st.light : st.lip, k);
      if (q < 0.9) p.dot(x, -2, st.light, k * 0.8);
    }
  }
}

function create(o) {
  const C = fit(o.palette, 7), st = stone(o.stone), REACH = o.reach, R = new Rng(o.seed), floor = () => 0, D = meta.duration;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[6], C[5], C[4], C[3]] });
  const bits = new Bits({ ground: floor }), lights = new Lights(), HOT = [WHITE, C[5], C[4], C[3]];
  const dustLit = mix(st.dust, WHITE, 0.2), cracks = makeCracks(R, 10, { len: [22, 58], dive: 0.55, maxY: 22, forks: 0.7, x0: [2, 9] });
  const front = (t) => 7 + (REACH - 7) * ease.outCubic(clamp((t - 0.015) / WAVE));
  const heat = (t) => Math.pow(clamp(1 - t / 0.8), 1.4);
  const crest = (u) => [6 + 28 * Math.pow(1 - u, 0.75), 1.5 + 5 * Math.pow(1 - u, 0.9)]; // a front's height and thickness
  // the flash: a flat half-star hugging the floor, long rays along it, short ones up
  const burst = [
    { a: -0.07, len: R.range(34, 40), w: 1.9 }, { a: Math.PI + 0.07, len: R.range(34, 40), w: 1.9 },
    { a: -0.42 + R.range(-0.08, 0.08), len: R.range(15, 20), w: 1.5 }, { a: -Math.PI + 0.42 + R.range(-0.08, 0.08), len: R.range(15, 20), w: 1.5 },
    { a: -Math.PI / 2 + R.range(-0.15, 0.15), len: R.range(18, 24), w: 1.7 },
    { a: -1.05 + R.range(-0.1, 0.1), len: R.range(10, 14), w: 1.2 }, { a: -Math.PI + 1.05 + R.range(-0.1, 0.1), len: R.range(10, 14), w: 1.2 },
  ];
  // embers caught in the cracks, flickering as they cool
  const embers = [];
  for (const c of cracks)
    for (const [x, y, d] of c.pts) if (d > 3 && d < 32 && R.chance(0.25)) embers.push({ x, y, d, life: R.range(0.8, 2.2), ph: R.range(0, TAU) });

  // contact: light floods out, sparks fly off the stone and skitter along the floor
  lights.add(0, -12, 96, C[4], 0.6, 0.6);
  lights.add(0, -4, 50, WHITE, 0.9, 0.14);
  for (let i = 0; i < 56; i++) {
    const low = i < 14, s = R.sign(), a = low ? (s > 0 ? -R.range(0.04, 0.6) : Math.PI + R.range(0.04, 0.6)) : -Math.PI / 2 + R.range(-1.15, 1.15);
    const sp = low ? R.range(150, 380) : R.range(200, 500);
    ps.spawn(P.SPARK, R.range(-4, 4), -1, Math.cos(a) * sp, Math.sin(a) * sp, low ? R.range(0.2, 0.5) : R.range(0.25, 0.65), WHITE, 1, low ? 0 : R.range(0, 0.05));
  }
  // rocks erupt from the dent: three heavy ones that barely clear it, the rest thrown high
  for (let i = 0; i < 20; i++) {
    const s = i < 3 ? 4 : R.int(1, 3), a = -Math.PI / 2 + R.range(-0.5, 0.5), sp = s > 3 ? R.range(110, 190) : R.range(170, 380) * (s > 2 ? 0.8 : 1);
    bits.add({ kind: B.CHUNK, x: R.range(-7, 7), y: -2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 1, drag: 0.4, bounce: 0.38, life: R.range(1.9, 2.7), a: R.range(0, TAU), va: R.range(-14, 14), s, pts: rockShape(R), pvy: 0 });
  }
  // grit: a fan of floor bits that bounce once and settle
  for (let i = 0; i < 110; i++) {
    const u = R.range(-1, 1), a = -Math.PI / 2 + u * 0.65, sp = R.range(110, 380) * (1 - 0.35 * Math.abs(u));
    ps.spawn(P.GRIT, u * 6, -1, Math.cos(a) * sp, Math.sin(a) * sp, R.range(1, 2.2), R.pick([st.light, st.body, st.body, st.shade, st.shade, st.lip]), R.chance(0.35) ? 2 : 1);
  }
  // the dust cloud: a column that shoots up and spreads at the top, lit on top, and a heavy bank at its foot
  for (let i = 0; i < 28; i++) {
    const core = i < 14, s = R.sign();
    ps.spawn(P.SMOKE, core ? R.range(-5, 5) : s * R.range(4, 12), -R.range(2, 10), core ? R.range(-12, 12) : s * R.range(14, 38), -R.range(50, 130) * (core ? 1 : R.range(0.3, 0.6)), R.range(1.9, 2.7), R.chance(0.35) ? dustLit : st.dust, core ? R.range(4.5, 9) : R.range(4, 7.5), R.range(0.02, 0.22), PF.BIG);
  }
  for (let i = 0; i < 10; i++) {
    const s = R.sign();
    ps.spawn(P.SMOKE, s * R.range(2, 14), -R.range(2, 6), s * R.range(20, 70), -R.range(4, 20), R.range(1.4, 2.3), st.dust, R.range(6, 9), R.range(0, 0.08), PF.BIG);
  }
  // fine dust settling out of the cloud while it hangs
  for (let i = 0; i < 26; i++)
    ps.spawn(P.FLAKE, R.range(-22, 22), -R.range(14, 80), R.range(-12, 12), R.range(-10, 4), R.range(1.2, 2), R.chance(0.5) ? st.lip : dustLit, R.range(0.5, 1.2), R.range(0.25, 1));

  let t = 0;
  const acc = [R.next(), R.next()];
  const ring = (p, back) => {
    const u = clamp((t - 0.015) / (WAVE + 0.1));
    if (t < 0.015 || u >= 0.9) return;
    band(p, 0, 0.5, front(t) + 1, 0.16, Math.max(1, 4 * Math.pow(1 - u, 0.8)), u < 0.55 ? 1.1 : (0.9 - u) / 0.35,
      u < 0.35 ? [C[3], C[4], C[5], C[6]] : [st.body, st.light, C[4], C[5]], (g) => Math.sin(g) < 0 === back, t < 0.09);
  };
  const fronts = (p) => {
    const u = clamp((t - 0.03) / (WAVE + 0.16));
    if (t < 0.03 || u >= 1) return;
    const fr = front(t), [h, w] = crest(u), k = u < 0.7 ? 1 : (1 - u) / 0.3;
    const cols = u < 0.14 ? [WHITE, C[6], C[5]] : u < 0.34 ? [C[6], C[5], C[4]] : u < 0.55 ? [C[5], C[4], st.lip] : [st.lip, st.light, st.dust];
    for (const s of [-1, 1]) {
      frontCrescent(p, s * fr, s, h, w, cols, k);
      p.glow(s * fr, -h * 0.3, 8 + h * 0.7, C[4], 0.5 * (1 - u) * k);
    }
  };

  return {
    update(dt) {
      t += dt;
      // dust kicked up behind the racing fronts, and spray off their crests
      const u = clamp((t - 0.015) / WAVE);
      if (u > 0 && u < 1) {
        const fr = front(t), [h] = crest(u);
        for (let k = 0; k < 2; k++) {
          const s = k ? 1 : -1;
          for (acc[k] += dt * 120 * (1 - u * 0.7); acc[k] > 1; acc[k]--) {
            ps.spawn(P.SMOKE, s * (fr - R.range(1, 7)), -R.range(0.5, 3), s * R.range(15, 70) * (1 - u), -R.range(2, 12), R.range(1, 2.1), R.chance(0.3) ? dustLit : st.dust, R.range(2.5, 6.5) * (1 - 0.4 * u), 0, PF.BIG);
            if (R.chance(0.5)) ps.spawn(P.DUST, s * (fr - R.range(0, 3)), -R.range(0.3, 0.9) * h, s * R.range(-15, 25), -R.range(8, 35), R.range(0.3, 0.6), R.chance(0.5) ? dustLit : st.dust, R.range(1.2, 2.4));
            if (R.chance(0.4)) ps.spawn(P.GRIT, s * fr, -1, s * R.range(10, 60), -R.range(40, 140) * (1 - u), R.range(0.5, 1), R.pick([st.light, st.body, st.lip]), 1);
            if (u < 0.45 && R.chance(0.2)) ps.spawn(P.SPARK, s * fr, -1, s * R.range(60, 200), -R.range(30, 160), R.range(0.12, 0.3));
          }
        }
      }
      for (const b of bits.list) b.pvy = b.vy;
      bits.update(dt);
      // rocks that land hard kick up dust
      for (const b of bits.list)
        if (b.pvy > 70 && b.vy <= 0) {
          const n = b.pvy > 200 ? 3 : 2;
          for (let i = 0; i < n; i++) ps.spawn(P.DUST, b.x + R.range(-1.5, 1.5), -0.5, R.sign() * R.range(8, 35), -R.range(2, 16), R.range(0.3, 0.65), st.dust, R.range(1.3, 2.4) * (0.7 + b.s * 0.25));
          b.pvy = 0;
        }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      const fade = 1 - smooth(D - 0.9, D - 0.15, t), H = heat(t);
      if (t > 0.02) crater(p, st, H, C, fade);
      drawCracks(p, cracks, (c) => c.len * ease.outCubic(clamp((t - c.t0) / 0.1)), (d) => H * clamp(1.2 - d / 40), HOT, SOOT, st.light, fade);
      for (const e of embers) {
        const k = 1 - (t - 0.1) / e.life;
        if (t < 0.1 || k <= 0) continue;
        const f = 0.6 + 0.4 * Math.sin(t * 23 + e.ph);
        p.px(e.x, e.y, k * f > 0.55 ? C[5] : k * f > 0.25 ? C[4] : C[3]);
        p.glow(e.x, e.y, 4, C[4], 0.35 * k * f);
      }
      ring(p, true);
      ps.draw(p, "back");
    },
    draw(p) {
      ring(p, false);
      fronts(p);
      for (const b of bits.list) rock(p, b, st);
      ps.draw(p, "front");
      if (t < 0.035) {
        p.ellipse(0, 0, 30, 4.5, (d) => (d > 0.8 ? C[4] : d > 0.5 ? C[6] : WHITE));
        star(p, 0, -1, burst, 1, 1, [C[4], C[6], WHITE, WHITE]);
      } else if (t < 0.07) star(p, 0, -1, burst, 1.25, 0.5, [C[3], C[5], C[6], WHITE]);
      // the floor flashes along its length, then the dent glows while the cracks are hot
      if (t < 0.14) p.glowLine(-80, 0, 80, 0, 10, C[5], 0.55 * (1 - t / 0.14));
      const H = heat(t);
      if (H > 0) p.glow(0, 1, 46, C[4], 0.35 * H);
      lights.draw(p);
    },
  };
}

};
/* ../pixelfx_src/src/fx/melee/_lib.js */
__defs[30] = function (__exports) {
__get(__exports, "through", () => through);
__get(__exports, "onSwing", () => onSwing);
__get(__exports, "travel", () => travel);
__get(__exports, "plane", () => plane);
__get(__exports, "smear", () => smear);
__get(__exports, "trace", () => trace);
__get(__exports, "glowAlong", () => glowAlong);
__get(__exports, "slash", () => slash);
__get(__exports, "shavings", () => shavings);
__get(__exports, "stone", () => stone);
__get(__exports, "rock", () => rock);
__get(__exports, "cracks", () => cracks);
__get(__exports, "star", () => star);
__get(__exports, "sliver", () => sliver);
__get(__exports, "along", () => along);
__get(__exports, "swing", () => swing);
__get(__exports, "slashEnd", () => slashEnd);
// Shared by the melee effects: swings on a tilted circle (the smear, its dotted trace), floor cracks, rocks.
// The crescent and trace recipe is adapted from Sprite Fusion's open-source slash
// (https://www.spritefusion.com/pixel-art-vfx/slash), MIT License, Copyright (c) 2026 Hugo Duprez.
// Files starting with _ are helpers, not effects.

const { P, clamp, smooth, ease, hex, mix, scale, rgb, WHITE, TAU } = __req(2);

/**
 * A swing: a circle of radius R around (cx, cy), squashed to sy across its plane (1 stands up facing us, 0.16
 * lies on the floor) and turned by rot, swept from angle a0 in direction dir (+1 turns clockwise on screen).
 * k lifts the band into a shallow cone: a point dr inside the rim sits k * dr higher, so a level ring shows its
 * near half broad and its far half thin, like a blade angled down from the hilt (keep k below sy).
 * Positions along it are u, radians from a0 in the swing's direction.
 */
const swing = (o) => ({ cx: 0, cy: 0, R: 30, sy: 1, rot: 0, a0: 0, dir: 1, k: 0, ...o });

/** A swing on radius R whose arc passes through (x, y) heading along angle th, that point `at` of the way along span. */
function through(x, y, th, dir, R, span, at = 0.55, extra = {}) {
  const a = th - (dir * Math.PI) / 2;
  return swing({ cx: x - Math.cos(a) * R, cy: y - Math.sin(a) * R, R, sy: 1, rot: 0, a0: a - dir * span * at, dir, span, ...extra });
}

/** The screen point at plane radius r, u radians along the swing. */
function onSwing(s, r, u) {
  const a = s.a0 + s.dir * u, lx = Math.cos(a) * r, ly = Math.sin(a) * r * s.sy - s.k * (s.R - r), c = Math.cos(s.rot), n = Math.sin(s.rot);
  return [s.cx + lx * c - ly * n, s.cy + lx * n + ly * c];
}

/** The on-screen unit direction the swing travels at u, and the in-plane angle there (sin < 0 is the far half). */
function travel(s, u) {
  const [x0, y0] = onSwing(s, s.R, u), [x1, y1] = onSwing(s, s.R, u + 0.01), l = Math.hypot(x1 - x0, y1 - y0) || 1;
  return { x: x0, y: y0, dx: (x1 - x0) / l, dy: (y1 - y0) / l, a: s.a0 + s.dir * u };
}

/** The plane radius and angle under a screen point (inverts onSwing, cone included). */
function plane(s, x, y) {
  const c = Math.cos(s.rot), n = Math.sin(s.rot), dx = x - s.cx, dy = y - s.cy, lx = dx * c + dy * n, ly = -dx * n + dy * c;
  if (!s.k) return [Math.hypot(lx, ly / s.sy), Math.atan2(ly / s.sy, lx)];
  // r sin(a) sy = m - k r, r cos(a) = lx  =>  r^2 (sy^2 - k^2) + 2 m k r - (lx^2 sy^2 + m^2) = 0
  const m = ly + s.k * s.R, A = s.sy * s.sy - s.k * s.k, B = 2 * m * s.k, Cc = lx * lx * s.sy * s.sy + m * m;
  const r = (-B + Math.sqrt(B * B + 4 * A * Cc)) / (2 * A);
  return [r, Math.atan2((m - s.k * r) / s.sy, lx)];
}

/**
 * Shade a swing's band from u0 to u1 (u1 - u0 at most a full turn), plane radius R + pad down to R - wMax - 1.
 * fn(u, r, out, a) shades each pixel: u along the swing, r its plane radius, a the in-plane angle. half: 0 the
 * whole band, -1 only the far half (behind a character), 1 only the near half.
 */
function smear(p, s, u0, u1, wMax, fn, half = 0, pad = 1) {
  if (u1 - u0 < 0.005) return;
  const c = Math.cos(s.rot), n = Math.sin(s.rot), A = s.R + pad + 1, Bn = A * s.sy + s.k * (wMax + 2);
  const hx = Math.hypot(A * c, Bn * n) + 1, hy = Math.hypot(A * n, Bn * c) + 1, rIn = s.R - wMax - 1;
  // each half only needs its side of the centre (plus what the tilt and the cone lift can reach across)
  const over = Math.abs(n) * A + s.k * (wMax + 2) + 2, y0 = half > 0 ? s.cy - over : s.cy - hy, y1 = half < 0 ? s.cy + over : s.cy + hy;
  p.shade(s.cx - hx, y0, s.cx + hx, y1, (x, y, out) => {
    const [r, a] = plane(s, x, y);
    if (r > s.R + pad || r < rIn) return;
    if (half && (Math.sin(a) < 0 ? -1 : 1) !== half) return;
    let u = (s.dir * (a - s.a0)) % TAU;
    if (u < 0) u += TAU;
    while (u < u0) u += TAU;
    if (u > u1) return;
    return fn(u, r, out, a);
  });
}

/** Dots along a swing at plane radius r from u0 to u1, every `step` px, alpha a(u) (dithered into a dotted trace). */
function trace(p, s, r, u0, u1, c, a, half = 0, step = 0.6) {
  const du = step / Math.max(4, r);
  for (let u = u0; u <= u1; u += du) {
    const g = s.a0 + s.dir * u;
    if (half && (Math.sin(g) < 0 ? -1 : 1) !== half) continue;
    const [x, y] = onSwing(s, r, u), k = typeof a === "function" ? a(u) : a;
    if (k > 0) p.dot(x, y, typeof c === "function" ? c(u) : c, k);
  }
}

/** Glow riding a swing from u0 to u1 (light along the arc). */
function glowAlong(p, s, r, u0, u1, rad, c, k, half = 0, step = 0.35) {
  for (let u = u0; u <= u1; u += step) {
    const g = s.a0 + s.dir * u;
    if (half && (Math.sin(g) < 0 ? -1 : 1) !== half) continue;
    const [x, y] = onSwing(s, r, u), kk = typeof k === "function" ? k(u) : k;
    if (kk > 0.004) p.glow(x, y, rad, c, kk);
  }
}

/**
 * A slash crescent along swing s (Sprite Fusion's recipe): the edge whips out over s.span radians in s.sweep s,
 * holds, then the tail follows over s.trail, thinning and cooling down s.ramp (dark to bright); a dotted trace
 * lingers where it passed. s: a swing plus { span, W, t0, sweep, hold, trail, ramp, hot (0..1 flashes it white),
 * lens (thickest in the middle, not just behind the edge) }.
 */
function slash(p, s, t, half = 0) {
  const u = t - s.t0;
  if (u < 0) return;
  const R = s.ramp, n = R.length, life = s.sweep + s.hold + s.trail, hot = s.hot ?? 0;
  const head = ease.outExpo(clamp(u / s.sweep)), tail = smooth(s.sweep + s.hold, life, u), age = clamp(u / life);
  const U = s.span * head, T = s.span * tail, W = s.W * (1 - tail * 0.55);
  if (tail < 1 && U - T > 0.01) {
    smear(p, s, T, U, W, (uu, r, out) => {
      const v = (uu - T) / (U - T), w = W * Math.pow(Math.sin(Math.PI * Math.pow(v, s.lens ? 1 : 2.2)), s.lens ? 0.75 : 0.6);
      if (w < 0.35) return;
      const q = (s.R - r) / w;
      if (q < 0 || q > 1) return;
      const ci = (q < 0.22 && age < 0.5) || q < hot * 0.7 ? 0 : Math.round(q * (n - 1) * 0.75 + age * 2.4 - v * 0.8 + 0.4 - hot * 3);
      out.c = R[n - 1 - clamp(ci, 0, n - 1)];
      out.a = Math.min(1, v / (s.lens ? 0.1 : 0.4));
    }, half);
    glowAlong(p, s, s.R - W * 0.4, T, U, 5 + W, R[n - 3], (uu) => (0.22 + hot * 0.3) * (1 - age) * ((uu - T) / (U - T)), half, 0.3);
  }
  const th = 0.7 * (1 - clamp((u - s.sweep - s.hold) / (s.trail + 0.2)));
  if (tail > 0.02 && th > 0) trace(p, s, s.R - 0.5, 0, T, R[2], (uu) => th * (0.4 + 0.6 * uu / s.span), half);
}

/** Where a slash's edge ends up, and which way it's travelling there. */
const slashEnd = (s) => travel({ ...s, R: s.R - s.W * 0.3 }, s.span);

/** Shavings flung off a slash's edge, outward from its circle (Sprite Fusion's slash). */
function shavings(ps, R, s, n, colors, from = 0.3) {
  for (let i = 0; i < n; i++) {
    const [x, y] = onSwing(s, s.R, s.span * R.range(from, 1)), ox = x - s.cx, oy = y - s.cy, l = Math.hypot(ox, oy) || 1, sp = R.range(30, 100);
    ps.spawn(P.MOTE, x, y, (ox / l) * sp, Math.min(25, (oy / l) * sp) - 10, R.range(0.25, 0.55), R.pick(colors), 0.6);
  }
}

/** Stone shades for rocks, grit and dust from one body color (as Sprite Fusion's explosion does). */
function stone(c) {
  c = hex(c);
  return { light: mix(scale(c, 1.35), WHITE, 0.08), body: c, shade: scale(c, 0.64), dust: mix(scale(c, 1.2), rgb(150, 140, 150), 0.3), dark: scale(c, 0.42) };
}

const OUTLINE = hex("#1a1422");
/** A tumbling rock (a Bits CHUNK): a lit side, a shaded side, an outline, fading at the end of its life. */
function rock(p, b, st) {
  const r = 0.6 + b.s * 0.75, fade = Math.min(1, b.life / 0.5), lx = Math.cos(b.a) * r * 0.4, ly = Math.sin(b.a) * r * 0.4;
  p.shade(b.x - r - 1, b.y - r - 1, b.x + r + 1, b.y + r + 1, (x, y, out) => {
    const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx * 1.15, dy);
    if (d > r + 0.9) return;
    const lit = dx * lx + dy * ly;
    out.c = d > r ? OUTLINE : lit < -0.4 ? st.light : lit > 0.6 ? st.shade : st.body;
    out.a = fade;
  });
}

/**
 * Jagged cracks splitting the floor from x0: each runs out along the floor's edge and zig-zags down into its
 * face (y from 0 to about depth), with short forks. n cracks alternate sides (bias > 0 sends more forward).
 * Returns [{ pts, at (0..1 how far out it starts), fork }]. Built once from an Rng.
 */
function cracks(R, x0, n, reach, depth = 7, bias = 0.3) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const side = R.chance(0.5 + bias * 0.5) ? 1 : -1, L = reach * R.range(0.45, 1) * (i < 2 ? 1 : 0.7), pts = [[x0 + side * R.range(0, 1.5), 0]];
    let x = pts[0][0], y = 0;
    while (Math.abs(x - x0) < L && y < depth) {
      x += side * R.range(1.5, 3.5);
      y = Math.min(depth, Math.max(0, y + R.range(-0.6, 1.6) * (Math.abs(x - x0) > 3 ? 1 : 0.3)));
      pts.push([Math.round(x), Math.round(y)]);
      if (R.chance(0.18) && pts.length > 3 && y < depth - 2) {
        const f = [[Math.round(x), Math.round(y)]];
        let fx = x, fy = y;
        for (let j = R.int(1, 3); j > 0; j--) (fx += side * R.range(1, 3)), (fy += R.range(0.8, 2)), f.push([Math.round(fx), Math.round(Math.min(depth + 1, fy))]);
        out.push({ pts: f, at: Math.abs(x - x0) / reach, fork: true });
      }
    }
    out.push({ pts, at: 0, fork: false });
  }
  return out;
}

/**
 * An impact star (after Sprite Fusion's impact): tapered spikes [{ a, len, w }] around (x, y), drawn in three
 * passes (rim, body, core) with a hot disc in the middle. sc stretches, th thins.
 */
function star(p, x, y, spikes, sc, th, core, body, inner, rim) {
  for (const pass of [0, 1, 2])
    for (const s of spikes) {
      const c = Math.cos(s.a), sn = Math.sin(s.a), L = s.len * sc;
      for (let d = 0; d <= L; d += 0.5) {
        const hw0 = s.w * th * (1 - d / L) * Math.min(1, 0.5 + d / 3), hw = pass === 0 ? hw0 + 0.8 : pass === 1 ? hw0 : hw0 * 0.45;
        if (pass === 2 && d > L * 0.55) break;
        for (let o = -hw; o <= hw; o += 0.5) p.px(x + c * d - sn * o, y + sn * d + c * o, pass === 0 ? rim : pass === 1 ? (d < L * 0.35 ? inner : body) : core);
      }
    }
  const r = 2.4 * sc * Math.sqrt(th);
  p.circle(x, y, r + 0.8, inner);
  p.circle(x, y, r, core);
}

/** A thin arc flying out from (x, y): a sliver at radius r around angle a, arc radians long, dithered by k. */
function sliver(p, x, y, a, r, arc, c, k) {
  const n = Math.ceil(r * arc * 2.2);
  for (let j = 0; j <= n; j++) {
    const u = j / n - 0.5, th = a + u * arc, w = 1.4 * (1 - Math.abs(u) * 2);
    for (let o = -w * 0.5; o <= w * 0.5 + 0.01; o += 0.5) p.dot(x + Math.cos(th) * (r + o), y + Math.sin(th) * (r + o), c, k);
  }
}

/** Part of a polyline: the first `len` px of it. Calls fn(x0, y0, x1, y1, d) for each piece (d: distance along). */
function along(pts, len, fn) {
  let d = 0;
  for (let i = 1; i < pts.length && d < len; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], l = Math.hypot(x1 - x0, y1 - y0), f = Math.min(1, (len - d) / l);
    fn(x0, y0, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, d);
    d += l;
  }
}


};
/* ../pixelfx_src/src/fx/melee/heavy-cleave.js */
__defs[29] = function (__exports) {
__get(__exports, "create", () => create);
__get(__exports, "meta", () => meta);
__get(__exports, "act", () => act);
// The crescent and its cooling ramp are adapted from Sprite Fusion's open-source slash
// (https://www.spritefusion.com/pixel-art-vfx/slash), and the impact star, dust, grit and embers from his
// impact and explosion (https://www.spritefusion.com/pixel-art-vfx), MIT License, Copyright (c) 2026 Hugo Duprez.
const { Particles, Bits, Lights, P, PF, B, Rng, fit, sparkle, band, clamp, smooth, ease, rand, TAU, WHITE, READY } = __req(2);
const { swing, onSwing, smear, trace, glowAlong, stone, rock, cracks, star, sliver, along } = __req(30);

const meta = {
  name: "Heavy cleave",
  desc: "A glint over the head, then a thick ember arc accelerates over the top into the floor: a white slam, glowing cracks, dust rolling both ways, grit and rising embers.",
  tags: ["melee", "slash", "cleave", "axe", "heavy", "ground", "fire", "combat", "directional", "one-shot"],
  size: [208, 116],
  origin: [68, 96],
  duration: 1.9,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#2a0c10", "#5c1414", "#a3241a", "#e0481c", "#ff8a2a", "#ffc23d", "#fff0a0", "#ffffff"],
    stone: "#4a3f69",
    seed: 5,
  },
};

const REST_ = { ...READY, weapon: "greatsword", two: true, sa: -1, fx: 11, fy: -21 };
const OVER = { ...REST_, x: -4, crouch: 2, lean: -2, fx: 1, fy: -42, sa: -2.45, ffx: 8, fbx: -7 };
const FLOOR = { ...REST_, x: 0, crouch: 7, lean: 6, fx: 17, fy: -21, sa: 0.72, ffx: 11, fbx: -10, toeB: true };
const act = {
  target: { x: 66 },
  poses: [
    [-0.42, { ...REST_, x: -4 }],
    [-0.3, { ...REST_, x: -3, crouch: 4, fx: 13, fy: -29, sa: -1.3 }],
    [-0.12, { ...OVER, crouch: 4 }],
    [0.2, { ...OVER, crouch: 3 }],
    [0.27, { ...REST_, x: -1, y: -2, crouch: 0, lean: 2, fx: 11, fy: -42, sa: -1.45, ffx: 10, ghost: 1 }, "snap"],
    [0.31, { ...REST_, x: 0, y: -1, crouch: 3, lean: 4, fx: 18, fy: -33, sa: -0.45, ffx: 12, ghost: 1 }, "snap"],
    [0.335, FLOOR, "snap"],
    [0.85, { ...FLOOR, crouch: 6, lean: 5 }],
    [1.3, { ...REST_, x: -2, crouch: 4, lean: 2, fx: 15, fy: -23, sa: 0.1 }],
    [1.7, { ...REST_, x: -4 }],
  ],
  hits: [{ t: 0.335, stop: 0.2, shake: 0.34, amp: 3, push: 3.2, straw: 28, y: -8 }],
  dust: [{ t: 0.335, x: 18, n: 8, dir: 1 }, { t: 0.335, x: -12, n: 5, dir: -1 }],
};

const RAISE = 0.2; // the glint over the head
const SWING = 0.135; // the arc accelerates over the top
const HIT = RAISE + SWING;
const HOLD = 0.05, TRAIL = 0.22;
const head = (t) => ease.inQuad(clamp((t - RAISE) / SWING)); // fraction of the arc the edge has made
const passedAt = (f) => RAISE + SWING * Math.sqrt(clamp(f)); // when the edge passed fraction f

function create(o) {
  const C = fit(o.palette, 8), n = C.length, R = new Rng(o.seed), st = stone(o.stone), floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[6], C[5], C[4], C[3]] }), bits = new Bits({ ground: floor }), lights = new Lights();
  // the arc: from behind the head, over the top, down into the floor in front
  const A = swing({ cx: 3, cy: -22, R: 37, sy: 0.88, rot: 0.32, a0: -2.45, dir: 1 });
  let U1 = 0;
  while (onSwing(A, A.R, U1)[1] < -0.5 && U1 < 4) U1 += 0.005;
  const E = { ...A, R: A.R * 0.76 }, W = 16, WE = 5;
  const [X] = onSwing(A, A.R - 2, U1), GLINT = onSwing(A, A.R - 3, 0);
  const lines = cracks(R, X, 4, 40, 7, 0.4);
  // the impact star: long spikes along the floor, shorter ones up
  const spikes = [-Math.PI, -2.7, -2.15, -1.62, -1.05, -0.45, 0].map((a, i) => ({ a: a + R.range(-0.08, 0.08), len: (i === 0 || i === 6 ? 20 : i === 3 ? 15 : 9) + R.range(0, 4), w: 1.6 + R.range(0, 0.6) }));
  const shards = [-2.5, -1.9, -1.2, -0.6].map((a) => ({ a: a + R.range(-0.15, 0.15), r: 8 + R.range(0, 3), v: R.range(80, 130), arc: R.range(0.35, 0.6) }));
  let t = 0, hit = false;

  const arc = (p, s, w0, lag, rim) => {
    const tt = t - lag, U = U1 * head(tt), T = U1 * smooth(HIT + HOLD, HIT + HOLD + TRAIL, tt);
    if (U < 0.02 || T >= U - 0.02) return;
    const gone = smooth(HIT + HOLD, HIT + HOLD + TRAIL, tt), shrink = 1 - 0.75 * gone;
    smear(p, s, T, U, w0, (u, r, out) => {
      const age = Math.max(0, tt - passedAt(u / U1)), v = (u - T) / (U - T);
      const w = w0 * shrink * Math.pow(Math.sin(Math.PI * Math.pow(v, 2.2)), 0.6);
      if (w < 0.4) return;
      const q = (s.R - r) / w;
      if (q < 0 || q > 1) return;
      const ci = rim && q < 0.22 && age < 0.12 ? 0 : Math.round(q * (n - 1) * 0.62 + age * 7 + Math.max(0, tt - HIT) * 10 - v * 0.8 + (rim ? 0.7 : 1.7));
      out.c = C[n - 1 - clamp(ci, 0, n - 1)];
      out.a = Math.min(1, v / 0.35) * (1.2 - gone);
    });
    if (rim) glowAlong(p, s, s.R - w0 * 0.4, T, U, 7 + w0 * 0.5, C[4], (u) => 0.26 * Math.exp(-Math.max(0, tt - passedAt(u / U1)) / 0.2) * ((u - T) / (U - T)));
  };

  return {
    update(dt) {
      t += dt;
      // heat gathers to the raised blade
      if (t < RAISE - 0.04 && R.chance(0.35)) {
        const a = R.range(0, TAU), D = R.range(14, 26), T = R.range(0.14, 0.2), v = (D * 3) / (Math.exp(3 * T) - 1);
        ps.spawn(P.STREAK, GLINT[0] + Math.cos(a) * D, GLINT[1] + Math.sin(a) * D, -Math.cos(a) * v, -Math.sin(a) * v, T, R.chance(0.5) ? C[5] : C[4]);
      }
      // embers shed off the edge as it comes over
      if (t > RAISE && t < HIT && R.chance(0.7)) {
        const u = U1 * head(t) * R.range(0.6, 1), [x, y] = onSwing(A, A.R - R.range(0, 6), u);
        ps.spawn(P.EMBER, x, y, R.range(-20, 20), R.range(-40, -10), R.range(0.5, 1.1), C[4], R.range(1, 2));
      }
      if (!hit && t >= HIT) {
        hit = true;
        lights.add(X, -6, 26, WHITE, 0.9, 0.1);
        lights.add(X, -12, 64, C[4], 0.5, 0.8);
        // sparks fan up off the floor, most of them forward
        for (let i = 0; i < 26; i++) {
          const a = -Math.PI / 2 + R.range(-1.2, 1.35), sp = R.range(140, 360);
          ps.spawn(P.SPARK, X, -1, Math.cos(a) * sp, Math.sin(a) * sp - 40, R.range(0.15, 0.5));
        }
        // dust rolls out both ways along the floor
        for (let i = 0; i < 20; i++) {
          const s = i % 2 ? -1 : 1;
          ps.spawn(P.SMOKE, X + s * R.range(0, 8), -R.range(2, 6), s * R.range(45, 135), -R.range(2, 12), R.range(1.0, 1.45), st.dust, R.range(5, 8.5), R.range(0, 0.07), PF.BIG);
        }
        for (let i = 0; i < 4; i++) ps.spawn(P.SMOKE, X + R.range(-4, 4), -R.range(3, 8), R.range(-15, 15), -R.range(40, 90), R.range(1.0, 1.45), st.dust, R.range(4, 6.5), R.range(0.02, 0.1), PF.BIG);
        for (let i = 0; i < 8; i++) ps.spawn(P.DUST, X + R.range(-4, 4), -R.range(1, 4), R.range(-60, 60), -R.range(8, 30), R.range(0.35, 0.7), st.dust, R.range(2, 3.5));
        // grit and a few stones thrown up, forward
        for (let i = 0; i < 44; i++) {
          const a = -Math.PI / 2 + R.range(-0.7, 1.0), sp = R.range(60, 230);
          ps.spawn(P.GRIT, X + R.range(-3, 3), -1, Math.cos(a) * sp, Math.sin(a) * sp, R.range(1.0, 1.5), R.pick([st.light, st.body, st.body, st.shade]), R.chance(0.35) ? 2 : 1);
        }
        for (let i = 0; i < 6; i++)
          bits.add({ kind: B.CHUNK, x: X + R.range(-3, 3), y: -2, vx: R.range(-50, 110), vy: -R.range(120, 260), g: 1, drag: 0.4, bounce: 0.3, life: R.range(1.15, 1.5), a: R.range(0, TAU), va: R.range(-14, 14), s: R.int(1, 2) });
        // embers lift off the cut
        for (let i = 0; i < 16; i++) ps.spawn(P.EMBER, X + R.range(-8, 8), -R.range(1, 6), R.range(-50, 60), -R.range(30, 110), R.range(0.7, 1.5), C[4], R.range(1, 2));
      }
      // the cracks breathe embers while they're hot
      if (hit && t < HIT + 0.6 && R.chance(0.12)) {
        const c = R.pick(lines), pt = R.pick(c.pts);
        ps.spawn(P.EMBER, pt[0], pt[1] - 1, R.range(-12, 12), -R.range(20, 50), R.range(0.5, 0.9), C[4], 1);
      }
      bits.update(dt);
      for (const b of bits.list)
        if (b.rest && !b.dusted) {
          b.dusted = true;
          for (let i = 0; i < 2; i++) ps.spawn(P.DUST, b.x + R.range(-1.5, 1.5), -0.5, R.sign() * R.range(8, 30), -R.range(2, 12), R.range(0.3, 0.6), st.dust, R.range(1.3, 2.4));
        }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      const q = t - HIT;
      if (q >= 0) {
        // the floor under the blade: white hot, cooling through the ramp to soot
        const fade = 1 - smooth(1.0, 1.5, q);
        for (let y = 0; y <= 2; y++)
          for (let x = -9; x <= 9; x++) {
            const d = Math.hypot((x + 0.5) / 9, (y + 0.5) / 3.5);
            if (d > 1) continue;
            const T = Math.pow(clamp(1 - q / 0.8), 1.4) * (1.2 - d) - rand(x, y, 3) * 0.3;
            if (T > 0.08) p.dot(X + x, y, C[clamp(Math.round(T * 9), 1, 7)], fade);
            else p.dot(X + x, y, d < 0.5 ? st.dark : st.shade, (d < 0.9 - rand(x, y, 9) * 0.3 ? 1 : 1 - d) * fade);
          }
        // the shock runs out along the floor: the far half behind the fighter
        const k = q / 0.45;
        if (k < 1) band(p, X, 0.5, 6 + 46 * ease.outCubic(k), 0.16, Math.max(1, 3 * (1 - k)), 1.15 - k, [st.body, st.light, C[4], C[6]], (g) => Math.sin(g) < 0);
      }
      ps.draw(p, "back");
    },
    draw(p) {
      const q = t - HIT;
      // the glint over the head: the raised blade catching the light
      if (t < RAISE + 0.03) {
        const g = ease.outBack(clamp(t / 0.1)) * (1 + 0.15 * Math.sin(t * 60)) * (t > RAISE ? 1 - (t - RAISE) / 0.03 : 1);
        sparkle(p, GLINT[0], GLINT[1], 1 + 7 * g, C[6], C[4], 0.5);
        p.glow(GLINT[0], GLINT[1], 22, C[4], 0.3 * g);
      }
      if (q >= 0) {
        // cracks race out from the cut and split down into the floor: white hot, cooling down the ramp to dark
        const heat = Math.pow(clamp(1 - q / 1.2), 1.2), fade = 1 - smooth(1.15, 1.5, q);
        for (const c of lines) {
          const reach = 40 * ease.outCubic(clamp((q - c.at * 0.1) / 0.13)) * (c.fork ? 0.3 : 1);
          if (reach <= 0) continue;
          along(c.pts, reach, (x0, y0, x1, y1, d) => {
            const h = heat * (1 - d / 46) - (c.fork ? 0.12 : 0), col = h > 0.72 ? WHITE : h > 0.08 ? C[clamp(Math.round(h * 8), 1, 6)] : st.dark;
            if (y1 > 0.5) p.line(x0 + 1, y0, x1 + 1, y1, st.dark, fade);
            p.line(x0, y0, x1, y1, col, fade);
            if (h > 0.25 && (d | 0) % 6 < 2) p.glow(x1, y1, 6, C[4], 0.2 * h * fade);
          });
        }
        if (heat > 0) p.glow(X, -2, 34, C[4], 0.32 * heat * fade);
        // the near half of the shock ring
        const k = q / 0.45;
        if (k < 1) band(p, X, 0.5, 6 + 46 * ease.outCubic(k), 0.16, Math.max(1, 3 * (1 - k)), 1.15 - k, [st.body, st.light, C[4], C[6]], (g) => Math.sin(g) >= 0);
      }
      // the arc and its echo, then a dotted trace of embers where it has been
      arc(p, E, WE, 0.02, false);
      arc(p, A, W, 0, true);
      const tail = U1 * smooth(HIT + HOLD, HIT + HOLD + TRAIL, t), th = 0.8 * (1 - clamp((t - HIT - HOLD) / (TRAIL + 0.25)));
      if (tail > 0.02 && th > 0) trace(p, A, A.R - 0.5, 0, tail, C[3], (u) => th * (0.4 + 0.6 * u / U1));
      if (t > RAISE && t < HIT + 0.05) {
        const [x, y] = onSwing(A, A.R - 5, U1 * head(t));
        p.glow(x, y, 40, C[4], 0.5);
      }
      // the white slam: an impact star flat on the floor, then slivers flying off and a hot pool
      if (q >= 0 && q < 0.035) star(p, X, -1, spikes, 1, 1, WHITE, C[6], C[7], C[5]);
      else if (q >= 0.035 && q < 0.07) star(p, X, -1, spikes, 1.25, 0.55, C[7], C[6], C[6], C[4]);
      if (q >= 0.05 && q < 0.16) {
        const k = (q - 0.05) / 0.11;
        for (const s of shards) sliver(p, X, -1, s.a, s.r + s.v * (q - 0.05), s.arc * (1 - 0.4 * k), k < 0.4 ? C[6] : k < 0.7 ? C[5] : C[4], 1 - k);
      }
      if (q >= 0 && q < 0.2) {
        const pop = Math.exp(-q / 0.05);
        p.glow(X, -6, 30, C[5], 0.8 * pop);
        p.glow(X, -2, 10, WHITE, 0.7 * pop);
      }
      for (const b of bits.list) rock(p, b, st);
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}

};
/* ../pixelfx_src/src/fx/impacts/crit-hit.js */
__defs[31] = function (__exports) {
__get(__exports, "create", () => create);
__get(__exports, "meta", () => meta);
// The star, its key frames and the spark spray are adapted from Sprite Fusion's open-source impact
// (https://www.spritefusion.com/pixel-art-vfx/impact), MIT License, Copyright (c) 2026 Hugo Duprez.
const { Particles, Bits, Lights, P, B, Rng, fit, clamp, smooth, ease, TAU, WHITE } = __req(2);
const { spikes, star, brokenRing } = __req(25);

const meta = {
  name: "Critical hit",
  desc: "A critical hit: a jagged starburst slams in white and overshoots, a ring breaks into flying arcs, sparks streak off, shards tumble to the floor under a big flare.",
  tags: ["impact", "hit", "crit", "critical", "combat", "directional", "one-shot"],
  size: [216, 136],
  origin: [84, 106],
  duration: 0.9,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#2a0510", "#5c0a1c", "#a3142a", "#e0302c", "#ff7a2a", "#ffc23d", "#fff09a", "#ffffff"], height: 26, aim: 0.12, seed: 3 },
};

// the star's key frames: [from t, scale, thickness, alpha, colors (rim, body, inner, core) as steps of the ramp]
const KEYS = [
  [0, 1, 1, 1, [6, 7, 7, 7]],
  [0.025, 1.3, 1, 1, [2, 5, 6, 7]],
  [0.058, 1.05, 0.72, 1, [2, 4, 5, 6]],
  [0.092, 1.22, 0.3, 1, [1, 2, 3, 4]],
  [0.125],
];

// a lens flare: a long level streak, thick and white at the heart, a shorter upright one, on a bed of light
function flare(p, x, y, L, k, C) {
  for (const [dx, dy, len] of [[1, 0, L], [0, 1, L * 0.45], [0.7, 0.7, L * 0.16], [0.7, -0.7, L * 0.16]])
    for (const s of [-1, 1])
      for (let d = 1; d <= len; d++) {
        const u = d / len, a = u < 0.7 ? 1 : k * (1.6 - u);
        p.dot(x + s * dx * d, y + s * dy * d, u < 0.35 ? WHITE : u < 0.7 ? C[6] : C[5], a);
        if (dy === 0 && u < 0.42) for (const e of [-1, 1]) p.dot(x + s * d, y + e, u < 0.2 ? C[6] : C[5], u < 0.3 ? 1 : k);
      }
  p.glowLine(x - L, y, x + L, y, 6, C[6], 0.5 * k);
  p.glowLine(x, y - L * 0.45, x, y + L * 0.45, 4, C[6], 0.3 * k);
}

function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), X = 0, Y = -o.height, A = o.aim, floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[7], C[6], C[5], C[3]] });
  const bits = new Bits({ ground: floor }), lights = new Lights();
  const sp = spikes(R, 14, A, { len: [11, 15], w: [1.8, 2.5], fwd: 1.4, back: 0.6, jag: 0.5 });
  [...sp].sort((a, b) => b.len - a.len).slice(0, 2).forEach((s) => (s.len *= 1.3));
  const segs = Array.from({ length: 7 }, (_, i) => {
    const a = A + (i / 7) * TAU;
    return { a, gap: R.range(0.55, 0.85), dr: R.range(0.08, 0.4) + 0.15 * Math.max(0, Math.cos(a - A)), w: 0.7 + 0.5 * Math.max(0, Math.cos(a - A)) };
  });

  lights.add(X, Y, 84, C[5], 0.6, 0.5);
  lights.add(X, Y, 30, WHITE, 0.7, 0.1);
  lights.add(X, -4, 44, C[4], 0.3, 0.45);
  // sparks: most sprayed on along the blow, a few kicked back
  for (let i = 0; i < 36; i++) {
    const back = R.chance(0.22), a = (back ? A + Math.PI : A) + R.range(-1, 1) * (back ? 0.6 : 0.8), v = R.range(170, 430) * (back ? 0.6 : 1);
    ps.spawn(P.SPARK, X, Y, Math.cos(a) * v, Math.sin(a) * v - 50, R.range(0.15, 0.5), WHITE, 1, R.chance(0.3) ? R.range(0, 0.04) : 0);
  }
  // shards: bright splinters that tumble down, bounce and settle
  for (let i = 0; i < 10; i++) {
    const a = A + R.range(-1, 1) * 1.1 - 0.35, v = R.range(110, 280);
    bits.add({ kind: B.SHARD, x: X, y: Y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 0.8, drag: 0.7, bounce: 0.35, life: R.range(0.55, 0.85), a: R.range(0, TAU), va: R.range(-25, 25), s: R.range(2, 4.5), c: R.pick([C[7], C[6], C[6], C[5]]) });
  }
  // embers of light drifting up and off, and glints that pop round the ring after the hit
  for (let i = 0; i < 12; i++) {
    const a = A - Math.PI / 2 + R.range(-1.4, 1.4), v = R.range(35, 110);
    ps.spawn(P.MOTE, X + Math.cos(a) * 4, Y + Math.sin(a) * 4, Math.cos(a) * v, Math.sin(a) * v - 15, R.range(0.35, 0.7), R.pick([C[6], C[5], C[5]]), 0.6, R.range(0, 0.05));
  }
  for (let i = 0; i < 5; i++) {
    const a = R.range(0, TAU), d = R.range(14, 34);
    ps.spawn(P.STAR, X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.8, 0, -4, R.range(0.22, 0.38), R.chance(0.5) ? C[6] : WHITE, R.range(1.6, 3), R.range(0.08, 0.32));
  }

  let t = 0;
  return {
    update(dt) {
      t += dt;
      ps.update(dt);
      bits.update(dt);
      lights.update(dt);
    },
    draw(p) {
      // the ring: it swells off the star, then breaks into arcs that fly on and cool
      const u = clamp((t - 0.03) / 0.37);
      if (t >= 0.03 && u < 1) {
        const r = 10 + 30 * ease.outCubic(u), brk = smooth(0.12, 0.6, u), th = Math.max(1, 3.6 * Math.pow(1 - u, 1.2));
        const i = u < 0.12 ? 7 : u < 0.3 ? 6 : u < 0.5 ? 5 : u < 0.75 ? 4 : 3;
        brokenRing(p, X, Y, r, th, segs, brk, C[i], C[Math.max(2, i - 2)], u < 0.6 ? 1 : (1 - u) / 0.4, 1, 0);
        if (u < 0.6) p.glowRing(X, Y, r, 6, C[5], 0.35 * Math.pow(1 - u / 0.6, 2));
      }
      bits.draw(p);
      ps.draw(p);
      // the flare blooms as the star collapses
      const f = (t - 0.04) / 0.28;
      if (f > 0 && f < 1) {
        flare(p, X, Y, 64 * Math.pow(1 - f, 1.3), 1 - f, C);
        p.glow(X, Y, 56, C[5], 0.4 * (1 - f));
      }
      // the starburst slams in: a white frame, an overshoot, a settle, then it breaks up
      for (let i = 0; i < KEYS.length - 1; i++)
        if (t >= KEYS[i][0] && t < KEYS[i + 1][0]) {
          const [, sc, th, a, cols] = KEYS[i];
          star(p, X, Y, sp, sc, th, cols.map((j) => C[j]), a, 2.6);
        }
      const pop = Math.exp(-t / 0.05);
      if (pop > 0.02) {
        p.glow(X, Y, 44, C[5], 0.4 * pop);
        p.glow(X, Y, 12, WHITE, 0.6 * pop);
      }
      lights.draw(p);
    },
  };
}

};
/* ../pixelfx_src/src/fx/fire/flame-pillar.js */
__defs[32] = function (__exports) {
__get(__exports, "create", () => create);
__get(__exports, "meta", () => meta);
// The flame-puff, smoke, spark, debris and floor-ring recipe is adapted from Sprite Fusion's open-source explosion
// (https://www.spritefusion.com/pixel-art-vfx/explosion), and the column's levels, pulses and strands from its
// holy light (https://www.spritefusion.com/pixel-art-vfx/holy-light), MIT License, Copyright (c) 2026 Hugo Duprez.
const { Particles, Bits, Lights, P, PF, B, Rng, fit, band, clamp, smooth, ease, noise, rand, TAU, WHITE, hex, mix, scale, rgb } = __req(2);
const { hotFirst, flameTongue, simDraw, floorLight, LAYERS } = __req(17);

const meta = {
  name: "Flame pillar",
  desc: "The floor cracks and glows, a column of fire erupts white-hot and roars, spewing embers and shedding flame, then collapses into rolling smoke.",
  tags: ["fire", "pillar", "eruption", "spell", "ground", "one-shot"],
  size: [184, 256],
  origin: [92, 232],
  duration: 5,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"],
    stone: "#4a3f69",
    height: 140,
    seed: 5,
  },
};

const ERUPT = 0.55, RISE = 0.12, FALL = 1.95, GONE = 2.45, SOOT = hex("#0d0a12"), OUTLINE = hex("#1a1422"), WARM = rgb(255, 176, 96);

function stone(c) {
  c = hex(c);
  return { light: mix(scale(c, 1.35), WHITE, 0.08), body: c, shade: scale(c, 0.64), dust: mix(scale(c, 1.2), rgb(150, 140, 150), 0.3) };
}
function rock(p, b, st) {
  const r = 0.6 + b.s * 0.75, fade = Math.min(1, b.life / 0.5), lx = Math.cos(b.a) * r * 0.4, ly = Math.sin(b.a) * r * 0.4;
  p.shade(b.x - r - 1, b.y - r - 1, b.x + r + 1, b.y + r + 1, (x, y, out) => {
    const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx * 1.15, dy);
    if (d > r + 0.9) return;
    const lit = dx * lx + dy * ly;
    out.c = d > r ? OUTLINE : lit < -0.4 ? st.light : lit > 0.6 ? st.shade : st.body;
    out.a = fade;
  });
}

function create(o) {
  const F = fit(o.palette, 9), H = hotFirst(F), HMAX = o.height, st = stone(o.stone), R = new Rng(o.seed), floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [H[1], H[2], H[4], H[5]] });
  const bits = new Bits({ ground: floor }), lights = new Lights();
  const GLOW = mix(mix(H[3], H[4], 0.5), WHITE, 0.25), S = o.seed * 13;
  // the cracks: jagged lines racing out from the middle across the floor (squashed for perspective), with branches
  const cracks = [];
  const crack = (x, y, a, len, t0, w) => {
    const pts = [[x, y]];
    for (let d = 0; d < len; d += 2) (a += R.range(-0.55, 0.55)), (x += Math.cos(a) * 2), (y += Math.sin(a) * 0.76), pts.push([x, y]);
    cracks.push({ pts, t0, grow: R.range(0.22, 0.36), w });
    return pts;
  };
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + R.range(-0.25, 0.25), pts = crack(R.range(-1, 1), R.range(-0.3, 0.3), a, R.range(20, 40), R.range(0, 0.16), 1);
    const j = 3 + R.int(0, pts.length - 6);
    if (pts.length > 8) crack(pts[j][0], pts[j][1], a + R.sign() * R.range(0.5, 1), R.range(6, 14), 0.18 + R.range(0, 0.15), 0);
  }
  // strands of hotter flame running up the column
  const strands = Array.from({ length: 7 }, (_, i) => ({ o: (rand(i, S, 1) - 0.5) * 1.4, w: 0.05 + rand(i, S, 2) * 0.06, f: 1 + rand(i, S, 3) * 2 }));
  let t = 0, erupted = false, fell = false;

  const height = (tt) => (tt < ERUPT ? 0 : tt < ERUPT + RISE ? HMAX * ease.outCubic((tt - ERUPT) / RISE) : tt < FALL ? HMAX * (1 + 0.05 * noise(tt * 3, S)) : HMAX * (1 - ease.inQuad(clamp((tt - FALL) / (GONE - FALL)))));
  const width = (tt) => (tt < ERUPT ? 0 : tt < FALL ? 12 * (1 + 0.45 * Math.exp(-(tt - ERUPT) * 7)) * (0.94 + 0.06 * noise(tt * 9, S + 1)) : 12 * (1 - smooth(FALL, GONE, tt)) + 1.5 * (1 - smooth(GONE - 0.1, GONE, tt)));
  const heat = (tt) => smooth(0, ERUPT, tt) * 0.75 + 0.25 * smooth(ERUPT - 0.05, ERUPT + 0.1, tt) - smooth(GONE - 0.3, meta.duration - 0.6, tt) * 1.05;

  function column(p) {
    const h = height(t), w0 = width(t);
    if (h < 1 || w0 < 0.3) return;
    // a crown of tongues where the column breaks into the air, drawn first so the column flows up into them
    if (t < FALL + 0.25) {
      const k = clamp(w0 / 12), NZ = (rate, seed, off) => noise(t * rate + off, seed);
      for (let i = 0; i < 5; i++) {
        const n = (S + i) * 17, dx = (i - 2) * w0 * 0.4, th = (12 + 12 * (0.5 + 0.5 * noise(t * 3.3 + i, n))) * k * (i === 2 ? 1.2 : i % 4 === 0 ? 0.6 : 0.9);
        flameTongue(p, dx + noise(t * 2, n + 2) * 1.5, -h + 12, th, 3.4 * k * (i % 4 === 0 ? 0.7 : 1), -dx * 0.3 + noise(t * 2.2, n + 1) * 3, NZ, n, H, LAYERS);
      }
    }
    const lvlC = [H[0], H[1], H[2], H[3], H[4], H[5], H[6], H[7]];
    for (let y = 0; y >= -h; y--) {
      const v = -y / h, cx = noise(-y * 0.04 + t * 1.6, S + 2) * 1.6 * v;
      // licks bulge out of the sides and run up them; a wider splash at the foot; the top thins into tongues
      const foot = 1 + 0.7 * Math.max(0, 1 - -y / 12) ** 2, top = 1 - smooth(0.82, 1, v) * 0.7;
      const wl = w0 * foot * top * (1 + 0.65 * Math.max(0, noise(y * 0.2 + t * 8, S + 3)) ** 1.5), wr = w0 * foot * top * (1 + 0.65 * Math.max(0, noise(y * 0.2 + t * 8, S + 4)) ** 1.5);
      const pulse = ((-y * 0.032 + t * 3.6) % 1) < 0.09 ? 1 : 0;
      for (let x = Math.floor(cx - wl * 1.15); x <= Math.ceil(cx + wr * 1.15); x++) {
        const dx = x + 0.5 - cx, q = Math.abs(dx) / (dx < 0 ? wl : wr);
        if (q > 1.15) continue;
        let lvl = q < 0.12 ? 0 : q < 0.26 ? 1 : q < 0.42 ? 2 : q < 0.56 ? 3 : q < 0.7 ? 4 : q < 0.84 ? 5 : q < 0.96 ? 6 : 7;
        for (const s of strands) if (Math.abs(dx / w0 - s.o - 0.06 * Math.sin(t * s.f * 3 + s.o * 9)) < s.w) lvl = Math.max(0, lvl - 1);
        lvl = Math.max(0, lvl - pulse);
        if (lvl === 7 && rand(x, y, Math.floor(t * 20)) < 0.5) continue;
        p.px(x, y, lvlC[lvl]);
      }
      if (y % 12 === 0) p.glow(cx, y, w0 * 2.4 + 8, GLOW, 0.28 * clamp(w0 / 12));
    }
    p.glow(0, -h * 0.45, 92, GLOW, 0.3 * clamp(w0 / 12));
  }

  function cracksDraw(p) {
    const k = heat(t);
    if (k <= -0.05) return;
    for (const c of cracks) {
      const n = Math.floor(c.pts.length * clamp((t - c.t0) / c.grow));
      for (let i = 1; i < n; i++) {
        const u = i / c.pts.length, hot = k * (1 - 0.45 * u), [x0, y0] = c.pts[i - 1], [x1, y1] = c.pts[i];
        if (hot < 0) {
          // cooled: soot that fades away
          const a = 1 + hot * 3;
          if (a > 0) p.line(x0, y0, x1, y1, SOOT, a);
          continue;
        }
        const col = hot > 0.85 ? H[1] : hot > 0.65 ? H[2] : hot > 0.45 ? H[4] : hot > 0.25 ? H[5] : hot > 0.1 ? H[6] : H[7];
        // the crack: a hot seam with a darker glowing lip, wider near the middle
        if (c.w && i < c.pts.length * 0.5 && hot > 0.2) p.line(x0, y0 + 1, x1, y1 + 1, hot > 0.6 ? H[5] : H[6]), p.line(x0, y0 - 1, x1, y1 - 1, H[7]);
        p.line(x0, y0, x1, y1, col);
        if (i % 2 === 0) p.glow(x1, y1, 5 + 7 * hot, GLOW, 0.3 * hot);
      }
    }
    // the floor glows from beneath while it's hot
    if (k > 0) floorLight(p, 0, 0.5, 44, 8, GLOW, 0.35 * k);
  }

  return {
    update(dt) {
      t += dt;
      // the charge: the crust in the middle glows, little flames lick out of it, heat leaks up the cracks
      if (t < ERUPT && R.chance(0.6 * dt * 60 * smooth(0.15, ERUPT, t))) ps.spawn(P.FIRE, R.range(-5, 5), -1, R.range(-6, 6), -R.range(20, 45), R.range(0.15, 0.3), 0, R.range(1, 2.2));
      if (t < ERUPT && R.chance(0.5 * dt * 60 * smooth(0, ERUPT, t))) {
        const c = R.pick(cracks), i = R.int(0, Math.floor(c.pts.length * clamp((t - c.t0) / c.grow)) - 1);
        if (i >= 0) {
          const [x, y] = c.pts[i];
          if (R.chance(0.5)) ps.spawn(P.FIRE, x, y - 1, R.range(-5, 5), -R.range(15, 35), R.range(0.15, 0.3), 0, R.range(0.8, 1.6));
          else ps.spawn(P.EMBER, x, y - 1, R.range(-15, 15), -R.range(30, 70), R.range(0.5, 1), H[3], 1);
        }
      }
      if (!erupted && t >= ERUPT) {
        erupted = true;
        lights.add(0, -40, 90, WARM, 0.7, 0.6);
        lights.add(0, -8, 44, WHITE, 0.7, 0.1);
        for (let i = 0; i < 70; i++) {
          const a = -Math.PI / 2 + R.range(-1.1, 1.1), sp = R.range(100, 260);
          ps.spawn(P.SPARK, R.range(-4, 4), -2, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.25, 0.7));
        }
        for (let i = 0; i < 18; i++) bits.add({ kind: B.CHUNK, x: R.range(-6, 6), y: -2, vx: R.range(-110, 110), vy: -R.range(150, 330), g: 1, drag: 0.4, bounce: 0.3, life: R.range(1.6, 2.4), a: R.range(0, TAU), va: R.range(-16, 16), s: R.int(1, 3) });
        for (let i = 0; i < 60; i++) {
          const a = -Math.PI / 2 + R.range(-0.9, 0.9), sp = R.range(80, 260);
          ps.spawn(P.GRIT, R.range(-5, 5), -1, Math.cos(a) * sp, Math.sin(a) * sp, R.range(1, 1.8), R.pick([st.light, st.body, st.body, st.shade]), R.chance(0.4) ? 2 : 1);
        }
        for (let i = 0; i < 14; i++) {
          const s = R.sign();
          ps.spawn(P.SMOKE, s * R.range(2, 10), -R.range(1, 4), s * R.range(40, 110), -R.range(2, 10), R.range(1, 1.8), st.dust, R.range(4, 7), R.range(0, 0.06), PF.BIG);
        }
      }
      // the roar: flame shed off the sides, a billowing cap, embers spewed high
      const h = height(t), w = width(t);
      if (t > ERUPT && t < GONE && h > 4) {
        if (R.chance(0.9 * dt * 60)) {
          const s = R.sign(), y = -R.range(4, h * 0.9);
          ps.spawn(P.FIRE, s * w * R.range(0.7, 1.1), y, s * R.range(15, 40), -R.range(30, 70), R.range(0.25, 0.5), 0, R.range(1.6, 3.2), 0, R.chance(0.35) ? PF.SMOKES : 0);
        }
        if (R.chance(0.7 * dt * 60)) ps.spawn(P.FIRE, R.range(-w, w), -h + R.range(0, 6), R.range(-20, 20), -R.range(30, 80), R.range(0.35, 0.7), 0, R.range(3, 5.5), 0, R.chance(0.6) ? PF.SMOKES | (t < FALL - 0.3 ? PF.BIG : 0) : 0);
        if (t < FALL && R.chance(0.5 * dt * 60)) ps.spawn(P.EMBER, R.range(-w, w) * 0.6, -h + 4, R.range(-60, 60), -R.range(50, 110), R.range(0.7, 1.3), H[3], R.chance(0.2) ? 2 : 1);
      }
      // the collapse: the falling top breaks into puffs that roll off as smoke
      if (t >= FALL && !fell) fell = true;
      if (fell && t < GONE - 0.1 && R.chance(1.6 * dt * 60)) ps.spawn(P.FIRE, R.range(-w - 2, w + 2), -h - R.range(0, 8), R.range(-30, 30), -R.range(10, 50), R.range(0.4, 0.75), 0, R.range(3.5, 6.5), 0, PF.SMOKES);
      bits.update(dt);
      for (const b of bits.list)
        if (b.rest && !b.dusted) {
          b.dusted = true;
          for (let i = 0; i < 3; i++) ps.spawn(P.DUST, b.x + R.range(-1.5, 1.5), -0.5, R.sign() * R.range(8, 35), -R.range(2, 18), R.range(0.3, 0.6), st.dust, R.range(1.3, 2.6));
        }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      cracksDraw(p);
      simDraw(p, ps, H, "back");
      const k = (t - ERUPT) / 0.45;
      if (k > 0 && k < 1) band(p, 0, 0.5, 84 * ease.outCubic(k), 0.18, Math.max(1, 4 * (1 - k)), 1.15 - k, [st.body, st.light, H[4], H[1]], (g) => Math.sin(g) < 0);
    },
    draw(p) {
      column(p);
      for (const b of bits.list) rock(p, b, st);
      simDraw(p, ps, H, "front");
      const k = (t - ERUPT) / 0.45;
      if (k > 0 && k < 1) band(p, 0, 0.5, 84 * ease.outCubic(k), 0.18, Math.max(1, 4 * (1 - k)), 1.15 - k, [st.body, st.light, H[4], H[1]], (g) => Math.sin(g) >= 0, k < 0.15);
      // the eruption's white flash at the foot
      const f = (t - ERUPT) / 0.08;
      if (f > 0 && f < 1) {
        p.ellipse(0, -2, 16 * (1 - f * 0.3), 6, H[2]);
        p.ellipse(0, -3, 11 * (1 - f * 0.3), 4, f < 0.5 ? WHITE : H[1]);
      }
      lights.draw(p);
    },
  };
}

};
/* ../pixelfx_src/src/fx/fire/fire-ring.js */
__defs[33] = function (__exports) {
__get(__exports, "create", () => create);
__get(__exports, "meta", () => meta);
__get(__exports, "act", () => act);
// The flame-puff, smoke and spark recipe and the floor ring are adapted from Sprite Fusion's open-source explosion
// (https://www.spritefusion.com/pixel-art-vfx/explosion), and the tongue from its fire
// (https://www.spritefusion.com/pixel-art-vfx/fire), MIT License, Copyright (c) 2026 Hugo Duprez.
const { Particles, Lights, P, PF, Rng, fit, band, clamp, smooth, ease, noise, rand, TAU, WHITE, hex, mix, rgb, READY } = __req(2);
const { hotFirst, flameTongue, simDraw, LAYERS, BACK_LAYERS } = __req(17);

const meta = {
  name: "Fire ring",
  desc: "A white flash at the feet, then flames race outward along the floor in a ring, flaring as the front passes and burning down behind it over a smouldering scorch.",
  tags: ["fire", "ring", "nova", "aoe", "spell", "ground", "one-shot"],
  size: [224, 128],
  origin: [112, 92],
  duration: 3.9,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"],
    reach: 92,
    seed: 6,
  },
};

const HIGH = { turn: 1.15, crouch: 0, fx: -7, fy: -44, bx: 8, by: -44, ffx: -5, fbx: 6 };
const SLAM = { turn: 1.15, crouch: 8, lean: 3, fx: -9, fy: -8, bx: 11, by: -8, ffx: -8, fbx: 9 };
const EASE = { turn: 1, crouch: 2, fx: -8, fy: -17, bx: 9, by: -17, ffx: -4, fbx: 5 };
const act = {
  target: { x: 70 },
  poses: [
    [-0.32, READY],
    [0.02, HIGH],
    [0.27, { ...HIGH, y: -1 }],
    [0.32, SLAM, "snap"],
    [0.85, { ...SLAM, crouch: 7 }],
    [1.5, EASE],
    [2.4, READY],
    [3.9, READY],
  ],
  hits: [
    { t: 0.32, stop: 0.1, shake: 0.28, amp: 3, target: false },
    { t: 0.6, push: 1.2, straw: 10, y: -8, skin: "char" },
    { t: 3.5, push: 0, straw: 0, flash: 0, skin: null },
  ],
  dust: [{ t: 0.32, x: 10, n: 6, dir: 1 }, { t: 0.32, x: -10, n: 6, dir: -1 }],
};

const SY = 0.2, CHARGE = 0.32, SPREAD = 0.75, SOOT = hex("#0d0a12"), SOOT2 = hex("#17121d"), WARM = rgb(255, 176, 96);
// the dying flames: deep orange and red, no white heart
const EMBER_LAYERS = [[1, 1, 7], [0.7, 0.8, 6], [0.4, 0.55, 5]];

function create(o) {
  const F = fit(o.palette, 9), H = hotFirst(F), REACH = o.reach, R = new Rng(o.seed), floor = () => 0, S = o.seed * 7;
  const ps = new Particles({ rng: R, ground: floor, sparks: [H[1], H[2], H[4], H[5]] }), lights = new Lights();
  const GLOW = mix(mix(H[3], H[4], 0.5), WHITE, 0.25);
  const front = (t) => REACH * ease.outCubic(clamp((t - CHARGE) / SPREAD));
  const reachedAt = (d) => CHARGE + SPREAD * (1 - Math.cbrt(1 - Math.min(1, d / REACH)));
  // the flames: rings of tongues on the floor, each lit as the front reaches it, flaring then burning down
  const sites = [];
  for (let r = 10; r <= REACH; r += 9) {
    const per = TAU * Math.sqrt((r * r + (r * SY) ** 2) / 2), n = Math.max(5, Math.round(per / 8.5));
    for (let k = 0; k < n; k++) {
      const a = ((k + R.range(0.15, 0.85)) / n) * TAU, rr = r + R.range(-3, 3), q = Math.min(1, rr / REACH);
      // near the middle they flash and go out as the front passes; the rim, where it stops, burns on and down
      sites.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr * SY, back: Math.sin(a) < 0, t0: reachedAt(rr) + R.range(0, 0.04), life: (0.3 + 1.0 * q * q) * R.range(0.85, 1.2), h: R.range(9, 15) * (0.6 + 0.55 * q), w: R.range(1.8, 2.7) * (0.75 + 0.3 * q), n: R.int(0, 1e5) });
    }
  }
  sites.sort((a, b) => a.y - b.y);
  let t = 0, burst = false;

  const flames = (p, back) => {
    const NZ = (rate, seed = 0, off = 0) => noise(t * rate + off, seed);
    for (const s of sites) {
      if (s.back !== back) continue;
      const age = t - s.t0;
      if (age < 0 || age > s.life) continue;
      const u = age / s.life, rise = ease.outBack(clamp(age / 0.08), 2), fade = 1 - Math.pow(Math.max(0, (u - 0.1) / 0.9), 1.3);
      const h = s.h * rise * fade * (0.85 + 0.15 * noise(t * 3.3, s.n)) * (1 + 0.5 * Math.max(0, noise(t * 2.6, s.n + 70) - 0.55));
      if (h < 1) continue;
      // fresh flames white-hot, then cooling as they burn down; the far ones a step dimmer
      const L = u < 0.3 ? (back ? BACK_LAYERS : LAYERS) : u < 0.65 ? BACK_LAYERS : EMBER_LAYERS;
      flameTongue(p, s.x, s.y, h, s.w * (0.6 + 0.4 * fade), NZ(2.2, s.n + 40) * 1.5 - s.x * 0.02, NZ, s.n, H, L);
    }
  };
  // the scorch: a translucent stain of soot where the fire has crossed, sparse embers cooling in it
  const scorch = (p) => {
    const fr = front(t), end = 1 - smooth(meta.duration - 1.2, meta.duration - 0.15, t);
    if (fr < 1 || end <= 0) return;
    for (let y = Math.floor(-fr * SY); y <= Math.ceil(fr * SY); y++)
      for (let x = Math.floor(-fr); x <= Math.ceil(fr); x++) {
        const d = Math.hypot(x + 0.5, (y + 0.5) / SY);
        if (d > fr) continue;
        const since = t - reachedAt(d), h = rand(x, y, S), hot = 1 - since / (1.2 + h * 0.9);
        if (hot > 0 && h < 0.03 + 0.06 * hot) {
          p.px(x, y, hot > 0.7 ? H[3] : hot > 0.45 ? H[4] : hot > 0.2 ? H[5] : H[6]);
          p.light(x, y, H[4], 0.3 * hot);
          continue;
        }
        p.blend(x, y, h < 0.5 ? SOOT : SOOT2, Math.min(1, since * 3) * (0.55 - (d / REACH) * 0.25) * end);
      }
  };
  const ring = (p, back) => {
    const k = (t - CHARGE) / (SPREAD + 0.1);
    if (k < 0 || k >= 1) return;
    band(p, 0, 0, front(t) + 1.5, SY, Math.max(1.5, 6 * (1 - k)), k < 0.75 ? 1 : (1 - k) / 0.25, [H[6], H[4], H[2], H[1]], (g) => Math.sin(g) < 0 === back, k < 0.12);
  };

  return {
    update(dt) {
      t += dt;
      // the charge: streaks of fire spiral in to the feet, heat building there
      if (t < CHARGE - 0.05 && R.chance(0.9 * dt * 60)) {
        const a = R.range(0, TAU), d = R.range(26, 54), T = R.range(0.18, 0.26), v = (d * 3) / (Math.exp(3 * T) - 1);
        const x = Math.cos(a) * d, y = Math.min(-2, -6 + Math.sin(a) * d * 0.45), l = Math.hypot(x, y + 4) || 1;
        ps.spawn(P.STREAK, x, y, (-x / l) * v, ((-4 - y) / l) * v, T, R.chance(0.5) ? H[2] : H[3]);
      }
      if (t < CHARGE && R.chance(0.5 * dt * 60 * (t / CHARGE))) ps.spawn(P.FIRE, R.range(-4, 4), -1, R.range(-8, 8), -R.range(20, 40), R.range(0.12, 0.24), 0, R.range(1, 2.2));
      if (!burst && t >= CHARGE) {
        burst = true;
        lights.add(0, -18, 64, WARM, 0.85, 0.5);
        lights.add(0, -6, 30, WHITE, 0.8, 0.08);
        for (let i = 0; i < 40; i++) {
          const a = R.range(0, TAU), sp = R.range(80, 220);
          ps.spawn(P.SPARK, Math.cos(a) * 3, -2, Math.cos(a) * sp, Math.sin(a) * sp * 0.4 - R.range(40, 120), R.range(0.2, 0.5));
        }
      }
      // fire shed off the burning ring: puffs that rise and some cool into smoke, and embers
      if (t > CHARGE && t < CHARGE + SPREAD + 1.2)
        for (let i = 0; i < 3; i++) {
          if (!R.chance(0.75 * dt * 60)) continue;
          const s = R.pick(sites), age = t - s.t0;
          if (age < 0 || age > s.life * 0.7) continue;
          ps.spawn(P.FIRE, s.x + R.range(-1, 1), s.y - s.h * 0.6, R.range(-5, 5), -R.range(20, 40), R.range(0.2, 0.4), 0, R.range(1.2, 2.4), 0, R.chance(0.5) ? PF.SMOKES | (s.back ? PF.BACK : 0) : s.back ? PF.BACK : 0);
          if (R.chance(0.12)) ps.spawn(P.EMBER, s.x, s.y - s.h * 0.5, R.range(-15, 15), -R.range(30, 70), R.range(0.6, 1.3), H[3], 1, 0, s.back ? PF.BACK : 0);
        }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      scorch(p);
      ring(p, true);
      flames(p, true);
      simDraw(p, ps, H, "back");
      // light on the floor running with the front
      const fr = front(t), k = t < CHARGE ? 0 : 1 - smooth(CHARGE + SPREAD, CHARGE + SPREAD + 1.4, t);
      if (k > 0) for (let i = 0; i < 16; i++) p.glow(Math.cos((i / 16) * TAU) * fr, Math.sin((i / 16) * TAU) * fr * SY - 3, 16, GLOW, 0.2 * k);
    },
    draw(p) {
      ring(p, false);
      flames(p, false);
      simDraw(p, ps, H, "front");
      // the charge glowing at the feet, then the white flash as it goes
      if (t < CHARGE) p.glow(0, -3, 8 + 22 * (t / CHARGE), GLOW, 0.6 * (t / CHARGE));
      if (t >= CHARGE && t < CHARGE + 0.1) {
        const k = 1 - (t - CHARGE) / 0.1;
        p.ellipse(0, -1, 14 * (0.6 + 0.4 * k), 4, H[2]);
        p.ellipse(0, -1, 9 * (0.6 + 0.4 * k), 2.6, k > 0.5 ? WHITE : H[1]);
      }
      const k = smooth(CHARGE - 0.05, CHARGE, t) * (1 - smooth(CHARGE + SPREAD * 0.5, CHARGE + SPREAD + 1.2, t));
      if (k > 0) p.glow(0, -6, 92, GLOW, 0.3 * k);
      lights.draw(p);
    },
  };
}

};
/* ../pixelfx_src/src/fx/ui/confetti.js */
__defs[34] = function (__exports) {
__get(__exports, "create", () => create);
__get(__exports, "meta", () => meta);
// The flutter (a swing that slows at its ends, a tilt that follows it, a paper flip that shows the back) adapts
// Sprite Fusion's open-source falling leaves (https://www.spritefusion.com/pixel-art-vfx/falling-leaves),
// MIT License, Copyright (c) 2026 Hugo Duprez.
const { Particles, Lights, P, Rng, fit, sparkle, clamp, seg, ease, TAU, WHITE, hex, scale, mix } = __req(2);

const meta = {
  name: "Confetti",
  desc: "Two party poppers bang one after the other: paper bits and curly streamers burst out, stall, then tumble and flutter down, flipping, and settle on the floor.",
  tags: ["ui", "celebration", "confetti", "party", "reward", "one-shot"],
  size: [200, 140],
  origin: [100, 126],
  duration: 3.4,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#ff4a5a", "#ff9a2a", "#ffe03c", "#5ad84a", "#3cc8ff", "#7a6cff", "#f53cd1"], seed: 11 },
};

const POPPERS = [
  { x: -74, y: -1, a: -Math.PI / 2 + 0.62, t: 0.1 },
  { x: 74, y: -1, a: -Math.PI / 2 - 0.62, t: 0.26 },
];
const INK = hex("#141019");

// a party popper: a striped cone pointing along a, kicked back k px when it fires
function popper(p, x, y, a, k, C, alpha) {
  const ca = Math.cos(a), sa = Math.sin(a), bx = x - ca * k, by = y - sa * k;
  p.shade(bx - 12, by - 12, bx + 12, by + 12, (px, py, o) => {
    const dx = px - bx, dy = py - by, u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
    // u along the cone (0 at its tip on the floor, 11 at its mouth), v across
    if (u < 0 || u > 11) return;
    const hw = 0.8 + u * 0.32;
    if (Math.abs(v) > hw + 0.6) return;
    o.a = alpha;
    if (Math.abs(v) > hw - 0.4 || u > 10.2 || u < 0.8) return INK;
    const stripe = Math.floor((u + v * 0.6) / 2.2) % 2 === 0;
    return stripe ? (v < 0 ? C[2] : scale(C[2], 0.75)) : v < 0 ? WHITE : hex("#c8c0d8");
  });
}

function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, ground: () => 0, sparks: ["#ffffff", "#fff3a6", "#ffc23d", "#ff8a2a"] }), lights = new Lights();
  const bits = [], ribbons = [], fired = [false, false], end = meta.duration - 0.05;
  const kick = (t, pp) => (t < pp.t ? 0 : 3 * Math.exp(-(t - pp.t) * 14));

  function fire(pp) {
    const mx = pp.x + Math.cos(pp.a) * 11, my = pp.y + Math.sin(pp.a) * 11;
    lights.add(mx, my, 34, WHITE, 0.6, 0.12);
    lights.add(mx, my, 50, C[2], 0.4, 0.4);
    for (let i = 0; i < 6; i++) ps.spawn(P.SMOKE, mx, my, Math.cos(pp.a) * R.range(20, 60) + R.range(-10, 10), Math.sin(pp.a) * R.range(20, 60), R.range(0.6, 1), hex("#5d5660"), R.range(2.5, 4));
    for (let i = 0; i < 12; i++) {
      const an = pp.a + R.range(-0.5, 0.5), sp = R.range(120, 260);
      ps.spawn(P.SPARK, mx, my, Math.cos(an) * sp, Math.sin(an) * sp, R.range(0.1, 0.25));
    }
    // paper: thrown hard up the cone, the air soon stalls it
    for (let i = 0; i < 46; i++) {
      const an = pp.a + R.range(-0.38, 0.38), sp = R.range(200, 380);
      bits.push({ x: mx, y: my, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, c: R.pick(C), w: R.range(2, 3), h: R.range(3, 4.6), ang: R.range(0, TAU), spin: R.range(-14, 14), flip: R.range(0, TAU), fs: R.range(5, 13), ph: R.range(0, TAU), amp: R.range(5, 12), fw: R.range(2, 3.4), x0: 0, mode: 0, rest: 0, fall: R.range(26, 40) });
    }
    // streamers: a head that flies like the paper, a tail that follows it and curls
    for (let i = 0; i < 4; i++) {
      const an = pp.a + R.range(-0.25, 0.25), sp = R.range(220, 330), n = 11;
      ribbons.push({ pts: Array.from({ length: n }, () => [mx, my]), vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, c: R.pick(C), ph: R.range(0, TAU), amp: R.range(6, 12), fw: R.range(1.5, 2.4), mode: 0, x0: 0, curl: R.range(0.7, 1.1), fall: R.range(22, 32) });
    }
  }

  let t = 0;
  return {
    update(dt) {
      t += dt;
      POPPERS.forEach((pp, i) => !fired[i] && t >= pp.t && ((fired[i] = true), fire(pp)));
      for (const b of bits) {
        if (b.mode === 2) {
          b.rest += dt;
          continue;
        }
        b.flip += b.fs * dt;
        if (b.mode === 0) {
          // the burst: heavy drag, a little gravity, tumbling fast; once slow it starts to flutter
          b.vx -= b.vx * 3.4 * dt;
          b.vy -= b.vy * 3.4 * dt - 140 * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.ang += b.spin * dt;
          if (Math.hypot(b.vx, b.vy) < 40) (b.mode = 1), (b.x0 = b.x - Math.sin(b.ph) * b.amp);
        } else {
          b.ph += b.fw * dt;
          b.x0 += b.vx * dt;
          b.vx -= b.vx * 2 * dt;
          b.x = b.x0 + Math.sin(b.ph) * b.amp;
          b.y += b.fall * (0.4 + 0.9 * Math.abs(Math.cos(b.ph))) * dt;
          b.ang = Math.cos(b.ph) * 0.9;
          if (b.y >= -1) (b.y = -0.5), (b.mode = 2), (b.ang = R.range(-0.3, 0.3)), (b.flip = 0);
        }
      }
      for (const r of ribbons) {
        const h = r.pts[0];
        if (r.mode === 0) {
          r.vx -= r.vx * 3 * dt;
          r.vy -= r.vy * 3 * dt - 120 * dt;
          h[0] += r.vx * dt;
          h[1] += r.vy * dt;
          if (Math.hypot(r.vx, r.vy) < 35) (r.mode = 1), (r.x0 = h[0] - Math.sin(r.ph) * r.amp);
        } else if (h[1] < -1) {
          r.ph += r.fw * dt;
          r.x0 += r.vx * dt;
          r.vx -= r.vx * 2 * dt;
          h[0] = r.x0 + Math.sin(r.ph) * r.amp;
          h[1] += r.fall * (0.5 + 0.7 * Math.abs(Math.cos(r.ph))) * dt;
        }
        // the tail follows the head link by link and hangs a little
        for (let i = 1; i < r.pts.length; i++) {
          const a = r.pts[i - 1], b = r.pts[i];
          b[1] = Math.min(-0.5, b[1] + 20 * dt);
          const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
          if (d > 2.6) (b[0] = a[0] + (dx / d) * 2.6), (b[1] = a[1] + (dy / d) * 2.6);
        }
      }
      ps.update(dt);
      lights.update(dt);
    },

    drawBack(p) {
      ps.draw(p, "back");
    },

    draw(p) {
      const fade = 1 - seg(t, end - 0.45, end - 0.05);
      for (const pp of POPPERS) {
        const k = kick(t, pp);
        popper(p, pp.x, pp.y, pp.a, k, C, 1 - seg(t, 2.5, 2.9));
        const ft = t - pp.t;
        if (ft > 0 && ft < 0.12) sparkle(p, pp.x + Math.cos(pp.a) * 13, pp.y + Math.sin(pp.a) * 13, 7 * (1 - ft / 0.12), WHITE, C[2], 0.7);
      }
      // streamers: a two-tone ribbon that curls along its length
      for (const r of ribbons) {
        const pts = r.pts.map(([x, y], i) => [x + Math.sin(i * r.curl + t * 9 + r.ph) * (i ? 1.6 : 0), y]);
        for (let i = 1; i < pts.length; i++) {
          const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], front = Math.sin(i * r.curl + t * 9 + r.ph) > 0;
          p.line(x0, y0, x1, y1, front ? r.c : scale(r.c, 0.6), fade);
          p.line(x0 + 1, y0, x1 + 1, y1, front ? mix(r.c, WHITE, 0.35) : scale(r.c, 0.45), fade);
        }
      }
      // paper bits: a little card turned by its tilt, its width by its flip; the back side shows darker
      for (const b of bits) {
        if (b.y > 1) continue;
        const fw = b.mode === 2 ? 1 : Math.cos(b.flip), w = Math.max(0.5, Math.abs(fw) * b.w), ca = Math.cos(b.ang), sa = Math.sin(b.ang);
        const c = fw >= 0 ? b.c : scale(b.c, 0.62), a = fade;
        if (b.mode === 2) {
          p.dot(b.x, b.y, scale(b.c, 0.8), a);
          p.dot(b.x + 1, b.y, scale(b.c, 0.6), a);
          continue;
        }
        p.shade(b.x - 4, b.y - 4, b.x + 4, b.y + 4, (x, y, out) => {
          const dx = x - b.x, dy = y - b.y, u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
          if (Math.abs(u) > w / 2 + 0.2 || Math.abs(v) > b.h / 2) return;
          out.a = a;
          return Math.abs(fw) > 0.92 && v < -b.h / 2 + 1 ? WHITE : c;
        });
        // it catches the light as it turns face-on
        if (Math.abs(fw) > 0.97) p.glow(b.x, b.y, 5, mix(b.c, WHITE, 0.5), 0.35 * fade);
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}

};
/* ../pixelfx_src/src/fx/explosions/firework-burst.js */
__defs[35] = function (__exports) {
__get(__exports, "create", () => create);
__get(__exports, "meta", () => meta);
// The flare, the twinkling crosses and the glitter are adapted from Sprite Fusion's open-source sparkle
// (https://www.spritefusion.com/pixel-art-vfx/sparkle), MIT License, Copyright (c) 2026 Hugo Duprez.
const { Particles, Lights, P, Rng, fit, sparkle, ease, TAU, WHITE, hex, mix } = __req(2);

const meta = {
  name: "Firework burst",
  desc: "A shell climbs, slows and bursts into a sphere of coloured trailing stars round a gold core; they droop, crackle into white pops and fade, leaving glitter.",
  tags: ["firework", "celebration", "sparkle", "sky", "burst", "one-shot"],
  size: [240, 248],
  origin: [120, 100],
  duration: 3.6,
  loop: false,
  fps: 30,
  bg: "sky",
  options: {
    palette: ["#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"],
    core: ["#4a2c08", "#86520c", "#c48412", "#f0b424", "#ffe066", "#fff6c4", "#ffffff"],
    seed: 9,
  },
};

const RISE = 0.42, Y0 = 72, DRAG = 2.6, G = 88, TRAIL = 0.34, TURN = 0.22;

function create(o) {
  const C = fit(o.palette, 7), K = fit(o.core, 7), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, sparks: [K[6], K[5], K[4], K[3]] }), lights = new Lights();
  const stars = [], pops = [];
  let t = 0, burst = false;

  // a shell of stars thrown over a sphere: seen side-on, the ones flying at us or away look slower
  // the outer stars burn gold for a beat, then turn to their color
  const shell = (n, speed, ramp, life, first) => {
    for (let i = 0; i < n; i++) {
      const z = R.range(-1, 1), a = R.range(0, TAU), s = Math.sqrt(1 - z * z), v = speed * R.range(0.93, 1.05);
      stars.push({ x: 0, y: 0, vx: Math.cos(a) * s * v, vy: Math.sin(a) * s * v, life: R.range(life[0], life[1]), age: 0, ramp, first, big: R.chance(0.2), pts: [], acc: R.next(), seed: R.range(0, 100) });
    }
  };

  return {
    update(dt) {
      t += dt;
      // the shell climbs, slowing, shedding a fizz of gold sparks
      if (t < RISE) {
        const y = Y0 * (1 - ease.outCubic(t / RISE));
        if (R.chance(50 * dt)) ps.spawn(P.SPARK, R.range(-0.5, 0.5), y + 2, R.range(-25, 25), R.range(20, 70), R.range(0.15, 0.35));
        if (R.chance(14 * dt)) ps.spawn(P.VAPOUR, R.range(-1, 1), y + 3, R.range(-3, 3), R.range(5, 15), R.range(0.5, 0.8), hex("#4a4458"), R.range(1.5, 2.5));
      }
      if (!burst && t >= RISE) {
        burst = true;
        lights.add(0, 0, 110, C[4], 0.6, 1.5);
        lights.add(0, 0, 30, WHITE, 0.5, 0.07);
        shell(66, 236, C, [1.35, 1.9], K);
        shell(26, 120, K, [1.0, 1.4], K);
        // the burst charge's smoke, drifting where the shell broke
        for (let i = 0; i < 7; i++) {
          const a = R.range(0, TAU), d = R.range(0, 8);
          ps.spawn(P.VAPOUR, Math.cos(a) * d, Math.sin(a) * d, Math.cos(a) * R.range(10, 30), Math.sin(a) * R.range(10, 30), R.range(2.2, 3), hex("#4a4458"), R.range(6, 11));
        }
        for (let i = 0; i < 24; i++) {
          const a = R.range(0, TAU), sp = R.range(40, 140);
          ps.spawn(P.SPARK, 0, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.15, 0.35));
        }
      }
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.age += dt;
        const k = s.age / s.life;
        if (k >= 1) {
          // the star crackles out in a few white pops
          for (let j = 0; j < 2 + (s.big ? 1 : 0); j++) pops.push({ x: s.x + R.range(-3, 3), y: s.y + R.range(-3, 3), t0: t + R.range(0, 0.18), life: R.range(0.06, 0.12), c: R.chance(0.6) ? WHITE : s.ramp[5] });
          stars.splice(i, 1);
          continue;
        }
        s.vx -= s.vx * DRAG * dt;
        s.vy -= s.vy * DRAG * dt - G * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.pts.push(s.x, s.y, t);
        while (s.pts.length > 3 && t - s.pts[2] > TRAIL) s.pts.splice(0, 3);
        // glitter shed along the way: specks that hang, twinkle and fall
        for (s.acc += dt * (k < 0.25 ? 4 : 11); s.acc > 1; s.acc--) ps.spawn(P.STAR, s.x, s.y, s.vx * 0.15 + R.range(-6, 6), s.vy * 0.15 + R.range(0, 10), R.range(0.35, 0.8), R.chance(0.5) ? K[5] : WHITE, R.chance(0.15) ? R.range(1, 1.6) : 0.5);
      }
      for (let i = pops.length - 1; i >= 0; i--) if (t > pops[i].t0 + pops[i].life) pops.splice(i, 1);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p) {
      if (t < RISE) {
        // the shell: a hot dot with a short tail
        const u = t / RISE, y = Y0 * (1 - ease.outCubic(u));
        p.line(0, y, 0, y + 3 + 6 * (1 - u), (q) => (q < 0.3 ? K[5] : K[3]));
        p.px(0, y, WHITE);
        p.glow(0, y, 7, K[4], 0.5);
      }
      for (const s of stars) {
        const k = s.age / s.life, P2 = s.pts, n = P2.length / 3;
        // the trail: a 1 px line from the head back along where it has been, cooling and dithering out; the part
        // laid while the star burned gold stays gold
        for (let j = n - 1; j > 0; j--) {
          const u = (t - P2[j * 3 + 2]) / TRAIL;
          if (u >= 1) break;
          const ramp = s.age - (t - P2[j * 3 + 2]) < TURN ? s.first : s.ramp;
          const c = u < 0.3 ? ramp[5] : u < 0.6 ? ramp[4] : ramp[3];
          p.line(P2[j * 3], P2[j * 3 + 1], P2[j * 3 - 3], P2[j * 3 - 2], c, Math.pow(1 - u, 0.8) * (1.3 - k * 0.6));
        }
        // the head: white-hot, then its color; late on it flickers before it crackles out
        if (k > 0.72 && Math.sin(t * 60 + s.seed) < -0.2) continue;
        // white only on the burst frame; the glow comes in as the stars spread, so the heart never blooms into a blob
        const ramp = s.age < TURN ? s.first : s.ramp, head = s.age < 0.04 ? WHITE : k < 0.55 ? ramp[s.age < TURN ? 5 : 6] : ramp[5];
        p.px(s.x, s.y, head);
        if (s.big && k < 0.6 && s.age > 0.06) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.px(s.x + dx, s.y + dy, ramp[5]);
        p.glow(s.x, s.y, s.big ? 7 : 5, ramp[4], (s.big ? 0.7 : 0.5) * (1 - k * 0.6) * Math.min(1, s.age / 0.2));
      }
      for (const q of pops) {
        const u = (t - q.t0) / q.life;
        if (u < 0 || u > 1) continue;
        sparkle(p, q.x, q.y, 2.6 * Math.sin(Math.PI * u), q.c, mix(q.c, C[3], 0.5), 0.5);
      }
      // the burst: a flare and a white heart, the sky lit up behind it
      const b = t - RISE;
      if (b >= 0 && b < 0.28) {
        const u = b / 0.28, L = 32 * Math.pow(1 - u, 1.3);
        flareRays(p, 0, 0, L, u * 0.6, C, K);
        if (b < 0.07) p.circle(0, 0, 2.6 - b * 20, WHITE);
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}

// an 8-ray flare: long rays on the axes with a white core and tinted ends, short gold diagonals, turning slowly
function flareRays(p, x, y, L, ang, C, K) {
  if (L < 1) return;
  for (let i = 0; i < 8; i++) {
    const diag = i % 2 === 1, an = ang + (i * TAU) / 8, len = diag ? L * 0.42 : L, ca = Math.cos(an), sa = Math.sin(an);
    for (let d = 0; d <= len; d += 0.5) {
      const u = d / len;
      p.dot(x + ca * d, y + sa * d, diag ? (u < 0.5 ? K[5] : K[4]) : u < 0.3 ? WHITE : u < 0.65 ? C[5] : C[4], u < 0.7 ? 1 : 1 - (u - 0.7) / 0.35);
    }
  }
  p.glow(x, y, 4 + L * 1.2, C[4], 0.3);
  p.glow(x, y, 2 + L * 0.3, WHITE, 0.25);
}

};
/* entry.js */
__defs[0] = function (__exports) {

// Entry for bundling the parts of pixelfx that Hell's Deck uses into one classic script (window.PixelFX).
const { createFrame, clearFrame, createFx, composite, PAL } = __req(2);
const fireball = __req(1);
const iceLance = __req(18);
const laserBolt = __req(20);
const bulletTracer = __req(22);
const hitSpark = __req(23);
const bulletImpact = __req(24);
const plasmaExplosion = __req(26);
const groundSlam = __req(28);
const heavyCleave = __req(29);
const critHit = __req(31);
const flamePillar = __req(32);
const fireRing = __req(33);
const confetti = __req(34);
const fireworkBurst = __req(35);

window.PixelFX = {
  createFrame, clearFrame, createFx, composite, PAL,
  fx: {
    "fire/fireball": fireball,
    "ice/ice-lance": iceLance,
    "projectiles/laser-bolt": laserBolt,
    "projectiles/bullet-tracer": bulletTracer,
    "impacts/hit-spark": hitSpark,
    "impacts/bullet-impact": bulletImpact,
    "explosions/plasma-explosion": plasmaExplosion,
    "impacts/ground-slam": groundSlam,
    "melee/heavy-cleave": heavyCleave,
    "impacts/crit-hit": critHit,
    "fire/flame-pillar": flamePillar,
    "fire/fire-ring": fireRing,
    "ui/confetti": confetti,
    "explosions/firework-burst": fireworkBurst,
  },
};

};
__req(0);
})();
