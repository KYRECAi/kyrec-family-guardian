# KYREC Core handover — Shared Shop

Implementation update, 7 October 2026: see
`docs/guardian-beta-integration-2026-10-07.md` and the paired Core/Guardian PRs.
The original screen rules below are preserved as the supplied handover. The
implementation uses confirmed account IDs and recipient-bound invitations,
not hard-coded family identities. Shopping point entries retain opaque IDs
and deltas rather than deleted item names. Code is prepared; live-family
deployment is still HOLD pending the documented gates.

For the Core designer. Guardian screen is the source of truth. Core does not exist for this feature yet. The phone copy in `kyrec-family-guardian` (`src/lib/store.ts`, `src/components/grocery-list.tsx`) saves on one device only. That is the bug this handover replaces.

Repo with the screen: `KYRECAi/kyrec-family-guardian`.
Core repo this lands in: `KYRECAi/kyrec-core`.

Do not put Shared Shop inside Scout’s events pack. Events stay where they are. Shop is its own household record.

## What the family must be able to do

Five people. One house. One notepad.

Members on the Willard house, for the beta only: `michael`, `kelly`, `paige`, `chelsea`, `madison`. Guests can be added later. Do not hard-code those five as the only members a household can have. They are the first household.

Michael adds Fish. Kelly, on her phone, at the shops, sees Fish on the same notepad without refreshing the app by hand. Paige taps Snatch on Fish. The button locks. The household points go up by 30. Michael does not get a second notepad.

If the list only lives on the phone, the feature has failed.

## Screen, top to bottom

The block is titled **SHARED SHOP**. Line under it: “One list. The whole house.”

Above the notepad, a row of saved items. Starter four, in this order: **Milk, Bread, Eggs, Coffee**. Tap one and that name is added to the notepad once. If it is already on the notepad, the tap does nothing. The family can save more names into that row. Those are presets, not lines.

The notepad starts **empty**. Blank ruled lines. No fruit, no sugar, no starter lines written in. Presets are not lines until someone taps them.

A typed add sits under the presets. “Add” puts that text on the notepad. Same de-dupe: `fish` and `Fish` are one line.

Each line:

- A circle. Tap the circle or the name. It ticks. Tick again and it unticks.
- Under the name, the words **15 family points**. That is a label. Ticking does not pay 15.
- A round button, **2× Snatch**. One tap. It locks and reads **Snatched**. It does not tick the circle. It does not mean the person has the item in their hand.

At the bottom of the notepad, only after at least one tick: **Delete ticked**. One tap removes every ticked line. There is no Delete on the line itself.

A household switch, **Snatch on / Snatch off**, hides the Snatch buttons. It does not delete snatches already made.

## Points

One household total, not five wallets.

| Action | Points | Notes |
|---|---|---|
| Tick a line | 0 | Tick is only “I want this deleted”. It is not “I got it”. |
| Snatch | +30 | Double the 15 on the label. Once per line. |
| Delete a line that was snatched | −30 | Stops add → snatch → delete → snatch. |
| Delete a line that was not snatched | 0 | |

Record who snatched (`member_id`) on the line and on the points entry, so a later screen can say “Paige”. v1 still adds the 30 to the **household** total.

Do not pay 15 for ticking. The old phone function `markGrocery` did that. The screen no longer calls it. Leave it dead.

## Snatch rule

- Any member of the household may snatch a line that has not been snatched.
- Snatching does not set “got it”. There is no got-it field on the screen.
- Second snatch on the same line is rejected. First write wins. The loser sees **Snatched**, not an error page.
- Two phones tapping at once: one row update, conditional on `snatched_by is null`. The other request returns the row as it now is.
- Snatch off does not undo a snatch. It only hides the button.

## Delete rule

Ticks are **not** stored on Core. They live on the phone that tapped them. Delete sends the line ids that phone has ticked. Core deletes those ids if they belong to this household.

If a line was snatched, subtract 30 inside the same transaction as the delete. If two of five ticked lines were snatched, subtract 60.

## Presets

Household-scoped list of names.

- Seed, once, when the household shop is created: Milk, Bread, Eggs, Coffee. Notepad still empty.
- Add preset: trim, ignore empty, ignore case-duplicates, keep the first spelling.
- Remove preset: allowed. Does not remove a notepad line that was already added from it.
- A preset is not a buy and not a pattern event.

