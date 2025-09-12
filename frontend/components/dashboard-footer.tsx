"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export function DashboardFooter() {
  return (
    <footer className="relative border-t border-border bg-background/30 backdrop-blur-2xl">
      {/* subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground"
      >
        {/* Left section */}
        <div className="flex items-center gap-1">
          <span>© {new Date().getFullYear()} EduBox · Made with</span>
          <Heart className="h-4 w-4 text-red-500 fill-current" />
          <span>for students</span>
        </div>

        {/* Center status */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            Under Development
          </span>
        </div>

        {/* Right links */}
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-primary transition-colors">
            Help
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Terms
          </a>
        </div>
      </motion.div>
    </footer>
  );
}
