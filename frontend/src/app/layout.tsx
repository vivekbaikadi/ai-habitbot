import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";

import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "HabitBot",
    template: "%s | HabitBot",
  },

  description:
    "Your personal AI-powered habit, nutrition, and wellness companion.",

  applicationName: "HabitBot",

  keywords: [
    "HabitBot",
    "habit tracker",
    "habit tracking",
    "nutrition",
    "wellness",
    "AI coach",
    "health",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}