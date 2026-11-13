'use strict';
/* =====================================================================
   โฟลว์ของรัน (Roguelike): เมนู → เลือกฮีโร่ → เลือกการ์ดเริ่ม → แผนที่บอส
   → ต่อสู้ → รางวัล (เลือก 3 จาก 10) → สมบัติ (ทุก 2 บอส) → ร้านค้า (หลังบอส 3, 6)
   ===================================================================== */
const SAVE_KEY = 'hellsdeck_run_v2';
let RUN = null;

const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(RUN)); } catch (e) { /* ignore */ } };
const loadSave = () => { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
const clearSave = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } };

function newRun(heroId) {
  return {
    heroId, deck: [...HEROES[heroId].deck], relics: [], boss: 0, stage: 'draft', wins: 0,
    bonusHp: 0, bonus: { armor: 0, draw: 0, mana: 0 },
    pending: [], relicOpts: null, shop: null,
  };
}

function playerMaxHp(run = RUN) {
  let hp = 30 + run.bonusHp;
  if (run.relics.includes('r_coupon')) hp += 5;
  if (run.relics.includes('r_heart')) hp *= 2;
  return hp;
}

function setScreen(html, onClick) {
  const app = $('#app');
  app.innerHTML = html;
  app.onclick = onClick || null;
  window.scrollTo(0, 0);
}

function rollRelics(n, exclude = []) {
  const avail = Object.values(RELICS).filter(r => !exclude.includes(r.id));
  const out = [];
  while (out.length < n && avail.length) {
    const total = avail.reduce((s, r) => s + RARITY_WEIGHT[r.rarity], 0);
    let x = Math.random() * total, i = 0;
    for (; i < avail.length - 1; i++) { x -= RARITY_WEIGHT[avail[i].rarity]; if (x <= 0) break; }
    out.push(avail.splice(i, 1)[0].id);
  }
  return out;
}

function deckSummary(ids) {
  const cnt = {};
  ids.forEach(id => { cnt[id] = (cnt[id] || 0) + 1; });
  return Object.keys(cnt).sort((a, b) => CARDS[a].cost - CARDS[b].cost || CARDS[a].name.localeCompare(CARDS[b].name)).map(id => [id, cnt[id]]);
}

/* =============================== เมนูหลัก =============================== */
function showTitle() {
  const sv = loadSave();
  setScreen(`
    <div class="screen title-screen">
      <div class="title-glow">😈</div>
      <h1>Hell's Deck</h1>
      <p class="sub">Helluva Boss Fan Card Game — Roguelike Deckbuilder</p>
      <div class="menu">
        ${sv ? `<button class="btn primary big" data-act="continue">▶ เล่นต่อ <small>(${HEROES[sv.heroId].name} — บอส ${Math.min(sv.boss + 1, 8)}/8)</small></button>` : ''}
        <button class="btn ${sv ? '' : 'primary'} big" data-act="new">🔥 เริ่มรันใหม่</button>
        <button class="btn" data-act="collection">📚 คลังการ์ด</button>
        <button class="btn" data-act="howto">❓ วิธีเล่น</button>
      </div>
      <p class="foot">แฟนเกมสำหรับเล่นส่วนตัว • ใส่รูปของคุณเองได้ที่โฟลเดอร์ <code>assets/</code></p>
    </div>`, e => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'continue') resumeRun();
    else if (a === 'new') { if (!sv || confirm('เริ่มรันใหม่? รันที่บันทึกไว้จะหายไป')) showHeroSelect(); }
    else if (a === 'collection') showCollection();
    else if (a === 'howto') showHowTo();
  });
}

function resumeRun() {
  RUN = loadSave();
  if (!RUN) return showTitle();
  ({ draft: showDraft, reward: showReward, relic: showRelicPick, shop: showShop }[RUN.stage] || showMap)();
}

