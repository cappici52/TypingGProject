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
export function wordPool(mode: Mode, stage: number, role: Role = "normal"): string[] {
  if (role === "boss") return SENTENCES[mode];
  if (role === "mini") return GUARDIAN_WORDS[mode];
  const tier = stage < 4 ? 0 : stage < 12 ? 1 : 2;
  return WORDS[mode][tier];
}
export function wordFor(mode: Mode, stage: number, seed: number, role: Role = "normal"): string {
  const pool = wordPool(mode, stage, role);
  return pool[(Math.imul(seed + 1, 2654435761) >>> 0) % pool.length];
}
export type WordHistory = string[];
const historyKey = (mode: Mode, word: string) => `${mode}:${word}`;
// Sample without replacement. Exhausted banks restart, retaining ten recent prompts.
export function drawWord(mode: Mode, stage: number, seed: number, role: Role, history: WordHistory, visible: string[] = []) {
  const pool = wordPool(mode, stage, role);
  let nextHistory = history;
  let seen = new Set(history);
  let candidates = pool.filter(word => !seen.has(historyKey(mode, word)) && !visible.includes(word));
  if (!candidates.length) {
    const keys = new Set(pool.map(word => historyKey(mode, word)));
    const recent = new Set(history.slice(-10));
    nextHistory = history.filter(key => !keys.has(key) || recent.has(key));
    seen = new Set(nextHistory);
    candidates = pool.filter(word => !seen.has(historyKey(mode, word)) && !visible.includes(word));
  }
  // Prefer targets that cannot steal each other's typed prefix.
  const unambiguous = candidates.filter(word => !visible.some(target => target.startsWith(word) || word.startsWith(target)));
  if (unambiguous.length) candidates = unambiguous;
  const word = candidates[(Math.imul(seed + 1, 2654435761) >>> 0) % candidates.length];
  return { word, history: [...nextHistory, historyKey(mode, word)].slice(-6000) };
}
export type Battle = {
  status: "ready" | "playing" | "paused" | "won" | "lost";
  phase: "wave" | "boss";
  mode: Mode; stage: number; hearts: number; score: number; kills: number; words: number;
  combo: number; maxCombo: number; elapsed: number; spawnAge: number;
  sequence: number; enemies: Enemy[]; defeated: Enemy[]; typed: string; attempts: number;
  correct: number; acceptedChars: number; hitAt: number; hurtAt: number;
  wordHistory: WordHistory; wordSeed: number;
};
export function createBattle(mode: Mode = "en", stage = 1): Battle {
  return { status: "ready", phase: "wave", mode, stage: Math.min(STAGES.length, Math.max(1, stage)), hearts: 5, score: 0, kills: 0, words: 0, combo: 0, maxCombo: 0, elapsed: 0, spawnAge: 0, sequence: 1, enemies: [], defeated: [], typed: "", attempts: 0, correct: 0, acceptedChars: 0, hitAt: -1000, hurtAt: -1000, wordHistory: [], wordSeed: 0 };
}
export function makeEnemy(mode: Mode, stage: number, id: number, role: Role = "normal"): Enemy {
  const config = STAGES[stage - 1];
  const maxHp = role === "normal" ? 1 : config.bossHp;
  return { id, word: wordFor(mode, stage, id, role), age: 0, kind: role === "normal" ? (id + (stage - 1) * 3) % 15 : config.bossKind, role, hp: maxHp, maxHp, hurtAt: -1000, wordIndex: id };
}
export const requiredKills = (stage: number) => STAGES[stage - 1].goal + (STAGES[stage - 1].encounter === "normal" ? 0 : 1);
export type Action = { type: "start"; seed?: number } | { type: "tick"; delta: number } | { type: "input"; value: string } | { type: "pause" } | { type: "retreat" } | { type: "restore"; battle: Battle } | { type: "reset"; mode: Mode; stage: number; wordHistory?: WordHistory };
export function battleReducer(state: Battle, action: Action): Battle {
  if (action.type === "retreat") return ["playing", "paused"].includes(state.status) ? { ...state, status: "lost" } : state;
  if (action.type === "restore") return { ...action.battle, status: "paused", typed: "" };
  if (action.type === "reset") return { ...createBattle(action.mode, action.stage), wordHistory: action.wordHistory ?? state.wordHistory };
  if (action.type === "start") {
    const seed = action.seed ?? state.wordSeed;
    const draw = drawWord(state.mode, state.stage, seed, "normal", state.wordHistory);
    return { ...createBattle(state.mode, state.stage), status: "playing", wordSeed: seed + 1, wordHistory: draw.history, enemies: [{ ...makeEnemy(state.mode, state.stage, 0), word: draw.word }] };
  }
  if (action.type === "pause") return state.status === "playing" ? { ...state, status: "paused" } : state.status === "paused" ? { ...state, status: "playing" } : state;
  if (state.status !== "playing") return state;
  const config = STAGES[state.stage - 1];
  let wordHistory = state.wordHistory;
  let wordSeed = state.wordSeed;
  const nextWord = (role: Role, visible: string[] = []) => {
    const draw = drawWord(state.mode, state.stage, wordSeed++, role, wordHistory, visible);
    wordHistory = draw.history;
    return draw.word;
  };
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
    let enemies = dead ? state.enemies.filter(e => e.id !== match.id) : state.enemies.map(e => e.id === match.id ? { ...e, hp: e.hp - 1, age: 0, hurtAt: state.elapsed, wordIndex: e.wordIndex + 1, word: nextWord(e.role, state.enemies.map(target => target.word)) } : e);
    let phase = state.phase;
    if (dead && match.role === "normal" && kills >= config.goal && config.encounter !== "normal") {
      phase = "boss";
      enemies = [{ ...makeEnemy(state.mode, state.stage, state.sequence, config.encounter), word: nextWord(config.encounter) }];
    }
    return { ...state, wordHistory, wordSeed, typed: "", attempts, correct, kills, words: state.words + 1, phase, combo, maxCombo: Math.max(combo, state.maxCombo), acceptedChars: state.acceptedChars + match.word.length, score: state.score + match.word.length * 10 + Math.min(combo, 20) * 5 + (dead && match.role !== "normal" ? match.maxHp * 100 : 0), enemies, defeated: dead ? [...state.defeated, { ...match, hurtAt: state.elapsed }] : state.defeated, hitAt: state.elapsed, status: kills >= requiredKills(state.stage) ? "won" : "playing" };
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
        if (enemy.role !== "normal") enemies.push({ ...enemy, age: 0, wordIndex: enemy.wordIndex + 1, word: nextWord(enemy.role, state.enemies.map(target => target.word)) });
      } else enemies.push({ ...enemy, age });
    }
    const hearts = Math.max(0, state.hearts - damage);
    let spawnAge = state.spawnAge + delta;
    let sequence = state.sequence;
    if (state.phase === "wave" && spawnAge >= config.spawn && hearts > 0 && state.kills + enemies.length < config.goal) {
      const enemy = { ...makeEnemy(state.mode, state.stage, sequence), word: nextWord("normal", enemies.map(target => target.word)) };
      if (!enemies.some(e => e.word === enemy.word)) enemies.push(enemy);
      sequence++; spawnAge = 0;
    }
    return { ...state, wordHistory, wordSeed, enemies, hearts, sequence, spawnAge, elapsed, defeated: state.defeated.filter(e => elapsed - e.hurtAt < 550), combo: damage ? 0 : state.combo, typed: damage ? "" : state.typed, hurtAt: damage ? elapsed : state.hurtAt, status: hearts === 0 ? "lost" : "playing" };
  }
  return state;
}
export const accuracy = (state: Battle) => state.attempts ? Math.round(state.correct / state.attempts * 100) : 100;
export const wpm = (state: Battle) => state.elapsed ? Math.round(state.acceptedChars / 5 / (state.elapsed / 60000)) : 0;
