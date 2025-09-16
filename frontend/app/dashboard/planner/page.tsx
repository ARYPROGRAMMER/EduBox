import { Suspense } from "react";
import { PlannerHubEnhanced } from "@/components/planner-hub-enhanced";
import { PageLoader } from "@/components/ui/loader";
import MobileGate from "@/components/mobile-gate";

export default function PlannerPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading planner..." />}>
      <MobileGate>
        <div className="space-y-6">
          <PlannerHubEnhanced />
        </div>
      </MobileGate>
    </Suspense>
  );
}
