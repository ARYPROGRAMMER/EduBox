"use client";

import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";

export function LandingHeader() {
  // Theme is forced on the landing page; no local theme control here.
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: "Demo", link: "#demo" },
    { name: "Features", link: "#features" },

    { name: "Testimonials", link: "#testimonials" },
  ];

  const logoSection = (
    <Link href="/" className="flex items-center space-x-3">
      <img src="/logo-only.png" alt="EduBox Logo" className="w-8 h-8" />
      <span className="font-bold text-xl text-black dark:text-white">
        EduBox
      </span>
    </Link>
  );

  // No theme toggle on landing page; theme is controlled globally.
  const themeToggle = null;

  const authButtons =
    mounted && !isSignedIn ? (
      <div className="flex items-center space-x-3">
        <SignInButton mode="modal">
          <NavbarButton variant="gradient">Sign In</NavbarButton>
        </SignInButton>
      </div>
    ) : mounted && isSignedIn ? (
      // Render NavbarButton as a Next.js Link to avoid nested <a> tags
      <NavbarButton as={Link} href="/dashboard" variant="gradient">
        Go to Dashboard
      </NavbarButton>
    ) : (
      <div className="flex space-x-3">
        <div className="w-16 h-10 bg-muted/50 rounded animate-pulse" />
        <div className="w-24 h-10 bg-muted/50 rounded animate-pulse" />
      </div>
    );

  const mobileAuthButtons =
    mounted && !isSignedIn ? (
      <div className="space-y-3 w-full">
        <SignInButton mode="modal">
          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3">
            Sign In
          </Button>
        </SignInButton>
      </div>
    ) : mounted && isSignedIn ? (
      // Use Button asChild so Link is the rendered element (no nested anchors)
      <div className="w-full">
        <Button
          asChild
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
        >
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    ) : (
      <div className="flex space-x-4 w-full">
        <div className="w-full h-12 bg-muted/50 rounded animate-pulse" />
      </div>
    );

  return (
    <div className="relative">
      <Navbar className="fixed top-4 z-50 px-4">
        <NavBody className="">
          {logoSection}
          <NavItems items={navItems} />
          <div className="flex items-center space-x-4 relative z-20">
            {authButtons}
          </div>
        </NavBody>
        <MobileNav className="">
          <MobileNavHeader>
            {logoSection}
            <div className="flex items-center space-x-3 relative z-10">
              <MobileNavToggle
                isOpen={isMenuOpen}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              />
            </div>
          </MobileNavHeader>
          <MobileNavMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
          >
            <div className="space-y-6 w-full">
              {navItems.map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  className="block py-3 text-base font-medium transition-colors hover:text-primary text-black dark:text-white border-b border-neutral-200 dark:border-neutral-700 last:border-b-0"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4">{mobileAuthButtons}</div>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
