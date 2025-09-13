"use client";

import { ChatInterface } from "@/components/chat-interface-new";
// import { ChatInterface } from "@/components/chat-interface-new";
import { PageLoader } from "@/components/ui/loader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ChatPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>();

  useEffect(() => {
    // Generate a new session ID and redirect to it
    const newSessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    router.replace(`/dashboard/chat/${newSessionId}`);
  }, [router]);

  if (!sessionId) {
    return <PageLoader text="Starting new chat session..." />;
  }

  return (
    <div className="h-full">
      <ChatInterface onClose={() => router.push("/dashboard")} />
    </div>
  );
}
