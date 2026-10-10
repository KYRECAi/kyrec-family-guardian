import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { HOUSEHOLD, type MemberId } from "@/lib/family";
import type { PlanId } from "@/lib/plans";
import { isLook, type LookId } from "@/lib/looks";

export type Mood = "light" | "steady" | "low" | "bright";

type StanMsg = { role: "user" | "stan"; text: string };

type State = {
  locationPaused: boolean;
  sharing: Record<string, boolean>;
  alertPrefs: {
    arrival: boolean;
    departure: boolean;
    driving: boolean;
    checkin: boolean;
    battery: boolean;
    quietHours: boolean;
    zoneOnly: boolean;
  };
  alertPeople: Record<string, boolean>;
  driveInsights: { score: boolean; trips: boolean; speed: boolean; phone: boolean };
  readAlertIds: string[];
  doneRoutineIds: string[];
  claimedHabits: string[];
  points: number;
  budgetSpent: number;
  gameBest: Record<string, number>;
  novaMoods: { at: number; mood: Mood; note: string }[];
  stanMessages: StanMsg[];
  plan: PlanId;
  scoutOn: boolean;
  subscribedAt: number | null;
  checkIns: { id: string; memberId: MemberId; at: number; status: "waiting" | "confirmed" }[];
  budgetStarted: boolean;
  weeklyIncome: number;
  budgetCats: { id: string; name: string; planned: number }[];
  budgetTx: { id: string; categoryId: string; amount: number; note: string; at: number }[];
  events: { id: string; title: string; date: string; start: string; who: string }[];
  tasks: { id: string; title: string; done: boolean }[];
  rhythm: Record<string, boolean>;
  chats: Record<string, { role: "user" | "them"; text: string }[]>;
  meals: { id: string; title: string }[];
  groceries: {
    id: string;
    item: string;
    by: string | null;
    from: string | null;
    snatchedBy?: string | null;
  }[];
  regulars: string[];
  shopSeed: string;
  snatchOn: boolean;
  itemUses: Record<string, number>;
  itemBuys: Record<string, number[]>;
  itemEvery: Record<string, number>;
  itemSnooze: Record<string, number>;
  longDay: boolean;
  scoutLogs: { id: string; place: string; at: number }[];
  goals: { id: string; who: string; want: string; horizon: string }[];
  seenTips: boolean;
  visits: number;
  youPhoto: string | null;
  avatarId: string | null;
  mapsKey: string;
  displayName: string;
  username: string;
  familyName: string;
  nicknames: Record<string, string>;
  guests: { id: string; name: string; nickname: string }[];
  look: LookId;
  setLook: (look: LookId) => void;
  setSnatchOn: (on: boolean) => void;
  togglePaused: () => void;
  setSharing: (id: string, on: boolean) => void;
  setAlertPref: (key: keyof State["alertPrefs"], on: boolean) => void;
  setAlertPerson: (id: string, on: boolean) => void;
  setDriveInsight: (key: keyof State["driveInsights"], on: boolean) => void;
  markAlertRead: (id: string) => void;
  toggleRoutine: (id: string) => void;
  claimHabit: (id: string, pts: number) => void;
  addBudget: (amount: number) => void;
  resetBudget: () => void;
  addGameScore: (game: string, score: number) => void;
  addMood: (mood: Mood, note: string) => void;
  addStan: (msg: StanMsg) => void;
  setPlan: (plan: PlanId) => void;
  toggleScout: () => void;
  subscribe: (opts: { plan: PlanId; scout: boolean }) => void;
  cancelPlan: () => void;
  requestCheckIn: (memberId: MemberId) => void;
  startBudget: () => void;
  setWeeklyIncome: (n: number) => void;
  addBudgetCat: (name: string, planned: number) => void;
  addBudgetTx: (categoryId: string, amount: number, note: string) => void;
  addEvent: (title: string, date: string, start: string, who: string) => void;
  removeEvent: (id: string) => void;
  addTask: (title: string) => void;
  toggleTask: (id: string) => void;
  toggleRhythm: (id: string) => void;
  addChat: (id: string, msg: { role: "user" | "them"; text: string }) => void;
  addMeal: (title: string) => void;
  addGrocery: (item: string) => void;
  markGrocery: (id: string, by: string) => void;
  unmarkGrocery: (id: string) => void;
  snatchGrocery: (id: string, by: string) => void;
  clearGrocery: (id: string) => void;
  repairGroceries: () => void;
  ensureStaples: () => void;
  saveRegular: (item: string) => void;
  dropRegular: (item: string) => void;
  noteItemUse: (item: string) => void;
  setItemEvery: (item: string, days: number) => void;
  snoozeItem: (item: string, until: number) => void;
  setLongDay: (on: boolean) => void;
  logScout: (place: string) => void;
  addGoal: (who: string, want: string, horizon: string) => void;
  removeGoal: (id: string) => void;
  dismissTips: () => void;
  noteVisit: () => void;
  setYouPhoto: (src: string | null) => void;
  setAvatarId: (id: string | null) => void;
  setMapsKey: (key: string) => void;
  setDisplayName: (name: string) => void;
  setUsername: (name: string) => void;
  setFamilyName: (name: string) => void;
  setNickname: (id: string, nickname: string) => void;
  addGuest: (name: string, nickname: string) => void;
  removeGuest: (id: string) => void;
  resetDemo: () => void;
};

