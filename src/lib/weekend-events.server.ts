import { coreRequest } from "./core-client.server.ts";
import { weekendInput, weekendResponse } from "./weekend-events-contract.ts";

// This is a public catalogue read: no actor, household or private family row.
// Only Core service credentials cross the server boundary; none reach the browser.
export async function weekendEventsRequest(input: unknown, transport: typeof fetch = fetch) {
  try {
    const request = weekendInput.parse(input);
    const query = new URLSearchParams({start:request.start, free_only:String(request.free_only)});
    const result = weekendResponse.parse(await coreRequest("", `/v1/guardian/events/weekend?${query}`, "GET", undefined, undefined, transport));
    const expectedEnd = new Date(`${request.start}T12:00:00Z`);
    expectedEnd.setUTCDate(expectedEnd.getUTCDate() + 1);
    if (result.weekend_start !== request.start || result.weekend_end !== expectedEnd.toISOString().slice(0,10) || result.free_only !== request.free_only)
      throw new Error("Mismatched event query");
    const now = Date.now();
    for (const event of result.events) {
      const checked = Date.parse(event.checked_at);
      if (checked > now + 60000 || now - checked > 36 * 3600000) throw new Error("Stale events");
      if (request.free_only && (event.price_status !== "listed_free" || event.price_min !== 0 || event.price_max !== 0 || event.currency !== "AUD")) throw new Error("Price mismatch");
    }
    if (result.status !== "available" && result.events.length) throw new Error("Inconsistent availability");
    return result;
  } catch {
    throw new Error("Weekend events are unavailable. Refresh to check Core again.");
  }
}
