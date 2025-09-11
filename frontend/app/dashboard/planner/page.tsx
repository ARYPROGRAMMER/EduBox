import { Suspense } from "react";
import { PlannerHubEnhanced } from "@/components/planner-hub-enhanced";
import { PageLoader } from "@/components/ui/loader";

export default function PlannerPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading planner..." />}>
      <div className="space-y-6">
        <PlannerHubEnhanced />
      </div>
    </Suspense>
  );
}
