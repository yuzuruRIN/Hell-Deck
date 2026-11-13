'use strict';
/* =====================================================================
   ระบบการต่อสู้ (กฎเกม) — ไม่ยุ่งกับหน้าจอ; หน้าจอฟังผ่าน g.ui.*
   ผู้เล่น = owner 0, บอส = owner 1
   ===================================================================== */
let UID = 1;
const MAX_BOARD = 7, MAX_HAND = 10, MAX_TRAPS = 5, MAX_MANA = 10;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rnd = a => (a && a.length ? a[Math.floor(Math.random() * a.length)] : null);
const sample = (a, n) => shuffle([...a]).slice(0, n);

class Game {
  constructor(cfg) {
    this.ui = {};
    this.boss = cfg.boss;
    this.turnCount = 0;
    this.current = 0;
    this.over = false;
    this.winner = null;
    this.halfDone = false;
    const mkP = (o, d, deckIds, bonusMana) => ({
      o, name: d.name, portrait: d.portrait,
      hero: { kind: 'hero', uid: UID++, owner: o, name: d.name, hp: d.hp, maxHp: d.hp, armor: 0 },
      deck: shuffle(deckIds.map(id => this.mkCard(id))),
      hand: [], board: [], traps: [],
      mana: 0, maxMana: bonusMana || 0, fatigue: 0,
      relics: d.relics || [], spellsThisTurn: 0,
      deaths: 0, spellsCast: 0, bonus: d.bonus || {},
      shuffled: 0, played: [],
    });
    const b = cfg.boss;
    this.players = [
      mkP(0, cfg.player, cfg.player.deck, 0),
      mkP(1, { name: b.name, hp: b.hp, portrait: { folder: 'bosses', id: b.id, emoji: b.emoji } }, expandDeck(b.deck), b.bonusMana),
    ];
  }

  /* ---------------- ทางลัด ---------------- */
  mkCard(id, costDelta = 0, bonus = null) { return { uid: UID++, id, card: CARDS[id], costDelta, bonus }; }
  // บัฟที่ติดมากับการ์ด (เช่น สำเนาที่ถูกสับเข้าเด็คพร้อม +1/+1)
  applyBonus(m, h) {
    if (!m || !h || !h.bonus) return;
    m.atk += h.bonus.a || 0; m.hp += h.bonus.h || 0; m.maxHp += h.bonus.h || 0;
    m.bonus = { a: h.bonus.a || 0, h: h.bonus.h || 0 };
  }
  P(o) { return this.players[o]; }
  opp(o) { return 1 - o; }
  hero(o) { return this.players[o].hero; }
  mins(o) { return this.players[o].board; }
  allMins() { return [...this.players[0].board, ...this.players[1].board]; }
  enemies(o) { return [...this.mins(this.opp(o)), this.hero(this.opp(o))]; }
  has(o, relicId) { return this.players[o].relics.includes(relicId); }
  onBoard(o, id) { return this.mins(o).some(m => m.id === id); }
  countTag(o, tag) { return this.mins(o).filter(m => m.tags.includes(tag)).length; }
  randomEnemy(o) { return rnd(this.enemies(o).filter(t => this.alive(t))); }
  sd(o, n) { return n + (this.has(o, 'r_pistol') ? 1 : 0); }
  alive(t) {
    if (!t) return false;
    if (t.kind === 'hero') return t.hp > 0;
    return t.hp > 0 && !t.destroyed && this.mins(t.owner).includes(t);
  }
  findEntity(uid) {
    for (const p of this.players) {
      if (p.hero.uid === uid) return p.hero;
      const m = p.board.find(x => x.uid === uid);
      if (m) return m;
    }
    return null;
  }
  log(m, cid) { this.ui.log && this.ui.log(m, cid); }
  fx(type, t, n) { this.ui.fx && this.ui.fx(type, t, n); }
  banner(t) { this.ui.banner && this.ui.banner(t); }
  combo(label) { this.log(`✨ คอมโบ: ${label}`); this.banner(label); }

