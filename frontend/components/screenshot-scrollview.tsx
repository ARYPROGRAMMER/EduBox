"use client";

import React from "react";
import { ScrollView } from "@progress/kendo-react-scrollview";

const screenshots = [
  {
    src: "/screenshots/dashboardoverview.png",
    alt: "Dashboard Overview - Main EduBox interface with all features",
    title: "Dashboard Overview",
  },
  {
    src: "/screenshots/aichathome.png",
    alt: "AI Chat Home - Main AI chat interface for conversations",
    title: "AI Chat Home",
  },
  {
    src: "/screenshots/aichatsession.png",
    alt: "AI Chat Session - Active chat session with AI assistant",
    title: "AI Chat Session",
  },
  {
    src: "/screenshots/analytics.png",
    alt: "Analytics Dashboard - Usage analytics and insights",
    title: "Analytics Dashboard",
  },
  {
    src: "/screenshots/contentgen.png",
    alt: "Content Generation - AI-powered content creation tools",
    title: "Content Generation",
  },
  {
    src: "/screenshots/filehub1.png",
    alt: "File Hub - File management and organization interface",
    title: "File Hub",
  },
  {
    src: "/screenshots/filehub2.jpeg",
    alt: "File Hub Enhanced - Advanced file management features",
    title: "File Hub Enhanced",
  },
  {
    src: "/screenshots/plannernew.png",
    alt: "New Planner - Updated planner interface for scheduling",
    title: "New Planner",
  },
  {
    src: "/screenshots/studynew.png",
    alt: "New Study Assistant - Enhanced AI study assistant",
    title: "New Study Assistant",
  },
  {
    src: "/screenshots/profile.png",
    alt: "User Profile - Profile management and settings",
    title: "User Profile",
  },
  {
    src: "/screenshots/convex.png",
    alt: "Convex Database - Real-time database management",
    title: "Convex Database",
  },
  {
    src: "/screenshots/ragdb.png",
    alt: "RAG Database - Retrieval-Augmented Generation database",
    title: "RAG Database",
  },
  {
    src: "/screenshots/ragdemo.jpeg",
    alt: "RAG Demo - Demonstration of RAG functionality",
    title: "RAG Demo",
  },
  {
    src: "/screenshots/importexp.png",
    alt: "Import/Export - Data import and export functionality",
    title: "Import/Export",
  },
  {
    src: "/screenshots/backendsync.png",
    alt: "Backend Sync - Synchronization with backend services",
    title: "Backend Sync",
  },
  {
    src: "/screenshots/schematic.png",
    alt: "Schematic - System architecture and schematics",
    title: "Schematic",
  },
  {
    src: "/screenshots/locked.jpeg",
    alt: "Locked Feature - Premium features with access control",
    title: "Premium Features",
  },
  {
    src: "/screenshots/landing.png",
    alt: "Landing Page - Welcome page and feature overview",
    title: "Landing Page",
  },
];

export const ScreenshotScrollView: React.FC = () => {
  return (
    <div className="w-full max-w-8xl mx-auto px-6 py-16">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Some of the Screenshots while{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Still in Development
          </span>
        </h2>
        <p className="text-muted-foreground dark:text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">
          Explore our features through these high-quality screenshots showcasing
          the EduBox experience
        </p>
      </div>

      <div className="relative px-8">
        <ScrollView
          style={{
            width: "100%",
            height: "800px",
            borderRadius: "20px",
            overflow: "hidden",
            // boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          endless={true}
          pageable={true}
          arrows={true}
          className="kendo-scrollview"
          activeView={0}
        >
          {screenshots.map((screenshot, index) => (
            <div
              key={index}
              className="flex items-center justify-center min-h-full"
            >
              <div className="w-full max-w-7xl rounded-xl shadow-2xl overflow-hidden relative border border-gray-200/20 dark:border-gray-700/30 backdrop-blur-sm">
                <img
                  src={screenshot.src}
                  alt={screenshot.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 md:p-6">
                  <div className="max-w-3xl mx-auto pb-1">
                    <h3 className="text-white font-bold text-xl md:text-2xl mb-1 leading-tight">
                      {screenshot.title}
                    </h3>
                    <p className="text-gray-200 text-xs md:text-sm leading-relaxed opacity-90 line-clamp-2">
                      {screenshot.alt.split(" - ")[1]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ScrollView>
      </div>
    </div>
  );
};
