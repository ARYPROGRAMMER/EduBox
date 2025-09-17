import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }) as any;

interface OptimizedScheduleItem {
  id: string;
  title: string;
  type: string;
  priority: string;
  duration: number;
  startTime: number | string;
  description?: string;
}

interface OptimizedScheduleData {
  scheduleItems?: OptimizedScheduleItem[];
  optimized?: boolean;
  optimizationDate?: string;
  notes?: string;
  [key: string]: any;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (
      !body.schedule ||
      !body.assignments ||
      !body.events ||
      !body.tasks ||
      !body.studySessions
    ) {
      return NextResponse.json(
        { error: "Missing required schedule data" },
        { status: 400 }
      );
    }

    const { schedule, assignments, events, tasks, studySessions } = body;

    const prompt = `
    You are a Study Schedule Optimization Assistant. Analyze the following student schedule data and create an optimized schedule:

    Current Schedule: ${JSON.stringify(schedule)}
    Assignments: ${JSON.stringify(assignments)}
    Events: ${JSON.stringify(events)}
    Tasks: ${JSON.stringify(tasks)}
    Study Sessions: ${JSON.stringify(studySessions)}

    Please create an optimized schedule that:
    1. Prioritizes high-priority assignments and tasks
    2. Avoids conflicts between events and study sessions
    3. Allocates appropriate time blocks for different activities
    4. Includes strategic breaks for better focus and productivity
    5. Balances workload throughout the day/week
    6. Suggests optimal timing for study sessions based on energy levels

    Return a JSON object with:
    - scheduleItems: Array of optimized schedule items with id, title, type, priority, duration (in minutes), startTime, and description
    - notes: Detailed explanation of the optimization strategy and recommendations

    IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text. Do not wrap the response in \`\`\`json or any other formatting.
    `;

    // Generate the optimized schedule using Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error("No response from AI model");
    }

    // Parse the JSON response - handle markdown-wrapped JSON from AI
    let optimizedData;
    try {
      // Clean the response by removing markdown code blocks if present
      let cleanResponse = response.trim();

      // Remove markdown code block formatting if present
      if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      } else if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "");
      }

      // Remove any leading/trailing whitespace
      cleanResponse = cleanResponse.trim();

      // Try to find JSON object if there's extra text
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      optimizedData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("Raw AI response that failed to parse:", response);
      console.error("Parse error:", parseError);
      throw new Error(
        `AI returned invalid JSON response: ${
          parseError instanceof Error
            ? parseError.message
            : "Unknown parsing error"
        }`
      );
    }

    // Validate that we have the required data
    if (
      !optimizedData.scheduleItems ||
      !Array.isArray(optimizedData.scheduleItems)
    ) {
      throw new Error("AI response missing required scheduleItems array");
    }

    // Create a complete OptimizedScheduleData object
    const optimizedSchedule: OptimizedScheduleData = {
      scheduleItems: optimizedData.scheduleItems,
      optimized: true,
      optimizationDate: new Date().toISOString(),
      notes: optimizedData.notes || "Schedule optimized using AI assistance",
    };

    return NextResponse.json(optimizedSchedule);
  } catch (error) {
    console.error("Error optimizing schedule:", error);

    // More detailed error handling
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to optimize schedule" },
      { status: 500 }
    );
  }
}
