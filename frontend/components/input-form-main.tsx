"use client";

import { analyseYoutubeVideo } from "@/actions/analyseform";
import { PlaceholdersAndVanishInput } from "./ui/placeholders-and-vanish-input";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function YoutubeVideoForm() {
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const placeholders = [
    "Paste a YouTube video URL to start learning...",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "Enter any educational YouTube video link",
    "Transform videos into interactive learning experiences",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUrl(e.target.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error("Please enter a YouTube video URL to continue.");
      return;
    }

    const isValidYouTubeUrl =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w-]+/.test(
        url.trim()
      );

    if (!isValidYouTubeUrl) {
      toast.error(
        "Please enter a valid YouTube video URL. Supported formats include youtube.com, youtu.be, and YouTube Shorts."
      );
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("url", url.trim());
        const videoId = await analyseYoutubeVideo(formData);
        toast.success("Analyzing video — redirecting...");
        router.push(`/dashboard/chat/${videoId}`);
      } catch (error) {
        console.error("Error analyzing video:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Failed to analyze the video. Please try again with a different URL.";
        toast.error(message);
      }
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PlaceholdersAndVanishInput
        placeholders={placeholders}
        onChange={handleChange}
        onSubmit={onSubmit}
        disabled={isPending}
      />
    </div>
  );
}

export default YoutubeVideoForm;