  /* ---------------- เริ่มเกม / เทิร์น ---------------- */
  start() {
    const pb = this.P(0).bonus;
    this.draw(0, 3 + (this.has(0, 'r_grimoire') ? 2 : 0) + (pb.draw || 0));
    this.draw(1, 4);
    for (const o of [0, 1]) {
      const p = this.P(o);
      p.maxMana += p.bonus.mana || 0;
      p.hero.armor += p.bonus.armor || 0;
      if (this.has(o, 'r_coin')) p.maxMana += 1;
      if (this.has(o, 'r_crystal')) p.maxMana += 3;
      if (this.has(o, 'r_vest')) p.hero.armor += 8;
      if (this.has(o, 'r_kit')) this.addHand(o, rnd(POOL_TRAPS));
      if (this.has(o, 'r_crown')) { this.summon(o, 'p_guard'); this.summon(o, 'p_guard'); }
    }
    this.startTurn(0);
  }

  startTurn(o) {
    this.current = o;
    this.turnCount++;
    const p = this.P(o);
    p.maxMana = Math.min(MAX_MANA, p.maxMana + 1);
    p.mana = p.maxMana;
    p.spellsThisTurn = 0;
    p.board.forEach(m => { m.sleeping = false; m.attacks = m.kw.windfury ? 2 : 1; });
    this.draw(o, 1);
    p.board.slice().forEach(m => { if (this.alive(m) && m.card.onTurnStart) m.card.onTurnStart(this, o, m); });
    if (this.has(o, 'r_bullets')) { const t = this.randomEnemy(o); if (t) this.dmg(t, 1, null); }
    this.cleanup();
  }

  endTurn(o) {
    const p = this.P(o);
    p.board.slice().forEach(m => { if (this.alive(m) && m.card.onTurnEnd) m.card.onTurnEnd(this, o, m); });
    this.cleanup();
    p.board.forEach(m => { if (m.frozen && m.frozenTurn < this.turnCount) m.frozen = false; });
  }

  /* ---------------- การ์ดในมือ ---------------- */
  draw(o, n = 1) {
    const p = this.P(o);
    for (let i = 0; i < n; i++) {
      if (!p.deck.length) {
        p.fatigue++;
        this.log(`💀 ${p.name} การ์ดหมดเด็ค! โดน Fatigue ${p.fatigue} ดาเมจ`);
        this.dmg(p.hero, p.fatigue, null);
        continue;
      }
      const h = p.deck.shift();
      // การ์ด "เมื่อจั่ว" ทำงานทันที แล้วจั่วใบใหม่แทน
      if (h.card.castOnDraw) {
        this.log(`⚡ ${p.name} จั่วได้ ${h.card.name}!`, h.id);
        this.banner(`${h.card.emoji || '⚡'} ${h.card.name}!`);
        h.card.onDraw(this, o, h);
        this.draw(o, 1);
        continue;
      }
      if (p.hand.length >= MAX_HAND) { this.log(`🔥 มือเต็ม! ${h.card.name} ถูกเผาทิ้ง`, h.id); continue; }
      p.hand.push(h);
    }
  }

  addHand(o, id, costDelta = 0) {
    if (!id) return;
    const p = this.P(o);
    if (p.hand.length >= MAX_HAND) return;
    p.hand.push(this.mkCard(id, costDelta));
  }

  cost(o, h) {
    const c = h.card;
    let v = c.cost + (h.costDelta || 0);
    if (this.has(o, 'r_goldcard')) v -= 2;
    if (c.type === 'trap' && this.has(o, 'r_kit')) v -= 1;
    if (c.type === 'spell' && this.has(o, 'r_feather') && this.P(o).spellsThisTurn === 0) v -= 1;
    return Math.max(0, v);
  }

