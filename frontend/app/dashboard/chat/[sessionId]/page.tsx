"use client";

import { ChatInterface } from "@/components/chat-interface-new";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ChatSessionPage() {
  const router = useRouter();
  const params = useParams();
  const [isValidSession, setIsValidSession] = useState(false);

  const sessionId = params.sessionId as string;

  useEffect(() => {
    // Validate session ID format
    if (sessionId && sessionId.startsWith("session_")) {
      setIsValidSession(true);
    } else {
      // Invalid session ID, redirect to create new session
      router.replace("/dashboard/chat");
    }
  }, [sessionId, router]);

  if (!isValidSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ChatInterface
        onClose={() => router.push("/dashboard")}
        sessionId={sessionId}
      />
    </div>
  );
}
