import type { CompanionId } from "@/lib/companions";

export type PlanId = "free" | "plus" | "pro" | "complete";

export const AUD = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

export const PRICE = {
  plus: 9.99,
  pro: 19.99,
  complete: 29.99,
  scout: 7,
  beko: 29.99,
} as const;

export const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  plus: 1,
  pro: 2,
  complete: 3,
};

export const PLAN_LABEL: Record<PlanId, string> = {
  free: "Family Guardian Free",
  plus: "Guardian Plus",
  pro: "Guardian Pro",
  complete: "Guardian Complete",
};

export type PlanCard = {
  id: PlanId;
  name: string;
  title: string;
  price: number;
  badge: string | null;
  includes: string[];
};

export const PLAN_CARDS: PlanCard[] = [
  {
    id: "free",
    name: "Family Guardian",
    title: "Free",
    price: 0,
    badge: null,
    includes: [
      "Who’s home, on one map",
      "Home and school",
      "Ask Stan before you decide",
    ],
  },
  {
    id: "plus",
    name: "Guardian Plus",
    title: "",
    price: PRICE.plus,
    badge: null,
    includes: [
      "Shared shop list, with snatch",
      "Nova’s meals on a long day",
      "3 days of trips you chose to share",
      "Family points",
    ],
  },
  {
    id: "pro",
    name: "Guardian Pro",
    title: "",
    price: PRICE.pro,
    badge: null,
    includes: [
      "A week of chosen trips",
      "Nova in full",
      "Moneybags on the household budget",
    ],
  },
  {
    id: "complete",
    name: "Guardian Complete",
    title: "",
    price: PRICE.complete,
    badge: null,
    includes: [
      "Pulse holds the day and the goals",
      "30 days of chosen trips",
      "Everyone except Scout",
    ],
  },
];

export const SCOUT_CARD = {
  id: "scout" as const,
  name: "Scout · Travel",
  price: PRICE.scout,
  badge: "ADD-ON",
  includes: ["A destination in Google or Apple Maps", "Scout logs it and hands it to Pulse", "Add or remove anytime"],
};

export function entitlements(plan: PlanId) {
  if (plan === "complete") return { zones: Infinity, historyDays: 30 };
  if (plan === "pro") return { zones: 3, historyDays: 7 };
  if (plan === "plus") return { zones: 2, historyDays: 3 };
  return { zones: 2, historyDays: 0 };
}

export function accessPct(id: CompanionId, plan: PlanId, scoutOn: boolean) {
  if (id === "scout") return scoutOn ? 100 : 0;
  if (id === "stan") return plan === "free" ? 30 : 100;
  if (id === "nova") return plan === "free" ? 0 : plan === "plus" ? 30 : 100;
  if (id === "moneybags") return plan === "complete" ? 100 : plan === "pro" ? 30 : 0;
  if (id === "pulse") return plan === "complete" ? 100 : 0;
  return 0;
}

export function meetsPlan(plan: PlanId, need: PlanId) {
  return PLAN_RANK[plan] >= PLAN_RANK[need];
}

export function minPlanFor(id: CompanionId): PlanId | "scout" {
  if (id === "scout") return "scout";
  if (id === "stan") return "free";
  if (id === "nova") return "plus";
  if (id === "moneybags") return "pro";
  return "complete";
}

export function receiptId(at: number) {
  return `KY-${String(at).slice(-8)}`;
}
