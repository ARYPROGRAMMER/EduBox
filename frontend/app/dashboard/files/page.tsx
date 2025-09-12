import { Suspense } from "react";
import { FileHubEnhanced } from "@/components/file-hub-enhanced";
import { PageLoader } from "@/components/ui/loader";
import { DashboardHeader } from "@/components/dashboard-header";

export default function FilesPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading files..." />}>
      <div className="space-y-6">
        <DashboardHeader mounted />
        <FileHubEnhanced />
      </div>
    </Suspense>
  );
}
