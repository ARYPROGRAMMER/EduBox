"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlobalSearch } from "@/components/global-search";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useFeatureGate } from "@/components/feature-gate";
import { FeatureFlag } from "@/features/flag";
import { NotificationBell } from "@/components/notification-bell";

interface DashboardHeaderProps {
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
  mounted?: boolean;
}

export function DashboardHeader({
  isSidebarOpen = true,
  setIsSidebarOpen = () => {},
  mounted: mountedProp = false,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(mountedProp);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Check if user can access advanced search
  const { canUse: canUseAdvancedSearch } = useFeatureGate(
    FeatureFlag.ADVANCED_SEARCH
  );

  useEffect(() => {
    setMounted(true);

    // Add global keyboard shortcut for search (only if user has access)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k" && canUseAdvancedSearch) {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [canUseAdvancedSearch]);

  const handleSearchClick = () => {
    if (canUseAdvancedSearch) {
      setShowGlobalSearch(true);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canUseAdvancedSearch) {
      e.preventDefault();
      setShowGlobalSearch(true);
    }
  };

  return (
    <header
      className="h-16  top-0 z-30 flex items-center justify-between
      bg-transparent"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 mix-blend-overlay" />

      <div className="flex justify-center z-10">
        {canUseAdvancedSearch && (
          <div className="relative hidden md:block">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="flex items-center"
            >
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onClick={handleSearchClick}
                placeholder="Search files, notes, AI..."
                className="pl-9 pr-16 w-72 md:w-96 bg-white/40 dark:bg-slate-800/40 border border-transparent focus:border-slate-200 dark:focus:border-slate-600 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-200 cursor-pointer"
                aria-label="Search"
                readOnly
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-muted/50">
                ⌘K
              </div>
            </motion.div>
          </div>
        )}

        {/* mobile search icon */}
        {canUseAdvancedSearch && (
          <div className="md:hidden flex items-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSearchClick}
              aria-label="Open search"
              className="p-2 rounded-lg"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* right actions */}
      <div className="flex items-center gap-3 z-10">
        <NotificationBell />
        <Button
          size="sm"
          className="hidden sm:inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md rounded-lg"
          onClick={() => router.push("/manage-plan")}
        >
          Manage Plan
        </Button>
      </div>

      {/* Mobile search panel */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-4 right-4 top-full z-30 bg-white/30 dark:bg-slate-900/40 backdrop-blur-lg border border-slate-200/10 dark:border-slate-700/20 p-3 rounded-xl md:hidden"
          >
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 w-full bg-white/20 dark:bg-slate-800/30 rounded-lg"
              />
              <button
                onClick={() => setShowMobileSearch(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded"
                aria-label="Close search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        initialQuery={searchValue}
      />
    </header>
  );
}
