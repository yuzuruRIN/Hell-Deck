'use strict';
/* =====================================================================
   ข้อมูลเกม: การ์ด / ฮีโร่ / บอส / สมบัติ / ร้านค้า
   - เพิ่มการ์ดใหม่ได้ด้วยฟังก์ชัน M (มินเนี่ยน), S (เวทมนตร์), T (กับดัก)
   - pool:1  = การ์ดที่สุ่มออกมาให้ผู้เล่นเลือก
   - rar: 'common' | 'rare' | 'legendary'  (ตำนาน = ตัวละครหลัก มีคอมโบ)
   - basic:1 = การ์ดพื้นฐานในเด็คเริ่มต้นของฮีโร่
   - token:1 = การ์ดที่ถูกเรียกออกมาจากเอฟเฟค (ไม่สุ่มให้เลือก)
   - boss:'id' = การ์ดในเด็คของบอสตัวนั้น
   รูปภาพ: assets/cards/<id>.png (หรือ .jpg / .webp)
   ===================================================================== */

const TAG_EMOJI = { 'I.M.P.': '🔫', 'Hellhound': '🐺', 'Goetia': '🦉', 'Sin': '👑', 'Imp': '😈', 'Cherub': '👼' };
const TYPE_EMOJI = { minion: '😈', spell: '✨', trap: '🪤' };
const TYPE_LABEL = { minion: 'มินเนี่ยน', spell: 'เวทมนตร์', trap: 'กับดัก' };
const CARD_RARITY_LABEL = { common: 'ธรรมดา', rare: 'หายาก', legendary: 'ตำนาน' };

const KEYWORDS = {
  taunt:     { name: 'Taunt',         icon: '🛡️', desc: 'ศัตรูต้องโจมตีมินเนี่ยนตัวนี้ก่อน' },
  charge:    { name: 'Charge',        icon: '⚡', desc: 'โจมตีได้ทันทีในเทิร์นที่ลงสนาม' },
  rush:      { name: 'Rush',          icon: '💨', desc: 'โจมตีมินเนี่ยนได้ทันทีในเทิร์นที่ลงสนาม (ตีฮีโร่ไม่ได้)' },
  shield:    { name: 'Divine Shield', icon: '✨', desc: 'กันดาเมจครั้งแรกได้หนึ่งครั้ง' },
  lifesteal: { name: 'Lifesteal',     icon: '🩸', desc: 'ดาเมจที่ทำ จะฟื้นฟู HP ให้ฮีโร่ของคุณ' },
  poison:    { name: 'Poisonous',     icon: '☠️', desc: 'ทำลายมินเนี่ยนใดๆ ที่โดนดาเมจจากตัวนี้' },
  windfury:  { name: 'Windfury',      icon: '🌪️', desc: 'โจมตีได้ 2 ครั้งต่อเทิร์น' },
  freezer:   { name: 'Freeze',        icon: '❄️', desc: 'แช่แข็งตัวที่โดนดาเมจจากมินเนี่ยนนี้ (ข้ามการโจมตีครั้งถัดไป)' },
};

/* คำอธิบายความสามารถทั้งหมด — ใช้แสดงตอนชี้การ์ด และในหน้าวิธีเล่น
   test(c, text) คืน true ถ้าการ์ดใบนี้มีความสามารถนั้น (text = ข้อความการ์ดแบบไม่มี HTML) */
const kwOf = k => c => (c.kw || []).includes(k);
const GLOSSARY = [
  { name: 'Taunt',         icon: '🛡️', desc: KEYWORDS.taunt.desc,     test: (c, t) => kwOf('taunt')(c) || /Taunt/.test(t) },
  { name: 'Charge',        icon: '⚡', desc: KEYWORDS.charge.desc,    test: (c, t) => kwOf('charge')(c) || /Charge/.test(t) },
  { name: 'Rush',          icon: '💨', desc: KEYWORDS.rush.desc,      test: (c, t) => kwOf('rush')(c) || /Rush/.test(t) },
  { name: 'Divine Shield', icon: '✨', desc: KEYWORDS.shield.desc,    test: (c, t) => kwOf('shield')(c) || /Divine Shield/.test(t) },
  { name: 'Lifesteal',     icon: '🩸', desc: KEYWORDS.lifesteal.desc, test: (c, t) => kwOf('lifesteal')(c) || /Lifesteal/.test(t) },
  { name: 'Poisonous',     icon: '☠️', desc: KEYWORDS.poison.desc,    test: (c, t) => kwOf('poison')(c) || /Poisonous/.test(t) },
  { name: 'Windfury',      icon: '🌪️', desc: KEYWORDS.windfury.desc,  test: (c, t) => kwOf('windfury')(c) || /Windfury/.test(t) },
  { name: 'Freeze',        icon: '❄️', desc: 'แช่แข็งมินเนี่ยน: ตัวที่ถูกแช่แข็งจะโจมตีไม่ได้ในเทิร์นถัดไปของเจ้าของ แล้วละลายเองตอนจบเทิร์นนั้น',
    test: (c, t) => kwOf('freezer')(c) || /Freeze/.test(t) },
  { name: 'Battlecry',     icon: '📣', desc: 'ทำงานทันทีตอนลงการ์ดใบนี้จากมือ (ไม่ทำงานถ้ามินเนี่ยนถูกเรียกออกมาด้วยเอฟเฟคอื่นหรือถูกเรียกจากเด็ค)',
    test: (c, t) => /Battlecry/.test(t) },
  { name: 'Deathrattle',   icon: '💀', desc: 'ทำงานตอนมินเนี่ยนตัวนี้ตาย', test: (c, t) => /Deathrattle/.test(t) },
  { name: 'คอมโบ',          icon: '💞', desc: 'ตอนลงการ์ดใบนี้ ถ้ามีคู่หูที่ระบุอยู่บนบอร์ดฝ่ายเราแล้ว จะได้เอฟเฟคพิเศษเพิ่ม (ชี้การ์ดค้างไว้เพื่อดูการ์ดคู่หู) — การ์ดในมือที่พร้อมคอมโบจะมีป้าย 💞',
    test: (c, t) => /คอมโบ/.test(t) },
  { name: 'กับดัก',          icon: '🪤', desc: 'วางคว่ำไว้หน้าฮีโร่ ศัตรูมองไม่เห็น จะทำงานเองเมื่อเงื่อนไขเกิดขึ้นแล้วหายไป (วางได้สูงสุด 5 ใบ และห้ามวางชื่อซ้ำ)',
    test: c => c.type === 'trap' },
  { name: 'สิ้นเทิร์น',        icon: '⏳', desc: 'ทำงานเองทุกครั้งที่เจ้าของจบเทิร์น ตราบใดที่มินเนี่ยนตัวนี้ยังอยู่บนบอร์ด', test: (c, t) => /สิ้นเทิร์น/.test(t) },
  { name: 'ความสามารถติดตัว', icon: '⚙️', desc: 'ทำงานเองทุกครั้งที่เงื่อนไขเกิดขึ้น ตราบใดที่มินเนี่ยนตัวนี้ยังอยู่บนบอร์ด',
    test: c => !!(c.onAttack || c.onSpell || c.onFriendlyDeath || c.onTurnStart || c.onShuffle) },
  { name: 'เมื่อจั่ว',          icon: '⚡', desc: 'ทำงานทันทีตอนการ์ดใบนี้ถูกจั่ว (ไม่ต้องเสียมานา) แล้วการ์ดหายไปและจั่วใบใหม่แทน — มักถูกสับเข้าเด็คด้วยการ์ดอื่น',
    test: c => !!c.castOnDraw },
  { name: 'เรียกจากเด็ค',     icon: '📤', desc: 'ดึงมินเนี่ยนจากเด็คลงสนามทันทีโดยไม่ต้องจั่วและไม่เสียมานา (ไม่ทำ Battlecry)', test: (c, t) => /ออกจากเด็ค/.test(t) },
  { name: 'สับเข้าเด็ค',      icon: '🔀', desc: 'ใส่การ์ดลงในเด็คตำแหน่งสุ่ม แล้วจะจั่วเจอภายหลัง ทำให้เด็คไม่หมดเร็ว — ถ้าเป็นมินเนี่ยนบนบอร์ด มันจะหายจากบอร์ดโดยไม่นับว่าตาย',
    test: (c, t) => /เข้าเด็ค/.test(t) },
  { name: 'ควบคุม',          icon: '💘', desc: 'ย้ายมินเนี่ยนศัตรูมาเป็นของคุณ ต้องรอ 1 เทิร์นก่อนโจมตี', test: (c, t) => /ควบคุม/.test(t) },
  { name: 'เกราะ',           icon: '🛡️', desc: 'ดาเมจที่ฮีโร่โดนจะหักจากเกราะก่อน แล้วค่อยหัก HP', test: (c, t) => /เกราะ/.test(t) },
  { name: 'คืนเข้ามือ',        icon: '↩️', desc: 'มินเนี่ยนกลับไปเป็นการ์ดในมือ ค่าสถานะที่ได้บัฟจะหายไป ลงใหม่แล้ว Battlecry / คอมโบทำงานอีกครั้ง',
    test: (c, t) => /เข้ามือ/.test(t) && /คืน/.test(t) },
];
const stripTags = s => (s || '').replace(/<[^>]+>/g, '');
// คืนรายการคำอธิบายที่เกี่ยวกับการ์ดนี้ (liveKw = keyword ที่มินเนี่ยนบนบอร์ดได้รับเพิ่ม)
function glossaryFor(c, liveKw = []) {
  const t = stripTags(c.text);
  const extra = { kw: [...(c.kw || []), ...liveKw] };
  const cc = Object.assign({}, c, extra);
  return GLOSSARY.filter(g => g.test(cc, t));
}

const CARDS = {};
const base = (o) => Object.assign({ kw: [], tags: [], text: '', rar: 'common' }, o);
function M(id, name, cost, atk, hp, o = {}) { CARDS[id] = Object.assign(base({ id, name, type: 'minion', cost, atk, hp }), o); }
function S(id, name, cost, o = {}) { CARDS[id] = Object.assign(base({ id, name, type: 'spell', cost }), o); }
function T(id, name, cost, o = {}) { CARDS[id] = Object.assign(base({ id, name, type: 'trap', cost }), o); }

const hasTag = (m, t) => m.tags.includes(t);
const TRAPSRC = o => ({ kind: 'trap', owner: o, kw: {} });
const enemyHasMinions = (g, o) => g.mins(g.opp(o)).length > 0;
const minionsAtLeast = n => (g, o) => g.mins(o).length >= n;
// มีมินเนี่ยนในเด็คให้เรียกออกมา และบอร์ดยังไม่เต็ม
const canRecruit = (g, o) => g.mins(o).length < MAX_BOARD && g.P(o).deck.some(h => h.card.type === 'minion');

/* คอมโบ: ถ้ามีตัวละครคู่หู (partnerId) อยู่บนบอร์ด → แสดงป้ายคอมโบ แล้วทำ fn(partner) */
function combo(g, o, self, partnerId, label, fn) {
  const p = g.mins(o).find(m => m.id === partnerId && m !== self);
  if (!p) return false;
  g.combo(label);
  fn(p);
  return true;
}
function giveWindfury(m) { if (!m.kw.windfury) { m.kw.windfury = true; m.attacks++; } }
// Stolitz — Blitzø + Stolas (ลงใบไหนก่อนก็ได้)
function stolitz(g, o, s) {
  const other = s.id === 'blitzo' ? 'stolas' : 'blitzo';
  combo(g, o, s, other, '💞 Stolitz! Blitzø + Stolas', p => {
    const b = s.id === 'blitzo' ? s : p, st = s.id === 'stolas' ? s : p;
    g.buff(b, 2, 2); g.buff(st, 2, 2); giveWindfury(b);
  });
}
// คู่ที่ได้บัฟเท่ากันทั้งคู่
function pairBuff(g, o, s, partnerId, label, a, h, shield) {
  combo(g, o, s, partnerId, label, p => {
    [s, p].forEach(m => { g.buff(m, a, h); if (shield) m.kw.shield = true; });
  });
}
// Cherub Trio — Collin + Keenie + Cletus
const CHERUB_TRIO = ['collin', 'keenie', 'cletus'];
function cherubTrio(g, o) {
  const ms = CHERUB_TRIO.map(id => g.mins(o).find(m => m.id === id));
  if (ms.every(Boolean)) { g.combo('👼 Cherub Trio ครบทีม!'); ms.forEach(m => g.buff(m, 3, 3)); }
}

/* ============================= การ์ดพื้นฐาน ============================= */
M('imp_grunt', 'Imp Grunt', 1, 2, 1, { basic: 1, tags: ['Imp'] });
M('imp_bouncer', 'Imp Bouncer', 2, 2, 3, { basic: 1, tags: ['Imp'], kw: ['taunt'], text: '<b>Taunt</b>' });
M('imp_brute', 'Imp Brute', 3, 3, 4, { basic: 1, tags: ['Imp'] });
S('hellfire_bolt', 'Hellfire Bolt', 1, { basic: 1, emoji: '🔥', target: 'any', ai: 'dmg', aiN: 2, text: 'ทำ 2 ดาเมจ',
  cast: (g, o, t) => g.spellDmg(o, t, 2) });
