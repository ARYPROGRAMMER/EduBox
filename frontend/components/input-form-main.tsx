"use client";

import { analyseYoutubeVideo } from "@/actions/analyseform";
import { PlaceholdersAndVanishInput } from "./ui/placeholders-and-vanish-input";
import { useState, useTransition } from "react";
import { toast } from "@/hooks/use-toast";

function YoutubeVideoForm() {
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  const placeholders = [
    "Paste a YouTube video URL to start learning...",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "Enter any educational YouTube video link",
    "Transform videos into interactive learning experiences",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube video URL to continue.",
        variant: "destructive",
      });
      return;
    }

    // Validate YouTube URL with a more comprehensive regex
    const isValidYouTubeUrl = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w-]+/.test(url.trim());
    
    if (!isValidYouTubeUrl) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube video URL. Supported formats include youtube.com, youtu.be, and YouTube Shorts.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("url", url.trim());
        await analyseYoutubeVideo(formData);
        
        // Success toast (though user will likely be redirected before seeing it)
        toast({
          title: "Success!",
          description: "Analyzing your video... You'll be redirected shortly.",
        });
      } catch (error) {
        console.error("Error analyzing video:", error);
        toast({
          title: "Analysis Failed",
          description: error instanceof Error ? error.message : "Failed to analyze the video. Please try again with a different URL.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PlaceholdersAndVanishInput
        placeholders={placeholders}
        onChange={handleChange}
        onSubmit={onSubmit}
      />
      {isPending && (
        <p className="text-sm text-muted-foreground text-center mt-3">
          Analyzing video... This may take a moment.
        </p>
      )}
    </div>
  );
}

export default YoutubeVideoForm;
