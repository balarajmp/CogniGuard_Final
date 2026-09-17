import type { Metadata } from "next";
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: "About — CogniGuard",
  description:
    "Learn about CogniGuard's mission to protect cognitive health with privacy-first AI technology. Our story, vision, and the team behind the platform.",
  openGraph: {
    title: "About — CogniGuard",
    description:
      "Learn about CogniGuard's mission to protect cognitive health with privacy-first AI technology.",
    url: "https://cogniguard.ai/about",
    siteName: "CogniGuard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About — CogniGuard",
    description:
      "Learn about CogniGuard's mission to protect cognitive health with privacy-first AI.",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
