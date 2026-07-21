import { ReviewModerationView } from "@/features/reviews/ReviewModerationView";
import { ProtectedShell } from "@/shared/components/ProtectedShell";

export default function ReviewsPage() {
  return (
    <ProtectedShell>
      <ReviewModerationView />
    </ProtectedShell>
  );
}