S('brimstone_shot', 'Brimstone Shot', 2, { basic: 1, emoji: '☄️', target: 'enemyMinion', ai: 'dmg', aiN: 3, text: 'ทำ 3 ดาเมจกับมินเนี่ยนศัตรู',
  cast: (g, o, t) => g.spellDmg(o, t, 3) });
S('hellmart_snack', 'Hellmart Snack', 1, { basic: 1, emoji: '🍟', text: 'ฟื้นฟู 3 HP ให้ฮีโร่ของคุณ จั่วการ์ด 1 ใบ',
  cast: (g, o) => { g.heal(g.hero(o), 3); g.draw(o, 1); } });

/* ============================ ตัวละครหลัก (ตำนาน) ============================ */
// ---- ทีม I.M.P. ----
M('blitzo', 'Blitzø', 4, 3, 3, { pool: 1, rar: 'legendary', tags: ['I.M.P.', 'Imp'], kw: ['charge'], emoji: '🔫',
  text: '<b>Charge</b>. <b>Battlecry:</b> มินเนี่ยน I.M.P. อื่นฝ่ายเรา +1/+1<br><i>คอมโบ Stolas:</i> ทั้งคู่ +2/+2 และ Blitzø ได้ <b>Windfury</b>',
  battlecry: (g, o, t, s) => { g.mins(o).forEach(m => { if (m !== s && hasTag(m, 'I.M.P.')) g.buff(m, 1, 1); }); stolitz(g, o, s); } });
M('moxxie', 'Moxxie', 3, 2, 4, { pool: 1, rar: 'legendary', tags: ['I.M.P.', 'Imp'], emoji: '🎯', target: 'enemyMinion', ai: 'dmg', aiN: 2,
  text: '<b>Battlecry:</b> ทำ 2 ดาเมจกับมินเนี่ยนศัตรู<br><i>คอมโบ Millie:</i> ทำ 4 ดาเมจแทน',
  battlecry: (g, o, t, s) => { const c = combo(g, o, s, 'millie', '💕 Moxxie + Millie', () => {}); if (t) g.dmg(t, c ? 4 : 2, s); } });
M('millie', 'Millie', 3, 3, 3, { pool: 1, rar: 'legendary', tags: ['I.M.P.', 'Imp'], kw: ['rush'], emoji: '🪓',
  text: '<b>Rush</b><br><i>คอมโบ Moxxie:</i> ได้ +2/+2 และ <b>Lifesteal</b>',
  battlecry: (g, o, t, s) => combo(g, o, s, 'moxxie', '💕 Millie + Moxxie', () => { g.buff(s, 2, 2); s.kw.lifesteal = true; }) });
M('loona', 'Loona', 3, 3, 2, { pool: 1, rar: 'legendary', tags: ['I.M.P.', 'Hellhound'], kw: ['rush'], emoji: '🐺',
  text: '<b>Rush</b>. ทุกครั้งที่โจมตี ได้ +1 พลังโจมตีถาวร<br><i>คอมโบ Blitzø (พ่อลูก):</i> ได้ +2/+2',
  battlecry: (g, o, t, s) => combo(g, o, s, 'blitzo', '👨‍👧 Blitzø + Loona', () => g.buff(s, 2, 2)),
  onAttack: (g, o, s) => g.buff(s, 1, 0) });

// ---- ครอบครัว / คนรอบตัว Blitzø ----
M('barbie_wire', 'Barbie Wire', 4, 3, 5, { pool: 1, rar: 'legendary', tags: ['Imp'], emoji: '🎀', target: 'friendlyMinion', ai: 'buff',
  text: '<b>Battlecry:</b> ให้มินเนี่ยนฝ่ายเรา <b>Taunt</b> และ <b>Lifesteal</b><br><i>คอมโบ Blitzø (ฝาแฝด):</i> ทั้งคู่ +2/+2',
  battlecry: (g, o, t, s) => { if (t) { t.kw.taunt = true; t.kw.lifesteal = true; } pairBuff(g, o, s, 'blitzo', '👯 ฝาแฝด Blitzø + Barbie', 2, 2); } });
M('fizzarolli', 'Fizzarolli', 4, 2, 4, { pool: 1, rar: 'legendary', tags: ['Sin', 'Imp'], kw: ['taunt', 'shield'], emoji: '🤡',
  text: '<b>Taunt</b>. <b>Divine Shield</b>. <b>Deathrattle:</b> เพิ่ม Robo Fizz เข้ามือ<br><i>คอมโบ Blitzø (เพื่อนวัยเด็ก):</i> จั่ว 2 ใบ',
  battlecry: (g, o, t, s) => combo(g, o, s, 'blitzo', '🎪 เพื่อนวัยเด็ก Blitzø + Fizz', () => g.draw(o, 2)),
  deathrattle: (g, o) => g.addHand(o, 'robo_fizz') });
M('verosika', 'Verosika Mayday', 4, 3, 4, { pool: 1, rar: 'legendary', tags: ['Sin'], emoji: '💖',
  text: 'สิ้นเทิร์นของคุณ: ให้มินเนี่ยนอื่นฝ่ายเราแบบสุ่ม +1/+1<br><i>คอมโบ Blitzø (แฟนเก่า):</i> ได้ <b>Divine Shield</b>',
  battlecry: (g, o, t, s) => combo(g, o, s, 'blitzo', '💔 แฟนเก่าเจอกัน!', () => { s.kw.shield = true; }),
  onTurnEnd: (g, o, s) => { const t = rnd(g.mins(o).filter(m => m !== s)); if (t) g.buff(t, 1, 1); } });
M('cash_buckzo', 'Cash Buckzo', 4, 4, 3, { pool: 1, rar: 'rare', tags: ['Imp'], emoji: '🎩',
  text: '<b>Battlecry:</b> ทำ 2 ดาเมจกับศัตรูแบบสุ่ม<br><i>คอมโบ Blitzø (พ่อ):</i> Blitzø ได้ +3 พลังโจมตี',
  battlecry: (g, o, t, s) => { const x = g.randomEnemy(o); if (x) g.dmg(x, 2, s); combo(g, o, s, 'blitzo', '😤 ปมพ่อ Cash + Blitzø', p => g.buff(p, 3, 0)); } });

// ---- Goetia ----
M('stolas', 'Stolas', 6, 4, 7, { pool: 1, rar: 'legendary', tags: ['Goetia'], emoji: '🦉',
  text: 'สิ้นเทิร์นของคุณ: เพิ่มเวทมนตร์สุ่มเข้ามือ<br><i>คอมโบ Blitzø:</i> ทั้งคู่ +2/+2 และ Blitzø ได้ <b>Windfury</b>',
  battlecry: (g, o, t, s) => stolitz(g, o, s),
  onTurnEnd: (g, o) => g.addHand(o, rnd(POOL_SPELLS)) });
M('octavia', 'Octavia', 2, 2, 3, { pool: 1, rar: 'legendary', tags: ['Goetia'], emoji: '🌙',
  text: 'ทุกครั้งที่คุณร่ายเวทมนตร์ ได้ +1/+1<br><i>คอมโบ Stolas (พ่อลูก):</i> จั่ว 2 ใบ',
  battlecry: (g, o, t, s) => combo(g, o, s, 'stolas', '🦉 Stolas + Octavia', () => g.draw(o, 2)),
  onSpell: (g, o, s) => g.buff(s, 1, 1) });
M('stella', 'Stella', 4, 4, 4, { pool: 1, rar: 'legendary', tags: ['Goetia'], emoji: '💅',
  text: '<b>Battlecry:</b> ทำ 1 ดาเมจกับมินเนี่ยนอื่นทั้งหมด<br><i>คอมโบ Andrealphus (พี่ชาย):</i> <b>Freeze</b> มินเนี่ยนศัตรูทั้งหมด',
  battlecry: (g, o, t, s) => {
    g.allMins().forEach(m => { if (m !== s) g.dmg(m, 1, s); });
    combo(g, o, s, 'andrealphus', '❄️ พี่น้อง Stella + Andrealphus', () => g.mins(g.opp(o)).forEach(m => g.freeze(m)));
  } });
M('andrealphus', 'Andrealphus', 5, 4, 6, { pool: 1, rar: 'legendary', tags: ['Goetia'], emoji: '🦚', target: 'enemyMinion', ai: 'freeze',
  text: '<b>Battlecry:</b> <b>Freeze</b> มินเนี่ยนศัตรู<br><i>คอมโบ Stella (น้องสาว):</i> ทำ 2 ดาเมจและ <b>Freeze</b> มินเนี่ยนศัตรูทั้งหมด',
  battlecry: (g, o, t, s) => {
    if (t) g.freeze(t);
    combo(g, o, s, 'stella', '❄️ พี่น้อง Andrealphus + Stella', () => g.mins(g.opp(o)).slice().forEach(m => { g.dmg(m, 2, s); g.freeze(m); }));
  } });
M('paimon', 'Paimon', 8, 6, 6, { pool: 1, rar: 'legendary', tags: ['Goetia'], emoji: '🦁',
  text: '<b>Battlecry:</b> เรียก Royal Guard 3/3 Taunt 2 ตัว<br><i>คอมโบ ราชสำนัก:</i> ถ้ามี Goetia 5 ตัวขึ้นไป ทำ 4 ดาเมจกับมินเนี่ยนศัตรูทั้งหมด',
  battlecry: (g, o) => {
    g.summon(o, 'p_guard'); g.summon(o, 'p_guard');
    if (g.countTag(o, 'Goetia') >= 5) { g.combo('👑 ราชสำนัก Goetia!'); g.mins(g.opp(o)).slice().forEach(m => g.dmg(m, 4, null)); }
  } });

// ---- ศัตรู / บอส ในรูปมินเนี่ยน ----
M('striker', 'Striker', 3, 3, 3, { pool: 1, rar: 'legendary', tags: ['Imp'], kw: ['rush'], emoji: '🤠',
  text: '<b>Rush</b><br><i>คอมโบ Stella (ผู้จ้าง):</i> ทำลายมินเนี่ยนศัตรูแบบสุ่ม 1 ตัว',
  battlecry: (g, o, t, s) => combo(g, o, s, 'stella', '🎯 สัญญาจ้างของ Stella', () => { const x = rnd(g.mins(g.opp(o))); if (x) g.destroy(x); }) });
M('crimson', 'Crimson', 6, 5, 5, { pool: 1, rar: 'legendary', tags: ['Imp'], emoji: '🎩',
  text: '<b>Battlecry:</b> เรียก Crimson Thug 2/2 สองตัว<br><i>คอมโบ Moxxie (ลูกชาย):</i> Moxxie ได้ +3/+3',
  battlecry: (g, o, t, s) => { g.summon(o, 'c_thug'); g.summon(o, 'c_thug'); combo(g, o, s, 'moxxie', '👨‍👦 Crimson + Moxxie', p => g.buff(p, 3, 3)); } });
M('vortex', 'Vortex', 4, 3, 5, { pool: 1, rar: 'legendary', tags: ['Hellhound'], kw: ['taunt'], emoji: '🛡️',
  text: '<b>Taunt</b>. <b>Battlecry:</b> ได้ +1/+1 ต่อ Hellhound อื่นฝ่ายเรา<br><i>คอมโบ Loona:</i> Loona ได้ +2/+2',
  battlecry: (g, o, t, s) => {
    const n = g.mins(o).filter(m => m !== s && hasTag(m, 'Hellhound')).length; if (n) g.buff(s, n, n);
    combo(g, o, s, 'loona', '🐺 เพื่อนซี้ Vortex + Loona', p => g.buff(p, 2, 2));
  } });

// ---- Sins ----
M('asmodeus', 'Asmodeus', 7, 6, 6, { pool: 1, rar: 'legendary', tags: ['Sin'], kw: ['lifesteal'], emoji: '🔥',
  text: '<b>Lifesteal</b>. <b>Battlecry:</b> ฟื้นฟู 6 HP ให้ฮีโร่<br><i>คอมโบ Fizzarolli (คนรัก):</i> ทั้งคู่ +3/+3 และ <b>Divine Shield</b>',
  battlecry: (g, o, t, s) => { g.heal(g.hero(o), 6); pairBuff(g, o, s, 'fizzarolli', '❤️‍🔥 Ozzie + Fizz', 3, 3, true); } });
M('mammon', 'Mammon', 7, 5, 7, { pool: 1, rar: 'legendary', tags: ['Sin'], emoji: '💰',
  text: '<b>Battlecry:</b> ทำดาเมจกับฮีโร่ศัตรูเท่ากับจำนวนการ์ดในมือคุณ (สูงสุด 7)<br><i>คอมโบ Fizzarolli:</i> ขโมยการ์ดสุ่ม 1 ใบจากมือศัตรู',
  battlecry: (g, o, t, s) => {
    combo(g, o, s, 'fizzarolli', '💸 Mammon รีดไถ Fizz', () => g.stealCards(o, 1));
    g.dmg(g.hero(g.opp(o)), Math.min(7, g.P(o).hand.length), s);
  } });
