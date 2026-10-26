import { useRef, useState } from "react";
import { STAGES, type Mode } from "../../lib/game";
import { parseSave, type Save } from "../../lib/save";
import Dialog from "./Dialog";
import PixelIcon from "./PixelIcon";
import { HeroSprite } from "./CombatSprites";

const LABELS: Record<Mode, string> = { en: "English", th: "ภาษาไทย", javascript: "JavaScript", python: "Python" };
export default function Journal({ save, error, onClose, onExport, onImport, onRetry }: { save: Save; error: string; onClose: () => void; onExport: () => string; onImport: (raw: string) => void; onRetry: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [candidate, setCandidate] = useState<{ raw: string; save: Save } | null>(null);
  const [message, setMessage] = useState("");
  const [reading, setReading] = useState(false);
  function exportFile() {
    const url = URL.createObjectURL(new Blob([onExport()], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `runeblade-save-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage("ส่งออกเซฟแล้ว เก็บไฟล์นี้ไว้เพื่อย้ายเครื่องหรือกู้คืนคะแนน");
  }
  async function readFile(selected?: File) {
    if (!selected) return;
    setReading(true); setMessage(""); setCandidate(null);
    try { if (selected.size > 2_000_000) throw new Error("ไฟล์เซฟใหญ่เกินไป"); const raw = await selected.text(); const parsed = parseSave(raw); setCandidate({ raw, save: parsed }); }
    catch (failure) { setMessage(failure instanceof Error ? failure.message : "อ่านไฟล์ไม่สำเร็จ"); }
    finally { setReading(false); if (file.current) file.current.value = ""; }
  }
  return <Dialog title="ADVENTURER'S JOURNAL" onClose={onClose}><div className="account-intro"><HeroSprite /><div><h3>ตำนานของคุณ อยู่ในเครื่องนี้</h3><p>บันทึกคะแนนและด่านอัตโนมัติ ไม่ต้องล็อกอิน</p></div></div><p className="muted">เปิดด้วยเบราว์เซอร์เดิมและที่อยู่เดิมเพื่อเล่นต่อ การล้างข้อมูลเว็บไซต์หรือใช้โหมดไม่ระบุตัวตนอาจทำให้เซฟหาย ส่งออกไฟล์ไว้สำรองหรือย้ายเครื่องได้</p>{error ? <div className="storage-error" role="alert"><p>{error}</p><button className="text-button" onClick={onRetry}>ลองบันทึกอีกครั้ง</button></div> : null}<div className="save-actions"><button className="gold-button" onClick={exportFile}><PixelIcon name="arrow" />ส่งออกเซฟ</button><button className="outline-button" disabled={reading} onClick={() => file.current?.click()}>{reading ? "กำลังอ่านไฟล์..." : "นำเข้าเซฟ"}</button><input className="sr-only" type="file" ref={file} aria-label="เลือกไฟล์เซฟ RUNEBLADE" accept=".json,application/json" onChange={event => void readFile(event.target.files?.[0])} /></div>{candidate ? <section className="import-confirm"><h3>แทนที่เซฟในเครื่องนี้?</h3><p>ไฟล์ที่เลือกมี {candidate.save.stats.runs} รอบ · คะแนนสูงสุด {candidate.save.stats.bestScore.toLocaleString()}<br />ข้อมูลปัจจุบันมี {save.stats.runs} รอบ แนะนำให้ส่งออกเซฟปัจจุบันก่อนแทนที่</p><div className="save-actions"><button className="outline-button" onClick={() => setCandidate(null)}>ยกเลิก</button><button className="gold-button" onClick={() => { try { onImport(candidate.raw); onClose(); } catch (failure) { setMessage(failure instanceof Error ? failure.message : "นำเข้าไม่สำเร็จ"); } }}>แทนที่ด้วยไฟล์นี้</button></div></section> : null}<p className="journal-message" role="status">{message}</p><h3 className="journal-title">RECENT ADVENTURES · ON THIS DEVICE</h3>{save.history.length ? <div className="history-list">{save.history.slice(0, 20).map(run => <div className="history-row" key={run.id}><PixelIcon name={run.cleared ? "trophy" : "sword"} /><div><strong>{String(run.stage).padStart(2, "0")} · {STAGES[run.stage - 1]?.name}</strong><small>{LABELS[run.mode]} · {run.cleared ? "ผ่านด่าน" : "สิ้นสุดการต่อสู้"}</small></div><span>{run.wpm} WPM<small>{run.score.toLocaleString()} PTS</small></span></div>)}</div> : <div className="empty-journal"><PixelIcon name="tree" /><p>ยังไม่มีการผจญภัย</p><small>เริ่มเล่นรอบแรก แล้วเรื่องราวของคุณจะอยู่ที่นี่</small></div>}</Dialog>;
}
