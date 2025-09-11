"use server";

import { getVideoIdFromUrl } from "@/lib/getVideoIdFromUrl";
import { redirect } from "next/navigation";

export async function analyseYoutubeVideo(formData: FormData) {
  const url = formData.get("url")?.toString();
  
  if (!url) {
    throw new Error("No URL provided");
  }
  const cleanUrl = url.trim();
  
  if (!cleanUrl) {
    throw new Error("Empty URL provided");
  }

  const videoId = getVideoIdFromUrl(cleanUrl);

  if (!videoId) {
    throw new Error("Invalid YouTube URL or unable to extract video ID");
  }

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    throw new Error("Invalid video ID format");
  }

  try {
    // Redirect to the chat page with the video ID
    redirect(`/dashboard/chat/${videoId}`);
  } catch (error) {
    console.error("Error redirecting to chat:", error);
    throw new Error("Failed to navigate to video analysis");
  }
}
