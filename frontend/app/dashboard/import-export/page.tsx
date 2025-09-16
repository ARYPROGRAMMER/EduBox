import { DataImportExportHub } from "@/components/data-import-export-hub";
import { LockedFeature } from "@/components/locked-feature";
import MobileGate from "@/components/mobile-gate";
import { FeatureFlag } from "@/features/flag";

export default function ImportExportPage() {
  return (
    <LockedFeature feature={FeatureFlag.DATA_IMPORT_EXPORT} requiredPlan="STARTER">
      <div className="container mx-auto py-6">
        <MobileGate allowMobile={true}>
          <DataImportExportHub />
        </MobileGate>
      </div>
    </LockedFeature>
  );
}