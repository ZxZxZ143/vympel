import { ActivityView } from "@/features/activity/ActivityView";
import { ProtectedShell } from "@/shared/components/ProtectedShell";

export default function ActivityPage() {
  return (
    <ProtectedShell>
      <ActivityView />
    </ProtectedShell>
  );
}
