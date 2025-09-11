"use client";

import { cn } from "@/lib/utils";
import { ComponentPropsWithoutRef, useCallback, useState } from "react";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Optional CSS class name to apply custom styles
   */
  className?: string;
  /**
   * Whether to reverse the animation direction
   * @default false
   */
  reverse?: boolean;
  /**
   * Whether to pause the animation on hover
   * @default false
   */
  pauseOnHover?: boolean;
  /**
   * Content to be displayed in the marquee
   */
  children: React.ReactNode;
  /**
   * Whether to animate vertically instead of horizontally
   * @default false
   */
  vertical?: boolean;
  /**
   * Number of times to repeat the content
   * @default 4
   */
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  // local hover state to control play-state when pauseOnHover is true
  const [hovered, setHovered] = useState(false);

  const onMouseEnter = useCallback(() => {
    if (pauseOnHover) setHovered(true);
  }, [pauseOnHover]);
  const onMouseLeave = useCallback(() => {
    if (pauseOnHover) setHovered(false);
  }, [pauseOnHover]);

  return (
    <div
      {...props}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
        {
          "flex-row": !vertical,
          "flex-col": vertical,
        },
        className
      )}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            // apply animation styles inline to avoid relying on Tailwind arbitrary properties
            className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
              "animate-marquee flex-row": !vertical,
              "animate-marquee-vertical flex-col": vertical,
            })}
            style={
              {
                animationDirection: reverse ? "reverse" : "normal",
                animationPlayState: pauseOnHover
                  ? hovered
                    ? "paused"
                    : "running"
                  : undefined,
              } as React.CSSProperties
            }
          >
            {children}
          </div>
        ))}
    </div>
  );
}
