export type MemberId = string;
export type Accent = "blue" | "violet" | "magenta" | "green" | "gold" | "pink" | "orange";

export type Member = {
  id: MemberId;
  name: string;
  short: string;
  role: string;
  you?: boolean;
  age?: number;
  accent: Accent;
  avatar: string;
  initial?: string;
  lat: number;
  lng: number;
  place: string;
  placeDetail: string;
  status: "still" | "moving";
  movingLabel?: string;
  lastUpdated: string;
  battery: number;
  speedKmh?: number;
  heading?: string;
};

export type SafeZone = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
  accent: Accent;
};

export type FamilyAlert = {
  id: string;
  kind: "arrival" | "departure" | "driving";
  memberId: MemberId;
  title: string;
  detail: string;
  time: string;
};

export type Routine = {
  id: string;
  title: string;
  when: string;
  who: string;
  companion: "pulse" | "nova" | "stan";
};

export type Trip = {
  id: string;
  who: MemberId;
  from: string;
  to: string;
  km: number;
  minutes: number;
  topSpeed: number;
  phoneTouches: number;
  score: number;
  when: string;
};

export type Habit = {
  id: string;
  title: string;
  points: number;
  done: boolean;
  who: string;
};

export const HOUSEHOLD = {
  name: "Your family",
  city: "Perth",
  snapshot: "Family Guardian · Free",
  greeting: "Good evening, Michael",
  youName: "Michael",
  points: 1240,
  pointsGoal: 1500,
  budgetSpent: 318,
  budgetTarget: 450,
  driveScore: 92,
  driveLabel: "Excellent",
  drivePeriod: "this week",
  trips: 12,
  distanceKm: 346,
  topSpeed: 78,
  phoneTouches: 2,
};

export const MEMBERS: Member[] = [
  {
    id: "michael",
    name: "Michael",
    short: "Michael",
    role: "Dad",
    you: true,
    accent: "violet",
    avatar: "/avatars/michael.jpg",
    lat: -31.9344,
    lng: 115.8716,
    place: "Home",
    placeDetail: "Perth",
    status: "still",
    lastUpdated: "now",
    battery: 81,
  },
  {
    id: "kelly",
    name: "Kelly",
    short: "Kelly",
    role: "Mum",
    accent: "orange",
    avatar: "",
    initial: "K",
    lat: -31.9351,
    lng: 115.8704,
    place: "Home",
    placeDetail: "Perth",
    status: "still",
    lastUpdated: "2 min ago",
    battery: 72,
  },
  {
    id: "paige",
    name: "Paige",
    short: "Paige",
    role: "Daughter",
    accent: "pink",
    avatar: "",
    initial: "P",
    lat: -31.9348,
    lng: 115.872,
    place: "Home",
    placeDetail: "Perth",
    status: "still",
    lastUpdated: "6 min ago",
    battery: 64,
  },
  {
    id: "chelsea",
    name: "Chelsea",
    short: "Chelsea",
    role: "Daughter",
    accent: "blue",
    avatar: "",
    initial: "C",
    lat: -31.9339,
    lng: 115.8711,
    place: "Home",
    placeDetail: "Perth",
    status: "still",
    lastUpdated: "11 min ago",
    battery: 58,
  },
  {
    id: "madison",
    name: "Madison",
    short: "Madison",
    role: "Daughter",
    accent: "green",
    avatar: "",
    initial: "M",
    lat: -31.9342,
    lng: 115.8724,
    place: "Home",
    placeDetail: "Perth",
    status: "still",
    lastUpdated: "18 min ago",
    battery: 41,
  },
];

export const ZONES: SafeZone[] = [
  { id: "home", name: "Home", lat: -31.9344, lng: 115.8716, radiusM: 160, accent: "violet" },
  { id: "school", name: "School", lat: -31.9482, lng: 115.8648, radiusM: 140, accent: "blue" },
];

/** Mitchell Freeway → Home, ping-ponged as Kelly's live trip. */
export const SAM_ROUTE: [number, number][] = [
  [-31.9394, 115.8368],
  [-31.9378, 115.8412],
  [-31.9364, 115.8466],
  [-31.9352, 115.8524],
  [-31.9346, 115.8588],
  [-31.9343, 115.8652],
  [-31.9344, 115.8716],
];

export const ALERTS: FamilyAlert[] = [
  {
    id: "a1",
    kind: "driving",
    memberId: "kelly",
    title: "Kelly started a trip",
    detail: "Mitchell Freeway, heading toward Home. Chosen driving alerts only.",
    time: "15:28",
  },
  {
    id: "a2",
    kind: "arrival",
    memberId: "paige",
    title: "Paige arrived home",
    detail: "Home · sharing is on for arrivals.",
    time: "14:02",
  },
  {
    id: "a3",
    kind: "departure",
    memberId: "chelsea",
    title: "Chelsea left school",
    detail: "Check-in still waiting.",
    time: "13:40",
  },
];

export const ROUTINES: Routine[] = [
  {
    id: "r1",
    title: "Family dinner",
    when: "18:30",
    who: "Everyone at Home",
    companion: "pulse",
  },
  {
    id: "r4",
    title: "Kids' sport",
    when: "16:00",
    who: "Kids · Pulse and Scout",
    companion: "pulse",
  },
  {
    id: "r2",
    title: "Optional check-in",
    when: "After dinner",
    who: "Whoever wants to",
    companion: "nova",
  },
  {
    id: "r3",
    title: "Weekly points review",
    when: "Sunday 16:00",
    who: "Your family",
    companion: "stan",
  },
];

