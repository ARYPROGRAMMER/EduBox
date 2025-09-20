"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FileText, Image, Video, FileAudio, Archive, File } from "lucide-react";

interface FileThumbnailProps {
  fileName: string;
  mimeType: string;
  fileSize: number;
  thumbnailUrl?: string;
  fileUrl?: string; // Add file URL for direct image display
  className?: string;
  showFileType?: boolean;
}

export function FileThumbnail({
  fileName,
  mimeType,
  fileSize,
  thumbnailUrl,
  fileUrl,
  className,
  showFileType = false,
}: FileThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.includes("pdf")) return "pdf";
    if (
      mimeType.includes("document") ||
      mimeType.includes("word") ||
      mimeType.includes("text")
    )
      return "document";
    if (
      mimeType.includes("presentation") ||
      mimeType.includes("powerpoint") ||
      mimeType.includes("slides")
    )
      return "presentation";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
      return "spreadsheet";
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("archive")
    )
      return "archive";
    return "other";
  };

  const getFileIcon = (type: string, className: string = "w-8 h-8") => {
    switch (type) {
      case "pdf":
        return <FileText className={cn(className, "text-red-600")} />;
      case "document":
        return <FileText className={cn(className, "text-blue-600")} />;
      case "presentation":
        return <FileText className={cn(className, "text-orange-600")} />;
      case "spreadsheet":
        return <FileText className={cn(className, "text-green-600")} />;
      case "image":
        return <Image className={cn(className, "text-green-600")} />;
      case "video":
        return <Video className={cn(className, "text-purple-600")} />;
      case "audio":
        return <FileAudio className={cn(className, "text-yellow-600")} />;
      case "archive":
        return <Archive className={cn(className, "text-gray-600")} />;
      default:
        return <File className={cn(className, "text-gray-600")} />;
    }
  };

  const getFileExtension = (fileName: string): string => {
    const lastDot = fileName.lastIndexOf(".");
    return lastDot !== -1 ? fileName.substring(lastDot + 1).toUpperCase() : "";
  };

  const fileType = getFileType(mimeType);
  const extension = getFileExtension(fileName);

  // For images, try to use thumbnail or file URL for display
  const imageSource = thumbnailUrl || (fileType === "image" ? fileUrl : null);

  // For images and videos with thumbnails, show actual thumbnail
  if (imageSource && !imageError && fileType === "image") {
    return (
      <div
        className={cn(
          "relative rounded-lg overflow-hidden bg-gray-100 border",
          className
        )}
      >
        <img
          src={imageSource}
          alt={fileName}
          className="w-full h-full object-cover"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImageError(true);
            setIsLoading(false);
          }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        {showFileType && extension && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs font-semibold bg-black/70 text-white rounded">
              {extension}
            </span>
          </div>
        )}
      </div>
    );
  }

  // For videos with thumbnails, show video thumbnail
  if (thumbnailUrl && !imageError && fileType === "video") {
    return (
      <div
        className={cn(
          "relative rounded-lg overflow-hidden bg-gray-100 border",
          className
        )}
      >
        <img
          src={thumbnailUrl}
          alt={fileName}
          className="w-full h-full object-cover"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImageError(true);
            setIsLoading(false);
          }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/60 rounded-full p-2">
            <Video className="w-6 h-6 text-white" />
          </div>
        </div>
        {showFileType && extension && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs font-semibold bg-black/70 text-white rounded">
              {extension}
            </span>
          </div>
        )}
      </div>
    );
  }

  // For other file types or when thumbnail fails, show icon-based thumbnail
  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border flex flex-col items-center justify-center p-4",
        className
      )}
    >
      {getFileIcon(fileType, "w-12 h-12")}
      {showFileType && extension && (
        <span className="mt-2 px-2 py-1 text-xs font-semibold bg-white/80 text-gray-700 rounded border">
          {extension}
        </span>
      )}
    </div>
  );
}

// Hook to generate thumbnail URL from storage ID
export function useThumbnailUrl(storageId: string | undefined) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>();

  useEffect(() => {
    if (storageId) {
      // In a real implementation, you'd generate thumbnails on the server
      // For now, we'll use the file URL directly for images
      setThumbnailUrl(`/api/files/${storageId}`);
    }
  }, [storageId]);

  return thumbnailUrl;
}