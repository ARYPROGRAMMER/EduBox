import type React from "react";
import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import "./globals.css";
import "@progress/kendo-theme-default/dist/all.css";
import ClientWrapper from "@/components/ClientWrapper";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { PageLoader } from "@/components/ui/loader";
import { ThemeProvider } from "next-themes";
import { LoadingProvider } from "@/components/ui/loading-context";
import { Analytics } from "@vercel/analytics/react";

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
  const schematicPubKey = process.env.NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY;
  if (!schematicPubKey) {
    throw new Error("Schematic publishable key is not set");
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${comfortaa.variable} font-sans antialiased`}>
        <Suspense fallback={<PageLoader text="Initializing EduBox..." />}>
          <LoadingProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
              storageKey="edubox-theme"
            >
              <ClientWrapper>
                <main>{children}</main>
                <Toaster position="bottom-left" />
                <Analytics />
              </ClientWrapper>
            </ThemeProvider>
          </LoadingProvider>
        </Suspense>
      </body>
    </html>
  );
}
