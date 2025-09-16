"use client";

import { ChatLayout } from "@/components/chat-layout";
import MobileGate from "@/components/mobile-gate";

export default function ChatSessionPage() {
  return (
    <MobileGate allowMobile={true}>
      <div className="h-full w-full">
        <ChatLayout />
      </div>
    </MobileGate>
  );
}
