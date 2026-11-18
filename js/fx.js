'use strict';
/* =====================================================================
   เอฟเฟคพิเศษในสนาม: อินโทร VS, ลูกศรเล็งเป้า, แอนิเมชันเปิดตัวการ์ดตำนาน
   ทุกอย่างกดข้ามได้ด้วยการคลิก และเร็ว/ช้าตามปุ่มความเร็ว (SPEED)
   ===================================================================== */

/* ---------- รอแบบกดข้ามได้ ---------- */
const Skip = {
  on: false, waiters: [],
  trigger() { this.on = true; this.waiters.splice(0).forEach(f => f()); },
  reset() { this.on = false; this.waiters = []; },
};
function swait(ms) {
  if (Skip.on) return Promise.resolve();
  return new Promise(res => {
    let t = null;
    const done = () => { clearTimeout(t); res(); };
    t = setTimeout(done, ms * fxK());
    Skip.waiters.push(done);
  });
}
/* ตัวคูณเวลาเอฟเฟค: ปุ่มความเร็ว × FX_TEMPO
   FX_TEMPO = LEGEND_TEMPO ระหว่างแอนิเมชันเปิดตัวการ์ดตำนาน (ทุกตัว รวมตัวที่จะเพิ่มในอนาคต) — น้อยกว่า 1 = เร็วขึ้น */
const LEGEND_TEMPO = 0.6;
let FX_TEMPO = 1;
const fxK = () => SPEEDS[SPEED].k * FX_TEMPO;

/* =============================== อินโทร VS =============================== */
async function playIntro(ui) {
  const g = ui.g, arena = $('#bArena');
  if (!arena) return;
  const P = g.P(0), E = g.P(1), hero = HEROES[P.portrait.id];
  Skip.reset();
  arena.classList.add('intro-running');
  const ov = document.createElement('div');
  ov.className = 'intro';
  ov.style.setProperty('--k', fxK());
  ov.innerHTML = `
    <div class="intro-side left">
      <div class="intro-portrait" data-to="#pHeroRow .hero">${artHTML(P.portrait.folder, P.portrait.id, P.portrait.emoji)}</div>
      <b>${P.name}</b><small>${hero ? hero.title : 'ผู้ท้าชิง'}</small>
    </div>
    <div class="intro-vs">VS</div>
    <div class="intro-side right">
      <div class="intro-portrait boss" data-to="#eHeroRow .hero">${artHTML(E.portrait.folder, E.portrait.id, E.portrait.emoji)}</div>
      <b>${g.boss.name}</b><small>${g.boss.title} • ❤️ ${g.boss.hp}</small>
    </div>
    <div class="intro-skip">คลิกเพื่อข้าม</div>`;
  ov.addEventListener('click', () => Skip.trigger());
  arena.appendChild(ov);
  try {
    await swait(2600);
    // เลื่อนรูปกลับเข้า "ที่นั่ง" ของตัวเองในสนาม
    ov.classList.add('leaving');
    ov.querySelectorAll('.intro-portrait').forEach(a => {
      const b = document.querySelector(a.dataset.to);
      if (!b) return;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      a.style.transition = `transform ${0.8 * fxK()}s cubic-bezier(.6,0,.25,1), border-radius ${0.8 * fxK()}s`;
      a.style.transform = `translate(${rb.left + rb.width / 2 - (ra.left + ra.width / 2)}px, ${rb.top + rb.height / 2 - (ra.top + ra.height / 2)}px) scale(${rb.width / ra.width})`;
      a.style.borderRadius = '45% 45% 18% 18%';
    });
    await swait(850);
  } finally {
    ov.remove();
    arena.classList.remove('intro-running');
  }
  // โยนเหรียญเลือกคนเริ่มก่อน
  const coin = document.createElement('div');
  coin.className = 'coinflip';
  coin.style.setProperty('--k', fxK());
  coin.innerHTML = `
    <div class="coin ${g.first === 0 ? 'heads' : 'tails'}">
      <div class="face front">${artHTML(P.portrait.folder, P.portrait.id, P.portrait.emoji)}</div>
      <div class="face back">${artHTML(E.portrait.folder, E.portrait.id, E.portrait.emoji)}</div>
    </div>
    <div class="coin-txt">🎲 ใครจะได้เริ่มก่อน...</div>`;
  coin.addEventListener('click', () => Skip.trigger());
  arena.appendChild(coin);
  try {
    await swait(1600);
    coin.classList.add('done');
    coin.querySelector('.coin-txt').innerHTML = g.first === 0
      ? `🎲 คุณเริ่มก่อน!<small>${g.boss.name} ได้ 🪙 Hell Coin</small>`
      : `🎲 ${g.boss.name} เริ่มก่อน<small>คุณได้ 🪙 Hell Coin (มานา +1 หนึ่งเทิร์น)</small>`;
    await swait(1700);
  } finally {
    coin.remove();
  }
}

/* =============================== ลูกศรเล็งเป้า ===============================
   start(srcFn) = ลูกศรตามเมาส์จากการ์ด/มินเนี่ยนที่เลือก (snap เข้าเป้าที่ใช้ได้)
   pin(a, b, cls) = ลูกศรค้างจาก a ไป b (ใช้ตอนบอสเล็ง) */
const Aim = {
  svg: null, path: null, srcFn: null, live: false, mx: innerWidth / 2, my: innerHeight / 2,
  init() {
    const ns = 'http://www.w3.org/2000/svg';
    this.svg = document.createElementNS(ns, 'svg');
    this.svg.id = 'aimArrow';
    this.svg.innerHTML = `
      <defs>
        <marker id="aimHead" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 L3 5 Z" class="aim-head"/>
        </marker>
      </defs>
      <path class="aim-glow"/><path class="aim-line" marker-end="url(#aimHead)"/>
      <circle class="aim-ring" r="26"/>`;
    document.body.appendChild(this.svg);
    document.addEventListener('mousemove', e => { this.mx = e.clientX; this.my = e.clientY; if (this.live) this.redraw(); });
  },
  start(srcFn) {
    this.srcFn = srcFn; this.live = true;
    this.svg.classList.remove('enemy');
    this.svg.classList.add('show');
    this.redraw();
  },
  redraw() {
    const s = this.srcFn && this.srcFn();
    if (!s) return this.svg.classList.remove('show');
    this.svg.classList.add('show');
    let x = this.mx, y = this.my;
    const t = document.elementFromPoint(x, y)?.closest('#bArena [data-uid].targetable');
    this.svg.classList.toggle('locked', !!t);
    if (t) { const q = t.getBoundingClientRect(); x = q.left + q.width / 2; y = q.top + q.height / 2; }
    const r = s.getBoundingClientRect();
    this.draw(r.left + r.width / 2, r.top + Math.min(r.height / 2, 60), x, y, !!t);
  },
  draw(x1, y1, x2, y2, locked) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    // โค้งเล็กน้อยไปทางขวาของทิศทาง ให้ดูเป็นลูกศรเล็ง
    const bend = Math.min(90, len * 0.25);
    const cx = (x1 + x2) / 2 - (dy / len) * bend, cy = (y1 + y2) / 2 + (dx / len) * bend - len * 0.12;
    const d = `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`;
    this.svg.querySelector('.aim-line').setAttribute('d', d);
    this.svg.querySelector('.aim-glow').setAttribute('d', d);
    const ring = this.svg.querySelector('.aim-ring');
    ring.setAttribute('cx', x2); ring.setAttribute('cy', y2);
    ring.style.display = locked ? '' : 'none';
  },
  pin(a, b, cls = 'enemy') {
    if (!a || !b) return;
    this.live = false;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    this.svg.classList.toggle('enemy', cls === 'enemy');
    this.svg.classList.add('show', 'locked');
    this.draw(ra.left + ra.width / 2, ra.top + ra.height / 2, rb.left + rb.width / 2, rb.top + rb.height / 2, true);
  },
  stop() { this.live = false; this.srcFn = null; this.svg && this.svg.classList.remove('show', 'locked', 'enemy'); },
};
window.addEventListener('DOMContentLoaded', () => Aim.init());

/* ======================= แอนิเมชันเปิดตัวการ์ดตำนาน =======================
   LEGEND_FX[id] = async (stage, card, owner, ctx) => {...}   ctx.pos = ช่องบนบอร์ดที่จะลง
   stage = ฉากเต็มสนามที่สร้างให้ / คลิกที่ฉากเพื่อข้าม
   เพิ่มตัวละครใหม่ได้โดยเขียนฟังก์ชันแล้วใส่ใน LEGEND_FX */
const LEGEND_FX = {
  blitzo: blitzoEntrance,
};
async function playEntrance(card, owner, ctx = {}) {
  const f = LEGEND_FX[card.id], arena = $('#bArena');
  if (!f || !arena) return;
  Skip.reset();
  FX_TEMPO = LEGEND_TEMPO;   // ฉากเปิดตัวตำนานเล่นเร็วขึ้น (คืนค่าใน finally)
  // บอร์ดขยับเว้นช่องให้การ์ดตำนานก่อน แล้วฉากเปิดตัวค่อยเล่นตรงช่องนั้น (ไม่เล่นทับมินเนี่ยนตัวอื่น)
  if (reserveSlot(owner, ctx.pos)) await new Promise(r => setTimeout(r, 300 * fxK()));
  const stage = document.createElement('div');
  stage.className = `legend-stage lg-${card.id}`;
  stage.style.setProperty('--k', fxK());
  stage.addEventListener('click', () => Skip.trigger());
  arena.appendChild(stage);
  CardTip.hide();
  try { await f(stage, card, owner, ctx); } finally {
    stage.classList.add('out');
    await new Promise(r => setTimeout(r, Skip.on ? 0 : 300 * fxK()));
    stage.remove();
    FX_TEMPO = 1;
    // เลิกเว้นช่อง: ช่องว่างยังค้างบนจอจนกว่าบอร์ดถูกวาดใหม่พร้อมมินเนี่ยนตัวจริงในช่องนั้น (ไม่กระตุก)
    BattleUI.reserved = null;
  }
}
// เว้นช่องว่างบนบอร์ดตรงตำแหน่ง pos (null = ท้ายแถว) / again = วาดบอร์ดใหม่ระหว่างฉาก → ใส่กลับทันทีไม่ต้องขยาย
function reserveSlot(owner, pos, again = false) {
  const board = $(owner === 0 ? '#pBoard' : '#eBoard');
  if (!board) return null;
  board.querySelectorAll('.slot-reserve').forEach(e => e.remove());
  const el = document.createElement('div');
  el.className = `unit slot-reserve${again ? ' ready' : ''}`;
  el.style.setProperty('--grow', `${280 * fxK()}ms`);
  const units = board.querySelectorAll('.unit');
  board.insertBefore(el, (pos != null && units[pos]) || null);
  BattleUI.reserved = { owner, pos };
  return el;
}