M('beelzebub', 'Beelzebub', 7, 6, 6, { pool: 1, rar: 'legendary', tags: ['Sin'], emoji: '🐝',
  text: '<b>Battlecry:</b> มินเนี่ยนอื่นฝ่ายเรา +2/+2 และฟื้นฟู 5 HP ให้ฮีโร่ของคุณ',
  battlecry: (g, o, t, s) => { g.mins(o).forEach(m => { if (m !== s) g.buff(m, 2, 2); }); g.heal(g.hero(o), 5); } });
M('satan', 'Satan', 9, 8, 8, { pool: 1, rar: 'legendary', tags: ['Sin'], emoji: '😈',
  text: '<b>Battlecry:</b> ทำ 2 ดาเมจกับมินเนี่ยนศัตรูทั้งหมด<br><i>คอมโบ โทสะสะสม:</i> ถ้ามินเนี่ยนฝ่ายเราตายไปแล้ว 4 ตัวขึ้นไปในเกมนี้ ทำ 5 ดาเมจกับศัตรูทั้งหมดแทน (รวมฮีโร่)',
  battlecry: (g, o, t, s) => {
    if (g.P(o).deaths >= 4) { g.combo('😡 โทสะของ Satan!'); g.enemies(o).forEach(x => g.dmg(x, 5, s)); }
    else g.mins(g.opp(o)).slice().forEach(x => g.dmg(x, 2, s));
  } });

// ---- คู่หู / ทีม ----
M('glitz', 'Glitz', 3, 2, 3, { pool: 1, rar: 'rare', tags: ['Imp'], emoji: '💎',
  text: '<i>คอมโบ Glam:</i> ทั้งคู่ +2/+2 และ <b>Divine Shield</b>',
  battlecry: (g, o, t, s) => pairBuff(g, o, s, 'glam', '✨ Glitz & Glam!', 2, 2, true) });
M('glam', 'Glam', 3, 3, 2, { pool: 1, rar: 'rare', tags: ['Imp'], emoji: '💄',
  text: '<i>คอมโบ Glitz:</i> ทั้งคู่ +2/+2 และ <b>Divine Shield</b>',
  battlecry: (g, o, t, s) => pairBuff(g, o, s, 'glitz', '✨ Glitz & Glam!', 2, 2, true) });
M('sallie_may', 'Sallie May', 2, 2, 2, { pool: 1, rar: 'rare', tags: ['Imp'], kw: ['rush'], emoji: '🔪',
  text: '<b>Rush</b><br><i>คอมโบ Millie (พี่สาว):</i> ทั้งคู่ +2/+1',
  battlecry: (g, o, t, s) => pairBuff(g, o, s, 'millie', '🌾 พี่น้อง Millie + Sallie May', 2, 1) });
M('collin', 'Collin', 2, 2, 2, { pool: 1, rar: 'rare', tags: ['Cherub'], kw: ['shield'], emoji: '👼',
  text: '<b>Divine Shield</b><br><i>คอมโบ Cherub Trio:</i> ถ้ามี Collin, Keenie, Cletus ครบ ทั้งสามได้ +3/+3',
  battlecry: (g, o) => cherubTrio(g, o) });
M('keenie', 'Keenie', 2, 1, 3, { pool: 1, rar: 'rare', tags: ['Cherub'], kw: ['shield'], emoji: '😇',
  text: '<b>Divine Shield</b><br><i>คอมโบ Cherub Trio:</i> ถ้ามี Collin, Keenie, Cletus ครบ ทั้งสามได้ +3/+3',
  battlecry: (g, o) => cherubTrio(g, o) });
M('cletus', 'Cletus', 2, 3, 1, { pool: 1, rar: 'rare', tags: ['Cherub'], kw: ['shield'], emoji: '🏹',
  text: '<b>Divine Shield</b><br><i>คอมโบ Cherub Trio:</i> ถ้ามี Collin, Keenie, Cletus ครบ ทั้งสามได้ +3/+3',
  battlecry: (g, o) => cherubTrio(g, o) });

/* ============================== มินเนี่ยนทั่วไป ============================== */
M('imp_van', 'I.M.P. Van', 3, 0, 5, { pool: 1, tags: ['I.M.P.'], kw: ['taunt'], emoji: '🚐',
  text: '<b>Taunt</b>. <b>Deathrattle:</b> เรียก Imp Grunt 2 ตัว',
  deathrattle: (g, o) => { g.summon(o, 'imp_grunt'); g.summon(o, 'imp_grunt'); } });
M('imp_hitman', 'Imp Hitman', 4, 4, 3, { pool: 1, tags: ['I.M.P.', 'Imp'], emoji: '🔪', target: 'enemyMinion', ai: 'dmg', aiN: 2,
  text: '<b>Battlecry:</b> ทำ 2 ดาเมจกับมินเนี่ยนศัตรู',
  battlecry: (g, o, t, s) => { if (t) g.dmg(t, 2, s); } });
M('imp_medic', 'Imp Medic', 2, 2, 2, { pool: 1, tags: ['Imp'], emoji: '💉',
  text: '<b>Battlecry:</b> ฟื้นฟู 3 HP ให้ฮีโร่ของคุณ',
  battlecry: (g, o) => g.heal(g.hero(o), 3) });
M('demon_brute', 'Demon Brute', 5, 5, 6, { pool: 1, tags: ['Imp'], kw: ['taunt'], emoji: '👹', text: '<b>Taunt</b>' });
M('wally', 'Wally Wackford', 1, 1, 2, { pool: 1, tags: ['Imp'], emoji: '🍔', target: 'any', ai: 'dmg', aiN: 1,
  text: '<b>Battlecry:</b> ทำ 1 ดาเมจ',
  battlecry: (g, o, t, s) => { if (t) g.dmg(t, 1, s); } });
M('snake_assassin', 'Snake Assassin', 2, 1, 3, { pool: 1, tags: ['Imp'], kw: ['poison'], emoji: '🐍', text: '<b>Poisonous</b>' });
M('owl_familiar', 'Owl Familiar', 1, 1, 2, { pool: 1, tags: ['Goetia'], emoji: '🦉', text: '<b>Deathrattle:</b> จั่วการ์ด 1 ใบ',
  deathrattle: (g, o) => g.draw(o, 1) });
M('hellhound_pup', 'Hellhound Pup', 1, 1, 1, { pool: 1, tags: ['Hellhound'], kw: ['rush'], emoji: '🐶',
  text: '<b>Rush</b>. <b>Deathrattle:</b> ให้ Hellhound สุ่มฝ่ายเรา +2/+1',
  deathrattle: (g, o) => { const t = rnd(g.mins(o).filter(m => hasTag(m, 'Hellhound'))); if (t) g.buff(t, 2, 1); } });
M('fierce_hound', 'Fierce Hellhound', 2, 3, 2, { pool: 1, tags: ['Hellhound'],
  text: 'เมื่อมินเนี่ยนฝ่ายเราตัวอื่นตาย ได้ +1 พลังโจมตี',
  onFriendlyDeath: (g, o, s) => g.buff(s, 1, 0) });
M('hound_kennel', 'Hellhound Kennel', 5, 2, 6, { pool: 1, rar: 'rare', tags: ['Hellhound'], emoji: '🏠',
  text: 'สิ้นเทิร์นของคุณ: เรียก Hellhound Pup',
  onTurnEnd: (g, o) => g.summon(o, 'hellhound_pup') });

/* ================================ เวทมนตร์ ================================ */
// ---- จั่วการ์ด ----
S('imp_phone', 'I.M.P. Hotline', 1, { pool: 1, tags: ['I.M.P.'], emoji: '📞', text: 'จั่ว 1 ใบ ถ้าคุณมีมินเนี่ยน I.M.P. จั่ว 2 ใบแทน',
  cast: (g, o) => g.draw(o, g.countTag(o, 'I.M.P.') ? 2 : 1) });
S('grimoire', 'Grimoire Page', 2, { pool: 1, tags: ['Goetia'], emoji: '📖', text: 'จั่วการ์ด 2 ใบ',
  cast: (g, o) => g.draw(o, 2) });
S('soul_contract', 'Soul Contract', 1, { pool: 1, tags: ['Sin'], emoji: '🩸', text: 'เสีย 3 HP จั่วการ์ด 2 ใบ',
  cast: (g, o) => { g.dmg(g.hero(o), 3, null); g.draw(o, 2); } });
// ---- ฟื้นฟู ----
S('hotdog', 'Hellmart Hot Dog', 2, { pool: 1, emoji: '🌭', target: 'any', ai: 'heal', text: 'ฟื้นฟู 6 HP',
  cast: (g, o, t) => g.heal(t, 6) });
S('ozzies_spa', "Ozzie's Spa Night", 3, { pool: 1, rar: 'rare', tags: ['Sin'], emoji: '🛁', text: 'ฟื้นฟู 8 HP ให้ฮีโร่ของคุณ และได้เกราะ 2',
  cast: (g, o) => { g.heal(g.hero(o), 8); g.armor(o, 2); } });
S('family_dinner', 'Family Dinner', 4, { pool: 1, rar: 'rare', emoji: '🍗', text: 'ฟื้นฟู 4 HP ให้ทุกตัวฝ่ายเรา (รวมฮีโร่) จั่ว 1 ใบ',
  cast: (g, o) => { [...g.mins(o), g.hero(o)].forEach(t => g.heal(t, 4)); g.draw(o, 1); } });
// ---- บัฟ ----
S('sinful_strength', 'Sinful Strength', 1, { pool: 1, emoji: '💪', target: 'friendlyMinion', ai: 'buff', text: 'ให้มินเนี่ยนฝ่ายเรา +2/+2',
  cast: (g, o, t) => g.buff(t, 2, 2) });
S('revenge_contract', 'Revenge Contract', 2, { pool: 1, emoji: '🗡️', target: 'friendlyMinion', ai: 'buff', text: 'ให้มินเนี่ยนฝ่ายเรา +3 พลังโจมตี จั่ว 1 ใบ',
  cast: (g, o, t) => { g.buff(t, 3, 0); g.draw(o, 1); } });
S('sinful_kiss', 'Sinful Kiss', 2, { pool: 1, tags: ['Sin'], emoji: '💋', target: 'friendlyMinion', ai: 'buff',
  text: 'ให้มินเนี่ยนฝ่ายเรา +2 พลังโจมตี และ <b>Lifesteal</b>',
  cast: (g, o, t) => { g.buff(t, 2, 0); t.kw.lifesteal = true; } });
S('alpha_howl', 'Alpha Howl', 2, { pool: 1, rar: 'rare', tags: ['Hellhound'], emoji: '📢', target: 'friendlyMinion', ai: 'buff',
  text: 'ให้มินเนี่ยนฝ่ายเรา +3/+1 ถ้าเป็น Hellhound ได้ <b>Windfury</b> ด้วย',
  cast: (g, o, t) => { g.buff(t, 3, 1); if (hasTag(t, 'Hellhound')) giveWindfury(t); } });
S('office_meeting', 'Office Meeting', 2, { pool: 1, rar: 'rare', tags: ['I.M.P.'], emoji: '📋', aiCond: minionsAtLeast(2),
  text: 'มินเนี่ยนฝ่ายเรา +1/+1 ถ้าเป็น I.M.P. ได้ +2/+2 แทน',
  cast: (g, o) => g.mins(o).forEach(m => hasTag(m, 'I.M.P.') ? g.buff(m, 2, 2) : g.buff(m, 1, 1)) });
S('full_moon', 'Full Moon', 3, { pool: 1, tags: ['Hellhound'], emoji: '🌕', text: 'Hellhound ฝ่ายเราทั้งหมด +2/+2',
  cast: (g, o) => g.mins(o).forEach(m => { if (hasTag(m, 'Hellhound')) g.buff(m, 2, 2); }) });
S('ozzies_show', "Ozzie's Showtime", 4, { pool: 1, rar: 'rare', tags: ['Sin'], emoji: '🎭', aiCond: minionsAtLeast(2),
  text: 'มินเนี่ยนฝ่ายเราทั้งหมด +2/+2',
  cast: (g, o) => g.mins(o).forEach(m => g.buff(m, 2, 2)) });
S('astral_ward', 'Astral Ward', 3, { pool: 1, rar: 'rare', tags: ['Goetia'], emoji: '🌌', aiCond: minionsAtLeast(2),
  text: 'ให้มินเนี่ยนทั้งหมดฝ่ายเรา <b>Divine Shield</b>',
  cast: (g, o) => g.mins(o).forEach(m => { m.kw.shield = true; }) });
// ---- เรียกมินเนี่ยน ----
S('pack_howl', 'Pack Howl', 3, { pool: 1, tags: ['Hellhound'], emoji: '🐾', text: 'เรียก Hellhound 2/2 ที่มี <b>Rush</b> 2 ตัว',
  cast: (g, o) => { g.summon(o, 'hound_token'); g.summon(o, 'hound_token'); } });
