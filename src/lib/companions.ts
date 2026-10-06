import { HOUSEHOLD } from "@/lib/family";

export type CompanionId = "stan" | "nova" | "pulse" | "scout" | "moneybags";
export type MoneybagsPhase = "above" | "track" | "unlocked";

export type CompanionLore = {
  id: CompanionId;
  name: string;
  pronoun: string;
  role: string;
  lane: string;
  tagline: string;
  mission: string;
  look: string;
  quote: string;
  portrait: string;
  accent: "blue" | "pink" | "violet" | "gold" | "green";
  everyday: boolean;
  ways: { title: string; body: string }[];
  owns: string;
  not: string;
  limit: string;
};

export const COMPANION_LORE: Record<CompanionId, CompanionLore> = {
  stan: {
    id: "stan",
    name: "Stan",
    pronoun: "he",
    role: "AI & safety guardian",
    lane: "Decision support",
    tagline: "Clear information. Safety in view. People decide.",
    mission: "Make AI support clear, responsible and honest about its limits.",
    look: "Approved design: white owl, gold-rimmed glasses, navy scarf. Quiet confidence, on purpose.",
    quote: "AI should make a decision clearer — not take it away.",
    portrait: "/companions/stan.jpg",
    accent: "blue",
    everyday: true,
    ways: [
      { title: "Make sense of information", body: "Turn supported facts into clarity. Separate what is known from what is still uncertain." },
      { title: "Think it through", body: "Compare options, risks and family-set rules. He does not make the choice." },
      { title: "Keep safety in view", body: "Privacy, permissions and agreed habits stay visible. No silent monitoring." },
      { title: "Know the limit", body: "When a parent, professional or emergency service should take over, he says so." },
    ],
    owns: "Clarity, risk awareness and human handover.",
    not: "Nova’s warmth. Pulse’s family plans. Scout’s travel intelligence.",
    limit: "Not a medical, mental health, security, monitoring or emergency service. In Australia, danger means call 000.",
  },
  nova: {
    id: "nova",
    name: "Nova",
    pronoun: "she",
    role: "Emotional support",
    lane: "Chosen wellbeing",
    tagline: "Feel heard. Care gently. Find lightness.",
    mission: "Bring warmth to emotional wellbeing and everyday self-care.",
    look: "Approved design: cream fox, rose inner ears, a gold star on her brow. Warm, curious, full of heart.",
    quote: "Warmth can change how an ordinary day feels.",
    portrait: "/companions/nova.jpg",
    accent: "pink",
    everyday: true,
    ways: [
      { title: "Feel heard", body: "She listens to what someone chooses to share — without judging or diagnosing." },
      { title: "Care gently", body: "Room for feelings. Kind words. No pressure to explain." },
      { title: "Chosen routines", body: "Rest, hydration, movement and downtime — only if someone wants them, never scored." },
      { title: "Find lightness", body: "Affection and playful energy in ordinary moments. Wellbeing is not a leaderboard." },
    ],
    owns: "Warmth, chosen emotional check-ins and gentle wellbeing support.",
    not: "Stan’s decisions. Pulse’s group rhythm. Therapy, diagnosis or mood inference.",
    limit: "Not a planner, tracker, therapist or medical advisor. She does not supervise children or replace human care.",
  },
  pulse: {
    id: "pulse",
    name: "Pulse",
    pronoun: "they",
    role: "Family connection",
    lane: "Group coordination",
    tagline: "Share the plan. Check in by choice. Stay in sync.",
    mission: "Bring shared plans, reminders, opt-in mood check-ins and connection moments into one visible family rhythm.",
    look: "Approved design: teal cat, gold bell, sitting in the middle of the household traffic. The rhythm layer.",
    quote: "A stronger family rhythm starts when everyone feels in the loop.",
    portrait: "/companions/pulse.jpg",
    accent: "violet",
    everyday: true,
    ways: [
      { title: "See the family plan", body: "Routines, pickups and dinner in one shared view — visible to the people involved." },
      { title: "Keep everyone in sync", body: "Helpful reminders so important moments do not disappear into the noise." },
      { title: "Share how today feels", body: "A voluntary check-in. Pulse does not infer or monitor emotion." },
      { title: "Create a connection moment", body: "Make room for a conversation, quiet time or time together." },
    ],
    owns: "Shared plans, reminders, voluntary mood check-ins and time together.",
    not: "Nova’s one-to-one emotional support. Running the family. Deciding how anyone feels.",
    limit: "Not a medical, mental health, crisis or emergency service. Mood check-ins depend only on what a person chooses to share.",
  },
  scout: {
    id: "scout",
    name: "Scout",
    pronoun: "she",
    role: "Travel intelligence",
    lane: "Journeys",
    tagline: "Plan the journey. Read the changes. Follow the route.",
    mission: "Make every journey easier to prepare, understand and navigate — the school run or a trip across the world.",
    look: "Approved design: amber fox, travel satchel, compass in paw. She brings the outside world into the KYREC family.",
    quote: "From departure to arrival, Scout keeps the journey understandable.",
    portrait: "/companions/scout.jpg",
    accent: "green",
    everyday: true,
    ways: [
      { title: "Prepare the itinerary", body: "Bookings, checklists, departure times and essential trip details in one travel plan." },
      { title: "Read alerts early", body: "Supported delay, weather and route alerts — so travellers can understand what changed." },
      { title: "Follow the route", body: "Directions, upcoming stops and navigation options from supported maps." },
      { title: "Re-plan the journey", body: "Compare route options when a delay, closure or cancellation shifts the plan. People still choose." },
    ],
    owns: "Travel intelligence: itineraries, supported alerts, maps and routes.",
    not: "Stan’s decision-support. Pulse’s family rhythm. Driving the car for anyone.",
    limit: "Does not replace emergency services, official travel advisories, transport operators or responsible driver attention.",
  },
  moneybags: {
    id: "moneybags",
    name: "Moneybags",
    pronoun: "he",
    role: "Earned weekly bonus",
    lane: "Unlock-only reward",
    tagline: "Two goals complete. One bonus unlocked. One family celebration.",
    mission: "Turn a shared weekly result into a positive ceremony — without singling anyone out.",
    look: "Approved design: golden retriever, coin in paw, bow tie. He is not an everyday companion.",
    quote: "The reward should feel earned, clear and shared.",
    portrait: "/companions/moneybags.jpg",
    accent: "gold",
    everyday: false,
    ways: [
      { title: "Above target — locked", body: "The weekly budget needs attention. Reset without blame. Keep the family goal visible." },
      { title: "On track — still locked", body: "Tracking toward the budget is not enough. Both the budget win and Family Points are required." },
      { title: "Budget win — unlock check", body: "Finishing within the target is one condition. Reach the Family Points goal too." },
      { title: "The ceremony", body: "Only then does Moneybags appear. No pay-to-win. No individual scoreboard." },
    ],
    owns: "The weekly reward ceremony, after both goals are complete.",
    not: "Everyday routines, planning, or nagging anyone about money.",
    limit: "Not financial advice. Early-stage unlock-only budgeting and rewards concept.",
  },
};

