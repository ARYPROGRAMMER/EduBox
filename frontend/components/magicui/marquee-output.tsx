/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";
import { Star } from "lucide-react";
import { SparklesCore } from "../ui/sparkles";

const reviews = [
  {
    name: "Sarah Chen",
    username: "@sarahc_cs",
    body: "EduBox completely transformed how I organize my CS assignments. The AI filing system is incredible!",
    img: "/professional-woman-avatar.png",
  },
  {
    name: "Marcus Johnson",
    username: "@marcus_eng",
    body: "Never missed a deadline since using EduBox. The smart notifications are a game-changer.",
    img: "/professional-man-avatar.png",
  },
  {
    name: "Emma Rodriguez",
    username: "@emma_bio",
    body: "The AI study assistant helped me ace my biology exams. It's like having a personal tutor 24/7.",
    img: "/professional-woman-avatar-2.png",
  },
  {
    name: "Alex Kim",
    username: "@alex_design",
    body: "Love how EduBox keeps all my design projects organized. The campus life integration is amazing too!",
    img: "/professional-woman-avatar.png",
  },
  {
    name: "David Chen",
    username: "@david_math",
    body: "EduBox's planning features helped me balance my course load perfectly. Highly recommend!",
    img: "/professional-man-avatar.png",
  },
  {
    name: "Lisa Wang",
    username: "@lisa_premed",
    body: "The file organization saved me countless hours. Perfect for managing pre-med coursework.",
    img: "/professional-woman-avatar-2.png",
  },
];

const StarRow = () => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
    ))}
  </div>
);

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => (
  <figure
    className={cn(
      "relative mx-4 w-80 rounded-xl border p-6 transition-all duration-300 ease-in-out",
      "bg-white/80 hover:bg-white/90 dark:bg-gray-50/10 dark:hover:bg-gray-50/15",
      "border-gray-950/10 dark:border-gray-50/10",
      "cursor-pointer overflow-hidden hover:scale-105 hover:shadow-lg backdrop-blur-sm"
    )}
  >
    <div className="mb-4 flex items-center gap-3">
      <img
        src={img}
        alt={`${name} avatar`}
        width={48}
        height={48}
        className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
      />
      <div>
        <figcaption className="text-base font-semibold">{name}</figcaption>
        <p className="text-sm text-muted-foreground">{username}</p>
      </div>
    </div>

    <div className="mb-3">
      <StarRow />
    </div>

    <blockquote className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      “{body}”
    </blockquote>
  </figure>
);

export function MarqueeDemo() {
  const firstRow = reviews.slice(0, 3);
  const secondRow = reviews.slice(3, 6);

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="relative text-center">
          <h2 className="mb-2 text-3xl font-bold sm:text-4xl">
            Loved by{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Students Everywhere
            </span>
          </h2>

          {/* Decorative gradient lines */}
          <div className="relative mx-auto mb-4 h-6 w-[40rem] max-w-full">
            <div className="absolute inset-x-20 top-0 h-px w-3/4 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
            <div className="absolute inset-x-20 top-0 h-[2px] w-3/4 bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm" />
            <div className="absolute inset-x-60 top-0 h-px w-1/4 bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
            <div className="absolute inset-x-60 top-0 h-[5px] w-1/4 bg-gradient-to-r from-transparent via-sky-500 to-transparent blur-sm" />
          </div>

          <p className="mx-auto mb-8 mt-4 max-w-2xl text-lg text-muted-foreground">
            Join thousands of students who've transformed their academic
            experience with EduBox
          </p>

          {/* Trust indicators */}
          <div className="mb-16 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <StarRow />
              <span className="font-medium">4.9/5 average rating</span>
            </div>
            <div className="h-4 w-px bg-muted-foreground/30" />
            <div>
              <span className="font-medium">10,000+</span> happy students
            </div>
          </div>

          {/* Marquee with sparkles */}
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-8">
            <SparklesCore
              background="transparent"
              minSize={1}
              maxSize={2}
              particleDensity={200}
              className="absolute inset-0 block h-full w-full opacity-70 dark:hidden"
              particleColor="#60A5FACC"
            />
            <SparklesCore
              background="transparent"
              minSize={1}
              maxSize={2}
              particleDensity={200}
              className="absolute inset-0 hidden h-full w-full opacity-40 dark:block"
              particleColor="#FFFFFF80"
            />

            <Marquee pauseOnHover className="[--duration:25s] mb-6">
              {firstRow.map((r) => (
                <ReviewCard key={r.username} {...r} />
              ))}
            </Marquee>
            <Marquee reverse pauseOnHover className="[--duration:30s]">
              {secondRow.map((r) => (
                <ReviewCard key={r.username} {...r} />
              ))}
            </Marquee>

            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background via-background/80 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
