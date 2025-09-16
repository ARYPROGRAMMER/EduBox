"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexUser } from "@/hooks/use-convex-user";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ButtonLoader } from "@/components/ui/loader";
import { ChatInterface } from "@/components/chat-interface-convex";
import { cn } from "@/lib/utils";
import {
  Plus,
  MessageSquare,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import dynamic from "next/dynamic";

// Dynamically import the PulsingBorderShader to defer loading until needed
const PulsingBorderShader = dynamic(() => import("./CircleWithPulse"), {
  ssr: false,
  loading: () => (
    <div className="w-[535px] h-[511px] bg-muted/20 rounded-md animate-pulse mx-auto mb-6" />
  ),
});

interface ChatLayoutProps {
  children?: React.ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
  const { user: convexUser } = useConvexUser();
  const router = useRouter();
  const params = useParams();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const currentSessionId = params.sessionId as string;

  // Get all chat sessions for the user
  const chatSessions = useQuery(
    api.chatSessions.getChatSessions,
    convexUser ? { userId: convexUser.clerkId } : "skip"
  );

  // Get current session if we have a sessionId (with latest data)
  const currentSession = useQuery(
    api.chatSessions.getChatSession,
    convexUser && currentSessionId
      ? { sessionId: currentSessionId, userId: convexUser.clerkId }
      : "skip"
  );

  // Ensure we have the latest user data for AI context
  const refreshedUserData = useQuery(
    api.users.getUserByClerkId,
    convexUser ? { clerkId: convexUser.clerkId } : "skip"
  );

  const deleteSession = useMutation(api.chatSessions.deleteSession);
  const deleteSessions = useMutation(api.chatSessions.deleteSessions);
  const deleteAllSessions = useMutation(api.chatSessions.deleteAllSessions);
  const updateSession = useMutation(api.chatSessions.updateSession);

  // Filter sessions based on search query and deduplicate by sessionId
  const filteredSessions =
    chatSessions?.filter((session) =>
      session.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  // Remove duplicates by sessionId, keeping the most recent one
  const uniqueSessions = filteredSessions.reduce((acc, session) => {
    const existingIndex = acc.findIndex(
      (s) => s.sessionId === session.sessionId
    );
    if (existingIndex >= 0) {
      // Keep the one with the most recent lastMessageAt or createdAt
      const existing = acc[existingIndex];
      const sessionTime = session.lastMessageAt || session.createdAt;
      const existingTime = existing.lastMessageAt || existing.createdAt;
      if (sessionTime > existingTime) {
        acc[existingIndex] = session;
      }
    } else {
      acc.push(session);
    }
    return acc;
  }, [] as typeof filteredSessions);

  // Sort by most recent activity
  const sortedUniqueSessions = uniqueSessions.sort((a, b) => {
    const aTime = a.lastMessageAt || a.createdAt;
    const bTime = b.lastMessageAt || b.createdAt;
    return bTime - aTime;
  });

  // Removed debug logging: duplicate session diagnostics were noisy in console
  useEffect(() => {
    // Intentionally left blank: duplicate-session detection retained for potential future use.
    // If needed, re-enable logging here with caution.
  }, [chatSessions, filteredSessions.length, uniqueSessions.length]);

  // toggle positioning is handled by absolute positioning inside the sidebar container

  const handleNewChat = () => {
    const newSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    router.push(`/dashboard/chat/${newSessionId}`);
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/dashboard/chat/${sessionId}`);
  };

  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    if (!convexUser) return;

    try {
      await deleteSession({
        sessionId,
        userId: convexUser.clerkId,
      });

      // If we're deleting the current session, redirect to new chat
      if (sessionId === currentSessionId) {
        router.push("/dashboard/chat");
      }

      toast.success("Chat session deleted");
    } catch (error) {
      console.error("Failed to delete session:", error);
      toast.error("Failed to delete session");
    }
  };

  const toggleSelectSession = (sessionId: string, checked?: boolean) => {
    setSelectedSessions((prev) => {
      const has = prev.includes(sessionId);
      if (typeof checked === "boolean") {
        if (checked && !has) return [...prev, sessionId];
        if (!checked && has) return prev.filter((s) => s !== sessionId);
        return prev;
      }
      if (has) return prev.filter((s) => s !== sessionId);
      return [...prev, sessionId];
    });
  };

  const handleDeleteSelected = async () => {
    if (!convexUser || selectedSessions.length === 0) return;
    if (
      !confirm(
        `Delete ${selectedSessions.length} selected conversation(s)? This cannot be undone.`
      )
    )
      return;

    setIsBulkDeleting(true);
    try {
      await deleteSessions({
        sessionIds: selectedSessions,
        userId: convexUser.clerkId,
      });
      setSelectedSessions([]);
      // If current session was deleted, navigate away
      if (currentSessionId && selectedSessions.includes(currentSessionId)) {
        router.push("/dashboard/chat");
      }
      toast.success("Selected conversations deleted");
    } catch (error) {
      console.error("Failed to delete selected sessions:", error);
      toast.error("Failed to delete selected conversations");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!convexUser) return;
    if (
      !confirm(
        "Delete ALL conversations and their messages? This cannot be undone."
      )
    )
      return;

    setIsBulkDeleting(true);
    try {
      await deleteAllSessions({ userId: convexUser.clerkId });
      setSelectedSessions([]);
      router.push("/dashboard/chat");
      toast.success("All conversations deleted");
    } catch (error) {
      console.error("Failed to delete all sessions:", error);
      toast.error("Failed to delete all conversations");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleRenameSession = (
    sessionId: string,
    sessionDbId: string,
    currentTitle: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditingSessionId(sessionDbId); // Use database ID for uniqueness
    setEditingTitle(currentTitle);
  };

  const handleRenameSubmit = async (sessionId: string, sessionDbId: string) => {
    if (!convexUser || !editingTitle.trim() || isUpdating) return;

    setIsUpdating(true);

    try {
      await updateSession({
        sessionId,
        userId: convexUser.clerkId,
        updates: {
          title: editingTitle.trim(),
        },
      });

      toast.success("Session renamed successfully");
      setEditingSessionId(null);
      setEditingTitle("");
    } catch (error) {
      console.error("Failed to rename session:", error);
      toast.error("Failed to rename session");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRenameCancel = () => {
    setEditingSessionId(null);
    setEditingTitle("");
    setIsUpdating(false);
  };

  const formatSessionTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  if (!convexUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-background relative overflow-hidden">
      {/* <div
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
      </div> */}

      {/* Chat Sessions Sidebar */}

      <div
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300 relative z-10",
          isSidebarOpen ? "w-90 min-w-90" : "w-0 min-w-0 overflow-visible"
        )}
      >
        {/* Toggle that sticks to the sidebar border */}
        <Button
          onClick={() => setIsSidebarOpen((s) => !s)}
          variant="ghost"
          size="sm"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          className={cn(
            isSidebarOpen
              ? "absolute right-[-22px] top-[45%] z-40 h-9 w-9 p-2 bg-black text-white border border-slate-800 rounded-full shadow-lg hover:shadow-xl transition"
              : "fixed left-[64px] top-[45%] z-50 h-9 w-9 p-2 bg-black text-white border border-slate-800 rounded-full shadow-lg hover:shadow-xl transition"
          )}
          style={{ transform: "translateY(-50%)" }}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-4 h-4 text-white" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white" />
          )}
        </Button>
        <div
          className={cn(
            "w-full flex flex-col h-full transition-opacity duration-200 ease-in-out",
            isSidebarOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          )}
        >
          <div className="p-2 border-b bg-muted/50">
            <div className="flex items-center justify-between mb-3 mt-1 ml-2">
              <h2 className="font-semibold text-md">Chat History</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleDeleteSelected}
                  disabled={selectedSessions.length === 0 || isBulkDeleting}
                  title={
                    selectedSessions.length
                      ? `Delete ${selectedSessions.length} selected`
                      : "Delete selected"
                  }
                  aria-label="Delete selected conversations"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 py-0 flex items-center gap-1 text-destructive"
                  onClick={handleDeleteAll}
                  disabled={isBulkDeleting}
                  title="Delete all conversations"
                  aria-label="Delete all conversations"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <span className="text-xs text-destructive">All</span>
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8"
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1 flex flex-col">
                {sortedUniqueSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {searchQuery
                        ? "No matching conversations"
                        : "No conversations yet"}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={handleNewChat}
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                      >
                        Start your first chat
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col space-y-1">
                    {sortedUniqueSessions.map((session) => (
                      <div
                        key={session._id}
                        onClick={() => handleSessionClick(session.sessionId)}
                        className={cn(
                          "relative flex items-center gap-3 py-3 px-4 pr-8 rounded-lg cursor-pointer transition-colors group hover:bg-muted/50 w-full",
                          currentSessionId === session.sessionId &&
                            "bg-muted border"
                        )}
                      >
                        <div className="flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedSessions.includes(
                                session.sessionId
                              )}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={(v) => {
                                // Radix returns boolean or 'indeterminate'
                                const checked = v === true;
                                toggleSelectSession(session.sessionId, checked);
                              }}
                              className="mr-1"
                            />
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <MessageSquare className="w-4 h-4 text-primary-foreground" />
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 pr-12 relative">
                          {editingSessionId === session._id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingTitle}
                                onChange={(e) =>
                                  setEditingTitle(e.target.value)
                                }
                                className="h-6 text-sm font-medium p-1 border-primary flex-1"
                                disabled={isUpdating}
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    editingTitle.trim()
                                  ) {
                                    handleRenameSubmit(
                                      session.sessionId,
                                      session._id
                                    );
                                  } else if (e.key === "Escape") {
                                    handleRenameCancel();
                                  }
                                }}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (editingTitle.trim()) {
                                    handleRenameSubmit(
                                      session.sessionId,
                                      session._id
                                    );
                                  }
                                }}
                                disabled={isUpdating || !editingTitle.trim()}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6  text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameCancel();
                                }}
                                disabled={isUpdating}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <h3 className="font-medium text-sm whitespace-normal break-words">
                              {session.title || "Untitled Chat"}
                            </h3>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatSessionTime(
                                session.lastMessageAt || session.createdAt
                              )}
                            </span>
                          </div>

                          {editingSessionId !== session._id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 absolute right-2 top-1/2 -translate-y-1/2 z-10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) =>
                                    handleRenameSession(
                                      session.sessionId,
                                      session._id,
                                      session.title || "Untitled Chat",
                                      e
                                    )
                                  }
                                >
                                  <Edit3 className="w-4 h-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) =>
                                    handleDeleteSession(session.sessionId, e)
                                  }
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer */}
          {/* Footer */}
          <div className="p-4 border-t bg-muted/50">
            <div className="flex items-center justify-between gap-3">
              <div
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-muted/60 border text-xs text-muted-foreground cursor-default"
                aria-label="conversations-count"
              >
                <span className="font-medium">
                  {sortedUniqueSessions.length} conversations
                </span>
              </div>

              <div className="flex-shrink-0">
                <Button
                  onClick={handleNewChat}
                  size="sm"
                  className="h-8 px-3"
                  aria-label="new-conversation"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full min-h-0 relative">
        {currentSessionId ? (
          <ChatInterface
            sessionId={currentSessionId}
            onClose={() => router.push("/dashboard/chat")}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center text-center max-w-md">
              <div  className="relative w-[560px] h-[560px] mb-8 flex items-center justify-center animate-[breathe_4s_ease-in-out_infinite]" >
                <PulsingBorderShader className="absolute inset-0" size={560} />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Start a conversation
              </h3>
              <p className="text-muted-foreground mb-4">
                Ask questions, get help with your studies, or start a new
                discussion.
              </p>
              <Button onClick={handleNewChat}>
                <Plus className="w-4 h-4 mr-2" /> New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
