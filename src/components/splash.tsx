import { useEffect, useRef, useState } from "react";

export function Splash({ onDone }: { onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  const left = useRef(false);
  const [out, setOut] = useState(false);

  function enter() {
    if (left.current) return;
    left.current = true;
    setOut(true);
    window.setTimeout(() => done.current(), 220);
  }

  useEffect(() => {
    const t = window.setTimeout(enter, 2600);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <button
      type="button"
      aria-label="Enter Family Guardian"
      onClick={enter}
      className="guardian-load fixed inset-0 z-[70] overflow-hidden text-white"
      style={{
        opacity: out ? 0 : 1,
        pointerEvents: out ? "none" : "auto",
        transition: "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <span className="guardian-load-wall" aria-hidden />
      <span className="guardian-load-floor" aria-hidden />
      <span className="guardian-load-vignette" aria-hidden />

      <span className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        <span className="guardian-load-mark">
          <span className="guardian-load-ring" />
          <span className="guardian-load-ring guardian-load-ring-inner" />
          <img src="/brand/kyrec-k-mark.png" alt="" className="guardian-load-k" />
          <span className="guardian-load-spark" />
        </span>
        <span className="mt-8 text-[34px] leading-none font-semibold tracking-[0.16em]">GUARDIAN</span>
        <span className="mt-3 text-[13px] tracking-[0.28em] text-white/75">
          LOADING
          <span className="guardian-load-dots">...</span>
        </span>
        <span className="guardian-load-track">
          <span className="guardian-load-fill" />
        </span>
        <span className="mt-5 text-[11px] tracking-[0.18em] text-white/45">TAP TO ENTER</span>
      </span>
    </button>
  );
}
