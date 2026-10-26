import { useCallback, useEffect, useRef, useState } from "react";
import { addRun, checkpointSave, emptySave, migrateGuest, parseSave, SAVE_KEY, type Save } from "../lib/save";
import { type Battle, type Run } from "../lib/game";

export function useLocalSave(battle: Battle, restore: (save: Save) => void) {
  const [save, setSave] = useState<Save>(emptySave);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const latestSave = useRef(save);
  const latestBattle = useRef(battle);
  const initialized = useRef(false);
  const unreadable = useRef(false);
  latestSave.current = save;
  latestBattle.current = battle;

  const write = useCallback((next: Save) => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); setError(""); unreadable.current = false; return true; }
    catch { setError("บันทึกในเบราว์เซอร์ไม่ได้ กรุณาส่งออกไฟล์เซฟสำรองไว้"); return false; }
  }, []);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const old = !raw ? localStorage.getItem("runeblade-guest-v1") : null;
      const stored = raw ? parseSave(raw) : old ? migrateGuest(old) : emptySave();
      latestSave.current = stored; setSave(stored); restore(stored);
    } catch { unreadable.current = true; setError("อ่านเซฟเดิมไม่ได้ ระบบจะไม่เขียนทับไฟล์เดิมจนกว่าคุณจะนำเข้าเซฟที่ถูกต้อง"); }
    setReady(true);
  }, [restore]);
  const flush = useCallback(() => {
    if (!initialized.current || unreadable.current) return;
    const next = checkpointSave(latestSave.current, latestBattle.current);
    latestSave.current = next; write(next);
  }, [write]);
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(flush, 1000);
    const visibility = () => { if (document.hidden) flush(); };
    window.addEventListener("pagehide", flush); window.addEventListener("beforeunload", flush); document.addEventListener("visibilitychange", visibility);
    return () => { clearInterval(timer); window.removeEventListener("pagehide", flush); window.removeEventListener("beforeunload", flush); document.removeEventListener("visibilitychange", visibility); };
  }, [ready, flush]);
  useEffect(() => { if (ready) flush(); }, [battle.mode, battle.stage, battle.status, battle.words, ready, flush]);
  const record = useCallback((run: Run) => {
    const next = addRun(latestSave.current, run);
    latestSave.current = next; setSave(next);
    if (unreadable.current) return false;
    return write(next);
  }, [write]);
  const importSave = useCallback((raw: string) => {
    const next = parseSave(raw);
    if (!write(next)) throw new Error("บันทึกไฟล์ที่นำเข้าไม่ได้ กรุณาอนุญาตพื้นที่เก็บข้อมูลของเบราว์เซอร์");
    latestSave.current = next; setSave(next); restore(next);
  }, [restore, write]);
  const exportSave = useCallback(() => JSON.stringify(checkpointSave(latestSave.current, latestBattle.current), null, 2), []);
  const retry = useCallback(() => { if (!unreadable.current) flush(); }, [flush]);
  return { save, ready, error, record, importSave, exportSave, retry };
}
