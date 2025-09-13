"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useUser, useAuth, UserButton } from "@clerk/nextjs";
import { dark as clerkDark } from "@clerk/themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { signOut } = useAuth();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (window.innerWidth >= 1024) setIsSidebarOpen(true);
    const onResize = () => setIsSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: Home },
    { name: "Files", href: "/dashboard/files", icon: FolderOpen },
    { name: "Planner", href: "/dashboard/planner", icon: Calendar },
    { name: "Life Hub", href: "/dashboard/life-hub", icon: Users },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Ask AI", href: "/dashboard/chat", icon: MessageSquare },
  ];

  const activeGradient =
    mounted && theme === "dark"
      ? "from-slate-700/80 via-slate-800/80 to-slate-900/80"
      : "from-emerald-500/80 via-teal-600/80 to-green-600/80";

  // Use exact pixel widths so main content margin matches sidebar width precisely
  const sidebarWidth = isSidebarOpen ? 280 : 80;

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 relative">
      {/* subtle spotlight gradient - changed to neutral */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-400/5 via-transparent to-transparent dark:from-gray-500/5" />

      {/* overlay for mobile */}
      {mounted && isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-20 bg-black lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (not draggable) */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 h-full flex flex-col border-r backdrop-blur-xl",
          "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 shadow-xl"
        )}
        style={{ width: sidebarWidth, transition: "width 300ms ease" }}
      >
        {/* header/logo */}
        <div className="relative flex items-center justify-between px-4 py-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/70 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
              <Image
                src="/logo-only.png"
                alt="Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            {isSidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">EduBox</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI Digital Locker</p>
              </div>
            )}
          </div>
        </div>

        {/* navigation */}
        <ScrollArea className="flex-1 px-3 py-6">
          <div className="space-y-2">
            {navItems.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname?.startsWith(item.href);

              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div whileHover={{ scale: 1.03 }}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full h-12 rounded-xl flex items-center",
                        isSidebarOpen ? "justify-start px-4" : "justify-center px-0",
                        active
                          ? `bg-gradient-to-r ${activeGradient} text-white shadow-md`
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/40 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", active && "text-white", isSidebarOpen && "mr-3")} />
                      {isSidebarOpen && <span className="font-medium">{item.name}</span>}
                    </Button>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </ScrollArea>

        {/* profile & theme toggles */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white/30 dark:bg-slate-800/30">
          {mounted && (
            <div className="flex flex-col gap-3">
              {isSidebarOpen && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <UserButton
                    appearance={{
                      baseTheme: theme === "dark" ? clerkDark : undefined,
                      elements: { avatarBox: "w-10 h-10" },
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.fullName || "Student"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.primaryEmailAddress?.emailAddress || "student@edu.com"}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg hover:bg-slate-100/40 dark:hover:bg-slate-700/40"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="rounded-lg hover:bg-slate-100/40 dark:hover:bg-slate-700/40">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Floating toggle button - positioned next to sidebar edge */}
      <div
        className="absolute top-1/2 z-40 flex flex-col gap-2"
        style={{ left: sidebarWidth - 20, transform: "translateY(-50%)" }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSidebarOpen((s) => !s)}
          className="backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-full p-2 shadow-lg hover:shadow-xl transition"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          )}
        </motion.button>
      </div>

      {/* main content */}
      <main
        className="flex-1 flex flex-col h-full"
        style={{ marginLeft: sidebarWidth, transition: "margin-left 300ms ease" }}
      >
        {/* <DashboardHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} mounted={mounted} /> */}
       
       
       
        <div className={cn("flex-1 h-full", pathname?.includes('/chat') ? "flex w-full" : "overflow-auto")}>
          {pathname?.includes('/chat') ? (
            // Chat pages need full height and width without padding
            <div className="w-full h-full">{children}</div>
          ) : (
            // Other pages use normal padding
            <div className="p-6">{children}</div>
          )}
        </div>
        
  

      </main>
    </div>
  );
}