const defaults = {
  locationPaused: true,
  sharing: {} as Record<MemberId, boolean>,
  alertPrefs: {
    arrival: true,
    departure: true,
    driving: true,
    checkin: true,
    battery: false,
    quietHours: false,
    zoneOnly: true,
  },
  alertPeople: { michael: true, kelly: true, paige: true, chelsea: true, madison: true } as Record<
    MemberId,
    boolean
  >,
  driveInsights: { score: true, trips: true, speed: true, phone: true },
  readAlertIds: [] as string[],
  doneRoutineIds: [] as string[],
  claimedHabits: [] as string[],
  points: 0,
  budgetSpent: 0,
  gameBest: {} as Record<string, number>,
  novaMoods: [] as { at: number; mood: Mood; note: string }[],
  plan: "free" as PlanId,
  scoutOn: false,
  subscribedAt: null as number | null,
  checkIns: [] as { id: string; memberId: MemberId; at: number; status: "waiting" | "confirmed" }[],
  budgetStarted: false,
  weeklyIncome: 0,
  budgetCats: [] as { id: string; name: string; planned: number }[],
  budgetTx: [] as { id: string; categoryId: string; amount: number; note: string; at: number }[],
  events: [] as { id: string; title: string; date: string; start: string; who: string }[],
  tasks: [] as { id: string; title: string; done: boolean }[],
  rhythm: {} as Record<string, boolean>,
  chats: {} as Record<string, { role: "user" | "them"; text: string }[]>,
  meals: [] as { id: string; title: string }[],
  groceries: [] as { id: string; item: string; by: string | null; from: string | null }[],
  regulars: ["Milk", "Bread", "Eggs", "Coffee"],
  shopSeed: "blank",
  snatchOn: true,
  itemUses: {} as Record<string, number>,
  itemBuys: {} as Record<string, number[]>,
  itemEvery: {} as Record<string, number>,
  itemSnooze: {} as Record<string, number>,
  longDay: false,
  scoutLogs: [] as { id: string; place: string; at: number }[],
  goals: [] as { id: string; who: string; want: string; horizon: string }[],
  seenTips: false,
  visits: 0,
  youPhoto: null as string | null,
  avatarId: null as string | null,
  mapsKey: "",
  displayName: "You",
  username: "",
  familyName: "Family",
  nicknames: {} as Record<string, string>,
  guests: [] as { id: string; name: string; nickname: string }[],
  look: "pink" as LookId,
  stanMessages: [
    {
      role: "stan" as const,
      text: "I’m Stan. Clear information. Safety in view. People decide. Ask me what this household has chosen to share — I will not take the decision away.",
    },
  ],
};

