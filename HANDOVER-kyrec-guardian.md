# KYREC Family Guardian — handover for design and AWS

Paste this whole note into GPT with the designer. It is the product as built in the prototype, plus what must move into the live AWS app and KYREC Core.

This prototype is a phone-first web app (React, TanStack Start, Zustand). Household data in the prototype lives on the device only (`localStorage`). It is not the live AWS backend. Do not ship the browser store as production. Core is the source of truth once a family has more than one phone.

Domain intent: kyrec.au. City: Perth. Currency: AUD. Timezone: Australia/Perth.

## Locked product rules

- Companions are Stan, Nova, Pulse, Scout, Moneybags. Do not change their portraits, colours, or proportions. Icons are companion marks, not profile photos.
- Household is five people: Michael (dad, you), Kelly (mum), Paige, Chelsea, Madison (daughters). Grandma and Annie are gone.
- Family name is editable. Each person can have a nickname. Guests can be added and removed. Guests do not get a live map pin.
- Copy is plain wins. No percentages, no “most popular”, no “locked”, no fake scores, no sample bank balances, no invented kilo counts.
- Privacy is a choice. Location, trips, and check-ins are off until someone turns them on. KYREC is not an emergency service.
- Core only sees signals the household chose to pass (long day, sport time, pickup). It does not watch hours or the drive.
- Do not copy Buddy, Unorderly, Readdle, or any other app’s layout, logos, reviews, or numbers. Those shots were colour and structure only: blush ground, white cards, one coloured icon per job, a day as coloured blocks.

## Visual system

- Ground is warm blush, cards are white, type is dark.
- Accents: violet, mint, pink, orange, gold, blue. One colour per job, not one violet wash.
- Home is a full-bleed house photo with glass cards on top. No black or navy hero box.
- Each main page leads with icon rows: coloured icon, short title, one line.
- Pulse’s day is a vertical timeline. Dinner is pink, sport is mint, pickup or school is blue, a movie is gold. Under it is a to-do with ticks.
- Splash is two coins only, bouncing off the walls and each other. Not a field of coins.

## Plans (customer-facing)

| Plan | Price | What they get |
|---|---|---|
| Family Guardian | Free | Who’s home on one map. Home and school. Ask Stan before you decide. |
| Guardian Plus | $9.99 | Shared shop list with snatch. Nova’s meals on a long day. 3 days of trips they chose to share. Family points. |
| Guardian Pro | $19.99 | A week of chosen trips. Nova in full. Moneybags on the household budget. |
| Guardian Complete | $29.99 | Pulse holds the day and the goals. 30 days of chosen trips. Everyone except Scout. |
| Scout travel | $7 add-on | A destination in Google or Apple Maps. Scout logs it and hands it to Pulse. |

No checkout is wired. `subscribe` in the prototype only flips a local plan flag.

## What each companion holds

- **Stan** — a decision. Map, zones, who is sharing, a drive summary if they ask. He lays it out. They choose.
- **Nova** — shop list, meals, the movie gap after sport. Chat sits with her, not three taps away.
- **Pulse** — the day, the to-do, goals. Sport, pickup, dinner. Standing today: kids’ sport 16:00, family dinner 18:30.
- **Scout** — a destination. Opens Google Maps or Apple Maps, logs the place, passes it to Pulse. Not in the base plans.
- **Moneybags** — the week in AUD, private. Budget categories as coloured rows. Game link stays on his page. No fake savings.

Companion page order: chat near the portrait, jobs as icon rows under that, then “how are you” (Bright, Steady, Light, Low). Full-screen chat has a clear exit. Feelings stay on the device. They are not a score.

Home rows: Who’s home, The day, A decision, The shop list, A destination.

Family page is check-in, sharing, and this week. Check-ins and weekly numbers live together. People can be Waiting or Hidden.

Settings already has: your name, username, family name, nicknames, guests, profile photo or avatar, map key, terms, privacy.

Map pins should glow. Google Maps JS uses a key the user pastes in settings. Do not hard-code a key into the repo.

## Shared shop list — behaviour to port into Core

This is the piece that must become part of KYREC Core on AWS, shared by the household, not stored per phone.

### Starter list

A new family starts with: Fruit, Bread, Milk, Sugar, Eggs, Pancakes, Cakes, Ham, Bacon, Tomatoes, Cucumber.

That list is only so the page is not blank. It is not the family’s real diet. They can stop keeping any of it.

### On the shop floor

- Tap an item once: you are getting it. +15 family points.
- Tap your own item again: put it back. Points come off.
- Tap an item someone else already has: ask “Snatch just this one?” Yes moves only that item and is +30. It must not take the rest of their items. One confirm, one id.
- Add anything that is not on the list.
- Every grocery id is unique (`crypto.randomUUID`). Never use `Date.now()` in a loop.

