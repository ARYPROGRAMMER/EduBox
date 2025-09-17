"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function LampDemo() {
  return (
    <LampContainer className="bg-gray-50">
      <motion.h1
        initial={{ opacity: 0.6, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7, ease: "easeInOut" }}
        className="mt-6 bg-gradient-to-br from-indigo-600 to-indigo-800 py-2 bg-clip-text text-center text-2xl font-semibold tracking-tight text-transparent sm:text-3xl md:text-5xl lg:text-6xl"
      >
        Build lamps
        <span className="hidden sm:inline"> the right way</span>
        <span className="sm:hidden block"> the right way</span>
      </motion.h1>
    </LampContainer>
  );
}

export const LampContainer = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden w-full bg-white",
        className
      )}
    >
      <div className="relative flex w-full items-center justify-center isolate z-0">
        {/* Glow layers – tighter on small screens */}
        <div className="absolute top-1/2 h-20 w-full -translate-y-2 bg-gradient-to-r from-transparent via-indigo-100/40 to-transparent opacity-70" />
        <div className="absolute z-50 h-20 w-72 sm:w-[20rem] md:w-[28rem] -translate-y-6 rounded-full bg-indigo-600/20" />

        <motion.div
          initial={{ width: "10rem" }}
          whileInView={{ width: "20rem" }}
          transition={{ delay: 0.18, duration: 0.6, ease: "easeInOut" }}
          className="absolute z-30 h-24 w-44 sm:w-72 -translate-y-8 rounded-full bg-indigo-600/30"
        />
        <motion.div
          initial={{ width: "16rem" }}
          whileInView={{ width: "36rem" }}
          transition={{ delay: 0.18, duration: 0.6, ease: "easeInOut" }}
          className="absolute z-50 h-1 w-[28rem] sm:w-[36rem] -translate-y-10 bg-indigo-500/40"
        />
      </div>

      {/* Keep children closer to glow and responsive */}
      <div className="relative z-50 flex -translate-y-12 flex-col items-center px-4 sm:px-6 md:px-8">
        {children}
      </div>
    </div>
  );
};
