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

      <nuclia-popup
        audit_metadata='{"config":"nuclia-standard","widget":"test-widget"}'
        knowledgebox="deb7d64c-ba0e-4363-81d0-3796b2e03465"
        zone="aws-eu-central-1-1"
        state="PRIVATE"
        account="1c1ee2a9-7051-4d43-9f37-cdffc398d083"
        kbslug="arya"
        apikey={process.env.NEXT_PUBLIC_NUCLIA_API_KEY}
        backend="https://rag.progress.cloud/api"
        cdn="https://cdn.rag.progress.cloud/"
        features="answers,rephrase,suggestions,autocompleteFromNERs,citations,hideResults,hideLogo"
        rag_strategies="neighbouring_paragraphs|2|2"
        placeholder="Ask me about your things"
        not_enough_data_message="Your knowledge base is too low"
        feedback="answer"
      ></nuclia-popup>
      {/* Floating button that the Nuclia widget listens to via the data attribute */}
      <button
        data-nuclia="search-widget-button"
        aria-label="Open Nuclia search"
        title="Open Nuclia search"
        style={{
          position: "fixed",
          right: 20, // offset to the right to allow a sync button to sit to its left
          bottom: 24,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: 28,
          background: "#0b74ff",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 18px rgba(11,116,255,0.25)",
          border: "none",
          cursor: "pointer",
        }}
      >
        {/* AI agent / robot head SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3" y="7" width="18" height="10" rx="2" />
          <circle cx="8" cy="12" r="1.2" fill="currentColor" />
          <circle cx="16" cy="12" r="1.2" fill="currentColor" />
          <path d="M9 17v1a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-1" />
          <rect x="7" y="3" width="10" height="3" rx="1" />
        </svg>
      </button>
    </>
  );
}