S('cherub_squad', 'Cherub Squad', 3, { pool: 1, tags: ['Cherub'], emoji: '👼', text: 'เรียก Cherub 1/2 ที่มี <b>Divine Shield</b> 3 ตัว',
  cast: (g, o) => { for (let i = 0; i < 3; i++) g.summon(o, 'cherub_token'); } });
S('portal_jump', 'Portal Jump', 1, { pool: 1, rar: 'rare', tags: ['Goetia'], emoji: '🌀', target: 'friendlyMinion', ai: 'skip',
  text: 'คืนมินเนี่ยนฝ่ายเรากลับเข้ามือ ค่าร่ายลดลง 1 (ใช้ Battlecry / คอมโบซ้ำได้!)',
  cast: (g, o, t) => g.bounce(t) });
// ---- เด็ค: เรียกจากเด็ค / สับเข้าเด็ค ----
S('hiring_spree', 'Hiring Spree', 3, { pool: 1, rar: 'rare', tags: ['I.M.P.'], emoji: '🤝', aiCond: canRecruit,
  text: 'เรียกมินเนี่ยน 1 ตัวออกจากเด็คของคุณ แล้วจั่วการ์ด 1 ใบ',
  cast: (g, o) => { g.recruit(o); g.draw(o, 1); } });
M('imp_recruiter', 'I.M.P. Recruiter', 2, 2, 2, { pool: 1, tags: ['I.M.P.', 'Imp'], emoji: '📇',
  text: '<b>Battlecry:</b> สับ Imp Grunt 2 ใบเข้าเด็คของคุณ แล้วจั่วการ์ด 1 ใบ',
  battlecry: (g, o) => { g.shuffleIn(o, 'imp_grunt', 2); g.draw(o, 1); } });
M('hound_breeder', 'Hellhound Breeder', 3, 2, 3, { pool: 1, tags: ['Hellhound'], emoji: '🐕',
  text: '<b>Deathrattle:</b> สับ Hellhound Pup 2 ใบเข้าเด็คของคุณ และเรียก Hellhound 1 ตัวออกจากเด็ค',
  deathrattle: (g, o) => { g.shuffleIn(o, 'hellhound_pup', 2); g.recruit(o, c => c.tags.includes('Hellhound')); } });
S('banish_portal', 'Banishing Portal', 3, { pool: 1, rar: 'rare', tags: ['Goetia'], emoji: '🕳️', target: 'enemyMinion', ai: 'remove',
  text: 'สับมินเนี่ยนศัตรู 1 ตัวกลับเข้าเด็คของเจ้าของ',
  cast: (g, o, t) => g.tuck(t, t.owner, o) });
// ---- วนเด็ค: Deathrattle สับเข้าเด็ค / จั่วแล้วทำงาน / ได้ประโยชน์จากการสับ ----
M('reborn_imp', 'Reborn Imp', 2, 2, 1, { pool: 1, tags: ['Imp'], emoji: '♻️',
  text: '<b>Deathrattle:</b> สับสำเนาตัวนี้เข้าเด็คของคุณ โดยได้ +1/+1 สะสมไปเรื่อยๆ ทุกรอบ',
  deathrattle: (g, o, m) => { const b = m.bonus || { a: 0, h: 0 }; g.shuffleIn(o, 'reborn_imp', 1, { bonus: { a: b.a + 1, h: b.h + 1 } }); } });
M('lost_sinner', 'Lost Sinner', 2, 2, 2, { pool: 1, tags: ['Sin'], emoji: '👤',
  text: '<b>Deathrattle:</b> สับ Lost Soul 2 ใบเข้าเด็คของคุณ',
  deathrattle: (g, o) => g.shuffleIn(o, 'lost_soul', 2) });
M('robo_factory', 'Robo Fizz Factory', 4, 1, 5, { pool: 1, tags: ['Imp'], kw: ['taunt'], emoji: '🏭',
  text: '<b>Taunt</b>. <b>Deathrattle:</b> สับ Robo Fizz 3 ใบเข้าเด็คของคุณ',
  deathrattle: (g, o) => g.shuffleIn(o, 'robo_fizz', 3) });
M('soul_archivist', 'Soul Archivist', 3, 2, 4, { pool: 1, rar: 'rare', tags: ['Goetia'], emoji: '📚',
  text: 'ทุกครั้งที่มีการ์ดถูกสับเข้าเด็คของคุณ ได้ +1/+1 ต่อใบ',
  onShuffle: (g, o, s, n) => g.buff(s, n, n) });
M('den_mother', 'Den Mother', 4, 3, 5, { pool: 1, rar: 'rare', tags: ['Hellhound'], emoji: '🦴',
  text: '<b>Battlecry:</b> เรียก Hellhound 2 ตัวออกจากเด็คของคุณ',
  battlecry: (g, o) => { const f = c => c.tags.includes('Hellhound'); g.recruit(o, f); g.recruit(o, f); } });
M('headhunter', 'I.M.P. Headhunter', 3, 3, 2, { pool: 1, tags: ['I.M.P.', 'Imp'], emoji: '🔎',
  text: '<b>Battlecry:</b> ค้นเด็ค จั่วมินเนี่ยนที่มีค่าร่ายสูงที่สุดของคุณ 1 ใบ',
  battlecry: (g, o) => g.drawBest(o, c => c.type === 'minion', c => c.cost) });
M('mimzy', 'Mimzy', 4, 3, 4, { pool: 1, rar: 'legendary', tags: ['Imp'], emoji: '🎶',
  text: '<b>Battlecry:</b> สับสำเนามินเนี่ยนอื่นฝ่ายเราทุกตัวเข้าเด็คของคุณ<br><i>คอมโบ Fizzarolli (เพื่อนร่วมเวทีเก่า):</i> สำเนาลดค่าร่าย 2',
  battlecry: (g, o, t, s) => {
    const c = combo(g, o, s, 'fizzarolli', '🎤 Mimzy + Fizz รียูเนียน!', () => {});
    g.mins(o).filter(m => m !== s).forEach(m => g.shuffleIn(o, m.id, 1, { costDelta: c ? -2 : 0 }));
  } });
S('cursed_paperwork', 'Cursed Paperwork', 2, { pool: 1, tags: ['I.M.P.'], emoji: '📦',
  text: 'สับ Cursed Contract 3 ใบเข้าเด็ค<b>ศัตรู</b> (จั่วเมื่อไหร่ ระเบิดใส่ฮีโร่ศัตรู 4 ดาเมจ)',
  cast: (g, o) => g.shuffleIn(g.opp(o), 'cursed_contract', 3, { by: o }) });
S('time_loop', 'Time Loop', 3, { pool: 1, rar: 'rare', tags: ['Goetia'], emoji: '⏳',
  text: 'สับสำเนาการ์ด 3 ใบล่าสุดที่คุณเล่นในเกมนี้เข้าเด็คของคุณ สำเนาลดค่าร่าย 1',
  cast: (g, o) => g.P(o).played.filter(id => id !== 'time_loop').slice(-3).forEach(id => g.shuffleIn(o, id, 1, { costDelta: -1 })) });
S('rally_horn', 'Rally Horn', 4, { pool: 1, rar: 'rare', emoji: '📯', aiCond: canRecruit,
  text: 'เรียกมินเนี่ยน 2 ตัวออกจากเด็คของคุณ ทั้งคู่ได้ +1/+1 และ <b>Rush</b>',
  cast: (g, o) => [g.recruit(o), g.recruit(o)].forEach(m => { if (m) { g.buff(m, 1, 1); m.kw.rush = true; } }) });
S('stolas_prophecy', "Stolas's Prophecy", 5, { pool: 1, rar: 'rare', tags: ['Goetia'], emoji: '🔮',
  text: 'ทำดาเมจกับฮีโร่ศัตรูเท่ากับจำนวนการ์ดที่คุณสับเข้าเด็คในเกมนี้ (สูงสุด 12)',
  cast: (g, o) => g.spellDmg(o, g.hero(g.opp(o)), Math.min(12, g.P(o).shuffled)) });
T('soul_recycler', 'Soul Recycler', 2, { pool: 1, rar: 'rare', emoji: '🔁',
  text: '<b>กับดัก:</b> เมื่อมินเนี่ยนฝ่ายเราตาย สับมันกลับเข้าเด็คของคุณพร้อม +2/+2',
  trap: { on: 'death', fire: (g, o, ev) => g.shuffleIn(o, ev.minion.id, 1, { bonus: { a: 2, h: 2 } }) } });
// ---- กำจัด / เคลียร์บอร์ด ----
S('contract_hit', 'Contract Hit', 2, { pool: 1, tags: ['I.M.P.'], emoji: '📜', target: 'enemyMinion', targetFilter: (g, t) => t.atk <= 3, ai: 'remove',
  text: 'ทำลายมินเนี่ยนศัตรูที่มีพลังโจมตี 3 หรือน้อยกว่า ถ้าคุณมีมินเนี่ยน I.M.P. จั่ว 1 ใบ',
  cast: (g, o, t) => { g.destroy(t); if (g.countTag(o, 'I.M.P.')) g.draw(o, 1); } });
S('execution', 'Execution', 5, { pool: 1, rar: 'rare', emoji: '⚰️', target: 'enemyMinion', ai: 'remove', text: 'ทำลายมินเนี่ยนศัตรู 1 ตัว',
  cast: (g, o, t) => g.destroy(t) });
S('bullet_storm', 'Bullet Storm', 3, { pool: 1, tags: ['I.M.P.'], emoji: '💥', text: 'ทำ 1 ดาเมจกับศัตรูแบบสุ่ม 5 ครั้ง',
  cast: (g, o) => { const n = g.sd(o, 5); for (let i = 0; i < n; i++) { const t = g.randomEnemy(o); if (t) g.spellDmg(o, t, 1, true); } } });
S('frozen_wastes', 'Frozen Wastes', 5, { pool: 1, rar: 'rare', tags: ['Goetia'], emoji: '🌨️', aiCond: enemyHasMinions,
  text: 'ทำ 1 ดาเมจและ <b>Freeze</b> มินเนี่ยนศัตรูทั้งหมด',
  cast: (g, o) => g.mins(g.opp(o)).slice().forEach(m => { g.spellDmg(o, m, 1); g.freeze(m); }) });
S('hellfire_rain', 'Hellfire Rain', 6, { pool: 1, rar: 'rare', emoji: '🌋', aiCond: enemyHasMinions,
  text: 'ทำ 3 ดาเมจกับมินเนี่ยนศัตรูทั้งหมด',
  cast: (g, o) => g.mins(g.opp(o)).slice().forEach(m => g.spellDmg(o, m, 3)) });
S('hells_purge', "Hell's Purge", 8, { pool: 1, rar: 'legendary', emoji: '☢️', aiCond: enemyHasMinions,
  text: 'ทำลายมินเนี่ยน<b>ทั้งหมด</b> (ทั้งสองฝ่าย)',
  cast: (g, o) => g.allMins().forEach(m => g.destroy(m)) });
// ---- ยิงฮีโร่ / บอสโดยตรง ----
S('pentagram_strike', 'Pentagram Strike', 2, { pool: 1, tags: ['Goetia'], emoji: '⛧', text: 'ทำ 3 ดาเมจกับฮีโร่ศัตรู ถ้าคุณมีมินเนี่ยน Goetia ทำ 5 แทน',
  cast: (g, o) => g.spellDmg(o, g.hero(g.opp(o)), g.countTag(o, 'Goetia') ? 5 : 3) });
S('infernal_lance', 'Infernal Lance', 4, { pool: 1, rar: 'rare', emoji: '🔱', text: 'ทำ 6 ดาเมจกับฮีโร่ศัตรู',
  cast: (g, o) => g.spellDmg(o, g.hero(g.opp(o)), 6) });
S('contract_payout', 'Contract Payout', 4, { pool: 1, rar: 'rare', tags: ['I.M.P.'], emoji: '💵',
  text: 'ทำ 2 ดาเมจกับฮีโร่ศัตรู +2 ต่อมินเนี่ยน I.M.P. ฝ่ายเรา',
  cast: (g, o) => g.spellDmg(o, g.hero(g.opp(o)), 2 + 2 * g.countTag(o, 'I.M.P.')) });
S('wrath_of_imps', 'Wrath of Imps', 6, { pool: 1, rar: 'rare', tags: ['I.M.P.'], emoji: '😡',
  text: 'ทำ 2 ดาเมจกับศัตรูทั้งหมด ถ้าคุณมีมินเนี่ยน I.M.P. 3 ตัวขึ้นไป ทำ 4 แทน',
  cast: (g, o) => { const n = g.countTag(o, 'I.M.P.') >= 3 ? 4 : 2; g.enemies(o).forEach(t => g.spellDmg(o, t, n)); } });

/* ================================= กับดัก ================================= */
T('ambush', 'Ambush!', 2, { pool: 1, text: '<b>กับดัก:</b> เมื่อมินเนี่ยนศัตรูโจมตี ทำ 3 ดาเมจกับมันก่อน',
  trap: { on: 'attack', fire: (g, o, ev) => g.dmg(ev.attacker, 3, TRAPSRC(o)) } });
