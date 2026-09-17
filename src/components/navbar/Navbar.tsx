"use client";

import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BrainCircuit, Menu, ArrowRight, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { scrollY } = useScroll();
  const bgOpacity     = useTransform(scrollY, [0, 60], [0.75, 0.92]);
  const borderOpacity = useTransform(scrollY, [0, 60], [0.15, 0.30]);

  return (
    <>
      <motion.nav
        style={{
          backgroundColor: useTransform(bgOpacity, (v) => `rgba(3,6,9,${v})`),
          borderBottomColor: useTransform(borderOpacity, (v) => `rgba(0,217,255,${v})`),
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
        className="fixed top-0 left-0 right-0 z-50 border-b"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/home" className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent] rounded-lg">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-surf)", border: "1px solid var(--border-accent)" }}>
                <BrainCircuit className="w-4.5 h-4.5" style={{ color: "var(--accent)" }} strokeWidth={1.5} />
              </div>
              <span className="font-black tracking-widest text-sm" style={{ color: "var(--text-primary)" }}>
                CognitoShield
              </span>
              <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--accent-surf)", color: "var(--accent)", border: "1px solid var(--border-accent)" }}>
                AI
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3.5 py-2 text-sm font-medium tracking-wide rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent] ${
                      isActive
                        ? "text-[--accent]"
                        : "text-[--text-muted] hover:text-[--text-primary] hover:bg-white/[0.04]"
                    }`}
                    style={isActive ? { color: "var(--accent)" } : {}}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0.5 left-3 right-3 h-px rounded-full"
                        style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent-glow)" }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <Link
                href={isAuthenticated ? "/dashboard" : "/login"}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold tracking-wide rounded-xl transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]"
                style={{
                  background: "var(--accent-surf)",
                  border: "1px solid var(--border-accent)",
                  color: "var(--accent)",
                }}
              >
                {isAuthenticated ? "Dashboard" : "Sign In"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {!isAuthenticated && (
                <Link
                  href="/register"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: "var(--accent)",
                    color: "#030609",
                  }}
                >
                  Create Account
                </Link>
              )}

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]"
                style={{ color: "var(--text-muted)" }}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