  validTargets(o, spec, filter) {
    const e = this.opp(o);
    let r = [];
    switch (spec) {
      case 'any': r = [...this.allMins(), this.hero(0), this.hero(1)]; break;
      case 'enemyAny': r = [...this.mins(e), this.hero(e)]; break;
      case 'minion': r = this.allMins(); break;
      case 'enemyMinion': r = [...this.mins(e)]; break;
      case 'friendlyMinion': r = [...this.mins(o)]; break;
    }
    if (filter) r = r.filter(t => filter(this, t));
    return r;
  }

  whyNot(o, h) {
    const p = this.P(o), c = h.card;
    if (this.current !== o) return 'ยังไม่ใช่เทิร์นของคุณ';
    if (this.cost(o, h) > p.mana) return 'มานาไม่พอ';
    if (c.type === 'minion' && p.board.length >= MAX_BOARD) return 'บอร์ดเต็มแล้ว (สูงสุด 7 ตัว)';
    if (c.type === 'spell' && c.target && !this.validTargets(o, c.target, c.targetFilter).length) return 'ไม่มีเป้าหมายที่ใช้ได้';
    if (c.type === 'trap' && p.traps.length >= MAX_TRAPS) return 'วางกับดักได้สูงสุด 5 ใบ';
    if (c.type === 'trap' && p.traps.some(x => x.id === c.id)) return 'มีกับดักใบนี้วางอยู่แล้ว';
    return '';
  }
  canPlay(o, h) { return !this.over && this.whyNot(o, h) === ''; }

  play(o, uid, target) {
    const p = this.P(o);
    const i = p.hand.findIndex(h => h.uid === uid);
    if (i < 0) return false;
    const h = p.hand[i], c = h.card;
    if (!this.canPlay(o, h)) return false;
    const cost = this.cost(o, h);
    p.hand.splice(i, 1);
    p.mana -= cost;
    if (!c.token) p.played.push(c.id);
    const hidden = c.type === 'trap' && o === 1;
    this.log(`${o === 0 ? '🟢' : '🔴'} ${p.name} ใช้ ${hidden ? 'กับดัก' : c.name}${!hidden && target ? ` → ${target.name}` : ''}`, hidden ? null : c.id);
    this.ui.onPlay && this.ui.onPlay(o, h);

    if (c.type === 'minion') {
      const m = this.summon(o, c.id);
      this.applyBonus(m, h);
      if (m && c.battlecry) c.battlecry(this, o, target, m);
      this.cleanup();
      if (m && !this.over && this.alive(m)) { this.fireTraps(this.opp(o), 'play_minion', { minion: m }); this.cleanup(); }
    } else if (c.type === 'spell') {
      p.spellsThisTurn++;
      p.spellsCast++;
      const ev = { card: c, caster: o, cancel: false };
      this.fireTraps(this.opp(o), 'spell', ev);
      if (ev.cancel) {
        this.log(`🚫 ${c.name} ถูกยกเลิก!`, c.id);
      } else {
        c.cast(this, o, target);
        this.cleanup();
        if (this.has(o, 'r_echo') && !this.over) {
          let t2 = target;
          if (c.target && !this.alive(t2)) t2 = rnd(this.validTargets(o, c.target, c.targetFilter));
          if (!c.target || t2) { this.log(`🎤 Echo! ${c.name} ร่ายซ้ำ`, c.id); c.cast(this, o, t2); this.cleanup(); }
        }
        this.mins(o).slice().forEach(m => { if (this.alive(m) && m.card.onSpell) m.card.onSpell(this, o, m); });
      }
    } else {
      p.traps.push(h);
    }
    this.cleanup();
    return true;
  }

