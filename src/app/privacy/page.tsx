import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — CogniGuard",
  description:
    "CogniGuard's privacy policy. Learn how we collect, use, and protect your data with our privacy-first architecture.",
  openGraph: {
    title: "Privacy Policy — CogniGuard",
    description: "How CogniGuard handles your data with privacy-first architecture.",
    url: "https://cogniguard.ai/privacy",
    siteName: "CogniGuard",
  },
};

const sections = [
  {
    id: "collection",
    title: "1. Data Collection",
    content: `CogniGuard collects behavioral biometric data including typing cadence, mouse movement patterns, scroll velocity, and application switching frequency. All data is processed locally on the user's device using our edge AI models.

We do NOT collect:
• Keystrokes or typed content
• Screen captures or recordings
• Camera or microphone data
• Personal files or browsing history
• GPS or precise location data

The only data transmitted to our servers is anonymized, aggregated metrics that cannot be used to identify individual users.`,
  },
  {
    id: "usage",
    title: "2. How We Use Data",
    content: `Processed biometric data is used exclusively for:
• Generating personal cognitive load and burnout risk scores
• Providing smart intervention recommendations
• Producing anonymized team-level health analytics for enterprise customers
• Improving our machine learning models using differential privacy techniques

We never sell, rent, or share individual user data with third parties. Enterprise administrators only have access to team-level aggregates, never individual scores.`,
  },
  {
    id: "storage",
    title: "3. Data Storage & Security",
    content: `Raw biometric signals are processed on-device and never leave the user's machine. Only derived, anonymized metrics are transmitted using TLS 1.3 encryption.

Stored data is encrypted at rest using AES-256. Our infrastructure operates on a zero-knowledge architecture — even CogniGuard engineers cannot access individual user data.

Enterprise customers can opt for on-premises deployment where all data remains within their own infrastructure.`,
  },
  {
    id: "rights",
    title: "4. Your Rights",
    content: `You have the right to:
• Access all data associated with your account
• Export your personal cognitive health history
• Delete your account and all associated data permanently
• Opt out of any data collection at any time
• Request a copy of the anonymization methodology we use

Data deletion requests are processed within 48 hours. Once deleted, data cannot be recovered.`,
  },
  {
    id: "cookies",
    title: "5. Cookies & Tracking",
    content: `CogniGuard uses only essential cookies required for authentication and session management. We do not use:
• Third-party tracking cookies
• Advertising pixels or beacons
• Cross-site tracking mechanisms
• Fingerprinting techniques

Our website analytics use privacy-respecting, cookieless analytics tools that do not track individual users across sessions.`,
  },
  {
    id: "third-parties",
    title: "6. Third-Party Services",
    content: `CogniGuard integrates with the following categories of third-party services:
• Cloud infrastructure providers (for hosting and compute)
• Payment processors (for subscription billing — no card data is stored on our servers)
• Enterprise SSO providers (at the customer's request)

All third-party providers are vetted for SOC 2 Type II compliance and sign Data Processing Agreements (DPAs) that enforce our privacy standards.`,
  },
  {
    id: "changes",
    title: "7. Changes to This Policy",
    content: `We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. For material changes, we will also send an email notification to registered users.

Continued use of CogniGuard after changes constitutes acceptance of the updated policy.`,
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-4 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 grid-pattern-bg opacity-40" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(0,217,255,0.05)" }} />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-cyan-400 font-mono text-xs tracking-[0.3em] uppercase mb-3 drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]">
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-gray-500 text-sm font-mono tracking-wide">
            Last updated: June 2026
          </p>
        </div>
      </section>

      {/* ── Content ───────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-8 pb-24">
        {/* TOC */}
        <nav className="mb-14 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]" aria-label="Table of contents">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">
            Contents
          </p>
          <ul className="space-y-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold text-white mb-4">{s.title}</h2>
              <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                {s.content}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
