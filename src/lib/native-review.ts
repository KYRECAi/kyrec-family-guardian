import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { familyAuthMiddleware } from "./auth/middleware";
import {
  consentInput,
  consentReceipt,
  consentStatus,
  feedbackInput,
  feedbackReceipt,
  householdInput,
  resultsResponse,
} from "./native-review-contract";

const privateReviewResponses = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { setResponseHeader } = await import("@tanstack/react-start/server");
  setResponseHeader("Cache-Control", "no-store");
  return next();
});

export const readNativeChoices = createServerFn({ method: "GET" })
  .middleware([privateReviewResponses, familyAuthMiddleware])
  .validator((input: unknown) => householdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { nativeReviewRequest } = await import("./native-review.server");
    return consentStatus.parse(await nativeReviewRequest(context.userId, "status", data));
  });
export const readNativeResults = createServerFn({ method: "GET" })
  .middleware([privateReviewResponses, familyAuthMiddleware])
  .validator((input: unknown) => householdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { nativeReviewRequest } = await import("./native-review.server");
    return resultsResponse.parse(await nativeReviewRequest(context.userId, "results", data));
  });
export const chooseNativeConsent = createServerFn({ method: "POST" })
  .middleware([privateReviewResponses, familyAuthMiddleware])
  .validator((input: unknown) => consentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { nativeReviewRequest } = await import("./native-review.server");
    return consentReceipt.parse(await nativeReviewRequest(context.userId, "consent", data));
  });
export const sendNativeFeedback = createServerFn({ method: "POST" })
  .middleware([privateReviewResponses, familyAuthMiddleware])
  .validator((input: unknown) => feedbackInput.parse(input))
  .handler(async ({ data, context }) => {
    const { nativeReviewRequest } = await import("./native-review.server");
    return feedbackReceipt.parse(await nativeReviewRequest(context.userId, "feedback", data));
  });
