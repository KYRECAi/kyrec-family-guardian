import { avatarSrc } from "@/lib/avatars";
import type { Member } from "@/lib/family";
import { useGuardian } from "@/lib/store";
import { cn, tokenColor } from "@/lib/utils";

export function MemberAvatar({
  member,
  size = 44,
  ring = true,
  paused = false,
  src,
  className,
}: {
  member: Pick<Member, "name" | "avatar" | "accent" | "short" | "initial"> & {
    id?: string;
    you?: boolean;
  };
  size?: number;
  ring?: boolean;
  paused?: boolean;
  src?: string | null;
  className?: string;
}) {
  const youPhoto = useGuardian((s) => s.youPhoto);
  const avatarId = useGuardian((s) => s.avatarId);
  const isYou = Boolean(member.you);
  const yours = isYou ? youPhoto || (avatarId ? avatarSrc(avatarId) : null) : null;
  const initial = member.initial ?? member.short.slice(0, 1);
  const photo = src || yours || member.avatar;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-paper",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: tokenColor(member.accent),
        boxShadow: ring ? `0 0 0 2px ${tokenColor(member.accent)}` : undefined,
        opacity: paused ? 0.45 : 1,
      }}
    >
      {photo ? (
        <img
          src={photo}
          alt={member.name}
          width={size}
          height={size}
          className="size-full object-cover"
        />
      ) : (
        initial
      )}
    </span>
  );
}
