"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MobileGateProps {
  allowMobile?: boolean;
  children?: React.ReactNode;
}

export default function MobileGate({ allowMobile = false, children }: MobileGateProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  // mobile device
  if (allowMobile) {
    return <>{children}</>;
  }

  // Blocked on mobile
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>Open on a bigger device</CardTitle>
          <CardDescription>
            This feature is only available on larger screens. Please open EduBox on a tablet or desktop to access this section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-center">For the best experience, use a larger device.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.history.back()}>
                Go back
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'}>Open Dashboard</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
