import { LifeHubEnhanced } from "@/components/life-hub-enhanced";
import MobileGate from "@/components/mobile-gate";

export default function LifeHubPage() {
  return (
    <MobileGate>
      <div className="space-y-6">
        <LifeHubEnhanced />
      </div>
    </MobileGate>
  );
}
