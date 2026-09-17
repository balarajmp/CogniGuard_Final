"use client";

import { motion } from "framer-motion";

interface SectionHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export default function SectionHeader({
  label,
  title,
  subtitle,
  centered = true,
  className = "",
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`${centered ? "text-center" : ""} ${className}`}
    >
      <p className="text-cyan-400 font-mono text-xs tracking-[0.3em] uppercase mb-3 drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]">
        {label}
      </p>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-400 text-sm sm:text-base font-mono tracking-wide max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
