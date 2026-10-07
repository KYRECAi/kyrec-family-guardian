import type { Sql } from "./db";

export const COMPANION_POLICY = "openai-companion-beta-v1";

/** Atomic database reservations work across processes and never contain chat. */
export async function reserveCompanionRequest(
  sql: Sql,
  userId: string,
  requestId: string,
  now = new Date(),
  configuredLimit = 20,
): Promise<string | null> {
  const consent = await sql<{
    enabled: boolean;
    policy_version: string;
  }>`select enabled,policy_version from guardian_companion_consent where user_id=${userId}`;
  if (!consent[0]?.enabled || consent[0].policy_version !== COMPANION_POLICY)
    return "Choose whether to send your messages to OpenAI before chatting.";
  const reserved =
    await sql`insert into guardian_companion_request(user_id,request_id) values(${userId},${requestId}) on conflict do nothing returning request_id`;
  if (!reserved.length)
    return "This request was already handled. Send a new message when you are ready.";
  const dailyLimit =
    Number.isInteger(configuredLimit) && configuredLimit >= 1 && configuredLimit <= 100
      ? configuredLimit
      : 20;
  for (const [bucket, limit] of [
    [`minute:${now.toISOString().slice(0, 16)}`, 3],
    [`day:${now.toISOString().slice(0, 10)}`, dailyLimit],
  ] as const) {
    const usage =
      await sql`insert into guardian_companion_usage(user_id,bucket,requests) values(${userId},${bucket},1) on conflict(user_id,bucket) do update set requests=guardian_companion_usage.requests+1 where guardian_companion_usage.requests < ${limit} returning requests`;
    if (!usage.length) return "Your companion request limit has been reached. Please try later.";
  }
  const cutoff = new Date(now.getTime() - 7 * 86400000).toISOString();
  await sql`delete from guardian_companion_request where user_id=${userId} and created_at < now() - interval '7 days'`;
  await sql`delete from guardian_companion_usage where user_id=${userId} and ((bucket like 'day:%' and bucket < ${`day:${cutoff.slice(0, 10)}`}) or (bucket like 'minute:%' and bucket < ${`minute:${cutoff.slice(0, 16)}`}))`;
  return null;
}
