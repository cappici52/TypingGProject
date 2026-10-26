const paths = {
  sword: "M13 1h2v6h-2v2h-2v2H9v2H7v2H5v-2H3v-2h2V9h2v2h2V9h2V7h2zM1 13h2v2H1z",
  heart: "M2 2h4v2h4V2h4v2h2v5h-2v2h-2v2h-2v2H6v-2H4v-2H2V9H0V4h2z",
  lock: "M4 1h8v2h2v5h2v8H0V8h2V3h2zm2 2v5h4V3zm1 8v3h2v-3z",
  sound: "M0 6h4l4-4h2v12H8l-4-4H0zm12-2h2v2h2v4h-2v2h-2v-2h2V6h-2z",
  mute: "M0 6h4l4-4h2v12H8l-4-4H0zm12-1h2v2h2v2h-2v2h-2V9h2V7h-2z",
  trophy: "M4 0h8v2h4v6h-2v2h-3v2H9v2h3v2H4v-2h3v-2H5v-2H2V8H0V2h4zm-2 4v4h2V4zm10 0v4h2V4z",
  star: "M6 0h4v4h6v4h-4v4h2v4l-6-4-6 4v-4h2V8H0V4h6z",
  arrow: "M2 6h8V2h2v2h2v2h2v4h-2v2h-2v2h-2v-4H2z",
  tree: "M7 0h2v2h2v2h2v2h-2v2h4v2h-3v2h4v2H9v2H7v-2H0v-2h4v-2H1V8h4V6H3V4h2V2h2z",
  user: "M5 0h6v2h2v6h-2v2H5V8H3V2h2zM3 12h10v2h2v2H1v-2h2z",
  pause: "M3 1h4v14H3zm6 0h4v14H9z",
  help: "M4 0h8v2h2v2h2v8h-2v2h-2v2H4v-2H2v-2H0V4h2V2h2zm2 4v2h2V4h2v3H8v3H6V7h2V6H6zm0 8v2h2v-2z",
} as const;
export default function PixelIcon({ name, className = "" }: { name: keyof typeof paths; className?: string }) {
  return <svg aria-hidden="true" className={`pixel-icon ${className}`} viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges"><path d={paths[name]} fillRule="evenodd" /></svg>;
}
