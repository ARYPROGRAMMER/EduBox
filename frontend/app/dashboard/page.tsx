import { Suspense } from "react";
import { DashboardOverview } from "@/components/dashboard-overview";
import { PageLoader } from "@/components/ui/loader";
import MobileGate from "@/components/mobile-gate";

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading dashboard..." />}>
      <MobileGate allowMobile={true}>
        <DashboardOverview />
      </MobileGate>
    </Suspense>
  );
}
