import type React from "react";
import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";
import { LoadingProvider } from "@/components/ui/loading-context";
import { PageLoader } from "@/components/ui/loader";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  variable: "--font-comfortaa",
});

export const metadata: Metadata = {
  title: "EduBox - AI Digital Locker for Students",
  description:
    "Your intelligent student hub that organizes notes, schedules, assignments, and campus life in one place",
  icons: {
    icon: "/logo-only.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${comfortaa.variable} font-sans antialiased`}>
        <ClerkProvider>
          <Suspense fallback={<PageLoader text="Initializing EduBox..." />}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <LoadingProvider>{children}</LoadingProvider>
              <Toaster />
            </ThemeProvider>
          </Suspense>
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}
