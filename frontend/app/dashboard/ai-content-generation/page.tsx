"use client";

import { AiContentGeneration } from "@/components/ai-content-generation";
import MobileGate from "@/components/mobile-gate";

export default function AIContentGenerationPage() {
  return (
    <MobileGate allowMobile={true}>
      <AiContentGeneration />
    </MobileGate>
  );
}