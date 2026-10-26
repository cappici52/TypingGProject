"use client";
import { useEffect, useRef, useState } from "react";
import PixelIcon from "./PixelIcon";

const KEY = "runeblade-music-v1";
export default function MusicControls() {
  const player = useRef<HTMLAudioElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(30);
  const [message, setMessage] = useState("");
  const request = useRef(0);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || "null");
      if (stored && Number.isFinite(stored.volume)) setVolume(Math.max(0, Math.min(100, stored.volume)));
      if (stored?.enabled) setMessage("กดเปิดเพลงเพื่อฟังต่อ");
    } catch { /* Optional preference; gameplay saves are independent. */ }
    return () => { request.current++; };
  }, []);
  useEffect(() => { if (player.current) player.current.volume = volume / 100; }, [volume]);
  useEffect(() => {
    const visibility = () => {
      if (!player.current || !enabled) return;
      if (document.hidden) player.current.pause();
      else void player.current.play().catch(() => { setEnabled(false); setMessage("กดเปิดเพลงเพื่อฟังต่อ"); });
    };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [enabled]);
  function remember(on: boolean, level: number) {
    try { localStorage.setItem(KEY, JSON.stringify({ enabled: on, volume: level })); } catch { /* Optional preference. */ }
  }
  async function toggle() {
    const audio = player.current;
    if (!audio) return;
    const id = ++request.current;
    if (enabled) { audio.pause(); setEnabled(false); setMessage(""); remember(false, volume); return; }
    try {
      audio.volume = volume / 100;
      await audio.play();
      if (id !== request.current) return;
      setEnabled(true); setMessage(""); remember(true, volume);
    } catch { if (id === request.current) { setEnabled(false); setMessage("เปิดเพลงไม่ได้ ลองกดเปิดอีกครั้ง"); } }
  }
  return <div className="music-controls stone-frame" role="group" aria-label="เพลงประกอบ">
    <audio ref={player} src="/audio/whispering-woods.wav" loop preload="none" onError={() => { setEnabled(false); setMessage("โหลดเพลงไม่ได้ ลองรีเฟรชเกมแล้วเปิดเพลงอีกครั้ง"); }} />
    <button className="motion-toggle" onClick={() => void toggle()} aria-pressed={enabled} aria-label={enabled ? "ปิดเพลงประกอบ" : "เปิดเพลงประกอบ"}><PixelIcon name={enabled ? "sound" : "mute"} /> MUSIC {enabled ? "ON" : "OFF"}</button>
    <div className="music-track"><strong>WHISPERING WOODS</strong><small>พิณและขลุ่ยแห่งพงไพร</small></div>
    <label className="music-volume">เสียงเพลง <input type="range" min="0" max="100" step="1" value={volume} aria-label="ระดับเสียงเพลงประกอบ" aria-valuetext={`${volume}%`} onChange={event => { const next = Number(event.target.value); setVolume(next); remember(enabled, next); }} /><output>{volume}%</output></label>
    <span className={message ? "music-message" : "sr-only"} role="status">{message}</span>
  </div>;
}