/* ============================== เลือกฮีโร่ ============================== */
// กราฟค่าร่าย (0 ถึง 7+) ของเด็ค
function manaCurveHTML(ids) {
  const bins = Array(8).fill(0);
  ids.forEach(id => { bins[Math.min(7, CARDS[id].cost)]++; });
  const max = Math.max(1, ...bins);
  return `<div class="curve">${bins.map((n, i) => `
    <div class="curve-col" title="ค่าร่าย ${i}${i === 7 ? '+' : ''}: ${n} ใบ">
      <span class="curve-n">${n || ''}</span>
      <div class="curve-bar" style="height:${(n / max) * 100}%"></div>
      <span class="curve-c">${i}${i === 7 ? '+' : ''}</span>
    </div>`).join('')}</div>`;
}

function showHeroSelect(sel) {
  const heroes = Object.values(HEROES);
  const h = HEROES[sel] || heroes[0];
  const types = { minion: 0, spell: 0, trap: 0 };
  h.deck.forEach(id => { types[CARDS[id].type]++; });
  const avg = (h.deck.reduce((s, id) => s + CARDS[id].cost, 0) / h.deck.length).toFixed(1);
  setScreen(`
    <div class="screen hero-select">
      <header class="s-head"><h2>เลือกฮีโร่ของคุณ</h2><p>ฮีโร่แต่ละคนมีเด็คพื้นฐาน 10 ใบ แล้วคุณจะได้เลือกการ์ดเพิ่มอีก 5 ใบ</p></header>
      <nav class="hs-tabs">
        ${heroes.map(x => `
          <button class="hs-tab ${x.id === h.id ? 'active' : ''}" data-view="${x.id}">
            ${artHTML('heroes', x.id, x.emoji)}
            <span><b>${x.name}</b><small>${x.title}</small></span>
          </button>`).join('')}
      </nav>
      <section class="hs-detail">
        <aside class="hs-info">
          <div class="hs-portrait">${artHTML('heroes', h.id, h.emoji)}</div>
          <h3>${h.name}</h3>
          <small class="muted">${h.title}</small>
          <p class="hs-desc">${h.desc}</p>
          <div class="hs-stats">
            <div><b>❤️ ${playerMaxHp({ bonusHp: 0, relics: [] })}</b><small>HP เริ่มต้น</small></div>
            <div><b>🃏 ${h.deck.length}</b><small>การ์ดในเด็ค</small></div>
            <div><b>💎 ${avg}</b><small>ค่าร่ายเฉลี่ย</small></div>
          </div>
          <div class="hs-types">😈 มินเนี่ยน ${types.minion} • ✨ เวทมนตร์ ${types.spell}${types.trap ? ` • 🪤 กับดัก ${types.trap}` : ''}</div>
          ${manaCurveHTML(h.deck)}
          ${h.tips ? `<h4>💡 วิธีเล่น</h4><ul class="hs-tips">${h.tips.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
          <button class="btn primary big" data-pick="${h.id}">เลือก ${h.name} →</button>
        </aside>
        <div class="hs-deck">
          <h3>🃏 เด็คเริ่มต้น <small class="muted">(ชี้การ์ดค้างไว้เพื่อดูคำอธิบายและคอมโบ)</small></h3>
          <div class="card-grid hs-cards">${deckSummary(h.deck).map(([id, n]) => cardHTML(CARDS[id], { extra: n > 1 ? `<div class="count">×${n}</div>` : '' })).join('')}</div>
        </div>
      </section>
      <div class="bar"><button class="btn ghost" data-act="back">← กลับ</button></div>
    </div>`, e => {
    const view = e.target.closest('[data-view]')?.dataset.view;
    const pick = e.target.closest('[data-pick]')?.dataset.pick;
    if (view) { if (view !== h.id) showHeroSelect(view); }
    else if (pick) { RUN = newRun(pick); save(); showDraft(); }
    else if (e.target.closest('[data-act="back"]')) showTitle();
  });
}

/* ========================= ตัวเลือกการ์ด (ใช้ซ้ำ) ========================= */
// ids: รายการ id การ์ด, exact: ต้องเลือกครบจำนวน, max: เลือกได้สูงสุด, onDone(indices)
function showPicker({ title, sub, ids, exact, max, allowSkip, onDone, onBack }) {
  const limit = exact || max;
  const sel = new Set();
  setScreen(`
    <div class="screen">
      <header class="s-head"><h2>${title}</h2><p>${sub}</p></header>
      <div class="card-grid">${ids.map((id, i) => cardHTML(CARDS[id], { cls: 'pickable', attrs: `data-i="${i}"` })).join('')}</div>
      <div class="bar sticky">
        ${onBack ? '<button class="btn ghost" data-pk="back">← กลับ</button>' : ''}
        <span class="pk-count" id="pkCount"></span>
        ${allowSkip ? '<button class="btn ghost" data-pk="skip">ข้าม</button>' : ''}
        <button class="btn primary" data-pk="ok" id="pkOk">ยืนยัน</button>
      </div>
    </div>`, e => {
    const card = e.target.closest('[data-i]');
    if (card) {
      const i = +card.dataset.i;
      if (sel.has(i)) sel.delete(i);
      else if (sel.size < limit) sel.add(i);
      else if (limit === 1) { sel.clear(); sel.add(i); }
      upd();
      return;
    }
    const a = e.target.closest('[data-pk]')?.dataset.pk;
    if (a === 'ok' && !$('#pkOk').disabled) onDone([...sel]);
    else if (a === 'skip') onDone([]);
    else if (a === 'back') onBack();
  });
  function upd() {
    document.querySelectorAll('.card-grid [data-i]').forEach(el => el.classList.toggle('picked', sel.has(+el.dataset.i)));
    $('#pkCount').textContent = `เลือกแล้ว ${sel.size}/${limit}`;
    $('#pkOk').disabled = exact ? sel.size !== exact : sel.size === 0;
  }
  upd();
}

/* ============================ เลือกการ์ดเริ่มต้น ============================ */
function showDraft() {
  const ids = sampleCards(10);
  showPicker({
    title: '🃏 เลือกการ์ดเริ่มต้น',
    sub: `เลือก 5 ใบ จาก 10 ใบ เพื่อเพิ่มเข้าเด็คพื้นฐานของ ${HEROES[RUN.heroId].name}`,
    ids, exact: 5,
    onDone: idx => { RUN.deck.push(...idx.map(i => ids[i])); showMap(); },
  });
}

/* =============================== แผนที่บอส =============================== */
const hasRelicAfter = n => n % RELIC_EVERY === 0 && n < BOSSES.length;
const hasShopAfter = n => SHOP_AFTER_BOSS.includes(n);
function rewardIcon(i) {
  const n = i + 1;
  if (n === BOSSES.length) return '🏆';
  return ['🃏', hasRelicAfter(n) ? '🎁' : '', hasShopAfter(n) ? '🛒' : ''].filter(Boolean).join(' + ');
}
function topBarHTML(extra = '') {
  const h = HEROES[RUN.heroId];
  const b = RUN.bonus;
  const perks = [b.armor ? `🛡️${b.armor}` : '', b.draw ? `✋+${b.draw}` : '', b.mana ? `💎+${b.mana}` : ''].filter(Boolean).join(' ');
  return `<header class="topbar">
    <div class="tb-hero">${artHTML('heroes', h.id, h.emoji)}<b>${h.name}</b></div>
    <div class="tb-stat">❤️ HP ${playerMaxHp()}</div>
    ${perks ? `<div class="tb-stat" title="โบนัสถาวรจากร้านค้า">${perks}</div>` : ''}
    ${extra}
    <div class="tb-stat">🃏 ${RUN.deck.length} ใบ <button class="btn small" data-act="deck">ดูเด็ค</button></div>
    <div class="tb-relics">${RUN.relics.map(id => relicHTML(RELICS[id], { compact: true })).join('') || '<small class="muted">ยังไม่มีสมบัติ</small>'}</div>
    <button class="btn small ghost" data-act="menu">เมนูหลัก</button>
  </header>`;
}
function handleTopBar(e) {
  const a = e.target.closest('[data-act]')?.dataset.act;
  if (a === 'deck') { showDeckModal(); return true; }
  if (a === 'menu') { save(); showTitle(); return true; }
  return false;
}

function showMap() {
  RUN.stage = 'map';
  save();
  const next = BOSSES[RUN.boss];
  setScreen(`
    <div class="screen map-screen">
      ${topBarHTML()}
      <h2 class="center">🔥 เส้นทางสู่นรกชั้นลึก</h2>
      <div class="boss-path">
        ${BOSSES.map((b, i) => `
          <div class="boss-node ${i < RUN.boss ? 'done' : i === RUN.boss ? 'current' : 'locked'}">
            ${artHTML('bosses', b.id, b.emoji)}
            <div class="bn-num">${i + 1}</div>
            <b>${b.name}</b>
            <small>${b.title}</small>
            <span class="bn-hp">❤️ ${b.hp}</span>
            <span class="bn-rew">${rewardIcon(i)}</span>
          </div>`).join('')}
      </div>
      <div class="next-boss">
        <div class="nb-art">${artHTML('bosses', next.id, next.emoji)}</div>
        <div>
          <h3>บอส ${RUN.boss + 1}: ${next.name} <small>— ${next.title}</small></h3>
          <p>❤️ ${next.hp} HP ${next.bonusMana ? ` • 💎 เริ่มด้วยมานา +${next.bonusMana}` : ''}</p>
          <p class="muted">${next.desc}</p>
          <p class="muted">รางวัลเมื่อชนะ: ${rewardIcon(RUN.boss)}</p>
          <button class="btn primary big" data-act="fight">⚔️ ท้าสู้ ${next.name}</button>
        </div>
      </div>
    </div>`, e => {
    if (handleTopBar(e)) return;
    if (e.target.closest('[data-act="fight"]')) startBattle();
  });
}

/* ================================ ต่อสู้ ================================ */
function startBattle() {
  const h = HEROES[RUN.heroId];
  const boss = BOSSES[RUN.boss];
  const g = new Game({
    player: { name: h.name, hp: playerMaxHp(), deck: RUN.deck, relics: RUN.relics, bonus: RUN.bonus,
      portrait: { folder: 'heroes', id: h.id, emoji: h.emoji } },
    boss,
  });
  $('#app').onclick = null;
  BattleUI.mount(g, winner => {
    if (winner === 0) {
      RUN.boss++;
      RUN.wins++;
      if (RUN.boss >= BOSSES.length) { clearSave(); showVictory(); return; }
      RUN.stage = 'reward';
      save();
      showReward();
    } else {
      const reached = RUN.boss;
      clearSave();
      showGameOver(reached);
    }
  });
}

/* ================================ รางวัล ================================ */
function showReward() {
  const ids = sampleCards(10);
  const beaten = BOSSES[RUN.boss - 1];
  showPicker({
    title: `🏆 ชนะ ${beaten.name}! เลือกการ์ดรางวัล`,
    sub: `เลือกได้สูงสุด 3 ใบ จาก 10 ใบ (เด็คตอนนี้ ${RUN.deck.length} ใบ)`,
    ids, max: 3, allowSkip: true,
    onDone: idx => {
      RUN.deck.push(...idx.map(i => ids[i]));
      RUN.pending = [];
      if (hasRelicAfter(RUN.boss)) RUN.pending.push('relic');
      if (hasShopAfter(RUN.boss)) RUN.pending.push('shop');
      nextStage();
    },
  });
}
function nextStage() {
  const s = RUN.pending.shift();
  if (s === 'relic') { RUN.stage = 'relic'; RUN.relicOpts = null; save(); showRelicPick(); }
  else if (s === 'shop') { RUN.stage = 'shop'; RUN.shop = null; save(); showShop(); }
  else showMap();
}

/* ================================ สมบัติ ================================ */
function showRelicPick() {
  if (!RUN.relicOpts) { RUN.relicOpts = rollRelics(3, RUN.relics); save(); }
  const opts = RUN.relicOpts;
  setScreen(`
    <div class="screen">
      <header class="s-head"><h2>🎁 สมบัติ! หยิบได้ 1 ชิ้น</h2><p>สุ่มมา 3 ชิ้น เลือกเก็บได้ 1 ชิ้น สมบัติจะติดตัวคุณไปตลอดรัน</p></header>
      <div class="relic-grid">${opts.map(id => relicHTML(RELICS[id], { cls: 'pickable', attrs: `data-relic="${id}"` })).join('')}</div>
      <div class="bar"><button class="btn ghost" data-act="skip">ข้าม</button></div>
    </div>`, e => {
    const id = e.target.closest('[data-relic]')?.dataset.relic;
    if (id) { RUN.relics.push(id); RUN.relicOpts = null; nextStage(); }
    else if (e.target.closest('[data-act="skip"]')) { RUN.relicOpts = null; nextStage(); }
  });
}

/* ================================ ร้านค้า ================================ */
function showShop(msg = '') {
  if (!RUN.shop) {
    RUN.shop = { gold: GOLD_PER_SHOP, items: sample(SHOP_ITEMS.map(i => i.id), SHOP_SLOTS), bought: [] };
  }
  RUN.stage = 'shop';
  save();
  const sh = RUN.shop;
  const items = sh.items.map(id => SHOP_ITEMS.find(x => x.id === id));
  setScreen(`
    <div class="screen">
      ${topBarHTML()}
      <header class="s-head"><h2>🛒 ร้านค้าแห่งนรก</h2>
        <p>คุณมี 🪙 <b>${sh.gold}</b> เหรียญ — เหรียญที่เหลือ<b>จะหายไป</b>เมื่อออกจากร้าน</p>
        ${msg ? `<p class="ok-msg">${msg}</p>` : ''}</header>
      <div class="shop-grid">
        ${items.map(it => {
          const sold = sh.bought.includes(it.id), poor = sh.gold < it.price;
          return `<div class="shop-item ${sold ? 'sold' : poor ? 'poor' : ''}">
            <div class="si-emoji">${it.emoji}</div>
            <b>${it.name}</b>
            <p>${it.desc}</p>
            <button class="btn primary" data-buy="${it.id}" ${sold || poor ? 'disabled' : ''}>${sold ? 'ขายแล้ว' : `ซื้อ 🪙 ${it.price}`}</button>
          </div>`;
        }).join('')}
      </div>
      <div class="bar"><button class="btn primary big" data-act="leave">ออกจากร้าน →</button></div>
    </div>`, e => {
    if (handleTopBar(e)) return;
    const id = e.target.closest('[data-buy]')?.dataset.buy;
    if (id) return buy(id);
    if (e.target.closest('[data-act="leave"]')) {
      if (sh.gold > 0 && !confirm(`ยังเหลือ 🪙 ${sh.gold} เหรียญ ออกจากร้านเลยไหม? (เหรียญจะหายไป)`)) return;
      RUN.shop = null;
      nextStage();
    }
  });
}

function buy(id) {
  const sh = RUN.shop;
  const it = SHOP_ITEMS.find(x => x.id === id);
  if (!it || sh.gold < it.price || sh.bought.includes(id)) return;
  const pay = () => { sh.gold -= it.price; sh.bought.push(id); save(); };
  const back = () => showShop();
  const deckPicker = (title, sub, opts, done) => {
    const ids = [...RUN.deck];
    showPicker({ title, sub: `${sub} (จ่าย 🪙 ${it.price})`, ids, ...opts, onBack: back, onDone: idx => { pay(); done(ids, idx); } });
  };
  switch (id) {
    case 'hp10': pay(); RUN.bonusHp += 10; save(); return showShop('❤️ HP เริ่มต้น +10');
    case 'hp25': pay(); RUN.bonusHp += 25; save(); return showShop('💗 HP เริ่มต้น +25');
    case 'armor': pay(); RUN.bonus.armor += 5; save(); return showShop('🦺 เริ่มทุกการต่อสู้พร้อมเกราะ +5');
    case 'draw': pay(); RUN.bonus.draw += 1; save(); return showShop('✋ จั่วการ์ดเริ่มต้น +1');
    case 'mana': pay(); RUN.bonus.mana += 1; save(); return showShop('💎 มานาเริ่มต้น +1');
    case 'relic': {
      const r = rollRelics(1, RUN.relics)[0];
      if (!r) return showShop('มีสมบัติครบทุกชิ้นแล้ว!');
      pay(); RUN.relics.push(r); save();
      return showShop(`🎁 ได้รับ ${RELICS[r].emoji} ${RELICS[r].name} — ${RELICS[r].text}`);
    }
    case 'pick': case 'legend': {
      const ids = id === 'pick' ? sampleCards(10) : sample(POOL_LEGENDS, 3);
      return showPicker({ title: `${it.emoji} ${it.name}`, sub: `เลือก 1 ใบ (จ่าย 🪙 ${it.price})`, ids, exact: 1, onBack: back,
        onDone: idx => { pay(); RUN.deck.push(ids[idx[0]]); save(); showShop(`เพิ่ม ${CARDS[ids[idx[0]]].name} เข้าเด็คแล้ว`); } });
    }
    case 'copy1': case 'copy3':
      return deckPicker(`${it.emoji} ${it.name}`, `เลือกการ์ดในเด็คสูงสุด ${id === 'copy1' ? 1 : 3} ใบ เพื่อเพิ่มสำเนา`,
        id === 'copy1' ? { exact: 1 } : { max: 3 },
        (ids, idx) => { idx.forEach(i => RUN.deck.push(ids[i])); save(); showShop(`ก็อปปี้ ${idx.map(i => CARDS[ids[i]].name).join(', ')}`); });
    case 'remove1': case 'remove3': {
      const n = id === 'remove1' ? 1 : 3;
      if (RUN.deck.length - n < 5) return showShop('เด็คต้องเหลืออย่างน้อย 5 ใบ');
      return deckPicker(`${it.emoji} ${it.name}`, `เลือกการ์ดสูงสุด ${n} ใบที่จะนำออกจากเด็ค`,
        n === 1 ? { exact: 1 } : { max: 3 },
        (ids, idx) => {
          const names = idx.map(i => CARDS[ids[i]].name);
          RUN.deck = ids.filter((_, i) => !idx.includes(i));
          save(); showShop(`ลบ ${names.join(', ')} ออกจากเด็คแล้ว`);
        });
    }
  }
}

/* ================================ ดูเด็ค ================================ */
function showDeckModal() {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="modal-box">
    <header><h2>🃏 เด็คของคุณ (${RUN.deck.length} ใบ)</h2><button class="btn small" data-close>ปิด ✕</button></header>
    <div class="card-grid small">${deckSummary(RUN.deck).map(([id, n]) => cardHTML(CARDS[id], { extra: n > 1 ? `<div class="count">×${n}</div>` : '' })).join('')}</div>
    <h3>สมบัติ</h3>
    <div class="relic-grid small">${RUN.relics.map(id => relicHTML(RELICS[id])).join('') || '<p class="muted">ยังไม่มีสมบัติ</p>'}</div>
  </div>`;
  m.onclick = e => { if (e.target === m || e.target.closest('[data-close]')) m.remove(); };
  document.body.appendChild(m);
}

/* ============================== จบเกม ============================== */
function showGameOver(reached) {
  const b = BOSSES[reached];
  setScreen(`
    <div class="screen end-screen lose">
      <h1>💀 จบรัน</h1>
      <p>คุณพ่ายแพ้ให้กับ <b>${b.name}</b> (บอสที่ ${reached + 1}/8)</p>
      <p class="muted">ชนะบอสไปทั้งหมด ${reached} ตัว • เด็คสุดท้าย ${RUN.deck.length} ใบ • สมบัติ ${RUN.relics.length} ชิ้น</p>
      <div class="menu"><button class="btn primary big" data-act="again">🔥 ลองใหม่</button><button class="btn" data-act="menu">เมนูหลัก</button></div>
    </div>`, e => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'again') showHeroSelect(); else if (a === 'menu') showTitle();
  });
}
function showVictory() {
  setScreen(`
    <div class="screen end-screen win">
      <h1>🏆 พิชิตนรกสำเร็จ!</h1>
      <p>${HEROES[RUN.heroId].name} เอาชนะบอสทั้ง 8 ตัวได้แล้ว รวมถึง Satan!</p>
      <p class="muted">เด็คสุดท้าย ${RUN.deck.length} ใบ • สมบัติ ${RUN.relics.length} ชิ้น</p>
      <div class="relic-grid small">${RUN.relics.map(id => relicHTML(RELICS[id], { compact: true })).join('')}</div>
      <div class="menu"><button class="btn primary big" data-act="menu">เมนูหลัก</button></div>
    </div>`, e => { if (e.target.closest('[data-act="menu"]')) showTitle(); });
}