export const COMPANION_ORDER: CompanionId[] = ["stan", "nova", "pulse", "scout", "moneybags"];

export const KYREC_FAMILY_LINE =
  "Five family roles, connected carefully. People choose what to use. Companions stay in their lane. Families decide.";

export const CORE_LINE =
  "KYREC Core is the permission-led layer behind every companion. It checks source, freshness and purpose, then sends only the minimum a role needs. People decide.";

export type CoreMoment = {
  id: string;
  title: string;
  signal: string;
  companion: CompanionId;
  because: string;
  silent: string;
};

export const CORE_MOMENTS: CoreMoment[] = [
  {
    id: "hard-day",
    title: "Someone wants to talk about a hard day",
    signal: "Chosen check-in · wellbeing",
    companion: "nova",
    because: "Nova owns warmth. She listens to what a person chooses to share — no diagnosis, no score.",
    silent: "Stan does not take the feeling. Pulse does not turn it into a family plan.",
  },
  {
    id: "dinner",
    title: "Family dinner is at 18:30",
    signal: "Shared routine · family rhythm",
    companion: "pulse",
    because: "Pulse owns the group plan: who is involved, when it is, and a reminder if this household wants one.",
    silent: "Nova does not run the calendar. Moneybags does not appear for an ordinary meal.",
  },
  {
    id: "meal-handoff",
    title: "Nova offers dinner after sport and a long day",
    signal: "Core handoff · Pulse, Scout, and a marked long day",
    companion: "nova",
    because: "Pulse passes kids’ sport. Scout passes the pickup. Nova uses only that, plus a long day someone marked, to offer a public recipe. You choose 30 minutes to 2 hours, for 2 to 5 people.",
    silent: "Nova does not watch hours or the drive. She only sees what Core was allowed to pass.",
  },
  {
    id: "movie-gap",
    title: "A film fills the gap after dinner",
    signal: "Core handoff · Pulse holds the evening",
    companion: "pulse",
    because: "Sport, pickup, and dinner already use the afternoon. Pulse offers a public film that fits the time left, for 2 to 5 people. You choose it.",
    silent: "Nobody is watched to guess a favourite. The search is public. The plan only changes if you pick one.",
  },
  {
    id: "trip",
    title: "Kelly is 18 minutes from Home",
    signal: "Chosen location · journey",
    companion: "scout",
    because: "Scout owns the journey: route, supported delay, and what changed. Driver attention stays with Kelly.",
    silent: "Stan only steps in if a safety boundary needs explaining. Pulse does not navigate.",
  },
  {
    id: "safety",
    title: "Should sharing stay on for this trip?",
    signal: "Permission · decision support",
    companion: "stan",
    because: "Stan owns clarity and handover. He explains the choice and the limit. He does not decide.",
    silent: "Nova does not argue the risk. Scout does not override a parent’s permission.",
  },
  {
    id: "budget",
    title: "The weekly budget is still open",
    signal: "Family money map · unlock only",
    companion: "moneybags",
    because: "Moneybags stays locked until both the budget target and Family Points are complete. No nagging. No scoreboard.",
    silent: "Stan can name the limit. Pulse does not chase anyone about spending.",
  },
  {
    id: "emergency",
    title: "Someone might be in danger",
    signal: "Human handover · Australia 000",
    companion: "stan",
    because: "Stan names the limit immediately: KYREC is not an emergency service. In Australia, call 000.",
    silent: "No companion pretends to be police, medical help, or a monitor.",
  },
];

