import { ProtectedShell } from "@/shared/components/ProtectedShell";
import { UserForm } from "@/features/users/UserForm";

type UserEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserEditPage({ params }: UserEditPageProps) {
  const { id } = await params;

  return (
    <ProtectedShell adminOnly>
      <UserForm userId={Number(id)} />
    </ProtectedShell>
  );
}