/* ============================== คลังการ์ด ============================== */
function showCollection(tab = 'legend') {
  const tabs = { legend: '🌟 ตัวละคร (ตำนาน)', pool: 'การ์ดสุ่มอื่นๆ', basic: 'ฮีโร่ & การ์ดพื้นฐาน', boss: 'บอส', relic: 'สมบัติ' };
  const withPath = c => cardHTML(c, { extra: `<code class="id">${c.id}</code>` });
  const sortCost = ids => [...ids].sort((a, b) => CARDS[a].cost - CARDS[b].cost);
  let body = '';
  if (tab === 'legend') {
    body = `<div class="card-grid small">${sortCost(POOL.filter(id => CARDS[id].rar === 'legendary')).map(id => withPath(CARDS[id])).join('')}</div>`;
  } else if (tab === 'pool') {
    body = `<div class="card-grid small">${sortCost(POOL.filter(id => CARDS[id].rar !== 'legendary')).map(id => withPath(CARDS[id])).join('')}</div>`;
  } else if (tab === 'basic') {
    body = `<div class="hero-grid">${Object.values(HEROES).map(h => `<div class="hero-card">${artHTML('heroes', h.id, h.emoji)}<h3>${h.name}</h3><code>assets/heroes/${h.id}.png</code></div>`).join('')}</div>
      <h3>การ์ดพื้นฐาน & Token</h3>
      <div class="card-grid small">${Object.values(CARDS).filter(c => (c.basic || c.token) && !c.boss).map(withPath).join('')}</div>`;
  } else if (tab === 'boss') {
    body = BOSSES.map((b, i) => `<div class="boss-sec">
      <div class="boss-sec-head">${artHTML('bosses', b.id, b.emoji)}<div><h3>${i + 1}. ${b.name} — ❤️ ${b.hp}</h3><code>assets/bosses/${b.id}.png</code><p class="muted">${b.desc}</p></div></div>
      <div class="card-grid small">${Object.values(CARDS).filter(c => c.boss === b.id).map(withPath).join('')}</div></div>`).join('');
  } else {
    body = `<div class="relic-grid">${Object.values(RELICS).map(r => relicHTML(r, { extra: `<code class="id">${r.id}</code>` })).join('')}</div>`;
  }
  setScreen(`
    <div class="screen">
      <header class="s-head"><h2>📚 คลังการ์ด</h2><p>การ์ดผู้เล่นทั้งหมด ${POOL.length} ใบ • ชื่อไฟล์รูป: <code>assets/cards/&lt;id&gt;.png</code> (รองรับ .png .jpg .jpeg .webp) — id อยู่ใต้การ์ดแต่ละใบ</p></header>
      <nav class="tabs">${Object.entries(tabs).map(([k, v]) => `<button class="btn ${k === tab ? 'primary' : ''}" data-tab="${k}">${v}</button>`).join('')}</nav>
      ${body}
      <div class="bar"><button class="btn ghost" data-act="back">← กลับ</button></div>
    </div>`, e => {
    const t = e.target.closest('[data-tab]')?.dataset.tab;
    if (t) showCollection(t);
    else if (e.target.closest('[data-act="back"]')) showTitle();
  });
}

