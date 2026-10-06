import { MEMBERS, type Member } from "@/lib/family";
import { useGuardian } from "@/lib/store";

export type Person = Omit<Member, "id"> & { id: string; guest?: boolean };

export function usePeople() {
  const familyName = useGuardian((s) => s.familyName) || "Family";
  const nicknames = useGuardian((s) => s.nicknames) ?? {};
  const guests = useGuardian((s) => s.guests) ?? [];
  const people: Person[] = [
    ...MEMBERS.map((m) => {
      const nick = nicknames[m.id]?.trim();
      if (!nick) return m;
      return { ...m, name: nick, short: nick, initial: nick.slice(0, 1).toUpperCase() };
    }),
    ...guests.map((g) => {
      const shown = g.nickname.trim() || g.name;
      return {
        id: g.id,
        name: shown,
        short: shown,
        role: "Guest",
        accent: "pink" as const,
        avatar: "",
        initial: (shown.slice(0, 1) || "G").toUpperCase(),
        lat: -31.9344,
        lng: 115.8716,
        place: "Guest",
        placeDetail: "Not sharing a live location",
        status: "still" as const,
        lastUpdated: "",
        battery: 0,
        guest: true,
      };
    }),
  ];
  return { people, familyName };
}
