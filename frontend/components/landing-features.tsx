import { CalendarIcon, FileTextIcon } from "@radix-ui/react-icons";
import {
  BellIcon,
  Share2Icon,
  Brain,
  BookOpen,
  Users,
  Zap,
} from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import { Marquee } from "@/components/magicui/marquee";
import { AnimatedBeamMultipleOutputDemo } from "./magicui/animated-beam-output";
import { AnimatedListDemo } from "./magicui/animated-list-output";

const files = [
  {
    name: "Computer Science Notes.pdf",
    body: "Complete lecture notes for CS101 including algorithms, data structures, and programming fundamentals.",
  },
  {
    name: "Math Assignment.docx",
    body: "Calculus homework with step-by-step solutions and practice problems for the upcoming exam.",
  },
  {
    name: "Study Schedule.xlsx",
    body: "Organized study timetable with courses, deadlines, and exam dates to maximize productivity.",
  },
  {
    name: "Research Paper.pdf",
    body: "Academic research on machine learning applications in education technology and student engagement.",
  },
  {
    name: "Project Presentation.pptx",
    body: "Final presentation slides for group project including methodology, results, and conclusions.",
  },
  {
    name: "Chemistry Lab Report.docx",
    body: "Detailed lab experiment documentation with observations, data analysis, and scientific conclusions.",
  },
];

const features = [
  {
    Icon: FileTextIcon,
    name: "Smart File Organization",
    description:
      "AI-powered file management that automatically categorizes and organizes your academic documents for quick access.",
    href: "#smart-locker",
    cta: "Explore Smart Locker",
    className: "col-span-1 md:col-span-1 lg:col-span-1",
    background: (
      <Marquee
        pauseOnHover
        className="absolute top-10 [--duration:20s] [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] "
      >
        {files.map((f, idx) => (
          <figure
            key={idx}
            className={cn(
              "relative w-32 cursor-pointer overflow-hidden rounded-xl border p-4",
              "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
              "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
              "transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none"
            )}
          >
            <div className="flex flex-row items-center gap-2">
              <div className="flex flex-col">
                <figcaption className="text-sm font-medium dark:text-white ">
                  {f.name}
                </figcaption>
              </div>
            </div>
            <blockquote className="mt-2 text-xs">{f.body}</blockquote>
          </figure>
        ))}
      </Marquee>
    ),
  },
  {
    Icon: BellIcon,
    name: "Smart Notifications",
    description:
      "Never miss deadlines with intelligent reminders for assignments, exams, and important academic events.",
    href: "#notifications",
    cta: "View Notifications",
    className: "col-span-1 md:col-span-2 lg:col-span-2",
    background: (
      <AnimatedListDemo className="absolute right-2 top-4 h-[300px] w-full scale-75 border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-90" />
    ),
  },
  {
    Icon: Brain,
    name: "AI Study Assistant",
    description:
      "Get instant help with your studies through our intelligent AI assistant that understands academic content.",
    href: "#ai-assistant",
    cta: "Try AI Assistant",
    className: "col-span-1 md:col-span-2 lg:col-span-2",
    background: (
      <AnimatedBeamMultipleOutputDemo className="absolute right-2 top-4 h-[300px] border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105" />
    ),
  },
  {
    Icon: CalendarIcon,
    name: "Academic Calendar",
    description:
      "Keep track of all your courses, assignments, and exam dates in one organized calendar view.",
    className: "col-span-1 md:col-span-1 lg:col-span-1",
    href: "#planner",
    cta: "Open Planner",
    background: (
      <Calendar
        mode="single"
        selected={new Date(2022, 4, 11, 0, 0, 0)}
        className="absolute right-0 top-10 origin-top scale-75 rounded-md border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-90"
      />
    ),
  },
];

export function BentoDemo() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need for{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Academic Success
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four powerful tools working together to make your student life
            organized, efficient, and stress-free.
          </p>
        </div>

        <BentoGrid className="max-w-7xl mx-auto">
          {features.map((feature, idx) => (
            <BentoCard key={idx} {...feature} />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
