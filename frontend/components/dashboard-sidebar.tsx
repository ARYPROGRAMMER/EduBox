"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  MessageSquare,
  FolderOpen,
  Users,
  Search,
  Plus,
  Settings,
  Moon,
  Sun,
  GraduationCap,
  Home,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useUser, useAuth, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { PlannerHubEnhanced } from "@/components/planner-hub-enhanced";
import { LifeHub } from "@/components/life-hub";
import { ChatInterface } from "@/components/chat-interface-new";
import { FileHubEnhanced } from "@/components/file-hub-enhanced";
import { DashboardOverview } from "@/components/dashboard-overview";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "bg-card/50 backdrop-blur-sm border-r border-border flex flex-col fixed left-0 top-0 h-full z-30 transition-transform duration-300 ease-in-out",
          isSidebarOpen
            ? "w-72 translate-x-0"
            : "w-16 translate-x-0 lg:translate-x-0",
          !isSidebarOpen && "lg:w-16",
          // On mobile, hide completely when closed
          !isSidebarOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            {isSidebarOpen ? (
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
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className={cn(
                "w-full h-11 px-4",
                isSidebarOpen ? "justify-start" : "justify-center",
                activeTab === "overview"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("overview")}
              title={!isSidebarOpen ? "Overview" : undefined}
            >
              <Home className={cn("w-4 h-4", isSidebarOpen ? "mr-3" : "")} />
              {isSidebarOpen && "Overview"}
            </Button>
            <Button
              variant={activeTab === "files" ? "default" : "ghost"}
              className={cn(
                "w-full h-11 px-4",
                isSidebarOpen ? "justify-start" : "justify-center",
                activeTab === "files"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("files")}
              title={!isSidebarOpen ? "Files" : undefined}
            >
              <FolderOpen
                className={cn("w-4 h-4", isSidebarOpen ? "mr-3" : "")}
              />
              {isSidebarOpen && "Files"}
            </Button>
            <Button
              variant={activeTab === "planner" ? "default" : "ghost"}
              className={cn(
                "w-full h-11 px-4",
                isSidebarOpen ? "justify-start" : "justify-center",
                activeTab === "planner"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("planner")}
              title={!isSidebarOpen ? "Planner" : undefined}
            >
              <Calendar
                className={cn("w-4 h-4", isSidebarOpen ? "mr-3" : "")}
              />
              {isSidebarOpen && "Planner"}
            </Button>
            <Button
              variant={activeTab === "life-hub" ? "default" : "ghost"}
              className={cn(
                "w-full h-11 px-4",
                isSidebarOpen ? "justify-start" : "justify-center",
                activeTab === "life-hub"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("life-hub")}
              title={!isSidebarOpen ? "Life Hub" : undefined}
            >
              <Users className={cn("w-4 h-4", isSidebarOpen ? "mr-3" : "")} />
              {isSidebarOpen && "Life Hub"}
            </Button>
            <Button
              variant={activeTab === "analytics" ? "default" : "ghost"}
              className={cn(
                "w-full h-11 px-4",
                isSidebarOpen ? "justify-start" : "justify-center",
                activeTab === "analytics"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("analytics")}
              title={!isSidebarOpen ? "Analytics" : undefined}
            >
              <BarChart3
                className={cn("w-4 h-4", isSidebarOpen ? "mr-3" : "")}
              />
              {isSidebarOpen && "Analytics"}
            </Button>
            <Button
              variant={activeTab === "chat" ? "default" : "ghost"}
              className={cn(
                "w-full h-11 px-4",
                isSidebarOpen ? "justify-start" : "justify-center",
                activeTab === "chat"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("chat")}
              title={!isSidebarOpen ? "Ask AI" : undefined}
            >
              <MessageSquare
                className={cn("w-4 h-4", isSidebarOpen ? "mr-3" : "")}
              />
              {isSidebarOpen && "Ask AI"}
            </Button>
          </div>
        </ScrollArea>

        {/* User Profile & Settings */}
        <div className="p-4 border-t border-border bg-muted/20">
          {isSidebarOpen ? (
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
                  {mounted ? (
                    theme === "dark" ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )
                  ) : (
                    <div className="w-4 h-4" />
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
          ) : (
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
                {mounted ? (
                  theme === "dark" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )
                ) : (
                  <div className="w-4 h-4" />
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
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          isSidebarOpen ? "ml-72 lg:ml-72" : "ml-0 lg:ml-16"
        )}
      >
        {/* Top Bar */}
        <header className="h-16 bg-card/50 backdrop-blur-sm border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:flex"
            >
              {isSidebarOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <img src="/logo-only.png" alt="EduBox Logo" className="w-8 h-8" />
              <h2 className="text-xl font-semibold text-foreground">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "files" && "File Management"}
                {activeTab === "planner" && "Academic Planner"}
                {activeTab === "life-hub" && "Life Hub"}
                {activeTab === "analytics" && "Analytics"}
                {activeTab === "chat" && "AI Assistant"}
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
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {activeTab === "overview" && <DashboardOverview />}
            {activeTab === "files" && (
              <div className="space-y-6">
                <FileHubEnhanced />
              </div>
            )}
            {activeTab === "planner" && (
              <div className="space-y-6">
                <PlannerHubEnhanced />
              </div>
            )}
            {activeTab === "life-hub" && (
              <div className="space-y-6">
                <LifeHub />
              </div>
            )}
            {activeTab === "analytics" && (
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">
                  Analytics Coming Soon
                </h2>
                <p className="text-muted-foreground">
                  Advanced analytics and insights will be available here.
                </p>
              </div>
            )}
            {activeTab === "chat" && (
              <div className="h-full">
                <ChatInterface onClose={() => setActiveTab("overview")} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
