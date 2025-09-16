import { ProfilePage } from "@/components/profile-page";
import MobileGate from "@/components/mobile-gate";

export default function Profile() {
  return (
    <MobileGate allowMobile={true}>
      <ProfilePage />
    </MobileGate>
  );
}