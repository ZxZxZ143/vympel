import { ProductAnalyticsView } from "@/features/analytics/ProductAnalyticsView";
import { ProtectedShell } from "@/shared/components/ProtectedShell";

export default function AnalyticsPage() {
  return (
    <ProtectedShell>
      <ProductAnalyticsView />
    </ProtectedShell>
  );
}
