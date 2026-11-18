'use strict';
/* =====================================================================
   เอฟเฟคพิกเซลจาก pixelfx (js/vendor/pixelfx.js → window.PixelFX)
   PFX  = ตัวเล่นเอฟเฟค: canvas โปร่งใสเต็มจอวางทับสนาม วาดเฉพาะตอนมีเอฟเฟคเล่นอยู่
   เวทยิง = ตอนร่ายเวทที่ทำดาเมจ ลูกเวทพุ่งจากฮีโร่ผู้ร่ายไปหาเป้า แล้วค่อยแสดงดาเมจตอนโดน
   ===================================================================== */
const PFX = {
  SCALE: 2,                         // 1 พิกเซลของเอฟเฟค = 2 พิกเซลจอ
  canvas: null, ctx: null, frame: null, img: null, list: [], raf: 0, last: 0,
  ready() { return !!window.PixelFX; },
  ensure() {
    const W = Math.ceil(innerWidth / this.SCALE), H = Math.ceil(innerHeight / this.SCALE);
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'pfxLayer';
      this.ctx = this.canvas.getContext('2d');
    }
    if (!this.canvas.isConnected) document.body.appendChild(this.canvas);
    if (!this.frame || this.frame.w !== W || this.frame.h !== H) {
      this.canvas.width = W; this.canvas.height = H;
      this.frame = PixelFX.createFrame(W, H);
      this.img = new ImageData(W, H);
    }
  },
  /* เล่นเอฟเฟค id ที่ตำแหน่งจอ (x, y) / opts = ตัวเลือกของเอฟเฟค (palette, angle, flip, ...)
     คืน handle: move(x, y, angle) ย้ายตำแหน่ง, kill() ลบทันที */
  play(id, x, y, opts = {}) {
    if (!this.ready() || !PixelFX.fx[id]) return null;
    this.ensure();
    const s = this.SCALE;
    const fx = PixelFX.createFx(PixelFX.fx[id], { ...opts, x: x / s, y: y / s });
    const h = {
      fx, dead: false,
      move(nx, ny, ang) { fx.options.x = nx / s; fx.options.y = ny / s; if (ang != null) fx.options.angle = ang; },
      kill() { this.dead = true; },
    };
    this.list.push(h);
    if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(t => this.tick(t)); }
    return h;
  },
  tick(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000) / (SPEEDS[SPEED] ? SPEEDS[SPEED].k : 1);
    this.last = t;
    this.list = this.list.filter(h => !h.dead && !h.fx.done());
    const f = this.frame;
    PixelFX.clearFrame(f);
    for (const h of this.list) { h.fx.update(dt); h.fx.draw(f); }
    PixelFX.composite(f, this.img.data, null);
    this.ctx.putImageData(this.img, 0, 0);
    if (this.list.length) this.raf = requestAnimationFrame(n => this.tick(n));
    else { this.raf = 0; this.ctx.clearRect(0, 0, f.w, f.h); }
  },
  clear() { this.list.forEach(h => h.kill()); },
};

