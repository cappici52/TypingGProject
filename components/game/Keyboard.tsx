import { memo } from "react";
const ROWS = [
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "BACKSPACE"],
  ["TAB", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
  ["CAPS", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "ENTER"],
  ["SHIFT", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "SHIFT"],
  ["CTRL", "ALT", "SPACE", "ALT", "CTRL"],
];
const THAI: Record<string, string> = { q: "ๆ", w: "ไ", e: "ำ", r: "พ", t: "ะ", y: "ั", u: "ี", i: "ร", o: "น", p: "ย", "[": "บ", "]": "ล", a: "ฟ", s: "ห", d: "ก", f: "ด", g: "เ", h: "้", j: "่", k: "า", l: "ส", ";": "ว", "'": "ง", z: "ผ", x: "ป", c: "แ", v: "อ", b: "ิ", n: "ื", m: "ท", ",": "ม", ".": "ใ", "/": "ฝ" };
function Keyboard({ pressed, next, thai }: { pressed: string; next: string; thai: boolean }) {
  return <div className="keyboard" aria-hidden="true">{ROWS.map((row, i) => <div className="key-row" key={i}>{row.map((key, j) => {
    const char = thai ? THAI[key] || key : key;
    return <span key={`${key}-${j}`} className={`key ${key.length > 1 ? "wide" : ""} ${key === "SPACE" ? "space" : ""} ${pressed.toLowerCase() === char.toLowerCase() || (pressed === " " && key === "SPACE") ? "pressed" : ""} ${next && (char === next || (key === "SPACE" && next === " ")) ? "next" : ""}`}>{key === "BACKSPACE" ? "← BACKSPACE" : char.toUpperCase()}</span>;
  })}</div>)}</div>;
}
export default memo(Keyboard);
