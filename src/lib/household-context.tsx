import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCurrentUserState } from "./auth/use-current-user";
import {
  changeSharedShop,
  readSharedShop,
  listHouseholds,
  type ShopChange,
  type SharedShopSnapshot,
} from "./shared-household";
import { createShopMutations, type ShopMutation } from "./shop-mutation";

type HouseholdContext = {
  snapshot: SharedShopSnapshot | null;
  households: { id: string; name: string; role: string }[];
  loading: boolean;
  error: string | null;
  select: (id: string) => void;
  refresh: () => Promise<void>;
  receive: (snapshot: SharedShopSnapshot) => void;
  change: (input: ShopMutation) => Promise<SharedShopSnapshot>;
};
const Context = createContext<HouseholdContext | null>(null);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useCurrentUserState();
  const userId = user?.id;
  // The provider survives temporary snapshot failures, so lost replies retain
  // their receipt when the shopping screen is reopened in this account.
  const change = useMemo(() => {
    void userId;
    return createShopMutations((data) => changeSharedShop({ data: data as ShopChange }));
  }, [userId]);
  const [households, setHouseholds] = useState<HouseholdContext["households"]>([]);
  const [household, setHousehold] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<SharedShopSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const epoch = useRef(0);
  const refresh = useCallback(async () => {
    const generation = epoch.current;
    try {
      const result = await listHouseholds();
      if (generation !== epoch.current) return;
      setHouseholds(result.households);
      const chosen =
        result.households.find((h) => h.id === household)?.id ?? result.households[0]?.id ?? null;
      setHousehold(chosen);
      if (chosen) {
        const fresh = await readSharedShop({ data: { household: chosen } });
        if (generation !== epoch.current) return;
        setSnapshot((current) =>
          current?.household_id === fresh.household_id && current.revision > fresh.revision
            ? current
            : fresh,
        );
      } else setSnapshot(null);
      setError(null);
    } catch {
      if (generation !== epoch.current) return;
      setSnapshot(null); // Revoked membership/offline must not leave family data visible.
      setError(
        "Shared family data is unavailable. Check your connection or family access and try again.",
      );
    } finally {
      if (generation === epoch.current) setLoading(false);
    }
  }, [household]);
  useEffect(() => {
    epoch.current += 1;
    setSnapshot(null);
    setHousehold(null);
    setHouseholds([]);
    setLoading(true);
    return () => {
      epoch.current += 1;
    };
  }, [userId]);
  useEffect(() => {
    if (!user?.emailVerified || user.isDevFallback) {
      setLoading(false);
      return;
    }
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 3000);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [userId, user?.emailVerified, user?.isDevFallback, refresh]);
  const select = (id: string) => {
    epoch.current += 1;
    setSnapshot(null);
    setHousehold(id);
    setLoading(true);
  };
  const renderEpoch = epoch.current;
  const receive = (fresh: SharedShopSnapshot) => {
    if (renderEpoch !== epoch.current || fresh.household_id !== household) return;
    setSnapshot((current) =>
      current?.household_id === fresh.household_id && current.revision > fresh.revision
        ? current
        : fresh,
    );
  };
  return (
    <Context.Provider
      value={{ snapshot, households, loading, error, select, refresh, receive, change }}
    >
      {children}
    </Context.Provider>
  );
}

export function useHousehold() {
  const value = useContext(Context);
  if (!value) throw new Error("HouseholdProvider is required");
  return value;
}
