import type { Metadata } from "next";
import FeaturesContent from "./FeaturesContent";

export const metadata: Metadata = {
  title: "Features — CogniGuard",
  description:
    "Explore CogniGuard's powerful features: real-time cognitive load detection, burnout risk scoring, privacy-first architecture, smart interventions, and enterprise analytics.",
  openGraph: {
    title: "Features — CogniGuard",
    description:
      "Real-time cognitive load detection, burnout prevention, and privacy-first enterprise analytics.",
    url: "https://cogniguard.ai/features",
    siteName: "CogniGuard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Features — CogniGuard",
    description:
      "Real-time cognitive load detection, burnout prevention, and privacy-first analytics.",
  },
};

export default function FeaturesPage() {
  return <FeaturesContent />;
}
