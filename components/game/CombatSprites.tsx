import { type CSSProperties } from "react";
import { MONSTERS } from "../../lib/monsters";

export function HeroSprite({ state = "idle", event = 0 }: { state?: "idle" | "attack" | "hurt"; event?: number }) {
  return <span key={`${state}-${event}`} className={`hero-sprite hero-${state}`} aria-hidden="true" />;
}
export function MonsterSprite({ kind, boss = false, hurt = false, event = 0, still = false }: { kind: number; boss?: boolean; hurt?: boolean; event?: number; still?: boolean }) {
  const columns = boss ? 3 : 5;
  const rows = boss ? 2 : 3;
  const position = `${kind % columns / (columns - 1) * 100}% ${Math.floor(kind / columns) / (rows - 1) * 100}%`;
  return <span className={`monster-motion ${still ? "" : `motion-${boss ? "breathe" : MONSTERS[kind]?.motion || "breathe"}`}`} style={{ "--idle-delay": `${-kind * .17}s`, "--feet-shift": boss ? "0%" : kind < 5 ? "-18%" : kind < 10 ? "-6%" : "0%" } as CSSProperties} aria-hidden="true"><span key={hurt ? `hurt-${event}` : "rest"} className={`damage-react ${hurt ? "damaged" : ""}`}><span className={`monster-sprite ${boss ? "boss-sprite" : ""}`} style={{ backgroundPosition: position }} /></span></span>;
}
