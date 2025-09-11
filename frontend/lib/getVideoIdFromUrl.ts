export function getVideoIdFromUrl(url: string): string | null {
  try {
    // Remove whitespace and ensure we have a string
    const cleanUrl = url?.trim();
    if (!cleanUrl) return null;

    let videoId: string | null = null;

    // Handle different YouTube URL formats
    if (cleanUrl.includes("youtu.be/")) {
      // Shortened URL format: https://youtu.be/VIDEO_ID
      const match = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      videoId = match ? match[1] : null;
    } else if (cleanUrl.includes("youtube.com/shorts/")) {
      // Shorts URL format: https://youtube.com/shorts/VIDEO_ID
      const match = cleanUrl.match(/shorts\/([a-zA-Z0-9_-]{11})/);
      videoId = match ? match[1] : null;
    } else if (cleanUrl.includes("v=")) {
      // Standard URL format: https://youtube.com/watch?v=VIDEO_ID
      const match = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      videoId = match ? match[1] : null;
    } else if (cleanUrl.includes("youtube.com/embed/")) {
      // Embed URL format: https://youtube.com/embed/VIDEO_ID
      const match = cleanUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
      videoId = match ? match[1] : null;
    }

    // Validate video ID format (YouTube video IDs are exactly 11 characters)
    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return videoId;
    }

    return null;
  } catch (error) {
    console.error("Error extracting video ID:", error);
    return null;
  }
}
