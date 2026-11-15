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
    t = setTimeout(done, ms * SPEEDS[SPEED].k);
    Skip.waiters.push(done);
  });
}
const fxK = () => SPEEDS[SPEED].k;

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
  }
}

// รูปหน้าตัวละคร: ใช้รูปฮีโร่ (หน้าชัดกว่า) ถ้ามี ไม่งั้นใช้รูปการ์ด
function legendPortrait(card) {
  return artHTML('cards', card.id, cardEmoji(card));   // ใช้ภาพการ์ด (จุดโฟกัสตาม ART_FOCUS)
}

// จุดลงสนามของมินเนี่ยน: ใส่ตัวกั้นที่มองไม่เห็นในแถวบอร์ดตรงตำแหน่ง pos แล้ววัดตำแหน่งจริง
function landingPoint(owner, pos) {
  const board = $(owner === 0 ? '#pBoard' : '#eBoard');
  if (!board) return null;
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

/* ---------- Stolas: การ์ดบินมากลางสนาม → แตกเป็นร่างปีศาจกางปีก → หดเป็นลูกแสงดิ่งลงช่องที่เลือก ---------- */
LEGEND_FX.stolas = stolasEntrance;
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
