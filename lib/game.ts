import { WORDS } from "./words";
import { SENTENCES, GUARDIAN_WORDS } from "./sentences";
export type Mode = "en" | "th" | "javascript" | "python";
export type Role = "normal" | "mini" | "boss";
export type Enemy = { id: number; word: string; age: number; kind: number; role: Role; hp: number; maxHp: number; hurtAt: number; wordIndex: number };
export type Run = { id: string; mode: Mode; stage: number; score: number; wpm: number; accuracy: number; cleared: boolean; createdAt?: number };
const AREAS = [
  ["Whispering Woods", "ป่าแห่งเสียงกระซิบ", "FOREST"],
  ["Forgotten Ruins", "ซากวิหารที่ถูกลืม", "RUINS"],
  ["Crystal Hollow", "ถ้ำคริสตัลลึกลับ", "CAVE"],
  ["Thorn Citadel", "ปราสาทหนาม", "CITADEL"],
  ["Dragon's Keep", "ปราการมังกร", "KEEP"],
];
export const STAGES = Array.from({ length: 30 }, (_, index) => {
  const number = index + 1;
  const chapter = Math.floor(index / 10);
  const encounter: Role = number % 10 === 0 ? "boss" : number % 5 === 0 ? "mini" : "normal";
  const biome = index % 5 + 1;
  const area = AREAS[biome - 1];
  return { number, name: `${area[0]}${chapter ? ` ${chapter + 1}` : ""}`, subtitle: area[1], region: encounter === "boss" ? "BOSS" : encounter === "mini" ? "MINI BOSS" : area[2], biome, encounter, goal: encounter === "normal" ? Math.min(20, 8 + Math.ceil(number / 2)) : 6 + chapter * 2, lifetime: Math.max(12000, 24000 - number * 420), spawn: Math.max(1900, 3800 - number * 65), bossHp: encounter === "boss" ? 6 + chapter * 2 : 4 + chapter, bossDeadline: encounter === "boss" ? Math.max(24000, 42000 - chapter * 6000) : Math.max(13000, 20000 - chapter * 3000), bossKind: encounter === "boss" ? 3 + chapter : chapter };
});
export function wordFor(mode: Mode, stage: number, seed: number, role: Role = "normal"): string {
  if (role === "boss") return SENTENCES[mode][(seed + Math.floor(stage / 10) * 3) % SENTENCES[mode].length];
  if (role === "mini") return GUARDIAN_WORDS[mode][(seed + Math.floor(stage / 10) * 4) % GUARDIAN_WORDS[mode].length];
  const tier = stage < 4 ? 0 : stage < 12 ? 1 : 2;
  const pool = WORDS[mode][tier];
  return pool[((seed * 7) + Math.floor(seed / pool.length)) % pool.length];
}
export type Battle = {
  status: "ready" | "playing" | "paused" | "won" | "lost";
  phase: "wave" | "boss";
  mode: Mode; stage: number; hearts: number; score: number; kills: number; words: number;
  combo: number; maxCombo: number; elapsed: number; spawnAge: number;
  sequence: number; enemies: Enemy[]; defeated: Enemy[]; typed: string; attempts: number;
  correct: number; acceptedChars: number; hitAt: number; hurtAt: number;
};
export function createBattle(mode: Mode = "en", stage = 1): Battle {
  return { status: "ready", phase: "wave", mode, stage: Math.min(STAGES.length, Math.max(1, stage)), hearts: 5, score: 0, kills: 0, words: 0, combo: 0, maxCombo: 0, elapsed: 0, spawnAge: 0, sequence: 1, enemies: [], defeated: [], typed: "", attempts: 0, correct: 0, acceptedChars: 0, hitAt: -1000, hurtAt: -1000 };
}
export function makeEnemy(mode: Mode, stage: number, id: number, role: Role = "normal"): Enemy {
  const config = STAGES[stage - 1];
  const maxHp = role === "normal" ? 1 : config.bossHp;
  return { id, word: wordFor(mode, stage, id, role), age: 0, kind: role === "normal" ? (id + (stage - 1) * 3) % 15 : config.bossKind, role, hp: maxHp, maxHp, hurtAt: -1000, wordIndex: id };
}
export const requiredKills = (stage: number) => STAGES[stage - 1].goal + (STAGES[stage - 1].encounter === "normal" ? 0 : 1);
export type Action = { type: "start" } | { type: "tick"; delta: number } | { type: "input"; value: string } | { type: "pause" } | { type: "retreat" } | { type: "restore"; battle: Battle } | { type: "reset"; mode: Mode; stage: number };
export function battleReducer(state: Battle, action: Action): Battle {
  if (action.type === "retreat") return ["playing", "paused"].includes(state.status) ? { ...state, status: "lost" } : state;
  if (action.type === "restore") return { ...action.battle, status: "paused", typed: "" };
  if (action.type === "reset") return createBattle(action.mode, action.stage);
  if (action.type === "start") return { ...createBattle(state.mode, state.stage), status: "playing", enemies: [makeEnemy(state.mode, state.stage, 0)] };
  if (action.type === "pause") return state.status === "playing" ? { ...state, status: "paused" } : state.status === "paused" ? { ...state, status: "playing" } : state;
  if (state.status !== "playing") return state;
  const config = STAGES[state.stage - 1];
  if (action.type === "input") {
    const value = action.value.normalize("NFC");
    const added = Math.max(0, value.length - state.typed.length);
    const target = value ? state.enemies.find(e => e.word.startsWith(value)) : undefined;
    const attempts = state.attempts + added;
    const correct = state.correct + (target ? added : 0);
    const match = value ? state.enemies.find(e => e.word === value) : undefined;
    if (!match) return { ...state, typed: value, attempts, correct, hitAt: target && added ? state.elapsed : state.hitAt, enemies: target && added ? state.enemies.map(e => e.id === target.id ? { ...e, hurtAt: state.elapsed } : e) : state.enemies };
    const combo = state.combo + 1;
    const dead = match.hp <= 1;
    const kills = state.kills + (dead ? 1 : 0);
    let enemies = dead ? state.enemies.filter(e => e.id !== match.id) : state.enemies.map(e => e.id === match.id ? { ...e, hp: e.hp - 1, age: 0, hurtAt: state.elapsed, wordIndex: e.wordIndex + 1, word: wordFor(state.mode, state.stage, e.wordIndex + 1, e.role) } : e);
    let phase = state.phase;
    if (dead && match.role === "normal" && kills >= config.goal && config.encounter !== "normal") {
      phase = "boss";
      enemies = [makeEnemy(state.mode, state.stage, state.sequence, config.encounter)];
    }
    return { ...state, typed: "", attempts, correct, kills, words: state.words + 1, phase, combo, maxCombo: Math.max(combo, state.maxCombo), acceptedChars: state.acceptedChars + match.word.length, score: state.score + match.word.length * 10 + Math.min(combo, 20) * 5 + (dead && match.role !== "normal" ? match.maxHp * 100 : 0), enemies, defeated: dead ? [...state.defeated, { ...match, hurtAt: state.elapsed }] : state.defeated, hitAt: state.elapsed, status: kills >= requiredKills(state.stage) ? "won" : "playing" };
  }
  if (action.type === "tick") {
    const delta = Math.max(0, Math.min(action.delta, 250));
    const elapsed = state.elapsed + delta;
    let damage = 0;
    let enemies: Enemy[] = [];
    for (const enemy of state.enemies) {
      const age = enemy.age + delta;
      const deadline = enemy.role === "normal" ? config.lifetime : config.bossDeadline;
      if (age >= deadline) {
        damage++;
        if (enemy.role !== "normal") enemies.push({ ...enemy, age: 0, wordIndex: enemy.wordIndex + 1, word: wordFor(state.mode, state.stage, enemy.wordIndex + 1, enemy.role) });
      } else enemies.push({ ...enemy, age });
    }
    const hearts = Math.max(0, state.hearts - damage);
    let spawnAge = state.spawnAge + delta;
    let sequence = state.sequence;
    if (state.phase === "wave" && spawnAge >= config.spawn && hearts > 0 && state.kills + enemies.length < config.goal) {
      const enemy = makeEnemy(state.mode, state.stage, sequence);
      if (!enemies.some(e => e.word === enemy.word)) enemies.push(enemy);
      sequence++; spawnAge = 0;
    }
    return { ...state, enemies, hearts, sequence, spawnAge, elapsed, defeated: state.defeated.filter(e => elapsed - e.hurtAt < 550), combo: damage ? 0 : state.combo, typed: damage ? "" : state.typed, hurtAt: damage ? elapsed : state.hurtAt, status: hearts === 0 ? "lost" : "playing" };
  }
  return state;
}
export const accuracy = (state: Battle) => state.attempts ? Math.round(state.correct / state.attempts * 100) : 100;
export const wpm = (state: Battle) => state.elapsed ? Math.round(state.acceptedChars / 5 / (state.elapsed / 60000)) : 0;
