"use client";

import { useFeatureAccess } from "@/hooks/use-user-plan";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Zap, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgrade = true,
}: FeatureGateProps) {
  const { hasAccess, usage, limit, plan, hasReachedLimit, isLoading } =
    useFeatureAccess(feature);
  const router = useRouter();

  // Show loading state while determining access
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const getPlanIcon = () => {
    switch (plan) {
      case "PRO":
        return <Crown className="w-4 h-4" />;
      case "STARTER":
        return <Zap className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getUpgradeMessage = () => {
    if (hasReachedLimit) {
      return `You've reached your ${feature.replace(
        /-/g,
        " "
      )} limit (${usage}/${limit}).`;
    }
    return `This feature is not available on your current ${plan} plan.`;
  };

  if (!showUpgrade) {
    return null;
  }

  return (
    <Card className="border-dashed border-2">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          Feature Locked
          <Badge variant="outline" className="flex items-center gap-1">
            {getPlanIcon()}
            {plan}
          </Badge>
        </CardTitle>
        <CardDescription>{getUpgradeMessage()}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button onClick={() => router.push("/manage-plan")} className="w-full">
          {hasReachedLimit ? "Upgrade for More Usage" : "Upgrade Plan"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Hook for checking feature access in components
export function useFeatureGate(feature: string) {
  const { hasAccess, usage, limit, plan, hasReachedLimit, isLoading } =
    useFeatureAccess(feature);

  return {
    canUse: hasAccess,
    usage,
    limit,
    plan,
    hasReachedLimit,
    isLoading,
    checkAccess: () => hasAccess,
  };
}
