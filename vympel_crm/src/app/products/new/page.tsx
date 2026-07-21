import { ProductForm } from "@/features/products/ProductForm";
import { ProtectedShell } from "@/shared/components/ProtectedShell";

export default function NewProductPage() {
  return (
    <ProtectedShell>
      <ProductForm />
    </ProtectedShell>
  );
}
