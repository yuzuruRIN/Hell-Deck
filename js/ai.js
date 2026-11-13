'use strict';
/* =====================================================================
   AI ของบอส: ลงการ์ดก่อน (ใช้มานาให้คุ้ม) แล้วค่อยโจมตี
   ===================================================================== */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const aiValue = m => m.atk * 2 + m.hp + (m.kw.taunt ? 2 : 0) + (m.kw.shield ? 2 : 0);

function aiPickTarget(g, o, h) {
  const c = h.card;
  const isSpell = c.type === 'spell';
  const none = isSpell ? false : null; // เวทที่ไม่มีเป้าที่ดี = ไม่ใช้ / มินเนี่ยน = ลงโดยไม่มีเป้า
  if (!c.target) return null;
  const valid = g.validTargets(o, c.target, c.targetFilter);
  if (!valid.length) return none;
  const e = g.opp(o);
  const enemyMins = valid.filter(t => t.kind === 'minion' && t.owner === e).sort((a, b) => aiValue(b) - aiValue(a));
  const enemyHero = valid.find(t => t.kind === 'hero' && t.owner === e);
  const myMins = valid.filter(t => t.kind === 'minion' && t.owner === o).sort((a, b) => aiValue(b) - aiValue(a));
  switch (c.ai) {
    case 'dmg': {
      const n = isSpell ? g.sd(o, c.aiN || 1) : (c.aiN || 1);
      const kill = enemyMins.filter(m => m.hp <= n && !m.kw.shield);
      if (kill.length && (kill[0].atk >= 2 || !enemyHero)) return kill[0];
      if (enemyHero) return enemyHero;
      return enemyMins[0] || none;
    }
    case 'remove': case 'steal': case 'freeze':
      return enemyMins[0] || none;
    case 'buff':
      return myMins[0] || none;
    case 'heal': {
      const me = valid.find(t => t.kind === 'hero' && t.owner === o);
      return me && me.hp < me.maxHp ? me : none;
    }
    default:
      return none;
  }
}

function aiPickAttack(g, m) {
  const ts = g.attackTargets(m);
  if (!ts.length) return null;
  const e = g.opp(m.owner);
  const hero = ts.find(t => t.kind === 'hero');
  const mins = ts.filter(t => t.kind === 'minion');
  if (hero) {
    // ตีฮีโร่ถ้าดาเมจรวมพอฆ่า
    const total = g.mins(m.owner).filter(x => g.canAttack(x) && (!x.sleeping || x.kw.charge)).reduce((s, x) => s + x.atk * x.attacks, 0);
    if (total >= g.hero(e).hp + g.hero(e).armor) return hero;
  }
  const kills = mins.filter(t => m.atk >= t.hp && !t.kw.shield);
  const good = kills.filter(t => t.atk < m.hp).sort((a, b) => aiValue(b) - aiValue(a));
  if (good.length) return good[0];
  const even = kills.filter(t => aiValue(t) >= aiValue(m)).sort((a, b) => aiValue(b) - aiValue(a));
  if (even.length) return even[0];
  if (hero) return hero;
  if (mins.length) {
    // ถูกบังคับตี Taunt หรือ Rush: เลือกตัวที่ HP น้อยที่สุด
    return [...mins].sort((a, b) => a.hp - b.hp)[0];
  }
  return null;
}

async function aiTurn(g, ui) {
  const o = 1;
  await ui.wait(900);
  // 1) ลงการ์ด — แสดงการ์ดให้เห็นก่อน แล้วค่อยให้เอฟเฟคทำงาน
  for (let guard = 0; guard < 25 && !g.over; guard++) {
    const p = g.P(o);
    const cands = p.hand
      .filter(h => g.canPlay(o, h) && h.card.ai !== 'skip' && (!h.card.aiCond || h.card.aiCond(g, o)))
      .sort((a, b) => (b.card.aiFirst ? 99 : g.cost(o, b)) - (a.card.aiFirst ? 99 : g.cost(o, a)));
    let played = false;
    for (const h of cands) {
      const t = aiPickTarget(g, o, h);
      if (t === false) continue;
      await ui.showEnemyPlay(h, t);
      if (ui.g !== g) return;
      g.play(o, h.uid, t);
      ui.render();
      await ui.wait(1000);
      ui.clearEnemyPlay();
      await ui.wait(250);
      played = true;
      break;
    }
    if (!played) break;
  }
  // 2) โจมตี
  const tried = new Set();
  for (let guard = 0; guard < 40 && !g.over; guard++) {
    const attackers = g.mins(o).filter(m => g.canAttack(m) && !tried.has(m.uid)).sort((a, b) => b.atk - a.atk);
    if (!attackers.length) break;
    const m = attackers[0];
    const t = aiPickAttack(g, m);
    if (!t) { tried.add(m.uid); continue; }
    await ui.animateAttack(m, t);
    if (!g.attack(m, t)) tried.add(m.uid);
    ui.render();
    await ui.wait(800);
  }
  await ui.wait(400);
}
