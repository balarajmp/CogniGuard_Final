"use client";

import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8 sm:p-10",
};

export default function Card({
  children,
  className = "",
  hover = true,
  glow = false,
  padding = "md",
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        relative overflow-hidden
        bg-white/[0.04] backdrop-blur-xl
        border border-white/[0.08] rounded-2xl
        ${paddingClasses[padding]}
        ${hover ? "hover:border-cyan-500/20 hover:bg-white/[0.06] transition-all duration-500" : ""}
        ${glow ? "shadow-[0_0_30px_rgba(34,211,238,0.08)] hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]" : "shadow-[0_8px_32px_rgba(0,0,0,0.3)]"}
        ${className}
      `}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-transparent pointer-events-none rounded-2xl" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
