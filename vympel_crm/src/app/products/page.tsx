import { ProductListView } from "@/features/products/ProductListView";
import { ProtectedShell } from "@/shared/components/ProtectedShell";

export default function ProductsPage() {
  return (
    <ProtectedShell>
      <ProductListView />
    </ProtectedShell>
  );
}
