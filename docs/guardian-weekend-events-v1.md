# Guardian weekend public-event contract v1

Status: built and tested locally with real public source data. No live Guardian
or AWS deployment; no real family accounts, private records or bookings used.

## Product behavior

Show public weekend listings across Perth, without a suburb/distance cutoff or
budget cap by default. Parents choose whether to travel and which event suits
them. Free-only is explicit, not a default. Source ticket prices are not silently
called the whole-family cost. Missing prices remain unknown. Ongoing date-range
listings are labelled for weekend-session confirmation. Age suitability and
organiser details need parent review; these are public options, not personalised
or clinically/safety certified recommendations.

The first live source batch is Visit Perth's bounded directory page, not full
coverage of all 253 candidate websites or every Perth suburb. No venue is ruled
out because a family lives elsewhere in Perth. Additional source adapters remain
separate work.

## Core route

GET `/v1/guardian/events/weekend?start=2026-11-21&free_only=false`.

Authenticate the registered calling service before storage access; require
product/source family_guardian and outing domain. Reject unrecognised or duplicate
query keys. Start must be a Saturday, within the supported recent/upcoming
window. Weekend means Saturday 00:00 through Monday 00:00 Australia/Perth.

The read is deliberately public-only: it accepts no workspace, actor, household,
private preferences, budget or child data and queries only system-research.
Only explicitly enabled publisher policies are eligible; development demo
research and catalogue candidate metadata are excluded. Recheck source policy,
validated research lane/basis, source host and aware checked-at time. Latest
cancellation wins; conflicting equal-time updates are withheld. Observations
older than 36 hours, future checks, invalid/naive event times and finished events
are not presented as current weekend options. Include ongoing listings only when
their declared range overlaps the weekend; do not infer daily opening sessions.

Return `contract: guardian-weekend-events-v1`, weekend bounds, timezone,
free_only, status, source_checked_at, events (at most 40), has_more and
`automatic_actions:false`. Event fields are stable public reference, name,
source URL, time range, venue/locality, checked time, bounded safe price fields,
price_status/note, `suitability:parent_check_required`, booking_performed:false.
No raw page, signal ledger, service key or family record is returned.

Status available has events. No_matches means fresh source records exist but
none pass the requested window/price filter. Unavailable means no eligible fresh
source evidence; it is never a claim that Perth has no events. Free-only requires
source min/max ticket prices both zero in AUD. It is not a guarantee that travel,
food, booking fees or every attendee category cost nothing.

## Guardian server and UI

Guardian's server-only transport uses the existing Core service configuration and
fixed guardian route prefix, rejects redirects and validates the strict contract,
query echo, freshness and free-price consistency. No family actor is invented for
this public read; empty actor header is not authority for any private route.
Browser input contains only Saturday start and explicit free-only choice. The
server boundary enforces same-site requests and no-store. Missing config, Core
denial, timeout or malformed data is an honest unavailable state, with no fake
attraction fallback substituted for the dated feed.

Public `/weekend` renders this one non-private view without creating an account
or mounting household/private stores. The exact public path allowlist preserves
all family/account gates; `/weekend/private` is not public. Signed-in Scout also
renders the component. Existing static attraction ideas are labelled separately
from dated source events. Read-only refresh occurs on date/filter change, focus
and once a minute; an error clears old results. Nothing is booked, messaged or
added to a family planner automatically.

## Verified one-weekend test

For 21–22 November 2026, an isolated Core development instance used the existing
registered development research and Guardian service identities, with random
synthetic keys held in process memory. The actual HTTP worker fetched Visit
Perth and received 20 confirmed intake receipts. The actual Guardian route
returned 19 overlapping listings: eight source-listed free and eleven unknown
price totals. No family ages, income, location history or private conversations
were provided or inferred.

The development Guardian UI showed 19/all and 8/free. Its production build was
also tested against an isolated HTTPS Core using a local test CA, preserving
certificate verification and HTTPS production requirements. Functional browser
checks and desktop/mobile screenshots confirm real Core responses, source links,
filtering and no horizontal overflow. This is a local build/transport test, not a
production or authenticated real-family account rollout. Evidence JSON is under
`docs/evidence/guardian-weekend-test-2026-11-21.json`.

## Activation and recovery

No scheduler was installed and no live service key was provisioned. The worker
was run once locally; source data and a snapshot are not a continuously running
production weekend service. A cloud session can stop, and freshness checks then
make the app unavailable rather than reuse stale source data.

Production needs reviewed Core and Guardian releases, an approved read-only
public events service binding, research-worker registration, source operational
checks, persistent daily ledger/monitoring, and explicit deployment approval.
Public traffic shares the current service rate limit, so broader public rollout
also needs capacity/rate review. No paid-service commitment or AWS write occurred.
Keep existing service secrets server-side; never put them in browser variables
or paste them into chat.

Rollback the feature commits or remove only the new public route/component;
preserve public observation/audit history. Existing family/account gates and
private data stores are not migrations or rollback targets for this feature.
