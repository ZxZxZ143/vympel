import { ProtectedShell } from "@/shared/components/ProtectedShell";
import { CmsView } from "@/features/cms/CmsView";

export default function CmsPage() {
  return (
    <ProtectedShell adminOnly>
      <CmsView />
    </ProtectedShell>
  );
}
