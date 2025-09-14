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
    const type = formData.get('type') as string; // 'college' or 'dining'

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

    // Use Gemini to parse the schedule based on type
    const prompt = type === 'college' ? `
You are a helpful assistant that extracts college/university schedule information from text.

Parse the following schedule text and extract individual classes/courses with their details. Return the data as a JSON array where each item has:
- subject: string (the course/subject name)
- code: string (optional course code like "CS101", "MATH201")
- instructor: string (optional instructor/professor name)
- location: string (optional classroom/building location)
- dayOfWeek: string (one of: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
- startTime: string (24-hour format like "09:00" or "14:30")
- endTime: string (24-hour format like "10:30" or "16:00")
- duration: number (optional duration in minutes)
- semester: string (optional semester like "Fall 2024", "Spring 2025")
- credits: number (optional credit hours)

Schedule text:
${extractedText}

Please extract as many classes as possible and return only valid JSON array format. Do not include any explanation or additional text.
` : `
You are a helpful assistant that extracts dining schedule information from text.

Parse the following dining schedule text and extract meal timings with their details. Return the data as a JSON array where each item has:
- mealType: string (like "breakfast", "lunch", "dinner", "brunch", "snack")
- location: string (dining hall or cafeteria name)
- dayOfWeek: string (one of: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", or "Daily")
- startTime: string (24-hour format like "07:00" or "18:30")
- endTime: string (24-hour format like "09:30" or "21:00")
- specialNotes: string (optional notes like "Weekend Special", "Limited Menu")

Dining schedule text:
${extractedText}

Please extract as many meal timings as possible and return only valid JSON array format. Do not include any explanation or additional text.
`;

    const result = await generateText({
      model,
      prompt,
    });

    let scheduleItems = [];
    try {
      // Try to parse the AI response as JSON
      const cleanedResponse = result.text.trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^[{]*/, '')
        .replace(/[^}\]]*$/, '');
      
      scheduleItems = JSON.parse(cleanedResponse);
      
      // Validate the structure
      if (!Array.isArray(scheduleItems)) {
        throw new Error("Response is not an array");
      }

      // Ensure each item has required fields based on type
      if (type === 'college') {
        scheduleItems = scheduleItems.filter(item => 
          item.subject && item.dayOfWeek && item.startTime
        );
      } else {
        scheduleItems = scheduleItems.filter(item => 
          item.mealType && item.dayOfWeek && item.startTime
        );
      }

    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      
      // Fallback: try to extract basic schedule info manually
      const lines = result.text.split('\n').filter(line => line.trim());
      scheduleItems = lines
        .map(line => {
          if (type === 'college') {
            // Try to extract basic class info
            const timeMatch = line.match(/(\d{1,2}):(\d{2})/);
            const dayMatch = line.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
            
            if (timeMatch && dayMatch) {
              return {
                subject: line.replace(/\d{1,2}:\d{2}/, '').replace(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i, '').trim(),
                dayOfWeek: dayMatch[0],
                startTime: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`,
                endTime: "",
                location: "",
                instructor: ""
              };
            }
          } else {
            // Try to extract basic meal info
            const timeMatch = line.match(/(\d{1,2}):(\d{2})/);
            const mealMatch = line.match(/(breakfast|lunch|dinner|brunch|snack)/i);
            const dayMatch = line.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Daily)/i);
            
            if (timeMatch && mealMatch) {
              return {
                mealType: mealMatch[0].toLowerCase(),
                dayOfWeek: dayMatch ? dayMatch[0] : "Daily",
                startTime: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`,
                endTime: "",
                location: ""
              };
            }
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, 20); // Limit to 20 items
    }

    return NextResponse.json({
      success: true,
      scheduleItems: scheduleItems.slice(0, 20), // Limit to 20 items for performance
      extractedText: extractedText.slice(0, 500), // Return first 500 chars for debugging
      type: type
    });

  } catch (error) {
    console.error("PDF schedule processing error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process PDF schedule", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}