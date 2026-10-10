/** Server-only service credentials. Browser requests never supply an actor ID. */
export class CoreUnavailable extends Error {
  readonly status: number;
  constructor(status = 503, message = "Shared family data is unavailable. Please try again.") {
    super(message);
    this.status = status;
  }
}

export async function coreRequest(
  userId: string,
  path: string,
  method = "GET",
  data?: unknown,
  operationId?: string,
  transport: typeof fetch = fetch,
  verifiedEmailHash?: string,
) {
  const base = process.env.KYREC_CORE_URL?.trim();
  const key = process.env.KYREC_CORE_SERVICE_KEY?.trim();
  const service = process.env.KYREC_CORE_SERVICE_ID?.trim();
  if (!base || !key || !service || key.length < 32) throw new CoreUnavailable();
  const url = new URL(base);
  if (
    url.protocol !== "https:" &&
    !(process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname))
  )
    throw new CoreUnavailable();
  if (!path.startsWith("/v1/guardian/") || path.includes("..")) throw new CoreUnavailable(400);
  let response: Response;
  try {
    response = await transport(new URL(path, base), {
      method,
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
      headers: {
        "X-Kyrec-Service-Id": service,
        "X-Kyrec-Service-Key": key,
        "X-Kyrec-User-Id": userId,
        ...(verifiedEmailHash ? { "X-Kyrec-User-Email-Hash": verifiedEmailHash } : {}),
        ...(operationId ? { "X-Kyrec-Operation-Id": operationId } : {}),
        ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });
  } catch {
    throw new CoreUnavailable();
  }
  if (!response.ok) {
    const status = [403, 404, 409, 422, 429].includes(response.status) ? response.status : 503;
    throw new CoreUnavailable(
      status,
      status === 403
        ? "Your family access is unavailable. Sign in again or ask the household owner."
        : status === 409
          ? "The list changed. Refresh and try again."
          : undefined,
    );
  }
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new CoreUnavailable();
  }
}
