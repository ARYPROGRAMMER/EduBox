"use client";

import React, { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "./ui/button";
import ReactMarkdown from "react-markdown";
import { useSchematicFlag } from "@schematichq/schematic-react";
import { FeatureFlag } from "@/features/flag";
import { BotIcon, ImageIcon, LetterText, PenIcon } from "lucide-react";
import { toast } from "sonner";

// Correct type imports — ToolUIPart accepts at most one generic parameter
import type { UIMessage, ToolUIPart } from "ai"; // adjust path if yours differs

function AiAgentChat({ videoId }: { videoId: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [userInput, setUserInput] = useState<string>("");

  // <-- Note: removed `{ body: { videoId } }` from options because your UseChatOptions doesn't include `body`
  const { messages, sendMessage, status } = useChat<UIMessage<any, any, any>>();

  const isScriptGenerationEnabled = useSchematicFlag(FeatureFlag.SCRIPT_GENERATION);
  const isImageGenerationEnabled = useSchematicFlag(FeatureFlag.IMAGE_GENERATION);
  const isTitleGenerationEnabled = useSchematicFlag(FeatureFlag.TITLE_GENERATIONS);
  const isVideoAnalysisEnabled = useSchematicFlag(FeatureFlag.ANALYSE_VIDEO);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let toastId: string | number | undefined;
    switch (status) {
      case "submitted":
        toastId = toast("Agent is thinking...", { icon: <BotIcon className="w-4 h-4" /> });
        break;
      case "streaming":
        toastId = toast("Agent is replying...", { icon: <BotIcon className="w-4 h-4" /> });
        break;
      case "error":
        toastId = toast("Whoops! Something went wrong — please try again.", { icon: <BotIcon className="w-4 h-4" /> });
        break;
      case "ready":
        toast.dismiss(toastId);
        break;
    }
  }, [status]);

  // sendMessage may accept different payload shapes depending on your SDK version.
  // If you need videoId sent to the backend every time, include it in the message metadata/payload.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = userInput.trim();
    if (!trimmed) return;

    // pass videoId in metadata if your backend expects it; cast to any to avoid typing mismatch
    sendMessage?.({ text: trimmed, metadata: { videoId } } as any);
    setUserInput("");
  };

  const generateScript = () => {
    sendMessage?.({
      text:
        "Generate a step-by-step shooting script for this video that I can use on my own channel to produce a video that is similar to this one. Only generate the script (no images or titles).",
      metadata: { videoId },
    } as any);
  };

  const generateImage = () => {
    sendMessage?.({ text: "Generate a thumbnail for this video", metadata: { videoId } } as any);
  };

  const generateTitle = () => {
    sendMessage?.({ text: "Generate a title for this video", metadata: { videoId } } as any);
  };

  // helper type guard for text parts (safe)
  const isTextPart = (part: any): part is { type: "text"; text: string } =>
    part?.type === "text" && typeof part.text === "string";

  // safe formatter for tool parts — using ToolUIPart<any> (single generic)
  const formatToolPart = (part: ToolUIPart<any> | any) => {
    return `🔧 Tool: ${(part as any).toolName ?? (part as any).tool ?? "unknown"}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="hidden lg:block px-4 pb-3 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">AI Agent</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" ref={messagesContainerRef} aria-live="polite">
        <div className="space-y-6">
          {(!messages || messages.length === 0) && (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-gray-700">Welcome to AI Agent Chat</h3>
                <p className="text-sm text-gray-500">Ask any question about your video!</p>
              </div>
            </div>
          )}

          {messages?.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"} rounded-2xl px-4 py-3`}>
                {m.parts && m.role === "assistant" ? (
                  <div className="space-y-3">
                    {m.parts.map((part, i) => {
                      if (isTextPart(part)) {
                        return (
                          <div key={i} className="prose prose-sm max-w-none">
                            <ReactMarkdown>{part.text}</ReactMarkdown>
                          </div>
                        );
                      }

                      // generic tool- prefixed parts (ToolUIPart<any>)
                      if (typeof part?.type === "string" && part.type.startsWith("tool-")) {
                        return (
                          <div key={i} className="bg-white/50 rounded-lg p-2 space-y-2 text-gray-800">
                            <div className="font-medium text-xs">{formatToolPart(part as ToolUIPart<any>)}</div>
                            {"input" in part && <pre className="text-xs bg-white/75 p-2 rounded overflow-auto">{JSON.stringify((part as any).input, null, 2)}</pre>}
                            {"output" in part && <pre className="text-xs bg-white/75 p-2 rounded overflow-auto">{JSON.stringify((part as any).output, null, 2)}</pre>}
                            {"errorText" in part && <div className="text-xs text-red-600">{(part as any).errorText}</div>}
                          </div>
                        );
                      }

                      // fallback: try to render any .text if present, otherwise nothing
                      if (part && typeof (part as any).text === "string") {
                        return (
                          <div key={i} className="prose prose-sm max-w-none">
                            <ReactMarkdown>{(part as any).text}</ReactMarkdown>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                ) : (
                  <div className={`prose prose-sm max-w-none ${m.role === "user" ? "text-white" : "text-gray-800"}`}>
                    {/* some older messages may have `content` — render if present */}
                    {typeof (m as any).content === "string" ? (
                      <ReactMarkdown>{(m as any).content}</ReactMarkdown>
                    ) : (
                      // otherwise render text parts if available
                      m.parts?.map((part, i) => (isTextPart(part) ? <ReactMarkdown key={i}>{part.text}</ReactMarkdown> : null))
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-4 bg-white">
        <div className="space-y-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              type="text"
              placeholder={!isVideoAnalysisEnabled ? "Upgrade to ask anything about your video..." : "Ask anything about your video..."}
              value={userInput}
              onChange={(e) => setUserInput(e.currentTarget.value)}
              disabled={!isVideoAnalysisEnabled || status !== "ready"}
            />
            <Button type="submit" disabled={status !== "ready" || !isVideoAnalysisEnabled || userInput.trim() === ""}>
              {status === "streaming" ? "AI is replying..." : status === "submitted" ? "AI is thinking..." : "Send"}
            </Button>
          </form>

          <div className="flex gap-2">
            <button onClick={generateScript} type="button" disabled={!isScriptGenerationEnabled || status !== "ready"} className="...">
              <LetterText className="w-4 h-4" /> <span>Generate Script</span>
            </button>
            <button onClick={generateTitle} type="button" disabled={!isTitleGenerationEnabled || status !== "ready"} className="...">
              <PenIcon className="w-4 h-4" /> <span>Generate Title</span>
            </button>
            <button onClick={generateImage} type="button" disabled={!isImageGenerationEnabled || status !== "ready"} className="...">
              <ImageIcon className="w-4 h-4" /> <span>Generate Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiAgentChat;
