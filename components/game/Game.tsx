"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { accuracy, battleReducer, createBattle, STAGES, wpm, type Mode, type Run } from "../../lib/game";
import Arena, { Sprite } from "./Arena";
import Keyboard from "./Keyboard";
import PixelIcon from "./PixelIcon";
import Dialog from "./Dialog";

type User = { name: string } | null;
const MODES: { id: Mode; label: string; short: string }[] = [ { id: "en", label: "English", short: "EN" }, { id: "th", label: "ภาษาไทย", short: "TH" }, { id: "javascript", label: "JavaScript", short: "JS" }, { id: "python", label: "Python", short: "PY" } ];

function Campaign({ stage, unlocked, disabled, onSelect }: { stage: number; unlocked: number; disabled: boolean; onSelect: (stage: number) => void }) {
  return <section className="campaign stone-frame"><h2><span className="ornament">✦</span> THE CAMPAIGN <span className="ornament">✦</span></h2><p className="rail-subtitle">ห้าดินแดน หนึ่งตำนานของคุณ</p><div className="stages">{STAGES.map((item, i) => <button key={item.name} className={`stage-option ${stage === i + 1 ? "selected" : ""}`} disabled={disabled || i + 1 > unlocked} onClick={() => onSelect(i + 1)} aria-label={`ด่าน ${i + 1} ${item.name}${i + 1 > unlocked ? " ยังไม่ปลดล็อก" : ""}`} aria-current={stage === i + 1 ? "step" : undefined}>
    <span className={`stage-thumb biome-${i + 1}`}><span>{i === 0 ? "♧" : i === 1 ? "♜" : i === 2 ? "◆" : i === 3 ? "♜" : "♞"}</span></span><span className="stage-description"><strong>{String(i + 1).padStart(2, "0")}. {item.region}</strong><small>{item.name}</small><span className="difficulty">{Array.from({ length: 5 }, (_, n) => <i key={n} className={n <= i ? "filled" : ""} />)}</span></span><span className="stage-state">{i + 1 > unlocked ? <PixelIcon name="lock" /> : i + 1 < unlocked ? "✓" : stage === i + 1 ? "◂" : ""}</span>
  </button>)}</div><div className="campaign-note"><PixelIcon name="lock" /><span>ผ่านด่านเพื่อปลดล็อกการผจญภัยถัดไป</span></div></section>;
}

