import { Capacitor, CapacitorHttp, registerPlugin } from "@capacitor/core";
import { NativeSession, type SecureStore } from "./session";

interface KeychainPlugin {
  read(): Promise<{ value: string | null }>;
  write(options: { value: string }): Promise<void>;
  clear(): Promise<void>;
}
const keychain = registerPlugin<KeychainPlugin>("GuardianSession");

/** Not mounted in production UI until native acceptance and script review pass. */
export function createIOSSession(origin: string): NativeSession {
  const url = new URL(origin);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("An approved HTTPS Guardian origin is required");
  if (
    !Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() !== "ios" ||
    !Capacitor.isPluginAvailable("GuardianSession")
  )
    throw new Error("Native secure session storage unavailable");
  // Origin-bound Keychain records prevent a changed backend consuming old tokens.
  const store: SecureStore = {
    async read() {
      const { value } = await keychain.read();
      if (!value) return null;
      const record = JSON.parse(value) as { origin: string; session: string };
      if (record.origin !== url.origin)
        throw new Error("Stored session belongs to a different server");
      return record.session;
    },
    write: (value) =>
      keychain.write({ value: JSON.stringify({ origin: url.origin, session: value }) }),
    clear: () => keychain.clear(),
  };
  return new NativeSession(store, async (body, token) => {
    const response = await CapacitorHttp.request({
      url: `${url.origin}/api/mobile`,
      method: "POST",
      data: body,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      responseType: "json",
      disableRedirects: true,
      connectTimeout: 8000,
      readTimeout: 8000,
    });
    if (
      new URL(response.url).origin !== url.origin ||
      (response.status >= 300 && response.status < 400)
    )
      throw new Error("Redirect refused");
    const refreshed = Object.entries(response.headers).find(
      ([name]) => name.toLowerCase() === "set-auth-token",
    )?.[1];
    return { status: response.status, data: response.data, token: refreshed };
  });
}
