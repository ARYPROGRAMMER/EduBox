"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
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
import { useRef } from "react";
import YoutubeVideoForm from "./input-form-main";
import { PointerHighlight } from "./ui/pointer-highlight";

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Parallax effects for background elements
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const dotOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background scroll-smooth overflow-hidden"
    >
      <LandingHeader />

      <section className="relative py-24 sm:py-32 lg:py-40 min-h-screen flex items-center">
        {/* Enhanced dot patterns with scroll-based opacity */}
        <motion.div style={{ opacity: dotOpacity }}>
          <DotPattern
            width={16}
            height={16}
            cx={1}
            cy={1}
            cr={0.8}
            className="text-neutral-400/40 dark:text-neutral-600/40"
          />

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
        </motion.div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center space-y-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="flex justify-center text-center mb-8">
                <HoverBorderGradient
                  containerClassName="rounded-full"
                  as="button"
                  className="flex items-center space-x-2 bg-background/80 backdrop-blur-sm"
                >
                  <EduboxLogo />
                  <span > Introducing EduBox v1.0</span>
                </HoverBorderGradient>
              </div>
            </motion.div>

            <HeroHighlight containerClassName="py-12 sm:py-20">
              <motion.h1
                className="text-4xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-5xl mx-auto leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Your AI-Powered{" "}
                <Highlight className="text-black dark:text-white">
                  <GradientText className="text-4xl sm:text-4xl lg:text-5xl font-bold">
                    Student Hub
                  </GradientText>
                </Highlight>
              </motion.h1>

              <motion.div
                className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Organize your notes, manage your schedule, and stay connected
                with campus life. EduBox is the only digital companion you need
                for{" "}
                <PointerHighlight containerClassName="inline-block align-baseline">
                  academic
                </PointerHighlight>{" "}
                success.
              </motion.div>

              <motion.div 
                className="group relative mt-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <div className="flex flex-col items-center gap-6">
            
                  
                  <motion.div
                    className="w-full max-w-2xl"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.0, duration: 0.3 }}
                  >
                    <YoutubeVideoForm />
                  </motion.div>
                  
                  <motion.div 
                    className="flex flex-wrap justify-center items-center gap-4 text-xs text-muted-foreground/60"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1, duration: 0.5 }}
                  >
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/30">
                      ✨ AI-powered analysis
                    </span>
                    <span className="w-1 h-1 bg-muted-foreground/30 rounded-full hidden sm:block"></span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/30">
                      📝 Interactive notes
                    </span>
                    <span className="w-1 h-1 bg-muted-foreground/30 rounded-full hidden sm:block"></span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/30">
                      🤖 Smart chat assistant
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            </HeroHighlight>
          </motion.div>
        </div>

        {/* Enhanced background gradients with parallax */}
        <motion.div
          className="absolute top-1/4 left-10 opacity-20"
          style={{ y: backgroundY }}
        >
          <div className="w-96 h-96 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-3xl"></div>
        </motion.div>
        <motion.div
          className="absolute bottom-1/4 right-10 opacity-20"
          style={{ y: backgroundY }}
        >
          <div className="w-80 h-80 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full blur-3xl"></div>
        </motion.div>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10"
          style={{ y: backgroundY }}
        >
          <div className="w-[600px] h-[600px] bg-gradient-to-r from-orange-400 via-pink-500 to-red-500 rounded-full blur-3xl"></div>
        </motion.div>
      </section>

      <motion.section
        id="demo"
        className="py-24 sm:py-32"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <HeroVideoDialogDemo />
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        id="features"
        className="py-24 sm:py-32"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <BentoDemo />
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        id="testimonials"
        className="py-24 sm:py-32"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <MarqueeDemo />
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        id="about"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <LandingFooter />
        </motion.div>
      </motion.section>
    </div>
  );
}

const EduboxLogo = () => (
  <img src="/logo-only.png" alt="EduBox Logo" className="w-8 h-8" />
);