/* ---------- เวทยิง: หน้าตาลูกเวทแยกตามธาตุของการ์ด ---------- */
const SPELL_STYLES = {
  // หางลูกเวทตั้งให้สั้น (speed ของลูกไฟ / length ของกระสุน) ไม่ให้หางพาดไปทับมือการ์ดตอนเริ่มยิง
  fire:   { shot: 'fire/fireball', shotOpts: { radius: 4, speed: 55 }, hit: 'impacts/hit-spark', hitOpts: {}, speed: 950 },
  gun:    { shot: 'projectiles/bullet-tracer', shotOpts: { length: 34 }, hit: 'impacts/bullet-impact', hitOpts: {}, speed: 1700 },
  ice:    { shot: 'ice/ice-lance', shotOpts: { length: 26 }, hit: 'impacts/hit-spark', hitOpts: { palette: 'ice' }, speed: 1100 },
  arcane: { shot: 'projectiles/laser-bolt', shotOpts: { palette: 'arcane', length: 30 }, hit: 'impacts/hit-spark', hitOpts: { palette: 'arcane' }, speed: 1200 },
};
// การ์ดที่ระบุธาตุตรง ๆ (ที่เหลือเดาจาก id / แท็ก)
const SPELL_STYLE_OF = {
  brimstone_shot: 'fire', hellfire_bolt: 'fire', infernal_lance: 'fire', hellfire_rain: 'fire',
  bullet_storm: 'gun', contract_payout: 'gun', wrath_of_imps: 'gun',
  frozen_wastes: 'ice', pentagram_strike: 'arcane', stolas_prophecy: 'arcane',
};
function spellStyle(c) {
  const k = SPELL_STYLE_OF[c.id]
    || (/frost|ice|blizzard|frozen|snow|^a_/.test(c.id) ? 'ice'
      : /bullet|sniper|gun|shot|knife|^s_|^c_/.test(c.id) ? 'gun'
      : /^p_|^as_|^m_/.test(c.id) || (c.tags || []).includes('Goetia') ? 'arcane' : 'fire');
  return SPELL_STYLES[k];
}
const palOpt = o => (o && typeof o.palette === 'string' && PixelFX.PAL[o.palette]) ? { ...o, palette: PixelFX.PAL[o.palette] } : o;
const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r }; };

/* ยิงลูกเวท 1 ลูกจาก from ไป to (จุดบนจอ) — resolve ตอนโดนเป้า */
function spellShot(st, from0, to) {
  return new Promise(res => {
    const k = SPEEDS[SPEED].k;
    // เริ่มที่ขอบตัวผู้ร่ายด้านที่หันไปหาเป้า (ไม่ใช่กลางตัว) + ประกายเล็ก ๆ ที่ตัวผู้ร่ายตอนปล่อย
    const a0 = Math.atan2(to.y - from0.y, to.x - from0.x), off = from0.r ? Math.min(from0.r.width, from0.r.height) * 0.42 : 0;
    const from = { x: from0.x + Math.cos(a0) * off, y: from0.y + Math.sin(a0) * off };
    const fo = palOpt(st.hitOpts) || {};
    PFX.play('impacts/hit-spark', from.x, from.y + 20 * PFX.SCALE, { ...fo, flip: Math.cos(a0) < 0, seed: (Math.random() * 1e6) | 0 });
    const dx = to.x - from.x, dy = to.y - from.y, dist = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const dur = Math.max(220, Math.min(560, dist / st.speed * 1000)) * k;
    const h = PFX.play(st.shot, from.x, from.y, { ...palOpt(st.shotOpts), angle: ang, seed: (Math.random() * 1e6) | 0 });
    if (!h) return res();
    const t0 = performance.now();
    const step = () => {
      const u = Math.min(1, (performance.now() - t0) / dur), e = u * u * (3 - 2 * u) * 0.35 + u * 0.65;
      h.move(from.x + dx * e, from.y + dy * e, ang);
      if (u < 1) requestAnimationFrame(step);
      else { h.kill(); res(); }
    };
    requestAnimationFrame(step);
  });
}
/* เอฟเฟคตอนโดน ที่จุด to (impact ของ pixelfx วาดจุดกระแทกไว้เหนือ "พื้น" ตาม height) */
function spellImpact(st, to, fromX) {
  const o = palOpt(st.hitOpts) || {};
  const left = fromX > to.x;
  if (st.hit === 'impacts/hit-spark') PFX.play(st.hit, to.x, to.y + 20 * PFX.SCALE, { ...o, flip: left, seed: (Math.random() * 1e6) | 0 });
  else if (st.hit === 'impacts/bullet-impact') PFX.play(st.hit, to.x + (left ? -1 : 1) * 4, to.y + 24 * PFX.SCALE, { ...o, flip: left, seed: (Math.random() * 1e6) | 0 });
  else PFX.play(st.hit, to.x, to.y, { ...o, seed: (Math.random() * 1e6) | 0 });
}
