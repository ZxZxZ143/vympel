import { SettingsView } from "@/features/settings/SettingsView";
import { ProtectedShell } from "@/shared/components/ProtectedShell";

export default function SettingsPage() {
  return (
    <ProtectedShell>
      <SettingsView />
    </ProtectedShell>
  );
}
