import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { weekendInput, weekendResponse } from "./weekend-events-contract";

// No account is invented for browsing public listings. Family data is not read.
const publicEventsBoundary = createMiddleware({type:"function"}).server(async ({next}) => {
  const {setResponseHeader} = await import("@tanstack/react-start/server");
  const {assertSameSiteRequest} = await import("./auth/isolation.server");
  assertSameSiteRequest();
  setResponseHeader("Cache-Control", "no-store");
  return next();
});
export const readWeekendEvents = createServerFn({method:"GET"})
  .middleware([publicEventsBoundary])
  .validator((value:unknown) => weekendInput.parse(value))
  .handler(async ({data}) => {
    const {weekendEventsRequest} = await import("./weekend-events.server");
    return weekendResponse.parse(await weekendEventsRequest(data));
  });
