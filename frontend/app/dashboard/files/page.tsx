import { Suspense } from "react";
import { FileHubEnhanced } from "@/components/file-hub-enhanced";
import { PageLoader } from "@/components/ui/loader";
import { DashboardHeader } from "@/components/dashboard-header";
import MobileGate from "@/components/mobile-gate";

export default function FilesPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading files..." />}>
      <MobileGate allowMobile={true}>
        <div className="space-y-6">
          <DashboardHeader mounted />
          <FileHubEnhanced />
        </div>
      </MobileGate>
    </Suspense>
  );
}
