import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { auth } from "@clerk/nextjs/server";
import pdfParse from 'pdf-parse';

// Initialize Gemini model
const model = google("gemini-1.5-flash");

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;
    const type = formData.get('type') as string;

    if (!pdfFile || pdfFile.type !== 'application/pdf') {
      return NextResponse.json(
        { error: "Invalid PDF file" },
        { status: 400 }
      );
    }

    // Convert PDF to buffer for processing
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF using pdf-parse
    let extractedText = '';
    try {
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      return NextResponse.json(
        { error: "Failed to extract text from PDF. Please ensure the PDF is not encrypted or corrupted." },
        { status: 400 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted from the PDF" },
        { status: 400 }
      );
    }

    // Use Gemini to parse the menu
    const prompt = `
You are a helpful assistant that extracts menu information from restaurant/dining hall text. 

Parse the following menu text and extract individual menu items with their details. Return the data as a JSON array where each item has:
- name: string (the dish/item name)
- description: string (optional description)
- price: number (optional price as a number, without currency symbols)
- category: string (optional category like "appetizer", "main", "dessert", "beverage")
- dietary: array of strings (optional dietary information like "vegetarian", "vegan", "gluten-free")

Menu text:
${extractedText}

Please extract as many menu items as possible and return only valid JSON array format. Do not include any explanation or additional text.
`;

    const result = await generateText({
      model,
      prompt,
    });

    let menuItems = [];
    try {
      // Try to parse the AI response as JSON
      const cleanedResponse = result.text.trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^[{]*/, '')
        .replace(/[^}\]]*$/, '');
      
      menuItems = JSON.parse(cleanedResponse);
      
      // Validate the structure
      if (!Array.isArray(menuItems)) {
        throw new Error("Response is not an array");
      }

      // Ensure each item has at least a name
      menuItems = menuItems.filter(item => item.name && item.name.trim());

    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      
      // Fallback: try to extract items manually from the text
      const lines = result.text.split('\n').filter(line => line.trim());
      menuItems = lines
        .map(line => {
          const priceMatch = line.match(/\$?(\d+\.?\d*)/);
          const name = line.replace(/\$?(\d+\.?\d*)/, '').replace(/[^\w\s]/g, '').trim();
          
          if (name.length > 3) {
            return {
              name,
              price: priceMatch ? parseFloat(priceMatch[1]) : undefined,
              description: "",
              category: "general"
            };
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, 20); // Limit to 20 items
    }

    return NextResponse.json({
      success: true,
      menuItems: menuItems.slice(0, 20), // Limit to 20 items for performance
      extractedText: extractedText.slice(0, 500), // Return first 500 chars for debugging
    });

  } catch (error) {
    console.error("PDF processing error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process PDF", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}