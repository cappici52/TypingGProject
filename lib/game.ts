export type Mode = "en" | "th" | "javascript" | "python";
export type Enemy = { id: number; word: string; age: number; kind: number };
export type Run = { id: string; mode: Mode; stage: number; score: number; wpm: number; accuracy: number; cleared: boolean; createdAt?: number };
export const STAGES = [
  { name: "Whispering Woods", subtitle: "ป่าแห่งเสียงกระซิบ", region: "FOREST", goal: 10, lifetime: 23000, spawn: 3700 },
  { name: "Forgotten Ruins", subtitle: "ซากวิหารที่ถูกลืม", region: "RUINS", goal: 14, lifetime: 19000, spawn: 3100 },
  { name: "Crystal Hollow", subtitle: "ถ้ำคริสตัลลึกลับ", region: "CAVE", goal: 18, lifetime: 15500, spawn: 2700 },
  { name: "Thorn Citadel", subtitle: "ปราสาทหนาม", region: "CITADEL", goal: 22, lifetime: 12500, spawn: 2300 },
  { name: "Dragon's Keep", subtitle: "ปราการมังกร", region: "DRAGON", goal: 26, lifetime: 10000, spawn: 1900 },
];
const WORDS: Record<Mode, string[][]> = {
  en: [ ["leaf", "sword", "magic", "wood", "shield", "moss", "hero", "spell", "quest", "path", "rune", "fern"], ["forest", "knight", "castle", "dragon", "potion", "silver", "battle", "shadow", "archer", "spirit"], ["enchanted", "adventure", "guardian", "moonlight", "treasure", "mystical", "legendary", "fortress", "sorcerer", "wilderness"] ],
  th: [ ["ดาบ", "ป่า", "เวท", "มอส", "โล่", "หิน", "ไฟ", "ลม", "ดาว", "ทาง", "น้ำ", "ใบไม้"], ["นักรบ", "มังกร", "ปราสาท", "อัศวิน", "ดอกไม้", "สายลม", "ดวงดาว", "สมบัติ", "ภูเขา", "ปีศาจ"], ["การผจญภัย", "เวทมนตร์", "ผู้พิทักษ์", "แสงจันทร์", "ปริศนา", "จินตนาการ", "พลังวิเศษ", "อาณาจักร", "นักเดินทาง", "ความกล้าหาญ"] ],
  javascript: [ ["const", "let", "return", "async", "await", "true", "false", "null", "class", "import", "export", "typeof"], ["console.log", "Array.from", "Math.floor", "JSON.parse", "function()", "=>", "!==", "try{}", "catch(e)", "useState"], ["Promise.all()", "Object.entries", "addEventListener", "JSON.stringify", "document.body", "Array.isArray", "setTimeout()", "querySelector", "preventDefault", "getElementById"] ],
  python: [ ["def", "print", "return", "while", "True", "False", "None", "class", "import", "yield", "lambda", "range"], ["for i in", "__init__", "len(items)", "try:", "except:", "self.name", "is None", "with open", "in range", "enumerate"], ["isinstance()", "list.append()", "@classmethod", "from collections", "sorted(items)", "__getitem__", "async def", "dict.items()", "str.format()", "raise ValueError"] ],
};
export function wordFor(mode: Mode, stage: number, seed: number) {
  const tier = stage < 2 ? 0 : stage < 4 ? 1 : 2;
  const pool = WORDS[mode][tier];
  return pool[((seed * 7) + Math.floor(seed / pool.length)) % pool.length];
}
export type Battle = {
  status: "ready" | "playing" | "paused" | "won" | "lost";
  mode: Mode; stage: number; hearts: number; score: number; kills: number;
  combo: number; maxCombo: number; elapsed: number; spawnAge: number;
  sequence: number; enemies: Enemy[]; typed: string; attempts: number;
  correct: number; acceptedChars: number; hitAt: number; hurtAt: number;
};
export function createBattle(mode: Mode = "en", stage = 1): Battle {
  return { status: "ready", mode, stage, hearts: 5, score: 0, kills: 0, combo: 0, maxCombo: 0, elapsed: 0, spawnAge: 0, sequence: 1, enemies: [], typed: "", attempts: 0, correct: 0, acceptedChars: 0, hitAt: -1000, hurtAt: -1000 };
}
export type Action = { type: "start" } | { type: "tick"; delta: number } | { type: "input"; value: string } | { type: "pause" } | { type: "reset"; mode: Mode; stage: number };
export function battleReducer(state: Battle, action: Action): Battle {
  if (action.type === "reset") return createBattle(action.mode, action.stage);
  if (action.type === "start") return { ...createBattle(state.mode, state.stage), status: "playing", enemies: [{ id: 0, word: wordFor(state.mode, state.stage, 0), age: 0, kind: 0 }] };
  if (action.type === "pause") return state.status === "playing" ? { ...state, status: "paused" } : state.status === "paused" ? { ...state, status: "playing" } : state;
  if (state.status !== "playing") return state;
  if (action.type === "input") {
    const value = action.value.normalize("NFC");
    const added = Math.max(0, value.length - state.typed.length);
    const target = state.enemies.find(e => e.word.startsWith(value));
    const attempts = state.attempts + added;
    const correct = state.correct + (target ? added : 0);
    const match = state.enemies.find(e => e.word === value);
    if (!match) return { ...state, typed: value, attempts, correct, hitAt: target && added ? state.elapsed : state.hitAt };
    const combo = state.combo + 1;
    const kills = state.kills + 1;
    return { ...state, typed: "", attempts, correct, kills, combo, maxCombo: Math.max(combo, state.maxCombo), acceptedChars: state.acceptedChars + match.word.length, score: state.score + match.word.length * 10 + Math.min(combo, 20) * 5, enemies: state.enemies.filter(e => e.id !== match.id), hitAt: state.elapsed, status: kills >= STAGES[state.stage - 1].goal ? "won" : "playing" };
  }
  if (action.type === "tick") {
    const delta = Math.min(action.delta, 200);
    const stage = STAGES[state.stage - 1];
    let enemies = state.enemies.map(e => ({ ...e, age: e.age + delta }));
    const missed = enemies.filter(e => e.age >= stage.lifetime).length;
    enemies = enemies.filter(e => e.age < stage.lifetime);
    const hearts = Math.max(0, state.hearts - missed);
    let spawnAge = state.spawnAge + delta;
    let sequence = state.sequence;
    if (spawnAge >= stage.spawn && hearts > 0) {
      const word = wordFor(state.mode, state.stage, sequence);
      if (!enemies.some(e => e.word === word)) enemies.push({ id: sequence, word, age: 0, kind: sequence % 2 });
      sequence++; spawnAge = 0;
    }
    return { ...state, enemies, hearts, sequence, spawnAge, elapsed: state.elapsed + delta, combo: missed ? 0 : state.combo, typed: missed ? "" : state.typed, hurtAt: missed ? state.elapsed + delta : state.hurtAt, status: hearts === 0 ? "lost" : "playing" };
  }
  return state;
}
export const accuracy = (state: Battle) => state.attempts ? Math.round(state.correct / state.attempts * 100) : 100;
export const wpm = (state: Battle) => state.elapsed ? Math.round(state.acceptedChars / 5 / (state.elapsed / 60000)) : 0;
