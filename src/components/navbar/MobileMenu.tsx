"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X, BrainCircuit, ArrowRight } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] backdrop-blur-sm md:hidden" style={{ background: "rgba(3,6,9,0.7)" }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[90] w-[85%] max-w-sm backdrop-blur-2xl md:hidden" style={{ background: "rgba(3,6,9,0.96)", borderLeft: "1px solid var(--border-accent)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                <span className="text-white font-bold tracking-widest text-sm">
                  CognitoShield
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links */}
            <nav className="px-4 py-6 space-y-1" aria-label="Mobile navigation">
              {NAV_LINKS.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={`
                        flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200
                        ${
                          isActive
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "text-gray-300 hover:bg-white/[0.04] hover:text-white border border-transparent"
                        }
                      `}
                    >
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_cyan]" />
                      )}
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/[0.06] space-y-3">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-xl font-semibold text-sm tracking-wide bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 hover:text-white transition-all duration-300"
                >
                  Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl font-semibold text-sm tracking-wide bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 transition-all duration-300"
                  >
                    Sign In <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/register"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl font-semibold text-sm tracking-wide text-[#030609] transition-all duration-300"
                    style={{ background: "var(--accent)" }}
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
