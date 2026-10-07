import type { Member } from "@/lib/family";
import { useHousehold } from "@/lib/household-context";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export type Person = Member & { guest?: boolean };

export function usePeople() {
  const { snapshot } = useHousehold();
  const { user } = useCurrentUserState();
  const people: Person[] = (snapshot?.members ?? []).map((member, index) => ({
    id: member.user_id,
    name: member.display_name,
    short: member.display_name,
    role: member.role,
    you: member.user_id === user?.id,
    accent: (["violet", "orange", "pink", "green", "blue"] as const)[index % 5]!,
    avatar: "",
    initial: member.display_name.slice(0, 1).toUpperCase(),
    lat: Number.NaN,
    lng: Number.NaN,
    place: "Not sharing a location",
    placeDetail: "",
    status: "still",
    lastUpdated: "",
    battery: 0,
    guest: member.role === "guest",
  }));
  return { people, familyName: snapshot?.name ?? "Family" };
}