  /* ---------------- การโจมตี ---------------- */
  canAttack(m) {
    return this.attackBlock(m) === '';
  }
  attackBlock(m) {
    if (this.over || this.current !== m.owner) return 'ยังไม่ใช่เทิร์นของคุณ';
    if (m.frozen) return 'ถูกแช่แข็งอยู่ ❄️';
    if (m.atk <= 0) return 'ไม่มีพลังโจมตี';
    if (m.attacks <= 0) return 'โจมตีไปแล้วในเทิร์นนี้';
    if (m.sleeping && !m.kw.charge && !m.kw.rush) return 'เพิ่งลงสนาม ต้องรอเทิร์นหน้า 💤';
    if (!this.attackTargets(m).length) return 'ไม่มีเป้าหมายที่โจมตีได้';
    return '';
  }
  attackTargets(m) {
    const e = this.opp(m.owner);
    const ms = [...this.mins(e)];
    const taunts = ms.filter(x => x.kw.taunt);
    if (taunts.length) return taunts;
    const r = ms;
    if (!m.sleeping || m.kw.charge) r.push(this.hero(e));
    return r;
  }
  attack(m, t) {
    if (!this.canAttack(m) || !this.attackTargets(m).includes(t)) return false;
    m.attacks--;
    const ev = { attacker: m, target: t, cancel: false };
    this.fireTraps(this.opp(m.owner), 'attack', ev);
    if (ev.cancel || !this.alive(m) || !this.alive(ev.target)) { this.cleanup(); return true; }
    t = ev.target;
    this.log(`⚔️ ${m.name} โจมตี ${t.name}`, m.id);
    const a = m.atk, d = t.kind === 'minion' ? t.atk : 0;
    this.dmg(t, a, m);
    if (t.kind === 'minion' && d > 0) this.dmg(m, d, t);
    if (m.card.onAttack && this.alive(m)) m.card.onAttack(this, m.owner, m, t);
    this.cleanup();
    return true;
  }

