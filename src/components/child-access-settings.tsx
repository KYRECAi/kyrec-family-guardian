import { useHousehold } from "@/lib/household-context";
import { readChildAccess, saveChildAccess } from "@/lib/child-feature-access";
import { ChildAccessPanel } from "./child-access-panel";

const api = { readChildAccess, saveChildAccess };

export function ChildAccessSettings() {
  const { snapshot, refresh } = useHousehold();
  if (!snapshot) return null;
  return (
    <ChildAccessPanel
      household={snapshot.household_id}
      isOwner={snapshot.is_owner}
      members={snapshot.members.filter((member) => member.role === "child")}
      onSaved={refresh}
      api={api}
    />
  );
}
