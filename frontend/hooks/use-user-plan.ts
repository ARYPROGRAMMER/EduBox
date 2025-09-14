import { useSchematicEntitlement } from "@schematichq/schematic-react";
import { PLAN_FEATURES } from "@/features/flag";

export type UserPlan = "FREE" | "STARTER" | "PRO";

export function useUserPlan(): {
  plan: UserPlan;
  planInfo: (typeof PLAN_FEATURES)[UserPlan];
  isLoading: boolean;
} {
  // Check each plan's features to determine user's plan
  const { value: hasProFeatures } =
    useSchematicEntitlement("unlimited-storage");
  const { value: hasStarterFeatures } =
    useSchematicEntitlement("course-analytics");

  let plan: UserPlan = "FREE";

  if (hasProFeatures) {
    plan = "PRO";
  } else if (hasStarterFeatures) {
    plan = "STARTER";
  }

  return {
    plan,
    planInfo: PLAN_FEATURES[plan],
    isLoading: false,
  };
}

export function useFeatureAccess(featureName: string) {
  const {
    value: hasAccess,
    featureUsage,
    featureAllocation,
  } = useSchematicEntitlement(featureName);
  const { plan } = useUserPlan();

  const hasReachedLimit =
    featureUsage !== undefined &&
    featureAllocation !== undefined &&
    featureAllocation > 0 &&
    featureUsage >= featureAllocation;

  return {
    hasAccess: hasAccess && !hasReachedLimit,
    usage: featureUsage || 0,
    limit: featureAllocation || 0,
    plan,
    hasReachedLimit,
  };
}
