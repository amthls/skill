import { useEffect, useRef, useState, type ReactNode } from "react";

/** "⋯" popover that keeps low-frequency header controls out of the way. */
export default function HeaderMoreMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Thêm"
        className={`w-9 h-9 rounded-lg text-lg leading-none flex items-center justify-center transition-colors ${
          open ? "bg-accent/20 text-accent" : "bg-elevated text-text-secondary hover:text-text-primary"
        }`}
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-max max-w-[92vw] p-3 rounded-xl bg-surface border border-border-medium shadow-2xl flex flex-col items-start gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
