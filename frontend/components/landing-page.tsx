"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Users, CheckIcon, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { GradientText } from "@/components/ui/gradient-text";
import { LandingFooter } from "@/components/landing-footer";
import { LandingHeader } from "@/components/landing-header";
import { DotPattern } from "@/components/ui/dot-pattern";
import { SignUpButton } from "@clerk/nextjs";
import { BentoDemo } from "./landing-features";
import { HeroVideoDialogDemo } from "./magicui/hero-video-output";
import { MarqueeDemo } from "./magicui/marquee-output";
import { HoverBorderGradient } from "./ui/hover-border-gradient";
import { HeroHighlight, Highlight } from "./ui/hero-highlight";


export function LandingPage() {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <LandingHeader />

      <section className="relative py-20 sm:py-32">
        {/* dense grid covering full hero section */}
        <DotPattern
          width={16}
          height={16}
          cx={1}
          cy={1}
          cr={0.8}
          className="text-neutral-400/40 dark:text-neutral-600/40"
        />

        {/* additional dense overlay with offset for fuller coverage */}
        <DotPattern
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={0.7}
          className="text-neutral-300/30 dark:text-neutral-700/30"
          style={{
            transform: "translate(10px, 10px)",
          }}
        />

        {/* third layer for maximum coverage */}
        <DotPattern
          width={24}
          height={24}
          cx={1}
          cy={1}
          cr={0.6}
          className="text-neutral-500/20 dark:text-neutral-500/20"
          style={{
            transform: "translate(-8px, 8px)",
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="flex justify-center text-center">
                <HoverBorderGradient
                  containerClassName="rounded-full"
                  as="button"
                  className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2"
                >
                  <EduboxLogo />
                  <span> Introducing EduBox v1.0</span>
                </HoverBorderGradient>
              </div>
            </motion.div>

            <HeroHighlight containerClassName="py-12 sm:py-20">
              <motion.h1
                className="text-5xl sm:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Your AI-Powered{" "}
                <Highlight className="text-black dark:text-white">
                  <GradientText className="text-5xl sm:text-6xl font-bold ">
                    Student Hub
                  </GradientText>
                </Highlight>
              </motion.h1>

              <motion.p
                className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Organize your notes, manage your schedule, and stay connected
                with campus life. EduBox is the only digital companion you need
                for academic success.
              </motion.p>
            </HeroHighlight>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <SignUpButton mode="modal">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </SignUpButton>
            </motion.div>

            
          </motion.div>
        </div>

        <div className="absolute top-20 left-10 opacity-15">
          <div className="w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute bottom-20 right-10 opacity-15">
          <div className="w-96 h-96 bg-gradient-to-r from-green-400 to-blue-600 rounded-full blur-3xl"></div>
        </div>
      </section>

      <div id="demo">
        <HeroVideoDialogDemo />
      </div>

      <div id="features">
        <BentoDemo />
      </div>

      <div id="testimonials">
        <MarqueeDemo />
      </div>

      <div id="about">
        <LandingFooter />
      </div>
    </div>
  );
}

const EduboxLogo = () => (
  <img src="/logo-only.png" alt="EduBox Logo" className="w-8 h-8" />
);