### Remembering

When they add something that is not a regular, ask: “Save this for next time?”

- Save: it becomes a household regular and returns next shop even if cleared.
- Just this shop: it does not return.
- If the same unsaved item shows up again: “You keep getting this. Save it?”
- Stop keeping removes it from regulars. It does not come back.

After save, ask how often this house gets it:

- Every few days = 3
- Weekly = 7
- Fortnight = 14
- Monthly = 30
- We’ll see = no number yet. Learn it from real shops.

Clock starts when they set the gap, or from the last time someone grabbed it.

### Pattern (Core’s job)

Keep, per household and per item name (case-insensitive):

- `regulars: string[]`
- `buys: ISO timestamps[]` (last 12 grabs)
- `everyDays: number | null`
- `snoozeUntil: ISO | null`
- `byMemberId` and `fromMemberId` on the current shop line (snatch)

When `now - lastBuy >= everyDays * 0.85`, Core asks: “{Item} is usually every {n} days. It’s been {since}. Need it this shop?”

- Yes: put it on this shop for the person who said yes.
- Not this time: snooze for half the gap, at least 2 days.

After 3 real gaps, take the median gap in days. If that is more than 30% off the number they chose, ask once: “This looks closer to every {seen} days. Use that?” Do not change it silently.

Do not invent bag weights, kilos, or “you use 10kg a week”. If they buy a 10kg bag they type that as the item, or a later quantity field. The pattern is the gap between shops, not a nutrition model.

A Coles or Woolworths order is not built. Do not show a fake checkout. The line in the product is: this only asks the house. A scheduled order is a later step, after the family trusts the reminder.

### Why this is Core, not the phone

One list, one pattern, every phone. If Paige snatches the fish, Michael’s phone must drop that one line and keep his bread and milk. If the house gets rice every fortnight, every phone asks on the same day. The prototype cannot do that. It only remembers the browser it was opened in.

Suggested Core records (names can match the AWS style you already use):

- `Household` — id, familyName, plan, scoutOn
- `Member` — id, role, nickname, guest flag, sharing on/off
- `ShopItem` — id, householdId, name, byMemberId, fromMemberId, regular
- `ShopPattern` — householdId, itemKey, everyDays, buyTimestamps, snoozeUntil

Nova reads Core. She does not scrape location. Pulse can pass “sport at 4” and Scout can pass “pickup on the way” only when those were chosen.

## Day, meals, movies

- Planner is the day timeline plus a household to-do. Events have title, date (`YYYY-MM-DD` in Perth), start time, who.
- Nova meals: public search (TheMealDB in the prototype), 30 minutes to 2 hours, feeding 2–5. Ingredients can drop onto the shop list. Long day is a chosen flag, not a tracked clock.
- Movie gap is a short catalogue with public links for the hole after sport and dinner. It is an ad for the gap, not a streaming service.

## What is honest and unfinished

- No real payments, no App Store, no push notifications.
- No live family locations. Map positions in the prototype are Perth stand-ins.
- No Coles, Woolworths, or scheduled grocery order.
- Chat replies are local, not a model on AWS.
- Drive summaries and check-ins are not a feed and are not scored against a child.
- Pattern quality needs two or three real shops. Until then it only knows the gap they picked.

## Build order for the live AWS app

1. Household, five members, nicknames, family name, guests. One account, many phones.
2. Shared shop list with unique ids, tap to grab, per-item snatch, starter list, save-for-next-time.
3. Shop pattern in Core: everyDays, buy timestamps, due question, snooze, median correction. No kilo guesses. No retailer order.
4. Nova meals and the long-day flag as chosen Core signals.
5. Pulse day and to-do, shared.
6. Scout destination URL (Google and Apple) logged into Core and shown on Pulse.
7. Plans and copy as in the table above. Payments last.
8. Visual pass: blush, white cards, coloured icon rows, day as coloured blocks. Keep the locked companion art.

## Prototype file map (for the coder, not the customer)

- Shop list and pattern UI: `src/components/grocery-list.tsx`
- Shop state: `src/lib/store.ts` (`groceries`, `regulars`, `itemBuys`, `itemEvery`, `itemSnooze`, snatch, staples)
- Day timeline: `src/components/day-board.tsx`, `src/components/pulse-day.tsx`, `src/routes/planner.tsx`
- Companions: `src/routes/companions.index.tsx`, `src/routes/companions.$id.tsx`
- Family and people: `src/lib/family.ts`, `src/lib/people.ts`, `src/routes/family.tsx`, `src/routes/settings.tsx`
- Plans: `src/lib/plans.ts`, `src/routes/plan.tsx`
- Home: `src/routes/index.tsx`
- Scout handoff: `src/components/scout-destination.tsx`
- Meals and movie: `src/components/grocery-list.tsx`, `src/components/movie-gap.tsx`
