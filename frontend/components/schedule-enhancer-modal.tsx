"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexUser } from "@/hooks/use-convex-user";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { Id } from "@/convex/_generated/dataModel";

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

interface ScheduleEnhancerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: any;
  assignments: any[];
  events: any[];
  tasks: any[];
  studySessions: any[];
  onOptimizeSchedule?: (optimizedSchedule: OptimizedScheduleData, scheduleId: Id<"optimizedSchedules">) => void;
}

export function ScheduleEnhancerModal({
  open,
  onOpenChange,
  schedule,
  assignments,
  events,
  tasks,
  studySessions,
  onOptimizeSchedule,
}: ScheduleEnhancerModalProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { user: convexUser } = useConvexUser();
  const saveOptimizedSchedule = useMutation(
    api.schedules.saveOptimizedSchedule
  );

  // Make schedule data readable by CopilotKit
  useCopilotReadable({
    description:
      "Current schedule data including assignments, events, tasks, and study sessions",
    value: { schedule, assignments, events, tasks, studySessions },
  });

  // CopilotKit action for schedule optimization
  useCopilotAction({
    name: "optimizeSchedule",
    description:
      "Optimize a student's schedule by analyzing assignments, events, tasks, and study sessions to create a balanced and productive schedule.",
    parameters: [
      {
        name: "scheduleData",
        type: "object",
        description:
          "The current schedule data including assignments, events, tasks, and study sessions",
        properties: {
          schedule: {
            type: "object",
            description: "Current schedule information",
          },
          assignments: {
            type: "array",
            description: "List of assignments with due dates and priorities",
          },
          events: {
            type: "array",
            description: "List of events with start/end times",
          },
          tasks: { type: "array", description: "List of tasks to complete" },
          studySessions: {
            type: "array",
            description: "Planned study sessions",
          },
        },
        required: true,
      },
    ],
    handler: async ({ scheduleData }: { scheduleData: any }) => {
      const { schedule, assignments, events, tasks, studySessions } =
        scheduleData;

      // Use CopilotKit's AI to optimize the schedule
      const optimizedSchedule = await optimizeScheduleWithAI(
        schedule,
        assignments,
        events,
        tasks,
        studySessions
      );

      return {
        optimizedSchedule,
        success: true,
        message: "Schedule optimized successfully using AI",
      };
    },
  });

  // CopilotKit action to trigger schedule optimization from chat
  useCopilotAction({
    name: "triggerScheduleOptimization",
    description:
      "Trigger the schedule optimization process for the current user's schedule data",
    parameters: [],
    handler: async () => {
      if (!convexUser) {
        return {
          success: false,
          message: "User must be logged in to optimize schedules",
        };
      }

      try {
        setIsOptimizing(true);
        // Use CopilotKit's AI to optimize the schedule directly
        const optimizedSchedule = await optimizeScheduleWithAI(
          schedule,
          assignments,
          events,
          tasks,
          studySessions
        );

        // Save the optimized schedule
        const savedScheduleId = await saveOptimizedSchedule({
          userId: convexUser.clerkId,
          name: `Optimized Schedule - ${new Date().toLocaleDateString()}`,
          description: "AI-optimized schedule for better productivity",
          originalSchedule: schedule,
          assignments,
          events,
          studySessions,
          optimizedSchedule,
          optimizationNotes: optimizedSchedule.notes,
          aiModel: "llama-3.1-8b-instant",
          optimizationScore: 90, // Higher score for AI optimization
        });

        if (onOptimizeSchedule) {
          onOptimizeSchedule(optimizedSchedule, savedScheduleId);
        }

        return {
          success: true,
          message: "Schedule optimized and saved successfully!",
        };
      } catch (error) {
        setIsOptimizing(false);
        return {
          success: false,
          message: "Failed to optimize schedule. Please try again.",
        };
      }
    },
  });

  const handleOptimize = async () => {
    if (!convexUser) {
      toast.error("You must be logged in to optimize schedules.");
      return;
    }

    setIsOptimizing(true);
    try {
      console.log("Starting schedule optimization with data:", {
        schedule,
        assignments: assignments?.length,
        events: events?.length,
        tasks: tasks?.length,
        studySessions: studySessions?.length,
      });

      // Use CopilotKit's AI to optimize the schedule directly
      const optimizedSchedule = await optimizeScheduleWithAI(
        schedule,
        assignments,
        events,
        tasks,
        studySessions
      );


      // Save the optimized schedule
      const savedScheduleId = await saveOptimizedSchedule({
        userId: convexUser.clerkId,
        name: `Optimized Schedule - ${new Date().toLocaleDateString()}`,
        description: "AI-optimized schedule for better productivity",
        originalSchedule: schedule,
        assignments,
        events,
        studySessions,
        optimizedSchedule,
        optimizationNotes: optimizedSchedule.notes,
        aiModel: "llama-3.1-8b-instant",
        optimizationScore: 90, // Higher score for AI optimization
      });


      if (onOptimizeSchedule) {
        onOptimizeSchedule(optimizedSchedule, savedScheduleId);
      }

      toast.success("Schedule optimized and saved successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error during schedule optimization:", error);
      toast.error(
        error instanceof Error
          ? `Optimization failed: ${error.message}`
          : "Failed to optimize schedule. Please try again."
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Optimize Schedule
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            AI will analyze your current schedule, assignments, events, and
            study sessions to create an optimized schedule that maximizes
            productivity and minimizes conflicts.
          </p>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">What will be optimized:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Study time allocation based on assignments</li>
              <li>• Break scheduling for better focus</li>
              <li>• Conflict resolution between events</li>
              <li>• Balanced workload distribution</li>
            </ul>
          </div>

          <Button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="w-full"
            size="lg"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Optimize Schedule
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// AI-powered optimization using CopilotKit and Groq API
async function optimizeScheduleWithAI(
  schedule: any,
  assignments: any[],
  events: any[],
  tasks: any[],
  studySessions: any[]
): Promise<OptimizedScheduleData> {
  try {

    const response = await fetch("/api/schedule-optimize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        schedule,
        assignments,
        events,
        tasks,
        studySessions,
      }),
    });

    console.log("API response status:", response.status);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error("API error response:", errorData);
      throw new Error(
        `AI optimization failed: ${errorData.error || response.statusText}`
      );
    }

    const optimizedSchedule = await response.json();
    console.log("Received optimized schedule from API:", optimizedSchedule);
    return optimizedSchedule;
  } catch (error) {
    console.error("Error in optimizeScheduleWithAI:", error);
    throw error;
  }
}
