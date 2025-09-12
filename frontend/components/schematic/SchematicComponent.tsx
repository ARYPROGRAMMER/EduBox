"use client";

import React, { useState } from "react";
import {
  EmbedProvider,
  SchematicEmbed,
} from "@schematichq/schematic-components";

type Props = {
  accessToken: string;
};

export default function SchematicComponent({ accessToken }: Props) {
  const componentId = process.env.NEXT_PUBLIC_SCHEMATIC_COMPONENT_ID;
  const [embedKey, setEmbedKey] = useState(0); 

  if (!accessToken) {
    console.error("SchematicComponent: accessToken is missing");
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-700 font-medium">Missing access token</p>
        <p className="text-sm text-red-600 mt-2">
          Please sign in or grant temporary access and try again.
        </p>
      </div>
    );
  }

  if (!componentId) {
    console.error(
      "SchematicComponent: NEXT_PUBLIC_SCHEMATIC_COMPONENT_ID is not set"
    );
    return (
      <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
        <p className="text-yellow-800 font-medium">
          Schematic component not configured
        </p>
        <p className="text-sm text-yellow-700 mt-2">
          The embed component ID is missing. Set{" "}
          <code className="font-mono">NEXT_PUBLIC_SCHEMATIC_COMPONENT_ID</code>{" "}
          in your environment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg p-4 relative bg-white shadow-sm border">
             <div className="flex items-end justify-end text-sm text-gray-500">
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setEmbedKey((k) => k + 1);
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              Reload
            </button>
          </div>
        </div>
        <EmbedProvider>
          <div className="w-full h-full rounded">
            <SchematicEmbed
              key={embedKey}
              accessToken={accessToken}
              id={componentId}
            />
            
          </div>
          
        </EmbedProvider>
        
   
      </div>
    </div>
  );
}