T('decoy', 'Decoy Imp', 1, { pool: 1, emoji: '🎎', text: '<b>กับดัก:</b> เมื่อศัตรูโจมตีฮีโร่ของคุณ เรียก Decoy Imp 1/3 <b>Taunt</b> มารับการโจมตีแทน',
  trap: { on: 'attack', cond: (g, o, ev) => ev.target.kind === 'hero' && g.mins(o).length < MAX_BOARD,
    fire: (g, o, ev) => { const m = g.summon(o, 'decoy_imp'); if (m) ev.target = m; } } });
T('booby_trap', 'Booby Trap', 2, { pool: 1, emoji: '💣', text: '<b>กับดัก:</b> เมื่อศัตรูโจมตีฮีโร่ของคุณ ทำ 5 ดาเมจกับผู้โจมตี',
  trap: { on: 'attack', cond: (g, o, ev) => ev.target.kind === 'hero', fire: (g, o, ev) => g.dmg(ev.attacker, 5, TRAPSRC(o)) } });
T('counter_contract', 'Counter-Contract', 3, { pool: 1, rar: 'rare', emoji: '🚫', text: '<b>กับดัก:</b> เมื่อศัตรูร่ายเวทมนตร์ ยกเลิกเวทนั้น',
  trap: { on: 'spell', fire: (g, o, ev) => { ev.cancel = true; } } });
T('snare', 'Snare', 2, { pool: 1, emoji: '🕸️', text: '<b>กับดัก:</b> เมื่อศัตรูลงมินเนี่ยน ทำ 4 ดาเมจกับมัน',
  trap: { on: 'play_minion', fire: (g, o, ev) => g.dmg(ev.minion, 4, TRAPSRC(o)) } });
T('last_stand', 'Last Stand', 2, { pool: 1, rar: 'rare', emoji: '⚱️', text: '<b>กับดัก:</b> เมื่อมินเนี่ยนฝ่ายเราตาย เรียกมันกลับมาด้วย 1 HP',
  trap: { on: 'death', fire: (g, o, ev) => { const m = g.summon(o, ev.minion.id); if (m) m.hp = 1; } } });
T('bounty_net', 'Bounty Net', 1, { pool: 1, emoji: '🥅', text: '<b>กับดัก:</b> เมื่อมินเนี่ยนศัตรูโจมตี <b>Freeze</b> มันและยกเลิกการโจมตี',
  trap: { on: 'attack', fire: (g, o, ev) => { g.freeze(ev.attacker); ev.cancel = true; } } });

/* ================================= Tokens ================================= */
M('hound_token', 'Hellhound', 2, 2, 2, { token: 1, tags: ['Hellhound'], kw: ['rush'], text: '<b>Rush</b>' });
M('decoy_imp', 'Decoy Imp', 1, 1, 3, { token: 1, tags: ['Imp'], kw: ['taunt'], emoji: '🎎', text: '<b>Taunt</b>' });
M('robo_fizz', 'Robo Fizz', 2, 2, 2, { token: 1, tags: ['Imp'], kw: ['shield'], emoji: '🤖', text: '<b>Divine Shield</b>' });
M('cherub_token', 'Cherub', 1, 1, 2, { token: 1, tags: ['Cherub'], kw: ['shield'], text: '<b>Divine Shield</b>' });
M('soul_wisp', 'Soul Wisp', 1, 1, 1, { token: 1, tags: ['Sin'], kw: ['rush'], emoji: '🕯️', text: '<b>Rush</b>' });
S('lost_soul', 'Lost Soul', 0, { token: 1, emoji: '👻', castOnDraw: 1,
  text: '<b>เมื่อจั่ว:</b> เรียก Soul Wisp 1/1 <b>Rush</b> แล้วจั่วใบใหม่แทน',
  onDraw: (g, o) => g.summon(o, 'soul_wisp') });
S('cursed_contract', 'Cursed Contract', 0, { token: 1, emoji: '💣', castOnDraw: 1,
  text: '<b>เมื่อจั่ว:</b> ระเบิด! ทำ 4 ดาเมจกับฮีโร่ของผู้จั่ว แล้วจั่วใบใหม่แทน',
  onDraw: (g, o) => g.dmg(g.hero(o), 4, null) });

/* =========================== การ์ดของบอส =========================== */
// 1. Striker
M('s_hired_gun', 'Hired Gun', 1, 1, 2, { boss: 'striker', tags: ['Imp'] });
M('s_steed', "Striker's Steed", 2, 2, 3, { boss: 'striker', emoji: '🐎' });
M('s_striker', 'Striker', 3, 3, 2, { boss: 'striker', tags: ['Imp'], kw: ['rush'], emoji: '🤠',
  text: '<b>Rush</b>. <b>Battlecry:</b> ทำ 1 ดาเมจกับศัตรูแบบสุ่ม<br><i>คอมโบ Striker\'s Steed:</i> ได้ +2/+0 และ <b>Charge</b>',
  battlecry: (g, o, t, s) => {
    const x = g.randomEnemy(o); if (x) g.dmg(x, 1, s);
    combo(g, o, s, 's_steed', '🐎 Striker ขึ้นม้า!', () => { g.buff(s, 2, 0); s.kw.charge = true; });
  } });
M('s_drifter', 'Tumbleweed Drifter', 1, 1, 1, { boss: 'striker', tags: ['Imp'], emoji: '🌵',
  text: '<b>Deathrattle:</b> สับ Hired Gun 1 ใบเข้าเด็คของคุณ',
  deathrattle: (g, o) => g.shuffleIn(o, 's_hired_gun', 1) });
S('s_reload', 'Reload', 1, { boss: 'striker', emoji: '🔄', text: 'สับ Sniper Shot 2 ใบเข้าเด็คของคุณ แล้วจั่วการ์ด 1 ใบ',
  cast: (g, o) => { g.shuffleIn(o, 's_sniper', 2); g.draw(o, 1); } });
S('s_saddle', 'Saddle Up', 2, { boss: 'striker', emoji: '🏇', aiCond: canRecruit, text: 'เรียกมินเนี่ยน 1 ตัวออกจากเด็คของคุณ',
  cast: (g, o) => g.recruit(o) });
S('s_sniper', 'Sniper Shot', 2, { boss: 'striker', emoji: '🎯', target: 'any', ai: 'dmg', aiN: 3, text: 'ทำ 3 ดาเมจ',
  cast: (g, o, t) => g.spellDmg(o, t, 3) });
S('s_lasso', 'Lasso', 1, { boss: 'striker', emoji: '🪢', target: 'enemyMinion', ai: 'freeze', text: '<b>Freeze</b> มินเนี่ยนศัตรู จั่วการ์ด 1 ใบ',
  cast: (g, o, t) => { g.freeze(t); g.draw(o, 1); } });
T('s_ambush', 'Desert Ambush', 2, { boss: 'striker', text: '<b>กับดัก:</b> เมื่อมินเนี่ยนศัตรูโจมตี ทำ 2 ดาเมจกับมันก่อน',
  trap: { on: 'attack', fire: (g, o, ev) => g.dmg(ev.attacker, 2, TRAPSRC(o)) } });

// 2. Verosika Mayday
M('v_backup', 'Backup Singer', 1, 1, 1, { boss: 'verosika', kw: ['shield'], emoji: '🎤', text: '<b>Divine Shield</b>' });
M('v_groupie', 'Succubus Groupie', 2, 2, 2, { boss: 'verosika', emoji: '💋',
  text: '<b>Battlecry:</b> ฟื้นฟู 3 HP ให้ฮีโร่ของคุณ<br><i>คอมโบ Verosika:</i> ได้ +1/+1 และ <b>Divine Shield</b>',
  battlecry: (g, o, t, s) => { g.heal(g.hero(o), 3); combo(g, o, s, 'v_verosika', '🎤 แฟนคลับตัวยง!', () => { g.buff(s, 1, 1); s.kw.shield = true; }); } });
M('v_fan', 'Obsessed Fan', 1, 1, 2, { boss: 'verosika', emoji: '😍', text: '<b>Deathrattle:</b> สับ Obsessed Fan 1 ใบเข้าเด็คของคุณ',
  deathrattle: (g, o) => g.shuffleIn(o, 'v_fan', 1) });
M('v_manager', 'Tour Manager', 3, 2, 3, { boss: 'verosika', emoji: '📋', text: '<b>Battlecry:</b> สับ Encore! 1 ใบเข้าเด็คของคุณ แล้วจั่วการ์ด 1 ใบ',
  battlecry: (g, o) => { g.shuffleIn(o, 'v_encore', 1); g.draw(o, 1); } });
S('v_tour', 'World Tour', 3, { boss: 'verosika', emoji: '🌍', aiCond: canRecruit, text: 'เรียกมินเนี่ยน 2 ตัวออกจากเด็คของคุณ',
  cast: (g, o) => { g.recruit(o); g.recruit(o); } });
M('v_bouncer', 'Stage Bouncer', 3, 2, 4, { boss: 'verosika', kw: ['taunt'], text: '<b>Taunt</b>' });
S('v_encore', 'Encore!', 2, { boss: 'verosika', emoji: '🎶', aiCond: minionsAtLeast(2), text: 'มินเนี่ยนฝ่ายเราทั้งหมด +1/+1',
  cast: (g, o) => g.mins(o).forEach(m => g.buff(m, 1, 1)) });
S('v_charm', 'Charm Song', 4, { boss: 'verosika', emoji: '💘', target: 'enemyMinion', targetFilter: (g, t) => t.atk <= 2, ai: 'steal',
  text: 'ควบคุมมินเนี่ยนศัตรูที่มีพลังโจมตี 2 หรือน้อยกว่า',
  cast: (g, o, t) => g.steal(o, t) });
M('v_verosika', 'Verosika Mayday', 5, 3, 5, { boss: 'verosika', emoji: '💖', text: 'สิ้นเทิร์นของคุณ: มินเนี่ยนอื่นฝ่ายเรา +1/+1',
  onTurnEnd: (g, o, s) => g.mins(o).forEach(m => { if (m !== s) g.buff(m, 1, 1); }) });
T('v_heartbreak', 'Heartbreak', 2, { boss: 'verosika', text: '<b>กับดัก:</b> เมื่อมินเนี่ยนศัตรูโจมตี ยกเลิกการโจมตี และมันเสีย 2 พลังโจมตี',
  trap: { on: 'attack', fire: (g, o, ev) => { ev.cancel = true; g.buff(ev.attacker, -2, 0); } } });

// 3. Crimson
M('c_thug', 'Crimson Thug', 2, 2, 2, { boss: 'crimson', tags: ['Imp'] });
M('c_rat', 'Gang Rat', 1, 1, 1, { token: 1, boss: 'crimson', tags: ['Imp'], emoji: '🐀' });
M('c_gunman', 'Gang Gunman', 3, 3, 2, { boss: 'crimson', tags: ['Imp'], emoji: '🔫',
  text: '<b>Battlecry:</b> ทำ 2 ดาเมจกับศัตรูแบบสุ่ม<br><i>คอมโบ Crimson:</i> ยิงซ้ำอีก 1 ครั้ง',
  battlecry: (g, o, t, s) => {
    const shoot = () => { const x = g.randomEnemy(o); if (x) g.dmg(x, 2, s); };
    shoot();
    combo(g, o, s, 'c_crimson', '🎩 ลูกน้องคนโปรดของ Crimson', shoot);
  } });
M('c_lieutenant', 'Gang Lieutenant', 4, 3, 4, { boss: 'crimson', tags: ['Imp'], emoji: '🕶️',
  text: '<b>Battlecry:</b> เรียก Crimson Thug 1 ตัวออกจากเด็คของคุณ',
  battlecry: (g, o) => g.recruit(o, c => c.id === 'c_thug') });
S('c_recruit', 'Gang Recruitment', 2, { boss: 'crimson', emoji: '📝', text: 'สับ Crimson Thug 3 ใบเข้าเด็คของคุณ แล้วจั่วการ์ด 1 ใบ',
  cast: (g, o) => { g.shuffleIn(o, 'c_thug', 3); g.draw(o, 1); } });
S('c_backup', 'Call for Backup', 4, { boss: 'crimson', emoji: '🚨', aiCond: canRecruit, text: 'เรียกมินเนี่ยน 2 ตัวออกจากเด็คของคุณ',
  cast: (g, o) => { g.recruit(o); g.recruit(o); } });
M('c_bodyguard', 'Crimson Bodyguard', 4, 3, 6, { boss: 'crimson', kw: ['taunt'], text: '<b>Taunt</b>' });
S('c_call_gang', 'Call the Gang', 3, { boss: 'crimson', emoji: '📞', text: 'เรียก Gang Rat 1/1 3 ตัว',
  cast: (g, o) => { for (let i = 0; i < 3; i++) g.summon(o, 'c_rat'); } });
S('c_molotov', 'Molotov', 3, { boss: 'crimson', emoji: '🍾', aiCond: enemyHasMinions, text: 'ทำ 2 ดาเมจกับมินเนี่ยนศัตรูทั้งหมด',
  cast: (g, o) => g.mins(g.opp(o)).slice().forEach(m => g.spellDmg(o, m, 2)) });
