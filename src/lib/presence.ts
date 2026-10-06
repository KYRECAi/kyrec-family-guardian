import { useEffect, useState } from "react";

export function usePerthClock() {
  const [now, setNow] = useState(() => perthParts(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setNow(perthParts(new Date())), 15000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function perthParts(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Perth",
    weekday: "long",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Perth",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  const hour = Number(
    new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Perth",
      hour: "numeric",
      hour12: false,
    }).format(date),
  );
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return { weekday, time, hour, greeting };
}

export function useHouseholdMotion() {
  const [t, setT] = useState(0);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      setT((now - t0) / 40000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const x = ((t % 2) + 2) % 2;
  const progress = x < 1 ? x : 2 - x;
  const headingHome = x < 1;
  const remaining = headingHome ? 1 - progress : progress;
  const etaMin = Math.max(1, Math.round(remaining * 18));

  return {
    positions: {} as Record<string, [number, number]>,
    samProgress: progress,
    headingHome,
    etaMin,
  };
}
