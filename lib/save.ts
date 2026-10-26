import { z } from "zod";
import { createBattle, STAGES, type Battle, type Mode, type Run } from "./game";

export const SAVE_KEY = "runeblade-save-v3";
const modeSchema = z.enum(["en", "th", "javascript", "python"]);
const count = z.number().int().min(0).max(1_000_000_000);
const time = z.number().finite().min(0).max(1_000_000_000);
const stageSchema = z.number().int().min(1).max(STAGES.length);
const runSchema = z.object({ id: z.string().uuid(), mode: modeSchema, stage: stageSchema, score: count, wpm: count, accuracy: z.number().int().min(0).max(100), cleared: z.boolean(), createdAt: z.number().finite().nonnegative().optional() });
const enemySchema = z.object({ id: count, word: z.string().min(1).max(200), age: time, kind: z.number().int().min(0).max(14), role: z.enum(["normal", "mini", "boss"]), hp: z.number().int().min(1).max(20), maxHp: z.number().int().min(1).max(20), hurtAt: z.number().finite().min(-1000), wordIndex: count }).refine(e => e.hp <= e.maxHp && (e.role === "normal" || e.kind <= 5));
const battleSchema = z.object({ status: z.enum(["ready", "playing", "paused", "won", "lost"]), phase: z.enum(["wave", "boss"]), mode: modeSchema, stage: stageSchema, hearts: z.number().int().min(0).max(5), score: count, kills: count, words: count, combo: count, maxCombo: count, elapsed: time, spawnAge: time, sequence: count, enemies: z.array(enemySchema).max(16), defeated: z.array(enemySchema).max(16), typed: z.string().max(200), attempts: count, correct: count, acceptedChars: count, hitAt: z.number().finite().min(-1000), hurtAt: z.number().finite().min(-1000) }).refine(b => b.correct <= b.attempts && b.hearts > 0 && ["playing", "paused"].includes(b.status));
const progressSchema = z.object({ en: stageSchema, th: stageSchema, javascript: stageSchema, python: stageSchema });
const saveSchema = z.object({ version: z.literal(3), history: z.array(runSchema).max(100), unlocked: progressSchema, selection: z.object({ mode: modeSchema, stage: stageSchema }), checkpoint: battleSchema.nullable(), stats: z.object({ bestWpm: count, bestScore: count, runs: count }), savedAt: z.number().finite().nonnegative() });
export type Save = z.infer<typeof saveSchema>;
export function emptySave(): Save { return { version: 3, history: [], unlocked: { en: 1, th: 1, javascript: 1, python: 1 }, selection: { mode: "en", stage: 1 }, checkpoint: null, stats: { bestWpm: 0, bestScore: 0, runs: 0 }, savedAt: 0 }; }
export function parseSave(raw: string): Save {
  if (raw.length > 2_000_000) throw new Error("ไฟล์เซฟมีขนาดใหญ่เกินไป");
  const result = saveSchema.safeParse(JSON.parse(raw));
  if (!result.success) throw new Error("ไฟล์เซฟไม่ถูกต้อง หรือเป็นเวอร์ชันที่ไม่รองรับ");
  const save = result.data;
  if (save.selection.stage > save.unlocked[save.selection.mode] || (save.checkpoint && save.checkpoint.stage > save.unlocked[save.checkpoint.mode])) throw new Error("ข้อมูลด่านในไฟล์เซฟไม่สอดคล้องกัน");
  return save;
}
export function addRun(save: Save, run: Run): Save {
  if (save.history.some(r => r.id === run.id)) return save;
  return { ...save, history: [run, ...save.history].slice(0, 100), checkpoint: null, unlocked: { ...save.unlocked, [run.mode]: run.cleared ? Math.max(save.unlocked[run.mode], Math.min(STAGES.length, run.stage + 1)) : save.unlocked[run.mode] }, stats: { bestWpm: Math.max(save.stats.bestWpm, run.wpm), bestScore: Math.max(save.stats.bestScore, run.score), runs: save.stats.runs + 1 }, savedAt: Date.now() };
}
export function checkpointSave(save: Save, battle: Battle): Save {
  const canResume = battle.status === "playing" || battle.status === "paused";
  return { ...save, selection: { mode: battle.mode, stage: battle.stage }, checkpoint: canResume ? { ...battle, status: "paused", typed: "", defeated: [] } : null, savedAt: Date.now() };
}
export function migrateGuest(raw: string): Save {
  const items: unknown = JSON.parse(raw);
  if (!Array.isArray(items)) throw new Error("ข้อมูลเก่าไม่ถูกต้อง");
  let save = emptySave();
  for (const item of items.slice(0, 100).reverse()) { const result = runSchema.safeParse(item); if (result.success) save = addRun(save, result.data); }
  return save;
}
export function restoredBattle(save: Save): Battle { return save.checkpoint ? { ...save.checkpoint, status: "paused", typed: "" } : createBattle(save.selection.mode as Mode, Math.min(save.selection.stage, save.unlocked[save.selection.mode])); }