T('c_knife', 'Dirty Knife', 2, { boss: 'crimson', text: '<b>กับดัก:</b> เมื่อศัตรูลงมินเนี่ยน ทำ 2 ดาเมจกับมัน',
  trap: { on: 'play_minion', fire: (g, o, ev) => g.dmg(ev.minion, 2, TRAPSRC(o)) } });
M('c_crimson', 'Crimson', 6, 5, 5, { boss: 'crimson', emoji: '🎩', text: '<b>Battlecry:</b> เรียก Crimson Thug 2 ตัว',
  battlecry: (g, o) => { g.summon(o, 'c_thug'); g.summon(o, 'c_thug'); } });

// 4. Andrealphus
M('a_ice_imp', 'Ice Imp', 1, 1, 3, { boss: 'andrealphus', emoji: '❄️' });
M('a_golem', 'Ice Golem', 4, 4, 5, { boss: 'andrealphus', kw: ['freezer'], emoji: '🧊', text: '<b>Freeze</b> ตัวที่โดนดาเมจจากมินเนี่ยนนี้' });
M('a_wall', 'Ice Wall', 3, 1, 7, { boss: 'andrealphus', kw: ['taunt'], emoji: '🧱', text: '<b>Taunt</b>' });
S('a_frostbolt', 'Frost Bolt', 2, { boss: 'andrealphus', emoji: '🌨️', target: 'any', ai: 'dmg', aiN: 3, text: 'ทำ 3 ดาเมจ และ <b>Freeze</b>',
  cast: (g, o, t) => { g.spellDmg(o, t, 3); g.freeze(t); } });
S('a_blizzard', 'Blizzard', 6, { boss: 'andrealphus', emoji: '🌬️', aiCond: enemyHasMinions, text: 'ทำ 2 ดาเมจกับมินเนี่ยนศัตรูทั้งหมด และ <b>Freeze</b>',
  cast: (g, o) => g.mins(g.opp(o)).slice().forEach(m => { g.spellDmg(o, m, 2); g.freeze(m); }) });
S('a_armor', 'Frozen Armor', 3, { boss: 'andrealphus', emoji: '🛡️', text: 'ได้เกราะ 6',
  cast: (g, o) => g.armor(o, 6) });
T('a_icetrap', 'Ice Trap', 2, { boss: 'andrealphus', text: '<b>กับดัก:</b> เมื่อมินเนี่ยนศัตรูโจมตี <b>Freeze</b> มันและยกเลิกการโจมตี',
  trap: { on: 'attack', fire: (g, o, ev) => { g.freeze(ev.attacker); ev.cancel = true; } } });
M('a_sculptor', 'Snow Sculptor', 2, 2, 2, { boss: 'andrealphus', emoji: '⛄', text: '<b>Battlecry:</b> สับ Ice Wall 1 ใบเข้าเด็คของคุณ',
  battlecry: (g, o) => g.shuffleIn(o, 'a_wall', 1) });
M('a_frost_knight', 'Frost Knight', 5, 4, 6, { boss: 'andrealphus', kw: ['freezer'], emoji: '🤺',
  text: '<b>Freeze</b> ตัวที่โดนดาเมจจากมินเนี่ยนนี้<br><i>คอมโบ Andrealphus:</i> ได้ +2/+2 และ <b>Taunt</b>',
  battlecry: (g, o, t, s) => combo(g, o, s, 'a_andrealphus', '❄️ อัศวินของเจ้าชาย', () => { g.buff(s, 2, 2); s.kw.taunt = true; }) });
S('a_prison', 'Ice Prison', 3, { boss: 'andrealphus', emoji: '🧊', target: 'enemyMinion', ai: 'remove',
  text: 'สับมินเนี่ยนศัตรู 1 ตัวกลับเข้าเด็คของเจ้าของ',
  cast: (g, o, t) => g.tuck(t) });
S('a_legion', 'Frozen Legion', 5, { boss: 'andrealphus', emoji: '🏔️', aiCond: canRecruit, text: 'เรียกมินเนี่ยน 2 ตัวออกจากเด็คของคุณ',
  cast: (g, o) => { g.recruit(o); g.recruit(o); } });
M('a_andrealphus', 'Andrealphus', 7, 6, 8, { boss: 'andrealphus', emoji: '🦚', text: '<b>Battlecry:</b> <b>Freeze</b> มินเนี่ยนศัตรูทั้งหมด',
  battlecry: (g, o) => g.mins(g.opp(o)).forEach(m => g.freeze(m)) });

// 5. Paimon
M('p_servant', 'Owl Servant', 1, 1, 2, { boss: 'paimon', tags: ['Goetia'], emoji: '🦉', text: '<b>Deathrattle:</b> จั่วการ์ด 1 ใบ',
  deathrattle: (g, o) => g.draw(o, 1) });
M('p_guard', 'Royal Guard', 3, 3, 3, { boss: 'paimon', tags: ['Goetia'], kw: ['taunt'], emoji: '💂', text: '<b>Taunt</b>' });
M('p_knight', 'Goetia Knight', 5, 5, 5, { boss: 'paimon', tags: ['Goetia'], kw: ['shield'], emoji: '⚔️',
  text: '<b>Divine Shield</b><br><i>คอมโบ Paimon:</i> ได้ +2/+2 และ <b>Taunt</b>',
  battlecry: (g, o, t, s) => combo(g, o, s, 'p_paimon', '👑 อัศวินถวายสัตย์', () => { g.buff(s, 2, 2); s.kw.taunt = true; }) });
M('p_herald', 'Royal Herald', 2, 2, 2, { boss: 'paimon', tags: ['Goetia'], emoji: '📯', text: '<b>Battlecry:</b> สับ Royal Guard 2 ใบเข้าเด็คของคุณ',
  battlecry: (g, o) => g.shuffleIn(o, 'p_guard', 2) });
S('p_summons', 'Royal Summons', 3, { boss: 'paimon', emoji: '📜', aiCond: canRecruit, text: 'เรียกมินเนี่ยน Goetia 2 ตัวออกจากเด็คของคุณ',
  cast: (g, o) => { const f = c => c.tags.includes('Goetia'); g.recruit(o, f); g.recruit(o, f); } });
S('p_banish', 'Royal Banishment', 4, { boss: 'paimon', emoji: '🚪', target: 'enemyMinion', ai: 'remove',
  text: 'สับมินเนี่ยนศัตรู 1 ตัวกลับเข้าเด็คของเจ้าของ แล้วจั่วการ์ด 1 ใบ',
  cast: (g, o, t) => { g.tuck(t); g.draw(o, 1); } });
S('p_noble', 'Noble Blood', 2, { boss: 'paimon', emoji: '🩸', target: 'friendlyMinion', ai: 'buff', text: 'ให้มินเนี่ยนฝ่ายเรา +2/+2 และ <b>Taunt</b>',
  cast: (g, o, t) => { g.buff(t, 2, 2); t.kw.taunt = true; } });
S('p_decree', 'Royal Decree', 5, { boss: 'paimon', emoji: '📜', aiCond: enemyHasMinions, text: 'ทำลายมินเนี่ยนศัตรูที่มีพลังโจมตีสูงสุด',
  cast: (g, o) => { const ms = g.mins(g.opp(o)); if (ms.length) g.destroy(ms.reduce((a, b) => (b.atk > a.atk ? b : a))); } });
T('p_reinforce', 'Royal Reinforcement', 2, { boss: 'paimon', text: '<b>กับดัก:</b> เมื่อมินเนี่ยนฝ่ายเราตาย เรียก Royal Guard',
  trap: { on: 'death', fire: (g, o) => g.summon(o, 'p_guard') } });
M('p_paimon', 'Paimon', 8, 7, 7, { boss: 'paimon', tags: ['Goetia'], emoji: '🦁', text: 'สิ้นเทิร์นของคุณ: เรียก Royal Guard',
  onTurnEnd: (g, o) => g.summon(o, 'p_guard') });

// 6. Mammon
S('m_coin', 'Golden Coin', 0, { boss: 'mammon', aiFirst: 1, emoji: '🪙', text: 'ได้ 1 มานาในเทิร์นนี้ จั่วการ์ด 1 ใบ',
  cast: (g, o) => { g.P(o).mana++; g.draw(o, 1); } });
M('m_greedy', 'Greedy Imp', 2, 2, 3, { boss: 'mammon', tags: ['Imp'], emoji: '🤑',
  text: '<b>Battlecry:</b> จั่วการ์ด 1 ใบ<br><i>คอมโบ Mammon:</i> จั่วเพิ่มอีก 1 ใบ',
  battlecry: (g, o, t, s) => { g.draw(o, 1); combo(g, o, s, 'm_mammon', '💰 ลูกน้องเจ้าหนี้', () => g.draw(o, 1)); } });
M('m_accountant', 'Greedy Accountant', 3, 2, 4, { boss: 'mammon', tags: ['Imp'], emoji: '🧮',
  text: '<b>Battlecry:</b> ยึดการ์ดสุ่ม 1 ใบจากมือศัตรู สับเข้าเด็คของคุณ',
  battlecry: (g, o) => g.stealToDeck(o, 1) });
S('m_invest', 'Investment', 2, { boss: 'mammon', emoji: '📈', text: 'สับ Golden Coin 2 ใบเข้าเด็คของคุณ แล้วจั่วการ์ด 1 ใบ',
  cast: (g, o) => { g.shuffleIn(o, 'm_coin', 2); g.draw(o, 1); } });
S('m_buyout', 'Hostile Buyout', 5, { boss: 'mammon', emoji: '🏢', aiCond: canRecruit, text: 'เรียกมินเนี่ยน 2 ตัวออกจากเด็คของคุณ',
  cast: (g, o) => { g.recruit(o); g.recruit(o); } });
M('m_mascot', 'Mammon Mascot', 4, 4, 4, { boss: 'mammon', emoji: '🎪', text: 'สิ้นเทิร์นของคุณ: ทำ 1 ดาเมจกับศัตรูทั้งหมด',
  onTurnEnd: (g, o, s) => g.enemies(o).forEach(t => g.dmg(t, 1, s)) });
M('m_guard', 'Gold Guard', 5, 4, 7, { boss: 'mammon', kw: ['taunt'], emoji: '🏦', text: '<b>Taunt</b>' });
S('m_exploit', 'Exploitative Contract', 4, { boss: 'mammon', emoji: '📝', target: 'enemyMinion', targetFilter: (g, t) => t.atk <= 3, ai: 'steal',
  text: 'ควบคุมมินเนี่ยนศัตรูที่มีพลังโจมตี 3 หรือน้อยกว่า',
  cast: (g, o, t) => g.steal(o, t) });
S('m_money', 'Money Shower', 6, { boss: 'mammon', emoji: '💸', aiCond: minionsAtLeast(2), text: 'มินเนี่ยนฝ่ายเราทั้งหมด +2/+2',
  cast: (g, o) => g.mins(o).forEach(m => g.buff(m, 2, 2)) });
T('m_tax', 'Tax Collector', 2, { boss: 'mammon', text: '<b>กับดัก:</b> เมื่อศัตรูร่ายเวทมนตร์ เพิ่มสำเนาของเวทนั้นเข้ามือคุณ',
  trap: { on: 'spell', fire: (g, o, ev) => g.addHand(o, ev.card.id) } });
M('m_mammon', 'Mammon', 8, 6, 9, { boss: 'mammon', tags: ['Sin'], emoji: '💰', text: '<b>Battlecry:</b> ขโมยการ์ดสุ่ม 2 ใบจากมือศัตรู',
  battlecry: (g, o) => g.stealCards(o, 2) });

// 7. Asmodeus
M('as_dancer', "Ozzie's Dancer", 2, 2, 3, { boss: 'asmodeus', kw: ['lifesteal'], emoji: '💃', text: '<b>Lifesteal</b>' });
M('as_bouncer', 'Velvet Bouncer', 3, 3, 4, { boss: 'asmodeus', kw: ['taunt'], text: '<b>Taunt</b>' });
M('as_fizz', 'Fizzarolli (Showtime)', 4, 3, 5, { boss: 'asmodeus', tags: ['Imp'], kw: ['taunt', 'shield'], emoji: '🤡',
  text: '<b>Taunt</b>. <b>Divine Shield</b><br><i>คอมโบ Asmodeus:</i> ทั้งคู่ +2/+2',
  battlecry: (g, o, t, s) => pairBuff(g, o, s, 'as_asmodeus', '❤️‍🔥 Ozzie + Fizz ออนสเตจ!', 2, 2) });
M('as_fan', "Ozzie's Fan", 1, 1, 2, { boss: 'asmodeus', kw: ['lifesteal'], emoji: '🥰', text: '<b>Lifesteal</b>. <b>Deathrattle:</b> สับ Ozzie\'s Dancer 1 ใบเข้าเด็คของคุณ',
  deathrattle: (g, o) => g.shuffleIn(o, 'as_dancer', 1) });
