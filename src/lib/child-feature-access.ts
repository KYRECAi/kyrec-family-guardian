import { createServerFn } from "@tanstack/react-start";
import { familyAuthMiddleware } from "./auth/middleware";
import { childAccessTarget, childAccessChange, childAccessSchema } from "./child-feature-contract";

export const readChildAccess = createServerFn({ method: "GET" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) => childAccessTarget.parse(input))
  .handler(async ({ data, context }) => {
    const { coreRequest } = await import("./core-client.server");
    return childAccessSchema.parse(
      await coreRequest(
        context.userId,
        `/v1/guardian/households/${data.household}/members/${encodeURIComponent(data.member)}/feature-access`,
      ),
    );
  });
export const saveChildAccess = createServerFn({ method: "POST" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) => childAccessChange.parse(input))
  .handler(async ({ data, context }) => {
    const { coreRequest } = await import("./core-client.server");
    return childAccessSchema.parse(
      await coreRequest(
        context.userId,
        `/v1/guardian/households/${data.household}/members/${encodeURIComponent(data.member)}/feature-access`,
        "PUT",
        { revision: data.revision, features: data.features },
      ),
    );
  });
