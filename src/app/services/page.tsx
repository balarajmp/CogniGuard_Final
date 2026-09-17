import type { Metadata } from "next";
import ServicesContent from "./ServicesContent";

export const metadata: Metadata = {
  title: "Services — CogniGuard",
  description:
    "Discover CogniGuard service tiers: Personal (free), Team, and Enterprise. Find the right plan for cognitive health monitoring at any scale.",
  openGraph: {
    title: "Services — CogniGuard",
    description: "Find the right cognitive health plan for individuals, teams, and enterprises.",
    url: "https://cogniguard.ai/services",
    siteName: "CogniGuard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Services — CogniGuard",
    description: "Cognitive health plans for individuals, teams, and enterprises.",
  },
};

export default function ServicesPage() {
  return <ServicesContent />;
}
