import { z } from "zod";

export const nativeNotice = "guardian-native-access-v1" as const;
export const nativePurpose = z.enum(["presentation", "feedback"]);
export const householdInput = z.object({ household: z.string().uuid() }).strict();
export const consentInput = householdInput
  .extend({
    purpose: nativePurpose,
    granted: z.boolean(),
    notice_version: z.literal(nativeNotice),
  })
  .strict();
export const feedbackInput = householdInput
  .extend({
    feedback_id: z.string().uuid(),
    recommendation_id: z.string().uuid(),
    kind: z.enum(["accepted", "rejected", "dismissed", "usefulness"]),
    helpful: z.boolean().optional(),
  })
  .strict()
  .refine((value) => (value.kind === "usefulness") === (value.helpful !== undefined));
const choice = z
  .object({ granted: z.boolean(), expires_at: z.string().datetime({ offset: true }).nullable() })
  .strict();
export const consentStatus = z
  .object({
    notice_version: z.literal(nativeNotice),
    choices: z.object({ presentation: choice, feedback: choice }).strict(),
  })
  .strict();
export const resultsResponse = z
  .object({
    contract: z.literal("guardian-native-review-v1"),
    results: z
      .array(
        z
          .object({
            decision_id: z.string().uuid(),
            recommendation_id: z.string().uuid().nullable(),
            text: z.string().min(1).max(1200),
            valid_until: z.string().datetime({ offset: true }),
            execution_authorized: z.literal(false),
          })
          .strict(),
      )
      .max(50),
  })
  .strict();
export const consentReceipt = z
  .object({
    purpose: nativePurpose,
    granted: z.boolean(),
    notice_version: z.literal(nativeNotice),
    expires_at: z.string().datetime({ offset: true }),
  })
  .strict();
export const feedbackReceipt = z
  .object({
    feedback_id: z.string().uuid(),
    recorded: z.literal(true),
    execution_authorized: z.literal(false),
  })
  .strict();
export type NativeChoices = z.infer<typeof consentStatus>;
export type NativeResult = z.infer<typeof resultsResponse>["results"][number];
export type NativeFeedback = z.infer<typeof feedbackInput>;