export const SCOUT_JOURNEY = [
  {
    id: "prepare",
    stage: "Before departure",
    title: "Prepare the itinerary",
    detail: "Sam · Perth CBD → Home · 8.4 km · 18 min · Mitchell Freeway. Phone stays down. This is a sample Wednesday.",
  },
  {
    id: "alert",
    stage: "When travel changes",
    title: "Read alerts early",
    detail: "Supported alert: slower traffic northbound on Mitchell Freeway. Official operators remain the authority. Scout explains — Sam decides.",
  },
  {
    id: "route",
    stage: "On the route",
    title: "Follow the route",
    detail: "Mounts Bay Road → Mitchell Freeway → Home, Mount Lawley. Upcoming stop: the usual exit. Driver attention stays with Sam.",
  },
  {
    id: "replan",
    stage: "When the route shifts",
    title: "Re-plan the journey",
    detail: "Optional comparison: Stirling Highway via Nedlands, a few minutes slower, quieter. Scout compares. Sam chooses.",
  },
];

export const BUDGET_EXTRAS = [
  { id: "takeaway", label: "Thursday takeaway", amount: 74 },
  { id: "sport", label: "Weekend sports extra", amount: 38 },
  { id: "fuel", label: "Extra fuel fill", amount: 62 },
];

export function moneybagsPhase(points: number, spent: number): MoneybagsPhase {
  const budgetWin = spent <= HOUSEHOLD.budgetTarget;
  const pointsWin = points >= HOUSEHOLD.pointsGoal;
  if (!budgetWin) return "above";
  if (!pointsWin) return "track";
  return "unlocked";
}

export function phaseCopy(phase: MoneybagsPhase) {
  if (phase === "above") {
    return {
      badge: "01  Above target — locked",
      body: "The weekly target needs attention. Moneybags stays locked. Reset without blame and keep the family goal visible.",
    };
  }
  if (phase === "track") {
    return {
      badge: "02  On track — still locked",
      body: "The family is tracking toward the budget target, but it must achieve both the budget win and the Family Points goal.",
    };
  }
  return {
    badge: "03  Ceremony unlocked",
    body: "Both weekly goals are complete. Moneybags is in — a shared celebration, not a scoreboard.",
  };
}
