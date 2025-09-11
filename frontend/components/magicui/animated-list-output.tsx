"use client";

import { cn } from "@/lib/utils";
import { AnimatedList } from "@/components/magicui/animated-list";

interface Item {
  name: string;
  description: string;
  icon: string;
  color: string;
  time: string;
}

let notifications = [
  {
    name: "Assignment Due Tomorrow",
    description: "CS 101 - Data Structures Project",
    time: "2h ago",
    icon: "📚",
    color: "#FF3D71",
  },
  {
    name: "New Study Group Formed",
    description: "Mathematics - Calculus II",
    time: "1h ago",
    icon: "👥",
    color: "#FFB800",
  },
  {
    name: "File Auto-Organized",
    description: "Chemistry Lab Report.pdf",
    time: "30m ago",
    icon: "�",
    color: "#00C9A7",
  },
  {
    name: "Exam Reminder",
    description: "Physics Midterm - Room 205",
    time: "15m ago",
    icon: "⏰",
    color: "#1E86FF",
  },
  {
    name: "Grade Posted",
    description: "Biology Quiz - 92/100",
    time: "5m ago",
    icon: "🎯",
    color: "#9C27B0",
  },
  {
    name: "Study Session Scheduled",
    description: "Library - Group Study Room B",
    time: "Just now",
    icon: "�",
    color: "#4CAF50",
  },
];

notifications = Array.from({ length: 5 }, () => notifications).flat();

const Notification = ({ name, description, icon, color, time }: Item) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4",
        // animation styles
        "transition-all duration-200 ease-in-out hover:scale-[103%]",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "transform-gpu dark:bg-transparent dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: color,
          }}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center whitespace-pre text-lg font-medium dark:text-white ">
            <span className="text-sm sm:text-lg">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-500">{time}</span>
          </figcaption>
          <p className="text-sm font-normal dark:text-white/60">
            {description}
          </p>
        </div>
      </div>
    </figure>
  );
};

export function AnimatedListDemo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-[500px] w-full flex-col overflow-hidden p-2",
        className
      )}
    >
      <AnimatedList>
        {notifications.map((item, idx) => (
          <Notification {...item} key={idx} />
        ))}
      </AnimatedList>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background"></div>
    </div>
  );
}
