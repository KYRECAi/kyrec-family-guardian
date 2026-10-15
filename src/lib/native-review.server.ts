import { coreRequest } from "./core-client.server.ts";
import {
  consentInput,
  consentReceipt,
  consentStatus,
  feedbackInput,
  feedbackReceipt,
  householdInput,
  resultsResponse,
} from "./native-review-contract.ts";

// Actor is supplied only by the authenticated server function, never its data.
export async function nativeReviewRequest(
  userId: string,
  action: "status" | "results" | "consent" | "feedback",
  input: unknown,
  transport: typeof fetch = fetch,
) {
  try {
    if (!userId || userId.length > 200) throw new Error("Missing session");
    const data =
      action === "consent"
        ? consentInput.parse(input)
        : action === "feedback"
          ? feedbackInput.parse(input)
          : householdInput.parse(input);
    const { household, ...body } = data;
    const path = `/v1/guardian/households/${household}/native/${action === "status" ? "consent" : action}`;
    const method = action === "consent" ? "PUT" : action === "feedback" ? "POST" : "GET";
    const raw = await coreRequest(
      userId,
      path,
      method,
      method === "GET" ? undefined : body,
      undefined,
      transport,
    );
    if (action === "status") return consentStatus.parse(raw);
    if (action === "results") {
      const parsed = resultsResponse.parse(raw);
      if (parsed.results.some((item) => Date.parse(item.valid_until) <= Date.now()))
        throw new Error("Expired result");
      return parsed;
    }
    if (action === "consent") {
      const parsed = consentReceipt.parse(raw);
      const sent = consentInput.parse(input);
      if (parsed.purpose !== sent.purpose || parsed.granted !== sent.granted)
        throw new Error("Mismatched choice");
      return parsed;
    }
    const parsed = feedbackReceipt.parse(raw);
    if (parsed.feedback_id !== feedbackInput.parse(input).feedback_id)
      throw new Error("Mismatched receipt");
    return parsed;
  } catch {
    // Includes Core denial, timeout and malformed responses; never forward
    // server exceptions, audit material, response bodies or service secrets.
    throw new Error(
      "Personal review is unavailable. Your change was not confirmed. Refresh and try again.",
    );
  }
}
