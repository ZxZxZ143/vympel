import { ProtectedShell } from "@/shared/components/ProtectedShell";
import { UserListView } from "@/features/users/UserListView";

export default function UsersPage() {
  return (
    <ProtectedShell adminOnly>
      <UserListView />
    </ProtectedShell>
  );
}
