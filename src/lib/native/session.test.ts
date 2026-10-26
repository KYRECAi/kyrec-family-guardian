import assert from "node:assert/strict";
import { test } from "node:test";
import { NativeSession, type NativeTransport } from "./session.ts";

const token = "synthetic-signed-token-000000000000";
const data = (id = "adult-a") => ({
  user: { id, email: `${id}@example.test`, name: "Synthetic", emailVerified: true },
  expiresAt: "2030-01-01T00:00:00.000Z",
});
function harness(transport: NativeTransport) {
  let value: string | null = null;
  const store = {
    read: async () => value,
    write: async (s: string) => {
      value = s;
    },
    clear: async () => {
      value = null;
    },
  };
  return { store, client: new NativeSession(store, transport), value: () => value };
}

test("restart requires server validation; refresh persists rotation, revocation clears", async () => {
  let revoked = false;
  const h = harness(async (body) => {
    const action = (body as { action: string }).action;
    return action === "login"
      ? { status: 200, data: data(), token }
      : revoked
        ? { status: 401, data: {} }
        : { status: 200, data: data(), token: token + "rotated" };
  });
  await h.client.login("a@example.test", "synthetic");
  const restarted = new NativeSession(h.store, async () => ({
    status: 200,
    data: data(),
    token: token + "rotated",
  }));
  assert.equal((await restarted.refresh())!.id, "adult-a");
  assert.match(h.value()!, /rotated/);
  revoked = true;
  assert.equal(await h.client.refresh(), null);
  assert.equal(h.value(), null);
});

test("offline logout tombstone survives restart, blocks household requests and account switch", async () => {
  let offline = false;
  const h = harness(async () => {
    if (offline) throw new Error("offline");
    return { status: 200, data: data(), token };
  });
  await h.client.login("a@example.test", "synthetic");
  offline = true;
  await assert.rejects(h.client.logout());
  assert.equal(JSON.parse(h.value()!).pendingLogout, true);
  await assert.rejects(h.client.request({ action: "households" }));
  await assert.rejects(h.client.login("b@example.test", "synthetic"));
  const restarted = new NativeSession(h.store, async () => ({
    status: 200,
    data: { revoked: true },
  }));
  assert.equal(await restarted.refresh(), null);
  assert.equal(h.value(), null);
});

test("logout invalidates an in-flight household response", async () => {
  let release!: () => void;
  let started!: () => void;
  const pending = new Promise<void>((r) => {
    release = r;
  });
  const entered = new Promise<void>((r) => {
    started = r;
  });
  const h = harness(async (body) => {
    if ((body as { action: string }).action === "households") {
      started();
      await pending;
    }
    return { status: 200, data: data(), token };
  });
  await h.client.login("a@example.test", "synthetic");
  const request = h.client.request({ action: "households" });
  await entered;
  const logout = h.client.logout();
  release();
  await assert.rejects(request, /Identity changed/);
  await logout;
  assert.equal(h.value(), null);
});

test("expired, malformed and changed-identity sessions cannot restore access", async () => {
  const h = harness(async () => ({ status: 200, data: data(), token }));
  await h.store.write("not-json");
  await assert.rejects(h.client.refresh());
  assert.equal(h.value(), null);
  await h.client.login("a@example.test", "synthetic");
  const wrong = new NativeSession(h.store, async () => ({ status: 200, data: data("adult-b") }));
  await assert.rejects(wrong.refresh(), /identity invalid/);
  assert.equal(h.value(), null);
  await h.client.login("a@example.test", "synthetic");
  const expired = new NativeSession(
    h.store,
    async () => {
      throw new Error("must not call");
    },
    () => Date.parse("2031-01-01"),
  );
  assert.equal(await expired.refresh(), null);
});

test("storage failure never reports successful login; unsupported operations denied", async () => {
  let revoked = false;
  const client = new NativeSession(
    {
      read: async () => null,
      write: async () => {
        throw new Error("locked");
      },
      clear: async () => {},
    },
    async (body) => {
      revoked ||= (body as { action: string }).action === "logout";
      return { status: 200, data: data(), token };
    },
  );
  await assert.rejects(client.login("a@example.test", "synthetic"), /Secure storage/);
  assert.equal(revoked, true);
  await assert.rejects(client.request({ action: "login" }), /Unsupported/);
});

test("queued mutation is cancelled before transport on logout intent", async () => {
  let release!: () => void;
  let started!: () => void;
  const pending = new Promise<void>((r) => {
    release = r;
  });
  const entered = new Promise<void>((r) => {
    started = r;
  });
  const sent: string[] = [];
  const h = harness(async (body) => {
    const action = (body as { action: string }).action;
    sent.push(action);
    if (action === "households") {
      started();
      await pending;
    }
    return { status: 200, data: data(), token };
  });
  await h.client.login("a@example.test", "synthetic");
  const first = h.client.request({ action: "households" });
  await entered;
  const mutation = h.client.request({ action: "save_child_access" });
  const logout = h.client.logout();
  release();
  await assert.rejects(first);
  await assert.rejects(mutation);
  await logout;
  assert.deepEqual(sent, ["login", "households", "logout"]);
});

test("failed logout storage write locks subsequent access; backend failure retains tombstone", async () => {
  const h = harness(async () => ({ status: 200, data: data(), token }));
  await h.client.login("a@example.test", "synthetic");
  const original = h.store.write;
  h.store.write = async () => {
    throw new Error("Keychain locked");
  };
  await assert.rejects(h.client.logout());
  await assert.rejects(h.client.request({ action: "households" }), /locked/);
  await assert.rejects(h.client.refresh(), /locked/);
  h.store.write = original;
  const restarted = new NativeSession(h.store, async () => ({ status: 503, data: {} }));
  await assert.rejects(restarted.logout(), /pending/);
  assert.equal(JSON.parse(h.value()!).pendingLogout, true);
});

test("logout during refresh storage write cannot return the prior identity", async () => {
  const h = harness(async () => ({ status: 200, data: data(), token }));
  await h.client.login("a@example.test", "synthetic");
  let release!: () => void;
  let entered!: () => void;
  const started = new Promise<void>((r) => {
    entered = r;
  });
  const pending = new Promise<void>((r) => {
    release = r;
  });
  const write = h.store.write;
  let first = true;
  h.store.write = async (s) => {
    if (first) {
      first = false;
      entered();
      await pending;
    }
    await write(s);
  };
  const refresh = h.client.refresh();
  await started;
  const logout = h.client.logout();
  release();
  await assert.rejects(refresh, /Identity changed/);
  await logout;
});
