// จำลองการต่อสู้เพื่อดูบาลานซ์ (ไม่มี UI): ทั้งผู้เล่นและบอสใช้ AI ตัวเดียวกับบอสในเกม
// ผู้เล่น = เด็คเริ่มต้นของฮีโร่ + การ์ดสุ่ม 5 ใบ (เหมือนตอนเลือกการ์ดเริ่ม) + รางวัลบอสก่อนหน้าบอสละ 2 ใบ
// usage: node tools/sim/sim.js [N=300] [patch.js]      เลือกบอส: BOSSES=0,1,2 (ลำดับใน BOSSES เริ่มที่ 0)
//   patch.js = โค้ดที่รันหลังโหลดข้อมูลเกม ใช้ลองปรับการ์ด/บอสโดยไม่แก้ไฟล์จริง เช่น  BOSSES[1].hp = 15;
// หมายเหตุ: AI เล่นแบบโลภ ไม่ได้วางแผนเหมือนคน — ใช้เทียบก่อน/หลังปรับ ไม่ใช่อัตราชนะจริงของผู้เล่น
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.join(__dirname, '..', '..'), N = +(process.argv[2] || 300), patch = process.argv[3];
const ctx = { console, Math, window: {}, document: undefined, performance: { now: () => 0 } };
vm.createContext(ctx);
let code = ['data.js', 'engine.js', 'ai.js'].map(f => fs.readFileSync(path.join(dir, 'js', f), 'utf8')).join('\n;\n');
code += `\n;globalThis.__api = { CARDS, BOSSES, HEROES, POOL, Game, aiPickTarget, aiPickAttack, aiMulligan, sampleCards, RELICS };`;
vm.runInContext(code, ctx);
const A = ctx.__api;
if (patch) vm.runInContext(fs.readFileSync(patch, 'utf8'), ctx);

function takeTurn(g, o) {
  for (let guard = 0; guard < 25 && !g.over; guard++) {
    const p = g.P(o);
    const cands = p.hand.filter(h => g.canPlay(o, h) && h.card.ai !== 'skip' && (!h.card.aiCond || h.card.aiCond(g, o)))
      .sort((a, b) => (b.card.aiFirst ? 99 : g.cost(o, b)) - (a.card.aiFirst ? 99 : g.cost(o, a)));
    let played = false;
    for (const h of cands) {
      const t = A.aiPickTarget(g, o, h);
      if (t === false) continue;
      g.play(o, h.uid, t);
      played = true; break;
    }
    if (!played) break;
  }
  const tried = new Set();
  for (let guard = 0; guard < 40 && !g.over; guard++) {
    const att = g.mins(o).filter(m => g.canAttack(m) && !tried.has(m.uid)).sort((a, b) => b.atk - a.atk);
    if (!att.length) break;
    const m = att[0], t = A.aiPickAttack(g, m);
    if (!t) { tried.add(m.uid); continue; }
    if (!g.attack(m, t)) tried.add(m.uid);
  }
}
function battle(heroId, bossIdx, extra = []) {
  const h = A.HEROES[heroId];
  const deck = [...h.deck, ...extra];
  const g = new A.Game({ player: { name: h.name, hp: 30, deck, relics: [], bonus: { armor: 0, draw: 0, mana: 0 }, portrait: {} }, boss: A.BOSSES[bossIdx] });
  g.ui = {};
  g.start({ mulligan: true });
  g.mulligan(1, A.aiMulligan(g, 1));
  g.mulligan(0, A.aiMulligan(g, 0));
  g.beginBattle();
  let turns = 0;
  while (!g.over && turns < 80) {
    const o = g.current;
    takeTurn(g, o);
    if (g.over) break;
    g.endTurn(o);
    if (g.over) break;
    g.startTurn(1 - o);
    turns++;
  }
  return { win: g.winner === 0, turns, bossHp: g.hero(1).hp, myHp: g.hero(0).hp, stolen: g.__stolen || 0 };
}
const heroes = Object.keys(A.HEROES);
const out = {};
for (const bi of (process.env.BOSSES || "0,1,2").split(",").map(Number)) {
  const row = {};
  for (const hid of heroes) {
    let w = 0, t = 0;
    for (let i = 0; i < N; i++) {
      // ก่อนบอสนี้ผู้เล่นได้: เลือกการ์ดเริ่ม 5 ใบ (สุ่ม) + รางวัลบอสก่อนหน้าบอสละ 2 ใบ
      const extra = [...A.sampleCards(5), ...Array.from({ length: bi }, () => A.sampleCards(2)).flat()];
      const r = battle(hid, bi, extra);
      if (r.win) w++; t += r.turns;
    }
    row[hid] = `${Math.round(w / N * 100)}% (${(t / N).toFixed(1)} เทิร์น)`;
  }
  out[A.BOSSES[bi].name] = row;
}
console.log(JSON.stringify(out, null, 1));
