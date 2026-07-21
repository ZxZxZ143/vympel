import { ProtectedShell } from "@/shared/components/ProtectedShell";
import { UserForm } from "@/features/users/UserForm";

export default function NewUserPage() {
  return (
    <ProtectedShell adminOnly>
      <UserForm />
    </ProtectedShell>
  );
}