/* ============================== วิธีเล่น ============================== */
function showHowTo() {
  setScreen(`
    <div class="screen howto">
      <header class="s-head"><h2>❓ วิธีเล่น</h2></header>
      <div class="howto-body">
        <h3>เป้าหมาย</h3>
        <p>เอาชนะบอส 8 ตัวติดต่อกัน (HP 10 → 20 → 30 → 50 → 70 → 90 → 120 → 150) แพ้ครั้งเดียวจบรัน</p>
        <h3>การต่อสู้</h3>
        <ul>
          <li>ผู้เล่นเริ่มที่ 30 HP (HP ฟื้นเต็มทุกครั้งก่อนสู้บอสตัวใหม่)</li>
          <li>ทั้งสองฝ่ายจั่วการ์ด 1 ใบทุกต้นเทิร์นของตัวเอง</li>
          <li>มานาเริ่ม 1 และเพิ่มเทิร์นละ 1 สูงสุด 10</li>
          <li>ลงมินเนี่ยนได้สูงสุด 7 ตัว วางกับดักได้สูงสุด 5 ใบ (ศัตรูมองไม่เห็นกับดักของคุณ)</li>
          <li>มินเนี่ยนที่เพิ่งลงต้องรอ 1 เทิร์นก่อนโจมตี (ยกเว้น Charge / Rush)</li>
          <li>ถ้าการ์ดในเด็คหมด จั่วแต่ละครั้งจะโดนดาเมจ 1, 2, 3, ... เพิ่มขึ้นเรื่อยๆ (Fatigue)</li>
          <li>มือถือการ์ดได้สูงสุด 10 ใบ ใบที่จั่วเกินจะถูกเผา</li>
        </ul>
        <h3>คอมโบตัวละคร 🌟</h3>
        <p>การ์ดตัวละครหลัก (กรอบทอง) จะเก่งขึ้นมากเมื่อมีคู่หูตามความสัมพันธ์ในซีรีส์อยู่บนบอร์ด เช่น
          Blitzø + Stolas, Moxxie + Millie, Loona + Blitzø, Vortex + Loona, Stella + Andrealphus,
          Asmodeus + Fizzarolli, Crimson + Moxxie, Glitz + Glam, Cherub Trio ฯลฯ
          — อ่านเงื่อนไข <i>คอมโบ</i> บนการ์ด แล้ววางแผนลงให้ถูกลำดับ</p>
        <h3>การควบคุม</h3>
        <ul>
          <li>คลิกการ์ดในมือเพื่อลง — ถ้าต้องเลือกเป้าหมาย ให้คลิกเป้าหมายที่เรืองแสงสีแดง</li>
          <li>คลิกมินเนี่ยนที่เรืองแสงสีเขียว แล้วคลิกเป้าหมายเพื่อโจมตี</li>
          <li>คลิกขวา หรือกด Esc เพื่อยกเลิก • ชี้เมาส์เพื่อดูรายละเอียดการ์ด</li>
        </ul>
        <h3>ระหว่างรัน</h3>
        <ul>
          <li>เริ่มรัน: เลือกฮีโร่ (เด็คพื้นฐาน 10 ใบ) แล้วเลือกการ์ดเพิ่ม 5 ใบ จาก 10 ใบ</li>
          <li>ชนะบอสแต่ละตัว: เลือกการ์ดได้สูงสุด 3 ใบ จาก 10 ใบ</li>
          <li>หลังบอสที่ 2, 4, 6: สุ่มสมบัติ 3 ชิ้น หยิบได้ 1 ชิ้น</li>
          <li>หลังบอสที่ 3 และ 6: ร้านค้า — ได้ 🪙 ${GOLD_PER_SHOP} เหรียญ (รีเซ็ตทุกครั้ง) สุ่มสินค้า ${SHOP_SLOTS} อย่าง ราคาตามความแรง</li>
        </ul>
        <h3>ความสามารถทั้งหมด</h3>
        <p class="muted">ชี้การ์ดค้างไว้ (ในคลังการ์ด / ตอนเลือกการ์ด) จะเห็นคำอธิบายของการ์ดใบนั้นและการ์ดคู่หูคอมโบ</p>
        <ul>${GLOSSARY.map(k => `<li><b>${k.icon} ${k.name}</b> — ${k.desc}</li>`).join('')}</ul>
        <h3>ไอคอนบนมินเนี่ยน</h3>
        <ul><li><b>💀</b> มี Deathrattle • <b>⚙️</b> มีความสามารถที่ทำงานเอง • <b>💤</b> เพิ่งลงสนาม ยังโจมตีไม่ได้</li></ul>
        <h3>แท็ก (ใช้คอมโบ)</h3>
        <p>${Object.entries(TAG_EMOJI).map(([t, e]) => `${e} ${t}`).join(' • ')} — การ์ดหลายใบเก่งขึ้นเมื่อมีแท็กเดียวกันอยู่บนบอร์ด</p>
      </div>
      <div class="bar"><button class="btn ghost" data-act="back">← กลับ</button></div>
    </div>`, e => { if (e.target.closest('[data-act="back"]')) showTitle(); });
}

window.addEventListener('DOMContentLoaded', showTitle);
