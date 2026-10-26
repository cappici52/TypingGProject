import { memo } from "react";
import { type Battle, STAGES, wordFor } from "../../lib/game";
import PixelIcon from "./PixelIcon";

export function Sprite({ kind, className = "" }: { kind: "idle" | "attack" | "slime" | "mushroom"; className?: string }) {
  return <span className={`sprite sprite-${kind} ${className}`} aria-hidden="true"><img src="/art/sprites.png" alt="" draggable="false" /></span>;
}
function Arena({ battle, onPause, onResume }: { battle: Battle; onPause: () => void; onResume: () => void }) {
  const stage = STAGES[battle.stage - 1];
  const ready = battle.status === "ready";
  const preview = [0, 1, 2].map((id) => ({ id, word: wordFor(battle.mode, battle.stage, id), kind: id % 2, age: stage.lifetime * (0.48 - id * 0.18) }));
  const enemies = ready ? preview : battle.enemies;
  const attacking = battle.elapsed - battle.hitAt < 180;
  const hurt = battle.elapsed - battle.hurtAt < 400;
  return <section className={`arena stone-frame ${hurt ? "hurt" : ""}`} aria-label="สนามต่อสู้">
    <div className={`forest-bg biome-${battle.stage}`} />
    <div className="arena-vignette" />
    <div className="hud"><div className="health" aria-label={`หัวใจ ${battle.hearts} จาก 5`}>{Array.from({ length: 5 }, (_, i) => <PixelIcon key={i} name="heart" className={i < battle.hearts ? "alive" : "empty-heart"} />)}</div><div className="stage-hud"><span>STAGE {String(battle.stage).padStart(2, "0")}</span>{battle.status === "playing" ? <button onClick={onPause} className="icon-button" aria-label="พักเกม"><PixelIcon name="pause" /></button> : null}</div></div>
    <div className="stage-location">{stage.name.toUpperCase()}</div>
    <div className={`hero ${attacking ? "attacking" : ""}`}><Sprite kind={attacking ? "attack" : "idle"} /><span className="hero-name">YOU</span></div>
    {enemies.map(enemy => {
      const percent = 91 - enemy.age / stage.lifetime * 73;
      const matches = battle.typed && enemy.word.startsWith(battle.typed);
      return <div className={`enemy ${matches ? "targeted" : ""} enemy-${enemy.kind}`} key={enemy.id} style={{ left: `${percent}%` }}>
        <div className={`word-label word-lane-${enemy.id % 3} ${battle.mode === "th" ? "thai-word" : ""}`} data-word={enemy.word}>{matches ? <><span className="correct-text">{battle.typed}</span>{enemy.word.slice(battle.typed.length)}</> : enemy.word}</div>
        <div className="enemy-hp"><span style={{ width: `${matches ? 100 - battle.typed.length / enemy.word.length * 100 : 100}%` }} /></div>
        <Sprite kind={enemy.kind ? "mushroom" : "slime"} />
      </div>;
    })}
    <div className="fireflies" aria-hidden="true">{[12, 23, 39, 54, 68, 82].map((x, i) => <i key={x} style={{ left: `${x}%`, top: `${22 + i % 3 * 16}%`, animationDelay: `${i * .6}s` }} />)}</div>
    {battle.combo >= 2 ? <div className="combo" key={battle.combo}>{battle.combo} HIT COMBO!</div> : null}
    {hurt ? <div className="damage-label">−1 HEART</div> : null}
    {battle.status === "paused" ? <div className="arena-overlay"><div className="pause-panel"><PixelIcon name="pause" /><h2>PAUSED</h2><p>พักดาบสักครู่ แล้วกลับมาลุยต่อ</p><button className="gold-button" onClick={onResume}>เล่นต่อ <PixelIcon name="arrow" /></button></div></div> : null}
    <div className="arena-bottom"><span><i className={`status-dot ${battle.status === "playing" ? "live" : ""}`} />{battle.status === "playing" ? "BATTLE IN PROGRESS" : battle.status === "paused" ? "TAKE A BREATHER" : "YOUR ADVENTURE AWAITS"}</span><span>{battle.kills} / {stage.goal} WORDS</span></div>
  </section>;
}
export default memo(Arena);
