import { ProductForm } from "@/features/products/ProductForm";
import { ProtectedShell } from "@/shared/components/ProtectedShell";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  return (
    <ProtectedShell>
      <ProductForm productId={Number(id)} />
    </ProtectedShell>
  );
}
