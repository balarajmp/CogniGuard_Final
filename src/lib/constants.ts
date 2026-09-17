import {
  Brain,
  Shield,
  Activity,
  Zap,
  BarChart3,
  Lock,
  Globe,
  Cpu,
  type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   Site-wide Constants
   ═══════════════════════════════════════════════════════════════════════════ */

export const SITE = {
  name: "CogniGuard",
  tagline: "Privacy-First Cognitive Load & Burnout Detection",
  description:
    "CogniGuard is an AI-powered platform that passively monitors cognitive load and burnout risk using privacy-first biometric analysis. Protect your team's mental health with real-time insights.",
  url: "https://cogniguard.ai",
  email: "hello@cogniguard.ai",
  supportEmail: "support@cogniguard.ai",
} as const;

/* ── Navigation ──────────────────────────────────────────────────────────── */

export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/home" },
  { label: "About", href: "/about" },
  { label: "Features", href: "/features" },
  { label: "Services", href: "/services" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

/* ── Footer ──────────────────────────────────────────────────────────────── */

export const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "/features" },
    { label: "Services", href: "/services" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "FAQ", href: "/faq" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "#" },
    { label: "GDPR", href: "#" },
  ],
} as const;

export const SOCIAL_LINKS = [
  { label: "Twitter / X", href: "#", icon: "twitter" },
  { label: "GitHub", href: "#", icon: "github" },
  { label: "LinkedIn", href: "#", icon: "linkedin" },
] as const;

/* ── Features ────────────────────────────────────────────────────────────── */

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  category: string;
}

export const FEATURES: Feature[] = [
  {
    icon: Brain,
    title: "Cognitive Load Detection",
    description:
      "Real-time analysis of typing patterns, mouse dynamics, and interaction cadence to quantify mental workload without invasive sensors.",
    category: "Detection",
  },
  {
    icon: Activity,
    title: "Burnout Risk Scoring",
    description:
      "Proprietary burnout index combining 12+ behavioral signals into a single, actionable risk score updated every 60 seconds.",
    category: "Detection",
  },
  {
    icon: Shield,
    title: "Privacy-First Architecture",
    description:
      "All biometric data processed on-device. No raw data ever leaves the user's machine. Differential privacy applied to aggregate analytics.",
    category: "Privacy",
  },
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description:
      "TLS 1.3 in transit, AES-256 at rest. Zero-knowledge architecture means even CogniGuard cannot read individual user data.",
    category: "Privacy",
  },
  {
    icon: Zap,
    title: "Smart Interventions",
    description:
      "Context-aware break suggestions, breathing exercises, and workload redistribution recommendations triggered at the right moment.",
    category: "Wellness",
  },
  {
    icon: BarChart3,
    title: "Enterprise Analytics",
    description:
      "Aggregate team health dashboards, department-level burnout trends, and ROI reports — all with individual privacy preserved.",
    category: "Enterprise",
  },
  {
    icon: Globe,
    title: "Multi-Platform Support",
    description:
      "Desktop agents for Windows, macOS, Linux. Browser extensions for Chrome and Firefox. Mobile companion app for iOS and Android.",
    category: "Enterprise",
  },
  {
    icon: Cpu,
    title: "Edge AI Processing",
    description:
      "Lightweight ML models run entirely on-device. Sub-10ms inference latency with less than 2% CPU overhead.",
    category: "Detection",
  },
];

/* ── FAQ ──────────────────────────────────────────────────────────────────── */

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How does CogniGuard detect cognitive load?",
    answer:
      "CogniGuard uses passive behavioral biometrics — typing cadence, mouse movement patterns, scroll velocity, and application switching frequency — to infer cognitive load without any wearable devices or cameras.",
    category: "General",
  },
  {
    question: "Is my personal data safe?",
    answer:
      "Absolutely. All biometric analysis happens on your device. Only anonymized, aggregated metrics are sent to your organization's dashboard. We use differential privacy, end-to-end encryption, and a zero-knowledge architecture.",
    category: "Privacy",
  },
  {
    question: "What platforms are supported?",
    answer:
      "CogniGuard supports Windows 10+, macOS 12+, and Ubuntu 20.04+. Browser extensions are available for Chrome and Firefox. A mobile companion app is available for iOS 16+ and Android 12+.",
    category: "Technical",
  },
  {
    question: "How much CPU does the agent use?",
    answer:
      "Less than 2% on modern hardware. Our edge AI models are optimized with ONNX Runtime for minimal resource consumption. You won't notice it running.",
    category: "Technical",
  },
  {
    question: "Can managers see individual employee data?",
    answer:
      "No. Managers only see anonymized, team-level aggregates. Individual burnout scores are visible only to the user themselves. This is enforced architecturally, not just by policy.",
    category: "Privacy",
  },
  {
    question: "Is there a free tier?",
    answer:
      "Yes. Individual users can use CogniGuard Personal for free with full cognitive load detection and personal burnout insights. Enterprise features like team analytics and API access require a paid plan.",
    category: "Pricing",
  },
  {
    question: "How do smart interventions work?",
    answer:
      "When your burnout risk crosses a configurable threshold, CogniGuard suggests context-appropriate micro-breaks: breathing exercises, stretch reminders, or focus mode activation. Interventions are never forced — always optional.",
    category: "General",
  },
  {
    question: "Can I self-host CogniGuard?",
    answer:
      "Enterprise customers can deploy CogniGuard on-premises or in their private cloud. We provide Docker images, Kubernetes Helm charts, and Terraform modules for AWS, GCP, and Azure.",
    category: "Technical",
  },
];

/* ── Services / Tiers ────────────────────────────────────────────────────── */

export interface ServiceTier {
  name: string;
  tagline: string;
  price: string;
  period: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export const SERVICE_TIERS: ServiceTier[] = [
  {
    name: "Personal",
    tagline: "For individual developers",
    price: "Free",
    period: "forever",
    features: [
      "Cognitive load detection",
      "Personal burnout dashboard",
      "Smart break interventions",
      "7-day history",
      "Browser extension",
    ],
    highlighted: false,
    cta: "Get Started",
  },
  {
    name: "Team",
    tagline: "For growing teams",
    price: "$12",
    period: "per user / month",
    features: [
      "Everything in Personal",
      "Team health dashboard",
      "Department analytics",
      "30-day history",
      "Slack & Teams integration",
      "Priority support",
    ],
    highlighted: true,
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    tagline: "For organizations at scale",
    price: "Custom",
    period: "contact sales",
    features: [
      "Everything in Team",
      "Unlimited history",
      "Self-hosted deployment",
      "SSO / SAML",
      "API access",
      "Custom SLA",
      "Dedicated CSM",
    ],
    highlighted: false,
    cta: "Contact Sales",
  },
];
