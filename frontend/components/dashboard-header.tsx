"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  mounted?: boolean;
}

export function DashboardHeader({
  isSidebarOpen,
  setIsSidebarOpen,
  mounted = true,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const getPageTitle = () => {
    switch (true) {
      case pathname === "/dashboard":
        return "Dashboard Overview";
      case pathname === "/dashboard/files":
        return "File Management";
      case pathname === "/dashboard/planner":
        return "Academic Planner";
      case pathname === "/dashboard/life-hub":
        return "Life Hub";
      case pathname === "/dashboard/analytics":
        return "Analytics";
      case pathname.startsWith("/dashboard/chat"):
        return "AI Assistant";
      default:
        return "Dashboard";
    }
  };

  return (
    <header className="h-16 bg-card/50 backdrop-blur-sm border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:flex"
        >
          {mounted ? (
            isSidebarOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </Button>
        <div className="flex items-center gap-2">
          <img src="/logo-only.png" alt="EduBox Logo" className="w-8 h-8" />
          <h2 className="text-xl font-semibold text-foreground">
            {getPageTitle()}
          </h2>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 w-64 bg-background/50 border-muted"
          />
        </div>

        <Button
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
          onClick={() => {
            router.push("/manage-plan");
          }}
        >
          Manage Plan
        </Button>
      </div>
    </header>
  );
}
