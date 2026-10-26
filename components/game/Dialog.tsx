import { useEffect, useRef, type ReactNode } from "react";
export default function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = ref.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={ref} className="game-dialog stone-frame" aria-labelledby="dialog-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="dialog-header"><h2 id="dialog-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="ปิดหน้าต่าง" autoFocus>×</button></div>{children}</dialog>;
}
