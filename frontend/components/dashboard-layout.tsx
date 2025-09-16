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
  Menu,
  X,
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
import { AnimatePresence, motion } from "framer-motion";
import ShaderBackground from "./shader_background";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Shared hash helper (deterministic-ish quick hash for change detection)
function hashFnv32(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return (h >>> 0).toString(16);
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { user: convexUser } = useConvexUser();

  const autoUserContext = useQuery(
    api.userContext.getUserContext,
    convexUser ? { userId: convexUser.clerkId } : "skip"
  );

  const getSyncEndpoint = () =>
    (process.env.NEXT_PUBLIC_NUCLIA_SYNC_URL || "") +
    (process.env.NEXT_PUBLIC_NUCLIA_SYNC_URL ? "/sync" : "/api/nuclia/sync");

  React.useEffect(() => {
    try {
      const userId = convexUser?.clerkId || convexUser?.id;
      if (!userId || !autoUserContext) return;

      const key = `edubox:last_autosync:${userId}`;
      const hashKey = `edubox:last_autosync_hash:${userId}`;
      const last = Number(localStorage.getItem(key) || 0);
      const now = Date.now();

      // Compute a quick stable hash of the serialized context
      const normalized = JSON.stringify(autoUserContext);
      const newHash = hashFnv32(normalized);
      const prevHash = localStorage.getItem(hashKey) || null;

      // If nothing changed, just update the last-touch timestamp and return
      if (prevHash === newHash) {
        localStorage.setItem(key, String(now));
        return;
      }

      // Avoid syncing too frequently: skip if we synced very recently
      if (now - last < 30 * 1000) {
        // leave hash alone so next real change will trigger
        return;
      }

      (async () => {
        try {
          const resp = await fetch(getSyncEndpoint(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, payload: autoUserContext }),
          });
          if (resp && resp.ok) {
            localStorage.setItem(hashKey, newHash);
            localStorage.setItem(key, String(now));
            console.debug("auto-sync enqueued/started", { userId });
          } else {
            // even on failure, record attempt time to avoid tight loops
            localStorage.setItem(key, String(now));
            console.debug("auto-sync response not ok", { status: resp.status });
          }
        } catch (e) {
          console.debug("auto-sync failed", e);
          localStorage.setItem(key, String(now));
        }
      })();
    } catch (e) {
      // swallow - don't break the app UI
    }
  }, [convexUser, autoUserContext]);
  const { signOut } = useAuth();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [prevSidebarOpen, setPrevSidebarOpen] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);

    const isChatRoute = pathname?.startsWith("/dashboard/chat");

    setIsSidebarOpen(window.innerWidth >= 1024 && !isChatRoute);

    const onResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pathname]);

  const isChatActive = pathname?.startsWith("/dashboard/chat");

  const prevIsChatRef = useRef<boolean | null>(null);

  useEffect(() => {
    const prevIsChat = prevIsChatRef.current;

    if (prevIsChat === null) {
      prevIsChatRef.current = !!isChatActive;
      return;
    }

    if (!prevIsChat && isChatActive) {
      setPrevSidebarOpen((prev) => (prev === null ? isSidebarOpen : prev));
      setIsSidebarOpen(false);
    } else if (prevIsChat && !isChatActive) {
      if (prevSidebarOpen !== null) {
        setIsSidebarOpen(prevSidebarOpen);
        setPrevSidebarOpen(null);
      }
    }

    prevIsChatRef.current = !!isChatActive;
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

  const sidebarWidth = isSidebarOpen ? 280 : 80;

  return (
    <ShaderBackground>
      <div className="flex h-screen bg-gradient-to-br from-gray-50/70 to-gray-100/70 dark:from-gray-950/70 dark:to-gray-900/70 relative backdrop-blur-sm">
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

        {/* Mobile visible toggle button (top-left) */}
        <div className="lg:hidden fixed top-4 left-4 z-[60]">
          {!isSidebarOpen && (
            <button
              type="button"
              onClick={() => {
                console.debug("mobile toggle clicked - prev:", isSidebarOpen);
                setIsSidebarOpen((s) => !s);
              }}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              className="p-3 md:p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-lg active:scale-95"
            >
              <Menu className="w-6 h-6 text-slate-700 dark:text-slate-200" />
            </button>
          )}
        </div>

        {/* Mobile slide-in panel for sidebar content */}
        {mounted && isSidebarOpen && (
          <AnimatePresence>
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-white dark:bg-slate-900 shadow-xl lg:hidden"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/70 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
                    <Image
                      src="/logo-only.png"
                      alt="Logo"
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      EduBox
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      AI Digital Locker
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    console.debug("mobile close clicked");
                    setIsSidebarOpen(false);
                  }}
                  aria-label="Close menu"
                  className="p-2"
                >
                  <X className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                </button>
              </div>

              <ScrollArea className="px-3 py-4">
                <div className="space-y-2">
                  {navItems.map((item) => {
                    const active =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname?.startsWith(item.href);

                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <motion.div whileHover={{ scale: 1.03 }}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full h-12 rounded-xl flex items-center justify-start px-4",
                              active
                                ? `bg-gradient-to-r ${activeGradient} text-white shadow-md`
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/40 dark:hover:bg-slate-800/40"
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-5 h-5",
                                active && "text-white",
                                "mr-3"
                              )}
                            />
                            <span className="font-medium">{item.name}</span>
                          </Button>
                        </motion.div>
                      </Link>
                    );
                  })}

                  {premiumNavItems.map((item) => {
                    const active = pathname?.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <motion.div whileHover={{ scale: 1.03 }}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full h-12 rounded-xl flex items-center justify-start px-4",
                              active
                                ? `bg-gradient-to-r ${activeGradient} text-white shadow-md`
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/40 dark:hover:bg-slate-800/40"
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-5 h-5",
                                active && "text-white",
                                "mr-3"
                              )}
                            />
                            <span className="font-medium flex-1 text-left">
                              {item.name}
                            </span>
                            <Crown className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white/30 dark:bg-slate-800/30">
                {mounted && (
                  <div className="flex items-center gap-3 p-2 rounded-xl">
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
              </div>
            </motion.aside>
          </AnimatePresence>
        )}

        {/* Sidebar (not draggable) */}
        <aside
          className={cn(
            // hide desktop sidebar on small screens, only show on large (lg)
            "hidden lg:flex fixed left-0 top-0 z-30 h-full flex-col border-r backdrop-blur-xl",
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
          <div
            className={cn(
              "border-t border-slate-200 dark:border-slate-700 p-3 bg-white/30 dark:bg-slate-800/30",
              // ensure no horizontal overflow when collapsed
              !isSidebarOpen && "px-2"
            )}
          >
            {mounted && (
              <div
                className={cn(
                  // row when open, column when collapsed
                  "flex items-center",
                  isSidebarOpen ? "flex-row" : "flex-col"
                )}
              >
                {/* avatar (always visible) */}
                <div
                  className={cn(
                    "flex-shrink-0 rounded-full overflow-hidden",
                    isSidebarOpen
                      ? "p-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                      : "p-1 mt-1"
                  )}
                >
                  <UserButton
                    appearance={{
                      baseTheme: theme === "dark" ? clerkDark : undefined,
                      // smaller avatar when collapsed
                      elements: {
                        avatarBox: isSidebarOpen ? "w-10 h-10" : "w-8 h-8",
                      },
                    }}
                  />
                </div>

                {/* name/email (only when expanded) */}
                {isSidebarOpen && (
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {user?.fullName || "Student"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user?.primaryEmailAddress?.emailAddress ||
                        "student@edu.com"}
                    </p>
                  </div>
                )}

                <div
                  className={cn(
                    isSidebarOpen
                      ? "ml-auto flex items-center gap-2"
                      : "w-full flex flex-col items-center gap-2 mt-3"
                  )}
                >
                  <ManualSyncButton convexUser={convexUser} />

                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg hover:bg-slate-100/40 dark:hover:bg-slate-700/40"
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
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

                    {/* align menu to the end on expanded sidebar, start on collapsed to avoid off-screen rendering */}
                    <DropdownMenuContent
                      align={isSidebarOpen ? "end" : "start"}
                      className="w-56"
                    >
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
          // floating toggle only for large screens
          className="hidden lg:flex absolute top-1/2 z-40 flex-col gap-2"
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
            // only apply a left margin on large screens where the sidebar is visible
            marginLeft:
              mounted &&
              typeof window !== "undefined" &&
              window.innerWidth >= 1024
                ? sidebarWidth
                : 0,
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
              <div className="w-full h-full">{children}</div>
            ) : (
              <div className="p-6">{children}</div>
            )}
          </div>
        </main>
      </div>
    </ShaderBackground>
  );
}

function ManualSyncButton({ convexUser }: { convexUser: any }) {
  const [loading, setLoading] = React.useState(false);
  const userId = convexUser?.clerkId || convexUser?.id || null;

  const userContext = useQuery(
    api.userContext.getUserContext,
    userId ? { userId } : "skip"
  );

  const handleManualSync = async () => {
    if (!userId) return toast.error("No user id available for sync");
    setLoading(true);
    try {
      const resp = await fetch(
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
        // record last successful sync hash and timestamp so autosync won't re-send
        try {
          const normalized = JSON.stringify(userContext || {});
          const newHash =
            hashFnv32 && typeof hashFnv32 === "function"
              ? hashFnv32(normalized)
              : null;
          const key = `edubox:last_autosync:${userId}`;
          const hashKey = `edubox:last_autosync_hash:${userId}`;
          const now = Date.now();
          if (newHash) localStorage.setItem(hashKey, newHash);
          localStorage.setItem(key, String(now));
        } catch (e) {}
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
