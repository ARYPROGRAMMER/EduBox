"use client";

import { useState } from "react";
import { useFeatureAccess, useUserPlan } from "@/hooks/use-user-plan";
import { PLAN_FEATURES } from "@/features/flag";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Crown, Zap, Star, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface LockedFeatureProps {
  feature: string;
  children: ReactNode;
  title?: string;
  description?: string;
  requiredPlan?: "STARTER" | "PRO";
}

// Helper function to check if a plan meets the required level
function isPlanSufficient(userPlan: "FREE" | "STARTER" | "PRO", requiredPlan: "STARTER" | "PRO"): boolean {
  if (requiredPlan === "STARTER") {
    return userPlan === "STARTER" || userPlan === "PRO";
  }
  if (requiredPlan === "PRO") {
    return userPlan === "PRO";
  }
  return false;
}

export function LockedFeature({
  feature,
  children,
  title,
  description,
  requiredPlan = "PRO",
}: LockedFeatureProps) {
  const { hasAccess } = useFeatureAccess(feature);
  const { plan, planInfo } = useUserPlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();

  // Check if the feature is included in the user's plan configuration
  const isFeatureInPlan = planInfo.features.includes(feature as any);
  
  // Enhanced access checking - user has access if:
  // 1. They have direct feature access AND within limits
  // 2. OR their plan level is sufficient for the required plan
  // 3. OR the feature is explicitly included in their plan configuration
  const userHasAccess = hasAccess || isPlanSufficient(plan, requiredPlan) || isFeatureInPlan;

  const getPlanIcon = () => {
    switch (requiredPlan) {
      case "PRO":
        return <Crown className="w-4 h-4" />;
      case "STARTER":
        return <Zap className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getPlanColor = () => {
    switch (requiredPlan) {
      case "PRO":
        return "bg-gradient-to-r from-yellow-500 to-orange-500";
      case "STARTER":
        return "bg-gradient-to-r from-blue-500 to-purple-500";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  // If user has access, render the feature normally
  if (userHasAccess) {
    return <>{children}</>;
  }

  // If user doesn't have access, show locked state
  return (
    <>
      <div
        className="relative cursor-pointer transition-all duration-200 hover:scale-[1.02]"
        onClick={() => setShowUpgradeModal(true)}
      >
        {/* Locked overlay */}
        <div className="relative">
          <div className="opacity-60 pointer-events-none">
            {children}
          </div>
          
          {/* Lock badge */}
          <div className="absolute top-3 right-3 z-10">
            <Badge 
              variant="secondary" 
              className={`${getPlanColor()} text-white border-0 shadow-lg`}
            >
              <Lock className="w-3 h-3 mr-1" />
              LOCKED IN THIS PLAN
            </Badge>
          </div>
          
          {/* Upgrade hint overlay */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
            <div className="text-center p-4">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium ${getPlanColor()}`}>
                {getPlanIcon()}
                <span className="ml-2">Click to Upgrade</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${getPlanColor()}`}>
                {getPlanIcon()}
              </div>
              Feature Locked
            </DialogTitle>
            <DialogDescription>
              {title && (
                <div className="font-semibold text-foreground mb-2">{title}</div>
              )}
              {description || `This feature requires ${requiredPlan} plan to access.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">Upgrade Benefits</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Unlock all premium features</li>
                <li>• Unlimited usage limits</li>
                <li>• Priority support</li>
                <li>• Advanced integrations</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowUpgradeModal(false);
                  router.push("/manage-plan");
                }}
                className={`flex-1 ${getPlanColor()} text-white border-0 hover:opacity-90`}
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook for checking if a feature should be shown as locked
export function useLockedFeature(feature: string) {
  const { hasAccess, plan } = useFeatureAccess(feature);
  
  return {
    isLocked: !hasAccess,
    currentPlan: plan,
    showAsLocked: true, // Always show features, just locked if no access
  };
}