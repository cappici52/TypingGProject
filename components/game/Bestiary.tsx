import Dialog from "./Dialog";
import { MONSTERS, BOSSES } from "../../lib/monsters";
import { MonsterSprite } from "./CombatSprites";
export default function Bestiary({ onClose }: { onClose: () => void }) {
  return <Dialog title="THE FOREST BESTIARY" onClose={onClose}><p className="bestiary-intro">15 มอนสเตอร์แห่งพงไพร และ 6 ผู้พิทักษ์ด่าน</p><div className="bestiary-grid">{MONSTERS.map((monster, kind) => <div className="bestiary-entry" key={monster.name}><MonsterSprite kind={kind} /><strong>{monster.name}</strong><small>{monster.thai}</small></div>)}</div><h3 className="journal-title">GUARDIANS & DRAGONS</h3><div className="bestiary-grid bosses-grid">{BOSSES.map((boss, kind) => <div className="bestiary-entry" key={boss.name}><MonsterSprite kind={kind} boss /><strong>{boss.name}</strong><small>{kind < 3 ? "MINI BOSS" : "BOSS"} · ด่าน {kind < 3 ? 5 + kind * 10 : (kind - 2) * 10}</small><small>{boss.thai}</small></div>)}</div></Dialog>;
}
