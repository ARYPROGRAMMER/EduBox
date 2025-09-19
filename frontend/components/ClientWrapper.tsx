"use client";

import { SchematicProvider } from "@schematichq/schematic-react";
import { ClerkProvider } from "@clerk/nextjs";
import SchematicWrapped from "./SchematicWrapped";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { CopilotKit } from "@copilotkit/react-core";

export default function ClientWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schematicPubKey = process.env.NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY;
  if (!schematicPubKey) {
    throw new Error(
      "No Schematic Publishable Key found. Please add it to your .env.local file."
    );
  }
  return (
    <ConvexClientProvider>
      <ClerkProvider>
        <SchematicProvider publishableKey={schematicPubKey}>
          <CopilotKit publicLicenseKey={process.env.NEXT_PUBLIC_COPILOTKIT_PUBLIC_LICENSE_KEY} publicApiKey={process.env.NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY} runtimeUrl="/api/copilotkit">
            <SchematicWrapped>{children}</SchematicWrapped>
          </CopilotKit>
        </SchematicProvider>
      </ClerkProvider>
    </ConvexClientProvider>
  );
}
