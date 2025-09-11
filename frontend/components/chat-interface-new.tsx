"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ButtonLoader, Loader } from "@/components/ui/loader";
import {
  Send,
  Bot,
  User,
  Lightbulb,
  Clock,
  BookOpen,
  Calendar,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ChatInterfaceProps {
  onClose: () => void;
  sessionId?: string;
}

const quickSuggestions = [
  "What's due tomorrow?",
  "Find my biology notes from last week",
  "Do I have time to hit the gym before physics class?",
  "What's for lunch today?",
  "When is the next photography club meeting?",
];

const sampleResponses = {
  "What's due tomorrow?": {
    content:
      "You have 2 assignments due tomorrow:\n\n📚 **Physics Lab Report** - Due Sept 12 at 11:59 PM\n📊 **Math Problem Set 5** - Due Sept 12 at 2:00 PM\n\nI recommend starting with the Math problems since they're due earlier. You have about 3 hours free this evening to work on them.",
    suggestions: [
      "Show me my physics notes",
      "Set a reminder for math homework",
      "What time does the library close?",
    ],
  },
  "Find my biology notes from last week": {
    content:
      "I found 3 biology files from last week:\n\n🧬 **Cell Division Notes.pdf** - Sept 5\n🌱 **Photosynthesis Lab Results.docx** - Sept 6\n📋 **Biology Quiz 3 Study Guide.pdf** - Sept 7\n\nWould you like me to open any of these files?",
    suggestions: [
      "Open Cell Division Notes",
      "Show all biology files",
      "Create a new biology folder",
    ],
  },
  "Do I have time to hit the gym before physics class?": {
    content:
      "Let me check your schedule! 💪\n\n⏰ **Current time**: 2:30 PM\n🏃‍♀️ **Physics class**: 4:00 PM (Room 204)\n⏱️ **Available time**: 1.5 hours\n\nYes! You have enough time for a quick 45-minute workout. The campus gym is a 10-minute walk from Physics building, so you'd need to leave the gym by 3:30 PM.",
    suggestions: [
      "Set a gym reminder for 3:20 PM",
      "What equipment is available at the gym?",
      "Show me the route to physics building",
    ],
  },
  "What's for lunch today?": {
    content:
      "Here's what's available at the dining halls today! 🍽️\n\n**Main Dining Hall:**\n🍕 Pizza Bar\n🥗 Fresh Salad Station\n🍜 Asian Fusion (Pad Thai special)\n\n**Campus Café:**\n🥪 Gourmet Sandwiches\n☕ Coffee & Pastries\n🌯 Mediterranean Wraps\n\n**Food Trucks (Quad):**\n🌮 Taco Tuesday special\n🍔 Burger & Fries",
    suggestions: [
      "Show dining hall hours",
      "What's the wait time at Main Dining?",
      "Reserve a table at Campus Café",
    ],
  },
};

export function ChatInterface({ onClose, sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setIsSending(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const responseData = sampleResponses[
        content as keyof typeof sampleResponses
      ] || {
        content:
          "I understand you're asking about \"" +
          content +
          '". While I\'m still learning about your specific situation, I can help you with:\n\n📚 Finding and organizing your notes\n📅 Managing your schedule and assignments\n🎯 Discovering campus events and activities\n🍽️ Checking cafeteria menus and hours\n\nTry asking me something like "What\'s due this week?" or "Find my math notes".',
        suggestions: [
          "What's due this week?",
          "Show my schedule",
          "Find recent notes",
        ],
      };

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: responseData.content,
        timestamp: new Date(),
        suggestions: responseData.suggestions,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content:
          "Sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chat Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                EduBox AI Assistant
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Online and ready to help
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            <Lightbulb className="w-3 h-3 mr-1" />
            Smart Assistant
          </Badge>
        </div>
      </div>

      {/* Quick Suggestions (show when no messages) */}
      {messages.length === 0 && (
        <div className="p-6 border-b border-border">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                👋 Welcome! Try asking me:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quickSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start text-left h-auto p-4 hover:bg-muted/50"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <Calendar className="w-4 h-4 text-blue-600" />
                      )}
                      {index === 1 && (
                        <BookOpen className="w-4 h-4 text-green-600" />
                      )}
                      {index === 2 && (
                        <Clock className="w-4 h-4 text-purple-600" />
                      )}
                      {index === 3 && (
                        <Users className="w-4 h-4 text-orange-600" />
                      )}
                      {index === 4 && (
                        <Users className="w-4 h-4 text-pink-600" />
                      )}
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div
                className={cn(
                  "flex gap-3",
                  message.type === "user" && "justify-end"
                )}
              >
                {message.type === "ai" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[70%] p-4 rounded-lg",
                    message.type === "user"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  )}
                >
                  <div className="whitespace-pre-line text-sm">
                    {message.content}
                  </div>
                  <div
                    className={cn(
                      "text-xs mt-2",
                      message.type === "user"
                        ? "text-blue-100"
                        : "text-muted-foreground"
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {message.type === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                )}
              </div>

              {message.suggestions && message.suggestions.length > 0 && (
                <div className="ml-11 space-y-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lightbulb className="h-3 w-3" />
                    You might also ask:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 px-3"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-muted p-4 rounded-lg rounded-bl-sm">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about your studies..."
            className="flex-1 h-12"
            disabled={isTyping || isSending}
          />
          <Button
            type="submit"
            size="lg"
            disabled={!inputValue.trim() || isTyping || isSending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6"
          >
            {isSending ? (
              <ButtonLoader size="sm" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
