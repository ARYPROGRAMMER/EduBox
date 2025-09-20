"use client";

import React from 'react';
import { ScrollView } from '@progress/kendo-react-scrollview';

const screenshots = [
  { src: '/screenshots/f6.png', alt: 'Dashboard Screenshot - Main EduBox interface', title: 'Dashboard' },
  { src: '/screenshots/f1.jpeg', alt: 'Global Semantic Search - Smart search across all your content', title: 'Global Search' },
  { src: '/screenshots/f2.jpeg', alt: 'Locked Feature - Premium features with feature gating', title: 'Premium Features' },
  { src: '/screenshots/f3.jpeg', alt: 'AI Study Assistant - Intelligent academic help', title: 'AI Assistant' },
  { src: '/screenshots/f4.jpeg', alt: 'Kendo RAG Search - Advanced document search with Kendo UI', title: 'Kendo RAG Search' },
  { src: '/screenshots/f5.jpeg', alt: 'Notifications and Planner Hub - Stay organized with smart notifications', title: 'Planner & Notifications' },
];

export const ScreenshotScrollView: React.FC = () => {
  return (
    <div className="w-full max-w-8xl mx-auto px-6 py-16">
      <div className="text-center mb-16">
         <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Some of the Screenshots while {" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
               Still in Development
            </span>
          </h2>
        <p className="text-muted-foreground dark:text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">
          Explore our features through these high-quality screenshots showcasing the EduBox experience
        </p>
      </div>

      <div className="relative px-8">
        <ScrollView
          style={{
            width: '100%',
            height: '800px',
            borderRadius: '20px',
            overflow: 'hidden',
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
                      {screenshot.alt.split(' - ')[1]}
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