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

function textSizeCls(c) {
  const n = stripTags(c.text).length;
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
    <div class="ctext ${textSizeCls(c)}">${c.text || ''}</div>
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

/* ---------- ป๊อปอัปตอนชี้การ์ดค้างไว้: คำอธิบาย + การ์ดคู่หูคอมโบ ----------
   ทุก element ที่มี data-cid ใช้ได้ / data-tip="card" = แสดงภาพการ์ดด้วย (เช่น ประวัติการเล่น) */
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
    const partners = comboPartners(c.id), syn = synergyPartners(c.id);
    // ในสนาม คำอธิบายแสดงอยู่ที่แถบซ้ายแล้ว ป๊อปอัปจึงแสดงเฉพาะคอมโบ
    const gl = !inBattle || withCard ? glossaryHTML(c) : '';
    if (!withCard && !partners.length && !syn.length && !gl) return;
    this.el.innerHTML = `
      ${withCard ? `<div class="tip-main">${cardHTML(c)}</div>` : ''}
      <div class="tip-side">
        ${gl ? `<h4>📘 ความสามารถ</h4>${gl}` : ''}
        ${partners.length ? `<h4>💞 คอมโบกับการ์ดเหล่านี้</h4>
          <div class="tip-combos">${partners.map(id => cardHTML(CARDS[id])).join('')}</div>` : ''}
        ${syn.length ? `<h4>🔗 เล่นคู่กันแล้วเข้ากันดี</h4>
          <div class="tip-combos syn">${syn.map(id => cardHTML(CARDS[id])).join('')}</div>` : ''}
      </div>`;
    this.el.classList.toggle('narrow', !partners.length && !syn.length && !withCard);
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
      banner: t => this.banner(t),
    };
    $('#app').innerHTML = `
      <div id="battle">
        <aside class="b-side">
          <div class="b-boss-info"><b>${g.boss.name}</b><small>${g.boss.title} — ${g.boss.desc}</small></div>
          <div class="b-preview-wrap">
            <div class="b-preview" id="bPreview"><div class="hint">ชี้เมาส์ที่การ์ดหรือมินเนี่ยนเพื่อดูรายละเอียด</div></div>
            <div id="ePlay"></div>
          </div>
          <div class="b-relics" id="bRelics"></div>
          <div class="b-log-head">📜 ประวัติการเล่น <small>(ชี้รายการเพื่อดูการ์ด)</small></div>
          <div class="b-log" id="bLog"></div>
          <div class="b-help">คลิกหรือลากการ์ดเพื่อลง • คลิกมินเนี่ยนแล้วคลิกเป้าหมายเพื่อโจมตี • คลิกขวา/Esc ยกเลิก • ชี้การ์ดค้างไว้เพื่อดูคอมโบ</div>
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
    $('#bConcede').onclick = () => {
      if (this.g.over || !confirm('ยอมแพ้การต่อสู้นี้? (รันจะจบลง)')) return;
      this.g.hero(0).hp = 0; this.g.checkOver(); this.render();
    };
    this.keyHandler = e => { if (e.key === 'Escape') this.cancel(); };
    document.addEventListener('keydown', this.keyHandler);

    g.start();
    this.render();
    if (g.current === 1) {
      this.banner(`🎲 ${g.boss.name} เริ่มก่อน — คุณได้ 🪙 Hell Coin`);
      this.busy = true;
      this.render();
      setTimeout(() => { if (this.g === g) this.enemyPhase(); }, 1600 * SPEEDS[SPEED].k);
    } else {
      this.banner(`🎲 คุณเริ่มก่อน! — ${g.boss.name} ได้ 🪙 Hell Coin`);
    }
  },

  unmount() { document.removeEventListener('keydown', this.keyHandler); this.g = null; CardTip.hide(); },
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
      // ตัวเลขค่าร่ายสีแดง = ยังลงไม่ได้ (เทิร์นศัตรู: เทียบกับมานาที่จะมีในเทิร์นหน้า)
      const blocked = myTurn ? !g.canPlay(0, h) : g.cost(0, h) > Math.min(MAX_MANA, P.maxMana + 1);
      const ready = myTurn && comboReady(g, 0, h.card);
      const cls = [playable ? 'playable' : '', ready ? 'combo-ready' : '', this.sel?.mode === 'play' && this.sel.uid === h.uid ? 'selected' : ''].join(' ');
      return cardHTML(h.card, { cost: g.cost(0, h), bonus: h.bonus, blocked, cls, attrs: `data-hand="${h.uid}"`,
        extra: ready ? '<div class="combo-badge">💞 คอมโบพร้อม!</div>' : '' });
    }).join('');
    $('#pHand').style.setProperty('--n', P.hand.length);

    const btn = $('#endTurn');
    btn.disabled = !myTurn || this.busy;
    btn.textContent = g.over ? 'จบเกม' : myTurn ? 'จบเทิร์น' : 'เทิร์นศัตรู';
    const anyMove = myTurn && (P.hand.some(h => g.canPlay(0, h)) || P.board.some(m => g.canAttack(m)));
    btn.classList.toggle('ready', myTurn && !anyMove);

    $('#bRelics').innerHTML = P.relics.length
      ? P.relics.map(id => relicHTML(RELICS[id], { compact: true })).join('')
      : '<small class="muted">ยังไม่มีสมบัติ</small>';

    if (g.over && !this.overFired) { this.overFired = true; setTimeout(() => this.showResult(), 1100); }
  },

  heroRowHTML(p, valid) {
    const h = p.hero, g = this.g;
    const traps = p.traps.map(t => p.o === 0
      ? `<div class="trap-icon mine" data-trap="${t.uid}">🪤</div>`
      : `<div class="trap-icon">❓</div>`).join('');
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
        <div class="meta">🂠 เด็ค ${p.deck.length} &nbsp; <span class="hand-n ${p.hand.length >= MAX_HAND ? 'full' : p.hand.length >= MAX_HAND - 2 ? 'near' : ''}"
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
    const box = $('#bPreview');
    const handEl = e.target.closest('[data-hand]');
    const entEl = e.target.closest('[data-uid]');
    const trapEl = e.target.closest('[data-trap]');
    const relEl = e.target.closest('.relic');
    let html = '';
    if (handEl) {
      const h = g.P(0).hand.find(x => x.uid === +handEl.dataset.hand);
      if (h) html = cardHTML(h.card, { cost: g.cost(0, h), bonus: h.bonus }) + (comboReady(g, 0, h.card) ? '<p class="note">💞 ลงตอนนี้จะทำคอมโบ!</p>' : '') + glossaryHTML(h.card);
    } else if (trapEl) {
      const h = g.P(0).traps.find(x => x.uid === +trapEl.dataset.trap);
      if (h) html = cardHTML(h.card) + '<p class="note">กับดักนี้ซ่อนอยู่ ศัตรูมองไม่เห็น</p>' + glossaryHTML(h.card);
    } else if (entEl) {
      const t = g.findEntity(+entEl.dataset.uid);
      if (t && t.kind === 'minion') {
        const kws = Object.keys(t.kw).filter(k => t.kw[k]);
        html = cardHTML(t.card) + `<p class="note">ตอนนี้: ⚔️ ${t.atk} / ❤️ ${t.hp}/${t.maxHp}${t.frozen ? ' — ❄️ ถูกแช่แข็ง' : ''}${t.owner === 1 ? ' (ศัตรู)' : ''}</p>` + glossaryHTML(t.card, kws);
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
  clickHand(uid, pos) {
    const g = this.g;
    if (this.busy || g.current !== 0 || g.over) return;
    const h = g.P(0).hand.find(x => x.uid === uid);
    if (!h) return;
    if (this.sel?.mode === 'play' && this.sel.uid === uid) return this.cancel();
    if (!g.canPlay(0, h)) return this.toast(g.whyNot(0, h));
    const c = h.card;
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

  doPlay(uid, target, pos) {
    this.sel = null;
    this.g.play(0, uid, target, pos);
    this.render();
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
    ghost.classList.remove('playable', 'selected', 'combo-ready');
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
    this.clickHand(d.uid, c.type === 'minion' ? d.pos : undefined);
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
  },

  fx(type, t, n) {
    const el = t && document.querySelector(`[data-uid="${t.uid}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const map = {
      dmg: [`-${n}`, 'f-dmg'], heal: [`+${n}`, 'f-heal'], shield: ['ป้องกัน!', 'f-shield'],
      freeze: ['❄️', 'f-freeze'], armor: [`+${n} 🛡️`, 'f-armor'], death: ['💀', 'f-death'], deck: [`🔀 +${n} เด็ค`, 'f-deck'],
    };
    if (!map[type]) return;
    const [txt, cls] = map[type];
    const f = document.createElement('div');
    f.className = `float ${cls}`;
    f.textContent = txt;
    f.style.left = `${r.left + r.width / 2}px`;
    f.style.top = `${r.top + r.height / 2}px`;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1100);
    if (type === 'dmg') { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  },

  onPlay() { /* การ์ดของบอสแสดงล่วงหน้าแล้วใน showEnemyPlay */ },

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
    if (tEl) tEl.classList.add('ai-target');
    await wait(c.type === 'trap' ? 1100 : 1700);
  },
  clearEnemyPlay() {
    const ov = $('#ePlay');
    if (ov && ov.querySelector('.enemy-play')) ov.innerHTML = '';
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
