"use client";

import {
  useSchematicEntitlement,
  useSchematicIsPending,
} from "@schematichq/schematic-react";
import { Progress } from "./ui/progress";
import { FeatureFlag } from "@/features/flag";
import { Loader as KendoLoader } from "@progress/kendo-react-indicators";

function Usage({
  featureFlag,
  title,
}: {
  featureFlag: FeatureFlag;
  title: string;
}) {
  const isPending = useSchematicIsPending();
  const {
    featureAllocation,
    featureUsage,
    value: isFeatureEnabled,
  } = useSchematicEntitlement(featureFlag);

  const hasUsedAllTokens =
    featureUsage && featureAllocation && featureUsage >= featureAllocation;

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-4">
        <KendoLoader size="medium" />
      </div>
    );
  }

  if (hasUsedAllTokens) {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-destructive/20 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-card-foreground">
            {title}
          </h2>
          <div className="px-4 py-2 bg-destructive/10 rounded-lg">
            <span className="font-medium text-destructive">{featureUsage}</span>
            <span className="text-destructive/60 mx-2">/</span>
            <span className="font-medium text-destructive">
              {featureAllocation}
            </span>
          </div>
        </div>

        <div className="relative">
          <Progress
            value={100}
            className="h-3 rounded-full bg-muted [&>*]:bg-destructive"
          />
          <p className="text-sm text-destructive mt-2">
            You have used all available tokens. Please upgrade your plan to
            continue using this feature.
          </p>
        </div>
      </div>
    );
  }

  if (!isFeatureEnabled) {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 opacity-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-card-foreground">
            {title}
          </h2>
          <div className="px-4 py-2 bg-muted rounded-lg">
            <span className="text-muted-foreground">Feature Disabled</span>
          </div>
        </div>

        <div className="relative">
          <Progress value={0} className="h-3 rounded-full bg-muted" />
          <p className="text-sm text-muted-foreground mt-2">
            Upgrade to use this feature
          </p>
        </div>
      </div>
    );
  }

  const progress = ((featureUsage || 0) / (featureAllocation || 1)) * 100;

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return "[&>*]:bg-red-600";
    if (percent >= 50) return "[&>*]:bg-yellow-500";
    return "[&>*]:bg-green-500";
  };

  const progressColor = getProgressColor(progress);

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-card-foreground">{title}</h2>
        <div className="px-4 py-2 bg-muted rounded-lg">
          <span className="font-medium text-foreground">{featureUsage}</span>
          <span className="text-muted-foreground mx-2">/</span>
          <span className="font-medium text-foreground">
            {featureAllocation}
          </span>
        </div>
      </div>

      <div className="relative">
        <Progress
          value={progress}
          className={`h-3 rounded-full bg-muted ${progressColor}`}
        />

        {progress >= 100 ? (
          <p className="text-sm text-destructive mt-2">
            You have reached your usage limit
          </p>
        ) : progress >= 80 ? (
          <p className="text-sm text-destructive mt-2">
            Warning: You are approaching your usage limit
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default Usage;