  /* ---------------- เอฟเฟคพื้นฐาน ---------------- */
  dmg(t, n, src) {
    if (!t || n <= 0) return 0;
    if (t.kind === 'minion') {
      if (!this.alive(t)) return 0;
      if (t.kw.shield) { t.kw.shield = false; this.fx('shield', t); return 0; }
      t.hp -= n;
    } else {
      const a = Math.min(t.armor, n);
      t.armor -= a;
      t.hp -= (n - a);
    }
    this.fx('dmg', t, n);
    if (src && src.kind === 'minion') {
      if (src.kw.poison && t.kind === 'minion') t.destroyed = true;
      if (src.kw.freezer) this.freeze(t);
      if (src.kw.lifesteal) this.heal(this.hero(src.owner), n);
    }
    return n;
  }
  spellDmg(o, t, n, raw = false) { return this.dmg(t, raw ? n : this.sd(o, n), { kind: 'spell', owner: o, kw: {} }); }
  heal(t, n) {
    if (!t || n <= 0) return;
    const before = t.hp;
    t.hp = Math.min(t.maxHp, t.hp + n);
    if (t.hp > before) this.fx('heal', t, t.hp - before);
  }
  buff(m, a, h) {
    if (!m) return;
    m.atk = Math.max(0, m.atk + a);
    if (h) { m.maxHp += h; m.hp += h; }
    this.fx('buff', m);
  }
  armor(o, n) { this.hero(o).armor += n; this.fx('armor', this.hero(o), n); }
  destroy(m) { if (m && m.kind === 'minion') m.destroyed = true; }
  freeze(t) {
    if (!t || t.kind !== 'minion' || !this.alive(t)) return;
    t.frozen = true;
    t.frozenTurn = this.turnCount;
    this.fx('freeze', t);
  }
  steal(o, m) {
    if (!m || m.owner === o) return;
    const from = this.mins(m.owner), i = from.indexOf(m);
    if (i < 0) return;
    if (this.mins(o).length >= MAX_BOARD) { m.destroyed = true; return; }
    from.splice(i, 1);
    m.owner = o;
    m.sleeping = true;
    m.attacks = m.kw.windfury ? 2 : 1;
    this.mins(o).push(m);
    this.log(`💘 ${this.P(o).name} ควบคุม ${m.name}!`, m.id);
  }
  stealCards(o, n) {
    const e = this.P(this.opp(o)), me = this.P(o);
    for (let k = 0; k < n && e.hand.length; k++) {
      const h = e.hand.splice(Math.floor(Math.random() * e.hand.length), 1)[0];
      this.log(`💰 ${me.name} ขโมย ${h.card.name}`, h.id);
      if (me.hand.length < MAX_HAND) me.hand.push(h);
    }
  }
  bounce(m) {
    const b = this.mins(m.owner), i = b.indexOf(m);
    if (i < 0) return;
    b.splice(i, 1);
    const p = this.P(m.owner);
    if (p.hand.length < MAX_HAND) p.hand.push(this.mkCard(m.id, -1));
  }
  /* ---------------- เด็ค: สับเข้า / เรียกออก ---------------- */
  insertDeck(o, h) { const d = this.P(o).deck; d.splice(Math.floor(Math.random() * (d.length + 1)), 0, h); }
  // o = เด็คของใคร, opt.by = ใครเป็นคนสับ (ค่าเริ่มต้น = o), opt.costDelta / opt.bonus = ติดไปกับการ์ด
  shuffleIn(o, id, n = 1, opt = {}) {
    if (!CARDS[id] || n <= 0) return;
    const bonus = opt.bonus && (opt.bonus.a || opt.bonus.h) ? opt.bonus : null;
    for (let i = 0; i < n; i++) this.insertDeck(o, this.mkCard(id, opt.costDelta || 0, bonus));
    const by = opt.by ?? o;
    const extra = bonus ? ` (+${bonus.a}/+${bonus.h})` : opt.costDelta ? ` (ค่าร่าย ${opt.costDelta})` : '';
    this.log(`🔀 ${this.P(by).name} สับ ${CARDS[id].name}${n > 1 ? ` ×${n}` : ''}${extra} เข้าเด็ค${by !== o ? `ของ ${this.P(o).name}` : ''}`, id);
    this.fx('deck', this.hero(o), n);
    this.afterShuffle(o, by, n);
  }
  afterShuffle(o, by, n) {
    this.P(by).shuffled += n;
    this.mins(o).slice().forEach(m => { if (this.alive(m) && m.card.onShuffle) m.card.onShuffle(this, o, m, n); });
  }
  // จั่วการ์ดเฉพาะเจาะจงจากเด็ค: เลือกใบที่ score สูงสุด
  drawBest(o, filter, score = () => 0) {
    const p = this.P(o);
    let bi = -1;
    p.deck.forEach((h, i) => { if (filter(h.card) && (bi < 0 || score(h.card) > score(p.deck[bi].card))) bi = i; });
    if (bi < 0) return null;
    const h = p.deck.splice(bi, 1)[0];
    if (p.hand.length >= MAX_HAND) { this.log(`🔥 มือเต็ม! ${h.card.name} ถูกเผาทิ้ง`, h.id); return null; }
    p.hand.push(h);
    this.log(`🔎 ${p.name} ค้นเด็คได้ ${o === 0 ? h.card.name : 'การ์ด 1 ใบ'}`, o === 0 ? h.id : null);
    return h;
  }
  // เรียกมินเนี่ยนจากเด็คลงสนาม (ไม่ทำ Battlecry)
  recruit(o, filter) {
    const p = this.P(o);
    if (p.board.length >= MAX_BOARD) return null;
    const i = p.deck.findIndex(h => h.card.type === 'minion' && (!filter || filter(h.card)));
    if (i < 0) return null;
    const h = p.deck.splice(i, 1)[0];
    const m = this.summon(o, h.id);
    this.applyBonus(m, h);
    if (m) this.log(`📤 ${p.name} เรียก ${h.card.name} ออกจากเด็ค`, h.id);
    return m;
  }
  // ส่งมินเนี่ยนบนบอร์ดกลับเข้าเด็ค (ไม่นับว่าตาย) — toO = เด็คของใคร (ค่าเริ่มต้น = เจ้าของ)
  tuck(m, toO = m && m.owner, by = toO) {
    if (!m || m.kind !== 'minion' || !this.alive(m)) return;
    const b = this.mins(m.owner);
    b.splice(b.indexOf(m), 1);
    this.insertDeck(toO, this.mkCard(m.id));
    this.log(`🔀 ${m.name} ถูกสับเข้าเด็คของ ${this.P(toO).name}`, m.id);
    this.fx('deck', this.hero(toO), 1);
    this.afterShuffle(toO, by, 1);
  }
  // ยึดการ์ดสุ่มจากมือศัตรู สับเข้าเด็คตัวเอง
  stealToDeck(o, n) {
    const e = this.P(this.opp(o));
    for (let k = 0; k < n && e.hand.length; k++) {
      const h = e.hand.splice(Math.floor(Math.random() * e.hand.length), 1)[0];
      this.insertDeck(o, h);
      this.log(`🧮 ${this.P(o).name} ยึด ${h.card.name} จากมือ ${e.name} เข้าเด็ค`, h.id);
      this.fx('deck', this.hero(o), 1);
    }
  }
  summon(o, id) {
    const p = this.P(o);
    if (p.board.length >= MAX_BOARD) return null;
    const c = CARDS[id];
    const m = {
      kind: 'minion', uid: UID++, id, card: c, owner: o, name: c.name,
      atk: c.atk, hp: c.hp, maxHp: c.hp, tags: [...c.tags], kw: {},
      sleeping: true, attacks: 0, frozen: false,
    };
    c.kw.forEach(k => { m.kw[k] = true; });
    m.attacks = m.kw.windfury ? 2 : 1;
    p.board.push(m);
    if (this.has(o, 'r_badge') && m.tags.includes('I.M.P.')) this.buff(m, 1, 1);
    if (this.has(o, 'r_collar') && m.tags.includes('Hellhound')) { m.atk += 1; m.kw.rush = true; }
    return m;
  }

