"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface AnimatedBeamProps {
  className?: string;
  containerRef: React.RefObject<HTMLElement>;
  fromRef: React.RefObject<HTMLElement>;
  toRef: React.RefObject<HTMLElement>;
  curvature?: number;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = Math.random() * 3 + 4,
  delay = 0,
  pathColor = "gray",
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = "#18CCFC",
  gradientStopColor = "#6344F5",
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}) => {
  const id = React.useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [pathD, setPathD] = useState("");
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  const updatePath = () => {
    if (containerRef.current && fromRef.current && toRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const rectA = fromRef.current.getBoundingClientRect();
      const rectB = toRef.current.getBoundingClientRect();

      const svgWidth = containerRect.width;
      const svgHeight = containerRect.height;
      setSvgDimensions({ width: svgWidth, height: svgHeight });

      const startX =
        rectA.left - containerRect.left + rectA.width / 2 + startXOffset;
      const startY =
        rectA.top - containerRect.top + rectA.height / 2 + startYOffset;
      const endX =
        rectB.left - containerRect.left + rectB.width / 2 + endXOffset;
      const endY =
        rectB.top - containerRect.top + rectB.height / 2 + endYOffset;

      const controlPointX = startX + (endX - startX) / 2;
      const controlPointY = startY - curvature;

      const d = `M ${startX},${startY} Q ${controlPointX},${controlPointY} ${endX},${endY}`;
      setPathD(d);
    }
  };

  useEffect(() => {
    updatePath();
    window.addEventListener("resize", updatePath);
    return () => window.removeEventListener("resize", updatePath);
  }, []);

  return (
    <svg
      ref={svgRef}
      width={svgDimensions.width}
      height={svgDimensions.height}
      className={cn(
        "pointer-events-none absolute left-0 top-0 transform-gpu stroke-2",
        className
      )}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
    >
      <defs>
        <linearGradient
          className={`transform-gpu`}
          id={id}
          gradientUnits="userSpaceOnUse"
          x1="0%"
          x2="100%"
          y1="0%"
          y2="0%"
        >
          {reverse && (
            <>
              <stop stopColor={gradientStopColor} stopOpacity="0" />
              <motion.stop
                stopColor={gradientStopColor}
                stopOpacity="1"
                animate={{
                  stopColor: [gradientStartColor, gradientStopColor],
                }}
                transition={{
                  delay,
                  duration,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "linear",
                  repeatDelay: 0,
                }}
              />
              <motion.stop
                stopColor={gradientStartColor}
                stopOpacity="1"
                animate={{
                  stopColor: [gradientStartColor, gradientStopColor],
                }}
                transition={{
                  delay,
                  duration,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "linear",
                  repeatDelay: 0,
                }}
              />
              <stop stopColor={gradientStartColor} stopOpacity="0" />
            </>
          )}
          {!reverse && (
            <>
              <stop stopColor={gradientStartColor} stopOpacity="0" />
              <motion.stop
                stopColor={gradientStartColor}
                stopOpacity="1"
                animate={{
                  stopColor: [gradientStartColor, gradientStopColor],
                }}
                transition={{
                  delay,
                  duration,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "linear",
                  repeatDelay: 0,
                }}
              />
              <motion.stop
                stopColor={gradientStopColor}
                stopOpacity="1"
                animate={{
                  stopColor: [gradientStartColor, gradientStopColor],
                }}
                transition={{
                  delay,
                  duration,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "linear",
                  repeatDelay: 0,
                }}
              />
              <stop stopColor={gradientStopColor} stopOpacity="0" />
            </>
          )}
        </linearGradient>
      </defs>
      <motion.path
        d={pathD}
        fill="none"
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      <motion.path
        d={pathD}
        fill="none"
        strokeWidth={pathWidth}
        stroke={`url(#${id})`}
        strokeOpacity="1"
        strokeLinecap="round"
        initial={{
          strokeDasharray: 1000,
          strokeDashoffset: 1000,
        }}
        animate={{
          strokeDashoffset: reverse ? 1000 : -1000,
        }}
        transition={{
          delay,
          duration,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
        }}
      />
    </svg>
  );
};
