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
  MoreHorizontal,
  Calendar,
  Edit3,
  Check,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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
  const updateSession = useMutation(api.chatSessions.updateSession);

  // Filter sessions based on search query and deduplicate by sessionId
  const filteredSessions = chatSessions?.filter((session) =>
    session.title?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Remove duplicates by sessionId, keeping the most recent one
  const uniqueSessions = filteredSessions.reduce((acc, session) => {
    const existingIndex = acc.findIndex(s => s.sessionId === session.sessionId);
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

  // Debug: Log if we found duplicates (remove this later)
  useEffect(() => {
    if (chatSessions && filteredSessions.length !== uniqueSessions.length) {
      console.log(`Found ${filteredSessions.length - uniqueSessions.length} duplicate sessions`);
      console.log('Original sessions:', filteredSessions.map(s => ({ id: s._id, sessionId: s.sessionId, title: s.title })));
      console.log('Unique sessions:', uniqueSessions.map(s => ({ id: s._id, sessionId: s.sessionId, title: s.title })));
    }
  }, [chatSessions, filteredSessions.length, uniqueSessions.length]);

  const handleNewChat = () => {
    const newSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    router.push(`/dashboard/chat/${newSessionId}`);
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/dashboard/chat/${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
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

  const handleRenameSession = (sessionId: string, sessionDbId: string, currentTitle: string, e: React.MouseEvent) => {
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

  // Commented out for now - Schematic generation feature
  // const generateSchematic = async (prompt: string) => {
  //   try {
  //     // Call schematic generation API
  //     const result = await fetch('/api/generate-schematic', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ 
  //         prompt, 
  //         userId: convexUser?.clerkId,
  //         sessionId: currentSessionId 
  //       })
  //     });
  //     return await result.json();
  //   } catch (error) {
  //     console.error('Schematic generation failed:', error);
  //     toast.error('Failed to generate schematic');
  //   }
  // };

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
      {/* Chat Sessions Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300 relative z-10",
          isSidebarOpen ? "w-80 min-w-80" : "w-0 min-w-0 overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Chat History</h2>
            <Button
              onClick={handleNewChat}
              size="sm"
              className="h-8 px-3"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
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
                    {searchQuery ? "No matching conversations" : "No conversations yet"}
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
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group hover:bg-muted/50 w-full",
                        currentSessionId === session.sessionId && "bg-muted border"
                      )}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {editingSessionId === session._id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="h-6 text-sm font-medium p-1 border-primary flex-1"
                              disabled={isUpdating}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && editingTitle.trim()) {
                                  handleRenameSubmit(session.sessionId, session._id);
                                } else if (e.key === 'Escape') {
                                  handleRenameCancel();
                                }
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (editingTitle.trim()) {
                                  handleRenameSubmit(session.sessionId, session._id);
                                }
                              }}
                              disabled={isUpdating || !editingTitle.trim()}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                          <h3 className="font-medium text-sm truncate">
                            {session.title || "Untitled Chat"}
                          </h3>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatSessionTime(session.lastMessageAt || session.createdAt)}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => handleRenameSession(session.sessionId, session._id, session.title || "Untitled Chat", e)}
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteSession(session.sessionId, e)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{sortedUniqueSessions.length} conversations</span>
            <Badge variant="secondary" className="text-xs">
              AI Chat
            </Badge>
          </div>
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      <div className="relative">
        <Button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          variant="ghost"
          size="sm"
          className={cn(
            "fixed top-4 z-50 h-8 w-8 p-0 bg-white/90 dark:bg-black/90 border shadow-sm transition-all duration-300",
            isSidebarOpen ? "left-[18rem]" : "left-2"
          )}
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform",
              !isSidebarOpen && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full min-h-0 relative">
        {currentSessionId ? (
          <ChatInterface
            sessionId={currentSessionId}
            onClose={() => router.push("/dashboard")}
            // Full user context is already available via useConvexUser hook in ChatInterface
            // Schematic feature - commented out for now
            // enableSchematic={true}
            // onSchematicGenerate={(prompt) => generateSchematic(prompt)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
              <p className="text-muted-foreground mb-4">
                Ask questions, get help with your studies, or start a new discussion.
              </p>
              <Button onClick={handleNewChat}>
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}