'use strict';
/* =====================================================================
   หน้าจอ: ตัวช่วยวาดการ์ด + หน้าจอการต่อสู้ (สไตล์ Hearthstone)
   ===================================================================== */
const $ = s => document.querySelector(s);

/* ---------- รูปภาพ: ลอง .png → .jpg → .jpeg → .webp ถ้าไม่มีใช้ emoji ---------- */
const ART = {};               // 'cards/moxxie' -> 'png' | false
const ART_EXTS = ['png', 'jpg', 'jpeg', 'webp'];
function artHTML(folder, id, emoji) {
  const k = `${folder}/${id}`;
  const st = ART[k];
  const img = st === false ? '' :
    `<img src="assets/${k}.${st || 'png'}" data-k="${k}" data-i="${st ? 99 : 0}" onload="artOk(this)" onerror="artErr(this)" alt="" draggable="false">`;
  return `<div class="art"><span class="emoji">${emoji || '❔'}</span>${img}</div>`;
}
function artOk(img) { ART[img.dataset.k] = img.src.split('.').pop(); }
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
function kwTooltip(c) {
  return (c.kw || []).map(k => KEYWORDS[k] ? `${KEYWORDS[k].name}: ${KEYWORDS[k].desc}` : '').filter(Boolean).join('\n');
}
function cardHTML(c, o = {}) {
  const cost = o.cost ?? c.cost;
  const costCls = cost < c.cost ? 'cheaper' : cost > c.cost ? 'pricier' : '';
  const tags = c.tags.length ? ' · ' + c.tags.join(' · ') : '';
  const rar = c.rar && c.rar !== 'common' && !c.boss && !c.token ? c.rar : '';
  const tip = kwTooltip(c);
  const textLen = (c.text || '').replace(/<[^>]+>/g, '').length;
  return `<div class="card ${c.type} ${rar ? 'rar-' + rar : ''} ${o.cls || ''}" ${o.attrs || ''} ${tip ? `title="${tip}"` : ''}>
    <div class="cost ${costCls}">${cost}</div>
    ${artHTML('cards', c.id, cardEmoji(c))}
    <div class="cname">${rar === 'legendary' ? '🌟 ' : ''}${c.name}</div>
    <div class="ctype">${TYPE_LABEL[c.type]}${rar ? ' · ' + CARD_RARITY_LABEL[rar] : ''}${tags}</div>
    <div class="ctext ${textLen > 95 ? 'long' : ''}">${c.text || ''}</div>
    ${c.type === 'minion' ? `<div class="atk">${c.atk}</div><div class="hp">${c.hp}</div>` : ''}
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

/* ============================ หน้าจอต่อสู้ ============================ */
const BattleUI = {
  g: null, sel: null, busy: false, logs: [], onOver: null, overFired: false,

  mount(g, onOver) {
    this.g = g; this.onOver = onOver; this.sel = null; this.busy = false; this.logs = []; this.overFired = false;
    g.ui = {
      log: m => this.log(m),
      fx: (t, e, n) => this.fx(t, e, n),
      onPlay: (o, h) => this.onPlay(o, h),
      onTrap: (o, c) => this.onTrap(o, c),
      banner: t => this.banner(t),
    };
    $('#app').innerHTML = `
      <div id="battle">
        <aside class="b-side">
          <div class="b-boss-info"><b>${g.boss.name}</b><small>${g.boss.title} — ${g.boss.desc}</small></div>
          <div class="b-preview" id="bPreview"><div class="hint">ชี้เมาส์ที่การ์ดหรือมินเนี่ยนเพื่อดูรายละเอียด</div></div>
          <div class="b-relics" id="bRelics"></div>
          <div class="b-log" id="bLog"></div>
          <div class="b-help">คลิกการ์ดเพื่อลง • คลิกมินเนี่ยนแล้วคลิกเป้าหมายเพื่อโจมตี • คลิกขวา/Esc ยกเลิก</div>
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
    arena.addEventListener('contextmenu', e => { e.preventDefault(); this.cancel(); });
    $('#battle').addEventListener('mouseover', e => this.onHover(e));
    $('#bConcede').onclick = () => {
      if (this.g.over || !confirm('ยอมแพ้การต่อสู้นี้? (รันจะจบลง)')) return;
      this.g.hero(0).hp = 0; this.g.checkOver(); this.render();
    };
    this.keyHandler = e => { if (e.key === 'Escape') this.cancel(); };
    document.addEventListener('keydown', this.keyHandler);

    g.start();
    this.render();
    this.banner('⚔️ เทิร์นของคุณ');
  },

  unmount() { document.removeEventListener('keydown', this.keyHandler); this.g = null; },

  /* ---------- วาดหน้าจอ ---------- */
  render() {
    const g = this.g;
    if (!g || !$('#bArena')) return;
    const P = g.P(0), E = g.P(1);
    const valid = new Set((this.sel?.valid || []).map(t => t.uid));
    const myTurn = g.current === 0 && !g.over;

    $('#eHand').innerHTML = E.hand.map(() => '<div class="card-back"></div>').join('');
    $('#eHeroRow').innerHTML = this.heroRowHTML(E, valid);
    $('#eBoard').innerHTML = E.board.map(m => this.minionHTML(m, valid)).join('');
    $('#pBoard').innerHTML = P.board.map(m => this.minionHTML(m, valid)).join('');
    $('#pHeroRow').innerHTML = this.heroRowHTML(P, valid);
    $('#pHand').innerHTML = P.hand.map(h => {
      const playable = myTurn && !this.busy && g.canPlay(0, h);
      const cls = [playable ? 'playable' : '', this.sel?.mode === 'play' && this.sel.uid === h.uid ? 'selected' : ''].join(' ');
      return cardHTML(h.card, { cost: g.cost(0, h), cls, attrs: `data-hand="${h.uid}"` });
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
        <div class="meta">🂠 เด็ค ${p.deck.length} &nbsp; ✋ ${p.hand.length}${p.fatigue ? ` &nbsp; Fatigue ${p.fatigue}` : ''}</div>
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
      + (c.deathrattle ? '💀' : '') + (c.onTurnEnd || c.onTurnStart || c.onSpell || c.onFriendlyDeath || c.onAttack ? '⚙️' : '')
      + (m.sleeping && !m.kw.charge && !m.kw.rush && m.owner === g.current ? '💤' : '');
    const atkCls = m.atk > c.atk ? 'buffed' : m.atk < c.atk ? 'debuffed' : '';
    const hpCls = m.hp < m.maxHp ? 'damaged' : m.hp > c.hp ? 'buffed' : '';
    return `<div class="${cls}" data-uid="${m.uid}">
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
      if (h) html = cardHTML(h.card, { cost: g.cost(0, h) }) + this.kwExplain(h.card.kw);
    } else if (trapEl) {
      const h = g.P(0).traps.find(x => x.uid === +trapEl.dataset.trap);
      if (h) html = cardHTML(h.card) + '<p class="note">กับดักนี้ซ่อนอยู่ ศัตรูมองไม่เห็น</p>';
    } else if (entEl) {
      const t = g.findEntity(+entEl.dataset.uid);
      if (t && t.kind === 'minion') {
        const kws = Object.keys(t.kw).filter(k => t.kw[k]);
        html = cardHTML(t.card) + `<p class="note">ตอนนี้: ⚔️ ${t.atk} / ❤️ ${t.hp}/${t.maxHp}${t.frozen ? ' — ❄️ ถูกแช่แข็ง' : ''}${t.owner === 1 ? ' (ศัตรู)' : ''}</p>` + this.kwExplain(kws);
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
  kwExplain(kws) {
    const list = (kws || []).filter(k => KEYWORDS[k]);
    if (!list.length) return '';
    return '<ul class="kw-list">' + list.map(k => `<li><b>${KEYWORDS[k].icon} ${KEYWORDS[k].name}</b> — ${KEYWORDS[k].desc}</li>`).join('') + '</ul>';
  },

  /* ---------- การคลิก ---------- */
  onClick(e) {
    if (e.target.closest('#endTurn')) return this.endTurn();
    const hand = e.target.closest('[data-hand]');
    if (hand) return this.clickHand(+hand.dataset.hand);
    const ent = e.target.closest('[data-uid]');
    if (ent) return this.clickEntity(+ent.dataset.uid);
    this.cancel();
  },
  cancel() { if (this.sel) { this.sel = null; this.render(); } },

  clickHand(uid) {
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
        this.sel = { mode: 'play', uid, valid };
        this.render();
        this.toast(c.type === 'spell' ? `🎯 เลือกเป้าหมายของ ${c.name}` : `🎯 เลือกเป้าหมาย Battlecry ของ ${c.name}`);
        return;
      }
    }
    this.doPlay(uid, null);
  },

  clickEntity(uid) {
    const g = this.g;
    if (this.busy || g.current !== 0 || g.over) return;
    const t = g.findEntity(uid);
    if (!t) return;
    if (this.sel && this.sel.valid.some(v => v.uid === uid)) {
      if (this.sel.mode === 'play') return this.doPlay(this.sel.uid, t);
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

  doPlay(uid, target) {
    this.sel = null;
    this.g.play(0, uid, target);
    this.render();
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
    if (!g.over) {
      g.startTurn(1);
      this.render();
      this.banner(`🔥 เทิร์นของ ${g.boss.name}`);
      await aiTurn(g, this);
      if (this.g !== g) return;
      if (!g.over) {
        g.endTurn(1);
        if (!g.over) { g.startTurn(0); this.banner('⚔️ เทิร์นของคุณ'); }
      }
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
    a.style.transition = 'transform .22s ease-in';
    a.style.transform = `translate(${dx * 0.8}px, ${dy * 0.8}px) scale(1.1)`;
    await sleep(230);
  },

  fx(type, t, n) {
    const el = t && document.querySelector(`[data-uid="${t.uid}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const map = {
      dmg: [`-${n}`, 'f-dmg'], heal: [`+${n}`, 'f-heal'], shield: ['ป้องกัน!', 'f-shield'],
      freeze: ['❄️', 'f-freeze'], armor: [`+${n} 🛡️`, 'f-armor'], death: ['💀', 'f-death'],
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

  onPlay(o, h) {
    if (o !== 1) return;
    const ov = $('#bOverlay');
    if (!ov) return;
    const html = h.card.type === 'trap'
      ? '<div class="card-back big"><span>🪤<br>กับดัก</span></div>'
      : cardHTML(h.card, { cost: this.g.cost(1, h) });
    ov.innerHTML = `<div class="played">${html}</div>`;
    clearTimeout(this.ovT);
    this.ovT = setTimeout(() => { ov.innerHTML = ''; }, 1000);
  },

  onTrap(o, c) {
    this.banner(`🪤 กับดัก: ${c.name}!`);
    const ov = $('#bOverlay');
    if (ov && o === 1) {
      ov.innerHTML = `<div class="played trap-reveal">${cardHTML(c)}</div>`;
      clearTimeout(this.ovT);
      this.ovT = setTimeout(() => { ov.innerHTML = ''; }, 1400);
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

  log(m) {
    this.logs.push(m);
    if (this.logs.length > 80) this.logs.shift();
    const el = $('#bLog');
    if (!el) return;
    el.innerHTML = this.logs.map(x => `<div>${x}</div>`).join('');
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
