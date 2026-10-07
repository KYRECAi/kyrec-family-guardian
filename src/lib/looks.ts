export const LOOKS = [
  { id: "pink", label: "Pink", wash: "#f8e8ef", accent: "#f472b6" },
  { id: "dark", label: "Dark", wash: "#121014", accent: "#c084fc" },
  { id: "lime", label: "Lime", wash: "#eef8dc", accent: "#6ed31a" },
  { id: "turquoise", label: "Turquoise", wash: "#e3f7f6", accent: "#14c4c0" },
  { id: "magenta", label: "Magenta", wash: "#fde4f2", accent: "#e21888" },
  { id: "orange", label: "Hot orange", wash: "#fff0e6", accent: "#ff4d12" },
] as const;

export type LookId = (typeof LOOKS)[number]["id"];

export function isLook(value: string): value is LookId {
  return LOOKS.some((look) => look.id === value);
}
