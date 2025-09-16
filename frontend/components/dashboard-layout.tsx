"use client";

import { useConvexUser } from "@/hooks/use-convex-user";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

import React, { useEffect, useState, useRef } from "react";
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
  GraduationCap,
  Plus,
  Building,
  Cloud,
  Lock,
  Crown,
  Upload,
} from "lucide-react";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { user: convexUser } = useConvexUser();
  // Auto-enqueue background sync when userContext is available (throttled)
  const autoUserContext = useQuery(
    api.userContext.getUserContext,
    convexUser ? { userId: convexUser.clerkId } : "skip"
  );

  React.useEffect(() => {
    try {
      // Always call the frontend proxy so the server can rebuild the authoritative payload
      const getSyncEndpoint = () => {
        return "/api/nuclia/sync";
      };
      const userId = convexUser?.clerkId || convexUser?.id;
      if (!userId || !autoUserContext) return;
      const key = `edubox:last_autosync:${userId}`;
      const last = Number(localStorage.getItem(key) || 0);
      const now = Date.now();
      // throttle: only auto-sync once every 10 minutes
      if (now - last < 1000 * 60 * 10) return;

      // Only auto-sync when the context actually changed. Compute a small stable hash
      // of the context JSON to avoid sending unchanged payloads. Use FNV-1a 32-bit.
      const hashFnv32 = (str: string) => {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
          h ^= str.charCodeAt(i);
          h =
            (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
        }
        return (h >>> 0).toString(16);
      };

      try {
        const normalized = JSON.stringify(autoUserContext);
        const newHash = hashFnv32(normalized);
        const hashKey = `edubox:last_autosync_hash:${userId}`;
        const prevHash = localStorage.getItem(hashKey) || null;
        if (prevHash === newHash) {
          // update throttle timestamp to avoid retrying too often
          localStorage.setItem(key, String(now));
          return;
        }

        // non-blocking enqueue to the frontend proxy which will build the authoritative payload
        const getSyncEndpoint = () => "/api/nuclia/sync";

        (async () => {
          try {
            // Only send userId; server will reconstruct the authoritative payload
            const resp = await fetch(getSyncEndpoint(), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            });
            if (resp && resp.ok) {
              localStorage.setItem(hashKey, newHash);
              localStorage.setItem(key, String(now));
            } else {
              // still update throttle to avoid spamming; we can retry via manual sync
              localStorage.setItem(key, String(now));
            }
          } catch (e) {
            // ignore auto-sync network errors
            console.debug("auto-sync failed", e);
            localStorage.setItem(key, String(now));
          }
        })();
      } catch (e) {
        // If JSON.stringify or hashing fails, fall back to simple send once
        (async () => {
          try {
            await fetch(getSyncEndpoint(), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, payload: autoUserContext }),
            });
            localStorage.setItem(key, String(now));
          } catch (e) {
            console.debug("auto-sync failed fallback", e);
          }
        })();
      }
    } catch (e) {
      // swallow
    }
  }, [convexUser, autoUserContext]);
  const { signOut } = useAuth();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Keep previous open state so we can restore it after leaving chat
  const [prevSidebarOpen, setPrevSidebarOpen] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);

    // Compute whether the chat subroutes are active (exact to dashboard/chat)
    const isChatRoute = pathname?.startsWith("/dashboard/chat");

    setIsSidebarOpen(window.innerWidth >= 1024 && !isChatRoute);

    const onResize = () => {
      // Resize should update sidebar openness based on viewport width.
      // We no longer block reopening on chat pages so users can open the
      // sidebar manually or by resizing to a wide viewport.
      setIsSidebarOpen(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // We intentionally don't include isChatRoute here because it's derived
    // from pathname which is already in deps. Keep pathname as the dep.
  }, [pathname]);

  // If the Ask AI/chat pages are active we want the sidebar hidden immediately
  // (no animation) to provide a full-width chat experience. Derive this flag
  // from the pathname so changes are reactive to navigation.
  // Only treat routes under /dashboard/chat as chat-active. This avoids
  // false-positives from other parts of the site that might include "chat"
  // in their path.
  const isChatActive = pathname?.startsWith("/dashboard/chat");

  // Track previous chat-active state so we only run the enter/leave logic on
  // actual route transitions. This prevents user toggles while on a chat
  // route from being overridden by the effect.
  const prevIsChatRef = useRef<boolean | null>(null);

  useEffect(() => {
    const prevIsChat = prevIsChatRef.current;

    // If previous is null, this is the initial mount — handle initial
    // landing on the chat page via the mount logic above (so skip here).
    if (prevIsChat === null) {
      prevIsChatRef.current = !!isChatActive;
      return;
    }

    // Only run when there's an actual transition (entering or leaving chat)
    if (!prevIsChat && isChatActive) {
      // Entering chat: save previous state and close
      setPrevSidebarOpen((prev) => (prev === null ? isSidebarOpen : prev));
      setIsSidebarOpen(false);
    } else if (prevIsChat && !isChatActive) {
      // Leaving chat: restore if we previously saved a state
      if (prevSidebarOpen !== null) {
        setIsSidebarOpen(prevSidebarOpen);
        setPrevSidebarOpen(null);
      }
    }

    prevIsChatRef.current = !!isChatActive;
    // Intentionally excluding isSidebarOpen and prevSidebarOpen from deps to
    // avoid re-running when they change due to user toggles; we're only
    // interested in pathname transitions which update isChatActive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatActive]);

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: Home },
    { name: "Files", href: "/dashboard/files", icon: FolderOpen },
    { name: "Planner", href: "/dashboard/planner", icon: Calendar },
    { name: "Life Hub", href: "/dashboard/life-hub", icon: Users },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Ask AI", href: "/dashboard/chat", icon: MessageSquare },
  ];

  const premiumNavItems = [
    {
      name: "AI Study Assistant",
      href: "/dashboard/ai-study-assistant",
      icon: GraduationCap,
      premium: true,
    },
    {
      name: "AI Content Generation",
      href: "/dashboard/ai-content-generation",
      icon: Plus,
      premium: true,
    },
    // {
    //   name: "Campus Integration",
    //   href: "/dashboard/campus-integration",
    //   icon: Building,
    //   premium: true,
    // },
    // {
    //   name: "Collaboration Hub",
    //   href: "/dashboard/collaboration",
    //   icon: Users,
    //   premium: true,
    // },
    // {
    //   name: "Cloud Storage Sync",
    //   href: "/dashboard/cloud-storage",
    //   icon: Cloud,
    //   premium: true,
    // },
    {
      name: "Data Import/Export",
      href: "/dashboard/import-export",
      icon: Upload,
      premium: true,
    },
  ];

  const activeGradient =
    mounted && theme === "dark"
      ? "from-slate-700/80 via-slate-800/80 to-slate-900/80"
      : "from-emerald-500/80 via-teal-600/80 to-green-600/80";

  // Use exact pixel widths so main content margin matches sidebar width precisely
  // When the chat is active, force the sidebar to its collapsed width (80)
  // immediately by skipping the transition on width/margin.
  const sidebarWidth = isSidebarOpen ? 280 : 80;

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 relative">
      {/* subtle spotlight gradient - changed to neutral */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-400/5 via-transparent to-transparent dark:from-gray-500/5" />

      {/* overlay for mobile */}
      {mounted && isSidebarOpen && !isChatActive && (
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
        style={{
          width: sidebarWidth,
          transition: isChatActive ? "none" : "width 300ms ease",
        }}
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
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  EduBox
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AI Digital Locker
                </p>
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
                        isSidebarOpen
                          ? "justify-start px-4"
                          : "justify-center px-0",
                        active
                          ? `bg-gradient-to-r ${activeGradient} text-white shadow-md`
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/40 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          active && "text-white",
                          isSidebarOpen && "mr-3"
                        )}
                      />
                      {isSidebarOpen && (
                        <span className="font-medium">{item.name}</span>
                      )}
                    </Button>
                  </motion.div>
                </Link>
              );
            })}

            {/* Premium Features Section */}
            {isSidebarOpen && (
              <div className="mt-6 mb-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4">
                  Premium Features
                </p>
              </div>
            )}

            {premiumNavItems.map((item) => {
              const active = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div whileHover={{ scale: 1.03 }}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full h-12 rounded-xl flex items-center",
                        isSidebarOpen
                          ? "justify-start px-4"
                          : "justify-center px-0",
                        active
                          ? `bg-gradient-to-r ${activeGradient} text-white shadow-md`
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/40 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          active && "text-white",
                          isSidebarOpen && "mr-3"
                        )}
                      />
                      {isSidebarOpen && (
                        <>
                          <span className="font-medium flex-1 text-left">
                            {item.name}
                          </span>
                          <Crown className="w-4 h-4" />
                        </>
                      )}
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
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {user?.fullName || "Student"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user?.primaryEmailAddress?.emailAddress ||
                        "student@edu.com"}
                    </p>
                  </div>
                </div>
              )}
              {/* Manual sync button for userContext -> knowledge base */}
              <div className="flex items-center gap-2">
                <ManualSyncButton convexUser={convexUser} />
              </div>

              <div className="flex justify-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg hover:bg-slate-100/40 dark:hover:bg-slate-700/40"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-lg hover:bg-slate-100/40 dark:hover:bg-slate-700/40"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/profile"
                        className="cursor-pointer"
                      >
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
        style={{
          marginLeft: sidebarWidth,
          transition: "margin-left 300ms ease",
        }}
      >
        {/* <DashboardHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} mounted={mounted} /> */}

        <div
          className={cn(
            "flex-1 h-full",
            pathname?.startsWith("/dashboard/chat")
              ? "flex w-full"
              : "overflow-auto"
          )}
        >
          {pathname?.startsWith("/dashboard/chat") ? (
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

// ManualSyncButton: small client component that posts the current userContext to backend
function ManualSyncButton({ convexUser }: { convexUser: any }) {
  const [loading, setLoading] = React.useState(false);
  const userId = convexUser?.clerkId || convexUser?.id || null;

  // Fetch the userContext via Convex query (client side)
  const userContext = useQuery(
    api.userContext.getUserContext,
    userId ? { userId } : "skip"
  );

  const handleManualSync = async () => {
    if (!userId) return toast.error("No user id available for sync");
    setLoading(true);
    try {
      const resp = await fetch(
        // Use environment variable fallback to same host if not set
        (process.env.NEXT_PUBLIC_NUCLIA_SYNC_URL || "") +
          (process.env.NEXT_PUBLIC_NUCLIA_SYNC_URL
            ? "/sync/manual"
            : "/api/nuclia/sync/manual"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, payload: userContext || {} }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(
          "Sync failed: " + (err?.error || resp.statusText || resp.status)
        );
      } else {
        const data = await resp.json().catch(() => ({}));
        toast.success("Manual sync started");
      }
    } catch (e) {
      console.error("Manual sync error", e);
      toast.error("Manual sync request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleManualSync}
      disabled={loading || !userId}
      title={
        userId
          ? "Sync your context to knowledge base"
          : "Sign in to enable sync"
      }
    >
      {loading ? (
        <Upload className="w-4 h-4 animate-pulse" />
      ) : (
        <Upload className="w-4 h-4" />
      )}
    </Button>
  );
}
