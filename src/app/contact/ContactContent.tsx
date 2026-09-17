"use client";

import { useState } from "react";
import PageTransition from "@/components/ui/PageTransition";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Button from "@/components/ui/Button";
import { Send, Mail, MapPin, Clock, CheckCircle2 } from "lucide-react";
import NeuralBackground from "@/components/NeuralBackground";

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "hello@cogniguard.ai",
    subtitle: "We reply within 24 hours",
  },
  {
    icon: MapPin,
    title: "Location",
    value: "San Francisco, CA",
    subtitle: "Remote-first team",
  },
  {
    icon: Clock,
    title: "Hours",
    value: "Mon – Fri, 9am – 6pm PST",
    subtitle: "Enterprise 24/7 SLA available",
  },
];

export default function ContactContent() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formState.name || !formState.email || !formState.message) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    // Simulate API call — replace with real endpoint
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  const inputClass =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.05] transition-all duration-200 text-sm";

  return (
    <PageTransition>
      <main className="min-h-screen relative" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <NeuralBackground variant="minimal" />

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative pt-32 pb-20 px-4 sm:px-8 overflow-hidden">
          <div className="absolute inset-0 grid-pattern-bg opacity-40" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(0,217,255,0.05)" }} />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <SectionHeader
              label="Get in Touch"
              title="We'd Love to Hear From You"
              subtitle="Whether you have a question about features, pricing, or anything else — our team is ready to answer."
            />
          </div>
        </section>

        {/* ── Content ──────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              {contactInfo.map((info, i) => (
                <ScrollReveal key={info.title} delay={i * 0.08}>
                  <Card padding="md">
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <info.icon className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-0.5">
                          {info.title}
                        </p>
                        <p className="text-white font-semibold text-sm">{info.value}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{info.subtitle}</p>
                      </div>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>

            {/* Contact Form */}
            <ScrollReveal delay={0.1} className="lg:col-span-3">
              <Card padding="lg" glow>
                {submitted ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
                      <CheckCircle2 className="w-7 h-7 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                    <p className="text-gray-400 text-sm">
                      We&apos;ll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div className="text-red-400 text-sm text-center bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-2">
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="contact-name" className="block text-xs font-mono text-gray-500 uppercase tracking-wider mb-1.5">
                          Name *
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          placeholder="Your name"
                          value={formState.name}
                          onChange={(e) =>
                            setFormState({ ...formState, name: e.target.value })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-email" className="block text-xs font-mono text-gray-500 uppercase tracking-wider mb-1.5">
                          Email *
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          placeholder="you@company.com"
                          value={formState.email}
                          onChange={(e) =>
                            setFormState({ ...formState, email: e.target.value })
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contact-subject" className="block text-xs font-mono text-gray-500 uppercase tracking-wider mb-1.5">
                        Subject
                      </label>
                      <input
                        id="contact-subject"
                        type="text"
                        placeholder="How can we help?"
                        value={formState.subject}
                        onChange={(e) =>
                          setFormState({ ...formState, subject: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-message" className="block text-xs font-mono text-gray-500 uppercase tracking-wider mb-1.5">
                        Message *
                      </label>
                      <textarea
                        id="contact-message"
                        rows={5}
                        placeholder="Tell us more..."
                        value={formState.message}
                        onChange={(e) =>
                          setFormState({ ...formState, message: e.target.value })
                        }
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={loading}
                      icon={Send}
                    >
                      {loading ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </Card>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </PageTransition>
  );
}
