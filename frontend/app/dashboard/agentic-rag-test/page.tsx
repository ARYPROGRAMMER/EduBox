"use client";

import Script from "next/script";
import React from "react";

export default function Agent() {
  return (
    <>
      {/* Load the Nuclia widget script once */}
      <Script
        src="https://cdn.rag.progress.cloud/nuclia-widget.umd.js"
        strategy="afterInteractive"
      />

      <nuclia-chat
        audit_metadata='{"config":"nuclia-standard","widget":"test-widget"}'
        knowledgebox="deb7d64c-ba0e-4363-81d0-3796b2e03465"
        zone="aws-eu-central-1-1"
        state="PRIVATE"
        account="1c1ee2a9-7051-4d43-9f37-cdffc398d083"
        kbslug="arya"
        apikey={process.env.NEXT_PUBLIC_NUCLIA_API_KEY}
        backend="https://rag.progress.cloud/api"
        cdn="https://cdn.rag.progress.cloud/"
        features="answers,preferMarkdown,contextImages,rephrase,highlight,suggestions,citations,hideResults,showAttachedImages,sortResults,hideLogo"
        rag_strategies="full_resource|1000000|false,graph_beta|3|50|false|false|false|false,conversation|attachments_text|attachments_images|full"
        rag_images_strategies="page_image|2,paragraph_image"
        placeholder="Ask me about your things"
        not_enough_data_message="Your knowledge base is too low"
        feedback="answer"
      ></nuclia-chat>
    </>
  );
}
