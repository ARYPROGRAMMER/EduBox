"use client"

import { Button } from "@/components/ui/button"
import { Menu, X, Moon, Sun } from "lucide-react"
import { useState } from "react"
import { useTheme } from "next-themes"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600"></div>
          <span className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            AgentAI
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <a
            href="#features"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--muted-foreground)" }}
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--muted-foreground)" }}
          >
            Pricing
          </a>
          <a
            href="#testimonials"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--muted-foreground)" }}
          >
            Testimonials
          </a>
          <a href="#faq" className="text-sm font-medium transition-colors" style={{ color: "var(--muted-foreground)" }}>
            FAQ
          </a>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{ color: "var(--foreground)" }}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button variant="ghost" size="sm" style={{ color: "var(--foreground)" }}>
            Sign In
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
          >
            Get Started
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ color: "var(--foreground)" }}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
    </header>
  )
}
