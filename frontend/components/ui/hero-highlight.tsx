"use client";
import { cn } from "@/lib/utils";
import { useMotionValue, motion, useMotionTemplate } from "motion/react";
import React from "react";

export const HeroHighlight = ({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  // SVG patterns for different states and themes
  const dotPatterns = {
    light: {
      // light gray dots for light mode default
      default: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23e6e7eb' id='pattern-circle' cx='10' cy='10' r='2'%3E%3C/circle%3E%3C/svg%3E")`,
      // black dots to match black highlight
      hover: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23000000' id='pattern-circle' cx='10' cy='10' r='2'%3E%3C/circle%3E%3C/svg%3E")`,
    },
    dark: {
      // darker dots in dark mode
      default: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%232e2e2e' id='pattern-circle' cx='10' cy='10' r='2'%3E%3C/circle%3E%3C/svg%3E")`,
      // white dots to match white highlight in dark mode
      hover: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23ffffff' id='pattern-circle' cx='10' cy='10' r='2'%3E%3C/circle%3E%3C/svg%3E")`,
    },
  };

  function handleMouseMove({
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    // Use viewport coordinates directly so the fixed/full-viewport overlay
    // mask positions correctly under the cursor regardless of the hero's
    // position on the page.
    mouseX.set(clientX);
    mouseY.set(clientY);
  }
  return (
    <div
      className={cn(
        // keep layout and pointer-grouping but allow transparent background so page blobs/patterns show through
        "group relative flex w-full items-center justify-center",
        containerClassName
      )}
      onMouseMove={handleMouseMove}
    >
      <div
        className="pointer-events-none fixed inset-0 dark:hidden opacity-30"
        style={{
          backgroundImage: dotPatterns.light.default,
          backgroundRepeat: "repeat",
          // increase density by reducing spacing
          backgroundSize: "24px 24px",
          backgroundAttachment: "fixed",
          width: "100vw",
          height: "100vh",
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 hidden dark:block opacity-20"
        style={{
          backgroundImage: dotPatterns.dark.default,
          backgroundRepeat: "repeat",
          backgroundSize: "24px 24px",
          backgroundAttachment: "fixed",
          width: "100vw",
          height: "100vh",
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      />
      <motion.div
        className="pointer-events-none fixed inset-0 opacity-0 transition duration-300 group-hover:opacity-100 dark:hidden"
        style={{
          backgroundImage: dotPatterns.light.hover,
          backgroundRepeat: "repeat",
          backgroundSize: "24px 24px",
          backgroundAttachment: "fixed",
          width: "100vw",
          height: "100vh",
          top: 0,
          left: 0,
          zIndex: 10,
          // Use motion template but offset the mouse coordinates so they map to viewport
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              260px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              260px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
        }}
      />
      <motion.div
        className="pointer-events-none fixed inset-0 hidden opacity-0 transition duration-300 group-hover:opacity-100 dark:block"
        style={{
          backgroundImage: dotPatterns.dark.hover,
          backgroundRepeat: "repeat",
          backgroundSize: "24px 24px",
          backgroundAttachment: "fixed",
          width: "100vw",
          height: "100vh",
          top: 0,
          left: 0,
          zIndex: 10,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              260px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              260px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
        }}
      />

      <div className={cn("relative z-20", className)}>{children}</div>
    </div>
  );
};

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.span
      initial={{
        backgroundSize: "0% 100%",
      }}
      animate={{
        backgroundSize: "100% 100%",
      }}
      transition={{
        duration: 2,
        ease: "linear",
        delay: 0.5,
      }}
      style={{
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        display: "inline",
      }}
      className={cn(
        // Use CSS variables for the background that can be controlled by theme
        `relative inline-block rounded-lg px-1 pb-1 
         [background-image:linear-gradient(90deg,black,black)] text-white
         dark:[background-image:linear-gradient(90deg,white,white)] dark:text-black`,
        className
      )}
    >
      {children}
    </motion.span>
  );
};