// รูปหน้าตัวละคร: ใช้รูปฮีโร่ (หน้าชัดกว่า) ถ้ามี ไม่งั้นใช้รูปการ์ด
function legendPortrait(card) {
  return artHTML('cards', card.id, cardEmoji(card));   // ใช้ภาพการ์ด (จุดโฟกัสตาม ART_FOCUS)
}

// จุดลงสนามของมินเนี่ยน: ใส่ตัวกั้นที่มองไม่เห็นในแถวบอร์ดตรงตำแหน่ง pos แล้ววัดตำแหน่งจริง
function landingPoint(owner, pos) {
  const board = $(owner === 0 ? '#pBoard' : '#eBoard');
  if (!board) return null;
  // มีช่องที่เว้นไว้ให้ตำนานแล้ว → ใช้ตำแหน่งช่องนั้น (ขนาดเต็ม ไม่ใช่ตอนกำลังขยาย)
  const rs = board.querySelector('.slot-reserve');
  if (rs) {
    const r = rs.getBoundingClientRect(), w = rs.classList.contains('ready') ? r.width : rs.offsetHeight * (7 / 8.8);
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w, h: rs.offsetHeight };
  }
  const probe = document.createElement('div');
  probe.className = 'unit landing-probe';
  const units = board.querySelectorAll('.unit');
  board.insertBefore(probe, (pos != null && units[pos]) || null);
  const r = probe.getBoundingClientRect();
  probe.remove();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}
const rel = (r, s) => ({ x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 });
function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

