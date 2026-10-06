import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function CompanionPlate({
  src,
  locked,
  className,
  imgClassName,
}: {
  src: string;
  locked?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-navy", className)}>
      <img
        src={src}
        alt=""
        className={cn(
          "h-full w-full object-cover object-top",
          locked && "scale-105 grayscale brightness-50",
          imgClassName,
        )}
      />
      {locked ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-navy/35 text-paper">
          <Lock className="size-5" />
          <span className="text-[11px] font-medium">Locked</span>
        </div>
      ) : null}
    </div>
  );
}
