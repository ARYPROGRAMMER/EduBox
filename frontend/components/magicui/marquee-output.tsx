/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";
import { Star } from "lucide-react";

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

const firstRow = reviews.slice(0, 3);
const secondRow = reviews.slice(3, 6);

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
}) => {
  return (
    <figure
      className={cn(
        "relative w-80 h-auto cursor-pointer overflow-hidden rounded-xl border p-6 mx-4",
        // light styles
        "border-gray-950/[.1] bg-white/80 hover:bg-white/90 backdrop-blur-sm",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
        // transition
        "transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105"
      )}
    >
      <div className="flex flex-row items-center gap-3 mb-4">
        <img
          className="rounded-full w-12 h-12 object-cover border-2 border-gray-200 dark:border-gray-700"
          width="48"
          height="48"
          alt={`${name} avatar`}
          src={img}
        />
        <div className="flex flex-col">
          <figcaption className="text-base font-semibold dark:text-white">
            {name}
          </figcaption>
          <p className="text-sm font-medium text-muted-foreground dark:text-white/60">
            {username}
          </p>
        </div>
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      <blockquote className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        "{body}"
      </blockquote>
    </figure>
  );
};

export function MarqueeDemo() {
  return (
    <section className="py-20 ">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Loved by{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Students Everywhere
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of students who've transformed their academic
            experience with EduBox
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 mb-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <span className="font-medium">4.9/5 average rating</span>
            </div>
            <div className="h-4 w-px bg-muted-foreground/30"></div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">10,000+</span> happy students
            </div>
            <div className="h-4 w-px bg-muted-foreground/30"></div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">500+</span> universities
            </div>
          </div>
        </div>

        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-8">
          <Marquee pauseOnHover className="[--duration:25s] mb-6">
            {firstRow.map((review) => (
              <ReviewCard key={review.username} {...review} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="[--duration:30s]">
            {secondRow.map((review) => (
              <ReviewCard key={review.username} {...review} />
            ))}
          </Marquee>

          {/* Gradient overlays for smooth fade effect */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background via-background/80 to-transparent z-10"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background via-background/80 to-transparent z-10"></div>
        </div>
      </div>
    </section>
  );
}
