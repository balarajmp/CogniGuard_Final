import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import GuestBanner from "@/components/GuestBanner";
import LenisProvider from "@/components/LenisProvider";
import LayoutShell from "./LayoutShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CogniGuard — Privacy-First Cognitive Load & Burnout Detection",
  description:
    "CogniGuard is an AI-powered platform that passively monitors cognitive load and burnout risk using privacy-first biometric analysis. Protect your team's mental health with real-time insights.",
  openGraph: {
    title: "CogniGuard — Privacy-First Cognitive Load & Burnout Detection",
    description:
      "AI-powered cognitive health platform with privacy-first biometric analysis.",
    siteName: "CogniGuard",
    type: "website",
    url: "https://cogniguard.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "CogniGuard — Privacy-First Cognitive Load & Burnout Detection",
    description:
      "AI-powered cognitive health platform with privacy-first biometric analysis.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <LenisProvider>
            <GuestBanner />
            <LayoutShell>{children}</LayoutShell>
          </LenisProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
