"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type CombatSound = "type" | "defeat" | "boss-defeat" | "strike" | "hurt" | "start";
export type CombatAudioHandle = { play: (kind: CombatSound) => void };
// Multiple preloaded voices let rapid keystrokes overlap without cutting each other off.
const VOICES: { kind: CombatSound; file: string }[] = [
  ...Array.from({ length: 6 }, (_, index) => ({ kind: "type" as const, file: `type-${index % 3 + 1}` })),
  ...Array.from({ length: 3 }, () => ({ kind: "defeat" as const, file: "defeat" })),
  { kind: "boss-defeat", file: "boss-defeat" },
  { kind: "strike", file: "strike" }, { kind: "hurt", file: "hurt" }, { kind: "start", file: "start" },
];

const CombatAudio = forwardRef<CombatAudioHandle, { enabled: boolean }>(function CombatAudio({ enabled }, ref) {
  const players = useRef<(HTMLAudioElement | null)[]>([]);
  const cursor = useRef<Partial<Record<CombatSound, number>>>({});
  useImperativeHandle(ref, () => ({
    play(kind) {
      if (!enabled) return;
      const voices = VOICES.flatMap((voice, index) => voice.kind === kind && players.current[index] ? [players.current[index]!] : []);
      if (!voices.length) return;
      const index = cursor.current[kind] ?? 0;
      const player = voices[index % voices.length];
      cursor.current[kind] = index + 1;
      try {
        player.currentTime = 0;
        player.volume = kind === "type" ? .42 : .6;
        void player.play().catch(() => { /* Blocked audio must never interrupt typing. */ });
      } catch { /* Audio is optional. */ }
    },
  }), [enabled]);
  useEffect(() => {
    const stop = () => players.current.forEach(player => player?.pause());
    const visibility = () => { if (document.hidden) stop(); };
    if (!enabled) stop();
    document.addEventListener("visibilitychange", visibility);
    return () => { stop(); document.removeEventListener("visibilitychange", visibility); };
  }, [enabled]);
  return <div hidden aria-hidden="true">{VOICES.map((voice, index) => <audio key={index} ref={player => { players.current[index] = player; }} data-effect={voice.kind} src={`/audio/effects/${voice.file}.wav`} preload="auto" />)}</div>;
});
export default CombatAudio;
