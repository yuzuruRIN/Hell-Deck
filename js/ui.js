'use strict';
/* =====================================================================
   หน้าจอ: ตัวช่วยวาดการ์ด + หน้าจอการต่อสู้ (สไตล์ Hearthstone)
   ===================================================================== */
const $ = s => document.querySelector(s);

/* ---------- รูปภาพ: ลอง .webp → .png → .jpg → .jpeg ถ้าไม่มีใช้ emoji ---------- */
const ART = {};               // 'cards/moxxie' -> 'webp' | false
const ART_EXTS = ['webp', 'png', 'jpg', 'jpeg'];
function artHTML(folder, id, emoji) {
  const k = `${folder}/${id}`;
  const st = ART[k];
  const img = st === false ? '' :
    `<img src="assets/${k}.${st || ART_EXTS[0]}" data-k="${k}" data-i="${st ? 99 : 0}" onload="artOk(this)" onerror="artErr(this)" alt="" draggable="false">`;
  return `<div class="art"><span class="emoji">${emoji || '❔'}</span>${img}</div>`;
}
// จุดโฟกัสของรูป (แกน y เป็น %) — รูปแนวตั้งมักมีหน้าอยู่ด้านบน จึงเลื่อนกรอบขึ้น
// ปรับรายใบได้ที่ ART_FOCUS ใน data.js เช่น 'cards/blitzo': 10
function artOk(img) {
  const k = img.dataset.k;
  ART[k] = img.src.split('.').pop();
  const focus = typeof ART_FOCUS !== 'undefined' ? ART_FOCUS : {};
  const y = focus[k] ?? (img.naturalHeight > img.naturalWidth * 1.1 ? 22 : 50);
  img.style.objectPosition = `50% ${y}%`;
}
function artErr(img) {
  const i = +img.dataset.i + 1;
  if (i < ART_EXTS.length) { img.dataset.i = i; img.src = `assets/${img.dataset.k}.${ART_EXTS[i]}`; }
  else { ART[img.dataset.k] = false; img.remove(); }
}

function cardEmoji(c) {
  if (c.emoji) return c.emoji;
  if (c.type !== 'minion') return TYPE_EMOJI[c.type];
  return TAG_EMOJI[c.tags[0]] || '😈';
}
/* ---------- ความเร็วแอนิเมชัน (จำไว้ในเบราว์เซอร์) ---------- */
const SPEEDS = { slow: { label: '🐢 ช้า', k: 1.6 }, normal: { label: '▶ ปกติ', k: 1 }, fast: { label: '⏩ เร็ว', k: 0.5 } };
let SPEED = 'normal';
try { const s = localStorage.getItem('hellsdeck_speed'); if (SPEEDS[s]) SPEED = s; } catch (e) { /* ignore */ }
function setSpeed(s) { SPEED = s; try { localStorage.setItem('hellsdeck_speed', s); } catch (e) { /* ignore */ } }
const wait = ms => sleep(ms * SPEEDS[SPEED].k);
const HEAVY_HIT = 5;   // พลังโจมตีตั้งแต่เท่านี้ขึ้นไป ตีแล้วจอสั่นแรง
// จำว่าผู้เล่นพับแถบข้างไว้หรือไม่ (ไม่ส่งค่า = อ่าน)
function sideCollapsed(v) {
  try { if (v === undefined) return localStorage.getItem('hellsdeck_side') === '1'; localStorage.setItem('hellsdeck_side', v ? '1' : '0'); } catch (e) { /* ignore */ }
  return !!v;
}

/* ข้อความคอมโบ (<i>คอมโบ …</i> / ทีม I.M.P.) ไม่แสดงบนหน้าการ์ด — จะเห็นก็ต่อเมื่อชี้การ์ดค้างไว้ */
const COMBO_RE = /(?:^|<br>\s*)<i>(?:คอมโบ|ทีม I\.M\.P\.)[\s\S]*?(?=<br>|$)/g;
function cardFaceText(c) { return (c.text || '').replace(COMBO_RE, '').replace(/^\s*<br>/, ''); }
function comboParts(c) { return ((c.text || '').match(COMBO_RE) || []).map(s => s.replace(/^<br>\s*/, '')); }
// การ์ดที่คอมโบกับใบนี้ได้: คู่หูทั้งสองทาง + สมาชิกทีม I.M.P. คนอื่น (ถ้าเป็นสมาชิก)
function comboCards(c) {
  const ids = new Set(comboPartners(c.id));
  const team = [...IMP_TEAM, 'loona'];
  if (team.includes(c.id)) team.forEach(id => ids.add(id));
  ids.delete(c.id);
  return [...ids].filter(id => CARDS[id]);
}
function comboHTML(c) {
  const parts = comboParts(c), mates = comboCards(c);
  if (!parts.length && !mates.length) return '';
  return `<div class="combo-hint"><h4>💞 คอมโบ</h4>${parts.map(p => `<p>${p}</p>`).join('')}
    ${mates.length ? `<div class="combo-mates-cap">การ์ดที่คอมโบด้วยได้</div><div class="combo-mates">${mates.map(id => cardHTML(CARDS[id])).join('')}</div>` : ''}</div>`;
}
function textSizeCls(c) {
  const n = stripTags(cardFaceText(c)).length;
  return n > 135 ? 'xlong' : n > 90 ? 'long' : '';
}
function cardHTML(c, o = {}) {
  const cost = o.cost ?? c.cost;
  const costCls = (cost < c.cost ? 'cheaper' : cost > c.cost ? 'pricier' : '') + (o.blocked ? ' blocked' : '');
  const tags = c.tags.length ? ' · ' + c.tags.join(' · ') : '';
  const rar = c.rar && c.rar !== 'common' && !c.boss && !c.token ? c.rar : '';
  return `<div class="card ${c.type} ${rar ? 'rar-' + rar : ''} ${o.cls || ''}" data-cid="${c.id}" ${o.attrs || ''}>
    <div class="cost ${costCls}">${cost}</div>
    ${artHTML('cards', c.id, cardEmoji(c))}
    <div class="cname">${rar === 'legendary' ? '🌟 ' : ''}${c.name}</div>
    <div class="ctype">${TYPE_LABEL[c.type]}${rar ? ' · ' + CARD_RARITY_LABEL[rar] : ''}${tags}</div>
    <div class="ctext ${textSizeCls(c)}">${cardFaceText(c)}</div>
    ${c.type === 'minion' ? (b => `<div class="atk ${b.a ? 'buffed' : ''}">${c.atk + (b.a || 0)}</div><div class="hp ${b.h ? 'buffed' : ''}">${c.hp + (b.h || 0)}</div>`)(o.bonus || {}) : ''}
    ${o.extra || ''}
  </div>`;
}
function relicHTML(r, o = {}) {
  return `<div class="relic r-${r.rarity} ${o.cls || ''}" ${o.attrs || ''} title="${r.name} (${RARITY_LABEL[r.rarity]})\n${r.text}">
    ${artHTML('relics', r.id, r.emoji)}
    ${o.compact ? '' : `<div class="r-name">${r.name}</div><div class="r-rar">${RARITY_LABEL[r.rarity]}</div><div class="r-text">${r.text}</div>`}
    ${o.extra || ''}
  </div>`;
}

/* ---------- คำอธิบายความสามารถ ---------- */
function glossaryHTML(c, liveKw = []) {
  const list = glossaryFor(c, liveKw);
  if (!list.length) return '';
  return '<ul class="kw-list">' + list.map(k => `<li><b>${k.icon} ${k.name}</b> — ${k.desc}</li>`).join('') + '</ul>';
}

/* ---------- ที่มาของบัฟ: มินเนี่ยนบนบอร์ดได้พลังมาจากไหน ---------- */
function buffSrcHTML(m) {
  const list = (m && m.buffs || []).filter(b => b.kw || b.a || b.h);
  if (!list.length) return '';
  const sg = v => (v > 0 ? `+${v}` : `${v}`);
  const what = b => b.kw ? `${KEYWORDS[b.kw].icon} ได้ ${KEYWORDS[b.kw].name}`
    : b.a && b.h ? `${sg(b.a)}/${sg(b.h)}` : b.a ? `${sg(b.a)} ⚔️` : `${sg(b.h)} ❤️`;
  return `<div class="buff-src"><h4>📈 ที่มาของพลังที่เปลี่ยนไป</h4><ul>${list.map(b =>
    `<li class="${(b.a < 0 || b.h < 0) ? 'neg' : ''}"><b>${what(b)}</b> <span>จาก ${b.src}</span></li>`).join('')}</ul></div>`;
}
/* ---------- การ์ดที่การ์ดใบนี้สับเข้าเด็ค / สร้างขึ้น ---------- */
function relatedHTML(c) {
  const r = relatedCards(c);
  return (r.shuffle.length ? `<h4>🔀 การ์ดที่จะถูกสับเข้าเด็ค</h4><div class="tip-combos">${r.shuffle.map(id => cardHTML(CARDS[id])).join('')}</div>` : '')
    + (r.make.length ? `<h4>✨ การ์ดที่จะถูกสร้างขึ้น</h4><div class="tip-combos">${r.make.map(id => cardHTML(CARDS[id])).join('')}</div>` : '');
}

