import React from "react";
import Link from "next/link";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />

      <main className="container mx-auto flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-2xl text-center">
          <h1 className="text-7xl font-extrabold tracking-tight">404</h1>
          <p className="mt-6 text-2xl font-semibold text-muted-foreground">
            Oops — the page you&apos;re looking for can&apos;t be found.
          </p>
          <p className="mt-4 text-base text-muted-foreground">
            It may have been moved or deleted. Try returning to the homepage.
          </p>

          <div className="mt-8 flex items-center justify-center space-x-4">
            <Button asChild variant="default">
              <Link href="/">Return home</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
