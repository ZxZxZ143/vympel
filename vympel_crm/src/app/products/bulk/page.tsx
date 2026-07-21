import { BulkProductCreateView } from "@/features/products/BulkProductCreateView";
import { ProtectedShell } from "@/shared/components/ProtectedShell";

export default function BulkProductsPage() {
  return (
    <ProtectedShell>
      <BulkProductCreateView />
    </ProtectedShell>
  );
}
