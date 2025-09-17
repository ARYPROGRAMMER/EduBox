import { DashboardHeader } from "@/components/dashboard-header";
import { LifeHubEnhanced } from "@/components/life-hub-enhanced";
import MobileGate from "@/components/mobile-gate";

export default function LifeHubPage() {
  return (
    <MobileGate>
      <div className="space-y-6">
        <DashboardHeader mounted/>
        <LifeHubEnhanced />
      </div>
    </MobileGate>
  );
}
