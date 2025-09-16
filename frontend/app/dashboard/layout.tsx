import { DashboardLayout } from "@/components/dashboard-layout";
import { UserInitializer } from "@/components/UserInitializer";
import { FirstTimeUserRedirect } from "@/components/first-time-user-redirect";
import NucliaPopup from "@/components/popuprag";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserInitializer>
      <FirstTimeUserRedirect />
      <DashboardLayout>{children}</DashboardLayout>
      {/* Render Nuclia floating popup button globally in dashboard */}
      <NucliaPopup />
    </UserInitializer>
  );
}
