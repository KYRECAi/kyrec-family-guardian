import { z } from "zod";

const identity = z
  .object({
    id: z.string().min(1),
    email: z.string().email(),
    name: z.string(),
    emailVerified: z.literal(true),
  })
  .strict();
const session = z.object({ user: identity, expiresAt: z.string().datetime() }).strict();
const stored = z
  .object({
    token: z.string().min(20).max(4096),
    userId: z.string().min(1),
    expiresAt: z.string().datetime(),
    pendingLogout: z.boolean(),
  })
  .strict();
export interface SecureStore {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
  clear(): Promise<void>;
}
export interface NativeResponse {
  status: number;
  data: unknown;
  token?: string;
}
export type NativeTransport = (body: object, token?: string) => Promise<NativeResponse>;

/** One serialized session per installation; no cached identity grants offline access. */
export class NativeSession {
  private queue: Promise<unknown> = Promise.resolve();
  private epoch = 0;
  private accessBlocked = false;
  constructor(
    private store: SecureStore,
    private transport: NativeTransport,
    private now = Date.now,
  ) {}
  private serial<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(work);
    this.queue = result.catch(() => undefined);
    return result;
  }
  private async record() {
    const raw = await this.store.read();
    if (!raw) return null;
    try {
      return stored.parse(JSON.parse(raw));
    } catch {
      await this.store.clear();
      throw new Error("Stored session invalid");
    }
  }
  private async revoke(record: z.infer<typeof stored>) {
    // Durable tombstone first: a restart must not restore a pending logout.
    await this.store.write(JSON.stringify({ ...record, pendingLogout: true }));
    const result = await this.transport({ action: "logout" }, record.token);
    if (result.status !== 200 && result.status !== 401)
      throw new Error("Logout pending; reconnect to confirm revocation");
    await this.store.clear();
  }
  login(email: string, password: string) {
    const epoch = ++this.epoch;
    this.accessBlocked = true;
    return this.serial(async () => {
      const previous = await this.record();
      if (previous) await this.revoke(previous);
      if (epoch !== this.epoch) throw new Error("Identity changed");
      const result = await this.transport({ action: "login", email, password });
      const value = session.parse(result.data);
      if (result.status !== 200 || !result.token || Date.parse(value.expiresAt) <= this.now())
        throw new Error("Sign-in failed");
      const next = stored.parse({
        token: result.token,
        userId: value.user.id,
        expiresAt: value.expiresAt,
        pendingLogout: false,
      });
      try {
        await this.store.write(JSON.stringify(next));
      } catch {
        // Best effort server cleanup; never return an identity on storage failure.
        await this.transport({ action: "logout" }, result.token).catch(() => undefined);
        throw new Error("Secure storage unavailable");
      }
      if (epoch !== this.epoch) {
        await this.revoke(next);
        throw new Error("Identity changed");
      }
      this.accessBlocked = false;
      return value.user;
    });
  }
  refresh() {
    const epoch = this.epoch;
    return this.serial(async () => {
      if (epoch !== this.epoch) throw new Error("Identity changed");
      const record = await this.record();
      if (!record) return null;
      if (record.pendingLogout) {
        await this.revoke(record);
        return null;
      }
      if (this.accessBlocked || epoch !== this.epoch) throw new Error("Session locked");
      if (Date.parse(record.expiresAt) <= this.now()) {
        await this.store.clear();
        return null;
      }
      const result = await this.transport({ action: "session" }, record.token);
      if (result.status === 401) {
        await this.store.clear();
        return null;
      }
      if (result.status !== 200) throw new Error("Session unavailable");
      const value = session.parse(result.data);
      if (value.user.id !== record.userId || Date.parse(value.expiresAt) <= this.now()) {
        await this.revoke(record);
        throw new Error("Session identity invalid");
      }
      if (epoch !== this.epoch) throw new Error("Identity changed");
      await this.store.write(
        JSON.stringify(
          stored.parse({
            ...record,
            token: result.token ?? record.token,
            expiresAt: value.expiresAt,
          }),
        ),
      );
      if (epoch !== this.epoch || this.accessBlocked) throw new Error("Identity changed");
      return value.user;
    });
  }
  request(body: object) {
    const epoch = this.epoch;
    return this.serial(async () => {
      // Auth operations must pass through the lifecycle methods.
      const action = (body as { action?: string }).action;
      if (!["households", "shop", "child_access", "save_child_access"].includes(action ?? ""))
        throw new Error("Unsupported operation");
      if (this.accessBlocked || epoch !== this.epoch) throw new Error("Session locked");
      const record = await this.record();
      if (!record || record.pendingLogout || Date.parse(record.expiresAt) <= this.now())
        throw new Error("Sign in required");
      if (this.accessBlocked || epoch !== this.epoch) throw new Error("Identity changed");
      const result = await this.transport(body, record.token);
      if (result.status === 401) await this.store.clear();
      if (epoch !== this.epoch) throw new Error("Identity changed");
      if (result.status !== 200) throw new Error(`Request denied (${result.status})`);
      // Refresh is explicit; data responses cannot extend a cached identity lease.
      return result.data;
    });
  }
  logout() {
    ++this.epoch; // In-flight UI replies become unusable immediately.
    this.accessBlocked = true; // Even a failed Keychain write cannot re-enable this process.
    return this.serial(async () => {
      const record = await this.record();
      if (record) await this.revoke(record);
    });
  }
}