S('as_opening', 'Grand Opening', 5, { boss: 'asmodeus', emoji: '🎉', aiCond: canRecruit, text: 'เรียกมินเนี่ยน 2 ตัวออกจากเด็คของคุณ ทั้งคู่ได้ <b>Lifesteal</b>',
  cast: (g, o) => { [g.recruit(o), g.recruit(o)].forEach(m => { if (m) m.kw.lifesteal = true; }); } });
S('as_forbidden', 'Forbidden Love', 4, { boss: 'asmodeus', emoji: '💌', target: 'enemyMinion', ai: 'remove',
  text: 'สับมินเนี่ยนศัตรู 1 ตัวเข้าเด็ค<b>ของคุณ</b> (ยึดมาเป็นการ์ดของคุณ)',
  cast: (g, o, t) => g.tuck(t, o) });
S('as_seduce', 'Seduction', 5, { boss: 'asmodeus', emoji: '😍', target: 'enemyMinion', targetFilter: (g, t) => t.atk <= 4, ai: 'steal',
  text: 'ควบคุมมินเนี่ยนศัตรูที่มีพลังโจมตี 4 หรือน้อยกว่า',
  cast: (g, o, t) => g.steal(o, t) });
S('as_wave', 'Lust Wave', 3, { boss: 'asmodeus', emoji: '💞', text: 'มินเนี่ยนฝ่ายเรา +1/+1 และฟื้นฟู 4 HP ให้ฮีโร่ของคุณ',
  cast: (g, o) => { g.mins(o).forEach(m => g.buff(m, 1, 1)); g.heal(g.hero(o), 4); } });
T('as_heartlock', 'Heart Lock', 2, { boss: 'asmodeus', text: '<b>กับดัก:</b> เมื่อมินเนี่ยนศัตรูโจมตี ยกเลิกการโจมตี และมันกลายเป็น 1/1',
  trap: { on: 'attack', fire: (g, o, ev) => { ev.cancel = true; const a = ev.attacker; a.atk = 1; a.hp = 1; a.maxHp = 1; } } });
M('as_demon', 'Lust Demon', 6, 6, 6, { boss: 'asmodeus', kw: ['lifesteal', 'rush'], text: '<b>Rush</b>. <b>Lifesteal</b>' });
M('as_asmodeus', 'Asmodeus', 9, 8, 8, { boss: 'asmodeus', tags: ['Sin'], kw: ['lifesteal'], emoji: '🔥',
  text: '<b>Lifesteal</b>. <b>Battlecry:</b> มินเนี่ยนอื่นฝ่ายเรา +2/+2 และ <b>Lifesteal</b>',
  battlecry: (g, o, t, s) => g.mins(o).forEach(m => { if (m !== s) { g.buff(m, 2, 2); m.kw.lifesteal = true; } }) });

// 8. Satan
M('sa_wrath', 'Wrath Demon', 3, 4, 3, { boss: 'satan', kw: ['rush'], emoji: '😡', text: '<b>Rush</b>' });
M('sa_brute', 'Hell Brute', 6, 6, 7, { boss: 'satan', kw: ['taunt'], emoji: '👹', text: '<b>Taunt</b><br><i>คอมโบ Satan:</i> ได้ +3/+3',
  battlecry: (g, o, t, s) => combo(g, o, s, 'sa_satan', '😈 องครักษ์แห่งโทสะ', () => g.buff(s, 3, 3)) });
M('sa_herald', 'Wrath Herald', 3, 3, 3, { boss: 'satan', emoji: '📯', text: '<b>Battlecry:</b> สับ Wrath Demon 2 ใบเข้าเด็คของคุณ',
  battlecry: (g, o) => g.shuffleIn(o, 'sa_wrath', 2) });
M('sa_spirit', 'Vengeful Spirit', 2, 2, 1, { boss: 'satan', emoji: '👻', text: '<b>Deathrattle:</b> เรียกมินเนี่ยน 1 ตัวออกจากเด็คของคุณ',
  deathrattle: (g, o) => g.recruit(o) });
S('sa_hellgate', 'Hellgate', 6, { boss: 'satan', emoji: '⛩️', aiCond: canRecruit, text: 'เรียกมินเนี่ยน 3 ตัวออกจากเด็คของคุณ',
  cast: (g, o) => { g.recruit(o); g.recruit(o); g.recruit(o); } });
M('sa_rager', 'Rage Demon', 5, 5, 4, { boss: 'satan', kw: ['charge'], emoji: '💢', text: '<b>Charge</b>' });
S('sa_hellfire', 'Infernal Blast', 4, { boss: 'satan', emoji: '🔥', target: 'any', ai: 'dmg', aiN: 5, text: 'ทำ 5 ดาเมจ',
  cast: (g, o, t) => g.spellDmg(o, t, 5) });
S('sa_inferno', 'Inferno', 7, { boss: 'satan', emoji: '🌋', aiCond: enemyHasMinions, text: 'ทำ 4 ดาเมจกับมินเนี่ยนศัตรูทั้งหมด และ 2 ดาเมจกับฮีโร่ศัตรู',
  cast: (g, o) => { g.mins(g.opp(o)).slice().forEach(m => g.spellDmg(o, m, 4)); g.spellDmg(o, g.hero(g.opp(o)), 2); } });
S('sa_legion', 'Imp Legion', 5, { boss: 'satan', emoji: '👿', text: 'เรียก Legion Imp 2/2 4 ตัว',
  cast: (g, o) => { for (let i = 0; i < 4; i++) g.summon(o, 'sa_legion_imp'); } });
M('sa_legion_imp', 'Legion Imp', 2, 2, 2, { token: 1, boss: 'satan', tags: ['Imp'], emoji: '👿' });
T('sa_fury', 'Eternal Fury', 2, { boss: 'satan', text: '<b>กับดัก:</b> เมื่อมินเนี่ยนฝ่ายเราตาย ทำ 3 ดาเมจกับฮีโร่ศัตรู',
  trap: { on: 'death', fire: (g, o) => g.dmg(g.hero(g.opp(o)), 3, TRAPSRC(o)) } });
M('sa_satan', 'Satan', 10, 10, 10, { boss: 'satan', tags: ['Sin'], emoji: '😈', text: '<b>Battlecry:</b> ทำ 3 ดาเมจกับศัตรูทั้งหมด',
  battlecry: (g, o, t, s) => g.enemies(o).forEach(x => g.dmg(x, 3, s)) });


/* ------------------------------ คอมโบ (ใช้แสดงผล) ------------------------------
   COMBO_WITH[id] = รายการคู่หูที่การ์ดใบนี้ต้องมีบนบอร์ดเพื่อทำคอมโบ
   ตอนชี้การ์ด จะแสดงทั้งคู่หูของมัน และการ์ดที่ใช้มันเป็นคู่หู */
const COMBO_WITH = {
  blitzo: ['stolas'], stolas: ['blitzo'], moxxie: ['millie'], millie: ['moxxie'], loona: ['blitzo'],
  barbie_wire: ['blitzo'], fizzarolli: ['blitzo'], verosika: ['blitzo'], cash_buckzo: ['blitzo'],
  octavia: ['stolas'], stella: ['andrealphus'], andrealphus: ['stella'], striker: ['stella'],
  crimson: ['moxxie'], vortex: ['loona'], asmodeus: ['fizzarolli'], mammon: ['fizzarolli'],
  glitz: ['glam'], glam: ['glitz'], sallie_may: ['millie'], mimzy: ['fizzarolli'],
  collin: ['keenie', 'cletus'], keenie: ['collin', 'cletus'], cletus: ['collin', 'keenie'],
  // บอส
  s_striker: ['s_steed'], v_groupie: ['v_verosika'], c_gunman: ['c_crimson'], a_frost_knight: ['a_andrealphus'],
  p_knight: ['p_paimon'], m_greedy: ['m_mammon'], as_fizz: ['as_asmodeus'], sa_brute: ['sa_satan'],
};
const COMBO_NEEDS_ALL = new Set(['collin', 'keenie', 'cletus']);
// คอมโบแบบเงื่อนไข (ไม่มีคู่หูเฉพาะ)
const COMBO_READY = {
  paimon: (g, o) => g.countTag(o, 'Goetia') + Math.min(2, MAX_BOARD - 1 - g.mins(o).length) >= 5,
  satan: (g, o) => g.P(o).deaths >= 4,
};
/* SYNERGY[id] = การ์ดที่เล่นด้วยกันแล้วเข้ากันได้ดี (ไม่ใช่คอมโบโดยตรง) — แสดงในป๊อปอัปตอนชี้การ์ด */
const SYNERGY = {
  soul_archivist: ['reborn_imp', 'lost_sinner', 'robo_factory', 'time_loop', 'mimzy', 'imp_recruiter', 'soul_recycler'],
  stolas_prophecy: ['cursed_paperwork', 'time_loop', 'mimzy', 'lost_sinner', 'robo_factory', 'soul_recycler'],
  reborn_imp: ['soul_recycler', 'soul_archivist', 'rally_horn'],
  soul_recycler: ['reborn_imp', 'imp_van', 'fizzarolli', 'rally_horn'],
  lost_sinner: ['soul_archivist', 'stolas_prophecy', 'fierce_hound'],
  robo_factory: ['rally_horn', 'hiring_spree', 'soul_archivist'],
  den_mother: ['hound_breeder', 'hellhound_pup', 'vortex', 'loona'],
  hound_breeder: ['den_mother', 'full_moon'],
  rally_horn: ['imp_recruiter', 'robo_factory', 'reborn_imp'],
  hiring_spree: ['imp_recruiter', 'robo_factory'],
  headhunter: ['satan', 'paimon', 'stolas', 'beelzebub'],
  time_loop: ['portal_jump', 'hellfire_rain', 'contract_hit', 'soul_archivist'],
  mimzy: ['soul_archivist', 'stolas_prophecy', 'rally_horn'],
  cursed_paperwork: ['stolas_prophecy'],
  imp_recruiter: ['office_meeting', 'contract_payout'],
};
function synergyPartners(id) {
  const s = new Set(SYNERGY[id] || []);
  for (const [k, v] of Object.entries(SYNERGY)) if (v.includes(id)) s.add(k);
  s.delete(id);
  comboPartners(id).forEach(x => s.delete(x));
  return [...s].filter(x => CARDS[x]);
}
function comboPartners(id) {
  const s = new Set(COMBO_WITH[id] || []);
  for (const [k, v] of Object.entries(COMBO_WITH)) if (v.includes(id)) s.add(k);
  s.delete(id);
  return [...s].filter(x => CARDS[x]);
}
// ถ้าลงการ์ดนี้ตอนนี้ คอมโบจะทำงานไหม
function comboReady(g, o, c) {
  if (COMBO_READY[c.id]) return COMBO_READY[c.id](g, o);
  const need = COMBO_WITH[c.id];
  if (!need) return false;
  const on = id => g.onBoard(o, id);
  return COMBO_NEEDS_ALL.has(c.id) ? need.every(on) : need.some(on);
}

/* ------------------------------ รายการรวม ------------------------------ */
const POOL = Object.values(CARDS).filter(c => c.pool).map(c => c.id);
const POOL_SPELLS = POOL.filter(id => CARDS[id].type === 'spell' && CARDS[id].ai !== 'skip');
const POOL_TRAPS = POOL.filter(id => CARDS[id].type === 'trap');
const POOL_LEGENDS = POOL.filter(id => CARDS[id].rar === 'legendary' && CARDS[id].type === 'minion');
// โอกาสสุ่มเจอการ์ดแต่ละระดับ (ตำนานเจอยากกว่า)
const CARD_RARITY_WEIGHT = { common: 5, rare: 3, legendary: 2 };
function sampleCards(n, ids = POOL) {
  const left = [...ids], out = [];
  while (out.length < n && left.length) {
    const total = left.reduce((s, id) => s + CARD_RARITY_WEIGHT[CARDS[id].rar], 0);
    let x = Math.random() * total, i = 0;
    for (; i < left.length - 1; i++) { x -= CARD_RARITY_WEIGHT[CARDS[left[i]].rar]; if (x <= 0) break; }
    out.push(left.splice(i, 1)[0]);
  }
  return out;
}