export default function Game({ user }: { user: User }) {
  const [battle, dispatch] = useReducer(battleReducer, undefined, () => createBattle());
  const [dialog, setDialog] = useState<"help" | "account" | "result" | null>(null);
  const [sound, setSound] = useState(false);
  const [pressed, setPressed] = useState("");
  const [inputDraft, setInputDraft] = useState("");
  const [history, setHistory] = useState<Run[]>([]);
  const [loading, setLoading] = useState(!!user);
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error" | "guest">("idle");
  const [saveError, setSaveError] = useState("");
  const [pendingRun, setPendingRun] = useState<Run | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const ended = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const active = battle.status === "playing" || battle.status === "paused";
  const unlocked = Math.min(5, Math.max(1, ...history.filter(r => r.mode === battle.mode && r.cleared).map(r => r.stage + 1)));
  const best = history.length ? Math.max(...history.map(r => r.wpm)) : 0;
  const bestScore = history.length ? Math.max(...history.map(r => r.score)) : 0;
  const bestStage = history.length ? Math.max(...history.map(r => r.stage + (r.cleared ? 1 : 0))) : 1;
  const correctPrefix = !battle.typed || battle.enemies.some(e => e.word.startsWith(battle.typed));
  const nextChar = battle.enemies.find(e => e.word.startsWith(battle.typed))?.word[battle.typed.length] || "";

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true); setLoadError("");
    try {
      const response = await fetch("/api/runs");
      const data = await response.json() as { runs: Run[]; error?: string };
      if (!response.ok) throw new Error(data.error || "โหลดประวัติไม่สำเร็จ");
      setHistory(data.runs);
    } catch (error) { setLoadError(error instanceof Error ? error.message : "เชื่อมต่อไม่สำเร็จ"); }
    finally { setLoading(false); }
  }, [user]);
  useEffect(() => {
    if (user) { void loadHistory(); return; }
    try { const saved = JSON.parse(localStorage.getItem("runeblade-guest-v1") || "[]"); if (Array.isArray(saved)) setHistory(saved.filter(r => MODES.some(m => m.id === r.mode) && Number.isInteger(r.stage) && r.stage >= 1 && r.stage <= 5 && typeof r.score === "number" && typeof r.wpm === "number").slice(0, 100)); } catch { /* Guest storage is optional. */ }
  }, [user, loadHistory]);
  useEffect(() => {
    if (battle.status !== "playing") return;
    let last = performance.now();
    const timer = setInterval(() => { const now = performance.now(); dispatch({ type: "tick", delta: now - last }); last = now; }, 50);
    const onVisibility = () => { if (document.hidden) dispatch({ type: "pause" }); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [battle.status]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing || composing.current) return;
      setPressed(event.key);
      if (event.key === "Escape" && !dialog) { dispatch({ type: "pause" }); input.current?.focus(); }
    };
    const onUp = () => setPressed("");
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onUp); };
  }, [dialog]);

  function tone(kind: "hit" | "word" | "hurt" | "start") {
    if (!sound) return;
    try {
      audio.current ??= new AudioContext();
      const context = audio.current;
      void context.resume();
      const oscillator = context.createOscillator(); const gain = context.createGain();
      oscillator.type = "square"; oscillator.frequency.setValueAtTime(kind === "hurt" ? 100 : kind === "word" ? 660 : kind === "start" ? 440 : 260, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(kind === "hurt" ? 40 : 180, context.currentTime + .1);
      gain.gain.setValueAtTime(.035, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .12);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .13);
    } catch { /* Audio is optional. */ }
  }

  const saveRun = useCallback(async (run: Run) => {
    setSaveState("saving"); setSaveError("");
    try {
      const response = await fetch("/api/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(run) });
      const data = await response.json() as { saved?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      setHistory(previous => [run, ...previous.filter(r => r.id !== run.id)].slice(0, 100)); setSaveState("saved"); setPendingRun(null);
    } catch (error) { setSaveState("error"); setSaveError(error instanceof Error ? error.message : "เชื่อมต่อไม่สำเร็จ โปรดลองอีกครั้ง"); }
  }, []);

  useEffect(() => {
    if (battle.status !== "won" && battle.status !== "lost") { ended.current = false; return; }
    if (ended.current) return;
    ended.current = true;
    const run: Run = { id: crypto.randomUUID(), mode: battle.mode, stage: battle.stage, score: battle.score, wpm: wpm(battle), accuracy: accuracy(battle), cleared: battle.status === "won", createdAt: Date.now() };
    setDialog("result"); setInputDraft("");
    if (user) { setPendingRun(run); void saveRun(run); }
    else {
      setSaveState("guest");
      setHistory(previous => { const next = [run, ...previous].slice(0, 100); try { localStorage.setItem("runeblade-guest-v1", JSON.stringify(next)); } catch { /* In-memory progress remains usable. */ } return next; });
    }
  }, [battle, saveRun, user]);
  const previousHearts = useRef(5);
  useEffect(() => { if (battle.hearts < previousHearts.current) { tone("hurt"); setInputDraft(""); setAnnouncement(`เสียหนึ่งหัวใจ เหลือ ${battle.hearts} หัวใจ`); } previousHearts.current = battle.hearts; }, [battle.hearts]);

  function start() { if (pendingRun) { setAnnouncement("กรุณาบันทึกผลรอบก่อนอีกครั้งก่อนเริ่มรอบใหม่"); setDialog("result"); return; } dispatch({ type: "start" }); setInputDraft(""); setSaveState("idle"); tone("start"); setTimeout(() => input.current?.focus(), 0); }
  function changeMode(mode: Mode) { if (active || pendingRun) return; dispatch({ type: "reset", mode, stage: 1 }); setInputDraft(""); }
  function openDialog(next: "help" | "account") { if (battle.status === "playing") dispatch({ type: "pause" }); setDialog(next); }
  function resume() { dispatch({ type: "pause" }); setTimeout(() => input.current?.focus(), 0); }
  function processInput(value: string) {
    if (battle.status !== "playing") return;
    const normalized = value.normalize("NFC");
    const hit = battle.enemies.some(e => e.word === normalized);
    dispatch({ type: "input", value: normalized });
    if (hit) { setInputDraft(""); tone("word"); setAnnouncement(`โจมตีสำเร็จ ${normalized}`); }
    else { setInputDraft(value); if (value.length > battle.typed.length) tone("hit"); }
  }
  const resetTo = (stage: number) => { dispatch({ type: "reset", mode: battle.mode, stage }); setInputDraft(""); setDialog(null); };

  return <div className="app-shell">
    <header className="site-header"><a className="brand" href="/" aria-label="RUNEBLADE หน้าหลัก"><PixelIcon name="sword" /><span>RUNE<span>BLADE</span></span></a><nav aria-label="เมนูหลัก"><button className="nav-button active" onClick={() => { if (dialog) setDialog(null); input.current?.focus(); }}>PLAY</button><button className="nav-button" onClick={() => openDialog("help")}>HOW TO PLAY</button></nav><div className="header-actions"><button className={`icon-button sound-button ${sound ? "enabled" : ""}`} onClick={() => setSound(!sound)} aria-label={sound ? "ปิดเสียง" : "เปิดเสียง"} aria-pressed={sound}><PixelIcon name={sound ? "sound" : "mute"} /></button><button className="account-button" onClick={() => openDialog("account")}><PixelIcon name="user" /><span>{user ? user.name.split(/[ @]/)[0] : "Adventurer"}</span><span className="chevron">▾</span></button></div></header>
    <main>
      <section className="page-heading"><div className="heading-rule" /><h1>Words are your weapon.</h1><div className="heading-rule right" /><p>ทุกคำที่คุณพิมพ์ คือพลังแห่งการผจญภัย</p></section>
      <div className="game-layout"><div className="play-column">
        <div className="game-toolbar"><div className="language-picker"><span className="toolbar-label">LANGUAGE</span><div className="language-options" aria-label="ภาษาที่ใช้เล่น">{MODES.filter(m => (battle.mode === "en" || battle.mode === "th") ? (m.id === "en" || m.id === "th") : (m.id === "javascript" || m.id === "python")).map(mode => <button key={mode.id} disabled={active || !!pendingRun} aria-pressed={battle.mode === mode.id} onClick={() => changeMode(mode.id)}>{mode.label}</button>)}</div></div><div className="mode-toggle"><button aria-pressed={battle.mode === "en" || battle.mode === "th"} disabled={active || !!pendingRun} onClick={() => changeMode("en")}>CLASSIC</button><button aria-pressed={battle.mode === "javascript" || battle.mode === "python"} disabled={active || !!pendingRun} onClick={() => changeMode("javascript")}>{"</>"} CODE</button></div></div>
        <Arena battle={battle} onPause={() => dispatch({ type: "pause" })} onResume={resume} />
        <div className="battle-stats"><span><strong>{wpm(battle)}</strong> WPM</span><span><strong>{accuracy(battle)}%</strong> ACCURACY</span><span><strong>{String(Math.floor(battle.elapsed / 60000)).padStart(2, "0")}:{String(Math.floor(battle.elapsed / 1000) % 60).padStart(2, "0")}</strong> TIME</span><span><PixelIcon name="star" /><strong>{battle.score.toLocaleString()}</strong> SCORE</span></div>
        <div className="typing-controls"><div className={`input-wrap ${!correctPrefix ? "invalid" : ""}`}><PixelIcon name="sword" /><label htmlFor="typing-input" className="sr-only">พิมพ์คำบนมอนสเตอร์เพื่อโจมตี</label><input id="typing-input" ref={input} value={composing.current ? inputDraft : (battle.typed || inputDraft)} placeholder={battle.status === "playing" ? "พิมพ์คำบนมอนสเตอร์..." : "Type a word to attack..."} disabled={battle.status !== "playing"} onChange={e => { setInputDraft(e.target.value); if (!composing.current) processInput(e.target.value); }} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={e => { composing.current = false; processInput(e.currentTarget.value); }} onPaste={e => e.preventDefault()} onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing && !composing.current) e.preventDefault(); }} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} aria-invalid={!correctPrefix} aria-describedby="typing-hint" /></div><button className="gold-button start-button" onClick={battle.status === "playing" ? () => dispatch({ type: "pause" }) : battle.status === "paused" ? resume : start}><PixelIcon name={battle.status === "playing" ? "pause" : "sword"} /><span>{battle.status === "playing" ? "PAUSE BATTLE" : battle.status === "paused" ? "RESUME BATTLE" : "START ADVENTURE"}</span><span className="button-spark">✦</span></button></div>
        <p className={`input-hint ${!correctPrefix ? "error-text" : ""}`} id="typing-hint">{!correctPrefix ? "ยังไม่มีคำที่ตรงกัน กด Backspace เพื่อแก้ไข" : battle.status === "playing" ? "พิมพ์คำให้ครบเพื่อโจมตีทันที • ตัวพิมพ์เล็ก–ใหญ่ต้องตรงกัน" : "เตรียมดาบให้พร้อม เลือกภาษาแล้วเริ่มการผจญภัยของคุณ"}</p>
        <Keyboard pressed={pressed} next={battle.status === "playing" ? nextChar : ""} thai={battle.mode === "th"} />
        <div className="keyboard-caption"><span><i className="key-indicator" /> NEXT KEY</span><span>YOUR KEYBOARD IS YOUR SWORD</span><PixelIcon name="sword" /></div>
      </div><aside className="rail"><Campaign stage={battle.stage} unlocked={unlocked} disabled={active || loading || !!pendingRun} onSelect={resetTo} /><section className="best-run stone-frame"><h2><span className="ornament">✦</span> YOUR BEST RUN <span className="ornament">✦</span></h2>{loading ? <p role="status" className="sync-message">กำลังโหลดประวัติ...</p> : loadError ? <div className="sync-message error-text"><p>{loadError}</p><button className="text-button" onClick={() => void loadHistory()}>ลองอีกครั้ง</button></div> : <dl><div><dt><PixelIcon name="trophy" />Highest stage</dt><dd>{String(Math.min(5, bestStage)).padStart(2, "0")}</dd></div><div><dt><PixelIcon name="star" />Best score</dt><dd>{bestScore.toLocaleString()}</dd></div><div><dt><PixelIcon name="sword" />Fastest typing</dt><dd>{best} <small>WPM</small></dd></div><div><dt><PixelIcon name="tree" />Adventures</dt><dd>{history.length}</dd></div></dl>}<button className="history-link" onClick={() => openDialog("account")}>ดูประวัติการผจญภัย <span>→</span></button></section><div className="traveler-note"><PixelIcon name="user" /><p>{user ? "ความคืบหน้าผูกกับบัญชีของคุณ" : "เข้าสู่ระบบเพื่อเก็บตำนานของคุณ"}<small>{user ? "ผ่านด่านแล้วบันทึกลงบัญชีอัตโนมัติ" : "เล่นแบบผู้เยี่ยมชมได้ บันทึกเฉพาะเครื่องนี้"}</small></p>{!user ? <a href="/signin-with-chatgpt?return_to=%2F" target="_top" className="text-button">เข้าสู่ระบบ →</a> : null}</div></aside></div>
      <footer className="game-footer"><div><kbd>ESC</kbd><span>Pause / Resume</span><i /><kbd>⌫</kbd><span>Correct a typo</span><i /><PixelIcon name="heart" /><span>5 lives. Make them count.</span></div><button className="text-button" onClick={() => openDialog("help")}><PixelIcon name="help" /> วิธีเล่น</button></footer>
    </main><div className="page-bottom"><span>RUNEBLADE · TYPE YOUR OWN LEGEND</span><span>CRAFTED IN PIXELS. POWERED BY YOU.</span></div><div className="sr-only" role="status" aria-live="polite">{announcement}</div>

    {dialog === "help" ? <Dialog title="HOW TO PLAY" onClose={() => setDialog(null)}><div className="help-intro"><Sprite kind="idle" /><div><h3>เปลี่ยนทุกคำให้เป็นคมดาบ</h3><p>ปกป้องป่าแห่งมนตราด้วยความเร็วพิมพ์ของคุณ</p></div></div><ol className="instructions"><li><strong>เลือกภาษาและด่าน</strong><p>ฝึกคำไทย อังกฤษ หรือโค้ด JavaScript / Python</p></li><li><strong>พิมพ์คำบนมอนสเตอร์</strong><p>เลือกพิมพ์ตัวไหนก่อนก็ได้ พิมพ์ครบคำจะโจมตีทันที ไม่ต้องกด Enter คำและโค้ดต้องตรงทั้งตัวพิมพ์เล็ก–ใหญ่ เว้นวรรค และเครื่องหมาย</p></li><li><strong>อย่าปล่อยให้ศัตรูเข้ามาถึงตัว</strong><p>พลาดหนึ่งตัว เสียหนึ่งหัวใจ มีทั้งหมด 5 หัวใจ พิมพ์ผิดแก้ด้วย Backspace ได้</p></li><li><strong>ปลดล็อกเส้นทางถัดไป</strong><p>กำจัดครบตามจำนวนเพื่อผ่านด่าน คำจะยาวขึ้นและศัตรูจะเร็วขึ้น หัวใจเริ่มใหม่ทุกด่าน</p></li></ol><p className="muted">WPM คำนวณจากอักขระของคำที่กำจัดสำเร็จ ÷ 5 ต่อนาที ความแม่นยำนับอักขระที่พิมพ์ตรงกับต้นคำ รวมครั้งที่พิมพ์ผิดก่อนแก้ไข การวางข้อความไม่นับเป็นการฝึกพิมพ์</p><button className="gold-button full-width" onClick={() => setDialog(null)}>เข้าใจแล้ว พร้อมผจญภัย</button></Dialog> : null}
    {dialog === "account" ? <Dialog title={user ? "ADVENTURER'S JOURNAL" : "SAVE YOUR LEGEND"} onClose={() => setDialog(null)}><div className="account-intro"><Sprite kind="idle" /><div><h3>{user ? user.name : "ตำนานบทต่อไป เริ่มที่คุณ"}</h3><p>{user ? "บัญชีของคุณ • ประวัติ 100 รอบล่าสุด" : "เข้าสู่ระบบด้วย ChatGPT เพื่อบันทึกคะแนนและด่านข้ามอุปกรณ์"}</p>{!user ? <a className="gold-button" href="/signin-with-chatgpt?return_to=%2F" target="_top">เข้าสู่ระบบด้วย ChatGPT <PixelIcon name="arrow" /></a> : <a className="text-button" href="/signout-with-chatgpt?return_to=%2F" target="_top">ออกจากระบบ</a>}</div></div>{!user ? <p className="muted">รอบที่เล่นแบบผู้เยี่ยมชมจะเก็บไว้เฉพาะในเครื่องนี้ และไม่รวมกับประวัติบัญชี</p> : null}{loadError ? <p className="error-text">{loadError} <button className="text-button" onClick={() => void loadHistory()}>ลองอีกครั้ง</button></p> : null}<h3 className="journal-title">RECENT ADVENTURES {user ? "" : "· ON THIS DEVICE"}</h3>{loading ? <p role="status">กำลังโหลดประวัติ...</p> : history.length ? <div className="history-list">{history.slice(0, 20).map(run => <div className="history-row" key={run.id}><PixelIcon name={run.cleared ? "trophy" : "sword"} /><div><strong>{STAGES[run.stage - 1]?.name}</strong><small>{MODES.find(m => m.id === run.mode)?.label} · {run.cleared ? "ผ่านด่าน" : "สิ้นสุดการต่อสู้"}</small></div><span>{run.wpm} WPM<small>{run.score.toLocaleString()} PTS</small></span></div>)}</div> : <div className="empty-journal"><PixelIcon name="tree" /><p>ยังไม่มีการผจญภัย</p><small>เริ่มเล่นรอบแรก แล้วเรื่องราวของคุณจะอยู่ที่นี่</small></div>}</Dialog> : null}
    {dialog === "result" ? <Dialog title={battle.status === "won" ? "STAGE CLEARED!" : "THE QUEST CONTINUES"} onClose={() => setDialog(null)}><div className="result-intro"><PixelIcon name={battle.status === "won" ? "trophy" : "heart"} /><h3>{battle.status === "won" ? battle.stage === 5 ? "คุณคือผู้พิทักษ์แห่ง RUNEBLADE!" : "ด่านใหม่รอคุณอยู่" : "พักดาบ แล้วลองอีกครั้ง"}</h3><p>{STAGES[battle.stage - 1].name} · {battle.kills}/{STAGES[battle.stage - 1].goal} คำ</p></div><div className="result-stats"><div><strong>{wpm(battle)}</strong><span>WPM</span></div><div><strong>{accuracy(battle)}%</strong><span>ACCURACY</span></div><div><strong>{battle.score}</strong><span>SCORE</span></div></div><p className="result-combo">Longest combo · {battle.maxCombo} words</p><div className={`save-feedback ${saveState === "error" ? "error-text" : ""}`} role="status">{saveState === "saving" ? "กำลังบันทึกลงบัญชี..." : saveState === "saved" ? "✓ บันทึกลงบัญชีแล้ว" : saveState === "guest" ? "บันทึกในเครื่องนี้แล้ว • เข้าสู่ระบบเพื่อบันทึกข้ามอุปกรณ์" : saveState === "error" ? saveError : ""}{saveState === "error" && pendingRun ? <button className="text-button" onClick={() => void saveRun(pendingRun)}>ลองบันทึกอีกครั้ง</button> : null}</div><button className="gold-button full-width" disabled={saveState === "saving" || !!pendingRun} onClick={() => { if (battle.status === "won" && battle.stage < 5) resetTo(battle.stage + 1); else resetTo(battle.stage); }}>{battle.status === "won" && battle.stage < 5 ? "เดินทางสู่ด่านถัดไป" : "เตรียมพร้อมเล่นอีกครั้ง"}<PixelIcon name="arrow" /></button><button className="text-button full-width" onClick={() => setDialog(null)}>กลับสู่แคมป์</button></Dialog> : null}
  </div>;
}
