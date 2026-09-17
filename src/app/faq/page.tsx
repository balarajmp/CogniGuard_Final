import type { Metadata } from "next";
import FAQContent from "./FAQContent";

export const metadata: Metadata = {
  title: "FAQ — CogniGuard",
  description:
    "Frequently asked questions about CogniGuard: privacy, technical requirements, pricing, and how cognitive load detection works.",
  openGraph: {
    title: "FAQ — CogniGuard",
    description: "Answers to common questions about CogniGuard's cognitive health platform.",
    url: "https://cogniguard.ai/faq",
    siteName: "CogniGuard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — CogniGuard",
    description: "Answers to common questions about CogniGuard.",
  },
};

export default function FAQPage() {
  return <FAQContent />;
}
