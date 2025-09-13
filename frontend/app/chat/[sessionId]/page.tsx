"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Bot,
  User,
  Calendar,
  FileText,
  BookOpen,
  Clock,
  TrendingUp,
  Plus,
  Paperclip,
  MoreVertical,
  Settings,
  Archive,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatRequest, ChatResponse } from "@/types/types";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: number;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

export default function ChatSessionPage() {
  const params = useParams();
  const { user } = useUser();
  const sessionId = params.sessionId as string;

  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contextData, setContextData] = useState<Record<string, any>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Convex queries and mutations
  const chatSession = useQuery(
    api.chatSessions.getChatSession,
    user ? { sessionId, userId: user.id } : "skip"
  );
  const chatMessages = useQuery(
    api.chatMessages.getMessages,
    user ? { sessionId } : "skip"
  );
  const userStats = useQuery(
    api.users.getUserStats,
    user ? { userId: user.id } : "skip"
  );
  const upcomingAssignments = useQuery(
    api.assignments.getUpcomingAssignments,
    user ? { userId: user.id } : "skip"
  );
  const upcomingEvents = useQuery(
    api.events.getUpcomingEvents,
    user ? { userId: user.id, days: 7 } : "skip"
  );

  const createChatSession = useMutation(api.chatSessions.createChatSession);
  const addMessage = useMutation(api.chatMessages.addMessage);
  const updateSession = useMutation(api.chatSessions.updateSession);

  // Initialize chat session and context
  useEffect(() => {
    if (user && !chatSession && sessionId) {
      // Create new chat session if it doesn't exist
      createChatSession({
        userId: user.id,
        sessionId,
        title: "Chat Session",
      });
    }
  }, [user, chatSession, sessionId, createChatSession]);

  // Update context data when queries resolve
  useEffect(() => {
    if (userStats && upcomingAssignments && upcomingEvents) {
      setContextData({
        userStats,
        upcomingAssignments,
        upcomingEvents,
        currentDate: new Date().toISOString(),
      });
    }
  }, [userStats, upcomingAssignments, upcomingEvents]);

  // Load chat messages from database
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      const formattedMessages = chatMessages.map((msg: any) => ({
        id: msg._id,
        content: msg.content,
        role: msg.role as "user" | "assistant",
        timestamp: msg.createdAt,
      }));
      setMessages(formattedMessages);
    }
  }, [chatMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to AI API
  const sendMessage = async (messageContent: string) => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: messageContent,
        role: "user",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Save user message to database
      await addMessage({
        sessionId,
        userId: user.id,
        message: messageContent,
        role: "user",
        messageIndex: messages.length,
      });

      // Send to AI API
      const chatRequest: ChatRequest = {
        message: messageContent,
        sessionId,
        context: contextData,
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatRequest),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const aiResponse: ChatResponse = await response.json();

      // Add AI response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.message,
        role: "assistant",
        timestamp: Date.now(),
        suggestions: aiResponse.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSuggestions(aiResponse.suggestions || []);

      // Save AI message to database
      await addMessage({
        sessionId,
        userId: user.id,
        message: aiResponse.message,
        role: "assistant",
        messageIndex: messages.length + 1,
      });

      // Update session
      await updateSession({
        sessionId,
        userId: user.id,
        updates: {
          lastMessageAt: Date.now(),
        },
      });
    } catch (error) {
      console.error("Error sending message:", error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again.",
        role: "assistant",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  // Handle suggestion clicks
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  // Quick action suggestions
  const quickActions = [
    {
      icon: Calendar,
      label: "Check schedule",
      action: "What's on my schedule today?",
    },
    {
      icon: FileText,
      label: "Assignments due",
      action: "What assignments are due this week?",
    },
    {
      icon: BookOpen,
      label: "Study help",
      action: "Help me create a study plan",
    },
    {
      icon: TrendingUp,
      label: "GPA progress",
      action: "How is my GPA doing this semester?",
    },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please sign in to access chat.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/logo-only.png" />
                <AvatarFallback>
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-semibold">EduBox AI Assistant</h1>
                <p className="text-sm text-muted-foreground">
                  Your academic companion
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Session: {sessionId.slice(0, 8)}...
              </Badge>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">
                  Welcome to EduBox AI! 👋
                </h2>
                <p className="text-muted-foreground mb-6">
                  I'm here to help you manage your academic life. Ask me
                  anything!
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSuggestionClick(action.action)}
                      className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                    >
                      <action.icon className="h-5 w-5 text-primary mb-2" />
                      <p className="text-sm font-medium">{action.label}</p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src="/logo-only.png" />
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "max-w-[80%] p-3 rounded-lg",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground ml-12"
                        : "bg-muted"
                    )}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={user.imageUrl} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src="/logo-only.png" />
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-bounce h-2 w-2 bg-current rounded-full"></div>
                    <div
                      className="animate-bounce h-2 w-2 bg-current rounded-full"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="animate-bounce h-2 w-2 bg-current rounded-full"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="border-t p-4">
            <p className="text-sm text-muted-foreground mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4">
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 max-w-4xl mx-auto"
          >
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your academics..."
                className="min-h-[60px] pr-12 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 bottom-2 h-8 w-8 p-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-[60px] px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l bg-card/50 p-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active Courses</span>
              <span className="font-medium">
                {userStats?.activeCourses || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pending Tasks</span>
              <span className="font-medium">
                {upcomingAssignments?.length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">This Week</span>
              <span className="font-medium">
                {upcomingEvents?.length || 0} events
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingAssignments?.slice(0, 3).map((assignment: any) => (
              <div
                key={assignment._id}
                className="text-sm p-2 rounded bg-muted/50"
              >
                <p className="font-medium truncate">{assignment.title}</p>
                <p className="text-xs text-muted-foreground">
                  Due {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
              </div>
            ))}
            {(!upcomingAssignments || upcomingAssignments.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming assignments
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