/* ---------- ป๊อปอัปตอนชี้การ์ดค้างไว้: คำอธิบาย + การ์ดที่ถูกสับเข้าเด็ค / สร้างขึ้น + ที่มาของบัฟ ----------
   ทุก element ที่มี data-cid ใช้ได้ / data-tip="card" = แสดงภาพการ์ดด้วย (เช่น ประวัติการเล่น)
   ไม่บอกว่าการ์ดไหนคอมโบกับการ์ดไหน — ให้ผู้เล่นค้นพบเองจากข้อความบนการ์ด */
const CardTip = {
  el: null, cur: null, timer: null,
  init() {
    this.el = document.createElement('div');
    this.el.id = 'cardTip';
    document.body.appendChild(this.el);
    document.addEventListener('mouseover', e => this.over(e));
    document.addEventListener('mousedown', () => this.hide());
    document.addEventListener('scroll', () => this.hide(), true);
  },
  over(e) {
    const t = e.target.closest('[data-cid]');
    if (t === this.cur) return;
    this.cur = t;
    clearTimeout(this.timer);
    this.hide();
    if (!t) return;
    this.timer = setTimeout(() => this.show(t), t.dataset.tip === 'card' ? 120 : 450);
  },
  hide() { if (this.el) this.el.classList.remove('show'); },
  show(t) {
    if (this.off || !document.body.contains(t)) return;
    const c = CARDS[t.dataset.cid];
    if (!c) return;
    const withCard = t.dataset.tip === 'card';
    const inBattle = !!t.closest('#battle');
    const rel = relatedHTML(c);
    // ในสนาม คำอธิบายแสดงอยู่ที่แถบซ้ายแล้ว ป๊อปอัปจึงแสดงเฉพาะการ์ดที่เกี่ยวข้อง + ที่มาของบัฟ
    const gl = !inBattle || withCard ? glossaryHTML(c) : '';
    const unitEl = inBattle && t.closest('#bArena .unit');
    const buffs = unitEl && BattleUI.g ? buffSrcHTML(BattleUI.g.findEntity(+unitEl.dataset.uid)) : '';
    const combo = comboHTML(c);
    if (!withCard && !rel && !gl && !buffs && !combo) return;
    this.el.innerHTML = `
      ${withCard ? `<div class="tip-main">${cardHTML(c)}</div>` : ''}
      <div class="tip-side">
        ${combo}
        ${buffs}
        ${gl ? `<h4>📘 ความสามารถ</h4>${gl}` : ''}
        ${rel}
      </div>`;
    this.el.classList.toggle('narrow', !rel && !withCard);
    this.el.classList.add('show');
    const r = t.getBoundingClientRect(), w = this.el.offsetWidth, h = this.el.offsetHeight;
    const vw = innerWidth, vh = innerHeight, gap = 14;
    let x = r.right + gap;
    if (x + w > vw - 8) x = r.left - w - gap;
    if (x < 8) x = Math.max(8, Math.min(vw - w - 8, r.left + r.width / 2 - w / 2));
    let y = Math.max(8, Math.min(vh - h - 8, r.top + r.height / 2 - h / 2));
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
  },
};
window.addEventListener('DOMContentLoaded', () => CardTip.init());

/* ประตูมิติของ Stolas: วงรีแนวตั้ง ข้างในมืดสีเลือดหมู ขอบเป็นไฟฟ้าสีม่วงขาวที่หยักสั่นตลอดเวลา
   (ความหยักมาจาก feTurbulence ที่สุ่ม seed ใหม่ทุก 60ms แล้วบิดเส้นขอบด้วย feDisplacementMap) */
let portalN = 0;
function portalSVG() {
  const n = ++portalN, E = 'cx="50" cy="80" rx="36" ry="70"';
  return `<svg viewBox="-20 -20 140 200" aria-hidden="true">
    <defs>
      <radialGradient id="ptv${n}" cx="50%" cy="58%" r="62%">
        <stop offset="0" stop-color="#5a0a1e"/><stop offset=".5" stop-color="#2a0412"/><stop offset="1" stop-color="#0b0108"/>
      </radialGradient>
      <filter id="ptw${n}" x="-40%" y="-30%" width="180%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency=".09 .05" numOctaves="2" seed="1" result="n">
          <animate attributeName="seed" values="1;7;3;9;5;2;8;4" dur=".48s" calcMode="discrete" repeatCount="indefinite"/>
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="11" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="ptb${n}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <ellipse ${E} fill="none" stroke="#b77dff" stroke-width="20" opacity=".55" filter="url(#ptb${n})"/>
    <g filter="url(#ptw${n})">
      <ellipse ${E} fill="url(#ptv${n})"/>
      <ellipse class="pt-swirl" cx="50" cy="86" rx="22" ry="44" fill="none" stroke="#7a1030" stroke-width="5" opacity=".6"/>
      <ellipse ${E} fill="none" stroke="#8f3dff" stroke-width="10"/>
      <ellipse ${E} fill="none" stroke="#d9a8ff" stroke-width="5"/>
      <ellipse ${E} fill="none" stroke="#fff" stroke-width="2"/>
    </g>
  </svg>`;
}

