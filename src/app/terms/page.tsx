import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — CogniGuard",
  description:
    "CogniGuard terms of service. Read the terms and conditions for using the CogniGuard platform.",
  openGraph: {
    title: "Terms of Service — CogniGuard",
    description: "Terms and conditions for the CogniGuard cognitive health platform.",
    url: "https://cogniguard.ai/terms",
    siteName: "CogniGuard",
  },
};

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using CogniGuard ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.

These Terms apply to all users of the Service, including individual users, team administrators, and enterprise customers. Additional terms may apply to enterprise agreements and are documented in separate Enterprise Service Agreements.`,
  },
  {
    id: "description",
    title: "2. Description of Service",
    content: `CogniGuard provides a privacy-first cognitive load detection and burnout prevention platform. The Service includes:
• Desktop agents for passive behavioral biometric monitoring
• Browser extensions for web-based activity analysis
• Personal and team cognitive health dashboards
• Smart intervention recommendations
• Enterprise analytics and reporting tools
• API access for integration with third-party systems

The Service is provided "as is" and may be updated, modified, or discontinued at any time with reasonable notice.`,
  },
  {
    id: "accounts",
    title: "3. User Accounts",
    content: `You are responsible for maintaining the confidentiality of your account credentials. You agree to:
• Provide accurate and complete registration information
• Keep your login credentials secure
• Notify us immediately of any unauthorized access to your account
• Not share your account with other individuals

CogniGuard reserves the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.`,
  },
  {
    id: "usage",
    title: "4. Acceptable Use",
    content: `You agree not to use the Service to:
• Violate any applicable laws or regulations
• Infringe on the intellectual property rights of others
• Attempt to reverse engineer, decompile, or extract the source code of our software
• Use the Service to monitor individuals without their explicit consent
• Interfere with or disrupt the Service or its infrastructure
• Collect data from other users without authorization

Enterprise administrators must ensure that all users in their organization are informed about and consent to the use of CogniGuard.`,
  },
  {
    id: "ip",
    title: "5. Intellectual Property",
    content: `CogniGuard and its original content, features, and functionality are owned by CogniGuard, Inc. and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.

Your personal cognitive health data remains your property. CogniGuard does not claim ownership of user-generated data. You grant CogniGuard a limited license to process your data solely for the purpose of providing the Service.`,
  },
  {
    id: "liability",
    title: "6. Limitation of Liability",
    content: `CogniGuard is a wellness and productivity tool and does not provide medical advice, diagnosis, or treatment. The Service should not be used as a substitute for professional medical or mental health care.

To the maximum extent permitted by law, CogniGuard shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.

Our total liability for any claim arising from or related to these Terms shall not exceed the amount you paid for the Service in the 12 months preceding the claim.`,
  },
  {
    id: "termination",
    title: "7. Termination",
    content: `You may terminate your account at any time by contacting support or using the account settings page. Upon termination:
• Your access to the Service will be immediately revoked
• Your personal data will be deleted within 48 hours
• Anonymized, aggregate data that cannot be linked to you may be retained for analytics purposes

CogniGuard may terminate or suspend your access immediately, without prior notice, for any breach of these Terms.`,
  },
  {
    id: "changes",
    title: "8. Changes to Terms",
    content: `We reserve the right to modify these Terms at any time. We will notify users of material changes via email or in-app notification at least 30 days before the changes take effect.

Continued use of the Service after changes constitutes acceptance of the updated Terms. If you do not agree with the updated Terms, you must discontinue use of the Service.`,
  },
  {
    id: "governing",
    title: "9. Governing Law",
    content: `These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.

Any disputes arising from these Terms shall be resolved through binding arbitration in San Francisco, California, except where prohibited by law.`,
  },
];

export default function TermsPage() {
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
            Terms of Service
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