## What Core should store

```text
household_shop
  household_id
  snatch_on          bool          default true
  points             int           default 0     -- household total; shop is not the only future source

shop_preset
  household_id
  name               text
  position           int
  unique (household_id, lower(name))

shop_line
  id
  household_id
  name               text
  snatched_by        member_id null
  snatched_at        timestamptz null
  created_by         member_id
  created_at
  unique open line per household on lower(name) while the line exists

shop_point_entry
  id
  household_id
  member_id          -- who caused it
  line_id            null once the line is gone
  name               text          -- keep the word after delete
  delta              int           -- +30 or -30
  reason             text          -- snatch | snatch_reversed
  at
```

Do not store `by` or `from`. Those were an older “someone is getting it / snatched off them” model. The screen does not use them.

## Calls the Guardian will make

All of these are household-scoped. The signed-in member must belong to that household. No query without that check.

```text
GET    /households/{id}/shop
       -> { snatch_on, points, presets: string[], lines: ShopLine[] }

POST   /households/{id}/shop/lines
       { name }
       201 the line, or 200 the existing line if the name is already there

POST   /households/{id}/shop/lines/{line_id}/snatch
       member taken from the session, not from the body
       200 line with snatched_by set, points +30
       409 if already snatched, body is the current line, points unchanged

POST   /households/{id}/shop/lines/delete
       { ids: string[] }
       deletes only ids in this household
       points -= 30 per deleted line that had snatched_by

PUT    /households/{id}/shop/snatch
       { on: bool }

POST   /households/{id}/shop/presets
       { name }

DELETE /households/{id}/shop/presets/{name}
```

`ShopLine`: `id`, `name`, `snatched_by`, `snatched_at`. Nothing else the screen needs.

Push the new shop document to the other open phones. Polling every few seconds is acceptable for the beta if push is not ready. A manual reload is not acceptable. Kelly at the shops has to see Michael’s fish.

## Pattern, phase 2, design the tables so this fits

Not required for the first shared notepad. Do not block the beta on it. Do not paint “you need rice” with no buys behind it.

When a line is **added** to the notepad, that is a use. Keep the last 12 timestamps per preset name, per household.

```text
shop_buy
  household_id
  name_key           lower(trim(name))
  at                 timestamptz
```

Optional cadence, set by a person, not guessed on the first buy: 3, 7, 14, or 30 days.

Due rule, already in the Guardian:

- Need at least 3 timestamps before a gap is trusted.
- Gap is the median of the gaps between those stamps.
- Ignore a median under 1 day.
- If the person set a cadence, use that instead of the median.
- Ask only when `now - last >= 0.85 * cadence_days`.
- Ask at most 2 names.
- Copy is “Need it this shop?” Not a bag size. Not “you are out”.
- Snooze hides that name until a time. “Not this time” snoozes for half the cadence, at least 2 days.

A yes on that ask adds the name to the notepad if it is not there. It does not snatch and it does not pay points.

Coles and Woolworths orders are out of this handover. No scheduled cart.

## Out of scope

- Movie night, “tonight’s gap”, or any film list. Removed. No evidence the house is watching one.
- Scout’s live events. Already on Core. Different pack. Do not join them into `shop_line`.
- Per-person wallets, shop spend, or receipts.
- Paying 15 for a tick.
- Ticking the circle when someone snatches.
- Writing Milk, Bread, Eggs, and Coffee onto the notepad at setup.

## Done when

1. Michael’s phone adds Fish. Kelly’s phone shows Fish without a private list of its own.
2. Paige snatches Fish. The circle on Fish is not ticked by that action. The button reads Snatched on every phone. Household points are +30. A second snatch does not pay again.
3. Michael ticks Fish and Eggs and taps Delete ticked. Both lines are gone on Kelly’s phone. If Fish had been snatched, points drop by 30 and Eggs drop by 0.
4. Snatch off hides the button on every phone.
5. A new household gets the four presets and an empty notepad.
6. A member of another household cannot read or snatch this list.

Guardian work after that, not part of this handover: stop saving the shop in the phone store and call the routes above. Until those routes exist, the family beta is five separate notepads.