/* =============================== ฮีโร่ =============================== */
// รูป: assets/heroes/<id>.png
const HEROES = {
  blitzo: { id: 'blitzo', name: 'Blitzø', title: 'บอสแห่ง I.M.P.', emoji: '🔫',
    desc: 'สายบุก — Charge, ยิงกระจาย และบัฟทีม I.M.P.',
    deck: ['imp_grunt', 'imp_grunt', 'imp_bouncer', 'imp_brute', 'hellfire_bolt', 'hellfire_bolt', 'brimstone_shot', 'blitzo', 'bullet_storm', 'office_meeting'] },
  moxxie: { id: 'moxxie', name: 'Moxxie', title: 'มือปืนนักวางแผน', emoji: '🎯',
    desc: 'สายควบคุม — กับดัก, ยิงมินเนี่ยนศัตรู และตั้งรับ',
    deck: ['imp_grunt', 'imp_bouncer', 'imp_bouncer', 'hellfire_bolt', 'brimstone_shot', 'brimstone_shot', 'hellmart_snack', 'moxxie', 'ambush', 'decoy'] },
  millie: { id: 'millie', name: 'Millie', title: 'นักสู้สายลุย', emoji: '🪓',
    desc: 'สายบัฟ — Rush, บัฟมินเนี่ยนให้ใหญ่แล้วบดขยี้',
    deck: ['imp_grunt', 'imp_grunt', 'imp_bouncer', 'imp_brute', 'imp_brute', 'hellfire_bolt', 'millie', 'sallie_may', 'sinful_strength', 'sinful_strength'] },
  loona: { id: 'loona', name: 'Loona', title: 'Hellhound ขี้หงุดหงิด', emoji: '🐺',
    desc: 'สายฝูง — เรียก Hellhound จำนวนมาก โตขึ้นเมื่อเพื่อนตาย',
    deck: ['imp_grunt', 'imp_bouncer', 'hellfire_bolt', 'brimstone_shot', 'hellmart_snack', 'loona', 'hellhound_pup', 'hellhound_pup', 'fierce_hound', 'pack_howl'] },
};

/* =============================== บอส =============================== */
// รูป: assets/bosses/<id>.png
const BOSSES = [
  { id: 'striker', name: 'Striker', title: 'นักฆ่ารับจ้าง', hp: 10, emoji: '🤠', desc: 'ลอบโจมตี แช่แข็งด้วยเชือก และซุ่มยิง',
    deck: [['s_hired_gun', 4], ['s_steed', 3], ['s_striker', 2], ['s_sniper', 2], ['s_lasso', 2], ['s_ambush', 1],
      ['s_drifter', 3], ['s_reload', 2], ['s_saddle', 2]] },
  { id: 'verosika', name: 'Verosika Mayday', title: 'ป๊อปสตาร์ซัคคิวบัส', hp: 20, emoji: '💖', desc: 'บัฟทีมทุกเทิร์น และใช้เพลงยั่วยวนขโมยมินเนี่ยน',
    deck: [['v_backup', 4], ['v_groupie', 3], ['v_bouncer', 2], ['v_encore', 2], ['v_charm', 2], ['v_verosika', 1], ['v_heartbreak', 2],
      ['v_fan', 3], ['v_manager', 2], ['v_tour', 2]] },
  { id: 'crimson', name: 'Crimson', title: 'เจ้าพ่อแก๊งค์', hp: 30, emoji: '🎩', desc: 'ลูกน้องเต็มบอร์ด ยิงสุ่ม และระเบิดเพลิง',
    deck: [['c_thug', 4], ['c_gunman', 3], ['c_bodyguard', 2], ['c_call_gang', 2], ['c_molotov', 2], ['c_knife', 2], ['c_crimson', 1],
      ['c_lieutenant', 2], ['c_recruit', 2], ['c_backup', 2]] },
  { id: 'andrealphus', name: 'Andrealphus', title: 'เจ้าชายน้ำแข็ง', hp: 50, emoji: '🦚', desc: 'แช่แข็งทุกสิ่ง กำแพงน้ำแข็ง และเกราะหนา',
    deck: [['a_ice_imp', 4], ['a_golem', 3], ['a_wall', 2], ['a_frostbolt', 3], ['a_blizzard', 2], ['a_armor', 1], ['a_icetrap', 2], ['a_andrealphus', 1],
      ['a_sculptor', 3], ['a_frost_knight', 2], ['a_prison', 2], ['a_legion', 1]] },
  { id: 'paimon', name: 'Paimon', title: 'กษัตริย์แห่ง Goetia', hp: 70, emoji: '🦁', desc: 'ทหารองครักษ์ไม่สิ้นสุด และพระราชโองการทำลายล้าง',
    deck: [['p_servant', 4], ['p_guard', 4], ['p_knight', 3], ['p_noble', 2], ['p_decree', 2], ['p_reinforce', 2], ['p_paimon', 1],
      ['p_herald', 3], ['p_summons', 2], ['p_banish', 2]] },
  { id: 'mammon', name: 'Mammon', title: 'บาปแห่งความโลภ', hp: 90, emoji: '💰', desc: 'ขโมยการ์ด ขโมยมินเนี่ยน และเก็บภาษีเวทมนตร์',
    deck: [['m_coin', 3], ['m_greedy', 4], ['m_mascot', 2], ['m_guard', 3], ['m_exploit', 2], ['m_money', 1], ['m_tax', 2], ['m_mammon', 1],
      ['m_accountant', 2], ['m_invest', 2], ['m_buyout', 2]] },
  { id: 'asmodeus', name: 'Asmodeus', title: 'บาปแห่งตัณหา', hp: 120, emoji: '🔥', bonusMana: 1, desc: 'Lifesteal ทั้งกระดาน และยั่วยวนมินเนี่ยนของคุณ',
    deck: [['as_dancer', 4], ['as_bouncer', 3], ['as_fizz', 2], ['as_seduce', 2], ['as_wave', 2], ['as_heartlock', 2], ['as_demon', 2], ['as_asmodeus', 1],
      ['as_fan', 3], ['as_opening', 2], ['as_forbidden', 2]] },
  { id: 'satan', name: 'Satan', title: 'บาปแห่งโทสะ', hp: 150, emoji: '😈', bonusMana: 2, desc: 'ดาเมจมหาศาล และโกรธจัดเมื่อ HP เหลือครึ่ง (เฟส 2)',
    deck: [['sa_wrath', 4], ['sa_brute', 3], ['sa_rager', 1], ['sa_hellfire', 3], ['sa_inferno', 2], ['sa_legion', 2], ['sa_fury', 2], ['sa_satan', 1],
      ['sa_herald', 2], ['sa_spirit', 3], ['sa_hellgate', 2]],
    onHalf: (g, o) => {
      g.banner('😡 Satan เดือดดาล! — เฟส 2');
      g.summon(o, 'sa_wrath'); g.summon(o, 'sa_wrath'); g.draw(o, 2);
      g.shuffleIn(o, 'sa_rager', 2);
    } },
];
const expandDeck = list => list.flatMap(([id, n]) => Array(n).fill(id));

/* ============================== สมบัติ ============================== */
// รูป: assets/relics/<id>.png   (ผลของสมบัติเขียนไว้ใน engine.js / main.js ตาม id)
const RELICS = {
  r_coupon:   { id: 'r_coupon',   name: 'Hellmart Coupon',      rarity: 'common',    emoji: '🎟️', text: 'HP สูงสุด +5' },
  r_coin:     { id: 'r_coin',     name: 'Lucky Coin',           rarity: 'common',    emoji: '🪙', text: 'เริ่มการต่อสู้ด้วยมานาสูงสุด +1' },
  r_badge:    { id: 'r_badge',    name: 'I.M.P. Badge',         rarity: 'common',    emoji: '🔰', text: 'มินเนี่ยน I.M.P. ได้ +1/+1 เมื่อลงสนาม' },
  r_collar:   { id: 'r_collar',   name: 'Hellhound Collar',     rarity: 'common',    emoji: '🦴', text: 'Hellhound ได้ +1 พลังโจมตี และ Rush เมื่อลงสนาม' },
  r_feather:  { id: 'r_feather',  name: 'Owl Feather',          rarity: 'common',    emoji: '🪶', text: 'เวทมนตร์ใบแรกของแต่ละเทิร์น ลดค่าร่าย 1' },
  r_bullets:  { id: 'r_bullets',  name: 'Spare Bullets',        rarity: 'common',    emoji: '🔫', text: 'ต้นเทิร์นของคุณ ทำ 1 ดาเมจกับศัตรูแบบสุ่ม' },
  r_grimoire: { id: 'r_grimoire', name: "Stolas's Grimoire",    rarity: 'rare',      emoji: '📖', text: 'จั่วการ์ดเริ่มต้นเพิ่ม 2 ใบ' },
  r_vest:     { id: 'r_vest',     name: 'Hellforged Vest',      rarity: 'rare',      emoji: '🦺', text: 'เริ่มการต่อสู้พร้อมเกราะ 8' },
  r_kit:      { id: 'r_kit',      name: "Trapper's Kit",        rarity: 'rare',      emoji: '🧰', text: 'กับดักลดค่าร่าย 1 และเริ่มการต่อสู้พร้อมกับดักสุ่ม 1 ใบในมือ' },
  r_pistol:   { id: 'r_pistol',   name: "Crimson's Pistol",     rarity: 'rare',      emoji: '🔥', text: 'เวทมนตร์ที่ทำดาเมจ แรงขึ้น +1' },
  r_pendant:  { id: 'r_pendant',  name: 'Lust Pendant',         rarity: 'rare',      emoji: '💗', text: 'เมื่อมินเนี่ยนฝ่ายเราตาย ฟื้นฟู 2 HP ให้ฮีโร่' },
  r_heart:    { id: 'r_heart',    name: "Sinner's Heart",       rarity: 'legendary', emoji: '❤️‍🔥', text: 'HP สูงสุด x2' },
  r_goldcard: { id: 'r_goldcard', name: "Mammon's Golden Card", rarity: 'legendary', emoji: '💳', text: 'การ์ดทุกใบลดค่าร่าย 2' },
  r_echo:     { id: 'r_echo',     name: "Asmodeus's Echo",      rarity: 'legendary', emoji: '🎤', text: 'เวทมนตร์ร่าย 2 ครั้ง' },
  r_crystal:  { id: 'r_crystal',  name: 'Infernal Crystal',     rarity: 'legendary', emoji: '💎', text: 'เริ่มการต่อสู้ด้วยมานาสูงสุด +3' },
  r_crown:    { id: 'r_crown',    name: "Paimon's Crown",       rarity: 'legendary', emoji: '👑', text: 'เริ่มการต่อสู้พร้อม Royal Guard 3/3 Taunt 2 ตัว' },
};
const RARITY_WEIGHT = { common: 60, rare: 30, legendary: 10 };
const RARITY_LABEL = { common: 'ธรรมดา', rare: 'หายาก', legendary: 'ตำนาน' };
const RELIC_EVERY = 2;   // ได้เลือกสมบัติทุกๆ กี่บอส

/* ============================== ร้านค้า ============================== */
// ร้านเปิดหลังชนะบอสตามลำดับใน SHOP_AFTER_BOSS / เหรียญรีเซ็ตเป็น GOLD_PER_SHOP ทุกครั้งที่เข้าร้าน
// ทุกครั้งที่เข้าร้าน สุ่มสินค้า SHOP_SLOTS อย่างจากรายการด้านล่าง ราคาตามความแรงของผล
const SHOP_AFTER_BOSS = [3, 6];
const GOLD_PER_SHOP = 3;
const SHOP_SLOTS = 5;
const SHOP_ITEMS = [
  { id: 'hp10',    name: 'เพิ่มพลังชีวิต',     emoji: '❤️', price: 1, desc: 'HP เริ่มต้น +10 ถาวร' },
  { id: 'hp25',    name: 'หัวใจปีศาจ',        emoji: '💗', price: 2, desc: 'HP เริ่มต้น +25 ถาวร' },
  { id: 'armor',   name: 'เสื้อเกราะนรก',      emoji: '🦺', price: 1, desc: 'เริ่มทุกการต่อสู้พร้อมเกราะ +5 (ถาวร)' },
  { id: 'draw',    name: 'มือเริ่มต้นพิเศษ',    emoji: '✋', price: 2, desc: 'จั่วการ์ดเริ่มต้นเพิ่ม 1 ใบ ทุกการต่อสู้ (ถาวร)' },
  { id: 'mana',    name: 'คริสตัลมานา',        emoji: '💎', price: 3, desc: 'เริ่มทุกการต่อสู้ด้วยมานาสูงสุด +1 (ถาวร)' },
  { id: 'remove1', name: 'ลบการ์ด',           emoji: '🗑️', price: 1, desc: 'นำการ์ด 1 ใบออกจากเด็ค' },
  { id: 'remove3', name: 'ล้างเด็ค',           emoji: '🧹', price: 2, desc: 'นำการ์ดสูงสุด 3 ใบออกจากเด็ค' },
  { id: 'copy1',   name: 'ก็อปปี้การ์ด',       emoji: '📄', price: 1, desc: 'เพิ่มสำเนาการ์ดในเด็ค 1 ใบ' },
  { id: 'copy3',   name: 'ก็อปปี้การ์ด x3',    emoji: '📑', price: 2, desc: 'เลือกการ์ดในเด็คสูงสุด 3 ใบ เพื่อเพิ่มสำเนา' },
  { id: 'pick',    name: 'แพ็คการ์ด',          emoji: '🃏', price: 1, desc: 'สุ่มการ์ด 10 ใบ แล้วเลือก 1 ใบ' },
  { id: 'legend',  name: 'การ์ดตำนาน',        emoji: '🌟', price: 2, desc: 'สุ่มตัวละครระดับตำนาน 3 ใบ แล้วเลือก 1 ใบ' },
  { id: 'relic',   name: 'สมบัติสุ่ม',          emoji: '🎁', price: 3, desc: 'ได้รับสมบัติสุ่ม 1 ชิ้น' },
];
