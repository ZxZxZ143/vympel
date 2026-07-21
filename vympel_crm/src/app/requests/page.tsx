import { RequestProcessingView } from "@/features/requests/RequestProcessingView";
import { ProtectedShell } from "@/shared/components/ProtectedShell";

export default function RequestsPage() {
  return (
    <ProtectedShell>
      <RequestProcessingView />
    </ProtectedShell>
  );
}
