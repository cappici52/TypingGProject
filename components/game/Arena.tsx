import { memo } from "react";
import { type Battle, STAGES, makeEnemy, requiredKills } from "../../lib/game";
import { BOSSES, MONSTERS } from "../../lib/monsters";
import PixelIcon from "./PixelIcon";
import { HeroSprite, MonsterSprite } from "./CombatSprites";

function Arena({ battle, onPause, onResume, onRetreat }: { battle: Battle; onPause: () => void; onResume: () => void; onRetreat: () => void }) {
  const stage = STAGES[battle.stage - 1];
  const ready = battle.status === "ready";
  const enemies = ready ? [0, 1, 2].map(id => ({ ...makeEnemy(battle.mode, battle.stage, id), age: stage.lifetime * (0.48 - id * .18) })) : battle.enemies;
  const boss = battle.enemies.find(e => e.role !== "normal");
  const attacking = battle.elapsed - battle.hitAt < 280;
  const hurt = battle.elapsed - battle.hurtAt < 550;
  const paused = battle.status === "paused";
  const spriteState = hurt ? "hurt" : attacking ? "attack" : "idle";
  return <section className={`arena stone-frame ${hurt ? "hurt" : ""} ${boss ? "boss-arena" : ""} ${paused ? "combat-paused" : ""}`} aria-label="สนามต่อสู้" data-phase={battle.phase} data-state={battle.status}>
    <div className={`forest-bg biome-${stage.biome}`} /><div className="arena-vignette" />
    <div className="hud"><div className="health" aria-label={`หัวใจ ${battle.hearts} จาก 5`}>{Array.from({ length: 5 }, (_, i) => <PixelIcon key={i} name="heart" className={i < battle.hearts ? "alive" : "empty-heart"} />)}</div><div className="stage-hud"><span>STAGE {String(battle.stage).padStart(2, "0")}</span>{battle.status === "playing" ? <button onClick={onPause} className="icon-button" aria-label="พักเกม"><PixelIcon name="pause" /></button> : null}</div></div>
    <div className="stage-location">{stage.name.toUpperCase()}</div>
    {boss ? <div className={`boss-command ${battle.mode === "th" ? "thai-command" : ""}`}><div className="boss-name"><span>{boss.role === "boss" ? "BOSS" : "MINI BOSS"} · {BOSSES[boss.kind].name.toUpperCase()}</span><strong aria-label={`พลังชีวิตบอส ${boss.hp} จาก ${boss.maxHp}`}>{boss.hp} / {boss.maxHp} HP</strong></div><div className="boss-health-track" role="progressbar" aria-label="พลังชีวิตบอส" aria-valuemin={0} aria-valuemax={boss.maxHp} aria-valuenow={boss.hp}><span style={{ width: `${boss.hp / boss.maxHp * 100}%` }} /></div><div className="boss-phrase" data-word={boss.word}>{battle.typed && boss.word.startsWith(battle.typed) ? <><span className="correct-text">{battle.typed}</span>{boss.word.slice(battle.typed.length)}</> : boss.word}</div><div className="boss-timer"><span style={{ width: `${Math.max(0, 100 - boss.age / stage.bossDeadline * 100)}%` }} /></div><small>พิมพ์ครบ = ลด 1 HP · เวลาหมด = บอสโจมตีกลับ</small></div> : null}
    <div className={`hero hero-v2 ${hurt ? "hero-recoil" : ""}`}><HeroSprite state={spriteState} event={hurt ? battle.hurtAt : attacking ? battle.hitAt : 0} /><span className="hero-name">YOU</span></div>
    {enemies.map(enemy => {
      const isBoss = enemy.role !== "normal";
      const percent = isBoss ? 73 : 91 - enemy.age / stage.lifetime * 73;
      const matches = !!battle.typed && enemy.word.startsWith(battle.typed);
      const damaged = battle.elapsed - enemy.hurtAt < 350;
      return <div className={`enemy enemy-v2 ${isBoss ? `boss-enemy ${enemy.role}` : ""} ${matches ? "targeted" : ""}`} key={enemy.id} style={{ left: `${percent}%` }} aria-label={isBoss ? BOSSES[enemy.kind].thai : MONSTERS[enemy.kind].thai}>
        {!isBoss ? <><div className={`word-label word-lane-${enemy.id % 3} ${battle.mode === "th" ? "thai-word" : ""}`} data-word={enemy.word}>{matches ? <><span className="correct-text">{battle.typed}</span>{enemy.word.slice(battle.typed.length)}</> : enemy.word}</div><div className="enemy-hp"><span style={{ width: `${matches ? 100 - battle.typed.length / enemy.word.length * 100 : 100}%` }} /></div></> : null}
        <MonsterSprite kind={enemy.kind} boss={isBoss} hurt={damaged} event={enemy.hurtAt} />
        {isBoss && damaged ? <span key={enemy.hurtAt} className="boss-hit-spark">✦</span> : null}
      </div>;
    })}
    {battle.defeated.map(enemy => <div className={`enemy enemy-v2 defeated-enemy ${enemy.role !== "normal" ? `boss-enemy ${enemy.role}` : ""}`} key={`dead-${enemy.id}`} style={{ left: `${enemy.role === "normal" ? 91 - enemy.age / stage.lifetime * 73 : 73}%` }} aria-hidden="true"><MonsterSprite kind={enemy.kind} boss={enemy.role !== "normal"} still hurt event={enemy.hurtAt} /><span className="defeat-particles">✦ +{enemy.word.length * 10}</span></div>)}
    <div className="fireflies" aria-hidden="true">{[12, 23, 39, 54, 68, 82].map((x, i) => <i key={x} style={{ left: `${x}%`, top: `${22 + i % 3 * 16}%`, animationDelay: `${i * .6}s` }} />)}</div>
    {battle.combo >= 2 && !boss ? <div className="combo" key={battle.combo}>{battle.combo} HIT COMBO!</div> : null}
    {hurt ? <div className="damage-label">−1 HEART</div> : null}
    {paused ? <div className="arena-overlay"><div className="pause-panel"><PixelIcon name="pause" /><h2>PAUSED</h2><p>การผจญภัยถูกเก็บไว้ในเครื่องแล้ว</p><button className="gold-button" onClick={onResume}>เล่นต่อ <PixelIcon name="arrow" /></button><button className="text-button retreat-button" onClick={onRetreat}>ยุติรอบนี้และเก็บคะแนน</button></div></div> : null}
    <div className="arena-bottom"><span><i className={`status-dot ${battle.status === "playing" ? "live" : ""}`} />{boss ? "GUARDIAN ENCOUNTER" : battle.status === "playing" ? "BATTLE IN PROGRESS" : paused ? "SAVED ON THIS DEVICE" : "YOUR ADVENTURE AWAITS"}</span><span>{battle.kills} / {requiredKills(battle.stage)} ENEMIES · {battle.words} WORDS</span></div>
  </section>;
}
export default memo(Arena);
