"use client";

import { AiStudyAssistant } from "@/components/ai-study-assistant";
import MobileGate from "@/components/mobile-gate";

// Render the shared AiStudyAssistant component so the page uses the
// central component (which contains Recommendations, History, Insights, etc.)
export default function AIStudyAssistantPage() {
  return (
    <MobileGate>
      <AiStudyAssistant />
    </MobileGate>
  );
}