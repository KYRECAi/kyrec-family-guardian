import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const GAME = "https://sky-green-terra-kite.grok.me/";

export function ValentineCrush() {
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col bg-[#2a1020]">
      <Link
        to="/games"
        aria-label="Back to games"
        className="absolute left-3 top-3 z-10 grid size-11 place-items-center rounded-full bg-white/90 text-[#2a1020] shadow"
      >
        <ArrowLeft className="size-5" />
      </Link>
      <iframe
        title="Valentine Crush"
        src={GAME}
        className="min-h-dvh w-full flex-1 border-0"
        allow="autoplay"
      />
    </div>
  );
}
