import { DashboardLayout } from "@/components/dashboard-layout";
import { UserInitializer } from "@/components/UserInitializer";
import { FirstTimeUserRedirect } from "@/components/first-time-user-redirect";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserInitializer>
      <FirstTimeUserRedirect />
      <DashboardLayout>{children}</DashboardLayout>
    </UserInitializer>
  );
}
