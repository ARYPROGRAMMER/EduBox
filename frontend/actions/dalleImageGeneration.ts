"use server";

import { api } from "@/convex/_generated/api";
import { featureFlagEvents, FeatureFlag } from "@/features/flag";
import { getConvexClient } from "@/lib/convex";
import { client } from "@/lib/schematic";
import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenAI, Modality } from "@google/genai";

const convexClient = getConvexClient();

export const geminiImageGeneration = async (
  prompt: string,
  videoId: string
) => {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error("User not found");
  }
  if (!prompt) {
    throw new Error("Prompt is required");
  }
  console.log("🎨 Generating image with Gemini prompt:", prompt);

  const ai = new GoogleGenAI({
    // configure project, location if required
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT!,
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
  });

  // Option A: If using Imagen model (image-only)
  const imageOnlyResponse = await ai.models.generateImages({
    model: "imagen-4.0-generate-001", // or whatever model you have access to
    prompt,
    config: {
      numberOfImages: 1,
      // optionally specify size field if supported:
      // Note: check model docs whether size or width/height is accepted
      aspectRatio: "16:9",
    },
  });
  const imgObj = imageOnlyResponse.generatedImages?.[0];
  if (!imgObj?.image?.imageBytes) {
    throw new Error("No image returned from Imagen");
  }

  const buffer = Buffer.from(imgObj.image.imageBytes, "base64");
  const imageBlob = new Blob([buffer], { type: "image/png" });

  // Then your Convex upload logic (same as before)
  console.log("📤 Getting upload URL...");
  const postUrl = await convexClient.mutation(api.images.generateUploadUrl);
  console.log("✅ Got upload URL");

  console.log("📁 Uploading image to storage...");
  const uploadResult = await fetch(postUrl, {
    method: "POST",
    headers: {
      "Content-Type": "image/png",
    },
    body: imageBlob,
  });
  const { storageId } = await uploadResult.json();
  console.log("✅ Uploaded image with storage ID:", storageId);

  console.log("💾 Saving image reference to database...");
  await convexClient.mutation(api.images.storeImage, {
    storageId,
    videoId,
    userId: user.id,
  });
  console.log("✅ Saved image reference to database");

  const dbImageUrl = await convexClient.query(api.images.getImage, {
    videoId,
    userId: user.id,
  });

  await client.track({
    event: featureFlagEvents[FeatureFlag.IMAGE_GENERATION].event,
    company: { id: user.id },
    user: { id: user.id },
  });

  return {
    imageUrl: dbImageUrl,
  };
};
