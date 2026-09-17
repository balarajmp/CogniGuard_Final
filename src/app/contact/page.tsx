import type { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact — CogniGuard",
  description:
    "Get in touch with the CogniGuard team. Reach out for sales inquiries, support, partnerships, or general questions.",
  openGraph: {
    title: "Contact — CogniGuard",
    description: "Reach out to the CogniGuard team for sales, support, or partnerships.",
    url: "https://cogniguard.ai/contact",
    siteName: "CogniGuard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact — CogniGuard",
    description: "Get in touch with CogniGuard.",
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