/* ---------- Blitzø: โหนสลิงลงตรงช่องที่วาง → ควงปืน → ยิงมินเนี่ยนศัตรูทีละตัว ---------- */
async function blitzoEntrance(stage, card, owner, ctx) {
  const sr = stage.getBoundingClientRect();
  const land = landingPoint(owner, ctx.pos) || { x: sr.left + sr.width / 2, y: sr.top + sr.height * 0.62, w: 110, h: 140 };
  const lx = land.x - sr.left, ly = land.y - sr.top, sz = Math.max(land.w, land.h) * 1.12;
  stage.style.setProperty('--lx', `${lx}px`);
  stage.style.setProperty('--ly', `${ly}px`);
  stage.style.setProperty('--sz', `${sz}px`);
  stage.innerHTML = `
    <div class="lg-swing">
      <div class="lg-rope"></div>
      <div class="lg-hook"></div>
      <div class="lg-body">
        <div class="lg-portrait">${legendPortrait(card)}</div>
        <div class="lg-gun"><img src="assets/fx/blitzo_gun.webp" alt="" draggable="false"><div class="lg-flash"></div></div>
      </div>
    </div>
    <div class="lg-land"></div>
    <div class="lg-title"><b>${card.name}</b><small>🔫 บอสแห่ง I.M.P. ลงสนาม!</small></div>
    <div class="lg-skip">คลิกเพื่อข้าม</div>`;
  const swing = stage.querySelector('.lg-swing'), gun = stage.querySelector('.lg-gun');

  // 1) โหนสลิงลงมาค้างเหนือช่องที่เลือก แล้วแกว่ง
  await swait(60);
  swing.classList.add('drop');
  await swait(720);
  swing.classList.add('sway');
  await swait(950);
  // 2) ปล่อยมือจากสลิง หล่นลงบนบอร์ด (เชือกดีดกลับขึ้นไป)
  const k = fxK(), fall = sz * 0.9;
  stage.querySelector('.lg-rope').animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: 380 * k, easing: 'ease-in', fill: 'forwards' });
  stage.querySelector('.lg-hook').animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(-${fall * 1.5}px)` }], { duration: 380 * k, fill: 'forwards' });
  stage.querySelector('.lg-body').animate([
    { transform: 'none' },
    { transform: `translateY(${fall}px) scale(1.04, .94)`, offset: .62 },
    { transform: `translateY(${fall - 16}px)`, offset: .8 },
    { transform: `translateY(${fall}px)` },
  ], { duration: 560 * k, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'forwards' });
  await swait(350);
  restart(stage.querySelector('.lg-land'), 'show');
  restart($('#bArena'), 'screen-shake');
  await swait(420);
  // 3) ควงปืน
  gun.classList.add('twirl');
  await swait(950);
  gun.classList.remove('twirl');

  // 3) เล็งแล้วยิงมินเนี่ยนศัตรูทีละตัว (ตรงกับ Battlecry: 1 ดาเมจใส่มินเนี่ยนศัตรูทั้งหมด)
  const targets = [...document.querySelectorAll(owner === 0 ? '#eBoard .unit' : '#pBoard .unit')].map(el => rel(el.getBoundingClientRect(), sr));
  const shots = targets.length ? targets : [{ x: lx - sz * 1.2, y: sr.height * 0.12, air: 1 }, { x: lx + sz * 1.4, y: sr.height * 0.08, air: 1 }];
  const gr = gun.getBoundingClientRect(), pv = { x: gr.left - sr.left + gr.width * 0.18, y: gr.top - sr.top + gr.height * 0.7 };
  const pivot = () => pv;
  for (const t of shots) {
    if (Skip.on) break;
    const p = pivot();
    const ang = Math.atan2(t.y - p.y, t.x - p.x) * 180 / Math.PI;
    gun.style.transform = `rotate(${ang}deg)${Math.abs(ang) > 90 ? ' scaleY(-1)' : ''}`;
    await swait(170);
    if (Skip.on) break;
    blitzoFire(stage, gun, t, sr);
    await swait(Math.max(150, 300 - shots.length * 15));
  }
  gun.style.transform = '';
  stage.querySelector('.lg-title').classList.add('show');
  await swait(950);
}
function blitzoFire(stage, gun, t, sr) {
  const fl = gun.querySelector('.lg-flash');
  restart(fl, 'pop');
  restart(gun.querySelector('img'), 'kick');
  restart($('#bArena'), 'screen-shake');
  const m = rel(fl.getBoundingClientRect(), sr);
  // เส้นกระสุน
  const len = Math.hypot(t.x - m.x, t.y - m.y), ang = Math.atan2(t.y - m.y, t.x - m.x) * 180 / Math.PI;
  const tr = document.createElement('div');
  tr.className = 'lg-tracer';
  tr.style.cssText = `left:${m.x}px;top:${m.y}px;width:${len}px;transform:rotate(${ang}deg)`;
  stage.appendChild(tr);
  // จุดกระทบ + BANG!
  const hit = document.createElement('div');
  hit.className = t.air ? 'lg-hole' : 'lg-impact';
  hit.style.left = `${t.x}px`; hit.style.top = `${t.y}px`;
  stage.appendChild(hit);
  const bang = document.createElement('div');
  bang.className = 'lg-bang';
  bang.textContent = Math.random() < 0.5 ? 'BANG!' : 'BLAM!';
  bang.style.left = `${t.x + (Math.random() * 40 - 20)}px`; bang.style.top = `${t.y - 40}px`;
  stage.appendChild(bang);
}

/* ====================== การ์ดบินจากจุดหนึ่งไปอีกจุด (พลิกหน้า/หลังได้) ======================
   html = หน้าการ์ด (null = ใช้หลังการ์ด) / opt: dur, delay, faceDownStart, faceDownEnd, endScale, lift */
function flyBetween(html, from, to, opt = {}) {
  const dur = opt.dur || 800, CW = 121, CH = 180;   // ขนาดการ์ดที่ font-size 11px
  const el = document.createElement('div');
  el.className = 'fly2';
  const back = '<div class="card-back fly-back"></div>';
  el.innerHTML = `<div class="face front">${html || back}</div><div class="face back">${back}</div>`;
  document.body.appendChild(el);
  const c = r => [r.left + r.width / 2, r.top + r.height / 2];
  const [fx, fy] = c(from), [tx, ty] = c(to);
  const s0 = Math.min(1, Math.max(.25, from.width / CW)), lift = opt.lift ?? 40;
  const tf = (x, y, s, ry) => `perspective(700px) translate(${x - CW / 2}px, ${y - CH / 2}px) scale(${s}) rotateY(${ry}deg)`;
  const anim = el.animate([
    { transform: tf(fx, fy, s0, opt.faceDownStart ? 180 : 0), opacity: 0 },
    { transform: tf(fx, fy - 10, s0, opt.faceDownStart ? 180 : 0), opacity: 1, offset: .08 },
    { transform: tf((fx + tx) / 2, Math.min(fy, ty) - lift, 1, 0), opacity: 1, offset: .5 },
    { transform: tf(tx, ty, opt.endScale ?? .5, opt.faceDownEnd ? 180 : 0), opacity: opt.faceDownEnd ? 1 : .25 },
  ], { duration: dur, delay: opt.delay || 0, easing: 'cubic-bezier(.4,0,.3,1)', fill: 'both' });
  anim.onfinish = () => el.remove();
  return anim;
}

/* ====================== ฮีโร่พ่ายแพ้: รอยร้าวลามจนเต็มภาพ แล้วแตกกระจายเหมือนกระจก ====================== */
async function shatterHero(row) {
  const hero = row.querySelector('.hero');
  if (!hero) return;
  Skip.reset();   // ไม่ให้การกดข้ามจากอินโทร/แอนิเมชันก่อนหน้า ทำให้ฉากนี้ถูกข้ามไปด้วย
  const k = fxK(), r = hero.getBoundingClientRect(), W = r.width, H = r.height;
  const box = document.createElement('div');
  box.className = 'shatter';
  Object.assign(box.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${W}px`, height: `${H}px` });
  document.body.appendChild(box);
  row.classList.add('shattered');

  // จุดกระแทก + เส้นรัศมีไปถึงขอบภาพ
  const cx = W * (.4 + Math.random() * .2), cy = H * (.35 + Math.random() * .25), N = 12;
  const rays = Array.from({ length: N }, (_, i) => (i / N) * Math.PI * 2 + (Math.random() - .5) * .35).sort((a, b) => a - b);
  const hit = a => {
    const dx = Math.cos(a), dy = Math.sin(a);
    let t = Infinity;
    if (dx > 1e-6) t = Math.min(t, (W + 2 - cx) / dx); if (dx < -1e-6) t = Math.min(t, (-2 - cx) / dx);
    if (dy > 1e-6) t = Math.min(t, (H + 2 - cy) / dy); if (dy < -1e-6) t = Math.min(t, (-2 - cy) / dy);
    return [cx + dx * t, cy + dy * t];
  };
  const out = rays.map(hit);
  const inn = out.map(([x, y]) => { const f = .3 + Math.random() * .25; return [cx + (x - cx) * f, cy + (y - cy) * f]; });
  const corners = [[-2, -2], [W + 2, -2], [W + 2, H + 2], [-2, H + 2]].map(p => ({ p, a: Math.atan2(p[1] - cy, p[0] - cx) }));
  const norm = a => (a + Math.PI * 4) % (Math.PI * 2);

  // ชิ้นกระจก: สามเหลี่ยมด้านใน + ชิ้นด้านนอก (รวมมุมภาพที่อยู่ระหว่างสองเส้น)
  const shards = [];
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N, a0 = norm(rays[i]), span = norm(rays[j] - rays[i]);
    const mid = corners.filter(c => norm(c.a - a0) < span).sort((p, q) => norm(p.a - a0) - norm(q.a - a0)).map(c => c.p);
    shards.push({ pts: [[cx, cy], inn[i], inn[j]], inner: true });
    shards.push({ pts: [inn[i], out[i], ...mid, out[j], inn[j]] });
  }
  const fs = getComputedStyle(hero).fontSize;
  const els = shards.map(sh => {
    const d = document.createElement('div');
    d.className = 'shard';
    d.style.clipPath = `polygon(${sh.pts.map(([x, y]) => `${x}px ${y}px`).join(',')})`;
    const cl = hero.cloneNode(true);
    cl.removeAttribute('data-uid');
    cl.classList.remove('targetable', 'shake', 'ai-target', 'dead');
    Object.assign(cl.style, { position: 'absolute', left: 0, top: 0, width: `${W}px`, height: `${H}px`, margin: 0, fontSize: fs, visibility: 'visible' });
    d.appendChild(cl);
    box.appendChild(d);
    sh.el = d;
    sh.c = sh.pts.reduce((a, p) => [a[0] + p[0] / sh.pts.length, a[1] + p[1] / sh.pts.length], [0, 0]);
    return d;
  });

  // รอยร้าว (SVG) ค่อยๆ ลาม 3 ระยะ
  const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'cracks'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  box.appendChild(svg);
  const jag = (x1, y1, x2, y2) => {
    let d = `M${x1} ${y1}`;
    for (const f of [.33, .66]) {
      const nx = -(y2 - y1), ny = x2 - x1, l = Math.hypot(nx, ny) || 1, o = (Math.random() - .5) * 10;
      d += ` L${x1 + (x2 - x1) * f + nx / l * o} ${y1 + (y2 - y1) * f + ny / l * o}`;
    }
    return d + ` L${x2} ${y2}`;
  };
  const crack = (d, delay, dur) => {
    for (const cls of ['crack-dark', 'crack']) {
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', d); p.setAttribute('class', cls);
      svg.appendChild(p);
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: dur * k, delay: delay * k, fill: 'both', easing: 'ease-out' });
    }
  };
  const stages = [[0, 3, 6, 9], [1, 4, 7, 10, 2, 5, 8, 11]];
  stages[0].forEach(i => crack(jag(cx, cy, ...out[i]), 0, 380));
  stages[1].forEach((i, n) => crack(jag(cx, cy, ...out[i]), 480 + n * 40, 360));
  for (let i = 0; i < N; i++) crack(jag(...inn[i], ...inn[(i + 1) % N]), 980 + i * 25, 220);
  const thud = () => { box.classList.remove('jolt'); void box.offsetWidth; box.classList.add('jolt'); };
  thud(); setTimeout(thud, 480 * k); setTimeout(thud, 980 * k);
  await swait(1550);

  // แตกกระจาย
  svg.style.transition = `opacity ${.15 * k}s`; svg.style.opacity = 0;
  box.classList.add('flash');
  $('#bArena')?.classList.remove('screen-shake'); void $('#bArena')?.offsetWidth; $('#bArena')?.classList.add('screen-shake');
  const anims = shards.map(sh => {
    const dx = sh.c[0] - cx, dy = sh.c[1] - cy, l = Math.hypot(dx, dy) || 1;
    const force = (sh.inner ? 70 : 150) + Math.random() * 120;
    const x = dx / l * force, y = dy / l * force + 140 + Math.random() * 80, rot = (Math.random() - .5) * 540;
    return sh.el.animate([
      { transform: 'none', opacity: 1 },
      { transform: `translate(${x * .55}px, ${y * .25}px) rotate(${rot * .5}deg)`, opacity: 1, offset: .4 },
      { transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(.85)`, opacity: 0 },
    ], { duration: (1100 + Math.random() * 300) * k, delay: Math.random() * 80 * k, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' });
  });
  if (!Skip.on) await Promise.all(anims.map(a => a.finished.catch(() => {})));
  box.remove();
}

/* ---------- Stolas (แบบเดิม ใช้ภาพเคลื่อนไหวจากซีรีส์): การ์ดบินมากลางสนาม → แตกเป็นร่างปีศาจกางปีก → หดเป็นลูกแสงดิ่งลงช่องที่เลือก
   ตอนนี้ใช้ stolasWingsEntrance แทน ถ้าจะกลับไปใช้แบบเดิมให้เปลี่ยนเป็น LEGEND_FX.stolas = stolasEntrance */
LEGEND_FX.stolas = stolasWingsEntrance;
const STOLAS_ANIM_MS = 3550;   // ความยาวไฟล์ assets/fx/stolas_demon_anim.webp (71 เฟรม × 50ms)
async function stolasEntrance(stage, card, owner, ctx) {
  const k = fxK(), sr = stage.getBoundingClientRect();
  const land = landingPoint(owner, ctx.pos) || { x: sr.left + sr.width / 2, y: sr.top + sr.height * 0.62, w: 110, h: 140 };
  const lx = land.x - sr.left, ly = land.y - sr.top;
  const cx = sr.width / 2, cy = sr.height * 0.42;
  stage.innerHTML = `
    <div class="st-glow"></div>
    <div class="st-demon"><img class="anim" alt="" draggable="false"></div>
    <div class="st-orb"></div>
    <div class="st-wave"></div>
    <div class="lg-title st-title"><b>STOLAS</b><small>🦉 เจ้าชายแห่ง Goetia ลงสนาม!</small></div>
    <div class="lg-skip">คลิกเพื่อข้าม</div>`;
  const demon = stage.querySelector('.st-demon'), orb = stage.querySelector('.st-orb'), wave = stage.querySelector('.st-wave');
  Object.assign(demon.style, { left: `${cx}px`, top: `${cy}px` });
  Object.assign(orb.style, { left: `${cx}px`, top: `${cy}px` });
  Object.assign(wave.style, { left: `${lx}px`, top: `${ly}px` });

  // 1) การ์ดบินจากมือมากลางสนาม
  const src = owner === 0 ? document.querySelector(`#pHand [data-hand="${ctx.uid}"]`) : $('#ePlay .card');
  const from = (src || $(owner === 0 ? '#pHand' : '#eHand')).getBoundingClientRect();
  const mid = { left: sr.left + cx - 60, top: sr.top + cy - 90, width: 121, height: 180 };
  if (!Skip.on) flyBetween(cardHTML(card), from, mid, { dur: 750 * k, endScale: 1.25, lift: 30 });
  await swait(700);

  // 2) การ์ดระเบิดเป็นแสง → แอนิเมชันร่างปีศาจกางปีก (เล่นรอบเดียว ค้างที่ตาเรืองแสง) + ขนนกปลิว
  //    ใส่ src ตอนนี้ และต่อท้ายด้วยเวลา ให้แอนิเมชันเริ่มจากเฟรมแรกทุกครั้งที่ลงการ์ด
  demon.querySelector('img').src = `assets/fx/stolas_demon_anim.webp?play=${Date.now()}`;
  stage.classList.add('st-reveal');
  restart($('#bArena'), 'screen-shake');
  if (!Skip.on) for (let i = 0; i < 26; i++) {
    const f = document.createElement('div');
    f.className = 'st-feather';
    f.style.left = `${cx + (Math.random() - .5) * sr.width * .8}px`;
    f.style.top = `${cy + (Math.random() - .6) * sr.height * .5}px`;
    f.style.setProperty('--dx', `${(Math.random() - .5) * 160}px`);
    f.style.setProperty('--rot', `${(Math.random() - .5) * 720}deg`);
    f.style.animationDelay = `${Math.random() * 600 * k}ms`;
    f.style.animationDuration = `${(1400 + Math.random() * 900) * k}ms`;
    stage.appendChild(f);
  }
  await swait(STOLAS_ANIM_MS + 300);

  // 3) หดเป็นลูกแสง แล้วดิ่งลงช่องที่เลือก
  stage.classList.add('st-gather');
  await swait(380);
  orb.animate([
    { transform: 'translate(-50%, -50%) scale(1)', offset: 0 },
    { transform: `translate(calc(-50% + ${(lx - cx) * .2}px), calc(-50% + ${(ly - cy) * .05 - 40}px)) scale(1.15)`, offset: .3 },
    { transform: `translate(calc(-50% + ${lx - cx}px), calc(-50% + ${ly - cy}px)) scale(.7)` },
  ], { duration: 560 * k, easing: 'cubic-bezier(.6,0,.9,.5)', fill: 'forwards' });
  await swait(540);
  stage.classList.add('st-impact');
  restart(wave, 'show');
  restart($('#bArena'), 'screen-shake');
  stage.querySelector('.st-title').classList.add('show');
  await swait(900);
}

/* ---------- Stolas (แบบใหม่ วาดเอง): การ์ดลงตรงช่องที่วาง → ปีกดำกางออกจากสองข้างวงกลมแล้วแผ่ใหญ่
   → หน้าจอมืดลง → ดวงตาสีแดง 4 ดวงของ Stolas ลืมขึ้น → ความมืดหมุนวนเป็นน้ำวนหดหายเข้าไปที่ตัวมินเนี่ยน ---------- */
// ปีกขวา (โคนปีกอยู่ซ้าย) / flip = ปีกซ้าย กลับด้านภายใน SVG เอง
const stolasWing = flip => `<svg viewBox="0 0 220 140" preserveAspectRatio="none" aria-hidden="true">
  <defs><linearGradient id="sxWingG" x1="0" y1="0" x2="1" y2=".6">
    <stop offset="0" stop-color="#2a0510"/><stop offset=".45" stop-color="#0c0207"/><stop offset="1" stop-color="#000"/></linearGradient></defs>
  <g${flip ? ' transform="translate(220 0) scale(-1 1)"' : ''}>
  <path d="M0,52 C30,18 95,2 216,6 L196,30 L212,40 L182,56 L198,70 L162,80 L176,96 L136,100 L146,118 L104,114 L110,132 L70,120 L62,138 L36,116 L0,98 Z"
    fill="url(#sxWingG)" stroke="#6a0a1c" stroke-width="2" stroke-linejoin="round"/>
  <path d="M10,60 C60,34 120,22 196,30 M14,72 C62,54 120,50 182,56 M18,84 C60,72 110,76 162,80 M22,94 C56,90 96,98 136,100 M26,104 C50,106 80,112 104,114"
    fill="none" stroke="#4a0614" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>
  </g>
</svg>`;
// น้ำวนความมืด: แขนเกลียวโค้ง 8 แขนพุ่งจากกลางออกไปขอบ (หมุน + หดด้วย CSS)
function vortexSVG() {
  const arm = (i, w, col, op) => {
    const pts = [];
    for (let t = 0; t <= 1.0001; t += .05) {
      const r = 50 * t, a = (i * 45 + t * 250) * Math.PI / 180;
      pts.push(`${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`);
    }
    return `<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
  };
  const arms = i => arm(i, 6, '#1c0309', 1) + arm(i + .2, 1.2, '#5a0c1e', .8);
  return `<svg viewBox="-50 -50 100 100" aria-hidden="true">
    <defs><radialGradient id="sxVc"><stop offset="0" stop-color="#ff2a2a"/><stop offset=".03" stop-color="#8a0010"/><stop offset=".1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
    <circle r="50" fill="#000"/>${Array.from({ length: 8 }, (_, i) => arms(i)).join('')}<circle r="50" fill="url(#sxVc)"/></svg>`;
}
async function stolasWingsEntrance(stage, card, owner, ctx) {
  const k = fxK(), sr = stage.getBoundingClientRect();
  const land = landingPoint(owner, ctx.pos) || { x: sr.left + sr.width / 2, y: sr.top + sr.height * (owner === 0 ? .62 : .38), w: 90, h: 110 };
  const lx = land.x - sr.left, ly = land.y - sr.top, d = Math.min(land.w, land.h);   // d = เส้นผ่านศูนย์กลางวงกลมมินเนี่ยน
  const ex = sr.width / 2, ey = sr.height * .42, u = Math.min(sr.width, sr.height) / 600;   // จุดกลางดวงตา / หน่วยขนาด
  stage.classList.add('sx');
  stage.style.setProperty('--d', `${d}px`);
  stage.style.setProperty('--u', `${u}px`);
  stage.innerHTML = `
    <div class="sx-wings" style="left:${lx}px;top:${ly}px"><div class="sx-wing l">${stolasWing(true)}</div><div class="sx-wing r">${stolasWing(false)}</div></div>
    <div class="sx-unit" style="left:${lx}px;top:${ly}px">${legendPortrait(card)}</div>
    <div class="sx-dark"></div>
    <div class="sx-eyes" style="left:${ex}px;top:${ey}px">
      <i class="e big l"></i><i class="e big r"></i><i class="e small l"></i><i class="e small r"></i></div>
    <div class="sx-vortex" style="left:${lx}px;top:${ly}px">${vortexSVG()}</div>
    <div class="lg-title st-title"><b>STOLAS</b><small>🦉 เจ้าชายแห่ง Goetia ลงสนาม!</small></div>
    <div class="lg-skip">คลิกเพื่อข้าม</div>`;
  const vortex = stage.querySelector('.sx-vortex');
  vortex.style.setProperty('--vs', `${Math.hypot(Math.max(lx, sr.width - lx), Math.max(ly, sr.height - ly)) * 2.3}px`);

  // 1) การ์ดบินจากมือมาลงตรงช่องที่วาง แล้วกลายเป็นวงกลมมินเนี่ยน
  const src = owner === 0 ? document.querySelector(`#pHand [data-hand="${ctx.uid}"]`) : $('#ePlay .card');
  const from = (src || $(owner === 0 ? '#pHand' : '#eHand')).getBoundingClientRect();
  const to = { left: land.x - d / 2, top: land.y - d / 2, width: d, height: d };
  if (!Skip.on) flyBetween(cardHTML(card), from, to, { dur: 620 * k, endScale: d / 150, lift: 40 });
  await swait(560);
  stage.classList.add('sx-landed');
  restart($('#bArena'), 'screen-shake');
  await swait(420);

  // 2) ปีกดำกางออกซ้ายขวาจากข้างวงกลม มีขนนกสีดำเล็ก ๆ ร่วงลงมาไม่กี่เส้น แล้วหน้าจอค่อย ๆ มืดลง
  stage.classList.add('sx-unfurl');
  if (!Skip.on) for (let i = 0; i < 7; i++) {
    const f = document.createElement('i');
    f.className = 'sx-feather';
    const side = i % 2 ? 1 : -1;
    f.style.left = `${lx + side * d * (.6 + Math.random() * 1.6)}px`;
    f.style.top = `${ly - d * (.1 + Math.random() * .5)}px`;
    f.style.setProperty('--dx', `${(Math.random() - .5) * d * 1.2}px`);
    f.style.setProperty('--rot', `${(Math.random() - .5) * 540}deg`);
    f.style.animationDelay = `${(250 + Math.random() * 900) * k}ms`;
    f.style.animationDuration = `${(1500 + Math.random() * 700) * k}ms`;
    stage.appendChild(f);
  }
  await swait(900);
  stage.classList.add('sx-spread');
  await swait(1000);

  // 3) ดวงตาสีแดง 4 ดวงลืมขึ้นกลางความมืด → กระพริบตา → หลับตาหายไป
  stage.classList.add('sx-eyes-on');
  restart($('#bArena'), 'screen-shake');
  await swait(900);
  stage.classList.add('sx-blink');
  await swait(550);
  stage.classList.add('sx-eyes-off');
  await swait(450);

  // 4) ความมืดหมุนวนเป็นน้ำวน หดหายเข้าไปที่ตัวมินเนี่ยน
  stage.classList.add('sx-swirl');
  await swait(1050);
  stage.querySelector('.st-title').classList.add('show');
  await swait(750);
}

/* ---------- Octavia: ลงช่อง → ควันมืดสีดำม่วงพวยพุ่ง → ร่าง True form (นกฮูกดำม่วง ขอบเรืองชมพู ตาแดง)
   ผุดขึ้นเหนือตัวมินเนี่ยน มีขนนกเรืองแสงร่วง → ร่างสลายเป็นควันกลับเข้าตัว ---------- */
LEGEND_FX.octavia = octaviaEntrance;
function owlSVG() {
  const wing = `<path class="wf" d="M 10 -14 C 28 -36 58 -52 97 -52 L 88 -40 L 95 -31 L 80 -26 L 87 -16 L 70 -13 L 75 -3 L 58 -2 L 61 8 L 45 7 L 46 18 L 30 13 L 26 24 L 14 12 Z"/>
    <path class="wl" d="M 20 -18 Q 50 -38 86 -44 M 22 -8 Q 48 -22 77 -24 M 22 2 Q 42 -6 62 -8 M 22 10 Q 34 6 46 4"/>`;
  return `<svg viewBox="-100 -64 200 128" aria-hidden="true">
    <defs><linearGradient id="ocBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0f58"/><stop offset=".55" stop-color="#1c0630"/><stop offset="1" stop-color="#0a0212"/></linearGradient></defs>
    <g class="w r">${wing}</g><g class="w l"><g transform="scale(-1 1)">${wing}</g></g>
    <path class="bd" d="M -13 -18 Q -25 2 -15 24 L -9 46 L -3 37 L 0 48 L 3 37 L 9 46 L 15 24 Q 25 2 13 -18 Z"/>
    <path class="bd" d="M -15 -20 Q -22 -37 -19 -56 L -8 -42 Q 0 -45 8 -42 L 19 -56 Q 22 -37 15 -20 Q 0 -12 -15 -20 Z"/>
    <path class="mk" d="M 0 -40 L 2.4 -35 L 0 -31 L -2.4 -35 Z M 0 -8 L 3 -2 L 0 4 L -3 -2 Z M 0 10 L 2 14 L 0 18 L -2 14 Z"/>
    <path class="fd" d="M -1 -31 A 8 7 0 1 0 -16 -31 A 8 7 0 1 0 -1 -31 Z M 1 -31 A 8 7 0 1 1 16 -31 A 8 7 0 1 1 1 -31 Z"/>
    <g class="ey"><path d="M -14 -31 Q -9 -37 -3 -30 Q -9 -27.5 -14 -31 Z"/><path d="M 14 -31 Q 9 -37 3 -30 Q 9 -27.5 14 -31 Z"/></g></svg>`;
}
/* คลิปร่าง True form ของ Octavia (แปลงจากวิดีโอพื้นขาว → WebP พื้นโปร่งใส เล่นครั้งเดียว)
   เล่นซ้ำได้ทุกครั้งที่ลงการ์ด: ใช้ URL ใหม่ทุกรอบ (blob ที่โหลดเก็บไว้ หรือ ?v= ตอนเปิดแบบ file://) */
const OC_CLIP = 'assets/fx/octavia_trueform.webp', OC_CLIP_MS = 2050, OC_CLIP_SHAKE = 1030, OC_CLIP_RATIO = 638 / 360;
let ocClipBlob = null;
if (location.protocol !== 'file:') fetch(OC_CLIP).then(r => (r.ok ? r.blob() : null)).then(b => { ocClipBlob = b; }).catch(() => {});
function ocClipUrl() { return ocClipBlob ? URL.createObjectURL(ocClipBlob) : `${OC_CLIP}?v=${Date.now()}`; }
async function octaviaEntrance(stage, card, owner, ctx) {
  const k = fxK(), sr = stage.getBoundingClientRect();
  const land = landingPoint(owner, ctx.pos) || { x: sr.left + sr.width / 2, y: sr.top + sr.height * (owner === 0 ? .62 : .38), w: 90, h: 110 };
  const lx = land.x - sr.left, ly = land.y - sr.top, d = Math.min(land.w, land.h);
  // ร่าง True form (คลิปแอนิเมชันพื้นโปร่งใส): กว้างราว 7 เท่าตัวมินเนี่ยน อยู่ข้างหลังตัว ให้วงกลมมินเนี่ยนบังช่วงหาง
  // (ฝั่งบอสอยู่บนสุดของจอ เลยเลื่อนลงมาไม่ให้ล้นขอบ)
  const ow = Math.min(sr.width * .8, d * 7.2), oh = ow / OC_CLIP_RATIO;
  const oy = Math.max(oh * .5 + sr.height * .01, ly - oh * .29);
  stage.classList.add('oc');
  stage.style.setProperty('--d', `${d}px`);
  const smoke = Array.from({ length: 12 }, (_, i) => {
    const a = i / 12 * 360 + Math.random() * 20;
    return `<i style="--a:${a.toFixed(0)}deg;--r:${(d * (.55 + Math.random() * .45)).toFixed(0)}px;--s:${(.7 + Math.random() * .6).toFixed(2)};--dl:${Math.round(Math.random() * 220)}ms"></i>`;
  }).join('');
  stage.innerHTML = `
    <div class="oc-dim"></div>
    <div class="oc-owl vid" style="left:${lx}px;top:${oy}px;width:${ow}px;height:${oh}px;--oo:${(ly - (oy - oh / 2)).toFixed(0)}px"></div>
    <div class="oc-smoke" style="left:${lx}px;top:${ly}px">${smoke}</div>
    <div class="oc-unit" style="left:${lx}px;top:${ly}px">${legendPortrait(card)}</div>
    <div class="lg-title oc-title"><b>OCTAVIA</b><small>🌙 ทายาทแห่ง Goetia ลงสนาม!</small></div>
    <div class="lg-skip">คลิกเพื่อข้าม</div>`;
  const owl = stage.querySelector('.oc-owl');
  // โหลดคลิปไว้ก่อนระหว่างการ์ดบิน (ถ้าโหลดไม่ได้ ใช้นกฮูกที่วาดเอง owlSVG แทน)
  const img = new Image();
  img.alt = ''; img.draggable = false;
  let clipOk = true;
  img.onerror = () => { clipOk = false; owl.classList.remove('vid'); owl.innerHTML = owlSVG(); };
  img.src = ocClipUrl();

  // 1) การ์ดบินมาลงช่องที่วาง กลายเป็นวงกลมมินเนี่ยน
  const src = owner === 0 ? document.querySelector(`#pHand [data-hand="${ctx.uid}"]`) : $('#ePlay .card');
  const from = (src || $(owner === 0 ? '#pHand' : '#eHand')).getBoundingClientRect();
  if (!Skip.on) flyBetween(cardHTML(card), from, { left: land.x - d / 2, top: land.y - d / 2, width: d, height: d }, { dur: 620 * k, endScale: d / 150, lift: 40 });
  await swait(560);
  stage.classList.add('oc-landed');
  await swait(220);

  // 2) ควันมืดสีดำม่วงพวยพุ่งออกจากตัว แล้วร่าง True form ปรากฏเหนือตัว
  stage.classList.add('oc-smoking');
  await swait(180);
  if (clipOk && !Skip.on) {
    // คลิป: ปีกหุบ → ขนนกม่วงร่วง → กางปีกเต็ม (เล่นครั้งเดียว ความยาวคงที่ ไม่ขึ้นกับความเร็วเกม)
    if (img.decode) await img.decode().catch(() => {});
    owl.appendChild(img);
    if (!clipOk) owl.innerHTML = owlSVG();
  }
  stage.classList.add('oc-rise');
  if (clipOk) {
    await swait(OC_CLIP_SHAKE / fxK());
    restart($('#bArena'), 'screen-shake');   // จังหวะกางปีกออก
    await swait((OC_CLIP_MS - OC_CLIP_SHAKE) / fxK());
  } else {
    await swait(700);
    stage.classList.add('oc-glare');
    restart($('#bArena'), 'screen-shake');
    await swait(800);
  }

  // 3) ร่างสลายเป็นควัน ไหลกลับเข้าตัวมินเนี่ยน
  stage.classList.add('oc-fade');
  await swait(460);
  stage.querySelector('.oc-title').classList.add('show');
  await swait(600);
}

/* ---------- Moxxie: ลงช่อง → มองผ่านกล้องสไนเปอร์ (นอกวงกล้องมืด) → กล้องส่ายหาเป้าแล้วนิ่งที่มินเนี่ยนที่เลือก
   → ล็อกเป้า → ยิง (กล้องดีด + แสงวาบ) → กระสุนพุ่งจากตัว Moxxie ไปโดนเป้า
   ถ้ามี Millie บนบอร์ด: กากบาทกลางกล้องเป็นรูปหัวใจสีชมพู (คอมโบยิง 4) / ไม่มีเป้า: กล้องกวาดหาแล้วไม่ยิง ---------- */
LEGEND_FX.moxxie = moxxieEntrance;
async function moxxieEntrance(stage, card, owner, ctx) {
  const k = fxK(), sr = stage.getBoundingClientRect(), g = BattleUI.g;
  const land = landingPoint(owner, ctx.pos) || { x: sr.left + sr.width / 2, y: sr.top + sr.height * (owner === 0 ? .62 : .38), w: 90, h: 110 };
  const lx = land.x - sr.left, ly = land.y - sr.top, d = Math.min(land.w, land.h);
  // เป้าเป็นได้ทั้งมินเนี่ยนและฮีโร่ (ฮีโร่ก็มี data-uid)
  const tEl = ctx.target ? document.querySelector(`#bArena [data-uid="${ctx.target.uid}"]`) : null;
  const tp = tEl ? rel(tEl.getBoundingClientRect(), sr) : null;
  const heart = !!(g && g.onBoard(owner, 'millie'));
  const S = Math.min(sr.width, sr.height) * .46;
  stage.classList.add('mx');
  stage.style.setProperty('--d', `${d}px`);
  stage.style.setProperty('--S', `${S}px`);
  stage.innerHTML = `
    <div class="mx-unit" style="left:${lx}px;top:${ly}px">${legendPortrait(card)}</div>
    <div class="mx-scope${heart ? ' heart' : ''}">
      <i class="post h"></i><i class="post v"></i><i class="hair h"></i><i class="hair v"></i>
      <b class="mx-ret">${heart ? '♥' : ''}</b><i class="mx-lockring"></i>
      <div class="mx-read"><span class="rng">RNG ---</span><span class="wnd">WIND --</span><span class="lk">LOCK</span></div>
      <i class="mx-flash"></i></div>
    <div class="lg-title mx-title"><b>MOXXIE</b><small>🎯 มือปืนแม่นแห่ง I.M.P.${heart ? ' 💕 Millie อยู่ด้วย ยิงแรงขึ้น!' : ''}</small></div>
    <div class="lg-skip">คลิกเพื่อข้าม</div>`;
  const scope = stage.querySelector('.mx-scope');

  // 1) การ์ดบินมาลงช่องที่วาง
  const src = owner === 0 ? document.querySelector(`#pHand [data-hand="${ctx.uid}"]`) : $('#ePlay .card');
  const from = (src || $(owner === 0 ? '#pHand' : '#eHand')).getBoundingClientRect();
  if (!Skip.on) flyBetween(cardHTML(card), from, { left: land.x - d / 2, top: land.y - d / 2, width: d, height: d }, { dur: 620 * k, endScale: d / 150, lift: 40 });
  await swait(560);
  stage.classList.add('mx-landed');
  await swait(220);

  // 2) ยกกล้องขึ้นเล็ง: วงกล้องส่ายหาเป้า (ตัวเลขระยะ/ลมวิ่ง) แล้วนิ่งที่เป้า
  const enemyRow = (owner === 0 ? $('#eBoard') : $('#pBoard'));
  const er = enemyRow ? rel(enemyRow.getBoundingClientRect(), sr) : { x: sr.width / 2, y: sr.height * (owner === 0 ? .3 : .7) };
  const goal = tp || er;
  const side = Math.random() < .5 ? -1 : 1;
  const pts = tp
    ? [[goal.x + side * S * .75, goal.y + S * .5], [goal.x - side * S * .22, goal.y - S * .12], [goal.x + side * S * .07, goal.y + S * .05], [goal.x, goal.y]]
    : [[er.x - S * .9, er.y], [er.x + S * .9, er.y + S * .05], [er.x, er.y - S * .05]];
  scope.style.left = `${pts[0][0]}px`; scope.style.top = `${pts[0][1]}px`;
  stage.classList.add('mx-aim');
  const rng = scope.querySelector('.rng'), wnd = scope.querySelector('.wnd');
  const dist = Math.round(Math.hypot(goal.x - lx, goal.y - ly) / 2.2);
  const tick = setInterval(() => {
    rng.textContent = `RNG ${String(Math.round(dist * (.6 + Math.random() * .8))).padStart(3, '0')}m`;
    wnd.textContent = `WIND ${Math.random() < .5 ? '←' : '→'}${(Math.random() * 4).toFixed(1)}`;
  }, 70);
  const sweep = 1150 * k;
  if (!Skip.on) await scope.animate(pts.map(([x, y], i) => ({ left: `${x}px`, top: `${y}px`, offset: [0, .5, .8, 1][i] ?? i / (pts.length - 1) })),
    { duration: sweep, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' }).finished.catch(() => {});
  clearInterval(tick);
  rng.textContent = `RNG ${String(dist).padStart(3, '0')}m`; wnd.textContent = 'WIND 0.0';

  if (tp) {
    // 3) ล็อกเป้า → ยิง
    stage.classList.add('mx-lock');
    await swait(380);
    stage.classList.add('mx-fire');
    await swait(130);
    stage.classList.add('mx-out');
    await swait(150);
    const uEl = stage.querySelector('.mx-unit'), tNow = tEl.isConnected ? tEl : null;
    if (!Skip.on && uEl && tNow) {
      const to = center(tNow);
      await spellShot(heart ? { ...SPELL_STYLES.gun, shotOpts: { length: 44 } } : SPELL_STYLES.gun, center(uEl), to);
      spellImpact(SPELL_STYLES.gun, to, center(uEl).x);
      restart(tNow, 'shake');
      restart($('#bArena'), 'screen-shake');
    }
    await swait(280);
  } else {
    stage.classList.add('mx-out');
    await swait(260);
  }
  stage.querySelector('.mx-title').classList.add('show');
  await swait(650);
}

/* ---------- Millie: ลงช่อง → ขวานหมุนติ้วตกลงมาจากฟ้า Millie รับไว้ → ยกขวานเหนือหัว (แสงวาบ) → ฟาดลงพื้น
   รอยฟันไฟ (pixelfx heavy-cleave) + พื้นแตก คลื่นกระแทก ฝุ่น เศษหิน (ground-slam) + จอสั่นแรง
   คอมโบ Moxxie (มี Moxxie บนบอร์ด): เอฟเฟคทั้งหมดเป็นสีชมพู + หัวใจพุ่งออกจากจุดฟาด + วงหัวใจขยาย ---------- */
LEGEND_FX.millie = millieEntrance;
const MILLIE_PINK_SLAM = ['#2a0c1a', '#5c1438', '#a3245e', '#e0488c', '#ff7ab4', '#ffc2dc', '#ffffff'];
const MILLIE_PINK_ARC = ['#2a0c1a', '#5c1438', '#a3245e', '#e0488c', '#ff6aa8', '#ff9cc8', '#ffd6e8', '#ffffff'];
async function millieEntrance(stage, card, owner, ctx) {
  const k = fxK(), kS = SPEEDS[SPEED].k, sr = stage.getBoundingClientRect(), g = BattleUI.g;
  const land = landingPoint(owner, ctx.pos) || { x: sr.left + sr.width / 2, y: sr.top + sr.height * (owner === 0 ? .62 : .38), w: 90, h: 110 };
  const lx = land.x - sr.left, ly = land.y - sr.top, d = Math.min(land.w, land.h);
  const love = !!(g && g.onBoard(owner, 'moxxie'));
  const dir = land.x > sr.left + sr.width * .68 ? -1 : 1;   // ชิดขวา → ฟาดไปทางซ้าย
  // ขนาดขวานให้รัศมีวงฟาดเท่ากับรอยฟันของ heavy-cleave (~74px บนจอ) — ด้ามจับอยู่กลางวงกลมมินเนี่ยน
  const AH = 104, feetY = land.y + d * .42;
  stage.classList.add('ml');
  stage.style.setProperty('--d', `${d}px`);
  stage.style.setProperty('--ah', `${AH}px`);
  stage.innerHTML = `
    <div class="ml-unit" style="left:${lx}px;top:${ly}px">${legendPortrait(card)}</div>
    <div class="ml-axe-pos" style="left:${lx}px;top:${ly}px"><div class="ml-axe-flip" style="scale:${dir} 1"><div class="ml-axe"><img src="assets/fx/millie_axe.webp" alt="" draggable="false"><i class="ml-glint"></i></div></div></div>
    <div class="lg-title ml-title"><b>MILLIE</b><small>🪓 สาวฟาร์มขวานหนักแห่ง I.M.P.${love ? ' 💕 ลุยคู่ Moxxie!' : ''}</small></div>
    <div class="lg-skip">คลิกเพื่อข้าม</div>`;
  const pos = stage.querySelector('.ml-axe-pos'), axe = stage.querySelector('.ml-axe');

  // 1) การ์ดบินมาลงช่องที่วาง
  const src = owner === 0 ? document.querySelector(`#pHand [data-hand="${ctx.uid}"]`) : null;
  const from = (src || $(owner === 0 ? '#pHand' : '#eHand')).getBoundingClientRect();
  if (!Skip.on) flyBetween(cardHTML(card), from, { left: land.x - d / 2, top: land.y - d / 2, width: d, height: d }, { dur: 620 * k, endScale: d / 150, lift: 40 });
  await swait(560);
  stage.classList.add('ml-landed');
  await swait(150);

  // 2) ขวานหมุนติ้วตกลงมาจากฟ้า แล้ว Millie รับไว้ (ถือพาดไหล่)
  stage.classList.add('ml-catch');
  if (!Skip.on) {
    pos.animate([{ translate: `${dir * d * .9}px ${-ly - AH}px` }, { translate: '0 0' }], { duration: 560 * k, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'both' });
    await axe.animate([{ rotate: `${-dir * 1080}deg` }, { rotate: '-30deg' }], { duration: 560 * k, easing: 'cubic-bezier(.3,.2,.6,1)', fill: 'forwards' }).finished.catch(() => {});
  }
  restart(stage.querySelector('.ml-unit'), 'ml-bump');
  await swait(260);

  // 3) ยกขวานไปข้างหลังเหนือหัว (แสงวาบที่คมขวาน) → ฟาดลงพื้นตามรอยฟันไฟ
  //    heavy-cleave: แสงวาบ 0.2 วิ แล้วฟาด 0.135 วิ โดนพื้นที่ 0.335 วิ (เวลาจริง × ความเร็วเกม)
  if (!Skip.on) {
    const opt = { flip: dir < 0, seed: (Math.random() * 1e6) | 0 };
    if (love) opt.palette = MILLIE_PINK_ARC;
    PFX.play('melee/heavy-cleave', land.x - dir * 4, feetY, palOpt(opt));
    stage.classList.add('ml-raise');
    await axe.animate([{ rotate: '-30deg' }, { rotate: '-62deg' }], { duration: 200 * kS, easing: 'ease-out', fill: 'forwards' }).finished.catch(() => {});
    await axe.animate([{ rotate: '-62deg' }, { rotate: '100deg' }], { duration: 135 * kS, easing: 'cubic-bezier(.6,0,1,.6)', fill: 'forwards' }).finished.catch(() => {});
    // 4) โดนพื้น!
    const hx = land.x + dir * 76;
    const so = { seed: (Math.random() * 1e6) | 0 };
    if (love) so.palette = MILLIE_PINK_SLAM;
    PFX.play('impacts/ground-slam', hx, feetY, palOpt(so));
    const ar = $('#bArena');
    if (ar) { ar.classList.remove('heavy-hit', 'mega'); void ar.offsetWidth; ar.classList.add('heavy-hit', 'mega'); setTimeout(() => ar.classList.remove('heavy-hit', 'mega'), 520); }
    if (love) millieHearts(stage, hx - sr.left, feetY - sr.top, d);
  }
  stage.classList.add('ml-hit');
  await swait(love ? 900 : 750);
  stage.classList.add('ml-done');
  stage.querySelector('.ml-title').classList.add('show');
  await swait(650);
}
// คอมโบ Moxxie: หัวใจสีชมพูพุ่งออกจากจุดฟาด + วงหัวใจใหญ่ขยายออก
function millieHearts(stage, x, y, d) {
  const ring = document.createElement('b');
  ring.className = 'ml-heart-ring';
  Object.assign(ring.style, { left: `${x}px`, top: `${y - d * .4}px` });
  ring.textContent = '♥';
  stage.appendChild(ring);
  for (let i = 0; i < 16; i++) {
    const h = document.createElement('i');
    h.className = 'ml-heart';
    h.textContent = '♥';
    const a = (-90 + (Math.random() - .5) * 150) * Math.PI / 180, r = d * (1 + Math.random() * 1.6);
    Object.assign(h.style, { left: `${x}px`, top: `${y - 8}px`, fontSize: `${12 + Math.random() * 14}px` });
    h.style.setProperty('--tx', `${Math.cos(a) * r}px`);
    h.style.setProperty('--ty', `${Math.sin(a) * r}px`);
    h.style.setProperty('--rot', `${(Math.random() - .5) * 60}deg`);
    h.style.animationDelay = `${Math.random() * 120 * fxK()}ms`;
    stage.appendChild(h);
  }
}

/* ---------- คลิปแอนิเมชันพื้นโปร่งใส (WebP เล่นครั้งเดียว): โหลดเก็บเป็น blob ไว้ เล่นใหม่ได้ทุกครั้งด้วย URL ใหม่
   (เปิดแบบ file:// โหลด blob ไม่ได้ → ใช้ ?v= แทน) ---------- */
const CLIP_BLOBS = {};
function preloadClip(src) {
  if (location.protocol === 'file:' || CLIP_BLOBS[src] !== undefined) return;
  CLIP_BLOBS[src] = null;
  fetch(src).then(r => (r.ok ? r.blob() : null)).then(b => { CLIP_BLOBS[src] = b; }).catch(() => {});
}
function clipUrl(src) { return CLIP_BLOBS[src] ? URL.createObjectURL(CLIP_BLOBS[src]) : `${src}?v=${Date.now()}`; }

/* ---------- Loona: ลงช่อง → จอมืดอมแดง เงาของ Loona (คลิป) โผล่ข้างหลังตัวมินเนี่ยน (วงกลมบังช่วงอก)
   → เธอเงยหน้าหอน: พระจันทร์สีแดงส่องประกายขึ้นเหนือเงา + คลื่นเสียงหอนพุ่งขึ้น + จอสั่น → ทุกอย่างจางหาย ---------- */
LEGEND_FX.loona = loonaEntrance;
const LOONA_CLIP = 'assets/fx/loona_howl.webp', LOONA_CLIP_MS = 1650, LOONA_HOWL_AT = 1050, LOONA_RATIO = 322 / 480;
preloadClip(LOONA_CLIP);
async function loonaEntrance(stage, card, owner, ctx) {
  const k = fxK(), sr = stage.getBoundingClientRect();
  const land = landingPoint(owner, ctx.pos) || { x: sr.left + sr.width / 2, y: sr.top + sr.height * (owner === 0 ? .62 : .38), w: 90, h: 110 };
  const lx = land.x - sr.left, ly = land.y - sr.top, d = Math.min(land.w, land.h);
  // เงา: สูงราว 4.4 เท่าตัวมินเนี่ยน จุดกลางวงกลมอยู่ราว 84% ของความสูงเงา (วงกลมบังช่วงอก/ไหล่)
  const sh = Math.min(sr.height * .72, d * 4.4), sw = sh * LOONA_RATIO;
  const top = Math.max(sr.height * .1, ly - sh * .84);
  const sy = top + sh / 2;
  // พระจันทร์: เหนือหัวเงา เยื้องไปทางที่ปากหันเงย (ซ้ายบน) ไม่ล้นขอบจอ
  const mr = Math.max(d * .75, sh * .2);
  const mx = Math.min(sr.width - mr - 8, Math.max(mr + 8, lx - sw * .22)), my = Math.max(mr + 6, top - mr * .15);
  stage.classList.add('ln');
  stage.style.setProperty('--d', `${d}px`);
  stage.style.setProperty('--mr', `${mr}px`);
  stage.innerHTML = `
    <div class="ln-dim"></div>
    <div class="ln-moon" style="left:${mx}px;top:${my}px"><i class="rays"></i><i class="disc"></i></div>
    <div class="ln-shadow" style="left:${lx}px;top:${sy}px;width:${sw}px;height:${sh}px"></div>
    <div class="ln-waves" style="left:${lx - sw * .18}px;top:${top + sh * .2}px"><i></i><i></i><i></i></div>
    <div class="ln-unit" style="left:${lx}px;top:${ly}px">${legendPortrait(card)}</div>
    <div class="lg-title ln-title"><b>LOONA</b><small>🐺 เฮลฮาวด์ประจำ I.M.P. ลงสนาม!</small></div>
    <div class="lg-skip">คลิกเพื่อข้าม</div>`;
  const shadow = stage.querySelector('.ln-shadow');
  const img = new Image();
  img.alt = ''; img.draggable = false;
  let clipOk = true;
  img.onerror = () => { clipOk = false; };
  img.src = clipUrl(LOONA_CLIP);

  // 1) จอมืดอมแดง เงาโผล่ตรงช่องที่เลือกก่อน (ยังไม่มีตัวมินเนี่ยน) แล้วเงยหน้าหอน
  //    คลิปยาวคงที่ ไม่ขึ้นกับความเร็วเกม
  stage.classList.add('ln-dark');
  await swait(180);
  if (clipOk && !Skip.on) {
    if (img.decode) await img.decode().catch(() => {});
    if (clipOk) shadow.appendChild(img);
  }
  stage.classList.add('ln-rise');
  await swait((clipOk ? LOONA_HOWL_AT : 600) / fxK());

  // 2) หอน! พระจันทร์สีแดงส่องประกายขึ้นเหนือเงา + คลื่นเสียง + จอสั่น
  stage.classList.add('ln-howl');
  restart($('#bArena'), 'screen-shake');
  await swait(Math.max(700, (LOONA_CLIP_MS - LOONA_HOWL_AT) / fxK() + 350));

  // 3) เงา พระจันทร์ คลื่นเสียง จางหายไปพร้อมกัน แล้ว Loona โผล่ขึ้นมาในช่อง
  stage.classList.add('ln-fade');
  await swait(260);
  stage.classList.add('ln-landed');
  await swait(320);
  stage.querySelector('.ln-title').classList.add('show');
  await swait(650);
}

/* ---------- Striker: ไฟลุกตรงช่องที่เลือก (pixelfx fire-ring) → Striker ควบม้าไฟผุดขึ้นจากเปลวไฟ (คลิป)
   ม้ายกขาหน้า ไฟปะทุที่เท้า + จอสั่น → ภาพจางหาย Striker โผล่ในช่อง
   คอมโบ Stella (มี Stella บนบอร์ด + เลือกเป้าไว้): Striker ยิงนัดเดียวใส่เป้าที่จ้าง ---------- */
LEGEND_FX.striker = strikerEntrance;
const STRIKER_CLIP = 'assets/fx/striker_ride.webp', STRIKER_CLIP_MS = 1150, STRIKER_REAR_AT = 760, STRIKER_RATIO = 349 / 509;
preloadClip(STRIKER_CLIP);
async function strikerEntrance(stage, card, owner, ctx) {
  const k = fxK(), sr = stage.getBoundingClientRect(), g = BattleUI.g;
  const land = landingPoint(owner, ctx.pos) || { x: sr.left + sr.width / 2, y: sr.top + sr.height * (owner === 0 ? .62 : .38), w: 90, h: 110 };
  const lx = land.x - sr.left, ly = land.y - sr.top, d = Math.min(land.w, land.h);
  const feetY = land.y + d * .42;
  // ภาพม้า: สูงราว 5.4 เท่าตัวมินเนี่ยน เท้าม้า (ล่างสุดของคลิป) อยู่ตรงพื้นใต้ช่อง (ฝั่งบอส: เลื่อนลงไม่ให้ล้นขอบบน)
  const ch = Math.min(sr.height * .74, d * 5.4), cw = ch * STRIKER_RATIO;
  const cBottom = Math.max(ch + sr.height * .02, ly + d * .55);
  const contract = ctx.target && ctx.target.kind === 'minion' && g && g.onBoard(owner, 'stella');
  stage.classList.add('sk');
  stage.style.setProperty('--d', `${d}px`);
  stage.innerHTML = `
    <div class="sk-dim"></div>
    <div class="sk-glow" style="left:${lx}px;top:${ly + d * .42}px"></div>
    <div class="sk-ride" style="left:${lx}px;top:${cBottom - ch / 2}px;width:${cw}px;height:${ch}px"></div>
    <div class="sk-unit" style="left:${lx}px;top:${ly}px">${legendPortrait(card)}</div>
    <div class="lg-title sk-title"><b>STRIKER</b><small>🤠 มือปืนรับจ้างแห่งวงการฆ่า${contract ? ' 🎯 สัญญาจ้างจาก Stella!' : ''}</small></div>
    <div class="lg-skip">คลิกเพื่อข้าม</div>`;
  const ride = stage.querySelector('.sk-ride');
  const img = new Image();
  img.alt = ''; img.draggable = false;
  let clipOk = true;
  img.onerror = () => { clipOk = false; };
  img.src = clipUrl(STRIKER_CLIP);

  // 1) ไฟลุกท่วมพื้นตรงช่องที่เลือก
  stage.classList.add('sk-dark');
  if (!Skip.on) PFX.play('fire/fire-ring', land.x, feetY, { seed: (Math.random() * 1e6) | 0 });
  stage.classList.add('sk-burn');
  await swait(380);

  // 2) Striker ควบม้าผุดขึ้นจากเปลวไฟ (คลิปยาวคงที่ ไม่ขึ้นกับความเร็วเกม)
  if (clipOk && !Skip.on) {
    if (img.decode) await img.decode().catch(() => {});
    if (clipOk) ride.appendChild(img);
  }
  stage.classList.add('sk-rise');
  await swait((clipOk ? STRIKER_REAR_AT : 500) / fxK());
  // ม้ายกขาหน้า ไฟปะทุที่เท้า
  stage.classList.add('sk-rear');
  restart($('#bArena'), 'screen-shake');
  if (!Skip.on) PFX.play('impacts/hit-spark', land.x, feetY + 20 * PFX.SCALE, { seed: (Math.random() * 1e6) | 0 });
  await swait(Math.max(450, (STRIKER_CLIP_MS - STRIKER_REAR_AT) / fxK() + 380));

  // 3) ภาพจางหาย Striker โผล่ขึ้นในช่อง
  stage.classList.add('sk-fade');
  await swait(240);
  stage.classList.add('sk-landed');
  await swait(320);

  // 4) คอมโบ Stella: ยิงนัดเดียวใส่เป้าที่จ้าง (ทำลายจริงตอนการ์ดลงสนาม)
  if (contract && !Skip.on) {
    const tEl = document.querySelector(`#bArena [data-uid="${ctx.target.uid}"]`), uEl = stage.querySelector('.sk-unit');
    if (tEl && uEl) {
      tEl.classList.add('sk-marked');
      await swait(260);
      const to = center(tEl);
      await spellShot(SPELL_STYLES.gun, center(uEl), to);
      PFX.play('impacts/crit-hit', to.x, to.y + 20 * PFX.SCALE, { seed: (Math.random() * 1e6) | 0 });
      restart(tEl, 'shake');
      setTimeout(() => tEl.classList.remove('sk-marked'), 600);
    }
  }
  stage.querySelector('.sk-title').classList.add('show');
  await swait(650);
}

/* ---------- Barbie Wire: ลงช่องแล้วกระทืบพื้น → ลวดหนามสะบัดพุ่งไปหามินเนี่ยนพวกเดียวกันที่เลือก
   → พันเป็นเกลียวรอบตัว → รัดแน่นกลายเป็นโล่สีเงิน (Taunt) + หยดเลือดวนเข้าตัว (Lifesteal)
   ไม่มีเป้า: ลวดพันรอบตัวเธอเอง / คอมโบ Blitzø: ลวดอีกเส้นผูกกับ Blitzø แล้ววาบพร้อมกันแบบฝาแฝด ---------- */
LEGEND_FX.barbie_wire = barbieEntrance;
// ลวดหนาม: เส้นตามจุด pts + หนามรูปกากบาทเป็นระยะ (แบ่งหนามเป็นกลุ่มตามระยะทาง ให้ทยอยโผล่ตามเส้นที่วาด)
function barbWire(pts, cls, groups = 8, sp = 15, bl = 4.5) {
  const d = 'M' + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
  let len = 0;
  const acc = [0];
  for (let i = 1; i < pts.length; i++) { len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); acc.push(len); }
  const parts = Array.from({ length: groups }, () => []);
  for (let s = sp * .7, j = 1; s < len - 4; s += sp) {
    while (j < pts.length - 1 && acc[j] < s) j++;
    const [x0, y0] = pts[j - 1], [x1, y1] = pts[j], f = (s - acc[j - 1]) / Math.max(1e-6, acc[j] - acc[j - 1]);
    const x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f, a = Math.atan2(y1 - y0, x1 - x0);
    const g = Math.min(groups - 1, Math.floor(s / len * groups));
    for (const da of [Math.PI / 3, -Math.PI / 3]) {
      const dx = Math.cos(a + da) * bl, dy = Math.sin(a + da) * bl;
      parts[g].push(`M${(x - dx).toFixed(1)} ${(y - dy).toFixed(1)} L${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}`);
    }
  }
  return `<g class="${cls}"><path class="under" pathLength="100" d="${d}"/><path class="wire" pathLength="100" d="${d}"/>${parts.map((p, i) => `<path class="barb" style="--i:${i}" d="${p.join(' ')}"/>`).join('')}</g>`;
}
const wireArc = (a, b, bend) => Array.from({ length: 33 }, (_, i) => {
  const t = i / 32, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - bend;
  return [(1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x, (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y];
});
// เกลียวพันรอบตัว (2.5 รอบ จากบนลงล่าง)
const wireCoil = (c, r) => Array.from({ length: 121 }, (_, i) => {
  const s = i / 120, th = s * Math.PI * 5;
  return [c.x + r * 1.08 * Math.cos(th), c.y - r * .8 + s * r * 1.6 + r * .26 * Math.sin(th)];
});
async function barbieEntrance(stage, card, owner, ctx) {
  const k = fxK(), sr = stage.getBoundingClientRect(), g = BattleUI.g;
  const land = landingPoint(owner, ctx.pos) || { x: sr.left + sr.width / 2, y: sr.top + sr.height * (owner === 0 ? .62 : .38), w: 90, h: 110 };
  const lx = land.x - sr.left, ly = land.y - sr.top, d = Math.min(land.w, land.h), me = { x: lx, y: ly };
  const tEl = ctx.target && ctx.target.kind === 'minion' ? document.querySelector(`#bArena [data-uid="${ctx.target.uid}"]`) : null;
  const tc = tEl ? rel(tEl.getBoundingClientRect(), sr) : me;   // ไม่มีเป้า → พันตัวเอง
  const tr = tEl ? Math.max(tEl.offsetWidth, tEl.offsetHeight) * .5 : d * .55;
  const twin = g && g.mins(owner).find(m => m.id === 'blitzo');
  const bEl = twin && document.querySelector(`#bArena [data-uid="${twin.uid}"]`);
  const bc = bEl ? rel(bEl.getBoundingClientRect(), sr) : null;
  stage.classList.add('bw');
  stage.style.setProperty('--d', `${d}px`);
  const W = sr.width, H = sr.height;
  const SP = Math.max(9, d * .2), BL = Math.max(2.4, d * .055);   // ระยะห่าง/ขนาดหนาม ตามขนาดมินเนี่ยน
  stage.innerHTML = `
    <div class="bw-dim"></div>
    <svg class="bw-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
      ${tEl ? barbWire(wireArc(me, tc, Math.min(90, Math.hypot(tc.x - lx, tc.y - ly) * .35)), 'bw-lash', 8, SP, BL) : ''}
      ${barbWire(wireCoil(tc, tr), 'bw-coil', 10, SP * 1.15, BL)}
      ${bc ? barbWire(wireArc(me, bc, 50), 'bw-twin', 8, SP, BL) : ''}
    </svg>
    <div class="bw-shield" style="left:${tc.x}px;top:${tc.y}px;width:${tr * 2.3}px;height:${tr * 2.3}px"><b>🛡️</b></div>
    <div class="bw-drops" style="left:${tc.x}px;top:${tc.y}px">${Array.from({ length: 9 }, (_, i) =>
      `<i style="--a:${i * 40 + Math.round(Math.random() * 20)}deg;--r:${(tr * (1.3 + Math.random() * .5)).toFixed(0)}px;--dl:${Math.round(Math.random() * 200)}ms"></i>`).join('')}</div>
    ${bc ? `<div class="bw-twinflash" style="left:${bc.x}px;top:${bc.y}px"></div><div class="bw-twinflash me" style="left:${lx}px;top:${ly}px"></div>` : ''}
    <div class="bw-stomp" style="left:${lx}px;top:${ly + d * .42}px"></div>
    <div class="bw-unit" style="left:${lx}px;top:${ly}px">${legendPortrait(card)}</div>
    <div class="lg-title bw-title"><b>BARBIE WIRE</b><small>🎀 ลวดหนามพันใจ${twin ? ' 👯 ฝาแฝดกับ Blitzø!' : ''}</small></div>
    <div class="lg-skip">คลิกเพื่อข้าม</div>`;
  if (tEl) tEl.classList.add('bw-target');

  // 1) การ์ดบินมาลงช่อง แล้วกระทืบพื้น
  const src = owner === 0 ? document.querySelector(`#pHand [data-hand="${ctx.uid}"]`) : null;
  const from = (src || $(owner === 0 ? '#pHand' : '#eHand')).getBoundingClientRect();
  if (!Skip.on) flyBetween(cardHTML(card), from, { left: land.x - d / 2, top: land.y - d / 2, width: d, height: d }, { dur: 620 * k, endScale: d / 150, lift: 40 });
  await swait(560);
  stage.classList.add('bw-landed');
  if (!Skip.on) PFX.play('impacts/hit-spark', land.x, land.y + d * .42 + 20 * PFX.SCALE, { seed: (Math.random() * 1e6) | 0 });
  restart($('#bArena'), 'screen-shake');
  await swait(380);

  // 2) ลวดหนามสะบัดพุ่งไปหาเป้า → 3) พันเป็นเกลียวรอบตัว
  stage.classList.add('bw-lashing');
  if (tEl) await swait(380);
  stage.classList.add('bw-coiling');
  await swait(480);

  // 4) รัดแน่น → โล่สีเงิน (Taunt) + หยดเลือดวนเข้าตัว (Lifesteal)
  stage.classList.add('bw-tight');
  if (tEl) restart(tEl, 'shake');
  await swait(170);
  stage.classList.add('bw-armor');
  await swait(560);

  // 5) คอมโบ Blitzø: ลวดอีกเส้นผูกกับ Blitzø แล้ววาบพร้อมกัน
  if (bc) {
    stage.classList.add('bw-twinning');
    await swait(360);
    stage.classList.add('bw-twinflash-on');
    await swait(420);
  }

  // 6) ลวดจางหาย ขึ้นชื่อ
  stage.classList.add('bw-fade');
  if (tEl) setTimeout(() => tEl.classList.remove('bw-target'), 400 * k);
  await swait(260);
  stage.querySelector('.bw-title').classList.add('show');
  await swait(650);
}

/* ---------- Fizzarolli: จอมืดลงเล็กน้อย → สปอตไลต์ส่องลงตรงช่อง เวทีละครสัตว์ลายแดงขาว + ธงราวโผล่ขึ้น
   → Fizzarolli กระเด้งพุ่งออกมาจากเวที (ยืด-หด-เด้ง) พร้อมกระดาษสีระเบิดออก (pixelfx ui/confetti) → ดอกไม้ไฟ → จบ ---------- */
LEGEND_FX.fizzarolli = fizzEntrance;
function fizzBunting(w, h) {
  // ธงราวสามเหลี่ยมสลับสีห้อยตามเส้นโค้ง
  const n = 9, cols = ['#ff3b4e', '#ffd23a', '#3cc8ff', '#ffffff', '#f53cd1'];
  const y = x => h * .25 + (1 - Math.pow((x / w) * 2 - 1, 2)) * h * .45;
  let flags = '';
  for (let i = 0; i < n; i++) {
    const x0 = w * (i + .15) / n, x1 = w * (i + .85) / n, xm = (x0 + x1) / 2;
    flags += `<path d="M${x0.toFixed(1)} ${y(x0).toFixed(1)} L${x1.toFixed(1)} ${y(x1).toFixed(1)} L${xm.toFixed(1)} ${(y(xm) + h * .42).toFixed(1)} Z" fill="${cols[i % cols.length]}" style="--i:${i}"/>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path class="rope" d="M0 ${y(0)} Q${w / 2} ${h * .25 + h * .9} ${w} ${y(w)}" /><g class="flags">${flags}</g></svg>`;
}
async function fizzEntrance(stage, card, owner, ctx) {
  const k = fxK(), sr = stage.getBoundingClientRect();
  const land = landingPoint(owner, ctx.pos) || { x: sr.left + sr.width / 2, y: sr.top + sr.height * (owner === 0 ? .62 : .38), w: 90, h: 110 };
  const lx = land.x - sr.left, ly = land.y - sr.top, d = Math.min(land.w, land.h), feet = ly + d * .42;
  const bw = d * 3.6, bh = d * .9;
  stage.classList.add('fz');
  stage.style.setProperty('--d', `${d}px`);
  stage.style.setProperty('--lx', `${lx}px`);
  stage.style.setProperty('--feet', `${feet}px`);
  stage.innerHTML = `
    <div class="fz-dim"></div>
    <div class="fz-spot"></div>
    <div class="fz-pool" style="left:${lx}px;top:${feet}px"></div>
    <div class="fz-bunting" style="left:${lx - bw / 2}px;top:${Math.max(4, ly - d * 1.75)}px">${fizzBunting(bw, bh)}</div>
    <div class="fz-stage" style="left:${lx}px;top:${feet}px"><i class="side"></i><i class="top"></i><i class="rim"></i></div>
    <div class="fz-unit" style="left:${lx}px;top:${ly}px">${legendPortrait(card)}</div>
    <div class="lg-title fz-title"><b>FIZZAROLLI</b><small>🤡 ดาวเด่นแห่งคณะละครสัตว์ ลงสนาม!</small></div>
    <div class="lg-skip">คลิกเพื่อข้าม</div>`;

  // 1) จอมืดลงเล็กน้อย สปอตไลต์ส่องลงตรงช่อง → เวทีละครสัตว์โผล่ขึ้น + ธงราวหย่อนลงมา
  stage.classList.add('fz-dark');
  await swait(200);
  stage.classList.add('fz-light');
  await swait(380);
  stage.classList.add('fz-set');
  await swait(620);

  // 2) Fizzarolli กระเด้งพุ่งออกจากเวที + กระดาษสีระเบิดออก
  stage.classList.add('fz-pop');
  await swait(170);
  if (!Skip.on) {
    PFX.play('ui/confetti', land.x, land.y + d * .42, { seed: (Math.random() * 1e6) | 0 });
    PFX.play('impacts/hit-spark', land.x, land.y + d * .1 + 20 * PFX.SCALE, { palette: palOpt({ palette: 'arcane' }).palette, seed: (Math.random() * 1e6) | 0 });
  }
  await swait(600);
  restart($('#bArena'), 'screen-shake');

  // 3) ดอกไม้ไฟเหนือเวที แล้วฉากค่อย ๆ จาง
  // ดอกไม้ไฟยิงขึ้นจากเวทีแล้วระเบิดด้านบน (จุดเริ่ม = พื้นเวที)
  if (!Skip.on) PFX.play('explosions/firework-burst', land.x + (Math.random() - .5) * d * .6, land.y + d * .42, { seed: (Math.random() * 1e6) | 0 });
  stage.querySelector('.fz-title').classList.add('show');
  await swait(520);
  stage.classList.add('fz-fade');
  await swait(450);
}
