import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { authClient, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { HouseholdProvider, useHousehold } from "@/lib/household-context";
import { createHousehold, joinHousehold } from "@/lib/shared-household";
import { activatePersonalStore, useGuardian } from "@/lib/store";
import { AppShell } from "./app-shell";

const field = "mt-2 h-12 w-full rounded-xl border border-line bg-panel px-3 text-base";
const button =
  "mt-4 min-h-12 w-full rounded-xl bg-violet px-4 py-3 font-semibold text-paper disabled:opacity-50";

export function AccountPanel() {
  const { user } = useCurrentUserState();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "reset">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function logout() {
    try {
      await signOut("/account");
    } catch {
      setNotice("Sign-out was not confirmed. Please try again.");
    }
  }
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("token");
    if (resetToken) {
      setToken(resetToken);
      setMode("reset");
    }
    if (params.get("error"))
      setNotice("This confirmation or reset link is unavailable. Request a new link.");
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const origin = window.location.origin;
      let result;
      if (mode === "signup")
        result = await authClient.signUp.email({
          email,
          password,
          name: name.trim(),
          callbackURL: `${origin}/account`,
        });
      else if (mode === "forgot")
        result = await authClient.requestPasswordReset({ email, redirectTo: `${origin}/account` });
      else if (mode === "reset")
        result = await authClient.resetPassword({ token: token ?? "", newPassword: password });
      else result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setNotice(
          mode === "forgot"
            ? "If that address has an account, a reset link will arrive. Check your inbox and spam folder."
            : mode === "signin"
              ? "Sign-in failed. Check your email, password and confirmation email."
              : "Could not complete that request. Check the details or request a new link.",
        );
      } else if (mode === "signup") {
        setNotice(
          "Check your email to confirm your account, then sign in. The link expires in one hour.",
        );
        setMode("signin");
        setPassword("");
      } else if (mode === "forgot")
        setNotice(
          "If that address has an account, a reset link will arrive. Check your inbox and spam folder.",
        );
      else if (mode === "reset") {
        setNotice("Password reset. Sign in with your new password.");
        setMode("signin");
        setPassword("");
        setToken(null);
        window.history.replaceState({}, "", "/account");
      } else window.location.assign("/");
    } catch {
      setNotice("Account services are unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    setBusy(true);
    try {
      const result = await authClient.sendVerificationEmail({
        email: user?.primaryEmail ?? email,
        callbackURL: `${window.location.origin}/account`,
      });
      if (result.error) throw new Error("Email request failed");
      setNotice(
        "If confirmation is needed, a fresh link will arrive. Check your inbox and spam folder.",
      );
    } catch {
      setNotice("Email delivery is unavailable. Try again shortly.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <img
        src="/brand/kyrec-logo-exact.png"
        alt="KYREC"
        className="mb-6 h-12 w-auto self-start object-contain"
      />
      <h1 className="text-2xl font-semibold">KYREC Family Guardian</h1>
      <p className="mt-2 text-sm text-muted">Your own account. One shared list for your family.</p>
      {user && user.emailVerified && mode !== "reset" ? (
        <>
          <p className="mt-6">Signed in as {user.primaryEmail}.</p>
          <Link to="/" className={button}>
            Open your family
          </Link>
          <button className={button} onClick={() => void logout()}>
            Sign out
          </button>
        </>
      ) : (
        <form className="mt-6" onSubmit={(e) => void submit(e)}>
          <h2 className="text-xl font-semibold">
            {
              {
                signin: "Sign in",
                signup: "Create your account",
                forgot: "Reset your password",
                reset: "Choose a new password",
              }[mode]
            }
          </h2>
          {mode === "signup" ? (
            <label className="mt-4 block">
              Your name
              <input
                aria-label="Your name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                className={field}
              />
            </label>
          ) : null}
          {mode !== "reset" ? (
            <label className="mt-4 block">
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={field}
              />
            </label>
          ) : null}
          {mode !== "forgot" ? (
            <label className="mt-4 block">
              Password
              <input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={mode === "signin" ? undefined : 12}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={field}
              />
              <span className="mt-1 block text-xs text-muted">
                Use at least 12 characters for a new password.
              </span>
            </label>
          ) : null}
          <button disabled={busy} className={button}>
            {busy
              ? "Working…"
              : {
                  signin: "Sign in",
                  signup: "Create account and send confirmation",
                  forgot: "Send reset link",
                  reset: "Save new password",
                }[mode]}
          </button>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-violet">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
                setPassword("");
              }}
            >
              {" "}
              {mode === "signup" ? "Already have an account?" : "Create an account"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "forgot" ? "signin" : "forgot");
                setPassword("");
              }}
            >
              {mode === "forgot" ? "Back to sign in" : "Forgot password?"}
            </button>
            <button
              type="button"
              disabled={busy || !(email || user?.primaryEmail)}
              onClick={() => void resend()}
            >
              Resend confirmation
            </button>
          </div>
        </form>
      )}
      {notice ? (
        <p role="status" className="mt-4 rounded-xl bg-panel p-3 text-sm">
          {notice}
        </p>
      ) : null}
      <p className="mt-8 text-xs text-muted">
        Companion conversations are private to your account. Family membership does not grant access
        to another person’s chats.
      </p>
      <p className="mt-3 text-xs text-muted">
        In immediate danger in Australia, call{" "}
        <a href="tel:000" className="underline">
          000
        </a>
        . Guardian is not an emergency service.
      </p>
      <div className="mt-4 flex gap-4 text-sm">
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
      </div>
    </main>
  );
}

