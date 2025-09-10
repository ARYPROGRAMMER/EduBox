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

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-72 bg-card/50 backdrop-blur-sm border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">EduBox</h1>
              <p className="text-sm text-muted-foreground">AI Digital Locker</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-1">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-11 px-4",
                activeTab === "overview"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("overview")}
            >
              <Home className="w-4 h-4 mr-3" />
              Overview
            </Button>
            <Button
              variant={activeTab === "files" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-11 px-4",
                activeTab === "files"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("files")}
            >
              <FolderOpen className="w-4 h-4 mr-3" />
              Files
            </Button>
            <Button
              variant={activeTab === "planner" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-11 px-4",
                activeTab === "planner"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("planner")}
            >
              <Calendar className="w-4 h-4 mr-3" />
              Planner
            </Button>
            <Button
              variant={activeTab === "life-hub" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-11 px-4",
                activeTab === "life-hub"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("life-hub")}
            >
              <Users className="w-4 h-4 mr-3" />
              Life Hub
            </Button>
            <Button
              variant={activeTab === "analytics" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-11 px-4",
                activeTab === "analytics"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("analytics")}
            >
              <BarChart3 className="w-4 h-4 mr-3" />
              Analytics
            </Button>
            <Button
              variant={activeTab === "chat" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-11 px-4",
                activeTab === "chat"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "hover:bg-muted/50"
              )}
              onClick={() => setActiveTab("chat")}
            >
              <MessageSquare className="w-4 h-4 mr-3" />
              Ask AI
            </Button>
          </div>
        </ScrollArea>

        {/* User Profile & Settings */}
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-background/50">
            <UserButton
              appearance={{
                baseTheme: theme === "dark" ? dark : undefined,
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "shadow-xl border border-border/50",
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
                {user?.primaryEmailAddress?.emailAddress || "student@edu.com"}
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
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-card/50 backdrop-blur-sm border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "files" && "File Management"}
              {activeTab === "planner" && "Academic Planner"}
              {activeTab === "life-hub" && "Life Hub"}
              {activeTab === "analytics" && "Analytics"}
              {activeTab === "chat" && "AI Assistant"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 w-64 bg-background/50"
              />
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1">
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
        </ScrollArea>
      </div>
    </div>
  );
}