  /* ---------------- กับดัก ---------------- */
  fireTraps(o, on, ev) {
    const p = this.P(o);
    for (const h of p.traps.slice()) {
      if (this.over) return;
      const tr = h.card.trap;
      if (tr.on !== on) continue;
      if (tr.cond && !tr.cond(this, o, ev)) continue;
      p.traps.splice(p.traps.indexOf(h), 1);
      this.log(`🪤 กับดัก "${h.card.name}" ของ ${p.name} ทำงาน!`, h.id);
      this.ui.onTrap && this.ui.onTrap(o, h.card);
      tr.fire(this, o, ev);
      if (ev.cancel) break;
    }
  }

  /* ---------------- เก็บกวาดการตาย ---------------- */
  cleanup() {
    for (let loop = 0; loop < 50; loop++) {
      const dead = [];
      for (const p of this.players) for (const m of p.board) if (m.hp <= 0 || m.destroyed) dead.push(m);
      if (!dead.length) break;
      for (const m of dead) {
        const b = this.mins(m.owner), i = b.indexOf(m);
        if (i >= 0) b.splice(i, 1);
        m.dead = true;
        this.P(m.owner).deaths++;
        this.fx('death', m);
        this.log(`☠️ ${m.name} ตาย`, m.id);
      }
      for (const m of dead) {
        if (m.card.deathrattle) m.card.deathrattle(this, m.owner, m);
        this.mins(m.owner).slice().forEach(x => { if (this.alive(x) && x.card.onFriendlyDeath) x.card.onFriendlyDeath(this, m.owner, x, m); });
        if (this.has(m.owner, 'r_pendant')) this.heal(this.hero(m.owner), 2);
        this.fireTraps(m.owner, 'death', { minion: m });
      }
    }
    this.checkOver();
  }

  checkOver() {
    if (this.over) return;
    const d0 = this.hero(0).hp <= 0, d1 = this.hero(1).hp <= 0;
    if (d0 || d1) {
      this.over = true;
      this.winner = d0 ? 1 : 0;
      this.log(this.winner === 0 ? `🏆 คุณชนะ ${this.boss.name}!` : '💀 คุณพ่ายแพ้...');
      return;
    }
    const bh = this.hero(1);
    if (!this.halfDone && this.boss.onHalf && bh.hp <= bh.maxHp / 2) {
      this.halfDone = true;
      this.boss.onHalf(this, 1);
      this.cleanup();
    }
  }
}
