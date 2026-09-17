"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/ui/PageTransition";
import SectionHeader from "@/components/ui/SectionHeader";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { FAQ_ITEMS } from "@/lib/constants";
import { ChevronDown, MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import NeuralBackground from "@/components/NeuralBackground";

const categories = ["All", "General", "Privacy", "Technical", "Pricing"];

function FAQAccordion({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span
          className={`text-base font-semibold transition-colors duration-200 ${
            isOpen ? "text-cyan-400" : "text-gray-200 group-hover:text-white"
          }`}
        >
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-1"
        >
          <ChevronDown
            className={`w-4 h-4 transition-colors ${
              isOpen ? "text-cyan-400" : "text-gray-500"
            }`}
          />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-gray-400 text-sm leading-relaxed pb-5 pr-8">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQContent() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filtered =
    activeCategory === "All"
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === activeCategory);

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
              label="Knowledge Base"
              title="Frequently Asked Questions"
              subtitle="Everything you need to know about CogniGuard, privacy, and how it works."
            />
          </div>
        </section>

        {/* ── FAQ List ─────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 sm:px-8 py-16">
          {/* Category filters */}
          <ScrollReveal className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button key={cat} onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}>
                <Badge
                  variant={activeCategory === cat ? "accent" : "default"}
                  className="cursor-pointer hover:border-cyan-500/40 transition-colors"
                >
                  {cat}
                </Badge>
              </button>
            ))}
          </ScrollReveal>

          {/* Accordion */}
          <div>
            {filtered.map((item, i) => (
              <ScrollReveal key={item.question} delay={i * 0.04}>
                <FAQAccordion
                  question={item.question}
                  answer={item.answer}
                  isOpen={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 sm:px-8 py-24">
          <ScrollReveal>
            <div className="glass-card p-10 text-center section-glow">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-5">
                  <MessageCircle className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">
                  Still Have Questions?
                </h2>
                <p className="text-gray-400 text-sm font-mono tracking-wide mb-6">
                  Our team is ready to help. Reach out anytime.
                </p>
                <Link href="/contact">
                  <Button variant="primary" size="lg" iconRight={ArrowRight}>
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>
    </PageTransition>
  );
}
