"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Home, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import NeuralBackground from "@/components/NeuralBackground";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Neural background — minimal */}
      <NeuralBackground variant="minimal" />

      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-pattern-bg opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: "rgba(0,217,255,0.06)" }} />
      </div>

      <div className="relative z-10 text-center px-4 max-w-lg mx-auto">
        {/* Glitching 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mb-8"
        >
          <h1
            className="text-[10rem] sm:text-[14rem] font-black leading-none tracking-tighter text-transparent"
            style={{
              WebkitTextStroke: "2px rgba(0, 217, 255, 0.3)",
            }}
          >
            404
          </h1>

          {/* Glitch overlay */}
          <motion.h1
            animate={{
              x: [0, -3, 3, -1, 0],
              opacity: [1, 0.8, 0.9, 0.7, 1],
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            className="absolute inset-0 text-[10rem] sm:text-[14rem] font-black leading-none tracking-tighter"
            style={{ color: "rgba(0,217,255,0.15)" }}
            aria-hidden
          >
            404
          </motion.h1>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <BrainCircuit className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <span className="text-xs font-mono uppercase tracking-[0.3em]" style={{ color: "var(--accent)" }}>
              Signal Lost
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: "var(--text-primary)" }}>
            Page Not Found
          </h2>
          <p className="text-sm font-mono tracking-wide mb-10 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
            The neural pathway you requested doesn&apos;t exist or has been decommissioned.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/">
              <Button variant="primary" size="lg" icon={Home}>
                Return Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg" icon={LayoutDashboard}>
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Bottom line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-[10px] font-mono tracking-widest uppercase"
          style={{ color: "rgba(138,154,168,0.4)" }}
        >
          CognitoShield AI • Route Resolution Failed
        </motion.p>
      </div>
    </main>
  );
}
