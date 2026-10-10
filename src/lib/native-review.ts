import { createServerFn } from "@tanstack/react-start";
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

export const readNativeChoices = createServerFn({ method: "GET" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) => householdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { nativeReviewRequest } = await import("./native-review.server");
    return consentStatus.parse(await nativeReviewRequest(context.userId, "status", data));
  });
export const readNativeResults = createServerFn({ method: "GET" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) => householdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { nativeReviewRequest } = await import("./native-review.server");
    return resultsResponse.parse(await nativeReviewRequest(context.userId, "results", data));
  });
export const chooseNativeConsent = createServerFn({ method: "POST" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) => consentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { nativeReviewRequest } = await import("./native-review.server");
    return consentReceipt.parse(await nativeReviewRequest(context.userId, "consent", data));
  });
export const sendNativeFeedback = createServerFn({ method: "POST" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) => feedbackInput.parse(input))
  .handler(async ({ data, context }) => {
    const { nativeReviewRequest } = await import("./native-review.server");
    return feedbackReceipt.parse(await nativeReviewRequest(context.userId, "feedback", data));
  });