/* ============================ หน้าจอต่อสู้ ============================ */
const BattleUI = {
  g: null, sel: null, busy: false, logs: [], onOver: null, overFired: false,

  mount(g, onOver) {
    this.g = g; this.onOver = onOver; this.sel = null; this.busy = false; this.logs = []; this.overFired = false;
    g.ui = {
      log: (m, cid) => this.log(m, cid),
      fx: (t, e, n) => this.fx(t, e, n),
      onPlay: (o, h) => this.onPlay(o, h),
      onTrap: (o, c) => this.onTrap(o, c),
      onBurn: (o, h) => this.onBurn(o, h),
      onShuffle: (o, id, n, src) => this.onShuffle(o, id, n, src),
      onRecruit: (o, m) => this.onRecruit(o, m),
      onSteal: m => this.onSteal(m),
      onFatigue: (o, n) => this.onFatigue(o, n),
      onPortal: (o, m, h) => this.onPortal(o, m, h),
      banner: t => this.banner(t),
    };
    $('#app').innerHTML = `
      <div id="battle" class="${sideCollapsed() ? 'side-collapsed' : ''}">
        <aside class="b-side">
          <button class="side-toggle" id="bSideToggle" title="พับ / ขยายแถบรายละเอียด"></button>
          <div class="b-mini" id="bMini"></div>
          <div class="b-boss-info"><b>${g.boss.name}</b><small>${g.boss.title} — ${g.boss.desc}</small></div>
          <div class="b-preview-wrap">
            <div class="b-preview" id="bPreview"><div class="hint">ชี้เมาส์ที่การ์ดหรือมินเนี่ยนเพื่อดูรายละเอียด</div></div>
            <div id="ePlay"></div>
          </div>
          <div class="b-relics" id="bRelics"></div>
          <div class="b-log-head">📜 ประวัติการเล่น <small>(ชี้รายการเพื่อดูการ์ด)</small></div>
          <div class="b-log" id="bLog"></div>
          <div class="b-help">คลิก (หยิบ) หรือลากการ์ดเพื่อลง • คลิกมินเนี่ยนแล้วคลิกเป้าหมายเพื่อโจมตี • คลิกขวา/Esc ยกเลิก • ชี้มินเนี่ยนค้างไว้เพื่อดูว่าได้บัฟมาจากไหน</div>
          <div class="b-speed" id="bSpeed">ความเร็ว: ${Object.entries(SPEEDS).map(([k, v]) => `<button class="btn small ${k === SPEED ? 'primary' : ''}" data-speed="${k}">${v.label}</button>`).join('')}</div>
          <button class="btn small ghost" id="bConcede">🏳️ ยอมแพ้</button>
        </aside>
        <main class="b-arena" id="bArena">
          <div class="row hand enemy" id="eHand"></div>
          <div class="row hero-row enemy" id="eHeroRow"></div>
          <div class="row board enemy" id="eBoard"></div>
          <div class="divider"></div>
          <div class="row board player" id="pBoard"></div>
          <div class="row hero-row player" id="pHeroRow"></div>
          <div class="row hand player" id="pHand"></div>
          <button id="endTurn" class="end-turn">จบเทิร์น</button>
          <div class="deck-pile enemy" id="eDeck"></div>
          <div class="deck-pile player" id="pDeck"></div>
          <div id="bOverlay"></div>
        </main>
      </div>`;
    const arena = $('#bArena');
    arena.addEventListener('click', e => this.onClick(e));
    arena.addEventListener('pointerdown', e => this.dragStart(e));
    arena.addEventListener('contextmenu', e => { e.preventDefault(); this.cancel(); });
    $('#battle').addEventListener('mouseover', e => this.onHover(e));
    $('#bSpeed').onclick = e => {
      const s = e.target.closest('[data-speed]')?.dataset.speed;
      if (!s) return;
      setSpeed(s);
      document.querySelectorAll('#bSpeed [data-speed]').forEach(b => b.classList.toggle('primary', b.dataset.speed === s));
    };
    $('#bSideToggle').onclick = () => {
      const on = !$('#battle').classList.contains('side-collapsed');
      $('#battle').classList.toggle('side-collapsed', on);
      sideCollapsed(on);
      CardTip.hide();
    };
    $('#bConcede').onclick = () => {
      if (this.g.over || !confirm('ยอมแพ้การต่อสู้นี้? (รันจะจบลง)')) return;
      this.g.hero(0).hp = 0; this.g.checkOver(); this.render();
    };
    this.keyHandler = e => { if (e.key === 'Escape') { this.endCarry(null); this.cancel(); } };
    this.enterAt = {};
    this.handAt = null; this.eHandAt = null; this.lastDrawAt = 0; this.lastRecruitAt = 0; this.trapAt = [[], []];
    document.addEventListener('keydown', this.keyHandler);

    this.busy = true;
    // ถ้าเริ่มเกมพัง (เช่น การ์ดเสียในเด็ค) อย่าปล่อยหน้าจอว่าง — บันทึก error แล้วเล่นต่อจากสถานะที่มี
    try { g.start(); } catch (err) { console.error('เริ่มเกมไม่สำเร็จ', err); if (g.turnCount === 0) g.startTurn(g.first ?? 0); }
    this.render();
    // อินโทร VS → โยนเหรียญ → เริ่มเทิร์นแรก
    $('#bArena').classList.add('pregame');   // ซ่อนมือไว้ระหว่างอินโทร แล้วค่อยแจกการ์ด
    playIntro(this).catch(e => console.error(e)).then(async () => {
      if (this.g !== g) return;
      await this.dealOpening();
      if (this.g !== g) return;
      if (g.current === 1) this.enemyPhase();
      else { this.busy = false; this.render(); this.banner('⚔️ เทิร์นของคุณ'); }
    });
  },

  unmount() { document.removeEventListener('keydown', this.keyHandler); this.endCarry(null); this.hideDeckTip(); this.g = null; CardTip.hide(); },
  wait(ms) { return wait(ms); },

  /* ---------- วาดหน้าจอ ---------- */
  render() {
    const g = this.g;
    if (!g || !$('#bArena')) return;
    const P = g.P(0), E = g.P(1);
    const valid = new Set((this.sel?.valid || []).map(t => t.uid));
    const myTurn = g.current === 0 && !g.over;

    $('#eHand').innerHTML = E.hand.map(() => '<div class="card-back"></div>').join('')
      + `<span class="hand-count ${E.hand.length >= MAX_HAND ? 'full' : ''}">✋ ${E.hand.length}/${MAX_HAND}</span>`;
    $('#eHeroRow').innerHTML = this.heroRowHTML(E, valid);
    $('#eBoard').innerHTML = E.board.map(m => this.minionHTML(m, valid)).join('');
    $('#pBoard').innerHTML = P.board.map(m => this.minionHTML(m, valid)).join('');
    $('#pHeroRow').innerHTML = this.heroRowHTML(P, valid);
    $('#pHand').innerHTML = P.hand.map(h => {
      const playable = myTurn && !this.busy && g.canPlay(0, h);
      const cost = g.cost(0, h);
      // ตัวเลขค่าร่ายสีแดง = มานาไม่พอ เท่านั้น (เทิร์นศัตรู: เทียบกับมานาที่จะมีในเทิร์นหน้า)
      const blocked = cost > (myTurn ? P.mana : Math.min(MAX_MANA, P.maxMana + 1));
      // มานาพอแต่ลงไม่ได้ด้วยเหตุผลอื่น (ไม่มีเป้า / บอร์ดเต็ม / กับดักซ้ำ) → การ์ดสีเทา + บอกเหตุผล
      const why = myTurn && !blocked ? g.whyNot(0, h) : '';
      const ready = myTurn ? readyKind(g, 0, h.card) : '';
      const cls = [playable ? 'playable' : '', why ? 'noplay' : '', ready ? `combo-ready ready-${ready}` : '', this.sel?.mode === 'play' && this.sel.uid === h.uid ? 'selected' : ''].join(' ');
      return cardHTML(h.card, { cost, bonus: h.bonus, blocked, cls, attrs: `data-hand="${h.uid}"`,
        extra: (ready === 'combo' ? '<div class="combo-badge">💞 คอมโบพร้อม!</div>' : ready === 'cond' ? '<div class="combo-badge cond">✨ เงื่อนไขครบ!</div>' : '') + (why ? `<div class="noplay-tag">🚫 ${why.split(' (')[0]}</div>` : '') });
    }).join('');
    $('#pHand').style.setProperty('--n', P.hand.length);
    this.animateDraws(P, E);
    this.animateSteals();
    this.flushFx();
    $('#eDeck').innerHTML = this.deckPileHTML(E);
    $('#pDeck').innerHTML = this.deckPileHTML(P);
    // มินเนี่ยนที่เพิ่งลง: เล่นเอฟเฟคหย่อนลงบอร์ด (ต่อเนื่องแม้ถูกวาดใหม่ระหว่างแอนิเมชัน)
    const now = performance.now(), DROP = 520 * SPEEDS[SPEED].k;
    document.querySelectorAll('#pBoard .unit, #eBoard .unit').forEach(el => {
      const u = +el.dataset.uid;
      if (this.enterAt[u] == null) this.enterAt[u] = now;
      const t = now - this.enterAt[u];
      if (t < DROP) { el.classList.add('enter'); el.style.setProperty('--drop', `${DROP}ms`); el.style.animationDelay = `${-t}ms`; }
    });

    const btn = $('#endTurn');
    btn.disabled = !myTurn || this.busy;
    btn.textContent = g.over ? 'จบเกม' : myTurn ? 'จบเทิร์น' : 'เทิร์นศัตรู';
    const anyMove = myTurn && (P.hand.some(h => g.canPlay(0, h)) || P.board.some(m => g.canAttack(m)));
    btn.classList.toggle('ready', myTurn && !anyMove);

    $('#bRelics').innerHTML = P.relics.length
      ? P.relics.map(id => relicHTML(RELICS[id], { compact: true })).join('')
      : '<small class="muted">ยังไม่มีสมบัติ</small>';

    // ลูกศรเล็งเป้า: ตามเมาส์ระหว่างเลือกเป้าของเวท/Battlecry หรือเลือกเป้าโจมตี
    const sel = this.sel;
    if (sel && !this.busy) Aim.start(() => document.querySelector(sel.mode === 'play' ? `#pHand [data-hand="${sel.uid}"]` : `#bArena [data-uid="${sel.uid}"]`));
    else if (Aim.live) Aim.stop();
    if (g.over && !this.overFired) {
      this.overFired = true;
      this.busy = true;
      (async () => {
        await wait(450);
        const row = $(g.winner === 0 ? '#eHeroRow' : '#pHeroRow');
        if (row) await shatterHero(row);
        if (this.g === g) this.showResult();
      })();
    }
  },

  heroRowHTML(p, valid) {
    const h = p.hero, g = this.g;
    const ta = this.trapAt[p.o];
    if (ta.length > p.traps.length) ta.length = p.traps.length;
    const now = performance.now();
    const trapCls = i => { const t = ta[i]; if (t == null || now - t > 900) return ''; return `trap-new" style="animation-delay:${Math.round(t - now)}ms`; };
    const traps = p.traps.map((t, i) => p.o === 0
      ? `<div class="trap-icon mine ${trapCls(i)}" data-trap="${t.uid}">🪤</div>`
      : `<div class="trap-icon ${trapCls(i)}">❓</div>`).join('');
    const crystals = Array.from({ length: MAX_MANA }, (_, i) =>
      `<i class="gem ${i < p.mana ? 'full' : i < p.maxMana ? 'spent' : ''}"></i>`).join('');
    const target = valid.has(h.uid) ? 'targetable' : '';
    return `
      <div class="traps">${traps}</div>
      <div class="hero ${target} ${h.hp <= 0 ? 'dead' : ''}" data-uid="${h.uid}">
        ${artHTML(p.portrait.folder, p.portrait.id, p.portrait.emoji)}
        <div class="h-name">${p.name}</div>
        <div class="h-hp ${h.hp < h.maxHp ? 'damaged' : ''}">${h.hp}</div>
        ${h.armor ? `<div class="h-armor">${h.armor}</div>` : ''}
      </div>
      <div class="h-stats">
        <div class="mana-txt">💎 ${p.mana}/${p.maxMana}</div>
        <div class="gems">${crystals}</div>
        <div class="meta"><span class="hand-n ${p.hand.length >= MAX_HAND ? 'full' : p.hand.length >= MAX_HAND - 2 ? 'near' : ''}"
          title="ถือการ์ดได้สูงสุด ${MAX_HAND} ใบ — ใบที่จั่วเกินจะถูกเผาทิ้ง">✋ ${p.hand.length}/${MAX_HAND}</span>${p.fatigue ? ` &nbsp; Fatigue ${p.fatigue}` : ''}${p.burned ? ` &nbsp; 🔥 เผาแล้ว ${p.burned}` : ''}</div>
        ${p.o === 0 && p.hand.length >= MAX_HAND ? '<div class="hand-warn">🔥 มือเต็ม! ใบที่จั่วต่อไปจะถูกเผา</div>' : ''}
        ${p.o === 0 && p.shuffled ? `<div class="meta" title="จำนวนการ์ดที่คุณสับเข้าเด็คในเกมนี้ (ใช้กับ Stolas's Prophecy)">🔀 สับแล้ว ${p.shuffled}</div>` : ''}
        ${p.o === 0 && p.deaths ? `<div class="meta" title="จำนวนมินเนี่ยนฝ่ายเราที่ตายในเกมนี้ (ใช้กับคอมโบของ Satan)">☠️ ตายแล้ว ${p.deaths}</div>` : ''}
      </div>`;
  },

  minionHTML(m, valid) {
    const g = this.g;
    const c = m.card;
    const cls = ['unit',
      m.kw.taunt ? 'taunt' : '', m.kw.shield ? 'shielded' : '', m.frozen ? 'frozen' : '',
      m.owner === 0 && !this.busy && g.canAttack(m) ? 'can-attack' : '',
      this.sel?.mode === 'attack' && this.sel.uid === m.uid ? 'selected' : '',
      valid.has(m.uid) ? 'targetable' : ''].join(' ');
    const icons = Object.keys(m.kw).filter(k => m.kw[k] && KEYWORDS[k] && k !== 'taunt' && k !== 'shield').map(k => KEYWORDS[k].icon).join('')
      + (c.deathrattle ? '💀' : '') + (c.onTurnEnd || c.onTurnStart || c.onSpell || c.onFriendlyDeath || c.onAttack || c.onShuffle ? '⚙️' : '')
      + (m.sleeping && !m.kw.charge && !m.kw.rush && m.owner === g.current ? '💤' : '');
    const atkCls = m.atk > c.atk ? 'buffed' : m.atk < c.atk ? 'debuffed' : '';
    const hpCls = m.hp < m.maxHp ? 'damaged' : m.hp > c.hp ? 'buffed' : '';
    return `<div class="${cls}" data-uid="${m.uid}" data-cid="${m.id}">
      ${artHTML('cards', m.id, cardEmoji(c))}
      ${m.kw.windfury ? (d => `<i class="wf" style="--wd:${d}ms"><b></b><b></b><b></b></i>`)(-Math.round(performance.now() % 100000)) : ''}
      <div class="m-icons">${icons}</div>
      <div class="m-name">${m.name}</div>
      <div class="m-atk ${atkCls}">${m.atk}</div>
      <div class="m-hp ${hpCls}">${m.hp}</div>
    </div>`;
  },

  /* ---------- พรีวิวการ์ด ---------- */
  onHover(e) {
    const g = this.g;
    if (!g) return;
    const pile = e.target.closest('[data-deck]');
    if (pile) this.showDeckTip(pile, g.P(+pile.dataset.deck)); else this.hideDeckTip();
    const box = $('#bPreview');
    const handEl = e.target.closest('[data-hand]');
    const entEl = e.target.closest('[data-uid]');
    const trapEl = e.target.closest('[data-trap]');
    const relEl = e.target.closest('.relic');
    let html = '';
    if (handEl) {
      const h = g.P(0).hand.find(x => x.uid === +handEl.dataset.hand);
      if (h) html = cardHTML(h.card, { cost: g.cost(0, h), bonus: h.bonus }) + comboHTML(h.card) + ({ combo: '<p class="note">💞 ลงตอนนี้จะทำคอมโบ!</p>', cond: '<p class="note">✨ เงื่อนไขครบ — ลงตอนนี้ได้โบนัส!</p>' }[readyKind(g, 0, h.card)] || '') + glossaryHTML(h.card);
    } else if (trapEl) {
      const h = g.P(0).traps.find(x => x.uid === +trapEl.dataset.trap);
      if (h) html = cardHTML(h.card) + '<p class="note">กับดักนี้ซ่อนอยู่ ศัตรูมองไม่เห็น</p>' + glossaryHTML(h.card);
    } else if (entEl) {
      const t = g.findEntity(+entEl.dataset.uid);
      if (t && t.kind === 'minion') {
        const kws = Object.keys(t.kw).filter(k => t.kw[k]);
        html = cardHTML(t.card) + comboHTML(t.card) + `<p class="note">ตอนนี้: ⚔️ ${t.atk} / ❤️ ${t.hp}/${t.maxHp}${t.frozen ? ' — ❄️ ถูกแช่แข็ง' : ''}${t.owner === 1 ? ' (ศัตรู)' : ''}</p>` + buffSrcHTML(t) + glossaryHTML(t.card, kws);
      } else if (t) {
        const p = g.P(t.owner);
        html = `<div class="hero-preview">${artHTML(p.portrait.folder, p.portrait.id, p.portrait.emoji)}<b>${p.name}</b>
          <p>❤️ ${t.hp}/${t.maxHp}${t.armor ? ` 🛡️ ${t.armor}` : ''}</p>
          <p>กับดักที่วางอยู่: ${p.traps.length}</p>
          ${t.owner === 1 ? `<p class="note">${g.boss.desc}</p>` : ''}</div>`;
      }
    } else if (relEl && relEl.title) {
      html = `<div class="note pre">${relEl.title}</div>`;
    }
    if (html) box.innerHTML = html;
  },

  /* ---------- การคลิก ---------- */
  onClick(e) {
    if (this.noClickUntil > Date.now()) return;   // คลิกที่ตามหลังการลากการ์ด
    if (e.target.closest('#endTurn')) return this.endTurn();
    const hand = e.target.closest('[data-hand]');
    if (hand) return this.clickHand(+hand.dataset.hand);
    const ent = e.target.closest('[data-uid]');
    if (ent) return this.clickEntity(+ent.dataset.uid);
    this.cancel();
  },
  cancel() { if (this.sel) { this.sel = null; this.render(); } },

  // pos = ตำแหน่งที่จะวางมินเนี่ยน (มาจากการลาก)
  clickHand(uid, pos, fromDrop) {
    const g = this.g;
    if (this.busy || g.current !== 0 || g.over) return;
    const h = g.P(0).hand.find(x => x.uid === uid);
    if (!h) return;
    if (this.sel?.mode === 'play' && this.sel.uid === uid) return this.cancel();
    if (!g.canPlay(0, h)) return this.toast(g.whyNot(0, h));
    const c = h.card;
    // คลิกมินเนี่ยน (ไม่ได้ลาก) = หยิบการ์ดติดเมาส์ แล้วคลิกบนบอร์ดเพื่อเลือกช่องที่จะลง
    if (c.type === 'minion' && !fromDrop) return this.startCarry(uid);
    if (c.target) {
      const valid = g.validTargets(0, c.target, c.targetFilter);
      if (valid.length) {
        this.sel = { mode: 'play', uid, valid, pos };
        this.render();
        this.toast(c.type === 'spell' ? `🎯 เลือกเป้าหมายของ ${c.name}` : `🎯 เลือกเป้าหมาย Battlecry ของ ${c.name}`);
        return;
      }
    }
    this.doPlay(uid, null, pos);
  },

  clickEntity(uid) {
    const g = this.g;
    if (this.busy || g.current !== 0 || g.over) return;
    const t = g.findEntity(uid);
    if (!t) return;
    if (this.sel && this.sel.valid.some(v => v.uid === uid)) {
      if (this.sel.mode === 'play') return this.doPlay(this.sel.uid, t, this.sel.pos);
      return this.doAttack(this.sel.m, t);
    }
    if (t.kind === 'minion' && t.owner === 0) {
      if (this.sel?.mode === 'attack' && this.sel.uid === uid) return this.cancel();
      const why = g.attackBlock(t);
      if (!why) { this.sel = { mode: 'attack', m: t, uid, valid: g.attackTargets(t) }; this.render(); return; }
      this.toast(why);
    }
    this.cancel();
  },

  async doPlay(uid, target, pos) {
    const g = this.g;
    this.sel = null;
    const h = g.P(0).hand.find(x => x.uid === uid);
    // การ์ดตำนานที่มีแอนิเมชันเปิดตัว: เล่นก่อน แล้วค่อยลงสนาม
    if (h && LEGEND_FX[h.card.id] && g.canPlay(0, h)) {
      this.busy = true; this.render();
      await playEntrance(h.card, 0, { pos, uid });
      if (this.g !== g) return;
      this.busy = false;
    }
    g.play(0, uid, target, pos);
    this.render();
  },
  // ลูกศรของบอส: ชี้จาก a ไป b สักครู่
  async aim(a, b, ms = 650) {
    const ea = a && document.querySelector(`#bArena [data-uid="${a.uid}"]`), eb = b && document.querySelector(`#bArena [data-uid="${b.uid}"]`);
    if (!ea || !eb) return;
    Aim.pin(ea, eb);
    await wait(ms);
    Aim.stop();
  },

  /* ---------- ลากการ์ดจากมือ ----------
     มินเนี่ยน: ลากไปวางบนบอร์ดตำแหน่งที่ต้องการ (มีช่องสีทองบอกตำแหน่ง)
     เวทที่ต้องเลือกเป้า: ปล่อยบนเป้าหมายได้เลย / การ์ดอื่น: ปล่อยที่ไหนก็ได้เหนือแถวการ์ดในมือ
     ลากกลับลงมาที่มือ = ยกเลิก • ยังคลิกเพื่อลงการ์ดได้เหมือนเดิม */
  dragStart(e) {
    const g = this.g;
    const el = e.target.closest('[data-hand]');
    if (!el || e.button !== 0 || this.busy || g.current !== 0 || g.over) return;
    const uid = +el.dataset.hand;
    const sx = e.clientX, sy = e.clientY;
    let d = null;
    const move = ev => {
      if (!d) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 10) return;
        d = this.beginDrag(el, uid, ev);
        if (!d) return end();
      }
      this.dragMove(d, ev);
    };
    const end = ev => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      if (d) { this.noClickUntil = Date.now() + 300; this.dragEnd(d, ev); }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  },
  beginDrag(el, uid, ev) {
    const g = this.g, h = g.P(0).hand.find(x => x.uid === uid);
    if (!h) return null;
    if (!g.canPlay(0, h)) { this.toast(g.whyNot(0, h)); return null; }
    this.sel = null;
    const r = el.getBoundingClientRect();
    const ghost = el.cloneNode(true);
    ghost.classList.remove('playable', 'selected', 'combo-ready', 'drawn', 'popped', 'noplay');
    ghost.style.animationDelay = '';
    ghost.classList.add('drag-ghost');
    ghost.style.fontSize = getComputedStyle(el).fontSize;
    document.body.appendChild(ghost);
    el.classList.add('drag-src');
    CardTip.hide(); CardTip.off = true;
    // จุดกึ่งกลางของมินเนี่ยนบนบอร์ด (วัดครั้งเดียวตอนเริ่มลาก ไม่ให้ช่องวางกระตุก)
    const centers = [...document.querySelectorAll('#pBoard .unit')].map(u => { const b = u.getBoundingClientRect(); return b.left + b.width / 2; });
    const handTop = $('#pHand').getBoundingClientRect().top;
    const d = { uid, h, el, ghost, centers, handTop, w: r.width, hgt: r.height, pos: null, over: null };
    this.dragMove(d, ev);
    return d;
  },
  // หยิบการ์ดติดเมาส์ (คลิกแทนการลาก): ขยับเมาส์เพื่อเลือกช่อง • คลิกบนบอร์ด = ลง • คลิกที่มือ/คลิกขวา/Esc = ยกเลิก
  startCarry(uid) {
    const el = document.querySelector(`#pHand [data-hand="${uid}"]`);
    const d = el && this.beginDrag(el, uid, { clientX: Aim.mx, clientY: Aim.my });
    if (!d) return;
    d.ghost.classList.add('carry');
    const move = ev => this.dragMove(d, ev);
    const down = ev => {
      ev.preventDefault(); ev.stopPropagation();
      this.noClickUntil = Date.now() + 350;
      this.endCarry(ev.button === 2 ? null : ev);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerdown', down, true);
    this.carry = { d, off: () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', down, true); } };
  },
  endCarry(ev) {
    const c = this.carry;
    if (!c) return;
    this.carry = null;
    c.off();
    this.dragEnd(c.d, ev);
  },

  dragMove(d, ev) {
    d.ghost.style.left = `${ev.clientX - d.w / 2}px`;
    d.ghost.style.top = `${ev.clientY - d.hgt * 0.35}px`;
    const inHand = ev.clientY > d.handTop;
    d.ghost.classList.toggle('cancel', inHand);
    const c = d.h.card;
    document.querySelectorAll('.drop-over').forEach(x => x.classList.remove('drop-over'));
    $('#pBoard .drop-slot')?.remove();
    d.over = null;
    if (inHand) { d.pos = null; return; }
    if (c.type === 'minion') {
      if (this.g.P(0).board.length >= MAX_BOARD) return;
      d.pos = d.centers.filter(x => x < ev.clientX).length;
      const slot = document.createElement('div');
      slot.className = 'drop-slot';
      const units = $('#pBoard').querySelectorAll('.unit');
      $('#pBoard').insertBefore(slot, units[d.pos] || null);
    } else if (c.target) {
      d.ghost.style.visibility = 'hidden';
      const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('#bArena [data-uid]');
      d.ghost.style.visibility = '';
      const valid = this.g.validTargets(0, c.target, c.targetFilter);
      if (t && valid.some(v => v.uid === +t.dataset.uid)) { t.classList.add('drop-over'); d.over = +t.dataset.uid; }
    }
  },
  dragEnd(d, ev) {
    d.ghost.remove();
    d.el.classList.remove('drag-src');
    document.querySelectorAll('.drop-over').forEach(x => x.classList.remove('drop-over'));
    $('#pBoard .drop-slot')?.remove();
    CardTip.off = false;
    if (!ev || ev.type === 'pointercancel' || ev.clientY > d.handTop) return this.render();   // ลากกลับมือ = ยกเลิก
    const c = d.h.card;
    if (c.type !== 'minion' && c.target && d.over != null) return this.doPlay(d.uid, this.g.findEntity(d.over));
    this.clickHand(d.uid, c.type === 'minion' ? d.pos : undefined, true);
  },

  async doAttack(m, t) {
    this.sel = null;
    this.busy = true;
    this.render();
    await this.animateAttack(m, t);
    this.g.attack(m, t);
    this.busy = false;
    this.render();
  },

  async endTurn() {
    const g = this.g;
    if (this.busy || g.current !== 0 || g.over) return;
    this.sel = null;
    this.busy = true;
    g.endTurn(0);
    this.render();
    if (!g.over) { g.startTurn(1); await this.enemyPhase(); return; }
    this.busy = false;
    this.render();
  },
  // เทิร์นของบอส (startTurn(1) ถูกเรียกไปแล้ว)
  async enemyPhase() {
    const g = this.g;
    this.busy = true;
    this.render();
    this.banner(`🔥 เทิร์นของ ${g.boss.name}`);
    await aiTurn(g, this);
    if (this.g !== g) return;
    if (!g.over) {
      g.endTurn(1);
      if (!g.over) { g.startTurn(0); this.banner('⚔️ เทิร์นของคุณ'); }
    }
    this.busy = false;
    this.render();
  },

  /* ---------- เอฟเฟคภาพ ---------- */
  async animateAttack(m, t) {
    const a = document.querySelector(`[data-uid="${m.uid}"]`), b = document.querySelector(`[data-uid="${t.uid}"]`);
    if (!a || !b) return;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const dx = (rb.left + rb.width / 2) - (ra.left + ra.width / 2);
    const dy = (rb.top + rb.height / 2) - (ra.top + ra.height / 2);
    a.style.zIndex = 50;
    const ms = Math.round(420 * SPEEDS[SPEED].k);
    a.style.transition = `transform ${ms}ms ease-in`;
    a.style.transform = `translate(${dx * 0.8}px, ${dy * 0.8}px) scale(1.1)`;
    await sleep(ms + 20);
    if ((m.atk || 0) >= HEAVY_HIT) this.heavyHit(b, m.atk);
  },
  // ตัวที่พลังโจมตีสูง (5+) ตีแล้วจอสั่นแรงขึ้นเล็กน้อย + วงกระแทกที่เป้า (8+ แรงขึ้นอีกขั้น)
  heavyHit(target, atk) {
    const arena = $('#bArena');
    if (!arena) return;
    const mega = atk >= 8;
    arena.classList.remove('heavy-hit', 'mega');
    void arena.offsetWidth;
    arena.classList.add('heavy-hit');
    if (mega) arena.classList.add('mega');
    const r = target.getBoundingClientRect();
    const ring = document.createElement('div');
    ring.className = `impact-ring${mega ? ' mega' : ''}`;
    Object.assign(ring.style, { left: `${r.left + r.width / 2}px`, top: `${r.top + r.height / 2}px`, width: `${r.width * 1.3}px`, height: `${r.width * 1.3}px` });
    document.body.appendChild(ring);
    setTimeout(() => { ring.remove(); arena.classList.remove('heavy-hit', 'mega'); }, 520);
  },

  fx(type, t, n) {
    if (!t) return;
    const el = document.querySelector(`#bArena [data-uid="${t.uid}"]`);
    if (!el) {
      // มินเนี่ยนที่เพิ่งลง (ยังไม่ถูกวาด) — เก็บไว้เล่นหลังวาดเสร็จ
      if (type === 'buff' || type === 'heal') (this.pendingFx = this.pendingFx || []).push({ type, uid: t.uid, n, at: performance.now() });
      return;
    }
    this.fxOn(el, type, n);
  },
  flushFx() {
    if (!this.pendingFx || !this.pendingFx.length) return;
    const now = performance.now(), left = [];
    for (const p of this.pendingFx) {
      if (now - p.at > 1500) continue;
      const el = document.querySelector(`#bArena [data-uid="${p.uid}"]`);
      if (el) this.fxOn(el, p.type, p.n); else left.push(p);
    }
    this.pendingFx = left;
  },
  // อนุภาคลอยขึ้น (ฮีล = กากบาทสีเขียว / บัฟ = ลูกศรสีทอง / ดีบัฟ = ลูกศรลงสีแดง)
  particles(el, kind) {
    const r = el.getBoundingClientRect(), k = SPEEDS[SPEED].k;
    const sym = { heal: '✚', buff: '▲', debuff: '▼' }[kind];
    for (let i = 0; i < 9; i++) {
      const p = document.createElement('div');
      p.className = `ptc ptc-${kind}`;
      p.textContent = sym;
      p.style.left = `${r.left + r.width * (.12 + Math.random() * .76)}px`;
      p.style.top = `${r.top + r.height * (.45 + Math.random() * .45)}px`;
      p.style.fontSize = `${10 + Math.random() * 10}px`;
      p.style.animationDelay = `${Math.random() * 280 * k}ms`;
      p.style.animationDuration = `${900 * k}ms`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1300 * k);
    }
    const glow = document.createElement('div');
    glow.className = `glow-ring glow-${kind}`;
    Object.assign(glow.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, animationDuration: `${800 * k}ms` });
    document.body.appendChild(glow);
    setTimeout(() => glow.remove(), 850 * k);
  },
  fxOn(el, type, n) {
    const r = el.getBoundingClientRect();
    if (type === 'buff') {
      const a = (n && n.a) || 0, h = (n && n.h) || 0;
      if (!a && !h) return;
      const neg = a < 0 || h < 0, sg = v => (v > 0 ? `+${v}` : `${v}`);
      this.particles(el, neg ? 'debuff' : 'buff');
      const txt = a && h ? `${sg(a)}/${sg(h)}` : a ? `${sg(a)} ⚔️` : `${sg(h)} ❤️`;
      return this.floatText(r, txt, neg ? 'f-debuff' : 'f-buff');
    }
    if (type === 'heal') this.particles(el, 'heal');
    const map = {
      dmg: [`-${n}`, 'f-dmg'], heal: [`+${n}`, 'f-heal'], shield: ['ป้องกัน!', 'f-shield'],
      freeze: ['❄️', 'f-freeze'], armor: [`+${n} 🛡️`, 'f-armor'], death: ['💀', 'f-death'], deck: [`🔀 +${n} เด็ค`, 'f-deck'],
    };
    if (!map[type]) return;
    const [txt, cls] = map[type];
    if (type === 'death') this.dyingGhost(el, r);
    this.floatText(r, txt, cls);
    if (type === 'dmg') { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  },
  floatText(r, txt, cls) {
    const f = document.createElement('div');
    f.className = `float ${cls}`;
    f.textContent = txt;
    f.style.left = `${r.left + r.width / 2}px`;
    f.style.top = `${r.top + r.height / 2}px`;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1100);
  },

  // สำเนาของมินเนี่ยนที่ตาย ค้างไว้เล่นเอฟเฟค สั่น → ดำ → หายไป
  dyingGhost(el, r) {
    const gh = el.cloneNode(true);
    ['data-uid', 'data-cid'].forEach(a => gh.removeAttribute(a));
    gh.classList.remove('can-attack', 'selected', 'targetable', 'enter', 'shake', 'ai-target');
    gh.classList.add('dying');
    Object.assign(gh.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`,
      margin: '0', transform: 'none', animationDelay: '0ms', fontSize: getComputedStyle(el).fontSize, zIndex: 60, pointerEvents: 'none' });
    gh.style.setProperty('--die', `${950 * SPEEDS[SPEED].k}ms`);
    document.body.appendChild(gh);
    setTimeout(() => gh.remove(), 1000 * SPEEDS[SPEED].k);
  },

  // แจกมือเริ่มต้น: ทั้งสองฝ่ายจั่วการ์ดจากกองเด็คขึ้นมือทีละใบพร้อมกัน
  async dealOpening() {
    const g = this.g, k = SPEEDS[SPEED].k, now = performance.now(), GAP = 210 * k;
    this.handAt = {};
    g.P(0).hand.forEach((h, i) => { this.handAt[h.uid] = { t: now + i * GAP, from: h.id === 'hell_coin' ? 'pop' : 'deck' }; });
    this.eHandAt = g.P(1).hand.map((_, i) => ({ t: now + i * GAP, from: 'deck' }));
    this.lastDrawAt = now + Math.max(g.P(0).hand.length, g.P(1).hand.length) * GAP;
    $('#bArena')?.classList.remove('pregame');
    this.render();
    await wait(Math.max(g.P(0).hand.length, g.P(1).hand.length) * 210 + 450);
  },

  /* ---------- การ์ดเข้ามือ: บินจากกองเด็ค (จั่ว) หรือเด้งขึ้นที่ช่อง (ได้มาจากเอฟเฟค) ----------
     จำเวลาเริ่มของแต่ละใบไว้ ให้แอนิเมชันเล่นต่อเนื่องแม้หน้าจอถูกวาดใหม่ระหว่างทาง
     จั่วหลายใบพร้อมกันจะทยอยมาทีละใบ */
  animateDraws(P, E) {
    const k = SPEEDS[SPEED].k, now = performance.now(), DUR = 620 * k, GAP = 190 * k;
    const first = !this.handAt;
    if (first) { this.handAt = {}; this.eHandAt = []; }
    const slot = (t) => { const s = Math.max(now, this.lastDrawAt + GAP); this.lastDrawAt = s; return s; };
    const play = (el, info, pile) => {
      const el0 = now - info.t;
      if (el0 >= DUR) return;
      if (info.from === 'portal') el.classList.add('portaled');
      else if (info.from === 'deck' && pile) {
        const pr = pile.getBoundingClientRect(), r = el.getBoundingClientRect();
        el.style.setProperty('--fx', `${pr.left + pr.width / 2 - (r.left + r.width / 2)}px`);
        el.style.setProperty('--fy', `${pr.top + pr.height / 2 - (r.top + r.height / 2)}px`);
        el.classList.add('drawn');
      } else el.classList.add('popped');
      el.style.setProperty('--dur', `${DUR}ms`);
      el.style.animationDelay = `${-el0}ms`;
    };
    // มือเรา
    const myPile = $('#pDeck .pile');
    document.querySelectorAll('#pHand .card').forEach(el => {
      const uid = +el.dataset.hand;
      if (!this.handAt[uid]) {
        const h = P.hand.find(x => x.uid === uid);
        this.handAt[uid] = first ? { t: -1e9 } : { t: slot(), from: h && h.from };
      }
      play(el, this.handAt[uid], myPile);
    });
    // มือบอส (การ์ดคว่ำ): ใบที่เพิ่มขึ้นมาใหม่บินจากกองเด็คบอส
    const backs = [...document.querySelectorAll('#eHand .card-back')];
    while (this.eHandAt.length < backs.length) this.eHandAt.push(first ? { t: -1e9 } : { t: slot(), from: 'deck' });
    this.eHandAt.length = backs.length;
    const ePile = $('#eDeck .pile');
    backs.forEach((el, i) => play(el, this.eHandAt[i], ePile));
  },

  /* ---------- สับการ์ดเข้าเด็ค: การ์ดโผล่ขึ้นมา แล้วบินเข้ากองเด็คของเจ้าของ ---------- */
  onShuffle(o, id, n, src) {
    const holder = $(o === 0 ? '#pDeck' : '#eDeck'), arena = $('#bArena');
    if (!holder || !arena || !CARDS[id]) return;
    const pileEl = holder.querySelector('.pile') || holder;
    let from = null;
    if (typeof src === 'number') from = document.querySelector(`#bArena [data-uid="${src}"]`)?.getBoundingClientRect();
    else if (src === 'hand0' || src === 'hand1') from = $(src === 'hand0' ? '#pHand' : '#eHand').getBoundingClientRect();
    if (!from) { const a = arena.getBoundingClientRect(); from = { left: a.left + a.width / 2 - 1, top: a.top + a.height * (o === 0 ? .55 : .35) - 1, width: 2, height: 2 }; }
    const k = SPEEDS[SPEED].k, count = Math.min(n, 4);
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.flyCard(CARDS[id], from, pileEl, holder, i, count), i * 170 * k);
    }
  },
  flyCard(card, from, pileEl, holder, i, count) {
    if (!document.body.contains(holder)) return;
    const k = SPEEDS[SPEED].k;
    const el = document.createElement('div');
    el.className = 'fly-card';
    el.innerHTML = cardHTML(card);
    document.body.appendChild(el);
    const to = (holder.querySelector('.pile') || pileEl).getBoundingClientRect();
    const fx = from.left + from.width / 2 + (i - (count - 1) / 2) * 34, fy = from.top + from.height / 2;
    const tx = to.left + to.width / 2, ty = to.top + to.height / 2;
    const at = (x, y, s, r = 0) => `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s}) rotate(${r}deg)`;
    const anim = el.animate([
      { transform: at(fx, fy, .5), opacity: 0 },
      { transform: at(fx, fy - 40, 1), opacity: 1, offset: .22 },
      { transform: at(fx, fy - 40, 1), opacity: 1, offset: .5 },
      { transform: at(tx, ty, .22, 12), opacity: .35 },
    ], { duration: 1150 * k, easing: 'cubic-bezier(.45,0,.35,1)', fill: 'forwards' });
    anim.onfinish = () => {
      el.remove();
      holder.classList.remove('bump'); void holder.offsetWidth; holder.classList.add('bump');
    };
  },

  /* ---------- กองเด็ค ---------- */
  deckPileHTML(p) {
    const n = p.deck.length, layers = Math.min(6, Math.ceil(n / 4));
    const backs = Array.from({ length: layers }, (_, i) => `<i style="--i:${i}"></i>`).join('');
    return `<div class="pile ${n ? '' : 'empty'}" data-deck="${p.o}" title="">
        ${backs}<span class="pile-n">${n}</span>
      </div>
      <small>${n ? 'เด็ค' : `เด็คหมด! ${p.fatigue ? `Fatigue ${p.fatigue}` : ''}`}</small>`;
  },
  showDeckTip(pile, p) {
    let tip = $('#deckTip');
    if (!tip) { tip = document.createElement('div'); tip.id = 'deckTip'; document.body.appendChild(tip); }
    if (tip.dataset.o !== String(p.o) || tip.dataset.n !== String(p.deck.length) || !tip.classList.contains('show')) {
      const cnt = {};
      p.deck.forEach(h => { cnt[h.id] = (cnt[h.id] || 0) + 1; });
      const ids = Object.keys(cnt).sort((a, b) => CARDS[a].cost - CARDS[b].cost || CARDS[a].name.localeCompare(CARDS[b].name));
      tip.innerHTML = `<h4>🂠 เด็คของ ${p.name} — เหลือ ${p.deck.length} ใบ</h4>
        <p class="muted">เรียงตามค่าร่าย (ไม่ใช่ลำดับที่จะจั่ว)</p>
        ${ids.length ? `<div class="deck-tip-grid">${ids.map(id => cardHTML(CARDS[id], { extra: cnt[id] > 1 ? `<div class="count">×${cnt[id]}</div>` : '' })).join('')}</div>`
          : '<p>เด็คหมดแล้ว — จั่วครั้งต่อไปจะโดน Fatigue</p>'}`;
      tip.dataset.o = p.o; tip.dataset.n = p.deck.length;
    }
    tip.classList.add('show');
    const r = pile.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = `${Math.max(8, r.left - w - 14)}px`;
    tip.style.top = `${Math.max(8, Math.min(innerHeight - h - 8, r.top + r.height / 2 - h / 2))}px`;
  },
  hideDeckTip() { const t = $('#deckTip'); if (t) t.classList.remove('show'); },

  /* ---------- มินเนี่ยนถูกควบคุม: ลอยข้ามจากบอร์ดฝั่งเดิมไปบอร์ดฝั่งใหม่ ---------- */
  onSteal(m) {
    const el = document.querySelector(`#bArena [data-uid="${m.uid}"]`);
    if (!el) return;
    (this.moving = this.moving || {})[m.uid] = { from: el.getBoundingClientRect(), t: performance.now() };
    // หัวใจลอยขึ้นจากตำแหน่งเดิม
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('div');
      p.className = 'ptc ptc-charm';
      p.textContent = '💘';
      p.style.left = `${r.left + r.width * (.15 + Math.random() * .7)}px`;
      p.style.top = `${r.top + r.height * (.3 + Math.random() * .5)}px`;
      p.style.animationDelay = `${Math.random() * 250}ms`;
      p.style.animationDuration = `${900 * SPEEDS[SPEED].k}ms`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1300 * SPEEDS[SPEED].k);
    }
  },
  animateSteals() {
    if (!this.moving) return;
    const k = SPEEDS[SPEED].k, DUR = 1000 * k, now = performance.now();
    for (const [uid, mv] of Object.entries(this.moving)) {
      const el0 = now - mv.t;
      if (el0 >= DUR) { delete this.moving[uid]; continue; }
      const el = document.querySelector(`#bArena [data-uid="${uid}"]`);
      if (!el) continue;
      el.classList.remove('enter');
      const r = el.getBoundingClientRect();
      const dx = mv.from.left - r.left, dy = mv.from.top - r.top;
      const a = el.animate([
        { transform: `translate(${dx}px, ${dy}px)`, filter: 'drop-shadow(0 0 0 #ff4fa3)' },
        { transform: `translate(${dx * .55}px, ${dy * .55}px) scale(1.18) rotate(-8deg)`, filter: 'drop-shadow(0 0 18px #ff4fa3) brightness(1.3)', offset: .35 },
        { transform: `translate(${dx * .1}px, ${dy * .1}px) scale(1.12) rotate(6deg)`, filter: 'drop-shadow(0 0 14px #ff4fa3)', offset: .75 },
        { transform: 'none', filter: 'none' },
      ], { duration: DUR, easing: 'cubic-bezier(.45,0,.3,1)', fill: 'both' });
      a.currentTime = el0;
      el.style.zIndex = 40;
    }
  },

  // วางกับดัก: การ์ดพลิกคว่ำแล้วบินไปเข้าช่องกับดักหน้าฮีโร่
  onPlay(o, h) {
    if (h.card.type !== 'trap') return;
    const k = SPEEDS[SPEED].k, row = $(o === 0 ? '#pHeroRow .traps' : '#eHeroRow .traps');
    const src = o === 0 ? document.querySelector(`#pHand [data-hand="${h.uid}"]`) : ([...document.querySelectorAll('#eHand .card-back')].pop() || $('#eHand'));
    if (!row || !src) return;
    const fr = src.getBoundingClientRect(), tr = row.getBoundingClientRect();
    const to = { left: tr.right - 30, top: tr.top + tr.height / 2 - 14, width: 28, height: 28 };
    const dur = 900 * k;
    flyBetween(o === 0 ? cardHTML(h.card) : null, fr, to, { dur, faceDownEnd: true, endScale: .16 });
    this.trapAt[o].push(performance.now() + dur * .85);
    setTimeout(() => this.render(), dur * .86);
  },

  // เรียกจากเด็ค: การ์ดพุ่งออกจากกองเด็คไปยังช่องบนบอร์ด แล้วมินเนี่ยนค่อยหย่อนลง
  onRecruit(o, m) {
    const g = this.g, pile = $(o === 0 ? '#pDeck .pile' : '#eDeck .pile');
    if (!pile) return;
    const k = SPEEDS[SPEED].k, now = performance.now();
    const before = g.mins(o).slice(0, g.mins(o).indexOf(m)).filter(x => document.querySelector(`#bArena [data-uid="${x.uid}"]`)).length;
    const land = landingPoint(o, before);
    if (!land) return;
    const start = Math.max(now, this.lastRecruitAt + 260 * k);
    this.lastRecruitAt = start;
    const dur = 720 * k;
    flyBetween(cardHTML(m.card), pile.getBoundingClientRect(),
      { left: land.x - land.w / 2, top: land.y - land.h / 2, width: land.w, height: land.h },
      { dur, delay: start - now, faceDownStart: true, endScale: .55, lift: 50 });
    this.enterAt[m.uid] = start + dur * .82;
  },

  // แสดงการ์ดที่บอสกำลังจะเล่น (ก่อนเอฟเฟคทำงาน) พร้อมชี้เป้าหมาย
  async showEnemyPlay(h, target) {
    const ov = $('#ePlay');
    if (!ov) return;
    const c = h.card, g = this.g;
    const html = c.type === 'trap'
      ? '<div class="card-back big"><span>🪤<br>กับดัก</span></div>'
      : cardHTML(c, { cost: g.cost(1, h) });
    const tName = target && c.type !== 'trap' ? ` → 🎯 ${target.name}` : '';
    ov.innerHTML = `<div class="played enemy-play"><div class="played-cap">🔴 ${g.boss.name} ใช้${c.type === 'trap' ? 'กับดัก' : ''}${tName}</div>${html}</div>`;
    clearTimeout(this.ovT);
    const tEl = target && document.querySelector(`#bArena [data-uid="${target.uid}"]`);
    if (tEl) { tEl.classList.add('ai-target'); Aim.pin($('#eHeroRow .hero'), tEl); }
    await wait(c.type === 'trap' ? 1100 : 1700);
  },
  clearEnemyPlay() {
    const ov = $('#ePlay');
    if (ov && ov.querySelector('.enemy-play')) ov.innerHTML = '';
    Aim.stop();
  },

  /* ---------- จั่วตอนเด็คหมด: การ์ดหัวกะโหลกบินจากกองเด็คไปที่ฮีโร่ แล้วฟันเป็นรอยกรงเล็บ ----------
     จั่วหลายครั้งติดกันจะทยอยเล่นทีละใบ */
  onFatigue(o, n) {
    if (!$('#bArena')) return;
    const k = SPEEDS[SPEED].k, now = performance.now();
    const start = Math.max(now + 150 * k, (this.fatigueAt || 0) + 1100 * k);
    this.fatigueAt = start;
    setTimeout(() => this.playFatigue(o, n), start - now);
  },
  async playFatigue(o, n) {
    const g = this.g, k = SPEEDS[SPEED].k;
    const pile = $(o === 0 ? '#pDeck .pile' : '#eDeck .pile'), hero = $(o === 0 ? '#pHeroRow .hero' : '#eHeroRow .hero');
    if (!g || !pile || !hero) return;
    const hr = hero.getBoundingClientRect(), dur = 760 * k;
    const show = { left: hr.left + hr.width / 2 - 60, top: hr.top + hr.height / 2 - 90, width: 120, height: 180 };
    flyBetween(cardHTML(CARDS.fatigue_card, { cls: 'fatigue-card' }), pile.getBoundingClientRect(), show,
      { dur, faceDownStart: true, endScale: .75, lift: 70 });
    await sleep(dur * .92);
    if (this.g !== g) return;
    const h2 = $(o === 0 ? '#pHeroRow .hero' : '#eHeroRow .hero');
    if (!h2) return;
    const r = h2.getBoundingClientRect();
    const sl = document.createElement('div');
    sl.className = 'slash-fx';
    Object.assign(sl.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    sl.style.setProperty('--dur', `${520 * k}ms`);
    sl.innerHTML = '<i></i><i></i><i></i>';
    document.body.appendChild(sl);
    setTimeout(() => sl.remove(), 900 * k);
    h2.classList.remove('shake', 'slashed'); void h2.offsetWidth; h2.classList.add('shake', 'slashed');
    this.floatText(r, `💀 -${n}`, 'f-dmg f-fatigue');
  },

  /* ---------- Stolas: ประตูมิติเปิดตรงตัวมินเนี่ยน แล้วการ์ดลอยออกจากประตูไปเข้ามือ ----------
     การ์ดในมือถูกซ่อนไว้จนกว่าการ์ดที่ลอยมาจะถึง ฝั่งบอสลอยออกมาแบบคว่ำหน้า (ไม่เปิดเผยการ์ด)
     หลายประตูพร้อมกันจะทยอยเปิดทีละอัน */
  onPortal(o, m, h) {
    if (!$('#bArena')) return;
    const k = SPEEDS[SPEED].k, now = performance.now();
    const OPEN = 650 * k, FLY = 820 * k;
    const start = Math.max(now, (this.portalAt || 0) + 600 * k);
    this.portalAt = start;
    const arrive = start + OPEN + FLY * .85;
    if (o === 0) { if (this.handAt) this.handAt[h.uid] = { t: arrive, from: 'portal' }; }
    else if (this.eHandAt) this.eHandAt.push({ t: arrive, from: 'portal' });
    this.lastDrawAt = Math.max(this.lastDrawAt || 0, arrive);   // การ์ดที่จั่วต่อจากนี้รอให้ใบนี้ถึงมือก่อน
    const r = document.querySelector(`#bArena [data-uid="${m.uid}"]`)?.getBoundingClientRect();
    setTimeout(() => this.playPortal(o, m, h, OPEN, FLY, r), start - now);
  },
  async playPortal(o, m, h, OPEN, FLY, r0) {
    const g = this.g;
    if (!g || !$('#bArena')) return;
    const r = document.querySelector(`#bArena [data-uid="${m.uid}"]`)?.getBoundingClientRect() || r0;
    if (!r) return;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const p = document.createElement('div');
    p.className = 'portal-fx';
    // ประตูวงรีแนวตั้งสูงกว่าตัวมินเนี่ยน ขอบล่างอยู่ราวเท้า
    const ph = Math.round(r.height * 1.55), pw = Math.round(ph * .6);
    Object.assign(p.style, { left: `${cx}px`, top: `${cy - r.height * .18}px`, width: `${pw}px`, height: `${ph}px` });
    p.style.setProperty('--open', `${OPEN}ms`);
    p.style.setProperty('--r', `${Math.round(ph / 2)}px`);
    p.innerHTML = portalSVG() + '<i class="flash"></i>'
      + Array.from({ length: 12 }, () => `<b style="--a:${Math.round(Math.random() * 360)}deg;--d:${(.35 + Math.random() * .5).toFixed(2)};--t:${Math.round(Math.random() * 900)}ms"></b>`).join('');
    document.body.appendChild(p);
    await sleep(OPEN);
    if (this.g !== g) { p.remove(); return; }
    const to = o === 0 ? document.querySelector(`#pHand [data-hand="${h.uid}"]`) : [...document.querySelectorAll('#eHand .card-back')].pop();
    const tr = (to || $(o === 0 ? '#pHand' : '#eHand')).getBoundingClientRect();
    p.classList.add('emit');
    flyBetween(o === 0 ? cardHTML(h.card) : null, { left: cx - 15, top: cy - 22, width: 30, height: 44 }, tr,
      { dur: FLY, endScale: Math.max(.4, Math.min(1, tr.width / 121)), lift: 70 });
    await sleep(FLY * .45);
    p.classList.add('closing');
    setTimeout(() => p.remove(), 450 * SPEEDS[SPEED].k);
  },

  // การ์ดล้นมือ: แสดงการ์ดใบนั้นไหม้หายไปใกล้มือของเจ้าของ
  onBurn(o, h) {
    if (!$('#bArena')) return;
    const el = document.createElement('div');
    el.className = `burn-fx ${o === 0 ? 'mine' : 'theirs'}`;
    el.style.setProperty('--dur', `${2.2 * SPEEDS[SPEED].k}s`);
    const n = document.querySelectorAll('.burn-fx').length;
    el.style.setProperty('--off', `${n * 4}em`);
    el.innerHTML = `<div class="burn-cap">🔥 มือเต็ม! เผาทิ้ง</div>${cardHTML(h.card)}<div class="burn-flame"></div>`;
    $('#bArena').appendChild(el);
    setTimeout(() => el.remove(), 2300 * SPEEDS[SPEED].k);
  },

  onTrap(o, c) {
    this.banner(`🪤 กับดัก: ${c.name}!`);
    const ov = $('#ePlay');
    if (ov && o === 1) {
      ov.innerHTML = `<div class="played trap-reveal"><div class="played-cap">🪤 กับดักของ ${this.g.boss.name} ทำงาน!</div>${cardHTML(c)}</div>`;
      clearTimeout(this.ovT);
      this.ovT = setTimeout(() => { if (ov.querySelector('.trap-reveal')) ov.innerHTML = ''; }, 2400 * SPEEDS[SPEED].k);
    }
  },

  banner(text) {
    const arena = $('#bArena');
    if (!arena) return;
    const b = document.createElement('div');
    b.className = 'banner';
    b.textContent = text;
    arena.appendChild(b);
    setTimeout(() => b.remove(), 1500);
  },

  toast(text) {
    if (!text) return;
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => t.classList.remove('show'), 1600);
  },

  log(m, cid) {
    this.logs.push({ m, cid: cid && CARDS[cid] ? cid : null });
    if (this.logs.length > 80) this.logs.shift();
    const el = $('#bLog');
    if (!el) return;
    el.innerHTML = this.logs.map(x => x.cid
      ? `<div class="log-entry has-card" data-cid="${x.cid}" data-tip="card">${x.m}</div>`
      : `<div class="log-entry">${x.m}</div>`).join('');
    el.scrollTop = el.scrollHeight;
    // แถบย่อ (ตอนพับแถบข้าง): 10 รายการล่าสุดที่มีการ์ด เป็นรูปการ์ดเล็ก ๆ ชี้ค้างเพื่อดูการ์ดเต็ม — ล่าสุดอยู่บน
    const mini = $('#bMini');
    if (mini) mini.innerHTML = this.logs.filter(x => x.cid).slice(-10).reverse().map(x => {
      const c = CARDS[x.cid], foe = /^🔴|🪤 กับดักของ/.test(x.m) || x.m.includes(this.g?.boss?.name);
      return `<div class="mini-entry ${foe ? 'foe' : ''}" data-cid="${x.cid}" data-tip="card" title="${stripTags(x.m).replace(/"/g, '&quot;')}">
        ${artHTML('cards', c.id, cardEmoji(c))}<span class="mini-cost">${c.cost}</span></div>`;
    }).join('');
  },

  showResult() {
    const g = this.g;
    if (!g) return;
    const win = g.winner === 0;
    const ov = $('#bOverlay');
    ov.innerHTML = `<div class="result ${win ? 'win' : 'lose'}">
      <h1>${win ? '🏆 ชนะ!' : '💀 พ่ายแพ้'}</h1>
      <p>${win ? `คุณเอาชนะ ${g.boss.name} ได้แล้ว` : `${g.boss.name} เอาชนะคุณได้...`}</p>
      <button class="btn primary big" id="bResultOk">${win ? 'รับรางวัล' : 'ดูผลลัพธ์'}</button>
    </div>`;
    $('#bResultOk').onclick = () => { const w = g.winner; this.unmount(); this.onOver(w); };
  },
};
