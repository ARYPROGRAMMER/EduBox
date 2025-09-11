"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  MessageSquare,
  FolderOpen,
  Users,
  Settings,
  Moon,
  Sun,
  Home,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useUser, useAuth, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardFooter } from "@/components/dashboard-footer";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start with false to match SSR
  const pathname = usePathname();

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // lg breakpoint
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Only run after mount to avoid hydration mismatch
    if (mounted) {
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [mounted]);

  const navigationItems = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard",
    },
    {
      name: "Files",
      href: "/dashboard/files",
      icon: FolderOpen,
      isActive: pathname === "/dashboard/files",
    },
    {
      name: "Planner",
      href: "/dashboard/planner",
      icon: Calendar,
      isActive: pathname === "/dashboard/planner",
    },
    {
      name: "Life Hub",
      href: "/dashboard/life-hub",
      icon: Users,
      isActive: pathname === "/dashboard/life-hub",
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
      isActive: pathname === "/dashboard/analytics",
    },
    {
      name: "Ask AI",
      href: "/dashboard/chat",
      icon: MessageSquare,
      isActive: pathname.startsWith("/dashboard/chat"),
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile backdrop */}
      {mounted && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "bg-card/50 backdrop-blur-sm border-r border-border flex flex-col fixed left-0 top-0 h-full z-30 transition-transform duration-300 ease-in-out",
          mounted && isSidebarOpen
            ? "w-72 translate-x-0"
            : mounted && !isSidebarOpen
            ? "w-16 translate-x-0 lg:translate-x-0"
            : "w-16 -translate-x-full lg:translate-x-0", // Default state during SSR
          mounted && !isSidebarOpen && "lg:w-16",
          // On mobile, hide completely when closed
          mounted && !isSidebarOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            {mounted && isSidebarOpen ? (
              <>
                <img
                  src="/logo-only.png"
                  alt="EduBox Logo"
                  className="w-10 h-10"
                />
                <div className="flex-1 min-w-0">
                  <h1 className="font-bold text-xl text-foreground">EduBox</h1>
                  <p className="text-sm text-muted-foreground">
                    AI Digital Locker
                  </p>
                </div>
              </>
            ) : (
              <img
                src="/logo-only.png"
                alt="EduBox Logo"
                className="w-10 h-10 mx-auto"
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={item.isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full h-11 px-4",
                      mounted && isSidebarOpen
                        ? "justify-start"
                        : "justify-center",
                      item.isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                        : "hover:bg-muted/50"
                    )}
                    title={!mounted || !isSidebarOpen ? item.name : undefined}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        mounted && isSidebarOpen ? "mr-3" : ""
                      )}
                    />
                    {mounted && isSidebarOpen && item.name}
                  </Button>
                </Link>
              );
            })}
          </div>
        </ScrollArea>

        {/* User Profile & Settings */}
        <div className="p-4 border-t border-border bg-muted/20">
          {mounted && isSidebarOpen ? (
            <>
              <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-background/50">
                <UserButton
                  appearance={{
                    baseTheme: theme === "dark" ? dark : undefined,
                    elements: {
                      avatarBox: "w-10 h-10",
                      userButtonPopoverCard:
                        "shadow-xl border border-border/50",
                      userButtonPopoverActions: "gap-1",
                      userButtonPopoverActionButton:
                        "hover:bg-muted transition-colors",
                      userButtonPopoverActionButtonIcon: "w-4 h-4",
                      userButtonPopoverActionButtonText: "text-sm",
                    },
                  }}
                  userProfileMode="navigation"
                  userProfileUrl="/user-profile"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.fullName || "Student"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.primaryEmailAddress?.emailAddress ||
                      "student@edu.com"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 h-9">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : mounted && !isSidebarOpen ? (
            <div className="flex flex-col gap-2 items-center">
              <UserButton
                appearance={{
                  baseTheme: theme === "dark" ? dark : undefined,
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
                userProfileMode="navigation"
                userProfileUrl="/user-profile"
              />
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => signOut()}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            // Render a placeholder during SSR/initial load
            <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-background/50">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-muted rounded animate-pulse mb-1" />
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          mounted && isSidebarOpen
            ? "ml-72 lg:ml-72"
            : mounted && !isSidebarOpen
            ? "ml-0 lg:ml-16"
            : "ml-0"
        )}
      >
        {/* Dashboard Header */}
        <DashboardHeader
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          mounted={mounted}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </div>

        {/* Dashboard Footer */}
        <DashboardFooter />
      </div>
    </div>
  );
}