function uniqueGroceries<T extends { id: string }>(list: T[]) {
  const seen = new Set<string>();
  return list.map((g) => {
    if (g.id && !seen.has(g.id)) {
      seen.add(g.id);
      return g;
    }
    const id = `g-${crypto.randomUUID()}`;
    seen.add(id);
    return { ...g, id };
  });
}

export const useGuardian = create<State>()(
  persist(
    (set, get) => ({
      ...defaults,
      togglePaused: () => set({ locationPaused: !get().locationPaused }),
      setSharing: (id, on) => set({ sharing: { ...get().sharing, [id]: on } }),
      setAlertPref: (key, on) => set({ alertPrefs: { ...get().alertPrefs, [key]: on } }),
      setAlertPerson: (id, on) => set({ alertPeople: { ...get().alertPeople, [id]: on } }),
      setDriveInsight: (key, on) => set({ driveInsights: { ...get().driveInsights, [key]: on } }),
      markAlertRead: (id) =>
        set({
          readAlertIds: get().readAlertIds.includes(id)
            ? get().readAlertIds
            : [...get().readAlertIds, id],
        }),
      toggleRoutine: (id) => {
        const cur = get().doneRoutineIds;
        set({
          doneRoutineIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
        });
      },
      claimHabit: (id, pts) => {
        if (get().claimedHabits.includes(id)) return;
        set({ claimedHabits: [...get().claimedHabits, id], points: get().points + pts });
      },
      addBudget: (amount) =>
        set({ budgetSpent: (get().budgetSpent ?? HOUSEHOLD.budgetSpent) + amount }),
      resetBudget: () => set({ budgetSpent: 240 }),
      addGameScore: (game, score) => {
        const best = Math.max(get().gameBest[game] ?? 0, score);
        const gained = Math.floor(score / 10);
        set({
          gameBest: { ...get().gameBest, [game]: best },
          points: get().points + gained,
        });
      },
      addMood: (mood, note) =>
        set({
          novaMoods: [{ at: Date.now(), mood, note }, ...(get().novaMoods ?? [])].slice(0, 12),
        }),
      addStan: (msg) => set({ stanMessages: [...get().stanMessages, msg].slice(-24) }),
      setPlan: (plan) =>
        set({ plan, subscribedAt: plan === "free" ? get().subscribedAt : Date.now() }),
      toggleScout: () => set({ scoutOn: !get().scoutOn, subscribedAt: Date.now() }),
      subscribe: ({ plan, scout }) =>
        set({
          plan,
          scoutOn: scout,
          subscribedAt: plan !== "free" || scout ? Date.now() : null,
        }),
      cancelPlan: () => set({ plan: "free", scoutOn: false, subscribedAt: null }),
      requestCheckIn: (memberId) =>
        set({
          checkIns: [
            { id: `c-${Date.now()}`, memberId, at: Date.now(), status: "waiting" as const },
            ...get().checkIns,
          ].slice(0, 12),
        }),
      startBudget: () => set({ budgetStarted: true }),
      setWeeklyIncome: (n) => set({ weeklyIncome: Math.max(0, n) }),
      addBudgetCat: (name, planned) =>
        set({
          budgetCats: [
            ...get().budgetCats,
            { id: `cat-${Date.now()}`, name, planned: Math.max(0, planned) },
          ],
        }),
      addBudgetTx: (categoryId, amount, note) =>
        set({
          budgetTx: [
            {
              id: `tx-${Date.now()}`,
              categoryId,
              amount: Math.max(0, amount),
              note,
              at: Date.now(),
            },
            ...get().budgetTx,
          ],
        }),
      addEvent: (title, date, start, who) =>
        set({
          events: [...get().events, { id: `e-${Date.now()}`, title, date, start, who }].sort(
            (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
          ),
        }),
      removeEvent: (id) => set({ events: get().events.filter((e) => e.id !== id) }),
      addTask: (title) => {
        const name = title.trim();
        if (!name) return;
        set({
          tasks: [
            ...(get().tasks ?? []),
            { id: `t-${crypto.randomUUID()}`, title: name, done: false },
          ],
        });
      },
      toggleTask: (id) =>
        set({
          tasks: (get().tasks ?? []).map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        }),
      toggleRhythm: (id) => set({ rhythm: { ...get().rhythm, [id]: !get().rhythm[id] } }),
      addChat: (id, msg) =>
        set({
          chats: {
            ...get().chats,
            [id]: [...(get().chats[id] ?? []), msg].slice(-24),
          },
        }),
      addMeal: (title) => {
        const name = title.trim();
        if (!name) return;
        set({ meals: [...(get().meals ?? []), { id: `m-${Date.now()}`, title: name }] });
      },
      addGrocery: (item) => {
        const name = item.trim();
        if (!name) return;
        const list = get().groceries ?? [];
        if (list.some((g) => g.item.trim().toLowerCase() === name.toLowerCase())) return;
        set({
          groceries: [
            ...list,
            { id: `g-${crypto.randomUUID()}`, item: name, by: null, from: null, snatchedBy: null },
          ],
        });
      },
      noteItemUse: (item) => {
        const key = item.trim().toLowerCase();
        if (!key) return;
        const uses = get().itemUses ?? {};
        const buys = get().itemBuys ?? {};
        const stamps = [...(buys[key] ?? []), Date.now()].slice(-12);
        set({
          itemUses: { ...uses, [key]: (uses[key] ?? 0) + 1 },
          itemBuys: { ...buys, [key]: stamps },
        });
      },
      setItemEvery: (item, days) => {
        const key = item.trim().toLowerCase();
        if (!key || days < 1) return;
        const buys = get().itemBuys ?? {};
        const stamps = buys[key] ?? [];
        set({
          itemEvery: { ...(get().itemEvery ?? {}), [key]: days },
          itemBuys: stamps.length ? buys : { ...buys, [key]: [Date.now()] },
        });
      },
      snoozeItem: (item, until) => {
        const key = item.trim().toLowerCase();
        if (!key) return;
        set({ itemSnooze: { ...(get().itemSnooze ?? {}), [key]: until } });
      },
      saveRegular: (item) => {
        const name = item.trim();
        if (!name) return;
        const regulars = get().regulars ?? [];
        if (regulars.some((r) => r.toLowerCase() === name.toLowerCase())) return;
        set({ regulars: [...regulars, name] });
      },
      dropRegular: (item) => {
        const key = item.trim().toLowerCase();
        set({ regulars: (get().regulars ?? []).filter((r) => r.toLowerCase() !== key) });
      },
      markGrocery: (id, by) => {
        const list = uniqueGroceries(get().groceries ?? []);
        const index = list.findIndex((g) => g.id === id);
        const row = list[index];
        if (!row || row.by) return;
        const next = list.slice();
        next[index] = { ...row, by, from: null };
        set({ groceries: next, points: get().points + 15 });
      },
      unmarkGrocery: (id) => {
        const list = uniqueGroceries(get().groceries ?? []);
        const index = list.findIndex((g) => g.id === id);
        const row = list[index];
        if (!row?.by || row.from) return;
        const next = list.slice();
        next[index] = { ...row, by: null, from: null };
        set({ groceries: next, points: Math.max(0, get().points - 15) });
      },
      snatchGrocery: (id, by) => {
        const list = uniqueGroceries(get().groceries ?? []);
        const index = list.findIndex((g) => g.id === id);
        const row = list[index];
        if (!row || row.snatchedBy) return;
        const next = list.slice();
        next[index] = { ...row, snatchedBy: by };
        set({ groceries: next, points: get().points + 30 });
      },
      repairGroceries: () => {
        const list = get().groceries ?? [];
        const next = uniqueGroceries(list);
        if (next.some((g, i) => g.id !== list[i]?.id)) set({ groceries: next });
      },
      ensureStaples: () => {
        const four = ["Milk", "Bread", "Eggs", "Coffee"];
        if (get().shopSeed !== "blank") {
          set({
            groceries: [],
            regulars: four,
            shopSeed: "blank",
          });
          return;
        }
        const list = get().groceries ?? [];
        const next = uniqueGroceries(list);
        if (next.some((g, i) => g.id !== list[i]?.id)) set({ groceries: next });
        if (!(get().regulars ?? []).length) set({ regulars: four });
      },
      clearGrocery: (id) => {
        const list = uniqueGroceries(get().groceries ?? []);
        const index = list.findIndex((g) => g.id === id);
        const row = list[index];
        if (!row) return;
        const back = row.snatchedBy ? 30 : 0;
        set({
          groceries: list.filter((_, i) => i !== index),
          points: Math.max(0, get().points - back),
        });
      },
      setLongDay: (on) => set({ longDay: on }),
      logScout: (place) => {
        const name = place.trim();
        if (!name) return;
        const date = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Australia/Perth",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());
        const start = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Australia/Perth",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(new Date());
        set({
          scoutLogs: [
            { id: `s-${Date.now()}`, place: name, at: Date.now() },
            ...(get().scoutLogs ?? []),
          ].slice(0, 8),
          events: [
            ...get().events,
            { id: `e-${Date.now()}`, title: `Scout · ${name}`, date, start, who: "Pulse" },
          ].sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)),
        });
      },
      addGoal: (who, want, horizon) => {
        const name = want.trim();
        if (!name) return;
        set({
          goals: [...(get().goals ?? []), { id: `goal-${Date.now()}`, who, want: name, horizon }],
        });
      },
      removeGoal: (id) => set({ goals: (get().goals ?? []).filter((g) => g.id !== id) }),
      dismissTips: () => set({ seenTips: true }),
      noteVisit: () => set({ visits: (get().visits ?? 0) + 1 }),
      setYouPhoto: (src) => set({ youPhoto: src, avatarId: src ? null : get().avatarId }),
      setAvatarId: (id) => set({ avatarId: id, youPhoto: id ? null : get().youPhoto }),
      setMapsKey: (key) => set({ mapsKey: key.trim() }),
      setDisplayName: (name) => {
        const next = name.trim().slice(0, 40);
        if (next) set({ displayName: next });
      },
      setUsername: (name) => {
        const next = name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 20);
        if (next.length >= 3) set({ username: next });
      },
      setFamilyName: (name) => {
        const next = name.trim().slice(0, 40);
        if (next) set({ familyName: next });
      },
      setNickname: (id, nickname) =>
        set({ nicknames: { ...(get().nicknames ?? {}), [id]: nickname.trim().slice(0, 24) } }),
      addGuest: (name, nickname) => {
        const who = name.trim();
        if (!who) return;
        set({
          guests: [
            ...(get().guests ?? []),
            {
              id: `guest-${Date.now()}`,
              name: who.slice(0, 40),
              nickname: nickname.trim().slice(0, 24),
            },
          ],
        });
      },
      removeGuest: (id) => set({ guests: (get().guests ?? []).filter((g) => g.id !== id) }),
      setLook: (look) => {
        if (isLook(look)) set({ look });
      },
      setSnatchOn: (on) => set({ snatchOn: on }),
      resetDemo: () => set({ ...defaults }),
    }),
    {
      name: "kyrec-family-guardian-v7-unbound",
      skipHydration: true,
      partialize: (state) => ({
        ...state,
        chats: {},
        stanMessages: [],
        novaMoods: [],
        mapsKey: "",
        groceries: [],
        itemBuys: {},
      }),
    },
  ),
);

/** Never hydrate one person's private device data into another account. */
export async function activatePersonalStore(userId: string) {
  useGuardian.persist.setOptions({ storage: undefined });
  useGuardian.setState({ ...defaults, chats: {}, stanMessages: [], novaMoods: [] });
  useGuardian.persist.setOptions({
    name: `kyrec-family-guardian-v7-${encodeURIComponent(userId)}`,
    storage: createJSONStorage(() => localStorage),
  });
  await useGuardian.persist.rehydrate();
  useGuardian.setState({ chats: {}, stanMessages: [], novaMoods: [] });
}
