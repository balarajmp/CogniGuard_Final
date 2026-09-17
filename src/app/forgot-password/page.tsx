"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BrainCircuit, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import NeuralBackground from "@/components/NeuralBackground";
import { getApiUrl } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const apiURL = getApiUrl();
      const res = await fetch(`${apiURL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Recovery failed. Please check your email.");
      }

      await res.json();
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>

      {/* Neural background */}
      <NeuralBackground variant="auth" />

      {/* Grid overlay */}
      <div className="absolute inset-0 auth-grid opacity-40 pointer-events-none" />

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(0,217,255,0.06) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 w-full max-w-sm px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--accent-surf)", border: "1px solid var(--border-accent)", boxShadow: "0 0 24px var(--accent-glow)" }}>
              <BrainCircuit className="w-6 h-6" style={{ color: "var(--accent)" }} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Recover Access
            </h1>
            <p className="text-xs font-mono mt-1 tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
              CognitoShield AI · Password Reset
            </p>
          </div>

          {/* Card */}
          <div className="cs-glass p-8 space-y-5" style={{ border: "1px solid var(--border-default)" }}>

            {!submitted ? (
              <>
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                    {error}
                  </div>
                )}

                <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
                  Enter the email associated with your account and we&apos;ll send you a recovery link.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="forgot-email" className="block text-xs font-mono tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                      <input
                        id="forgot-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all duration-200"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid var(--border-default)",
                          color: "var(--text-primary)",
                        }}
                        onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                        onBlur={(e)  => { e.target.style.borderColor = "var(--border-default)"; }}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--accent)",
                      color: "#030609",
                      boxShadow: loading ? "none" : "0 0 24px rgba(0,217,255,0.3)",
                    }}
                  >
                    {loading ? "Sending..." : "Send Recovery Link"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center space-y-5 py-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <CheckCircle2 className="w-7 h-7" style={{ color: "#4ade80" }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>Link Sent</h3>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    A recovery link has been sent to <span style={{ color: "var(--accent)" }}>{email}</span>. Check your inbox.
                  </p>
                </div>
                <button
                  onClick={() => router.push("/login")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm tracking-wide transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
                >
                  Return to Sign In
                </button>
              </div>
            )}

            <button
              onClick={() => router.push("/login")}
              className="w-full flex items-center justify-center gap-2 text-xs font-mono transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </button>
          </div>
        </motion.div>

        <p className="mt-8 text-center text-[10px] font-mono tracking-widest uppercase" style={{ color: "rgba(138,154,168,0.4)" }}>
          CognitoShield AI · End-to-End Encrypted
        </p>
      </div>
    </div>
  );
}