export const TRIPS: Trip[] = [
  {
    id: "t1",
    who: "kelly",
    from: "Perth CBD",
    to: "Home",
    km: 8.4,
    minutes: 18,
    topSpeed: 72,
    phoneTouches: 0,
    score: 96,
    when: "In progress",
  },
  {
    id: "t2",
    who: "michael",
    from: "Home",
    to: "CBD",
    km: 8.6,
    minutes: 22,
    topSpeed: 78,
    phoneTouches: 1,
    score: 84,
    when: "Tue 07:48",
  },
  {
    id: "t3",
    who: "kelly",
    from: "School",
    to: "Home",
    km: 4.2,
    minutes: 12,
    topSpeed: 58,
    phoneTouches: 0,
    score: 99,
    when: "Mon 15:10",
  },
];

export const FAMILY_STATS = {
  score: 2450,
  today: 120,
  tiles: [
    { id: "drives", label: "Safe Drives", points: 12 },
    { id: "phone", label: "Phone Touches", points: 8 },
    { id: "brake", label: "Sudden Braking", points: 3 },
    { id: "checkin", label: "Check-ins", points: 15 },
    { id: "zones", label: "Safe Zone Arrivals", points: 20 },
    { id: "challenges", label: "Family Challenges", points: 5 },
  ],
  week: [420, 380, 520, 610, 390, 130, 0],
  weekDays: ["M", "T", "W", "T", "F", "S", "S"],
  comparison: [
    { id: "michael" as const, note: "Dad", points: 580 },
    { id: "kelly" as const, note: "Mum", points: 600 },
    { id: "paige" as const, note: "Daughter", points: 420 },
    { id: "chelsea" as const, note: "Daughter", points: 390 },
    { id: "madison" as const, note: "Daughter", points: 360 },
  ],
};

export const WEEKLY_SCORES = [
  { week: "11 Aug", score: 84 },
  { week: "18 Aug", score: 88 },
  { week: "25 Aug", score: 90 },
  { week: "1 Sep", score: 91 },
  { week: "8 Sep", score: 92 },
];

export const HABITS: Habit[] = [
  { id: "h1", title: "Arrival check-in", points: 20, done: true, who: "Paige" },
  { id: "h2", title: "Phone down while driving", points: 40, done: true, who: "Kelly" },
  { id: "h3", title: "Family dinner together", points: 30, done: false, who: "Everyone" },
  { id: "h4", title: "Chosen mood check-in", points: 15, done: false, who: "Optional" },
];

export const CONVERSATIONS = [
  {
    id: "c1",
    title: "Phone touches: 2 this week",
    body: "That’s a conversation about focus, not a scoreboard.",
  },
  {
    id: "c2",
    title: "Kelly is 18 minutes from Home",
    body: "Live on the map because this household chose to share it.",
  },
];

export const GAMES = [
  {
    id: "christmas",
    season: "Christmas",
    title: "Christmas Train",
    blurb: "Catch candy canes, gifts, stars and snowflakes together. One shared seasonal score.",
    accent: "gold" as Accent,
  },
  {
    id: "valentine",
    season: "Valentine's Day",
    title: "Valentine Crush",
    blurb: "Match hearts in a short family round. One household score.",
    accent: "pink" as Accent,
  },
  {
    id: "easter",
    season: "Easter",
    title: "Easter Hunt",
    blurb:
      "Find colourful eggs inside a chosen safe-zone experience. Bonus points for the household.",
    accent: "green" as Accent,
  },
  {
    id: "moneybags",
    season: "Weekly bonus",
    title: "Moneybags Bonus",
    blurb: "Catch the coins together. One household bonus. Nobody is singled out.",
    accent: "gold" as Accent,
  },
];

export const COMPANIONS = [
  {
    id: "stan" as const,
    name: "Stan",
    role: "AI & safety guardian",
    blurb: "Guides, listens, protects — evidence before emotion.",
    portrait: "/companions/stan.jpg",
    icon: "/companions/icons/stan.png",
    accessFree: 30,
    state: "open" as const,
  },
  {
    id: "nova" as const,
    name: "Nova",
    role: "Emotional support",
    blurb: "Warmth and gentle support — only when someone chooses it.",
    portrait: "/companions/nova.jpg",
    icon: "/companions/icons/nova.png",
    accessFree: 0,
    state: "locked" as const,
  },
  {
    id: "pulse" as const,
    name: "Pulse",
    role: "Family connection",
    blurb: "The family rhythm. Plans, reminders, time together.",
    portrait: "/companions/pulse.jpg",
    icon: "/companions/icons/pulse.png",
    accessFree: 0,
    state: "locked" as const,
  },
  {
    id: "moneybags" as const,
    name: "Moneybags",
    role: "Earned budget bonus",
    blurb: "Your budget buddy. Earned rewards, never pay-to-win.",
    portrait: "/companions/moneybags.jpg",
    icon: "/companions/icons/moneybags.png",
    accessFree: 0,
    state: "locked" as const,
  },
  {
    id: "scout" as const,
    name: "Scout",
    role: "Travel intelligence",
    blurb: "Plan the journey. Read the changes. Follow the route.",
    portrait: "/companions/scout.jpg",
    icon: "/companions/icons/scout.png",
    accessFree: 0,
    state: "addon" as const,
    price: "A$7.00 / month",
  },
];

export function memberById(id: MemberId) {
  return MEMBERS.find((m) => m.id === id)!;
}

export function interpolateRoute(route: [number, number][], t: number): [number, number] {
  const n = route.length - 1;
  const x = ((t % 2) + 2) % 2;
  const ping = x < 1 ? x : 2 - x;
  const f = ping * n;
  const i = Math.min(n - 1, Math.floor(f));
  const u = f - i;
  const a = route[i]!;
  const b = route[i + 1]!;
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
}
