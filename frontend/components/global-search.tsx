"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexUser } from "@/hooks/use-convex-user";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Search,
  FileText,
  MessageSquare,
  Calendar,
  GraduationCap,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { SearchSuggestions } from "./search-suggestions";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function GlobalSearch({ isOpen, onClose, initialQuery = "" }: GlobalSearchProps) {
  const { user: convexUser } = useConvexUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [showChatConfirm, setShowChatConfirm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 800); // Increased from 300ms to 800ms for better UX

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus search input when dialog opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Global search results
  const searchResults = useQuery(
    api.search.globalSearch,
    convexUser && debouncedQuery.length >= 3 // Increased from 2 to 3 characters
      ? { userId: convexUser.clerkId, query: debouncedQuery }
      : "skip"
  );

  // Search suggestions
  const suggestions = useQuery(
    api.search.getSearchSuggestions,
    convexUser && searchQuery.length >= 2 // Suggestions start at 2 characters
      ? { userId: convexUser.clerkId, query: searchQuery }
      : "skip"
  );

  const handleResultClick = (type: string, id: string, sessionId?: string) => {
    onClose();
    
    switch (type) {
      case "file":
        router.push(`/dashboard/files?highlight=${id}`);
        break;
      case "chat":
        router.push(`/dashboard/chat/${sessionId}`);
        break;
      case "assignment":
        router.push(`/dashboard/planner?highlight=${id}`);
        break;
      case "course":
        router.push(`/dashboard/planner?course=${id}`);
        break;
      case "event":
        router.push(`/dashboard/planner?event=${id}`);
        break;
    }
  };

  const handleAIChatFallback = () => {
    setShowChatConfirm(true);
  };

  const confirmAIChat = () => {
    setShowChatConfirm(false);
    onClose();
    const newSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    router.push(`/dashboard/chat/${newSessionId}?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const hasResults = searchResults && searchResults.totalResults > 0;
  const isSearching = debouncedQuery.length >= 2 && !searchResults;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Global Search
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search files, chats, assignments, courses..."
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}

              {/* Instant Search Suggestions */}
              <SearchSuggestions
                query={searchQuery}
                isVisible={showSuggestions && searchQuery.length >= 2 && debouncedQuery.length < 3}
                onSelectSuggestion={(item, type) => {
                  setShowSuggestions(false);
                  handleResultClick(type, item._id, item.sessionId);
                }}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 max-h-96">
            {/* Search Suggestions */}
            {searchQuery.length >= 1 && suggestions && suggestions.length > 0 && !hasResults && (
              <div className="px-6 pb-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                  Suggestions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery(suggestion)}
                      className="h-8 text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Searching...</span>
              </div>
            )}

            {/* Search Results */}
            {searchResults && (
              <div className="space-y-4 px-6 pb-6">
                {/* Files */}
                {searchResults.files.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
                      <FileText className="w-4 h-4" />
                      Files ({searchResults.files.length})
                    </h4>
                    <div className="space-y-2">
                      {searchResults.files.map((file) => (
                        <div
                          key={file._id}
                          onClick={() => handleResultClick("file", file._id)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.originalName}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.fileSize)} • {file.category}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Sessions */}
                {searchResults.chatSessions.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
                      <MessageSquare className="w-4 h-4" />
                      Conversations ({searchResults.chatSessions.length})
                    </h4>
                    <div className="space-y-2">
                      {searchResults.chatSessions.map((session) => (
                        <div
                          key={session._id}
                          onClick={() => handleResultClick("chat", session._id, session.sessionId)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {session.title || "Untitled Chat"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(session.lastMessageAt || session.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignments */}
                {searchResults.assignments.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
                      <Calendar className="w-4 h-4" />
                      Assignments ({searchResults.assignments.length})
                    </h4>
                    <div className="space-y-2">
                      {searchResults.assignments.map((assignment) => (
                        <div
                          key={assignment._id}
                          onClick={() => handleResultClick("assignment", assignment._id)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-orange-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{assignment.title}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {assignment.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Courses */}
                {searchResults.courses.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
                      <GraduationCap className="w-4 h-4" />
                      Courses ({searchResults.courses.length})
                    </h4>
                    <div className="space-y-2">
                      {searchResults.courses.map((course) => (
                        <div
                          key={course._id}
                          onClick={() => handleResultClick("course", course._id)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <GraduationCap className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {course.courseCode} - {course.courseName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {course.instructor || "No instructor"} • {course.semester}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Events & Exams */}
                {searchResults.events && searchResults.events.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
                      <Calendar className="w-4 h-4" />
                      Events & Exams ({searchResults.events.length})
                    </h4>
                    <div className="space-y-2">
                      {searchResults.events.map((event) => (
                        <div
                          key={event._id}
                          onClick={() => handleResultClick("event", event._id)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{event.title}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {event.type}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(event.startTime).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {debouncedQuery.length >= 2 && !hasResults && !isSearching && (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground mb-4">
                      We couldn't find anything matching "{debouncedQuery}"
                    </p>
                    <Button onClick={handleAIChatFallback} variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Ask AI instead
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {searchQuery.length === 0 && (
              <div className="text-center py-8 px-6">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Search everything</h3>
                <p className="text-muted-foreground">
                  Find files, conversations, assignments, and courses across your entire workspace
                </p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* AI Chat Confirmation */}
      <AlertDialog open={showChatConfirm} onOpenChange={setShowChatConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start AI Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              No results found for "{searchQuery}". Would you like to start a new conversation with the AI assistant about this topic?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAIChat}>
              Start Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}