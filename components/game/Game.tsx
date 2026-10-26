"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { accuracy, battleReducer, createBattle, requiredKills, STAGES, wpm, type Mode, type Run } from "../../lib/game";
import { type Save } from "../../lib/save";
import { useLocalSave } from "../../hooks/use-local-save";
import Arena from "./Arena";
import Keyboard from "./Keyboard";
import PixelIcon from "./PixelIcon";
import Dialog from "./Dialog";
import Campaign from "./Campaign";
import Journal from "./Journal";
import Bestiary from "./Bestiary";
import { HeroSprite } from "./CombatSprites";
const MODES: { id: Mode; label: string }[] = [{ id: "en", label: "English" }, { id: "th", label: "ภาษาไทย" }, { id: "javascript", label: "JavaScript" }, { id: "python", label: "Python" }];

export default function Game() {
  const [battle, dispatch] = useReducer(battleReducer, undefined, () => createBattle());
  const [dialog, setDialog] = useState<"help" | "journal" | "bestiary" | "result" | null>(null);
  const [sound, setSound] = useState(false);
  const [motion, setMotion] = useState(true);
  const [pressed, setPressed] = useState("");
  const [inputDraft, setInputDraft] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [resultSaved, setResultSaved] = useState(true);
  const input = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const ended = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const restore = useCallback((stored: Save) => {
    if (stored.checkpoint) dispatch({ type: "restore", battle: stored.checkpoint });
    else dispatch({ type: "reset", ...stored.selection });
    setInputDraft(""); setDialog(null);
  }, []);
  const local = useLocalSave(battle, restore);
  const { save, ready, error: storageError, record } = local;
  const active = battle.status === "playing" || battle.status === "paused";
  const unlocked = save.unlocked[battle.mode];
  const bestStage = Math.max(...Object.values(save.unlocked));
  const correctPrefix = !battle.typed || battle.enemies.some(e => e.word.startsWith(battle.typed));
  const nextChar = battle.enemies.find(e => e.word.startsWith(battle.typed))?.word[battle.typed.length] || "";
  const boss = battle.enemies.find(e => e.role !== "normal");

  useEffect(() => { try { setMotion(localStorage.getItem("runeblade-motion-v1") !== "off"); } catch { /* Optional preference. */ } }, []);
  function toggleMotion() { const next = !motion; setMotion(next); try { localStorage.setItem("runeblade-motion-v1", next ? "on" : "off"); } catch { /* Optional preference. */ } }

  useEffect(() => {
    if (battle.status !== "playing") return;
    let last = performance.now();
    const timer = setInterval(() => { const now = performance.now(); dispatch({ type: "tick", delta: now - last }); last = now; }, 50);
    const onVisibility = () => { if (document.hidden) dispatch({ type: "pause" }); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [battle.status]);
  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (event.isComposing || composing.current || dialog) return;
      setPressed(event.key);
      if (event.key === "Escape" && active) { event.preventDefault(); dispatch({ type: "pause" }); setTimeout(() => input.current?.focus(), 0); }
    };
    const keyUp = () => setPressed("");
    window.addEventListener("keydown", keyDown); window.addEventListener("keyup", keyUp);
    return () => { window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); };
  }, [dialog, active]);
  const tone = useCallback((kind: "hit" | "word" | "hurt" | "start") => {
    if (!sound) return;
    try {
      audio.current ??= new AudioContext(); const context = audio.current; void context.resume();
      const oscillator = context.createOscillator(); const gain = context.createGain();
      oscillator.type = "square"; oscillator.frequency.setValueAtTime(kind === "hurt" ? 100 : kind === "word" ? 660 : kind === "start" ? 440 : 260, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(kind === "hurt" ? 40 : 180, context.currentTime + .1);
      gain.gain.setValueAtTime(.035, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .12);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .13);
    } catch { /* Audio is optional. */ }
  }, [sound]);
  useEffect(() => {
    if (battle.status !== "won" && battle.status !== "lost") { ended.current = false; return; }
    if (ended.current) return;
    ended.current = true;
    const run: Run = { id: crypto.randomUUID(), mode: battle.mode, stage: battle.stage, score: battle.score, wpm: wpm(battle), accuracy: accuracy(battle), cleared: battle.status === "won", createdAt: Date.now() };
    setResultSaved(record(run)); setInputDraft(""); setDialog("result");
  }, [battle, record]);
  const previousHearts = useRef(5);
  useEffect(() => {
    if (battle.hearts < previousHearts.current) { tone("hurt"); setInputDraft(""); setAnnouncement(`เสียหัวใจ เหลือ ${battle.hearts} จาก 5 หัวใจ`); }
    previousHearts.current = battle.hearts;
  }, [battle.hearts, tone]);
  function start() { dispatch({ type: "start" }); setInputDraft(""); tone("start"); setTimeout(() => input.current?.focus(), 0); }
  function resume() { dispatch({ type: "pause" }); setTimeout(() => input.current?.focus(), 0); }
  function openDialog(next: "help" | "journal" | "bestiary") { if (battle.status === "playing") dispatch({ type: "pause" }); setDialog(next); }
  function changeMode(mode: Mode) { if (active) return; dispatch({ type: "reset", mode, stage: Math.min(save.selection.mode === mode ? save.selection.stage : save.unlocked[mode], save.unlocked[mode]) }); setInputDraft(""); }
  function resetTo(stage: number) { dispatch({ type: "reset", mode: battle.mode, stage: Math.min(stage, unlocked) }); setInputDraft(""); setDialog(null); }
  function processInput(value: string) {
    if (battle.status !== "playing") return;
    const normalized = value.normalize("NFC");
    const hit = battle.enemies.find(e => e.word === normalized);
    dispatch({ type: "input", value: normalized });
    if (hit) { setInputDraft(""); tone("word"); setAnnouncement(hit.role === "normal" ? `กำจัด ${normalized} สำเร็จ` : `โจมตีบอสสำเร็จ เหลือ ${Math.max(0, hit.hp - 1)} HP`); }
    else { setInputDraft(value); if (value.length > battle.typed.length && battle.enemies.some(e => e.word.startsWith(normalized))) tone("hit"); }
  }
  return <div className="app-shell" data-motion={motion ? "on" : "off"}>
    <header className="site-header"><a className="brand" href="/" aria-label="RUNEBLADE หน้าหลัก"><PixelIcon name="sword" /><span>RUNE<span>BLADE</span></span></a><nav aria-label="เมนูหลัก"><button className="nav-button active" onClick={() => { setDialog(null); input.current?.focus(); }}>PLAY</button><button className="nav-button" onClick={() => openDialog("help")}>HOW TO PLAY</button></nav><div className="header-actions"><button className={`icon-button sound-button ${sound ? "enabled" : ""}`} onClick={() => setSound(!sound)} aria-label={sound ? "ปิดเสียง" : "เปิดเสียง"} aria-pressed={sound}><PixelIcon name={sound ? "sound" : "mute"} /></button><button className="account-button" onClick={() => openDialog("journal")}><PixelIcon name="user" /><span>MY JOURNAL</span><span className="chevron">▾</span></button></div></header>
    <main><section className="page-heading"><div className="heading-rule" /><h1>Words are your weapon.</h1><div className="heading-rule right" /></section>
      {storageError ? <div className="storage-banner" role="alert"><span>{storageError}</span><button className="text-button" onClick={() => openDialog("journal")}>สำรอง / กู้คืนเซฟ</button></div> : null}
      <div className="game-layout"><div className="play-column"><div className="game-toolbar"><div className="language-picker"><span className="toolbar-label">LANGUAGE</span><div className="language-options" aria-label="ภาษาที่ใช้เล่น">{MODES.filter(m => (battle.mode === "en" || battle.mode === "th") ? (m.id === "en" || m.id === "th") : (m.id === "javascript" || m.id === "python")).map(mode => <button key={mode.id} disabled={active || !ready} aria-pressed={battle.mode === mode.id} onClick={() => changeMode(mode.id)}>{mode.label}</button>)}</div></div><div className="mode-toggle"><button aria-pressed={battle.mode === "en" || battle.mode === "th"} disabled={active || !ready} onClick={() => changeMode("en")}>CLASSIC</button><button aria-pressed={battle.mode === "javascript" || battle.mode === "python"} disabled={active || !ready} onClick={() => changeMode("javascript")}>{"</>"} CODE</button></div></div>
      <Arena battle={battle} onPause={() => dispatch({ type: "pause" })} onResume={resume} onRetreat={() => dispatch({ type: "retreat" })} />
      <div className="battle-stats"><span><strong>{wpm(battle)}</strong> WPM</span><span><strong>{accuracy(battle)}%</strong> ACCURACY</span><span><strong>{String(Math.floor(battle.elapsed / 60000)).padStart(2, "0")}:{String(Math.floor(battle.elapsed / 1000) % 60).padStart(2, "0")}</strong> TIME</span><span><PixelIcon name="star" /><strong>{battle.score.toLocaleString()}</strong> SCORE</span></div>
      <div className="typing-controls"><div className={`input-wrap ${!correctPrefix ? "invalid" : ""}`}><PixelIcon name="sword" /><label htmlFor="typing-input" className="sr-only">พิมพ์คำบนมอนสเตอร์เพื่อโจมตี</label><input id="typing-input" ref={input} value={inputDraft} maxLength={200} placeholder={battle.status === "playing" ? boss?.role === "boss" ? "พิมพ์ประโยคของบอส..." : "พิมพ์คำบนมอนสเตอร์..." : "Type a word to attack..."} disabled={battle.status !== "playing"} onChange={e => { setInputDraft(e.target.value); if (!composing.current) processInput(e.target.value); }} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={e => { composing.current = false; processInput(e.currentTarget.value); }} onPaste={e => e.preventDefault()} onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing && !composing.current) e.preventDefault(); }} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} aria-invalid={!correctPrefix} aria-describedby="typing-hint" /></div><button className="gold-button start-button" disabled={!ready} onClick={battle.status === "playing" ? () => dispatch({ type: "pause" }) : battle.status === "paused" ? resume : start}><PixelIcon name={battle.status === "playing" ? "pause" : "sword"} /><span>{!ready ? "LOADING SAVE..." : battle.status === "playing" ? "PAUSE BATTLE" : battle.status === "paused" ? "RESUME BATTLE" : "START ADVENTURE"}</span><span className="button-spark">✦</span></button></div>
      <p className={`input-hint ${!correctPrefix ? "error-text" : ""}`} id="typing-hint">{!correctPrefix ? "ยังไม่ตรงกับคำเป้าหมาย กด Backspace เพื่อแก้ไข" : battle.status === "playing" ? boss ? "พิมพ์ครบเพื่อลด HP บอส · เว้นวรรค ตัวพิมพ์เล็ก–ใหญ่ และเครื่องหมายต้องตรงกัน" : "พิมพ์คำให้ครบเพื่อโจมตีทันที · กด ESC เพื่อพักและเก็บการต่อสู้" : battle.status === "paused" ? "พบการต่อสู้ที่ค้างไว้ กดเล่นต่อเมื่อพร้อม" : "เลือกภาษาและด่าน แล้วเริ่มการผจญภัย คะแนนจะถูกเก็บไว้ในเครื่อง"}</p>
      <Keyboard pressed={pressed} next={battle.status === "playing" ? nextChar : ""} thai={battle.mode === "th"} /><div className="keyboard-caption"><span><i className="key-indicator" /> NEXT KEY</span><span>YOUR KEYBOARD IS YOUR SWORD</span><button className="motion-toggle" onClick={toggleMotion} aria-pressed={motion} aria-label={motion ? "ปิดแอนิเมชัน" : "เปิดแอนิเมชัน"}><PixelIcon name="star" /> MOTION {motion ? "ON" : "OFF"}</button></div></div>
      <aside className="rail"><Campaign stage={battle.stage} unlocked={unlocked} disabled={active || !ready} onSelect={resetTo} /><section className="best-run stone-frame"><h2><span className="ornament">✦</span> YOUR BEST RUN <span className="ornament">✦</span></h2><dl><div><dt><PixelIcon name="trophy" />Highest stage</dt><dd>{String(bestStage).padStart(2, "0")}</dd></div><div><dt><PixelIcon name="star" />Best score</dt><dd>{save.stats.bestScore.toLocaleString()}</dd></div><div><dt><PixelIcon name="sword" />Fastest typing</dt><dd>{save.stats.bestWpm} <small>WPM</small></dd></div><div><dt><PixelIcon name="tree" />Adventures</dt><dd>{save.stats.runs}</dd></div></dl><button className="history-link" onClick={() => openDialog("journal")}>ประวัติและสำรองเซฟ <span>→</span></button></section><button className="bestiary-button stone-frame" onClick={() => openDialog("bestiary")}><PixelIcon name="tree" /><span>FOREST BESTIARY<small>15 มอนสเตอร์ · 6 บอสผู้พิทักษ์</small></span><span>→</span></button><div className="traveler-note"><PixelIcon name="user" /><p>บันทึกอัตโนมัติในเครื่อง<small>ปิดแล้วเปิดใหม่ คะแนนและด่านยังอยู่<br />สำรองไฟล์เซฟได้จาก My Journal</small></p></div></aside></div>
      <footer className="game-footer"><div><kbd>ESC</kbd><span>Pause / Resume</span><i /><kbd>⌫</kbd><span>Correct a typo</span><i /><PixelIcon name="heart" /><span>5 lives. Make them count.</span></div><button className="text-button" onClick={() => openDialog("help")}><PixelIcon name="help" /> วิธีเล่น</button></footer>
    </main><div className="page-bottom"><span>RUNEBLADE · TYPE YOUR OWN LEGEND</span><span>LOCAL ADVENTURE · NO ACCOUNT REQUIRED</span></div><div className="sr-only" role="status" aria-live="polite">{announcement}</div>
    {dialog === "journal" ? <Journal save={save} error={storageError} onClose={() => setDialog(null)} onExport={local.exportSave} onImport={local.importSave} onRetry={local.retry} /> : null}
    {dialog === "bestiary" ? <Bestiary onClose={() => setDialog(null)} /> : null}
    {dialog === "help" ? <Dialog title="HOW TO PLAY" onClose={() => setDialog(null)}><div className="help-intro"><HeroSprite /><div><h3>เปลี่ยนทุกคำให้เป็นคมดาบ</h3><p>30 ด่าน · 15 มอนสเตอร์ · ไม่ต้องล็อกอิน</p></div></div><ol className="instructions"><li><strong>เลือกภาษา แล้วพิมพ์คำให้ครบ</strong><p>ไทย อังกฤษ JavaScript หรือ Python พิมพ์ครบจะโจมตีทันที ไม่ต้องกด Enter ตัวพิมพ์เล็ก–ใหญ่ เว้นวรรค และเครื่องหมายต้องตรงกัน</p></li><li><strong>ปกป้องหัวใจทั้ง 5 ดวง</strong><p>พิมพ์ผิดแก้ด้วย Backspace ได้ ปล่อยให้ศัตรูเข้าถึงตัวจะเสียหัวใจ</p></li><li><strong>พบผู้พิทักษ์ทุก 5 ด่าน</strong><p>ด่าน 5, 15, 25 มีมินิบอสขนาดกลางพร้อม HP และคำยากขึ้น ด่าน 10, 20, 30 มีบอสใหญ่ ต้องพิมพ์ประโยคหรือคำสั่งโค้ดหลายครั้งจึงจะชนะ พิมพ์ไม่ทันบอสจะโจมตีกลับ</p></li><li><strong>ปิดแล้วกลับมาเล่นต่อได้</strong><p>ระบบเก็บคะแนน ด่าน และการต่อสู้ไว้ในเบราว์เซอร์เดิม เปิดกลับมาจะพักรอให้กดเล่นต่อ ส่งออก/นำเข้าไฟล์เซฟได้ที่ My Journal</p></li></ol><p className="muted">WPM = อักขระของคำที่พิมพ์สำเร็จ ÷ 5 ต่อนาทีที่เล่นจริง ความแม่นยำนับรวมครั้งที่พิมพ์ผิดก่อนแก้ไข การวางข้อความไม่นับเป็นการฝึกพิมพ์</p><button className="gold-button full-width" onClick={() => setDialog(null)}>เข้าใจแล้ว พร้อมผจญภัย</button></Dialog> : null}
    {dialog === "result" ? <Dialog title={battle.status === "won" ? "STAGE CLEARED!" : "THE QUEST CONTINUES"} onClose={() => setDialog(null)}><div className="result-intro"><PixelIcon name={battle.status === "won" ? "trophy" : "heart"} /><h3>{battle.status === "won" ? battle.stage === STAGES.length ? "คุณคือผู้พิทักษ์แห่ง RUNEBLADE!" : "เส้นทางใหม่รอคุณอยู่" : "พักดาบ แล้วลองอีกครั้ง"}</h3><p>ด่าน {battle.stage} · {STAGES[battle.stage - 1].name}<br />กำจัด {battle.kills}/{requiredKills(battle.stage)} ตัว · พิมพ์สำเร็จ {battle.words} คำ</p></div><div className="result-stats"><div><strong>{wpm(battle)}</strong><span>WPM</span></div><div><strong>{accuracy(battle)}%</strong><span>ACCURACY</span></div><div><strong>{battle.score}</strong><span>SCORE</span></div></div><p className="result-combo">Longest combo · {battle.maxCombo} words</p><div className={`save-feedback ${!resultSaved || storageError ? "error-text" : ""}`} role="status">{storageError || (resultSaved ? "✓ เก็บคะแนนและความคืบหน้าในเครื่องแล้ว" : "ยังบันทึกไม่ได้ กรุณาส่งออกเซฟสำรอง")}<button className="text-button" onClick={() => setDialog("journal")}>ดูประวัติ / สำรองเซฟ</button></div><button className="gold-button full-width" onClick={() => resetTo(battle.status === "won" && battle.stage < STAGES.length ? battle.stage + 1 : battle.stage)}>{battle.status === "won" && battle.stage < STAGES.length ? "เดินทางสู่ด่านถัดไป" : "เตรียมพร้อมเล่นอีกครั้ง"}<PixelIcon name="arrow" /></button><button className="text-button full-width" onClick={() => setDialog(null)}>กลับสู่แคมป์</button></Dialog> : null}
  </div>;
}
