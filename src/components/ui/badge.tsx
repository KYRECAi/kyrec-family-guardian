import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "muted" | "blue" | "green" | "gold" | "violet" | "danger" | "pink" | "orange";
}) {
  const tones: Record<string, string> = {
    muted: "bg-black/6 text-muted",
    blue: "bg-blue/15 text-blue",
    green: "bg-green/15 text-green",
    gold: "bg-gold/15 text-gold",
    violet: "bg-violet/18 text-fg",
    danger: "bg-danger/15 text-danger",
    pink: "bg-pink/15 text-pink",
    orange: "bg-orange/18 text-orange",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
