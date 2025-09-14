import { DataImportExportHub } from "@/components/data-import-export-hub";
import { LockedFeature } from "@/components/locked-feature";
import { FeatureFlag } from "@/features/flag";

export default function ImportExportPage() {
  return (
    <LockedFeature feature={FeatureFlag.DATA_IMPORT_EXPORT} requiredPlan="STARTER">
      <div className="container mx-auto py-6">
        <DataImportExportHub />
      </div>
    </LockedFeature>
  );
}