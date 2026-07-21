import { ProtectedShell } from "@/shared/components/ProtectedShell";
import { DashboardView } from "@/features/dashboard/DashboardView";

export default function DashboardPage() {
  return (
    <ProtectedShell>
      <DashboardView />
    </ProtectedShell>
  );
}