function HouseholdGate({ children }: { children: ReactNode }) {
  const { snapshot, loading, error, refresh } = useHousehold();
  const { user } = useCurrentUserState();
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [adult, setAdult] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  if (loading)
    return (
      <p role="status" className="p-8">
        Opening your family…
      </p>
    );
  if (snapshot) return <>{children}</>;
  async function setup(join: boolean) {
    setBusy(true);
    setNotice(null);
    try {
      const display_name = user?.displayName || "Family member";
      if (join)
        await joinHousehold({ data: { token: token.trim(), display_name, shop_consent: true } });
      else
        await createHousehold({
          data: { name: name.trim(), display_name, adult: true, shop_consent: true },
        });
      await refresh();
    } catch {
      setNotice("Could not open that family. Check the invitation or connection and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">Open your family</h1>
      <p className="mt-3 text-sm text-muted">
        The shared shopping list and list activity are visible to members of this household. Chats
        and location have separate permissions.
      </p>
      {error ? (
        <p role="alert" className="mt-4">
          {error}
          <button className={button} onClick={() => void refresh()}>
            Try again
          </button>
        </p>
      ) : null}
      <label className="mt-6 flex gap-3">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />I
        understand and choose to share shopping-list activity with this household.
      </label>
      <label className="mt-6 block">
        Invitation code
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="off"
          className={field}
        />
      </label>
      <button
        className={button}
        disabled={busy || !consent || token.trim().length < 40}
        onClick={() => void setup(true)}
      >
        Join family
      </button>
      <div className="mt-8 border-t border-line pt-6">
        <label>
          New family name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            className={field}
          />
        </label>
        <label className="mt-4 flex gap-3">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />I am
          an adult creating and managing this household.
        </label>
        <button
          className={button}
          disabled={busy || !consent || !adult || !name.trim()}
          onClick={() => void setup(false)}
        >
          Create family
        </button>
      </div>
      {notice ? (
        <p role="status" className="mt-4">
          {notice}
        </p>
      ) : null}
      <button
        className="mt-6 text-sm text-violet"
        onClick={() =>
          void signOut("/account").catch(() =>
            setNotice("Sign-out was not confirmed. Please try again."),
          )
        }
      >
        Sign out
      </button>
    </main>
  );
}

export function FamilyAccess({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const [localReady, setLocalReady] = useState(false);
  const personalUserId = user?.id;
  const personalVerified = user?.emailVerified;
  const personalFallback = user?.isDevFallback;
  const personalDisplayName = user?.displayName;
  useEffect(() => {
    setLocalReady(false);
    if (!personalUserId || !personalVerified || personalFallback) return;
    let active = true;
    void activatePersonalStore(personalUserId)
      .then(() => {
        if (active) {
          useGuardian.setState({ displayName: personalDisplayName || "You" });
          setLocalReady(true);
        }
      })
      .catch(() => {
        if (active) setLocalReady(true);
      });
    return () => {
      active = false;
    };
  }, [personalUserId, personalVerified, personalFallback, personalDisplayName]);
  if (["/privacy", "/terms"].includes(pathname)) return <>{children}</>;
  if (isPending)
    return (
      <p role="status" className="p-8">
        Checking your account…
      </p>
    );
  if (!user || !user.emailVerified || user.isDevFallback || pathname === "/account")
    return <AccountPanel />;
  if (!localReady)
    return (
      <p role="status" className="p-8">
        Opening your account…
      </p>
    );
  return (
    <HouseholdProvider>
      <HouseholdGate>
        <AppShell>{children}</AppShell>
      </HouseholdGate>
    </HouseholdProvider>
  );
}
