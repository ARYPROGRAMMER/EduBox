"use client";

import { Github, Twitter, Linkedin } from "lucide-react";
import { motion } from "framer-motion";

export function LandingFooter() {
  const footerLinks: Record<string, string[]> = {
    Product: ["Features", "Pricing", "API", "Documentation"],
    Company: ["About", "Blog", "Careers", "Press"],
    Resources: ["Help Center", "Community", "Guides", "Webinars"],
    Legal: ["Privacy", "Terms", "Security", "Compliance"],
  };

  return (
    <footer className="relative border-t border-border bg-background/30 backdrop-blur-2xl">
      {/* subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative container mx-auto px-6 py-16 grid gap-12 md:grid-cols-5"
      >
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo-only.png" alt="EduBox Logo" className="w-8 h-8" />
            <span className="text-xl font-semibold">EduBox</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-xs">
            Your intelligent student hub that organizes notes, schedules,
            assignments, and campus life in one place.
          </p>
          <div className="flex gap-4 text-muted-foreground">
            {[Twitter, Github, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="hover:text-primary transition-colors"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(footerLinks).map(([title, items]) => (
          <div key={title}>
            <h3 className="font-medium mb-4">{title}</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {items.map((txt) => (
                <li key={txt}>
                  <a href="#" className="hover:text-primary transition-colors">
                    {txt}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </motion.div>

      <div className="border-t border-border text-center text-xs text-muted-foreground py-4 relative">
        © {new Date().getFullYear()} EduBox · Made with ❤️ by Arya
      </div>
    </footer>
  );
}
