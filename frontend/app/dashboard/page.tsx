import { Suspense } from "react";
import { DashboardOverview } from "@/components/dashboard-overview";
import { PageLoader } from "@/components/ui/loader";

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading dashboard..." />}>
      <DashboardOverview />
    </Suspense>
  );
}
