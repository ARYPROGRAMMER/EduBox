import { Suspense } from "react";
import { FileHubEnhanced } from "@/components/file-hub-enhanced";
import { PageLoader } from "@/components/ui/loader";

export default function FilesPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading files..." />}>
      <div className="space-y-6">
        <FileHubEnhanced />
      </div>
    </Suspense>
  );
}
